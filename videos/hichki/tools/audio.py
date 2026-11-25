import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = []
for h in (0.0, 1.45, 3.0, 25.96, 47.74):
    ev += [(h, 'pop', 0.9), (h + 0.3, 'glass', 0.45)]
ev += [(4.86, 'whoosh', 0.6), (6.9, 'swell', 0.5), (16.5, 'boom', 0.9), (16.5, 'hit', 0.7), (18.66, 'wind', 0.6), (18.6, 'whoosh', 0.5),
       (22.56, 'crack', 0.9), (22.56, 'hit', 0.8), (25.96, 'boom', 0.6), (27.9, 'pop', 0.6), (28.68, 'hiss', 0.5), (28.68, 'pop', 0.5),
       (30.62, 'pop', 0.6), (32.8, 'whoosh', 0.5), (33.4, 'heartbeat', 0.6), (35.6, 'ding', 0.6), (38.6, 'whoosh', 0.5),
       (40.9, 'tick', 0.8), (41.4, 'tick', 0.8), (41.9, 'tick', 0.8), (42.3, 'tick', 0.8), (42.6, 'riser', 0.6), (44.4, 'ding', 0.8), (44.9, 'whoosh', 0.5)]
build(ROOT, ev, 'night')
