# English Mastery Notebook

**Grammar • Vocabulary • Spoken English • Writing • Exam Practice** – a self-study series from absolute beginner to advanced, with simple Hindi support.

- **9 volumes**, 94 chapters + diagnostic test, revision quizzes and reference section – see [`MASTER_TOC.md`](MASTER_TOC.md) for the full contents and the coverage tracker.
- Every chapter follows the same pattern: Learning Goals → Warm-up → Rule → Examples → Common Mistakes → Compare & Understand → Quick Revision → Practice (30–50 items, 10–15 MCQs) → Answer Key with explanations.
- The design matches the earlier notes series: A4, colour-coded boxes with text labels (they still read in grayscale), clickable contents, PDF bookmarks, and writing lines for answers.

| Volume | PDF | DOCX | Status |
|---|---|---|---|
| 1 – Foundation English | [`pdf/EMN_Vol01_Foundation_English.pdf`](pdf/EMN_Vol01_Foundation_English.pdf) | [`docx/EMN_Vol01_Foundation_English.docx`](docx/EMN_Vol01_Foundation_English.docx) | ✅ complete – 89 pages (How to use, Diagnostic Test, Chapters 1–8, Part A Revision Quiz) |

## Rebuild
```bash
cd source
pip install markdown                 # one time; also needs node + playwright, pandoc
python3 build.py 1                   # Volume 1 → pdf/ + docx/
python3 ../tools/qc_check.py         # every practice item has an answer-key entry
node svg2png.js                      # SVG → PNG (used in the DOCX)
```
Fonts (in `source/fonts/`): Poppins, Noto Sans, Noto Sans Devanagari (SIL Open Font License).
