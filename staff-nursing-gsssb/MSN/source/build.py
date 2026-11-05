#!/usr/bin/env python3
"""Build the MSN notes PDF.

  pip install markdown        (one time)
  python3 build.py            -> ../pdf/MSN_Complete_Notes_GSSSB.pdf

Chapters live in chapters/NN_name.md. Extra syntax on top of Markdown:

  :::key Title      ... :::   blue "key points" box
  :::tip Title      ... :::   tip box with the Sister Asha avatar
  :::warn Title     ... :::   red nursing-alert box
  :::exam Title     ... :::   purple exam-point box
  :::mnemo Title    ... :::   green mnemonic box
  :::def Title      ... :::   yellow definition box
  :::mcq Title      ... :::   practice questions
  :::ans Title      ... :::   answer key
  @fig file.svg | caption     image from ../images/svg with a caption
  First line "# Title" + "<!-- desc: ... -->" give the chapter title and TOC description.
"""
import glob, html, os, re, subprocess, sys
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_HTML = os.path.join(HERE, 'MSN_notes.html')
OUT_PDF = os.path.join(HERE, '..', 'pdf', 'MSN_Complete_Notes_GSSSB.pdf')

PALETTE = [  # (c1, c2) per chapter
    ('#1565c0', '#42a5f5'), ('#00838f', '#26c6da'), ('#6a1b9a', '#ab47bc'), ('#2e7d32', '#66bb6a'),
    ('#c62828', '#ef5350'), ('#ad1457', '#ec407a'), ('#6d4c41', '#a1887f'), ('#ef6c00', '#ffa726'),
    ('#bf360c', '#ff7043'), ('#4527a0', '#7e57c2'), ('#283593', '#5c6bc0'), ('#4e342e', '#8d6e63'),
    ('#d84315', '#ff8a65'), ('#b71c1c', '#e57373'), ('#00695c', '#26a69a'), ('#5d4037', '#a1887f'),
    ('#01579b', '#29b6f6'), ('#880e4f', '#f06292'), ('#37474f', '#78909c'), ('#1b5e20', '#4caf50'),
]
ICONS = {'key': '★', 'tip': '', 'warn': '!', 'exam': '✎', 'mnemo': '♫', 'def': 'D', 'mcq': '?', 'ans': '✓'}
DEFAULT_TITLES = {'key': 'Key Points', 'tip': 'Asha Didi ki Tip', 'warn': 'Nursing Alert', 'exam': 'Exam Point',
                  'mnemo': 'Mnemonic – Yaad karne ki trick', 'def': 'Definition', 'mcq': 'Practice MCQs', 'ans': 'Answer Key'}


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
        if re.match(r'^\s+\([a-d]\)', line):  # MCQ option line -> new line inside the list item
            line = '   <span class="opt">' + line.strip() + '</span>'
        if re.match(r'^ - ', line):  # one-space sub-bullet -> real nested list
            line = '    ' + line[1:]
        # a list right after a text line needs a blank line, or Markdown keeps it as plain text
        is_item = re.match(r'^(- |\d+\. )', line)
        prev = out[-1] if out else ''
        if is_item and prev.strip() and not re.match(r'^\s*(- |\d+\. |<|\|)', prev) and not prev.startswith('   '):
            out.append('')
        out.append(line)
    return '\n'.join(out)


def build():
    files = sorted(glob.glob(os.path.join(HERE, 'chapters', '*.md')))
    sections, toc = [], []
    for i, f in enumerate(files):
        text = open(f, encoding='utf-8').read()
        title = re.search(r'^# (.+)$', text, re.M).group(1).strip()
        desc = (re.search(r'<!-- desc: (.*?) -->', text) or [None, ''])[1]
        text = re.sub(r'^# .+$', '', text, count=1, flags=re.M)
        body = markdown.markdown(preprocess(text), extensions=['tables', 'md_in_html', 'attr_list', 'sane_lists', 'nl2br'])
        c1, c2 = PALETTE[i % len(PALETTE)]
        num = f'{i + 1:02d}'
        sections.append(f'<section class="chapter" style="--c1:{c1};--c2:{c2}"><h1 data-num="{i + 1}">{html.escape(title)}</h1>\n{body}\n</section>')
        toc.append(f'<li style="--c1:{c1}"><span class="n">{i + 1}</span><span class="t">{html.escape(title)}<span class="d">{html.escape(desc)}</span></span></li>')

    cover = f'''<div class="cover">
  <span class="tag">GSSSB · STAFF NURSE EXAM</span>
  <h1>Medical-Surgical<br><span>Nursing (MSN)</span></h1>
  <div class="sub">Complete Colourful Notes · Diagrams · Mnemonics · MCQs</div>
  <img class="art" src="../images/svg/cover_art.svg">
  <div class="chips"><span>{len(files)} Chapters</span><span>14 Coloured Diagrams</span><span>Nursing Management</span><span>Normal Values</span><span>Drugs &amp; Antidotes</span><span>Practice MCQs + Answers</span></div>
  <div class="foot">Hinglish explanation + English exam terms</div>
  <div class="teacher"><img src="../images/svg/avatar_nurse.svg"><div><b>Sister Asha</b><small>Aapki MSN teacher</small></div></div>
</div>'''
    howto = '''<div class="howto">
  <div style="background:#e8f2ff;border-color:#64a5f0"><b style="color:#0d47a1">★ Key Points</b> – sabse important facts</div>
  <div style="background:#fff7e0;border-color:#ffb74d"><b style="color:#c25e00">Asha Didi ki Tip</b> – samjhane wali baat</div>
  <div style="background:#fff0f0;border-color:#ef7f7f"><b style="color:#b71c1c">! Nursing Alert</b> – galti mat karna</div>
  <div style="background:#f6efff;border-color:#a77de6"><b style="color:#5e1fa8">✎ Exam Point</b> – exam me baar baar aata hai</div>
  <div style="background:#eafaf0;border-color:#5cc185"><b style="color:#1b6e3b">♫ Mnemonic</b> – yaad karne ki trick</div>
  <div style="background:#fffbe6;border-color:#f2c94c"><b style="color:#8a5a00">D Definition</b> – exact definition</div>
</div>'''
    toc_html = f'<div class="toc"><h2>Index – Kya padhenge?</h2><ol>{"".join(toc)}</ol>{howto}</div>'
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MSN Notes – GSSSB Staff Nurse</title>
<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="style.css"></head>
<body>{cover}{toc_html}{"".join(sections)}
<div class="endnote">— MSN Notes · GSSSB Staff Nurse Preparation · Padhte raho, revise karte raho! —</div></body></html>'''
    open(OUT_HTML, 'w', encoding='utf-8').write(doc)
    print('html:', OUT_HTML, f'({len(files)} chapters)')
    if '--html-only' not in sys.argv:
        subprocess.run(['node', os.path.join(HERE, 'render_pdf.js'), OUT_HTML, OUT_PDF], check=True)


if __name__ == '__main__':
    build()
