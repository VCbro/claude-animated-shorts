#!/bin/bash
# part.sh <chunkdir> <range a-b> <outname> : mux one rendered chunk with its slice of audio/mix.wav
cd "$(dirname "$0")/.."; a=${2%-*}; b=${2#*-}
ss=$(python3 -c "print($a/30)"); du=$(python3 -c "print(($b-$a+1)/30)")
ffmpeg -v error -y -i "$1/c_$2.mp4" -ss $ss -t $du -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "/home/user/claude-animated-shorts/jadui-jungle-output/$3" && ls -la "/home/user/claude-animated-shorts/jadui-jungle-output/$3"
