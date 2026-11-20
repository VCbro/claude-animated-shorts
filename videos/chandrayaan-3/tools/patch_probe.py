import json, sys
from scipy.io import wavfile
from faster_whisper import WhisperModel
sr, a = wavfile.read("voice/v16.wav"); a = a.astype("float32") / 32768
m = WhisperModel("medium", device="cpu", compute_type="int8")
t_from, t_to, step = float(sys.argv[1]), float(sys.argv[2]), 7.0
words = []; t0 = t_from
while t0 < t_to:
    t1 = min(t_to, t0 + step)
    segs, _ = m.transcribe(a[int(t0 * sr):int(t1 * sr)], language="hi", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    for s in segs:
        print(f"{s.start + t0:7.2f} {s.text}")
        words += [dict(w=w.word.strip(), t0=w.start + t0, t1=w.end + t0) for w in s.words if w.start + t0 >= (words[-1]["t1"] - 0.05 if words else -1)]
    if t1 >= t_to: break
    t0 = t1 - 0.4
json.dump(dict(**{"from": t_from, "to": t_to}, words=words), open(sys.argv[3], "w"), ensure_ascii=False)
