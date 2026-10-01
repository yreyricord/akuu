<template>
  <div class="space-y-6">
    <header>
      <p class="text-xs font-bold uppercase tracking-[0.15em] text-night-500">Trésorerie AKUU</p>
      <h2 class="mt-1 font-serif text-3xl font-bold text-forest-700">Bilan annuel</h2>
      <nav
        v-if="years.length"
        class="mt-4 flex flex-wrap gap-0.5 border-b border-night-100"
        aria-label="Exercice"
      >
        <button
          v-for="y in yearsAsc"
          :key="y.year"
          type="button"
          class="relative min-h-[44px] border-b-[3px] px-3 text-sm font-semibold transition"
          :class="selectedYear === String(y.year)
            ? 'border-forest text-forest-700'
            : 'border-transparent text-night-400 hover:text-night'"
          :aria-pressed="selectedYear === String(y.year)"
          @click="selectedYear = String(y.year)"
        >
          {{ y.year }}
          <span
            class="ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
            :class="yearDotClass(y)"
            aria-hidden="true"
          />
        </button>
      </nav>
    </header>

    <AdminLoadingPanel
      v-if="loadingExercices"
      title="Lecture des journaux Google"
      detail="Chargement des exercices 2017 à l'année en cours depuis le Drive…"
      :progress="exercicesProg.progress"
      :step-label="exercicesProg.stepLabel"
    />

    <p
      v-else-if="offlineFallback"
      class="rounded-xl border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-800"
    >
      Connexion au journal Google indisponible — chiffres du dernier export
      <span v-if="displayGeneratedAt">({{ formatHealthDate(displayGeneratedAt) }})</span>.
    </p>

    <template v-else-if="yearData">
      <p
        v-if="rouvertBanner"
        class="rounded-xl border border-ochre-300 bg-ochre-50 px-4 py-3 text-sm text-ochre-900"
      >
        {{ rouvertBanner }}
      </p>

      <section
        v-if="(auth.isAdmin || auth.isTreasurer) && currentExercice?.live"
        class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm"
      >
        <h3 class="text-base font-semibold text-forest-700">Statut de l'exercice</h3>
        <p class="mt-1 text-xs text-night-500">
          Version {{ currentExercice.version || 1 }}
          <span v-if="currentExercice.statut === 'clos'"> · clôturé</span>
          <span v-else-if="currentExercice.statut === 'rouvert'"> · rouvert pour correction</span>
          <span v-else-if="currentExercice.statut === 'ouvert'"> · exercice en cours</span>
        </p>
        <div v-if="exerciceActionError" class="mt-3 rounded-lg bg-terracotta/10 px-3 py-2 text-sm text-terracotta-700">
          {{ exerciceActionError }}
        </div>
        <ul v-if="reclotureProblems.length" class="mt-3 list-inside list-disc text-sm text-terracotta-700">
          <li v-for="(p, i) in reclotureProblems" :key="i">{{ p }}</li>
        </ul>
        <div class="mt-4 flex flex-wrap gap-3">
          <template v-if="auth.isAdmin">
            <button
              v-if="currentExercice.statut === 'clos'"
              type="button"
              class="min-h-[44px] rounded-xl border border-ochre-300 bg-ochre-50 px-4 text-sm font-semibold text-ochre-800 hover:bg-ochre-100 disabled:opacity-50"
              :disabled="!!exerciceBusy"
              @click="showRouvrir = true"
            >
              Rouvrir l'exercice
            </button>
            <button
              v-if="currentExercice.statut === 'rouvert' || currentExercice.statut === 'ouvert'"
              type="button"
              class="min-h-[44px] rounded-xl border border-forest bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
              :disabled="!!exerciceBusy"
              @click="doRecloturer(false)"
            >
              {{ exerciceBusy === 'recloture' ? 'Reclôture…' : currentExercice.statut === 'ouvert' ? 'Clôturer l\'exercice' : 'Reclôturer' }}
            </button>
          </template>
          <button
            type="button"
            class="min-h-[44px] rounded-xl border border-bleu bg-white px-4 text-sm font-semibold text-bleu hover:bg-bleu/5 disabled:opacity-50"
            :disabled="!!exerciceBusy"
            @click="doRegenerer(false)"
          >
            {{ exerciceBusy === 'regenerer' ? 'Génération en cours…' : 'Régénérer le dossier Cloture' }}
          </button>
        </div>
        <p
          v-if="exerciceBusy === 'regenerer'"
          class="mt-3 rounded-lg bg-bleu/10 px-3 py-2 text-sm text-bleu-800"
          role="status"
        >
          Génération des 7 tableaux + PDF + ZIP sur le Drive… Comptez 1 à 2 minutes, ne fermez pas l'onglet.
        </p>
        <p v-else-if="regenerationMessage" class="mt-3 text-sm text-forest-700">{{ regenerationMessage }}</p>
        <details v-if="historique.length" class="mt-4">
          <summary class="cursor-pointer text-sm font-semibold text-night-600">Historique des modifications ({{ historique.length }})</summary>
          <ul class="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs text-night-600">
            <li v-for="(h, i) in historique" :key="i">
              <span class="font-semibold">{{ h.action }}</span> · {{ h.reference || '—' }} · {{ h.auteur }} · {{ formatHealthDate(h.date) }}
            </li>
          </ul>
        </details>
      </section>

      <div
        v-if="showRouvrir"
        class="fixed inset-0 z-50 flex items-end justify-center bg-night/40 p-4 sm:items-center"
        role="dialog"
        aria-labelledby="rouvrir-title"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
          <h4 id="rouvrir-title" class="font-serif text-lg font-bold text-forest-700">Rouvrir l'exercice {{ selectedYear }}</h4>
          <p class="mt-1 text-sm text-night-500">Motif obligatoire (10 caractères min.) — sera inscrit dans l'audit et présenté à la prochaine AG.</p>
          <textarea
            v-model="rouvrirMotif"
            rows="3"
            class="mt-3 w-full rounded-xl border border-night-200 px-3 py-2 text-sm"
            placeholder="Ex. : correction d'une écriture oubliée avant validation AG"
          />
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="min-h-[40px] rounded-xl px-4 text-sm font-semibold text-night-500" @click="showRouvrir = false">Annuler</button>
            <button
              type="button"
              class="min-h-[40px] rounded-xl bg-ochre-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="rouvrirMotif.trim().length < 10 || exerciceBusy"
              @click="doRouvrir"
            >
              {{ exerciceBusy === 'rouvrir' ? 'Ouverture…' : 'Confirmer la réouverture' }}
            </button>
          </div>
        </div>
      </div>

      <AdminReleveImport
        v-if="yearData.cloture?.provisoire && selectedYear === String(new Date().getFullYear())"
        :year="selectedYear"
        :existing-rows="liveRows"
        :last-releve="live?.dernier_releve ?? null"
        :status="liveRelevesStatus"
        @imported="refreshLive"
      />
      <AdminBilanRelevesAlert
        v-else-if="!yearData.cloture?.provisoire"
        :year="selectedYear"
        :status="yearData.releves_status"
      />

      <!-- L'essentiel -->
      <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="font-serif text-2xl font-bold text-forest-700">Exercice {{ selectedYear }}</h3>
          <span class="rounded-full px-3.5 py-1.5 text-sm font-semibold" :class="statusPill.cls">
            {{ statusPill.label }}
          </span>
        </div>
        <dl v-if="cr" class="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-night-500">Recettes</dt>
            <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{{ formatEur(cr.produits_eur) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-night-500">Dépenses</dt>
            <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{{ formatEur(cr.charges_eur) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-night-500">Résultat</dt>
            <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl" :class="soldeClass(cr.resultat_eur)">
              {{ formatEur(cr.resultat_eur) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-night-500">
              Banque {{ isLiveYear ? "aujourd'hui" : yearData.cloture?.provisoire ? 'dernier relevé' : 'au 31/12' }}
            </dt>
            <dd class="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{{ formatEur(treso?.releve_fin_eur ?? treso?.fin_eur) }}</dd>
            <dd class="mt-0.5 text-xs" :class="treso?.ecart_rapprochement_eur ? 'text-ochre-700' : 'text-forest-700'">
              {{ rapproLabel }}
            </dd>
          </div>
        </dl>
        <p v-else class="mt-3 text-sm text-night-500">
          Pas encore de chiffres pour cet exercice — vérifiez que le journal Google est connecté.
        </p>
      </section>

      <!-- Rapprochement bancaire -->
      <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h3 class="text-base font-semibold text-forest-700">Rapprochement bancaire</h3>
          <span
            v-if="rappro.statut"
            class="rounded-full px-3 py-1 text-sm font-semibold"
            :class="rappro.statut === 'ok' ? 'bg-forest-100 text-forest-700' : rappro.statut === 'explique' ? 'bg-ochre-100 text-ochre-700' : rappro.statut === 'info' ? 'bg-bleu-100 text-bleu-700' : 'bg-terracotta/10 text-terracotta-700'"
          >
            {{ rappro.statut === 'ok' ? '✓ Les comptes collent au relevé' : rappro.statut === 'explique' ? 'Écart expliqué' : rappro.statut === 'info' ? 'Provisoire' : '⚠ Écart à vérifier' }}
          </span>
        </div>
        <p class="mt-1 text-sm text-night-500">
          On vérifie que l'argent calculé à partir du journal est bien celui que la banque indique sur son relevé.
        </p>

        <p v-if="rappro.vide" class="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm">
          {{ rappro.vide }}
        </p>
        <dl v-else class="mt-4 max-w-xl divide-y divide-night-50 text-sm">
          <div v-for="l in rappro.lignes" :key="l.label" class="flex items-baseline justify-between gap-4 py-2" :class="l.fort ? 'font-semibold' : ''">
            <dt>{{ l.label }}</dt>
            <dd class="tabular-nums" :class="l.cls">{{ l.valeur }}</dd>
          </div>
        </dl>
        <p v-if="rappro.conseil" class="mt-3 max-w-xl text-sm text-night-600">{{ rappro.conseil }}</p>
        <a
          v-if="rappro.pdf"
          :href="rappro.pdf"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-bleu hover:underline"
        >Ouvrir le relevé {{ rappro.mois }}</a>

        <div v-if="moisDeposes.length" class="mt-4">
          <p class="text-xs font-bold uppercase tracking-wide text-night-500">Relevés déposés en {{ selectedYear }}</p>
          <ul class="mt-2 flex flex-wrap gap-1.5">
            <li
              v-for="m in moisDeposes"
              :key="m.mois"
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="m.ok ? 'bg-forest-100 text-forest-700' : 'bg-cream-200 text-night-400'"
              :title="m.ok ? 'Relevé déposé' : 'Relevé non déposé'"
            >
              {{ m.ok ? '✓' : '○' }} {{ m.label }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Télécharger -->
      <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6">
        <h3 class="text-base font-semibold text-forest-700">Télécharger</h3>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <p
            v-if="isLiveYear"
            class="rounded-xl bg-bleu-50 px-4 py-3 text-sm text-night sm:col-span-2"
          >
            Exercice en cours : les fichiers sont générés à partir du journal Google au moment du téléchargement.
            Le dossier de clôture et la synthèse AG seront créés à la clôture de l'année.
          </p>
          <button
            v-if="isLiveYear"
            type="button"
            :class="dlClass + ' text-left'"
            :disabled="exporting === 'journal'"
            @click="exportFile('journal')"
          >
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bleu-100 text-bleu-700">
              <PhTable :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">{{ exporting === 'journal' ? 'Préparation…' : 'Journal comptable' }}</strong>
              <span class="text-sm text-night-500">Excel · à jour à la minute</span>
            </span>
          </button>
          <button
            v-if="isLiveYear"
            type="button"
            :class="dlClass + ' text-left'"
            :disabled="exporting === 'registre'"
            @click="exportFile('registre')"
          >
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
              <PhFileZip :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">{{ exporting === 'registre' ? 'Préparation…' : 'Registre des dépenses' }}</strong>
              <span class="text-sm text-night-500">Excel · banque + terrain, avec liens factures</span>
            </span>
          </button>
          <p v-if="exportError" class="text-sm text-terracotta-700 sm:col-span-2">{{ exportError }}</p>
          <p v-if="busy" class="text-sm text-night-500 sm:col-span-2" role="status">Préparation du fichier…</p>
          <button
            v-if="!isLiveYear && yearData.download_cloture?.pdf"
            type="button"
            :disabled="!!busy"
            @click="getArchive(yearData.download_cloture.pdf)"
            class="flex items-center gap-4 rounded-xl bg-forest-700 p-4 text-white transition hover:bg-forest-800 sm:col-span-2"
          >
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <PhFilePdf :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-base">Synthèse pour l'AG · {{ selectedYear }}</strong>
              <span class="text-sm text-forest-100">PDF · recettes et dépenses, bilan, trésorerie · à joindre à la convocation</span>
            </span>
          </button>
          <button v-if="!isLiveYear && yearData.download_cloture?.path" type="button" :disabled="!!busy" :class="dlClass + ' text-left'" @click="getArchive(yearData.download_cloture.path)">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
              <PhFileZip :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">Dossier de clôture complet</strong>
              <span class="text-sm text-night-500">ZIP · 7 tableaux + note d'audit · {{ yearData.download_cloture.size_kb }} Ko</span>
            </span>
          </button>
          <button v-if="!isLiveYear && journalFile" type="button" :disabled="!!busy" :class="dlClass + ' text-left'" @click="getArchive(journalFile.path)">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bleu-100 text-bleu-700">
              <PhTable :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">Journal comptable</strong>
              <span class="text-sm text-night-500">Excel · toutes les écritures, liens vers les factures</span>
            </span>
          </button>
          <button v-if="yearData.download_releves?.count" type="button" :disabled="!!busy" :class="dlClass + ' text-left'" @click="getZip({ kind: 'releves', year: selectedYear })">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ochre-100 text-ochre-700">
              <PhBank :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">Relevés bancaires</strong>
              <span class="text-sm text-night-500">ZIP · {{ yearData.download_releves.count }} relevé(s) PDF</span>
            </span>
          </button>
          <a v-if="driveUrl" :href="driveUrl" target="_blank" rel="noopener noreferrer" :class="dlClass">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cream-300 text-night">
              <PhFolderOpen :size="24" aria-hidden="true" />
            </span>
            <span>
              <strong class="block text-[15px]">Factures sur le Drive</strong>
              <span class="text-sm text-night-500">{{ driveExact ? `Dossier ${selectedYear}/Factures` : `Dossier 3_Trésorerie, puis ${selectedYear}/Factures` }}</span>
            </span>
          </a>
        </div>
      </section>

      <!-- Archives -->
      <section
        v-if="data?.download_all_years"
        class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-night-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <h3 class="text-base font-semibold text-forest-700">{{ data.download_all_years.label }}</h3>
          <p class="mt-1 text-sm text-night-500">
            Les {{ years.length }} exercices en un seul fichier, pour un contrôleur ou un auditeur
            · préparé à la demande (environ une minute)
          </p>
        </div>
        <button
          type="button"
          :disabled="!!busy"
          @click="getZip({ kind: 'tout' })"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-forest px-5 text-sm font-semibold text-forest-700 transition hover:bg-forest/5"
        >
          <PhDownloadSimple :size="18" weight="bold" aria-hidden="true" />
          {{ busy === 'tout' ? 'Préparation du ZIP…' : 'Tout télécharger (ZIP)' }}
        </button>
      </section>

      <p v-if="displayGeneratedAt" class="text-xs text-night-400">
        {{ liveSource ? 'Chiffres en direct depuis les Google Sheets' : 'Mis à jour' }}
        {{ formatHealthDate(displayGeneratedAt) }}
      </p>
    </template>

    <p v-else-if="!loadingExercices" class="rounded-xl border border-night-100 bg-white px-4 py-8 text-center text-sm text-night-400">
      Aucune donnée bilan — vérifiez la connexion au journal Google (API /exercices).
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhBank, PhDownloadSimple, PhFilePdf, PhFileZip, PhFolderOpen, PhTable } from '@phosphor-icons/vue'
import { tresorerieGoogle } from '@/config/tresorerie-google.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { mapExerciceToBilanYear } from '@/api/tresorerie/exercicesMap.js'
import { downloadBase64 } from '@/api/tresorerie/downloadBase64.js'
import { formatEur, formatPen } from '@/data/tresorerie-config.js'
import driveHealth from '@/data/drive-health.json'
import AdminReleveImport from './AdminReleveImport.vue'
import AdminBilanRelevesAlert from './AdminBilanRelevesAlert.vue'
import AdminLoadingPanel from './AdminLoadingPanel.vue'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const exercices = ref(null)
const loadingExercices = ref(true)
const exercicesProg = bindLoadingProgress(loadingExercices, {
  estimateMs: 25_000,
  label: 'Exercices 2017 → année en cours…'
})
const offlineFallback = ref(false)
const liveSource = computed(() => Boolean(exercices.value?.source === 'google_sheets' && !offlineFallback.value))
const displayGeneratedAt = computed(() => exercices.value?.generated_at ?? null)

async function loadExercices() {
  try {
    exercices.value = await tresorerieApi.getExercices()
    offlineFallback.value = false
  } catch {
    offlineFallback.value = true
    exercices.value = null
  } finally {
    loadingExercices.value = false
  }
}

const years = computed(() =>
  (exercices.value?.years ?? []).map((ex) => mapExerciceToBilanYear(ex))
)
const yearsDesc = computed(() => [...years.value].sort((a, b) => b.year - a.year))

function initialYear(list) {
  const fromQuery = route.query.year
  if (typeof fromQuery === 'string' && list.some((y) => String(y.year) === fromQuery)) {
    return fromQuery
  }
  // Par défaut : dernier exercice clôturé (hors année provisoire)
  const closed = list.find((y) => y.cloture && !y.cloture.provisoire)
  return String(closed?.year ?? list[0]?.year ?? new Date().getFullYear())
}

const selectedYear = ref(initialYear(yearsDesc.value))

watch(yearsDesc, (list) => {
  if (list.length && !list.some((y) => String(y.year) === selectedYear.value)) {
    selectedYear.value = initialYear(list)
  }
})

watch(selectedYear, (year) => {
  if (route.query.year === year) return
  router.replace({ query: { ...route.query, year } })
  loadHistorique(year)
})

const historique = ref([])
const showRouvrir = ref(false)
const rouvrirMotif = ref('')
const exerciceBusy = ref('')
const exerciceActionError = ref('')
const reclotureProblems = ref([])
const regenerationMessage = ref('')

async function loadHistorique(year) {
  try { historique.value = await tresorerieApi.getExerciceHistorique(year) } catch { historique.value = [] }
}

async function doRouvrir() {
  exerciceBusy.value = 'rouvrir'
  exerciceActionError.value = ''
  reclotureProblems.value = []
  try {
    await tresorerieApi.rouvrirExercice(selectedYear.value, rouvrirMotif.value.trim())
    showRouvrir.value = false
    rouvrirMotif.value = ''
    await refreshLive()
    await loadHistorique(selectedYear.value)
  } catch (e) {
    exerciceActionError.value = e.message
  } finally {
    exerciceBusy.value = ''
  }
}

async function doRecloturer(reportOpening) {
  exerciceBusy.value = 'recloture'
  exerciceActionError.value = ''
  reclotureProblems.value = []
  regenerationMessage.value = ''
  try {
    const res = await tresorerieApi.recloturerExercice(selectedYear.value, { report_opening_next: reportOpening })
    if (!res.ok) {
      reclotureProblems.value = res.problems || []
      return
    }
    if (res.opening_next_changed && !reportOpening) {
      const ok = window.confirm(`L'ouverture de ${Number(selectedYear.value) + 1} doit être reportée à ${res.solde_cloture} €. Reporter maintenant ?`)
      if (ok) return doRecloturer(true)
    }
    if (res.regeneration?.ok) {
      regenerationMessage.value = `Dossier Cloture régénéré (${(res.regeneration.files || []).length} fichiers).`
    } else if (res.regeneration?.pending) {
      regenerationMessage.value = res.regeneration.error || 'Reclôture OK — régénération du dossier à relancer manuellement.'
    }
    await refreshLive()
    await loadHistorique(selectedYear.value)
  } catch (e) {
    exerciceActionError.value = e.message
  } finally {
    exerciceBusy.value = ''
  }
}

async function doRegenerer(force) {
  exerciceBusy.value = 'regenerer'
  exerciceActionError.value = ''
  reclotureProblems.value = []
  regenerationMessage.value = ''
  try {
    const res = await tresorerieApi.regenererCloture(selectedYear.value, { force: !!force })
    if (!res?.ok) {
      reclotureProblems.value = res?.problems || []
      if (!force && res?.problems?.length) {
        const ok = window.confirm(
          `Écarts détectés par rapport aux totaux de référence :\n\n${res.problems.join('\n')}\n\nForcer la génération quand même ?`
        )
        if (ok) {
          await doRegenerer(true)
        }
        return
      }
      exerciceActionError.value = res?.problems?.length
        ? 'Génération refusée — corrigez le journal ou forcez après confirmation.'
        : 'Génération impossible. Vérifiez que la Web App Google est déployée avec GenererCloture.gs (étape D).'
      return
    }
    regenerationMessage.value = `Dossier Cloture ${selectedYear.value} régénéré (${(res.files || []).length} fichiers sur le Drive).`
    await refreshLive()
    await loadHistorique(selectedYear.value)
  } catch (e) {
    const msg = e?.message || String(e)
    if (msg.includes('Route') || msg.includes('404') || msg.includes('inconnue')) {
      exerciceActionError.value = `${msg} — Recopiez GenererCloture.gs + App.gs dans Apps Script puis « Nouvelle version » du déploiement.`
    } else if (e?.code === 'GENERATION_FAILED' || e?.code === 'EXPORT_FAILED') {
      exerciceActionError.value = msg
    } else {
      exerciceActionError.value = msg
    }
  } finally {
    exerciceBusy.value = ''
  }
}

function relevesMissingCount(y) {
  return y.releves_status?.missing?.length ?? 0
}

const yearData = computed(() => years.value.find((y) => String(y.year) === selectedYear.value))



const yearsAsc = computed(() => [...years.value].sort((a, b) => a.year - b.year))
const exporting = ref('')
const exportError = ref('')
const currentExercice = computed(() =>
  exercices.value?.years?.find((ex) => ex.year === Number(selectedYear.value)) ?? null
)

const rouvertBanner = computed(() => {
  const ex = currentExercice.value
  if (ex?.statut !== 'rouvert') return ''
  const meta = ex.cloture_meta || {}
  const when = meta.rouvert_le ? formatHealthDate(meta.rouvert_le) : ''
  const who = meta.rouvert_par || 'administrateur'
  const motif = meta.rouvert_motif ? ` (${meta.rouvert_motif})` : ''
  return `Exercice ${selectedYear.value} rouvert le ${when} par ${who}${motif}. Version ${ex.version || 2}, à présenter à la prochaine AG.`
})

const isLiveYear = computed(() =>
  Boolean(currentExercice.value?.live && yearData.value?.cloture?.provisoire)
)
const prevFin = computed(() =>
  years.value.find((y) => y.year === Number(selectedYear.value) - 1)?.cloture?.tresorerie?.releve_fin_eur ?? null
)
const cr = computed(() => yearData.value?.cloture?.compte_resultat ?? null)
const treso = computed(() => {
  const t = yearData.value?.cloture?.tresorerie
  if (!t) return null
  if (isLiveYear.value) return { ...t, calcule: true }
  return t
})

const liveRows = ref([])
async function refreshLive() {
  await loadExercices()
  const y = new Date().getFullYear()
  try { liveRows.value = (await tresorerieApi.getJournalAnnee(y))?.rows ?? [] } catch { liveRows.value = [] }
}
onMounted(async () => {
  await refreshLive()
  await loadHistorique(selectedYear.value)
})

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const MOIS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
function fmtDate(iso) { return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '' }

/** Relevés 2026 : fusion JSON (PDF sur disque) + journal Google live — évite « 0 relevé » si l'API échoue. */
const liveRelevesStatus = computed(() => {
  const y = Number(selectedYear.value)
  const base = yearData.value?.releves_status
  const isCurrent = yearData.value?.cloture?.provisoire && y === new Date().getFullYear()
  if (!isCurrent) return base

  const now = new Date()
  const expected = y === now.getFullYear() ? now.getMonth() : 12 // mois écoulés seulement
  const presentMonths = new Set(base?.months_present ?? [])

  ;(currentExercice.value?.releves || []).forEach((r) => {
    const m = Number(String(r.mois || '').slice(5))
    if (m >= 1 && m <= 12) presentMonths.add(m)
  })
  ;(yearData.value?.download_releves?.files || []).forEach((f) => {
    const match = f.filename?.match(/^(\d{4})_(\d{2})_/)
    if (match && Number(match[1]) === y) presentMonths.add(Number(match[2]))
  })

  const missing = []
  for (let m = 1; m <= expected; m++) {
    if (!presentMonths.has(m)) {
      missing.push({
        month: m,
        year: y,
        label: `${MOIS_LONG[m - 1]} ${y}`,
        suggested_filename: `${y}_${String(m).padStart(2, '0')}_RELEVE_PRO_AKUU.pdf`
      })
    }
  }

  return {
    year: y,
    status: missing.length ? 'incomplete' : 'complete',
    label: missing.length
      ? `${missing.length} relevé(s) bancaire(s) manquant(s)`
      : (base?.label ?? 'Exercice en cours — relevés à jour'),
    count: presentMonths.size,
    months_present: [...presentMonths].sort((a, b) => a - b),
    expected,
    missing,
    upload_enabled: true,
    historique_note: base?.historique_note
  }
})

const rappro = computed(() => {
  const y = yearData.value
  if (!y) return {}
  if (isLiveYear.value) {
    const r = currentExercice.value?.dernier_releve
    const rp = currentExercice.value?.rapprochement || {}
    if (!r || r.solde_fin == null) {
      const t = y.cloture?.tresorerie
      if (t?.releve_fin_eur != null) {
        return rapproExercice(y)
      }
      if (liveRelevesStatus.value?.months_present?.length || y.download_releves?.count) {
        return rapproExercice(y)
      }
      return {
        vide: 'Rapprochement banque France (Crédit Coop) : déposez les relevés PDF via l’onglet Bilan · Import relevé. ' +
          'Ce bloc ne concerne pas la caisse espèces au Pérou (onglet Compta → Suivi terrain).'
      }
    }
    if (prevFin.value == null) return { vide: "Solde de fin d'année précédente inconnu : rapprochement impossible." }
    const calc = Math.round((prevFin.value + rp.recettes_au_releve - rp.depenses_au_releve) * 100) / 100
    const ecart = Math.round((calc - r.solde_fin) * 100) / 100
    const ok = Math.abs(ecart) < 0.01
    const lignes = [
      { label: `Solde au 01/01/${selectedYear.value} (relevé)`, valeur: formatEur(prevFin.value) },
      { label: `+ Recettes du journal jusqu'au ${fmtDate(r.date_fin)}`, valeur: formatEur(rp.recettes_au_releve), cls: 'text-forest-700' },
      { label: `− Dépenses du journal jusqu'au ${fmtDate(r.date_fin)}`, valeur: formatEur(rp.depenses_au_releve) },
      { label: `= Solde calculé au ${fmtDate(r.date_fin)}`, valeur: formatEur(calc), fort: true },
      { label: `Solde du relevé bancaire au ${fmtDate(r.date_fin)}`, valeur: formatEur(r.solde_fin), fort: true },
      { label: 'Écart', valeur: ok ? '0,00 € ✓' : formatEur(ecart), fort: true, cls: ok ? 'text-forest-700' : 'text-terracotta-700' }
    ]
    if (rp.apres_releve_nb) {
      lignes.push({
        label: `Après le relevé : ${rp.apres_releve_nb} opération(s) déjà au journal`,
        valeur: `${rp.apres_releve_net >= 0 ? '+' : ''}${formatEur(rp.apres_releve_net)}`
      })
    }
    return {
      statut: ok ? 'ok' : 'ecart',
      lignes,
      pdf: r.url,
      mois: r.mois,
      conseil: ok
        ? ''
        : ecart > 0
          ? "Le journal compte plus d'argent que la banque : une dépense du relevé manque dans le journal, ou une recette y est en double. Redéposez le relevé du mois (les doublons sont ignorés) puis comparez ligne à ligne."
          : "La banque a plus d'argent que le journal : une recette du relevé manque dans le journal, ou une dépense y est en double. Redéposez le relevé du mois puis comparez ligne à ligne."
    }
  }
  return rapproExercice(y)
})

/** Exercice clos (ou repli) : solde calculé = début + recettes − dépenses du journal, comparé au relevé. */
function rapproExercice(y) {
  const t = y.cloture?.tresorerie
  const c = y.cloture?.compte_resultat
  if (!t || !c || t.releve_fin_eur == null) return { vide: "Pas encore de rapprochement pour cet exercice." }
  const r2 = (v) => Math.round(v * 100) / 100
  const calc = r2((t.debut_eur || 0) + c.produits_eur - c.charges_eur)
  const ecart = r2(calc - t.releve_fin_eur)
  const ok = Math.abs(ecart) < 0.01
  const explique = !ok && Boolean(t.explication_ecart)
  const provisoire = Boolean(y.cloture?.provisoire)
  if (provisoire) {
    // Exercice en cours sans connexion au journal Google : pas de faux écart, le rapprochement se fait en direct.
    return {
      statut: 'info',
      lignes: [
        { label: `Solde au 01/01/${y.year}`, valeur: formatEur(t.debut_eur || 0) },
        { label: '+ Recettes du journal', valeur: formatEur(c.produits_eur), cls: 'text-forest-700' },
        { label: '− Dépenses du journal', valeur: formatEur(c.charges_eur) },
        { label: '= Solde calculé (journal, toutes opérations)', valeur: formatEur(calc), fort: true },
        { label: 'Solde du dernier relevé bancaire', valeur: formatEur(t.releve_fin_eur), fort: true }
      ],
      conseil: "Exercice en cours : le journal contient aussi des opérations postérieures au dernier relevé. Le rapprochement au centime s'affiche quand le journal Google est joignable."
    }
  }
  return {
    statut: ok ? 'ok' : explique ? 'explique' : 'ecart',
    lignes: [
      { label: `Solde au 01/01/${y.year}${y.year === 2017 ? ' (ouverture du compte)' : ''}`, valeur: formatEur(t.debut_eur || 0) },
      { label: '+ Recettes du journal', valeur: formatEur(c.produits_eur), cls: 'text-forest-700' },
      { label: '− Dépenses du journal', valeur: formatEur(c.charges_eur) },
      { label: provisoire ? '= Solde calculé (journal)' : '= Solde calculé au 31/12 (journal)', valeur: formatEur(calc), fort: true },
      { label: provisoire ? 'Solde du dernier relevé bancaire' : 'Solde du relevé bancaire au 31/12', valeur: formatEur(t.releve_fin_eur), fort: true },
      { label: 'Écart', valeur: ok ? '0,00 € ✓' : formatEur(ecart), fort: true, cls: ok ? 'text-forest-700' : explique ? 'text-ochre-700' : 'text-terracotta-700' }
    ],
    conseil: ok ? '' : explique
      ? `${t.explication_ecart} Détail dans la note d'audit.`
      : provisoire
        ? "Exercice en cours : le journal contient des opérations postérieures au dernier relevé déposé."
        : "Écart non documenté : comparez le journal au relevé ligne à ligne."
  }
}

const moisDeposes = computed(() => {
  const status = liveRelevesStatus.value
  if (!yearData.value?.cloture?.provisoire || !status?.expected) return []
  const present = new Set(status.months_present || [])
  return MOIS.slice(0, status.expected).map((label, i) => {
    const mois = `${selectedYear.value}-${String(i + 1).padStart(2, '0')}`
    return { mois, label, ok: present.has(i + 1) }
  })
})

const busy = ref('')
/** '/downloads/tresorerie/2025/Cloture/x.pdf' → chemin sur le Drive '2025/Cloture/x.pdf' */
function drivePath(p) { return String(p || '').replace(/^\/?downloads\/tresorerie\//, '') }
async function getArchive(p) {
  busy.value = 'file'
  exportError.value = ''
  try { downloadBase64(await tresorerieApi.downloadArchiveFile(drivePath(p))) } catch (e) { exportError.value = e.message } finally { busy.value = '' }
}
async function getZip(opts) {
  busy.value = opts.kind
  exportError.value = ''
  try { downloadBase64(await tresorerieApi.zipArchive(opts)) } catch (e) { exportError.value = e.message } finally { busy.value = '' }
}

async function exportFile(kind) {
  exporting.value = kind
  exportError.value = ''
  try {
    const f = kind === 'journal'
      ? await tresorerieApi.exportJournal(selectedYear.value)
      : await tresorerieApi.exportRegistre(selectedYear.value)
    downloadBase64(f)
  } catch (e) {
    exportError.value = e.message
  } finally {
    exporting.value = ''
  }
}
const journalFile = computed(() => (yearData.value?.downloads ?? []).find((f) => f.filename?.startsWith('Journal_')))
const driveYear = computed(() => (driveHealth?.years ?? []).find((y) => String(y.year) === selectedYear.value))
const driveExact = computed(() => Boolean(driveYear.value?.factures_folder_exact))
const driveUrl = computed(() =>
  driveYear.value?.factures_drive_url || tresorerieGoogle.driveFolders.find((f) => f.id === 'root')?.url || null
)
const dlClass = 'flex items-center gap-4 rounded-xl border border-night-100 p-4 text-night transition hover:border-forest/50'

const statusPill = computed(() => {
  const c = yearData.value?.cloture
  if (!c) return { label: 'Pas encore clôturé', cls: 'bg-night-100 text-night' }
  if (c.rouvert) return { label: `Rouvert · version ${c.version || 2}`, cls: 'bg-ochre-100 text-ochre-800' }
  if (c.provisoire) return { label: 'Provisoire · exercice en cours', cls: 'bg-bleu-100 text-bleu-700' }
  if (c.clos) return { label: 'Clôturé · approuvé en AG', cls: 'bg-forest-100 text-forest-700' }
  if (c.status === 'pret') return { label: "Prêt pour l'AG", cls: 'bg-forest-100 text-forest-700' }
  return { label: 'Clôturé · points expliqués', cls: 'bg-ochre-100 text-ochre-700' }
})

const rapproLabel = computed(() => {
  const t = treso.value
  if (!t) return ''
  if (t.calcule) {
    const r = currentExercice.value?.dernier_releve
    if (r?.solde_fin == null) {
      const rel = yearData.value?.cloture?.tresorerie?.releve_fin_eur
      if (rel != null && liveRelevesStatus.value?.months_present?.length) {
        return `dernier relevé connu : ${formatEur(rel)} (${liveRelevesStatus.value.months_present.length} mois déposés)`
      }
      return 'calculé depuis le journal · aucun relevé déposé cette année'
    }
    return `calculé depuis le journal · relevé ${r.mois} : ${formatEur(r.solde_fin)}`
  }
  const ecart = t.ecart_rapprochement_eur
  if (!ecart) return '✓ égal au relevé bancaire'
  return `relevé bancaire · écart journal de ${formatEur(Math.abs(ecart))} ${t.explication_ecart ? 'expliqué' : 'à vérifier'}`
})



function yearDotClass(y) {
  const c = y.cloture
  if (!c) return 'bg-night-200'
  if (c.rouvert) return 'bg-ochre-500'
  if (c.provisoire) return 'bg-bleu'
  if (c.clos) return 'bg-forest'
  return c.status === 'pret' ? 'bg-forest' : 'bg-ochre-500'
}


function soldeClass(solde) {
  return solde >= 0 ? 'text-forest' : 'text-terracotta-700'
}








function formatHealthDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}
</script>
