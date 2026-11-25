import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0, 'swell', 1.0), (0, 'hit', 0.6), ('cycle', 'whoosh', 0.6), ('cycle', 'hit', 0.7), ('date', 'whoosh', 0.4), ('thumba', 'wind', 0.5), ('church', 'ding', 0.7),
      ('bishop', 'swell', 0.8), ('parts', 'tick', 0.8), ('cart', 'tick', 0.8), ('count', 'tick', 1.0)]
import json; K = json.load(open(os.path.join(ROOT, 'out/anchors.json')))
for i in range(5): ev.append((K['count'] + 0.3 + i * (K['launch'] - K['count']) / 5, 'tick', 1.2))
ev += [('launch', 'launch', 1.4), ('kalam', 'swell', 0.8), ('moon', 'hit', 0.6), ('moon', 'swell', 1.0), ('dream', 'ding', 1.0), ('cta', 'swell', 0.6)]
build(ROOT, ev, 'story', amb=lambda tg, band, N: band(N, 150, 1500) * 0.08)
