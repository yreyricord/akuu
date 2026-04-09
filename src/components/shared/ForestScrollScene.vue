<template>
  <!--
    Bloc page optionnel : crème + grille + texte (#aside). Le visuel parallaxe
    est dans ForestScrollVisual.vue (réutilisé par MissionSection, etc.).
  -->
  <section class="forest-section section-padding bg-cream">
    <div class="container-narrow">
      <div
        class="forest-section__grid gap-12 md:gap-16"
        :class="
          hasAside
            ? 'grid md:grid-cols-2 md:items-center'
            : 'flex flex-col items-center'
        "
      >
        <div
          class="forest-section__visual w-full"
          :class="hasAside ? '' : 'max-w-3xl mx-auto'"
        >
          <ForestScrollVisual wrapper-class="fade-in-up" />
        </div>

        <div
          v-if="hasAside"
          class="forest-aside flex flex-col justify-center text-balance fade-in-up"
        >
          <slot name="aside" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import ForestScrollVisual from './ForestScrollVisual.vue'

const slots = useSlots()
const hasAside = computed(() => Boolean(slots.aside?.().length))
</script>
