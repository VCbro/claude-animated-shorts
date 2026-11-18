#!/bin/bash
# Mux each silent picture master with its mix, then check it with raea.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"
for L in ${@:-en hi}; do
  ffmpeg -y -loglevel error -i out/picture-$L.mp4 -i out/mix-$L.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/bike-engine-$L.mp4
  raea check out/bike-engine-$L.mp4 --shape 9:16 --platform shorts 2>&1 | grep -v '^ok' | tail -8
done
