#!/usr/bin/env bash
# 4K60 render in chunks so the disk never holds more than one chunk of JPEGs:
# capture a chunk with 3 parallel headless browsers -> encode it to HEVC -> delete its frames.
# Resumable: finished chunks (out/chunks/cNNN.mp4) are skipped.
set -euo pipefail
cd "$(dirname "$0")/.."
FPS=60; CH=1800
END=$(python3 -c "import json;print(json.load(open('out/anchors.json'))['END'])")
N=$(python3 -c "print(int($END*$FPS))")
mkdir -p out/chunks
for ((s=0; s<N; s+=CH)); do
  e=$(( s+CH < N ? s+CH : N )); c=$(printf "out/chunks/c%03d.mp4" $((s/CH)))
  [ -f "$c" ] && continue
  rm -rf out/frames; mkdir -p out/frames
  third=$(( (e-s+2)/3 ))
  for w in 0 1 2; do a=$((s+w*third)); b=$(( a+third < e ? a+third : e ))
    PORT=$((8810+w)) python3 tools/capture.py frames --fps $FPS --dpr 2 --q 92 --from $a --to $b > out/cap_$w.log 2>&1 &
  done
  wait
  ffmpeg -v error -y -framerate $FPS -start_number $s -i out/frames/f%05d.jpg -frames:v $((e-s)) \
    -c:v libx265 -preset medium -crf 20 -pix_fmt yuv420p -tag:v hvc1 -x265-params log-level=error "$c.tmp.mp4"
  mv "$c.tmp.mp4" "$c"; rm -rf out/frames
  echo "chunk $((s/CH)) done ($e/$N)"
done
echo ALLDONE
