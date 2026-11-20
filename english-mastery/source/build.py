#!/usr/bin/env python3
"""Build the English Mastery Notebook volumes (print-ready PDF + editable DOCX).

  pip install markdown            (one time)
  python3 build.py                -> every volume folder that has chapters
  python3 build.py 1              -> only Volume 1
  python3 build.py 1 --no-docx    -> PDF only

Each volume lives in vol01/, vol02/ … and contains Markdown files:
  00*_*.md   unnumbered front matter (how to use, diagnostic test …)
  NN_*.md    chapter NN (global chapter number across the whole series)
  99*_*.md   unnumbered back matter (revision quiz …)

Front matter inside a file:
  # Chapter title
  <!-- level: Foundation -->            (Foundation / Intermediate / Advanced / Exam Focus; several allowed, comma-separated)
  <!-- desc: one line for the contents page -->

Extra Markdown syntax (boxes – each label stays readable in grayscale):
  :::goals / warm / rule / example / mistake / compare / note / hindi / tip / revision / practice / dialogue / ans  Title
  ...
  :::
  :::two ... :::               two columns (children: <div markdown="1">)
  @fig file.svg | caption      image from ../images/svg
  @lines N                     N blank writing lines for handwritten answers
  @pagebreak                   force a new page
  " (a) .. (b) .. (c) .. (d) .."  line under a numbered question = MCQ options
"""
import glob, html, os, re, subprocess, sys
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SERIES = 'English Mastery Notebook'

VOLUMES = {
    1: dict(title='Foundation English', sub='Alphabet · Sounds · Spelling · Punctuation · Sentences · Be, Have &amp; Do',
            level='Absolute Beginner → Foundation', file='EMN_Vol01_Foundation_English'),
    2: dict(title='Parts of Speech', sub='Nouns · Pronouns · Articles · Determiners · Adjectives · Adverbs · Prepositions · Conjunctions',
            level='Foundation → Intermediate', file='EMN_Vol02_Parts_of_Speech'),
    3: dict(title='Verbs, Tenses &amp; Sentence Building', sub='Verb forms · 12 tenses · Modals · Question tags · Gerunds &amp; Infinitives',
            level='Intermediate', file='EMN_Vol03_Verbs_and_Tenses'),
    4: dict(title='Advanced Grammar &amp; Usage', sub='Clauses · Voice · Narration · Conditionals · Inversion · Register',
            level='Advanced', file='EMN_Vol04_Advanced_Grammar'),
    5: dict(title='Vocabulary Builder', sub='High-frequency words · Word families · Collocations · Phrasal verbs · Idioms · OWS',
            level='Foundation → Advanced', file='EMN_Vol05_Vocabulary_Builder'),
    6: dict(title='Spoken &amp; Everyday English', sub='Pronunciation · Daily conversations · Phone · Travel · Interviews · Office',
            level='Foundation → Advanced', file='EMN_Vol06_Spoken_English'),
    7: dict(title='Reading &amp; Writing Skills', sub='Comprehension · Paragraphs · Précis · Letters · Emails · Essays · Reports',
            level='Intermediate → Advanced', file='EMN_Vol07_Reading_Writing'),
    8: dict(title='Competitive Exam English', sub='Error spotting · Cloze · Para jumbles · RC · Vocabulary sets · Mock tests',
            level='Exam Focus', file='EMN_Vol08_Competitive_Exam_English'),
    9: dict(title='Revision &amp; Reference', sub='Cumulative tests · Final assessment · Quick-reference tables · Glossary · Study plans',
            level='All levels', file='EMN_Vol09_Revision_Reference'),
}

PALETTE = [
    ('#1565c0', '#42a5f5'), ('#00838f', '#26c6da'), ('#6a1b9a', '#ab47bc'), ('#2e7d32', '#66bb6a'),
    ('#c62828', '#ef5350'), ('#ad1457', '#ec407a'), ('#ef6c00', '#ffa726'), ('#4527a0', '#7e57c2'),
    ('#00695c', '#26a69a'), ('#283593', '#5c6bc0'), ('#bf360c', '#ff7043'), ('#01579b', '#29b6f6'),
]
# kind: (icon, default title)
BOXES = {
    'goals':    ('◎', 'Learning Goals'),
    'warm':     ('☀', 'Warm-up'),
    'rule':     ('R', 'RULE'),
    'example':  ('E', 'EXAMPLES'),
    'mistake':  ('✗', 'COMMON MISTAKES'),
    'compare':  ('⇄', 'COMPARE & UNDERSTAND'),
    'note':     ('i', 'NOTE'),
    'hindi':    ('हि', 'Hindi Help – आसान भाषा में'),
    'tip':      ('★', 'EXAM TIP'),
    'revision': ('✓', 'QUICK REVISION'),
    'practice': ('✎', 'PRACTICE'),
    'dialogue': ('❝', 'DIALOGUE'),
    'ans':      ('✓', 'ANSWER KEY'),
}
LEVEL_CLASS = {'foundation': 'lv-f', 'intermediate': 'lv-i', 'advanced': 'lv-a', 'exam focus': 'lv-x'}


def preprocess(md_text):
    out = []
    for line in md_text.split('\n'):
        m = re.match(r'^:::(\w+)\s*(.*)$', line)
        if m and m.group(1) in BOXES:
            kind = m.group(1)
            icon, default = BOXES[kind]
            title = m.group(2).strip() or default
            out += [f'<div class="box {kind}" markdown="1">',
                    f'<div class="bt"><span class="ic">{icon}</span>{html.escape(title)}</div>', '']
            continue
        m = re.match(r'^:::(two)\s*$', line)
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
        m = re.match(r'^@lines\s+(\d+)\s*$', line)
        if m:
            out.append('<div class="lines">' + '<span></span>' * int(m.group(1)) + '</div>')
            continue
        if line.strip() == '@pagebreak':
            out.append('<div class="pb"></div>')
            continue
        if re.match(r'^\s+\([a-d]\)', line):  # MCQ option line
            line = '   <span class="opt">' + line.strip() + '</span>'
        if re.match(r'^ - ', line):  # one-space sub-bullet -> nested list
            line = '    ' + line[1:]
        is_item = re.match(r'^(- |\d+\. )', line)
        prev = out[-1] if out else ''
        if is_item and prev.strip() and not re.match(r'^\s*(- |\d+\. |<|\|)', prev) and not prev.startswith('   '):
            out.append('')
        if line.startswith('|') and prev.strip() and not prev.lstrip().startswith(('|', '<')):
            out.append('')  # a table needs a blank line before it
        out.append(line)
    return '\n'.join(out)


def level_badges(levels):
    return ''.join(f'<span class="lv {LEVEL_CLASS.get(l.strip().lower(), "lv-f")}">{html.escape(l.strip())}</span>'
                   for l in levels.split(',') if l.strip())


def build(vol, docx=True):
    cfg = VOLUMES[vol]
    vdir = os.path.join(HERE, f'vol{vol:02d}')
    files = sorted(glob.glob(os.path.join(vdir, '*.md')))
    if not files:
        print(f'vol {vol}: no chapters yet'); return
    sections, toc, nq, nch = [], [], 0, 0
    for i, f in enumerate(files):
        base = os.path.basename(f)
        text = open(f, encoding='utf-8').read()
        title = re.search(r'^# (.+)$', text, re.M).group(1).strip()
        desc = (re.search(r'<!-- desc: (.*?) -->', text) or [None, ''])[1]
        levels = (re.search(r'<!-- level: (.*?) -->', text) or [None, ''])[1]
        num = int(base[:2]) if base[:2].isdigit() and base[:2] not in ('00', '99') else None
        nch += 1 if num else 0
        nq += len(re.findall(r'^\d+\. ', text, re.M))
        text = re.sub(r'^# .+$', '', text, count=1, flags=re.M)
        body = markdown.markdown(preprocess(text), extensions=['tables', 'md_in_html', 'attr_list', 'sane_lists', 'nl2br'])
        c1, c2 = PALETTE[(num or i) % len(PALETTE)]
        anchor = f'sec-{i}'
        numattr = f'data-num="{num}"' if num else 'data-num="★"'
        badges = level_badges(levels)
        label = f'Chapter {num}' if num else ''
        sections.append(f'<section class="chapter" id="{anchor}" style="--c1:{c1};--c2:{c2}">'
                        f'<h1 {numattr}>{html.escape(title)}</h1>'
                        f'<div class="chmeta">{f"<b>{label}</b>" if label else ""}{badges}</div>\n{body}\n</section>')
        toc.append(f'<li style="--c1:{c1}"><a href="#{anchor}"><span class="n">{num if num else "★"}</span>'
                   f'<span class="t">{html.escape(title)} {badges}<span class="d">{html.escape(desc)}</span></span></a></li>')

    cover = f'''<div class="cover">
  <span class="tag">VOLUME {vol} · {cfg["level"].upper()}</span>
  <div class="ctitle">{SERIES.replace(" Notebook", "")}<br><span>Notebook</span></div>
  <div class="sub">Grammar • Vocabulary • Spoken English • Writing • Exam Practice</div>
  <div class="vol"><b>Volume {vol}</b> — {cfg["title"]}<small>{cfg["sub"]}</small></div>
  <img class="art" src="../images/svg/cover_art.svg">
  <div class="chips"><span>{nch} chapters</span><span>{nq}+ practice items</span><span>Answer key with explanations</span><span>Simple Hindi support</span><span>Print &amp; phone friendly</span></div>
  <div class="foot">Self-study edition · Beginner to Advanced</div>
  <div class="teacher"><img src="../images/svg/avatar_teacher.svg"><div><b>Asha Ma'am</b><small>Your English mentor</small></div></div>
</div>'''
    legend = '''<div class="legend">
  <div class="box rule"><div class="bt"><span class="ic">R</span>RULE</div>the grammar rule / formula</div>
  <div class="box example"><div class="bt"><span class="ic">E</span>EXAMPLES</div>correct, natural sentences</div>
  <div class="box mistake"><div class="bt"><span class="ic">✗</span>COMMON MISTAKES</div>wrong → right + reason</div>
  <div class="box compare"><div class="bt"><span class="ic">⇄</span>COMPARE</div>confusing pairs explained</div>
  <div class="box tip"><div class="bt"><span class="ic">★</span>EXAM TIP</div>what examiners test</div>
  <div class="box revision"><div class="bt"><span class="ic">✓</span>QUICK REVISION</div>key takeaways</div>
  <div class="box practice"><div class="bt"><span class="ic">✎</span>PRACTICE</div>write your answers here</div>
  <div class="box hindi"><div class="bt"><span class="ic">हि</span>HINDI HELP</div>आसान हिंदी में समझ</div>
  <div class="box ans"><div class="bt"><span class="ic">✓</span>ANSWER KEY</div>check &amp; correct yourself</div>
</div>
<p class="lvkey">Levels: <span class="lv lv-f">Foundation</span> <span class="lv lv-i">Intermediate</span> <span class="lv lv-a">Advanced</span> <span class="lv lv-x">Exam Focus</span></p>'''
    toc_html = f'<div class="toc"><h2>Contents – Volume {vol}</h2><ol>{"".join(toc)}</ol><h3 class="legh">How to read the boxes</h3>{legend}</div>'
    title_txt = f'{SERIES} – Volume {vol}: {re.sub("&amp;", "&", cfg["title"])}'
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(title_txt)}</title>
<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="style.css"></head>
<body>{cover}{toc_html}{"".join(sections)}
<div class="endnote">— {SERIES} · Volume {vol} · Practise daily, speak fearlessly! —</div></body></html>'''
    out_html = os.path.join(HERE, f'vol{vol:02d}.html')
    open(out_html, 'w', encoding='utf-8').write(doc)
    pdf = os.path.join(ROOT, 'pdf', cfg['file'] + '.pdf')
    footer = f'{SERIES} · Vol {vol} · {re.sub("&amp;", "&", cfg["title"])}'
    subprocess.run(['node', os.path.join(HERE, 'render_pdf.js'), out_html, pdf, footer], check=True)
    if docx:
        out_docx = os.path.join(ROOT, 'docx', cfg['file'] + '.docx')
        docx_html = os.path.join(HERE, f'vol{vol:02d}_docx.html')
        d = re.sub(r'\.\./images/svg/([\w-]+)\.svg', r'../images/png/\1.png', doc)
        d = re.sub(r'<div class="teacher">.*?</div></div>', '', d, flags=re.S)                 # no avatar in DOCX
        d = d.replace('<img class="art" src="../images/png/cover_art.png">', '<img src="../images/png/cover_art.png" style="width:12cm">')
        d = re.sub(r'<span class="lv ([\w-]+)">', r' <span class="lv \1">[', d).replace('</span><span class="d">', '</span> — <span class="d">')
        d = re.sub(r'(\[(?:Foundation|Intermediate|Advanced|Exam Focus))</span>', r'\1]</span>', d)
        d = re.sub(r'<span class="ic">[^<]*</span>', '', d)                                    # box icons → plain label
        d = d.replace('</span><span class="t">', '. </span><span class="t">')
        open(docx_html, 'w', encoding='utf-8').write(d)
        subprocess.run(['pandoc', docx_html, '-f', 'html', '-t', 'docx', '-o', out_docx,
                        '--resource-path', HERE, '--metadata', f'title={title_txt}'], check=True, cwd=HERE)
        print('docx:', out_docx)
    print(f'vol {vol}: {len(files)} files, {nch} chapters, {nq} numbered items')


if __name__ == '__main__':
    vols = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(VOLUMES)
    for v in vols:
        build(v, docx='--no-docx' not in sys.argv)
