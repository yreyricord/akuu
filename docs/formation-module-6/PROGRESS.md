# Progress Module 6

## Passe 3 · corrections détaillées + nouveau chapitre VSS (28 sept. 2026)

**61 slides** (+5 vs passe 2). Ajout d'un chapitre complet "Violences sexistes et
sexuelles (VSS)" en nouvelle Partie 04 (slides 27-31), juste après Tourisme sexuel :
reconnaître les VSS (harcèlement/agression/viol), toutes les directions (habitant→bénévole,
bénévole→habitant, entre bénévoles), que faire immédiatement (sécurité, alerte sans délai,
jamais seul), accompagnement après les faits. Toutes les parties suivantes renumérotées
(Substances=05, Image=06, Sécurité=07, Faune=08, Fin de mission=09, Charte=10).

**Bug corrigé** : la classe `deck-carousel__card--alert` de deck-theme.css n'est stylée que
dans le contexte `.deck-carousel__slide` ; utilisée seule (hors carrousel) elle rendait du
texte crème sur fond crème = invisible. Fix via règle CSS locale dans le `<style>` du deck
(pas de modif de deck-theme.css). Corrige les slides 9, 12, 20, 33 (ex-28) et toutes les
futures cartes "alerte" hors carrousel.

**Recherche web** effectuée pour étoffer avec des sources réelles : PSEA/safeguarding
(CARE, ActionAid, CHS Alliance) pour l'asymétrie de pouvoir (slide 11), Ley N° 28251 (2004)
texte officiel CEPAL pour le cadre légal péruvien (slide 20, 15-25 ans de prison), articles
IBCR + Peru21 pour le contexte Loreto/Iquitos (slide 19), article 223-6 code pénal français
(non-assistance à personne en danger) pour la nécessité de signaler (slide 24), France
Volontaires (tolérance zéro VSS) pour le nouveau chapitre.

**Corrections visuelles** : slide 6 image trop grande réduite ; slides 43/44/45 (faune/poissons)
`object-fit:cover` → `contain` (photos produit sur fond blanc mal cadrées sinon) ; slide 44
refaite en vrai tableau HTML (4 colonnes) au lieu de cartes+photos illisibles ; slide 18
overflow corrigé (carte ESCE agrandie, ligne redondante supprimée) ; sommaire (slide 2)
reconstruit en 2 colonnes de 5 avec la nouvelle Partie 04.

**Contenu étoffé sur demande** : slides 11, 12 (recherche power asymmetry), 15 (cadeaux +
pourquoi), 16 (promesse de résultats sur les projets AKUU), 21-25 (exemples concrets,
non-assistance à personne en danger, cartes carrousel remplies), 32/37 (ex-4 questions
photo, plus exhaustif), 33 (ex-38 : distinction consentement photo vs diffusion), 34
(ex-39 : exemple poverty porn remplacé par un cas plus subtil et réaliste), 37/42
(machette : gants, précautions, demander conseil aux locaux), 38/43 (chaussures montantes),
39/44 (coupure : rentrer en ville même pour petite coupure, texte invisible réparé).

- [x] Setup fichiers (copie module-10-deck -> module-6-deck, images M5)
- [x] Slides 01-09 Partie 0-1 (Ouverture + Représentation)
- [x] Slides 10-16 Partie 2 (Relations, équité)
- [x] Slides 17-26 Partie 3 (Tourisme sexuel)
- [x] Slides 27-34 Partie 4-5 (Substances, Image)
- [x] Slides 35-41 Partie 6 (Sécurité Amazonie)
- [x] Slides 42-47 Partie 7 (Faune)
- [x] Slides 48-55 Partie 8-9 (Fin de mission, clôture)
- [x] MODULE_DECKS registration (src/data/formation-modules.js)
- [x] Test navigateur (npm run dev -> /formation/module-6) — carrousels OK, navigation clavier OK, 0 erreur console, lien module 7 OK
- [x] Checklist 19-checklist-livraison.md — voir note ci-dessous

## Note de livraison

Deck complet, testé en navigateur (dev server). Correction "Yohan" -> "Yoann"
appliquée (deck + sources 05-inventaire, 09-securite-amazonie).

Écart mineur vs checklist : les speaker notes des slides 17-26 (tourisme sexuel) sont
denses et complètes (190-260 mots, structure DURÉE/SCRIPT/QUESTION/PIÈGE) mais n'atteignent
pas toutes le seuil indicatif de 300 mots du style guide (17-speaker-notes-guidelines.md).
Slides 50-52 (fin de mission/COVID) sont à 207-333 mots. Contenu jugé suffisant pour la
formation ; à enrichir si le fondateur le demande en revue.

Item "9 intercalaires chapitre" de la checklist : l'inventaire détaillé (05-inventaire-slides-
detaille.md) ne prévoit que 8 intercalaires (Parties 01-08) ; la Partie 09 (charte + clôture)
n'a pas d'intercalaire dédié dans l'inventaire source. Suivi l'inventaire tel quel.

## Passe 2 · refonte design (28 sept. 2026)

Sur demande explicite : retravail du design pour combler les slides trop vides (texte
occupant ~5% de la slide) et réduire la répétition visuelle.

- **56 slides** (+1) : insertion d'une slide dédiée aux poissons (nouvelle slide 45),
  renumérotation 45→56 en cascade.
- **Slides enrichies** (contenu additionnel : exemple concret, carte "en pratique",
  comparaison 2 colonnes, ou mise en page en étapes) : 06, 07, 08, 14, 16, 28, 30, 33,
  34, 38, 39, 47, 53, 55.
- **Photos réelles AKUU ajoutées** (aucune image inventée — tout provient du repo) :
  - `images/puerto_miguel.jpg` → slides 06, 41
  - `images/hero-amazon.jpg` → slide 36
  - `images/casa-akuu/1.jpg` → slide 50
  - 29 photos d'espèces `module-4-deck/images/especes/*.jpg` → slides 43, 44, 45
- **Slide 44** devenue une liste exhaustive photo-illustrée des espèces PROTÉGÉ
  (mammifères/cétacés, reptiles, oiseaux, chauves-souris) au lieu d'un résumé tronqué.
- **Slide 45 (nouvelle)** liste exhaustive poissons : consommation locale légitime
  (boquichico, palometa, carachama, gamitana, paco, piraña) vs réglementés/interdits
  (paiche VEDA, doncella BUSHMEAT, raies PROTÉGÉ).
- Tous les chemins d'image vérifiés sur disque + testés en navigateur (200 OK, 0 lien
  cassé, 0 erreur console).
