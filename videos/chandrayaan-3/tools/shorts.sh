#!/usr/bin/env bash
# Cut 9:16 Shorts (1080x1920, 60 fps) from the finished 16:9 film:
# the film sits in the middle at full width over a blurred, darkened copy of itself,
# with a hook title above. Run after tools/finalize.sh.
#   bash tools/shorts.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=deliver/chandrayaan_3.mp4
FONT=$(fc-match -f '%{file}' 'Baloo 2:bold' 2>/dev/null || true)
mk() { # name start end "title line 1" "title line 2"
  local name=$1 ss=$2 to=$3 t1=$4 t2=$5
  local TT=$(mktemp)
  python3 - "$t1" "$t2" "$TT.png" <<'PY'
import sys, os
from playwright.sync_api import sync_playwright
t1, t2, out = sys.argv[1:4]
root = os.path.abspath("node_modules/@fontsource/baloo-2/files")
html = f"""<style>@font-face{{font-family:B;font-weight:800;src:url(file://{root}/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F}}
@font-face{{font-family:B;font-weight:800;src:url(file://{root}/baloo-2-latin-800-normal.woff2);unicode-range:U+0000-00FF}}
body{{margin:0;width:1080px;height:1920px;background:transparent;font-family:B}}
.t{{position:absolute;top:250px;left:0;right:0;text-align:center;color:#fff;font-weight:800;font-size:92px;line-height:1.15;text-shadow:0 6px 30px rgba(0,0,0,.7)}}
.t b{{color:#ffd166}}</style><div class=t>{t1}<br><b>{t2}</b></div>"""
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
    hp = out + ".html"; open(hp, "w").write("<meta charset=utf-8>" + html)
    p = b.new_page(viewport={"width": 1080, "height": 1920}); p.goto("file://" + hp); p.evaluate("document.fonts.ready.then(()=>1)"); p.wait_for_timeout(300)
    p.screenshot(path=out, omit_background=True); b.close()
PY
  ffmpeg -y -loglevel error -ss "$ss" -to "$to" -i "$SRC" -i "$TT.png" -filter_complex \
    "[0:v]split[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=30:2,eq=brightness=-0.25[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2+80[v1];[v1][1:v]overlay=0:0,format=yuv420p[v]" \
    -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 18 -r 60 -c:a aac -b:a 192k -movflags +faststart "deliver/short_${name}.mp4"
  rm -f "$TT" "$TT.png"
  echo "deliver/short_${name}.mp4"
}
mk landing 1:25.6 2:11.3 "बिना पैराशूट" "चाँद पर कैसे उतरा?"
mk route   0:38.5 1:05.5 "चंद्रयान-3 सीधा" "चाँद क्यों नहीं गया?"
mk pole    2:44.4 3:07.0 "चाँद के साउथ पोल पर" "क्या छिपा है?"
