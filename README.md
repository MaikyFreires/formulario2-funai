# Formulario FUNAI

Aplicacao estatica para preenchimento, recuperacao e envio de formularios FUNAI via Power Automate/SharePoint.

## Produto 2

O Formulario 2 / Produto 2 nao e uma copia funcional do Formulario 1. Ele reaproveita componentes tecnicos, estilos, validacoes e padroes de persistencia quando compativeis, mas sua estrutura funcional segue a parte `FORMULARIO PRODUTO 2` do documento de qualificacao de reivindicacao fundiaria indigena.

## Fluxo

- Acesso inicial por e-mail autorizado.
- Dashboard do consultor com Novo formulario, Meus rascunhos e Enviados.
- Salvamento de rascunho e envio final via Power Automate/SharePoint.
- Recuperacao de rascunhos pelo `formularioId`.
- Visualizacao de enviados com opcao de salvar em PDF.

## Estrutura do Formulario 2

- `1. Dados do consultor`: mantido como no formulario existente.
- `2. Reivindicacao`: ID, nome, etnias, processo e qualificacao, tipo da demanda.
- `5. Caracterizacao da area reivindicada`: UF/municipio, localizacao, coordenadas geograficas no mesmo modelo do Formulario 1, bioma, faixa de fronteira e sobreposicoes.
- `6. Situacao da area reivindicada`: posse, vulnerabilidades, comunidades tradicionais, povos isolados, acoes judiciais da comunidade, ocupantes nao indigenas, nivel de tensao e informacoes adicionais.
- `7. Encaminhamentos e recomendacoes`: atividade atual da reivindicacao e relacao com outras reivindicacoes.

## Campos condicionais

O campo `tipoDemanda` centraliza as regras:

- `Identificacao`: exibe apenas os campos gerais da reivindicacao.
- `Revisao de limites`: exibe `revisaoLimites`, com TI original, ato de regularizacao, documentos, prazo decadencial, erro grave/insanavel, tipos de erro, observacoes e enquadramento STF.
- `Reserva Indigena`: exibe `reservaIndigena`, com indicacao de area, imovel passivel de destinacao e informacoes sobre o imovel/destinacao.

Valores de blocos que nao correspondem a modalidade selecionada nao sao serializados no `FormularioJson`.

## SharePoint

O envio continua usando `POWER_AUTOMATE_URL`. Campos existentes reaproveitados incluem consultor, ID, nome da reivindicacao, etnias, processos analisados, UF/municipio, bioma, faixa de fronteira, sobreposicoes, vulnerabilidades, comunidades tradicionais, povos isolados, acoes judiciais da comunidade e informacoes adicionais.

Novos campos do Produto 2 devem ter colunas SharePoint criadas manualmente antes de serem persistidos em colunas dedicadas. Sem o esquema real da lista, o sistema nao inventa `InternalName`; os dados completos seguem preservados no `FormularioJson`.

## Campos removidos do Formulario 2

- Outros nomes da reivindicacao.
- Secao isolada Localizacao dentro de Reivindicacao.
- Secao Resumo do processo.
- Secao Status do processo.
- Cita aldeias/comunidades.
- Contexto urbano.
- Acao de retomada do territorio.
- Detalhes por criterio de vulnerabilidade.
- Conflito na area reivindicada.
- Reintegracao de posse.

## Estrutura do projeto

- `index.html`: ponto de entrada da aplicacao.
- `html/`: telas carregadas pelo index.
- `css/styles.css`: arquivo principal de estilos, com imports.
- `js/script.js`: regras de interface, validacoes, dashboard, rascunhos e envio.
- `js/config.example.js`: modelo publico de configuracao.
- `data/`: arquivos CSV usados nos campos.
- `assets/`: imagens usadas na interface.

## Configuracao

Copie `js/config.example.js` para `js/config.js` e preencha as URLs dos fluxos do Power Automate no ambiente local. O arquivo real `js/config.js` nao deve ser enviado ao GitHub.

## Observacoes

- Use um servidor local para testar CSVs e carregamento de telas parciais.
- Nao versione arquivos locais com URLs reais, segredos ou anotacoes internas.
