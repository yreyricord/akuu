# Module 5 -- Travail restant (prompt complet)

Fichier principal : `public/formation/module-5-deck/index.html` (52 slides).
Design system : `public/formation/deck-theme.css` (87 KB).
Composants interactifs : `public/formation/module-1-deck/deck-interactions.js` (54 KB).
Sources : `public/formation/sources.json` (155 entrees, dont 15 M5).

Le M5 est fonctionnel mais en retard de design et d'interactivite par rapport aux M1-M4.
Voici tout ce qui reste a faire, organise par priorite.

---

## 1. Sources : debug du panneau et des tooltips

**Constat** : `sources.json` charge (HTTP 200), 15 entrees `m5-*` existent, 16 attributs
`data-src-id` sont poses dans le HTML. Mais les indicateurs visuels (icone survol +
panneau bas-droite) ne s'affichent pas.

**Diagnostic a mener** :
- Ouvrir la console navigateur sur un slide M5 qui porte un `data-src-id` (ex: slide 06,
  Nkrumah). Verifier que `deck-interactions.js` s'execute (chercher l'element
  `.deck-src-panel-btn` dans le DOM).
- Comparer avec M1 : ouvrir `module-1-deck/index.html`, naviguer a un slide avec
  `data-src-id`, verifier que le bouton-panneau apparait. Si oui, l'ecart est dans le HTML
  de M5.
- Hypothese probable : le script cherche les elements `[data-src-id]` a l'interieur de la
  section `[data-deck-active]`. Si le custom element `<deck-stage>` ne pose pas cet attribut
  correctement, les sources ne s'activent jamais. Verifier que `<deck-stage>` fonctionne
  identiquement en M5 (meme `support.js`, meme `deck-stage.js`).

**Action** : debugger, corriger, verifier que le panneau sources et les tooltips au survol
fonctionnent exactement comme en M1.

---

## 2. Slides de chapitre (Titre Partie) : aligner sur le design M1-M4

**Constat** : les 4 slides de chapitre de M5 (Partie 1, 2, 3, 4) ne ressemblent pas du tout
a celles des M1-M4.

**Design M1-M4 (reference a reproduire)** :
```html
<section style="background: var(--role-chapter-bg); display:flex; flex-direction:column; justify-content:center; padding:var(--pad-top) var(--pad-x);">
  <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
  <div class="bar" style="background:var(--green-leaf);"></div>
  <div style="font-family:'Playfair Display',serif; font-size:var(--fs-6); font-weight:800; color:rgba(166,198,57,0.15); position:absolute; top:40px; right:90px;">01</div>
  <div class="kicker" style="color:var(--green-leaf); margin-bottom:22px;">Partie 01</div>
  <h1 style="font-family:'Playfair Display',serif; font-size:var(--fs-5); font-weight:700; color:var(--cream); margin:0; line-height:1.02;">Titre</h1>
  <div style="width:120px; height:6px; background:var(--green-leaf); margin:36px 0 26px;"></div>
  <p class="lead" style="color:var(--green-pale);">Sous-titre avec mots-cles separes par des ·</p>
</section>
```

**Design M5 actuel (a remplacer)** :
```html
<section style="background: var(--role-chapter-bg); display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; padding:0 var(--pad-x) 120px;">
  <img src="images/collibri-akuu.png" style="position:absolute; right:60px; top:120px; height:460px; opacity:0.25;" alt="Colibri AKUU">
  <div style="font-family:'Inter',sans-serif; font-size:var(--fs-6); font-weight:800; color:var(--green-leaf); opacity:0.3; margin-bottom:24px;">01</div>
  <h1 style="...">Titre</h1>
  <div style="width:100px; height:5px; ..."></div>
  <p style="font-family:'Inter',...; color:rgba(255,255,255,0.7);">Sous-titre</p>
</section>
```

**Differences** :
- `justify-content: center` au lieu de `flex-end`
- Logo AKUU avec `.logo` au lieu du colibri
- `.bar` en bas au lieu de rien
- Numero en Playfair Display `position:absolute; top:40px; right:90px; color:rgba(166,198,57,0.15)` au lieu d'Inter inline `opacity:0.3`
- `.kicker` avec "Partie 01" au lieu de rien
- `.lead` avec `color:var(--green-pale)` au lieu de `<p>` avec `color:rgba(255,255,255,0.7)`
- Separateur `120px / 6px` au lieu de `100px / 5px`

**Action** : reecrire les 4 slides de chapitre (lignes des slides 03, 11, 23, 46)
pour reproduire exactement le patron M1/M4. Contenu :

| Slide | Kicker | Titre | Lead |
|-------|--------|-------|------|
| 03 | Partie 01 | Du colonialisme au neocolonialisme | Conference de Berlin · Independances · Nkrumah · Pensee decoloniale |
| 11 | Partie 02 | L'aide internationale | Donnees macro · Cas d'etude · Lectures · Debat structure |
| 23 | Partie 03 | Le sauveur blanc | Genealogie · White savior · Poverty porn · Tri de photos |
| 46 | Partie 04 | Le volontourisme | Marche · Modele economique · Lectures · Cloture |

---

## 3. Classes du theme : remplacer les styles inline par les utilitaires

**Constat** : M1 utilise massivement les classes du design system. M5 n'en utilise aucune
(hors `.topbar`, `.tag`, `.logo`, `.bar`, `.kicker`, `.deck-video` deja convertis).

| Classe | M1 | M5 | Quoi |
|--------|----|----|------|
| `.card` | 105 | 0 | Conteneur avec border-radius:18px, padding |
| `.lead` | 21 | 0 | Sous-titre Inter light |
| `.h` | 38 | 0 | Titre principal d'une slide |
| `.body` | 36 | 0 | Corps de texte Inter |
| `.num` | 47 | 0 | Chiffre-cle (style Playfair gras) |
| `.small` | 87 | 0 | Texte auxiliaire (sources, labels) |
| `.stat` | 12 | 0 | Bloc statistique (chiffre + legende) |
| `.quote` | 2 | 0 | Citation en italique |
| `.kicker` | 13 | 1 (couverture) | Bandeau uppercase Inter |

**Action** : passer en revue chaque slide et remplacer les styles inline par les classes
du theme quand elles correspondent. Les elements prioritaires :
- Les gros chiffres (`11%`, `66%`, `223,7`, `15M`, `40%`, `80%`, `13 Md$`, `10 000`, `2 Md$`)
  deviennent `<div class="num">` ou `<div class="stat">`.
- Les blocs-cartes (fond cream, border-radius:20px, padding:44px) deviennent `.card`.
- Les sous-titres (Inter, font-weight 300-500) deviennent `.lead` ou `.small`.
- Les titres `<h1>` deviennent `.h`.
- Les corps de texte deviennent `.body`.
- Les citations en italique Playfair deviennent `.quote`.
- Chaque `font-family: 'Inter'` ou `font-family: 'Playfair Display'` inline doit etre
  absorbe par une classe (le theme les definit deja).

**Objectif** : passer de 349 declarations `font-family:` inline a < 20.

---

## 4. Composants interactifs : carrousels, reveals, timeline

**Constat** : M1 a 4 carrousels + 5 swaps + 2 toggles. M4 a 4 carrousels + 170 pics.
M5 a 0 composants interactifs. Le contenu de M5 se prete tres bien a ces composants.

### 4.1 Carrousel : les 3 penseurs decoloniaux (slide 07)

Transformer les 3 cartes statiques Fanon / Mignolo / Mbembe en un carrousel de 3 cartes.
Patron a suivre : copier la structure exacte du carrousel M1 (lignes 223-265 de
`module-1-deck/index.html`).

Structure cible :
```html
<div class="deck-carousel" data-deck-carousel style="flex:1;">
  <div class="deck-carousel__stage">
    <button type="button" class="deck-carousel__arrow deck-carousel__prev" aria-label="Precedent"></button>
    <div class="deck-carousel__viewport">
      <div class="deck-carousel__slide deck-carousel__slide--active">
        <div class="card" style="...">
          <!-- Fanon -->
        </div>
      </div>
      <div class="deck-carousel__slide">
        <div class="card" style="...">
          <!-- Mignolo -->
        </div>
      </div>
      <div class="deck-carousel__slide">
        <div class="card" style="...">
          <!-- Mbembe -->
        </div>
      </div>
    </div>
    <button type="button" class="deck-carousel__arrow deck-carousel__next" aria-label="Suivant"></button>
  </div>
  <div class="deck-carousel__nav">
    <div class="deck-carousel__dots">
      <button type="button" class="deck-carousel__dot deck-carousel__dot--active" aria-label="Carte 1"></button>
      <button type="button" class="deck-carousel__dot" aria-label="Carte 2"></button>
      <button type="button" class="deck-carousel__dot" aria-label="Carte 3"></button>
    </div>
  </div>
</div>
```

Chaque carte doit contenir :
- Nom de l'auteur (`.num` ou titre en couleur)
- Titre du livre + date (`.small`)
- Citation en italique (`.quote` ou `.body`)
- `data-src-id` sur l'element citation

### 4.2 Carrousel : les 4 cas d'etude (slides 14-18)

Actuellement 4 slides separees (vetements, moustiquaires, orphelinats, Haiti) + 1 video
fast fashion entre vetements et moustiquaires. Fusionner les 4 cas en 1 carrousel de 4 cartes
sur une seule slide. Garder la video sur sa propre slide.

Chaque carte : titre du cas, chiffre-cle (`.num`), description courte (`.body`), source.

### 4.3 Carrousel : les lectures recommandees

5 slides de lectures (Moyo, Autesserre, Banerjee & Duflo, Adichie, Brauman) +
2 lectures en Partie 4 (Mostafanezhad, Zakaria). Fusionner en 2 carrousels :
- Partie 2 : carrousel de 3 cartes (Moyo, Autesserre, Banerjee & Duflo)
- Partie 3+4 : carrousel de 4 cartes (Adichie, Brauman, Mostafanezhad, Zakaria)

Chaque carte lecture : icone livre (SVG inline), titre, auteur + date, resume 2 lignes,
badge niveau (Accessible / Intermediaire / Avance), `data-src-id`.

### 4.4 Chronologie interactive (slide 05)

La frise a 3 dates (1884, 1960s, Aujourd'hui) est statique. La transformer en composant
interactif si `data-deck-timeline` existe dans `deck-interactions.js`. Sinon, ameliorer
visuellement : ajouter des `.card` pour chaque epoque, animations `card-in`.

### 4.5 Tri de photos : reveal (slides 31-44)

Actuellement 13 slides (1 activite + 1 disclaimer + 5 paires image/analyse + 1 analyse
supplementaire). Fusionner chaque paire image+analyse en 1 slide avec `data-deck-reveal` :
l'image est montree, un bouton "Analyse" revele le texte d'analyse.

Reduction : 13 slides -> 7 slides (1 activite + 1 disclaimer + 5 slides reveal).

### 4.6 Tableau comparatif (slide 09)

Les 3 colonnes (Solidarite / Aide / Humanitaire) sont statiques. Transformer en carrousel
de 3 cartes OU en `data-deck-swap` pour comparaison interactive.

---

## 5. Enrichissement visuel des slides de contenu

### 5.1 Slide 06 (Nkrumah) : la citation

La citation de Nkrumah est dans un div avec `background: var(--green-pale)`. Utiliser
`.quote` pour le texte et `.card` pour le conteneur. Ajouter un portrait placeholder ou
une silhouette.

### 5.2 Slides stats (12, 14, 17, 47)

Les gros chiffres (11%, 66%, 15M, 40%, 80%, 13 Md$, 10 000, 2 Md$) utilisent des styles
inline. Les convertir en `.stat` ou `.num` + `.stat-l` (legende).

### 5.3 Bandeaux "Note formateur"

Il y a ~10 bandeaux "Note formateur" avec des styles inline identiques. Creer une classe
ou un patron reutilisable dans le CSS local du module (dans `<style>` du `<helmet>`).

### 5.4 Animations d'entree

M1 utilise `card-in`, `anim`, `anim-d1`, `anim-d2` pour animer l'apparition des elements.
M5 n'utilise `anim` que sur la couverture. Ajouter des animations d'entree sur les elements
principaux (titres, cartes, chiffres) pour fluidifier la presentation.

---

## 6. Contenu manquant

### 6.1 Slides de pont inter-modules

Le plan original prevoit 3-4 slides de pont :
- **Pont M1 / M5** : le mythe de la foret vierge (M1 slide 14) est le meme geste que le
  sauveur blanc -- invisibiliser l'agentivite locale.
- **Pont M2 / M5** : la conquete et le Putumayo (M2 slides 36-37) sont les racines du
  neocolonialisme vu en M5.
- **Pont M3 / M5** : la doctrine Monroe et l'economie miniere (M3) sont la demonstration
  empirique de Nkrumah.
- **Pont M4 / M5** : qui subit la destruction environnementale (M4 ch.3) rejoint l'echec
  de l'aide a proteger ces communautes.

Format suggere : slide avec 2 colonnes (rappel du module precedent a gauche, lien avec M5
a droite), icone fleche, couleurs du module source.

### 6.2 Slide "Regle benevole -- posture"

M4 se termine sur un carrousel "Regle benevole -- protections". M5 devrait avoir un
equivalent "Regle benevole -- posture" :
1. Ce qu'on ne fait pas (photos d'enfants, publications avant/apres, vocabulaire de sauvetage)
2. Ce qu'on demande (consentement explicite)
3. Ce qu'on verifie (qui a defini le besoin, qui decide, qui reste apres)
4. En cas de doute = non

### 6.3 Ancrage peruvien

Le module parle du Ghana, d'Haiti, du Kenya mais jamais du Perou. Ajouter des exemples
peruviens concrets dans les speaker-notes et/ou slides :
- Extraction miniere Las Bambas (deja dans les speaker-notes de Nkrumah)
- Volontourisme a Cusco
- Communautes quechua et ayni/minka

### 6.4 Images manquantes

- Portraits des penseurs cites (Nkrumah, Fanon, Mignolo, Mbembe, Moyo, Adichie, Cole,
  Brauman, Autesserre, Banerjee, Duflo). Utiliser des images libres de droits ou des
  silhouettes stylisees.
- Vraies couvertures de livres (Dead Aid, Poor Economics, Peaceland, etc.) au lieu des
  placeholders colores actuels.
- Images d'illustration pour les cas d'etude (Kantamanto, moustiquaires, Haiti).

---

## 7. Corrections mineures restantes

- [ ] 349 declarations `font-family:` inline a absorber dans les classes du theme
- [ ] Verifier que `<deck-stage>` charge correctement avec le meme `support.js` et
  `deck-stage.js` que M1-M4
- [ ] Bandeaux "Note formateur" : uniformiser le style (meme padding, meme fond, meme
  border-top)
- [ ] Tester la navigation clavier (ArrowLeft/Right) sur les 52 slides
- [ ] Verifier le rendu responsive (le deck est 1920x1080 fixe, mais le viewport resize
  doit fonctionner)
- [ ] Les `data-speaker-notes` de M5 sont les plus detailles de tous les modules (2000+ mots
  par slide). Verifier qu'ils n'impactent pas les performances du DOM.

---

## Resume quantitatif

| Metrique | M1 | M4 | M5 actuel | M5 cible |
|----------|----|----|-----------|----------|
| Slides | 46 | 95 | 52 | ~42 |
| Carrousels | 4 | 4 | 0 | 4-5 |
| Reveals | 0 | 0 | 0 | 5-6 |
| `.card` | 105 | ~80 | 0 | ~30 |
| `.num` / `.stat` | 47/12 | ~20 | 0 | ~15 |
| `data-src-id` | 85 | 30 | 16 | 16 |
| `font-family:` inline | ~50 | ~60 | 349 | <20 |
| Composants interactifs | 11 | 174 | 0 | 15+ |
