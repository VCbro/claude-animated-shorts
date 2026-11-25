#!/usr/bin/env python3
"""Align a recorded Hindi voice to the 12 script lines without speech-to-text: split the audio at
pauses (ffmpeg silencedetect), then choose line boundaries by dynamic programming so each line's
spoken share matches its share of syllables. Prints the result for checking; writes nothing."""
import re, subprocess, sys, json
F = sys.argv[1]
out = subprocess.run(["ffmpeg", "-hide_banner", "-i", F, "-af", "silencedetect=noise=-38dB:d=0.22", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", F], capture_output=True, text=True).stdout)
# speech segments
segs, t = [], 0.0
for a, b in zip(st, en):
    if a - t > 0.05: segs.append((t, a))
    t = b
if dur - t > 0.1: segs.append((t, dur))
LINES = [l.split("] ", 1)[1] for l in open(sys.argv[2], encoding="utf-8").read().splitlines() if l.startswith("[")]
def syl(s):  # consonant/vowel letters, not matras or virama
    return len(re.findall(r"[अ-हक़-य़]", s))
w = [syl(l) for l in LINES]; W = sum(w)
n, L = len(segs), len(LINES)
sp = [b - a for a, b in segs]; S = sum(sp)
INF = 1e9
best = [[INF] * (n + 1) for _ in range(L + 1)]; arg = [[0] * (n + 1) for _ in range(L + 1)]
best[0][0] = 0
for i in range(1, L + 1):
    for j in range(i, n + 1):
        for k in range(i - 1, j):
            if best[i - 1][k] >= INF: continue
            share = sum(sp[k:j]) / S
            c = best[i - 1][k] + (share - w[i - 1] / W) ** 2 * 1000
            if c < best[i][j]: best[i][j], arg[i][j] = c, k
j = n; cuts = []
for i in range(L, 0, -1):
    k = arg[i][j]; cuts.append((k, j)); j = k
cuts.reverse()
res = []
for (k, j), text in zip(cuts, LINES):
    a, b = segs[k][0], segs[j - 1][1]
    res.append({"start": round(a, 3), "end": round(b, 3), "segs": [[round(x, 3), round(y, 3)] for x, y in segs[k:j]], "text": text})
    print(f"{a:6.2f}-{b:6.2f}  {j-k} seg  exp {w[len(res)-1]/W*S:5.2f}s got {sum(sp[k:j]):5.2f}s  {text}")
json.dump(res, open(sys.argv[3], "w"), ensure_ascii=False, indent=1) if len(sys.argv) > 3 else None
