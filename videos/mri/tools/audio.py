import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KN = []
for a, b in [(4.5, 7.9), (34.2, 35.6), (36.4, 37.8)]:
    t = a
    while t < b:
        if int((t - a) / 0.22) % 6 < 4: KN.append(round(t, 2))
        t += 0.22
ev = [(0.0, 'swell', 0.6), (0.0, 'buzz', 0.35), (3.88, 'whoosh', 0.5), (4.1, 'engine', 0.3)] + [(k, 'tick', 0.75) for k in KN] + [(k, 'hit', 0.25) for k in KN[::4]] + [
      (8.15, 'whoosh', 0.7), (9.7, 'pop', 0.5), (10.6, 'ding', 0.4), (12.9, 'swell', 0.5), (13.2, 'pop', 0.5), (17.2, 'riser', 0.5), (18.4, 'ding', 0.6),
      (20.45, 'boom', 0.5), (20.45, 'whoosh', 0.7), (24.2, 'ding', 0.5), (24.8, 'ding', 0.4), (25.4, 'ding', 0.4), (27.64, 'whoosh', 0.5), (28.4, 'tick', 0.4), (33.38, 'whoosh', 0.5),
      (40.0, 'hiss', 0.8), (40.0, 'wind', 0.5), (43.6, 'whoosh', 0.6), (44.7, 'crack', 0.8), (44.7, 'hit', 0.6), (46.6, 'swell', 0.6), (47.6, 'pop', 0.5), (50.4, 'whoosh', 0.5)]
build(ROOT, ev, 'bright')
