#!/usr/bin/env python3
"""Narration with Kokoro (offline neural TTS) -> voice/voice.wav + voice/lines.json.

Each line is synthesized on its own and placed one after another with a pause, so the line start
times are exact. Word times inside a line are estimated from syllable weight (used for captions only).

    pip install kokoro-onnx soundfile
    models: kokoro-v1.0.int8.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx releases
    MODELS=~/models python3 tools/voice.py
"""
import json, os, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
M = os.environ.get("MODELS", os.path.expanduser("~/models"))
VOICE, SPEED = "af_heart", 1.0
LEAD = 0.45  # silence before the first line

# (id, text, pause after in s)
LINES = [
    ("hook",     "You flip one switch, and water climbs all the way up to your roof tank.", 0.35),
    ("question", "But how does a spinning motor push water upward? Let's look inside.", 0.45),
    ("two",      "A water motor is really two machines on one shaft. An electric motor, and a pump.", 0.4),
    ("stator",   "Power flows into the copper windings of the stator.", 0.25),
    ("field",    "They make a magnetic field that spins around the rotor, and drags it along, nearly three thousand times a minute.", 0.45),
    ("impeller", "The shaft carries that spin into the pump, to a wheel with curved blades, called the impeller.", 0.4),
    ("eye",      "Water enters at the center. The eye.", 0.25),
    ("fling",    "The spinning blades fling it outward, faster and faster.", 0.35),
    ("volute",   "Then the spiral casing, the volute, slowly widens. The water slows down, and its speed turns into pressure.", 0.3),
    ("push",     "That pressure pushes it up the pipe, to your tank.", 0.45),
    ("prime",    "That's also why you prime the pump first. An impeller can't fling air. Only water.", 0.45),
    ("outro",    "Electricity. Magnetism. Spin. Pressure. Water on your roof.", 0.9),
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
