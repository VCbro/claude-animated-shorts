"""Shared numpy sound kit for the Shorts: build(events, mood) -> audio/mix.wav with the narrator ducking everything.
events: list of (time_s, kind, gain). kinds: whoosh, boom, hit, ding, tick, buzz, hiss, swell, riser, crack, alarm, pop, wind, heartbeat.
mood: 'tense' (dark pulse), 'bright' (light pluck pulse), 'story' (cinematic pad + slow piano), 'night' (storm pad)."""
import json, os, subprocess, numpy as np
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(11)
def tt(d): return np.arange(int(d * SR)) / SR
def band(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def env(n, a, r):
    e = np.ones(n); ai = min(n, max(1, int(a * SR))); ri = min(max(1, n - ai), max(1, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def P(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def boom(f=45, d=2.0): t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * band(len(t), 20, 160)) * np.exp(-t * 2.5)
def whoosh(d=0.8, lo=250, hi=6000): x = band(int(d * SR), lo, hi); t = tt(d); return x * np.sin(np.pi * t / d) ** 2
KIND = {
    'whoosh': lambda: whoosh(0.8) * 0.5,
    'boom': lambda: boom() * 0.9,
    'hit': lambda: P(boom(60, 0.8) * 0.8, band(int(0.2 * SR), 800, 8000) * np.exp(-tt(0.2) * 25) * 0.5),
    'ding': lambda: sum(np.sin(2 * np.pi * f * tt(1.5)) * np.exp(-tt(1.5) * 3) for f in (1318.5, 1975.5)) * 0.18,
    'tick': lambda: band(int(0.03 * SR), 2500, 9000) * np.exp(-tt(0.03) * 150) * 0.4,
    'buzz': lambda: np.sin(2 * np.pi * np.cumsum(560 + 40 * np.sin(2 * np.pi * 7 * tt(2.5))) / SR) * (1 + 0.3 * np.sin(2 * np.pi * 300 * tt(2.5))) * env(int(2.5 * SR), 0.2, 0.4) * 0.07,
    'hiss': lambda: band(int(2.0 * SR), 2000, 10000) * env(int(2.0 * SR), 0.05, 1.2) * 0.3,
    'swell': lambda: sum(np.sin(2 * np.pi * f * tt(4)) for f in (261.6, 329.6, 392.0)) * env(int(4 * SR), 1.0, 2.0) * 0.06,
    'riser': lambda: band(int(1.4 * SR), 400, 6000) * (tt(1.4) / 1.4) ** 2 * 0.35,
    'crack': lambda: band(int(3 * SR), 1500, 12000) * np.exp(-tt(3) * 25) + band(int(3 * SR), 25, 400) * np.exp(-tt(3) * 0.9) * 1.2,
    'alarm': lambda: np.sign(np.sin(2 * np.pi * 620 * tt(0.35))) * env(int(0.35 * SR), 0.01, 0.1) * 0.06,
    'pop': lambda: P(boom(90, 0.4) * 0.6, band(int(0.1 * SR), 1000, 8000) * np.exp(-tt(0.1) * 30) * 0.6),
    'wind': lambda: band(int(4 * SR), 200, 3000) * env(int(4 * SR), 0.5, 1.5) * (0.6 + 0.4 * np.sin(2 * np.pi * tt(4) / 1.3)) * 0.35,
    'heartbeat': lambda: np.concatenate([boom(46, 0.25) * 0.5, np.zeros(int(0.05 * SR)), boom(46, 0.25) * 0.35, np.zeros(int(0.3 * SR))]),
    'glass': lambda: P(band(int(1.2 * SR), 2500, 12000) * np.exp(-tt(1.2) * 5) * 0.6, boom(70, 0.5) * 0.7),
    'engine': lambda: (band(int(4 * SR), 60, 900) * 0.5 + np.sin(2 * np.pi * 110 * tt(4)) * 0.2) * env(int(4 * SR), 0.5, 1.0) * 0.3,
    'launch': lambda: P(band(int(5 * SR), 30, 2500) * env(int(5 * SR), 0.3, 3.0) * 0.6, boom(40, 3) * 0.8),
}

def build(root, events, mood='tense', amb=None):
    K = json.load(open(os.path.join(root, 'out/anchors.json'))); END = K['END']; N = int(END * SR); tg = np.arange(N) / SR
    def add(buf, t0, x, g=1.0):
        i = int(t0 * SR); j = min(N, i + len(x))
        if j > i >= 0: buf[i:j] += g * x[:j - i]
    sfx = np.zeros(N); mus = np.zeros(N); bed = np.zeros(N)
    for t0, kind, g in events:
        t0 = K[t0] if isinstance(t0, str) else t0
        add(sfx, t0, KIND[kind](), g)
    if amb: bed += amb(tg, band, N)
    if mood in ('tense', 'bright', 'night'):
        beat = 60 / (128 if mood != 'bright' else 112)
        f0 = {'tense': 49, 'night': 46, 'bright': 65.4}[mood]
        for i in range(int(END / beat)):
            t0 = i * beat
            if mood == 'bright': add(mus, t0, np.sin(2 * np.pi * [261.6, 329.6, 392, 523.3][i % 4] * tt(0.4)) * np.exp(-tt(0.4) * 9), 0.05)
            if i % 2 == 0: add(mus, t0, boom(f0, 0.35), 0.4)
            else: add(mus, t0, band(int(0.05 * SR), 5000, 11000) * np.exp(-tt(0.05) * 50), 0.05)
        mus += sum(np.sin(2 * np.pi * f * tg) for f in (f0, f0 * 1.5, f0 * 2, f0 * 2.38)) * 0.025
    elif mood == 'story':
        CH = [(130.8, 196.0, 261.6, 329.6), (110.0, 164.8, 220.0, 261.6), (98.0, 146.8, 196.0, 246.9), (116.5, 174.6, 233.1, 293.7)]
        bar = 3.2
        for i in range(int(END / bar) + 1):
            a, b = int(i * bar * SR), min(N, int((i + 1) * bar * SR))
            if a >= N: break
            seg = tg[a:b] - i * bar
            for f in CH[i % 4]: mus[a:b] += 0.022 * np.sin(2 * np.pi * f * seg) * np.minimum(1, seg / 1.0) * np.minimum(1, (bar - seg) / 1.0)
            for k, f in enumerate(CH[i % 4][1:]):                                   # soft piano arpeggio
                t0 = i * bar + k * bar / 3; add(mus, t0, (np.sin(2 * np.pi * f * 2 * tt(1.6)) + 0.3 * np.sin(2 * np.pi * f * 4 * tt(1.6))) * np.exp(-tt(1.6) * 3), 0.05)
    # narrator + mix
    w = os.path.join(root, 'audio/voice48.wav'); os.makedirs(os.path.join(root, 'audio'), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(root, 'voice/voice.wav'), '-ar', str(SR), '-ac', '1', w], check=True)
    v = wavfile.read(w)[1].astype(np.float64) / 32768
    voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
    k = int(0.25 * SR); cs = np.cumsum(np.concatenate([np.zeros(k // 2), np.abs(voice), np.zeros(k - k // 2)]))
    vact = np.clip((cs[k:] - cs[:-k])[:N] / k / (np.abs(voice).max() + 1e-9) * 6, 0, 1)
    out = 0.95 * voice + mus * (1 - 0.5 * vact) * 0.55 + bed * (1 - 0.4 * vact) * 0.5 + sfx * (1 - 0.2 * vact) * 0.75
    out = np.tanh(out * 1.15) / np.tanh(1.15)
    st = np.stack([out, np.roll(out, 9)], 1)
    wavfile.write(os.path.join(root, 'audio/mix.wav'), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
    print('mix', END)
