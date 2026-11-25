#!/usr/bin/env bash
# 1080p60 frames with 3 parallel headless browsers (resumable), then H.264 under ~450 MB.
set -euo pipefail
cd "$(dirname "$0")/.."
FPS=60
END=$(python3 -c "import json;print(json.load(open('out/anchors.json'))['END'])")
N=$(python3 -c "print(int($END*$FPS))"); mkdir -p out/frames
third=$(( (N+2)/3 ))
for w in 0 1 2; do a=$((w*third)); b=$(( a+third < N ? a+third : N ))
  PORT=$((8860+w)) python3 tools/capture.py frames --fps $FPS --from $a --to $b > out/cap_$w.log 2>&1 &
done
wait
ffmpeg -y -loglevel error -framerate $FPS -i out/frames/f%05d.jpg -i audio/mix.wav \
  -c:v libx264 -preset slow -crf 18 -maxrate 12M -bufsize 24M -profile:v high -pix_fmt yuv420p -r $FPS \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 deliver/vikrant_en.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact deliver/vikrant_en.mp4
ls -la deliver/vikrant_en.mp4; echo ALLDONE
