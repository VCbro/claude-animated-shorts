import json, numpy as np
from scipy.io import wavfile
from faster_whisper import WhisperModel
sr, a = wavfile.read("voice/v16.wav"); a = a.astype("float32") / 32768
m = WhisperModel("medium", device="cpu", compute_type="int8")
GAPS = [(16.6, 30.2, "बिजली कहाँ से आती है। ट्रेन के ऊपर देखो, पटरी के साथ-साथ एक तार चलता है। इस तार में दौड़ रही है, पच्चीस हज़ार वोल्ट की बिजली। इंजन की छत पर लगा ये पैंटोग्राफ़, स्प्रिंग के ज़ोर से तार को लगातार छूता रहता है।"),
        (97.9, 116.2, "अंदर से मोटा और बाहर से पतला। और दोनों पहिए एक ही धुरी पर जुड़े होते हैं। मोड़ आते ही ट्रेन बाहर की ओर खिसकती है। तब बाहर वाला पहिया अपने मोटे हिस्से पर चलता है, और अंदर वाला पतले हिस्से पर। मोटा हिस्सा एक चक्कर में ज़्यादा दूरी तय करता है। इसलिए बाहर का"),
        (38.3, 44.6, "बिजली तार से इंजन में आती है, और पहियों और पटरी के रास्ते वापस लौट जाती है।")]
out = []
for t0, t1, prompt in GAPS:
    segs, _ = m.transcribe(a[int(t0 * sr):int(t1 * sr)], language="hi", word_timestamps=True, beam_size=5, initial_prompt=prompt)
    for s in segs:
        print(f"{s.start + t0:7.2f} {s.text}")
        out += [dict(w=w.word.strip(), t0=w.start + t0, t1=w.end + t0) for w in s.words]
json.dump(out, open("voice/gapwords.json", "w"), ensure_ascii=False, indent=0)
