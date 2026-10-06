<template>
  <section class="space-y-4 rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Projets & catégories</h3>
      <p class="mt-1 text-xs text-night-500">
        Listes utilisées dans les écritures, demandes et factures.
      </p>
    </div>

    <AdminLoadingPanel
      v-if="loading"
      variant="inline"
      title="Projets & catégories"
      :progress="loadProg.progress"
      hint=""
    />
    <p v-else-if="error" class="text-sm text-terracotta-700">{{ error }}</p>

    <template v-else>
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wide text-night-500">Projets</h4>
        <ul class="mt-2 space-y-2">
          <li v-for="(p, i) in projects" :key="i" class="flex flex-wrap items-center gap-2">
            <input v-model="p.code" class="admin-input w-28 py-1 text-xs font-mono" placeholder="code" />
            <input v-model="p.label" class="admin-input min-w-[12rem] flex-1 py-1 text-xs" placeholder="Libellé" />
            <button type="button" class="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold text-terracotta-700 hover:bg-terracotta/10" @click="projects.splice(i, 1)">Retirer</button>
          </li>
        </ul>
        <button type="button" class="mt-2 text-xs font-semibold text-forest-700 hover:underline" @click="projects.push({ code: '', label: '' })">
          + Ajouter un projet
        </button>
      </div>

      <div>
        <h4 class="text-xs font-bold uppercase tracking-wide text-night-500">Catégories de dépense</h4>
        <ul class="mt-2 space-y-2">
          <li v-for="(c, i) in categories" :key="i" class="flex flex-wrap items-center gap-2">
            <input v-model="c.code" class="admin-input w-28 py-1 text-xs font-mono" placeholder="code" />
            <input v-model="c.label" class="admin-input min-w-[12rem] flex-1 py-1 text-xs" placeholder="Libellé" />
            <button type="button" class="inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold text-terracotta-700 hover:bg-terracotta/10" @click="categories.splice(i, 1)">Retirer</button>
          </li>
        </ul>
        <button type="button" class="mt-2 text-xs font-semibold text-forest-700 hover:underline" @click="categories.push({ code: '', label: '' })">
          + Ajouter une catégorie
        </button>
      </div>

      <div class="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          class="min-h-[40px] rounded-full bg-forest px-4 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <p v-if="saved" class="self-center text-sm text-forest-700">Enregistré.</p>
      </div>
    </template>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { TRESORERIE_CATEGORIES, TRESORERIE_PROJECTS } from '@/data/tresorerie-config.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import AdminLoadingPanel from './AdminLoadingPanel.vue'

const emit = defineEmits(['updated'])

const loading = ref(true)
const loadProg = bindLoadingProgress(loading, { estimateMs: 12_000, label: 'Réglages…' })
const saving = ref(false)
const saved = ref(false)
const error = ref(null)
const projects = ref([])
const categories = ref([])

async function load() {
  loading.value = true
  error.value = null
  try {
    const meta = await tresorerieApi.getTresorerieMeta()
    projects.value = (meta.projects?.length ? meta.projects : TRESORERIE_PROJECTS).map((p) => ({ ...p }))
    categories.value = (meta.categories?.length ? meta.categories : TRESORERIE_CATEGORIES).map((c) => ({ ...c }))
  } catch (e) {
    projects.value = TRESORERIE_PROJECTS.map((p) => ({ ...p }))
    categories.value = TRESORERIE_CATEGORIES.map((c) => ({ ...c }))
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = null
  try {
    await tresorerieApi.saveTresorerieMeta({
      projects: projects.value.filter((p) => p.code && p.label),
      categories: categories.value.filter((c) => c.code && c.label)
    })
    saved.value = true
    emit('updated')
  } catch (e) {
    error.value = e.message || 'Enregistrement impossible'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
