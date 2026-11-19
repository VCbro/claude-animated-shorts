#!/usr/bin/env python3
"""QC: every numbered practice item must have an answer-key entry; MCQ keys must be a-d and options must exist."""
import glob, re, sys, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'source')
bad = 0
for f in sorted(glob.glob(os.path.join(root, 'vol*', '*.md'))):
    t = open(f, encoding='utf-8').read()
    blocks = re.findall(r'^:::(\w+)[^\n]*\n(.*?)^:::\s*$', t, re.M | re.S)
    q, a, mcq = set(), set(), {}
    for kind, body in blocks:
        nums = {int(n) for n in re.findall(r'(?:^|\s)(\d{1,3})\.\s', body, re.M)}
        if kind == 'practice':
            q |= nums
            for m in re.finditer(r'^(\d+)\. .*\n\s+\(a\)(.*)\(b\)(.*)\(c\)(.*)\(d\)', body, re.M):
                mcq[int(m.group(1))] = True
        elif kind == 'ans':
            a |= nums | {int(n) for n in re.findall(r'\*\*(\d+)-[a-d]\*\*', body)}
            for n, k in re.findall(r'\*\*(\d+)-([a-z])\*\*', body):
                if k not in 'abcd': print(f'  bad key {n}-{k}'); bad += 1
    keyed = {int(n) for n in re.findall(r'\*\*(\d+)-[a-d]\*\*', t)}
    missing = sorted(q - a); nokey = sorted(n for n in mcq if n not in keyed)
    print(f'{os.path.basename(f):40s} items={len(q):3d} mcq={len(mcq):2d} missing_answers={missing} mcq_without_key={nokey}')
    bad += len(missing) + len(nokey)
print('PROBLEMS:', bad); sys.exit(1 if bad else 0)
