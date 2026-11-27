import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'wind', 0.9), (0.0, 'engine', 0.5), (1.76, 'riser', 0.5), (2.9, 'whoosh', 0.5), (3.1, 'boom', 0.8), (3.1, 'hit', 0.6), (3.15, 'hiss', 0.6),
      (4.46, 'whoosh', 0.5), (4.5, 'engine', 0.7), (4.5, 'wind', 0.6), (8.86, 'whoosh', 0.6), (9.98, 'ding', 0.7), (9.98, 'swell', 0.6),
      (13.2, 'whoosh', 0.5), (13.4, 'buzz', 0.4), (13.9, 'pop', 0.5), (15.5, 'swell', 0.7), (15.98, 'ding', 0.5),
      (17.62, 'whoosh', 0.5), (17.7, 'engine', 0.5), (19.9, 'tick', 0.4), (21.0, 'ding', 0.5), (21.36, 'whoosh', 0.5), (22.1, 'pop', 0.4), (23.4, 'tick', 0.4), (24.7, 'ding', 0.6),
      (26.1, 'whoosh', 0.5), (26.2, 'engine', 0.5), (28.6, 'swell', 0.7), (29.6, 'ding', 0.5), (30.7, 'wind', 0.8), (30.7, 'engine', 0.6), (32.71, 'hit', 0.7),
      (33.6, 'whoosh', 0.5), (34.0, 'engine', 0.7), (35.78, 'riser', 0.5), (38.0, 'boom', 0.9), (38.0, 'hiss', 0.8), (38.44, 'hit', 0.5),
      (39.42, 'whoosh', 0.4), (40.66, 'ding', 0.5), (41.26, 'ding', 0.5), (41.76, 'ding', 0.6), (44.6, 'wind', 0.6), (44.6, 'engine', 0.4), (48.4, 'swell', 0.6), (50.4, 'whoosh', 0.5), (50.5, 'wind', 0.6)]
build(ROOT, ev, 'bright')
