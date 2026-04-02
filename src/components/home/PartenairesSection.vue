<template>
  <section class="section-padding bg-white">
    <div class="container-narrow">
      <SectionTitle :subtitle="$t('partners.subtitle')">
        {{ $t('partners.title') }}
      </SectionTitle>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 fade-in-up">
        <PartnerCard
          v-for="partner in partenaires"
          :key="partner.nom"
          :nom="partner.nom"
          :logo="partner.logo"
          :url="partner.url"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { useDataStore } from '@/store'
import SectionTitle from '@/components/shared/SectionTitle.vue'
import PartnerCard from '@/components/shared/PartnerCard.vue'

const store = useDataStore()
const partenaires = store.partenaires
</script>
