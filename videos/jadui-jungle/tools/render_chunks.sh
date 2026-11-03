#!/bin/bash
# render the film in 8 chunks; skip chunks that already exist.
# COMP=JaduiJungleShorts OUT=out/chunks_v bash tools/render_chunks.sh   (defaults: JaduiJungle, out/chunks)
cd "$(dirname "$0")/.."; OUT=${OUT:-out/chunks}; export COMP=${COMP:-JaduiJungle}; mkdir -p "$OUT"
for r in 0-329 330-659 660-989 990-1319 1320-1649 1650-1979 1980-2309 2310-2639; do
  f=$OUT/c_${r}.mp4
  [ -s "$f" ] && continue
  rm -f "$f.tmp.mp4"
  node tools/render.mjs "$f.tmp.mp4" "$r" 1 > "$OUT/log_${r}.txt" 2>&1 && mv "$f.tmp.mp4" "$f"
  echo "$COMP chunk $r done $(date +%T)"
done
echo "ALLDONE $COMP"
