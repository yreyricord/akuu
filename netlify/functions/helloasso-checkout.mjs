/**
 * Crée un checkout HelloAsso pré-rempli (montant + libellé) et retourne
 * l'URL de paiement où le donateur n'a plus qu'à entrer sa carte.
 *
 * Supporte les dons ponctuels ET mensuels (via le champ `terms`).
 *
 * Variables Netlify (Site settings → Environment variables) :
 *   HELLOASSO_CLIENT_ID     — client_id (HelloAsso → Mon compte → Intégrations et API)
 *   HELLOASSO_CLIENT_SECRET — client_secret correspondant
 *
 * Body JSON attendu :
 *   { amountEuros: number, destination: 'fonctionnement'|'musee', frequency: 'once'|'monthly' }
 */

import { getHelloAssoAccessToken } from '../helloasso-oauth.mjs'

const HELLOASSO_API   = 'https://api.helloasso.com/v5'
const ORG_SLUG        = 'akuu'

const FORM_URLS = {
  fonctionnement: 'https://www.helloasso.com/associations/akuu/formulaires/1',
  musee:          'https://www.helloasso.com/associations/akuu/collectes/projet-musee'
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }
}

function buildFallbackUrl(destination) {
  return FORM_URLS[destination] || FORM_URLS.fonctionnement
}

/**
 * Génère le tableau `terms` pour un don mensuel.
 * @param {number} amountCents  montant de chaque échéance en centimes
 * @param {number} count        nombre d'échéances (1–11, le 1er mois est couvert par initialAmount)
 */
function buildMonthlyTerms(amountCents, count = 11) {
  const terms = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const day = Math.min(now.getDate(), 27)
    d.setDate(day)
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const dd   = String(d.getDate()).padStart(2, '0')
    terms.push({ amount: amountCents, date: `${yyyy}-${mm}-${dd}` })
  }
  return terms
}

export async function handler(event) {
  console.log('[helloasso-checkout] ▶ handler called, method:', event.httpMethod)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() }
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  let amountEuros, destination, frequency, durationMonths
  try {
    const parsed = JSON.parse(event.body || '{}')
    amountEuros    = parseInt(parsed.amountEuros, 10)
    destination    = parsed.destination    || 'fonctionnement'
    frequency      = parsed.frequency      || 'once'
    durationMonths = Math.min(12, Math.max(1, parseInt(parsed.durationMonths, 10) || 12))
    console.log('[helloasso-checkout] parsed body:', { amountEuros, destination, frequency, durationMonths })
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  if (!Number.isFinite(amountEuros) || amountEuros < 1) {
    return jsonResponse(400, { error: 'amountEuros must be an integer >= 1' })
  }

  const clientId     = process.env.HELLOASSO_CLIENT_ID
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET
  console.log('[helloasso-checkout] clientId present:', !!clientId, '| clientSecret present:', !!clientSecret)

  if (!clientId || !clientSecret) {
    console.warn('[helloasso-checkout] ✗ Missing credentials → fallback')
    return jsonResponse(200, {
      redirectUrl: buildFallbackUrl(destination),
      fallback:    true,
      reason:      'missing_credentials'
    })
  }

  const PROD_URL = 'https://akuu-asso.netlify.app'
  const rawUrl = process.env.URL || PROD_URL
  const isLocalUrl = rawUrl.startsWith('http://') || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')
  const siteUrl = isLocalUrl ? PROD_URL : rawUrl
  console.log('[helloasso-checkout] rawUrl:', rawUrl, '→ siteUrl:', siteUrl)

  const isMonthly  = frequency === 'monthly'
  const amountCents = amountEuros * 100

  const destLabel = destination === 'musee' ? 'Projets AKUU' : 'Fonctionnement AKUU'
  const freqLabel = isMonthly ? `Don mensuel (${durationMonths} mois)` : 'Don'
  const itemName = `${freqLabel} — ${destLabel}`

  const termCount = isMonthly ? durationMonths - 1 : 0
  const checkoutBody = {
    totalAmount:      isMonthly ? amountCents * durationMonths : amountCents,
    initialAmount:    amountCents,
    itemName,
    backUrl:          `${siteUrl}/soutenir`,
    errorUrl:         `${siteUrl}/soutenir?status=error`,
    returnUrl:        `${siteUrl}/merci?amount=${amountEuros}&dest=${destination}&freq=${frequency}`,
    containsDonation: true,
    metadata:         { destination, frequency, durationMonths: String(durationMonths), amountEuros: String(amountEuros) }
  }

  if (isMonthly && termCount > 0) {
    checkoutBody.terms = buildMonthlyTerms(amountCents, termCount)
  }

  console.log('[helloasso-checkout] checkoutBody:', JSON.stringify(checkoutBody, null, 2))

  try {
    console.log('[helloasso-checkout] requesting OAuth token…')
    const token = await getHelloAssoAccessToken(clientId, clientSecret)
    console.log('[helloasso-checkout] ✓ got token (length:', token.length, ')')

    const apiUrl = `${HELLOASSO_API}/organizations/${ORG_SLUG}/checkout-intents`
    console.log('[helloasso-checkout] POST', apiUrl)

    const res = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(checkoutBody)
    })

    console.log('[helloasso-checkout] API response status:', res.status)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[helloasso-checkout] ✗ checkout-intents error:', res.status, text)
      return jsonResponse(200, {
        redirectUrl: buildFallbackUrl(destination),
        fallback:    true,
        reason:      'api_error',
        debug:       `${res.status} ${text}`
      })
    }

    const data = await res.json()
    console.log('[helloasso-checkout] API response data:', JSON.stringify(data))
    const redirectUrl = data.redirectUrl ?? data.checkoutUrl

    if (!redirectUrl) {
      console.error('[helloasso-checkout] ✗ No redirectUrl in response:', JSON.stringify(data))
      return jsonResponse(200, {
        redirectUrl: buildFallbackUrl(destination),
        fallback:    true,
        reason:      'no_redirect_url'
      })
    }

    console.log('[helloasso-checkout] ✓ redirectUrl:', redirectUrl)
    return jsonResponse(200, { redirectUrl, fallback: false })
  } catch (err) {
    console.error('[helloasso-checkout] ✗ exception:', err.message, err.stack)
    return jsonResponse(200, {
      redirectUrl: buildFallbackUrl(destination),
      fallback:    true,
      reason:      'exception',
      debug:       err.message
    })
  }
}
