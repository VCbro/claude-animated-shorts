import os, sys; sys.path.insert(0, os.path.dirname(__file__)); from sfxlib import build
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ev = [(0, 'buzz', 1.2), (0, 'hit', 0.8), (0.6, 'whoosh', 0.6), ('female', 'whoosh', 0.5), ('female', 'buzz', 0.7), ('co2', 'hiss', 0.5), ('co2', 'whoosh', 0.5),
      ('heat', 'whoosh', 0.5), ('heat', 'buzz', 0.8), ('open', 'hit', 0.9), ('saw', 'tick', 1), ('hold', 'tick', 1), ('suck', 'pop', 0.6), ('spit', 'pop', 0.5),
      ('itch', 'ding', 1), ('next', 'buzz', 1.4), ('next', 'riser', 0.8)]
for i in range(16): ev.append((('saw'), 'tick', 0.6)) if False else None
build(ROOT, ev, 'tense')
