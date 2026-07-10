# Plan — Sourcing des chiffres et affirmations, Module 1

Statut : **proposition, en attente de validation**. Aucune slide n'a été modifiée pour ce chantier.

## 1. État des lieux (audit du fichier actuel)

Le deck `public/formation/module-1-deck/index.html` compte aujourd'hui **43 slides**. Un système de source au survol existe déjà et n'est **pas à réinventer** :

- Attribut `data-src="..."` sur l'élément à sourcer (texte de citation libre : auteur · revue · année).
- Classe `.src-data` (soulignement pointillé, `cursor:help`) + `tabindex="0"` pour l'accessibilité clavier — ajoutés automatiquement par `bindSrc()` dans `deck-interactions.js` si absents.
- Un tooltip unique (`#deck-src-tooltip`) suivant le curseur, positionné par `positionTip()`, affiché via `showTip()`/`findSrcUnderPointer()` (survol souris) et sur `focus` (clavier).

**41 éléments** ont déjà un `data-src`. C'est une bonne base, mais deux limites empêchent d'atteindre ce que tu demandes :

1. Le tooltip affiche seulement la **chaîne de citation brute** (ex. `"Roosevelt · Science · 1991 — Pedra Pintada"`) — pas de titre distinct, pas de résumé, pas de lien cliquable. C'est un `pointer-events:none`, donc même si on y mettait un lien, il serait inatteignable au clic.
2. La couverture est **très inégale** d'une slide à l'autre.

### Audit slide par slide (chiffres = compte automatique)

| Slide | Chiffres-clés (`.num`) | Déjà sourcés (`data-src`) | Statut |
|---|---|---|---|
| 4 · Délimitation géographique | 3 | 4 | ✅ couvert |
| 5 · Se représenter l'échelle | 3 | 3 | ✅ couvert |
| 6 · Le fleuve Amazone | 4 | 5 | ✅ couvert |
| 7 · Biodiversité en chiffres | 6 | 7 | ✅ couvert |
| 8 · 9 pays, une seule forêt | — | 1 | ✅ couvert |
| 10 · Régulateur climatique mondial | 8 | 8 | ✅ couvert |
| 17 · Mythe #2 Betty vs Anna | — | 4 | ✅ couvert (citations dans les bulles) |
| 22 · L'écologie historique | — | 1 | 🟡 partiel — voir §1.1 |
| 24 · Les géoglyphes de l'Acre | 4 | 5 | ✅ couvert |
| **11 · Réserve Nationale de Pacaya** | 1 | 0 | 🔴 **à sourcer** |
| **15 · Pourquoi la forêt semblait vierge** | 1 | 0 | 🔴 **à sourcer** |
| **18 · La terra preta** | — | 0 | 🔴 **à sourcer** (affirmations qualitatives) |
| **19 · Mythe #3 — L'Eldorado** | — | 0 | 🔴 **à sourcer** |
| **23 · Un jardin géant** | 5 | 0 | 🔴 **priorité haute** (5 chiffres nus) |
| **25 · Le LiDAR** | 3 | 0 | 🔴 **à sourcer** |
| **27 · Kuhikugu** | 3 | 0 | 🔴 **à sourcer** |
| **28 · L'île de Marajó** | — | 0 | 🔴 **à sourcer** |
| **30 · Gran Pajatén** | — | 0 | 🔴 **à sourcer** |
| **33 · Élément 1 — L'EAU** | 4 | 0 | 🔴 **priorité haute** (débit fleuve, % eau douce…) |
| **36–41 · Menaces (eau/terre/feu)** | 0 | 0 | 🔴 **à sourcer** (affirmations de tendance, pourcentages en prose) |
| **42 · Élément 4 — L'AIR** | 2 | 0 | 🔴 **priorité haute** (stock carbone, +0,3 °C) |

*(Table complète disponible sur demande — ici les lignes les plus significatives ; slides de titre/transition sans chiffres omises.)*

**Constat déjà utile, sans recherche supplémentaire** : en vérifiant le chiffre "×7 le débit du Congo" (slide 33), les données USGS / Amazon Waters donnent plutôt un ratio **×5** (Amazone ≈ 219–224 000 m³/s vs Congo ≈ 41 400 m³/s). C'est exactement le genre d'erreur que ce chantier doit détecter — la recherche de sources n'est pas qu'une décoration, c'est aussi une passe de vérification factuelle.

### 1.1 Cas d'étude : slide 22 « L'écologie historique »

Cette slide a déjà été enrichie avec l'étude McMichael et al. (PNAS, 2025) : figure, 5 cartes de synthèse (question / méthode / résultat 1 / résultat 2 / conclusion), et une citation globale sur le titre (`data-src` unique). C'est le bon contenu, mais avec le système actuel :

- Le survol du **titre** donne la citation groupée, mais les chiffres individuels dans les cartes (**7 300 sites**, **262 espèces**, **1 521 parcelles**, **50 %**, **175 ans**) n'ont pas leur propre point d'accroche — l'utilisateur ne peut pas isoler "d'où vient ce chiffre précis".
- Il n'y a pas de lien cliquable vers l'article, ni de résumé consultable sans quitter la slide.

C'est le gabarit que je propose de généraliser (voir §3).

## 2. Méthodologie de recherche des sources

Pour chaque chiffre/affirmation identifié dans l'audit :

1. **Prioriser dans cet ordre** : article peer-reviewed (Nature, Science, PNAS, Scientific Reports, Nature Climate Change…) → rapport d'organisme reconnu (IPCC/GIEC, WWF, USGS, NASA, INPE, RAISG, Science Panel for the Amazon) → livre/monographie académique citée par les précédents. Pas de blogs, pas de Wikipedia comme source finale (seulement pour retrouver la piste vers la source primaire).
2. **Recouper** : si un chiffre est cité par 2 sources indépendantes convergentes, on le garde avec la plus citée/la plus récente en référence principale. S'il n'y a qu'une seule source trouvable, ou si le chiffre est approximatif/arrondi de façon suspecte, on le marque `⚠️ à vérifier` plutôt que d'inventer une précision qu'on n'a pas.
3. **Vérifier, pas supposer** : comme pour le débit du Congo ci-dessus, chaque chiffre déjà présent dans le deck est retesté contre sa source avant d'être simplement "habillé" d'une citation — on ne sourcera pas une erreur.
4. **Lien direct** : privilégier un DOI ou une URL stable (site de l'éditeur, PubMed Central, ou page officielle de l'organisme) plutôt qu'un lien de plateforme tierce (Academia.edu, ResearchGate) qui peut disparaître.
5. **Résumé court** : 1–2 phrases maximum, écrites par nous (pas copiées-collées de l'abstract) pour rester dans les clous du droit de citation.

## 3. Stratégie UX/UI — affichage au survol

### Ce qui reste (cohérence avec l'existant)
- Le déclencheur reste l'élément texte/chiffre lui-même (soulignement pointillé + `cursor:help`), pas une icône séparée qui alourdirait visuellement les slides.
- Accessible clavier (`tabindex` + `focus-visible`) comme aujourd'hui.

### Ce qui change (carte enrichie, pas juste du texte)
Le tooltip actuel (texte brut, `pointer-events:none`) devient une **petite carte de référence** :

```
┌─────────────────────────────────────────┐
│ 📄 McMichael et al. · PNAS · 2025        │  ← titre + revue + année (gras)
│                                           │
│ Centuries of compounding human           │  ← titre de l'article
│ influence on Amazonian forests           │
│                                           │
│ 7 300+ sites archéologiques croisés avec │  ← résumé (1-2 phrases, nous)
│ la composition de 1 521 parcelles.       │
│                                           │
│ Lire l'étude →                           │  ← lien cliquable (nouvel onglet)
└─────────────────────────────────────────┘
```

- **Déclenchement** : identique à aujourd'hui au survol souris ; au clavier, `Enter`/`Espace` sur l'élément focus ouvre le lien directement (pas besoin de "tabber" jusqu'au lien dans la carte — plus simple pour la présentation live).
- **Interaction souris** : la carte doit rester ouverte si le curseur se déplace de l'élément survolé *vers* la carte (pour pouvoir cliquer le lien) — nécessite de passer `pointer-events:auto` sur la carte et un petit délai de tolérance (`150ms`) avant fermeture, plutôt que fermeture immédiate au `pointermove` comme aujourd'hui.
- **Mode présentation** (plein écran / vidéoprojecteur) : la carte reste discrète et n'apparaît que sur interaction volontaire — elle ne doit jamais s'afficher automatiquement ni interrompre le rythme oral. Comportement par défaut inchangé pour qui ne survole rien.
- **Cas des chiffres déjà denses visuellement** (ex. slide 23, 5 cartes cote à cote) : la carte de référence doit se repositionner pour rester dans le cadre de la slide (le `positionTip()` actuel le fait déjà pour le tooltip simple — à conserver et étendre).

## 4. Étapes techniques

1. **Modèle de données centralisé** — au lieu de dupliquer citation/titre/résumé/URL dans chaque attribut HTML, créer `public/formation/sources.json` (un seul fichier, partagé par tous les modules comme `deck-theme.css`) :
   ```json
   {
     "mcmichael2025": {
       "citation": "McMichael et al. · PNAS · 2025",
       "title": "Centuries of compounding human influence on Amazonian forests",
       "summary": "7 300+ sites archéologiques précolombiens et coloniaux croisés avec la composition de 1 521 parcelles forestières.",
       "url": "https://doi.org/10.1073/pnas.2514040122"
     }
   }
   ```
   Chaque élément sourcé référence une clé : `data-src-id="mcmichael2025"` (le `data-src` texte actuel reste en repli si la clé est absente/le JSON n'a pas chargé — pas de régression).
2. **Chargement** — `deck-interactions.js` fetch `sources.json` une fois au `boot()`, le garde en mémoire (`Map`).
3. **Upgrade du tooltip** — `showTip()` construit la carte enrichie (titre/résumé/lien) si `data-src-id` est présent, sinon garde le comportement texte simple actuel (rétrocompatible avec les 41 citations déjà en place, migrables progressivement).
4. **CSS** — nouvelle variante `.deck-src-tooltip--rich` (carte plus large, lien stylé, `pointer-events:auto`), en réutilisant la palette existante (`--night`, `--cream`, `--blue-akuu`).
5. **Application** — pour chaque gap identifié en §1, ajouter `data-src-id` (et l'entrée correspondante dans `sources.json`) ; pour la slide 22, ajouter des `data-src-id` individuels sur les chiffres des 5 cartes en plus de la citation globale du titre.
6. **QA** — passe manuelle : survoler chaque citation sur les 43 slides, vérifier que le lien s'ouvre, vérifier au clavier (Tab + Entrée), vérifier qu'aucune carte ne déborde de l'écran en plein écran/cinéma.
7. **Repli navigateur ancien** : si `fetch` du JSON échoue (offline, fichier local sans serveur), le tooltip texte simple actuel continue de fonctionner — aucune régression.

## 5. Liste préliminaire de sources (déjà vérifiées cette session)

Prêtes à intégrer sans recherche supplémentaire :

| Clé | Citation | Usage prévu | Lien |
|---|---|---|---|
| `mcmichael2025` | McMichael et al., *PNAS*, 2025 | Slide 22, chiffres individuels | https://doi.org/10.1073/pnas.2514040122 |
| `moura2016reef` | Moura et al., *Science Advances*, 2016 | Récif de l'embouchure (module 1, slide eau/panache) | https://doi.org/10.1126/sciadv.1501252 |
| `gatti2021source` | Gatti et al., *Nature*, 2021 | Puits/source de carbone (déjà utilisé slide "Un puits de carbone") | https://doi.org/10.1038/s41586-021-03629-6 |
| `pan2011sink` | Pan et al., *Science*, 2011 | Stock de carbone biomasse | https://doi.org/10.1126/science.1201609 |
| `chen2015hurricane` | Chen, Randerson et al., *GRL*, 2015 | Lien feux amazoniens / ouragans atlantiques | https://doi.org/10.1002/2015GL064505 |
| `werth2002teleconnect` | Werth & Avissar, *JGR*, 2002 | Téléconnexions déforestation | https://doi.org/10.1029/2001JD000717 |
| `usgs-amazon-discharge` | USGS, *The Amazon: Measuring a Mighty River* | Débit du fleuve (à corriger : ×5 le Congo, pas ×7) | https://pubs.usgs.gov/publication/70046378 |

À rechercher/vérifier (prochaine étape, après validation de ce plan) :
- Slide 23 (jardin géant) : nombre de sites terra preta (+3 500), géoglyphes (+500), superficie champs surélevés (>100k ha), % plantes domestiquées (85%) — probablement Rostain 2021 / Science Panel for the Amazon 2021, à confirmer chapitre par chapitre.
- Slide 25 (LiDAR), 27 (Kuhikugu), 28 (Marajó), 30 (Gran Pajatén) : chiffres archéologiques déjà présents dans le texte de la slide sans `data-src` — probablement Heckenberger, Iriarte, Schaan selon le site, à vérifier individuellement.
- Slides 36–41 (menaces eau/terre/feu) : affirmations de tendance sans chiffre isolé — nécessitent une recherche dédiée (probablement IPCC AR6, INPE/PRODES pour la déforestation).

## 6. Prochaines étapes (après ta validation)

1. Compléter l'audit exhaustif (tableau complet des 43 slides, actuellement synthétisé).
2. Rechercher et vérifier les sources manquantes listées en §5.
3. Construire `sources.json` + upgrade du tooltip (§4, étapes 1–4).
4. Appliquer les `data-src-id` slide par slide, en commençant par les priorités hautes (23, 33, 42) puis la généralisation à la slide 22.
5. QA complète + vérification d'accessibilité.

---
*Rien n'a été modifié dans les slides. Dis-moi si ce plan te convient, ou ce qu'il faut ajuster (autre organisme de référence à prioriser, format de carte différent, autre lieu pour `sources.json`, etc.) avant que je lance l'intégration.*
