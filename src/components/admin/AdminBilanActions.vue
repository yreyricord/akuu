<template>
  <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Actions trésorier</h3>
        <p class="mt-1 text-xs text-night-400">
          Frais bancaires, WU, retraits DAB → <strong>relevé suffit</strong>.
          Terrain PM → facture requise.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="statsResolved.pending"
          type="button"
          class="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white"
          @click="bulkConfirmAll"
        >
          Tout valider ({{ statsResolved.pending }})
        </button>
        <button type="button" class="rounded-full border border-night-200 px-3 py-1.5 text-xs font-semibold" @click="exportCsv">
          Exporter CSV
        </button>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2 text-xs">
      <span class="rounded-full bg-leaf/15 px-2 py-1 text-forest">{{ statsResolved.ok }} OK</span>
      <span class="rounded-full bg-bleu/15 px-2 py-1 text-bleu">{{ statsResolved.pending }} à traiter</span>
      <span class="rounded-full bg-night-100 px-2 py-1 text-night-500">
        Couverture requise : {{ effectiveCoverage }} %
      </span>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        class="rounded-full px-3 py-1 text-xs font-semibold transition"
        :class="filter === f.id ? 'bg-forest text-white' : 'bg-cream-200 text-night-600'"
        @click="filter = f.id"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-night-100">
      <table class="w-full text-left text-xs">
        <thead class="sticky top-0 bg-cream-100 text-[10px] uppercase tracking-wide text-night-400">
          <tr>
            <th class="p-2">Réf.</th>
            <th class="p-2">Libellé</th>
            <th class="p-2 text-right">Montant</th>
            <th class="p-2">Statut</th>
            <th class="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in shownLines"
            :key="line.reference"
            class="border-t border-night-50 hover:bg-cream-50/80"
          >
            <td class="p-2 font-mono text-[10px]">{{ line.reference }}</td>
            <td class="max-w-[200px] truncate p-2" :title="line.label">{{ line.label }}</td>
            <td class="p-2 text-right tabular-nums whitespace-nowrap">
              <span v-if="line.amount_pen">{{ formatPen(line.amount_pen) }}</span>
              <span v-if="line.amount_eur">{{ formatEur(line.amount_eur) }}</span>
            </td>
            <td class="p-2">
              <span class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" :class="statusClass(line)">
                {{ statusLabel(line) }}
              </span>
            </td>
            <td class="p-2">
              <div v-if="effectiveStatus(line) === 'pending'" class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class="rounded bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest"
                  @click="markReleve(line)"
                >
                  Relevé OK
                </button>
                <button
                  type="button"
                  class="rounded bg-bleu/10 px-2 py-0.5 text-[10px] font-semibold text-bleu"
                  @click="openLink(line)"
                >
                  Lier facture
                </button>
              </div>
              <span v-else class="text-forest">✓</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!shownLines.length" class="p-6 text-center text-sm text-night-400">Aucune ligne pour ce filtre.</p>
    </div>

    <!-- Orphelines -->
    <details v-if="orphans.length" class="mt-4 rounded-xl border border-ochre-200 bg-ochre-50/40 px-3 py-2">
      <summary class="cursor-pointer text-xs font-semibold text-ochre-800">
        {{ orphans.length }} facture(s) orpheline(s) dans Factures/
      </summary>
      <ul class="mt-2 max-h-32 space-y-1 overflow-y-auto text-[10px] text-night-500">
        <li v-for="name in orphans.slice(0, 30)" :key="name" class="flex justify-between gap-2">
          <span class="truncate">{{ name }}</span>
          <button type="button" class="shrink-0 text-forest underline" @click="ignoreOrphan(name)">Ignorer</button>
        </li>
      </ul>
    </details>

    <!-- Ajouter dépense -->
    <details class="mt-4 rounded-xl border border-night-100 px-3 py-2">
      <summary class="cursor-pointer text-xs font-semibold text-night">+ Ajouter une dépense terrain (Detail_PM)</summary>
      <form class="mt-3 grid gap-2 sm:grid-cols-2" @submit.prevent="submitAdd">
        <input v-model="addForm.expense_date" type="date" required class="admin-input text-sm" />
        <input v-model="addForm.amount_pen" type="number" step="0.01" placeholder="Montant PEN" required class="admin-input text-sm" />
        <input v-model="addForm.label" type="text" placeholder="Libellé" required class="admin-input text-sm sm:col-span-2" />
        <input v-model="addForm.drive_file_url" type="url" placeholder="URL Drive facture (optionnel)" class="admin-input text-sm sm:col-span-2" />
        <button type="submit" class="btn-primary text-sm sm:col-span-2">Enregistrer (export CSV → Excel)</button>
      </form>
    </details>

    <!-- Modal lien facture -->
    <div
      v-if="linkTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-night/40 p-4"
      @click.self="linkTarget = null"
    >
      <form class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" @submit.prevent="submitLink">
        <h4 class="font-semibold text-night">Lier une facture</h4>
        <p class="mt-1 text-xs text-night-400">{{ linkTarget.reference }} · {{ linkTarget.label }}</p>
        <label class="mt-4 block space-y-1 text-sm">
          <span>Nom fichier</span>
          <input v-model="linkForm.piece_filename" class="admin-input" required />
        </label>
        <label class="mt-3 block space-y-1 text-sm">
          <span>URL Drive</span>
          <input v-model="linkForm.drive_file_url" type="url" class="admin-input" required />
        </label>
        <div class="mt-4 flex gap-2">
          <button type="submit" class="btn-primary flex-1">Enregistrer</button>
          <button type="button" class="flex-1 rounded-full border py-2 text-sm" @click="linkTarget = null">Annuler</button>
        </div>
      </form>
    </div>

    <p class="mt-4 rounded-lg bg-cream-100 px-3 py-2 text-[11px] text-night-500">
      Après vos actions : <strong>Exporter CSV</strong> puis
      <code class="rounded bg-white px-1">python3 appliquer_bilan_overrides.py fichier.csv</code>
      · regénérer le bilan.
    </p>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { formatEur, formatPen } from '@/data/tresorerie-config.js'
import {
  exportOverridesCsv,
  getOverride,
  listOverrides,
  overridesVersion,
  resolvedStatus,
  setOverride
} from '@/composables/useBilanOverrides.js'

const props = defineProps({
  year: { type: [String, Number], required: true },
  actions: { type: Object, default: null }
})

const filter = ref('pending')
const linkTarget = ref(null)
const linkForm = reactive({ piece_filename: '', drive_file_url: '' })
const addForm = reactive({
  expense_date: '',
  amount_pen: '',
  label: '',
  drive_file_url: ''
})

const filters = [
  { id: 'pending', label: 'À traiter' },
  { id: 'ok', label: 'OK' },
  { id: 'all', label: 'Toutes' }
]

const lines = computed(() => props.actions?.lines ?? [])
const orphans = computed(() => {
  void overridesVersion.value
  const ignored = new Set(
    Object.entries(listOverrides(props.year))
      .filter(([k, v]) => k.startsWith('orphan::') && v.action === 'ignore_orphan')
      .map(([k]) => k.replace('orphan::', ''))
  )
  return (props.actions?.orphan_files ?? []).filter((n) => !ignored.has(n))
})

function effectiveStatus(line) {
  void overridesVersion.value
  return resolvedStatus(line, getOverride(props.year, line.reference))
}

const shownLines = computed(() => {
  void overridesVersion.value
  return lines.value.filter((line) => {
    const st = effectiveStatus(line)
    if (filter.value === 'all') return true
    if (filter.value === 'pending') return st === 'pending'
    if (filter.value === 'ok') return st === 'ok'
    return true
  })
})

const statsResolved = computed(() => {
  void overridesVersion.value
  let ok = 0
  let pending = 0
  for (const line of lines.value) {
    const st = effectiveStatus(line)
    if (st === 'ok') ok += 1
    else if (st === 'pending') pending += 1
  }
  return { ok, pending }
})

const effectiveCoverage = computed(() => {
  void overridesVersion.value
  const needs = lines.value.filter((l) => l.expects_invoice)
  if (!needs.length) return 100
  const done = needs.filter((l) => effectiveStatus(l) === 'ok').length
  return Math.round((100 * done) / needs.length)
})

watch(() => props.year, () => {
  filter.value = 'pending'
})

function markReleve(line) {
  setOverride(props.year, line.reference, {
    action: 'releve_suffit',
    notes: line.exempt_reason ? `Justificatif: relevé bancaire (${line.exempt_reason})` : 'Justificatif: relevé bancaire'
  })
}

function bulkConfirmAll() {
  const pendingLines = lines.value.filter((l) => effectiveStatus(l) === 'pending')
  const terrain = pendingLines.filter((l) => l.expects_invoice)
  if (terrain.length && !window.confirm(
    `${terrain.length} ligne(s) terrain attendent normalement une facture.\n`
    + 'Confirmer « relevé suffit » pour toutes les lignes restantes ?'
  )) {
    return
  }
  for (const line of pendingLines) {
    markReleve(line)
  }
}

function openLink(line) {
  linkTarget.value = line
  linkForm.piece_filename = line.piece_filename || ''
  linkForm.drive_file_url = line.drive_file_url || ''
}

function submitLink() {
  setOverride(props.year, linkTarget.value.reference, {
    action: 'link',
    piece_filename: linkForm.piece_filename,
    drive_file_url: linkForm.drive_file_url,
    notes: 'Validé trésorier via site Bilan'
  })
  linkTarget.value = null
}

function ignoreOrphan(name) {
  setOverride(props.year, `orphan::${name}`, {
    action: 'ignore_orphan',
    piece_filename: name,
    notes: 'Facture orpheline — ignorée trésorier'
  })
}

function submitAdd() {
  const ref = `NEW-${props.year}-${Date.now()}`
  setOverride(props.year, ref, {
    action: 'add_line',
    expense_date: addForm.expense_date,
    label: addForm.label,
    amount_pen: addForm.amount_pen,
    amount_eur: '',
    category: 'autre',
    project: 'divers',
    drive_file_url: addForm.drive_file_url,
    piece_filename: '',
    notes: 'Ajout Detail_PM via site Bilan'
  })
  addForm.expense_date = ''
  addForm.amount_pen = ''
  addForm.label = ''
  addForm.drive_file_url = ''
}

function exportCsv() {
  const csv = exportOverridesCsv([props.year])
  if (csv.split('\n').length <= 1) {
    alert('Aucune action enregistrée pour cette année.')
    return
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `bilan_overrides_${props.year}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

function statusClass(line) {
  const st = effectiveStatus(line)
  if (st === 'ok') return 'bg-leaf/15 text-forest'
  return 'bg-ochre-100 text-ochre-800'
}

function statusLabel(line) {
  return effectiveStatus(line) === 'ok' ? 'OK' : 'À faire'
}
</script>
