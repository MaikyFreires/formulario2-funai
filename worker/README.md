# Proxy do Formulario 2

Cloudflare Worker para intermediar as chamadas entre GitHub Pages e Power Automate sem expor URLs assinadas no navegador.

## Rotas

- `POST /receber`
- `POST /enviados`
- `POST /rascunhos`
- `POST /carregar-rascunho`

## Secrets obrigatorios

Cadastre no Cloudflare:

- `POWER_AUTOMATE_RECEBER_URL`
- `POWER_AUTOMATE_ENVIADOS_URL`
- `POWER_AUTOMATE_RASCUNHOS_URL`
- `POWER_AUTOMATE_CARREGAR_RASCUNHO_URL`

Nao coloque os valores desses secrets em arquivos do repositorio.

## Variaveis

- `ALLOWED_ORIGIN`: origem exata do GitHub Pages autorizada a chamar o Worker.
- `ALLOWED_EMAIL_DOMAINS`: opcional, lista separada por virgulas com dominios de e-mail permitidos.

Exemplo de `ALLOWED_ORIGIN`:

```text
https://SEU-USUARIO.github.io
```

## Frontend

Configure no `js/config.js` apenas a URL publica do Worker:

```js
window.FORMULARIO2_CONFIG = {
  apiBaseUrl: "https://SEU-WORKER.workers.dev"
};
```

O frontend chamara somente a URL base do Worker mais as rotas publicas. As URLs do Power Automate ficam exclusivamente nos secrets do Cloudflare.
