"""Original synthesized score + SFX for the wristwatch short, mixed under voice/voice.wav -> audio/mix.wav (48k stereo).
Every SFX is placed from the same timing as the picture (balance beats, quartz seconds, flashes, labels)."""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 69.0
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(5)

def t_(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def adsr(d, a=0.01, r=0.2):
    n = int(d * SR); e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, min(n - na, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr); return e
def sstep(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * u * (u * (u * 6 - 15) + 10)

class Bus:
    def __init__(self): self.L = np.zeros(N + SR * 4); self.R = np.zeros(N + SR * 4)
    def add(self, x, t0, g=1.0, pan=0.0):
        s = int(t0 * SR)
        if s < 0: x = x[-s:]; s = 0
        e = min(len(self.L), s + len(x)); x = x[: e - s]
        self.L[s:e] += x * g * np.sqrt(0.5 * (1 - pan)); self.R[s:e] += x * g * np.sqrt(0.5 * (1 + pan))
    def st(self): return np.stack([self.L[:N], self.R[:N]], 1)

def reverb(x, sec=2.2, wet=0.3, seed=1):
    r = np.random.default_rng(seed); n = int(sec * SR); tt = np.arange(n) / SR
    irL = r.standard_normal(n) * np.exp(-tt / (sec / 5)); irR = r.standard_normal(n) * np.exp(-tt / (sec / 5))
    irL = lp(irL, 6000); irR = lp(irR, 6000)
    L = fftconvolve(x[:, 0], irL)[: len(x)]; R = fftconvolve(x[:, 1], irR)[: len(x)]
    w = np.stack([L, R], 1); w /= np.max(np.abs(w)) + 1e-9; w *= np.max(np.abs(x)) + 1e-9
    return x * (1 - wet * 0.3) + w * wet

# ---------------- instruments ----------------
def pad(ms, d, v=1.0, bright=1600, a=1.2, r=1.5):
    tt = t_(d); x = np.zeros_like(tt)
    for m in ms:
        for det in (-0.07, 0.0, 0.07):
            f = midi(m) * 2 ** (det / 12); ph = (f * tt + rng.uniform()) % 1.0; x += (2 * ph - 1)
    return v * lp(x / (3 * len(ms)), bright) * adsr(d, a, r)
def fmpluck(m, d=0.7, v=1.0, idx=2.0, dec=0.35):
    f = midi(m); tt = t_(d)
    mod = idx * np.exp(-tt / 0.12) * np.sin(2 * np.pi * f * 2 * tt)
    return v * np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt / dec) * adsr(d, 0.002, 0.05)
def bell(m, d=2.5, v=1.0):
    f = midi(m); tt = t_(d); x = np.zeros_like(tt)
    for k, a, dec in ((1, 1, 1.4), (2.76, 0.45, 0.6), (5.4, 0.22, 0.3), (8.93, 0.1, 0.15)): x += a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / dec)
    return v * x * adsr(d, 0.002, 0.3)
def sub(m, d, v=1.0):
    f = midi(m); tt = t_(d); return v * (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(4 * np.pi * f * tt)) * adsr(d, 0.02, 0.15)
def kick(v=1.0):
    tt = t_(0.4); f = 45 + 110 * np.exp(-tt / 0.035); return v * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
def hat(v=1.0): return v * hp(rng.standard_normal(int(0.06 * SR)), 7000) * np.exp(-t_(0.06) / 0.015)
def clapish(v=1.0): tt = t_(0.2); return v * bp(rng.standard_normal(len(tt)), 1200, 6000) * np.exp(-tt / 0.05)
def boom(v=1.0):
    tt = t_(3.0); f = 32 + 40 * np.exp(-tt / 0.3)
    return v * (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 1.1) + 0.3 * lp(rng.standard_normal(len(tt)), 200) * np.exp(-tt / 0.6))
def riser(d, v=1.0, f0=300, f1=3000):
    tt = t_(d); nz = rng.standard_normal(len(tt)); fc = f0 * (f1 / f0) ** (tt / d)
    out = np.zeros_like(tt); blk = 2400
    for i in range(0, len(tt), blk):
        c = fc[min(i, len(fc) - 1)]; out[i:i + blk] = bp(nz[max(0, i - 4800):i + blk], c * 0.7, min(c * 1.4, 20000))[-len(nz[i:i + blk]):]
    return v * out * (tt / d) ** 2
def whoosh(d=0.8, v=1.0):
    tt = t_(d); nz = rng.standard_normal(len(tt)); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return v * (lp(nz, 1400) * 0.8 + bp(nz, 1500, 5000) * 0.3) * e
# watch sounds
def tick(v=1.0, f=3800, dec=0.006, body=1400):
    tt = t_(0.08); click = hp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt / dec)
    ring = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.02) * 0.5 + np.sin(2 * np.pi * body * tt) * np.exp(-tt / 0.012) * 0.6
    return v * (click + ring)
def ratchet(v=1.0): return tick(v, 5200, 0.003, 2600)
def clink(m=96, v=1.0):
    f = midi(m); tt = t_(0.6); x = sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt / dd) for k, a, dd in ((1, 1, 0.25), (2.4, 0.6, 0.12), (4.1, 0.3, 0.06)))
    return v * (x + 0.5 * hp(rng.standard_normal(len(tt)), 4000) * np.exp(-tt / 0.004))
def pop(v=1.0, f0=700, f1=1300):
    tt = t_(0.12); f = f0 + (f1 - f0) * (tt / 0.12); return v * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.035)
def shimmer(d, v=1.0, lo=88, hi=104, n=30):
    out = np.zeros(int(d * SR))
    for i in range(n):
        s = int(rng.uniform(0, d - 0.4) * SR); b = bell(int(rng.integers(lo, hi)), 0.5, 1.0)
        out[s:s + len(b)] += b[: len(out) - s] * rng.uniform(0.3, 1.0)
    return v * out
def hum(d, v=1.0):
    tt = t_(d); x = np.sin(2 * np.pi * 100 * tt) + 0.5 * np.sin(2 * np.pi * 200 * tt) + 0.25 * np.sign(np.sin(2 * np.pi * 50 * tt)) * 0.3
    x += 0.15 * bp(rng.standard_normal(len(tt)), 3000, 8000) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt))
    return v * lp(x, 2500) * adsr(d, 0.4, 0.4)
def zap(v=1.0):
    tt = t_(0.18); f = 2400 * np.exp(-tt / 0.05) + 300
    return v * (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 + bp(rng.standard_normal(len(tt)), 2000, 9000)) * np.exp(-tt / 0.05)
def crystal_ring(d, v=1.0):
    tt = t_(d); f = 3150; trem = 0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * tt)
    return v * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.01 * tt)) * trem * adsr(d, 0.3, 0.5)
def blip(m, v=1.0): tt = t_(0.05); return v * np.sign(np.sin(2 * np.pi * midi(m) * tt)) * 0.3 * np.exp(-tt / 0.02)
def whir(t0, t1, rate_fn, v=1.0):
    tt = np.arange(int((t1 - t0) * SR)) / SR + t0; r = rate_fn(tt)
    f = 180 + 900 * np.log10(np.maximum(r, 1)) / np.log10(3600)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sign(np.sin(ph * 12)) * 0.2 + np.sin(ph)) * (0.4 + 0.6 * np.log10(np.maximum(r, 1)) / np.log10(3600))
    return v * lp(x, 3000) * adsr(len(tt) / SR, 0.3, 0.6)


S = dict(s1=0, s2=6.2, s3=16.1, s4=24.7, s5=39.25, s6=45.15, s7=60.5)
FLASHES = [6.2, 16.1, 24.7, 39.25, 45.15, 60.5]
OFF = [(32.0, 34.6), (36.6, 37.6), (38.5, 39.4)]
TIPS = [(46.98, False), (49.07, False), (51.94, True), (54.61, True), (57.72, False)]
LABEL_T = [8.0, 10.4, 17.0, 28.0, 29.4, 36.6, 39.7, 42.0]
CHIP_T = [6.5, 16.4, 25.0, 39.55, 45.45]

def sizzle(d, v=1.0):
    tt = t_(d); nz = rng.standard_normal(len(tt)); crack = (rng.random(len(tt)) > 0.9993) * rng.uniform(-1, 1, len(tt))
    return v * (bp(nz, 3000, 9000) * 0.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt)) + lp(crack, 6000) * 4) * adsr(d, 0.3, 0.4)
def hiss(d, v=1.0):
    tt = t_(d); return v * bp(rng.standard_normal(len(tt)), 2500, 12000) * np.exp(-tt / (d * 0.45)) * adsr(d, 0.02, 0.2)
def click(v=1.0): return tick(v, 2400, 0.004, 900)
def buzz(v=1.0):
    tt = t_(0.35); return v * lp(np.sign(np.sin(2 * np.pi * 140 * tt)) * 0.5, 1800) * adsr(0.35, 0.01, 0.08)
def ding(v=1.0): return bell(88, 1.2, v) + bell(95, 1.2, v * 0.5)
def crackle(d, v=1.0):
    tt = t_(d); x = (rng.random(len(tt)) > 0.997) * rng.uniform(-1, 1, len(tt)); return v * hp(lp(x, 9000), 1500) * 6 * adsr(d, 0.01, 0.1)

def main():
    sfx, mus = Bus(), Bus()
    sfx.add(boom(0.7), 0.0)
    sfx.add(hiss(1.4, 0.18), 1.2); sfx.add(hiss(1.6, 0.16), 3.6); sfx.add(whoosh(1.6, 0.25), 0.6)
    for i, ft in enumerate(FLASHES): sfx.add(whoosh(0.9, 0.5), ft - 0.55, pan=(-0.4 if i % 2 else 0.4)); sfx.add(boom(0.2), ft)
    for lt in LABEL_T: sfx.add(pop(0.22), lt)
    for ct in CHIP_T: sfx.add(pop(0.25, 400, 900), ct); sfx.add(bell(91, 0.8, 0.05), ct)
    # electricity on + heating
    sfx.add(zap(0.3), 10.3); sfx.add(hum(5.6, 0.05), 10.3); sfx.add(sizzle(5.0, 0.05), 11.0)
    for tt in (10.4, 12.05, 13.85): sfx.add(pop(0.25, 500, 1100), tt)
    # pressing pass
    sfx.add(whoosh(4.0, 0.12), 20.0); sfx.add(hiss(2.0, 0.12), 21.0); sfx.add(sizzle(4.0, 0.035), 20.2)
    sfx.add(bell(96, 1.4, 0.08), 23.3)
    # thermostat: hum while on, click on every switch
    on_spans = [(24.7, 32.0), (34.6, 36.6), (37.6, 38.5)]
    for a, b in on_spans: sfx.add(hum(b - a, 0.04), a)
    for a, b in OFF: sfx.add(click(0.55), a); sfx.add(zap(0.08), a); sfx.add(click(0.45), b)
    # steam
    sfx.add(hiss(2.5, 0.25), 40.4); sfx.add(hiss(2.2, 0.22), 42.2); sfx.add(hiss(1.8, 0.16), 43.8)
    for k in range(5): sfx.add(clink(100 + k, 0.03), 39.8 + k * 0.55)
    # safety cards
    for a, good in TIPS:
        sfx.add(pop(0.3, 350, 900), a - 0.05)
        if good: sfx.add(ding(0.14), a + 0.45)
        else: sfx.add(buzz(0.12), a + 0.45)
    sfx.add(crackle(2.5, 0.12), 49.1); sfx.add(zap(0.2), 49.3); sfx.add(zap(0.15), 50.4)
    sfx.add(pop(0.4, 300, 700), 52.6); sfx.add(whoosh(0.6, 0.2), 54.9); sfx.add(clink(84, 0.15), 55.8); sfx.add(click(0.5), 56.3)
    # ending
    sfx.add(shimmer(3.0, 0.07, 86, 104, 26), 60.6); sfx.add(ding(0.16), 60.9)
    sfx.add(pop(0.4, 300, 900), 64.0); sfx.add(pop(0.35, 900, 1400), 66.6); sfx.add(clapish(0.2), 66.6)
    sfx.add(bell(93, 2.0, 0.18), 66.8); sfx.add(bell(100, 1.6, 0.09), 66.85)

    # music: bright, curious, C major / A minor, 104 bpm
    bpm = 104; beat = 60 / bpm; bar = 4 * beat
    prog = [(48, "M"), (45, "m"), (41, "M"), (43, "M")]
    def chord(r, k): return [r, r + (3 if k == "m" else 4), r + 7]
    mus.add(pad([48, 55, 60, 64], 6.5, 0.16, 1100, 1.2, 1.2), 0.0)
    for b in range(int(DUR / bar) + 1):
        tb = b * bar
        if tb >= DUR: break
        r, k = prog[b % 4]; ch = chord(r, k)
        calm = S["s4"] <= tb < S["s5"]
        safety = S["s6"] <= tb < S["s7"]
        mus.add(pad([n + 12 for n in ch], bar + 0.6, 0.10, 1500, 0.3, 0.6), tb)
        mus.add(sub(r - 12, bar * 0.95, 0.2), tb)
        for q in range(8):
            if calm and q % 2: continue
            nt = ch[(q * 2 + q // 3) % 3] + 24 + (12 if q in (3, 7) else 0)
            mus.add(fmpluck(nt, 0.5, 0.10 if not calm else 0.07, 1.4, 0.25), tb + q * beat / 2, pan=0.35 if q % 2 else -0.35)
        if tb >= 2.0 and not calm:
            for q in range(4): mus.add(kick(0.26 if q % 2 == 0 else 0.0), tb + q * beat)
            for q in range(8): mus.add(hat(0.045), tb + q * beat / 2 + beat / 4)
            if safety: mus.add(clapish(0.06), tb + beat); mus.add(clapish(0.06), tb + 3 * beat)
    for i, m in enumerate([72, 76, 79, 84, 88]): mus.add(bell(m, 2.5, 0.07), 60.6 + i * 0.25)

    music = reverb(mus.st(), 2.2, 0.32, 3); fx = reverb(sfx.st(), 1.2, 0.16, 4)
    voice, vsr = sf.read(f"{ROOT}/voice/voice.wav", dtype="float64"); voice = voice[:N]; voice = np.pad(voice, (0, N - len(voice)))
    v = hp(voice, 90); v = v + 0.25 * bp(v, 2500, 5000)
    env_ = np.sqrt(np.abs(lp(v ** 2, 8))); g = np.where(env_ > 0.12, (0.12 / np.maximum(env_, 1e-9)) ** 0.4, 1.0); v = v * g; v /= np.max(np.abs(v)) + 1e-9
    vst = reverb(np.stack([v, v], 1), 0.8, 0.08, 9)
    act = lp(np.abs(voice), 6); act = np.clip(act / (np.max(act) * 0.15), 0, 1); duck = 1 - 0.65 * lp(act, 3); music *= duck[:, None]
    mix = 0.95 * vst + 0.62 * music + 0.9 * fx
    rms = np.sqrt(np.mean(mix ** 2)); mix *= 10 ** (-15.5 / 20) / rms
    mix = np.tanh(mix * 1.1) / 1.1; mix *= 0.89 / np.max(np.abs(mix))
    fi = int(0.02 * SR); fo = int(0.6 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]; mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    os.makedirs(f"{ROOT}/audio", exist_ok=True); sf.write(f"{ROOT}/audio/mix_pre.wav", mix.astype(np.float32), SR, subtype="PCM_24")
    print("ok")

main()
