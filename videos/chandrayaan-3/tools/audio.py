#!/usr/bin/env python3
"""Chandrayaan-3 soundtrack (numpy): cinematic space bed whose intensity follows the story, SFX on anchors,
a heartbeat-like pulse and countdown ticks in the landing, the narrator on top with ducking -> audio/mix.wav."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR)
rng = np.random.default_rng(23)
sfx = np.zeros(N)
T_TOUCH = K["l_hover"] + 3.4


def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.05):
    e = np.ones(n); ai = min(n, max(1, int(a * SR))); ri = min(max(1, n - ai), max(1, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def band(d, lo, hi):
    n = int(d * SR); X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def add(t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j > i >= 0: sfx[i:j] += g * x[:j - i]
def tone(d, f, g=1.0, a=0.004, r=0.1, harm=(1,)):
    t = tt(d); return g * sum(np.sin(2 * np.pi * f * h * t) / h for h in harm) * env(len(t), a, r)
def click(g=1.0, f=2500, d=0.03): return g * band(d, f * 0.5, f * 2) * np.exp(-tt(d) * 120)
def whoosh(d, lo=300, hi=4000, g=1.0): x = band(d, lo, hi); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def boom(g=1.0, f=45, d=2.5): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.5 * band(d, 20, 200)) * np.exp(-t * 2.2)
def rumble(d, g=1.0, lo=25, hi=400): return g * band(d, lo, hi) * env(int(d * SR), 0.6, 1.0)

# ---------------------------------------------------------------- events
add(0.0, rumble(3.0, 0.25, 20, 160))
add(K["h_date"], tone(0.25, 880, 0.15, r=0.2)); add(K["h_time"], tone(0.25, 1046.5, 0.15, r=0.2))
for k in range(4): add(K["h_time"] + k * 0.33, click(0.25, 3500, 0.02))
add(K["h_hist"], boom(0.5)); add(K["h_hist"], tone(3.5, 130.8, 0.25, 0.02, 2.5, (1, 2, 3)) + tone(3.5, 196, 0.15, 0.02, 2.5, (1, 2)))
add(K["h_go"] - 0.3, whoosh(1.2, 120, 3000, 0.35)); add(K["h_go"], boom(0.6, 40, 3.0))
SC = ["h_how", "c2", "o0", "o_loops", "m0", "l0", "l_cam", "r0", "s0", "n0"]
for k in SC: add(K[k] - 0.45, whoosh(0.9, 250, 5000, 0.2))
for k in ("c2", "o0", "m0", "l0", "r0", "s0"):
    add(K[k], tone(1.8, 587.3, 0.14, 0.01, 1.4, (1, 2, 3)) + tone(1.8, 880, 0.08, 0.01, 1.4, (1, 2)))
# 2019 failure
add(K["c2_dev"], tone(0.18, 440, 0.18, harm=(1, 3))); add(K["c2_dev"] + 0.4, tone(0.18, 415, 0.18, harm=(1, 3)))
add(K["c2_crash"] + 0.1, boom(0.9, 38, 3.0)); add(K["c2_crash"] + 0.1, band(1.5, 200, 3000) * np.exp(-tt(1.5) * 3) * 0.4)
add(K["c2_sad"], tone(3.0, 110, 0.12, 0.3, 2.0, (1, 1.19, 1.5)))
add(K["c2_isro"], tone(2.0, 220, 0.12, 0.2, 1.4, (1, 1.25, 1.5)))
# launch
L = K["o_launch"] + 0.6
add(L - 0.4, rumble(5.5, 0.9, 20, 600)); add(L - 0.3, band(5.0, 600, 5000) * env(int(5.0 * SR), 0.3, 2.0) * 0.25); add(L, boom(0.6, 35, 3.0))
# orbit burns
per = (K["o_40"] - (K["o_loops"] + 0.3)) / 5.0
for i in range(5): add(K["o_loops"] + 0.3 + i * per, band(0.8, 200, 2500) * env(int(0.8 * SR), 0.05, 0.4) * 0.3)
for i in range(30): add(K["o_loops"] + 0.5 + i * (K["m0"] - K["o_loops"]) / 30, click(0.12, 3000, 0.015))
add(K["o_40"], tone(1.5, 659.3, 0.14, 0.02, 1.0, (1, 2)))
# lunar capture + separation
add(K["m_aug5"], band(2.2, 150, 2500) * env(int(2.2 * SR), 0.1, 0.6) * 0.35)
add(K["m_sep"] + 0.2, click(0.7, 900, 0.08)); add(K["m_sep"] + 0.3, whoosh(1.0, 300, 3000, 0.2))
# landing: engine roar, heartbeat pulse, countdown ticks, touchdown
d = T_TOUCH - K["l0"]
add(K["l0"], rumble(d, 0.45, 30, 900))
t = 0.0
while K["l0"] + t < T_TOUCH:   # heartbeat speeding up
    p = t / d; add(K["l0"] + t, tone(0.12, 55, 0.5, 0.002, 0.1, (1, 2))); add(K["l0"] + t + 0.18, tone(0.1, 50, 0.35, 0.002, 0.08, (1, 2)))
    t += 1.0 - 0.5 * p
for k in range(int(d)): add(K["l0"] + k, click(0.10, 4200, 0.012))
add(K["l_air"], tone(0.3, 300, 0.16, harm=(1, 3)))
add(K["l_auto"], tone(0.8, 1318.5, 0.08, 0.02, 0.6, (1, 2)))
for k in range(8): add(K["l_cam"] + 0.4 + k * 0.45, tone(0.06, 2000, 0.06))
for k in range(4): add(K["l_cam"] + 0.5 + k * 0.4, tone(0.15, 330, 0.12, harm=(1, 3)))
add(K["l_cam"] + 2.4, tone(0.4, 988, 0.15, r=0.3, harm=(1, 2)))
add(T_TOUCH - 0.05, boom(0.7, 50, 2.0)); add(T_TOUCH, band(2.0, 100, 3000) * np.exp(-tt(2.0) * 2) * 0.35)
add(K["l_first"], tone(5.0, 261.6, 0.25, 0.05, 3.5, (1, 2, 3)) + tone(5.0, 329.6, 0.18, 0.05, 3.5, (1, 2)) + tone(5.0, 392, 0.16, 0.05, 3.5, (1, 2)))
add(K["l_first"], boom(0.5, 40, 3.0))
# Pragyan
add(K["r_door"] + 0.2, band(1.0, 200, 1500) * env(int(1.0 * SR), 0.05, 0.3) * 0.2); add(K["r_door"] + 1.1, click(0.5, 700, 0.06))
add(K["r_door"] + 2.8, tone(10.0, 180, 0.04, 0.3, 0.5, (1, 2, 3)))
for k in range(10): add(K["r_laser"] + k * 0.12, tone(0.08, 2600 + 200 * (k % 3), 0.08))
add(K["r_sulfur"], tone(0.6, 1318.5, 0.16, r=0.4, harm=(1, 2)))
add(K["r_hop"] + 0.6, band(0.9, 150, 2500) * env(int(0.9 * SR), 0.05, 0.3) * 0.3); add(K["r_hop"] + 2.2, boom(0.3, 60, 1.0))
# south pole + end
for k in range(6): add(K["s_ice"] + k * 0.25, tone(0.5, 2093 + 300 * (k % 3), 0.06, r=0.4))
for i, k in enumerate(("n_r1", "n_r2", "n_r3")): add(K[k], tone(0.8, [523.3, 659.3, 784][i], 0.14, r=0.6, harm=(1, 2)))
add(K["n_title"], boom(0.5, 40, 3.0)); add(K["n_title"], tone(4.0, 130.8, 0.3, 0.02, 3.0, (1, 2, 3, 4)) + tone(4.0, 196, 0.15, 0.02, 3.0, (1, 2)) + tone(4.0, 261.6, 0.1, 0.02, 3.0))

# ---------------------------------------------------------------- space music bed
tg = np.arange(N) / SR; bed = np.zeros(N)
CH = [(110.0, 164.8, 220.0, 261.6), (98.0, 146.8, 196.0, 246.9), (87.3, 130.8, 174.6, 220.0), (82.4, 123.5, 164.8, 207.7)]
bar = 4.0
for i in range(int(END / bar) + 1):
    a, b = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if a >= N: break
    seg = tg[a:b] - i * bar
    for f in CH[i % 4]:
        for det in (0.997, 1.003):
            bed[a:b] += 0.02 * np.sin(2 * np.pi * f * 2 * det * seg) * np.minimum(1, seg / 1.2) * np.minimum(1, (bar - seg) / 1.2)
    bed[a:b] += 0.045 * np.sin(2 * np.pi * CH[i % 4][0] / 2 * seg) * np.minimum(1, seg / 0.05) * np.exp(-seg * 0.5)
# shimmering arpeggio in the journey + south pole
for i in range(int(END / 0.25)):
    t0 = i * 0.25
    if not ((K["o_loops"] < t0 < K["l0"]) or (K["s0"] < t0 < K["n_title"])): continue
    f = CH[int(t0 / bar) % 4][i % 4] * 4
    add_i = int(t0 * SR); n = int(0.4 * SR)
    if add_i + n < N: bed[add_i:add_i + n] += 0.012 * np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 6)
inten = np.interp(tg, [0, K["h_go"], K["c2"], K["c2_sad"], K["o0"], K["l0"], T_TOUCH, K["l_first"], K["r0"], K["n_title"], END],
                  [0.6, 1.0, 0.5, 0.3, 0.8, 0.5, 1.0, 1.0, 0.6, 1.0, 0.3])
bed *= 0.6 + 0.6 * inten
bed *= np.minimum(1, tg / 1.0) * np.minimum(1, (END - tg) / 2.0)
# duck the bed right before touchdown for suspense
bed *= 1 - 0.7 * np.clip((tg - (T_TOUCH - 2.0)) / 1.5, 0, 1) * np.clip((K["l_first"] - tg) / 0.5, 0, 1)

# ---------------------------------------------------------------- narrator + ducking
wav = os.path.join(ROOT, "audio/voice48.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", wav], check=True)
_, v = wavfile.read(wav); v = v.astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
ker = np.ones(int(0.3 * SR)) / int(0.3 * SR)
venv = np.convolve(np.abs(voice), ker, "same"); venv /= venv.max() + 1e-9
vact = np.clip(venv * 4, 0, 1)
out = 0.95 * voice + bed * (1 - 0.5 * vact) * 0.6 + sfx * (1 - 0.3 * vact) * 0.6
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, out], 1); st[:, 1] = np.roll(st[:, 1], 7)
os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
