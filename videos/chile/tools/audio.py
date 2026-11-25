import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'crack', 0.9), (0.0, 'boom', 0.6), (0.05, 'hiss', 0.4), (3.92, 'whoosh', 0.6), (3.95, 'riser', 0.4), (4.6, 'pop', 0.6), (8.88, 'wind', 0.5), (8.9, 'whoosh', 0.5),
      (13.84, 'whoosh', 0.5), (14.86, 'boom', 1.2), (14.9, 'crack', 1.0), (15.3, 'boom', 0.8), (16.4, 'hit', 0.8), (18.5, 'wind', 0.4), (18.5, 'swell', 0.4),
      (22.08, 'whoosh', 0.4), (22.1, 'heartbeat', 0.6), (29.5, 'pop', 0.5), (29.9, 'pop', 0.5), (31.0, 'pop', 0.5), (32.54, 'whoosh', 0.5), (33.6, 'engine', 0.6),
      (33.95, 'crack', 1.0), (33.95, 'boom', 0.6), (36.45, 'pop', 0.5), (37.58, 'whoosh', 0.6), (38.6, 'swell', 0.9), (38.6, 'ding', 0.8), (40.96, 'engine', 0.7), (40.96, 'whoosh', 0.5),
      (46.58, 'whoosh', 0.5), (46.6, 'swell', 0.5), (49.4, 'ding', 0.5), (51.68, 'whoosh', 0.5), (53.5, 'riser', 0.5), (56.4, 'ding', 0.9), (56.96, 'swell', 0.9), (57.0, 'boom', 0.6),
      (60.26, 'whoosh', 0.6), (60.3, 'heartbeat', 0.5), (65.08, 'crack', 0.9)]
for t in [53.6 + 0.09 * k for k in range(33)]: ev.append((t, 'tick', 0.25))
build(ROOT, ev, 'story')
