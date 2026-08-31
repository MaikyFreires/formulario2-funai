# Sistema

## Formulario 2

O Formulario 2 implementa a parte `FORMULARIO PRODUTO 2` do roteiro de qualificacao de reivindicacao fundiaria indigena. Perguntas orientadoras posteriores do documento nao foram transformadas em campos estruturados.

## Campos adicionados

- `tipoDemanda` como selecao unica.
- `revisaoLimites.nomeTiOriginal`
- `revisaoLimites.ultimoAtoRegularizacao`
- `revisaoLimites.nomeDocumentoRegularizacao`
- `revisaoLimites.dataDocumentoRegularizacao`
- `revisaoLimites.dataPrimeiraMencaoReivindicacao`
- `revisaoLimites.areaPrazoDecadencial`
- `revisaoLimites.erroPrimeiraDemarcacao`
- `revisaoLimites.tiposErroPrimeiraDemarcacao`
- `revisaoLimites.outroErroPrimeiraDemarcacao`
- `revisaoLimites.observacoesErrosDocumentos`
- `revisaoLimites.enquadraRequisitosStf`
- `reservaIndigena.comunidadeIndicouArea`
- `reservaIndigena.imovelDestinacaoComunidade`
- `reservaIndigena.informacoesImovelDestinacao`
- `caracterizacaoArea.temCoordenadas`
- `caracterizacaoArea.coordenadas`
- `caracterizacaoArea.coordenadasDetalhadas`
- `caracterizacaoArea.latitude`
- `caracterizacaoArea.longitude`
- `caracterizacaoArea.coordenadaSedeMunicipio`
- `caracterizacaoArea.comentarioCoordenada`
- `situacaoArea.situacaoPosse`
- `situacaoArea.ocupantesNaoIndigenas`
- `situacaoArea.tiposOcupantesNaoIndigenas`
- `situacaoArea.outroOcupanteNaoIndigena`
- `situacaoArea.nivelTensaoLocal`
- `encaminhamentos.reivindicacaoAtivaAtual`
- `encaminhamentos.relacaoOutrasReivindicacoes`
- `encaminhamentos.idsReivindicacoesRelacionadas`
- `encaminhamentos.descricaoRelacaoReivindicacoes`

## Campos removidos

- `outrosNomes`
- `outrosNomesTexto`
- `descricaoReivindicacao`
- tabela de documentos do resumo do processo
- `estaJudicializado`
- `tiposAcaoJudicial`
- detalhes de acoes judiciais contra a FUNAI
- mapas cartograficos
- `citaAldeiasComunidades`
- `contextoUrbano`
- `temRetomada`
- detalhes por criterio de vulnerabilidade
- `conflitoInteretnico`
- `tiposConflito`
- detalhes de conflito
- `reintegracaoPosse`
- `descricaoReintegracaoPosse`

## Campos reaproveitados

- dados do consultor;
- ID e nome da reivindicacao;
- etnias e outras etnias;
- processos analisados;
- roteiro de qualificacao, data do roteiro e numero SEI de qualificacao;
- UF e municipios;
- localizacao da demanda;
- bioma;
- faixa de fronteira;
- sobreposicoes e detalhes por tipo;
- criterios de vulnerabilidade;
- comunidades tradicionais;
- povos isolados;
- outras acoes judiciais envolvendo a comunidade;
- informacoes adicionais.

## SharePoint

Campos ja presentes no codigo legado:

| Campo | InternalName | Tipo SharePoint | Ja existia? | Observacao |
| ----- | ------------ | --------------- | ----------- | ---------- |
| Nome do consultor | Title / ConsultorNome | Texto | Sim | Reaproveitado. |
| E-mail do consultor | ConsultorEmail | Texto | Sim | Reaproveitado. |
| Area de estudo | AreaEstudo / field_1 | Choice ou texto | Sim | Reaproveitado. |
| ID | ReivindicacaoId / field_2 | Texto ou numero | Sim | Reaproveitado. |
| Nome da reivindicacao | NomeReivindicacao / field_3 | Texto | Sim | Reaproveitado. |
| Etnias | Etnias / field_9 | Texto ou multichoice | Sim | Reaproveitado. |
| Outra etnia | OutraEtnia / field_10 | Texto | Sim | Reaproveitado. |
| Tipo da demanda | TipoDemanda / field_11 | Choice | Sim | Agora selecao unica. |
| Estados | Estados / field_14 | Texto ou multichoice | Sim | Reaproveitado no bloco de caracterizacao. |
| Municipios | Municipios / field_15 | Texto ou multichoice | Sim | Reaproveitado no bloco de caracterizacao. |
| FormularioJson | FormularioJson | Multiline text | Sim | Fonte completa do payload estruturado. |

Acao manual necessaria no SharePoint: criar colunas dedicadas para os campos adicionados do Produto 2, caso o fluxo de Power Automate precise gravar cada campo fora do `FormularioJson`.
