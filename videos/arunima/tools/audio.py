import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'wind', 0.8), (0.0, 'swell', 0.6), (0.4, 'whoosh', 0.4), (4.66, 'whoosh', 0.6), (4.7, 'engine', 0.7), (7.4, 'engine', 0.6), (10.26, 'whoosh', 0.4), (10.3, 'pop', 0.4),
      (15.5, 'heartbeat', 0.6), (17.04, 'hit', 0.6), (18.72, 'hit', 0.8), (19.3, 'hit', 0.7), (20.76, 'whoosh', 0.8), (22.02, 'boom', 0.7), (22.84, 'riser', 0.6), (23.4, 'engine', 1.0),
      (26.4, 'boom', 1.2), (26.4, 'crack', 0.8), (28.64, 'wind', 0.5), (28.7, 'heartbeat', 0.5), (33.38, 'whoosh', 0.4), (37.9, 'swell', 0.8), (39.78, 'hit', 0.6),
      (41.2, 'whoosh', 0.6), (41.3, 'wind', 0.7), (44.16, 'wind', 1.0), (46.3, 'hit', 0.6), (47.98, 'riser', 0.7), (49.9, 'tick', 0.6), (52.12, 'boom', 0.8), (52.12, 'swell', 1.0), (52.2, 'ding', 0.8),
      (55.06, 'whoosh', 0.5), (57.7, 'ding', 0.8), (59.4, 'whoosh', 0.6), (59.5, 'wind', 0.6)]
build(ROOT, ev, 'story')
