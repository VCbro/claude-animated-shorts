#!/bin/bash
# render the film in chunks (concurrency 2); skip chunks already done
cd "$(dirname "$0")/.."; mkdir -p out/chunks
for r in 0-321 322-643 644-965 966-1289; do
  f=out/chunks/c_${r}.mp4
  [ -s "$f" ] && continue
  node tools/render.mjs "$f.tmp.mp4" "$r" 2 > out/chunks/log_${r}.txt 2>&1 && mv "$f.tmp.mp4" "$f" || echo "chunk $r FAILED"
  echo "chunk $r done $(date +%T)"
done
echo ALLDONE
