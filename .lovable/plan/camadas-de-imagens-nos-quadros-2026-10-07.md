# Camadas de imagens nos quadros

## O que será adicionado
- Botão para anexar arquivos JPG ou PNG ao quadro selecionado como uma nova camada.
- Seleção visual da camada diretamente no quadro, com arraste livre e alças para redimensionar proporcionalmente e girar.
- Controles numéricos para posição, tamanho, rotação e opacidade, permitindo ajustes precisos.
- Lista de camadas com ações para trazer à frente, enviar para trás, substituir e excluir.
- Persistência de todas as propriedades das camadas junto ao painel, integrada ao salvamento automático, ao botão Salvar, ao histórico e ao desfazer/refazer.
- Renderização das camadas nas miniaturas e na exportação para impressão.

## Detalhes técnicos
- Cada quadro armazenará uma lista ordenada de camadas com imagem, posição e tamanho percentuais, rotação e opacidade.
- O editor usará eventos de ponteiro para arrastar e manipular as camadas sem interferir na seleção dos quadros.
- JPG e PNG serão validados e compactados antes de serem incluídos nos dados da revista.
- Revistas antigas continuarão funcionando porque quadros sem a nova lista serão tratados como sem camadas.

## Verificação
- Testar inclusão, seleção, arraste, redimensionamento, giro, opacidade, reordenação, substituição e exclusão.
- Confirmar salvamento e recarregamento das propriedades, desfazer/refazer e saída para impressão.
- Conferir o editor em desktop e em largura móvel, sem regressões nas funções existentes.
