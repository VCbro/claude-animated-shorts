#!/usr/bin/env bash
# slow each source shot to its narration length (motion-interpolated 60fps, 1080x1920)
cd "$(dirname "$0")/.."
shot(){ n=$1; a=$2; b=$3; d=$4; f=$(python3 -c "print($d/($b-$a)+0.01)")
  ffmpeg -v error -y -ss $a -to $b -i src/clip.mp4 -vf "setpts=$f*PTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1080:1920:flags=lanczos,unsharp=5:5:0.5,trim=duration=$d,setpts=PTS-STARTPTS" -an -c:v libx264 -crf 14 -preset fast out/shot$n.mp4 && echo "shot$n ok"; }
shot 0 0.12 3.25 4.52 & shot 1 3.70 6.48 6.52 & shot 2 6.62 9.60 3.02 & shot 3 9.76 12.95 6.92 & wait
shot 4 13.12 16.30 6.04 & shot 5 16.48 19.65 6.68 & shot 6 19.82 23.00 7.58 & shot 7 23.18 26.00 5.82 & wait
echo SHOTSDONE
