#!/bin/bash
cd /home/user/claude-animated-shorts/videos/manjhi
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome CHROME_ARGS="--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader"
for i in $(seq 0 7); do
  f=$(echo "$i*9" | bc); to=$(echo "($i+1)*9" | bc); [ $i -eq 7 ] && to=72.5
  out=out/seg/s$i.mp4; [ -f $out.done ] && continue
  node render.mjs --video --jpg --n=3 --crf=15 --from=$f --to=$to --out=$out >> out/render.log 2>&1 && touch $out.done
done
echo ALLDONE >> out/render.log
