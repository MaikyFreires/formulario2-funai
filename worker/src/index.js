const ROUTES = {
  "/receber": {
    secretName: "POWER_AUTOMATE_RECEBER_URL",
    validate: validateReceberPayload
  },
  "/enviados": {
    secretName: "POWER_AUTOMATE_ENVIADOS_URL",
    validate: validateConsultorPayload
  },
  "/rascunhos": {
    secretName: "POWER_AUTOMATE_RASCUNHOS_URL",
    validate: validateConsultorPayload
  },
  "/carregar-rascunho": {
    secretName: "POWER_AUTOMATE_CARREGAR_RASCUNHO_URL",
    validate: validateCarregarRascunhoPayload
  }
};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  }
};

async function handleRequest(request, env, ctx) {
  const cors = buildCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, message: "Metodo nao permitido." }, 405, cors);
  }

  const url = new URL(request.url);
  const route = ROUTES[url.pathname];
  if (!route) {
    return jsonResponse({ success: false, message: "Rota nao encontrada." }, 404, cors);
  }

  if (!isAllowedOrigin(request, env)) {
    return jsonResponse({ success: false, message: "Origem nao permitida." }, 403, cors);
  }

  if (!isJsonRequest(request)) {
    return jsonResponse({ success: false, message: "Content-Type invalido." }, 415, cors);
  }

  const targetUrl = env[route.secretName];
  if (!targetUrl) {
    console.error("power_automate_secret_missing", { route: url.pathname });
    return jsonResponse({ success: false, message: "Nao foi possivel processar a solicitacao." }, 500, cors);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ success: false, message: "JSON invalido." }, 400, cors);
  }

  const validation = route.validate(payload, env);
  if (!validation.valid) {
    return jsonResponse({ success: false, message: validation.message }, 400, cors);
  }

  try {
    const response = await fetchWithTimeout(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 30000);

    const body = await parsePowerAutomateResponse(response);
    const status = response.status;

    if (!response.ok) {
      console.error("power_automate_http_error", { route: url.pathname, status });
      return jsonResponse({ success: false, message: "Nao foi possivel processar a solicitacao." }, status, cors);
    }

    if (body?.success === false && body.message === "Resposta invalida do servico.") {
      console.error("power_automate_invalid_json", { route: url.pathname });
      return jsonResponse(body, 502, cors);
    }

    return jsonResponse(body, status, cors);
  } catch (error) {
    console.error("power_automate_request_failed", { route: url.pathname, reason: error.name || "Error" });
    return jsonResponse({ success: false, message: "Nao foi possivel processar a solicitacao." }, 504, cors);
  }
}

function buildCorsHeaders(request, env) {
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN);
  const requestOrigin = normalizeOrigin(request.headers.get("Origin"));
  const origin = allowedOrigin && requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin || "";

  return {
    ...JSON_HEADERS,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function isAllowedOrigin(request, env) {
  const allowedOrigin = normalizeOrigin(env.ALLOWED_ORIGIN);
  if (!allowedOrigin) return false;

  const requestOrigin = normalizeOrigin(request.headers.get("Origin"));
  return requestOrigin === allowedOrigin;
}

function normalizeOrigin(origin) {
  return String(origin || "").replace(/\/+$/, "");
}

function isJsonRequest(request) {
  return (request.headers.get("Content-Type") || "").toLowerCase().includes("application/json");
}

function validateReceberPayload(payload, env) {
  const consultorValidation = validateConsultorPayload(payload, env);
  if (!consultorValidation.valid) return consultorValidation;

  if (!isFilled(payload.formularioId)) return invalid("FormularioId ausente.");
  if (!["Rascunho", "Enviado"].includes(payload.statusFormulario)) return invalid("Status do formulario invalido.");
  if (!payload.reivindicacao || typeof payload.reivindicacao !== "object") return invalid("Reivindicacao ausente.");

  return valid();
}

function validateCarregarRascunhoPayload(payload, env) {
  const consultorValidation = validateConsultorPayload(payload, env);
  if (!consultorValidation.valid) return consultorValidation;
  if (!isFilled(payload.formularioId)) return invalid("FormularioId ausente.");
  return valid();
}

function validateConsultorPayload(payload, env) {
  const email = String(payload?.consultor?.email || "").trim().toLowerCase();
  if (!isValidEmail(email)) return invalid("E-mail do consultor invalido.");

  const allowedDomains = getAllowedEmailDomains(env);
  if (allowedDomains.length && !allowedDomains.some((domain) => email.endsWith(`@${domain}`))) {
    return invalid("Dominio de e-mail nao permitido.");
  }

  return valid();
}

function getAllowedEmailDomains(env) {
  return String(env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isFilled(value) {
  return String(value || "").trim().length > 0;
}

function valid() {
  return { valid: true };
}

function invalid(message) {
  return { valid: false, message };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parsePowerAutomateResponse(response) {
  const text = await response.text();
  if (!text.trim()) return { success: response.ok };

  try {
    return JSON.parse(text);
  } catch (error) {
    if (response.ok) {
      return { success: false, message: "Resposta invalida do servico." };
    }
    return { success: false, message: "Nao foi possivel processar a solicitacao." };
  }
}

function jsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders
  });
}
