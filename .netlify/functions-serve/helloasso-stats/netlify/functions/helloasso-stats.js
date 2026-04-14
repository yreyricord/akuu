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

// netlify/functions/helloasso-stats.mjs
var helloasso_stats_exports = {};
__export(helloasso_stats_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(helloasso_stats_exports);

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

// netlify/functions/helloasso-stats.mjs
var HELLOASSO_API = "https://api.helloasso.com/v5";
var ORG_SLUG = "akuu";
var EXCEL_CUTOFF = "2026-04-14T00:00:00.000Z";
var MUSEE_SLUG = "projet-musee";
var MUSEE_TYPE = "CrowdFunding";
var MUSEE_FORM = { type: MUSEE_TYPE, slug: MUSEE_SLUG };
var memCache = null;
var memCacheExpiry = 0;
var CACHE_TTL_MS = 5 * 60 * 1e3;
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
async function sumPayments(headers, formType, formSlug, fromDate = null) {
  let total = 0;
  let pageIndex = 1;
  const pageSize = 100;
  while (true) {
    const params = new URLSearchParams({ pageSize: String(pageSize), pageIndex: String(pageIndex) });
    if (fromDate) params.set("from", fromDate);
    const url = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/payments?${params}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    const payments = data.data ?? [];
    for (const p of payments) total += p.amount ?? 0;
    if (payments.length < pageSize) break;
    pageIndex++;
    if (pageIndex > 10) break;
  }
  return Math.round(total / 100);
}
async function getMonthlyAmount(headers, formType, formSlug) {
  const now = /* @__PURE__ */ new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return sumPayments(headers, formType, formSlug, from);
}
async function getRecentOrders(headers, formType, formSlug, formLabel, limit = 5) {
  const params = new URLSearchParams({
    pageSize: String(limit),
    sortOrder: "Desc",
    withDetails: "true"
  });
  const url = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/orders?${params}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map((order) => {
    const sumArr = (arr) => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0);
    const rawAmount = typeof order.amount === "number" && order.amount > 0 ? order.amount : sumArr(order.payments) || sumArr(order.items) || null;
    const pay0 = (order.payments ?? [])[0];
    const date = order.date || order.meta?.createdAt || order.createdAt || pay0?.date || pay0?.meta?.createdAt || null;
    return {
      date,
      amountEuros: rawAmount ? Math.round(rawAmount / 100) : null,
      firstName: order.payer?.firstName?.trim() || null,
      city: order.payer?.city?.trim() || null,
      formLabel
    };
  });
}
async function fetchHelloAssoStats(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const formsUrl = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms?pageSize=50`;
  console.log("[helloasso-stats] GET", formsUrl);
  const formsRes = await fetch(formsUrl, { headers });
  if (!formsRes.ok) {
    const body = await formsRes.text();
    console.error(`[helloasso-stats] Forms list ${formsRes.status}:`, body.slice(0, 500));
    throw new Error(`Forms list ${formsRes.status}`);
  }
  const forms = (await formsRes.json()).data ?? [];
  const getSlug = (f) => f.formSlug ?? f.slug ?? f.id;
  console.log("[helloasso-stats] forms:", forms.map((f) => `${getSlug(f)} (${f.formType})`).join(", "));
  const isMuseeForm = (f) => [MUSEE_SLUG, "projet-chapichika", "ak-ube-un-projet-akuu"].includes(getSlug(f));
  const memberForm = forms.find((f) => f.formType === "Membership");
  const memberSlug = memberForm ? getSlug(memberForm) : null;
  const opForms = forms.filter((f) => !isMuseeForm(f) && f.formType !== "Membership");
  console.log("[helloasso-stats] opForms:", opForms.map((f) => `${getSlug(f)} (${f.formType})`).join(", "));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const [memberCount, museeAmountEuros, chapiAmountEuros, ...opPairResults] = await Promise.all([
    memberSlug ? (async () => {
      let count = 0, pageIndex = 1;
      while (true) {
        const res = await fetch(`${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${memberForm.formType}/${memberSlug}/orders?pageSize=100&pageIndex=${pageIndex}`, { headers });
        if (!res.ok) return null;
        const d = await res.json();
        const items = d.data ?? [];
        const total = d.pagination?.totalCount;
        if (typeof total === "number" && total > 0) return total;
        count += items.length;
        if (items.length < 100) break;
        pageIndex++;
        if (pageIndex > 20) break;
      }
      return count || null;
    })() : Promise.resolve(null),
    sumPayments(headers, MUSEE_FORM.type, MUSEE_FORM.slug),
    sumPayments(headers, "CrowdFunding", "projet-chapichika"),
    ...opForms.flatMap((f) => {
      const slug = getSlug(f);
      return [
        sumPayments(headers, f.formType, slug, EXCEL_CUTOFF),
        getMonthlyAmount(headers, f.formType, slug)
      ];
    })
  ]);
  let newDonationsEuros = 0;
  let monthlyAmountEuros = 0;
  for (let i = 0; i < opForms.length; i++) {
    newDonationsEuros += opPairResults[i * 2] ?? 0;
    monthlyAmountEuros += opPairResults[i * 2 + 1] ?? 0;
  }
  let recentOp = [];
  for (let i = 0; i < opForms.length; i++) {
    if (i > 0) await sleep(90);
    const f = opForms[i];
    recentOp = recentOp.concat(await getRecentOrders(headers, f.formType, getSlug(f), "op", 5));
  }
  let recentMember = [];
  if (memberSlug) {
    await sleep(90);
    recentMember = await getRecentOrders(headers, memberForm.formType, memberSlug, "adhesion", 5);
  }
  await sleep(90);
  const recentChapi = await getRecentOrders(headers, "CrowdFunding", "projet-chapichika", "chapi", 5);
  await sleep(90);
  const recentMusee = await getRecentOrders(headers, MUSEE_FORM.type, MUSEE_FORM.slug, "musee", 5);
  const recentContributions = [...recentOp, ...recentMusee, ...recentMember, ...recentChapi].filter((c) => c.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    live: true,
    newDonationsEuros,
    memberCount,
    museeAmountEuros,
    chapiAmountEuros,
    monthlyAmountEuros,
    recentContributions,
    // toutes les contributions récentes (anonymisées)
    _forms: {
      op: opForms.map((f) => ({ type: f.formType, slug: getSlug(f) })),
      member: memberForm ? { type: memberForm.formType, slug: memberSlug } : null,
      musee: MUSEE_FORM
    }
  };
}
async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  const clientId = process.env.HELLOASSO_CLIENT_ID;
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
      body: JSON.stringify({ live: false, reason: "missing_credentials" })
    };
  }
  const params = new URLSearchParams(event.rawQuery || "");
  const forceRefresh = params.has("nocache");
  if (!forceRefresh && memCache && Date.now() < memCacheExpiry) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "public, max-age=600", "X-Cache": "HIT" },
      body: JSON.stringify(memCache)
    };
  }
  try {
    const token = await getHelloAssoAccessToken(clientId, clientSecret);
    const stats = await fetchHelloAssoStats(token);
    memCache = stats;
    memCacheExpiry = Date.now() + CACHE_TTL_MS;
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "public, max-age=600", "X-Cache": "MISS" },
      body: JSON.stringify(stats)
    };
  } catch (err) {
    console.error("[helloasso-stats]", err.message);
    if (memCache) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "public, max-age=60", "X-Cache": "STALE" },
        body: JSON.stringify({ ...memCache, stale: true })
      };
    }
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ live: false, reason: "api_error" })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=helloasso-stats.js.map
