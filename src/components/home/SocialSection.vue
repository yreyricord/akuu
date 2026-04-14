<template>
  <section class="bg-white px-4 pt-16 md:pt-24 pb-8 md:pb-10">
    <div class="container-narrow">
      <SectionTitle :subtitle="$t('social.subtitle')">
        {{ $t('social.title') }}
      </SectionTitle>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto fade-in-up">
        <a
          v-for="network in networks"
          :key="network.name"
          :href="network.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-forest/10 hover:border-forest/30 hover:shadow-lg transition-all duration-300"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            :class="network.bgClass"
          >
            <component :is="network.component" :size="28" weight="fill" class="text-white" />
          </div>
          <span class="text-sm font-semibold text-night group-hover:text-forest transition-colors">
            {{ network.name }}
          </span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { PhFacebookLogo, PhInstagramLogo, PhLinkedinLogo, PhTiktokLogo } from '@phosphor-icons/vue'
import SectionTitle from '@/components/shared/SectionTitle.vue'

const networks = [
  { name: 'Facebook', url: 'https://www.facebook.com/AKUUAssociation/', bgClass: 'bg-[#1877F2]', component: PhFacebookLogo },
  { name: 'Instagram', url: 'https://www.instagram.com/akuu_association/', bgClass: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]', component: PhInstagramLogo },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/akuu-association/', bgClass: 'bg-[#0A66C2]', component: PhLinkedinLogo },
  { name: 'TikTok', url: 'https://www.tiktok.com/@akuu_asso', bgClass: 'bg-night', component: PhTiktokLogo },
]
</script>
