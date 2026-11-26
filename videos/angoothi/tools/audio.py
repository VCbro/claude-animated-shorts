import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'swell', 0.6), (0.0, 'ding', 0.45), (0.3, 'wind', 0.25), (3.32, 'whoosh', 0.4), (6.62, 'hit', 0.6),
      (7.95, 'whoosh', 0.5), (11.24, 'pop', 0.3), (13.0, 'swell', 0.5),
      (17.22, 'ding', 0.7), (17.95, 'ding', 0.45), (18.98, 'ding', 0.8), (18.98, 'hit', 0.35), (19.76, 'crack', 0.9), (20.36, 'crack', 1.0), (20.36, 'boom', 0.7),
      (21.26, 'whoosh', 0.5), (22.0, 'boom', 0.8), (23.0, 'whoosh', 0.3),
      (27.88, 'riser', 0.6), (28.6, 'pop', 0.6), (29.3, 'whoosh', 0.5), (30.4, 'wind', 0.6), (30.52, 'whoosh', 0.7), (31.30, 'whoosh', 0.7), (32.10, 'whoosh', 0.8),
      (32.94, 'boom', 1.0), (32.94, 'swell', 0.7), (35.04, 'heartbeat', 0.6), (35.86, 'hit', 0.7), (36.8, 'whoosh', 0.5), (37.5, 'hit', 0.5),
      (37.86, 'swell', 0.8), (38.82, 'ding', 0.6), (40.0, 'ding', 0.4), (41.6, 'pop', 0.5), (41.9, 'ding', 0.6),
      (43.3, 'riser', 0.8), (45.18, 'swell', 0.8), (49.2, 'whoosh', 0.4), (50.18, 'ding', 1.0), (50.18, 'hit', 0.5),
      (51.0, 'whoosh', 0.5), (51.0, 'wind', 0.3), (52.84, 'swell', 0.5), (54.92, 'swell', 0.8), (54.92, 'ding', 0.4),
      (56.74, 'whoosh', 0.5), (57.66, 'swell', 0.9), (58.84, 'ding', 0.6), (60.1, 'whoosh', 0.4), (61.84, 'ding', 0.7), (62.9, 'swell', 0.3)]
for k in range(10): ev.append((38.9 + k * 0.1, 'tick', 0.12))
build(ROOT, ev, 'story')
