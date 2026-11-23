#!/usr/bin/env python3
"""Airbag short: word-highlight captions (ASS), numpy SFX + music under the narrator, final 1080x1920@60 compose."""
import json, os, re, subprocess, numpy as np
from scipy.io import wavfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda p: os.path.join(ROOT, p)
CUTS = [0, 4.52, 11.04, 14.06, 20.98, 27.02, 33.70, 41.28, 47.10]   # shot starts (shot 8 = nitrogen again)
END = 51.0
SHOT_SRC = [0, 1, 2, 3, 4, 5, 6, 7, 4]

# ------------------------------------------------------------------ captions
words = [w for s in json.load(open(P("voice/whisper.json"))) for w in s["words"]]
lines, cur = [], []
for w in words:
    cur.append(w)
    if len(cur) >= 4 or re.search(r"[,.?]$", w["w"]):
        lines.append(cur); cur = []
if cur: lines.append(cur)
KEY = re.compile(r"airbag|blink|crash|sensors|milliseconds|igniter|rocket|air\b|air\.|air\?|nitrogen|200|twentieth|secret|vent|softly|0\.05|seatbelt|life|comments|15|propellant", re.I)


def ts(x):
    x = max(0, x); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02}:{s:05.2f}"


ev = []
for li, ln in enumerate(lines):
    t_end = lines[li + 1][0]["t0"] if li + 1 < len(lines) else END - 0.3
    t_end = min(t_end, ln[-1]["t1"] + 0.6)
    for k, w in enumerate(ln):
        a = w["t0"] if k else w["t0"] - 0.04
        b = ln[k + 1]["t0"] if k + 1 < len(ln) else t_end
        parts = []
        for j, x in enumerate(ln):
            txt = x["w"].upper()
            if j == k:
                col = "&H002A8AFF&" if not KEY.search(x["w"]) else "&H00FFE14A&"   # orange / cyan (BGR)
                parts.append(r"{\c" + col + r"\fscx108\fscy108}" + txt + r"{\c&HFFFFFF&\fscx100\fscy100}")
            elif KEY.search(x["w"]) and j < k:
                parts.append(r"{\c&H00FFE14A&}" + txt + r"{\c&HFFFFFF&}")
            else:
                parts.append(txt)
        pop = r"{\fscx70\fscy70\t(0,90,\fscx100\fscy100)}" if k == 0 else ""
        ev.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{pop}" + " ".join(parts))

ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Display Black,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,1,0,1,7,4,2,70,70,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(ev) + "\n"
open(P("out/captions.ass"), "w").write(ass)

# SRT for YouTube
with open(P("deliver/airbag_en.srt"), "w") as f:
    for i, ln in enumerate(lines, 1):
        a, b = ln[0]["t0"], ln[-1]["t1"]
        s = lambda x: f"{int(x // 3600):02}:{int(x % 3600 // 60):02}:{int(x % 60):02},{int(x % 1 * 1000):03}"
        f.write(f"{i}\n{s(a)} --> {s(b)}\n{' '.join(w['w'] for w in ln)}\n\n")

# ------------------------------------------------------------------ audio
SR = 48000; N = int(END * SR); tg = np.arange(N) / SR
rng = np.random.default_rng(5)
sfx = np.zeros(N); mus = np.zeros(N)
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
def tone(d, f, g=1.0, a=0.005, r=0.2, harm=(1,)):
    t = tt(d); return g * sum(np.sin(2 * np.pi * f * h * t) / h for h in harm) * env(len(t), a, r)
def boom(g=1.0, f=45, d=2.0): t = tt(d); return g * (np.sin(2 * np.pi * f * t * (1 - 0.3 * t / d)) + 0.6 * band(len(t), 20, 200)) * np.exp(-t * 3)
def whoosh(d, g=1.0, lo=300, hi=6000): x = band(int(d * SR), lo, hi); t = tt(d); return g * x * np.sin(np.pi * t / d) ** 2
def crunch(g=1.0): t = tt(0.8); return g * band(len(t), 400, 7000) * np.exp(-t * 9) + boom(0.7 * g, 60, 1.2)[:len(t)]
def hiss(d, g=1.0): t = tt(d); return g * band(len(t), 2500, 12000) * env(len(t), 0.02, d * 0.7)

# cut whooshes / risers
for c in CUTS[1:]: add(sfx, c - 0.35, whoosh(0.45, 0.35))
add(sfx, 0.0, whoosh(1.2, 0.3, 150, 3000)); add(sfx, 2.6, tone(0.25, 1760, 0.12))     # "blink" ting
add(sfx, 3.55, whoosh(0.9, 0.25))
# crash
add(sfx, 4.52, crunch(1.0)); add(sfx, 4.52, boom(0.9))
for i in range(3): add(sfx, 9.0 + i * 0.22, tone(0.09, 2400, 0.12, r=0.05))           # sensor beeps
# ECU: data chirps
for i in range(10): add(sfx, 11.1 + i * 0.12, tone(0.05, 1200 + 180 * (i % 4), 0.08, r=0.03))
add(sfx, 13.0, tone(0.3, 880, 0.15, harm=(1, 2)))
# igniter: spark crackle + ignition whomp
add(sfx, 15.2, band(int(0.5 * SR), 3000, 12000) * np.exp(-tt(0.5) * 8) * 0.5)
add(sfx, 17.3, boom(0.8, 55, 2.5)); add(sfx, 17.3, hiss(2.5, 0.25))
add(sfx, 19.0, band(int(1.5 * SR), 200, 2000) * env(int(1.5 * SR), 0.05, 1.2) * 0.25)   # rocket roar
# twist: record-scratch-ish stop
add(sfx, 21.0, tone(0.35, 300, 0.25) * np.linspace(1.6, 0.4, int(0.35 * SR)))
add(sfx, 24.3, hiss(2.6, 0.45)); add(sfx, 24.3, whoosh(2.0, 0.3, 100, 1500))            # nitrogen blast
# burst: whoosh + POP
add(sfx, 26.7, whoosh(0.4, 0.5, 500, 9000)); add(sfx, 27.02, boom(1.0, 70, 1.2)); add(sfx, 27.02, band(int(0.25 * SR), 800, 9000) * np.exp(-tt(0.25) * 18) * 0.9)
add(sfx, 30.6, tone(0.4, 1568, 0.1, r=0.3))
# vents: soft air release
add(sfx, 35.0, band(int(4 * SR), 300, 3000) * env(int(4 * SR), 0.6, 2.5) * 0.18)
add(sfx, 38.3, tone(1.2, 220, 0.12, 0.05, 0.9, (1, 2)))
# final: warm swell
add(sfx, 41.3, tone(5.5, 261.6, 0.10, 0.6, 3, (1, 2)) + tone(5.5, 392, 0.07, 0.6, 3) + tone(5.5, 523.3, 0.05, 0.6, 3))
add(sfx, 47.1, tone(0.3, 988, 0.12, r=0.25)); add(sfx, 47.4, tone(0.4, 1318, 0.1, r=0.3))

# music: 120 bpm tense pulse (kick + bass + arp), drops at the twist and swells at the end
bpm = 120; beat = 60 / bpm
CH = [(110.0, 220, 261.6, 329.6), (87.3, 174.6, 220, 261.6), (130.8, 196, 261.6, 329.6), (98.0, 196, 246.9, 293.7)]
nb = int(END / beat)
for i in range(nb):
    t0 = i * beat; bar = i // 4; ch = CH[bar % 4]
    quiet = 20.9 < t0 < 22.3                                 # "and here's the twist" break
    if quiet: continue
    if t0 > 4.4 and i % 2 == 0: add(mus, t0, boom(0.5, 52, 0.35))
    add(mus, t0, tone(beat * 0.9, ch[0], 0.16, 0.01, 0.2, (1, 2, 3)))
    for k in range(2):
        f = ch[1 + (i * 2 + k) % 3] * 2
        add(mus, t0 + k * beat / 2, tone(beat / 2 * 0.9, f, 0.035, 0.003, 0.15, (1, 2)))
    if t0 > 4.4 and i % 2 == 1: add(mus, t0, band(int(0.08 * SR), 5000, 12000) * np.exp(-tt(0.08) * 40) * 0.12)
inten = np.interp(tg, [0, 4.5, 11, 20.9, 22.3, 27, 33.6, 41.3, 47, END], [0.5, 0.8, 0.9, 1.0, 0.7, 1.0, 0.7, 0.8, 0.6, 0.0])
mus *= inten

w = P("out/voice48.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", P("voice/voice.mp3"), "-ar", str(SR), "-ac", "1", w], check=True)
v = wavfile.read(w)[1].astype(np.float64) / 32768
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]; voice /= np.abs(voice).max() + 1e-9
ker = np.ones(int(0.2 * SR)) / int(0.2 * SR)
vact = np.clip(np.convolve(np.abs(voice), ker, "same") / (np.abs(voice).max() + 1e-9) * 8, 0, 1)
out = 0.95 * voice + mus * (1 - 0.45 * vact) * 0.55 + sfx * (1 - 0.25 * vact) * 0.6
out *= np.minimum(1, (END - tg) / 1.0).clip(0, 1)
out = np.tanh(out * 1.15) / np.tanh(1.15)
st = np.stack([out, np.roll(out, 11)], 1)
wavfile.write(P("out/mix.wav"), SR, (st / np.abs(st).max() * 0.9 * 32767).astype(np.int16))
print("captions", len(ev), "lines", len(lines))
