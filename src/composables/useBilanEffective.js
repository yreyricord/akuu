import { computed, ref, unref } from 'vue'
import { getOverride, listOverrides, overridesVersion, resolvedStatus } from './useBilanOverrides.js'

const PIECES_CATEGORIES = new Set(['pieces_journal', 'pieces_registre', 'couverture'])

/** Stats actions trésorier avec overrides localStorage. */
export function computeActionStats(actions, year) {
  void overridesVersion.value
  const lines = actions?.lines ?? []
  let ok = 0
  let pending = 0
  let needs = 0
  let needsOk = 0
  for (const line of lines) {
    const st = resolvedStatus(line, getOverride(year, line.reference))
    if (st === 'ok') ok += 1
    else if (st === 'pending') pending += 1
    if (line.expects_invoice) {
      needs += 1
      if (st === 'ok') needsOk += 1
    }
  }
  return {
    ok,
    pending,
    coverage: needs ? Math.round((100 * needsOk) / needs) : 100
  }
}

/** Manques « Pour clôturer » recalculés après validations trésorier. */
export function computeEffectiveManques(yearData, year) {
  overridesVersion.value
  if (!yearData?.manques) return null

  const base = yearData.manques
  const stats = computeActionStats(yearData.actions, year)
  const overrides = listOverrides(year)

  const ignoredOrphans = new Set(
    Object.entries(overrides)
      .filter(([k, v]) => k.startsWith('orphan::') && v.action === 'ignore_orphan')
      .map(([k]) => k.replace('orphan::', ''))
  )
  const orphanFiles = yearData.actions?.orphan_files ?? []
  const orphanRemaining = orphanFiles.filter((n) => !ignoredOrphans.has(n))

  const checklist = base.checklist.map((c) => ({ ...c }))

  if (stats.pending === 0) {
    for (const c of checklist) {
      if (c.id === 'pieces_registre' || c.id === 'pieces_journal') c.ok = true
    }
  }
  if (stats.coverage >= 80) {
    const cov = checklist.find((c) => c.id === 'pieces_registre')
    if (cov) cov.ok = true
  }

  const orphanCheck = checklist.find((c) => c.id === 'factures_orphelines')
  if (orphanCheck) {
    const total = yearData.factures?.files_count ?? 0
    orphanCheck.ok = orphanRemaining.length === 0
    orphanCheck.label = `Factures classées (${total - orphanRemaining.length}/${total} liées)`
  }

  let items = base.items.map((i) => ({ ...i }))
  if (stats.pending === 0) {
    items = items.filter((i) => !PIECES_CATEGORIES.has(i.category))
  }
  if (orphanRemaining.length === 0) {
    items = items.filter((i) => i.category !== 'factures_orphelines')
  }

  const checklist_ok = checklist.filter((c) => c.ok).length
  const blocking = items.filter((i) => i.priority === 1).length

  let status
  let label
  if (blocking === 0 && checklist_ok === checklist.length) {
    status = 'pret'
    label = stats.pending === 0 ? 'Exercice clôturable' : 'Exercice clôturable (export CSV recommandé)'
  } else if (blocking === 0 && stats.pending === 0) {
    status = 'attention'
    label = 'Comptes OK · contrôles restants (équilibre, fichiers…)'
  } else if (blocking === 0) {
    status = 'attention'
    label = base.label
  } else {
    status = 'a_completer'
    label = base.label
  }

  return {
    ...base,
    status,
    label,
    checklist,
    items,
    checklist_ok,
    checklist_total: checklist.length,
    blocking_count: blocking,
    action_count: items.length,
    local_pending: stats.pending,
    local_coverage: stats.coverage
  }
}

export function useBilanEffective(yearRef, yearDataRef) {
  const effectiveActionsStats = computed(() =>
    computeActionStats(unref(yearDataRef)?.actions, unref(yearRef))
  )
  const effectiveManques = computed(() =>
    computeEffectiveManques(unref(yearDataRef), unref(yearRef))
  )
  return { effectiveActionsStats, effectiveManques }
}
