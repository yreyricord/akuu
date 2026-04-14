/**
 * Endpoint webhook HelloAsso — reçoit les notifications de paiement en temps réel.
 *
 * HelloAsso envoie un POST à cette URL à chaque événement (paiement, commande, etc.).
 * Il faut obligatoirement répondre HTTP 200, sinon HelloAsso retente jusqu'à 16 fois
 * (délai exponentiel : 3 s, 6 s, 12 s … jusqu'à ~48 h).
 *
 * Configuration (HelloAsso → Mon compte → Intégrations et API → URL de notification) :
 *   https://<ton-site>.netlify.app/.netlify/functions/helloasso-webhook
 *
 * IPs HelloAsso à autoriser (si tu ajoutes un firewall) :
 *   Production : 51.138.206.200
 *   Sandbox    : 4.233.135.234
 *
 * Variable optionnelle (extensions futures) :
 *   HELLOASSO_WEBHOOK_LOG=true  → affiche le payload complet dans les logs Netlify
 */

// Types d'événements HelloAsso
const EVENT_LABELS = {
  Order:        '🛒 Nouvelle commande',
  Payment:      '💳 Paiement',
  Form:         '📋 Formulaire mis à jour',
  Organization: '🏢 Organisation mise à jour'
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}

export async function handler(event) {
  // Seules les requêtes POST sont attendues de HelloAsso
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  // Vérification optionnelle de l'IP source HelloAsso
  const HELLOASSO_IPS = ['51.138.206.200', '4.233.135.234']
  const sourceIp = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
                ?? event.headers['x-nf-client-connection-ip']
                ?? ''

  if (sourceIp && !HELLOASSO_IPS.includes(sourceIp)) {
    // On log l'IP inconnue mais on accepte quand même (pour éviter de bloquer
    // des tests légitimes depuis votre propre IP ou lors du développement)
    console.warn(`[helloasso-webhook] IP non reconnue : ${sourceIp}`)
  }

  // Parser le payload
  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    console.error('[helloasso-webhook] Payload JSON invalide')
    return jsonResponse(400, { error: 'Invalid JSON' })
  }

  const eventType = payload.eventType ?? 'unknown'
  const label     = EVENT_LABELS[eventType] ?? `Événement inconnu (${eventType})`

  // Log structuré dans les fonctions Netlify (visible dans Site → Functions → logs)
  const logVerbose = process.env.HELLOASSO_WEBHOOK_LOG === 'true'
  if (logVerbose) {
    console.log(`[helloasso-webhook] ${label}`, JSON.stringify(payload, null, 2))
  } else {
    // Log minimal : type + montant si disponible
    const amount  = payload.data?.amount
    const orderId = payload.data?.id ?? payload.data?.orderId ?? ''
    const info    = [
      label,
      amount  != null ? `${(amount / 100).toFixed(2)} €` : null,
      orderId ? `#${orderId}` : null
    ].filter(Boolean).join(' — ')
    console.log(`[helloasso-webhook] ${info}`)
  }

  // ── Extensions futures ────────────────────────────────────────────────────
  //
  // 1. Déclencher un rebuild Netlify pour forcer le rafraîchissement des stats :
  //    const buildHookUrl = process.env.NETLIFY_BUILD_HOOK_URL
  //    if (buildHookUrl && eventType === 'Payment') {
  //      await fetch(buildHookUrl, { method: 'POST' }).catch(() => {})
  //    }
  //
  // 2. Envoyer une notification email (ex: via Resend ou Brevo) :
  //    if (eventType === 'Order') { await sendNotificationEmail(payload) }
  //
  // 3. Mettre à jour une base de données externe (Supabase, etc.)
  // ─────────────────────────────────────────────────────────────────────────

  // Réponse 200 obligatoire pour HelloAsso (évite les retentatives)
  return jsonResponse(200, { received: true, eventType })
}
