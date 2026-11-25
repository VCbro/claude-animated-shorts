import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'hiss', 0.7), (0.0, 'swell', 0.6), (0.84, 'hit', 0.6), (3.3, 'whoosh', 0.6), (6.6, 'pop', 0.5), (12.06, 'whoosh', 0.5), (12.1, 'wind', 0.6),
      (14.7, 'boom', 1.1), (14.75, 'hiss', 0.6), (16.38, 'hit', 0.8), (17.1, 'whoosh', 0.6), (17.2, 'heartbeat', 0.5), (21.22, 'whoosh', 0.4), (21.3, 'heartbeat', 0.5),
      (26.26, 'whoosh', 0.5), (26.3, 'riser', 0.6), (28.36, 'ding', 0.8), (30.3, 'pop', 0.5), (31.1, 'ding', 0.9), (31.16, 'swell', 0.8),
      (33.0, 'whoosh', 0.5), (33.1, 'hiss', 0.4), (36.5, 'hit', 0.5), (38.8, 'whoosh', 0.4), (38.9, 'heartbeat', 0.6), (45.7, 'whoosh', 0.5), (45.9, 'swell', 0.6),
      (49.06, 'whoosh', 0.5), (49.3, 'pop', 0.5), (50.6, 'riser', 0.5), (55.8, 'ding', 0.9), (56.12, 'whoosh', 0.5), (58.82, 'boom', 0.7), (59.46, 'whoosh', 0.6),
      (59.6, 'swell', 1.0), (59.6, 'ding', 0.8), (63.18, 'whoosh', 0.5), (63.3, 'hiss', 0.6)]
for t in [50.6 + 5.2 * k / 13 for k in range(13)]: ev.append((t, 'tick', 0.3))
build(ROOT, ev, 'story')
