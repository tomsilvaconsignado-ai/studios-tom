# Exportar dados e configurar o destino

**O pacote de fonte não contém os registros ou imagens reais.** Nenhum export integral foi iniciado por ferramenta nem houve modificação dos dados. A continuidade sem perda exige o export autorizado abaixo.

## Exportação integral do banco — ação do proprietário

1. No Lovable, abrir **More → Database → Manage → Settings**.
2. Em **Export project data**, clicar **Export data**.
3. Na opção **Database**, clicar **Export** e depois **Start export**.
4. Baixar pelo link enviado por e-mail ou em **More → Storage**, onde o export também é salvo.

Limites documentados: backend precisa estar em execução; banco até 15 GB; arquivo até 5 GB; um export a cada 24 horas. Não foi consultado o histórico de exports nem comprovada elegibilidade de tamanho/frequência desta conta. Backend de origem desta auditoria é uma única instância compartilhada com prévia e publicado; se a interface mostrar Test/Live, selecionar e registrar explicitamente o ambiente correto antes de iniciar.

O export inclui estrutura e dados do banco e contas com hashes de senha, quando existirem. **Não** inclui arquivos em buckets, código de Edge Functions, secrets ou configurações de provedores de login. Arquivo é sensível: guardar cifrado/privado, sem enviar a repositório público ou a serviços não autorizados. Não usar psql/pg_dump ou um script artesanal de paginação para simular export completo.

## Imagens e arquivos de usuário

Nesta consulta, nenhum bucket de armazenamento foi encontrado. Imagens de quadros/capa/camadas, referências de personagens e estilos estão em JSONB/arrays como texto base64 no banco. Portanto, o export completo do banco é indispensável para essas imagens; copiar `public/` sozinho não as preserva.

- `revistas.dados`: arte atual, camadas, balões, modelos, enquadramento e continuidade.
- `revista_versoes.dados`: snapshots históricos e imagens das versões.
- `personagens.imagens`: referências de personagens.
- `estilos_personalizados.imagens`: desenhos de referência.

Não reformatar arrays nem truncar base64; não substituir UUIDs ao importar. Não converter JPG/PNG novamente. Originais locais antes da redução não são armazenados pelo app: obter do proprietário se forem necessários. Estado de desfazer da sessão/browser não faz parte do banco. Não há documentos/áudios/vídeos como entidades de produto identificados na fonte.

Se aparecerem buckets/arquivos posteriormente, baixar separadamente em **More → Storage**, registrar nomes/configurações e verificar acesso no destino. Não há bucket real para exportar agora e não foi escrito código de cópia com credencial privilegiada. Um export salvo em Storage pelo processo de exportação pode aparecer depois desta auditoria.

## Configurações que exigem procedimento manual

- More → Users → Auth settings: provedores, Email, Advanced (Site URL/retornos), confirmação/cadastro/limites de senha/recuperação.
- More → Emails: templates/remetente e domínio, se configurados.
- Project settings: domínio, Git privado e configuração de publicação; credenciais novas no gestor seguro de destino.
- Provedor IA: credencial válida autorizada e orçamento/contratos/modelos. Não há cópia do serviço IA nem dos secrets no ZIP.
- Configurações da hospedagem e runtime: escolher destino full-stack, manter SSR, server functions e streaming.

Não existe UI de importação de banco no Lovable Cloud. Este guia trata de restauração em **destino independente compatível**, segundo instruções do provedor de destino, não de upload do export de volta na interface Lovable.

## Restaurar e verificar sem risco à origem

1. Guardar export imutável e cópia de trabalho privada. Confirmar data/hora e ambiente.
2. Criar destino isolado que suporte Data API/RLS/papéis usados. Restaurar export completo pelo procedimento do destino.
3. Caso export inclua schema, não executar CREATE TABLE novamente. Caso seja somente esquema de teste vazio, migrações originais ou consolidação são alternativa sem dados.
4. Recriar credenciais e configurações hospedadas necessárias; não extrair chave privada indisponível da origem.
5. Comparar contagens atuais do destino com contagens do momento do export (referência desta auditoria: revistas 4, personagens 7, versões 6, estilos 1). Comparar também UUIDs, JSON completo e imagens; só contagens iguais não provam integridade.
6. Abrir revista real restaurada, conferir capa/camadas/balões e impressão; editar e salvar apenas no destino, reabrir e ler alterações.
7. Testar IA com autorização e orçamento; verificar streaming, referências, continuidade e tamanho final da imagem.
8. Antes da virada final, combinar pausa de escrita da origem, novo export autorizado e validação do destino. Só então alterar endereço oficial. Não desligar/excluir origem nesta preparação.

## GitHub privado opcional

ZIP é a entrega pronta. Para Git sync na conta do proprietário, usar **Project settings → Git**, conectar provedor/conta e criar repositório privado com autorização. O agente não criou/conectou repositório nem exportou história Git. Caso história completa seja indispensável e haja repo sincronizado, obter clone privado pelo proprietário. Conferir secrets antes de qualquer push; banco exportado nunca deve ir junto do fonte em repo público.
