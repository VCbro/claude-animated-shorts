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
BPM = 112
beat = 60 / BPM
def note(m): return 440 * 2 ** ((m - 69) / 12)
# I - V - vi - IV in D major, two bars each chord would be slow; one bar each
CHORDS = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]
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
    x = rng.standard_normal(n); out = np.zeros(n); blocks = 24
    for i in range(blocks):
        a_, b_ = i * n // blocks, (i + 1) * n // blocks
        k = i / blocks; f = 400 + 3000 * (k if up else 1 - k)
        out[a_:b_] = bp(x, f * 0.7, f * 1.3)[a_:b_]
    return out * np.sin(np.pi * t / d) ** 2
def pop(f=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 600 * np.exp(-t * 40)) * t) * env(n, 0.001, 0.035)
def ding(f=1320):
    n = int(0.9 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env(n, 0.002, 0.3)
def boom(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(38 + 90 * np.exp(-t * 9)) / SR) * env(n, 0.003, 0.32)
    crack = lp(rng.standard_normal(n), 3000) * env(n, 0.001, 0.06)
    rumble = lp(rng.standard_normal(n), 180, 4) * env(n, 0.02, 0.5) * 4
    return body + 0.6 * crack + 0.5 * rumble
def zap():
    n = int(0.16 * SR); t = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 2500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 70 * t)))
    return x * env(n, 0.001, 0.05)
def thump(f0=70, r=0.05):
    n = int(0.25 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 + 60 * np.exp(-t * 50)) / SR) * env(n, 0.001, r) + 0.35 * lp(rng.standard_normal(n), 1500) * env(n, 0.0005, r * 0.4)
def ramp(t, a, b):
    x = np.clip((t - a) / (b - a), 0, 1); return x ** 3 * (x * (x * 6 - 15) + 10)
def win(t, a, b, f=0.25): return ramp(t, a - f, a) * (1 - ramp(t, b, b + f))
def clink():
    n = int(0.05 * SR); t = np.arange(n) / SR
    f = 2600 + 900 * rng.random()
    return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.51 * t)) * env(n, 0.0005, 0.01)

# the crank timeline from the page (tools/dump_engine.py)
EJ = json.load(open(f"{ROOT}/audio/engine{SUF}.json"))
th = np.interp(tt, np.arange(len(EJ["th"])) / 1000, EJ["th"])
w = np.gradient(th) * SR                                  # crank rad/s
fast = np.clip((np.abs(w) - 4) / 6, 0, 1)
fast = lp(fast, 3)
# running engine: a realistic putt-putt at idle-to-mid revs while the picture runs fast
rate = 22 + 2.2 * np.abs(w)                              # firing pulses per second for the sound
phase = np.cumsum(rate) / SR
idx = np.nonzero(np.diff(np.floor(phase)) > 0)[0]
TH = thump(62, 0.04)
for i in idx:
    g = fast[i]
    if g < 0.03: continue
    both(TH * (0.85 + 0.3 * rng.random()), i / SR, 0.26 * g, 0.5 + 0.08 * (rng.random() - 0.5))
mech = bp(rng.standard_normal(N), 900, 4000) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(rate * 3) / SR))
for c in (0, 1): sfx[:, c] += mech * fast * db(-34)
whine = np.sin(2 * np.pi * np.cumsum(120 + 18 * np.abs(w)) / SR)
for c in (0, 1): sfx[:, c] += lp(whine, 1500) * np.clip(np.abs(w) / 16, 0, 1) * db(-36)
# slow motion: each stroke breathes; each slow ignition is a spark and a boom
cyc = np.mod(np.degrees(th), 720)
slow = 1 - fast
air = bp(rng.standard_normal(N), 300, 2500)
inflow = np.where(cyc < 200, 1.0, 0.0) * np.abs(w) / 3.0
exflow = np.where(cyc > 520, 1.0, 0.0) * np.abs(w) / 3.0
for c in (0, 1):
    sfx[:, c] += air * lp(np.clip(inflow, 0, 1) * slow, 8) * db(-22)
    sfx[:, c] += lp(rng.standard_normal(N), 700) * lp(np.clip(exflow, 0, 1) * slow, 8) * db(-17)
squeeze = np.sin(2 * np.pi * np.cumsum(90 + 260 * np.clip((cyc - 180) / 175, 0, 1)) / SR)
for c in (0, 1): sfx[:, c] += squeeze * lp(np.where((cyc > 180) & (cyc < 356), 1.0, 0.0) * np.clip(np.abs(w) / 2, 0, 1) * slow, 8) * db(-28)
for t0, tau in EJ["ign"]:
    i = min(N - 1, int(t0 * SR))
    if fast[i] > 0.5: continue
    big = np.clip((tau - 0.05) / 0.3, 0, 1)
    both(zap(), t0 - 0.02, 0.35)
    both(boom(1.4 if big > 0.5 else 0.6), t0 + 0.12 * big, 0.55 + 0.4 * big)
# valve ticks in slow motion: when a valve starts to open
for name, at in [("I", 0.0), ("E", 520.0)]:
    a = np.mod(np.degrees(th) - at, 720)
    cross = np.nonzero((a[1:] < 30) & (a[:-1] > 690))[0]
    for i in cross:
        if fast[i] < 0.5: both(click() * 0.6, i / SR, 0.35, 0.6)
# chain and gears in the drive line, wind through the fins
dr = win(tt, T("drive"), T("fins") - 0.05, 0.15)
chainK = bp(rng.standard_normal(N), 2500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(8 + 2.5 * np.abs(w)) / SR)))
for c in (0, 1): sfx[:, c] += chainK * dr * db(-34)
wind = bp(rng.standard_normal((N, 2)), 200, 1800)
sfx += wind * (win(tt, T("fins"), T("outro") - 0.05, 0.2))[:, None] * db(-22)
# whooshes on cuts
cuts = [T("question") - 0.25, T("parts") - 0.25, T("valves") - 0.25, T("intake") - 0.25, T("compress") - 0.25, T("power") - 0.25,
        T("exhaust") - 0.25, wt("exhaust", "silencer") - 0.4, T("cycle") - 0.25, T("drive") - 0.25, T("fins") - 0.25, T("outro") - 0.25, wt("outro", "that's") + 0.1]
for i, at in enumerate(cuts): both(whoosh(0.6, i % 2 == 0), at, 0.3)
# label pops
for lid, wd in [("parts", "piston"), ("parts", "cylinder"), ("parts", "connecting"), ("parts", "crankshaft"), ("valves", "air"), ("valves", "exhaust"),
                ("valves", "camshaft"), ("intake", "petrol"), ("power", "spark"), ("exhaust", "silencer"), ("cycle", "flywheel"),
                ("drive", "clutch"), ("drive", "gearbox"), ("drive", "chain"), ("drive", "wheel"), ("fins", "fins")]:
    both(pop(), wt(lid, wd) - 0.12, 0.3)
# stroke chips: a note each
for i, lid in enumerate(["intake", "compress", "power", "exhaust"]):
    both(ding([659, 784, 880, 988][i]), T(lid) + 0.05, 0.2)
for i, wd in enumerate(["suck", "squeeze", "bang", "blow"]):
    both(ding([880, 1047, 1175, 1568][i]), wt("outro", wd) - 0.05, 0.25)
both(ding(1320), wt("hook", "fifty") - 0.05, 0.18)

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
