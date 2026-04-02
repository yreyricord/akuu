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
for f in mission-akuu.jpg who-akuu.jpg casa-akuu.jpg cours-anglais.jpg ecotourisme.jpg sensibilisation.jpg musee-description.jpg; do
  resize_image "$IMG_DIR/$f" 800 "SECTION"
done

echo ""
echo "--- Gallery images (max 800px wide) ---"
for f in "$IMG_DIR"/galerie-musee-*.jpg; do
  resize_image "$f" 800 "GALLERY"
done

echo ""
echo "--- Projet highlight (max 1200px wide) ---"
resize_image "$IMG_DIR/projet-highlight.jpg" 1200 "HIGHLIGHT"

echo ""
echo "--- Portrait photos (max 600px wide) ---"
for f in Yoann_PM.jpg marlon.jpg; do
  resize_image "$IMG_DIR/$f" 600 "PORTRAIT"
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
