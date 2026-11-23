#!/usr/bin/env python3
"""The Parker Incident: room tone + named action sounds + low sparse suspense score + ducked narration
-> audio/mix.wav (48 kHz stereo). Every cue is timed from voice/lines.json and web/plan.js, the same
sources the picture uses, so sound lands on picture.
"""
import json, os, re
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
V = json.load(open(f"{ROOT}/voice/lines.json"))
LINE = {l["id"]: l for l in V["lines"]}
PLAN = json.loads(re.search(r"/\*JSON\*/(.*)/\*END\*/", open(f"{ROOT}/web/plan.js").read(), re.S).group(1))
DUR = V["duration"] + 5.0
END_AT = V["duration"] + 0.4
N = int(round(DUR * SR))
rng = np.random.default_rng(809)
tt = np.arange(N) / SR


def norm(s): return re.sub(r"[^a-z']", "", s.lower())
def T(i): return LINE[i]["start"]
def wt(i, w, nth=0):
    ws = [x for x in LINE[i]["words"] if norm(x["w"]) == norm(w)]
    return ws[min(nth, len(ws) - 1)]["t"]
def at(s):
    if isinstance(s, (int, float)): return float(s)
    return T(s[0]) + s[1] if len(s) == 2 else wt(s[0], s[1]) + s[2]
P = {k: (v if isinstance(v, (int, float)) else at(v)) for k, v in PLAN.items() if k != "walks"}
S2, S3 = T("s2a") - 1.5, T("s3a") - 1.6
WALK = {}
for k, w in PLAN["walks"].items():
    pts = np.array(w["path"], float)
    ln = float(np.sum(np.linalg.norm(np.diff(pts, axis=0), axis=1)))
    t0 = at(w["t0"])
    WALK[k] = dict(t0=t0, t1=t0 + ln / w["speed"], len=ln, speed=w["speed"], step=w["step"])


def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype="band", fs=SR, output="sos"), x, axis=0)
def lp(x, f, o=2): return sosfilt(butter(o, f, btype="low", fs=SR, output="sos"), x, axis=0)
def hp(x, f, o=2): return sosfilt(butter(o, f, btype="high", fs=SR, output="sos"), x, axis=0)
def env(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
def db(x): return 10 ** (x / 20)
def sm(a, b, t):
    x = np.clip((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)

sfx = np.zeros((N, 2)); music = np.zeros((N, 2))
def put(buf, x, t, g=1.0, pan=0.5):
    i = int(t * SR)
    if i >= N or i < 0: return
    x = x[: N - i]
    buf[i:i + len(x), 0] += x * g * (1 - pan) * 1.4
    buf[i:i + len(x), 1] += x * g * pan * 1.4

# ----------------------------------------------------------------------------- beds
lab_on = 1 - sm(S3 - 0.5, S3 - 0.05, tt)
alley_on = sm(S3 + 0.1, S3 + 0.9, tt)
fade_all = 1 - sm(END_AT, END_AT + 2.5, tt)
noise = rng.standard_normal((N, 2))
hvac = lp(noise, 260) * 0.9 + bp(noise, 300, 1400) * 0.15
hum = (np.sin(2 * np.pi * 60 * tt) * 0.25 + np.sin(2 * np.pi * 120 * tt) * 0.35 + np.sin(2 * np.pi * 240 * tt) * 0.08)
sfx += (hvac * db(-30) + hum[:, None] * db(-40)) * (lab_on * fade_all)[:, None]
city = lp(noise[:, ::-1], 380) * 1.2 + bp(noise, 500, 2200) * 0.06
traffic = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * tt + 1.3)
sfx += city * db(-29) * (alley_on * fade_all * traffic)[:, None]

# ----------------------------------------------------------------------------- one-shots
def step(hard=True):
    n = int(0.16 * SR)
    x = bp(rng.standard_normal(n), 250, 3200 if hard else 1800) * env(n, 0.002, 0.03)
    thump = np.sin(2 * np.pi * 90 * np.arange(n) / SR) * env(n, 0.002, 0.04)
    return x * 0.8 + thump * 0.5
def wet_step():
    a = step(False); n = len(a)
    return a * 0.8 + bp(rng.standard_normal(n), 1200, 6000) * env(n, 0.01, 0.05) * 0.35
def click(f=3200, d=0.008):
    n = int(0.06 * SR)
    return bp(rng.standard_normal(n), 1500, 8000) * env(n, 0.0004, d) + np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, 0.0004, d * 0.7) * 0.6
def beep(f=1000, d=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.01)
def thud(f=70, d=0.45):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + lp(rng.standard_normal(n), 500) * 0.6) * env(n, 0.002, 0.09)
def scrape(d=0.35, lo=600, hi=4000):
    n = int(d * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), lo, hi) * np.sin(np.pi * t / d) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * 37 * t))
def swish(d=0.4):
    n = int(d * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 500, 3000) * np.sin(np.pi * t / d) ** 2
def tick():
    n = int(0.012 * SR)
    return hp(rng.standard_normal(n), 5000) * env(n, 0.0002, 0.0015)
def drip():
    n = int(0.25 * SR); t = np.arange(n) / SR
    f = 1400 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.035)

# footsteps from the walk plan (step at distance (k+0.5)*step)
for k, w in WALK.items():
    d = 0.5 * w["step"]; i = 0
    while d < w["len"] - 0.1:
        t = w["t0"] + d / w["speed"]
        if k == "alley": put(sfx, wet_step(), t, db(-14), 0.45 + 0.1 * (i % 2))
        else: put(sfx, step(), t, db(-16), 0.45 + 0.1 * (i % 2))
        d += w["step"]; i += 1
# door: badge beep, latch, close; and on the way out
put(sfx, beep(1050), P["door_open"] - 0.35, db(-24), 0.7)
put(sfx, click(1800, 0.02), P["door_open"], db(-14), 0.7); put(sfx, swish(0.9), P["door_open"] + 0.1, db(-26), 0.7)
put(sfx, thud(65), P["door_close"] + 1.1, db(-12), 0.7)
put(sfx, click(1800, 0.02), WALK["leave"]["t1"] - 2.6, db(-16), 0.7)
# the latch and the lid
put(sfx, click(3400, 0.012), P["latch"], db(-6), 0.45)
put(sfx, scrape(1.1, 900, 5000), P["lid_lift"], db(-30), 0.45)
# the specimen: tiny ticks while it moves
EX, CT = P["spider_exit"], P["contact"]
t = EX - 0.6
while t < 41.2:
    put(sfx, tick(), t, db(-27) * (0.6 + 0.4 * rng.random()), 0.4 + 0.2 * rng.random())
    t += 0.05 + 0.09 * rng.random()
for t in np.arange(CT + 0.4, CT + 1.6, 0.06): put(sfx, tick(), t, db(-28), 0.35)
# contact: a single low pulse + the fabric jerk
n = int(1.6 * SR); x = np.sin(2 * np.pi * 48 * np.arange(n) / SR) * env(n, 0.003, 0.35)
put(sfx, x, CT, db(-6))
put(sfx, swish(0.35), CT + 0.08, db(-14), 0.55)
put(sfx, click(900, 0.03), P["put_down"] + 0.58, db(-16), 0.4)
lc0 = max(P["lid_close"] + 0.15, P["put_down"] + 0.9)
put(sfx, click(3000, 0.015), lc0 + 0.6, db(-9), 0.4)
# alley: drips, a far siren, palms on brick, the climb
t = S3 + 0.5
while t < END_AT:
    put(sfx, drip(), t, db(-26), 0.2); t += 1.1 + 0.9 * rng.random()
s0 = T("s3c") - 1.0; sd = 7.5
n = int(sd * SR); ts = np.arange(n) / SR
f = 700 + 220 * np.sign(np.sin(2 * np.pi * 0.7 * ts))
siren = lp(np.sin(2 * np.pi * np.cumsum(f) / SR), 900) * np.sin(np.pi * ts / sd) ** 2
put(sfx, siren, s0, db(-36), 0.8)
put(sfx, scrape(0.3, 400, 2500), P["hand_right"], db(-18), 0.4)
put(sfx, scrape(0.3, 400, 2500), P["hand_left"], db(-18), 0.5)
c0, c1, H = P["climb_start"], P["climb_start"] + P["climb_time"], P["climb_height"]
def ramp_linear(t, a, b, r):
    D = b - a; u = min(max(t - a, 0), D); v = 1 / (D - r)
    if u < r: return 0.5 * v * u * u / r
    if u < D - r: return v * (u - r / 2)
    return 1 - 0.5 * v * (D - u) ** 2 / r
C = 0.9; last = {}
for t in np.arange(c0, c1, 1 / 120):
    h = H * ramp_linear(t, c0, c1, 1.0)
    for side, s in (("R", 0.0), ("L", 0.5)):
        k = int(np.floor(h / C + s - 0.86))
        if last.get(side, k) != k: put(sfx, scrape(0.22, 500, 3500), t, db(-20), 0.4 if side == "R" else 0.6)
        last[side] = k

# ----------------------------------------------------------------------------- score: low, sparse, suspenseful
def note(m): return 440 * 2 ** ((m - 69) / 12)
drone_lvl = (0.55 + 0.45 * sm(EX - 2, CT, tt)) * (1 - 0.5 * sm(CT + 2, S3, tt)) * (1 - sm(END_AT + 2.0, DUR, tt)) * sm(0.5, 4.0, tt)
drone = (np.sin(2 * np.pi * note(38) * tt) * 0.6 + np.sin(2 * np.pi * note(45) * tt + 0.4 * np.sin(2 * np.pi * 0.11 * tt)) * 0.35
         + np.sin(2 * np.pi * note(50) * 1.002 * tt) * 0.15)
drone *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * tt)
music += (drone * drone_lvl)[:, None] * db(-14)
air = lp(hp(rng.standard_normal((N, 2)), 2500), 6000) * (0.4 + 0.6 * np.sin(2 * np.pi * 0.05 * tt) ** 2)[:, None]
music += air * db(-46) * drone_lvl[:, None]
def low_note(m, d=5.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * note(m) * h * t) * np.exp(-t * (0.9 + h * 0.6)) / h for h in (1, 2, 3, 4))
    return lp(x * np.minimum(1, t / 0.01), 1800)
seq = [(5.0, 50), (11.5, 53), (17.0, 45), (22.6, 48), (30.0, 50), (36.0, 46), (47.5, 50), (55.0, 53),
       (65.0, 45), (71.0, 48), (77.5, 46), (85.0, 50), (91.0, 53), (97.0, 45)]
for t, m in seq: put(music, low_note(m), t, db(-9), 0.5)
# heartbeat-like pulse while the specimen moves
t = EX
while t < CT - 0.3:
    n = int(0.3 * SR); x = np.sin(2 * np.pi * 55 * np.arange(n) / SR) * env(n, 0.004, 0.07)
    put(music, x, t, db(-10)); put(music, x, t + 0.28, db(-15)); t += 1.15
# the climb: a slow rising tone, resolving to one held low note
n = int((c1 - c0 + 2) * SR); ts = np.arange(n) / SR
rise = np.sin(2 * np.pi * np.cumsum(note(57) * (1 + 0.06 * ts / ts[-1])) / SR) * np.sin(np.pi * ts / ts[-1]) ** 2
put(music, lp(rise, 1500), c0, db(-24))
n = int(9 * SR); ts = np.arange(n) / SR
held = (np.sin(2 * np.pi * note(38) * ts) + 0.5 * np.sin(2 * np.pi * note(45) * ts)) * np.minimum(1, ts / 1.5) * np.minimum(1, (9 - ts) / 3)
put(music, held, c1, db(-12))
put(music, thud(42, 2.5), END_AT + 0.8, db(-6))

# ----------------------------------------------------------------------------- voice + mix
v, vsr = sf.read(f"{ROOT}/voice/voice.wav", dtype="float32")
v = resample_poly(v, SR, vsr) if vsr != SR else v
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
e = lp(np.abs(voice), 5); e = e / (e.max() + 1e-9)
duck = 1 - 0.6 * np.clip(e * 4, 0, 1)
music *= duck[:, None]; sfx *= (1 - 0.35 * np.clip(e * 4, 0, 1))[:, None]
mix = music * db(-6) + sfx * db(-3) + np.stack([voice, voice], 1) * db(0)
mix *= 0.89 / (np.abs(mix).max() + 1e-9)
os.makedirs(f"{ROOT}/audio", exist_ok=True)
sf.write(f"{ROOT}/audio/mix.wav", mix.astype(np.float32), SR, subtype="PCM_24")
print(f"mix {DUR:.2f} s -> audio/mix.wav")
