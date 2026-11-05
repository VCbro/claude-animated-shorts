# Midwifery & Obstetrics (OBG) – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/OBG_Complete_Notes_GSSSB.pdf`](pdf/OBG_Complete_Notes_GSSSB.pdf) | 102 | 20 chapters, 14 3D-style coloured diagrams, ANC · Labour · PNC · Newborn, national MCH programmes, obstetric drugs, gynaecology, Exam Points (PYQ style), master tables, 150 one-liners |
| [`pdf/OBG_MCQ_Bank_GSSSB.pdf`](pdf/OBG_MCQ_Bank_GSSSB.pdf) | 67 | **670 MCQs**: 19 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction, Terminology & MCH Programmes (JSY, JSSK, PMSMA, LaQshya, SUMAN, Gujarat schemes)
2. Female Reproductive Anatomy, Pelvis & Fetal Skull
3. Menstrual Cycle, Fertilisation, Implantation & Fetal Development
4. Placenta, Membranes, Amniotic Fluid, Cord & Fetal Circulation
5. Physiological Changes in Pregnancy
6. Diagnosis of Pregnancy & Antenatal Care
7. Obstetric Abdominal Examination & Fetal Wellbeing
8. Normal Labour – Stages, Mechanism & Management (partograph, AMTSL, episiotomy)
9. Normal Puerperium, Postnatal Care & Breastfeeding
10. Care of the Newborn (ENBC, APGAR, NRP, jaundice, KMC)
11. High-Risk Pregnancy & Medical Disorders (anaemia, PIH/eclampsia & MgSO₄, GDM, heart disease, Rh)
12. Bleeding in Pregnancy – Abortion, Ectopic, Mole, APH (MTP Amendment Act 2021)
13. Abnormal Labour – Malpositions, Malpresentations & Dystocia
14. Obstetric Emergencies – PPH, Cord Prolapse, Shoulder Dystocia & more
15. Complications of Puerperium & Newborn Problems
16. Obstetric Operations & Procedures (CS, forceps, vacuum, analgesia)
17. Drugs in Obstetrics
18. Family Planning & Contraception
19. Gynaecological Disorders & Women's Health (PCOS, infertility, fibroid, prolapse, STI kits, cancer screening, menopause)
20. Quick Revision – Master Tables & 150 One-Liners

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
