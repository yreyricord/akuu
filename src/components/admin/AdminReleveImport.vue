<template>
  <div class="space-y-4">
  <section
    class="rounded-2xl border-2 border-ochre-300 bg-ochre-50/80 p-5 shadow-sm"
    role="region"
    aria-label="Dépôt de relevé bancaire"
  >
    <div class="flex flex-wrap items-start gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ochre-200 text-lg">
        🏦
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-wide text-ochre-800">Relevés bancaires</p>
        <h3 class="mt-0.5 font-serif text-lg font-bold text-night">{{ headline }}</h3>
        <p class="mt-1 text-sm text-night-600">
          {{ presentCount }} / {{ expectedCount }} mois couverts
          <span v-if="resolvedMissing.length"> · {{ resolvedMissing.length }} à déposer</span>
        </p>
      </div>
      <p v-if="lastReleve" class="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-forest-700 ring-1 ring-leaf/30">
        Dernier relevé : {{ lastReleve.mois }}
      </p>
    </div>

    <ul v-if="resolvedMissing.length" class="mt-4 space-y-2">
      <li
        v-for="item in resolvedMissing"
        :key="item.month"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ochre-200 bg-white px-4 py-3"
      >
        <span class="text-sm font-medium text-night">{{ item.label }}</span>
        <span class="text-xs text-night-400">{{ item.suggested_filename }}</span>
      </li>
    </ul>

    <div class="mt-4 grid gap-3 sm:grid-cols-2">
      <label class="block space-y-1">
        <span class="text-xs font-semibold uppercase tracking-wide text-night-400">Mois</span>
        <select id="releve-month" name="releve_month" v-model="selectedMonth" class="admin-input w-full py-2 text-sm" :disabled="reading || sending">
          <optgroup v-if="resolvedMissing.length" label="À déposer">
            <option v-for="item in resolvedMissing" :key="item.month" :value="monthKey(item.month)">
              {{ item.label }}
            </option>
          </optgroup>
          <optgroup v-if="depositedMonths.length" label="Déjà déposés (remplacer)">
            <option v-for="item in depositedMonths" :key="item.month" :value="monthKey(item.month)">
              {{ item.label }}
            </option>
          </optgroup>
        </select>
      </label>
      <label class="block space-y-1">
        <span class="text-xs font-semibold uppercase tracking-wide text-night-400">PDF relevé</span>
        <input
          id="releve-pdf"
          name="releve_pdf"
          ref="fileInput"
          type="file"
          accept="application/pdf,.pdf"
          class="block w-full text-sm text-night-600 file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-50"
          :disabled="!selectedMonth || reading || sending"
          @change="onFile"
        />
      </label>
    </div>

    <p
      v-if="isReplaceMonth"
      class="mt-3 rounded-xl border border-bleu-200 bg-bleu-50 px-4 py-3 text-sm text-bleu-900"
      role="status"
    >
      <strong>Remplacement</strong> — ce mois a déjà un relevé déposé.
      Les écritures banque importées pour {{ selectedMonthLabel }} seront effacées puis recréées depuis le PDF
      (saisies provisoires comprises).
    </p>

    <p v-if="reading" class="mt-3 text-sm text-night-500">Lecture du relevé…</p>
    <p v-if="error" class="mt-3 text-sm text-terracotta-700" role="alert">{{ error }}</p>

    <details class="mt-3 rounded-xl bg-white/60 px-4 py-2 text-sm">
      <summary class="flex min-h-[40px] cursor-pointer items-center font-semibold text-forest-700">Comment ça marche ?</summary>
      <ol class="list-decimal space-y-1 pb-3 pl-5 text-night-600">
        <li>Choisissez le <strong>mois</strong> ci-dessus (par défaut : le premier manquant).</li>
        <li>Sur le site du Crédit Coopératif, téléchargez le relevé de ce mois en PDF.</li>
        <li>Choisissez le fichier : le site le lit, rien n'est encore enregistré.</li>
        <li>Vérifiez le bandeau vert « le calcul tombe juste » : il prouve qu'aucune opération n'a été oubliée.</li>
        <li>Corrigez si besoin la catégorie et le projet de chaque ligne. « À préciser plus tard » est permis.</li>
        <li>Les lignes grisées sont déjà dans le journal (autre mois) : elles ne seront pas ajoutées deux fois.</li>
        <li>Pour <strong>remplacer</strong> un mois déjà déposé : choisissez-le dans « Déjà déposés (remplacer) » — les écritures banque de ce mois seront refaites.</li>
        <li>Cliquez « Ajouter au journal » : les lignes entrent dans le journal Google et le PDF est rangé sur le Drive.</li>
      </ol>
    </details>
  </section>

  <!-- Relevé illisible (scanné) -->
  <div v-if="manual" class="mt-4 space-y-3 rounded-2xl border border-ochre-200 bg-ochre-50 p-5">
    <p class="text-sm text-night">
      Recopiez la date et le solde de fin indiqués sur le relevé (« SOLDE CREDITEUR AU … »). Le PDF sera rangé sur le Drive
      et servira au rapprochement. Les opérations du mois se saisissent ensuite dans le journal Google.
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Date de fin (JJ/MM/AAAA)</span>
        <input id="releve-manual-date" name="releve_manual_date" v-model.trim="manualDate" type="text" inputmode="numeric" class="admin-input w-full py-2 text-sm" :placeholder="manualDatePlaceholder" />
      </label>
      <label class="space-y-1">
        <span class="text-xs font-bold uppercase tracking-wide text-night-500">Solde de fin (€)</span>
        <input id="releve-manual-solde" name="releve_manual_solde" v-model.trim="manualSolde" type="text" inputmode="decimal" class="admin-input w-full py-2 text-sm" placeholder="1 341,17" />
      </label>
    </div>
    <button type="button" class="btn-primary" :disabled="sending || !file || !manualOk" @click="sendManual">
      {{ sending ? (isReplaceMonth ? 'Remplacement…' : 'Envoi…') : isReplaceMonth ? `Remplacer le relevé de ${selectedMonthLabel}` : `Déposer le relevé de ${selectedMonthLabel}` }}
    </button>
    <p
      v-if="sendError && manual"
      ref="sendFeedbackRef"
      class="rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-800"
      role="alert"
    >
      <strong>Enregistrement impossible.</strong> {{ sendError }}
    </p>
  </div>
  <button
    v-else-if="file && !reading && !releve"
    type="button"
    class="mt-3 text-sm font-semibold text-bleu underline"
    @click="manual = true"
  >
    Le relevé n'est pas lu ? Saisir le solde à la main
  </button>

  <section v-if="releve" class="mt-4 rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-cream-100 px-4 py-3 text-sm">
      <span>Relevé <strong>{{ selectedMonthLabel }}</strong> · fin au <strong>{{ releve.date_fin }}</strong></span>
      <span>Solde début <strong class="tabular-nums">{{ eur(releve.solde_debut) }}</strong></span>
      <span>Solde fin <strong class="tabular-nums">{{ eur(releve.solde_fin) }}</strong></span>
      <span :class="check.ok ? 'text-forest-700' : 'text-terracotta-700'" class="font-semibold">
        {{ check.ok ? '✓ Opérations complètes (le calcul tombe juste)' : `Écart de ${eur(check.ecart)} : relevé mal lu, vérifiez` }}
      </span>
    </div>

    <div class="mt-4 space-y-3 md:hidden">
      <article
        v-for="(o, i) in ops"
        :key="`m-${i}`"
        class="rounded-xl border border-night-100 bg-cream-50 p-4"
        :class="o.duplicate ? 'opacity-50' : ''"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs font-semibold tabular-nums text-night-500">{{ o.date.slice(8, 10) }}/{{ o.date.slice(5, 7) }}</p>
            <p class="mt-1 text-sm font-medium leading-snug">{{ o.label }}</p>
            <p v-if="o.duplicate" class="mt-1 text-xs font-semibold text-night-500">Déjà dans le journal</p>
          </div>
          <p
            class="shrink-0 text-sm font-bold tabular-nums"
            :class="o.amount > 0 ? 'text-forest-700' : 'text-night'"
          >
            {{ o.amount > 0 ? '+' : '−' }}{{ eur(Math.abs(o.amount)) }}
          </p>
        </div>
        <div class="mt-3 grid gap-2">
          <label class="block text-xs font-semibold text-night-500">
            Catégorie
            <select :id="`releve-op-${i}-category`" :name="`releve_op_${i}_category`" v-model="o.category" class="admin-input mt-1 w-full text-base" :disabled="o.duplicate">
              <option v-for="c in (o.amount > 0 ? RECETTE_CATEGORIES : DEPENSE_CATEGORIES)" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block text-xs font-semibold text-night-500">
            Projet
            <select
              :id="`releve-op-${i}-project`"
              :name="`releve_op_${i}_project`"
              v-model="o.project"
              class="admin-input mt-1 w-full text-base"
              :class="!o.project && !o.duplicate ? 'border-ochre-400' : ''"
              :disabled="o.duplicate"
            >
              <option value="">À préciser plus tard</option>
              <option v-for="p in JOURNAL_PROJECTS" :key="p.code" :value="p.code">{{ p.label }}</option>
            </select>
          </label>
        </div>
      </article>
    </div>

    <div class="mt-4 hidden overflow-x-auto md:block">
      <table class="w-full min-w-[720px] text-sm">
        <thead>
          <tr class="border-b border-night-100 text-left text-xs font-bold uppercase tracking-wide text-night-500">
            <th scope="col" class="py-2 pr-2">Date</th>
            <th scope="col" class="py-2 pr-2">Libellé</th>
            <th scope="col" class="py-2 pr-2 text-right">Montant</th>
            <th scope="col" class="py-2 pr-2">Catégorie</th>
            <th scope="col" class="py-2">Projet</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(o, i) in ops" :key="i" class="border-b border-night-50" :class="o.duplicate ? 'opacity-50' : ''">
            <td class="whitespace-nowrap py-2 pr-2 tabular-nums">{{ o.date.slice(8, 10) }}/{{ o.date.slice(5, 7) }}</td>
            <td class="py-2 pr-2">
              <span class="line-clamp-2">{{ o.label }}</span>
              <span v-if="o.duplicate" class="text-xs font-semibold text-night-500">déjà dans le journal, ignorée</span>
            </td>
            <td class="whitespace-nowrap py-2 pr-2 text-right font-semibold tabular-nums" :class="o.amount > 0 ? 'text-forest-700' : ''">
              {{ o.amount > 0 ? '+' : '−' }}{{ eur(Math.abs(o.amount)) }}
            </td>
            <td class="py-2 pr-2">
              <select :id="`releve-op-d-${i}-category`" :name="`releve_op_d_${i}_category`" v-model="o.category" class="admin-input w-full min-w-[11rem] py-1.5 text-xs" :disabled="o.duplicate" :aria-label="`Catégorie ${o.label}`">
                <option v-for="c in (o.amount > 0 ? RECETTE_CATEGORIES : DEPENSE_CATEGORIES)" :key="c" :value="c">{{ c }}</option>
              </select>
            </td>
            <td class="py-2">
              <select
                :id="`releve-op-d-${i}-project`"
                :name="`releve_op_d_${i}_project`"
                v-model="o.project"
                class="admin-input w-full min-w-[10rem] py-1.5 text-xs"
                :class="!o.project && !o.duplicate ? 'border-ochre-400' : ''"
                :disabled="o.duplicate"
                :aria-label="`Projet ${o.label}`"
              >
                <option value="">À préciser plus tard</option>
                <option v-for="p in JOURNAL_PROJECTS" :key="p.code" :value="p.code">{{ p.label }}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p
      v-if="!toAdd.length && ops.length && !isReplaceMonth"
      class="mt-4 rounded-xl border border-bleu-200 bg-bleu-50 px-4 py-3 text-sm text-bleu-900"
      role="status"
    >
      Toutes les opérations de ce relevé sont déjà dans le journal (lignes grisées).
      Vous pouvez quand même <strong>enregistrer le PDF</strong> pour le rapprochement bancaire.
    </p>
    <p
      v-else-if="isReplaceMonth && releve"
      class="mt-4 rounded-xl border border-bleu-200 bg-bleu-50 px-4 py-3 text-sm text-bleu-900"
      role="status"
    >
      En confirmant, les écritures banque de {{ selectedMonthLabel }} seront effacées puis recréées
      ({{ ops.length }} opération(s) depuis le PDF).
    </p>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="btn-primary"
        :disabled="sending || !releve || (!isReplaceMonth && !toAdd.length && !check.ok)"
        @click="send"
      >
        {{
          sending
            ? (isReplaceMonth ? 'Remplacement…' : 'Enregistrement…')
            : isReplaceMonth && toAdd.length
              ? `Remplacer le relevé (${toAdd.length} opération(s))`
              : isReplaceMonth
                ? 'Remplacer le relevé (PDF + soldes)'
                : toAdd.length
                  ? `Ajouter ${toAdd.length} opération(s) au journal`
                  : 'Enregistrer le relevé (PDF uniquement)'
        }}
      </button>
      <span v-if="dupCount" class="text-sm text-night-500">{{ dupCount }} déjà présente(s)</span>
    </div>

    <p
      v-if="sendError"
      ref="sendFeedbackRef"
      class="mt-4 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-800"
      role="alert"
    >
      <strong>Enregistrement impossible.</strong> {{ sendError }}
      <span v-if="sendErrorCode === 'UNAUTHORIZED'" class="mt-1 block">
        Votre session a expiré — reconnectez-vous puis réessayez.
      </span>
    </p>
  </section>

  <p
    v-if="result"
    ref="sendFeedbackRef"
    class="mt-4 rounded-xl border border-forest/30 bg-forest-100 px-4 py-3 text-sm text-forest-800"
    role="status"
  >
    <template v-if="result.replaced && result.cleared">
      Relevé {{ result.month }}/{{ result.year }} <strong>remplacé</strong> :
      {{ result.cleared }} ancienne(s) écriture(s) effacée(s),
      {{ result.added }} ajoutée(s)<span v-if="result.skipped">, {{ result.skipped }} ignorée(s)</span>.
    </template>
    <template v-else>
      Relevé {{ result.month }}/{{ result.year }} enregistré : {{ result.added }} opération(s) ajoutée(s),
      {{ result.skipped }} déjà présente(s).
    </template>
    PDF rangé :
    <a v-if="result.url" :href="result.url" target="_blank" rel="noopener noreferrer" class="font-semibold underline">{{ result.file_name }}</a>
    <span v-else>{{ result.file_name }}</span>.
  </p>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { parseReleve, checkReleve } from '@/utils/releveParser.js'
import { suggest, RECETTE_CATEGORIES, DEPENSE_CATEGORIES, JOURNAL_PROJECTS } from '@/utils/releveCategories.js'

const MOIS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const props = defineProps({
  year: { type: String, required: true },
  existingRows: { type: Array, default: () => [] },
  lastReleve: { type: Object, default: null },
  /** releves_status fusionné (JSON + API live) */
  status: { type: Object, default: null }
})
const emit = defineEmits(['imported'])

const file = ref(null)
const fileInput = ref(null)
const sendFeedbackRef = ref(null)
const reading = ref(false)
const error = ref('')
const sendError = ref('')
const sendErrorCode = ref('')
const releve = ref(null)
const ops = ref([])
const sending = ref(false)
const result = ref(null)
const manual = ref(false)
const manualDate = ref('')
const manualSolde = ref('')
const selectedMonth = ref('')

const expectedCount = computed(() => props.status?.expected ?? 12)
const allMissing = computed(() => props.status?.missing ?? [])
const resolvedMissing = computed(() => allMissing.value)
const presentCount = computed(() => props.status?.months_present?.length ?? Math.max(0, expectedCount.value - resolvedMissing.value.length))

const headline = computed(() => {
  const todo = resolvedMissing.value.length
  if (todo) return `Il manque ${todo} relevé(s) bancaire(s)`
  return props.status?.label ?? 'Relevés bancaires'
})

const depositedMonths = computed(() => {
  const present = new Set(props.status?.months_present ?? [])
  return [...present]
    .sort((a, b) => a - b)
    .map((m) => ({
      month: m,
      label: `${MOIS_LONG[m - 1]} ${props.year}`,
      suggested_filename: `${props.year}_${String(m).padStart(2, '0')}_RELEVE_PRO_AKUU.pdf`
    }))
})

function monthKey(month) {
  return `${props.year}-${String(month).padStart(2, '0')}`
}

const selectedMonthLabel = computed(() => {
  const m = Number(selectedMonth.value.slice(5))
  return m ? `${MOIS_LONG[m - 1]} ${props.year}` : selectedMonth.value
})

/** Mois déjà couvert → re-dépôt = remplacement (efface + réimporte les écritures banque du mois). */
const isReplaceMonth = computed(() => {
  const m = Number(selectedMonth.value.slice(5))
  if (!m) return false
  return (props.status?.months_present ?? []).includes(m)
})

const manualDatePlaceholder = computed(() => {
  if (!selectedMonth.value) return '30/09/2026'
  const mm = selectedMonth.value.slice(5)
  const yyyy = selectedMonth.value.slice(0, 4)
  const lastDay = new Date(Number(yyyy), Number(mm), 0).getDate()
  return `${String(lastDay).padStart(2, '0')}/${mm}/${yyyy}`
})

watch(
  resolvedMissing,
  (list) => {
    const pick = list[0]?.month
    const key = pick ? monthKey(pick) : depositedMonths.value.at(-1) ? monthKey(depositedMonths.value.at(-1).month) : ''
    if (key && (!selectedMonth.value || !isKnownMonth(selectedMonth.value))) {
      selectedMonth.value = key
    }
  },
  { immediate: true }
)

function isKnownMonth(key) {
  const m = Number(key.slice(5))
  return resolvedMissing.value.some((x) => x.month === m) || depositedMonths.value.some((x) => x.month === m)
}

const manualOk = computed(() => /^\d{2}\/\d{2}\/\d{4}$/.test(manualDate.value) && !Number.isNaN(parseSolde(manualSolde.value)))

function parseSolde(v) {
  const n = Number(String(v).replace(/[\s\u00a0€]/g, '').replace(',', '.'))
  return String(v).trim() === '' ? NaN : n
}

function monthFromDateFin(dateFin) {
  const m = String(dateFin || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}` : ''
}

function assertMonthMatch(dateFin) {
  const fromPdf = monthFromDateFin(dateFin)
  if (!fromPdf) return
  if (fromPdf !== selectedMonth.value) {
    const pdfMonth = Number(fromPdf.slice(5))
    const pdfLabel = `${MOIS_LONG[pdfMonth - 1]} ${props.year}`
    throw new Error(
      `Ce PDF est le relevé de ${pdfLabel} (fin au ${dateFin}), pas de ${selectedMonthLabel.value}. ` +
        `Changez le mois sélectionné ou choisissez le bon fichier.`
    )
  }
}

const check = computed(() => (releve.value ? checkReleve(releve.value) : { ok: false }))
const toAdd = computed(() => ops.value.filter((o) => !o.duplicate))
const dupCount = computed(() => ops.value.length - toAdd.value.length)

function key(date, amount, label) {
  const l = String(label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18)
  return `${String(date).slice(0, 10)}|${Math.round(Math.abs(Number(amount)) * 100)}|${l}`
}

function formatApiError(e) {
  if (!e) return 'Erreur inconnue — réessayez.'
  const msg = e.message || String(e)
  if (e.code === 'UNAUTHORIZED') return 'Session expirée — reconnectez-vous.'
  if (e.code === 'BUSY') return 'Serveur occupé — réessayez dans quelques secondes.'
  if (e.code === 'FORBIDDEN') return msg
  return msg || 'Erreur inconnue — réessayez.'
}

async function scrollToFeedback() {
  await nextTick()
  sendFeedbackRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function resetSendState() {
  sendError.value = ''
  sendErrorCode.value = ''
  result.value = null
}

async function onFile(ev) {
  const f = ev.target.files?.[0]
  if (!f) return
  if (!selectedMonth.value) {
    error.value = 'Choisissez d\'abord le mois du relevé.'
    return
  }
  file.value = f
  manual.value = false
  error.value = ''
  resetSendState()
  releve.value = null
  reading.value = true
  try {
    const pdfjs = await import('pdfjs-dist')
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise
    const pages = []
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent()
      pages.push(tc.items.map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5], w: i.width })))
    }
    const r = parseReleve(pages)
    if (!r.operations.length || r.solde_fin === null) {
      manual.value = true
      manualDate.value = manualDatePlaceholder.value
      throw new Error("Ce PDF n'a pas pu être lu automatiquement (relevé scanné ?). Vous pouvez le déposer quand même en recopiant son solde ci-dessous.")
    }
    if (!r.date_fin?.endsWith(props.year)) {
      throw new Error(`Ce relevé est daté du ${r.date_fin} : seuls les relevés ${props.year} s'ajoutent ici.`)
    }
    assertMonthMatch(r.date_fin)
    const monthPrefix = selectedMonth.value
    const existing = {}
    props.existingRows.filter((x) => {
      if (x.source !== 'banque') return false
      if (isReplaceMonth.value && (x.date || '').startsWith(monthPrefix)) return false
      return true
    }).forEach((x) => {
      const k = key(x.date, x.eur, x.label)
      existing[k] = (existing[k] || 0) + 1
    })
    const seen = {}
    ops.value = r.operations.map((o) => {
      const k = key(o.date, o.amount, o.label)
      seen[k] = (seen[k] || 0) + 1
      return { ...o, ...suggest(o), duplicate: (existing[k] || 0) >= seen[k] }
    })
    releve.value = r
  } catch (e) {
    error.value = e.message
  } finally {
    reading.value = false
  }
}

async function send() {
  if (!releve.value) return
  if (!file.value) {
    sendError.value = 'Le fichier PDF a été perdu — choisissez-le à nouveau.'
    sendErrorCode.value = 'VALIDATION'
    await scrollToFeedback()
    return
  }
  sending.value = true
  sendError.value = ''
  sendErrorCode.value = ''
  error.value = ''
  try {
    const opsToSend = isReplaceMonth.value ? ops.value : toAdd.value
    const data = await tresorerieApi.importReleve({
      date_fin: releve.value.date_fin,
      solde_debut: releve.value.solde_debut,
      solde_fin: releve.value.solde_fin,
      replace: isReplaceMonth.value,
      operations: opsToSend.map(({ date, label, amount, category, project }) => ({ date, label, amount, category, project }))
    }, file.value)
    result.value = data
    releve.value = null
    ops.value = []
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
    await scrollToFeedback()
    emit('imported', data)
  } catch (e) {
    sendError.value = formatApiError(e)
    sendErrorCode.value = e.code || ''
    error.value = sendError.value
    await scrollToFeedback()
  } finally {
    sending.value = false
  }
}

async function sendManual() {
  if (!file.value) {
    sendError.value = 'Choisissez d\'abord le fichier PDF du relevé.'
    sendErrorCode.value = 'VALIDATION'
    await scrollToFeedback()
    return
  }
  sending.value = true
  sendError.value = ''
  sendErrorCode.value = ''
  error.value = ''
  try {
    const [, mm, yyyy] = manualDate.value.split('/')
    if (yyyy !== props.year) throw new Error(`Ce relevé est de ${yyyy} : ici, seuls les relevés ${props.year} sont acceptés.`)
    if (`${yyyy}-${mm}` !== selectedMonth.value) {
      throw new Error(`La date ${manualDate.value} ne correspond pas au mois ${selectedMonthLabel.value} sélectionné.`)
    }
    const data = await tresorerieApi.importReleve({
      date_fin: manualDate.value,
      solde_fin: parseSolde(manualSolde.value),
      replace: isReplaceMonth.value,
      operations: []
    }, file.value)
    result.value = { ...data, month: data.month ?? mm }
    manual.value = false
    file.value = null
    if (fileInput.value) fileInput.value.value = ''
    await scrollToFeedback()
    emit('imported', result.value)
  } catch (e) {
    sendError.value = formatApiError(e)
    sendErrorCode.value = e.code || ''
    error.value = sendError.value
    await scrollToFeedback()
  } finally {
    sending.value = false
  }
}

function eur(v) {
  return v == null ? '—' : `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
</script>
