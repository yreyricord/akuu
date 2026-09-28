# Patterns HTML — Slides réutilisables

> Extraire via Read/Grep depuis modules existants · ne pas réinventer.

---

## Squelette index.html

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
<script src="../module-1-deck/deck-interactions.js" defer></script>
</head>
<body>
<x-dc>
<helmet>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:...&family=Inter:...&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../deck-theme.css">
  <style>/* marges module 6 only */</style>
</helmet>

<x-import component-from-global-scope="deck-stage" from="./deck-stage.js" width="1920" height="1080" hint-size="100%,100%" data-uneditable="">
  <!-- sections ici -->
</x-import>
</x-dc>
</body>
</html>
```

---

## Section type avec speaker notes

```html
<section
  data-label="05 · La casquette AKUU"
  data-speaker-notes="DURÉE 5 min. Expliquer métaphore casquette Règlement §7..."
  style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
  <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
  <div class="tag" style="color:var(--green-forest);">02 · Posture</div>
  <div class="topbar" style="background:var(--green-leaf);"></div>
  <h1 class="h" style="color:var(--green-forest);">La casquette AKUU</h1>
  <!-- contenu -->
</section>
```

---

## Intercalaire chapitre

Référence : `module-5-deck/index.html` slide « 03 · Titre Partie 1 »

```html
<section data-label="04 · Partie 01" style="background:var(--role-chapter-bg); ...">
  <div style="font-family:'Playfair Display'; font-size:var(--fs-6); color:rgba(166,198,57,0.15); position:absolute; top:40px; right:90px;">01</div>
  <div class="kicker" style="color:var(--green-leaf);">Partie 01</div>
  <h1 style="font-size:var(--fs-5); color:var(--cream);">Représentation permanente</h1>
</section>
```

---

## Carrousel 4 cartes

Référence : `module-5-deck/index.html` ~ligne 1091 « Règle bénévole · posture »

Structure :
```html
<div class="deck-carousel" data-deck-carousel style="flex:1;">
  <div class="deck-carousel__stage">
    <button class="deck-carousel__arrow deck-carousel__prev" aria-label="Précédent"></button>
    <div class="deck-carousel__viewport">
      <div class="deck-carousel__slide deck-carousel__slide--active">...</div>
      <div class="deck-carousel__slide">...</div>
    </div>
    <button class="deck-carousel__arrow deck-carousel__next" aria-label="Suivant"></button>
  </div>
  <div class="deck-carousel__nav">
    <div class="deck-carousel__dots">...</div>
  </div>
</div>
```

Carte alerte :
```html
<div class="card deck-carousel__card--alert" style="height:100%;">
  <div class="xs" style="color:var(--ochre-light);">LIGNE ROUGE</div>
  <div class="body" style="color:var(--cream);">...</div>
</div>
```

---

## Slide citation grande

```html
<p style="font-family:'Playfair Display'; font-size:var(--fs-3); font-style:italic; color:var(--blue-akuu); max-width:1400px; line-height:1.35;">
  « Je suis désolé·e, je n'ai pas accès à ces informations... »
</p>
```

---

## Grille 2 colonnes

```html
<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; flex:1;">
  <div class="card" style="background:var(--cream);">...</div>
  <div class="card" style="background:var(--cream);">...</div>
</div>
```

---

## Clôture + next module

Référence : `module-5-deck/index.html` fin (~ligne 1154)

```html
<div class="deck-module-nav">
  <a href="/formation/module-7" target="_top" rel="noopener" class="deck-next-module">
    <div class="small deck-next-module__label">PROCHAIN MODULE</div>
    <div class="deck-next-module__title">Module 7 : Mises en situation et dilemmes éthiques</div>
  </a>
</div>
```

---

## Fichiers à copier depuis module-10-deck

```
module-6-deck/
  index.html          ← créer
  deck-stage.js       ← copier
  support.js          ← copier
  vendor/             ← copier dossier entier
  images/             ← copier depuis module-5-deck/images (logo + colibri)
```
