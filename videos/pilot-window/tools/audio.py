import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0, 'wind', 1.2), (0, 'hit', 0.8), ('date', 'whoosh', 0.5), ('calm', 'engine', 0.8), ('bang', 'glass', 1.4), ('bang', 'boom', 1.0), ('bang', 'wind', 1.3),
      ('pulled', 'wind', 1.2), ('grab', 'hit', 0.6), ('grab', 'wind', 1.0), ('cold', 'wind', 1.2), ('dead', 'heartbeat', 1.0), ('dead', 'heartbeat', 0.8),
      ('copilot', 'engine', 1.0), ('landed', 'boom', 0.6), ('alive', 'swell', 1.2), ('alive', 'ding', 0.8), ('months', 'engine', 0.7), ('cause', 'tick', 1), ('cause', 'hit', 0.5), ('ask', 'swell', 0.8)]
build(ROOT, ev, 'story', amb=lambda tg, band, N: band(N, 100, 1200) * 0.10)
