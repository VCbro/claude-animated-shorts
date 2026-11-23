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

# ---------------------------------------------------------------- ambience: open sea always
waves = band(N, 40, 700) * (0.55 + 0.45 * np.sin(2 * np.pi * tg / 6.5) ** 2) + band(N, 700, 3000) * 0.15
amb += waves * 0.14
def jetpass(t0, d=2.5, g=0.5):  # rising roar
    n = int(d * SR); t = tt(d); x = band(n, 80, 3000) * (t / d) ** 1.5 + band(n, 2000, 8000) * 0.3 * (t / d) ** 2
    add(sfx, t0, x * env(n, 0.3, 0.15), g)
def trap(t0, g=0.6):  # hook catches the wire: clunk + screech + run-down
    add(sfx, t0, clank(0.8)); n = int(2.8 * SR); t = tt(2.8)
    add(sfx, t0 + 0.05, (band(n, 1500, 5000) * np.exp(-t * 1.6) * 0.4 + band(n, 60, 400) * np.exp(-t * 1.0)) , g)
jetpass(K["h0"] + 0.3, K["h_stop"] - K["h0"] - 0.3, 0.45); trap(K["h_stop"])
for k in ("h_go", "c1", "c2", "c3", "c4", "c5", "n0"): add(sfx, K[k] - 0.45, whoosh(0.9, 0.2))
for k in ("c1", "c2", "c3", "c4", "c5"): add(sfx, K[k], tone(2.0, 587.3, 0.12, 0.01, 1.6, (1, 2, 3)) + tone(2.0, 880, 0.07, 0.01, 1.6, (1, 2)))
add(sfx, K["h_this"], boom(0.45)); add(sfx, K["h_go"], boom(0.55)); add(sfx, K["h_go"], tone(4.0, 110, 0.25, 0.05, 3.0, (1, 2, 3)))
add(sfx, K["h_go"] + 0.5, tone(2.5, 98, 0.25, 0.1, 1.0, (1, 2, 3)))      # ship horn
add(amb, K["c1_old"], band(int((K["c1_2022"] - K["c1_old"]) * SR), 1000, 6000) * 0.05)   # old-film crackle
add(sfx, K["c1_1971"], boom(0.4, 45, 2.5)); add(sfx, K["c1_2022"], boom(0.5)); add(sfx, K["c1_2022"], tone(3.5, 261.6, 0.18, 0.05, 2.5, (1, 2)) + tone(3.5, 392, 0.1, 0.05, 2.5))
for k in ("c2_fields", "c2_weight", "c2_rooms", "c2_people"):
    for i in range(18): add(sfx, K[k] + i * 0.06, tone(0.04, 900 + 50 * i, 0.05, 0.002, 0.02))
add(amb, K["c2_rooms"], band(int(12 * SR), 100, 1200) * env(int(12 * SR), 1.0, 2.0) * 0.06)        # ship interior hum
add(sfx, K["c2_power"], tone(2.0, 120, 0.1, 0.3, 1.0, (1, 2, 3)))
add(sfx, K["c2_turb"], band(int(4 * SR), 300, 6000) * env(int(4 * SR), 1.0, 1.5) * 0.15)
add(sfx, K["c3_hold"] + 0.4, band(int(4 * SR), 60, 2500) * np.linspace(0.2, 1, int(4 * SR)) * 0.35)   # spool-up
jetpass(K["c3_go"], 3.5, 0.6); add(sfx, K["c3_go"] + 2.1, boom(0.4, 50, 2.0))
jetpass(K["c4"] + 0.5, K["c4_snag"] - K["c4"] - 0.5, 0.45); trap(K["c4_snag"])
jetpass(K["c4_bolter"] + 0.2, 2.5, 0.5)
for i in range(6): add(sfx, K["c5_eyes"] + i * 0.8, tone(0.25, 1318.5, 0.08, 0.005, 0.2))      # radar pings
for i in range(3): jetpass(K["n_guard"] + i * 0.4, 2.0, 0.3)
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
for k, pat in (("h0", [0, 2, 3, 2, 1, 0]), ("h_go", [3, 4, 5, 4, 3, 2, 3]), ("c1_2022", [2, 3, 4, 5, 4, 3]), ("n_title", [3, 4, 5, 4, 3, 2, 3, 0])):
    flute(K[k] + 0.3, pat, 0.6)
inten = np.interp(tg, [0, K["h_go"], K["c1"], K["c1_2022"], K["c2"], K["c3"], K["c4"], K["c5"], K["n_title"], END],
                  [0.7, 1.0, 0.5, 0.9, 0.6, 0.8, 0.8, 0.6, 1.0, 0.3])
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
