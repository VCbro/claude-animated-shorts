import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'boom', 0.6), (0.0, 'wind', 0.7), (0.3, 'crack', 0.5), (1.2, 'crack', 0.4), (2.9, 'whoosh', 0.6), (5.6, 'swell', 0.5), (6.3, 'pop', 0.4), (8.76, 'whoosh', 0.6), (8.9, 'pop', 0.4),
      (9.6, 'swell', 0.4), (10.5, 'ding', 0.4), (11.2, 'ding', 0.4), (12.4, 'ding', 0.5), (15.75, 'hit', 0.7), (17.24, 'buzz', 0.5), (18.3, 'hiss', 0.5), (20.0, 'hiss', 0.7),
      (21.5, 'crack', 0.9), (21.58, 'boom', 0.5), (22.6, 'riser', 0.6), (25.0, 'hiss', 0.6), (27.86, 'hit', 0.8), (28.58, 'whoosh', 0.5), (29.3, 'heartbeat', 0.6), (30.8, 'crack', 0.5),
      (32.3, 'crack', 0.6), (33.2, 'crack', 0.7), (33.6, 'wind', 0.7), (34.66, 'boom', 0.9), (34.66, 'alarm', 0.4), (36.12, 'whoosh', 0.6), (36.6, 'ding', 0.6), (37.3, 'swell', 0.5),
      (39.0, 'tick', 0.4), (39.6, 'tick', 0.4), (40.2, 'tick', 0.4), (42.04, 'whoosh', 0.5), (43.12, 'ding', 0.5), (44.78, 'ding', 0.5), (46.36, 'buzz', 0.6), (49.58, 'swell', 0.6), (51.4, 'wind', 0.4)]
build(ROOT, ev, 'tense')
