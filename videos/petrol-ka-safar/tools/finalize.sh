#!/usr/bin/env bash
# Compose the final film: Cycles frames (upscaled to 1080x1920) + shaped Hindi overlay + mix.
#   bash tools/finalize.sh              -> deliver/petrol_ka_safar.mp4   (from out/frames, every frame)
#   STEP=3 SRC=out/animatic bash tools/finalize.sh animatic  -> out/animatic.mp4 (10 fps preview)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${SRC:-out/frames}"; STEP="${STEP:-1}"; MODE="${1:-final}"
DUR=$(awk "BEGIN{printf \"%.6f\", $STEP/30}")
LIST=$(mktemp); OLIST=$(mktemp)
N=$(ls out/overlay | wc -l)
for ((f=0; f<N; f+=STEP)); do printf "file '%s/%s/f%05d.jpg'\nduration %s\n" "$PWD" "$SRC" $f "$DUR" >> $LIST; done
for ((f=0; f<N; f+=STEP)); do printf "file '%s/out/overlay/o%05d.png'\nduration %s\n" "$PWD" $f "$DUR" >> $OLIST; done
OUT=deliver/petrol_ka_safar.mp4; [ "$MODE" = animatic ] && OUT=out/animatic.mp4
ffmpeg -y -loglevel error -f concat -safe 0 -i $LIST -f concat -safe 0 -i $OLIST -i audio/mix.wav \
  -filter_complex "[0:v]scale=1080:1920:flags=lanczos,unsharp=5:5:0.45:5:5:0,fps=30,format=rgba[b];[1:v]fps=30,format=rgba[o];[b][o]overlay=0:0:shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 2:a -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -r 30 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 $OUT
rm -f $LIST $OLIST
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt:format=duration -of compact $OUT
echo done $OUT
