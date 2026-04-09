<template>
  <div>
    <HeroSection />
    <MissionSection />
    <HomeAnniversaryBanner />
    <ProjetHighlight />
    <DonSection />
    <SocialSection />
    <PartenairesSection />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import HeroSection from '@/components/home/HeroSection.vue'
import HomeAnniversaryBanner from '@/components/home/HomeAnniversaryBanner.vue'
import MissionSection from '@/components/home/MissionSection.vue'
import ProjetHighlight from '@/components/home/ProjetHighlight.vue'
import DonSection from '@/components/home/DonSection.vue'
import SocialSection from '@/components/home/SocialSection.vue'
import PartenairesSection from '@/components/home/PartenairesSection.vue'

let observer = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )
  document.querySelectorAll('.fade-in-up').forEach((el) => observer.observe(el))
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
