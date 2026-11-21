import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe(__import__("numpy").frombuffer(__import__("scipy.io.wavfile",fromlist=["x"]).read("voice/v16.wav")[1].tobytes(),dtype="int16").astype("float32")/32768, language="hi", word_timestamps=True, beam_size=5,
    initial_prompt="पाँच हज़ार टन की ट्रेन। पच्चीस हज़ार वोल्ट, पैंटोग्राफ़, ट्रांसफ़ॉर्मर, कन्वर्टर, हॉर्सपावर, फ़्लैंज, पॉइंट, सिग्नल, ब्लॉक, ब्रेक।")
out = []
for s in segs:
    print(f"{s.start:6.2f} {s.end:6.2f} {s.text}")
    out.append(dict(start=s.start, end=s.end, text=s.text, words=[dict(w=w.word.strip(), t0=w.start, t1=w.end) for w in s.words]))
json.dump(out, open("voice/whisper.json", "w"), ensure_ascii=False, indent=1)
