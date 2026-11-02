# MIGRACAO_CLAUDE — Studios Tom

Auditoria de preparação realizada em 27/10/2026 (UTC). **Não é uma migração concluída.** Nenhum código, configuração, registro ou política do aplicativo de origem foi alterado. Pacote destinado ao proprietário e a um ambiente privado de desenvolvimento com Claude.

## 1. Objetivo e conteúdo da entrega

Studios Tom é um criador de revistas em quadrinhos em português: personagens reutilizáveis, histórias, páginas, quadros, geração de imagens, edição visual de capa, balões livres, camadas, continuidade e impressão em livreto. O objetivo é permitir que outro ambiente compreenda e evolua o sistema com fidelidade, sem reconstruí-lo.

- `fonte/`: arquivos do projeto na estrutura original, incluindo componentes UI aparentemente não usados, testes, SQL, lockfile e arquivos ocultos relevantes.
- `MIGRACAO_CLAUDE.md`: este guia.
- `CLAUDE.md`: regras de trabalho para o próximo agente.
- `documentacao/BANCO_E_BACKEND.md`: estrutura observada, acesso, contagens e configurações pendentes.
- `documentacao/RECRIAR_SCHEMA_PUBLIC.sql`: consolidação das três migrações originais, somente para banco de destino vazio; não contém dados e não foi executada.
- `documentacao/EXPORTACAO_DADOS.md`: procedimento autorizado de exportação integral e restauração.
- `documentacao/RELATORIO_INTEGRIDADE.md` e `MANIFESTO_SHA256.json`: cobertura, exceções, hashes e verificações.
- `documentacao/TESTES_EXISTENTES.txt`: resultado dos testes executados na origem.

**Exceções deliberadas à fidelidade byte a byte:** `.env` não foi exportado; `supabase/config.toml` tem apenas o identificador do backend omitido na cópia; `.env.example` é novo. Histórico/metadados Git, dependências instaladas e resultado incremental TypeScript não são código-fonte e não foram incluídos. Todas as demais cópias de origem têm conteúdo original e hash no manifesto. A origem permaneceu intacta.

## 2. Arquitetura

```text
Navegador React / TanStack Router / React Query
  ├─ paginas e editor visual → src/lib/db.ts → Data API / RLS → Lovable Cloud
  ├─ imagens → /api/generate-image e /api/edit-image → gateway IA
  ├─ estilo/continuidade → server functions → gateway IA
  └─ imprimir → imposicao + componentes visuais → impressao/PDF do navegador
Servidor TanStack Start / SSR → src/start.ts + src/server.ts
Build Vite → configuracao Lovable → Nitro / alvo Cloudflare
```

O frontend acessa tabelas com chave publicável e políticas abertas. Não existe login de produto nem separação de dados por proprietário. Há helpers de autenticação gerados e middleware que anexa sessão se disponível; isso não significa que a aplicação exija conta. As funções de estilo e continuidade são públicas no código atual, sem `requireSupabaseAuth`.

Imagens ficam **inline** em JSON/arrays do banco, frequentemente como `data:image/...;base64,...`; não são recursos independentes de `public/`. Camadas e enquadramento são dados, compartilhados por editor, miniaturas, histórico e impressão. Estados transitórios do editor e desfazer/refazer não são registros exportáveis.

## 3. Tecnologias e versões

Versões resolvidas no `bun.lock`, não suposições a partir do template:

| Tecnologia | Resolvida |
|---|---|
| React / React DOM | 19.2.8 |
| TanStack Start | 1.168.60 |
| TanStack Router | 1.170.41 |
| React Query | 5.101.4 |
| Vite | **8.1.5** |
| Tailwind CSS | 4.3.3 |
| TypeScript | 5.9.3 |
| Cliente de banco JS | 2.117.2 |
| Nitro | 3.0.260603-beta |
| Drizzle Kit / ORM | 0.31.11 / 0.45.3 |
| Vitest | 4.1.11 |
| @lovable.dev/vite-tanstack-config | 2.26.5 |

Ambiente de auditoria: Bun 1.4.4 e Node 22.23.4. Essas versões são uma referência verificada, não um requisito mínimo inferido. Dependências declaradas completas estão em `package.json`; versões transitivas e integridade estão em `bun.lock`. O projeto inclui Radix/shadcn, Lucide, Sonner, Zod, bibliotecas de formulário, gráficos e outras dependências: preservar até avaliar usos.

## 4. Estrutura de arquivos

| Caminho dentro de fonte/ | Responsabilidade |
|---|---|
| `src/router.tsx`, `src/routes/__root.tsx` | Router, contexto Query, shell HTML, estilos, fontes, erros e notificações |
| `src/routeTree.gen.ts` | Árvore gerada; não editar manualmente |
| `src/routes/index.tsx` | Revistas, criação, duplicação, remoção |
| `src/routes/projeto.$id.tsx` | Editor central, estado, gravação, versões, capa, páginas, quadros e ferramentas |
| `src/routes/imprimir.$id.tsx` | Livreto, A4 paisagem, frente/verso, dobra e PDF |
| `src/routes/personagens.tsx` | Fichas, referências, bloqueio visual |
| `src/routes/estilos.tsx` | Meu Estilo, análise e biblioteca de estilos |
| `src/routes/biblioteca.tsx` | Catálogo de reutilização e acesso aos módulos |
| `src/components/Grade.tsx` | Grade de quadros e camada livre de balões |
| `src/components/CapaVisual.tsx` | Capa multicamadas, enquadramento e interação |
| `src/components/BalaoVisual.tsx`, `EditorBaloes.tsx` | SVG de balão e controles |
| `src/components/ImagemPainel.tsx`, `EditorEnquadramento.tsx` | Renderização proporcional, zoom, arraste e restauração |
| `src/components/ContinuidadeQuadro.tsx` | Memória, mudanças, verificação e alertas |
| `src/components/ui/`, `Header.tsx`, `src/hooks/` | Biblioteca UI, navegação e comportamento compartilhado |
| `src/lib/db.ts` | Tipos JSON, layouts, CRUD, uploads inline, migração de balões, versões |
| `src/lib/ia.ts`, `stream-image.ts`, `enquadramento.ts` | Montagem de referências, SSE/imagens parciais e dimensões |
| `src/lib/continuidade*`, `style-analysis*` | Contexto, server functions e análise de IA |
| `src/lib/image-gateway.server.ts`, `src/routes/api/` | Adaptador e handlers de geração/edição |
| `src/lib/imposicao.ts` | Ordem física das páginas para livreto |
| `src/integrations/supabase/` | Clientes, tipos e helpers gerados; manter fronteira público/privado |
| `src/start.ts`, `src/server.ts`, `src/lib/error-*` | Middleware, CSRF e proteção contra falha SSR |
| `src/styles.css` | Tokens, Tailwind v4, identidade comic e impressão |
| `public/` | Favicon local e robots; sem acervo de imagens do usuário |
| `drizzle/migrations/`, `drizzle.config.ts` | Migrações SQL, journal/snapshots e conexão de destino |
| `drizzle/schema.ts` | Intencionalmente vazio; não representa o esquema real |
| `src/test/`, `vitest.config.ts` | Testes existentes |
| `AGENTS.md`, `roadmap.md`, `.lovable/` | Regras técnicas e contexto original de trabalho |

O manifesto enumera cada arquivo exportado, inclusive ocultos, em vez de resumir a cobertura por pastas. Configurações de formatter, lint, TS, componentes, Bun e Git ignore foram preservadas.

## 5. Telas e fluxos

- `/`: criar revista, definir nome/formato/estilo, abrir, duplicar para edição nova, excluir.
- `/projeto/$id`: escolher história/página/capa/contracapa; editar descrições, personagens, layouts; gerar imagem, ajustar enquadramento, inserir camadas e balões; salvar e restaurar versões.
- `/personagens`: criar/editar ficha, roupa, personalidade, papel, tags, referências JPG/PNG e travar visual; referências entram nos prompts.
- `/estilos`: anexar desenhos, analisar características, salvar nome/descrição/prompt/referências, renomear, duplicar e excluir.
- `/biblioteca`: reutilizar personagens, estilos e capas conforme a interface atual.
- `/imprimir/$id`: organizar conteúdo editorial em folhas, simular dobra, definir frente/verso, sangria e marcas; imprimir/salvar PDF pelo navegador.

Todas as seis rotas de conteúdo possuem `head()` próprio, título e descrição Studios Tom, metadados OG e Twitter. Não há capa absoluta HTTPS usada como OG; não adicionar imagens falsas. Algumas mensagens genéricas de erro permanecem em inglês; registrar, não corrigir nesta entrega.

## 6. Regras de negócio e representação persistida

### Dados e gravação

- Revista nova: uma história e uma página de seis quadros **vazios**, sem camadas ou arte de demonstração.
- `DadosRevista`: histórias, páginas, capa, contracapa, versos opcionais, estilo personalizado, modelos de balões e continuidade. `Pagina`: história, layout, quadros, IDs de personagens, balões livres. `Quadro`: texto, balão legado, imagem, camadas, enquadramento, memória e mudanças.
- Layouts predefinidos vivem em `LAYOUTS` de `db.ts`; trocar layout conserva quadros por índice até o número do novo layout. Não assumir preservação de quadros excedentes.
- Autosave: após 2 segundos sem alteração. `Salvar projeto` e Ctrl/Cmd+S gravam também uma versão; autosave não cria versão.
- Desfazer/refazer: local à sessão, até 100 snapshots anteriores, agrupamento temporal; não confundir com versões persistidas. Lista de versões: até 50 recentes, dados carregados separadamente.
- Aviso de saída para alterações/gravação pendentes. A garantia absoluta de nunca perder dados depende de sucesso da rede e ausência de concorrência; não prometer transação multiusuário inexistente.
- Duplicação copia dados da revista e muda título/nome da edição. Remoção de revista elimina versões por FK em cascata.

### Identidade e edição visual

- Interface português, marca Studios Tom; cabeçalho amarelo, fundo creme pontilhado, ações vermelhas, contornos pretos, sombras duras, Bangers e Space Grotesk. Não adicionar branding visível Lovable.
- Camadas de quadros: array ordenado com imagem/nome/posição percentual/largura/proporção/rotação/opacidade; ordem do array define sobreposição.
- Capa: camadas de imagem e texto, ordem, bloqueio, duplicação, opacidade, recorte/enquadramento, guias, modelos e tela cheia. JPG/PNG anexado começa em **conter**, inteiro e proporcional; PNG transparente é preservado; recorte apenas quando escolhido.
- Balões pertencem à **página** e podem cruzar quadros. Guardados em array ordenado percentual. Formatos oval, redondo, quadrado, irregular, pensamento, grito e narração; fonte, cores, borda, sombra/efeito e cauda base/ponta/largura. Modelos são salvos na revista. Balões legados migram de quadro para página ao editar.
- Imagem de painel: zoom uniforme e deslocamentos percentuais, sem esticar; original `zoom:100, x:0, y:0, ajuste:conter`. Dimensões candidatas em múltiplos de 16, mínimo de área 655.360 pixels, lados avaliados 640–2048 e proporção até 3:1. Aproxima a proporção do quadro dentro dos limites: não garante dimensão arbitrária exata do provedor.
- Upload geral pode reduzir e converter para JPEG; upload de camada preserva PNG. Limites/qualidade de redução estão nas funções de `db.ts` e `ia.ts`; o arquivo original antes da redução não é guardado automaticamente.

### IA e continuidade

- Estilo predefinido combinado com Meu Estilo; o traço próprio tem prioridade. Estilos são registros compartilhados, não propriedade individual autenticada.
- Imagem usa descrição, personagens, estilo e referências. Seleção atual limita referências de cena a 2, de estilo a 3, de personagem a 2 por personagem; máximo total 6 e prioridade pela ordem de montagem em `ia.ts`.
- Continuidade monta contexto na ordem dos quadros/páginas da mesma história; utiliza último quadro/contexto, roupas, posições, olhar, objetos, ambiente e mudanças. Não pressupor que imagens antigas já tenham memória.
- Modelos atuais: imagens `openai/gpt-image-2.5-sunburst`, análise `openai/gpt-6-astra`. Esses são identificadores do gateway atual; não assumir que outro provedor aceite os mesmos nomes ou contratos.
- IA custa créditos, depende de rede e pode recusar prompts por segurança; consistência visual é orientação, não garantia determinística.

### Impressão

- A4 paisagem, duas páginas por lado da folha; ordem de imposição diferente da leitura, sem reordenar o editor.
- Conteúdo considera capa, verso da capa, páginas, verso da contracapa e contracapa. Se necessário, completa múltiplo de quatro com autorização de páginas em branco.
- Exemplo de 8 páginas validado: pares `[8,1], [2,7], [6,3], [4,5]`. Guias/sangria/marcas conforme controles atuais; configuração física de duplex precisa de prova real.
- PDF é produzido pelo diálogo de impressão do navegador, não por serviço independente de exportação.

## 7. Backend, permissões e configuração

Ver detalhes em `BANCO_E_BACKEND.md`. Quatro tabelas públicas, sete políticas RLS, um relacionamento FK em cascata, cinco índices (incluindo PKs), sem views/funções/triggers públicos ou buckets identificados. Os schemas gerenciados de autenticação/armazenamento não foram copiados por SQL artesanal.

Acesso aberto é requisito histórico de uso sem login, mas significa que quem obtiver acesso ao aplicativo/chave publicável pode ler e alterar conteúdo. Não existe perfil admin/tenant no produto. Documentar o risco e pedir autorização separada antes de mudar a segurança; não implementar login silenciosamente numa migração.

Configurações hospedadas: Site URL e lista de retorno lidos; métodos de login, confirmação, cadastro, limites de senha, recuperação/e-mails e domínios de envio **não verificados**. Ausência de tela de login não prova essas configurações. Checar manualmente `More → Users → Auth settings` e `More → Emails`. Não chamar ferramentas de configuração para descobrir valores: elas alterariam a origem.

## 8. Variáveis de ambiente: somente nomes e finalidades

| Nome | Finalidade / quando necessário |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Endpoint e chave publicável do destino, injetados no frontend durante build |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Correspondentes no servidor/SSR |
| `VITE_SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_ID` | Identificador de configuração; nomes existentes na origem, sem valor no pacote |
| `LOVABLE_API_KEY` | Segredo servidor para IA enquanto usar gateway Lovable; gerar/configurar credencial válida autorizada no destino |
| `SUPABASE_SERVICE_ROLE_KEY` | Helper administrativo gerado; opcional nos fluxos atuais, exclusivamente servidor |
| `LOVABLE_DB_MIGRATION_URL` | Conexão PostgreSQL privilegiada de destino usada por Drizzle; não é uma variável pública |
| `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS` | Helper de validação/rotação de cron; não há cron de produto identificado |
| `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL` | Nomes presentes no inventário de segredos, legados; o código principal usa publishable key/variável de migração acima |

Os segredos existentes foram identificados por nome, **não extraídos**. Chave de serviço e senha de banco de produção não estão disponíveis para entrega no Lovable Cloud. Criar novas credenciais no serviço de destino. Guardar localmente em `.env` fora do Git e no gestor de segredos da hospedagem; nunca prefixar segredos privados com `VITE_`.

## 9. Instalar e executar no destino

1. Descompactar em diretório privado. Ler este guia, `CLAUDE.md` e `fonte/AGENTS.md` antes de mudar algo.
2. Trabalhar dentro de `fonte/`. Usar Bun 1.4.4 / Node 22.23.4 como ponto de partida verificado.
3. `bun install --frozen-lockfile`. Não omitir lockfile nem substituí-lo por outro gestor sem avaliar a mudança.
4. Copiar `.env.example` para `.env` e preencher **destino**, não produção. O arquivo de exemplo deliberadamente tem campos vazios e não funciona sozinho.
5. `bun run dev --host 127.0.0.1 --port 8080`. Os defaults efetivos podem depender da configuração Lovable. Abrir a URL reportada pelo processo.
6. `bun run test`; opcionalmente `bun run lint`. `bun run format` **altera** arquivos: não executar em lote para uma migração fiel.
7. `bun run build`, seguido de validação do artefato/SSR no provedor escolhido; `bun run preview` é somente validação local, não hospedagem de produção.

**Limite de verificação:** testes existentes passaram na origem; instalação limpa, build externo e execução em outro provedor não foram realizados. O log da prévia informou `build OK`, mas não certifica o destino.

### Dependência de configuração Lovable

`@lovable.dev/vite-tanstack-config@2.26.5` foi consultado no registro público npm com resposta HTTP 200 e metadados correspondentes. Isso confirma disponibilidade do manifesto nessa data, não instalação e funcionamento fora do Lovable. A dependência injeta TanStack Start, React, Tailwind, aliases, Nitro/Cloudflare, logging e detecção de ambiente.

Se a instalação/execução fora do Lovable falhar, Claude deve investigar esse adaptador em **cópia/branch de destino**, não reescrever o editor. Uma substituição futura precisa reproduzir todos os plugins e a entrada SSR e testar rotas/servidor. Não duplicar plugins enquanto mantiver o adaptador. Não há arquivo de implantação externa validado, Dockerfile ou configuração Wrangler própria no snapshot.

## 10. Novo backend e restauração segura

1. Exportar a origem pelo procedimento de `EXPORTACAO_DADOS.md` e guardar cópia privada imutável.
2. Criar backend PostgreSQL com Data API, papéis anon/authenticated/service_role e RLS compatíveis; um banco PostgreSQL isolado sem essas APIs/papéis não substitui o cliente atual.
3. Preferir restauração do export completo no destino compatível, seguindo procedimentos do provedor. Não rodar novamente as migrações CREATE TABLE se a restauração já incluiu o esquema.
4. Para testar **somente esquema vazio**, usar migrações originais em ordem ou `RECRIAR_SCHEMA_PUBLIC.sql`, nunca ambos. Este SQL depende de roles/API compatíveis e `gen_random_uuid()`; não inclui schemas gerenciados.
5. Manter journal de migrações coerente com a restauração. `drizzle/schema.ts` vazio significa que `drizzle-kit push/generate` não é fonte de verdade do esquema; evitar sincronização destrutiva automática.
6. Restaurar conteúdo integral JSONB/arrays, UUIDs, vínculos, datas, base64 e ordem das camadas. Confirmar contagens e comparar registros/imagens em ambiente privado.
7. Recriar configurações de autenticação/e-mail somente após auditoria manual; não inventar mecanismos de login no produto.
8. Reconfigurar credenciais e endpoints do destino, preservando os gerados e suas fronteiras; substituir o identificador vazio na cópia se a ferramenta de backend precisar.
9. Testar editor e impressão com dados restaurados e salvar alterações de teste somente no destino.

## 11. Publicação externa

Preservar app full-stack: hospedagem puramente estática não atende `/api/*`, server functions e SSR. O alvo original é serverless Cloudflare via Nitro. Todos os pacotes do servidor devem ser empacotados; não usar `ssr.external` para esse alvo nem carregar recursos do filesystem em tempo de execução sem suporte comprovado.

No destino, configurar domínio/HTTPS, secrets de servidor, variáveis públicas de build, limites de payload e streaming/SSE sem buffering indevido. Verificar qual artefato o build gera e seguir o adaptador/hospedagem correspondente; nenhum comando único de deploy externo foi validado nesta auditoria. Não usar publicação Lovable para transferir o app nem apontar testes de escrita ao backend antigo.

Para continuar usando gateway IA fora do Lovable, confirmar credenciais, autorização, faturamento e contrato. Se optar por outro provedor, adaptar somente fronteira de integração: nomes de modelo, Responses/SSE, esquemas estruturados, geração/edição e dimensões; comparar resultados. Não assumir que variáveis vazias ou um nome de segredo permitam reaproveitar uma credencial indisponível.

## 12. Limitações e problemas conhecidos

- Dados reais ainda não exportados; o ZIP contém código e documentação, **não** revistas/imagens/contas.
- Sem exportação automática das configurações de autenticação, provedores, secrets, domínio, badge e quotas.
- Acesso aberto ao CRUD e endpoints IA públicos demandam revisão de abuso; sem quotas/limites de payload explícitos nos handlers inspecionados. Não alterar nesta preparação.
- Print navigation dispara salvamento sem esperar sua conclusão; pode haver leitura anterior ao save. Autosave concorrente/dispositivos múltiplos não tem controle de conflitos demonstrado.
- Três testes atuais são insuficientes para certificar camadas, versão, salvamento e IA. Ausência de suíte E2E ampla.
- Roadmap mantém pendente a dimensão efetiva retornada pela IA; tentativa anterior recusada por filtro. Geração proporcional não equivale a tamanho final comprovado.
- Fontes Bangers/Space Grotesk vêm de Google Fonts, não de arquivos locais. Qualquer futura cópia exige verificar licença.
- Imagens originais pré-redução, estado de desfazer de sessões passadas, código do serviço IA e infraestrutura privada não podem ser recuperados do código.
- Telemetria opcional do editor usa hooks globais Lovable; fora dele tende a ficar inativa. CSS/layout não dependem desses hooks, mas o pipeline é específico.
- Snapshot é do projeto atual no editor, não uma garantia de igualdade com a última versão publicada.

## 13. Checklist para conclusão da migração

- [x] Inventariar fontes, configs, testes, migrações e recursos locais.
- [x] Identificar esquema, RLS, permissões, índices, vínculos e localização de imagens.
- [x] Documentar arquitetura, regras, variáveis e dependências externas.
- [x] Conferir hashes das cópias originais e pacote sem credenciais privadas.
- [x] Rodar testes existentes da origem: 2 arquivos, 3 testes aprovados.
- [ ] Proprietário exportar banco completo pela interface e guardar cópia privada.
- [ ] Proprietário conferir/exportar configurações hospedadas ainda não verificadas.
- [ ] Definir backend/hospedagem de destino e credenciais válidas; resolver IA sem copiar secrets.
- [ ] Instalar, buildar e executar cópia em ambiente externo isolado.
- [ ] Restaurar banco e comparar contagens, JSON, imagens e relacionamentos.
- [ ] Validar CRUD, autosave, versões, desfazer, estilos, camadas, balões e continuidade com dados restaurados.
- [ ] Validar streaming IA, tamanho efetivo de imagens, filtros e cobrança.
- [ ] Validar PDF e prova física de livreto, rotas diretas e layout em tamanhos de tela distintos.
- [ ] Planejar virada com último export autorizado, sem escrita simultânea e com retorno possível.

**Concluir apenas após esses itens externos.** O pacote reduz o risco de perda, mas não substitui export de dados nem homologação do destino.
