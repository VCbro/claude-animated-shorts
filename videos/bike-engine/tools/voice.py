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
VOICE, SPEED = "af_heart", 1.27
LEAD = 0.45  # silence before the first line

# (id, text, pause after in s)
LINES = [
    ("hook",     "Inside your bike's engine, a small explosion goes off fifty times every second.", 0.2),
    ("question", "So how does a bang turn into a ride?", 0.24),
    ("parts",    "Meet the parts. A piston slides in the cylinder, and a connecting rod links it to the crankshaft.", 0.2),
    ("valves",   "On top, two valves. One lets air and fuel in, one lets exhaust out. A camshaft opens them.", 0.24),
    ("intake",   "Stroke one, intake. The piston drops, and sucks in air mixed with petrol.", 0.2),
    ("compress", "Stroke two, compression. Both valves close, and the piston squeezes the mix tight.", 0.2),
    ("power",    "Stroke three, power. The spark plug fires, and the blast slams the piston down.", 0.2),
    ("exhaust",  "Stroke four, exhaust. The piston rises and pushes the burnt gas out to the silencer.", 0.24),
    ("cycle",    "Four strokes, two turns of the crank, one bang. The heavy flywheel keeps it spinning in between.", 0.2),
    ("drive",    "That spin goes through the clutch and gearbox, to the chain, and the rear wheel.", 0.24),
    ("fins",     "And those fins on the cylinder? They throw the heat away into the air as you ride.", 0.24),
    ("outro",    "Suck. Squeeze. Bang. Blow. That's what moves your bike.", 0.6),
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
