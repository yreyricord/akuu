# Stratégie images Module 4 — images manquantes

Pipeline en 3 sources, un script par source, un manifeste central.

```
scripts/
  fetch-zoobioparque-amaru.py   ← faune (zoo Cuenca) · déjà en place
  fetch-deck-images.py          ← Wikimedia Commons · déjà en place
  fetch-inaturalist-images.py   ← à créer (flore + espèces absentes du zoo)
```

## 1. Zoobioparque Amaru (priorité faune)

**Couverture :** ~131 espèces équatoriennes, photos zoo cohérentes.

**Limite :** pas de flore, pas de poissons, pas d'insectes, pas de boto/lamantin/loutre.

```bash
python3 scripts/fetch-zoobioparque-amaru.py
```

## 2. Wikimedia Commons (flore + compléments)

**Couverture :** arbres, lianes, plantes médicinales, garzas, tuqui tuqui.

**Limite :** rate-limit API (429) · certaines plantes rares (jergón sacha) sans photo bitmap.

```bash
python3 scripts/fetch-deck-images.py
# --only flora | fauna | all
```

## 3. iNaturalist (recommandé pour le reste)

**Pourquoi :** photos **in situ** Amazonie, filtres `quality_grade=research`, licences CC BY / CC BY-NC, API stable.

**Workflow proposé :**

1. Liste cible dans `module-4-deck/images/targets.json` (nom vernaculaire, taxon, slide, fichier).
2. Script `fetch-inaturalist-images.py` :
   - `GET https://api.inaturalist.org/v1/taxa?q=...&rank=species`
   - `GET https://api.inaturalist.org/v1/observations?taxon_id=...&photos=true&quality_grade=research&place_id=...` (Pérou / Amazonie)
   - Télécharge la photo la plus votée · licence CC
   - Écrit `manifest.json` avec auteur, licence, URL observation
3. Validation manuelle d'un dossier `review/` avant copie vers `especes/` ou `flores/`.

**Espèces prioritaires iNaturalist :**

| Fichier | Taxon | Slide |
|---------|-------|-------|
| `jergon-sacha.jpg` | *Dracontium polyphyllum* | Plantes médicinales |
| `cupuacu.jpg` | *Theobroma grandiflorum* | Ressources alimentaires |
| `camu-camu.jpg` | *Myrciaria dubia* | Ressources alimentaires |
| `yuca.jpg` | *Manihot esculenta* | Ressources alimentaires |
| `orpaillage.jpg` | lieu Madre de Dios | Partie 03 (M4-12 / M4-12b) |
| `curandero.jpg` | scène rituelle (stock CC) | Partie 05 (M4-16) |

### Partie 03 · Enjeux — placeholders ajoutés

| ID | Type | Contenu suggéré |
|----|------|-----------------|
| M4-12 / M4-12b | satellite / photo | Orpaillage Madre de Dios / rivière turbide |
| M4-17 | photo / satellite | Frontière agricole pâturages–soja |
| M4-18 | photo | Grumes / chantier forestier |
| M4-19 | photo / carte | Route ou barrage |
| M4-20 / M4-23 | photo / satellite | Feux / fumée / cicatrices de brûlis |
| M4-21 | carte | Perte forestière (RAISG / MapBiomas / MAAP) |
| M4-22 | satellite | Forêt dégradée / lisière fragmentée |
| M4-24 | schéma | Boucle feux ↔ sécheresse ↔ carbone |
| M4-25 | photo / carte | BR-163 / barrage Madeira |
| M4-26–28 | photo | Trafic / jaguar / paiche–boto |
| M4-29 | photo | Sécheresse ou glacier andin |
| M4-30 | schéma | Tipping point / recycle hydrologique |
| M4-31 | photo | Communauté / territoire (consentement) |
| M4-32 | photo | Pacaya-Samiria / gardiens |

## 4. Schémas & illustrations (M4-11, M4-13, M4-14…)

Pas de photo : générer ou sourcer :

- **M4-11** stratification → diagramme SVG (canopée / émergents) · NASA Earth Observatory ou WWF
- **M4-12** orpaillage → MAAP Amazon / MapBiomas (images satellite CC)
- **M4-13–16** mythologie → illustrations IA ou banques éducatives (Vecteezy, Smithsonian OE)
- **M4-21 / M4-24 / M4-30** cartes & schémas Enjeux → MAAP, MapBiomas, WWF

## État actuel

| Dossier | Fichiers | Source |
|---------|----------|--------|
| `images/especes/` | ~42 | Amaru + Wikimedia |
| `images/flores/` | 17 | Wikimedia |
| Placeholders restants | jergon-sacha, M4-12 à M4-16 | iNaturalist / schémas |

## Crédits slide

Ajouter en bas de chaque slide galerie (optionnel) :

`Photo · [Auteur] / [Licence] · via [Amaru | Wikimedia | iNaturalist]`

Voir `images/image-manifest.json` pour le suivi des erreurs.
