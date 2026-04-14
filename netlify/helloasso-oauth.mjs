/**
 * Jeton OAuth HelloAsso mis en cache entre invocations (instance Lambda warm).
 * Limite les POST sur /oauth2/token — cause fréquente des 429 en dev (reload + stats + checkout).
 *
 * HelloAsso / Cloudflare peut renvoyer une page HTML « Code d'erreur : 429 » avec **HTTP 200** :
 * il faut la détecter et backoff, pas parser en JSON.
 *
 * Fichier sous netlify/ (hors netlify/functions/) pour éviter qu'il soit pris pour une fonction Netlify.
 */

const HELLOASSO_OAUTH = 'https://api.helloasso.com/oauth2/token'

/** @type {string|null} */
let cachedAccessToken = null
/** @type {number} fin de validité (timestamp ms) */
let cachedExpiryMs = 0

const EXPIRY_MARGIN_MS = 120_000 // rafraîchir 2 min avant la fin

const MAX_ATTEMPTS = 8

/**
 * Réponse HTML d'erreur (souvent 429) renvoyée avec status 200 par le CDN HelloAsso.
 * @param {string} text
 */
function isHelloAssoHtmlErrorBody(text) {
  const t = text.trimStart()
  if (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) return true
  if (t.includes('Code d\'erreur') && t.includes('429')) return true
  if (t.includes('Toutes nos excuses') && t.includes('429')) return true
  return false
}

/**
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>}
 */
export async function getHelloAssoAccessToken(clientId, clientSecret) {
  if (cachedAccessToken && Date.now() < cachedExpiryMs - EXPIRY_MARGIN_MS) {
    return cachedAccessToken
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret
  })

  let lastError = /** @type {Error|null} */ (null)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const waitMs = Math.min(90_000, 3_000 * 2 ** (attempt - 1))
      await new Promise(r => setTimeout(r, waitMs))
    }

    const res = await fetch(HELLOASSO_OAUTH, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString()
    })

    const text = await res.text()

    if (res.status === 429 || isHelloAssoHtmlErrorBody(text)) {
      lastError = new Error('HelloAsso OAuth rate limit (429 ou page HTML)')
      continue
    }

    if (!res.ok) {
      throw new Error(`HelloAsso auth ${res.status}: ${text.slice(0, 200)}`)
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(
        `HelloAsso auth: réponse OAuth invalide (attendu JSON, reçu ${text.slice(0, 80)}…)`
      )
    }

    if (!data.access_token) {
      throw new Error('HelloAsso auth: missing access_token in response')
    }

    cachedAccessToken = data.access_token
    const ttlSec = typeof data.expires_in === 'number' && data.expires_in > 60
      ? data.expires_in
      : 3300
    cachedExpiryMs = Date.now() + ttlSec * 1000
    return cachedAccessToken
  }

  throw new Error(
    lastError?.message
      ? `HelloAsso OAuth saturé après ${MAX_ATTEMPTS} tentatives (${lastError.message}). Réessayez dans 5–15 minutes.`
      : `HelloAsso OAuth saturé — réessayez dans 5–15 minutes (rate limit HelloAsso).`
  )
}
