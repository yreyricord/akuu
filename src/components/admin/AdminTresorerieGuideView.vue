<template>
  <div class="space-y-8">
    <header class="text-center sm:text-left">
      <button
        type="button"
        class="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
        @click="emit('back')"
      >
        <PhArrowLeft :size="14" weight="bold" aria-hidden="true" />
        Tous les modules
      </button>
      <h2 class="font-serif text-2xl font-bold text-night">Trésorerie</h2>
      <p class="mt-1 text-sm text-night-400">
        Procédure dépenses 2026 · Puerto Miguel
      </p>
    </header>

    <!-- Objectif -->
    <section class="rounded-2xl border border-forest/20 bg-forest/5 p-5">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-forest">Objectif</h3>
      <p class="mt-2 text-sm leading-relaxed text-night-600">
        Garantir une gestion <strong>claire, transparente et traçable</strong> des dépenses AKUU à Puerto Miguel.
        Chaque dépense doit être justifiée (date, montant, vendeur/bénéficiaire, objet).
        <strong>Aucune dépense sans justificatif ni explication.</strong>
      </p>
    </section>

    <!-- Workflow numérique -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-forest">
        <PhLightbulb :size="18" weight="duotone" aria-hidden="true" />
        Sur cet espace — comment ça marche
      </h3>
      <ol class="mt-4 space-y-4">
        <li v-for="(step, i) in digitalSteps" :key="i" class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white"
            aria-hidden="true"
          >
            {{ i + 1 }}
          </span>
          <div>
            <p class="text-sm font-medium text-night">{{ step.title }}</p>
            <p class="mt-0.5 text-xs text-night-400 leading-relaxed">{{ step.body }}</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- Seuils PEN — 2 cas uniquement -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Règle sur le site (S/.)</h3>
      <p class="mt-2 text-sm leading-relaxed text-night-600">
        <strong>Toute dépense</strong> passe par une demande AKUU-DEM (validée par le trésorier), puis par une ou plusieurs factures après achat.
        La dépense doit être utile au projet et prévue au budget — jamais autorisée automatiquement.
      </p>
      <ul class="mt-4 space-y-3">
        <li v-for="row in thresholdRows" :key="row.range" class="flex gap-3 rounded-xl bg-night-50/80 px-3 py-2.5">
          <span class="shrink-0 text-sm font-bold text-forest">{{ row.range }}</span>
          <span class="text-xs text-night-600 leading-relaxed">{{ row.rule }}</span>
        </li>
      </ul>
      <p class="mt-3 text-xs text-night-400">
        Total facturé ≤ montant du devis +{{ AMOUNT_TOLERANCE_PERCENT }}&nbsp;% · justificatif papier conservé à Puerto Miguel.
      </p>
    </section>

    <!-- Avant d'acheter -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Avant d'acheter — checklist</h3>
      <ul class="mt-3 space-y-2">
        <li v-for="item in beforePurchaseChecklist" :key="item" class="flex gap-2 text-sm text-night-600">
          <PhCheck :size="18" weight="bold" class="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
          {{ item }}
        </li>
      </ul>
      <p class="mt-3 rounded-lg bg-ochre/10 px-3 py-2 text-xs font-medium text-ochre-800">
        En cas de doute : ne pas acheter avant d'avoir demandé confirmation (demande sur cet espace).
      </p>
    </section>

    <!-- Après achat -->
    <section class="rounded-2xl border border-night-100 bg-white p-5 shadow-sm">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Après chaque achat</h3>
      <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-night-600">
        <li v-for="item in afterPurchaseSteps" :key="item">{{ item }}</li>
      </ol>
    </section>

    <!-- Sans reçu / avances -->
    <section class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-night">Pas de reçu officiel ?</h3>
        <p class="mt-2 text-xs leading-relaxed text-night-500">
          Utilisez le <strong>carnet de recibos</strong> de l'association : date, montant, détail des achats,
          signature du vendeur ou bénéficiaire. Photographiez-le comme un reçu classique.
        </p>
      </div>
      <div class="rounded-2xl border border-night-100 bg-white p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-night">Avances volontaires</h3>
        <p class="mt-2 text-xs leading-relaxed text-night-500">
          Régulariser sous <strong>{{ ADVANCE_REGULARIZATION_DAYS }} jours</strong> ou avant la fin de mission.
          Pas de nouvelle avance importante si une précédente n'est pas régularisée (accord trésorier requis).
        </p>
      </div>
    </section>

    <!-- Non pris en charge -->
    <section class="rounded-2xl border border-terracotta/20 bg-terracotta/5 p-5">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-terracotta">Non pris en charge par AKUU</h3>
      <ul class="mt-2 list-inside list-disc text-sm text-night-600">
        <li v-for="item in PROCESS_EXCLUDED_EXPENSES" :key="item">{{ item }}</li>
      </ul>
      <p class="mt-2 text-xs text-night-500">
        Dépense engagée sans autorisation préalable : le Conseil général peut refuser la prise en charge a posteriori.
      </p>
    </section>

    <!-- Actions -->
    <section>
      <h3 class="text-sm font-semibold uppercase tracking-wide text-night">Que voulez-vous faire ?</h3>
      <ul class="mt-3 grid gap-3 sm:grid-cols-3">
        <li v-for="action in memberActions" :key="action.tab">
          <button
            type="button"
            class="admin-action-card group w-full text-left"
            @click="go(action.tab)"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-xl" :class="action.iconBg">
              <component :is="action.icon" :size="24" weight="duotone" aria-hidden="true" />
            </span>
            <p class="mt-3 font-semibold text-night group-hover:text-forest">{{ action.label }}</p>
            <p class="mt-1 text-xs text-night-400 leading-snug">{{ action.hint }}</p>
          </button>
        </li>
      </ul>
    </section>

    <!-- Raccourcis trésorier -->
    <section v-if="auth.isTreasurer">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-bleu">Espace trésorier</h3>
      <p class="mt-1 text-xs text-night-400">
        Contrôle hebdomadaire : toutes les dépenses dans le tableur, justificatifs Drive, montants cohérents, avances régularisées.
      </p>
      <ul class="mt-3 grid gap-3 sm:grid-cols-2">
        <li v-for="action in treasurerActions" :key="action.tab">
          <button
            type="button"
            class="admin-action-card group w-full text-left border-bleu/20"
            @click="go(action.tab)"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-bleu/10 text-bleu">
              <component :is="action.icon" :size="24" weight="duotone" aria-hidden="true" />
            </span>
            <p class="mt-3 font-semibold text-night">{{ action.label }}</p>
            <p class="mt-1 text-xs text-night-400">{{ action.hint }}</p>
            <span
              v-if="action.tab === 'validation' && pendingCount"
              class="mt-2 inline-block rounded-full bg-terracotta px-2 py-0.5 text-[10px] font-bold text-white"
            >
              {{ pendingCount }} en attente
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import {
  PhLightbulb,
  PhFileText,
  PhReceipt,
  PhClockCounterClockwise,
  PhCheckSquare,
  PhTable,
  PhCheck,
  PhArrowLeft
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/store/auth.js'
import { useTresorerieStore } from '@/store/tresorerie.js'
import {
  DEVIS_PEN_THRESHOLD,
  MIN_DEVIS_ATTACHMENTS,
  AMOUNT_TOLERANCE_PERCENT,
  ADVANCE_REGULARIZATION_DAYS,
  PROCESS_EXCLUDED_EXPENSES
} from '@/data/tresorerie-config.js'

defineProps({
  pendingCount: { type: Number, default: 0 }
})

const emit = defineEmits(['back', 'navigate'])

const auth = useAuthStore()
const store = useTresorerieStore()

const digitalSteps = [
  {
    title: 'Demande / devis avant achat (obligatoire)',
    body: `Projet, nature, montant, date souhaitée, description et justification. Le trésorier approuve · vous recevez une référence AKUU-DEM-… pour les factures.`
  },
  {
    title: `Si > ${DEVIS_PEN_THRESHOLD} S/. : photos de devis fournisseurs`,
    body: `En plus de la demande, joignez au moins ${MIN_DEVIS_ATTACHMENTS} photos ou PDF de devis magasin · le trésorier les valide avant d'approuver. En dessous de ce montant : pas de photo à joindre.`
  },
  {
    title: 'Factures après achat — un devis, plusieurs tickets',
    body: `Sélectionnez votre AKUU-DEM-… une seule fois. Renseignez les infos communes (moyen de paiement, payé par, lieu), puis une ligne par reçu : date, magasin, montant, photo. Enregistrement en brouillon — le trésorier ne voit rien tant que vous n'avez pas cliqué « Clore le devis ». Total de toutes les factures ≤ devis +${AMOUNT_TOLERANCE_PERCENT} % (moins = OK).`
  },
  {
    title: 'Clôture du devis et validation trésorier',
    body: 'Quand tous les reçus sont déposés : « Clore le devis — envoyer au trésorier ». Il valide le lot en une seule action (toutes les factures passent au journal). Il reste du budget ? Vous pouvez déposer d\'autres factures sur la même demande.'
  },
  {
    title: 'Suivi et historique',
    body: 'Statuts en temps réel dans Historique · refus motivé · resoumission possible · justificatif papier conservé dans le classeur à Puerto Miguel.'
  }
]

const thresholdRows = [
  {
    range: `≤ ${DEVIS_PEN_THRESHOLD} S/.`,
    rule: 'Demande + validation trésorier + facture(s) · sans photo de devis fournisseur à joindre.'
  },
  {
    range: `> ${DEVIS_PEN_THRESHOLD} S/.`,
    rule: `Demande + min. ${MIN_DEVIS_ATTACHMENTS} photos/PDF de devis fournisseurs (validées par le trésorier) + facture(s) après achat.`
  }
]

const beforePurchaseChecklist = [
  'La dépense concerne-t-elle bien AKUU (pas de dépense personnelle) ?',
  'Est-elle nécessaire et prévue au budget ?',
  'Ai-je l\'autorisation nécessaire (demande validée) ?',
  'Ai-je suffisamment d\'argent pour l\'achat ?',
  'Puis-je obtenir un justificatif (reçu ou carnet recibos) ?'
]

const afterPurchaseSteps = [
  'Conserver chaque justificatif papier (classeur sur place).',
  'Photographier chaque reçu dès l\'achat (date, montant, vendeur, produits visibles).',
  'Dans la semaine : onglet Facture → référence DEM → une ligne par ticket (dates différentes possibles).',
  'Enregistrer en brouillon ; ajouter d\'autres factures si besoin, puis clore le devis pour envoyer au trésorier.',
  'Le site nomme et range chaque pièce sur le Drive automatiquement.'
]

const memberActions = [
  {
    tab: 'demande',
    label: 'Demande',
    hint: 'Avant achat · validation trésorier / CG',
    icon: PhFileText,
    iconBg: 'bg-forest/10 text-forest'
  },
  {
    tab: 'facture',
    label: 'Facture',
    hint: 'Après achat · plusieurs reçus · clôture devis',
    icon: PhReceipt,
    iconBg: 'bg-leaf/20 text-forest'
  },
  {
    tab: 'historique',
    label: 'Historique',
    hint: 'Vos demandes et factures',
    icon: PhClockCounterClockwise,
    iconBg: 'bg-bleu/10 text-bleu'
  }
]

const treasurerActions = [
  {
    tab: 'validation',
    label: 'Validation',
    hint: 'Demandes · lots de factures (1 clic par devis)',
    icon: PhCheckSquare
  },
  {
    tab: 'compta',
    label: 'Compta Google',
    hint: 'Sheets · dossiers Drive',
    icon: PhTable
  }
]

function go(tab) {
  store.clearMessages()
  emit('navigate', tab)
}
</script>

<style scoped>
.admin-action-card {
  @apply rounded-2xl border border-night-100 bg-white p-4 shadow-sm transition
         hover:border-forest/30 hover:shadow-md active:scale-[0.99];
}
</style>
