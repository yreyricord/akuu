<template>
  <div class="admin-table-wrap overflow-hidden rounded-2xl border border-night-100 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="admin-table min-w-full text-left text-sm">
        <thead class="sticky top-0 z-10 bg-cream-100/95 backdrop-blur">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-night-400"
              :class="alignClass(col.align)"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="rowKey(row, idx)"
            class="border-t border-night-50 transition-colors hover:bg-forest/[0.04]"
            :class="[idx % 2 === 1 ? 'bg-night-50/30' : 'bg-white', rowClass?.(row)]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :data-label="col.label"
              class="px-4 py-3 align-middle text-night-600"
              :class="alignClass(col.align)"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ formatCell(row, col) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!rows.length" class="px-4 py-10 text-center">
      <slot name="empty">
        <p class="text-sm text-night-400">{{ emptyMessage }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  emptyMessage: { type: String, default: 'Aucune entrée.' },
  rowKeyField: { type: String, default: 'id' },
  rowClass: { type: Function, default: null }
})

function rowKey(row, idx) {
  return row[props.rowKeyField] ?? row.reference ?? idx
}

function alignClass(align) {
  if (align === 'right') return 'text-right tabular-nums'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

function formatCell(row, col) {
  const v = row[col.key]
  if (v === undefined || v === null || v === '') return '—'
  if (col.format === 'pen') return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' PEN'
  return v
}
</script>

<style scoped>
@media (max-width: 639px) {
  .admin-table-wrap :deep(.admin-table thead) {
    display: none;
  }
  .admin-table-wrap :deep(.admin-table tbody tr) {
    display: block;
    margin: 0.75rem;
    padding: 0.75rem;
    border: 1px solid rgb(var(--night-100, 229 231 235));
    border-radius: 1rem;
    background: white;
  }
  .admin-table-wrap :deep(.admin-table tbody td) {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    border: none;
  }
  .admin-table-wrap :deep(.admin-table tbody td)::before {
    content: attr(data-label);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgb(var(--night-400));
    flex-shrink: 0;
  }
}
</style>
