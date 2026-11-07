#!/bin/sh
# One command: voice -> check -> events -> frames -> mix -> master -> subtitles.  Needs the Lemo-Opuscar library (LIB).
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
cd "$LIB"
[ -f "$HERE/voices/v10.wav" ] || "$PY" core/tts/tts.py "$HERE/tts/lines.json" "$HERE/voices"
"$PY" core/tts/asr_check.py "$HERE/tts/lines.json" "$HERE/voices"
node core/render/events.mjs "$HERE" --size 1080x1920
node core/render/readcheck.mjs "$HERE" --size 1080x1920
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
"$PY" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/real-tattoo.mp4" 24 1
node -e "const s=require('fs').readFileSync('$HERE/main.js','utf8'),re=/\['(v\d\d)', ([\d.]+), ([\d.]+), ['\"](.*?)['\"]\]/g;let m,c=[];while((m=re.exec(s)))c.push({t0:+m[2]-.15,t1:+m[2]+ +m[3]+.45,text:m[4]});require('fs').writeFileSync('$HERE/out/srt_cues.json',JSON.stringify(c))"
"$PY" core/render/srt.py "$HERE/out/srt_cues.json" "$HERE/real-tattoo.srt"
ffmpeg -hide_banner -loglevel error -y -ss 36.9 -i "$HERE/real-tattoo.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
