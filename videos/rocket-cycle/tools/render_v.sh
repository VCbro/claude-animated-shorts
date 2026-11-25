#!/usr/bin/env bash
# vertical 1080x1920 frames at 60 fps with 3 parallel headless browsers (resumable)
cd "$(dirname "$0")/.."
N=$(python3 -c "import json;print(int(json.load(open('out/anchors.json'))['END']*60))"); third=$(( (N+2)/3 ))
for w in 0 1 2; do a=$((w*third)); b=$(( a+third < N ? a+third : N ))
  VIEW=1080x1920 PORT=$((9130+w)) python3 tools/capture.py frames --fps 60 --from $a --to $b > out/cap_$w.log 2>&1 &
done; wait; echo FRAMESDONE
