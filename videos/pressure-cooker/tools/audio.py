#!/usr/bin/env python3
"""Pressure-cooker Short soundtrack: gas hiss, lid clank, boiling, the whistle, the valve pop, a tense pulse, ducked voice."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(7)
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
def ramp(a, d): return np.clip((tg - a) / d, 0, 1)
def boom(g=1.0, f=50, d=1.5): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.5 * band(len(t), 20, 160)) * np.exp(-t * 3)
A = lambda k: K[k]
WH, POP = A('lift') + 0.7, A('valve') + 1.7

# ambience: room tone + gas flame hiss (always), boiling grows with the pressure section
amb += band(N, 80, 600) * 0.05 + band(N, 1500, 9000) * 0.05
boil = np.zeros(N)
for i in range(int(END * 30)):
    t0 = i / 30 + rng.random() / 30
    if t0 < A('press'): continue
    d = 0.04 + 0.05 * rng.random(); f = 300 + 900 * rng.random(); x = np.sin(2 * np.pi * f * tt(d) * (1 + tt(d) * 6)) * np.exp(-tt(d) * 60)
    add(boil, t0, x, 0.25 * rng.random())
amb += boil * (0.4 + 0.6 * ramp(A('more'), 1.5)) * (1 - 0.6 * ramp(A('clean'), 0.5))
# pressure hiss builds before the whistle and during the jam
amb += band(N, 2000, 9000) * (ramp(A('more'), 1.8) * (1 - ramp(WH, 0.1)) + ramp(A('jam') + 0.3, 2.0) * (1 - ramp(POP, 0.1))) * 0.18

# SFX
lid = A('lid') + 1.3
for k, d in ((0, 0), (0.12, 0.25)):
    t = tt(0.5); add(sfx, lid + k, (np.sin(2 * np.pi * 1180 * t) + 0.6 * np.sin(2 * np.pi * 2730 * t) + 0.3 * np.sin(2 * np.pi * 4410 * t)) * np.exp(-t * 14), 0.25 - d * 0.5)
add(sfx, lid + 0.25, boom(0.25, 70, 0.4))
# the whistle: a noisy, warbling high tone that rises then settles (first part in slow motion = lower and longer)
def whistle(d, f0, g):
    t = tt(d); f = f0 * (1 + 0.04 * np.sin(2 * np.pi * 7 * t)) * (0.85 + 0.15 * np.clip(t / 0.3, 0, 1))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR)
    return g * (tone * 0.6 + band(len(t), 1800, 9000) * 0.7) * env(len(t), 0.05, 0.6)
add(sfx, WH, whistle(2.6, 1900, 0.32))                 # slow-mo whistle
add(sfx, WH + 2.6, whistle(2.2, 2900, 0.3))            # full-speed whistle
add(sfx, WH - 0.05, boom(0.5, 60, 0.8))
# jam: heartbeat + red tension
for i in range(int((POP - A('jam')) / 0.8)): add(sfx, A('jam') + 0.4 + i * 0.8, boom(0.45, 46, 0.3)); add(sfx, A('jam') + 0.62 + i * 0.8, boom(0.3, 46, 0.3))
t = tt(POP - A('jam')); add(sfx, A('jam'), np.sin(2 * np.pi * np.cumsum(220 + 260 * (t / t[-1]) ** 2) / SR) * env(len(t), 0.5, 0.05) * 0.10)
# valve pop + sideways steam burst
add(sfx, POP, boom(0.9, 80, 0.6)); add(sfx, POP, band(int(0.12 * SR), 800, 8000) * np.exp(-tt(0.12) * 30) * 0.8)
add(sfx, POP + 0.05, band(int(2.4 * SR), 1500, 10000) * env(int(2.4 * SR), 0.02, 1.6) * 0.45)
# clean: a little sparkle, then the riser back into the loop
for i, f in enumerate((1568, 2093, 2637)): t = tt(0.6); add(sfx, A('clean') + 1.0 + i * 0.09, np.sin(2 * np.pi * f * t) * np.exp(-t * 6), 0.12)
t = tt(END - A('end')); add(sfx, A('end'), band(len(t), 400, 6000) * (t / t[-1]) ** 2 * 0.25)

# music: tense 140 bpm pulse in A minor, drops out for the slow-mo whistle, returns for the jam
beat = 60 / 140
for i in range(int(END / beat)):
    t0 = i * beat
    if WH - 0.2 < t0 < WH + 2.6: continue
    f = (110.0, 110.0, 130.8, 98.0)[(i // 8) % 4]
    t = tt(beat * 0.9); add(mus, t0, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 5), 0.16)
    if i % 2 == 0 and t0 > A('lid'): add(mus, t0, boom(0.35, 52, 0.25))
    if i % 2 == 1: add(mus, t0, band(int(0.05 * SR), 6000, 12000) * np.exp(-tt(0.05) * 60), 0.06)
mus *= 0.6 + 0.6 * np.interp(tg, [0, A('more'), WH, A('jam'), POP, A('clean'), END], [0.6, 1.0, 0.8, 1.0, 0.7, 0.6, 1.0])

# voice + mix
w = os.path.join(ROOT, "audio/voice48.wav"); os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", w], check=True)
v = wavfile.read(w)[1].astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
k = int(0.25 * SR); cs = np.cumsum(np.concatenate([np.zeros(k // 2), np.abs(voice), np.zeros(k - k // 2)])); ma = (cs[k:] - cs[:-k]) / k
vact = np.clip(ma[:N] / (np.abs(voice).max() + 1e-9) * 6, 0, 1)
out = 0.95 * voice + mus * (1 - 0.5 * vact) * 0.55 + amb * (1 - 0.35 * vact) * 0.6 + sfx * (1 - 0.25 * vact) * 0.75
out *= np.minimum(1, tg / 0.05)
out = np.tanh(out * 1.15) / np.tanh(1.15)
st = np.stack([out, np.roll(out, 9)], 1)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
