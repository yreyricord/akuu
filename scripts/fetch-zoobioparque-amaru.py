#!/usr/bin/env python3
"""
Télécharge les images du Zoobioparque Amaru (Cuenca, Équateur)
depuis les pages mammifères, reptiles, amphibiens et oiseaux.

Usage:
  python3 scripts/fetch-zoobioparque-amaru.py
  python3 scripts/fetch-zoobioparque-amaru.py --dry-run
  python3 scripts/fetch-zoobioparque-amaru.py --only mamiferos,aves
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from html import unescape
from pathlib import Path

BASE = "https://www.zoobioparqueamaru.com/nuestros-animales"
USER_AGENT = "AKUU-Formation/1.0 (educational deck image research; contact: formation@akuu.org)"

CATEGORIES = {
    "mamiferos": f"{BASE}/mamiferos/",
    "reptiles": f"{BASE}/reptiles/",
    "anfibios": f"{BASE}/anfibios/",
    "aves": f"{BASE}/aves/",
}

# Espèces attendues par le deck Module 4 (galerie cliquable + placeholders)
DECK_TARGETS = {
    "sachavaca": ["tapir", "sacha vaca", "danta", "tapirus"],
    "sajino": ["pecari", "pécari", "collar", "tajacu", "jabali"],
    "ronsoco": ["capibara", "capybara", "hydrochoerus"],
    "anuje": ["agouti", "guatusa", "dasyprocta", "añuje", "anuje"],
    "majas": ["paca", "guanta", "cuniculus"],
    "lobo-de-rio": ["lobo de rio", "nutria gigante", "loutre", "pteronura"],
    "coto": ["chorongo", "aullador", "howler", "alouatta"],
    "maquisapa": ["mono araña", "mono arana", "spider", "ateles"],
    "huapo-pichico": ["saki", "tamarin", "chichico", "capuchino", "huapo", "pichico"],
    "M4-03-jaguar": ["jaguar", "otorongo", "panthera onca"],
    "M4-04-boto": ["delfin", "dauphin", "bufeo", "inia"],
    "M4-05-manati": ["manati", "manatí", "lamantin", "trichechus"],
    "M4-06-anaconda-caiman": ["anaconda", "caiman", "caimán", "cocodrilo"],
    "M4-07-dendrobate": ["dendrobate", "rana venenosa", "poison dart", "dendrobat"],
    "M4-08-morpho-hormiga": ["morpho", "mariposa", "hormiga", "atta", "fourmi"],
}

# Mots-clés indiquant une espèce amazonienne / orientale équatorienne
AMAZON_KEYWORDS = re.compile(
    r"amazon|amazón|orient|oriente|napo|tropica|várzea|varzea|"
    r"selva|fluvial|rio|río|pantanal|humid|tropical|lowland|"
    r"geoffrensis|terrestris|hydrochoerus|ateles|alouatta|"
    r"anaconda|eunectes|caiman|caimán|boaconstrictor|"
    r"inia|trichechus inunguis|pteronura|panthera onca|"
    r"dendrobat|atelopus|phyllobates|morpho|ara |guacamay|"
    r"harpy|arpía|arpia|pirarucu|arapaima|piranha|piraña",
    re.I,
)

# Espèces non amazoniennes évidentes sur le site (Andes, côte, exotiques)
NON_AMAZON_HINTS = re.compile(
    r"andino|andina|paramo|páramo|paramo|africano|africa|"
    r"llama|vicun|guayaquil|austro|simons|cuenca(?!.*amazon)",
    re.I,
)


@dataclass
class AnimalRecord:
    id: str
    slug: str
    grupo: str
    nombre: str
    nombre_cientifico: str
    page_url: str
    image_url: str
    image_file: str
    amazon_candidate: bool
    deck_matches: list[str]


def fetch(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def download(url: str, dest: Path, timeout: int = 60) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        dest.write_bytes(resp.read())


def parse_listing(html: str) -> list[tuple[str, str, str]]:
    """Return list of (id, slug, grupo) from listing page."""
    pattern = re.compile(
        r'animal\.php\?Id_Animal=(\d+)-([^"&]+)&Grupo=(mamiferos|reptiles|anfibios|aves)',
        re.I,
    )
    seen: set[str] = set()
    out: list[tuple[str, str, str]] = []
    for m in pattern.finditer(html):
        key = m.group(1)
        if key in seen:
            continue
        seen.add(key)
        slug = re.sub(r"\s+", "-", unescape(m.group(2)).strip())
        out.append((m.group(1), slug, m.group(3).lower()))
    return out


def parse_animal_page(html: str, grupo: str) -> tuple[str, str, str | None]:
    title_m = re.search(r"<h1[^>]*>\s*([^<]+?)\s*</h1>", html, re.I | re.S)
    nombre = unescape(title_m.group(1).strip()) if title_m else ""

    sci_m = re.search(
        r"Nombre cient[ií]fico:\s*([^.<]+?)(?:\.|<)",
        html,
        re.I | re.S,
    )
    nombre_cientifico = unescape(sci_m.group(1).strip()) if sci_m else ""

    img_m = re.search(
        rf'<img\s+src="{grupo}/(\d+-zoo-cuenca\.jpg)"',
        html,
        re.I,
    )
    if img_m:
        rel = f"{grupo}/{img_m.group(1)}"
        return nombre, nombre_cientifico, f"{BASE}/{rel}"

    og_m = re.search(r'property="og:image"\s+content="([^"]+)"', html, re.I)
    if og_m:
        return nombre, nombre_cientifico, og_m.group(1)

    return nombre, nombre_cientifico, None


def score_amazon(nombre: str, nombre_cientifico: str, html: str) -> bool:
    blob = f"{nombre} {nombre_cientifico} {html[:8000]}"
    if NON_AMAZON_HINTS.search(blob) and not AMAZON_KEYWORDS.search(blob):
        return False
    if AMAZON_KEYWORDS.search(blob):
        return True
    # Habitat Amazonía mentionné dans le corps
    if re.search(r"Amazon[ií]a|bosques h[uú]medos tropicales|tierra firme|várzea|varzea", blob, re.I):
        return True
    return False


def match_deck_targets(nombre: str, nombre_cientifico: str, slug: str) -> list[str]:
    blob = f"{nombre} {nombre_cientifico} {slug}".lower()
    matches: list[str] = []
    for target, keywords in DECK_TARGETS.items():
        if any(kw.lower() in blob for kw in keywords):
            matches.append(target)
    return matches


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "public/formation/module-4-deck/images/zoobioparque-amaru",
        help="Dossier de sortie",
    )
    parser.add_argument("--dry-run", action="store_true", help="Ne pas télécharger")
    parser.add_argument(
        "--only",
        type=str,
        default="",
        help="Catégories séparées par virgule (mamiferos,reptiles,...)",
    )
    parser.add_argument("--delay", type=float, default=0.4, help="Pause entre requêtes (s)")
    args = parser.parse_args()

    out_dir: Path = args.out
    raw_dir = out_dir / "raw"
    only = {c.strip() for c in args.only.split(",") if c.strip()} or set(CATEGORIES)

    records: list[AnimalRecord] = []
    errors: list[dict] = []

    for grupo, list_url in CATEGORIES.items():
        if grupo not in only:
            continue
        print(f"\n[{grupo}] Listing {list_url}")
        try:
            listing_html = fetch(list_url)
        except urllib.error.URLError as exc:
            print(f"  ERREUR listing: {exc}", file=sys.stderr)
            errors.append({"grupo": grupo, "stage": "listing", "error": str(exc)})
            continue

        animals = parse_listing(listing_html)
        print(f"  {len(animals)} espèces trouvées")

        grupo_dir = raw_dir / grupo
        if not args.dry_run:
            grupo_dir.mkdir(parents=True, exist_ok=True)

        for animal_id, slug, g in animals:
            page_url = (
                f"{BASE}/animal.php?"
                f"Id_Animal={animal_id}-{urllib.parse.quote(slug, safe='-:')}&Grupo={g}"
            )
            time.sleep(args.delay)
            try:
                page_html = fetch(page_url)
            except urllib.error.URLError as exc:
                errors.append({"id": animal_id, "slug": slug, "url": page_url, "error": str(exc)})
                print(f"  skip {animal_id}-{slug}: {exc}")
                continue

            nombre, nombre_cientifico, image_url = parse_animal_page(page_html, g)
            if not image_url:
                errors.append({"id": animal_id, "slug": slug, "url": page_url, "error": "no image"})
                print(f"  skip {animal_id}-{slug}: pas d'image")
                continue

            ext = Path(urllib.parse.urlparse(image_url).path).suffix or ".jpg"
            filename = f"{animal_id}-{slug}{ext}"
            rel_file = f"raw/{g}/{filename}"
            dest = out_dir / rel_file

            if not args.dry_run:
                if not dest.exists() or dest.stat().st_size == 0:
                    try:
                        download(image_url, dest)
                        print(f"  ✓ {filename}")
                    except urllib.error.URLError as exc:
                        errors.append({"id": animal_id, "file": str(dest), "error": str(exc)})
                        print(f"  ✗ {filename}: {exc}")
                        continue
                else:
                    print(f"  · {filename} (déjà présent)")

            amazon = score_amazon(nombre, nombre_cientifico, page_html)
            deck_matches = match_deck_targets(nombre, nombre_cientifico, slug)

            records.append(
                AnimalRecord(
                    id=animal_id,
                    slug=slug,
                    grupo=g,
                    nombre=nombre,
                    nombre_cientifico=nombre_cientifico,
                    page_url=page_url,
                    image_url=image_url,
                    image_file=rel_file,
                    amazon_candidate=amazon,
                    deck_matches=deck_matches,
                )
            )

    # Manifest
    manifest = {
        "source": "Zoobioparque Amaru · Cuenca, Équateur",
        "source_urls": list(CATEGORIES.values()),
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total": len(records),
        "amazon_candidates": sum(1 for r in records if r.amazon_candidate),
        "deck_targets": DECK_TARGETS,
        "animals": [asdict(r) for r in records],
        "errors": errors,
        "deck_mapping_suggestions": build_mapping_suggestions(records),
        "amazon_extras_suggestions": build_amazon_extras(records),
    }

    if not args.dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)
        manifest_path = out_dir / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nManifest → {manifest_path}")

    print(f"\nRésumé: {len(records)} images, {manifest['amazon_candidates']} candidates amazonie")
    if errors:
        print(f"Erreurs: {len(errors)}")
    return 0 if not errors else 1


def build_mapping_suggestions(records: list[AnimalRecord]) -> dict[str, list[dict]]:
    """Pour chaque cible du deck, liste les images candidates."""
    out: dict[str, list[dict]] = {k: [] for k in DECK_TARGETS}
    for r in records:
        for target in r.deck_matches:
            out.setdefault(target, []).append(
                {
                    "id": r.id,
                    "nombre": r.nombre,
                    "image_file": r.image_file,
                    "page_url": r.page_url,
                }
            )
    return out


def build_amazon_extras(records: list[AnimalRecord]) -> list[dict]:
    """Animaux amazoniens sur le site sans correspondance deck directe."""
    extras = []
    for r in records:
        if not r.amazon_candidate:
            continue
        if r.deck_matches:
            continue
        extras.append(
            {
                "id": r.id,
                "grupo": r.grupo,
                "nombre": r.nombre,
                "nombre_cientifico": r.nombre_cientifico,
                "image_file": r.image_file,
                "page_url": r.page_url,
            }
        )
    return extras


if __name__ == "__main__":
    raise SystemExit(main())
