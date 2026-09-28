# PROMPT MAÎTRE — Formation AKUU Module 6 (autonome de A à Z)

> **Instructions :** copie-colle l'intégralité de ce document dans une nouvelle session Claude (de préférence **Claude Code** avec accès au repo). Ne demande pas de clarification au fondateur sauf blocage technique absolu. Travaille **de bout en bout** jusqu'à livraison testable.

---

## 1. Mission

Tu es un ingénieur pédagogique + intégrateur front-end. Tu dois **créer le Module 6** de la formation bénévole AKUU :

- **Titre :** « Être un bénévole responsable : image, posture et impact sur les communautés »
- **Livrable principal :** deck HTML interactif complet dans `public/formation/module-6-deck/`
- **Langue :** français uniquement
- **Durée cible en formation :** ~2 h (comme le Module 5)
- **Nombre de slides cible :** 45–55 (voir `05-inventaire-slides-detaille.md`)

Le Module 5 explique **pourquoi** (solidarité, néocolonialisme, white savior). Le Module 6 explique **comment se comporter sur le terrain**. Le Module 7 (à venir) = mises en situation. Le Module 10 = logistique + appel terrain (ne pas dupliquer).

---

## 2. Dossier de référence (LIRE AVANT DE CODER)

Tout le contenu validé est dans :

```
docs/formation-module-6/
```

**Ordre de lecture obligatoire (ne pas tout charger d'un coup — voir §8 économie tokens) :**

1. `00-INDEX.md`
2. `03-decisions-fondateur-validees.md`
3. `05-inventaire-slides-detaille.md`
4. `14-design-system-deck.md` + `15-patterns-html-slides.md`
5. `16-stack-technique-integration.md`
6. Puis les fichiers thématiques au fur et à mesure de la rédaction des parties

---

## 3. Fil conducteur pédagogique

**« Je porte la casquette AKUU en permanence, même hors mission. »**

Trois piliers récurrents sur tout le deck :

1. **Posture** — humilité, écoute, pas de jugement, continuité du projet
2. **Équité** — pas de favoritisme, pas d'exclusivité relationnelle, pas d'argent sauf urgence santé
3. **Sécurité & cadre** — Amazonie, substances, fin de mission, image

Règle transversale (héritée M5) : **Doute = non**

Phrase officielle en cas de contradiction avec une décision passée :

> « Je suis désolé·e, je n'ai pas accès à ces informations. Je vais prendre connaissance avec l'association de cette décision et je reviens vers vous. »

---

## 4. Contraintes design (NON NÉGOCIABLES)

### Continuité visuelle

- **Même stack** que M5/M10 : `<x-dc>` + `deck-stage.js` + `../deck-theme.css`
- **Copier la structure** de `public/formation/module-10-deck/` comme squelette (vendor, support.js, deck-stage.js)
- **Réutiliser les images** de M5/M10 : `images/LOGOAKUU.png`, `images/collibri-akuu.png` (symlink ou copie depuis module-5-deck/images)
- **Marges module :** `--pad-top: 88px; --pad-bottom: 74px; --pad-x: 110px;`
- **Accent couleur Module 6 :** groupe 2 = **bleu** (comme M5), avec touches **terracotta** pour les « lignes rouges » (comme M10 pour les alertes)

### Gabarits slides (respecter deck-theme.css)

| Type | Fond | Usage |
|------|------|-------|
| Couverture | `--role-cover-bg` (bleu radial) | Slide 01 |
| Sommaire | `--role-toc-bg` | Slide 02 |
| Chapitre | `--role-chapter-bg` (vert) | Intercalaires parties |
| Contenu | `--green-pale`, `--sand`, `--cream` | Slides pédagogiques |
| Alerte / interdit | terracotta, `deck-carousel__card--alert` | Lignes rouges |
| Clôture | vert forêt ou bleu nuit | Dernière slide |

### Composants à réutiliser

- Carrousels : `data-deck-carousel` (voir M5 slide « Règle bénévole · posture »)
- Notes formateur : `data-speaker-notes="..."` sur chaque `<section>` (texte long, détaillé, comme M5)
- Navigation module suivant : `deck-next-module` → `/formation/module-7`
- Badges protection faune : `deck-protect deck-protect--protege|bushmeat|veda` (M4)

### Interdictions design

- Ne pas créer de nouvelle palette de couleurs
- Ne pas modifier `deck-theme.css` sauf bug bloquant
- Ne pas inventer de nouveaux composants JS
- Pas de traduction i18n dans ce sprint (français seulement dans le HTML)

---

## 5. Contenu obligatoire par partie

Suis **exactement** l'inventaire dans `05-inventaire-slides-detaille.md`. Résumé :

| Partie | Thème | Slides clés |
|--------|-------|-------------|
| 0 | Ouverture + fil conducteur casquette | 3 |
| 1 | Représentation permanente + continuité projet | 6 |
| 2 | Relations, équité, favoritisme, argent | 7 |
| 3 | **Tourisme sexuel** (section la plus longue) | 10 |
| 4 | Substances (alcool modéré, tabac, drogues) | 5 |
| 5 | Image, photos, consentement (renvoi M5) | 5 |
| 6 | Sécurité Amazonie (forêt, machette, hôpital) | 7 |
| 7 | Faune / alimentation (renvoi M4 + législation) | 6 |
| 8 | Fin de mission, COVID, casquette | 5 |
| 9 | Charte récap + clôture → M7 | 4 |

**Décisions fondateur intégrées** (détails dans `03-decisions-fondateur-validees.md`) :

- Amitié OK · exclusivité NON
- Argent urgence santé : liberté bénévole · débrief interne recommandé
- Alcool : bière le soir OK · pas de beuverie répétée · pas d'abus devant communauté
- Après mission : pas dormir chez habitant · lodge payant OK · si AKUU ferme → partir (COVID)
- Quiz obligatoire : **plus tard** (mentionner en clôture, ne pas implémenter)

---

## 6. Intégration technique (À FAIRE EN FIN DE TRAVAIL)

1. Créer `public/formation/module-6-deck/` en copiant l'ossature de `module-10-deck/` (vendor, support.js, deck-stage.js)
2. Écrire `index.html` complet (~45–55 sections)
3. Copier/symlink images depuis module-5-deck
4. **Enregistrer le deck** dans `src/data/formation-modules.js` :

```js
6: '/formation/module-6-deck/index.html',
```

5. Vérifier que M5 clôture pointe déjà vers `/formation/module-6` (c'est le cas)
6. Tester : `npm run dev` → naviguer vers le module 6 dans l'app

---

## 7. Méthode de travail autonome (OBLIGATOIRE)

Suis `18-methode-travail-ia-tokens.md`. En résumé :

### Phase A — Setup (1 tour)
- Lire index + décisions + inventaire slides + design system
- Copier squelette module-10-deck → module-6-deck
- Créer un fichier local `docs/formation-module-6/PROGRESS.md` pour tracker l'avancement

### Phase B — Rédaction par batches (6–9 tours)
Travailler **partie par partie**, jamais tout le HTML d'un coup :

1. Écrire les slides de la partie N dans un fichier temporaire ou directement index.html
2. Copier les patterns depuis `15-patterns-html-slides.md`
3. Rédiger `data-speaker-notes` en même temps (pas en différé)
4. Commit logique par partie (si git autorisé) ou checkpoint PROGRESS.md

### Phase C — Intégration
- Enregistrer MODULE_DECKS
- Test navigateur
- Checklist `19-checklist-livraison.md`

### Plugins / outils recommandés (Claude Code)

- **Read / Grep / Glob** : lire les modules existants par extrait, jamais index.html entier si >500 lignes
- **Task subagent** : optionnel pour extraire patterns HTML de M5/M10 en parallèle
- **Pas de WebSearch** sauf vérification légale ponctuelle (déjà documenté dans le dossier)

### Économie de tokens

- Ne jamais coller le Module 4 ou 5 entier dans le contexte
- Utiliser `Grep` avec contexte `-A 20` sur les patterns ciblés
- Speaker notes : rédiger concises mais complètes (~150–400 mots/slide pour les slides clés, ~80 pour les simples)
- Référencer M4/M5 par renvoi (« voir Module 4 ») plutôt que dupliquer les listes d'espèces en entier sur chaque slide

---

## 8. Qualité attendue

### Speaker notes
Chaque slide DOIT avoir `data-speaker-notes` avec :
- Durée indicative
- Ce que le formateur dit
- Questions à poser au groupe (si pertinent)
- Pièges à éviter

### Ton pédagogique
- Direct, bienveillant, jamais culpabilisant
- Exemples concrets Puerto Miguel / Loreto / Iquitos
- Distinguer « interdit AKUU » vs « légal pour communautés locales »

### Cohérence parcours
- Slide ouverture : rappeler que M5 a posé le « pourquoi »
- Slide clôture : annoncer M7 (dilemmes) + rappeler prérequis M5 si non lus
- Ne pas refaire toute la théorie M5 (max 2 slides de rappel)

---

## 9. Critères de succès (Definition of Done)

- [ ] `public/formation/module-6-deck/index.html` existe et s'affiche en 1920×1080
- [ ] 45–55 slides avec labels numérotés cohérents (`data-label="NN · …"`)
- [ ] Toutes les règes de `06-regles-catalogue-complet.md` apparaissent au moins une fois
- [ ] Section tourisme sexuel ≥ 8 slides avec cadre légal Loreto
- [ ] Slide dédiée « casquette AKUU / COVID / ne pas dormir chez habitant »
- [ ] Carrousel « lignes rouges » (4 cartes minimum)
- [ ] `MODULE_DECKS[6]` enregistré
- [ ] Lien clôture → Module 7
- [ ] Aucune duplication massive du contenu M10 (admin, kit, Casa)
- [ ] Checklist `19-checklist-livraison.md` passée

---

## 10. Commence maintenant

**Première action :** lis `05-inventaire-slides-detaille.md`, copie le squelette `module-10-deck` vers `module-6-deck`, puis écris les slides 01–03 (couverture, sommaire, fil conducteur).

**Ne t'arrête pas** avant d'avoir un deck complet testable. En cas de doute contenu, applique la règle la plus stricte documentée dans ce dossier.

---

*Brief produit pour AKUU · septembre 2026 · Module 6 · Groupe 2 (accent bleu)*
