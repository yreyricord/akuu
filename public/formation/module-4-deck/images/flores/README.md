# Images flore — galerie cliquable (Module 4 · Partie 02)

Même logique que `images/especes/` : le fichier doit correspondre à `data-deck-pic` dans `index.html`.

## Slides

| Slide | Fichiers |
|-------|----------|
| Arbres géants | `lupuna.jpg`, `shiringa.jpg`, `castana.jpg` |
| Bois exploités | `caoba.jpg`, `lapacho.jpg` |
| Palmiers | `acai.jpg`, `pijuayo.jpg`, `aguaje.jpg` |
| Plantes médicinales | `una-de-gato.jpg`, `sangre-de-grado.jpg`, `jergon-sacha.jpg` |
| Ayahuasca | `ayahuasca.jpg`, `chacruna.jpg` |
| Kambo | `kambo.jpg` |
| Ressources alimentaires | `acai.jpg`, `cacao.jpg`, `guarana.jpg` |
| Symbioses / stratification | `cecropia.jpg`, `victoria-amazonica.jpg`, `lupuna.jpg` |

## Mise à jour

```bash
python3 scripts/fetch-deck-images.py --only flora
```

Sources : Wikimedia Commons (licences CC). Voir `../image-manifest.json`.
