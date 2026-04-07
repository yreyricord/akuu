#!/bin/bash
# AKUU Image Optimization Script
# Uses sips (native macOS) to resize and compress all images
# Run: chmod +x optimize-images.sh && ./optimize-images.sh

set -e

IMG_DIR="public/images"

echo "=== AKUU Image Optimization ==="
echo ""

resize_image() {
  local file="$1"
  local max_width="$2"
  local label="$3"

  if [ ! -f "$file" ]; then
    echo "  SKIP (not found): $file"
    return
  fi

  local current_width
  current_width=$(sips -g pixelWidth "$file" 2>/dev/null | tail -1 | awk '{print $2}')

  if [ -z "$current_width" ]; then
    echo "  SKIP (cannot read): $file"
    return
  fi

  if [ "$current_width" -gt "$max_width" ]; then
    local size_before
    size_before=$(ls -lh "$file" | awk '{print $5}')
    sips --resampleWidth "$max_width" "$file" --out "$file" >/dev/null 2>&1
    local size_after
    size_after=$(ls -lh "$file" | awk '{print $5}')
    echo "  OK $label: $file ($size_before -> $size_after, resized to ${max_width}px)"
  else
    echo "  OK $label: $file (already ${current_width}px wide, no resize needed)"
  fi
}

echo "--- Hero images (max 1920px wide) ---"
for f in "$IMG_DIR"/hero-*.jpg; do
  resize_image "$f" 1920 "HERO"
done

echo ""
echo "--- Section images (max 800px wide) ---"
for f in mission-akuu.jpg who-akuu.jpg casa-akuu.jpg cours-anglais.jpg sensibilisation.jpg; do
  resize_image "$IMG_DIR/$f" 800 "SECTION"
done

echo ""
echo "--- Gallery musée (max 800px wide) ---"
for f in "$IMG_DIR"/musee/galerie-musee-*.jpg "$IMG_DIR"/musee/galerie-musee-*.JPG; do
  [ -e "$f" ] || continue
  resize_image "$f" 800 "GALLERY"
done

echo ""
echo "--- Projet highlight (max 1200px wide) ---"
resize_image "$IMG_DIR/projet-highlight.jpg" 1200 "HIGHLIGHT"

echo ""
echo "--- Musée : plan croquis (max 2000px wide ; ne pas redimensionner coupe_final.png : coordonnées SVG fixes) ---"
resize_image "$IMG_DIR/musee/musee_1.jpg" 2000 "MUSEE_PLAN"

echo ""
echo "--- Cours d'anglais (illustrations page, max 1600px) ---"
for f in "$IMG_DIR"/anglais/20180612-P1000124.jpg "$IMG_DIR"/anglais/20180612-P1000129.jpg "$IMG_DIR"/anglais/20180612-P1000136.jpg "$IMG_DIR"/anglais/20180612-P1000156.jpg "$IMG_DIR"/anglais/20180612-P1000175.jpg; do
  resize_image "$f" 1600 "ANGLAIS"
done

echo ""
echo "--- HYDR'AMA (page projet, max 1920px) ---"
for f in "$IMG_DIR"/hydrama/hydrama-*.jpg; do
  [ -e "$f" ] || continue
  resize_image "$f" 1920 "HYDRAMA"
done

echo ""
echo "--- Frise association / Histoire (max 1600px wide) ---"
if [ -d "$IMG_DIR/Histoire" ]; then
  while IFS= read -r -d '' f; do
    resize_image "$f" 1600 "HISTOIRE"
  done < <(find "$IMG_DIR/Histoire" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -print0 2>/dev/null)
fi

echo ""
echo "--- Projet Musée Shapishiko / carte projets (max 1200px) ---"
if [ -d "$IMG_DIR/projets/shapishiko" ]; then
  while IFS= read -r -d '' f; do
    resize_image "$f" 1200 "PROJET_SHAP"
  done < <(find "$IMG_DIR/projets/shapishiko" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0 2>/dev/null)
fi

echo ""
echo "--- Équipe (max 1200px) ---"
if [ -d "$IMG_DIR/equipe" ]; then
  while IFS= read -r -d '' f; do
    resize_image "$f" 1200 "EQUIPE"
  done < <(find "$IMG_DIR/equipe" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0 2>/dev/null)
fi

echo ""
echo "--- Musée : autres JPEG (contexte, équipe chantier, rendus ; max 1600px) ---"
for f in "$IMG_DIR"/musee/musee_context.jpg "$IMG_DIR"/musee/equipe.jpg "$IMG_DIR"/musee/rendu-2.jpg "$IMG_DIR"/musee/rendu-3.jpg; do
  [ -e "$f" ] || continue
  resize_image "$f" 1600 "MUSEE_EXTRA"
done

echo ""
echo "=== Done! ==="
echo ""

# Show final summary
echo "--- Final sizes ---"
for f in $(find "$IMG_DIR" -name "*.jpg" -o -name "*.jpeg" | sort); do
  size=$(ls -lh "$f" | awk '{print $5}')
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | grep pixel | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
  printf "  %-45s %8s  %s\n" "$f" "$size" "$dims"
done
