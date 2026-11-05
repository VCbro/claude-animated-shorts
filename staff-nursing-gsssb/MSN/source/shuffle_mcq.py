#!/usr/bin/env python3
"""One-time helper: shuffles MCQ options in chapters/*.md (deterministic) and rewrites the answer keys,
so correct answers are spread across a/b/c/d. Numeric-only option sets keep their natural order.
Safe to re-run: it reads the current key and moves the correct option with it."""
import glob, os, random, re
HERE = os.path.dirname(os.path.abspath(__file__))
OPT = re.compile(r'^ \(a\) (.*?) \(b\) (.*?) \(c\) (.*?) \(d\) (.*)$')
for f in sorted(glob.glob(os.path.join(HERE, 'chapters', '*.md'))):
    lines = open(f, encoding='utf-8').read().split('\n')
    key_idx = [i for i, l in enumerate(lines) if re.search(r'\b\d+-[a-d]\b', l) and not l.startswith(' ')]
    keys = {}
    for i in key_idx:
        for n, a in re.findall(r'\b(\d+)-([a-d])\b', lines[i]):
            keys[int(n)] = a
    newkeys, qnum = {}, None
    for i, l in enumerate(lines):
        m = re.match(r'^(\d+)\. ', l)
        if m: qnum = int(m.group(1)); continue
        m = OPT.match(l)
        if m and qnum in keys:
            opts = list(m.groups())
            correct = opts['abcd'.index(keys[qnum])]
            if all(re.match(r'^[\d≥<>(]', o) for o in opts):
                newkeys[qnum] = keys[qnum]; continue
            rnd = random.Random(f'{os.path.basename(f)}-{qnum}')
            rnd.shuffle(opts)
            lines[i] = ' ' + ' '.join(f'({c}) {o}' for c, o in zip('abcd', opts))
            newkeys[qnum] = 'abcd'[opts.index(correct)]
    for i in key_idx:
        lines[i] = re.sub(r'\b(\d+)-([a-d])\b', lambda m: f'{m.group(1)}-{newkeys.get(int(m.group(1)), m.group(2))}', lines[i])
    open(f, 'w', encoding='utf-8').write('\n'.join(lines))
    dist = {c: list(newkeys.values()).count(c) for c in 'abcd'}
    print(os.path.basename(f), len(newkeys), dist)
