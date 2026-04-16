# Page Musée Shapishiko — sections et images

Remplis la colonne **Image souhaitée** (nom de fichier ou description), puis on mettra à jour les chemins dans le code.

Les fichiers sont à placer sous **`public/`** : un chemin `/images/...` correspond à **`public/images/...`**.

| #   | Section (sur la page)                                        | Où c’est défini                                   | Chemin actuel                            | Image souhaitée (à remplir) |
| --- | ------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------- | --------------------------- |
| 1   | **En-tête (hero)**                                           | `MuseeShapishikoView.vue` → `PageHero`            | `/images/hero-musee.jpg`                 |                             |
| 2   | **Le projet** (bloc texte + photo à droite)                  | `MuseeShapishikoView.vue`                         | `/images/musee/galerie-musee-3.jpg`      |                             |
| 3   | **Contexte**                                                 | `src/data/musee-side-visuals.json` → `context`    | `/images/musee/galerie-musee-1.jpg`      |                             |
| 4   | **Carte Las Mariposas**                                      | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/mariposas.webp`   |                             |
| 5   | **Carte Nelvis Paredes Pacaya**                              | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/nelvis.jpg`       |                             |
| 6   | **Carte École d’art Puerto Miguel**                          | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/ecole-art.jpg`    |                             |
| 7   | **Carte Radio Ucamara**                                      | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/ucamara.jpg`      |                             |
| 8   | **Carte Écomusée Chullachaqui**                              | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/chullachaqui.jpg` |                             |
| 9   | **Carte AKUU**                                               | `src/data/musee-acteurs.json`                     | `/images/musee/acteurs/akuu.jpg`         |                             |
| 10  | **Gouvernance**                                              | `src/data/musee-side-visuals.json` → `governance` | `/images/musee/galerie-musee-3.jpg`      |                             |
| 11  | **Équipes de chantier et bénévolat**                         | `src/data/musee-side-visuals.json` → `teams`      | `/images/musee/galerie-musee-4.jpg`      |                             |
| 12  | **Avancement du projet** (colonne photo à gauche des jalons) | `src/data/musee-side-visuals.json` → `progress`   | `/images/musee/galerie-musee-5.jpg`      |                             |
| 13  | **Coupe interactive** (plan animé)                           | `MuseeCoupeAnimee.vue`                            | `/images/musee/coupe_final.png`          |                             |
| 14  | **Galerie photo 1**                                          | `MuseeShapishikoView.vue` → `gallerySrcs[0]`      | `/images/musee/galerie-musee-1.jpg`      |                             |
| 15  | **Galerie photo 2**                                          | `gallerySrcs[1]`                                  | `/images/musee/galerie-musee-2.jpg`      |                             |
| 16  | **Galerie photo 3**                                          | `gallerySrcs[2]`                                  | `/images/musee/galerie-musee-3.jpg`      |                             |
| 17  | **Galerie photo 4**                                          | `gallerySrcs[3]`                                  | `/images/musee/galerie-musee-4.jpg`      |                             |
| 18  | **Galerie photo 5**                                          | `gallerySrcs[4]`                                  | `/images/musee/galerie-musee-5.jpg`      |                             |
| 19  | **Galerie photo 6**                                          | `gallerySrcs[5]`                                  | `/images/musee/galerie-musee-6.jpg`      |                             |
| 20  | **Galerie photo 7**                                          | `gallerySrcs[6]`                                  | `/images/musee/galerie-musee-7.jpg`      |                             |
| 21  | **Galerie photo 8**                                          | `gallerySrcs[7]`                                  | `/images/musee/galerie-musee-8.jpg`      |                             |
| 22  | **Galerie photo 9**                                          | `gallerySrcs[8]`                                  | `/images/musee/galerie-musee-9.JPG`      |                             |

## Sections sans image dédiée (actuellement)

- **Parcours et espaces du musée** (texte + coupe) : pas de photo latérale.
- **Durée et tarifs** + **Plans du musée** : pas de photo latérale.
- **Le musée en vidéo** : embed YouTube uniquement.

## Attention aux doublons actuels

Aujourd’hui **`galerie-musee-1.jpg`** sert à la fois au **Contexte** et à la **1re image de galerie** ; de même **3, 4, 5** sont partagés entre **visuels latéraux** et **galerie**. En remplissant le tableau tu peux décider de photos distinctes pour chaque ligne : il suffira alors de mettre des chemins différents dans les fichiers indiqués.

## Après remplissage

Envoie ce tableau complété (ou le fichier édité) : on pourra aligner les chemins dans `musee-side-visuals.json`, `musee-acteurs.json`, la vue et éventuellement renommer les fichiers dans `public/images/musee/`.
