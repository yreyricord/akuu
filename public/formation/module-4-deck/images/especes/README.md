# Images des espèces — galerie cliquable (Module 4)

Une image par espèce. **Le nom du fichier doit correspondre exactement** à l'attribut `data-deck-pic` de la carte dans `index.html`.

- Format : `.jpg`, ratio paysage ~3:4 à 4:3
- Sources : [Zoobioparque Amaru](https://www.zoobioparqueamaru.com/nuestros-animales/) (Cuenca) + Wikimedia Commons pour espèces absentes du zoo

## Slides · galerie faune (5–16)

### Slide 5 · Grands herbivores
- `sachavaca.jpg` — tapir (Amaru #76)
- `sajino.jpg` — pécari (Amaru #63)
- `ronsoco.jpg` — capybara (Amaru #77)

### Slide 6 · Rongeurs & loutres
- `anuje.jpg` — agouti (Amaru #74)
- `majas.jpg` — paca (Amaru #75)
- `lobo-de-rio.jpg` — loutre géante (Wikimedia · Giles Laurent, CC BY-SA 4.0)

### Slide 7 · Primates
- `coto.jpg` — singe hurleur (Amaru #69)
- `maquisapa.jpg` — singe araignée (Amaru #72)
- `huapo-pichico.jpg` — tamarin/chichico (Amaru #71)

### Slide 8 · Canopée & sous-bois *(nouveau)*
- `perezoso.jpg` — paresseux (Amaru #66)
- `coati.jpg` — coati (Amaru #60)
- `mono-ardilla.jpg` — singe-écureuil (Amaru #67)

### Slide 9 · Félins
- `otorongo.jpg` — jaguar (Amaru #131)
- `puma.jpg` — puma (Amaru #58)
- `ocelote.jpg` — ocelot (Amaru #80)

### Slide 10 · Dauphin rose
- `boto.jpg` — Inia geoffrensis (Wikimedia · CC BY-SA 4.0)

### Slide 11 · Lamantin
- `manati.jpg` — Trichechus inunguis (Wikimedia · CC BY-SA 3.0)

### Slide 12 · Oiseaux
- `guacamayo-rojo.jpg` — ara rouge (Amaru #22)
- `guacamayo-azul.jpg` — ara bleu (Amaru #23)
- `tucan.jpg` — toucan (Amaru #24)
- `trompetero.jpg` — oiseau trompette (Amaru #37)

### Slide 13 · Reptiles
- `anaconda.jpg` — anaconda (Amaru #101)
- `boa.jpg` — boa (Amaru #98)
- `caiman.jpg` — caïman (Amaru #83)
- `charapa.jpg` — tortue (Amaru #127)

### Slide 14 · Amphibiens
- `dendrobate.jpg` — ranita punta de flecha (Amaru #3)
- `rana-arlequin.jpg` — rana arlequín (Amaru #5)
- `rana-cohete.jpg` — rana cohete (Amaru #1)

### Slide 15 · Poissons
- `pirana.jpg` — piranha (Wikimedia · CC BY-SA 3.0)
- `paiche.jpg` — arapaima (Wikimedia · CC BY-SA 3.0)
- `anguila-electrica.jpg` — anguille électrique (Wikimedia · CC BY 2.0)

### Slide 16 · Insectes
- `morpho.jpg` — papillon Morpho (Wikimedia · CC BY-SA 4.0)
- `hormiga-cortadora.jpg` — fourmi Atta (Wikimedia · CC BY-SA 3.0)
- `heliconius.jpg` — papillon Heliconius (Wikimedia · CC BY-SA 3.0)

## Mise à jour des images Amaru

```bash
python3 scripts/fetch-zoobioparque-amaru.py
# puis recopier depuis zoobioparque-amaru/raw/ si besoin
```
