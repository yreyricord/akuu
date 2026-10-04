<template>
  <div
    v-if="count > 0"
    class="inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest-800"
    role="status"
    :aria-label="`${count} tâche${count > 1 ? 's' : ''} en cours`"
  >
    <span class="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-forest motion-reduce:animate-none" aria-hidden="true" />
    {{ count }} tâche{{ count > 1 ? 's' : '' }} en cours
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUploadQueue } from '@/store/uploadQueue.js'

const uploads = useUploadQueue()
const count = computed(() => uploads.activeJobs.length)
</script>
