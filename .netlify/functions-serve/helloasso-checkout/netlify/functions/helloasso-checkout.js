var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/helloasso-checkout.mjs
var helloasso_checkout_exports = {};
__export(helloasso_checkout_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(helloasso_checkout_exports);

// netlify/helloasso-oauth.mjs
var HELLOASSO_OAUTH = "https://api.helloasso.com/oauth2/token";
var cachedAccessToken = null;
var cachedExpiryMs = 0;
var EXPIRY_MARGIN_MS = 12e4;
var MAX_ATTEMPTS = 8;
function isHelloAssoHtmlErrorBody(text) {
  const t = text.trimStart();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) return true;
  if (t.includes("Code d'erreur") && t.includes("429")) return true;
  if (t.includes("Toutes nos excuses") && t.includes("429")) return true;
  return false;
}
async function getHelloAssoAccessToken(clientId, clientSecret) {
  if (cachedAccessToken && Date.now() < cachedExpiryMs - EXPIRY_MARGIN_MS) {
    return cachedAccessToken;
  }
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret
  });
  let lastError = (
    /** @type {Error|null} */
    null
  );
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const waitMs = Math.min(9e4, 3e3 * 2 ** (attempt - 1));
      await new Promise((r) => setTimeout(r, waitMs));
    }
    const res = await fetch(HELLOASSO_OAUTH, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    const text = await res.text();
    if (res.status === 429 || isHelloAssoHtmlErrorBody(text)) {
      lastError = new Error("HelloAsso OAuth rate limit (429 ou page HTML)");
      continue;
    }
    if (!res.ok) {
      throw new Error(`HelloAsso auth ${res.status}: ${text.slice(0, 200)}`);
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `HelloAsso auth: r\xE9ponse OAuth invalide (attendu JSON, re\xE7u ${text.slice(0, 80)}\u2026)`
      );
    }
    if (!data.access_token) {
      throw new Error("HelloAsso auth: missing access_token in response");
    }
    cachedAccessToken = data.access_token;
    const ttlSec = typeof data.expires_in === "number" && data.expires_in > 60 ? data.expires_in : 3300;
    cachedExpiryMs = Date.now() + ttlSec * 1e3;
    return cachedAccessToken;
  }
  throw new Error(
    lastError?.message ? `HelloAsso OAuth satur\xE9 apr\xE8s ${MAX_ATTEMPTS} tentatives (${lastError.message}). R\xE9essayez dans 5\u201315 minutes.` : `HelloAsso OAuth satur\xE9 \u2014 r\xE9essayez dans 5\u201315 minutes (rate limit HelloAsso).`
  );
}

// netlify/functions/helloasso-checkout.mjs
var HELLOASSO_API = "https://api.helloasso.com/v5";
var ORG_SLUG = "akuu";
var FORM_URLS = {
  fonctionnement: "https://www.helloasso.com/associations/akuu/formulaires/1",
  musee: "https://www.helloasso.com/associations/akuu/collectes/projet-musee"
};
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}
function buildFallbackUrl(destination) {
  return FORM_URLS[destination] || FORM_URLS.fonctionnement;
}
function buildMonthlyTerms(amountCents, count = 11) {
  const terms = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const day = Math.min(now.getDate(), 27);
    d.setDate(day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    terms.push({ amount: amountCents, date: `${yyyy}-${mm}-${dd}` });
  }
  return terms;
}
async function handler(event) {
  console.log("[helloasso-checkout] \u25B6 handler called, method:", event.httpMethod);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  let amountEuros, destination, frequency, durationMonths;
  try {
    const parsed = JSON.parse(event.body || "{}");
    amountEuros = parseInt(parsed.amountEuros, 10);
    destination = parsed.destination || "fonctionnement";
    frequency = parsed.frequency || "once";
    durationMonths = Math.min(12, Math.max(1, parseInt(parsed.durationMonths, 10) || 12));
    console.log("[helloasso-checkout] parsed body:", { amountEuros, destination, frequency, durationMonths });
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }
  if (!Number.isFinite(amountEuros) || amountEuros < 1) {
    return jsonResponse(400, { error: "amountEuros must be an integer >= 1" });
  }
  const clientId = process.env.HELLOASSO_CLIENT_ID;
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;
  console.log("[helloasso-checkout] clientId present:", !!clientId, "| clientSecret present:", !!clientSecret);
  if (!clientId || !clientSecret) {
    console.warn("[helloasso-checkout] \u2717 Missing credentials \u2192 fallback");
    return jsonResponse(200, {
      redirectUrl: buildFallbackUrl(destination),
      fallback: true,
      reason: "missing_credentials"
    });
  }
  const PROD_URL = "https://akuu-asso.netlify.app";
  const rawUrl = process.env.URL || PROD_URL;
  const isLocalUrl = rawUrl.startsWith("http://") || rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1");
  const siteUrl = isLocalUrl ? PROD_URL : rawUrl;
  console.log("[helloasso-checkout] rawUrl:", rawUrl, "\u2192 siteUrl:", siteUrl);
  const isMonthly = frequency === "monthly";
  const amountCents = amountEuros * 100;
  const destLabel = destination === "musee" ? "Projets AKUU" : "Fonctionnement AKUU";
  const freqLabel = isMonthly ? `Don mensuel (${durationMonths} mois)` : "Don";
  const itemName = `${freqLabel} \u2014 ${destLabel}`;
  const termCount = isMonthly ? durationMonths - 1 : 0;
  const checkoutBody = {
    totalAmount: isMonthly ? amountCents * durationMonths : amountCents,
    initialAmount: amountCents,
    itemName,
    backUrl: `${siteUrl}/soutenir`,
    errorUrl: `${siteUrl}/soutenir?status=error`,
    returnUrl: `${siteUrl}/merci?amount=${amountEuros}&dest=${destination}&freq=${frequency}`,
    containsDonation: true,
    metadata: { destination, frequency, durationMonths: String(durationMonths), amountEuros: String(amountEuros) }
  };
  if (isMonthly && termCount > 0) {
    checkoutBody.terms = buildMonthlyTerms(amountCents, termCount);
  }
  console.log("[helloasso-checkout] checkoutBody:", JSON.stringify(checkoutBody, null, 2));
  try {
    console.log("[helloasso-checkout] requesting OAuth token\u2026");
    const token = await getHelloAssoAccessToken(clientId, clientSecret);
    console.log("[helloasso-checkout] \u2713 got token (length:", token.length, ")");
    const apiUrl = `${HELLOASSO_API}/organizations/${ORG_SLUG}/checkout-intents`;
    console.log("[helloasso-checkout] POST", apiUrl);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(checkoutBody)
    });
    console.log("[helloasso-checkout] API response status:", res.status);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[helloasso-checkout] \u2717 checkout-intents error:", res.status, text);
      return jsonResponse(200, {
        redirectUrl: buildFallbackUrl(destination),
        fallback: true,
        reason: "api_error",
        debug: `${res.status} ${text}`
      });
    }
    const data = await res.json();
    console.log("[helloasso-checkout] API response data:", JSON.stringify(data));
    const redirectUrl = data.redirectUrl ?? data.checkoutUrl;
    if (!redirectUrl) {
      console.error("[helloasso-checkout] \u2717 No redirectUrl in response:", JSON.stringify(data));
      return jsonResponse(200, {
        redirectUrl: buildFallbackUrl(destination),
        fallback: true,
        reason: "no_redirect_url"
      });
    }
    console.log("[helloasso-checkout] \u2713 redirectUrl:", redirectUrl);
    return jsonResponse(200, { redirectUrl, fallback: false });
  } catch (err) {
    console.error("[helloasso-checkout] \u2717 exception:", err.message, err.stack);
    return jsonResponse(200, {
      redirectUrl: buildFallbackUrl(destination),
      fallback: true,
      reason: "exception",
      debug: err.message
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=helloasso-checkout.js.map
