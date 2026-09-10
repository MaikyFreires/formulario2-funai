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
- `reservaIndigena.comunidadeIndicouArea`
- `reservaIndigena.detalheAreaInteresse`
- `reservaIndigena.imovelDestinacaoComunidade`
- `reservaIndigena.informacoesImovelDestinacao`
- `caracterizacaoArea.coordenadas`
- `caracterizacaoArea.coordenadasDetalhadas`
- `caracterizacaoArea.latitude`
- `caracterizacaoArea.longitude`
- `caracterizacaoArea.coordenadaSedeMunicipio`
- `caracterizacaoArea.comentarioCoordenada`
- `situacaoArea.situacaoPosse`
- `situacaoArea.temEmpreendimento`
- `situacaoArea.descricaoEmpreendimento`
- `situacaoArea.ocupantesNaoIndigenas`
- `situacaoArea.tiposOcupantesNaoIndigenas`
- `situacaoArea.outroOcupanteNaoIndigena`
- `situacaoArea.nivelTensaoLocal`
- `encaminhamentos.reivindicacaoAtivaAtual`
- `encaminhamentos.relacaoOutrasReivindicacoes`
- `encaminhamentos.agrupamentos`: lista de objetos `{ id, descricao }`.
- `encaminhamentos.motivoInatividade`
- `encaminhamentos.justificativaAtivaAtual`
- `encaminhamentos.necessitaDesmembramento`
- `encaminhamentos.justificativaDesmembramento`
- `encaminhamentos.novasReivindicacoes`

As chaves `nomeDocumentoRegularizacao`, `dataDocumentoRegularizacao` e `comentarioCoordenada` foram preservadas para compatibilidade; os rótulos são nome do ato, data do ato e descrição da coordenada.

Na leitura, `Integral`/`Parcial` viram `Integralmente`/`Parcialmente`. `Omissão de Posse Tradicional` vira `Exclusão indevida de área tradicional`. IDs antigos são convertidos para itens de agrupamento, cada qual preservando a descrição compartilhada antiga. Valores removidos sem correspondência ficam sem seleção e não aparecem no relatório. Novas perguntas não recebem respostas presumidas para registros antigos.

Todas as perguntas aplicáveis são obrigatórias para envio, inclusive cada coordenada e cada item de agrupamento. Rascunhos continuam permitindo preenchimento parcial. Condicionais ocultos não impedem o envio e não aparecem no relatório. Os novos dados seguem no `FormularioJson` existente.

## Campos removidos

- `revisaoLimites.enquadraRequisitosStf`
- `situacaoArea.vulnerabilidades` e campos associados
- `outrosNomes`
- `outrosNomesTexto`
- `descricaoReivindicacao`
- tabela de documentos do resumo do processo
- `estaJudicializado`
- `tiposAcaoJudicial`
- detalhes de acoes judiciais contra a FUNAI
- `temCoordenadas`
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
- `processosAnalisados`
- `numerosProcesso`
- `numeroSeiQualificacao`
- `descricaoProcessosAnalisados`
- `temRoteiro`
- `dataRoteiro`
- `revisaoLimites.observacoesErrosDocumentos`
- `situacaoArea.outrasAcoesJudiciaisComunidade`
- `situacaoArea.descricaoOutrasAcoesJudiciaisComunidade`
- `situacaoArea.informacoesAdicionais`

## Campos reaproveitados

- dados do consultor;
- ID e nome da reivindicacao;
- etnias e outras etnias;
- UF e municipios;
- localizacao da demanda;
- bioma;
- faixa de fronteira;
- sobreposicoes e detalhes por tipo;
- comunidades tradicionais;
- povos isolados.

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

## Validação local

O teste `tests/formulario.test.cjs` usa jsdom 26.1.0 para verificar criação, edição, serialização/leitura, compatibilidade com registros antigos, condicionais, campos obrigatórios e conteúdo do relatório. Não acessa serviços externos. Para executá-lo em PowerShell, sem build ou dependência permanente na aplicação:

```powershell
npm.cmd install --no-save --package-lock=false --prefix .tmp-validation jsdom@26.1.0
$env:NODE_PATH = Join-Path (Get-Location) '.tmp-validation/node_modules'
node tests/formulario.test.cjs
node --check js/script.js
```
