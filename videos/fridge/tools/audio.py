import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0, 'hit', 0.9), (0, 'hiss', 0.4), ('steal', 'whoosh', 0.6), ('gas', 'whoosh', 0.5), ('expand', 'hiss', 0.6), ('absorb', 'ding', 0.8),
      ('comp', 'hit', 0.6), ('comp', 'engine', 0.9), ('hot', 'boom', 0.5), ('coil', 'whoosh', 0.6), ('tip', 'pop', 0.5), ('bill', 'alarm', 1.0),
      ('heater', 'hit', 0.8), ('heater', 'swell', 1.0)]
build(ROOT, ev, 'bright', amb=lambda tg, band, N: band(N, 80, 300) * 0.12)
