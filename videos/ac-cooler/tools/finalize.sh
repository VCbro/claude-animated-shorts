#!/bin/bash
# join chunks + mux audio/mix.wav -> out/ac-cooler-kaise-kaam-karte-hain.mp4, then QA (black / freeze / loudness)
set -e
cd "$(dirname "$0")/.."
OUT=out/ac-cooler-kaise-kaam-karte-hain.mp4
ls out/chunks/c_*.mp4 | sort -t_ -k2 -n | sed "s#^#file '$PWD/#; s#\$#'#" > out/chunks/list.txt
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i out/chunks/list.txt -i audio/mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of compact "$OUT"
echo "--- QA"
ffmpeg -hide_banner -i "$OUT" -vf "blackdetect=d=0.1:pix_th=0.04,freezedetect=n=0.001:d=0.6" -af ebur128=peak=true -f null - 2>&1 | grep -E "black_start|freeze_start|freeze_duration|I:|Peak:" | tail -20
