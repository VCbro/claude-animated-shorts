import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'wind', 0.5), (0.0, 'swell', 0.5), (0.4, 'engine', 0.4), (3.24, 'whoosh', 0.6), (5.0, 'pop', 0.4), (7.92, 'whoosh', 0.5), (8.4, 'ding', 0.4), (10.5, 'ding', 0.5),
      (13.2, 'whoosh', 0.5), (13.4, 'hit', 0.4), (17.3, 'engine', 0.5), (19.0, 'ding', 0.4), (19.8, 'buzz', 0.5), (20.9, 'riser', 0.7), (23.5, 'hit', 0.7), (23.5, 'ding', 0.6),
      (24.7, 'buzz', 0.4), (26.2, 'hit', 0.6), (26.3, 'engine', 0.5), (28.4, 'whoosh', 0.5), (29.2, 'pop', 0.4), (31.2, 'buzz', 0.5), (33.0, 'hit', 0.5), (34.06, 'wind', 0.9),
      (34.2, 'hiss', 0.7), (35.2, 'crack', 1.0), (35.25, 'boom', 0.8), (37.64, 'whoosh', 0.5), (37.8, 'ding', 0.6), (40.5, 'swell', 0.5), (44.06, 'whoosh', 0.5), (44.1, 'buzz', 0.4),
      (46.5, 'buzz', 0.4), (47.55, 'engine', 0.5), (48.2, 'ding', 0.6)]
build(ROOT, ev, 'bright')
