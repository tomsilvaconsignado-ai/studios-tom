# CLAUDE — instruções para preservar Studios Tom

Este arquivo governa o trabalho no pacote inteiro, inclusive `fonte/`. Copie-o para a raiz de trabalho quando optar por abrir somente `fonte/`; respeite também `AGENTS.md` original. A tarefa inicial é auditoria e preparação, não reconstrução.

1. Leia `MIGRACAO_CLAUDE.md`, `documentacao/RELATORIO_INTEGRIDADE.md`, regras técnicas e roadmap originais. Faça primeiro a instalação e homologação em destino isolado, sem acessar dados de produção para testes de escrita.
2. Não remover, simplificar ou reconstruir recursos nem mudar identidade visual. App português, Studios Tom, sem branding visível Lovable. Preservar amarelo/creme/vermelho/contorno preto/sombras comic e Bangers/Space Grotesk.
3. Manter TanStack Start/Router, rotas por arquivo, SSR, funções e handlers. Não trocar por React Router ou SPA estática. Não editar routeTree gerada; não duplicar plugins enquanto usar o adaptador atual.
4. Preservar `Salvar projeto` e autosave. Diferenciar histórico persistido de versões e desfazer local. Não modificar schema JSON sem conversão explícita, reversível e testes concretos.
5. Páginas novas vazias. Imagens sem deformação. Capa JPG/PNG começa completa em conter; recorte só por escolha; PNG transparente permanece transparente.
6. Camadas de quadro/capa têm coordenadas percentuais e arrays ordenados. Editor, versões, miniaturas e impressão devem usar a mesma representação. Balões pertencem à página, atravessam quadros e mantêm caudas precisas; preservar migração de balões legados.
7. Meu Estilo combina referências com estilo base priorizando o traço do usuário. Continuidade respeita ordem narrativa por história e memória por quadro, não repetir só a composição.
8. Não introduzir login ou isolamento silenciosamente: produto atual é sem login e dados compartilhados. Documentar risco de acesso aberto e obter autorização específica antes de alterar permissões. Nunca confiar em localStorage para papel administrativo.
9. Esquema SQL é fonte de verdade; `drizzle/schema.ts` vazio não autoriza apagar tabelas. Não rodar push/reset/migration contra origem; restauração com schema não recebe novamente CREATE TABLE. Preserve UUIDs, FK, timestamps, JSONB, arrays, base64 e ordem de camadas.
10. Não buscar ou copiar secrets de produção. `.env` não foi exportado e campos vazios de `.env.example` não são credenciais. Configurar novas credenciais no destino; jamais colocar chave privada em VITE_ ou no bundle/browser. Admin client só no servidor e somente para ações privilegiadas autorizadas.
11. Preservar middleware CSRF, proteção de erros SSR, comportamento de chaves publicáveis opacas e fronteiras `.server.ts`/`.functions.ts`. Pacotes devem ser empacotados no alvo serverless; não externalizar módulos de SSR nesse alvo.
12. Integrações IA dependem de contratos específicos de Responses/SSE e imagens. Troca de provedor exige autorização, adaptação pontual e testes de referências, dimensões e cobrança; nomes do gateway não garantem compatibilidade externa.
13. Executar suíte existente e acrescentar testes de regra somente quando alguma regra for alterada por solicitação. Não inferir cobertura ampla de apenas três testes. Fazer QA do fluxo com dados restaurados no destino e comparar impressão/editor.
14. Não publicar, migrar dados, criar repo externo ou conectar Git sem autorização. Trabalhar em branch privada de destino; não reescrever história Git publicada/sincronizada da origem.
15. Registrar limitações e não declarar migração concluída enquanto banco, configuração hospedada, credenciais válidas, build externo e testes de ponta a ponta estiverem pendentes.
