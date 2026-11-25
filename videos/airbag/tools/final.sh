#!/usr/bin/env bash
cd "$(dirname "$0")/.."
S="(18*exp(-(t-4.52)*7)*gte(t,4.52)+12*exp(-(t-17.3)*6)*gte(t,17.3)+6*exp(-(t-24.3)*4)*gte(t,24.3)+18*exp(-(t-27.02)*7)*gte(t,27.02))"
printf "file 'shot%s.mp4'\n" 0 1 2 3 4 5 6 7 > out/list.txt
ffmpeg -v error -y -i out/shot4.mp4 -t 3.9 -c:v libx264 -crf 14 -preset fast out/shot8.mp4
echo "file 'shot8.mp4'" >> out/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/list.txt -i out/mix.wav -filter_complex \
 "[0:v]fps=60,crop=w=1040:h=1849:x='20+$S*sin(t*90)':y='35+$S*cos(t*77)',scale=1080:1920:flags=lanczos,\
eq=brightness=0.35:enable='between(t,4.52,4.60)+between(t,27.02,27.10)+between(t,17.3,17.36)',\
ass=out/captions.ass,fade=t=out:st=50.4:d=0.6,format=yuv420p[v];[1:a]loudnorm=I=-14:TP=-1.0:LRA=11[a]" \
 -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 17 -maxrate 14M -bufsize 28M -r 60 -c:a aac -b:a 256k -ar 48000 \
 -movflags +faststart -t 51.0 deliver/airbag_en.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact deliver/airbag_en.mp4
ls -la deliver/airbag_en.mp4; echo FINALDONE
