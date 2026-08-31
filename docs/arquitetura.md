# Arquitetura

## Formulario 2 / Produto 2

O Produto 2 usa a mesma aplicacao estatica do SITI/FUNAI, mas possui estrutura funcional propria. A tela fica em `html/formulario.html` e o comportamento fica em `js/script.js`.

O Formulario 2 pode compartilhar:

- controles de texto, radio, checkbox e textarea;
- autocomplete/chips de etnias;
- autocomplete/chips de UF e municipio;
- autocomplete/chips de comunidades tradicionais;
- tabela de coordenadas geograficas do Formulario 1;
- grade de sobreposicoes;
- fluxo de rascunho, envio, leitura e PDF;
- validacoes genericas e helpers de datas/listas.

Esse compartilhamento e tecnico. A estrutura funcional do Produto 2 e independente do Formulario 1.

## Blocos de dados

O `FormularioJson` do Produto 2 e organizado em:

- `consultor`
- `reivindicacao`
- `caracterizacaoArea`
- `situacaoArea`
- `encaminhamentos`

Os blocos copiados do Formulario 1 `resumoProcesso` e `statusProcesso` nao fazem parte da estrutura funcional do Produto 2.

## Regras condicionais

`reivindicacao.tipoDemanda` e o eixo das regras:

- `Identificacao`: somente campos gerais da reivindicacao.
- `Revisao de limites`: preenche `reivindicacao.revisaoLimites`.
- `Reserva Indigena`: preenche `reivindicacao.reservaIndigena`.

Quando a modalidade nao corresponde ao bloco, o bloco fica vazio no objeto estruturado e seus valores nao entram no `FormularioJson` enviado.

## Persistencia

O envio para SharePoint continua mediado por Power Automate. Os dados completos do Produto 2 seguem no campo `FormularioJson`.

Colunas dedicadas para campos novos devem ser criadas no SharePoint antes de serem mapeadas pelo fluxo. Na ausencia do esquema real da lista, nao foram criados `InternalName` ficticios no codigo.
