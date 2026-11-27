import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
from scipy.io import wavfile
for f in sys.argv[1:]:
    sr, a = wavfile.read(f.replace('.mp3', '.16k.wav')); a = a.astype('float32') / 32768
    segs, _ = m.transcribe(a, language="hi", word_timestamps=True, beam_size=5, vad_filter=False)
    out = []
    for s in segs:
        out.append(dict(t0=s.start, t1=s.end, text=s.text, words=[dict(w=w.word, t0=w.start, t1=w.end) for w in s.words]))
        print(f"{f[-9:]} {s.start:7.2f}-{s.end:7.2f} {s.text}", flush=True)
    json.dump(out, open(f.replace('.mp3', '.json'), 'w'), ensure_ascii=False)
