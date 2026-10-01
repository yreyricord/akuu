<template>
  <div class="space-y-6">
    <header>
      <h2 class="font-serif text-2xl font-bold text-night">Demandes d'accès</h2>
      <p class="mt-1 text-sm text-night-400">
        Validez ou refusez les nouvelles inscriptions · réservé à {{ ADMIN_EMAIL }}
      </p>
    </header>

    <AdminLoadingPanel
      v-if="loading"
      variant="inline"
      title="Demandes d'accès"
      :progress="loadProg.progress"
      hint=""
    />

    <p v-else-if="!requests.length" class="rounded-xl border border-night-100 bg-white p-6 text-center text-sm text-night-400">
      Aucune demande en attente.
    </p>

    <ul v-else class="space-y-4">
      <li
        v-for="req in requests"
        :key="req.id"
        class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-night">{{ displayName(req) }}</p>
            <p class="text-sm text-night-500">{{ req.email }}</p>
          </div>
          <span class="rounded-full bg-ochre/15 px-2.5 py-0.5 text-xs font-bold uppercase text-ochre">
            {{ roleLabel(req.requested_role) }}
          </span>
        </div>
        <p v-if="req.message" class="mt-3 text-sm text-night-600 whitespace-pre-wrap">{{ req.message }}</p>
        <p class="mt-2 text-xs text-night-400">
          Reçue le {{ formatDate(req.created_at) }}
        </p>

        <div v-if="rejectingId === req.id" class="mt-4 space-y-2">
          <textarea
            v-model="rejectReason"
            rows="2"
            class="admin-input resize-none"
            placeholder="Motif du refus (obligatoire)"
          />
          <div class="flex gap-2">
            <button type="button" class="btn-primary flex-1" :disabled="actionLoading" @click="confirmReject(req.id)">
              Confirmer le refus
            </button>
            <button type="button" class="rounded-full border border-night-200 px-4 py-2 text-sm" @click="cancelReject">
              Annuler
            </button>
          </div>
        </div>
        <div v-else class="mt-4 flex gap-2">
          <button
            type="button"
            class="btn-primary flex-1"
            :disabled="actionLoading"
            @click="approve(req.id)"
          >
            Approuver
          </button>
          <button
            type="button"
            class="flex-1 rounded-full border border-terracotta/40 px-4 py-2 text-sm font-semibold text-terracotta"
            :disabled="actionLoading"
            @click="startReject(req.id)"
          >
            Refuser
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ADMIN_EMAIL, roleLabel } from '@/data/member-roles.js'
import { buildFullName } from '@/data/user-profile.js'
import { tresorerieApi } from '@/api/tresorerie/client.js'
import { bindLoadingProgress } from '@/composables/useLoadingProgress.js'
import AdminLoadingPanel from './AdminLoadingPanel.vue'

function displayName(req) {
  return req.name || buildFullName(req.first_name, req.last_name) || req.email
}

const requests = ref([])
const loading = ref(false)
const loadProg = bindLoadingProgress(loading, { estimateMs: 10_000, label: 'Liste…' })
const actionLoading = ref(false)
const rejectingId = ref(null)
const rejectReason = ref('')

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load() {
  loading.value = true
  try {
    requests.value = await tresorerieApi.getAccessRequestsPending()
  } finally {
    loading.value = false
  }
}

async function approve(id) {
  actionLoading.value = true
  try {
    await tresorerieApi.approveAccessRequest(id)
    await load()
  } catch (e) {
    alert(e.message)
  } finally {
    actionLoading.value = false
  }
}

function startReject(id) {
  rejectingId.value = id
  rejectReason.value = ''
}

function cancelReject() {
  rejectingId.value = null
  rejectReason.value = ''
}

async function confirmReject(id) {
  if (!rejectReason.value.trim()) return
  actionLoading.value = true
  try {
    await tresorerieApi.rejectAccessRequest(id, rejectReason.value.trim())
    cancelReject()
    await load()
  } catch (e) {
    alert(e.message)
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>
