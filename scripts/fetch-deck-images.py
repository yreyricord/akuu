#!/usr/bin/env python3
"""
Télécharge les images manquantes du Module 4 (flore + compléments faune).

Sources :
  1. Zoobioparque Amaru (raw/ déjà présent) — copie vers especes/
  2. Wikimedia Commons — recherche par nom scientifique / vernaculaire

Usage:
  python3 scripts/fetch-deck-images.py
  python3 scripts/fetch-deck-images.py --only flora
  python3 scripts/fetch-deck-images.py --only fauna
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
    ("Swietenia macrophylla mahogany tree", "flores", "caoba.jpg"),
    ("Handroanthus impetiginosus ipê tree", "flores", "lapacho.jpg"),
    ("Euterpe oleracea açaí palm fruit", "flores", "acai.jpg"),
    ("Bactris gasipaes peach palm", "flores", "pijuayo.jpg"),
    ("Mauritia flexuosa aguaje", "flores", "aguaje.jpg"),
    ("Uncaria tomentosa cat's claw vine", "flores", "una-de-gato.jpg"),
    ("Croton lechleri sangre de grado", "flores", "sangre-de-grado.jpg"),
    ("Banisteriopsis caapi vine", "flores", "ayahuasca.jpg"),
    ("Psychotria viridis chacruna", "flores", "chacruna.jpg"),
    ("Phyllomedusa bicolor giant leaf frog", "flores", "kambo.jpg"),
    ("Theobroma cacao fruit", "flores", "cacao.jpg"),
    ("Paullinia cupana guarana", "flores", "guarana.jpg"),
    ("Cecropia peltata tree", "flores", "cecropia.jpg"),
    ("Victoria amazonica water lily", "flores", "victoria-amazonica.jpg"),
    ("Dracontium peruvianum jergon sacha", "flores", "jergon-sacha.jpg"),
]


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


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 5000:
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
    print(f"  ✓ {dest.name}")
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


def fetch_wiki(entries: list[tuple[str, str, str]]) -> list[str]:
    errors: list[str] = []
    for query, folder, filename in entries:
        base = ESPECES if folder == "especes" else FLORES
        dest = base / filename
        base.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest.stat().st_size > 5000:
            print(f"  · {filename}")
            continue
        url = wiki_search_url(query)
        if not url:
            errors.append(f"Wikimedia introuvable: {query} → {filename}")
            print(f"  ? {filename} — pas de résultat pour « {query} »")
            continue
        if not download(url, dest):
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
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=("flora", "fauna", "all"), default="all")
    args = parser.parse_args()
    ESPECES.mkdir(parents=True, exist_ok=True)
    FLORES.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []

    if args.only in ("fauna", "all"):
        print("\n[fauna] Copie Amaru")
        errors.extend(copy_amaru())
        print("\n[fauna] Wikimedia (garzas, tuqui tuqui)")
        errors.extend(fetch_wiki(WIKI_FAUNA))

    if args.only in ("flora", "all"):
        print("\n[flora] Wikimedia")
        errors.extend(fetch_wiki(WIKI_FLORA))

    write_manifest(errors)
    print(f"\nTerminé — {len(errors)} erreur(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
