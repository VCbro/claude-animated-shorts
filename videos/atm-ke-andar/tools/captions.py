#!/usr/bin/env python3
"""Captions from Whisper word timings (voice/whisper.json) with the script's correct spellings
-> out/captions.json (overlay) and deliver/atm_ke_andar_hi.srt."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIX = {"खीञ": "खींच", "पहुशता": "पहुँचता", "हां": "हाँ", "चोटे": "छोटे", "वैकॉम": "वैक्यूम", "जाच": "जाँच",
       "पकड": "पकड़", "सेकिंड": "सेकंड"}
segs = json.load(open(os.path.join(ROOT, "voice/whisper.json")))
words = []
for s in segs:
    ws = s["words"]; i = 0
    while i < len(ws):
        w = ws[i]["w"]
        if w == "चिप" and i + 1 < len(ws) and ws[i + 1]["w"] == "के" and "नोट" in s["text"] and "दो" in s["text"]:
            words.append(dict(w="चिपके", t=ws[i]["t0"], end=ws[i + 1]["t1"], seg=id(s))); i += 2; continue
        if w.startswith("-") and words: words[-1]["w"] += w; words[-1]["end"] = ws[i]["t1"]; i += 1; continue
        words.append(dict(w=FIX.get(w, w), t=ws[i]["t0"], end=ws[i]["t1"], seg=id(s))); i += 1
# chunks: per segment (and punctuation), balanced parts of <= 4 words
chunks = []
groups, cur = [], []
for k, w in enumerate(words):
    cur.append(w)
    if k == len(words) - 1 or words[k + 1]["seg"] != w["seg"] or w["w"][-1] in ",?।":
        groups.append(cur); cur = []
for g in groups:
    n = len(g); parts = -(-n // 4); size = -(-n // parts)
    chunks += [g[i:i + size] for i in range(0, n, size)]
out = []
for i, c in enumerate(chunks):
    t0 = max(0.0, c[0]["t"] - 0.05)
    nxt = chunks[i + 1][0]["t"] - 0.05 if i + 1 < len(chunks) else c[-1]["end"] + 0.6
    t1 = min(nxt, c[-1]["end"] + 0.6)
    out.append(dict(t0=round(t0, 3), t1=round(t1, 3), words=[dict(w=w["w"].rstrip(",।"), t=w["t"]) for w in c]))
os.makedirs(os.path.join(ROOT, "out"), exist_ok=True); os.makedirs(os.path.join(ROOT, "deliver"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "out/captions.json"), "w"), ensure_ascii=False, indent=0)
def ts(x): return f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)) % 1000:03d}"
with open(os.path.join(ROOT, "deliver/atm_ke_andar_hi.srt"), "w") as f:
    for i, c in enumerate(out, 1):
        f.write(f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print(len(out), "chunks")
