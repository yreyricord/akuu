<template>
  <div class="space-y-3">
    <span v-if="label" class="text-sm font-medium text-night">{{ label }}</span>
    <div class="grid gap-2" :class="showGallery ? 'sm:grid-cols-2' : 'grid-cols-1'">
      <!-- Mobile : label natif → ouvre l'appareil photo -->
      <label
        v-if="preferNativeCamera"
        class="admin-touch-btn relative cursor-pointer"
        :class="{ 'pointer-events-none opacity-50': disabled || processing }"
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          :multiple="multiple"
          :disabled="disabled || processing"
          @change="onCameraPick"
        />
        <PhCamera :size="22" weight="duotone" aria-hidden="true" />
        Prendre une photo
      </label>
      <!-- Desktop : webcam ou sélecteur de fichiers -->
      <button
        v-else
        type="button"
        class="admin-touch-btn"
        :disabled="disabled || processing"
        @click="openDesktopCamera"
      >
        <PhCamera :size="22" weight="duotone" aria-hidden="true" />
        Prendre une photo
      </button>

      <label
        v-if="showGallery"
        class="admin-touch-btn admin-touch-btn--secondary relative cursor-pointer"
        :class="{ 'pointer-events-none opacity-50': disabled || processing }"
      >
        <input
          type="file"
          :accept="accept"
          class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          :multiple="multiple"
          :disabled="disabled || processing"
          @change="onFilePick"
        />
        <PhImages :size="22" weight="duotone" aria-hidden="true" />
        {{ galleryLabel }}
      </label>
    </div>

    <!-- Fallback desktop si webcam indisponible -->
    <input
      ref="fallbackInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onCameraPick"
    />

    <ul v-if="files.length" class="space-y-2">
      <li
        v-for="(file, i) in files"
        :key="fileKey(file, i)"
        class="flex items-center gap-3 rounded-xl border border-night-100 bg-cream px-3 py-2"
      >
        <img
          v-if="isImage(file) && previews[i]"
          :src="previews[i]"
          alt=""
          class="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
        <span
          v-else
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bleu/10 text-bleu"
        >
          <PhFilePdf v-if="isPdf(file)" :size="24" weight="duotone" aria-hidden="true" />
          <PhFile v-else :size="24" weight="duotone" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-night">{{ file.name }}</p>
          <p class="text-xs text-night-400">{{ formatSize(file.size) }}</p>
        </div>
        <button
          type="button"
          class="touch-target shrink-0 rounded-full text-night-400 hover:bg-night-50 hover:text-terracotta"
          aria-label="Retirer le fichier"
          @click="removeAt(i)"
        >
          <PhX :size="18" weight="bold" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <img
      v-if="!multiple && singlePreview && !isPdf(files[0])"
      :src="singlePreview"
      alt="Aperçu"
      class="max-h-52 w-full rounded-xl border border-night-100 object-contain bg-night-50"
    />

    <p v-if="processing" class="text-xs font-medium text-bleu">Conversion en PDF…</p>
    <p v-if="fileError" class="text-xs text-terracotta">{{ fileError }}</p>
    <p v-if="hint" class="text-xs text-night-400">{{ hint }}</p>

    <!-- Modal webcam (desktop) -->
    <Teleport to="body">
      <div
        v-if="webcamOpen"
        class="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-label="Prendre une photo"
        @click.self="closeWebcam"
      >
        <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="border-b border-night-100 px-4 py-3">
            <h3 class="font-serif text-lg font-bold text-night">Appareil photo</h3>
            <p class="text-xs text-night-400">Autorisez l'accès à la caméra si le navigateur le demande.</p>
          </div>
          <div class="relative aspect-[4/3] bg-night">
            <video
              ref="videoRef"
              autoplay
              playsinline
              muted
              class="h-full w-full object-cover"
            />
          </div>
          <div class="flex gap-2 p-4">
            <button type="button" class="flex-1 rounded-full border border-night-200 py-3 text-sm font-semibold text-night" @click="closeWebcam">
              Annuler
            </button>
            <button type="button" class="flex-1 rounded-full bg-forest py-3 text-sm font-semibold text-white" @click="captureWebcam">
              Capturer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { PhCamera, PhImages, PhFile, PhFilePdf, PhX } from '@phosphor-icons/vue'
import {
  isAllowedReceiptFile,
  isPdfFile,
  normalizeReceiptToPdf,
  RECEIPT_ACCEPT_ATTR,
  RECEIPT_FORMATS_LABEL
} from '@/utils/receiptFile.js'

const props = defineProps({
  label: { type: String, default: '' },
  accept: { type: String, default: RECEIPT_ACCEPT_ATTR },
  multiple: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  galleryLabel: { type: String, default: 'Choisir fichier / PDF' },
  modelValue: { type: Array, default: () => [] },
  /** Convertit automatiquement images → PDF avant envoi. */
  normalizeToPdf: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'update:single'])

const fallbackInput = ref(null)
const videoRef = ref(null)
const files = ref([])
const previews = ref([])
const singlePreview = ref(null)
const webcamOpen = ref(false)
const processing = ref(false)
const fileError = ref('')
let mediaStream = null

const showGallery = computed(() => props.accept.includes('pdf') || props.accept.includes('*'))

/** Téléphone / tablette → input natif avec capture=environment */
const preferNativeCamera = computed(() => {
  if (typeof navigator === 'undefined') return true
  const ua = navigator.userAgent || ''
  const mobileUa = /iPhone|iPad|iPod|Android|webOS|Mobile/i.test(ua)
  const touch = navigator.maxTouchPoints > 1
  return mobileUa || touch
})

watch(
  () => props.modelValue,
  (v) => {
    if (props.multiple) files.value = [...(v ?? [])]
  },
  { immediate: true }
)

function isImage(file) {
  return file?.type?.startsWith('image/')
}

function isPdf(file) {
  return isPdfFile(file)
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  return `${(bytes / 1024).toFixed(1)} Ko`
}

function fileKey(file, i) {
  return `${file.name}-${file.size}-${i}`
}

function revokePreviews() {
  previews.value.forEach((url) => { if (url) URL.revokeObjectURL(url) })
  previews.value = []
  if (singlePreview.value) URL.revokeObjectURL(singlePreview.value)
  singlePreview.value = null
}

function syncPreviews() {
  revokePreviews()
  if (props.multiple) {
    previews.value = files.value.map((f) => (isImage(f) ? URL.createObjectURL(f) : null))
  } else if (files.value[0] && isImage(files.value[0])) {
    singlePreview.value = URL.createObjectURL(files.value[0])
  }
}

function emitFiles() {
  if (props.multiple) {
    emit('update:modelValue', [...files.value])
  } else {
    emit('update:single', files.value[0] ?? null)
  }
}

async function mergeFiles(incoming) {
  if (!incoming.length) return
  fileError.value = ''
  processing.value = true
  const accepted = []
  try {
    for (const file of incoming) {
      if (!isAllowedReceiptFile(file)) {
        fileError.value = `Format non accepté (${file.name}). Formats autorisés : ${RECEIPT_FORMATS_LABEL}.`
        continue
      }
      try {
        const normalized = props.normalizeToPdf ? await normalizeReceiptToPdf(file) : file
        accepted.push(normalized)
      } catch (err) {
        fileError.value = err?.message ?? `Impossible de traiter ${file.name}.`
      }
    }
    if (!accepted.length) return
    if (props.multiple) {
      files.value = [...files.value, ...accepted]
    } else {
      files.value = [accepted[0]]
    }
    syncPreviews()
    emitFiles()
  } finally {
    processing.value = false
  }
}

function onCameraPick(e) {
  mergeFiles(Array.from(e.target.files ?? []))
  e.target.value = ''
}

function onFilePick(e) {
  mergeFiles(Array.from(e.target.files ?? []))
  e.target.value = ''
}

function removeAt(index) {
  if (previews.value[index]) URL.revokeObjectURL(previews.value[index])
  files.value.splice(index, 1)
  previews.value.splice(index, 1)
  if (!props.multiple && !files.value.length && singlePreview.value) {
    URL.revokeObjectURL(singlePreview.value)
    singlePreview.value = null
  }
  emitFiles()
}

function stopStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
  if (videoRef.value) videoRef.value.srcObject = null
}

function closeWebcam() {
  stopStream()
  webcamOpen.value = false
}

async function openDesktopCamera() {
  if (props.disabled) return
  if (!navigator.mediaDevices?.getUserMedia) {
    fallbackInput.value?.click()
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    })
    webcamOpen.value = true
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
    }
  } catch {
    fallbackInput.value?.click()
  }
}

function captureWebcam() {
  const video = videoRef.value
  if (!video?.videoWidth) return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  canvas.toBlob(
    (blob) => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      mergeFiles([file])
      closeWebcam()
    },
    'image/jpeg',
    0.92
  )
}

onBeforeUnmount(() => {
  revokePreviews()
  stopStream()
})

defineExpose({ files })
</script>
