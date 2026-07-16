#!/usr/bin/env python3
"""
Télécharge les images manquantes du Module 4 (flore + compléments faune).

Sources :
  1. Zoobioparque Amaru (raw/ déjà présent) — copie vers especes/
  2. Wikimedia Commons — recherche par nom scientifique / vernaculaire

Usage:
  python3 scripts/fetch-deck-images.py
  python3 scripts/fetch-deck-images.py --only flora
  python3 scripts/fetch-deck-images.py --only flora --missing-only
  python3 scripts/fetch-deck-images.py --only flora --force
"""

from __future__ import annotations

import argparse
import json
import shutil
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
M4 = ROOT / "public/formation/module-4-deck/images"
AMARU_RAW = M4 / "zoobioparque-amaru/raw"
ESPECES = M4 / "especes"
FLORES = M4 / "flores"
UA = "AKUU-Formation/1.0 (educational; contact: formation@akuu.org)"
DELAY = 1.2

# Copie Amaru → especes (fichier raw relatif → nom deck)
AMARU_COPIES: dict[str, str] = {
    "reptiles/85-tortuga-motelo.jpg": "motelo.jpg",
    "aves/39-garza-tigre-castaña.jpg": "garza-tigre.jpg",
    "aves/21-gallareta-purpura.jpg": "gallareta-purpura.jpg",
    "reptiles/111-equis-tigre.jpg": "equis.jpg",
    "aves/15-caracara-curiquingue.jpg": "caracara-curiquingue.jpg",
    "aves/16-aguila-pechinegra.jpg": "aguila-pechinegra.jpg",
    "aves/17-gavilan-de-cola-corta.jpg": "gavilan-cola-corta.jpg",
    "aves/35-buho-de-anteojos.jpg": "buho-anteojos.jpg",
    "aves/36-buho-estigio.jpg": "buho-estigio.jpg",
    "aves/10-buho-listado.jpg": "buho-listado.jpg",
}

# Wikimedia : requête → (dossier, fichier)
WIKI_FAUNA: list[tuple[str, str, str]] = [
    ("Porphyrio martinicus purple gallinule amazon", "especes", "tuqui-tuqui.jpg"),
    ("Ardea alba great egret", "especes", "garza-blanca.jpg"),
    ("Ardea cocoi cocoi heron", "especes", "garza-cocoi.jpg"),
    ("Cochlearius cochlearius boat-billed heron", "especes", "garza-cuervo.jpg"),
    ("Agamia agami heron", "especes", "garza-agami.jpg"),
    ("Paraponera clavata bullet ant", "especes", "hormiga-bala.jpg"),
    ("Avicularia avicularia pinktoe tarantula", "especes", "tarántula-pollito.jpg"),
    ("Micrurus surinamensis coral snake", "especes", "coral.jpg"),
    ("Opisthocomus hoazin hoatzin Peru", "especes", "hoatzin.jpg"),
    ("Anhima cornuta horned screamer Peru", "especes", "camungo.jpg"),
    ("Busarellus nigricollis black collared hawk", "especes", "mama-vieja.jpg"),
    ("Rupornis magnirostris roadside hawk", "especes", "gavilan-pollero.jpg"),
    ("Harpia harpyja harpy eagle", "especes", "aguila-harpia.jpg"),
    ("Sotalia fluviatilis tucuxi dolphin", "especes", "tucuxi.jpg"),
    ("Prochilodus nigricans boquichico fish", "especes", "boquichico.jpg"),
    ("Mylossoma duriventre palometa fish", "especes", "palometa.jpg"),
    ("Pterygoplichthys pardalis sailfin catfish", "especes", "carachama.jpg"),
    ("Colossoma macropomum tambaqui gamitana", "especes", "gamitana.jpg"),
    ("Piaractus brachypomus red pacu", "especes", "paco.jpg"),
    ("Pseudoplatystoma fasciatum tiger catfish", "especes", "doncella.jpg"),
]

WIKI_FLORA: list[tuple[str, str, str]] = [
    # Arbres
    ("Ceiba pentandra kapok tree", "flores", "lupuna.jpg"),
    ("Bertholletia excelsa Brazil nut tree", "flores", "castana.jpg"),
    ("Hevea brasiliensis rubber tree latex", "flores", "shiringa.jpg"),
    ("Cecropia peltata tree", "flores", "cecropia.jpg"),
    ("Ochroma pyramidale balsa tree", "flores", "balsa.jpg"),
    ("Calycophyllum spruceanum capirona", "flores", "capirona.jpg"),
    ("Dipteryx odorata tonka tree", "flores", "shihuahuaco.jpg"),
    ("Swietenia macrophylla mahogany tree", "flores", "caoba.jpg"),
    ("Handroanthus chrysanthus yellow ipê", "flores", "lapacho.jpg"),
    ("Hura crepitans sandbox tree", "flores", "catahua.jpg"),
    ("Amburana cearensis", "flores", "ishpingo.jpg"),
    ("Eschweilera coriacea", "flores", "machimango.jpg"),
    # Palmiers
    ("Euterpe oleracea açaí palm fruit", "flores", "acai.jpg"),
    ("Bactris gasipaes peach palm", "flores", "pijuayo.jpg"),
    ("Mauritia flexuosa aguaje fruit", "flores", "aguaje.jpg"),
    ("Socratea exorrhiza walking palm", "flores", "palma-caminante.jpg"),
    ("Phytelephas macrocarpa tagua ivory palm", "flores", "yarina.jpg"),
    ("Astrocaryum chambira palm", "flores", "huicungo.jpg"),
    ("Oenocarpus bataua", "flores", "ungurahui.jpg"),
    # Médicinales & rituel
    ("Uncaria tomentosa cat's claw vine", "flores", "una-de-gato.jpg"),
    ("Croton lechleri sangre de grado", "flores", "sangre-de-grado.jpg"),
    ("Dracontium loretense jergon sacha", "flores", "jergon-sacha.jpg"),
    ("Maytenus macrocarpa chuchuhuasi", "flores", "chuchuhuasi.jpg"),
    ("Ptychopetalum olacoides muira puama", "flores", "muira-puama.jpg"),
    ("Mansoa alliacea garlic vine", "flores", "ajo-sacha.jpg"),
    ("Nicotiana rustica tobacco plant", "flores", "tabaco.jpg"),
    # Psychoactives
    ("Banisteriopsis caapi vine", "flores", "ayahuasca.jpg"),
    ("Psychotria viridis chacruna", "flores", "chacruna.jpg"),
    ("Anadenanthera colubrina yopo seeds", "flores", "yopo.jpg"),
    ("Echinopsis pachanoi San Pedro cactus", "flores", "huachuma.jpg"),
    ("Phyllomedusa bicolor giant leaf frog", "flores", "kambo.jpg"),
    # Alimentaires amazoniens
    ("Myrciaria dubia camu camu fruit", "flores", "camu-camu.jpg"),
    ("Solanum sessiliflorum cocona fruit", "flores", "cocona.jpg"),
    ("Theobroma grandiflorum cupuaçu fruit", "flores", "cupuacu.jpg"),
    ("Theobroma cacao fruit pod", "flores", "cacao.jpg"),
    ("Paullinia cupana guarana fruit", "flores", "guarana.jpg"),
    ("Manihot esculenta cassava yuca", "flores", "yuca.jpg"),
    ("Inga edulis ice cream bean", "flores", "inga.jpg"),
    ("Lonchocarpus urucu barbasco", "flores", "barbasco.jpg"),
    ("Victoria amazonica water lily", "flores", "victoria-amazonica.jpg"),
]

# Seuil : en dessous, on considère un placeholder à remplacer
PLACEHOLDER_MAX_BYTES = 80_000


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode())


def wiki_search_url(query: str) -> str | None:
    time.sleep(DELAY)
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 3,
            "prop": "imageinfo",
            "iiprop": "url",
        }
    )
    try:
        data = fetch_json(f"https://commons.wikimedia.org/w/api.php?{params}")
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            time.sleep(8)
            data = fetch_json(f"https://commons.wikimedia.org/w/api.php?{params}")
        else:
            raise
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        url = info.get("url")
        if url:
            return url
    return None


def download(url: str, dest: Path, *, overwrite: bool = False) -> bool:
    if dest.exists() and dest.stat().st_size > PLACEHOLDER_MAX_BYTES and not overwrite:
        print(f"  · {dest.name} (présent)")
        return True
    time.sleep(DELAY)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            dest.write_bytes(resp.read())
    except urllib.error.HTTPError as exc:
        print(f"  ✗ {dest.name}: HTTP {exc.code}")
        return False
    if dest.stat().st_size < 1000:
        dest.unlink(missing_ok=True)
        print(f"  ✗ {dest.name}: fichier trop petit")
        return False
    print(f"  ✓ {dest.name} ({dest.stat().st_size // 1024} ko)")
    return True


def copy_amaru() -> list[str]:
    errors: list[str] = []
    for rel, name in AMARU_COPIES.items():
        src = AMARU_RAW / rel
        dest = ESPECES / name
        if not src.exists():
            errors.append(f"Amaru manquant: {rel}")
            continue
        if not dest.exists() or dest.stat().st_size == 0:
            shutil.copy2(src, dest)
            print(f"  ✓ {name} ← Amaru")
        else:
            print(f"  · {name}")
    return errors


def fetch_wiki(entries: list[tuple[str, str, str]], *, force: bool = False) -> list[str]:
    errors: list[str] = []
    for query, folder, filename in entries:
        base = ESPECES if folder == "especes" else FLORES
        dest = base / filename
        # Aussi accepter .webp / .avif déjà présents sous le même stem
        stem_hits = list(base.glob(f"{Path(filename).stem}.*"))
        existing = dest if dest.exists() else (stem_hits[0] if stem_hits else None)
        base.mkdir(parents=True, exist_ok=True)
        if existing and not force:
            size = existing.stat().st_size
            if size > PLACEHOLDER_MAX_BYTES:
                print(f"  · {existing.name} ({size // 1024} ko)")
                continue
            print(f"  ↪ {existing.name} — placeholder ({size // 1024} ko), recherche Wikimedia…")
        url = wiki_search_url(query)
        if not url:
            errors.append(f"Wikimedia introuvable: {query} → {filename}")
            print(f"  ? {filename} — pas de résultat pour « {query} »")
            continue
        # Forcer l'extension selon l'URL
        ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or ".jpg"
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            ext = ".jpg"
        final = base / f"{Path(filename).stem}{ext}"
        overwrite = force
        if existing and existing.exists() and existing.stat().st_size <= PLACEHOLDER_MAX_BYTES:
            overwrite = True
        if existing and existing != final and existing.exists():
            existing.unlink(missing_ok=True)
        if not download(url, final, overwrite=overwrite):
            errors.append(f"Échec téléchargement: {filename}")
    return errors


def write_manifest(errors: list[str]) -> None:
    manifest = {
        "sources": [
            "Zoobioparque Amaru (faune)",
            "Wikimedia Commons (flore + compléments)",
            "iNaturalist — voir README pour extension future",
        ],
        "especes_dir": str(ESPECES.relative_to(ROOT)),
        "flores_dir": str(FLORES.relative_to(ROOT)),
        "errors": errors,
        "retry": "python3 scripts/fetch-deck-images.py",
    }
    out = M4 / "image-manifest.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nManifest → {out}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Télécharge images Module 4 depuis Wikimedia Commons")
    parser.add_argument("--only", choices=("flora", "fauna", "all"), default="all")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Retélécharge même si un fichier volumineux existe déjà",
    )
    parser.add_argument(
        "--missing-only",
        action="store_true",
        help="Flore : ne traite que les fichiers absents ou placeholders (< 80 ko)",
    )
    args = parser.parse_args()
    ESPECES.mkdir(parents=True, exist_ok=True)
    FLORES.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []

    if args.only in ("fauna", "all"):
        print("\n[fauna] Copie Amaru")
        errors.extend(copy_amaru())
        print("\n[fauna] Wikimedia")
        errors.extend(fetch_wiki(WIKI_FAUNA, force=args.force))

    if args.only in ("flora", "all"):
        print("\n[flora] Wikimedia")
        flora = WIKI_FLORA
        if args.missing_only and not args.force:
            filtered: list[tuple[str, str, str]] = []
            for query, folder, filename in flora:
                base = FLORES
                stem = Path(filename).stem
                hits = list(base.glob(f"{stem}.*"))
                if not hits or hits[0].stat().st_size <= PLACEHOLDER_MAX_BYTES:
                    filtered.append((query, folder, filename))
            flora = filtered
            print(f"  → {len(flora)} fichier(s) manquant(s) / placeholder(s)")
        errors.extend(fetch_wiki(flora, force=args.force))

    write_manifest(errors)
    print(f"\nTerminé — {len(errors)} erreur(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
