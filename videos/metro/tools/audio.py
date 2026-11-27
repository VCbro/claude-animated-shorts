import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'engine', 0.6), (0.0, 'whoosh', 0.5), (2.0, 'hiss', 0.6), (3.6, 'ding', 0.7), (4.4, 'whoosh', 0.6), (5.0, 'pop', 0.4), (8.84, 'whoosh', 0.5), (9.6, 'ding', 0.7), (9.6, 'buzz', 0.3),
      (13.0, 'whoosh', 0.4), (13.76, 'tick', 0.5), (14.76, 'tick', 0.5), (15.4, 'ding', 0.4), (18.28, 'whoosh', 0.5), (18.4, 'pop', 0.4), (22.54, 'ding', 0.5), (23.56, 'ding', 0.5),
      (24.46, 'swell', 0.6), (27.82, 'hit', 0.5), (30.68, 'riser', 0.6), (30.96, 'ding', 0.6), (34.42, 'swell', 0.6), (38.16, 'whoosh', 0.5), (38.2, 'engine', 0.5), (41.2, 'hiss', 0.6), (42.9, 'pop', 0.6), (42.95, 'ding', 0.6),
      (43.9, 'alarm', 0.7), (45.4, 'hiss', 0.9), (46.6, 'hit', 0.7), (48.1, 'swell', 0.7), (50.12, 'ding', 0.5), (50.6, 'whoosh', 0.4)]
build(ROOT, ev, 'bright')
