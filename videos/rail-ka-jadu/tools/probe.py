from scipy.io import wavfile
from faster_whisper import WhisperModel
import sys
sr, a = wavfile.read("voice/v16.wav"); a = a.astype("float32") / 32768
m = WhisperModel("medium", device="cpu", compute_type="int8")
OUT = []
for t0, t1 in [(97.9, 104.0), (103.5, 109.5), (109.0, 116.2)]:
    segs, _ = m.transcribe(a[int(t0 * sr):int(t1 * sr)], language="hi", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    for s in segs:
        OUT += [dict(w=w.word.strip(), t0=w.start + t0, t1=w.end + t0) for w in s.words]
        print(f"{s.start + t0:7.2f}-{s.end + t0:7.2f} {s.text} || " + " ".join(f"{w.word.strip()}@{w.start + t0:.2f}" for w in s.words))
import json; json.dump(OUT, open("voice/probewords.json", "w"), ensure_ascii=False)
