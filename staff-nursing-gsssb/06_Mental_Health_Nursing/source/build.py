#!/usr/bin/env python3
"""Build the Mental Health (Psychiatric) Nursing PDFs.

  pip install markdown        (one time)
  python3 build.py            -> both PDFs
  python3 build.py notes      -> ../pdf/MHN_Complete_Notes_GSSSB.pdf   (from chapters/*.md)
  python3 build.py mcq        -> ../pdf/MHN_MCQ_Bank_GSSSB.pdf         (from mcq/*.md)

Extra Markdown syntax:
  :::key / tip / warn / exam / mnemo / def / mcq / ans  Title   ...  :::   coloured boxes
  :::two  ... :::   two columns (children: <div markdown="1">)      :::vs ... :::  comparison
  @fig file.svg | caption                                           image from ../images/svg
  " (a) .. (b) .. (c) .. (d) .."   line under a numbered question     MCQ options
"""
import glob, html, os, re, subprocess, sys
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = {
    'notes': dict(src='chapters', html='MHN_notes.html', pdf='MHN_Complete_Notes_GSSSB.pdf',
                  title='Mental Health<br><span>Nursing (Psychiatry)</span>', sub='Complete Colourful Notes · 3D Diagrams · Mnemonics · Exam Points',
                  tag='GSSSB · STAFF NURSE EXAM', footer='Mental Health Nursing · Notes · GSSSB Staff Nurse',
                  chips=['{n} Chapters', '3D Coloured Diagrams', 'MSE · Therapeutic communication', 'Psychiatric disorders', 'Psychopharmacology & ECT', 'Exam Points (PYQ style)'],
                  index='Index – Kya padhenge?'),
    'mcq': dict(src='mcq', html='MHN_mcq.html', pdf='MHN_MCQ_Bank_GSSSB.pdf',
                title='Mental Health Nursing<br><span>MCQ Bank</span>', sub='{q} MCQs · GSSSB pattern · Answer key with explanation',
                tag='GSSSB · STAFF NURSE EXAM', footer='Mental Health Nursing · MCQ Bank · GSSSB Staff Nurse',
                chips=['{n} Sections', '{q} MCQs', 'Direct + Priority + Scenario', 'Match & Assertion-Reason', 'Calculations', 'Explanations'],
                index='MCQ Bank – Sections'),
}
PALETTE = [
    ('#1565c0', '#42a5f5'), ('#00838f', '#26c6da'), ('#6a1b9a', '#ab47bc'), ('#2e7d32', '#66bb6a'),
    ('#c62828', '#ef5350'), ('#ad1457', '#ec407a'), ('#6d4c41', '#a1887f'), ('#ef6c00', '#ffa726'),
    ('#bf360c', '#ff7043'), ('#4527a0', '#7e57c2'), ('#283593', '#5c6bc0'), ('#4e342e', '#8d6e63'),
    ('#d84315', '#ff8a65'), ('#b71c1c', '#e57373'), ('#00695c', '#26a69a'), ('#5d4037', '#a1887f'),
    ('#01579b', '#29b6f6'), ('#880e4f', '#f06292'), ('#37474f', '#78909c'), ('#1b5e20', '#4caf50'),
]
ICONS = {'key': '★', 'tip': '', 'warn': '!', 'exam': '✎', 'mnemo': '♫', 'def': 'D', 'mcq': '?', 'ans': '✓'}
DEFAULT_TITLES = {'key': 'Key Points', 'tip': 'Asha Didi ki Tip', 'warn': 'Nursing Alert', 'exam': 'Exam Point (PYQ style)',
                  'mnemo': 'Mnemonic – Yaad karne ki trick', 'def': 'Definition', 'mcq': 'MCQs', 'ans': 'Answer Key & Explanation'}


def preprocess(md_text):
    out = []
    for line in md_text.split('\n'):
        m = re.match(r'^:::(\w+)\s*(.*)$', line)
        if m and m.group(1) in ICONS:
            kind, title = m.group(1), m.group(2).strip() or DEFAULT_TITLES[m.group(1)]
            ic = f'<span class="ic">{ICONS[kind]}</span>' if ICONS[kind] else ''
            out += [f'<div class="box {kind}" markdown="1">', f'<div class="bt">{ic}{html.escape(title)}</div>', '']
            continue
        m = re.match(r'^:::(two|vs)\s*$', line)
        if m:
            out += [f'<div class="{m.group(1)}" markdown="1">', '']
            continue
        if line.strip() == ':::':
            out += ['', '</div>', '']
            continue
        m = re.match(r'^@fig\s+(\S+)\s*\|\s*(.*)$', line)
        if m:
            out.append(f'<figure><img src="../images/svg/{m.group(1)}"><figcaption>{html.escape(m.group(2))}</figcaption></figure>')
            continue
        if re.match(r'^\s+\([a-d]\)', line):  # MCQ option line
            line = '   <span class="opt">' + line.strip() + '</span>'
        if re.match(r'^ - ', line):  # one-space sub-bullet -> nested list
            line = '    ' + line[1:]
        is_item = re.match(r'^(- |\d+\. )', line)
        prev = out[-1] if out else ''
        if is_item and prev.strip() and not re.match(r'^\s*(- |\d+\. |<|\|)', prev) and not prev.startswith('   '):
            out.append('')
        out.append(line)
    return '\n'.join(out)


def build(name):
    cfg = BOOKS[name]
    files = sorted(glob.glob(os.path.join(HERE, cfg['src'], '*.md')))
    sections, toc, qtotal = [], [], 0
    for i, f in enumerate(files):
        text = open(f, encoding='utf-8').read()
        title = re.search(r'^# (.+)$', text, re.M).group(1).strip()
        desc = (re.search(r'<!-- desc: (.*?) -->', text) or [None, ''])[1]
        nq = len(re.findall(r'^\d+\. .*\n\s+\(a\)', text, re.M))
        qtotal += nq
        if name == 'mcq':
            desc = f'{nq} MCQs · ' + desc
        text = re.sub(r'^# .+$', '', text, count=1, flags=re.M)
        body = markdown.markdown(preprocess(text), extensions=['tables', 'md_in_html', 'attr_list', 'sane_lists', 'nl2br'])
        c1, c2 = PALETTE[i % len(PALETTE)]
        sections.append(f'<section class="chapter" style="--c1:{c1};--c2:{c2}"><h1 data-num="{i + 1}">{html.escape(title)}</h1>\n{body}\n</section>')
        toc.append(f'<li style="--c1:{c1}"><span class="n">{i + 1}</span><span class="t">{html.escape(title)}<span class="d">{html.escape(desc)}</span></span></li>')

    fmt = dict(n=len(files), q=qtotal)
    chips = ''.join(f'<span>{c.format(**fmt)}</span>' for c in cfg['chips'])
    cover = f'''<div class="cover">
  <span class="tag">{cfg["tag"]}</span>
  <h1>{cfg["title"]}</h1>
  <div class="sub">{cfg["sub"].format(**fmt)}</div>
  <img class="art" src="../images/svg/cover_art.svg">
  <div class="chips">{chips}</div>
  <div class="foot">Hinglish explanation + English exam terms</div>
  <div class="teacher"><img src="../images/svg/avatar_nurse.svg"><div><b>Sister Asha</b><small>Aapki Nursing teacher</small></div></div>
</div>'''
    howto = '''<div class="howto">
  <div style="background:#e8f2ff;border-color:#64a5f0"><b style="color:#0d47a1">★ Key Points</b> – sabse important facts</div>
  <div style="background:#fff7e0;border-color:#ffb74d"><b style="color:#c25e00">Asha Didi ki Tip</b> – samjhane wali baat</div>
  <div style="background:#fff0f0;border-color:#ef7f7f"><b style="color:#b71c1c">! Nursing Alert</b> – galti mat karna</div>
  <div style="background:#f6efff;border-color:#a77de6"><b style="color:#5e1fa8">✎ Exam Point</b> – PYQ style, baar baar aata hai</div>
  <div style="background:#eafaf0;border-color:#5cc185"><b style="color:#1b6e3b">♫ Mnemonic</b> – yaad karne ki trick</div>
  <div style="background:#fffbe6;border-color:#f2c94c"><b style="color:#8a5a00">D Definition</b> – exact definition</div>
</div>''' if name == 'notes' else '''<div class="howto">
  <div style="background:#e8f2ff;border-color:#64a5f0"><b style="color:#0d47a1">Level 1 – Direct</b>: facts, values, definitions</div>
  <div style="background:#fff0f0;border-color:#ef7f7f"><b style="color:#b71c1c">Level 2 – Priority</b>: "first / best / immediate" action</div>
  <div style="background:#f6efff;border-color:#a77de6"><b style="color:#5e1fa8">Level 3 – Advanced</b>: scenario, NOT/EXCEPT, match, A-R, calculation</div>
</div>
<div class="box tip"><div class="bt">MCQ kaise solve karein?</div><p>Pehle khud answer socho, phir options padho. Har section ke baad answer key aur explanation hai, galti wale questions ka number apni notebook me likho. Exam me galat answer par <b>0.25 marks</b> kat sakte hain, isliye bina soche guess mat karo.</p></div>'''
    toc_html = f'<div class="toc"><h2>{cfg["index"]}</h2><ol>{"".join(toc)}</ol>{howto}</div>'
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{re.sub("<.*?>", " ", cfg["title"])}</title>
<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="style.css"></head>
<body class="book-{name}">{cover}{toc_html}{"".join(sections)}
<div class="endnote">— Mental Health Nursing · GSSSB Staff Nurse Preparation · Padhte raho, revise karte raho! —</div></body></html>'''
    out_html = os.path.join(HERE, cfg['html'])
    open(out_html, 'w', encoding='utf-8').write(doc)
    print(f'{name}: {len(files)} files, {qtotal} MCQs')
    if '--html-only' not in sys.argv:
        subprocess.run(['node', os.path.join(HERE, 'render_pdf.js'), out_html, os.path.join(HERE, '..', 'pdf', cfg['pdf']), cfg['footer']], check=True)


if __name__ == '__main__':
    names = [a for a in sys.argv[1:] if a in BOOKS] or list(BOOKS)
    for n in names:
        build(n)
