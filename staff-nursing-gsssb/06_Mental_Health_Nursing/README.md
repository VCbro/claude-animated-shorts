# Mental Health (Psychiatric) Nursing – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/MHN_Complete_Notes_GSSSB.pdf`](pdf/MHN_Complete_Notes_GSSSB.pdf) | 60 | 12 chapters, 4 3D-style diagrams, psychiatric terms, MSE & therapeutic communication, psychopharmacology, ECT, all major disorders, emergencies, MHCA 2017, master tables, 150 one-liners |
| [`pdf/MHN_MCQ_Bank_GSSSB.pdf`](pdf/MHN_MCQ_Bank_GSSSB.pdf) | 43 | **430 MCQs**: 11 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction, History & Concepts (pioneers, classification, psychiatric signs & symptoms, defence mechanisms)
2. Psychiatric Assessment, Therapeutic Communication & Nurse–Patient Relationship (MSE, Peplau)
3. Psychopharmacology (antipsychotics & EPS/ NMS, antidepressants, lithium, anxiolytics)
4. ECT, Psychotherapies & Therapeutic Modalities (CBT, behaviour therapy, milieu, restraint)
5. Schizophrenia & Other Psychotic Disorders
6. Mood Disorders & Suicide
7. Anxiety, OCD, Stress-Related, Dissociative & Somatoform Disorders
8. Substance Use Disorders (alcohol withdrawal, DT, Wernicke-Korsakoff, opioids)
9. Personality, Eating, Sleep & Sexual Disorders
10. Neurocognitive (Delirium, Dementia) & Child-Adolescent Psychiatry
11. Psychiatric Emergencies, Community Mental Health & Mental Healthcare Act 2017
12. Quick Revision – Master Tables & 150 One-Liners

## Folders
- `images/svg/` – editable diagrams · `images/png/` – same images as PNG (phone/ WhatsApp)
- `source/chapters/` – notes (Markdown) · `source/mcq/` – MCQ bank (Markdown)

## Rebuild
```bash
cd source
pip install markdown        # one time
python3 build.py            # both PDFs   (python3 build.py notes | mcq)
python3 shuffle_mcq.py      # only after adding new MCQs – spreads answers over a/b/c/d
node svg2png.js             # SVG -> PNG
```

> Exam pattern (search, 2026 cycle): Paper-1 Nursing – 100 MCQs, 100 marks; −0.25 negative marking. Latest official GSSSB advertisement zaroor check karein.
