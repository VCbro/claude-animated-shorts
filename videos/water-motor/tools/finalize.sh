#!/usr/bin/env bash
# Mux the silent 60 fps render with the mix, loudness-normalise to -14 LUFS, and pull QA frames.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -i out/video_silent.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart out/water_motor_short.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact out/water_motor_short.mp4
mkdir -p out/qa
for t in 1 6 12 18 24 30 36 42 46 52 55; do ffmpeg -y -loglevel error -ss $t -i out/water_motor_short.mp4 -frames:v 1 out/qa/f$t.png; done
echo done
