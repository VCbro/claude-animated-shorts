#!/usr/bin/env python3
"""Shuffles MCQ options in mcq/*.md deterministically and rewrites the answer keys, so correct
answers are spread over a/b/c/d. Assertion-Reason ("Both A and R…") and numeric option sets keep
their order. Safe to re-run (it moves the keyed option along with the shuffle)."""
import glob, os, random, re
HERE = os.path.dirname(os.path.abspath(__file__))
OPT = re.compile(r'^ \(a\) (.*?) \(b\) (.*?) \(c\) (.*?) \(d\) (.*)$')
KEY = re.compile(r'\b(\d+)-([a-d])\b')
for f in sorted(glob.glob(os.path.join(HERE, 'mcq', '*.md'))):
    lines = open(f, encoding='utf-8').read().split('\n')
    in_ans, key_idx = False, []
    for i, l in enumerate(lines):
        if l.startswith(':::ans'): in_ans = True
        elif l.strip() == ':::': in_ans = False
        elif in_ans and KEY.search(l): key_idx.append(i)
    keys = {}
    for i in key_idx:
        m = KEY.search(lines[i]); keys[int(m.group(1))] = m.group(2)
    newkeys, qnum = {}, None
    for i, l in enumerate(lines):
        m = re.match(r'^(\d+)\. ', l)
        if m: qnum = int(m.group(1)); continue
        m = OPT.match(l)
        if m and qnum in keys:
            opts = list(m.groups())
            correct = opts['abcd'.index(keys[qnum])]
            if opts[0].startswith('Both') or all(re.match(r'^[\d≥≤<>(−.]', o) for o in opts):
                newkeys[qnum] = keys[qnum]; continue
            rnd = random.Random(f'{os.path.basename(f)}-{qnum}')
            rnd.shuffle(opts)
            lines[i] = ' ' + ' '.join(f'({c}) {o}' for c, o in zip('abcd', opts))
            newkeys[qnum] = 'abcd'[opts.index(correct)]
    for i in key_idx:
        lines[i] = KEY.sub(lambda m: f'{m.group(1)}-{newkeys.get(int(m.group(1)), m.group(2))}', lines[i], count=1)
    open(f, 'w', encoding='utf-8').write('\n'.join(lines))
    print(os.path.basename(f), len(newkeys), {c: list(newkeys.values()).count(c) for c in 'abcd'})
