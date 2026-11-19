#!/usr/bin/env python3
"""Hindi narration with Kokoro (offline neural TTS, voice hm_omega) -> voice/voice.wav + voice/lines.json.

Every phrase (split at , ? । .) is synthesised on its own and laid end to end with short pauses, so
phrase start/end times are exact. Word times inside a phrase are spread by akshara weight; they only
drive the word highlight of the captions.

    /home/user/bpyenv/bin/python or python3 (needs kokoro-onnx, soundfile)
    python3 tools/voice.py
"""
import json, os, re
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
M = os.environ.get("MODELS", "/home/user/models")
VOICE, SPEED, SR = "hm_omega", 1.17, 24000

# (id, earliest start in s, text). A line starts at max(its earliest start, end of previous + GAP).
LINES = [
    ("click",    1.9,  "ये क्लिक सुनी? नोज़ल को कैसे पता चला, कि टंकी भर गई?"),
    ("start",    5.6,  "शुरुआत यहाँ होती है। टैंकर से पेट्रोल, इस पाइप के रास्ते, ज़मीन के नीचे बने स्टोरेज टैंक में उतरता है।"),
    ("customer", 12.6, "बाद में, गाड़ी में पेट्रोल भरने की बारी आती है। मीटर ज़ीरो होता है। हैंडल दबाते ही, पेट्रोल बहने लगता है।"),
    ("pump",     20.6, "इस स्टेशन में असली पंप नीचे है। इसकी मोटर पंखुड़ियों वाला पहिया घुमाती है, जो पेट्रोल को दबाव देकर, डिस्पेंसर तक भेजता है।"),
    ("meter",    29.4, "फ़िल्टर से गुज़रकर, पेट्रोल मीटर में पहुँचता है। इसकी हर चाल, एक तय मात्रा मापती है। पल्सर उस चाल को सिग्नल में बदलता है। लीटर को रेट से गुणा करो, तो रकम मिलती है।"),
    ("nozzle",   42.2, "अब नोज़ल के अंदर देखिए। बड़ी नली से पेट्रोल निकलता है। सिरे पर ये दूसरा, छोटा-सा छेद, हवा खींचता है।"),
    ("shutoff",  50.6, "बहता पेट्रोल, वेंचुरी में खिंचाव पैदा करता है। जब पेट्रोल इस छेद को ढकता है, हवा आना रुक जाती है। अंदर दबाव घटता है, डायफ्राम खिसकता है, कुंडी छूटती है, और स्प्रिंग वाल्व बंद कर देती है।"),
    ("finish",   0.0,  "बस, पेट्रोल का बहना रुक गया। जितने लीटर गुज़रे, उतना ही बिल। और ये थी, उस एक क्लिक के पीछे की पूरी कहानी।"),
]
GAP = {"finish": 2.2}        # the click plays alone before the last line
P_COMMA, P_STOP = 0.12, 0.28

VOW = set("ािीुूृेैोौंँः")


def weight(w):
    w = re.sub(r"[^ऀ-ॿ]", "", w)
    cons = len(re.findall(r"[क-हक़-य़]", w)) - len(re.findall("्", w))
    return max(1.0, cons + 0.4 * sum(c in VOW for c in w) + len(re.findall(r"[अ-औ]", w)))


def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    return a[max(0, idx[0] - 240): idx[-1] + 480]


def main():
    k = Kokoro(os.path.join(M, "kokoro.onnx"), os.path.join(M, "voices.bin"))
    out, lines, t = [], [], 0.0
    pos = 0
    for lid, earliest, text in LINES:
        start = max(earliest, t + GAP.get(lid, 0.35))
        if start > t: out.append(np.zeros(int((start - t) * SR), np.float32)); t = start
        phrases = [p.strip() for p in re.findall(r"[^,?।.]+[,?।.]?", text) if p.strip()]
        words = []
        for ph in phrases:
            a, sr = k.create(ph, voice=VOICE, speed=SPEED, lang="hi")
            a = trim(a.astype(np.float32))
            d = len(a) / SR
            ws = ph.split()
            wt = [weight(w) for w in ws]
            acc = 0.0
            for w, x in zip(ws, wt):
                words.append({"w": w, "t": round(t + 0.04 + (d - 0.1) * acc / sum(wt), 3)})
                acc += x
            out.append(a); t += d
            p = P_STOP if ph[-1] in "?।." else P_COMMA
            out.append(np.zeros(int(p * SR), np.float32)); t += p
        end = t - (P_STOP if text[-1] in "?।." else P_COMMA)
        lines.append({"id": lid, "text": text, "start": round(start, 3), "end": round(end, 3), "words": words})
        print(f"{lid:9s} {start:6.2f} -> {end:6.2f}")
    a = np.concatenate(out)
    a = a / max(1e-6, np.abs(a).max()) * 0.89
    os.makedirs(os.path.join(ROOT, "voice"), exist_ok=True)
    sf.write(os.path.join(ROOT, "voice/voice.wav"), a, SR)
    json.dump({"duration": round(len(a) / SR, 3), "lines": lines}, open(os.path.join(ROOT, "voice/lines.json"), "w"), ensure_ascii=False, indent=1)
    print("total", len(a) / SR)


if __name__ == "__main__":
    main()
