#!/usr/bin/env python3
"""Restore Module 4 faune enrichments (badges, raies, chauves-souris, carachupa, récap)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "public/formation/module-4-deck/index.html"

PROTEGE = {
    "sachavaca", "otorongo", "puma", "ocelote", "coto", "maquisapa", "huapo-pichico",
    "mono-ardilla", "perezoso", "boto", "manati", "lobo-de-rio", "tucuxi",
    "guacamayo-rojo", "guacamayo-azul", "aguila-harpia", "aguila-pechinegra",
    "mama-vieja", "gavilan-pollero", "caracara-curiquingue", "gavilan-cola-corta",
    "buho-anteojos", "buho-listado", "buho-estigio", "caiman-negro", "anaconda",
    "boa", "charapa", "motelo", "paujil", "carachupa-gigante", "condor-selva",
    "murcielago-pescador", "murcielago-frugivoro", "murcielago-vampiro",
}
BUSHMEAT = {
    "sajino", "majas", "ronsoco", "anuje", "coati", "mapache", "caiman-blanco",
    "caiman", "doncella",
}
VEDA = {"paiche"}
ADD_PROTEGE = {
    "olingo", "hoatzin", "camungo", "trompetero", "tucan", "tuqui-tuqui",
    "gallareta-purpura", "garza-tigre", "garza-blanca", "garza-ceniza",
    "garza-cocoi", "garza-cuervo", "garza-agami", "dendrobate", "rana-arlequin",
    "rana-cohete", "equis", "coral", "jergon-shushupe", "cascabel", "naca-naca",
    "raya-motoro", "raya-amazonica",
}
TIPS = {
    "protege": "Interdit : chasse, pêche, consommation et achat pour les bénévoles.",
    "bushmeat": "Gibier parfois consommé localement · ne pas demander / ne pas acheter.",
    "veda": "Fermeture saisonnière · vérifier le calendrier local avec le guide.",
}
LABEL = {
    "protege": ("protege", "PROTÉGÉ", "deck-protect--protege"),
    "bushmeat": ("bushmeat", "BUSHMEAT", "deck-protect--bushmeat"),
    "veda": ("veda", "VEDA", "deck-protect--veda"),
}

CARACHUPA = """  <!-- S11b Xénarthres · sol -->
  <section data-label="12 · Xénarthres · sol" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Cingulata</span> · terra firme</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Mammifères : xénarthres du sol</h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/carachupa-gigante.jpg" data-deck-pic-label="Carachupa gigante · Priodontes maximus" data-protection="protege" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;"><span>CARACHUPA GIGANTE · <span class="deck-sci">Priodontes maximus</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><b style="color:var(--green-forest); font-size:var(--fs-1); margin:4px 0;">30–50 kg</b><div class="xs" style="color:var(--night-2); margin-top:4px;">Plus grand tatou du monde · carapace à plaques mobiles, griffes puissantes. Creuse tunnels et termitières · indicateur de forêts intactes. Très rare et furtive à Pacaya-Samiria · CITES I / DS 004.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
"""

BATS = """  <!-- S11c Chauves-souris -->
  <section data-label="12 · Chiroptera" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Chiroptera</span> · canopée &amp; ríos</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Mammifères : chauves-souris amazoniennes</h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-protection="protege" data-deck-pic="images/especes/murcielago-pescador.jpg" data-deck-pic-label="Murciélago pescador · Noctilio leporinus" style="border-left:6px solid var(--terracotta); background:var(--cream);"><div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;"><span>MURCIÉLAGO PESCADOR · <span class="deck-sci">Noctilio leporinus</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">≈ 10–13 cm · chasse poissons et insectes à la surface des cochas et ríos par écholocalisation. Longues pattes et serres · indicateur d'eaux productives.</div></div>
        <div class="card card-in d2 deck-pic-card" data-protection="protege" data-deck-pic="images/especes/murcielago-frugivoro.jpg" data-deck-pic-label="Murciélago frugívoro · Artibeus lituratus" style="border-left:6px solid var(--terracotta); background:var(--cream);"><div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;"><span>MURCIÉLAGO FRUGÍVORO · <span class="deck-sci">Artibeus lituratus</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Grand frugivore (phyllostomidé) · disperse graines de cecropias, figuiers et palmiers. Colonne vertébrale de la régénération forestière nocturne.</div></div>
        <div class="card card-in d3 deck-pic-card" data-protection="protege" data-deck-pic="images/especes/murcielago-vampiro.jpg" data-deck-pic-label="Murciélago vampiro · Desmodus rotundus" style="border-left:6px solid var(--terracotta); background:var(--cream);"><div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;"><span>MURCIÉLAGO VAMPIRO · <span class="deck-sci">Desmodus rotundus</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Hématophage · se nourrit surtout de sang de bétail et mammifères. Rôle pathologique (rage) parfois exagéré · ne pas capturer ni manipuler. Respecter gîtes et colonies.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
"""

RAYS = """  <!-- S21b Poissons · raies -->
  <section data-label="28 · Poissons · raies" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Myliobatiformes · Potamotrygonidae</span> · ríos &amp; cochas</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Poissons des ríos &amp; cochas · raies d'eau douce <span style="font-weight:400;">· 2/4</span></h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-protection="protege" data-deck-pic="images/especes/raya-motoro.jpg" data-deck-pic-label="Raya motoro · Potamotrygon motoro" style="border-left:6px solid var(--terracotta); background:var(--cream);"><div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;"><span>RAYA MOTORO · <span class="deck-sci">Potamotrygon motoro</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><div class="xs" style="color:var(--terracotta); font-weight:700; margin-top:6px; letter-spacing:1px;">ÉPINE VENIMEUSE</div><div class="xs" style="color:var(--night-2); margin-top:4px;">Raie d'eau douce ocellée · fond sablonneux des cochas. Dard caudal à venin : douleur intense, risque d'infection. Ne jamais marcher pieds nus dans les eaux troubles · ne pas pêcher / manipuler.</div></div>
        <div class="card card-in d2 deck-pic-card" data-protection="protege" data-deck-pic="images/especes/raya-amazonica.jpg" data-deck-pic-label="Raya amazónica · Potamotrygon spp." style="border-left:6px solid var(--terracotta); background:var(--cream);"><div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;"><span>RAYA AMAZÓNICA · <span class="deck-sci">Potamotrygon spp.</span></span><span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Famille Potamotrygonidae endémique d'Amazonie · plusieurs espèces en Loreto. Toutes portent une ou plusieurs épines caudales. Benthiques, souvent enfouies · respect strict des protocoles de baignade.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
"""

REPTILES_FOUR = """  <!-- S18 Reptiles · constricteurs -->
  <section data-label="23 · Reptiles · constricteurs" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Squamata · Boidae</span> · terra firme &amp; várzea</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Reptiles : constricteurs <span style="font-weight:400;">· 1/4</span></h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/anaconda.jpg" data-deck-pic-label="Yacumama · Eunectes murinus" style="background:var(--cream);"><div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">YACUMAMA · <span class="deck-sci">Eunectes murinus</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Jusqu'à 10 m, constricteur des várzeas. Ovovivipare (20–40 jeunes) · gardien mythique des eaux.</div></div>
        <div class="card card-in d2 deck-pic-card" data-deck-pic="images/especes/boa.jpg" data-deck-pic-label="Mantona · Boa constrictor" style="background:var(--cream);"><div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">MANTONA · <span class="deck-sci">Boa constrictor</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">1,5–2 m, tous écosystèmes. Moins dépendant de l'eau · rongeurs et oiseaux.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
  <!-- S19 Reptiles · crocodiliens -->
  <section data-label="24 · Reptiles · crocodiliens" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Crocodilia · Alligatoridae</span> · ríos &amp; cochas</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Reptiles : crocodiliens <span style="font-weight:400;">· 2/4</span></h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/caiman-blanco.jpg" data-deck-pic-label="Lagarto blanco · Caiman crocodilus" style="background:var(--cream);"><div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">LAGARTO BLANCO · <span class="deck-sci">Caiman crocodilus</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Caïman à lunettes · 1,5–2,5 m, le plus courant. Crête osseuse entre les yeux (« lunettes »). Cochas, rivières · poissons et charognes. Peu agressif.</div></div>
        <div class="card card-in d2 deck-pic-card" data-deck-pic="images/especes/caiman-negro.jpg" data-deck-pic-label="Lagarto negro · Melanosuchus niger" style="background:var(--cream);"><div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">LAGARTO NEGRO · <span class="deck-sci">Melanosuchus niger</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Jusqu'à 4–5 m, apex aquatique. Peau noire, crâne massif · potamotrygons, capybaras, pécari. Menacé (surchasse historique) · en redressement à Pacaya-Samiria.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
  <!-- S20 Reptiles · serpents venimeux · vipéridés -->
  <section data-label="25 · Reptiles · serpents venimeux" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Squamata · Viperidae</span> · terra firme</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Reptiles : serpents venimeux · vipéridés <span style="font-weight:400;">· 3/4</span></h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/equis.jpg" data-deck-pic-label="Equis · Fer-de-lance · Bothrops atrox" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--terracotta); font-weight:800; letter-spacing:2px;">EQUIS · FER-DE-LANCE · <span class="deck-sci">Bothrops atrox</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Vipère piton (≈ 1,5 m), venin hémotoxique · cause majeure d'envenimations au Pérou et en Amazonie. Nocturne, camouflée dans la litière de terra firme.</div></div>
        <div class="card card-in d2 deck-pic-card" data-deck-pic="images/especes/jergon-shushupe.jpg" data-deck-pic-label="Jergón shushupe · Lachesis muta" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--terracotta); font-weight:800; letter-spacing:2px;">JERGÓN SHUSHUPE · <span class="deck-sci">Lachesis muta</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Bushmaster · plus grand vipéridé du monde (jusqu'à 3 m). Terrier / litière de forêt primaire · venin hémotoxique très volumineux. Rarement croisé, morsure redoutée.</div></div>
        <div class="card card-in d3 deck-pic-card" data-deck-pic="images/especes/cascabel.jpg" data-deck-pic-label="Cascabel · Crotalus durissus" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--terracotta); font-weight:800; letter-spacing:2px;">CASCABEL · <span class="deck-sci">Crotalus durissus</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Crotale sud-américain · sonnette caudale caractéristique. Venin neurotoxique (+ hémotoxique). Plus fréquent en marges sèches / transition amazonienne qu'en forêt inondée.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
  <!-- S21 Reptiles · serpents venimeux · élapidés -->
  <section data-label="26 · Reptiles · serpents · élapidés" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · <span class="deck-sci">Squamata · Elapidae</span> · terra firme &amp; várzea</div>
    <div class="topbar" style="background:var(--green-leaf);"></div>
    <h1 class="h" style="color:var(--green-forest);">Reptiles : serpents venimeux · élapidés <span style="font-weight:400;">· 4/4</span></h1>
    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">
      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">
        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/coral.jpg" data-deck-pic-label="Coral · Micrurus surinamensis" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--terracotta); font-weight:800; letter-spacing:2px;">CORAL · <span class="deck-sci">Micrurus surinamensis</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Coral aquatique amazonienne · bandes rouge-jaune-noir (aposématisme). Venin neurotoxique · morsure rare mais grave. Ne pas confondre avec les mimétiques (falsa coral).</div></div>
        <div class="card card-in d2 deck-pic-card" data-deck-pic="images/especes/naca-naca.jpg" data-deck-pic-label="Naca-naca · Micrurus lemniscatus" style="background:var(--cream); border-left:6px solid var(--terracotta);"><div class="xs" style="color:var(--terracotta); font-weight:800; letter-spacing:2px;">NACA-NACA · <span class="deck-sci">Micrurus lemniscatus</span></div><div class="xs" style="color:var(--night-2); margin-top:4px;">Autre coral répandue en Amazonie. Bandes plus fines · même famille neurotoxique. Nom local courant à Loreto · souvent citée avec l'equis dans les alertes villageoises.</div></div>
      </div>
      <div class="deck-pic-viewer photo-in d1" data-deck-pic-viewer style="flex:1; align-self:stretch;">
        <img class="deck-pic-viewer__img" alt="">
        <div class="deck-pic-viewer__ph">
          <span class="deck-pic-viewer__ph-icon" aria-hidden="true">🖼️</span>
          <span class="deck-pic-viewer__kind">Image de l'espèce</span>
          <span class="deck-pic-viewer__label"></span>
          <span style="font-size:12px; color:var(--night-2); opacity:0.6;">Cliquez une carte pour afficher l'espèce</span>
        </div>
      </div>
    </div>
  </section>
"""

RECAP = """  <!-- S28 Règle bénévole · protections -->
  <section data-label="38 · Règle bénévole · protections" class="deck-rule-slide" style="background:var(--green-pale); display:flex; flex-direction:column; padding:var(--pad-top) var(--pad-x) var(--pad-bottom);">
    <img src="images/LOGOAKUU.png" class="logo" alt="AKUU">
    <div class="tag" style="color:var(--green-forest);">01 · Faune · Règle AKUU</div>
    <div class="topbar" style="background:var(--terracotta);"></div>
    <h1 class="h" style="color:var(--green-forest); margin-bottom:12px;">Règle bénévole · ne pas chasser, pêcher ni consommer</h1>
    <div class="deck-rule-layout">
      <div class="deck-rule-intro card-in d1">
        <p class="lead" style="color:var(--night-2);">Les communautés natives peuvent avoir des droits de subsistance. <b>Les bénévoles AKUU</b> ne chassent pas, ne pêchent pas pour le sport, et n'achètent pas de viande de brousse.</p>
        <p class="deck-rule-refs">Référentiel le plus restrictif : Pérou DS 004-2014-MINAGRI · Guyane (arrêtés 1986 / 2011) · SERNANP (RN) · CITES.</p>
      </div>
      <div class="deck-rule-grid">
        <div class="deck-rule-card deck-rule-card--protege card-in d1">
          <div class="deck-rule-card__head">
            <p class="deck-rule-card__title">Jamais pour bénévoles</p>
            <span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span>
          </div>
          <p class="deck-rule-card__body">Bufeo, tucuxi, manatí, lobo de río · félins · primates · sachavaca, perezoso, carachupa gigante · guacamayos · rapaces &amp; cóndor de la selva · chauves-souris · lagarto negro · tortues · yacumama &amp; mantona · paujil · raies.</p>
        </div>
        <div class="deck-rule-card deck-rule-card--bushmeat card-in d2">
          <div class="deck-rule-card__head">
            <p class="deck-rule-card__title">Ne pas demander / acheter</p>
            <span class="deck-protect deck-protect--bushmeat" data-tip="Gibier parfois consommé localement · ne pas demander / ne pas acheter." title="Gibier parfois consommé localement · ne pas demander / ne pas acheter.">BUSHMEAT</span>
          </div>
          <p class="deck-rule-card__body">Sajino, majás, ronsoco, añuje · coati / mapache · lagarto blanco · doncella hors cadre légal. Gibier parfois légal pour la communauté · interdit aux bénévoles touristes.</p>
        </div>
        <div class="deck-rule-card deck-rule-card--veda card-in d3">
          <div class="deck-rule-card__head">
            <p class="deck-rule-card__title">Fermeture saisonnière</p>
            <span class="deck-protect deck-protect--veda" data-tip="Fermeture saisonnière · vérifier le calendrier local avec le guide." title="Fermeture saisonnière · vérifier le calendrier local avec le guide.">VEDA</span>
          </div>
          <p class="deck-rule-card__body">Paiche sauvage (<span class="deck-sci">Arapaima</span>) : veda PRODUCE (souvent oct.–fév.). Privilégier l'élevage si proposé. Vérifier le calendrier local avec le guide.</p>
        </div>
      </div>
      <div class="deck-rule-footer card-in d3">
        <p class="deck-rule-footer__title">En doute = non</p>
        <p class="deck-rule-footer__body">Dans une RN (Pacaya-Samiria) : suivre SERNANP et le protocole AKUU. Pas de trophées, plumes, peaux, œufs, dentition, ni plats « exotiques » de faune sauvage. Sources : DS N° 004-2014-MINAGRI · arrêtés Guyane 15/05/1986 &amp; 01/07/2011 · vedas Ministerio de la Producción.</p>
      </div>
    </div>
  </section>

"""


def apply_procyonids(html: str) -> str:
    if "mapache.jpg" in html:
        html = fix_procyonids_markup(html)
        return html
    marker = (
        'Mammifères carnivores : procyonidés <span style="font-weight:400;">· 2/2</span></h1>\n'
        '    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">\n'
        '      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">\n'
    )
    idx = html.find(marker)
    if idx < 0:
        return html
    viewer = html.find('<div class="deck-pic-viewer', idx)
    if viewer < 0:
        return html
    col_end = html.rfind("</div>", idx, viewer)
    coati_block = (
        '        <div class="card card-in d1 deck-pic-card is-active" data-deck-pic="images/especes/coati.jpg" '
        'data-deck-pic-label="Cuchucho · Nasua nasua" style="background:var(--cream);">'
        '<div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">'
        'CUCHUCHO · <span class="deck-sci">Nasua nasua</span></div>'
        '<div class="xs" style="color:var(--night-2); margin-top:4px;">'
        '3–6 kg, omnivore diurne en bandes matriarcales. Museau mobile, griffes puissantes · '
        'chasse invertébrés et fruits.</div></div>\n'
        '        <div class="card card-in d2 deck-pic-card" data-deck-pic="images/especes/mapache.jpg" '
        'data-deck-pic-label="Mapache · Procyon cancrivorus" style="background:var(--cream);">'
        '<div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">'
        'MAPACHE · <span class="deck-sci">Procyon cancrivorus</span></div>'
        '<div class="xs" style="color:var(--night-2); margin-top:4px;">'
        'Raton laveur crabier · semi-aquatique des rives et cochas. Omnivore nocturne · crabes, poissons, fruits. '
        'Patte avant très tactile.</div></div>\n'
        '        <div class="card card-in d3 deck-pic-card" data-deck-pic="images/especes/olingo.jpg" '
        'data-deck-pic-label="Olingo · Bassaricyon alleni" style="background:var(--cream);">'
        '<div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">'
        'OLINGO · <span class="deck-sci">Bassaricyon alleni</span></div>'
        '<div class="xs" style="color:var(--night-2); margin-top:4px;">'
        'Arboricole nocturne de la canopée (1–1,5 kg). Frugivore-insectivore · souvent confondu avec le kinkajou '
        '(chosna), mais sans queue préhensile.</div></div>\n'
    )
    col_start = idx + len(marker)
    html = html[:col_start] + coati_block + html[col_end:]
    print("✓ mapache + olingo")
    return html


def fix_procyonids_markup(html: str) -> str:
    """Repair coati card if mapache/olingo were inserted before its closing tag."""
    broken = (
        "chasse invertébrés et fruits.</div>\n        <div class=\"card card-in d2 deck-pic-card\""
    )
    if broken in html:
        return html
    fixed = (
        "chasse invertébrés et fruits.</div></div>\n        <div class=\"card card-in d2 deck-pic-card\""
    )
    old = (
        "chasse invertébrés et fruits.\n        <div class=\"card card-in d2 deck-pic-card\""
    )
    if old in html:
        html = html.replace(old, fixed, 1)
        html = html.replace(
            "sans queue préhensile.</div></div>\n</div>\n      </div>\n      <div class=\"deck-pic-viewer",
            "sans queue préhensile.</div></div>\n      </div>\n      <div class=\"deck-pic-viewer",
            1,
        )
        print("✓ procyonidés markup réparé")
    return html


def apply_paujil(html: str) -> str:
    if "paujil.jpg" in html:
        html = fix_paujil_markup(html)
        return html
    html = html.replace(
        '01 · Faune · <span class="deck-sci">Opisthocomiformes · Anhimidae</span> · várzea',
        '01 · Faune · <span class="deck-sci">Opisthocomiformes · Anhimidae · Cracidae</span> · várzea &amp; terra firme',
        1,
    )
    marker = (
        'Oiseaux remarquables : espèces singulières <span style="font-weight:400;">· 2/2</span></h1>\n'
        '    <div style="display:flex; gap:28px; flex:1; align-items:stretch;">\n'
        '      <div style="flex:1.15; display:flex; flex-direction:column; gap:16px; justify-content:center;">\n'
    )
    idx = html.find(marker)
    if idx < 0:
        return html
    viewer = html.find('<div class="deck-pic-viewer', idx)
    if viewer < 0:
        return html
    col_end = html.rfind("</div>", idx, viewer)
    card = (
        '        <div class="card card-in d3 deck-pic-card" data-deck-pic="images/especes/paujil.jpg" '
        'data-deck-pic-label="Paujil · Mitu tuberosum" style="background:var(--cream);">'
        '<div class="xs" style="color:var(--green-leaf); font-weight:800; letter-spacing:2px;">'
        'PAUJIL · <span class="deck-sci">Mitu tuberosum</span></div>'
        '<div class="xs" style="color:var(--night-2); margin-top:4px;">'
        'Hocco à rasoir · grand cracidé noir (≈ 83–89 cm) des forêts humides. Bec rouge à carène · '
        'gibier important, populations fragiles près des villages.</div></div>\n'
    )
    col_start = idx + len(marker)
    html = html[:col_end] + card + html[col_end:]
    print("✓ paujil")
    return html


def fix_paujil_markup(html: str) -> str:
    broken = (
        "kamichi en Amazonie).</div>\n        <div class=\"card card-in d3 deck-pic-card\""
    )
    if broken in html:
        return html
    old = (
        "kamichi en Amazonie).</div>\n        <div class=\"card card-in d3 deck-pic-card\""
    )
    # camungo missing closing card tag
    old2 = (
        "kamichi en Amazonie).</div>\n        <div class=\"card card-in d3 deck-pic-card\" data-protection"
    )
    fixed = (
        "kamichi en Amazonie).</div></div>\n        <div class=\"card card-in d3 deck-pic-card\" data-protection"
    )
    if (
        "kamichi en Amazonie).</div>\n        <div class=\"card card-in d3 deck-pic-card\" data-protection"
        in html
        and "kamichi en Amazonie).</div></div>\n        <div class=\"card card-in d3 deck-pic-card\" data-protection"
        not in html
    ):
        html = html.replace(
            "kamichi en Amazonie).</div>\n        <div class=\"card card-in d3 deck-pic-card\" data-protection",
            fixed,
            1,
        )
        html = html.replace(
            "populations fragiles près des villages.</div></div>\n</div>\n      </div>\n      <div class=\"deck-pic-viewer",
            "populations fragiles près des villages.</div></div>\n      </div>\n      <div class=\"deck-pic-viewer",
            1,
        )
        print("✓ paujil markup réparé")
    return html


def apply_reptiles(html: str) -> str:
    if "caiman-blanco.jpg" in html and "jergon-shushupe.jpg" in html:
        return html
    pat = re.compile(
        r"  <!-- S18 Reptiles -->.*?  <!-- S20 Amphibiens -->",
        re.S,
    )
    if not pat.search(html):
        return html
    html = pat.sub(REPTILES_FOUR + "\n  <!-- S20 Amphibiens -->", html, count=1)
    html = html.replace(
        '  <!-- S20 Amphibiens -->\n  <section data-label="24 · Amphibiens"',
        '  <!-- S22 Amphibiens -->\n  <section data-label="27 · Amphibiens"',
        1,
    )
    print("✓ reptiles 4 slides")
    return html


COMMENT_LABELS = [
    ("<!-- S20 Rapaces nocturnes -->", "22 · Rapaces nocturnes"),
    ("<!-- S18 Reptiles · constricteurs -->", "23 · Reptiles · constricteurs"),
    ("<!-- S19 Reptiles · crocodiliens -->", "24 · Reptiles · crocodiliens"),
    ("<!-- S20 Reptiles · serpents venimeux · vipéridés -->", "25 · Reptiles · serpents venimeux"),
    ("<!-- S21 Reptiles · serpents venimeux · élapidés -->", "26 · Reptiles · serpents · élapidés"),
    ("<!-- S22 Amphibiens -->", "27 · Amphibiens"),
    ("<!-- S21 Poissons d'eau douce -->", "28 · Poissons d'eau douce"),
    ("<!-- S21b Poissons · raies -->", "29 · Poissons · raies"),
    ("<!-- S25 Poissons · consommation locale -->", "30 · Poissons · ríos & cochas"),
    ("<!-- S26 Poissons · consommation locale (suite) -->", "31 · Poissons · ríos & cochas (suite)"),
    ("<!-- S22 Invertébrés -->", "32 · Invertébrés"),
    ("<!-- S23 Invertébrés (suite) -->", "33 · Invertébrés (suite)"),
    ("<!-- S24 Écosystèmes aquatiques · tortues -->", "34 · Écosystèmes aquatiques · tortues"),
    ("<!-- S25 Écosystèmes aquatiques · crue -->", "35 · Écosystèmes aquatiques · crue"),
    ("<!-- S26 CHAÎNES ALIMENTAIRES -->", "36 · Chaînes alimentaires"),
    ("<!-- S27 ADAPTATIONS ===== -->", "37 · Adaptations"),
    ("<!-- S28 Règle bénévole · protections -->", "38 · Règle bénévole · protections"),
]


def relabel_section(html: str, comment: str, label: str) -> str:
    pat = re.compile(re.escape(comment) + r'\s*\n\s*<section data-label="[^"]*"', re.M)
    return pat.sub(f'{comment}\n  <section data-label="{label}"', html, count=1)


def renumber_faune_tail(html: str) -> str:
    for comment, label in COMMENT_LABELS:
        html = relabel_section(html, comment, label)
    html = re.sub(
        r'(<section data-label=")(?:3[4-9]) · Partie 02 · Flore(")',
        r"\g<1>39 · Partie 02 · Flore\2",
        html,
        count=1,
    )
    return html


def level_for(stem: str) -> str | None:
    if stem in PROTEGE or stem in ADD_PROTEGE:
        return "protege"
    if stem in BUSHMEAT:
        return "bushmeat"
    if stem in VEDA:
        return "veda"
    return None


def patch_card(m: re.Match) -> str:
    open_tag, filename, inner, close = m.group(1), m.group(2), m.group(3), m.group(4)
    stem = Path(filename).stem
    lvl = level_for(stem)
    if not lvl:
        return m.group(0)
    key, label, cls = LABEL[lvl]
    tip = TIPS[key]

    if "data-protection=" not in open_tag:
        open_tag = open_tag.replace("data-deck-pic=", f'data-protection="{key}" data-deck-pic=', 1)
    else:
        open_tag = re.sub(r'data-protection="[^"]*"', f'data-protection="{key}"', open_tag)

    if key == "protege" and "border-left" not in open_tag and 'style="' in open_tag:
        open_tag = open_tag.replace('style="', 'style="border-left:6px solid var(--terracotta); ', 1)

    if f"deck-protect--{key}" in inner:
        inner = re.sub(
            r'<span class="deck-protect[^"]*"[^>]*>.*?</span>',
            f'<span class="deck-protect {cls}" data-tip="{tip}" title="{tip}">{label}</span>',
            inner,
            count=1,
            flags=re.S,
        )
        return open_tag + inner + close

    def inject_title(tm: re.Match) -> str:
        attrs, content = tm.group(1), tm.group(2)
        if "deck-protect" in content:
            return tm.group(0)
        if "display:flex" not in attrs:
            if 'style="' in attrs:
                attrs = attrs.replace(
                    'style="',
                    'style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; ',
                    1,
                )
            else:
                attrs += ' style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;"'
        if not content.startswith("<span>"):
            content = f"<span>{content}</span>"
        return (
            f'<div class="xs"{attrs}>{content}'
            f'<span class="deck-protect {cls}" data-tip="{tip}" title="{tip}">{label}</span></div>'
        )

    inner2, n = re.subn(
        r'<div class="xs"([^>]*)>(.*?)</div>',
        inject_title,
        inner,
        count=1,
        flags=re.S,
    )
    if n == 0:
        return m.group(0)
    return open_tag + inner2 + close


def convert_green_card(m: re.Match) -> str:
    tag, rest = m.group(1), m.group(2)
    if "deck-pic-card" not in tag:
        return m.group(0)
    if "background:var(--green-forest)" not in tag:
        return m.group(0)
    new_tag = tag.replace("background:var(--green-forest)", "background:var(--cream)")
    new_rest = rest.replace("color:var(--cream)", "color:var(--green-forest)")

    counter = [0]

    def fix_xs(match: re.Match) -> str:
        counter[0] += 1
        if counter[0] == 1:
            return match.group(0)
        if "deck-protect" in match.group(2):
            return match.group(0)
        o = match.group(1).replace("color:var(--green-leaf)", "color:var(--night-2)")
        return o + match.group(2) + match.group(3)

    new_rest = re.sub(r"(<div class=\"xs\"[^>]*>)(.*?)(</div>)", fix_xs, new_rest, flags=re.S)
    return new_tag + new_rest


def upgrade_condor_slide(html: str) -> str:
    """Ensure cóndor slide has badge even if inserted manually without protection attrs."""
    old = (
        'data-deck-pic="images/especes/condor-selva.jpg" data-deck-pic-label="Cóndor de la selva · Sarcoramphus papa" '
        'style="background:var(--green-forest);"><div class="xs" style="color:var(--green-leaf); font-weight:800; '
        'letter-spacing:2px;">CÓNDOR DE LA SELVA'
    )
    new = (
        'data-deck-pic="images/especes/condor-selva.jpg" data-deck-pic-label="Cóndor de la selva · Sarcoramphus papa" '
        'data-protection="protege" style="border-left:6px solid var(--terracotta); background:var(--cream);">'
        '<div class="xs" style="display:flex; align-items:center; justify-content:space-between; gap:8px; '
        'flex-wrap:wrap; color:var(--green-leaf); font-weight:800; letter-spacing:2px;">'
        '<span>CÓNDOR DE LA SELVA'
    )
    if old in html:
        html = html.replace(old, new, 1)
        html = html.replace(
            '<span>CÓNDOR DE LA SELVA · <span class="deck-sci">Sarcoramphus papa</span></div>',
            '<span>CÓNDOR DE LA SELVA · <span class="deck-sci">Sarcoramphus papa</span></span>'
            '<span class="deck-protect deck-protect--protege" data-tip="Interdit : chasse, pêche, consommation et achat pour les bénévoles." '
            'title="Interdit : chasse, pêche, consommation et achat pour les bénévoles.">PROTÉGÉ</span></div>',
            1,
        )
        html = html.replace(
            '<div class="xs" style="color:var(--green-leaf); margin-top:4px;">Vautour pape',
            '<div class="xs" style="color:var(--night-2); margin-top:4px;">Vautour pape',
            1,
        )
    return html


def main() -> None:
    html = PATH.read_text(encoding="utf-8")

    # Titres poissons (angle écologique)
    html = html.replace(
        "Poissons les plus consommés en Amazonie péruvienne <span style=\"font-weight:400;\">· 2/3</span>",
        "Poissons des ríos &amp; cochas · Characiformes &amp; Loricariidae <span style=\"font-weight:400;\">· 3/4</span>",
    )
    html = html.replace(
        "Poissons les plus consommés · espèces à forte valeur <span style=\"font-weight:400;\">· 3/3</span>",
        "Poissons des ríos &amp; cochas · Serrasalmidés &amp; Siluriformes <span style=\"font-weight:400;\">· 4/4</span>",
    )
    html = html.replace(
        "Poissons d'eau douce : espèces emblématiques <span style=\"font-weight:400;\">· 1/3</span>",
        "Poissons d'eau douce : espèces emblématiques <span style=\"font-weight:400;\">· 1/4</span>",
    )
    html = html.replace(
        'data-label="26 · Poissons · consommation locale"',
        'data-label="29 · Poissons · ríos & cochas"',
    )
    html = html.replace(
        'data-label="27 · Poissons · consommation locale (suite)"',
        'data-label="30 · Poissons · ríos & cochas (suite)"',
    )
    html = html.replace(
        "3 m, 200 kg, respire l'air. Mâle garde les jeunes · aussi consommé (réglementé), surpêche en déclin.",
        "3 m, 200 kg, respire l'air. Mâle garde les jeunes · pêche sauvage réglementée (veda saisonnière) · privilégier l'élevage. Surpêche historique.",
    )

    # Heliconius text fix
    html = html.replace(
        "10 000+ coléoptères décomposeurs en Amazonie. Coévolution fleur-pollinisateur · miel de Meliponini.",
        "Papillon néotropical · coévolution avec Passiflora, alcaloïdes défensifs. Mimétisme müllérien entre espèces · longévité jusqu'à 6 mois en canopée.",
    )

    marker_aqua = "  <!-- S12 Mammifères aquatiques · 1/2 -->"
    if "carachupa-gigante.jpg" not in html:
        html = html.replace(marker_aqua, CARACHUPA + marker_aqua, 1)
        print("✓ carachupa")
    if "murcielago-pescador.jpg" not in html:
        html = html.replace(marker_aqua, BATS + marker_aqua, 1)
        print("✓ chauves-souris")

    if "raya-motoro.jpg" not in html:
        marker = "Poissons d'eau douce : espèces emblématiques"
        idx = html.find(marker)
        if idx < 0:
            raise SystemExit("fish section not found")
        end = html.find("</section>", idx) + len("</section>")
        html = html[:end] + "\n" + RAYS + html[end:]
        print("✓ raies")

    if "Règle bénévole · protections" not in html:
        flore = "  <!-- ===== S19 TITRE PARTIE 02 · FLORE ===== -->"
        html = html.replace(flore, RECAP + flore, 1)
        html = html.replace(
            'data-label="34 · Partie 02 · Flore"',
            'data-label="39 · Partie 02 · Flore"',
            1,
        )
        html = html.replace(
            'data-label="37 · Partie 02 · Flore"',
            'data-label="39 · Partie 02 · Flore"',
            1,
        )
        print("✓ récap bénévole")

    html = upgrade_condor_slide(html)

    html = apply_procyonids(html)
    html = apply_paujil(html)
    html = fix_paujil_markup(html)
    html = apply_reptiles(html)
    html = renumber_faune_tail(html)

    html, _ = re.subn(
        r'\s*<div class="deck-protect-legend">.*?</div>\n?',
        "\n",
        html,
        flags=re.S,
    )

    card_re = re.compile(
        r'(<div class="card[^"]*deck-pic-card[^"]*"[^>]*data-deck-pic="images/especes/([^"]+?)"[^>]*>)(.*?)(</div>\s*)(?=<div class="card|<div class="deck-pic-viewer)',
        re.S,
    )
    html, n = card_re.subn(patch_card, html)
    print(f"✓ badges sur {n} cartes faune")

    card_pat = re.compile(
        r'(<div class="card[^"]*deck-pic-card[^"]*"[^>]*>)(.*?)(?=<div class="card |<div class="deck-pic-viewer)',
        re.S,
    )
    html, ng = card_pat.subn(convert_green_card, html)
    print(f"✓ cartes cream: {ng} traitées")

    html = re.sub(
        r"(deck-pic-card[^>]*style=\"[^\"]*)background:var\(--green-forest\)",
        r"\1background:var(--cream)",
        html,
    )

    PATH.write_text(html, encoding="utf-8")
    print(f"DONE → {PATH}")


if __name__ == "__main__":
    main()
