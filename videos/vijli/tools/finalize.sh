#!/usr/bin/env bash
# Frames (out/frames, 60 fps) + soundtrack -> deliver/vijli.mp4 (1920x1080, H.264, AAC, -14 LUFS)
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -y -loglevel error -framerate 30 -i out/frames/f%05d.jpg -i audio/mix.wav \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 30 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 deliver/vijli.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact deliver/vijli.mp4
