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
V = json.load(open(f"{ROOT}/voice/lines.json"))
LINE = {l["id"]: l for l in V["lines"]}
END = V["duration"] + 1.4
N = int(round(END * SR))
rng = np.random.default_rng(7)


def T(i): return LINE[i]["start"]
def norm(s): return re.sub(r"[^a-z']", "", s.lower())
def wt(i, w, nth=0):
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
BPM = 112
beat = 60 / BPM
def note(m): return 440 * 2 ** ((m - 69) / 12)
# I - V - vi - IV in D major, two bars each chord would be slow; one bar each
CHORDS = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]]
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

tOn = 0.55
both(click(), tOn - 0.06, 0.9)

# motor: mains hum + a whine that follows the spin speed (same curve as the page's omega())
def ramp(t, a, b):
    x = np.clip((t - a) / (b - a), 0, 1); return x ** 3 * (x * (x * 6 - 15) + 10)
def win(t, a, b, f=0.25): return ramp(t, a - f, a) * (1 - ramp(t, b, b + f))
st, drag = T("stator"), wt("field", "drags")
w = 10 * ramp(tt, tOn, tOn + 1.1)
w *= 1 - ramp(tt, st - 0.2, st + 0.5)
w += 13 * ramp(tt, drag - 0.1, drag + 1.6) * (1 - ramp(tt, T("impeller") - 0.2, T("impeller") + 0.8))
w += 8.5 * ramp(tt, T("impeller") - 0.2, T("impeller") + 0.8)
w += 3 * ramp(tt, T("outro"), T("outro") + 1)
speed = w / 23.0                          # 0..1
whine_f = 180 + 520 * speed
whine = np.sin(2 * np.pi * np.cumsum(whine_f) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(whine_f * 2) / SR) * 0.15
hum = np.sin(2 * np.pi * 100 * tt) * 0.6 + np.sin(2 * np.pi * 200 * tt) * 0.2
motor = (whine + hum) * np.clip(speed * 1.6, 0, 1) * np.clip((END - 0.6 - tt) / 0.8, 0, 1)
motor = lp(motor, 2500)
for c in (0, 1): sfx[:, c] += motor * db(-27)

# water: filtered noise while the flow is on, louder inside the pump
water_lvl = np.clip(ramp(tt, tOn + 0.4, tOn + 1.5) * 0.6 + win(tt, T("eye"), T("push") + 1.0, 0.4) * 0.8
                    + win(tt, wt("prime", "water"), T("outro") + 0.5, 0.2) * 0.8, 0, 1.2) * np.clip((END - 0.4 - tt) / 1.0, 0, 1)
wn = rng.standard_normal((N, 2))
water = bp(wn, 300, 3500)
gurgle = 0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * tt + np.sin(2 * np.pi * 0.7 * tt) * 2)
sfx += water * (water_lvl * gurgle)[:, None] * db(-30)

# whooshes on the cuts and big camera moves
for at, up in [(T("question") - 0.6, True), (T("question") + 1.4, False), (T("two") - 0.3, True), (T("stator") - 0.3, True),
               (T("field") + 0.4, True), (T("impeller") - 0.3, True), (T("eye") - 0.3, False), (T("push") - 0.1, True),
               (T("prime") - 0.3, False), (T("outro") - 0.3, True)]:
    both(whoosh(0.6, up), at, 0.35)
# label pops
for a in [wt("two", "shaft"), wt("two", "electric"), wt("two", "pump"), wt("stator", "copper"), wt("field", "rotor"),
          wt("impeller", "impeller"), wt("eye", "eye"), wt("volute", "volute"), wt("push", "pipe")]:
    both(pop(), a - 0.12, 0.35, 0.5)
# power buzz as the coils energise
both(buzz(T("field") + 0.5 - wt("stator", "power")), wt("stator", "power"), 0.12)
# casing opens, closes, cover goes back
open0 = wt("impeller", "pump")
both(clunk(), open0 - 0.05, 0.6); both(whoosh(0.5, True), open0 - 0.1, 0.25)
both(clunk(), T("eye") + 0.45, 0.6)
both(clunk(), T("outro") + 1.3, 0.5)
# rpm counter ticks
r0 = wt("field", "nearly")
for i in range(16):
    both(pop(1800 + 60 * i) * 0.5, r0 + 1.6 * (i / 16) ** 0.7, 0.18)
# chips
both(ding(1175), wt("volute", "pressure") - 0.05, 0.3)
both(wrong(), wt("prime", "air") - 0.05, 0.28)
both(right(), wt("prime", "water") - 0.05, 0.3)
for i, wd in enumerate(["electricity", "magnetism", "spin", "pressure"]):
    both(ding([880, 1047, 1175, 1568][i]), wt("outro", wd) - 0.05, 0.28)
# water arriving in the tank
tank_at = tOn + 0.5 + 0  # front reaches the tank ~3.9 s; a splash there
both(lp(rng.standard_normal(int(0.8 * SR)), 2500) * env(int(0.8 * SR), 0.02, 0.25), 3.85, 0.25)

# ----------------------------------------------------------------------------- voice + mix
v, vsr = sf.read(f"{ROOT}/voice/voice.wav", dtype="float32")
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
sf.write(f"{ROOT}/audio/mix.wav", mix.astype(np.float32), SR, subtype="PCM_24")
sf.write(f"{ROOT}/audio/music.wav", (music * db(-9)).astype(np.float32), SR, subtype="PCM_24")
sf.write(f"{ROOT}/audio/sfx.wav", (sfx * db(-4)).astype(np.float32), SR, subtype="PCM_24")
print(f"mix {END:.2f} s -> audio/mix.wav")
