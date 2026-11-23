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
VOICE, SPEED = "am_michael", 0.93
PITCH = 0.955  # play slower -> lower pitch, slightly slower read
LEAD = 3.6  # title card before the first line

# (id, text, pause after in s)
LINES = [
    ("s1a", "August ninth. Oh-eight forty-one.", 0.6),
    ("s1b", "A research intern signs into the east genetics lab. His eleventh visit that summer.", 0.6),
    ("s1c", "The log records nothing unusual.", 0.6),
    ("s1d", "One enclosure, specimen eight-C, is marked for transfer.", 0.7),
    ("s1e", "The camera above the door records the next four minutes in full.", 3.2),
    ("s2a", "Oh-eight forty-three. The lid is open for ninety seconds.", 0.6),
    ("s2b", "The specimen leaves the enclosure at oh-eight forty-four.", 0.5),
    ("s2c", "It crosses bench four in eleven seconds.", 0.5),
    ("s2d", "It descends on a single thread.", 0.9),
    ("s2e", "At oh-eight forty-five, contact. The back of the right hand.", 0.9),
    ("s2f", "The intern looks down once. He closes the lid. He does not report it.", 0.7),
    ("s2g", "At oh-nine-oh-two, he signs out. The specimen does not appear on any frame after oh-eight forty-five.", 3.4),
    ("s3a", "Twenty-three sixteen. Same date.", 0.6),
    ("s3b", "The alley behind the intern's residence. A security camera across the alley records the next ninety seconds.", 0.6),
    ("s3c", "He stands at the east wall. Brick. Four stories. No ladder. No rope.", 0.7),
    ("s3d", "He places one hand flat. Then the other.", 1.2),
    ("s3e", "At twenty-three seventeen, he is eleven meters up.", 1.0),
    ("s3f", "The transfer form for specimen eight-C lists its species as unclassified.", 0.8),
    ("s3g", "It is never recovered.", 0.9),
    ("s3h", "The file remains open.", 0.5),
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
        from scipy.signal import resample
        a = resample(a, int(len(a) / PITCH)).astype(np.float32)
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
