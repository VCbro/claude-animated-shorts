#!/bin/bash
# Render both films as PNG frames, then encode each to a silent x264 master (the audio is muxed by tools/finalize.sh).
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH" VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json
for L in ${@:-en hi}; do
  rm -rf out/frames-$L
  date; echo "render $L"
  raea render compositions/film.tsx --composition engine-$L -o out/frames-$L/ 2>&1 | grep -E 'APPLIED|error|REFUSED|raea render: [0-9]'
  ffmpeg -y -loglevel error -framerate 30 -i out/frames-$L/frame-%05d.png -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -movflags +faststart out/picture-$L.mp4
  echo "encoded $L"; date
done
