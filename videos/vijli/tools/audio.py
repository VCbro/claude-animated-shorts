#!/usr/bin/env python3
"""Soundtrack for हाजी कासम की वीजळी (numpy): narration re-timed with the film's pauses, a restrained
string-drone score, a bowed folk-instrument phrase where the mukhda sits (or the user's own mukhda
recording if voice/mukhda.mp3 exists), sea / storm ambience, paper sounds. -> audio/mix.wav"""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
K = json.load(open(os.path.join(ROOT, "out/anchors.json"))); PZ = json.load(open(os.path.join(ROOT, "out/pauses.json")))
SR = 48000; END = K["END"]; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(5)


def load(path):
    w = os.path.join(ROOT, "audio/_tmp.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ar", str(SR), "-ac", "1", w], check=True)
    _, x = wavfile.read(w); return x.astype(np.float64) / 32768
def band(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def env_win(a, b, fa=1.0, fb=1.0):
    return np.clip((tg - a) / fa, 0, 1) * np.clip((b - tg) / fb, 0, 1)
def add(buf, t0, x, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j > i >= 0: buf[i:j] += g * x[:j - i]

# ---------------------------------------------------------------- narration with pauses
v = load(os.path.join(ROOT, "voice/voice.mp3")); v /= np.abs(v).max() + 1e-9
voice = np.zeros(N)
cuts = sorted(PZ["pauses"], key=lambda p: p["voice_t"])
bounds = [p["voice_t"] for p in cuts] + [len(v) / SR]
for i, p in enumerate(cuts):
    s0, s1 = int(p["voice_t"] * SR), int(bounds[i + 1] * SR)
    off = sum(q["dur"] for q in cuts[:i + 1])
    add(voice, p["voice_t"] + off, v[s0:s1])

# ---------------------------------------------------------------- score: string drone in D (Bhairavi colour)
D = 73.42
def pad(freqs, g):
    y = np.zeros(N)
    for f in freqs:
        for det in (0.996, 1.0, 1.004):
            ph = 2 * np.pi * f * det * tg
            y += g * (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph))
    return y
drone = pad([D, D * 1.5, D * 2], 0.010)
swell = 0.55 + 0.45 * np.sin(2 * np.pi * tg / 22.0) ** 2
score = drone * swell
# emotional lift chords at key moments
for k, fr in (("h_song", [D * 2, D * 2 * 1.189, D * 3]), ("p_photo", [D * 2, D * 2.5, D * 3]), ("x_never", [D * 2, D * 2 * 1.189, D * 2 * 1.498]),
              ("f_cup", [D * 2, D * 2 * 1.335, D * 2 * 1.682]), ("u_again", [D * 2, D * 2 * 1.189, D * 3]), ("e_photo", [D * 2, D * 2.5, D * 3])):
    a = K[k]; e = env_win(a - 0.5, a + 9, 2.5, 4.0)
    score += pad(fr, 0.006) * e
# bowed folk phrase (ravanhatta-like) where the mukhda sits, unless a real recording exists
def bowed(notes, t0, dur_each=0.9, g=0.09):
    out = np.zeros(int(len(notes) * dur_each * SR) + SR)
    for i, f in enumerate(notes):
        n = int(dur_each * 1.25 * SR); t = np.arange(n) / SR
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.3, 0, 1)
        ph = 2 * np.pi * f * np.cumsum(vib) / SR
        y = sum(np.sin(h * ph) / h ** 1.1 for h in range(1, 9)) + 0.15 * band(n, 2000, 6000) * 0.3
        e = np.clip(t / 0.18, 0, 1) * np.clip((dur_each * 1.25 - t) / 0.4, 0, 1)
        s = int(i * dur_each * SR); out[s:s + n] += y * e
    add(score, t0, out, g)
SC = [D * 2 * r for r in (1, 1.0595, 1.189, 1.335, 1.498, 1.587, 1.782, 2)]  # D Eb F G A Bb C D
PHRASE = [SC[0], SC[2], SC[3], SC[4], SC[3], SC[2], SC[1], SC[0]]
muk = os.path.join(ROOT, "voice/mukhda.mp3")
slots = [0.6, K["pause_mukhda2"] + 0.3, K["outro"] + 0.3]
if os.path.exists(muk):
    m = load(muk); m /= np.abs(m).max() + 1e-9
    for s in slots: add(voice, s + 1.6, m[:int(6.0 * SR)])
for s in slots: bowed(PHRASE, s, 0.88, 0.05 if os.path.exists(muk) else 0.085)
# ---------------------------------------------------------------- ambience
sea = band(N, 60, 900) * 0.5 + band(N, 900, 4000) * 0.12
sea *= 0.6 + 0.4 * np.sin(2 * np.pi * tg / 7.0) ** 2
sea_mask = np.zeros(N)
for a, b in ((K["h0"] - 0.5, K["g_old"]), (K["d_mandvi"], K["d_dwarka"] + 1), (K["x_never"] - 0.3, K["r_page"] + 0.5), (K["w_deck"], K["f_shore"])):
    sea_mask = np.maximum(sea_mask, env_win(a, b, 1.2, 1.5))
amb = sea * sea_mask * 0.22
ps = K["pause_storm"]
storm = (band(N, 200, 3000) * 0.5 + band(N, 2500, 9000) * 0.25) * env_win(ps + 1.0, ps + 9.2, 1.5, 1.8)
amb += storm * 0.35
for k in range(3):  # distant thunder
    tt0 = ps + 2.2 + k * 2.6; n = int(3 * SR); t = np.arange(n) / SR
    add(amb, tt0, band(n, 25, 180) * np.exp(-t * 1.3) * (0.4 - k * 0.08))
docks = band(N, 300, 2500) * env_win(K["b_1885"], K["b_steam"], 0.8, 0.8) * 0.06
engine = (np.sin(2 * np.pi * 2.2 * tg) > 0.6).astype(float) * band(N, 80, 600) * env_win(K["b_steam"], K["b_light"], 0.8, 0.8) * 0.10
amb += docks + engine
def rustle(t0, g=0.25):
    n = int(0.6 * SR); t = np.arange(n) / SR; add(amb, t0, band(n, 1500, 7000) * np.exp(-((t - 0.25) / 0.15) ** 2) * g)
for k in ("p_photo", "r_page", "n_520", "s_report", "e_photo", "e_report"): rustle(K[k] - 0.2)
# ---------------------------------------------------------------- mix
ker = np.ones(int(0.3 * SR)) / int(0.3 * SR)
venv = np.convolve(np.abs(voice), ker, "same"); venv /= venv.max() + 1e-9
vact = np.clip(venv * 4, 0, 1)
fade = np.minimum(1, tg / 1.5) * np.minimum(1, (END - tg) / 3.0)
out = 0.95 * voice + score * (1 - 0.45 * vact) * 0.9 * fade + amb * (1 - 0.4 * vact) * fade
out = np.tanh(out * 1.1) / np.tanh(1.1)
st = np.stack([out, out], 1); st[:, 1] = np.roll(st[:, 1], 9)
wavfile.write(os.path.join(ROOT, "audio/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("mix", END)
