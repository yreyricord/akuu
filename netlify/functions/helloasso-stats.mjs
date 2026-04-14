/**
 * Retourne les statistiques live de l'association AKUU depuis l'API HelloAsso.
 *
 * Variables Netlify (Site settings → Environment variables) :
 *   HELLOASSO_CLIENT_ID     — client_id (HelloAsso → Mon compte → Intégrations et API)
 *   HELLOASSO_CLIENT_SECRET — client_secret correspondant
 *
 * Données retournées :
 *   - newDonationsEuros  : dons reçus après la date de gel du fichier comptable (EXCEL_CUTOFF)
 *   - memberCount        : nombre d'adhérents actifs
 *   - museeAmountEuros   : total collecté sur projet-musee  (objectif 25 000 €)
 *   - monthlyAmountEuros : dons reçus ce mois sur formulaires-1 (objectif 350 €/mois)
 *
 * Cache : 10 min en mémoire (warm Lambda) + Cache-Control 600 s HTTP.
 */

const HELLOASSO_OAUTH = 'https://api.helloasso.com/oauth2/token'
const HELLOASSO_API   = 'https://api.helloasso.com/v5'
const ORG_SLUG        = 'akuu'

// Date de gel du fichier comptable Excel (recettes_dons_2017-2026).
// Seuls les dons APRÈS cette date sont ajoutés au total historique.
const EXCEL_CUTOFF = '2026-04-14T00:00:00.000Z'

// Formulaire projet musée (cagnotte active)
// URL : https://www.helloasso.com/associations/akuu/collectes/projet-musee
const MUSEE_SLUG = 'projet-musee'
const MUSEE_TYPE = 'CrowdFunding'
const MUSEE_FORM = { type: MUSEE_TYPE, slug: MUSEE_SLUG }

// Cache en mémoire — survit aux invocations warm sur la même instance Lambda
let memCache = null
let memCacheExpiry = 0
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

/** Obtient un access_token via client_credentials */
async function getAccessToken(clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret
  })
  const res = await fetch(HELLOASSO_OAUTH, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString()
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HelloAsso auth ${res.status}: ${text}`)
  }
  const data = await res.json()
  return data.access_token
}

/**
 * Somme tous les paiements autorisés d'un formulaire (avec pagination).
 * Utilisé à la fois pour le total global (musée) et le mensuel (fonctionnement).
 */
async function sumPayments(headers, formType, formSlug, fromDate = null) {
  let total = 0
  let pageIndex = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({ pageSize: String(pageSize), pageIndex: String(pageIndex) })
    if (fromDate) params.set('from', fromDate)
    const url = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/payments?${params}`
    const res = await fetch(url, { headers })
    if (!res.ok) break
    const data = await res.json()
    const payments = data.data ?? []
    for (const p of payments) total += p.amount ?? 0
    // Fin si on a moins d'une page complète
    if (payments.length < pageSize) break
    pageIndex++
    // Sécurité : max 10 pages (1000 paiements)
    if (pageIndex > 10) break
  }
  return Math.round(total / 100) // centimes → euros
}

/** Somme des paiements du mois en cours sur un formulaire */
async function getMonthlyAmount(headers, formType, formSlug) {
  const now  = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  return sumPayments(headers, formType, formSlug, from)
}

/**
 * Récupère les N dernières commandes d'un formulaire et les anonymise.
 * Chaque contribution retournée : { date, amountEuros, firstName, city, formLabel }
 */
async function getRecentOrders(headers, formType, formSlug, formLabel, limit = 5) {
  const params = new URLSearchParams({
    pageSize:    String(limit),
    sortOrder:   'Desc',
    withDetails: 'true'
  })
  const url = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/orders?${params}`
  const res = await fetch(url, { headers })
  if (!res.ok) return []
  const data = await res.json()

  return (data.data ?? []).map(order => {
    // Cherche le montant dans order.amount, puis payments, puis items
    const sumArr = arr => (arr ?? []).reduce((s, x) => s + (x.amount ?? 0), 0)
    const rawAmount = (typeof order.amount === 'number' && order.amount > 0)
      ? order.amount
      : (sumArr(order.payments) || sumArr(order.items) || null)
    return {
      date:        order.date ?? null,
      amountEuros: rawAmount ? Math.round(rawAmount / 100) : null,
      firstName:   order.payer?.firstName?.trim() || null,
      city:        order.payer?.city?.trim()      || null,
      formLabel
    }
  })
}

async function fetchHelloAssoStats(token) {
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Découverte du formulaire de fonctionnement (formulaires-1) via la liste
  const formsRes = await fetch(
    `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms?pageSize=50`,
    { headers }
  )
  if (!formsRes.ok) throw new Error(`Forms list ${formsRes.status}`)
  const forms = (await formsRes.json()).data ?? []

  // Le champ slug dans l'API HelloAsso s'appelle "formSlug"
  const getSlug = f => f.formSlug ?? f.slug ?? f.id

  console.log('[helloasso-stats] forms:', forms.map(f => `${getSlug(f)} (${f.formType})`).join(', '))

  // Formulaire de fonctionnement : on exclut explicitement le formulaire musée
  const isMuseeForm  = f => getSlug(f) === MUSEE_SLUG
  const opForm       = forms.find(f => !isMuseeForm(f) && getSlug(f) === 'formulaires-1')
                    ?? forms.find(f => !isMuseeForm(f) && f.formType === 'Donation')
                    ?? forms.find(f => !isMuseeForm(f) && f.formType === 'PaymentForm')
                    ?? forms.find(f => !isMuseeForm(f) && f.formType !== 'CrowdFunding' && f.formType !== 'Membership')
  const memberForm   = forms.find(f => f.formType === 'Membership')

  // Résolution des slugs réels depuis les objets formulaire
  const opSlug     = opForm     ? getSlug(opForm)     : null
  const memberSlug = memberForm ? getSlug(memberForm) : null

  // 2. Toutes les requêtes en parallèle
  const [newDonationsEuros, memberCount, museeAmountEuros, monthlyAmountEuros, recentOp, recentMusee] = await Promise.all([
    // Dons reçus APRÈS la date de gel du fichier comptable Excel (évite le double-comptage)
    opSlug     ? sumPayments(headers, opForm.formType, opSlug, EXCEL_CUTOFF)     : Promise.resolve(0),
    // Nombre d'adhérents = nombre de commandes sur le formulaire adhésion
    // HelloAsso retourne -1 pour totalCount sur certains endpoints → on compte manuellement
    memberSlug ? (async () => {
      let count = 0, pageIndex = 1
      while (true) {
        const res = await fetch(`${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${memberForm.formType}/${memberSlug}/orders?pageSize=100&pageIndex=${pageIndex}`, { headers })
        if (!res.ok) return null
        const d = await res.json()
        const items = d.data ?? []
        // Essayer totalCount en premier (disponible sur certaines configs)
        const total = d.pagination?.totalCount
        if (typeof total === 'number' && total > 0) return total
        count += items.length
        if (items.length < 100) break
        pageIndex++
        if (pageIndex > 20) break // sécurité : max 2000 membres
      }
      return count || null
    })()                                                                          : Promise.resolve(null),
    // Total collecté sur le projet musée (tous les paiements)
    sumPayments(headers, MUSEE_FORM.type, MUSEE_FORM.slug),
    // Paiements du mois en cours sur le formulaire de fonctionnement
    opSlug     ? getMonthlyAmount(headers, opForm.formType, opSlug)              : Promise.resolve(null),
    opSlug     ? getRecentOrders(headers, opForm.formType, opSlug, 'op', 5)      : Promise.resolve([]),
    getRecentOrders(headers, MUSEE_FORM.type, MUSEE_FORM.slug, 'musee', 5)
  ])

  // Fusionner et trier les contributions récentes des 2 formulaires (5 max)
  const recentContributions = [...recentOp, ...recentMusee]
    .filter(c => c.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return {
    live:                 true,
    newDonationsEuros,    // dons après EXCEL_CUTOFF sur formulaires-1 (s'ajoute à la base Excel)
    memberCount,          // nombre d'adhérents
    museeAmountEuros,     // total collecté sur projet-musee (/ 25 000 €)
    monthlyAmountEuros,   // dons ce mois sur formulaires-1 (/ 350 €/mois)
    recentContributions,  // 5 dernières contributions (anonymisées)
    _forms: {
      op:     opForm     ? { type: opForm.formType,     slug: opSlug     } : null,
      member: memberForm ? { type: memberForm.formType, slug: memberSlug } : null,
      musee:  MUSEE_FORM
    }
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() }
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const clientId     = process.env.HELLOASSO_CLIENT_ID
  const clientSecret = process.env.HELLOASSO_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      body: JSON.stringify({ live: false, reason: 'missing_credentials' })
    }
  }

  // Servir depuis le cache mémoire si encore valide
  if (memCache && Date.now() < memCacheExpiry) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', 'X-Cache': 'HIT' },
      body: JSON.stringify(memCache)
    }
  }

  try {
    const token = await getAccessToken(clientId, clientSecret)
    const stats = await fetchHelloAssoStats(token)

    memCache       = stats
    memCacheExpiry = Date.now() + CACHE_TTL_MS

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', 'X-Cache': 'MISS' },
      body: JSON.stringify(stats)
    }
  } catch(err) {
    console.error('[helloasso-stats]', err.message)
    if (memCache) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'X-Cache': 'STALE' },
        body: JSON.stringify({ ...memCache, stale: true })
      }
    }
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ live: false, reason: 'api_error' })
    }
  }
}
