#!/usr/bin/env python3
"""Documentary soundtrack, synthesised with numpy: an evolving cinematic bed (pads + pulse that change per
chapter), sound effects on the film's anchors, and the narrator on top with ducking -> audio/mix.wav."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR)
rng = np.random.default_rng(11)
sfx = np.zeros(N); amb = np.zeros(N)


def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.05):
    e = np.ones(n); ai = min(n, max(1, int(a * SR))); ri = min(max(1, n - ai), max(1, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def band(d, lo, hi):
    n = int(d * SR); X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def add(buf, t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j > i and i >= 0: buf[i:j] += g * x[:j - i]
def tone(d, f, g=1.0, a=0.004, r=0.1, harm=(1,)):
    t = tt(d); return g * sum(np.sin(2 * np.pi * f * h * t) / h for h in harm) * env(len(t), a, r)
def click(g=1.0, f=2500, d=0.03): return g * band(d, f * 0.5, f * 2) * np.exp(-tt(d) * 120)
def whoosh(d, lo=300, hi=4000, g=1.0):
    x = band(d, lo, hi); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def clank(g=1.0): return g * (tone(0.5, 180, 1, 0.001, 0.4, (1, 2.7, 5.1)) * np.exp(-tt(0.5) * 9) + 0.5 * click(1, 900, 0.06)[:int(0.5 * SR)].repeat(1)[:int(0.5 * SR)] if False else tone(0.5, 180, 1, 0.001, 0.4, (1, 2.7, 5.1)) * np.exp(-tt(0.5) * 9))


# ---------------------------------------------------------------- train ambience (night scenes)
def train_run(t0, t1, g=0.5):
    d = t1 - t0; n = int(d * SR)
    rum = band(d, 30, 220) * 0.6 + band(d, 200, 900) * 0.15
    x = rum.copy()
    # clickety-clack: wheel pairs over rail joints
    period = 0.62; t = 0.0
    while t < d:
        for off in (0.0, 0.11):
            add_local = int((t + off) * SR)
            k = click(0.9, 700, 0.05)
            j = min(n, add_local + len(k))
            if add_local < n: x[add_local:j] += k[:j - add_local]
        t += period
    x *= env(n, 0.8, 1.2)
    add(amb, t0, x, g)
for a, b, g in [(0, K["p0"] + 2.0, 0.55), (K["p0"], K["p_zig"], 0.3), (K["n0"] - 0.4, END, 0.5)]:
    train_run(a, b, g)
# overhead line hum + crackle
add(amb, K["p_wire"] - 0.5, tone(K["p_zig"] - K["p_wire"] + 0.5, 100, 0.05, 0.4, 0.5, (1, 2, 3)))
for i in range(40):
    tk = K["p_wire"] + rng.random() * (K["p_zig"] - K["p_wire"])
    add(sfx, tk, band(0.04, 3000, 9000) * np.exp(-tt(0.04) * 90), 0.12)

# ---------------------------------------------------------------- transitions and accents
SC = ["h_how", "p0", "p_zig", "p_return", "p_but", "e0", "e_motors", "e_hp", "t0", "t_slope", "t_curve", "pt0", "s0", "b0", "b_km", "b_regen", "n0"]
for k in SC: add(sfx, K[k] - 0.45, whoosh(0.9, 250, 5000, 0.22))
for k in ("p0", "e0", "t0", "pt0", "s0", "b0"):  # chapter chime
    add(sfx, K[k], tone(1.6, 659.3, 0.16, 0.01, 1.2, (1, 2, 3)) + tone(1.6, 987.8, 0.1, 0.01, 1.2, (1, 2)))
add(sfx, K["h_go"], tone(3.0, 110, 0.35, 0.02, 2.5, (1, 2, 3, 4)))                   # title boom
add(sfx, K["h_go"], whoosh(1.4, 100, 3000, 0.3))
for k in ("h_steer", "h_gear", "h_clutch"): add(sfx, K[k], tone(0.18, 300, 0.25, harm=(1, 3))); add(sfx, K[k], click(0.4, 1500))
for i in range(24): add(sfx, K["h_5000"] + i * 0.05, click(0.18, 4000, 0.015))       # counter
for i in range(28): add(sfx, K["e_hp"] + i * 0.05, click(0.18, 4000, 0.015))
for i in range(30): add(sfx, K["e_cars"] - 0.6 + i * 0.04, tone(0.04, 1200 + 40 * i, 0.06))
add(sfx, K["p_25k"], band(0.5, 2000, 9000) * np.exp(-tt(0.5) * 6), 0.35)             # zap
add(sfx, K["p_25k"], tone(0.6, 60, 0.4, 0.002, 0.4, (1, 2)))
add(sfx, K["p_trans"], tone(2.2, 100, 0.12, 0.2, 0.6, (1, 2, 3)))                      # transformer hum
add(sfx, K["e_conv"], tone(2.0, 900, 0.04, 0.3, 0.6, (1, 2)))                          # converter whine
for i in range(6): add(sfx, K["e_six"] + i * 0.18, tone(0.12, 520 + 60 * i, 0.15))
add(sfx, K["e_motors"], tone(K["e_hp"] - K["e_motors"], 140, 0.06, 0.5, 0.5, (1, 2, 4)))  # motors
add(sfx, K["t_q"], tone(0.3, 220, 0.2, harm=(1, 3)))
add(sfx, K["t_secret"], tone(1.2, 880, 0.12, 0.01, 1.0, (1, 2)))
add(sfx, K["t_axle"], click(0.5, 1200, 0.05))
add(sfx, K["t_curve"] + 0.3, whoosh(0.8, 400, 3000, 0.2))
add(sfx, K["t_self"], tone(1.4, 523.3, 0.14, 0.01, 1.1, (1, 2)) + tone(1.4, 784, 0.1, 0.01, 1.1))
add(sfx, K["t_flange"], tone(0.3, 330, 0.16, harm=(1, 3)))
add(sfx, K["pt_blades"] + 0.3, band(0.6, 200, 2000) * env(int(0.6 * SR), 0.05, 0.2) * 0.25)  # blades slide
add(sfx, K["pt_blades"] + 0.9, click(0.6, 600, 0.08))
add(sfx, K["pt_machine"], tone(1.0, 160, 0.1, 0.05, 0.2, (1, 2, 3)))
add(sfx, K["pt_lock"], click(0.7, 500, 0.1)); add(sfx, K["pt_lock"] + 0.08, click(0.5, 1500, 0.04))
add(sfx, K["pt_green"], tone(0.5, 1046.5, 0.18, r=0.4, harm=(1, 2)))
train_run(K["pt_turn"] - 0.3, K["pt_lock"], 0.25)
for k, f in (("s_aspects", 440), ("s_aspects", 0)):
    pass
for i, f in enumerate((392, 523.3, 523.3, 659.3)): add(sfx, K["s_aspects"] + 0.3 + i * 1.3, tone(0.25, f, 0.14, r=0.2, harm=(1, 2)))
for i in range(12): add(sfx, K["s_sensor"] + i * 0.35, click(0.18, 2500, 0.02))
add(sfx, K["b_pipe"], band(2.5, 1500, 7000) * env(int(2.5 * SR), 0.4, 0.8) * 0.06)       # air in pipe
add(sfx, K["b_apply"] + 0.3, band(1.2, 1000, 8000) * np.exp(-tt(1.2) * 2.5), 0.3)         # air release
add(sfx, K["b_apply"] + 0.6, tone(1.4, 2600, 0.05, 0.1, 0.6, (1, 1.5)))                  # brake squeal
add(sfx, K["b_break"] + 0.3, clank(0.6)); add(sfx, K["b_break"] + 0.35, band(1.6, 800, 9000) * np.exp(-tt(1.6) * 2.0), 0.45)
add(sfx, K["b_km"] - 0.3, tone(2.8, 2300, 0.04, 0.2, 1.0, (1, 1.4)) + band(2.8, 60, 300) * env(int(2.8 * SR), 0.1, 1.2) * 0.3)
add(sfx, K["b_danger"], tone(0.6, 740, 0.18, r=0.3, harm=(1, 3))); add(sfx, K["b_danger"] + 0.6, tone(0.6, 740, 0.18, r=0.3, harm=(1, 3)))
t = tt(3.0); add(sfx, K["b_regen"] + 0.4, 0.08 * np.sin(2 * np.pi * (200 * t + 120 * t * t)) * env(len(t), 0.3, 0.8))  # rising regen
for i, k in enumerate(("n_r1", "n_r2", "n_r3", "n_r4")): add(sfx, K[k], tone(0.7, [523.3, 587.3, 659.3, 784][i], 0.14, r=0.5, harm=(1, 2)))
add(sfx, K["n_title"], tone(4.0, 130.8, 0.3, 0.02, 3.0, (1, 2, 3, 4)) + tone(4.0, 196, 0.15, 0.02, 3.0, (1, 2)))

# ---------------------------------------------------------------- music bed: chapter-coloured pads + soft pulse
tg = np.arange(N) / SR; bed = np.zeros(N)
CH = [(110.0, 130.8, 164.8, 196.0), (87.3, 130.8, 174.6, 220.0), (98.0, 146.8, 196.0, 246.9), (82.4, 123.5, 164.8, 207.7)]
bar = 3.2
for i in range(int(END / bar) + 1):
    a, b = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if a >= N: break
    seg = tg[a:b] - i * bar
    for f in CH[i % 4]:
        for det in (0.998, 1.002):
            bed[a:b] += 0.022 * np.sin(2 * np.pi * f * 2 * det * seg) * np.minimum(1, seg / 0.8) * np.minimum(1, (bar - seg) / 0.8)
    bed[a:b] += 0.05 * np.sin(2 * np.pi * CH[i % 4][0] / 2 * seg) * np.minimum(1, seg / 0.05) * np.exp(-seg * 0.6)
beat = 0.8
intensity = np.interp(tg, [0, K["h_go"], K["p0"], K["t0"], K["t_self"], K["b0"], K["n0"], K["n_title"], END],
                      [0.6, 1.0, 0.55, 0.6, 0.9, 0.7, 0.9, 1.0, 0.3])
for k in range(int(END / beat)):
    i = int(k * beat * SR); n = int(0.14 * SR)
    if i + n < N: bed[i:i + n] += 0.10 * intensity[i] * np.sin(2 * np.pi * 50 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 26)
    j = i + int(beat / 2 * SR); m = int(0.03 * SR)
    if j + m < N: bed[j:j + m] += 0.02 * intensity[j] * rng.standard_normal(m) * np.exp(-np.arange(m) / SR * 90)
bed *= np.minimum(1, tg / 1.0) * np.minimum(1, (END - tg) / 2.0)

# ---------------------------------------------------------------- narrator + ducking
wav = os.path.join(ROOT, "audio/voice48.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", wav], check=True)
_, v = wavfile.read(wav); v = v.astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
ker = np.ones(int(0.3 * SR)) / int(0.3 * SR)
venv = np.convolve(np.abs(voice), ker, "same"); venv /= venv.max() + 1e-9
vact = np.clip(venv * 4, 0, 1)
out = 0.95 * voice + bed * (1 - 0.5 * vact) * 0.55 + amb * (1 - 0.45 * vact) * 0.45 + sfx * (1 - 0.3 * vact) * 0.6
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, out], 1); st[:, 1] = np.roll(st[:, 1], 7)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
