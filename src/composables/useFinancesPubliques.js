import { onMounted, ref } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'

const RESOURCE_CATEGORIES = [
  { id: 'subventions-et-prix', label: 'Subventions et prix', color: '#2563EB', keys: ['Subventions et prix'] },
  { id: 'dons', label: 'Dons', color: '#EA580C', keys: ['Dons'] },
  { id: 'loyer', label: 'Loyer', color: '#0D9488', keys: ['Loyers maison communautaire', 'Week-end de cohésion'] },
  { id: 'autres', label: 'Autres', color: '#9333EA', keys: [] }
]

const FRANCE_PROJECTS = new Set(['Sensibilisation', 'AKUUVision'])
const LOGISTIQUE_PROJECTS = new Set(['Fonctionnement', 'Frais bancaires', 'Autres / non affecté'])

function slugId(label) {
  return String(label || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'autre'
}

function sumKeys(obj, keys) {
  return keys.reduce((s, k) => s + (Number(obj[k]) || 0), 0)
}

/** Transforme la réponse API en structure attendue par ComptesAgView. */
export function mapFinancesPubliques(api) {
  const years = (api.years || []).map((y) => ({
    ...y,
    coverage: y.provisional ? 'Exercice en cours' : 'Journal + relevés'
  }))
  const depenses = api.depenses_par_projet || {}
  const recettes = api.recettes_par_groupe || {}
  const spent = api.totals?.spent || 0

  const terrainLines = []
  const franceLines = []
  const logistiqueLines = []
  Object.entries(depenses).forEach(([label, amount]) => {
    const line = { label, amount: Number(amount) || 0 }
    if (LOGISTIQUE_PROJECTS.has(label)) logistiqueLines.push(line)
    else if (FRANCE_PROJECTS.has(label)) franceLines.push(line)
    else terrainLines.push(line)
  })
  const sumLines = (lines) => lines.reduce((s, l) => s + l.amount, 0)
  const terrainAmt = sumLines(terrainLines)
  const franceAmt = sumLines(franceLines)
  const logistiqueAmt = sumLines(logistiqueLines)
  const destTotal = terrainAmt + franceAmt + logistiqueAmt || spent

  const destinations = [
    {
      id: 'terrain',
      label: 'Sur le terrain, dans nos projets',
      description: 'Musée, maison communautaire, cours d\'anglais et autres projets sur le terrain.',
      amount: terrainAmt,
      share: destTotal ? (terrainAmt / destTotal) * 100 : 0,
      lines: terrainLines.sort((a, b) => b.amount - a.amount)
    },
    {
      id: 'france',
      label: 'En France',
      description: 'Sensibilisation, AKUUVision et actions en France.',
      amount: franceAmt,
      share: destTotal ? (franceAmt / destTotal) * 100 : 0,
      lines: franceLines.sort((a, b) => b.amount - a.amount)
    },
    {
      id: 'logistique',
      label: 'Fonctionnement et banque',
      description: 'Site web, frais bancaires et services administratifs.',
      amount: logistiqueAmt,
      share: destTotal ? (logistiqueAmt / destTotal) * 100 : 0,
      lines: logistiqueLines.sort((a, b) => b.amount - a.amount)
    }
  ]

  const income = Object.entries(recettes)
    .map(([label, amount]) => ({ label, amount: Number(amount) || 0 }))
    .sort((a, b) => b.amount - a.amount)

  const resourceYears = years.map((y) => {
    const rg = y.recettes_groupes || {}
    const amounts = {}
    let other = 0
    RESOURCE_CATEGORIES.forEach((cat) => {
      const v = sumKeys(rg, cat.keys)
      if (cat.id === 'autres') {
        Object.entries(rg).forEach(([k, val]) => {
          const known = RESOURCE_CATEGORIES.some((c) => c.keys.includes(k))
          if (!known) other += Number(val) || 0
        })
        amounts.autres = other
      } else if (v) amounts[cat.id] = v
    })
    return { year: y.year, label: y.label, total: y.resources, amounts }
  })

  const projectCats = [...new Set(years.flatMap((y) => Object.keys(y.charges_projets || {})))]
    .filter((p) => !LOGISTIQUE_PROJECTS.has(p))
    .sort()
  const projectCategories = projectCats.map((label, i) => ({
    id: slugId(label),
    label,
    color: ['#1B400D', '#04488F', '#EA580C', '#0D9488', '#9333EA', '#CA8A04'][i % 6]
  }))
  const projectYears = years.map((y) => {
    const cp = y.charges_projets || {}
    const amounts = {}
    projectCategories.forEach((cat) => {
      const v = cp[cat.label]
      if (v) amounts[cat.id] = Number(v)
    })
    return { year: y.year, label: y.label, total: y.debits, amounts }
  })

  const slices = Object.entries(depenses)
    .filter(([label]) => !LOGISTIQUE_PROJECTS.has(label))
    .map(([label, amount]) => ({ id: slugId(label), label, amount: Number(amount) || 0 }))
    .sort((a, b) => b.amount - a.amount)
  const projectTotal = slices.reduce((s, x) => s + x.amount, 0)

  const logisticsHistory = years.map((y) => {
    const cp = y.charges_projets || {}
    const site = Number(cp.Fonctionnement) || 0
    const bank = Number(cp['Frais bancaires']) || 0
    const autres = Number(cp['Autres / non affecté']) || 0
    return {
      year: y.year,
      label: y.label,
      total: site + bank + autres,
      lines: [
        { label: 'Site web et hébergement', amount: site },
        { label: 'Frais bancaires', amount: bank },
        { label: 'Autres outils et services', amount: autres }
      ].filter((l) => l.amount > 0)
    }
  }).filter((y) => y.total > 0)

  const closed = logisticsHistory.filter((y) => y.year < new Date().getFullYear())
  const avgTotal = closed.length ? closed.reduce((s, y) => s + y.total, 0) / closed.length : 0
  const avgLines = ['Site web et hébergement', 'Frais bancaires', 'Autres outils et services'].map((label) => ({
    label,
    amount: closed.length
      ? closed.reduce((s, y) => s + (y.lines.find((l) => l.label === label)?.amount || 0), 0) / closed.length
      : 0
  }))

  return {
    meta: {
      generatedAt: api.generated_at,
      periodLabel: api.meta?.periodLabel || '',
      notes: api.meta?.notes || []
    },
    totals: {
      received: api.totals?.received ?? 0,
      spent: api.totals?.spent ?? 0,
      resources: api.totals?.resources ?? 0,
      bankBalance: api.totals?.bankBalance ?? 0,
      cashAfterEngagements: api.totals?.bankBalance ?? 0
    },
    years,
    destinations,
    categoryFlows: {
      resources: { categories: RESOURCE_CATEGORIES.map(({ id, label, color }) => ({ id, label, color })), years: resourceYears },
      projects: { categories: projectCategories, years: projectYears }
    },
    projectSpending: { total: projectTotal, slices },
    income,
    logisticsHistory,
    logisticsByYear: logisticsHistory,
    logisticsAverage: {
      periodLabel: closed.length ? `${closed[0]?.year}–${closed.at(-1)?.year}` : '',
      total: avgTotal,
      lines: avgLines
    },
    logisticsOtherNote: 'Montants issus du journal (postes Fonctionnement et frais bancaires).',
    projectClassification: { unconfirmedItems: [], unconfirmedAmount: 0 },
    projects: []
  }
}

export function useFinancesPubliques() {
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const live = ref(false)

  onMounted(async () => {
    try {
      const api = await tresorerieApi.getFinancesPubliques()
      if (api?.years?.length) {
        data.value = mapFinancesPubliques(api)
        live.value = true
      } else {
        error.value = 'Données indisponibles'
      }
    } catch (e) {
      error.value = e?.message || 'Connexion impossible'
    } finally {
      loading.value = false
    }
  })

  return { data, loading, error, live }
}
