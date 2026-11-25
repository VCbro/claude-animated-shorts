import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = []
for s in (0.0, 1.74, 3.62, 67.05, 68.76, 70.6): ev += [(s, 'hit', 1.0), (s, 'crack', 0.6), (s, 'glass', 0.25)]
for s in (38.3, 39.98, 40.5, 41.0): ev += [(s, 'hit', 1.1), (s, 'crack', 0.7)]
t = 41.75
while t < 47.9: ev.append((t, 'tick', 0.35)); t += 0.27
ev += [(4.2, 'whoosh', 0.6), (4.3, 'wind', 0.5), (10.76, 'swell', 0.5), (14.0, 'wind', 0.4), (17.55, 'whoosh', 0.6), (19.45, 'crack', 1.0), (19.45, 'boom', 0.6),
       (19.8, 'whoosh', 0.6), (20.6, 'riser', 0.4), (24.64, 'heartbeat', 0.7), (26.7, 'boom', 0.7), (26.7, 'swell', 0.6), (31.18, 'whoosh', 0.5), (32.64, 'ding', 0.4),
       (34.44, 'whoosh', 0.4), (36.7, 'pop', 0.5), (41.7, 'riser', 0.6), (42.5, 'hiss', 0.6), (47.96, 'boom', 0.9), (47.96, 'swell', 0.8), (48.0, 'whoosh', 0.8),
       (51.28, 'whoosh', 0.5), (52.2, 'ding', 0.5), (53.6, 'ding', 0.5), (54.77, 'whoosh', 0.5), (57.6, 'ding', 0.9), (58.72, 'wind', 0.4), (63.94, 'swell', 0.9), (63.94, 'boom', 0.6), (67.0, 'whoosh', 0.5)]
build(ROOT, ev, 'story')
