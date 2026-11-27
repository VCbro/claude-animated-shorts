import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0.0, 'engine', 0.9), (0.0, 'alarm', 0.35), (1.6, 'whoosh', 0.6), (3.1, 'whoosh', 0.5), (3.3, 'hiss', 0.9), (4.56, 'hit', 0.8), (5.0, 'boom', 0.5),
      (5.7, 'swell', 0.5), (8.62, 'swell', 0.8), (8.62, 'ding', 0.7), (9.62, 'whoosh', 0.4), (11.64, 'ding', 0.5), (12.16, 'tick', 0.5), (13.2, 'whoosh', 0.4), (14.72, 'pop', 0.5), (16.2, 'ding', 0.5),
      (18.3, 'whoosh', 0.5), (18.4, 'buzz', 0.4), (19.6, 'pop', 0.4), (22.64, 'ding', 0.4), (24.64, 'engine', 0.6), (25.62, 'alarm', 0.5), (26.56, 'heartbeat', 0.6),
      (29.42, 'alarm', 0.7), (32.48, 'hit', 0.8), (32.5, 'hiss', 1.0), (34.02, 'whoosh', 0.5), (34.1, 'engine', 0.6), (37.42, 'ding', 0.6), (37.9, 'ding', 0.5), (38.6, 'hiss', 0.8), (40.26, 'hit', 0.6),
      (41.42, 'swell', 0.6), (46.58, 'ding', 0.8), (47.96, 'whoosh', 0.5), (48.0, 'engine', 0.5), (50.6, 'swell', 0.8), (51.32, 'ding', 0.6)]
build(ROOT, ev, 'bright')
