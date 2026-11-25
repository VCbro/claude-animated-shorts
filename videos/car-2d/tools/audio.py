#!/usr/bin/env python3
"""Car-lightning Short soundtrack: rain, thunder cracks on every strike, electric crackle, alarm, dark pulse, ducked voice."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(9)
sfx = np.zeros(N); amb = np.zeros(N); mus = np.zeros(N)
def tt(d): return np.arange(int(d * SR)) / SR
def band(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def add(buf, t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j > i >= 0: buf[i:j] += g * x[:j - i]
def env(n, a, r):
    e = np.ones(n); ai = min(n, max(1, int(a * SR))); ri = min(max(1, n - ai), max(1, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def boom(g=1.0, f=40, d=2.0): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.6 * band(len(t), 20, 160)) * np.exp(-t * 2)
def thunder(g=1.0, d=3.5):     # sharp crack + long rolling rumble
    t = tt(d); crack = band(len(t), 1500, 12000) * np.exp(-t * 25)
    roll = band(len(t), 25, 400) * np.exp(-t * 0.9) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 0.9 * t))
    return g * (crack * 1.0 + roll * 1.3)
def crackle(d, g=1.0):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 90)):
        i = rng.integers(0, len(x) - 600); x[i:i + 600] += band(600, 2000, 12000) * np.exp(-np.arange(600) / 60) * rng.random()
    return g * x
A = lambda k: K[k]
# rain on the roof + street hiss
amb += band(N, 1500, 9000) * 0.22 + band(N, 200, 1200) * 0.10
for i in range(int(END * 60)): add(amb, i / 60 + rng.random() / 60, band(240, 2000, 8000) * np.exp(-np.arange(240) / 40), 0.12 * rng.random())
# strikes (same moments as the film)
for s, g in ((0.0, 1.0), (A('inside') + 0.9, 0.6), (A('km') + 0.6, 0.9), (A('next') + 0.9, 1.1)): add(sfx, s, thunder(g)); add(sfx, s, boom(0.8 * g))
add(sfx, END - 0.05, band(int(0.05 * SR), 1500, 12000) * np.exp(-tt(0.05) * 40), 0.8)        # crack right before the loop restarts
# tyres "wrong": buzzer; body reveal: metal ring; current: crackle along the shell; ground: sparks
t = tt(0.35); add(sfx, A('wrong'), np.sign(np.sin(2 * np.pi * 180 * t)) * env(len(t), 0.01, 0.08), 0.12)
t = tt(2.2); add(sfx, A('body'), (np.sin(2 * np.pi * 330 * t) + 0.5 * np.sin(2 * np.pi * 880 * t) + 0.3 * np.sin(2 * np.pi * 1320 * t)) * np.exp(-t * 1.6), 0.12)
add(sfx, A('current'), crackle(A('tips') - A('current'), 0.35) * env(int((A('tips') - A('current')) * SR), 0.2, 0.4))
t = tt(A('tips') - A('current')); add(sfx, A('current'), np.sin(2 * np.pi * 60 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 120 * t))) * env(len(t), 0.2, 0.4), 0.05)
add(sfx, A('ground'), boom(0.5, 55, 1)); add(sfx, A('ground'), crackle(1.2, 0.5))
# tips: soft ticks; windows: glass slide
for k, s in enumerate((A('tips') + 0.3, A('windows'), A('windows') + 1.0)): t = tt(0.25); add(sfx, s, np.sin(2 * np.pi * (880 + 220 * k) * t) * np.exp(-t * 18), 0.14)
# soft top danger: alarm pulses then the strike
for i in range(int((A('next') + 0.9 - A('roof')) / 0.45)): t = tt(0.3); add(sfx, A('roof') + i * 0.45, np.sin(2 * np.pi * 740 * t) * env(len(t), 0.01, 0.1), 0.07)
# score: dark pulse + low pad, cut at the hook strike, swell to the end
beat = 60 / 128
for i in range(int(END / beat)):
    t0 = i * beat
    if t0 < 1.2: continue
    if i % 2 == 0: add(mus, t0, boom(0.45, 46, 0.35))
    else: add(mus, t0, band(int(0.05 * SR), 5000, 11000) * np.exp(-tt(0.05) * 50), 0.05)
mus += sum(np.sin(2 * np.pi * f * tg) for f in (49, 73.4, 98, 116.5)) * 0.028 * np.clip((tg - 1.2) / 2, 0, 1)
# voice + mix
w = os.path.join(ROOT, "audio/voice48.wav"); os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.wav"), "-ar", str(SR), "-ac", "1", w], check=True)
v = wavfile.read(w)[1].astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
k = int(0.25 * SR); cs = np.cumsum(np.concatenate([np.zeros(k // 2), np.abs(voice), np.zeros(k - k // 2)])); vact = np.clip((cs[k:] - cs[:-k])[:N] / k / (np.abs(voice).max() + 1e-9) * 6, 0, 1)
out = 0.95 * voice + mus * (1 - 0.5 * vact) * 0.5 + amb * (1 - 0.45 * vact) * 0.5 + sfx * (1 - 0.2 * vact) * 0.75
out = np.tanh(out * 1.15) / np.tanh(1.15)
st = np.stack([out, np.roll(out, 9)], 1)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
