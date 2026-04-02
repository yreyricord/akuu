import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import projetsData from '@/data/projets.json'
import equipeData from '@/data/equipe.json'
import partenairesData from '@/data/partenaires.json'
import rapportsData from '@/data/rapports.json'
import timelineData from '@/data/timeline.json'
import volontairesData from '@/data/volontaires.json'

export const useDataStore = defineStore('data', () => {
  const projets = ref(projetsData)
  const equipe = ref(equipeData)
  const partenaires = ref(partenairesData)
  const rapports = ref(rapportsData)
  const timeline = ref(timelineData)
  const volontairesInfo = ref(volontairesData)

  const projetsEnCours = computed(() =>
    projets.value.filter(p => p.statut === 'en_cours')
  )

  const projetsRealises = computed(() =>
    projets.value.filter(p => p.statut === 'realise')
  )

  const projetsEnPreparation = computed(() =>
    projets.value.filter(p => p.statut === 'en_preparation')
  )

  const sortedTimeline = computed(() =>
    [...timeline.value].sort((a, b) => a.annee - b.annee)
  )

  const sortedRapports = computed(() =>
    [...rapports.value].sort((a, b) => b.annee - a.annee)
  )

  return {
    projets,
    equipe,
    partenaires,
    rapports,
    timeline,
    volontairesInfo,
    projetsEnCours,
    projetsRealises,
    projetsEnPreparation,
    sortedTimeline,
    sortedRapports
  }
})
