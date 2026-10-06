<template>
  <div class="space-y-6">
    <header class="rounded-2xl border border-forest/20 bg-forest/5 p-5">
      <p class="text-[10px] font-bold uppercase tracking-wide text-forest-700">Lecture seule</p>
      <h2 class="mt-0.5 font-serif text-xl font-bold text-night">Transparence financière</h2>
      <p class="mt-1 text-sm text-night-600">Les comptes de l'association, exercice par exercice.</p>
    </header>

    <AdminComptaOverview />
  </div>
</template>

<script setup>
import AdminComptaOverview from './AdminComptaOverview.vue'
</script>
