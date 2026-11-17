#!/usr/bin/env python3
"""Hindi version: take a recorded/generated Hindi voice (e.g. ElevenLabs), align it to the 12 lines
of deliver/voice_script_hindi.txt by pauses (tools/align_hi.py), estimate word times inside each
line from syllables over the spoken parts only, and write
    voice_hi/voice.wav, voice_hi/lines.json, web/lines_hi.js
`cues` map the English cue words the timeline uses (web/main.js, tools/audio.py) to Hindi words.

    python3 tools/voice_hi.py voice_hi/elevenlabs.mp3
"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else f"{ROOT}/voice_hi/elevenlabs.mp3"
LEAD = 0.45
IDS = ["hook", "question", "two", "stator", "field", "impeller", "eye", "fling", "volute", "push", "prime", "outro"]
# a line boundary the pause-based alignment gets wrong, checked by ear/phrase length: start time of a line
FIX_START = {"outro": 68.10}
CUES = {
    "two": {"shaft": "शाफ़्ट", "electric": "इलेक्ट्रिक", "pump": "पंप"},
    "stator": {"power": "बिजली", "copper": "तांबे"},
    "field": {"rotor": "रोटर", "drags": "घुमा", "nearly": "करीब"},
    "impeller": {"pump": "पंप", "blades": "पंखुड़ियों", "impeller": "इम्पेलर"},
    "eye": {"eye": "आई"},
    "volute": {"volute": "वॉल्यूट", "pressure": "प्रेशर"},
    "push": {"pipe": "पाइप"},
    "prime": {"air": "हवा", "water": "सिर्फ़"},
    "outro": {"electricity": "बिजली", "magnetism": "चुंबक", "spin": "घुमाव", "pressure": "प्रेशर"},
}
TEXT = {
    "font": "hi",
    "title": "<em>वॉटर मोटर</em><br>कैसे काम<br>करती है?",
    "labels": {
        "Electric motor": ["इलेक्ट्रिक मोटर", "घुमाव बनाती है"],
        "Pump": ["पंप", "पानी धकेलता है"],
        "Shaft": ["शाफ़्ट", "दोनों का एक ही"],
        "Stator": ["स्टेटर", "तांबे की वाइंडिंग"],
        "Rotor": ["रोटर", "साथ घूमता है"],
        "Impeller": ["इम्पेलर", "मुड़ी पंखुड़ियाँ"],
        "Eye": ["आई", "पानी यहाँ से आता है"],
        "Volute": ["वॉल्यूट", "चौड़ी होती केसिंग"],
        "Delivery pipe": ["डिलीवरी पाइप", "टंकी तक"],
    },
    "speed": "रफ़्तार ➜ प्रेशर", "air": "हवा ✗ बहाव नहीं", "water": "पानी ✓ बहता है",
    "chain": ["बिजली", "चुंबक", "घुमाव", "प्रेशर"],
}


def syl(s): return max(1, len(re.findall(r"[अ-हक़-य़]", s)))
def norm(s): return re.sub(r"[^ऀ-ॣ०-ॿ]", "", s)   # Devanagari, without danda


def main():
    out = f"{ROOT}/voice_hi/align.json"
    subprocess.run([sys.executable, f"{ROOT}/tools/align_hi.py", SRC, f"{ROOT}/deliver/voice_script_hindi.txt", out], check=True)
    al = json.load(open(out))
    # apply the fixes: move segments across a boundary
    segs_all = [s for a in al for s in a["segs"]]
    for lid, t0 in FIX_START.items():
        i = IDS.index(lid)
        lo = al[i - 1]["start"]; hi = al[i]["end"]
        al[i - 1]["segs"] = [s for s in segs_all if lo - 0.01 <= s[0] < t0 - 0.01]
        al[i]["segs"] = [s for s in segs_all if t0 - 0.01 <= s[0] <= hi]
    for a in al: a["start"], a["end"] = a["segs"][0][0], a["segs"][-1][1]

    # audio with the same lead-in as the English cut
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", "24000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.float32)
    v = np.concatenate([np.zeros(int(LEAD * 24000), np.float32), a])
    sf.write(f"{ROOT}/voice_hi/voice.wav", v, 24000, subtype="PCM_16")
    total = len(v) / 24000

    lines = []
    for lid, a in zip(IDS, al):
        words = [w for w in a["text"].split() if norm(w)]
        # spoken time only: place words by cumulative syllables along the speech, then map back
        segs = [(s + LEAD, e + LEAD) for s, e in a["segs"]]
        speech = sum(e - s for s, e in segs)
        wts = [syl(w) + (1.2 if re.search(r"[।?,—]$", w) else 0) for w in words]
        W = sum(wts); acc = 0; wl = []
        for w, k in zip(words, wts):
            x = speech * acc / W; acc += k
            for s, e in segs:
                if x <= e - s + 1e-6: t = s + x; break
                x -= e - s
            wl.append({"w": w, "t": round(t, 3)})
        cues = {}
        for en, hi in CUES.get(lid, {}).items():
            m = [w["t"] for w in wl if norm(w["w"]) == norm(hi)]
            if not m: raise SystemExit(f"cue {hi} not in {lid}")
            cues[en] = m[0]
        lines.append({"id": lid, "text": a["text"], "start": round(segs[0][0], 3), "end": round(segs[-1][1], 3), "words": wl, "cues": cues})
        print(f"{lid:9s} {lines[-1]['start']:6.2f}-{lines[-1]['end']:6.2f}  {a['text'][:50]}")
    data = {"duration": round(total, 3), "lines": lines, "text": TEXT}
    json.dump(data, open(f"{ROOT}/voice_hi/lines.json", "w"), ensure_ascii=False, indent=1)
    open(f"{ROOT}/web/lines_hi.js", "w").write("export const VOICE = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print(f"total {total:.2f} s")


if __name__ == "__main__":
    main()
