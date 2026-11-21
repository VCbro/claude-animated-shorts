#!/usr/bin/env python3
"""Sound design, all synthesised (no third-party audio): forecourt ambience, tanker delivery flow,
submerged pump hum, flowing petrol, pulser ticks, the two nozzle clicks, small handling sounds.
Narration has priority (side-chain ducking). Output: audio/mix.wav (48 kHz stereo).

    /home/user/bpyenv/bin/python tools/audio.py
"""
import json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anim as A

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
N = int(A.END * SR)
rng = np.random.default_rng(11)
t = np.arange(N) / SR


def db(x): return 10 ** (x / 20)


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    # soft edges
    m = np.clip(np.minimum((f - lo * 0.7) / (lo * 0.3 + 1e-9), (hi * 1.3 - f) / (hi * 0.3)), 0, 1) if lo > 0 else np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    return np.fft.irfft(X * m, len(x))


def env(points):
    """piecewise-linear envelope over the whole timeline from (time, value) points"""
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def smooth_gate(a, b, fade=0.15):
    return np.clip(np.minimum((t - a) / fade + 1, (b - t) / fade + 1), 0, 1) * ((t > a - fade) & (t < b + fade))


def add(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i < 0: x = x[-i:]; i = 0
    if i >= len(buf): return
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n] * gain


def click(kind="close"):
    """A dry mechanical click: sharp transient + two short metal resonances."""
    d = int(0.18 * SR); tt = np.arange(d) / SR
    tr = rng.standard_normal(d) * np.exp(-tt * 900)
    r1 = np.sin(2 * np.pi * 2650 * tt) * np.exp(-tt * 70)
    r2 = np.sin(2 * np.pi * 4120 * tt + 0.5) * np.exp(-tt * 110)
    body = np.sin(2 * np.pi * 380 * tt) * np.exp(-tt * 45)
    x = tr * 0.9 + r1 * 0.35 + r2 * 0.25 + body * 0.3
    # a second, softer snap 12 ms later (the latch, then the valve seating)
    x2 = np.zeros(d); o = int(0.012 * SR); x2[o:] = x[:d - o] * 0.45
    return (x + x2) / np.abs(x + x2).max()


def clunk(gain=1.0, pitch=900):
    d = int(0.35 * SR); tt = np.arange(d) / SR
    x = rng.standard_normal(d) * np.exp(-tt * 300) * 0.6 + np.sin(2 * np.pi * pitch * tt) * np.exp(-tt * 30) * 0.4 \
        + np.sin(2 * np.pi * pitch * 1.53 * tt) * np.exp(-tt * 40) * 0.25
    return x / np.abs(x).max() * gain


def tick(f=3200, d=0.025):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 260)


def flow_noise(seconds, lo=300, hi=3500, gurgle=6.0):
    n = int(seconds * SR)
    x = band(rng.standard_normal(n), lo, hi)
    # bubbly amplitude modulation
    m = band(rng.standard_normal(n), 0, gurgle * 3)
    m = 0.6 + 0.4 * m / (np.abs(m).max() + 1e-9)
    return x / (np.abs(x).max() + 1e-9) * m


def main():
    L = np.zeros(N); R = np.zeros(N)
    S = A.S
    # ---------------------------------------------------------------- ambience (whole film, quieter underground)
    amb = band(rng.standard_normal(N), 30, 500); amb /= np.abs(amb).max()
    hiss = band(rng.standard_normal(N), 2000, 7000); hiss /= np.abs(hiss).max()
    under = np.zeros(N)
    for k in ("pump",):
        under = np.maximum(under, smooth_gate(*S[k], 0.4))
    rig = np.maximum(smooth_gate(*S["shut"], 0.3), smooth_gate(S["nozzle"][0] + 2.3, S["nozzle"][1], 0.3))
    amb_g = db(-30) * (1 - 0.6 * under) * (1 - 0.7 * rig)
    L += amb * amb_g + hiss * db(-46); R += np.roll(amb, 2400) * amb_g + np.roll(hiss, 1200) * db(-46)
    # distant traffic swells
    for at in (3.0, 17.5, 38.0, 57.0, 76.0):
        d = 4.0; n = int(d * SR); tt = np.arange(n) / SR
        car = band(rng.standard_normal(n), 60, 900) * np.sin(np.pi * tt / d) ** 2
        car /= np.abs(car).max(); pan = rng.uniform(0.2, 0.8)
        add(L, car, at, db(-36) * (1 - pan)); add(R, car, at, db(-36) * pan)

    # ---------------------------------------------------------------- opening: flow, then the click and silence
    f0 = flow_noise(A.T_CLICK0 + 0.05, 250, 4500)
    f0 *= np.minimum(1, np.arange(len(f0)) / (0.25 * SR))
    add(L, f0, 0.0, db(-17)); add(R, f0, 0.0, db(-17))
    c = click()
    add(L, c, A.T_CLICK0, db(-6)); add(R, c, A.T_CLICK0, db(-6))

    # ---------------------------------------------------------------- tanker delivery: heavy flow down the fill pipe
    a, b = S["tank"]
    fl = flow_noise(b - a, 120, 2200, 3.0)
    fl *= np.clip(np.minimum(np.arange(len(fl)) / (1.0 * SR), (len(fl) - np.arange(len(fl))) / (0.4 * SR)), 0, 1)
    add(L, fl, a, db(-23)); add(R, fl, a, db(-24))
    tk = band(rng.standard_normal(int((b - a) * SR)), 25, 140); tk /= np.abs(tk).max()
    add(L, tk, a, db(-26)); add(R, tk, a, db(-26))      # tanker engine idle

    # ---------------------------------------------------------------- the sale
    c1 = S["cust"][0] + 2.4
    add(L, clunk(1, 700), c1 + 0.45, db(-20)); add(R, clunk(1, 700), c1 + 0.45, db(-22))   # nozzle out of the boot
    beep = np.sin(2 * np.pi * 1850 * np.arange(int(0.12 * SR)) / SR) * np.hanning(int(0.12 * SR))
    add(L, beep, A.T_RESET, db(-24)); add(R, beep, A.T_RESET, db(-24))                          # display reset
    c2 = A.wt("customer", "मीटर") + 0.45
    add(L, clunk(1, 1100), c2 + 1.35, db(-21)); add(R, clunk(1, 1100), c2 + 1.35, db(-21))   # spout into the neck
    add(L, tick(2400, 0.04), A.T_SQUEEZE - 0.02, db(-18)); add(R, tick(2400, 0.04), A.T_SQUEEZE - 0.02, db(-18))  # lever
    # pump hum: on from the squeeze to the click, louder underground and inside the cabinet
    on = smooth_gate(A.T_SQUEEZE, A.T_CLOSE, 0.25)
    f0_ = 100.0
    hum = (np.sin(2 * np.pi * f0_ * t) * 0.5 + np.sin(2 * np.pi * 2 * f0_ * t) * 0.3 + np.sin(2 * np.pi * 3 * f0_ * t) * 0.12
           + np.sin(2 * np.pi * 1450 * t) * 0.03)
    hum *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * t)
    loud = env([(0, 0.35), (S["pump"][0] - 0.2, 0.35), (S["pump"][0] + 0.3, 1.0), (S["pump"][1] - 0.2, 1.0), (S["pump"][1] + 0.3, 0.55),
                (S["meter"][1], 0.55), (S["meter"][1] + 0.3, 0.25), (A.END, 0.25)])
    L += hum * on * loud * db(-27); R += hum * on * loud * db(-27)
    # flowing petrol through hose and nozzle
    fl2 = flow_noise(A.END, 400, 5000, 8.0)[:N]
    fl_g = on * env([(0, 0.6), (S["pump"][0], 0.3), (S["meter"][0], 0.45), (S["nozzle"][0], 0.8), (A.END, 0.8)])
    L += fl2 * fl_g * db(-25); R += np.roll(fl2, 600) * fl_g * db(-25)
    # pulser ticks in the meter scene (one per encoder slot), quiet
    a, b = S["meter"]
    vv = np.array([A.vol(x) for x in np.arange(a, b, 0.002)])
    pulses = np.floor(vv / A.G.METER_L_PER_REV * 12)
    idx = np.where(np.diff(pulses) > 0)[0]
    for i in idx:
        at = a + i * 0.002
        if at > A.T_DISP: break
        add(L, tick(3600, 0.012), at, db(-30)); add(R, tick(3600, 0.012), at, db(-30))
    # cabinet door
    add(L, clunk(1, 480), S["meter"][0] + 0.15, db(-24)); add(R, clunk(1, 480), S["meter"][0] + 0.15, db(-24))
    # air hiss at the port while it is exposed (macro shots), stops dead at coverage
    hs = band(rng.standard_normal(N), 3000, 9000); hs /= np.abs(hs).max()
    air = smooth_gate(A.wt("nozzle", "छेद") - 0.3, A.T_COVER, 0.05) * (t > S["nozzle"][0] + 2.3)
    L += hs * air * db(-38); R += hs * air * db(-38)
    # rising pitch of the filling neck in the last seconds (classic "filling up" sound)
    fill = smooth_gate(S["shut"][0] + 0.5, A.T_CLOSE, 0.2)
    pitch = 300 + 500 * np.clip((t - S["shut"][0]) / (A.T_CLOSE - S["shut"][0]), 0, 1)
    ph = np.cumsum(2 * np.pi * pitch / SR)
    res = band(rng.standard_normal(N), 200, 1600) * (0.5 + 0.5 * np.sin(ph)); res /= np.abs(res).max()
    L += res * fill * db(-33); R += res * fill * db(-33)
    # THE click, alone
    add(L, click(), A.T_CLOSE, db(-4)); add(R, click(), A.T_CLOSE, db(-4))
    # nozzle back in the boot
    f1 = A.wt("finish", "बिल") + 0.3
    add(L, clunk(1, 650), f1 + 2.6, db(-20)); add(R, clunk(1, 650), f1 + 2.6, db(-20))
    # soft whooshes at the big scene changes
    for k in ("tank", "cust", "pump", "meter", "nozzle"):
        d = 0.6; n = int(d * SR); tt = np.arange(n) / SR
        w = band(rng.standard_normal(n), 300, 3000) * np.sin(np.pi * tt / d) ** 2
        w /= np.abs(w).max()
        add(L, w, S[k][0] - 0.3, db(-31)); add(R, w, S[k][0] - 0.3, db(-31))
    # end sting: low warm chord under the title
    a = A.T("finish") + 4.4
    d = A.END - a; n = int(d * SR); tt = np.arange(n) / SR
    ch = sum(np.sin(2 * np.pi * f * tt) for f in (110, 164.8, 220, 277.2)) * np.minimum(1, tt / 1.2) * np.clip((d - tt) / 1.0, 0, 1)
    add(L, ch / 4, a, db(-28)); add(R, ch / 4, a, db(-28))

    # ---------------------------------------------------------------- voice with ducking
    v, vsr = sf.read(os.path.join(ROOT, "voice/voice.wav"))
    if v.ndim > 1: v = v.mean(1)
    v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
    vb = np.zeros(N); vb[:min(N, len(v))] = v[:N]
    e = np.abs(vb); k = int(0.05 * SR)
    e = np.convolve(e, np.ones(k) / k, mode="same")
    duck = 1 - 0.45 * np.clip(e / 0.05, 0, 1)
    L *= duck; R *= duck
    L += vb * db(-3.5); R += vb * db(-3.5)
    mix = np.stack([L, R], 1)
    mix /= max(1.0, np.abs(mix).max() / 0.95)
    os.makedirs(os.path.join(ROOT, "audio"), exist_ok=True)
    sf.write(os.path.join(ROOT, "audio/mix.wav"), mix.astype(np.float32), SR)
    print("mix", len(mix) / SR, "s")


if __name__ == "__main__":
    main()
