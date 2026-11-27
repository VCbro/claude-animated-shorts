import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'swell', 0.5), (0.0, 'tick', 0.3), (2.0, 'pop', 0.4), (4.76, 'whoosh', 0.8), (4.8, 'riser', 0.5), (5.26, 'boom', 0.7), (5.3, 'swell', 0.6),
      (7.8, 'pop', 0.5), (10.0, 'whoosh', 0.5), (11.0, 'pop', 0.5), (11.14, 'tick', 0.4), (12.26, 'ding', 0.6), (13.42, 'ding', 0.4),
      (16.0, 'whoosh', 0.5), (17.2, 'riser', 0.6), (19.9, 'ding', 0.8), (21.56, 'hit', 0.5),
      (24.84, 'swell', 0.6), (27.58, 'swell', 0.6), (28.3, 'ding', 0.5), (30.14, 'swell', 0.6), (30.8, 'pop', 0.5), (33.22, 'swell', 0.6), (36.0, 'riser', 0.4), (36.68, 'boom', 0.8), (36.68, 'ding', 0.7),
      (37.4, 'hit', 1.0), (37.4, 'whoosh', 0.7), (38.6, 'pop', 0.5), (41.5, 'tick', 0.5), (43.5, 'whoosh', 0.6), (45.4, 'buzz', 0.5), (47.38, 'hit', 0.6),
      (48.2, 'whoosh', 0.5), (49.0, 'tick', 0.4), (52.5, 'whoosh', 0.6), (52.6, 'pop', 0.4), (54.18, 'swell', 0.8), (54.18, 'ding', 0.6),
      (54.8, 'whoosh', 0.5), (58.1, 'pop', 0.7), (58.16, 'ding', 0.6), (59.3, 'swell', 0.4)]
for k in range(12): ev.append((17.2 + k * 0.22, 'tick', 0.2))
build(ROOT, ev, 'bright')
