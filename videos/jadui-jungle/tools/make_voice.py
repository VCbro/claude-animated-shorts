"""Build voice.wav (48 kHz) + lines.json (absolute word times) + src/lines.ts from the script table below."""
import json, sys, os, re
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, fftconvolve

sys.path.insert(0, os.path.dirname(__file__))
import piper_tts as P

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TOTAL = 88.0

VOICES = {  # piper model, length scale, pitch factor (resample: >1 = higher, younger), reverb, gain
    "narrator": ("rohan-medium", 1.04, 1.0, 0.08, 0.72),
    "chintu": ("priyamvada-medium", 0.98, 1.13, 0.03, 0.74),
    "sheru": ("priyamvada-medium", 0.92, 1.24, 0.03, 0.70),
    "tree": ("pratham-medium", 1.30, 0.86, 0.30, 0.78),
}

LINES = [  # (start s, speaker, text)
    (1.4, "narrator", "एक समय की बात है, एक छोटे से गाँव में चिंटू नाम का एक प्यारा बच्चा रहता था।"),
    (10.9, "chintu", "अरे! ये आवाज़ कैसी?"),
    (13.6, "narrator", "एक दिन उसे जंगल में एक छोटा-सा शेर मिला, जिसका नाम था शेरू!"),
    (19.1, "sheru", "हा हा! नमस्ते, चिंटू!"),
    (21.6, "sheru", "चिंटू! हमारे जंगल की जादुई रोशनी गायब हो रही है!"),
    (26.4, "chintu", "चलो, पता लगाते हैं!"),
    (30.8, "chintu", "चलो शेरू, जल्दी!"),
    (38.6, "sheru", "वाह! कितना बड़ा पेड़!"),
    (43.4, "tree", "इस जंगल को बचाने के लिए ताकत नहीं, बल्कि सच्ची दोस्ती और दयालुता चाहिए!"),
    (53.3, "chintu", "हम मदद करेंगे!"),
    (56.0, "chintu", "डरो मत, छोटी चिड़िया।"),
    (61.2, "sheru", "आओ, मिलकर एक पौधा लगाएँ!"),
    (71.0, "narrator", "उस दिन चिंटू ने समझा कि दूसरों की मदद करना ही सबसे बड़ी जादुई ताकत है।"),
    (81.6, "narrator", "सीख: सच्ची दोस्ती और दया से दुनिया खूबसूरत बनती है!"),
]


def reverb(x, amt):
    if amt <= 0:
        return x
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    rng = np.random.default_rng(3)
    ir = rng.standard_normal(n) * np.exp(-t / 0.35)
    ir[0] = 0
    wet = np.zeros(len(x) + n); c = fftconvolve(x, ir)[: len(x) + n]; wet[: len(c)] = c
    wet /= np.max(np.abs(wet)) + 1e-9
    out = np.zeros(len(x) + n, np.float32)
    out[: len(x)] += x
    return (out + amt * wet * np.max(np.abs(x))).astype(np.float32)


PUNCT = re.compile(r"[,!?।:.]")


def word_times(a, sr, text):
    """Piper gives no word timings: map phrases (split at punctuation) onto the pauses in the audio,
    then spread each phrase's words over its span by length."""
    hop = int(sr * 0.01)
    env = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    on = env > max(env.max() * 0.06, 1e-4)
    idx = np.nonzero(on)[0]
    s0, s1 = idx[0], idx[-1] + 1
    gaps = []  # (length, start, end) of silent runs inside the speech
    i = s0
    while i < s1:
        if not on[i]:
            j = i
            while j < s1 and not on[j]:
                j += 1
            if j - i >= 8:
                gaps.append((j - i, i, j))
            i = j
        else:
            i += 1
    phrases = [p.split() for p in PUNCT.split(text) if p.strip()]
    k = len(phrases) - 1
    cut = sorted(sorted(gaps, reverse=True)[:k], key=lambda g: g[1])
    if len(cut) < k:  # fewer pauses than phrases: treat as one phrase
        phrases = [sum(phrases, [])]; cut = []
    bounds = [s0] + [x for g in cut for x in (g[1], g[2])] + [s1]
    out = []
    for p, (b0, b1) in zip(phrases, zip(bounds[0::2], bounds[1::2])):
        wts = [len(w) + 1.5 for w in p]
        tot = sum(wts); acc = 0.0
        for w, wt in zip(p, wts):
            out.append((round((b0 + (b1 - b0) * acc / tot) * 0.01, 3), w))
            acc += wt
    return out


def render(text, spk):
    model, ls, pf, rv, gain = VOICES[spk]
    a, sr = P.synth(text, model, length_scale=ls * pf)
    # 22050 -> 48000 with a resample pitch shift (pf>1 raises pitch and formants -> younger voice)
    a48 = resample_poly(a, 480, int(round(221 * pf))).astype(np.float32)
    words = word_times(a48, SR, text)
    a48 /= np.max(np.abs(a48)) + 1e-9
    a48 *= gain
    a48 = reverb(a48, rv)
    return a48, words


def main():
    out = np.zeros(int(TOTAL * SR) + SR, np.float32)
    meta = []
    for i, (t0, spk, text) in enumerate(LINES):
        a, words = render(text, spk)
        s = int(t0 * SR)
        out[s: s + len(a)] += a[: len(out) - s]
        # trim trailing silence for the end time
        nz = np.nonzero(np.abs(a) > 0.01)[0]
        dur = (nz[-1] / SR) if len(nz) else len(a) / SR
        meta.append({"i": i, "spk": spk, "text": text, "t0": t0, "t1": round(t0 + dur, 3),
                     "words": [{"t": round(t0 + t, 3), "w": w} for t, w in words]})
        print(f"{i:2d} {spk:8s} {t0:5.1f}-{t0 + dur:5.2f}  {text}")
        if i + 1 < len(LINES) and t0 + dur > LINES[i + 1][0] - 0.2:
            print("   !! overlaps next line")
    out = out[: int(TOTAL * SR)]
    os.makedirs(f"{ROOT}/voice", exist_ok=True)
    sf.write(f"{ROOT}/voice/voice.wav", out, SR, subtype="PCM_24")
    json.dump(meta, open(f"{ROOT}/voice/lines.json", "w"), ensure_ascii=False, indent=1)
    with open(f"{ROOT}/src/lines.ts", "w") as f:
        f.write("// generated by tools/make_voice.py\nexport type Line = { i: number; spk: string; text: string; t0: number; t1: number; words: { t: number; w: string }[] };\n")
        f.write("export const LINES: Line[] = " + json.dumps(meta, ensure_ascii=False) + ";\n")


main()
