import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'pop', 0.4), (1.66, 'whoosh', 0.6), (2.3, 'tick', 0.5), (2.75, 'tick', 0.5), (3.2, 'tick', 0.5), (3.65, 'tick', 0.5), (4.1, 'ding', 0.5), (5.0, 'whoosh', 0.4), (5.3, 'buzz', 0.2),
      (5.98, 'tick', 0.4), (6.1, 'tick', 0.4), (6.25, 'tick', 0.4), (6.4, 'tick', 0.4), (6.72, 'ding', 1.0), (8.42, 'pop', 0.4), (9.12, 'whoosh', 0.7), (12.46, 'hit', 0.5), (13.12, 'swell', 0.5),
      (15.38, 'buzz', 0.3), (17.8, 'ding', 0.5), (19.0, 'whoosh', 0.6), (20.7, 'pop', 0.4), (21.6, 'pop', 0.4), (22.8, 'swell', 0.5), (24.46, 'tick', 0.4), (28.04, 'ding', 0.6),
      (29.36, 'whoosh', 0.5), (29.76, 'ding', 0.7), (32.18, 'whoosh', 0.7), (34.82, 'hit', 0.5), (35.78, 'whoosh', 0.5), (36.1, 'ding', 0.8), (38.84, 'ding', 1.0), (39.52, 'riser', 0.6),
      (40.36, 'tick', 0.5), (42.06, 'swell', 0.8), (43.46, 'whoosh', 0.5), (46.58, 'whoosh', 0.5), (47.6, 'ding', 0.8), (50.92, 'swell', 0.6)]
build(ROOT, ev, 'bright')
