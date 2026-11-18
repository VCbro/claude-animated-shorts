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
TEMPO = 1.3       # speed-up of the voice (pitch kept)
GAP_IN = 0.06     # longest pause kept inside a line, s (before speed-up)
GAP_LINE = 0.15   # longest pause kept between lines, s (before speed-up)
PAD = 0.05        # audio kept around each spoken segment, s
IDS = ["hook", "question", "parts", "valves", "intake", "compress", "power", "exhaust", "cycle", "drive", "fins", "outro"]
# a line boundary the pause-based alignment gets wrong, checked by ear/phrase length: start time of a line
FIX_START = {}
CUES = {
    "hook": {"explosion": "धमाके", "fifty": "पचास"},
    "question": {"bang": "धमाका", "ride": "चलाता"},
    "parts": {"piston": "पिस्टन", "cylinder": "सिलेंडर", "connecting": "कनेक्टिंग", "crankshaft": "क्रैंकशाफ़्ट"},
    "valves": {"air": "हवा", "exhaust": "धुआँ", "camshaft": "कैमशाफ़्ट"},
    "intake": {"intake": "इनटेक", "piston": "पिस्टन", "sucks": "खींचता", "petrol": "पेट्रोल"},
    "compress": {"compression": "कम्प्रेशन", "close": "बंद", "squeezes": "दबाता"},
    "power": {"power": "पावर", "spark": "स्पार्क", "blast": "धमाका", "slams": "धकेलता"},
    "exhaust": {"exhaust": "एग्ज़ॉस्ट", "rises": "ऊपर", "burnt": "जला", "silencer": "साइलेंसर"},
    "cycle": {"four": "चार", "crank": "क्रैंक", "bang": "धमाका", "flywheel": "फ़्लाईव्हील"},
    "drive": {"spin": "घुमाव", "clutch": "क्लच", "gearbox": "गियरबॉक्स", "chain": "चेन", "wheel": "पहिये"},
    "fins": {"fins": "फ़िन्स", "heat": "गर्मी", "air": "हवा"},
    "outro": {"suck": "खींचो", "squeeze": "दबाओ", "bang": "धमाका", "blow": "निकालो", "that's": "यही"},
}
TEXT = {
    "font": "hi",
    "title": "<em>बाइक का इंजन</em><br>कैसे काम<br>करता है?",
    "labels": {
        "Piston": ["पिस्टन", "ऊपर-नीचे चलता है"],
        "Cylinder": ["सिलेंडर", "पिस्टन का घर"],
        "Connecting rod": ["कनेक्टिंग रॉड", "पिस्टन ➜ क्रैंक"],
        "Crankshaft": ["क्रैंकशाफ़्ट", "घुमाव बनाता है"],
        "Intake valve": ["इनटेक वाल्व", "हवा + पेट्रोल अंदर"],
        "Exhaust valve": ["एग्ज़ॉस्ट वाल्व", "धुआँ बाहर"],
        "Camshaft": ["कैमशाफ़्ट", "वाल्व खोलता है"],
        "Carburettor": ["कार्बोरेटर", "हवा + पेट्रोल मिलाता"],
        "Spark plug": ["स्पार्क प्लग", "चिंगारी देता है"],
        "Silencer": ["साइलेंसर", "धुआँ बाहर"],
        "Flywheel": ["फ़्लाईव्हील", "घुमाव जमा रखता है"],
        "Clutch": ["क्लच", "जोड़ता / छोड़ता"],
        "Gearbox": ["गियरबॉक्स", "स्पीड बदलता है"],
        "Chain": ["चेन", "पहिये तक"],
        "Rear wheel": ["पिछला पहिया", ""],
        "Cooling fins": ["कूलिंग फ़िन्स", "गर्मी हवा में"],
    },
    "bang": "हर सेकंड <b>50</b> धमाके",
    "strokes": ["① इनटेक", "② कम्प्रेशन", "③ पावर", "④ एग्ज़ॉस्ट"],
    "cyc": "2 चक्कर = 1 धमाका",
    "path": ["क्रैंक", "क्लच", "गियरबॉक्स", "चेन", "पहिया"],
    "chain": ["खींचो", "दबाओ", "धमाका", "निकालो"],
}


def syl(s): return max(1, len(re.findall(r"[अ-हक़-य़]", s)))
def norm(s): return re.sub(r"[^ऀ-ॣ०-ॿ]", "", s)   # Devanagari, without danda


def main():
    out = f"{ROOT}/voice_hi/align.json"
    subprocess.run([sys.executable, f"{ROOT}/tools/align_hi.py", SRC, f"{ROOT}/tools/script_hi.txt", out], check=True)
    al = json.load(open(out))
    # apply the fixes: move segments across a boundary
    segs_all = [s for a in al for s in a["segs"]]
    for lid, t0 in FIX_START.items():
        i = IDS.index(lid)
        lo = al[i - 1]["start"]; hi = al[i]["end"]
        al[i - 1]["segs"] = [s for s in segs_all if lo - 0.01 <= s[0] < t0 - 0.01]
        al[i]["segs"] = [s for s in segs_all if t0 - 0.01 <= s[0] <= hi]
    for a in al: a["start"], a["end"] = a["segs"][0][0], a["segs"][-1][1]

    # tighten: cut every pause down (GAP_IN inside a line, GAP_LINE between lines), then speed up
    # the whole voice by TEMPO (pitch kept); all segment times are mapped to the new timeline
    SR = 24000
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, np.float32)
    fade = np.linspace(0, 1, int(0.006 * SR), dtype=np.float32)
    parts, cur, prev_e, newsegs = [], 0.0, None, []
    for li, ln in enumerate(al):
        ns = []
        for j, (s, e) in enumerate(ln["segs"]):
            if prev_e is not None:
                cap = GAP_IN if j else GAP_LINE
                g = min(max(s - prev_e - 2 * PAD, 0.0), cap)
                parts.append(np.zeros(int(g * SR), np.float32)); cur += int(g * SR) / SR
            lo, hi = max(0, int((s - PAD) * SR)), min(len(a), int((e + PAD) * SR))
            piece = a[lo:hi].copy(); piece[:len(fade)] *= fade; piece[-len(fade):] *= fade[::-1]
            t0 = cur + (s - lo / SR); parts.append(piece); cur += len(piece) / SR
            ns.append((t0, t0 + (e - s))); prev_e = e
        newsegs.append(ns)
    parts.append(np.zeros(int(0.25 * SR), np.float32))
    tight = np.concatenate(parts)
    tmp = f"{ROOT}/voice_hi/tight.wav"
    sf.write(tmp, tight, SR, subtype="FLOAT")
    fast = subprocess.run(["ffmpeg", "-v", "error", "-i", tmp, "-af", f"atempo={TEMPO}", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                          capture_output=True, check=True).stdout
    os.remove(tmp)
    v = np.concatenate([np.zeros(int(LEAD * SR), np.float32), np.frombuffer(fast, np.float32)])
    sf.write(f"{ROOT}/voice_hi/voice.wav", v, SR, subtype="PCM_16")
    total = len(v) / SR
    print(f"source {len(a) / SR:.2f} s -> tightened {len(tight) / SR:.2f} s -> x{TEMPO} {total:.2f} s (with lead)")

    lines = []
    for lid, a, ns in zip(IDS, al, newsegs):
        words = [w for w in a["text"].split() if norm(w)]
        # spoken time only: place words by cumulative syllables along the speech, then map back
        segs = [(s / TEMPO + LEAD, e / TEMPO + LEAD) for s, e in ns]
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
