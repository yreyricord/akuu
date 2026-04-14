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

// netlify/functions/helloasso-webhook.mjs
var helloasso_webhook_exports = {};
__export(helloasso_webhook_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(helloasso_webhook_exports);
var EVENT_LABELS = {
  Order: "\u{1F6D2} Nouvelle commande",
  Payment: "\u{1F4B3} Paiement",
  Form: "\u{1F4CB} Formulaire mis \xE0 jour",
  Organization: "\u{1F3E2} Organisation mise \xE0 jour"
};
function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const HELLOASSO_IPS = ["51.138.206.200", "4.233.135.234"];
  const sourceIp = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? event.headers["x-nf-client-connection-ip"] ?? "";
  if (sourceIp && !HELLOASSO_IPS.includes(sourceIp)) {
    console.warn(`[helloasso-webhook] IP non reconnue : ${sourceIp}`);
  }
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    console.error("[helloasso-webhook] Payload JSON invalide");
    return jsonResponse(400, { error: "Invalid JSON" });
  }
  const eventType = payload.eventType ?? "unknown";
  const label = EVENT_LABELS[eventType] ?? `\xC9v\xE9nement inconnu (${eventType})`;
  const logVerbose = process.env.HELLOASSO_WEBHOOK_LOG === "true";
  if (logVerbose) {
    console.log(`[helloasso-webhook] ${label}`, JSON.stringify(payload, null, 2));
  } else {
    const amount = payload.data?.amount;
    const orderId = payload.data?.id ?? payload.data?.orderId ?? "";
    const info = [
      label,
      amount != null ? `${(amount / 100).toFixed(2)} \u20AC` : null,
      orderId ? `#${orderId}` : null
    ].filter(Boolean).join(" \u2014 ");
    console.log(`[helloasso-webhook] ${info}`);
  }
  return jsonResponse(200, { received: true, eventType });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=helloasso-webhook.js.map
