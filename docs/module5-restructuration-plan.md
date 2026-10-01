# Module 5 · Plan de restructuration et d'alignement

Audit et plan de mise en cohérence du module 5 (« Solidarité internationale ») avec les
modules 1 à 4 de la formation AKUU.

**Statut** : proposition, en attente de validation. Aucune modification appliquée.

---

## 1. Diagnostic

### 1.1 Le module 5 n'utilise pas le design system

Le fichier `public/formation/deck-theme.css` (87 Ko) est partagé par les 5 modules et
fournit les classes structurantes du deck. Le module 5 le charge mais ne s'en sert
quasiment pas : il réimplémente tout en styles inline.

| Classe | M1 | M2 | M3 | M4 | **M5** |
|---|---:|---:|---:|---:|---:|
| `card` | ~ | 94 | 88 | 269 | **0** |
| `card-in` (animation) | 0 | 94 | 88 | 252 | **0** |
| `tag` (pastille chapitre) | 39 | 52 | 57 | 87 | **0** |
| `topbar` | 40 | 53 | 57 | 89 | **1** |
| `kicker` | 13 | 10 | 15 | 9 | **0** |
| `lead` | 21 | 6 | 19 | 10 | **0** |
| `h` (titre Playfair) | ~ | ~ | ~ | 87 | **0** |
| `stat` / `stat-n` / `stat-l` | 0 | 0 | 40 | 24 | **0** |
| `quote` | 2 | 16 | 6 | 1 | **0** |
| `deck-video` | 3 | 5 | 10 | 3 | **0** |

Conséquence directe : 711 attributs `style="…"` inline dans un fichier de 51 slides,
là où le module 4 en compte 1 623 pour 95 slides (soit ~2× plus de style inline par slide).

Écarts de valeurs entre le hand-rolled du M5 et le thème :

| Élément | Thème (`deck-theme.css`) | Module 5 (inline) |
|---|---|---|
| Carte | `border-radius: 18px; padding: 24px 28px` | `border-radius: 20px; padding: 44px 40px` |
| Pastille chapitre | `.tag` → `top: 48px; font-size: var(--fs-1)` | `top: 20px; font-size: var(--fs-2)` |
| Barre haut | `.topbar` → `height: 6px` | `height: 5px` inline |
| Filet titre | `.bar` → `height: 6px` | `height: 5px` inline |

### 1.2 Le JavaScript d'interaction n'est pas chargé

```html
<!-- Module 4 -->
<script src="./support.js"></script>
<script src="../module-1-deck/deck-interactions.js" defer></script>

<!-- Module 5 -->
<script src="./support.js"></script>
<!-- deck-interactions.js absent -->
```

`deck-interactions.js` (54 Ko) pilote l'ensemble des composants interactifs du deck.
Sans lui, le module 5 n'a accès à **aucun** de ces composants :

| Composant | Attribut | Utilisé dans |
|---|---|---|
| Carrousel | `data-deck-carousel` | M1, M2, M3, M4 |
| Visionneuse d'images | `data-deck-pic` / `data-deck-pic-viewer` | M4 |
| Infobulle de source | `data-src-id` | M1, M2, M3, M4 |
| Frise chronologique | `data-deck-timeline` | M2, M3 |
| Question / réponse | `data-deck-reveal` | M1 |
| Duel argumenté | `data-deck-vs` | M1 |
| Comparateur avant/après | `data-deck-swap` | M1 |
| Onglets | `data-deck-toggle` / `data-deck-panel` | M1 |
| Lightbox zoom/pan | `data-deck-fig-lightbox` | (disponible, inutilisé) |

### 1.3 Le module a été renuméroté sans être relu

Le module 5 a manifestement été écrit comme « Module 1 » d'une autre série, puis
renuméroté en ne changeant que le lien de fin. Traces restantes :

- Slide de couverture : `Module 1 · Formation AKUU` (devrait être `Module 5`)
- Notes formateur slide 01 : « Bienvenue dans le **Module 1** de la formation AKUU »
- Notes formateur slide 26 : « c'est un prérequis pour le **Module 2** »
- Notes formateur slide 37 : « ANNONCE DU **MODULE 2** (2 min). Le Module 2 sera le
  passage de la théorie à la pratique » — alors que le lien pointe vers le module 6

### 1.4 Numérotation des slides incohérente

```
01, 01b, 02, 03 … 28, 29, 29e, 29b, 29b2, 29c, 29c2, 29d, 29d2,
29e, 29e2, 29f, 29f, 29g, 29g2, 30 … 37
```

- `01b · Sommaire` au lieu de `02 · Sommaire` (décale toute la suite)
- **`29e` est utilisé deux fois** : « Disclaimer images » et « Image : paresseux »
- **`29f` est utilisé deux fois** : « Image : Rosolie singe » et « Image : Paul Rosolie »
- Le bloc `29b → 29g2` place `29e` (disclaimer) *avant* `29b`, dans le désordre

Convention des autres modules : M1/M2 utilisent `N · Titre`, M3/M4 utilisent `0N · Titre`
avec suffixes `b`/`c` réservés aux ajouts tardifs (`41b`, `41c`, `66b`, `71b`).

### 1.5 Structure de chapitrage incomplète

| | M1 | M2 | M3 | M4 | **M5** |
|---|---|---|---|---|---|
| Slide titre Partie 01 | oui | oui | oui | oui | **absente** |
| Slide titre Parties 02-04 | oui | oui | oui | oui | oui |
| Libellé | `Partie 01 : Situer` | `Partie 01 · Peuples` | `Partie 01 Contexte` | `Partie 01 · Faune` | `Titre Partie 2` |
| Conclusion générale | — | — | — | oui | **absente** |
| Clôture + next module | oui | oui | oui | oui | oui |
| Lien module précédent | — | oui | oui | oui | **absent** |
| Annexes | — | — | oui (acronymes) | — | — |

Les slides de titre de partie du module 5 divergent aussi visuellement : pas de logo,
pas de `.bar`, pas de `.kicker`, pas de `.lead`, et le grand numéro de chapitre est en
`Inter` alors que M1-M4 utilisent `Playfair Display`. Le colibri est positionné en dur
(`left: 988px`, `left: 679px`) au lieu d'un ancrage relatif.

### 1.6 Aucune source citée

`public/formation/sources.json` contient **140 sources** documentées et alimente les
infobulles `data-src-id`. Répartition : M1 = 88 usages, M3 = 107, M2 = 43, M4 = 30.

**Module 5 : 0 usage, et 0 source enregistrée dans `sources.json`.**

C'est le module le plus dense en références académiques de toute la formation. Auteurs
cités dans le contenu sans aucune référence traçable :

Kwame Nkrumah · Frantz Fanon · Walter Mignolo · Achille Mbembe · Dambisa Moyo ·
Séverine Autesserre · Abhijit Banerjee & Esther Duflo · Chimamanda Ngozi Adichie ·
Teju Cole · Rony Brauman · Mary Mostafanezhad · Rafia Zakaria

### 1.7 Pauvreté iconographique

| Module | Fichiers image |
|---|---:|
| M1 | 55 |
| M2 | 97 |
| M3 | 55 |
| M4 | 12 (+ galeries espèces) |
| **M5** | **9** (logo, colibri, 7 captures d'écran) |

Les couvertures de livres des slides « Lecture recommandée » sont des **faux visuels** :
un `<div>` coloré contenant le titre en texte, pas la vraie couverture. Aucun portrait
des penseurs cités.

### 1.8 Police incomplète

```html
<!-- M1-M4 -->
family=Inter:wght@300;400;500;600;700;800

<!-- M5 -->
family=Inter:wght@300;400;500;600;700
```

Le poids 800 n'est pas chargé. Les éléments en `font-weight: 800` (grand numéro de
chapitre, certains titres) sont rendus en 700 synthétique par le navigateur.

### 1.9 Chemins d'assets non standard

| Module | Chemin |
|---|---|
| M1-M4 | `images/…` |
| M5 | `public/images/…` + `uploads/…` |

### 1.10 Ce que le module 5 fait *mieux* que les autres

À préserver et, idéalement, à propager aux modules 1-4 :

- **`data-speaker-notes` sur 51 slides** (~2 500 caractères en moyenne, jusqu'à 4 500).
  Aucun autre module n'en a. C'est un actif pédagogique considérable.
- **Bandeaux « Note formateur »** en pied de slide : rappel court et visible pendant
  l'animation, complémentaire des notes longues.
- **Minutage explicite** (« 5 min », « 10-15 min ») sur les activités.

---

## 2. Opportunités pédagogiques manquées

Le module 5 est le plus riche en activités participatives de toute la formation, et
c'est précisément le seul qui n'a accès à aucun composant interactif. Correspondances
directes entre contenu existant et composants disponibles :

| Slide actuelle | Composant à utiliser | Gain |
|---|---|---|
| `02 · Brise-glace` | `data-deck-reveal` | Les 2 questions apparaissent, les réponses types se révèlent après le tour de table |
| `03 · Chronologie` | `data-deck-timeline` | Frise animée (déjà utilisée en M2 et M3) |
| `05 · Pensée décoloniale` | `data-deck-carousel` | 3 penseurs en 3 cartes navigables au lieu d'un bloc dense |
| `07 · Solidarité vs Aide vs Humanitaire` | `.card` × 3 + `card-in` | Grille au standard du deck, animation d'entrée |
| `12,14,15,16 · Cas` (×4) | `data-deck-carousel` | 4 slides → 1 carrousel (modèle : M4 « Moteurs de destruction ») |
| `11,18,19 · Lectures` (×3) | `data-deck-carousel` | 3 slides → 1 carrousel |
| `20 · Débat structuré` | `data-deck-vs` | Interface de duel argumenté (modèle : M1 « Betty vs Anna ») |
| `22 · Généalogie historique` | `data-deck-timeline` | Frise Jules Ferry → Instagram |
| `28 · 4 questions éthiques` | `data-deck-reveal` | Question posée, réponse révélée |
| `29b→29g2 · Tri de photos` (×12) | `data-deck-reveal` + `data-deck-fig-lightbox` | 12 slides → 6, avec zoom sur l'image et analyse révélée à la demande |
| `35,36 · Lectures` (×2) | `data-deck-carousel` | 2 slides → 1 |

Le cas du bloc « tri de photos » mérite un mot. Sa structure actuelle est
`image → analyse → image → analyse …` sur 12 slides. C'est exactement le motif que
`data-deck-reveal` implémente : on affiche l'image, le groupe discute, l'animateur
révèle l'analyse sur la même slide. Le passage à 6 slides n'est pas une coupe de
contenu, c'est une fusion qui **améliore** la mécanique pédagogique (l'image reste
visible pendant la lecture de l'analyse, ce qui n'est pas le cas aujourd'hui).

---

## 3. Structure proposée

Passage de **51 slides désordonnées** à **~43 slides numérotées proprement**, sans
perte de contenu (les réductions sont des fusions en composants, pas des suppressions).

### Ouverture (3)

| N° | Slide | Action |
|---|---|---|
| 01 | Couverture | Corriger `Module 1` → `Module 5`. Ajouter ligne `.src` de durée (modèle M4). Passer `.bar` / `.kicker` en classes. |
| 02 | Sommaire | Renuméroter depuis `01b`. Aligner le markup sur M4. |
| 03 | Brise-glace | → `data-deck-reveal`. Conserver le minutage et les notes. |

### Partie 01 · Du colonialisme au néocolonialisme (8)

| N° | Slide | Action |
|---|---|---|
| 04 | **Titre Partie 01** | **NOUVELLE** — actuellement absente. Modèle : M4 slide 03. |
| 05 | Chronologie coloniale | → `data-deck-timeline`. |
| 06 | Nkrumah · définir le néocolonialisme | `.quote` + `data-src-id`. Ajouter portrait. |
| 07 | Pensée décoloniale | → carrousel 3 cartes (Fanon / Mignolo / Mbembe) + portraits + sources. |
| 08 | Flux d'aide mondiale | → cartes `.stat` (modèle M3/M4). |
| 09 | Solidarité vs Aide vs Humanitaire | → grille `.card` × 3 avec `card-in`. |
| 10 | Vidéo · décolonialisme | → wrapper `.deck-video` + ligne source. |
| 11 | **Pont vers M1 / M2** | **NOUVELLE** — voir §4. |

### Partie 02 · L'aide internationale (7)

| N° | Slide | Action |
|---|---|---|
| 12 | Titre Partie 02 | Aligner sur le standard (logo, `.bar`, `.kicker`, `.lead`, Playfair). |
| 13 | Données macro pauvreté | → cartes `.stat`. |
| 14 | Quatre cas d'école | → **carrousel** : Ghana / moustiquaires / orphelinats / Haïti (4 slides → 1). |
| 15 | Vidéo · fast fashion Ghana | → `.deck-video`. |
| 16 | Vidéo · aide humanitaire | → `.deck-video`. |
| 17 | Lectures · Partie 02 | → **carrousel** : Moyo / Autesserre / Banerjee & Duflo (3 → 1) + vraies couvertures. |
| 18 | Débat structuré | → `data-deck-vs`. |

### Partie 03 · Le sauveur blanc (13)

| N° | Slide | Action |
|---|---|---|
| 19 | Titre Partie 03 | Aligner. |
| 20 | Généalogie · Jules Ferry → Instagram | → `data-deck-timeline`. |
| 21 | White Savior Complex (Teju Cole) | `.quote` + `data-src-id` + portrait. |
| 22 | Poverty porn · mécanisme et impact | **Fusion** des slides 24 et 27 actuelles. |
| 23 | Vidéo · white saviorism | → `.deck-video`. |
| 24 | Adichie · The Danger of a Single Story | `.quote` + vidéo TED + source. |
| 25 | 4 questions éthiques | → `data-deck-reveal`. |
| 26 | Activité · tri de photos (consigne + disclaimer) | **Fusion** de `29` et `29e`. |
| 27-32 | Six cas d'analyse | Chacun : image en `data-deck-fig-lightbox` + analyse en `data-deck-reveal` (12 slides → 6). |
| 33 | Lecture · Brauman | Carte au standard + source. |

### Partie 04 · Le volontourisme (6)

| N° | Slide | Action |
|---|---|---|
| 34 | Titre Partie 04 | Aligner. |
| 35 | Données marché | → cartes `.stat`. |
| 36 | Modèle économique | → grille `.card`. |
| 37 | Vidéo · volontourisme | → `.deck-video`. |
| 38 | Lectures · Partie 04 | → **carrousel** : Mostafanezhad / Zakaria (2 → 1). |
| 39 | **Règle bénévole AKUU** | **NOUVELLE** — carrousel de règles concrètes. Modèle : M4 slide 38 « Règle bénévole · protections ». Voir §4. |

### Clôture (3)

| N° | Slide | Action |
|---|---|---|
| 40 | **Conclusion générale** | **NOUVELLE** — grille de synthèse + citation. Modèle : M4 slide 89. |
| 41 | Retour au brise-glace | Reprise de la slide 37 actuelle (« Qu'est-ce qui a changé ? »). |
| 42 | Clôture + module suivant | Corriger les notes (« Module 2 » → « Module 6 »). Ajouter lien retour M4. |

### Annexe (optionnelle)

| N° | Slide | Action |
|---|---|---|
| 43 | Glossaire | Néocolonialisme, décolonial, white savior, poverty porn, volontourisme, TDR, ODA. Modèle : M3 slides 65-67 + `deck-acronyms.js`. |

---

## 4. Mise en lien avec les autres modules

Le module 5 est aujourd'hui **orphelin** : il ne cite aucun des quatre modules qui le
précèdent, alors que son propos en dépend directement. Trois liens à créer.

### 4.1 Pont M1 ↔ M5 · même geste narratif (slide 11 proposée)

Le module 1 déconstruit le mythe de la « forêt vierge » : un territoire présenté comme
vide parce que ses habitants étaient invisibilisés. Le module 5 déconstruit le
« sauveur blanc » : une population présentée comme démunie parce que son agentivité est
invisibilisée.

**C'est le même mouvement épistémique appliqué à deux objets.** Le rendre explicite
donne au module 5 son ancrage amazonien, qui lui manque aujourd'hui (le module parle du
Ghana, d'Haïti, du Kenya, mais jamais du Pérou où partent les bénévoles).

Rappel : M1 slide 14 « Mythe #1 : La forêt vierge », M1 slide 17 « Betty vs Anna ».

### 4.2 Pont M2 → M5 · racines historiques

Le module 2 documente la conquête, les réductions jésuites, le boom du caoutchouc et
les atrocités du Putumayo (Julio César Arana). Le néocolonialisme du module 5 n'est pas
un concept abstrait : c'est la continuation de cette histoire, sur le même territoire.

Rappel : M2 slides 36-37 (Arana, Putumayo), M2 slide 39 (effondrement 1912).

### 4.3 Pont M3 → M5 · néocolonialisme contemporain

Le module 3 traite la doctrine Monroe, la montée de la Chine, les inégalités (Gini), et
l'économie minière péruvienne. C'est la démonstration empirique de ce que Nkrumah
définit théoriquement en M5.

Rappel : M3 slides 07-08 (influence américaine, Monroe), M3 slides 17-18 (inégalités),
M3 slide 46 (économie minière), M3 slide 50 (ressources et conflits).

### 4.4 Pont M4 → M5 · qui paie le coût

Le module 4 (chapitre 3 refondu) montre qui subit la destruction environnementale :
peuples autochtones, communautés riveraines. Le module 5 explique pourquoi l'aide
extérieure échoue souvent à les protéger.

Rappel : M4 « Peuples sous pression », M4 « Aires protégées ».

### 4.5 Règle bénévole (slide 39 proposée)

Le module 4 se termine sur une slide « Règle bénévole · protections » : un carrousel de
règles concrètes et opposables (ce qu'on ne fait pas, ce qu'on vérifie, en cas de doute
= non). C'est le point d'atterrissage pratique du module.

Le module 5 n'a pas d'équivalent — il se termine sur une question ouverte. Proposition :
un carrousel « Règle bénévole · posture » sur le même patron :

1. **Ce qu'on ne fait pas** — photos d'enfants identifiables, publications « avant /
   après », vocabulaire de sauvetage, promesses individuelles
2. **Ce qu'on demande** — consentement explicite, y compris pour les mineurs via les
   responsables légaux
3. **Ce qu'on vérifie** — qui a défini le besoin, qui décide, qui reste après le départ
4. **En cas de doute = non** — carte de synthèse (identique dans la forme à M4)

Cela ferme le module sur du concret et crée une symétrie visible entre M4 et M5.

### 4.6 Chaîne de navigation

| Module | Lien précédent | Lien suivant |
|---|---|---|
| M1 | — | M2 |
| M2 | M1 | M3 |
| M3 | M2 | M4 |
| M4 | M3 | M5 |
| **M5** | **absent** | M6 |

Ajouter le lien retour vers M4.

---

## 5. Corrections techniques

| # | Correction | Fichier |
|---|---|---|
| T1 | Charger `deck-interactions.js` | `<head>` |
| T2 | Charger `deck-acronyms.js` (si annexe glossaire retenue) | `<head>` |
| T3 | Ajouter le poids `800` à la police Inter | `<helmet>` |
| T4 | Aligner `--pad-top/bottom/x` sur `88/74/110` (M2-M4) | `:root` |
| T5 | Déplacer `public/images/` → `images/` et `uploads/` → `images/` | arborescence |
| T6 | Remplacer les positions en dur du colibri par un ancrage relatif | slides titres |
| T7 | Renuméroter toutes les slides, supprimer les doublons `29e` et `29f` | `data-label` |
| T8 | Corriger `Module 1` → `Module 5` (couverture + 3 notes formateur) | contenu |
| T9 | Ajouter le lien retour vers le module 4 | slide clôture |

## 6. Corrections de contenu

| # | Correction |
|---|---|
| C1 | Créer ~12 entrées dans `sources.json` (Nkrumah, Fanon, Mignolo, Mbembe, Moyo, Autesserre, Banerjee & Duflo, Adichie, Cole, Brauman, Mostafanezhad, Zakaria) |
| C2 | Poser les `data-src-id` correspondants sur les slides |
| C3 | Remplacer les fausses couvertures de livres par les vraies images |
| C4 | Ajouter les portraits des penseurs cités |
| C5 | Ancrer le module au Pérou (aujourd'hui : Ghana, Haïti, Kenya uniquement) |
| C6 | Harmoniser les bandeaux « Note formateur » en composant thématisé |

---

## 7. Séquencement proposé

Cinq lots, du plus sûr au plus engageant. Chaque lot est vérifiable indépendamment.

**Lot 1 · Infrastructure** (T1-T6, T8-T9)
Charger les scripts, corriger la police, déplacer les assets, corriger les mentions
« Module 1 ». Aucun changement de structure. Risque faible, effet immédiat sur le rendu.

**Lot 2 · Design system**
Convertir les 51 slides existantes aux classes du thème (`.card`, `.tag`, `.kicker`,
`.lead`, `.h`, `.stat`, `.quote`, `.deck-video`, `card-in`). Purge des styles inline
redondants. Structure inchangée, numérotation inchangée.

**Lot 3 · Structure et numérotation** (T7)
Renuméroter, ajouter la slide titre Partie 01, ajouter la conclusion générale, corriger
l'ordre du bloc « tri de photos ».

**Lot 4 · Composants interactifs**
Convertir les activités : reveal, timeline, vs, carrousels, lightbox. C'est le lot qui
réduit 51 slides à ~43.

**Lot 5 · Contenu et liens** (C1-C6, §4)
Sources, images, portraits, ponts inter-modules, règle bénévole, ancrage Pérou.

---

## 8. Points nécessitant un arbitrage

1. **Fusion du bloc « tri de photos »** (12 slides → 6). Amélioration pédagogique à mon
   sens, mais c'est une modification du déroulé d'animation. À valider.
2. **Fusion des slides « Lecture »** en carrousels (5 slides → 2). Idem.
3. **Annexe glossaire** : à faire ou non.
4. **Propagation des `data-speaker-notes` aux modules 1-4** : hors périmètre de cette
   demande, mais le module 5 démontre la valeur du dispositif.
5. **Ancrage Pérou** : ajouter des cas péruviens demande de la recherche documentaire.
   À cadrer séparément.
