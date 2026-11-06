"""Sound for the explainer reel: original synthesized tension bed + SFX on picture cues + voice → public/mix.wav.

Inputs : voice/voice.wav (tools/voice.py), out/cues.json (node tools/cues.mjs), script.json (optional "music" block)
Output : public/mix.wav (48 kHz stereo, -14 LUFS integrated, -1 dBTP), audio/stems/*.wav, audio/cues.md

Bed: minor-key pulse at `bpm` (default 104) – sub drone + 16th filtered pluck arpeggio + soft kick/hat.
Reel tricks: the bed drops out for ~0.5 s on every impact (silence makes the hit land), risers into reveals,
whoosh on cuts, soft UI clicks on pops, voice-keyed ducking (-9 dB). Mix: voice 0 dB, music ≈ -17 dB under, SFX -8 dB.
"""
import json, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(11)


def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def t_(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)


class Bus:
    def __init__(self, n): self.x = np.zeros((n, 2), np.float32); self.n = n
    def add(self, sig, t0, g=1.0, pan=0.0):
        s = int(t0 * SR)
        if s < 0: sig = sig[-s:]; s = 0
        e = min(self.n, s + len(sig)); sig = sig[: e - s]
        if e <= s: return
        self.x[s:e, 0] += sig * g * np.sqrt(0.5 * (1 - pan)); self.x[s:e, 1] += sig * g * np.sqrt(0.5 * (1 + pan))


# ── instruments ──────────────────────────────────────────────────────────────
def pluck(m, d=0.22, bright=2400):
    t = t_(d); f = midi(m)
    saw = 2 * ((t * f) % 1) - 1 + 0.5 * (2 * ((t * f * 1.006) % 1) - 1)
    return lp(saw * np.exp(-t / 0.09), bright) * 0.5

def kick(d=0.4):
    t = t_(d); f = 40 + 90 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)

def hat(d=0.05):
    t = t_(d); return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / 0.012) * 0.4

def sub(m, d):
    t = t_(d); x = np.sin(2 * np.pi * midi(m) * t) + 0.25 * np.sin(4 * np.pi * midi(m) * t)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)
    return x * e * 0.6

def pad(ms, d, bright=900):
    t = t_(d); x = sum(np.sin(2 * np.pi * midi(m) * t * (1 + k * 0.003)) for m in ms for k in (-1, 1))
    e = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)
    return lp(x, bright) * e * 0.12

# ── sfx ──────────────────────────────────────────────────────────────────────
def whoosh(d=0.32):
    t = t_(d); n = rng.standard_normal(len(t)); k = t / d
    out = np.zeros_like(t)
    for i in range(0, len(t), 480):  # swept band-pass in blocks
        c = 400 + 5000 * (k[i] ** 1.5); seg = n[i:i + 480]
        out[i:i + 480] = bp(seg, c * 0.7, min(c * 1.4, 20000), 1)
    return out * np.sin(np.pi * k) ** 2 * 0.9

def impact():
    t = t_(1.2); f = 32 + 70 * np.exp(-t / 0.06)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    crack = lp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.03)
    return np.tanh(1.6 * (boom + 0.5 * crack)) * 0.9

def click():
    t = t_(0.07); return (np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.012) + 0.4 * np.sin(2 * np.pi * 3400 * t) * np.exp(-t / 0.005)) * 0.5

def riser(d=1.3):
    t = t_(d); k = t / d; n = rng.standard_normal(len(t)); out = np.zeros_like(t)
    for i in range(0, len(t), 480):
        c = 300 + 6000 * k[i] ** 2; out[i:i + 480] = bp(n[i:i + 480], c * 0.8, min(c * 1.25, 20000), 1)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 600 * k ** 2) / SR) * 0.25
    return (out + tone) * k ** 2.2 * 0.8


def env_follow(x, att=0.01, rel=0.25):
    a = np.abs(x); out = np.zeros_like(a); ka, kr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR)); v = 0.0
    # vectorized-ish: downsample for speed
    step = 240; a2 = a[: len(a) // step * step].reshape(-1, step).max(1); o2 = np.zeros_like(a2)
    ka, kr = np.exp(-step / (att * SR)), np.exp(-step / (rel * SR))
    for i, s in enumerate(a2): v = ka * v + (1 - ka) * s if s > v else kr * v + (1 - kr) * s; o2[i] = v
    return np.interp(np.arange(len(a)), np.arange(len(o2)) * step, o2)


def lufs(x):
    try:
        import pyloudnorm as pyln
        return pyln.Meter(SR).integrated_loudness(x)
    except ImportError:  # fallback: K-weight-ish RMS
        y = hp(x.mean(1) if x.ndim > 1 else x, 100); return 20 * np.log10(np.sqrt(np.mean(y ** 2)) + 1e-9) - 0.7


def main():
    S = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
    M = {"bpm": 104, "root": 50, "mode": "minor", "music_db": -15, "sfx_db": -8, **S.get("music", {})}
    cues = json.load(open(os.path.join(ROOT, "out", "cues.json")))
    voice, vsr = sf.read(os.path.join(ROOT, "voice", "voice.wav"), dtype="float32"); assert vsr == SR
    D = cues["duration"]; N = int(D * SR)
    voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
    mus, sfx = Bus(N), Bus(N)

    # ── music bed ──
    beat = 60 / M["bpm"]; r = M["root"]
    prog = [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -2, 2, 5]] if M["mode"] == "minor" else [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 5]]
    bar = 4 * beat; nb = int(np.ceil(D / bar)) + 1
    intro = cues["cuts"][0] if cues["cuts"] else 3.0  # sparse until the first cut
    for b in range(nb):
        t0 = b * bar; ch = prog[b % 4]
        mus.add(sub(r - 12 + ch[0], bar + 0.05), t0, 0.9)
        mus.add(pad([r + 12 + c for c in ch], bar + 0.6), t0, 0.8, 0.0)
        for s16 in range(16):
            ts = t0 + s16 * beat / 4
            if ts > D: break
            dense = ts > intro
            if dense or s16 % 4 == 0:
                m = r + 12 + ch[[0, 2, 1, 3, 2, 1, 3, 2][s16 % 8]] + (12 if s16 % 8 == 7 else 0)
                mus.add(pluck(m, bright=1500 + 1500 * dense), ts, 0.42 if s16 % 4 == 0 else 0.26, pan=0.3 * np.sin(s16))
            if dense and s16 % 2 == 0: mus.add(hat(), ts, 0.35 if s16 % 4 == 2 else 0.18, 0.4)
        if t0 > intro:
            for k in (0, 2): mus.add(kick(), t0 + k * beat, 0.8)
    # end: let it ring (cut bed 0.4 s before end, add final pad)
    m = mus.x
    # drop-outs on impacts: silence 0.05 s before → 0.55 s after, fast fade back
    g = np.ones(N)
    for ti in cues["impacts"]:
        s, e = int((ti - 0.08) * SR), int((ti + 0.55) * SR)
        g[max(0, s):min(N, e)] = 0
        f1 = int(0.25 * SR); g[min(N, e):min(N, e + f1)] = np.linspace(0, 1, max(0, min(N, e + f1) - min(N, e)))
    fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
    m = m * (g * fade)[:, None]

    # ── sfx ──
    for t in cues["cuts"]: sfx.add(whoosh(), t - 0.16, 0.5, pan=float(rng.uniform(-0.4, 0.4)))
    for t in cues["impacts"]: sfx.add(impact(), t, 1.0)
    for t in cues["pops"]: sfx.add(click(), t, 0.55, pan=float(rng.uniform(-0.3, 0.3)))
    for t in cues["risers"]: sfx.add(riser(), t - 1.3, 0.6)

    # ── ducking (voice-keyed) ──
    ev = env_follow(voice, 0.02, 0.3); duck = 1 - 0.65 * np.clip(ev / (np.percentile(ev, 95) + 1e-9), 0, 1)
    m = m * duck[:, None]
    def db(x): return 10 ** (x / 20)
    music = m / (np.max(np.abs(m)) + 1e-9) * db(M["music_db"] + 12)
    fx = sfx.x / (np.max(np.abs(sfx.x)) + 1e-9) * db(M["sfx_db"] + 8)
    v2 = np.stack([voice, voice], 1)
    mix = v2 + music * db(-12) + fx * db(-8)
    # loudness → -14 LUFS, soft limit at -1 dBTP
    gain = db(-14 - lufs(mix)); mix = mix * gain
    peak = db(-1.0); mix = np.where(np.abs(mix) > peak * 0.8, np.sign(mix) * (peak * 0.8 + (peak * 0.2) * np.tanh((np.abs(mix) - peak * 0.8) / (peak * 0.2))), mix)
    os.makedirs(os.path.join(ROOT, "audio", "stems"), exist_ok=True); os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    sf.write(os.path.join(ROOT, "public", "mix.wav"), mix.astype(np.float32), SR)
    for name, x in (("voice", v2 * gain), ("music", music * db(-12) * gain), ("sfx", fx * db(-8) * gain)):
        sf.write(os.path.join(ROOT, "audio", "stems", f"{name}.wav"), x.astype(np.float32), SR)
    with open(os.path.join(ROOT, "audio", "cues.md"), "w") as f:
        f.write(f"# Sound cues\nbpm {M['bpm']} root {M['root']} {M['mode']}\n\n")
        for k in ("cuts", "impacts", "pops", "risers"): f.write(f"- {k}: {', '.join(f'{t:.2f}' for t in cues[k])}\n")
    print(f"mix {D:.2f}s  LUFS {lufs(mix):.1f}  peak {20*np.log10(np.max(np.abs(mix))):.1f} dB")


if __name__ == "__main__":
    main()
