"""Score + foley + voice -> out/mix.wav (48 kHz stereo). Reads events.json (from the page) and the VO table in main.js.
Run with the library's Python: "$LIB/.venv/bin/python" mix.py   (LIB is taken from the environment, default ~/lemo-opuscar)"""
import json, os, re, sys
import numpy as np, soundfile as sf, soxr
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
from core.audio import sfx as X
from core.audio import pluck as P
SR = X.SR
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur'] + 0.4
N = int(DUR * SR)
rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2)); voc = np.zeros((N, 2))
src = open(os.path.join(HERE, 'main.js')).read()
VO = [(m[0], float(m[1]), float(m[2])) for m in re.findall(r"\['(v\d\d)', ([\d.]+), ([\d.]+),", src)]

# ---------------- score: 80 bpm, bar = 3 s, G - D/F# - Em - C ----------------
BEAT = .75
CH = [[43, 55, 59, 62, 67], [42, 54, 57, 62, 66], [40, 52, 55, 59, 64], [36, 48, 55, 60, 64]]
def chord(t): return CH[int(t // 3) % 4]
def sec(t):
    for a, b, name in [(0, 9.0, 'page'), (9.0, 12.95, 'stencil'), (12.95, 13.7, 'quiet'), (13.7, 19.2, 'needle'), (19.2, 28.2, 'skin'),
                       (28.2, 33.0, 'cells'), (33.0, 37.3, 'burst'), (37.3, 40.1, 'heal'), (40.1, 41.0, 'quiet'), (41.0, 99, 'end')]:
        if a <= t < b: return name
gtr = lambda m, v=.5, d=None: P.pluck('nylon_guitar', m, d, vel=v)
for i in range(int(DUR / (BEAT / 2))):
    t = i * BEAT / 2; s = sec(t); c = chord(t); bi = i % 8   # eighth-note index inside the bar
    if s in ('quiet', 'end') or t > 46.5: continue
    if s == 'page' and bi % 2 == 0: X.add(mus, gtr(c[[0, 2, 3, 4][bi // 2]], .42), t, .9, -.2)
    if s == 'stencil' and bi % 2 == 0: X.add(mus, gtr(c[[0, 2, 3, 4][bi // 2]], .45), t, .9, -.2)
    if s == 'stencil' and bi in (0, 4): X.add(mus, P.pluck('kalimba', c[4] + 12, vel=.5), t, .55, .3)
    if s == 'needle': X.add(mus, gtr(c[[0, 3, 2, 3, 1, 3, 2, 4][bi]], .5), t, .85, -.2)
    if s == 'needle' and bi % 2 == 0: X.add(mus, P.pluck('upright_bass_pizz', c[0], vel=.55), t, .7, 0)
    if s == 'skin' and bi == 0: X.add(mus, gtr(c[[3, 4, 2, 3][int(t // 3) % 4]], .4), t, .8, -.1)
    if s == 'burst': X.add(mus, gtr(c[[0, 3, 2, 3, 1, 4, 2, 4][bi]], .58), t, .9, -.2)
    if s == 'burst' and bi % 2 == 0: X.add(mus, P.pluck('upright_bass_pizz', c[0], vel=.6), t, .75, 0)
    if s == 'burst' and bi in (0, 3, 6): X.add(mus, P.pluck('kalimba', c[[4, 3, 2][bi // 3]] + 12, vel=.55), t, .55, .35)
    if s == 'heal' and bi % 2 == 0: X.add(mus, gtr(c[[0, 2, 3, 4][bi // 2]], .38), t, .8, -.2)
# colour burst: one strummed chord on the downbeat of the colour
X.add(mus, P.strum('nylon_guitar', CH[0][1:] + [71], 3, vel=.7, spread=.03), 36.1, 1.0, -.1)
# music box: one note per healing day, and two in the cells
for t, m in [(37.4, 79), (38.4, 83), (39.4, 86), (29.0, 74), (31.2, 79)]: X.add(mus, P.pluck('music_box', m, vel=.5), t, .55, .25)
# the end: a single kalimba note after the near-silence, then the title chord rings out
X.add(mus, P.pluck('kalimba', 79, vel=.6), 41.0, .8, 0)
X.add(mus, P.strum('nylon_guitar', [43, 55, 59, 62, 67, 71], 4.5, vel=.6, spread=.05), 42.6, 1.0, -.1)
X.add(mus, P.pluck('kalimba', 74, vel=.4), 44.6, .5, .3)

# pad: chord tones, slow attack, darker in the skin, alone in the cells
def pad(t0, t1, gain, dark=False):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; y = np.zeros(n)
    for j in range(n // int(3 * SR) + 1):
        a = j * int(3 * SR); b = min(n, a + int(3 * SR)); c = chord(t0 + a / SR)
        for m in c[1:4]:
            f = 440 * 2 ** ((m + (0 if m >= 48 else 12) - 69) / 12)
            for d in (-.12, .12): y[a:b] += np.sin(2 * np.pi * f * (1 + d / 100) * tt[a:b] + rng.random() * 6)
    y = X.lp(y, 700 if dark else 1400); env = np.minimum(1, np.minimum(tt / 1.2, (tt[-1] - tt) / 1.0)); y = y * env
    y = y / (np.abs(y).max() + 1e-9) * gain
    X.add(mus, y, t0, 1, 0)
pad(0.0, 12.9, .05); pad(13.7, 19.4, .045); pad(19.2, 28.4, .07, True); pad(28.2, 33.2, .085, True); pad(33.0, 40.0, .05); pad(42.4, 47.2, .05)

# ---------------- foley ----------------
def brush(d, v=1.0):
    n = X.noise(d); y = X.bp(n, 1400, 6500) * (1 + .5 * np.sin(2 * np.pi * 9 * X.t_(d)))
    e = np.minimum(1, X.t_(d) / .08) * np.minimum(1, (d - X.t_(d)) / .25); return y * e * v * .16
def pencil(d, v=1.0):
    n = X.noise(d); am = np.abs(np.sin(2 * np.pi * 7 * X.t_(d))) ** 2 * (.6 + .4 * rng.random(len(n)))
    e = np.minimum(1, X.t_(d) / .03) * np.minimum(1, (d - X.t_(d)) / .1); return X.bp(n, 2500, 7500) * am * e * v * .14
def wash(d, v=1.0):
    e = np.sin(np.pi * np.clip(X.t_(d) / d, 0, 1)); return X.bp(X.noise(d), 250, 1800) * e * v * .2
def buzz(d, v=1.0, muffled=False):
    tt = X.t_(d); f = 118 + 1.5 * np.sin(2 * np.pi * .7 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 14)) * (.75 + .25 * np.sin(2 * np.pi * 59 * tt))
    y += .25 * X.bp(X.noise(d), 3000, 8000) * (np.sin(ph) > .9)
    y = X.lp(y, 650 if muffled else 5200); y = X.hp(y, 80)
    e = np.minimum(1, tt / .06) * np.minimum(1, (d - tt) / .15); y = y * e
    return y / (np.abs(y).max() + 1e-9) * v * .22
def drip(v=1.0):
    d = .07; tt = X.t_(d); f = 1300 - 600 * tt / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .018) * v * .25
def flake(d, v=1.0):
    y = np.zeros(int(d * SR))
    for _ in range(int(40 * d)):
        s = int(rng.random() * (len(y) - 300)); c = X.bp(X.noise(.006), 2500, 9000) * np.exp(-np.arange(int(.006 * SR)) / 40); y[s:s + len(c)] += c * rng.random()
    return y * v * .5
for e in ev['ev']:
    t, k, v, pan, d = e['t'], e['type'], e.get('v', 1), e.get('pan', 0), e.get('d', .5)
    if k == 'brush': X.add(fol, brush(d, v), t, 1, pan)
    elif k == 'pencil': X.add(fol, pencil(d, v), t, 1, pan)
    elif k == 'dab': X.add(fol, brush(.3, v), t, 1, 0)
    elif k == 'whoosh': w = X.whoosh(d, v) * .22; X.add(fol, X.lp(w, 900) if e.get('low') else w, t, 1, 0)
    elif k == 'thump': X.add(fol, X.thump(v, 90) * .5, t, 1, 0)
    elif k == 'peel': X.add(fol, X.bp(X.noise(d), 900, 4000) * np.linspace(.2, 1, int(round(d * SR))) * np.exp(-X.t_(d) / .5) * v * .12, t, 1, .2)
    elif k == 'buzz': X.add(fol, buzz(d, v, e.get('muffled')), t, 1, .1)
    elif k == 'wash': X.add(fol, wash(d, v), t, 1, pan)
    elif k == 'drip': X.add(fol, drip(v), t, 1, max(-1, min(1, pan)))
    elif k == 'plink': X.add(fol, P.pluck('kalimba', [86, 83, 79, 91, 88, 84, 81, 93][e.get('n', 0) % 8], vel=.35) * .5, t, 1, max(-1, min(1, pan)))
    elif k == 'bloom': X.add(fol, wash(d, v) * 1.2 + brush(d, v * .6), t, 1, 0)
    elif k == 'flake': X.add(fol, flake(d, v), t, 1, 0)
    elif k == 'lift': X.add(fol, brush(.18, v) * np.linspace(1, 0, int(round(.18 * SR))), t, 1, -.3)

# ---------------- ambience: room, and a muffled body bed under the skin ----------------
room = X.lp(X.brown(DUR), 900); room = room / (np.abs(room).max() + 1e-9) * .02
X.add(amb, room, 0, 1, 0)
inside = X.lp(X.brown(14), 220); tt = X.t_(14); inside *= np.minimum(1, np.minimum(tt / 1.2, (14 - tt) / 1.2)); inside = inside / (np.abs(inside).max() + 1e-9) * .06
X.add(amb, inside, 19.3, 1, 0)
for k in range(6): X.add(amb, X.heartbeat(.6) * .18, 28.4 + k * .95, 1, 0)
# the two quiet moments: duck the room too
for a, b in [(12.95, 13.7), (40.1, 41.0)]:
    i0, i1 = int(a * SR), int(b * SR); mus[i0:i1] *= np.linspace(1, 0, i1 - i0)[:, None] ** 4

# ---------------- voice: compress, limit, then level-match ----------------
for vid, start, dur in VO:
    y, sr = sf.read(os.path.join(HERE, 'voices', vid + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = soxr.resample(y, sr, SR); y = X.hp(y, 90)
    X.add(voc, y, start, 1, 0)
v = voc[:, 0]; act = np.abs(v) > 1e-4
rms = np.sqrt(np.mean(v[act] ** 2)); v = X.compress(v / rms * .1, thr=.12, ratio=3)
rms = np.sqrt(np.mean(v[act] ** 2)); v = X.limit(v, ceil=rms * 3.55)
voc = np.stack([v, v], 1)

def rmsof(x, mask): return np.sqrt(np.mean(x[mask] ** 2) + 1e-12)
# reverb (short, soft) on music and foley
ir = X.noise(.7) * np.exp(-X.t_(.7) / .16); ir = X.lp(ir, 5000); ir /= np.abs(ir).sum() ** .5 * 6
def verb(x, wet): return x + wet * np.stack([fftconvolve(x[:, c], ir)[:len(x)] for c in (0, 1)], 1)
mus = verb(mus, .25); fol = verb(fol, .15); voc = verb(voc, .06)
# levels: voice ~9 dB over the music during speech; music ducked ~4 dB under voice
spk = np.convolve(act.astype(float), np.ones(int(.3 * SR)) / int(.3 * SR), 'same') > .05
mr = rmsof(mus[:, 0], spk); vr = rmsof(voc[:, 0], act)
voc *= (mr * 10 ** (9 / 20)) / vr
duck = 1 - .38 * np.convolve(spk.astype(float), np.ones(int(.3 * SR)) / int(.3 * SR), 'same')
mus *= duck[:, None]
fr = rmsof(fol[:, 0], np.abs(fol[:, 0]) > 1e-4); fol *= (mr * 10 ** (1 / 20)) / fr
out = mus + fol * 1.0 + amb * mr / .02 * .35 + voc
lo = sosfilt(butter(2, 120, 'low', fs=SR, output='sos'), out, axis=0)
out = out - .3 * lo                                  # keep the low end in check on small speakers
out = np.stack([X.limit(out[:, c], .95) for c in (0, 1)], 1)
out = out / np.abs(out).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR, subtype='FLOAT')
print('mix', round(len(out) / SR, 2), 's; voice lines', len(VO), '; events', len(ev['ev']))
