# Positionnement dans le parcours formation

## Carte des modules (extrait)

| ID | Groupe | Accent | Titre (fr) | Deck existant |
|----|--------|--------|------------|---------------|
| 1–4 | 1 · Amazonie | forest | Contexte, histoire, faune… | ✅ |
| **5** | **2 · Éthique** | **bleu** | Solidarité internationale | ✅ module-5-deck |
| **6** | **2 · Éthique** | **bleu** | **Être un bénévole responsable** | ❌ **À CRÉER** |
| 7 | 2 · Éthique | bleu | Mises en situation et dilemmes | ❌ placeholder |
| 8 | 3 · Terrain | terracotta | (module opérationnel) | ✅ module-8-deck |
| 9 | 3 · Terrain | terracotta | (placeholder) | ❌ |
| 10 | 3 · Terrain | terracotta | Vivre sa mission à Puerto Miguel | ✅ module-10-deck |
| 11 | 4 | night | (placeholder) | ❌ |

## Arc narratif M5 → M6 → M7 → M10

```
M5  THÉORIE          M6  COMPORTEMENT       M7  PRATIQUE          M10  LOGISTIQUE
     │                    │                     │                      │
     Pourquoi             Comment               Dilemmes               Kit + appel
     vigilance            se comporter          simulés                terrain
     │                    │                     │                      │
     White savior    →    Règles terrain   →    Cas concrets    →     Casa, voyage
     Volontourisme   →    Casquette AKUU   →    Jeu de rôle     →     Vie quotidienne
     Photos éthiques →    Lignes rouges    →    Quiz futur      →     Contacts PM
```

## Déduplication stricte M6 vs M10

| Sujet | Module 6 | Module 10 |
|-------|----------|-----------|
| Règlement 7 piliers | Synthèse éthique + posture | Carousel complet + signature |
| Casa, eau, électricité | Mention légère (vie collective) | Détail opérationnel |
| Sécurité urgence | Processus + règles comportement | Contacts + contrats bateau |
| Appel terrain | ❌ | ✅ Cœur du M10 |
| Faune / bushmeat | Règle bénévole + renvoi M4 | ❌ |
| Tourisme sexuel | ✅ Section majeure | ❌ |
| Casquette après mission | ✅ Slide dédiée COVID | Mention légère |

## Liens navigation inter-modules

- **M5 clôture** pointe déjà vers `/formation/module-6`
- **M6 clôture** doit pointer vers `/formation/module-7`
- Pattern HTML :

```html
<a href="/formation/module-7" target="_top" rel="noopener" class="deck-next-module">
  <div class="small deck-next-module__label">PROCHAIN MODULE</div>
  <div class="deck-next-module__title">Module 7 : Mises en situation et dilemmes éthiques</div>
</a>
```

## Enregistrement app (obligatoire)

Fichier : `src/data/formation-modules.js`

```js
export const MODULE_DECKS = {
  // ... existants ...
  6: '/formation/module-6-deck/index.html',
}
```

Sans cette ligne, l'app affiche « coming soon » dans `FormationModuleView.vue`.
