#!/usr/bin/env python3
"""Chenab Bridge soundtrack (numpy): mountain wind, a cinematic score with a flute-like pentatonic line,
construction / train / storm / quake sound design on anchors, narrator on top with ducking -> audio/mix.wav"""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(31)
sfx = np.zeros(N); amb = np.zeros(N); score = np.zeros(N)


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
def tone(d, f, g=1.0, a=0.01, r=0.3, harm=(1,)):
    t = tt(d); return g * sum(np.sin(2 * np.pi * f * h * t) / h for h in harm) * env(len(t), a, r)
def win(a, b, fa=1.0, fb=1.0): return np.clip((tg - a) / fa, 0, 1) * np.clip((b - tg) / fb, 0, 1)
def boom(g=1.0, f=42, d=3.0): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.5 * band(len(t), 20, 160)) * np.exp(-t * 2.0)
def whoosh(d, g=1.0): x = band(int(d * SR), 250, 5000); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def clank(g=1.0): t = tt(0.6); return g * tone(0.6, 210, 1, 0.001, 0.5, (1, 2.76, 5.4)) * np.exp(-t * 8)

# ---------------------------------------------------------------- ambience: mountain wind always, stronger in ch3
wind = band(N, 80, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * tg / 9.0) ** 2)
amb += wind * 0.10
amb += band(N, 200, 3000) * (0.6 + 0.4 * np.sin(2 * np.pi * tg / 3.1)) * win(K["c3_enemy"], K["c4"], 1.0, 1.5) * 0.30
amb += band(N, 200, 3000) * win(K["c3_stop"], K["c4"], 0.5, 1.5) * 0.18
amb += band(N, 400, 5000) * win(K["c5_cold"], K["c5_roads"] + 1, 1.0, 1.0) * 0.12
# train on the bridge (hook / title / 2025 / end): rumble + rail joints
def train(a, b, g):
    d = b - a; n = int(d * SR); x = band(n, 30, 300) * 0.6 + band(n, 300, 1500) * 0.12; t = 0.0
    while t < d:
        for off in (0.0, 0.12):
            i = int((t + off) * SR); k = band(int(0.04 * SR), 400, 1600) * np.exp(-tt(0.04) * 100)
            if i + len(k) < n: x[i:i + len(k)] += k * 0.9
        t += 0.7
    add(amb, a, x * env(n, 1.2, 1.5), g)
for a, b, g in ((0.5, K["c1"], 0.35), (K["c5_2025"] - 0.3, K["c5_window"] + 3, 0.4), (K["c5_window"], K["n0"], 0.25), (K["n0"], END, 0.35)): train(a, b, g)
# ---------------------------------------------------------------- SFX
for k in ("h_go", "c1", "c1_piers", "c2", "c3", "c4", "c5", "c5_2025", "c5_window", "n0"): add(sfx, K[k] - 0.45, whoosh(0.9, 0.2))
for k in ("c1", "c2", "c3", "c4", "c5"): add(sfx, K[k], tone(2.0, 587.3, 0.12, 0.01, 1.6, (1, 2, 3)) + tone(2.0, 880, 0.07, 0.01, 1.6, (1, 2)))
add(sfx, K["h_this"], boom(0.4)); add(sfx, K["h_go"], boom(0.55)); add(sfx, K["h_go"], tone(4.0, 110, 0.25, 0.05, 3.0, (1, 2, 3)))
add(sfx, K["h_359"], tone(1.4, 330, 0.0, 0.01, 0.5))
for i in range(20): add(sfx, K["h_359"] + i * 0.06, tone(0.05, 600 + 40 * i, 0.06, 0.002, 0.03))
for i in range(3): add(sfx, K["c1_piers"] + 0.6 + i * 0.7, tone(0.25, 220, 0.16, harm=(1, 3)))
add(sfx, K["c1_arch"], tone(3.0, 220, 0.1, 0.4, 1.5, (1, 1.5, 2)))
for k in ("c1_467", "c1_km"): add(sfx, K[k], tone(0.5, 1046.5, 0.1, r=0.4))
# construction: cable crane hum, trolley, clanks, the closing
add(sfx, K["c2_towers"], band(int(12 * SR), 60, 400) * env(int(12 * SR), 1.0, 2.0) * 0.08)
for i in range(10): add(sfx, K["c2_both"] + i * 0.75, clank(0.18 + 0.02 * (i % 3)))
add(sfx, K["c2_meet"] + 0.9, clank(0.6)); add(sfx, K["c2_meet"] + 0.95, boom(0.35, 50, 2.0))
add(sfx, K["c2_2021"], tone(4.0, 261.6, 0.2, 0.05, 3.0, (1, 2)) + tone(4.0, 392, 0.12, 0.05, 3.0) + tone(4.0, 523.3, 0.08, 0.05, 3.0))
# wind chapter: gusts + sensor beeps + stop signal
for i in range(6): add(sfx, K["c3_enemy"] + i * 1.4, whoosh(1.6, 0.18))
for i in range(6): add(sfx, K["c3_sensor"] + 0.4 + i * 0.5, tone(0.06, 2200, 0.06))
add(sfx, K["c3_stop"], tone(0.3, 440, 0.18, harm=(1, 3))); add(sfx, K["c3_stop"] + 0.4, tone(0.3, 440, 0.18, harm=(1, 3)))
# quake: deep rumble
add(sfx, K["c4_zone"], band(int(3.5 * SR), 18, 140) * env(int(3.5 * SR), 0.3, 1.5) * 0.7)
add(sfx, K["c4_concrete"] + 0.8, band(int(2.5 * SR), 100, 1200) * env(int(2.5 * SR), 0.2, 0.8) * 0.12)
add(sfx, K["c4_redund"], tone(0.3, 330, 0.15, harm=(1, 3))); add(sfx, K["c4_blast"], boom(0.3, 55, 1.5))
for i in range(24): add(sfx, K["c4_120"] + i * 0.055, tone(0.04, 1400, 0.05, 0.002, 0.02))
add(sfx, K["c5_2025"], tone(4.5, 261.6, 0.22, 0.05, 3.0, (1, 2, 3)) + tone(4.5, 329.6, 0.15, 0.05, 3.0, (1, 2)) + tone(4.5, 392, 0.13, 0.05, 3.0))
add(sfx, K["n_title"], boom(0.5)); add(sfx, K["n_title"], tone(5.0, 130.8, 0.25, 0.05, 3.5, (1, 2, 3, 4)) + tone(5.0, 196, 0.13, 0.05, 3.5, (1, 2)))

# ---------------------------------------------------------------- score: drone + slow chords + pentatonic flute
CH = [(146.8, 220.0, 293.7), (130.8, 196.0, 261.6), (110.0, 164.8, 220.0), (123.5, 185.0, 246.9)]
bar = 4.0
for i in range(int(END / bar) + 1):
    a, b = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if a >= N: break
    seg = tg[a:b] - i * bar
    for f in CH[i % 4]:
        for det in (0.997, 1.003):
            score[a:b] += 0.016 * np.sin(2 * np.pi * f * det * seg) * np.minimum(1, seg / 1.2) * np.minimum(1, (bar - seg) / 1.2)
    score[a:b] += 0.04 * np.sin(2 * np.pi * CH[i % 4][0] / 2 * seg) * np.minimum(1, seg / 0.05) * np.exp(-seg * 0.5)
PENT = [587.3, 659.3, 740.0, 880.0, 987.8, 1174.7]
def flute(t0, notes, dur=0.55, g=0.03):
    for k, idx in enumerate(notes):
        f = PENT[idx]; d = dur * 1.6; t = tt(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
        y = (np.sin(2 * np.pi * f * np.cumsum(vib) / SR) + 0.2 * np.sin(4 * np.pi * f * np.cumsum(vib) / SR) + 0.05 * band(len(t), 2000, 7000)) * env(len(t), 0.08, 0.5)
        add(score, t0 + k * dur, y, g)
for k, pat in (("h_fog", [0, 2, 3, 2, 1, 0]), ("h_go", [3, 4, 5, 4, 3, 2, 3]), ("c2_rainbow", [2, 3, 4, 5, 4, 3]), ("c5_window", [0, 1, 2, 3, 2, 1, 0]), ("n_title", [3, 4, 5, 4, 3, 2, 3, 0])):
    flute(K[k] + 0.3, pat, 0.6)
inten = np.interp(tg, [0, K["h_go"], K["c1"], K["c2_meet"], K["c2_2021"] + 3, K["c3"], K["c4"], K["c5"], K["c5_2025"], K["n_title"], END],
                  [0.6, 1.0, 0.5, 0.8, 1.0, 0.6, 0.6, 0.5, 1.0, 1.0, 0.3])
score *= 0.6 + 0.6 * inten

# ---------------------------------------------------------------- narrator
w = os.path.join(ROOT, "audio/voice48.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", w], check=True)
_, v = wavfile.read(w); v = v.astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
ker = np.ones(int(0.3 * SR)) / int(0.3 * SR)
_k = len(ker); _cs = np.cumsum(np.concatenate([np.zeros(_k // 2), np.abs(voice), np.zeros(_k - _k // 2)])); venv = ((_cs[_k:] - _cs[:-_k]) / _k)[:N];   # fast moving average (np.convolve here took minutes)
 venv /= venv.max() + 1e-9; vact = np.clip(venv * 4, 0, 1)
fade = np.minimum(1, tg / 1.5) * np.minimum(1, (END - tg) / 2.5)
out = 0.95 * voice + score * (1 - 0.5 * vact) * 0.6 * fade + amb * (1 - 0.4 * vact) * 0.5 * fade + sfx * (1 - 0.3 * vact) * 0.6
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, out], 1); st[:, 1] = np.roll(st[:, 1], 9)
os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
