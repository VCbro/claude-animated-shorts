"""Free offline TTS for tts_say.py --cmd: python3 kokoro_tts.py {txt} {out}. Voice: bm_george (deep British). Needs kokoro-onnx + ~/models."""
import os
import sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
txt, out = sys.argv[1], sys.argv[2]
k = Kokoro(os.path.expanduser('~/models/kokoro.onnx'), os.path.expanduser('~/models/voices.bin'))
paras = [p.strip() for p in open(txt).read().split('\n') if p.strip()]
sr = 24000; parts = []
for p in paras:
    y, sr = k.create(p, voice='bm_george', speed=1.0, lang='en-gb'); parts += [y, np.zeros(int(0.55 * sr))]
sf.write(out, np.concatenate(parts), sr)
