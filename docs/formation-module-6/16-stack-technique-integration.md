# Stack technique & intégration

---

## Arborescence cible

```
public/formation/module-6-deck/
├── index.html              # Deck complet (~55 sections)
├── deck-stage.js           # Copie module-10-deck
├── support.js              # Copie module-10-deck
├── vendor/
│   ├── react.production.min.js
│   ├── react-dom.production.min.js
│   └── babel.min.js
└── images/
    ├── LOGOAKUU.png        # Copie module-5-deck
    └── collibri-akuu.png   # Copie module-5-deck
```

---

## Commandes setup (Claude Code)

```bash
cd /Users/yreyricord/akuu/akuu

# Copier squelette
cp -R public/formation/module-10-deck public/formation/module-6-deck

# Nettoyer l'ancien contenu
rm public/formation/module-6-deck/index.html

# Images depuis M5
mkdir -p public/formation/module-6-deck/images
cp public/formation/module-5-deck/images/LOGOAKUU.png public/formation/module-6-deck/images/
cp public/formation/module-5-deck/images/collibri-akuu.png public/formation/module-6-deck/images/
```

Puis écrire `index.html` from scratch en suivant les patterns.

---

## Enregistrement app Vue

**Fichier :** `src/data/formation-modules.js`

Ajouter dans `MODULE_DECKS` :

```javascript
6: '/formation/module-6-deck/index.html',
```

---

## Routing formation

- Route générique : `/formation/module-6` → `FormationModuleView.vue`
- Charge iframe/deck si id présent dans `MODULE_DECKS`
- Sinon placeholder « coming soon »

---

## i18n (hors scope sprint)

Titre déjà présent :

```json
"module_6": {
  "title": "Être un bénévole responsable : image, posture et impact sur les communautés"
}
```

Fichiers : `src/i18n/fr.json` (+ en, es, de, pt) — **ne pas modifier** sauc sauf demande.

---

## Test local

```bash
npm run dev
# Ouvrir http://localhost:5173/formation/module-6
```

Vérifications :
- [ ] Deck s'affiche 1920×1080 scaled
- [ ] Navigation clavier ← →
- [ ] Carrousels fonctionnent
- [ ] Speaker notes visibles mode présentateur
- [ ] Lien clôture → module 7

---

## Build preview

```bash
npm run build && npm run preview
```

---

## Fichiers à NE PAS modifier

- `public/formation/deck-theme.css` (sauf bug critique)
- `module-5-deck/index.html` (sauf lien déjà OK)
- Autres modules existants

---

## Taille index.html estimée

- M5 : ~1166 lignes · 52 slides
- M6 cible 55 slides : ~1200–1400 lignes
- **Écrire par batches** pour éviter troncature LLM

---

## dc-runtime / support.js

- `support.js` est **généré** (ne pas éditer manuellement)
- Copier tel quel depuis module-10-deck
- `deck-interactions.js` chargé depuis `../module-1-deck/deck-interactions.js`
