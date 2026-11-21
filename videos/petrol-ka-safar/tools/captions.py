#!/usr/bin/env python3
"""Caption chunks (<= 4 words or up to punctuation, two short lines at most) from voice/lines.json
-> out/captions.json (for the overlay) and deliver/petrol_ka_safar_hi.srt."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = json.load(open(os.path.join(ROOT, "voice/lines.json")))
chunks = []
for l in VO["lines"]:
    # phrases end at punctuation; long phrases are split into balanced parts of <= 5 words
    ph, cur = [], []
    for w in l["words"]:
        cur.append(w)
        if re.search(r"[,?।.]$", w["w"]): ph.append(cur); cur = []
    if cur: ph.append(cur)
    for p in ph:
        n = len(p); parts = max(1, -(-n // 5))
        if len(" ".join(x["w"] for x in p)) > 30 and parts == 1 and n > 2: parts = 2
        size = -(-n // parts)
        for k in range(0, n, size):
            chunks.append(dict(words=p[k:k + size], line=l["id"], end=l["end"]))
for i, c in enumerate(chunks):
    c["t0"] = round(c["words"][0]["t"] - 0.06, 3)
    nxt = chunks[i + 1] if i + 1 < len(chunks) else None
    c["t1"] = round(nxt["words"][0]["t"] - 0.08 if nxt and nxt["line"] == c["line"] else c["end"] + 0.25, 3)
    c["words"] = [dict(w=w["w"].rstrip(",।.") if not w["w"].endswith("?") else w["w"], t=w["t"]) for w in c["words"]]
os.makedirs(os.path.join(ROOT, "out"), exist_ok=True)
json.dump(chunks, open(os.path.join(ROOT, "out/captions.json"), "w"), ensure_ascii=False, indent=0)


def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"


os.makedirs(os.path.join(ROOT, "deliver"), exist_ok=True)
with open(os.path.join(ROOT, "deliver/petrol_ka_safar_hi.srt"), "w") as f:
    for i, c in enumerate(chunks, 1):
        f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print(len(chunks), "caption chunks")
