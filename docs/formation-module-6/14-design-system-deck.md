# Design system — Decks formation AKUU

> Fichier CSS commun : `public/formation/deck-theme.css`

---

## Palette (ne pas modifier)

| Variable | Hex | Usage |
|----------|-----|-------|
| `--green-forest` | #2D6915 | Titres vert · chapitres |
| `--green-leaf` | #A6C639 | Accents positifs |
| `--green-pale` | #DFE6C4 | Fond slides contenu nature |
| `--blue-akuu` | #04488F | Couverture · titres bleu |
| `--blue-sky` | #4071A6 | Liens · notes |
| `--blue-pale` | #C9E1E9 | Sous-titres couverture |
| `--night` | #1E2422 | Texte foncé |
| `--night-2` | #2B322F | Corps texte |
| `--cream` | #FEFDFC | Cartes · fond clair |
| `--terracotta` | #E76F51 | Alertes · lignes rouges |
| `--ochre` | #F4A261 | Brise-glace |
| `--ochre-light` | #FDE9D1 | Fond brise-glace |
| `--sand` | #F4EFE6 | Fond alternatif |

---

## Rôles de fond slides

```css
--role-cover-bg   /* Bleu radial — couverture + sommaire */
--role-toc-bg     /* = cover */
--role-chapter-bg /* Vert — intercalaires parties */
```

---

## Typographie

- **Titres :** Playfair Display
- **Corps / UI :** Inter
- **Échelle :** `--fs-1` (32px) à `--fs-6` (240px)

---

## Classes utilitaires fréquentes

| Classe | Usage |
|--------|-------|
| `.logo` | Logo AKUU top-left |
| `.tag` | Étiquette haut droite |
| `.topbar` / `.bar` | Barre accent |
| `.kicker` | Sur-titre |
| `.h` | Titre slide |
| `.body` | Texte corps |
| `.lead` | Chapô |
| `.card` | Carte contenu |
| `.xs` / `.small` | Texte petit |
| `.toc` | Sommaire |
| `.deck-carousel` | Carrousel |
| `.deck-protect` | Badge PROTÉGÉ/BUSHMEAT/VEDA |
| `.deck-next-module` | Lien module suivant |
| `.deck-formateur-note` | Note bas slide (optionnel) |

---

## Module 6 · Identité visuelle

- **Groupe 2 = bleu** (comme M5) : couverture, sommaire
- **Terracotta** pour parties sensibles : tourisme sexuel, interdits, alertes
- **Vert** pour chapitres et clôture positive
- Colibri + LOGOAKUU comme M5

---

## Marges module 6

```css
:root {
  --pad-top: 88px;
  --pad-bottom: 74px;
  --pad-x: 110px;
}
```

---

## Animations

- `.anim`, `.anim-d1`, `.anim-d2` sur couverture
- `.card-in`, `.photo-in` sur cartes

---

## Slides types à reproduire

1. **Couverture** → copier M5 slide 01, changer textes
2. **Sommaire** → copier M5 slide 02, 9 rows
3. **Chapitre** → copier M5 slide 03 (Partie 1)
4. **Carrousel règles** → copier M5 slide 51 ou M4 slide 38
5. **Clôture** → copier M5 slide 52 + next module link

---

## Images requises

Copier depuis `module-5-deck/images/` :
- `LOGOAKUU.png`
- `collibri-akuu.png`

Pas obligatoire de nouvelles photos pour M6 (contenu textuel / cartes).
