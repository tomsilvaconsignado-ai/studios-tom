# Studios Tom — Vercel + Supabase próprio + Gemini

Guia para tirar o Studios Tom do Lovable e rodar com **Supabase próprio**, **hospedagem na Vercel** e **IA do Google Gemini**.
Data: 27/10/2026. **A migração ainda não está concluída:** os passos abaixo precisam ser feitos e testados por você (veja "O que ainda não foi testado").

---

## 1. Banco de dados (Supabase)

Projeto: `https://ntinucgvjfemkvnzzqjo.supabase.co` (a URL é sem `/rest/v1/`).

**Projeto vazio (sem tabelas ainda):**
1. Supabase → **SQL Editor** → cole o conteúdo de `documentacao/RECRIAR_SCHEMA_PUBLIC.sql` → **Run**.
2. Isso cria as 4 tabelas (`revistas`, `personagens`, `revista_versoes`, `estilos_personalizados`), índices, permissões e políticas de acesso.
3. **Não** rode esse SQL de novo depois que já houver tabelas ou depois de importar um backup que já tenha o esquema.

**Trazer os dados do Lovable (revistas, personagens, versões, estilos):**
1. No Lovable: **More → Database → Manage → Settings → Export project data** e guarde o arquivo num lugar seguro.
2. Restaure no Supabase seguindo `documentacao/EXPORTACAO_DADOS.md`, mantendo os mesmos UUIDs. As imagens estão dentro dos dados (base64), então não há arquivos separados para copiar.
3. Confira as contagens. Na auditoria havia 4 revistas, 7 personagens, 6 versões e 1 estilo.

Se preferir começar do zero, basta o passo do SQL.

## 2. Variáveis de ambiente

| Variável | Onde | Valor |
|---|---|---|
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | navegador + servidor | `https://ntinucgvjfemkvnzzqjo.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY` | navegador + servidor | sua chave `sb_publishable_…` |
| `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID` | — | `ntinucgvjfemkvnzzqjo` |
| `GEMINI_API_KEY` | **somente servidor** | chave do Google AI Studio |
| `GEMINI_IMAGE_MODEL` (opcional) | servidor | padrão `gemini-3.1-flash-image` |
| `GEMINI_TEXT_MODEL` (opcional) | servidor | padrão `gemini-3.5-flash-lite` |
| `GEMINI_IMAGE_SIZE` (opcional) | servidor | vazio = padrão; `2K` dá mais resolução e custa mais |

- O arquivo `.env` local já vem preenchido com o Supabase. Falta só a `GEMINI_API_KEY`. Ele está no `.gitignore` e não vai para o GitHub.
- **Nunca** coloque a chave do Gemini, a `sb_secret_…`/service_role ou a senha do banco em variáveis `VITE_` nem no código.

**Chave do Gemini:** https://aistudio.google.com → *Get API key* → *Create API key*. Ative o faturamento no projeto do Google Cloud e **defina um limite de gastos/cotas** lá.

## 3. Rodar no seu computador

Requer Bun (testado na origem com Bun 1.4.4 e Node 22).

```bash
bun install --frozen-lockfile
bun run dev          # abre o editor localmente
bun run test         # testes (inclui os novos)
bun run build:vercel # confere se o build da Vercel funciona antes de publicar
```

O `bun run build` sem sufixo continua usando o adaptador do Lovable (alvo Cloudflare). Isso foi mantido para não quebrar o projeto caso ele continue conectado ao Lovable.

## 4. Publicar na Vercel

1. Suba o projeto para um repositório **privado** no GitHub (`git push` desta pasta).
2. Vercel → **Add New → Project** → importe o repositório. O `vercel.json` já indica o framework TanStack Start.
3. Em **Settings → Environment Variables**, cadastre as variáveis da tabela acima (Production e Preview).
4. Em **Settings → General → Node.js Version**, escolha a versão mais recente disponível. O guia da Vercel para TanStack Start pede Node 24+.
5. Faça o deploy. No build da Vercel, o `vite.config.ts` detecta a variável `VERCEL` e usa os plugins explícitos com o Nitro no modo Vercel.
6. Se a geração de imagem der *timeout*, aumente o tempo máximo das funções em **Settings → Functions** (Max Duration). Cada imagem pode levar dezenas de segundos.

## 5. ⚠️ Riscos de segurança (decisão sua)

O app **não tem login**, por decisão original do produto, e as políticas do banco são abertas. Publicado numa URL da Vercel, isso significa que:

- Qualquer pessoa com o link pode **ler, alterar e apagar** revistas, personagens e estilos.
- Qualquer pessoa pode chamar `/api/generate-image` e `/api/edit-image` e **gastar os seus créditos do Gemini**.

Nenhuma permissão foi alterada. Opções, que só aplico com a sua autorização:
1. **Proteção de acesso da Vercel** (senha ou só a sua conta), sem mudar o app. É a mais rápida.
2. Login com Supabase Auth e políticas por usuário. É a mais completa, mas muda o produto.
3. Limite de requisições nas rotas de IA.

Enquanto isso, não divulgue a URL e mantenha um limite de gastos no Google Cloud.

## 6. O que mudou no código

- **IA → Gemini:** `src/lib/gemini.ts` (funções puras), `src/lib/gemini.server.ts` (chamadas, só no servidor), `src/lib/resposta-imagem.server.ts`.
  - As rotas `/api/generate-image` e `/api/edit-image` respondem no mesmo formato (SSE) que o editor já entendia, então o cliente quase não mudou.
  - A análise de estilo e a continuidade agora usam JSON estruturado do Gemini.
  - O adaptador antigo `src/lib/image-gateway.server.ts` ficou no projeto, sem uso, para facilitar uma volta atrás.
- **Formatos:** `src/lib/formatos.ts`, com retrato (A4), A5/A4 dobrada, comic americano, mangá, quadrado e paisagem.
  - Os valores antigos continuam válidos.
  - O formato pode ser trocado na capa.
  - A impressão em livreto A4 encaixa cada formato na meia folha sem deformar e avisa o tamanho final.
- **Layouts:** 12 novos (grades 3 colunas, 4 faixas, 3×2, 2×4, 3×3, 5 e 7 quadros, e "Mangá e dinâmicos"), agrupados no seletor.
- **Cenários:** biblioteca por revista (`dados.cenarios`), com nome, descrição e até 2 referências. O cenário é escolhido em cada quadro (`quadro.cenarioId`) e vai para o prompt e para as referências.
- **Esboço de composição:** campo opcional por quadro (`quadro.esboco`). A IA segue enquadramento e poses.
- **Referências rotuladas:** o prompt informa à IA o papel de cada imagem anexada (painel anterior, esboço, estilo, personagem, cenário). O limite subiu de 6 para 12 imagens.
- **Gerar em sequência:** botões "Gerar quadros vazios desta página / da história".
  - Gera um quadro por vez, na ordem da história, e salva a memória da cena de cada um para o próximo.
  - Tem progresso e botão **Parar**.
  - Diferente da geração individual, **não** faz a verificação interativa de continuidade (manter/alterar) antes de cada quadro.
- **Dados:** campos novos são **opcionais** (`cenarios`, `cenarioId`, `esboco`). Revistas antigas abrem normalmente, sem conversão. O esquema SQL não mudou.

## 7. O que ainda não foi testado

O ambiente onde as mudanças foram feitas não tinha acesso ao npm nem ao seu Supabase. Por isso:
- **Não** foram executados `bun install`, `bun run test`, `bun run build` nem o app no navegador. Foi verificada a sintaxe de todos os arquivos e testada a lógica nova isolada.
- **Não** houve chamada real ao Gemini: resta confirmar nomes de modelo, proporções aceitas, tamanho das imagens e cobrança.
- **Não** houve deploy na Vercel.

Checklist sugerido:
1. `bun install` → `bun run test` → `bun run build:vercel`.
2. Criar uma revista de teste, gerar uma capa e um quadro com personagem.
3. Testar a análise de estilo, um cenário com referência, um esboço e a geração em sequência de uma página.
4. Conferir a impressão (livreto) em retrato e em comic americano.
5. Deploy na Vercel e repetir o item 2 na URL publicada.

