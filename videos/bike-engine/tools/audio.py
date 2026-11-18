"""The sound for each language: narration, an engine whose every event follows the picture's crank angle, and a soft
music bed ducked under the voice. Mirrors crankDeg/charge/valve windows in compositions/engine/kin.ts.
usage: python3 -I tools/audio.py [en hi]   -> out/mix-<lang>.wav (48 kHz stereo, -14 LUFS)
"""
import json, math, os, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
FPS = 30
BEATS = ["hook", "reveal", "parts", "intake", "compression", "power", "exhaust", "drive", "outro"]
rng = np.random.default_rng(7)


def clamp01(x): return min(1.0, max(0.0, x))
def smoother(x): t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10)
def span(x, a, b): return clamp01((x - a) / (b - a))


def slots(t):
    b = t["beats"]; out = {}
    for i, row in enumerate(b):
        t0 = 0 if i == 0 else (b[i - 1]["end"] + row["start"]) / 2
        t1 = t["total"] if i == len(b) - 1 else (row["end"] + b[i + 1]["start"]) / 2
        out[row["id"]] = (t0, t1, row["start"], row["end"])
    return out


def crank_deg(s, sec):
    V_RUN, V_DRIVE = 600, 600
    T = lambda k: s[k][1] - s[k][0]
    hook_end = V_RUN * T("hook")
    target = math.ceil((hook_end + V_RUN * T("reveal") * 0.6 * 0.5) / 720) * 720
    base = target + 720
    for k in BEATS:
        t0, t1 = s[k][0], s[k][1]
        if sec < t1 or k == "outro":
            u = clamp01((sec - t0) / (t1 - t0)); t = sec - t0
            if k == "hook": return V_RUN * t
            if k == "reveal":
                x = clamp01(t / (T("reveal") * 0.6)); return hook_end + (target - hook_end) * (1 - (1 - x) ** 2)
            if k == "parts": return target + 720 * smoother(span(u, 0.08, 0.95))
            if k == "intake": return base + 180 * smoother(span(u, 0.12, 0.86))
            if k == "compression": return base + 360 * 0.5 + 180 * smoother(span(u, 0.12, 0.86))
            if k == "power": x = span(u, 0.26, 0.7); return base + 360 + 180 * (1 - (1 - x) ** 2.4)
            if k == "exhaust": return base + 540 + 180 * smoother(span(u, 0.12, 0.86))
            tt = sec - s["drive"][0]; a = 1.6; x = min(tt, a) / a
            ramp = V_DRIVE * a * (x ** 3 - x ** 4 / 2)
            return base + 720 + ramp + (V_DRIVE * (tt - a) if tt > a else 0)


def lp(x, f, order=2): return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def thump(big=1.0):
    """One combustion event: a low body, a mid crack and an exhaust puff."""
    n = int(SR * (0.25 + 0.9 * big))
    t = np.arange(n) / SR
    f0 = 55 + 20 * (1 - big)
    body = np.sin(2 * np.pi * (f0 * t - 18 * t * t)) * env(n, 0.002, 0.05 + 0.18 * big)
    crack = bp(rng.standard_normal(n), 400, 3500) * env(n, 0.0005, 0.012 + 0.03 * big)
    puff = lp(rng.standard_normal(n), 900) * env(n, 0.004, 0.04 + 0.25 * big)
    return 0.9 * body + (0.25 + 0.35 * big) * crack + (0.5 + 0.6 * big) * puff


def tick():
    n = int(SR * 0.05)
    return hp(rng.standard_normal(n), 2500) * env(n, 0.0003, 0.006) * 0.25


def whoosh(sec_len, bright):
    n = int(SR * sec_len)
    x = bp(rng.standard_normal(n), 200 + 600 * bright, 1500 + 2500 * bright)
    w = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return x * w


def place(buf, clip, t, g):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(clip))
    buf[i:j] += clip[: j - i] * g


def engine_track(t, total):
    s = slots(t)
    n = int(total * SR)
    out = np.zeros(n)
    frames = int(total * FPS) + 2
    deg = np.array([crank_deg(s, f / FPS) for f in range(frames)])
    # sample-accurate angle by interpolation
    tt = np.arange(n) / SR
    d = np.interp(tt * FPS, np.arange(frames), deg)
    speed = np.gradient(d) * SR  # deg/s
    # continuous mechanical hum: the crank's firing frequency and its harmonics, louder with speed
    rev = np.abs(speed) / 360.0
    level = np.clip(np.abs(speed) / 1080.0, 0, 1.2)
    phase = 2 * np.pi * np.cumsum(rev / 2) / SR  # firing every 2 revs
    hum = sum(np.sin(k * phase) / k for k in range(1, 9))
    gear = np.sin(2 * np.pi * np.cumsum(rev * 22) / SR) * 0.08  # primary gear whine
    mech = lp(rng.standard_normal(n), 3000) * 0.05
    out += (0.12 * hum + gear + mech) * level
    # events: combustion at phase 360, valve clicks at open/close, for every cycle crossed
    for f in range(1, frames):
        a0, a1 = deg[f - 1], deg[f]
        if a1 <= a0: continue
        for ev, kind in [(360, "bang"), (-12, "tick"), (205, "tick"), (505, "tick"), (732, "tick")]:
            k = math.ceil((a0 - ev) / 720)
            e = ev + 720 * k
            while a0 < e <= a1:
                ts = (f - 1 + (e - a0) / (a1 - a0)) / FPS
                v = (a1 - a0) * FPS
                if kind == "bang":
                    slow = v < 400
                    place(out, thump(1.0 if slow else 0.25), ts, 1.1 if slow else 0.55)
                else:
                    place(out, tick(), ts, 0.5 if v < 400 else 0.25)
                e += 720
    # gas: an intake suck and an exhaust rush during the slow strokes
    for k, bright, g in [("intake", 0.2, 0.18), ("exhaust", 0.7, 0.22)]:
        t0, t1 = s[k][0], s[k][1]
        place(out, whoosh((t1 - t0) * 0.7, bright), t0 + (t1 - t0) * 0.12, g)
    # the section reveal: a metallic slide in and out
    t0, t1 = s["reveal"][0], s["reveal"][1]
    for u in (0.0, 0.6):
        place(out, bp(rng.standard_normal(int(SR * 0.9)), 1500, 7000) * np.hanning(int(SR * 0.9)) * 0.12, t0 + (t1 - t0) * u, 1)
    return out


def music_bed(total):
    """A slow, warm pad: two chords breathing, a soft pulse, all low under the voice."""
    n = int(total * SR); t = np.arange(n) / SR
    chords = [[110.0, 164.81, 220.0, 277.18], [98.0, 146.83, 196.0, 246.94], [87.31, 130.81, 174.61, 220.0], [98.0, 146.83, 196.0, 293.66]]
    bar = 4.0
    pad = np.zeros(n)
    for i, ch in enumerate(chords * int(total // (bar * 4) + 2)):
        a = int(i * bar * SR); b = min(n, a + int((bar + 1.2) * SR))
        if a >= n: break
        seg = np.arange(b - a) / SR
        w = np.sin(np.pi * np.clip(seg / (bar + 1.2), 0, 1)) ** 0.8
        for k, f in enumerate(ch):
            det = 1 + 0.002 * (k - 1.5)
            pad[a:b] += (np.sin(2 * np.pi * f * det * seg) + 0.3 * np.sin(2 * np.pi * 2 * f * seg)) * w * 0.12
    pad = lp(pad, 1800)
    pulse = np.sin(2 * np.pi * 55 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 1.0) ** 8) * 0.08
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (total - t) / 2.5)
    return (pad + pulse) * fade


def duck(voice, depth=0.35, att=0.05, rel=0.4):
    e = np.abs(voice)
    e = lp(e, 8)
    g = np.ones_like(e)
    on = e > 0.02
    target = np.where(on, depth, 1.0)
    # smooth the gain with separate attack and release
    a_att, a_rel = math.exp(-1 / (att * SR)), math.exp(-1 / (rel * SR))
    cur = 1.0
    for i in range(0, len(g), 64):
        tg = target[i]
        k = a_att if tg < cur else a_rel
        cur = tg + (cur - tg) * (k ** 64)
        g[i:i + 64] = cur
    return g


def limit(x, ceiling, look=0.005, rel=0.12):
    """Look-ahead peak limiter: the gain falls before a peak arrives and recovers over `rel` seconds."""
    a = np.abs(x).max(1)
    L = int(look * SR)
    # the peak within the look-ahead window
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(a, size=2 * L + 1)
    need = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    g = np.empty_like(need)
    k = math.exp(-1 / (rel * SR))
    cur = 1.0
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * k
        g[i] = cur
    # smooth the attack so it doesn't click
    g = np.convolve(g, np.ones(L) / L, mode="same")
    g = np.minimum(g, need)
    return x * g[:, None]


def main(langs):
    timing = json.load(open(os.path.join(HERE, "timing.json")))
    meter = pyln.Meter(SR)
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    for lang in langs:
        t = timing[lang]; total = t["total"]
        n = int(total * SR)
        voice, sr = sf.read(os.path.join(HERE, "assets", "voice", f"{lang}.wav"))
        assert sr == SR
        voice = np.pad(voice, (0, max(0, n - len(voice))))[:n]
        eng = engine_track(t, total)
        mus = music_bed(total)
        g = duck(voice, 0.3)
        eng_g = duck(voice, 0.55)
        mix_m = voice * 1.0 + eng * 0.55 * eng_g + mus * 0.5 * g
        # a little width: the bed and the engine spread, the voice centred
        left = voice + 0.55 * eng * eng_g * 1.0 + 0.5 * mus * g * 0.9
        right = voice + 0.55 * np.roll(eng, 240) * eng_g * 0.95 + 0.5 * np.roll(mus, 480) * g
        st = np.stack([left, right], 1)
        # tame the bangs first so loudness isn't set by them, then level, then a brickwall limiter at -1.5 dBFS
        st = limit(st, 0.5)
        loud = meter.integrated_loudness(st)
        st = st * 10 ** ((-14.5 - loud) / 20)
        st = limit(st, 10 ** (-1.8 / 20))
        sf.write(os.path.join(HERE, "out", f"mix-{lang}.wav"), st, SR, subtype="PCM_16")
        print(lang, f"{total:.1f}s", f"loudness {loud:.1f} -> -14 LUFS, peak {np.abs(st).max():.2f}")
        del mix_m


if __name__ == "__main__":
    main(sys.argv[1:] or ["en", "hi"])
