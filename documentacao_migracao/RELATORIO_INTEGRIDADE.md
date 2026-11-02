# Relatório de integridade — preparação, não migração concluída

Data UTC: 27/10/2026. Escopo: snapshot atual do projeto, levantamento backend somente leitura, documentação e cópia segura. Nenhum arquivo da origem ou registro de banco foi alterado. Nenhum deploy, clone remoto, Git stateful, conexão Git ou aplicação de SQL foi realizado.

## Arquivos identificados/exportados

- 124 arquivos de origem copiados; 123 idênticos byte a byte.
- 1 cópia sanitizada: `fonte/supabase/config.toml`, apenas identificador de backend omitido; original intacto.
- 1 arquivo novo na cópia: `fonte/.env.example`, vazio e comentado.
- Fonte inclui todo `src/`, componentes UI, arquivos de rota gerados, CSS, público/favicon, configs, lockfile, SQL/journal/snapshots, testes, documentação original e `.lovable/` relevante. Nenhum componente foi descartado por parecer não usado.
- Manifesto JSON lista cada caminho/bytes/SHA-256 de origem. Arquivos adicionados de documentação também recebem hashes em `HASHES_PACOTE.sha256`.

## Não exportado e motivo

- `.env`: omitido para não distribuir credenciais/configuração de produção. Nomes/finalidades em guia e exemplo.
- `.git` em todo nível e `.workspace/.git`: metadados locais e história Git, não exportáveis neste pacote seguro; não necessários ao funcionamento. `.gitignore` preservado. Obter histórico de repo privado do proprietário se existente/necessário.
- `node_modules`: dependências instaladas, reinstalar com lockfile.
- `tsconfig.tsbuildinfo`: cache gerado incremental; recriado pelo ambiente.
- Dados/contas/imagens: export manual de banco obrigatório; nenhum dado foi apagado ou serializado para pacote.
- Secret values, configuração hospedada auth/email/provider/badge/domínios, código do gateway IA e infraestrutura do hosting: não exportados.
- Fontes Google remotas e originais pré-redução de uploads: não são recursos locais presentes no fonte.
- Edge Functions/schedules remotos: não inventariados remotamente; fonte não contém diretório de Edge Functions nem agendamentos de negócio. Confirmar se há recursos adicionais na interface Cloud.

## Dependências e verificação

- Cloud backend/Data API/RLS; gateway IA Lovable com crédito/secret; hosting full-stack; pacote de build Lovable; Google Fonts; registro npm.
- Testes executados: **2 arquivos, 3 testes aprovados**, com resultado anexado. Cobre apenas imposição e comportamento específico de rota testado, não o editor inteiro.
- Último log da prévia observado antes da preparação: `build OK`, 27/10/2026 17:57:27 UTC. Não foi executado build manual nem instalação em destino externo.
- npm público respondeu HTTP 200 ao manifesto `@lovable.dev/vite-tanstack-config@2.26.5`; tarball/install/runtime externo não validados.
- Esquema observado: quatro tabelas, sete políticas, RLS nas quatro, PKs/FK em cascata/índice de versões; ACL consultada confirmou CRUD nos três papéis usuais. Sem buckets/views/funções/triggers públicos encontrados.
- Contagens consultadas: revistas 4; personagens 7; versões 6; estilos 1. Não equivalem a export de conteúdo ou congelamento de dados.
- Auditoria conferiu head de todas as seis rotas de conteúdo sem mudar metadados/visual.

## Componentes que continuam dependentes do Lovable

Enquanto a configuração permanecer igual: o adaptador de build, Cloud backend escolhido, gateway IA/credencial/créditos e hospedagem de origem. Telemetria e broker de sessão das prévias são hooks gerados preservados; fora do editor o broker cai em armazenamento local e hooks de erro são opcionais. Hosting/serviços não foram copiados. Compatibilidade pode ser obtida por configurar/adaptar destino, não simplesmente descompactar sem credenciais.

## Testes obrigatórios após a migração

Instalação limpa/build/SSR; URLs diretas; todos os CRUDs com dados restaurados; autosave/manual/falha de rede/reabertura; histórico/restauração/desfazer; uploads PNG e enquadramento; camadas/capa/bloqueio/ordem/modelos; balões atravessando quadros/caudas/legado; Meu Estilo; geração/edição streaming/continuidade/dimensões/filtros/créditos; PDF e dobra/duplex; layout/tipografia desktop/mobile. Escrever apenas no destino isolado.

## Pendências e procedimentos

1. Proprietário iniciar/baixar export completo em More → Database → Manage → Settings → Export project data.
2. Conferir manualmente autenticação/e-mails/recursos hospedados não consultados.
3. Criar destino e credenciais autorizadas; decidir continuidade do gateway IA ou adaptação aprovada.
4. Restaurar, comparar dados integralmente, instalar/executar/testar e só então planejar virada sem escrita simultânea.

**Conclusão:** pacote de migração preparado, dados e execução externos pendentes; não declarar migração concluída.
