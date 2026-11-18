"""Narration for both languages with offline Piper voices (sherpa-onnx).

Writes assets/voice/<lang>/<beat>.wav (24-bit-free float -> 16-bit), assets/voice/<lang>.wav (the whole track with
gaps), and timing.json: per language, each beat's start/end seconds and the total. The picture is timed from it.
usage: python3 -I tools/make_voice.py [en_voice] [hi_voice]
"""
import json, os, sys
import numpy as np
import soundfile as sf
from piper import PiperVoice, SynthesisConfig

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTS = os.path.expanduser("~/tts")
VOICES = {
    "en": sys.argv[1] if len(sys.argv) > 1 else "vits-piper-en_US-ryan-high",
    "hi": sys.argv[2] if len(sys.argv) > 2 else "vits-piper-hi_IN-pratham-medium",
}
SPEED = {"en": 0.97, "hi": 1.12}   # piper length_scale is 1/speed
LEAD = 0.6       # silence before the first line
GAP = 0.55       # silence between beats
TAIL = 1.6       # after the last line
SR = 48000


def engine(name):
    d = os.path.join(TTS, name)
    onnx = [f for f in os.listdir(d) if f.endswith(".onnx")][0]
    return PiperVoice.load(os.path.join(d, onnx))


def speak(voice, text, speed):
    cfg = SynthesisConfig(length_scale=1.0 / speed, noise_scale=0.6, noise_w_scale=0.7)
    parts = [np.asarray(c.audio_float_array, dtype=np.float32) for c in voice.synthesize(text, syn_config=cfg)]
    return np.concatenate(parts), voice.config.sample_rate


def resample(x, sr):
    if sr == SR:
        return x
    from scipy.signal import resample_poly
    from math import gcd
    g = gcd(SR, sr)
    return resample_poly(x, SR // g, sr // g)


def trim(x, thr=0.004):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.02 * SR)); b = min(len(x), idx[-1] + int(0.06 * SR))
    return x[a:b]


def main():
    beats = json.load(open(os.path.join(HERE, "lines.json"), encoding="utf-8"))["beats"]
    timing = {}
    for lang, voice in VOICES.items():
        tts = engine(voice)
        out = os.path.join(HERE, "assets", "voice", lang); os.makedirs(out, exist_ok=True)
        t = LEAD; track = [np.zeros(int(LEAD * SR))]; rows = []
        for b in beats:
            y, sr = speak(tts, b[lang], SPEED[lang])
            x = trim(resample(y, sr))
            x = x / max(1e-6, np.abs(x).max()) * 0.89
            sf.write(os.path.join(out, b["id"] + ".wav"), x, SR, subtype="PCM_16")
            d = len(x) / SR
            rows.append({"id": b["id"], "start": round(t, 3), "end": round(t + d, 3)})
            track += [x, np.zeros(int(GAP * SR))]
            t += d + GAP
        track[-1] = np.zeros(int(TAIL * SR)); t += TAIL - GAP
        full = np.concatenate(track)
        sf.write(os.path.join(HERE, "assets", "voice", lang + ".wav"), full, SR, subtype="PCM_16")
        timing[lang] = {"voice": voice, "beats": rows, "total": round(len(full) / SR, 3)}
        print(lang, voice, f"{len(full)/SR:.1f}s", [f"{r['id']}:{r['end']-r['start']:.1f}" for r in rows])
    json.dump(timing, open(os.path.join(HERE, "timing.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
