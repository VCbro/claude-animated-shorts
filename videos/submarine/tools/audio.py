import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'heartbeat', 0.5), (0.0, 'swell', 0.4), (1.76, 'hit', 0.6), (2.02, 'hiss', 1.0), (2.02, 'riser', 0.7), (2.72, 'boom', 0.9), (2.75, 'whoosh', 0.8),
      (3.5, 'wind', 0.4), (6.46, 'whoosh', 0.5), (8.26, 'swell', 0.6), (8.76, 'ding', 0.6), (9.98, 'pop', 0.4), (11.4, 'pop', 0.4),
      (13.98, 'hiss', 0.6), (14.0, 'swell', 0.5), (16.06, 'boom', 0.6), (17.26, 'hit', 0.4), (19.26, 'hiss', 0.9), (19.3, 'riser', 0.5), (21.52, 'hiss', 0.6), (23.88, 'ding', 0.6),
      (24.76, 'whoosh', 0.4), (28.18, 'ding', 0.5), (31.0, 'whoosh', 0.4), (32.24, 'tick', 0.5), (33.12, 'whoosh', 0.5), (35.5, 'heartbeat', 0.6), (37.0, 'riser', 0.6),
      (40.08, 'boom', 0.8), (42.14, 'hit', 0.8), (43.62, 'crack', 0.4), (44.88, 'ding', 0.6), (46.2, 'swell', 0.7), (47.66, 'pop', 0.5), (51.34, 'swell', 0.4)]
for k in range(10): ev.append((37.2 + k * 0.5, 'tick', 0.25))
build(ROOT, ev, 'tense')
