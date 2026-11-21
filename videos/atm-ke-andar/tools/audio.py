#!/usr/bin/env python3
"""Sound design synthesised with numpy (no sample libraries): a soft music bed, machine SFX on the
film's events, the user's voice on top with ducking -> audio/mix.wav (48 kHz stereo)."""
import os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000; END = 39.2; N = int(END * SR)
rng = np.random.default_rng(3)
mix = np.zeros((N, 2)); sfx = np.zeros(N)


def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.05):
    e = np.ones(n); ai = min(n, max(1, int(a * SR))); ri = min(n - ai if n > ai else n, max(1, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def bandnoise(d, lo, hi):
    n = int(d * SR); x = rng.standard_normal(n); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def add(t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j > i: sfx[i:j] += g * x[:j - i]
def tone(d, f, g=1.0, a=0.003, r=0.08, harm=(1,)):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * h * t) / h for h in harm); return g * y * env(len(t), a, r)
def click(g=1.0, f=2500, d=0.03): return g * bandnoise(d, f * 0.5, f * 2) * np.exp(-tt(d) * 120)
def whoosh(d, lo=300, hi=3000, g=1.0, rise=True):
    x = bandnoise(d, lo, hi); t = tt(d); e = np.sin(np.pi * t / d) ** 2
    return g * x * e
def motor(d, f=140, g=1.0):
    t = tt(d); y = 0.5 * np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.35 * bandnoise(d, 800, 3000)
    return g * y * env(len(t), 0.08, 0.12)


# ---------------------------------------------------------------- SFX timeline
add(0.0, whoosh(0.9, 200, 2500, 0.25))
add(2.62, whoosh(1.0, 1500, 6000, 0.18)); add(3.55, click(0.5, 1800))           # card slides in
add(4.4, motor(2.3, 160, 0.22))                                                  # reader rollers
add(6.9, click(0.6, 3000)); add(7.25, click(0.3, 5000))                          # contacts land
for k in range(10): add(7.4 + k * 0.07, tone(0.04, 2400 + 300 * (k % 3), 0.12))  # data chirps
for tk in (8.95, 9.35, 9.75, 10.15): add(tk, tone(0.11, 1180, 0.32, r=0.04)); add(tk, click(0.3, 1500))
for k in range(18): add(10.4 + k * 0.08, tone(0.05, 600 + 120 * ((k * 7) % 11), 0.10, harm=(1, 3)))  # encryption chatter
add(11.9, whoosh(1.6, 400, 5000, 0.35)); add(11.95, tone(1.5, 220, 0.06, 0.4, 0.3))
add(13.62, tone(0.5, 880, 0.3, r=0.35, harm=(1, 2))); add(13.82, tone(0.7, 1318.5, 0.3, r=0.5, harm=(1, 2)))  # "yes" chime
add(15.05, tone(0.6, 55, 0.6, 0.002, 0.5, (1, 2, 3)) * np.exp(-tt(0.6) * 6)); add(15.05, click(0.6, 400, 0.08))  # safe clunk
add(17.2, motor(8.7, 120, 0.13))                                                 # transport motor
PICKS = [17.45, 18.25, 19.05, 19.75, 20.5, 21.2, 21.75] + [23.55 + k * 0.27 for k in range(8)]
for tp in PICKS:
    add(tp - 0.05, bandnoise(0.12, 2000, 8000) * np.exp(-tt(0.12) * 25) * 0.18)  # suction pfft
    add(tp + 0.1, whoosh(0.25, 2500, 9000, 0.12))                               # note flick
for tp in (19.75, 20.5, 21.2): add(tp + 0.75, tone(0.07, 1600, 0.12))           # sensor ok
for k in range(5): add(22.2 + k * 0.18, tone(0.12, 220, 0.25, harm=(1, 3, 5)))  # error buzz
add(22.05, click(0.6, 900, 0.05)); add(23.0, click(0.4, 700, 0.06)); add(23.25, click(0.6, 900, 0.05))
for k in range(16): add(24.0 + k * 0.11, click(0.22, 3500, 0.02))               # stacker riffle
add(25.95, bandnoise(0.35, 300, 2500) * env(int(0.35 * SR), 0.02, 0.1) * 0.3); add(26.3, click(0.5, 600, 0.06))  # shutter
add(26.4, whoosh(0.9, 1500, 7000, 0.2))                                          # cash out
add(28.6, motor(2.2, 200, 0.1)); add(29.2, tone(1.4, 3200, 0.05, 0.1, 0.3))     # scanner
for tk in (31.1, 32.1): add(tk, tone(0.25, 1760, 0.22, r=0.2, harm=(1, 2)))
add(32.75, tone(0.8, 110, 0.18, 0.1, 0.3, (1, 2, 4)))                            # UV lamp hum
add(33.45, tone(0.3, 1318.5, 0.2, r=0.25)); add(33.6, tone(0.4, 1760, 0.2, r=0.3))
add(33.7, motor(0.6, 200, 0.1))
for k in range(4): add(34.25 + k * 0.2, tone(0.15, 196, 0.3, harm=(1, 3, 5)))   # reject buzz
add(34.55, motor(0.8, 180, 0.1))
add(35.4, whoosh(1.2, 200, 3000, 0.3))

# ---------------------------------------------------------------- music bed: soft pads + light pulse (A minor-ish, 100 bpm)
t = np.arange(N) / SR; bed = np.zeros(N)
CH = [(220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7), (164.8, 207.7, 246.9)]
bar = 2.4
for i in range(int(END / bar) + 1):
    a, b = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
    if a >= N: break
    seg = t[a:b] - i * bar
    for f in CH[i % 4]:
        bed[a:b] += 0.05 * np.sin(2 * np.pi * f * seg + 0.3 * np.sin(2 * np.pi * 0.5 * seg)) * np.minimum(1, seg / 0.3) * np.minimum(1, (bar - seg) / 0.3)
    bed[a:b] += 0.06 * np.sin(2 * np.pi * CH[i % 4][0] / 2 * seg) * np.minimum(1, seg / 0.05) * np.exp(-seg * 0.8)
beat = 0.6
for k in range(int(END / beat)):
    i = int(k * beat * SR); n = int(0.12 * SR)
    if i + n < N: bed[i:i + n] += 0.12 * np.sin(2 * np.pi * 55 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 30)
    j = i + int(beat / 2 * SR); m = int(0.04 * SR)
    if j + m < N: bed[j:j + m] += 0.03 * rng.standard_normal(m) * np.exp(-np.arange(m) / SR * 80)
fade = np.minimum(1, t / 0.8) * np.minimum(1, (END - t) / 1.5)
bed *= fade

# ---------------------------------------------------------------- voice + ducking
wav = os.path.join(ROOT, "audio/voice48.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "voice/voice.mp3"), "-ar", str(SR), "-ac", "1", wav], check=True)
_, v = wavfile.read(wav); v = v.astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
voice /= np.abs(voice).max() + 1e-9
e = np.abs(voice); k = int(0.25 * SR); ker = np.ones(k) / k
venv = np.convolve(e, ker, "same"); venv /= venv.max() + 1e-9
duck = 1 - 0.55 * np.clip(venv * 4, 0, 1)
out = 0.95 * voice + bed * duck * 0.5 + sfx * (1 - 0.35 * np.clip(venv * 4, 0, 1)) * 0.6
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, out], 1)
st[:, 1] = np.roll(st[:, 1], 6)  # tiny width
os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", N / SR, "s")
