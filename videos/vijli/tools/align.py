#!/usr/bin/env python3
"""Give every word of the script (deliver/script_hi.txt) a time, by aligning it to Whisper's words
(voice/whisper.json, patched with re-transcribed gaps). Writes out/words.json, out/captions.json,
out/anchors.json and deliver/vijli_hi.srt."""
import json, os, re, difflib, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
import subprocess, glob
DUR = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", P("voice/voice.mp3")],
                           capture_output=True, text=True).stdout)

# ---------------------------------------------------------------- whisper words, with gap patches
main = [dict(w=w["w"], t0=w["t0"], t1=w["t1"]) for s in json.load(open(P("voice/whisper.json"))) for w in s["words"]]
# optional patches: voice/patch_*.json = {"from": t0, "to": t1, "words": [{w, t0, t1}, ...]} replace that span
REPL = [(d["from"], d["to"], d["words"]) for d in (json.load(open(f)) for f in sorted(glob.glob(P("voice/patch_*.json"))))]
hyp = []
for w in main:
    if any(a <= w["t0"] < b for a, b, _ in REPL): continue
    hyp.append(w)
for _, _, ws in REPL: hyp += ws
hyp.sort(key=lambda w: w["t0"])


def norm(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[़]", "", s)                     # nukta
    s = s.replace("ँ", "ं")                  # chandrabindu -> anusvara
    s = re.sub(r"[^ऀ-ॿA-Za-z0-9]", "", s)
    s = s.replace("\u0964", "").replace("\u0965", "")
    return s


script = open(P("deliver/script_hi.txt")).read()
SW = []
for line in script.split("\n"):
    for tok in line.split():
        SW.append(tok)
sn = [norm(w) for w in SW]
hn = [norm(w["w"]) for w in hyp]

# ---------------------------------------------------------------- Needleman-Wunsch with fuzzy word similarity
n, m = len(sn), len(hn)
G = -0.45
score = [[0.0] * (m + 1) for _ in range(n + 1)]
back = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1): score[i][0] = i * G; back[i][0] = 1
for j in range(1, m + 1): score[0][j] = j * G; back[0][j] = 2
for i in range(1, n + 1):
    for j in range(1, m + 1):
        sim = difflib.SequenceMatcher(None, sn[i - 1], hn[j - 1]).ratio() if sn[i - 1] and hn[j - 1] else 0
        d = score[i - 1][j - 1] + (sim * 2 - 0.8)
        u = score[i - 1][j] + G; l = score[i][j - 1] + G
        if d >= u and d >= l: score[i][j] = d; back[i][j] = 0
        elif u >= l: score[i][j] = u; back[i][j] = 1
        else: score[i][j] = l; back[i][j] = 2
i, j = n, m; match = {}
while i > 0 or j > 0:
    b = back[i][j]
    if i > 0 and j > 0 and b == 0:
        sim = difflib.SequenceMatcher(None, sn[i - 1], hn[j - 1]).ratio()
        if sim >= 0.34: match[i - 1] = j - 1
        i -= 1; j -= 1
    elif i > 0 and (j == 0 or b == 1): i -= 1
    else: j -= 1

T = [None] * n; E = [None] * n
for i, j in match.items(): T[i] = hyp[j]["t0"]; E[i] = hyp[j]["t1"]
# interpolate unmatched words by character length between matched neighbours
k = 0
while k < n:
    if T[k] is not None: k += 1; continue
    a = k - 1; b = k
    while b < n and T[b] is None: b += 1
    ta = E[a] if a >= 0 else 0.0; tb = T[b] if b < n else DUR
    lens = [max(1, len(sn[q])) for q in range(k, b)]; tot = sum(lens) + 0.0; acc = 0
    for q in range(k, b):
        T[q] = ta + (tb - ta) * acc / tot; acc += lens[q - k]; E[q] = ta + (tb - ta) * acc / tot
    k = b
for q in range(n - 1):  # monotonic
    if T[q + 1] < T[q]: T[q + 1] = T[q] + 0.05
# ---------------------------------------------------------------- film-time warp: pauses for the mukhda and a storm interlude
def idx_of(phrase, after_i=0):
    ph = [norm(x) for x in phrase.split()]
    for q in range(after_i, n - len(ph) + 1):
        if sn[q:q + len(ph)] == ph: return q
    raise SystemExit("warp phrase not found: " + phrase)
i_never = idx_of("वैतरणा बंबई नहीं पहुँची।") + 3
i_again = idx_of("अब मुखड़ा एक बार फिर सुनिए।") + 5
PAUSES = [dict(name="intro", voice_t=0.0, dur=8.0), dict(name="storm", voice_t=E[i_never] + 0.25, dur=11.0),
          dict(name="mukhda2", voice_t=E[i_again] + 0.2, dur=8.0)]
def warp(x):
    return x + sum(p["dur"] for p in PAUSES if x >= p["voice_t"] - 1e-6)
T = [warp(x) for x in T]; E = [warp(x) for x in E]
OUTRO = 34.0
FILM_END = warp(DUR) + OUTRO
for p in PAUSES: p["film_t"] = round(warp(p["voice_t"]) - p["dur"], 3)
json.dump(dict(pauses=PAUSES, voice_dur=DUR, film_end=FILM_END, outro_t=round(warp(DUR) + 0.8, 3)), open(P("out/pauses.json"), "w"), indent=1)
words = [dict(w=SW[q], t=round(T[q], 3), end=round(E[q], 3)) for q in range(n)]
os.makedirs(P("out"), exist_ok=True)
json.dump(words, open(P("out/words.json"), "w"), ensure_ascii=False, indent=0)
print("script words", n, "matched", len(match))

# ---------------------------------------------------------------- anchors
def find(phrase, after=0.0):
    ph = [norm(x) for x in phrase.split()]
    for q in range(n - len(ph) + 1):
        if T[q] >= after - 0.01 and sn[q:q + len(ph)] == ph: return T[q]
    raise SystemExit("anchor not found: " + phrase)

# anchors.txt: one "name | phrase from the script" per line, in story order ('#' comments allowed).
# Each phrase is searched after the previous anchor; names starting with "~" are searched from the start.
AN = []
for ln in open(P("anchors.txt")):
    ln = ln.split("#")[0].strip()
    if ln: nm, ph = [x.strip() for x in ln.split("|", 1)]; AN.append((nm, ph))
K = {}; last = 0.0
for name, ph in AN:
    free = name.startswith("~"); name = name.lstrip("~")
    K[name] = round(find(ph, 0.0 if free else last), 3)
    if not free: last = K[name] - 0.01
K["END"] = round(FILM_END, 2)
for p in PAUSES: K["pause_" + p["name"]] = p["film_t"]
K["outro"] = round(warp(DUR) + 0.8, 3); K["CAP_END"] = K["outro"]
json.dump(K, open(P("out/anchors.json"), "w"), ensure_ascii=False, indent=1)
print(K)

# ---------------------------------------------------------------- captions: per sentence, balanced chunks of <= 6 words
sent, cur = [], []
for q, w in enumerate(words):
    cur.append(w)
    if re.search(r"[।?…,]$", w["w"]) or q == n - 1: sent.append(cur); cur = []
caps = []
for s in sent:
    L = len(s); parts = -(-L // 6); size = -(-L // parts)
    for k in range(0, L, size):
        c = s[k:k + size]; caps.append(c)
out = []
for q, c in enumerate(caps):
    t0 = c[0]["t"] - 0.05
    t1 = min(caps[q + 1][0]["t"] - 0.05 if q + 1 < len(caps) else c[-1]["end"] + 0.8, c[-1]["end"] + 0.8)
    out.append(dict(t0=round(t0, 3), t1=round(t1, 3), words=[dict(w=w["w"].rstrip(",।"), t=w["t"]) for w in c]))
json.dump(out, open(P("out/captions.json"), "w"), ensure_ascii=False, indent=0)
ts = lambda x: f"{int(x // 3600):02d}:{int(x % 3600 // 60):02d}:{int(x % 60):02d},{int(round((x % 1) * 1000)) % 1000:03d}"
with open(P("deliver/vijli_hi.srt"), "w") as f:
    for q, c in enumerate(out, 1):
        f.write(f"{q}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print(len(out), "captions")
