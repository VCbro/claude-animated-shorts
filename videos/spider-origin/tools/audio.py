#!/usr/bin/env python3
"""THE BITE soundtrack (numpy): projector whirr + room tone, a tense minor score, SFX on anchors, ducked narrator."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(62)
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
def boom(g=1.0, f=45, d=2.5): t = tt(d); return g * (np.sin(2 * np.pi * f * t) + 0.5 * band(len(t), 20, 160)) * np.exp(-t * 2.2)
def whoosh(d, g=1.0, lo=250, hi=5000): x = band(int(d * SR), lo, hi); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def thump(g=1.0): t = tt(0.4); return g * (np.sin(2 * np.pi * 90 * t) * np.exp(-t * 18) + 0.6 * band(len(t), 200, 3000) * np.exp(-t * 40))
def tick(g=1.0, f=3000): t = tt(0.03); return g * band(len(t), f, f * 3) * np.exp(-t * 200)
A = lambda k: K[k]

# ---------------------------------------------------------------- ambience: projector whirr + flutter, room tone
proj = band(N, 300, 2500) * (0.7 + 0.3 * (np.sin(2 * np.pi * 24 * tg) > 0)) * 0.05
amb += proj + band(N, 60, 400) * 0.04
amb += band(N, 200, 2000) * win(0, A('h_police'), 1, 1) * 0.10                       # city night hush
amb += band(N, 300, 4000) * (0.6 + 0.4 * np.sin(2 * np.pi * tg / 2.7)) * win(A('c5_chase'), A('c5_corner'), 0.5, 0.8) * 0.35   # wind
amb += band(N, 100, 900) * win(A('c2'), A('c2_bite'), 1, 0.5) * 0.06                 # hall crowd murmur

# ---------------------------------------------------------------- SFX
for k in ('c1', 'c2', 'c3', 'c4', 'c5', 'n0'): add(sfx, A(k) - 0.4, whoosh(0.9, 0.3)); add(sfx, A(k), boom(0.35, 40, 3))
for i in range(28): add(sfx, A('h_police') + 0.1 + i * 0.07 + 0.03 * rng.random(), tick(0.35, 1800))      # typewriter
add(sfx, A('h_police') + 1.25, thump(0.9)); add(sfx, A('h_news') + 0.85, thump(0.9))                   # stamps
add(sfx, A('h_news') - 0.1, whoosh(0.5, 0.25, 800, 8000))                                              # paper slide
add(sfx, A('h_q'), tone(3.5, 220, 0.12, 0.3, 2, (1, 2)))
# exhibition: beam hum, geiger clicks, the bite sting
hum = tone(A('c2_bite') - A('c2_beam'), 120, 0.08, 0.6, 0.2, (1, 2, 3, 5)); add(sfx, A('c2_beam'), hum)
for i in range(int((A('c2_bite') - A('c2_dose')) * 14)):
    tc = A('c2_dose') + i / 14 + 0.05 * rng.random()
    if rng.random() < 0.3 + 0.6 * i / ((A('c2_bite') - A('c2_dose')) * 14): add(sfx, tc, tick(0.5, 2500))
add(sfx, A('c2_bite'), tone(1.8, 1760, 0.18, 0.002, 1.5, (1, 1.5))); add(sfx, A('c2_bite'), boom(0.6, 55, 2))
add(sfx, A('c2_pain'), tone(3.0, 330, 0.08, 0.5, 2, (1, 1.06)))                                       # dizzy beating tone
# change: horn + car pass, jump, wall, pipe creak, web shots
add(sfx, A('c3_car') + 1.0, tone(0.7, 392, 0.12, 0.01, 0.2, (1, 2, 3)) + tone(0.7, 494, 0.08, 0.01, 0.2, (1, 2)))
add(sfx, A('c3_car') + 1.6, whoosh(1.4, 0.35, 80, 2000))
add(sfx, A('c3_jump') + 0.1, whoosh(0.9, 0.35)); add(sfx, A('c3_stick'), thump(0.5))
pc = band(int(1.2 * SR), 200, 900) * np.sin(2 * np.pi * np.cumsum(np.linspace(80, 40, int(1.2 * SR))) / SR); add(sfx, A('c3_pipe') + 0.1, pc * env(len(pc), 0.1, 0.4), 0.25)
for i in range(2): add(sfx, A('c3_shoot') + 0.2 + i * 0.35, band(int(0.18 * SR), 1500, 9000) * np.exp(-tt(0.18) * 22) * 0.4)
add(sfx, A('c3_swing'), whoosh(1.6, 0.4)); add(sfx, A('c3_swing') + 1.5, whoosh(1.4, 0.3))
# masked star: coins, crowd cheer, TV static, the run, the freeze
for i in range(8): add(sfx, A('c4_money') + 0.3 + i * 0.13, tone(0.25, 2600 + 300 * (i % 3), 0.08, 0.001, 0.2, (1, 2.7)))
add(sfx, A('c4_wrestle') + 1.2, band(int(4 * SR), 300, 3000) * env(int(4 * SR), 0.3, 2) * 0.22)
add(sfx, A('c4_wrestle') + 2.0, boom(0.6, 60, 1))
add(sfx, A('c4_star'), band(int(0.8 * SR), 1000, 8000) * env(int(0.8 * SR), 0.01, 0.5) * 0.18)
for i in range(18): add(sfx, A('c4_thief') + 0.3 + i * 0.26, thump(0.25))
add(sfx, A('c4_could'), tone(2.2, 110, 0.2, 0.01, 1.8, (1, 2, 3))); add(sfx, A('c4_not'), boom(0.4, 50, 2))
# the night: siren, ben, wind (amb), heartbeat, reveal
siren = np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sin(2 * np.pi * tt(6) * 0.8)) / SR) * env(int(6 * SR), 0.5, 2); add(sfx, A('c5_police') - 0.5, siren, 0.09)
add(sfx, A('c5_ben'), tone(5, 196, 0.10, 1, 3, (1, 2)) + tone(5, 233, 0.07, 1, 3))
for i in range(8): add(sfx, A('c5_corner') + i * 0.85, boom(0.35, 48, 0.3)); add(sfx, A('c5_corner') + i * 0.85 + 0.22, boom(0.22, 48, 0.3))
add(sfx, A('c5_same'), boom(0.8, 42, 3)); add(sfx, A('c5_same') + 1.25, thump(0.9))
# ending
for i in range(40): add(sfx, A('n_quote') + i * 0.09, tick(0.18, 1600))
add(sfx, A('n_spider') - 0.2, boom(0.7, 40, 4)); add(sfx, A('n_spider'), tone(5, 130.8, 0.2, 0.05, 3.5, (1, 2, 3)) + tone(5, 196, 0.12, 0.05, 3.5) + tone(5, 261.6, 0.08, 0.05, 3.5))

# ---------------------------------------------------------------- score: D minor tension, pulse, piano-like motif
CH = [(146.8, 174.6, 220.0), (116.5, 146.8, 174.6), (130.8, 155.6, 196.0), (110.0, 138.6, 164.8)]
bar = 4.0
for i in range(int(END / bar) + 1):
    a0, b0 = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if a0 >= N: break
    seg = tg[a0:b0] - i * bar
    for f in CH[i % 4]:
        for det in (0.996, 1.004): score[a0:b0] += 0.014 * np.sin(2 * np.pi * f * det * seg) * np.minimum(1, seg / 1.5) * np.minimum(1, (bar - seg) / 1.5)
    for k in range(4): s0 = k * 1.0; m = (seg >= s0) & (seg < s0 + 0.5); score[a0:b0][m] += 0.05 * np.sin(2 * np.pi * CH[i % 4][0] / 2 * (seg[m] - s0)) * np.exp(-(seg[m] - s0) * 7)
MOT = [587.3, 698.5, 659.3, 587.3, 523.3, 587.3]
def motif(t0, g=0.04):
    for k, f in enumerate(MOT): t = tt(1.4); add(score, t0 + k * 0.5, (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 3.2), g)
for k in ('h_q', 'c2_spider', 'c3_swing', 'c5_ben', 'n_quote'): motif(A(k) + 0.4)
inten = np.interp(tg, [0, A('h_q'), A('c1'), A('c2_dose'), A('c2_bite') + 2, A('c3'), A('c3_swing'), A('c4'), A('c4_could'), A('c5'), A('c5_same'), A('n_quote'), A('n_spider') + 3, END],
                  [0.5, 0.9, 0.5, 0.9, 1.0, 0.6, 1.0, 0.5, 0.9, 0.6, 1.0, 0.7, 1.0, 0.3])
score *= 0.5 + 0.7 * inten

# ---------------------------------------------------------------- narrator
w = os.path.join(ROOT, "audio/voice48.wav"); os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", w], check=True)
_, v = wavfile.read(w); v = v.astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
ker = np.ones(int(0.3 * SR)) / int(0.3 * SR)
venv = np.convolve(np.abs(voice), ker, "same"); venv /= venv.max() + 1e-9; vact = np.clip(venv * 4, 0, 1)
fade = np.minimum(1, tg / 1.5) * np.minimum(1, (END - tg) / 2.5)
out = 0.95 * voice + score * (1 - 0.5 * vact) * 0.6 * fade + amb * (1 - 0.4 * vact) * 0.5 * fade + sfx * (1 - 0.3 * vact) * 0.6
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, np.roll(out, 9)], 1)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
