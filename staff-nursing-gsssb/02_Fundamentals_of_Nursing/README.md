# Fundamentals of Nursing – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/FON_Complete_Notes_GSSSB.pdf`](pdf/FON_Complete_Notes_GSSSB.pdf) | 123 | 20 chapters, 3D-style coloured diagrams, Exam Points (PYQ style), mnemonics, master tables, 150 one-liners |
| [`pdf/FON_MCQ_Bank_GSSSB.pdf`](pdf/FON_MCQ_Bank_GSSSB.pdf) | 68 | **699 MCQs**: 19 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Nursing Profession – History, Ethics, Law & Theories
2. Health, Illness, Hospital & Patient Safety
3. Communication, Health Education & Documentation
4. Nursing Process, Critical Thinking & Priority Setting
5. Vital Signs
6. Health Assessment & Physical Examination
7. Infection Control, Asepsis, Sterilization & BMW
8. Personal Hygiene, Bed Making & Comfort Devices
9. Rest, Sleep & Pain Management
10. Body Mechanics, Mobility, Positioning & Pressure Ulcers
11. Nutrition & Feeding
12. Urinary Elimination & Catheterization
13. Bowel Elimination – Enema, Suppository & Stool Care
14. Oxygenation & Respiratory Care
15. Fluids, Electrolytes & IV Therapy
16. Medication Administration & Drug Calculations
17. Hot & Cold Applications, Wound Care, Bandaging & Specimens
18. First Aid & Emergency Care
19. Care of Unconscious, Peri-operative, Terminally Ill & Dead Patient
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
