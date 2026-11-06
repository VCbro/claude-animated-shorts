#!/bin/bash
# QA: format, black/frozen frames, loudness (target -14 LUFS, peak ≤ -1 dBTP), contact sheet every 2 s.
f=${1:-out/final.mp4}; d=$(dirname $f)
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact $f
ffmpeg -hide_banner -nostats -i $f -vf "blackdetect=d=0.15:pix_th=0.03,freezedetect=n=0.0005:d=1.0" -af ebur128=peak=true -f null - 2>&1 \
  | grep -E "black_start|freeze_start|freeze_duration|^\s+I:|^\s+Peak:" 
ffmpeg -v error -y -i $f -vf "fps=1/2,scale=216:-1,tile=6x4" -frames:v 1 $d/qa_sheet.jpg && echo "sheet: $d/qa_sheet.jpg"
