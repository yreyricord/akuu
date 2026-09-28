# Méthode de travail IA — Autonomie & économie tokens

> Pour Claude Code, Cursor, ou Claude Projects avec accès repo.

---

## Principe

**Ne jamais charger tout le contexte d'un coup.** Travailler en pipeline avec fichiers locaux comme mémoire externe.

---

## Phase 0 · Brief (1 message utilisateur)

Coller **`PROMPT-CLAUDE.md`** en entier + attacher dossier `docs/formation-module-6/`.

---

## Phase 1 · Setup (tour 1)

**Lire uniquement :**
- `00-INDEX.md`
- `03-decisions-fondateur-validees.md`
- `05-inventaire-slides-detaille.md` (sections 01–10)
- `16-stack-technique-integration.md`

**Actions shell :**
- Copier module-10-deck → module-6-deck
- Copier images M5
- Créer `PROGRESS.md` :

```markdown
# Progress Module 6
- [ ] Setup fichiers
- [ ] Slides 01-09 Partie 0-1
- [ ] Slides 10-16 Partie 2
- [ ] Slides 17-26 Partie 3
- [ ] Slides 27-34 Partie 4-5
- [ ] Slides 35-41 Partie 6
- [ ] Slides 42-47 Partie 7
- [ ] Slides 48-55 Partie 8-9
- [ ] MODULE_DECKS registration
- [ ] Test navigateur
```

---

## Phase 2 · Rédaction par batches (tours 2–8)

| Tour | Slides | Fichiers contexte à lire |
|------|--------|--------------------------|
| 2 | 01–09 | 13-casquette, 07-reglement, 15-patterns |
| 3 | 10–16 | 06-regles B, 03-decisions |
| 4 | 17–26 | 12-tourisme-sexuel (complet) |
| 5 | 27–34 | 07-reglement §4-5, 08-guide |
| 6 | 35–41 | 09-securite-amazonie |
| 7 | 42–47 | 10-faune, 11-legislation |
| 8 | 48–55 | 13-casquette, 17-speaker-notes |

**Par tour :**
1. Grep pattern cible dans M5/M10 (20–40 lignes max)
2. Écrire HTML batch dans index.html
3. Cocher PROGRESS.md
4. **Ne pas** relire index.html entier

---

## Plugins & outils recommandés

### Claude Code / Cursor

| Outil | Usage |
|-------|-------|
| **Read** avec `offset/limit` | Lire morceaux index.html |
| **Grep** | Trouver patterns (`deck-carousel`, `data-label`) |
| **Glob** | Lister fichiers deck |
| **Write / StrReplace** | Écrire par batch ou append |
| **Shell** | cp, npm run dev, wc -l |

### Éviter

| Outil | Pourquoi |
|-------|----------|
| Read index.html entier M4 | 2000+ lignes · gaspillage |
| WebSearch répété | Déjà dans docs 11–12–20 |
| Task agent exploratoire | Contexte déjà documenté |

### Claude Projects (sans code)

1. Uploader dossier MD complet
2. Demander génération **partie par partie** en 8 messages
3. Assembler index.html manuellement ou via Claude Code ensuite

---

## Techniques réduction tokens

### 1 · Mémoire fichier PROGRESS.md
Stocker décisions prises · numérotation slides · pas re-expliquer.

### 2 · Références par chemin
« Comme M5 slide 51 carousel » au lieu de coller HTML.

### 3 · Speaker notes différées (option)
Tour A : structure HTML slides  
Tour B : enrichir notes slides 17–26 seulement

### 4 · Compression contenu faune
Slide 44 : liste **top 15** espèces + « voir Module 4 » · pas les 80 espèces M4.

### 5 · `wc -l` vérification
Objectif 1200–1400 lignes · alerte si >2000 (risque bloat).

---

## Gestion erreurs LLM

| Problème | Solution |
|----------|----------|
| Troncature HTML | Écrire batch plus petit (5 slides) |
| Carrousel cassé | Copier bloc exact M5 grep |
| Guillemets cassés notes | Remplacer `"` internes par `'` |
| Slide overflow 1080 | Ajouter `flex:1; min-height:0` · réduire texte |

---

## Validation intermédiaire (auto)

Après chaque batch :
```bash
# Compter sections
grep -c 'data-label=' public/formation/module-6-deck/index.html

# Vérifier fermeture tags
grep -c '<section' public/formation/module-6-deck/index.html
grep -c '</section>' public/formation/module-6-deck/index.html
```

---

## Message de reprise (si contexte perdu)

```
Reprends Module 6 AKUU. Lis docs/formation-module-6/PROGRESS.md et continue le batch suivant non coché. Ne relis pas les slides déjà écrites sauf pour cohérence numérotation.
```

---

## Critère « terminé »

Voir `19-checklist-livraison.md` · tous items cochés.
