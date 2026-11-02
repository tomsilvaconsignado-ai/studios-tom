# Banco e backend — inventário observado

Consultas somente leitura em 27/10/2026. Fonte: esquema hospedado, catálogos de colunas/constraints/índices/ACL e migrações originais. Não foi exportado conteúdo dos registros. Os nomes técnicos dos diretórios de integração foram preservados; identificadores e endpoint privado de produção não aparecem nesta documentação.

## Infraestrutura

- Lovable Cloud fornece backend, Data API PostgreSQL e infraestrutura gerenciada. Aplicação usa cliente de banco compatível com RLS.
- Hosting original: TanStack Start com SSR e funções de servidor, configurado por Vite/Nitro para alvo Cloudflare. Serviços hospedados não se tornam locais ao baixar ZIP.
- Há handlers `/api/generate-image` e `/api/edit-image` e server functions de análise de estilo/continuidade. Não há `supabase/functions/` no inventário. Logo, nenhum código de Edge Function separado foi identificado na fonte; inventário remoto completo de Edge Functions não foi confirmado nesta auditoria.
- Não há buckets no catálogo consultado. Imagens de usuário são base64 inline no banco. Não criar bucket nem mover mídia nesta preparação.
- Nenhum cron/webhook de negócio identificado no código; helper gerado de cron incluído não prova agendamento. Inventário remoto de schedules não confirmado.

## Tabelas, colunas e tipos

Todas as colunas abaixo são NOT NULL, salvo onde explicitamente anotado (nenhuma). PK `id uuid DEFAULT gen_random_uuid()` em todas as tabelas. Datas `timestamptz DEFAULT now()`.

### public.revistas — 4 registros na consulta

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | Sem título |
| formato | text | retrato |
| estilo | text | HQ anos 90 (realista) |
| dados | jsonb | {} |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

### public.personagens — 7 registros

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | string vazia |
| descricao | text | string vazia |
| roupa | text | string vazia |
| papel | text | Herói |
| personalidade | text | string vazia |
| tags | text | string vazia |
| imagens | text[] | array vazio |
| travado | boolean | false |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

### public.revista_versoes — 6 registros

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| revista_id | uuid | nenhum; obrigatório |
| nome | text | string vazia |
| estilo | text | string vazia |
| formato | text | retrato |
| dados | jsonb | nenhum; obrigatório |
| created_at | timestamptz | now() |

### public.estilos_personalizados — 1 registro

| Coluna | Tipo | Default |
|---|---|---|
| id | uuid | gen_random_uuid() |
| nome | text | nenhum; obrigatório |
| descricao | text | string vazia |
| prompt_estilo | text | string vazia |
| imagens | jsonb | [] |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

Contagens são fotografia do momento, não promessa de contagem no próximo export. Dados de amostra não incluídos no pacote.

## Constraints e índices

- `revistas_pkey`, `personagens_pkey`, `revista_versoes_pkey`, `estilos_personalizados_pkey`: PRIMARY KEY (id), índices únicos btree correspondentes.
- `revista_versoes_revista_id_fkey`: FOREIGN KEY (revista_id) REFERENCES revistas(id) **ON DELETE CASCADE**.
- `revista_versoes_revista_id_created_at_idx`: btree (revista_id, created_at DESC).
- Nenhuma outra constraint/índice público encontrado nas consultas.
- Sem views, funções/procedimentos ou triggers no schema public observado. Isso não afirma ausência de objetos gerenciados em auth/storage ou schemas internos; export integral os trata separadamente.

## RLS e permissões

RLS habilitado nas quatro tabelas. Sete políticas PERMISSIVE:

| Tabela | Política | Operação | Roles | Condição |
|---|---|---|---|---|
| revistas | acesso aberto revistas | ALL | anon, authenticated | USING true, CHECK true |
| personagens | acesso aberto personagens | ALL | anon, authenticated | USING true, CHECK true |
| revista_versoes | acesso aberto versoes | ALL | anon, authenticated | USING true, CHECK true |
| estilos_personalizados | Estilos personalizados visiveis publicamente | SELECT | anon, authenticated | USING true |
| estilos_personalizados | Estilos personalizados podem ser criados publicamente | INSERT | anon, authenticated | CHECK true |
| estilos_personalizados | Estilos personalizados podem ser alterados publicamente | UPDATE | anon, authenticated | USING true, CHECK true |
| estilos_personalizados | Estilos personalizados podem ser excluidos publicamente | DELETE | anon, authenticated | USING true |

`has_table_privilege` confirmou SELECT/INSERT/UPDATE/DELETE para anon, authenticated e service_role em cada tabela. A consulta de ACL mostra permissões de catálogo mais amplas nesses papéis do que o mínimo CRUD escrito nas migrações. A exportação completa é a fonte para preservar ACL remota exata; SQL consolidado reproduz somente os grants explícitos das migrações originais. Uma primeira consulta de information_schema.role_table_grants não retornou linhas sob papel restrito; não foi interpretada como ausência de grants. Consulta direta confirmou privilégios.

A ACL inclui um papel técnico de execução do ambiente; ele não é perfil de usuário do app e não deve ser recriado manualmente fora da plataforma. Sem login, proprietário e visitantes não são distinguidos pelas políticas. Risco: leitura, alteração e exclusão públicas. Nenhuma política foi alterada.

## Migrações e recriação

Arquivos originais preservados:
1. `fonte/drizzle/migrations/0000_migration.sql`: revistas/personagens, GRANT, RLS, políticas.
2. `0001_migration.sql`: revista_versoes, índice, FK em cascata, GRANT/RLS/política.
3. `0002_create_custom_art_styles.sql`: estilos, GRANT/RLS/políticas.

Journal e snapshots incluídos. `drizzle/schema.ts` vazio não representa o banco atual. Consolidação em `RECRIAR_SCHEMA_PUBLIC.sql`, sem execução na origem nem no destino. Só cria schema de app em ambiente compatível vazio; não exporta tabelas gerenciadas ou registros. Não aplicar ambos os conjuntos nem repetir CREATE após restauração do banco completo. Para sincronizar futuras migrações, verificar baseline do journal no destino antes de usar ferramentas.

## Autenticação e configurações hospedadas

Leitura hospedada confirmou Site URL apontando ao site publicado Studios Tom e allow-list de retornos para publicado/prévias. Servidor OAuth de MCP está desativado; não é evidência sobre métodos de login de usuário. Nomes/IDs específicos de prévias não foram reproduzidos por não serem necessários ao destino.

Não verificados: email/password habilitado, cadastro, confirmação, política de senha, OTP, recuperação, provedores sociais, SMTP/remetente e templates. Verificar manualmente **More → Users → Auth settings** (Email e Advanced) e **More → Emails**. O produto atual não usa telas de login. Não ligar métodos de autenticação para testar esta migração.

## Integrações externas e limites de exportação

- Gateway IA Lovable: código do adaptador, prompts e contratos exportados; serviço/modelos/créditos/secret não exportados.
- Google Fonts: links Bangers e Space Grotesk preservados; arquivos das fontes não são locais.
- npm: manifestos/lock disponíveis; dependências instaladas excluídas. Dependência @lovable.dev consultada publicamente com HTTP 200, sem certificação de instalação externa.
- Host Lovable, controle de badge, domínio e telemetria do editor: não transferidos por ZIP.
- Git sync: estado/conta/repositório proprietário não inspecionado; metadata/história Git excluídos. Usar Project settings → Git para conexão privada autorizada, se desejado.
- Secrets inventariados por nome somente; valores não exportados. Criar credenciais novas no destino, manter apenas nomes/finalidades documentados.
