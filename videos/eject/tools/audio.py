import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'engine', 0.7), (0.0, 'riser', 0.5), (0.9, 'boom', 0.6), (1.2, 'wind', 0.6), (3.0, 'alarm', 0.6), (3.0, 'engine', 0.6), (3.2, 'whoosh', 0.5), (6.24, 'whoosh', 0.4),
      (7.46, 'hit', 0.7), (7.5, 'ding', 0.4), (8.5, 'tick', 0.4), (8.95, 'tick', 0.4), (9.4, 'tick', 0.4), (11.0, 'wind', 0.5), (14.26, 'boom', 0.7), (14.3, 'whoosh', 0.8),
      (15.4, 'hiss', 0.6), (16.9, 'crack', 1.0), (16.9, 'boom', 0.5), (18.1, 'riser', 0.6), (19.6, 'boom', 1.0), (19.6, 'hiss', 0.9), (20.52, 'whoosh', 0.9), (21.0, 'wind', 0.8),
      (25.06, 'pop', 0.7), (25.1, 'whoosh', 0.4), (28.0, 'hit', 0.5), (29.4, 'pop', 0.9), (29.45, 'whoosh', 0.6), (30.2, 'swell', 0.6), (30.58, 'whoosh', 0.5), (31.3, 'boom', 0.6),
      (31.6, 'boom', 0.9), (31.6, 'hiss', 0.8), (33.0, 'pop', 0.6), (34.0, 'pop', 0.8), (36.6, 'ding', 0.5), (38.24, 'whoosh', 0.5), (38.7, 'hit', 0.9), (40.8, 'ding', 0.4),
      (43.56, 'swell', 0.7), (46.0, 'hit', 0.4), (47.2, 'ding', 0.6)]
build(ROOT, ev, 'tense')
