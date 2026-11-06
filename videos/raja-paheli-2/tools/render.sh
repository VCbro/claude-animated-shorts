#!/bin/bash
# Full pipeline after the script is approved:  voice → cues → sound → render → QA.
#   bash tools/render.sh            (all steps)     SKIP_VOICE=1 bash tools/render.sh   (keep voice)
#   SCALE=1.3333 for 1440x2560 (2K) instead of 1080x1920.
set -e; cd "$(dirname "$0")/.."
[ -z "$SKIP_VOICE" ] && python3 tools/voice.py
node tools/cues.mjs > /dev/null
python3 tools/audio.py
mkdir -p out
npx remotion render src/index.ts Short out/final.mp4 --codec h264 --crf 17 --pixel-format yuv420p \
  --audio-codec aac --audio-bitrate 256k --concurrency ${CONC:-3} --scale ${SCALE:-1} --gl swangle --log error
bash tools/qa.sh out/final.mp4
