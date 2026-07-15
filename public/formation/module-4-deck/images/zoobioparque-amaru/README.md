# Images Zoobioparque Amaru — Module 4

Source : [Bioparque Amaru](https://www.zoobioparqueamaru.com/nuestros-animales/) (Cuenca, Équateur).

## Structure

```
zoobioparque-amaru/
├── manifest.json          # métadonnées + suggestions de mapping deck
├── raw/
│   ├── mamiferos/   (30)
│   ├── reptiles/    (49)
│   ├── anfibios/    (9)
│   └── aves/        (43)
└── README.md
```

## Téléchargement / mise à jour

```bash
python3 scripts/fetch-zoobioparque-amaru.py
```

Options : `--dry-run`, `--only mamiferos,aves`, `--out <chemin>`.

Les fichiers déjà présents ne sont pas re-téléchargés.

## Prochaine étape

Copier les images retenues vers `images/especes/` avec le nom attendu par le deck
(voir `images/especes/README.md`), ou remplacer les placeholders `M4-XX`.

**Crédit photo recommandé** : Zoobioparque Amaru, Cuenca — avec lien vers la fiche espèce.
