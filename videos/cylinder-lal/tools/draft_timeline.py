"""Draft timing with no voice yet: script.json -> src/data/timeline.json at ~RATE Roman words per second.
Use it to build and check the picture before the real voice arrives; tools/voice.py overwrites it later."""
import json, os, math, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATE = float(os.environ.get("RATE", "2.9"))
S = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
t, lines = 0.25, []
for ln in S["lines"]:
    t += ln.get("gap", 0.15)
    words = ln["cap"].split()
    w8 = [max(1, len(re.findall(r"[aeiou]+", w.lower()))) + (0.8 if w[-1] in ".?!," else 0) for w in words]
    dur = sum(w8) / (RATE * 1.75)
    t0, acc, ws = t, 0.0, []
    for w, k in zip(words, w8):
        ws.append({"w": w, "t": round(t0 + dur * acc / sum(w8), 3)}); acc += k
    t = t0 + dur
    lines.append({"id": ln["id"], "t0": round(t0, 3), "t1": round(t, 3), "cap": ln["cap"], "hl": ln.get("hl", []), "red": ln.get("red", []), "words": ws})
total = t + 1.2
json.dump({"fps": 30, "duration": round(total, 2), "frames": math.ceil(total * 30), "lines": lines},
          open(os.path.join(ROOT, "src", "data", "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"draft total {total:.2f}s ({math.ceil(total * 30)} frames)")
for l in lines: print(l["id"], l["t0"], l["t1"])
