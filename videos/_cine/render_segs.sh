#!/bin/bash
# usage: render_segs.sh <project dir> <total seconds>   (resumable: skips finished segments)
cd "$1"; TOTAL=$2; mkdir -p out/seg
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome CHROME_ARGS="--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader"
N=$(python3 -c "import math;print(math.ceil($TOTAL/9))")
for i in $(seq 0 $((N-1))); do
  f=$((i*9)); to=$(python3 -c "print(min($TOTAL,($i+1)*9))")
  out=out/seg/s$i.mp4; [ -f $out.done ] && continue
  node render.mjs --video --jpg --n=${NSUB:-3} ${RSC:+--rs=$RSC} ${FPSV:+--fps=$FPSV} --crf=15 --from=$f --to=$to --out=$out >> out/render.log 2>&1 && touch $out.done
done
echo ALLDONE >> out/render.log
