# Configuracao Local

Este arquivo e somente para uso interno/local e nao deve ir para o GitHub.

## Arquivos locais

- `js/config.js`: configuracao publica sem secrets.
- `js/config.local.js`: sobrescritas locais sem commit.
- `README.local.md`: anotacoes internas de configuracao e publicacao.

Esses arquivos devem ficar no `.gitignore`.

## Configuracao

1. Copie `js/config.example.js` para `js/config.js`, se o arquivo ainda nao existir.
2. Preencha `VERIFY_ACCESS_URL` somente quando o fluxo de acesso estiver definido para este ambiente.
3. Preencha `FORMULARIO2_CONFIG.apiBaseUrl` com a URL publica do Cloudflare Worker.
4. Cadastre as URLs reais do Power Automate como secrets no Cloudflare Worker, nunca no frontend.

## Teste local

Use servidor local para testar carregamento de `html/`, CSVs e assets:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Acesse:

```text
http://127.0.0.1:8000/
```

## CSS

O CSS foi quebrado em `css/partials/`. Para manutencao:

- Edite o partial correspondente ao assunto.
- Mantenha `css/styles.css` apenas com os `@import`.
- Se criar outro partial, adicione o import na ordem correta.
- Depois de mudancas visuais, atualize o cache bust em `index.html`.

## GitHub Pages

1. Envie apenas os arquivos publicos.
2. Confirme que `js/config.js` nao entrou no commit.
3. No GitHub, entre em `Settings` > `Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch `main` e a pasta `/root`.
6. Salve.

## Checklist antes de publicar

- `js/config.js` fora do Git.
- `README.local.md` fora do Git.
- URLs reais nao aparecem em arquivos versionados.
- `index.html` e `js/script.js` com a mesma versao de cache.
- Rascunho, enviados e PDF testados no navegador.
