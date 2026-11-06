"""Voice builder: script.json -> voice/voice.wav (48 kHz mono) + src/data/timeline.json.

Each line is synthesized on its own, trimmed, gently processed, then laid end to end with the line's `gap`
(seconds of silence before it). Because every line is its own clip, line start/end times are exact; word times
inside a line are estimated from syllable weight (good enough for word-by-word caption pops).

Backends (pick with --engine or env VOICE_ENGINE):
  kokoro     offline Kokoro-82M, most human offline Hindi (default). Voice $KOKORO_VOICE (hm_psi | hm_omega male,
             hf_alpha | hf_beta female). Model: models/kokoro-v1.0.onnx + voices-v1.0.bin (tools/get_models.sh)
  piper      offline neural Hindi (older, more robotic). Model: $PIPER_MODEL or models/hi_IN-rohan-medium.onnx
  sarvam     Sarvam AI Bulbul (best Hindi/Hinglish). Needs SARVAM_API_KEY + api.sarvam.ai allowed in network.
  eleven     ElevenLabs multilingual v2. Needs ELEVENLABS_API_KEY (+ ELEVEN_VOICE_ID) + api.elevenlabs.io allowed.
  omnivoice  VoiceStudio's OmniVoice engine (best Hindi, designed voice): bash tools/get_omnivoice.sh first.
  take       your own ONE-FILE recording: script.json "voice_src" + per-line "src": [[t0,t1],...] pieces (retakes skipped).
  files      your own recording: voice/lines/<id>.wav per line (record on phone, export wav).

script.json: {"pace": 1.0, "lines": [{"id": "L1", "tts": "<Devanagari for the voice>",
              "cap": "<Roman Hinglish caption>", "hl": ["words", "to", "highlight"], "red": ["danger words"],
              "gap": 0.15}]}
"""
import argparse, base64, io, json, os, re, subprocess, sys, tempfile, urllib.request
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def to48(a, sr):
    if sr == SR: return a.astype(np.float32)
    from math import gcd
    g = gcd(SR, sr)
    return resample_poly(a, SR // g, sr // g).astype(np.float32)


def tts_piper(text, pace):
    model = os.environ.get("PIPER_MODEL", os.path.join(ROOT, "models", "hi_IN-rohan-medium.onnx"))
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f: out = f.name
    # length_scale < 1 = faster. Reels pace is fast: ~0.84 for rohan.
    subprocess.run([sys.executable, "-m", "piper", "-m", model, "--length-scale", str(round(0.84 / pace, 3)),
                    "--sentence-silence", "0.08", "-f", out], input=text.encode(), check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    a, sr = sf.read(out, dtype="float32"); os.unlink(out)
    return to48(a if a.ndim == 1 else a.mean(1), sr)


_KOK = None
OV_DIR = os.environ.get("OMNIVOICE_DIR", "/home/user/vcbro/tools/omnivoice.cpp")
OV_INSTRUCT = os.environ.get("OMNIVOICE_INSTRUCT", "male, young adult, moderate pitch, indian accent")
OV_REF_TEXT = "नमस्ते दोस्तों। आज मैं तुम्हें एक ऐसी बात बताऊंगा, जो रोज़ तुम्हारे काम आएगी।"


def _ov(args, text, out):
    import subprocess
    cmd = [f"{OV_DIR}/build/omnivoice-tts", "--model", os.environ.get("OMNIVOICE_MODEL", f"{OV_DIR}/models/omnivoice-base-Q8_0.gguf"),
           "--codec", os.environ.get("OMNIVOICE_CODEC", f"{OV_DIR}/models/omnivoice-tokenizer-F32.gguf"),
           "--lang", os.environ.get("OMNIVOICE_LANG", "Hindi"), "-o", out] + args
    env = {**os.environ, "OMNIVOICE_THREADS": os.environ.get("OMNIVOICE_THREADS", str(os.cpu_count() or 4))}
    subprocess.run(cmd, input=text.encode("utf-8"), check=True, capture_output=True, env=env)


def tts_omnivoice(text, pace):
    """OmniVoice (VoiceStudio's engine, omnivoice.cpp GGUF on CPU). One designed voice is made once
    (voice/omni_ref.wav, from OMNIVOICE_INSTRUCT + fixed seed) and every line is cloned from it, so the
    narrator sounds identical across lines and videos. Put your own clip there to use your voice instead."""
    import tempfile
    ref = os.path.join(ROOT, "voice", "omni_ref.wav"); reft = ref + ".txt"
    if not os.path.exists(ref):
        os.makedirs(os.path.dirname(ref), exist_ok=True)
        _ov(["--instruct", OV_INSTRUCT, "--seed", os.environ.get("OMNIVOICE_SEED", "7")], OV_REF_TEXT, ref)
        open(reft, "w", encoding="utf-8").write(OV_REF_TEXT)
    with tempfile.TemporaryDirectory() as td:
        _ov(["--ref-wav", ref, "--ref-text", reft, "--seed", "7"], text, f"{td}/o.wav")
        a, sr = sf.read(f"{td}/o.wav", dtype="float32")
    a = to48(a if a.ndim == 1 else a.mean(1), sr)
    if pace != 1.0:
        import subprocess
        with tempfile.TemporaryDirectory() as td:
            sf.write(f"{td}/i.wav", a, SR)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{td}/i.wav", "-af", f"atempo={pace}", f"{td}/o.wav"], check=True)
            a, _ = sf.read(f"{td}/o.wav", dtype="float32")
    return a


def tts_kokoro(text, pace):
    global _KOK
    from kokoro_onnx import Kokoro
    if _KOK is None: _KOK = Kokoro(os.path.join(ROOT, "models", "kokoro-v1.0.onnx"), os.path.join(ROOT, "models", "voices-v1.0.bin"))
    a, sr = _KOK.create(text, voice=os.environ.get("KOKORO_VOICE", "hm_psi"), speed=round(1.08 * pace, 3), lang="hi")
    return to48(np.asarray(a, np.float32), sr)


def _post(url, body, headers):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=120) as r: return r.read()


def tts_sarvam(text, pace):
    key = os.environ["SARVAM_API_KEY"]
    body = {"text": text, "target_language_code": "hi-IN", "model": os.environ.get("SARVAM_MODEL", "bulbul:v2"),
            "speaker": os.environ.get("SARVAM_SPEAKER", "abhilash"), "pace": pace, "speech_sample_rate": 48000}
    r = json.loads(_post("https://api.sarvam.ai/text-to-speech", body, {"api-subscription-key": key}))
    a, sr = sf.read(io.BytesIO(base64.b64decode(r["audios"][0])), dtype="float32")
    return to48(a if a.ndim == 1 else a.mean(1), sr)


def tts_eleven(text, pace):
    key = os.environ["ELEVENLABS_API_KEY"]; vid = os.environ.get("ELEVEN_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
    body = {"text": text, "model_id": os.environ.get("ELEVEN_MODEL", "eleven_multilingual_v2"),
            "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "speed": pace}}
    raw = _post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=pcm_44100", body, {"xi-api-key": key})
    return to48(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, 44100)


def tts_take(line, S):
    """Your own recording: cut line['src'] = [[t0,t1],...] (seconds) out of S['voice_src'], join with micro gaps."""
    global _TAKE
    if "_TAKE" not in globals():
        a, sr = sf.read(os.path.join(ROOT, S["voice_src"]), dtype="float32"); _TAKE = to48(a if a.ndim == 1 else a.mean(1), sr)
    parts = []
    for t0, t1 in line["src"]:
        p = _TAKE[int(max(0, t0 - 0.04) * SR):int((t1 + 0.06) * SR)].copy()
        r = int(0.012 * SR); p[:r] *= np.linspace(0, 1, r); p[-r:] *= np.linspace(1, 0, r)
        parts += [p, np.zeros(int(0.07 * SR), np.float32)]
    a = np.concatenate(parts[:-1])
    # squeeze long pauses inside the line (keep 0.2 s), so the read feels tight like a reel
    hop = int(0.01 * SR); n = len(a) // hop
    env = np.array([np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean()) for i in range(n)])
    q = env < max(0.004, 0.05 * np.percentile(env, 95)); keep = np.ones(n, bool); i = 0
    while i < n:
        if q[i]:
            j = i
            while j < n and q[j]: j += 1
            if j - i > 26: keep[i + 10:j - 10] = False
            i = j
        else: i += 1
    return np.concatenate([a[k * hop:(k + 1) * hop] for k in range(n) if keep[k]])


def tts_files(line, pace):
    a, sr = sf.read(os.path.join(ROOT, "voice", "lines", f"{line['id']}.wav"), dtype="float32")
    return to48(a if a.ndim == 1 else a.mean(1), sr)


def trim(a, th=0.012, pad=0.03):
    nz = np.nonzero(np.abs(a) > th)[0]
    if not len(nz): return a
    s = max(0, nz[0] - int(pad * SR)); e = min(len(a), nz[-1] + int(pad * SR))
    return a[s:e]


def polish(a):
    """Reels voice chain: HPF 80, presence lift, soft compression, peak normalize."""
    a = sosfilt(butter(2, 80, "high", fs=SR, output="sos"), a)
    pres = sosfilt(butter(2, [2500, 6000], "band", fs=SR, output="sos"), a)
    a = a + 0.35 * pres
    # simple RMS compressor
    win = int(0.02 * SR); env = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, "same")) + 1e-6
    th = 0.08; gain = np.where(env > th, (th / env) ** 0.55, 1.0)
    a = a * gain
    return (a / (np.max(np.abs(a)) + 1e-9) * 0.89).astype(np.float32)


VOW = re.compile(r"[aeiouyAEIOUY]+")


def weight(w):  # syllable-ish weight of a Roman word
    w = re.sub(r"[^A-Za-z0-9₹]", "", w)
    if not w: return 0.5
    if w.isdigit() or w.startswith("₹"): return 0.9 * len(w)
    return max(1, len(VOW.findall(w))) + 0.15 * len(w)


def word_times(cap, t0, t1):
    words = cap.split()
    ws = np.array([weight(w) for w in words]); cum = np.concatenate([[0], np.cumsum(ws)]) / ws.sum()
    return [{"w": w, "t": round(t0 + (t1 - t0) * c, 3)} for w, c in zip(words, cum[:-1])]


def word_times_voiced(cap, a, t0):
    """Spread words over the voiced frames only (real recordings have pauses inside a line)."""
    hop = int(0.01 * SR); n = len(a) // hop
    env = np.array([np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean()) for i in range(n)])
    env = np.convolve(env, np.ones(5) / 5, "same")
    v = env > max(0.02, 0.12 * np.percentile(env, 95))
    cum = np.concatenate([[0], np.cumsum(v)]).astype(float); tot = cum[-1] or 1
    words = cap.split(); ws = np.array([weight(w) for w in words]); c = np.concatenate([[0], np.cumsum(ws)])[:-1] / ws.sum()
    out = []
    for w, k in zip(words, c):
        i = int(np.searchsorted(cum, k * tot + 0.5))  # first voiced frame of that word
        out.append({"w": w, "t": round(t0 + max(0, i - 1) * 0.01, 3)})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", default=os.environ.get("VOICE_ENGINE"))
    ap.add_argument("--script", default=os.path.join(ROOT, "script.json"))
    ap.add_argument("--lead", type=float, default=0.25, help="silence before the first line")
    ap.add_argument("--tail", type=float, default=1.6, help="silence after the last line (end card)")
    args = ap.parse_args()
    S = json.load(open(args.script, encoding="utf-8"))
    pace = S.get("pace", 1.0)
    args.engine = args.engine or S.get("engine", "kokoro")
    fn = {"omnivoice": tts_omnivoice, "kokoro": tts_kokoro, "piper": tts_piper, "sarvam": tts_sarvam, "eleven": tts_eleven}.get(args.engine)
    os.makedirs(os.path.join(ROOT, "voice", "cache"), exist_ok=True)
    clips, t, lines = [], args.lead, []
    for ln in S["lines"]:
        cache = os.path.join(ROOT, "voice", "cache", f"{args.engine}_{ln['id']}.wav")
        key = json.dumps([ln["tts"], pace, ln.get("src"), S.get("speed", 1)])
        if os.path.exists(cache) and open(cache + ".key", encoding="utf-8").read() == key:
            a, _ = sf.read(cache, dtype="float32")
        else:
            if args.engine == "take":
                a = trim(tts_take(ln, S), th=0.02, pad=0.04)
                sp = S.get("speed", 1.0)
                if sp != 1.0:  # pitch-preserving tempo via ffmpeg
                    import subprocess, tempfile
                    with tempfile.TemporaryDirectory() as td:
                        sf.write(f"{td}/i.wav", a, SR)
                        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{td}/i.wav", "-af", f"atempo={sp}", f"{td}/o.wav"], check=True)
                        a, _ = sf.read(f"{td}/o.wav", dtype="float32")
                a = polish(a)
            else:
                a = tts_files(ln, pace) if args.engine == "files" else fn(ln["tts"], pace * ln.get("pace", 1.0))
                a = polish(trim(a))
            sf.write(cache, a, SR); open(cache + ".key", "w", encoding="utf-8").write(key)
        t += ln.get("gap", 0.12)
        t0, t1 = t, t + len(a) / SR
        clips.append((t0, a)); t = t1
        lines.append({"id": ln["id"], "t0": round(t0, 3), "t1": round(t1, 3), "cap": ln["cap"],
                      "hl": ln.get("hl", []), "red": ln.get("red", []), "words": word_times_voiced(ln["cap"], a, t0) if args.engine == "take" else word_times(ln["cap"], t0, t1)})
        print(f"{ln['id']:>4} {t0:6.2f}-{t1:6.2f}  {ln['cap']}")
    total = t + args.tail
    out = np.zeros(int(total * SR) + 1, np.float32)
    for t0, a in clips:
        s = int(t0 * SR); out[s:s + len(a)] += a
    os.makedirs(os.path.join(ROOT, "voice"), exist_ok=True)
    sf.write(os.path.join(ROOT, "voice", "voice.wav"), out, SR)
    os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
    json.dump({"fps": 30, "duration": round(total, 3), "frames": int(np.ceil(total * 30)), "lines": lines},
              open(os.path.join(ROOT, "src", "data", "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"total {total:.2f}s  ({int(np.ceil(total * 30))} frames)  engine={args.engine}")


if __name__ == "__main__":
    main()
