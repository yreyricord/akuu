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
 *   - museeAmountEuros   : total collecté musée (cagnotte + dons Checkout « Projets » mal rattachés à l’API)
 *   - monthlyAmountEuros : dons ce mois pour le fonctionnement (hors Checkout musée)
 *
 * Cache : 5 min en mémoire (warm Lambda) + Cache-Control HTTP.
 */

import { getHelloAssoAccessToken } from '../helloasso-oauth.mjs'

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
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

/**
 * HelloAsso Checkout : les paiements peuvent être listés sous le formulaire d’exploitation
 * alors que `metadata.destination` / le libellé article visent le musée. On répartit musée vs fonctionnement.
 * @returns {'musee'|'op'|null} null = se fier au formulaire API (comportement historique)
 */
function classifyCheckoutPayload(obj) {
  if (!obj || typeof obj !== 'object') return null
  const raw = JSON.stringify(obj)
  const lower = raw.toLowerCase()
  if (raw.includes('"destination":"musee"')) return 'musee'
  if (raw.includes('"destination":"fonctionnement"')) return 'op'
  if (lower.includes('projets akuu')) return 'musee'
  if (lower.includes('fonctionnement akuu')) return 'op'
  return null
}

function labelForContribution(obj, fallbackFormLabel) {
  const c = classifyCheckoutPayload(obj)
  if (c === 'musee') return 'musee'
  if (c === 'op') return 'op'
  return fallbackFormLabel
}

function paymentDateIso(p) {
  return p.date || p.paymentDate || p.meta?.createdAt || p.order?.date || null
}

function isInCurrentMonth(iso, now = new Date()) {
  if (!iso) return false
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function isOnOrAfterExcelCutoff(iso) {
  if (!iso) return false
  return new Date(iso) >= new Date(EXCEL_CUTOFF)
}

/**
 * Agrège les paiements d’un formulaire d’exploitation en séparant les Checkout « Projets AKUU »
 * (comptés musée) du fonctionnement.
 */
async function sumOpFormPaymentsWithCheckoutSplit(headers, formType, formSlug) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const cutoffDate = new Date(EXCEL_CUTOFF)
  const fromFetch = new Date(Math.min(monthStart.getTime(), cutoffDate.getTime())).toISOString()

  let monthlyOp = 0
  let newOp = 0
  let museeMisfiled = 0
  let pageIndex = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({ pageSize: String(pageSize), pageIndex: String(pageIndex), from: fromFetch })
    const url = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${formType}/${formSlug}/payments?${params}`
    const res = await fetch(url, { headers })
    if (!res.ok) break
    const data = await res.json()
    const payments = data.data ?? []

    for (const p of payments) {
      const cents = p.amount ?? 0
      const euros = Math.round(cents / 100)
      const cls = classifyCheckoutPayload(p)
      const iso = paymentDateIso(p)

      if (cls === 'musee') {
        museeMisfiled += euros
        continue
      }

      if (iso) {
        if (isInCurrentMonth(iso, now)) monthlyOp += euros
        if (isOnOrAfterExcelCutoff(iso)) newOp += euros
      }
    }

    if (payments.length < pageSize) break
    pageIndex++
    if (pageIndex > 10) break
  }

  return { monthlyOp, newOp, museeMisfiled }
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
    const pay0 = (order.payments ?? [])[0]
    const date =
      order.date
      || order.meta?.createdAt
      || order.createdAt
      || pay0?.date
      || pay0?.meta?.createdAt
      || null
    return {
      date,
      amountEuros: rawAmount ? Math.round(rawAmount / 100) : null,
      firstName:   order.payer?.firstName?.trim() || null,
      city:        order.payer?.city?.trim()      || null,
      formLabel:   labelForContribution(order, formLabel)
    }
  })
}

async function fetchHelloAssoStats(token) {
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Découverte du formulaire de fonctionnement (formulaires-1) via la liste
  const formsUrl = `${HELLOASSO_API}/organizations/${ORG_SLUG}/forms?pageSize=50`
  console.log('[helloasso-stats] GET', formsUrl)
  const formsRes = await fetch(formsUrl, { headers })
  if (!formsRes.ok) {
    const body = await formsRes.text()
    console.error(`[helloasso-stats] Forms list ${formsRes.status}:`, body.slice(0, 500))
    throw new Error(`Forms list ${formsRes.status}`)
  }
  const forms = (await formsRes.json()).data ?? []

  // Le champ slug dans l'API HelloAsso s'appelle "formSlug"
  const getSlug = f => f.formSlug ?? f.slug ?? f.id

  console.log('[helloasso-stats] forms:', forms.map(f => `${getSlug(f)} (${f.formType})`).join(', '))

  const isMuseeForm  = f => [MUSEE_SLUG, 'projet-chapichika', 'ak-ube-un-projet-akuu'].includes(getSlug(f))
  const memberForm   = forms.find(f => f.formType === 'Membership')
  const memberSlug   = memberForm ? getSlug(memberForm) : null

  // Tous les formulaires d'exploitation (hors musee, hors adhesion)
  const opForms = forms.filter(f => !isMuseeForm(f) && f.formType !== 'Membership')
  console.log('[helloasso-stats] opForms:', opForms.map(f => `${getSlug(f)} (${f.formType})`).join(', '))

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  // 2a. Agrégats (sommes / mois / comptage adhérents) en parallèle — pas d’appels orders « récents » ici (évite le 429 HelloAsso)
  const [memberCount, museeAmountEurosBase, chapiAmountEuros, ...opSplits] = await Promise.all([
    memberSlug ? (async () => {
      let count = 0, pageIndex = 1
      while (true) {
        const res = await fetch(`${HELLOASSO_API}/organizations/${ORG_SLUG}/forms/${memberForm.formType}/${memberSlug}/orders?pageSize=100&pageIndex=${pageIndex}`, { headers })
        if (!res.ok) return null
        const d = await res.json()
        const items = d.data ?? []
        const total = d.pagination?.totalCount
        if (typeof total === 'number' && total > 0) return total
        count += items.length
        if (items.length < 100) break
        pageIndex++
        if (pageIndex > 20) break
      }
      return count || null
    })() : Promise.resolve(null),
    sumPayments(headers, MUSEE_FORM.type, MUSEE_FORM.slug),
    sumPayments(headers, 'CrowdFunding', 'projet-chapichika'),
    ...opForms.map(f => sumOpFormPaymentsWithCheckoutSplit(headers, f.formType, getSlug(f)))
  ])

  let newDonationsEuros = 0
  let monthlyAmountEuros = 0
  let museeFromCheckoutOnOpForms = 0
  for (const s of opSplits) {
    newDonationsEuros += s.newOp
    monthlyAmountEuros += s.monthlyOp
    museeFromCheckoutOnOpForms += s.museeMisfiled
  }

  const museeAmountEuros = museeAmountEurosBase + museeFromCheckoutOnOpForms

  // 2b. Dernières commandes : séquentiel avec petit délai (limite de débit HelloAsso)
  let recentOp = []
  for (let i = 0; i < opForms.length; i++) {
    if (i > 0) await sleep(90)
    const f = opForms[i]
    recentOp = recentOp.concat(await getRecentOrders(headers, f.formType, getSlug(f), 'op', 5))
  }

  let recentMember = []
  if (memberSlug) {
    await sleep(90)
    recentMember = await getRecentOrders(headers, memberForm.formType, memberSlug, 'adhesion', 5)
  }

  await sleep(90)
  const recentChapi = await getRecentOrders(headers, 'CrowdFunding', 'projet-chapichika', 'chapi', 5)

  await sleep(90)
  const recentMusee = await getRecentOrders(headers, MUSEE_FORM.type, MUSEE_FORM.slug, 'musee', 5)

  // Fusionner et trier toutes les contributions récentes (tous formulaires)
  const recentContributions = [...recentOp, ...recentMusee, ...recentMember, ...recentChapi]
    .filter(c => c.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    live:                 true,
    newDonationsEuros,
    memberCount,
    museeAmountEuros,
    chapiAmountEuros,
    monthlyAmountEuros,
    recentContributions,  // toutes les contributions récentes (anonymisées)
    _forms: {
      op:     opForms.map(f => ({ type: f.formType, slug: getSlug(f) })),
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

  // ?nocache=1 force un refresh (utilise apres un don)
  const params = new URLSearchParams(event.rawQuery || '')
  const forceRefresh = params.has('nocache')

  if (!forceRefresh && memCache && Date.now() < memCacheExpiry) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600', 'X-Cache': 'HIT' },
      body: JSON.stringify(memCache)
    }
  }

  try {
    const token = await getHelloAssoAccessToken(clientId, clientSecret)
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
