"""Original synthesized score + SFX for the wristwatch short, mixed under voice/voice.wav -> audio/mix.wav (48k stereo).
Every SFX is placed from the same timing as the picture (balance beats, quartz seconds, flashes, labels)."""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 75.0
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

# ---------------- timing shared with the picture (mirror of timeline.ts) ----------------
S = dict(s1=0, s2=6.0, s3=15.0, s4=28.0, s5=40.2, s6=52.1, s7=65.0)
FLASHES = [6.0, 15.0, 40.2, 52.1, 65.0]
def fbal(t):
    t = np.asarray(t)
    return np.where(t < S["s4"] - 0.6, 2.5, np.where(t < S["s4"] + 0.4, 2.5 + (0.5 - 2.5) * sstep(S["s4"] - 0.6, S["s4"] + 0.4, t),
            np.where(t < S["s5"] - 0.5, 0.5, 0.5 + (2.5 - 0.5) * sstep(S["s5"] - 0.5, S["s5"] + 0.5, t))))
dt = 1 / 2000; tg = np.arange(0, DUR, dt); phase = np.cumsum(fbal(tg + dt / 2)) * dt
beats = 2 * phase + 0.07
beat_times = tg[1:][np.floor(beats[1:]) > np.floor(beats[:-1])]
def hand_rate(t):
    t = np.asarray(t, float)
    r = np.ones_like(t)
    r = np.where((t >= 43.2) & (t < 45.3), 1 + 19 * sstep(43.2, 43.8, t), r)
    r = np.where((t >= 45.3) & (t < 47.4), 20 + 480 * sstep(45.2, 45.8, t), r)
    r = np.where((t >= 47.4) & (t < 51.0), 500 + 3100 * sstep(47.3, 47.9, t), r)
    r = np.where((t >= 51.0), 3600 + (1 - 3600) * sstep(51.0, 51.8, t), r)
    return r

LABEL_T = [9.3, 9.8, 10.4, 11.2, 17.4, 24.2, 28.7, 30.0, 33.9, 35.0, 43.9, 46.0, 48.3, 53.9, 54.7, 57.3, 61.7, 65.8, 66.3]
CHIP_T = [6.3, 15.3, 28.3, 40.5, 52.4, 65.4]

def main():
    sfx, mus = Bus(), Bus()
    # ---- SFX ----
    sfx.add(boom(0.9), 0.0); sfx.add(riser(1.4, 0.25), 4.5)
    for i, ft in enumerate(FLASHES):
        sfx.add(whoosh(0.9, 0.55), ft - 0.55, pan=(-0.4 if i % 2 else 0.4)); sfx.add(boom(0.25), ft)
    for bt in beat_times:
        if bt < S["s2"]: g = 0.10 if bt < 4.2 else 0.10 + 0.25 * min(1, (bt - 4.2) / 1.5)
        elif bt < S["s3"]: g = 0.0
        elif bt < S["s4"] - 0.3: g = 0.13
        elif bt < S["s5"]: g = 0.55
        elif bt < S["s5"] + 2.8: g = 0.12
        else: g = 0.0
        if g > 0:
            k = int(round(beats[int(bt / dt)])) % 2
            slow = S["s4"] - 0.3 <= bt < S["s5"]
            sfx.add(tick(g, 3800 if k else 3300, 0.006 if not slow else 0.012, 1400 if k else 1100), bt, pan=0.25 if k else -0.25)
            if slow: sfx.add(clink(100 if k else 98, 0.06), bt + 0.004)
    # exploded view
    for i, tt0 in enumerate([8.65, 8.95, 9.25, 9.6, 10.0]): sfx.add(clink(92 + i * 2, 0.12), tt0, pan=(i - 2) * 0.3)
    sfx.add(riser(2.0, 0.18, 400, 6000), 8.6)
    for lt in LABEL_T: sfx.add(pop(0.22), lt)
    for ct in CHIP_T: sfx.add(pop(0.25, 400, 900), ct); sfx.add(bell(91, 0.8, 0.05), ct)
    # winding the crown: ratchet clicks speeding up
    t0 = 20.2
    while t0 < 23.0:
        sfx.add(ratchet(0.35), t0, pan=-0.2); t0 += 0.09 - 0.03 * (t0 - 20.2) / 2.8
    sfx.add(riser(2.6, 0.16, 200, 2500), 20.4)
    sfx.add(shimmer(4.6, 0.05, 84, 100, 22), 23.1)
    # time-lapse whir
    sfx.add(whir(45.2, 51.6, hand_rate, 0.07), 45.2)
    sfx.add(riser(1.2, 0.12), 44.3)
    # quartz
    sfx.add(hum(8.6, 0.05), 54.3)
    sfx.add(zap(0.25), 54.4); sfx.add(zap(0.18), 54.9)
    sfx.add(crystal_ring(4.5, 0.035), 56.8)
    for i in range(36):
        tb = 57.4 + 2.4 * (i / 36) ** 0.7
        sfx.add(blip(84 + (i % 12), 0.05), tb)
    sfx.add(bell(96, 1.8, 0.16), 59.85); sfx.add(bell(103, 1.5, 0.08), 59.85)
    for s_ in range(61, 66):
        tt0 = s_ - 0.0 + (4 * 3600 + 50 * 60 + 2) % 1
        if tt0 < 65.0: sfx.add(tick(0.45, 4500, 0.004, 1800), tt0); sfx.add(zap(0.06), tt0 - 0.01)
    # ending
    sfx.add(shimmer(3.0, 0.07, 86, 104, 26), 65.1)
    sfx.add(pop(0.4, 300, 900), 70.15); sfx.add(pop(0.35, 900, 1400), 72.8); sfx.add(clapish(0.2), 72.8)
    sfx.add(bell(93, 2.0, 0.18), 73.0); sfx.add(bell(100, 1.6, 0.09), 73.05)

    # ---- music: D minor -> F major lift; 96 bpm ----
    bpm = 96; beat = 60 / bpm; bar = 4 * beat
    prog = [(50, "m"), (46, "M"), (41, "M"), (48, "M")]  # Dm Bb F C
    def chord(r, k): return [r, r + (3 if k == "m" else 4), r + 7]
    # hook pad
    mus.add(pad([50, 57, 62, 65], 6.5, 0.18, 1000, 1.5, 1.5), 0.0)
    nbar = int((S["s7"] + 10) / bar) + 1
    for b in range(nbar):
        tb = b * bar
        if tb < 5.9 or tb > DUR: continue
        r, k = prog[b % 4]
        if tb >= S["s7"] - 0.01: r, k = prog[(b + 2) % 4]
        ch = chord(r, k)
        slow = S["s4"] <= tb < S["s5"]
        quartz = S["s6"] <= tb < S["s7"]
        mus.add(pad([n + 12 for n in ch], bar + 0.6, 0.11 if not slow else 0.08, 1300 if not quartz else 2200, 0.3, 0.6), tb)
        mus.add(sub(r - 12, bar * 0.95, 0.20), tb)
        for q in range(8):
            if slow and q % 2: continue
            nt = ch[(q * 2 + q // 3) % 3] + 24 + (12 if q in (3, 7) else 0)
            if quartz: mus.add(np.sign(fmpluck(nt, 0.25, 1.0, 1.0, 0.1)) * 0.25 * np.exp(-t_(0.25) / 0.08), tb + q * beat / 2, 0.06, pan=0.4 if q % 2 else -0.4)
            else: mus.add(fmpluck(nt, 0.6, 0.11 if not slow else 0.08, 1.6, 0.3), tb + q * beat / 2, pan=0.35 if q % 2 else -0.35)
        if not slow and tb >= S["s2"] + 2.5:
            for q in range(4): mus.add(kick(0.28 if q % 2 == 0 else 0.0), tb + q * beat)
            for q in range(8): mus.add(hat(0.05), tb + q * beat / 2 + beat / 4)
        if S["s5"] + 3 <= tb < S["s6"]:
            mus.add(clapish(0.07), tb + beat); mus.add(clapish(0.07), tb + 3 * beat)
    # ending: bright bells
    for i, m in enumerate([74, 77, 81, 84, 86]): mus.add(bell(m, 2.5, 0.07), 65.2 + i * 0.25)
    mus.add(pad([53, 57, 60, 65, 69], 10.0, 0.16, 2400, 0.5, 2.5), 65.0)

    music = reverb(mus.st(), 2.4, 0.35, 3)
    fx = reverb(sfx.st(), 1.4, 0.18, 4)
    voice, vsr = sf.read(f"{ROOT}/voice/voice.wav", dtype="float64")
    assert vsr == SR
    voice = voice[:N]; voice = np.pad(voice, (0, N - len(voice)))
    # voice polish: gentle EQ + light compression + small room
    v = hp(voice, 90); v = v + 0.25 * bp(v, 2500, 5000)
    env = np.sqrt(np.abs(lp(v ** 2, 8))); g = np.where(env > 0.12, (0.12 / np.maximum(env, 1e-9)) ** 0.4, 1.0); v = v * g
    v /= np.max(np.abs(v)) + 1e-9
    vst = reverb(np.stack([v, v], 1), 0.8, 0.08, 9)
    # ducking: music -9 dB under the voice
    act = lp(np.abs(voice), 6); act = np.clip(act / (np.max(act) * 0.15), 0, 1)
    duck = 1 - 0.65 * lp(act, 3)
    music *= duck[:, None]
    mix = 0.95 * vst + 0.62 * music + 0.9 * fx
    # loudness to about -14 LUFS (simple RMS-based), true-peak guard
    rms = np.sqrt(np.mean(mix ** 2)); mix *= 10 ** (-15.5 / 20) / rms
    mix = np.tanh(mix * 1.1) / 1.1  # gentle soft clip; final loudness via ffmpeg loudnorm
    mix *= 0.89 / np.max(np.abs(mix))
    fi = int(0.02 * SR); fo = int(0.6 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None]; mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    os.makedirs(f"{ROOT}/audio", exist_ok=True)
    sf.write(f"{ROOT}/audio/mix_pre.wav", mix.astype(np.float32), SR, subtype="PCM_24")
    sf.write(f"{ROOT}/audio/music.wav", (music * 0.62).astype(np.float32), SR)
    sf.write(f"{ROOT}/audio/sfx.wav", (fx * 0.9).astype(np.float32), SR)
    print("beats", len(beat_times), "peak", float(np.max(np.abs(mix))))

main()
