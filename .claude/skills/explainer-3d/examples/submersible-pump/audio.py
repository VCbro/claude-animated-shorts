#!/usr/bin/env python3
"""Synthesized score + sound effects + voice -> audio/mix.wav (48 kHz stereo, exact video length).

Every cue is timed from voice/lines.json with the same word lookups the page uses (web/main.js),
so the sound lands on the picture. Re-run after any change to the voice or the timeline.
"""
import json, os, re
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LANG = os.environ.get("VLANG", "en")
VDIR = "voice_hi" if LANG == "hi" else "voice"
SUF = "_hi" if LANG == "hi" else ""
V = json.load(open(f"{ROOT}/{VDIR}/lines.json"))
LINE = {l["id"]: l for l in V["lines"]}
END = V["duration"] + 1.4
N = int(round(END * SR))
rng = np.random.default_rng(7)


def T(i): return LINE[i]["start"]
def norm(s): return re.sub(r"[^a-z']", "", s.lower())
def wt(i, w, nth=0):
    if w in LINE[i].get("cues", {}): return LINE[i]["cues"][w]
    ws = [x for x in LINE[i]["words"] if norm(x["w"]) == norm(w)]
    return ws[min(nth, len(ws) - 1)]["t"]


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)
def env(n, a, r):  # attack / exponential release, in seconds
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
def add(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += x * gain
def db(x): return 10 ** (x / 20)


# ----------------------------------------------------------------------------- music
BPM = 108
beat = 60 / BPM
def note(m): return 440 * 2 ** ((m - 69) / 12)
# I - V - vi - IV in D major, two bars each chord would be slow; one bar each
CHORDS = [[64, 68, 71], [59, 63, 66], [61, 64, 68], [57, 61, 64]]
music = np.zeros((N, 2))
def pluck(f, dur, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * t) / h ** (1.6 - 0.4 * bright) for h in range(1, 6))
    return x * env(n, 0.004, 0.22)
def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t)) + 0.5 * np.sin(2 * np.pi * f * 2.003 * t) for f in fs)
    a = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return lp(x * a, 1800) / len(fs)
def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 50 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.12)
def hat():
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 7000) * env(n, 0.001, 0.018)
K, HH = kick(), hat()
bar = 4 * beat
nb = int(END / bar) + 1
music_end = V["duration"] + 1.2
for b in range(nb):
    t0 = b * bar
    ch = CHORDS[b % 4]
    p = pad([note(m) for m in ch], bar + 0.3)
    for c in (0, 1): add(music[:, c], p, t0, 0.16)
    bass = pluck(note(ch[0] - 24), beat * 1.8, 0.3)
    for i in (0, 2):
        for c in (0, 1): add(music[:, c], bass, t0 + i * beat, 0.32)
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2] + 12]
    for i, m in enumerate(arp):
        pan = 0.5 + 0.3 * np.sin(i)
        x = pluck(note(m), beat * 0.6, 1.0)
        add(music[:, 0], x, t0 + i * beat / 2, 0.11 * (1 - pan) * 2)
        add(music[:, 1], x, t0 + i * beat / 2, 0.11 * pan * 2)
    if t0 > 0.5:   # the beat comes in after the switch
        for i in range(4):
            for c in (0, 1): add(music[:, c], K, t0 + i * beat, 0.42)
        for i in range(8):
            add(music[:, i % 2], HH, t0 + i * beat / 2 + 0.01, 0.12 if i % 2 else 0.07)
# fade out at the end
tt = np.arange(N) / SR
music *= np.clip((music_end + 0.4 - tt) / 1.2, 0, 1)[:, None]

# ----------------------------------------------------------------------------- sound effects
sfx = np.zeros((N, 2))
def both(x, at, g, pan=0.5):
    add(sfx[:, 0], x, at, g * (1 - pan) * 1.4); add(sfx[:, 1], x, at, g * pan * 1.4)

def click():
    n = int(0.05 * SR)
    return bp(rng.standard_normal(n), 1500, 6000) * env(n, 0.0005, 0.006) + 0.5 * np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * env(n, 0.0005, 0.004)
def whoosh(d=0.55, up=True):
    n = int(d * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    # sweep a band-pass by blocks
    blocks = 24
    for i in range(blocks):
        a, b = i * n // blocks, (i + 1) * n // blocks
        k = i / blocks; f = 400 + 3000 * (k if up else 1 - k)
        out[a:b] = bp(x, f * 0.7, f * 1.3)[a:b]
    shape = np.sin(np.pi * t / d) ** 2
    return out * shape
def pop(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 600 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.035)
def ding(f=1320):
    n = int(0.9 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env(n, 0.002, 0.3)
def clunk():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 110 * t) * 0.7 + lp(rng.standard_normal(n), 900)) * env(n, 0.001, 0.07)
def buzz(d):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 100 * t)) * 0.3 + np.sin(2 * np.pi * 50 * t)
    return lp(x, 1200) * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.3)
def wrong():
    n = int(0.35 * SR); t = np.arange(n) / SR
    return lp(np.sign(np.sin(2 * np.pi * 150 * t)), 2000) * env(n, 0.002, 0.15)
def right():
    return np.concatenate([ding(988)[: int(0.09 * SR)], ding(1480)])

def ramp(t, a, b):
    x = np.clip((t - a) / (b - a), 0, 1); return x ** 3 * (x * (x * 6 - 15) + 10)
def win(t, a, b, f=0.25): return ramp(t, a - f, a) * (1 - ramp(t, b, b + f))
def clink():
    n = int(0.06 * SR); t = np.arange(n) / SR
    f = 2600 + 900 * rng.random()
    return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.51 * t)) * env(n, 0.0005, 0.012)
def bubble():
    n = int(0.09 * SR); t = np.arange(n) / SR
    f0 = 500 + 900 * rng.random()
    return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * t / 0.09)) / SR) * env(n, 0.002, 0.03)

tI, tD, tM = T("install"), T("deep"), T("motor")
tOn, tOff, tOn2 = wt("motor", "motor") - 0.1, wt("valve", "stops") - 0.05, T("why") + 0.4
run = np.where(tt < tI - 0.01, 1.0, np.where(tt < tOn, 0.0,
      ramp(tt, tOn, tOn + 1.4) * (1 - ramp(tt, tOff, tOff + 0.9)) + ramp(tt, tOn2, tOn2 + 1.2)))
underwater = np.clip(win(tt, -1, tI - 0.05, 0.05) + win(tt, tM, T("why") - 0.05, 0.1) + win(tt, T("outro"), wt("outro", "pressure") + 0.3, 0.2), 0, 1)

# underwater bed: deep filtered rumble
rum = lp(rng.standard_normal(N), 220, 4)
rum = rum / (np.abs(rum).max() + 1e-9)
for c in (0, 1): sfx[:, c] += rum * underwater * db(-18)
# motor hum + whine with the run speed
whine_f = 140 + 560 * run
whine = np.sin(2 * np.pi * np.cumsum(whine_f) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(whine_f * 2.02) / SR) * 0.15
hum = np.sin(2 * np.pi * 100 * tt) * 0.5 + np.sin(2 * np.pi * 200 * tt) * 0.2
motor = lp((whine + hum) * np.clip(run * 1.4, 0, 1), 2200) * (0.35 + 0.65 * underwater)
for c in (0, 1): sfx[:, c] += motor * db(-29)
# water rushing in the pipe
water = bp(rng.standard_normal((N, 2)), 250, 3000)
gurgle = 0.65 + 0.35 * np.sin(2 * np.pi * 2.7 * tt + np.sin(2 * np.pi * 0.6 * tt) * 2)
sfx += water * (np.clip(run, 0, 1) * gurgle * (0.5 + 0.5 * underwater))[:, None] * db(-31)
# bubbles while underwater
for i in range(int(END * 6)):
    at = rng.random() * END
    if underwater[min(N - 1, int(at * SR))] > 0.5: both(bubble(), at, 0.07, rng.random())
# install: chain rattle while lowering, clank of the clamp
for i in range(int((tD - tI) * 11)):
    at = tI + 0.3 + i / 11 + rng.random() * 0.03
    both(clink(), at, 0.16, 0.65)
both(clunk(), tI + 0.1, 0.45)
# going down: falling whoosh + depth ticks
both(whoosh(1.6, False), tD + 0.1, 0.35)
for i in range(10):
    both(pop(1500 - 90 * i) * 0.5, tD + 0.2 + 3.5 * (i / 10) ** 0.9, 0.16)
both(clunk(), wt("deep", "level"), 0.4)
# switch on / off
both(click(), tOn - 0.05, 0.9); both(click(), tOn2 - 0.05, 0.9)
both(clunk(), wt("valve", "falling") - 0.05, 0.7)
# whooshes on cuts
for at, up in [(T("question") - 0.6, True), (tI - 0.25, True), (tD - 0.25, False), (tM - 0.25, False), (T("intake") - 0.25, True),
               (T("stages") - 0.25, True), (T("diffuser") - 0.25, False), (T("pressure") - 0.25, True), (T("valve") - 0.25, True),
               (T("why") - 0.25, False), (T("outro") - 0.25, True), (wt("outro", "pressure") + 0.1, True)]:
    both(whoosh(0.6, up), at, 0.33)
# label pops
for lid, w in [("install", "lower"), ("install", "pipe"), ("install", "cable"), ("deep", "soil"), ("deep", "sand"), ("deep", "rock"),
               ("deep", "water"), ("motor", "motor"), ("intake", "intake"), ("stages", "stages"), ("diffuser", "impeller"),
               ("diffuser", "diffuser"), ("valve", "check"), ("why", "surface"), ("why", "pushing")]:
    both(pop(), wt(lid, w) - 0.12, 0.33, 0.5)
# stack opens: clicks
for i in range(5): both(clink(), wt("stages", "not") + 0.15 * i, 0.2)
# pressure bars, one per stage, rising
for i in range(5): both(ding([659, 784, 880, 988, 1175][i]), T("pressure") + 0.15 + i * 0.42, 0.24)
# why: suction fails, push wins
both(wrong(), wt("why", "eight") - 0.05, 0.3)
both(right(), wt("why", "pushing") - 0.05, 0.3)
for i, wd in enumerate(["motor", "stages", "pressure", "tank"]):
    both(ding([880, 1047, 1175, 1568][i]), wt("outro", wd) - 0.05, 0.28)
# water pouring into the tank at the end
splash = lp(rng.standard_normal(int(2.5 * SR)), 2000) * np.minimum(1, np.arange(int(2.5 * SR)) / SR / 0.3)
both(splash, wt("outro", "tank") - 0.3, 0.12)

# ----------------------------------------------------------------------------- voice + mix
v, vsr = sf.read(f"{ROOT}/{VDIR}/voice.wav", dtype="float32")
v = resample_poly(v, SR, vsr) if vsr != SR else v
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
# duck the music under speech (smoothed speech envelope)
e = np.abs(voice)
e = lp(e, 6)
e = e / (e.max() + 1e-9)
duck = 1 - 0.55 * np.clip(e * 4, 0, 1)
music *= duck[:, None]

mix = music * db(-9) + sfx * db(-4) + np.stack([voice, voice], 1) * db(0)
mix *= 0.89 / (np.abs(mix).max() + 1e-9)
os.makedirs(f"{ROOT}/audio", exist_ok=True)
sf.write(f"{ROOT}/audio/mix{SUF}.wav", mix.astype(np.float32), SR, subtype="PCM_24")
sf.write(f"{ROOT}/audio/music{SUF}.wav", (music * db(-9)).astype(np.float32), SR, subtype="PCM_24")
sf.write(f"{ROOT}/audio/sfx{SUF}.wav", (sfx * db(-4)).astype(np.float32), SR, subtype="PCM_24")
print(f"mix {END:.2f} s -> audio/mix{SUF}.wav")
