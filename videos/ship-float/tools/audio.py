#!/usr/bin/env python3
"""Ship-float Short soundtrack: sea, underwater rumble, splash, horn, balance ding, alarm, flooding, sinking, pulse score."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(3)
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
def boom(g=1.0, f=45, d=2.0): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.5 * band(len(t), 20, 160)) * np.exp(-t * 2.5)
def whoosh(d, g=1.0, lo=250, hi=5000): x = band(int(d * SR), lo, hi); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def win(a, b, f=0.3): return np.clip((tg - a) / f, 0, 1) * np.clip((b - tg) / f, 0, 1)
A = lambda k: K[k]
# split-level moments (underwater rumble) vs above water (waves)
under = np.maximum.reduce([win(0, A('ship')), win(A('push'), A('floats') + 0.6), win(A('solid'), END + 1)])
waves = band(N, 150, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * tg / 3.3) ** 2)
amb += waves * (1 - 0.7 * under) * 0.20 + band(N, 30, 300) * under * 0.22 + band(N, 1500, 6000) * (1 - under) * 0.04
# nail: whistle down, plop + splash, bubbles
t = tt(0.5); add(sfx, 0.0, np.sin(2 * np.pi * np.cumsum(np.linspace(1400, 700, len(t))) / SR) * env(len(t), 0.02, 0.1), 0.08)
add(sfx, 0.5, boom(0.5, 120, 0.4)); add(sfx, 0.5, band(int(0.9 * SR), 400, 7000) * np.exp(-tt(0.9) * 5), 0.55)
for i in range(14): add(sfx, 0.7 + i * 0.13 + 0.05 * rng.random(), np.sin(2 * np.pi * (500 + 600 * rng.random()) * tt(0.06) * (1 + tt(0.06) * 8)) * np.exp(-tt(0.06) * 50), 0.15)
# ship reveal: horn + boom; why: whoosh + hit
add(sfx, A('ship') - 0.3, whoosh(0.6, 0.35))
t = tt(2.6); add(sfx, A('ship') + 0.2, (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220 * t) + 0.25 * np.sin(2 * np.pi * 330 * t)) * env(len(t), 0.15, 0.9), 0.22)
add(sfx, A('ship'), boom(0.6, 40, 2.5))
add(sfx, A('why') - 0.25, whoosh(0.35, 0.4, 800, 8000)); add(sfx, A('why'), boom(0.7, 55, 1.2))
# displacement: water push swell, arrows pulse
add(sfx, A('push') + 0.6, whoosh(2.5, 0.3, 80, 1500))
for i in range(5): add(sfx, A('up') + 0.3 + i * 0.7, boom(0.25, 70, 0.4))
# balance: rising tone with the counter, then a ding on equal
t = tt(3.2); add(sfx, A('equal') + 0.4, np.sin(2 * np.pi * np.cumsum(np.linspace(300, 900, len(t))) / SR) * env(len(t), 0.2, 0.2), 0.06)
for f, k in ((1318.5, 0), (1975.5, 0.08)): t = tt(1.6); add(sfx, A('floats') - 0.3 + k, np.sin(2 * np.pi * f * t) * np.exp(-t * 3), 0.16)
# solid nail: thud; hollow: metal resonance
add(sfx, A('solid'), boom(0.45, 80, 0.5))
t = tt(2.5); add(sfx, A('hollow'), (np.sin(2 * np.pi * 196 * t) + 0.6 * np.sin(2 * np.pi * 523 * t) + 0.3 * np.sin(2 * np.pi * 811 * t)) * np.exp(-t * 1.4), 0.12)
# hole: crack + alarm + rushing water; sink: groan + bubbles
add(sfx, A('hole'), band(int(0.3 * SR), 300, 6000) * np.exp(-tt(0.3) * 15), 0.6); add(sfx, A('hole'), boom(0.6, 50, 1))
for i in range(int((A('same') - A('hole')) / 0.55)): t = tt(0.4); add(sfx, A('hole') + 0.2 + i * 0.55, np.sign(np.sin(2 * np.pi * 620 * t)) * env(len(t), 0.01, 0.1), 0.05)
add(sfx, A('hole') + 0.3, band(int(4 * SR), 200, 3000) * env(int(4 * SR), 0.2, 1), 0.3)
t = tt(3); add(sfx, A('sink'), band(len(t), 40, 400) * np.sin(2 * np.pi * np.cumsum(np.linspace(70, 40, len(t))) / SR) * env(len(t), 0.3, 1), 0.5)
for i in range(20): add(sfx, A('sink') + i * 0.12, np.sin(2 * np.pi * (300 + 500 * rng.random()) * tt(0.07) * (1 + tt(0.07) * 8)) * np.exp(-tt(0.07) * 45), 0.12)
add(sfx, END - 1.2, whoosh(1.2, 0.3))                                     # riser back into the loop
# score: low drum pulse at 120 bpm + dark pad
beat = 0.5
for i in range(int(END / beat)):
    t0 = i * beat
    if i % 2 == 0: add(mus, t0, boom(0.5, 48, 0.4))
    else: add(mus, t0, band(int(0.06 * SR), 4000, 10000) * np.exp(-tt(0.06) * 50), 0.05)
pad = sum(np.sin(2 * np.pi * f * tg) for f in (55, 82.4, 110, 130.8)) * 0.03
mus += pad * np.interp(tg, [0, A('ship'), A('equal'), A('floats'), A('hole'), END], [0.5, 1, 0.8, 1, 1.2, 0.8])
# voice + mix (fast moving-average ducking)
w = os.path.join(ROOT, "audio/voice48.wav"); os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.wav"), "-ar", str(SR), "-ac", "1", w], check=True)
v = wavfile.read(w)[1].astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
k = int(0.25 * SR); cs = np.cumsum(np.concatenate([np.zeros(k // 2), np.abs(voice), np.zeros(k - k // 2)])); vact = np.clip((cs[k:] - cs[:-k])[:N] / k / (np.abs(voice).max() + 1e-9) * 6, 0, 1)
out = 0.95 * voice + mus * (1 - 0.5 * vact) * 0.55 + amb * (1 - 0.35 * vact) * 0.6 + sfx * (1 - 0.25 * vact) * 0.7
out = np.tanh(out * 1.15) / np.tanh(1.15)
st = np.stack([out, np.roll(out, 9)], 1)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
