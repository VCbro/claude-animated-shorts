#!/bin/bash
# concat chunks + mux mix.wav -> $FINAL, then QA (black / freeze / loudness)
set -e
cd "$(dirname "$0")/.."; OUT=${OUT:-out/chunks}; FINAL=${FINAL:-out/final.mp4}
for r in 0-329 330-659 660-989 990-1319 1320-1649 1650-1979 1980-2309 2310-2639; do echo "file '$PWD/$OUT/c_$r.mp4'"; done > $OUT/list.txt
cat $OUT/list.txt
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i $OUT/list.txt -i audio/mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart $FINAL
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of compact $FINAL
echo "--- QA"
ffmpeg -hide_banner -i $FINAL -vf "blackdetect=d=0.1:pix_th=0.06,freezedetect=n=0.002:d=0.5" -af ebur128 -f null - 2>&1 | grep -E "black_start|freeze_start|freeze_duration|I:" | grep -v "t: " | head -40
