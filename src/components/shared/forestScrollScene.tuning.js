/**
 * =============================================================================
 * forestScrollScene.tuning.js — réglages de la scène « forêt / ciel » (accueil)
 * =============================================================================
 *
 * Utilisation
 * -----------
 * Le composant `ForestScrollScene.vue` importe `forestSceneTuning` et
 * `forestScrollEasings`. En modifiant CE fichier, tu changes l’animation et la
 * mise en page sans toucher à la logique Vue (sauf si tu ajoutes de nouvelles
 * clés : il faudra alors les lire dans le `.vue`).
 *
 * Principe visuel
 * ---------------
 * - Image `2.svg` = ciel (arrière-plan), centrée dans la scène.
 * - Image `1.svg` = arbres (premier plan), au-dessus du ciel, centrée pareil.
 * - **Agrandir / réduire la forêt** : `trees.scroll.visualScale` (voir section
 *   `trees` plus bas) — pas besoin de modifier le SVG ni le `.vue`.
 * - Une variable interne `t` va de 0 à 1 quand l’utilisateur fait défiler la
 *   page et que ce bloc entre dans le viewport (voir formule dans le `.vue`).
 * - Le ciel a en plus une animation CSS lente (boucle), indépendante du scroll.
 *
 * Accessibilité
 * -------------
 * Si l’utilisateur a « réduire les animations » (prefers-reduced-motion), le
 * composant désactive les transforms et l’animation du ciel : les valeurs ici ne
 * s’appliquent alors plus au mouvement, seulement aux tailles/couleurs de base.
 */

/**
 * Courbes d’easing pour la progression `t` liée au scroll.
 *
 * Entrée : `t` entre 0 et 1 (temps « normalisé » après clamp sur le scroll).
 * Sortie : une valeur entre 0 et 1 utilisée telle quelle pour interpoler les
 * transforms (zoom, translation des arbres, etc.).
 *
 * - `linear`      : même vitesse du début à la fin (t sec).
 * - `easeOutCubic`: rapide au début, ralentit vers la fin (effet « pose »).
 * - `easeOutQuart`: comme cubic mais encore plus doux en fin de course.
 * - `easeInOutCubic`: doux au début et à la fin, plus vif au milieu.
 *
 * Pour en ajouter une : copie une ligne, donne-lui un nom (clé), et référence
 * ce nom dans `scroll.easing` ci-dessous.
 */
export const forestScrollEasings = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  easeOutQuart: (t) => 1 - (1 - t) ** 4,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * @typedef {keyof typeof forestScrollEasings} ForestScrollEasingName
 */

export const forestSceneTuning = {
  /**
   * Scroll → progression `t`
   * -------------------------
   * Dans le composant, on calcule d’abord une valeur brute (souvent notée
   * `raw`) avec la position du bloc par rapport à la fenêtre, puis on la
   * borne entre 0 et 1 (`clamped`), puis on applique `forestScrollEasings[easing]`.
   *
   * Interprétation approximative :
   * - `t ≈ 0` : le bloc arrive par le bas de l’écran (début de l’effet).
   * - `t ≈ 1` : le bloc est bien visible / remonté (fin de l’effet).
   *
   * `easing` : nom d’une clé dans `forestScrollEasings` (chaîne exacte).
   */
  scroll: {
    /** @type {ForestScrollEasingName} */
    easing: 'easeOutCubic'
  },

  /**
   * Calque ciel (`public/images/svg/2.svg`)
   * ----------------------------------------
   * Deux effets combinés :
   * 1) `scroll` — transform appliqué sur l’`<img>` selon `t` (zoom léger + drift X).
   * 2) `ambient` — animation CSS sur un wrapper (mouvement lent autour du centre),
   *    pour que le ciel « respire » même si on ne scroll pas.
   */
  sky: {
    /**
     * Effet lié au scroll (sur l’image ciel)
     *
     * - `scaleStart` / `scaleEnd` : à `t = 0`, échelle = scaleStart ; à `t = 1`,
     *   échelle = scaleEnd. Entre les deux, interpolation linéaire. Typiquement
     *   start > end = le ciel paraît un peu « zoomé » au début puis se stabilise.
     * - `driftXMaxPx` : amplitude max en pixels du translateX. La formule dans le
     *   Vue est `skyX = (t - 0.5) * 2 * driftXMaxPx` : à `t = 0` le ciel est
     *   décalé d’environ `-driftXMaxPx`, à `t = 0.5` il est centré sur X, à
     *   `t = 1` vers `+driftXMaxPx`. Ajuste pour plus ou moins de « balance ».
     * - `transformOrigin: '50% 50%'` : pivot au centre (aligné avec `object-position`
     *   du calque). Utilise `'100% 100%'` si tu veux ancrer le zoom au coin bas-droit.
     */
    scroll: {
      scaleStart: 1.1,
      scaleEnd: 1,
      driftXMaxPx: 14,
      transformOrigin: '50% 50%'
    },
    /**
     * Animation continue du ciel (wrapper `.forest-sky-edge-motion`)
     *
     * - `durationSec` : durée d’un demi-cycle (car `animation-direction: alternate`
     *   fait 0% ↔ 100% en boucle). Plus grand = mouvement plus lent.
     * - `timingFunction` : n’importe quelle valeur CSS valide pour
     *   `animation-timing-function` (ex. `ease-in-out`, `linear`, `cubic-bezier(...)`).
     * - `translateEndXPx` / `translateEndYPx` : position à la fin du keyframe 100%
     *   (négatif = gauche / haut depuis le centre du wrapper).
     * - `rotateEndDeg` : petite rotation en degrés à la fin du cycle (effet organique).
     *
     * Le keyframe 0% est toujours translate(0,0) rotate(0) ; seul 100% lit ces valeurs.
     */
    ambient: {
      durationSec: 10,
      timingFunction: 'ease-in-out',
      translateEndXPx: -10,
      translateEndYPx: -8,
      rotateEndDeg: 0.35
    }
  },

  /**
   * Calque arbres (`public/images/svg/1.svg`)
   * -----------------------------------------
   * Au-dessus du ciel. À `t = 0` : calque invisible (`startOpacity`). Ensuite entrée
   * (translations `arriveFrom*` : positif = décalage bas / droite au début, ramené à 0
   * quand `t → 1`), pivot au **centre** pour rester aligné avec l’image centrée.
   *
   * - `startOpacity` / `endOpacity` : opacité à `t = 0` et `t = 1` (souvent 0 → 1
   *   pour ne rien voir au début puis un fondu net).
   * - `arriveFromRightPx` : à `t = 0`, `translateX` = cette valeur (px) ; à `t = 1`,
   *   0. Valeurs positives décalent l’image vers la droite (hors champ côté droit
   *   avec `overflow: hidden` sur le plan).
   * - `arriveFromBottomPx` : idem pour `translateY` (positif = vers le bas).
   * - `scaleStart` / `scaleEnd` : échelle à `t = 0` et `t = 1` (souvent < 1 au début
   *   pour un léger effet de « pose » depuis le coin, avec le même pivot).
   * - `visualScale` : **taille globale du calque forêt** (multiplicateur à tout
   *   instant, même pivot que l’animation). `1` = taille de référence dans le cadre
   *   `contain` ; **> 1** (ex. `1.1`, `1.15`) = forêt plus grande ; **< 1** = plus
   *   petite / plus « loin ». C’est l’endroit principal pour agrandir ou réduire
   *   l’image `1.svg` sans toucher au fichier SVG.
   * - `transformOrigin` : `'50% 50%'` pour zoom/entrée centrés ; `'100% 100%'` pour
   *   ancrer au coin bas-droit.
   * - `dropShadow` : argument de `filter: drop-shadow(...)` (pas `box-shadow`).
   */
  trees: {
    scroll: {
      startOpacity: 0.5,
      endOpacity: 1,
      arriveFromRightPx: 80,
      arriveFromBottomPx: 160,
      scaleStart: 0.45,
      scaleEnd: 1,
      /** Taille globale forêt : > 1 agrandit (ex. 1.1), < 1 réduit (ex. 0.9) */
      visualScale: 1,
      transformOrigin: '100% 100%'
    },
    dropShadow: '-10px 6px 20px rgba(8, 16, 24, 0.32)'
  },

  /**
   * Dimensions et fond du conteneur `.forest-scene`
   * ------------------------------------------------
   * La hauteur CSS est :
   *   clamp(minHeightPx, min(preferredVw vw, preferredVh vh), maxHeightPx)
   *
   * - `minHeightPx` : hauteur minimum (évite un bandeau trop plat sur mobile).
   * - `preferredVw` / `preferredVh` : le milieu du clamp prend le PLUS PETIT des
   *   deux (ex. 78vw vs 68vh) pour rester lisible sur écran large ou court.
   * - `maxHeightPx` : plafond pour ne pas occuper toute la fenêtre sur grands écrans.
   * - `background` : couleur derrière les SVG (transparence, chargement, bandes si
   *   le ratio du bloc ne colle pas aux illustrations). Ciel et arbres : même cadre,
   *   `object-fit: contain`, `object-position: center` — pas de crop, resize identique.
   */
  scene: {
    minHeightPx: 520,
    preferredVw: 78,
    preferredVh: 68,
    maxHeightPx: 960,
    background: '#152a38'
  },

  /**
   * Cadre + masque haut (au-dessus des SVG)
   * ----------------------------------------
   * Le cadre et le masque haut épousent la **boîte affichée** du SVG ciel (`2.svg`) :
   * même largeur/hauteur que le rendu `object-fit: contain` centré (calcul JS).
   * La pile `.forest-stack` utilise un `clip-path` **à l’intérieur** du liseré
   * (retrait = `clipInsetPx` ou `borderWidthPx + 1` par défaut), pas sur le bord
   * extérieur du cadre.
   * Les deux SVG doivent idéalement partager le même ratio pour que l’arbres
   * (`1.svg`) reste aligné dans le cadre.
   *
   * - `borderWidthPx` : épaisseur de la bordure intérieure visible.
   * - `borderColor` / `innerHighlight` : couleur du cadre et fin liseré clair
   *   (box-shadow inset) à l’intérieur du cadre.
   * - `topMaskHeightPx` : hauteur de la zone sous laquelle on dégrade vers transparent.
   * - `topMaskOpaqueStopPct` : jusqu’à quel % de la hauteur du masque la couleur
   *   reste opaque (0–100), puis fondu jusqu’à transparent.
   * - `topMaskColor` : chaîne CSS (ex. `'#152a38'`). Chaîne vide = on utilise
   *   `scene.background` pour coller au fond de la scène.
   * - `clipInsetPx` : nombre de px à retirer du bord extérieur du cadre vers
   *   l’intérieur pour le clip des SVG (et l’alignement du masque haut). `null` =
   *   `borderWidthPx + 1` (après le double `box-shadow` du cadre).
   */
  frame: {
    borderWidthPx: 2,
    clipInsetPx: null,
    /** Contraste avec `scene.background` : tons chauds pour que le cadre se lise */
    borderColor: 'rgba(210, 195, 168, 0.55)',
    innerHighlight: 'rgba(255, 252, 245, 0.42)',
    topMaskHeightPx: 64,
    topMaskOpaqueStopPct: 42,
    topMaskColor: ''
  },

  /**
   * Atmosphère (surcouche claire en haut à gauche)
   * ----------------------------------------------
   * Dégradé radial + mode de fusion. `mixBlendMode` est une valeur CSS valide
   * (`soft-light`, `overlay`, `multiply`, etc.). Tester visuellement : certains
   * modes changent fortement le rendu sur le ciel sombre.
   */
  atmo: {
    gradient:
      'radial-gradient(115% 75% at 0% 0%, rgba(255, 253, 248, 0.12) 0%, transparent 58%)',
    mixBlendMode: 'soft-light'
  },

  /**
   * Vignette (assombrit surtout le coin bas-droit)
   * ----------------------------------------------
   * Purement décoratif ; chaîne `gradient` complète comme pour `atmo`.
   */
  vignette: {
    gradient:
      'radial-gradient(125% 95% at 100% 100%, transparent 35%, rgba(8, 18, 28, 0.4) 100%)'
  },

  /**
   * Slot Vue (contenu texte / boutons au centre de la scène)
   * ---------------------------------------------------------
   * `padding` : valeur CSS brute (ex. `'2rem'`, `'1.5rem 2rem'`).
   */
  content: {
    padding: '2rem'
  },

  /**
   * Fondu en bas de section
   * ------------------------
   * Bande en `linear-gradient` du transparent vers `colorEnd` pour enchaîner
   * visuellement avec le fond « cream » de la page suivante.
   *
   * - `heightPx` : hauteur de cette bande.
   * - `colorEnd` : doit idéalement matcher le fond de la section dessous (ex.
   *   couleur Tailwind `cream` du thème).
   */
  fade: {
    heightPx: 2,
    colorEnd: '#fefdfc'
  }
}
