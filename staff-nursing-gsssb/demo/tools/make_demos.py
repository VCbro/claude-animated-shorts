#!/usr/bin/env python3
"""Builds FREE DEMO PDFs for every subject: demo cover + ~10 hook pages (notes + MCQ) with a DEMO
watermark + a "Buy full version" page. Also writes cover thumbnails, a JSON manifest for the website
and a ZIP pack.

Usage:  python3 make_demos.py            (from anywhere)
Env:    STORE_NAME="My Nursing Store"   optional – shown on the demo cover / buy page
"""
import glob, html, io, json, os, re, shutil, subprocess, tempfile, zipfile
from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO = os.path.dirname(HERE)
ROOT = os.path.dirname(DEMO)                      # staff-nursing-gsssb/
OUT_PDF = os.path.join(DEMO, 'pdf')
OUT_IMG = os.path.join(DEMO, 'cover_images')
STORE = os.environ.get('STORE_NAME', '').strip()

SUBJECTS = [
    # code, folder, title, title_gu/sub, chapters, diagrams, mcqs, notes pdf, mcq pdf (or None)
    dict(code='MSN', folder='MSN', title='Medical-Surgical Nursing (MSN)', chapters=20, diagrams=14, mcqs='330+',
         notes='MSN_Complete_Notes_GSSSB.pdf', mcq=None,
         topics=['All body systems – disorders & nursing care', 'Drugs & antidotes, normal values', 'Emergency & critical care', '330+ MCQs with answer keys']),
    dict(code='FON', folder='02_Fundamentals_of_Nursing', title='Fundamentals of Nursing', chapters=20, diagrams=20, mcqs='699',
         notes='FON_Complete_Notes_GSSSB.pdf', mcq='FON_MCQ_Bank_GSSSB.pdf',
         topics=['Nursing procedures step-by-step', 'Vital signs, asepsis, medication administration', 'First aid & documentation', '699 MCQs + 100-Q mock test']),
    dict(code='CHN', folder='03_Child_Health_Nursing', title='Child Health (Paediatric) Nursing', chapters=19, diagrams=14, mcqs='640',
         notes='CHN_Complete_Notes_GSSSB.pdf', mcq='CHN_MCQ_Bank_GSSSB.pdf',
         topics=['Growth & development milestones', 'Newborn care, IMNCI, immunisation', 'Paediatric disorders & drug doses', '640 MCQs + 100-Q mock test']),
    dict(code='OBG', folder='04_Midwifery_OBG', title='Midwifery & Obstetrical Nursing (OBG)', chapters=20, diagrams=14, mcqs='670',
         notes='OBG_Complete_Notes_GSSSB.pdf', mcq='OBG_MCQ_Bank_GSSSB.pdf',
         topics=['Pregnancy, labour & puerperium', 'High-risk pregnancy & obstetric emergencies', 'Gynaecology & family planning', '670 MCQs + 100-Q mock test']),
    dict(code='COMH', folder='05_Community_Health_Nursing', title='Community Health Nursing', chapters=17, diagrams=10, mcqs='580',
         notes='COMH_Complete_Notes_GSSSB.pdf', mcq='COMH_MCQ_Bank_GSSSB.pdf',
         topics=['Epidemiology & health indicators', 'National health programmes (latest)', 'Communicable diseases & IDSP', '580 MCQs + 100-Q mock test']),
    dict(code='MHN', folder='06_Mental_Health_Nursing', title='Mental Health (Psychiatric) Nursing', chapters=12, diagrams=4, mcqs='430',
         notes='MHN_Complete_Notes_GSSSB.pdf', mcq='MHN_MCQ_Bank_GSSSB.pdf',
         topics=['Psychiatric terms & MSE', 'Psychopharmacology & ECT', 'All major disorders + MHCA 2017', '430 MCQs + 100-Q mock test']),
    dict(code='PHARMA', folder='07_Pharmacology', title='Pharmacology for Nurses', chapters=10, diagrams=5, mcqs='400',
         notes='PHARMA_Complete_Notes_GSSSB.pdf', mcq='PHARMA_MCQ_Bank_GSSSB.pdf',
         topics=['Dose & drip-rate calculations', 'All drug groups & side effects', 'Antidote master table, high-alert drugs', '400 MCQs + 100-Q mock test']),
    dict(code='AP', folder='01_Anatomy_Physiology', title='Anatomy & Physiology', chapters=13, diagrams=6, mcqs='460',
         notes='AP_Complete_Notes_GSSSB.pdf', mcq='AP_MCQ_Bank_GSSSB.pdf',
         topics=['All body systems with physiology', 'Normal values master table', 'Largest / smallest / longest table', '460 MCQs + 100-Q mock test']),
    dict(code='MICRO', folder='08_Microbiology', title='Microbiology & Infection Control', chapters=10, diagrams=4, mcqs='370',
         notes='MICRO_Complete_Notes_GSSSB.pdf', mcq='MICRO_MCQ_Bank_GSSSB.pdf',
         topics=['Bacteria, viruses, fungi, parasites', 'Sterilisation, BMW 2016, hand hygiene', 'Vaccines, cold chain, specimen collection', '370 MCQs + 100-Q mock test']),
    dict(code='NUTRI', folder='09_Nutrition', title='Nutrition & Dietetics', chapters=10, diagrams=4, mcqs='370',
         notes='NUTRI_Complete_Notes_GSSSB.pdf', mcq='NUTRI_MCQ_Bank_GSSSB.pdf',
         topics=['Nutrients & RDA (ICMR-NIN 2020)', 'Malnutrition, SAM & breastfeeding', 'Therapeutic diets & national programmes', '370 MCQs + 100-Q mock test']),
    dict(code='GUJ', folder='10_Gujarati_GK_Reasoning', title='ગુજરાતી વ્યાકરણ (Gujarati Vyakaran)', chapters=13, diagrams=3, mcqs='460',
         notes='GUJ_Complete_Notes_GSSSB.pdf', mcq='GUJ_MCQ_Bank_GSSSB.pdf',
         topics=['સંધિ, સમાસ, અલંકાર, છંદ', 'રૂઢિપ્રયોગ, કહેવત, જોડણી', 'સમાનાર્થી, વિરોધી, શબ્દસમૂહ', '460 MCQs + 100-Q mock test']),
]


def page_texts(path):
    r = PdfReader(path)
    return r, [(p.extract_text() or '') for p in r.pages]


def colourfulness(path, n, tmp):
    """Mean saturation of each page (rendered small) – diagram pages score highest."""
    d = tempfile.mkdtemp(dir=tmp)
    subprocess.run(['pdftoppm', '-r', '12', '-png', path, os.path.join(d, 'p')], check=True)
    scores = {}
    for f in sorted(glob.glob(os.path.join(d, 'p-*.png'))):
        i = int(re.search(r'-(\d+)\.png$', f).group(1))
        im = Image.open(f).convert('HSV')
        s = list(im.getchannel('S').get_flattened_data()) if hasattr(im, 'get_flattened_data') else list(im.getchannel('S').getdata())
        scores[i] = sum(s) / len(s)
    return scores


def pick_notes(path, tmp):
    r, txt = page_texts(path)
    n = len(r.pages)
    sc = colourfulness(path, n, tmp)
    chosen = [1, 2]                                           # cover + index
    gap = max(6, n // 6)
    for i in sorted(range(4, n - 2), key=lambda k: -sc.get(k, 0)):
        if all(abs(i - c) >= gap for c in chosen if c > 2):
            chosen.append(i)
        if len(chosen) == 5:
            break
    pyq = [i for i in range(4, n) if ('PYQ style' in txt[i - 1] or 'one-liner' in txt[i - 1].lower())
           and all(abs(i - c) >= gap // 2 for c in chosen if c > 2)]
    if pyq:
        target = int(n * 0.55)
        chosen.append(min(pyq, key=lambda k: abs(k - target)))
    return sorted(set(chosen)), n


def pick_mcq(path):
    r, txt = page_texts(path)
    n = len(r.pages)
    first_q = next((i for i in range(4, n + 1) if 'Level 1' in txt[i - 1]), 4)
    mock = next((i for i in range(first_q + 1, n + 1) if 'Part A' in txt[i - 1] and 'Mock' in txt[i - 1]), None)
    ans = next((i for i in range(first_q, n + 1) if 'Answer Key' in txt[i - 1]), None)
    pages = [1, 2, first_q] + ([mock] if mock else []) + ([ans] if ans else [])
    return sorted(set(pages)), n


def pick_mcq_from_notes(path, notes_pages):
    r, txt = page_texts(path)
    n = len(r.pages)
    ans = [i for i in range(3, n + 1) if 'Answer Key' in txt[i - 1] and i not in notes_pages]
    if not ans:
        return []
    a = ans[len(ans) // 3]
    return [a - 1, a]


def watermark(w, h):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(w, h))
    c.saveState()
    c.translate(w / 2, h / 2); c.rotate(35)
    c.setFillColor(Color(0.85, 0.1, 0.1, alpha=0.10))
    c.setFont('Helvetica-Bold', 64)
    c.drawCentredString(0, 20, 'FREE DEMO')
    c.setFont('Helvetica-Bold', 26)
    c.drawCentredString(0, -22, 'Sample preview - Full PDF on website')
    c.restoreState()
    # top-right ribbon
    c.setFillColor(Color(0.85, 0.1, 0.1, alpha=0.88))
    c.roundRect(w - 118, h - 26, 108, 18, 6, stroke=0, fill=1)
    c.setFillColor(Color(1, 1, 1)); c.setFont('Helvetica-Bold', 9)
    c.drawCentredString(w - 64, h - 20.5, 'FREE SAMPLE PAGE')
    c.save(); buf.seek(0)
    return PdfReader(buf).pages[0]


def thumbs(path, pages, tmp, tag):
    out = []
    for p in pages:
        base = os.path.join(tmp, f'{tag}-{p}')
        subprocess.run(['pdftoppm', '-r', '45', '-f', str(p), '-l', str(p), '-png', '-singlefile', path, base], check=True)
        out.append(base + '.png')
    return out


CSS = """
@page { size: A4; margin: 0 }
html,body { margin:0; padding:0; font-family:'Noto Sans','Noto Sans Gujarati','DejaVu Sans',Arial,sans-serif; }
.pg { width:210mm; height:297mm; box-sizing:border-box; padding:16mm 15mm; position:relative; overflow:hidden;
      background: radial-gradient(circle at 80% 10%, #2a7fff 0%, #0d47a1 45%, #08214f 100%); color:#fff; }
.badge { display:inline-block; background:#ffca28; color:#4a2c00; font-weight:800; padding:6px 18px; border-radius:30px; font-size:13pt; letter-spacing:.5px }
.tag { display:inline-block; margin-left:8px; background:#ff5252; color:#fff; font-weight:800; padding:6px 14px; border-radius:30px; font-size:11pt }
h1 { font-size:34pt; line-height:1.08; margin:10mm 0 3mm; text-shadow:0 4px 14px rgba(0,0,0,.35) }
.sub { font-size:13pt; opacity:.92 }
.stats { display:flex; gap:4mm; margin:8mm 0 6mm; flex-wrap:wrap }
.stat { flex:1; min-width:30mm; background:rgba(255,255,255,.12); border:1.5px solid rgba(255,255,255,.35); border-radius:14px; padding:4mm; text-align:center }
.stat b { display:block; font-size:22pt; color:#ffca28 } .stat span { font-size:10pt }
.thumbs { display:flex; gap:4mm; margin-top:6mm }
.thumbs img { width:41mm; border-radius:8px; box-shadow:0 8px 22px rgba(0,0,0,.45); border:2px solid #fff; background:#fff }
.box { background:#fff; color:#1a2a44; border-radius:16px; padding:6mm 7mm; margin-top:7mm; box-shadow:0 10px 30px rgba(0,0,0,.35) }
.box h2 { margin:0 0 3mm; color:#0d47a1; font-size:16pt }
.box li { margin:1.6mm 0; font-size:11.5pt }
.foot { position:absolute; bottom:12mm; left:15mm; right:15mm; font-size:10pt; opacity:.85; text-align:center }
.cta { display:block; text-align:center; margin:8mm auto 0; background:linear-gradient(180deg,#ffd54f,#ffa000); color:#3e2600;
       font-weight:800; font-size:20pt; padding:5mm; border-radius:16px; box-shadow:0 8px 20px rgba(0,0,0,.35) }
.big { font-size:15pt; line-height:1.5 }
.lock { font-size:60pt; text-align:center; margin-top:6mm }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:3mm 6mm }
.grid div { background:rgba(255,255,255,.12); border-radius:12px; padding:3.5mm 4mm; font-size:11.5pt }
"""


def cover_html(s, notes_n, mcq_n, sample_n, imgs):
    store = f' · {html.escape(STORE)}' if STORE else ''
    mcq_stat = f'<div class="stat"><b>{mcq_n}</b><span>MCQ Bank pages</span></div>' if mcq_n else ''
    th = ''.join(f'<img src="file://{p}">' for p in imgs[:4])
    topics = ''.join(f'<li>✅ {html.escape(t)}</li>' for t in s['topics'])
    return f"""<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="pg">
<span class="badge">GSSSB · STAFF NURSE EXAM</span><span class="tag">FREE DEMO</span>
<h1>{html.escape(s['title'])}</h1>
<div class="sub">Complete Colourful Notes + MCQ Bank · Hinglish explanation · Exam-focused</div>
<div class="stats">
 <div class="stat"><b>{notes_n}</b><span>Notes pages</span></div>{mcq_stat}
 <div class="stat"><b>{s['mcqs']}</b><span>MCQs with answers</span></div>
 <div class="stat"><b>{s['chapters']}</b><span>Chapters</span></div>
</div>
<div class="thumbs">{th}</div>
<div class="box"><h2>Full version me kya milega?</h2><ul style="padding-left:4mm;list-style:none;margin:0">{topics}
<li>✅ 3D-style coloured diagrams, mnemonics, PYQ-style exam points, 150 one-liners</li></ul></div>
<div class="cta">Is demo me sirf {sample_n} sample pages hain 👀</div>
<div class="foot">Ye FREE DEMO hai – poori PDF website par available hai{store}</div>
</div></body></html>"""


def buy_html(s, total, sample_n):
    store = html.escape(STORE) if STORE else 'website'
    return f"""<html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="pg">
<span class="badge">DEMO KHATAM 🔒</span>
<div class="lock">🔒</div>
<h1 style="text-align:center;margin-top:2mm">Aapne sirf {sample_n} pages dekhe…<br><span style="color:#ffca28">baaki {total - sample_n}+ pages lock hain!</span></h1>
<div class="grid" style="margin-top:8mm">
 <div>📘 <b>{s['chapters']} chapters</b> – poora syllabus, kuch bhi chhuta nahi</div>
 <div>📝 <b>{s['mcqs']} MCQs</b> – har answer ke saath explanation</div>
 <div>🧪 <b>100-Q mock test</b> – real GSSSB pattern, −0.25 marking</div>
 <div>🎨 <b>3D-style diagrams</b> – ek nazar me yaad</div>
 <div>⚡ <b>150 one-liners</b> – exam se pehle last-minute revision</div>
 <div>📱 <b>Mobile-friendly PDF</b> – kahin bhi padho, print bhi kar sako</div>
</div>
<div class="box big"><b>Kyun khareedein?</b><br>
✔ Hinglish me simple explanation + English exam terms<br>
✔ Latest guidelines (NHM, NACO, IYCF, BMW 2016 …)<br>
✔ PYQ-style "Exam Points" har chapter ke end me</div>
<div class="cta">👉 {store} par "Buy Now" dabaiye – instant PDF download</div>
<div class="foot">All subjects available: MSN · FON · OBG · Child Health · Community Health · Mental Health · Pharmacology · A&amp;P · Microbiology · Nutrition · Gujarati Vyakaran</div>
</div></body></html>"""


def html_pdf(h, tmp, name):
    hp = os.path.join(tmp, name + '.html'); pp = os.path.join(tmp, name + '.pdf')
    open(hp, 'w', encoding='utf-8').write(h)
    subprocess.run(['node', os.path.join(HERE, 'html2pdf.js'), hp, pp], check=True)
    return PdfReader(pp).pages[0]


def main():
    os.makedirs(OUT_PDF, exist_ok=True); os.makedirs(OUT_IMG, exist_ok=True)
    tmp = tempfile.mkdtemp()
    manifest = []
    for s in SUBJECTS:
        npath = os.path.join(ROOT, s['folder'], 'pdf', s['notes'])
        mpath = os.path.join(ROOT, s['folder'], 'pdf', s['mcq']) if s['mcq'] else None
        n_pages, notes_n = pick_notes(npath, tmp)
        if mpath:
            m_pages, mcq_n = pick_mcq(mpath)
        else:
            m_pages, mcq_n = [], 0
            extra = pick_mcq_from_notes(npath, n_pages)
            n_pages = sorted(set(n_pages + extra))
        sample_n = len(n_pages) + len(m_pages)
        imgs = thumbs(npath, [p for p in n_pages if p > 2][:3], tmp, s['code'] + 'n')
        if mpath:
            imgs += thumbs(mpath, m_pages[1:2], tmp, s['code'] + 'm')
        else:
            imgs += thumbs(npath, n_pages[-1:], tmp, s['code'] + 'x')
        w = PdfWriter()
        w.add_page(html_pdf(cover_html(s, notes_n, mcq_n, sample_n, imgs), tmp, s['code'] + '_cover'))
        for src, pages in ((npath, n_pages), (mpath, m_pages)):
            if not src:
                continue
            r = PdfReader(src)
            for p in pages:
                pg = r.pages[p - 1]
                wm = watermark(float(pg.mediabox.width), float(pg.mediabox.height))
                pg.merge_page(wm)
                w.add_page(pg)
        w.add_page(html_pdf(buy_html(s, notes_n + mcq_n, sample_n), tmp, s['code'] + '_buy'))
        w.add_metadata({'/Title': f"{s['title']} – FREE DEMO (GSSSB Staff Nurse)", '/Subject': 'Free sample pages – full PDF on website'})
        w.compress_identical_objects(remove_identicals=True, remove_orphans=True)
        out = os.path.join(OUT_PDF, f"{s['code']}_DEMO_GSSSB.pdf")
        with open(out, 'wb') as f:
            w.write(f)
        # product image = first page of the demo
        img = os.path.join(OUT_IMG, f"{s['code']}_demo_cover")
        subprocess.run(['pdftoppm', '-r', '110', '-f', '1', '-l', '1', '-png', '-singlefile', out, img], check=True)
        manifest.append(dict(code=s['code'], title=s['title'], demo_pdf=f"pdf/{s['code']}_DEMO_GSSSB.pdf",
                             cover_image=f"cover_images/{s['code']}_demo_cover.png", demo_pages=len(w.pages),
                             sample_pages=sample_n, full_notes_pages=notes_n, full_mcq_pages=mcq_n, chapters=s['chapters'],
                             mcqs=s['mcqs'], highlights=s['topics'],
                             notes_pages_used=n_pages, mcq_pages_used=m_pages))
        print(f"{s['code']:7s} demo pages={len(w.pages):2d}  notes={n_pages}  mcq={m_pages}  ({os.path.getsize(out)//1024} KB)")
    json.dump(manifest, open(os.path.join(DEMO, 'demo_manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    zp = os.path.join(DEMO, 'GSSSB_Nursing_DEMO_Pack.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(glob.glob(os.path.join(OUT_PDF, '*.pdf')) + glob.glob(os.path.join(OUT_IMG, '*.png'))):
            z.write(f, os.path.relpath(f, DEMO))
        for f in ('demo_manifest.json', 'README.md', 'WEBSITE_PUBLISH_PROMPT.md'):
            if os.path.exists(os.path.join(DEMO, f)):
                z.write(os.path.join(DEMO, f), f)
    print('zip:', zp, os.path.getsize(zp) // 1024, 'KB')
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
