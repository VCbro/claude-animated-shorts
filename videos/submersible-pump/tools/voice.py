#!/usr/bin/env python3
"""Narration with Kokoro (offline neural TTS) -> voice/voice.wav + voice/lines.json.

Each line is synthesized on its own and placed one after another with a pause, so the line start
times are exact. Word times inside a line are estimated from syllable weight (used for captions only).

    pip install kokoro-onnx soundfile
    models: kokoro-v1.0.int8.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases
    MODELS=/home/user/models python3 tools/voice.py
"""
import json, os, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
M = os.environ.get("MODELS", "/home/user/models")
VOICE, SPEED = "af_heart", 1.22
LEAD = 0.45  # silence before the first line

# (id, text, pause after in s)
LINES = [
    ("hook",     "This pump lives two hundred feet underground. Completely underwater.", 0.18),
    ("question", "So how does it push water all the way up to your house?", 0.24),
    ("install",  "Workers lower it into the borewell on its pipe, with the power cable alongside.", 0.18),
    ("deep",     "Down it goes, past soil, sand and rock, deep below the water level.", 0.24),
    ("motor",    "At the bottom is a sealed electric motor. The water flowing past it keeps it cool.", 0.18),
    ("intake",   "Above that, the intake. A mesh screen lets water in, and keeps sand out.", 0.21),
    ("stages",   "Then the real trick. Not one impeller, but a whole stack of them, called stages.", 0.18),
    ("diffuser", "Each impeller flings the water outward, and a diffuser guides it up into the next one.", 0.18),
    ("pressure", "Every stage adds more pressure. More stages, the deeper it can lift.", 0.24),
    ("valve",    "At the top, a check valve stops the water falling back when the pump switches off.", 0.24),
    ("why",      "Why push from below? A surface pump can only suck water up about eight meters. Pushing has no limit.", 0.24),
    ("outro",    "Motor at the bottom. Stages stacked up. Pressure, all the way to your tank.", 0.54),
]


def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    return max(1, len(re.findall(r"[aeiouy]+", w)) - (1 if w.endswith("e") and len(w) > 3 else 0))


def word_times(text, dur):
    words = text.split()
    # weight = syllables, plus a beat for punctuation pauses
    wts = [syl(w) + (0.9 if w[-1] in ".?" else 0.45 if w[-1] in ",:" else 0) for w in words]
    tot = sum(wts); t = 0.05; out = []
    usable = dur - 0.1
    for w, k in zip(words, wts):
        out.append({"w": w, "t": round(t, 3)})
        t += usable * k / tot
    return out


def main():
    k = Kokoro(f"{M}/kokoro.onnx", f"{M}/voices.bin")
    sr = 24000
    pieces = [np.zeros(int(LEAD * sr), np.float32)]
    t = LEAD; meta = []
    for lid, text, pause in LINES:
        a, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        a = np.asarray(a, np.float32)
        # trim synth silence at both ends
        nz = np.nonzero(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 240): nz[-1] + 1200]
        dur = len(a) / sr
        meta.append({"id": lid, "text": text, "start": round(t, 3), "end": round(t + dur, 3),
                     "words": [{"w": w["w"], "t": round(t + w["t"], 3)} for w in word_times(text, dur)]})
        pieces += [a, np.zeros(int(pause * sr), np.float32)]
        t += dur + pause
        print(f"{lid:9s} {meta[-1]['start']:6.2f}-{meta[-1]['end']:6.2f}  {text}")
    v = np.concatenate(pieces)
    v = v / (np.abs(v).max() + 1e-9) * 0.89
    os.makedirs(f"{ROOT}/voice", exist_ok=True)
    sf.write(f"{ROOT}/voice/voice.wav", v, sr, subtype="PCM_16")
    total = len(v) / sr
    json.dump({"duration": round(total, 3), "lines": meta}, open(f"{ROOT}/voice/lines.json", "w"), indent=1)
    # the page reads the timings from this module
    open(f"{ROOT}/web/lines.js", "w").write("export const VOICE = " + json.dumps({"duration": round(total, 3), "lines": meta}) + ";\n")
    print(f"total {total:.2f} s")


if __name__ == "__main__":
    main()
