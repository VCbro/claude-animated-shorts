#!/usr/bin/env python3
"""Give every word of the script (deliver/script_hi.txt) a time, by aligning it to Whisper's words
(voice/whisper.json, patched with re-transcribed gaps). Writes out/words.json, out/captions.json,
out/anchors.json and deliver/rail_ka_jadu_hi.srt."""
import json, os, re, difflib, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
DUR = 247.72

# ---------------------------------------------------------------- whisper words, with gap patches
main = [dict(w=w["w"], t0=w["t0"], t1=w["t1"]) for s in json.load(open(P("voice/whisper.json"))) for w in s["words"]]
gap = json.load(open(P("voice/gapwords.json")))
probe = json.load(open(P("voice/probewords.json")))
REPL = [(16.55, 30.3, [w for w in gap if 16.5 <= w["t0"] < 30.3]),
        (38.25, 44.0, [w for w in gap if 38.2 <= w["t0"] < 44.6]),
        (97.85, 115.8, [w for w in probe if w["t0"] < 115.8])]
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

AN = [("h_5000", "पाँच हज़ार"), ("h_steer", "स्टीयरिंग, न गियर"), ("h_gear", "गियर, न क्लच"), ("h_clutch", "क्लच।"), ("h_run", "सैकड़ों"),
      ("h_turn", "मोड़ पर मुड़ती"), ("h_track", "पटरी बदलती"), ("h_stop", "और सही जगह"), ("h_how", "आख़िर कैसे?"), ("h_go", "चलिए,"),
      ("p0", "बिजली कहाँ से"), ("p_wire", "एक तार चलता"), ("p_25k", "पच्चीस हज़ार वोल्ट की"), ("p_panto", "इंजन की छत"), ("p_zig", "और ये तार सीधा"),
      ("p_return", "बिजली तार से इंजन"), ("p_but", "लेकिन पच्चीस"), ("p_trans", "बड़ा ट्रांसफ़ॉर्मर,"),
      ("e0", "इंजन के अंदर। अब"), ("e_conv", "कन्वर्टर में।"), ("e_accel", "एक्सीलरेटर।"), ("e_motors", "फिर ये बिजली जाती"), ("e_six", "छह बड़ी"),
      ("e_gear", "गियर के ज़रिए"), ("e_hp", "बारह हज़ार"), ("e_cars", "सौ कारों"),
      ("t0", "स्टीयरिंग नहीं, फिर"), ("t_q", "ट्रेन में स्टीयरिंग"), ("t_secret", "राज़ छिपा"), ("t_slope", "ढलानदार होता"), ("t_axle", "और दोनों पहिए"),
      ("t_curve", "मोड़ आते ही"), ("t_outer", "तब बाहर वाला"), ("t_dist", "मोटा हिस्सा एक"), ("t_self", "अपने आप मुड़ जाती"), ("t_flange", "फ़्लैंज,"),
      ("pt0", "पटरी कैसे बदलती"), ("pt_point", "पॉइंट से।"), ("pt_blades", "दो नुकीले"), ("pt_machine", "बिजली की मशीन"), ("pt_turn", "उसी रास्ते"),
      ("pt_lock", "लॉक न"), ("pt_green", "हरा हो ही"),
      ("s0", "सिग्नल का खेल।"), ("s_rule", "नियम सीधा"), ("s_sensor", "लगे सेंसर,"), ("s_aspects", "ठीक पीछे"), ("s_behind", "पीछे आने वाली"),
      ("b0", "रुकने में एक किलोमीटर क्यों"), ("b_pipe", "लंबा पाइप"), ("b_apply", "ड्राइवर हवा"), ("b_break", "बीच से टूट"), ("b_km", "लगभग एक किलोमीटर लग"),
      ("b_danger", "इसीलिए पटरी"), ("b_regen", "और नए इंजन"),
      ("n0", "तो अगली बार"), ("n_recap", "ऊपर पच्चीस"), ("n_r1", "ऊपर पच्चीस"), ("n_r2", "नीचे ढलानदार"), ("n_r3", "आगे सिग्नल,"), ("n_r4", "हवा का पहरा।"),
      ("n_title", "ये है, भारतीय")]
K = {}; last = 0.0
for name, ph in AN:
    K[name] = round(find(ph, last if not name.startswith("n_r") else K.get("n_recap", 0) - 0.01), 3); last = K[name] - 0.01
K["END"] = round(DUR + 1.0, 2)
json.dump(K, open(P("out/anchors.json"), "w"), ensure_ascii=False, indent=1)
print({k: K[k] for k in ("h_how", "p0", "e0", "t0", "pt0", "s0", "b0", "n0", "n_title")})

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
with open(P("deliver/rail_ka_jadu_hi.srt"), "w") as f:
    for q, c in enumerate(out, 1):
        f.write(f"{q}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print(len(out), "captions")
