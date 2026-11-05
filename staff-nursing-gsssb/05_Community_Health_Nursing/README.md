# Community Health Nursing – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/COMH_Complete_Notes_GSSSB.pdf`](pdf/COMH_Complete_Notes_GSSSB.pdf) | 78 | 17 chapters, 10 3D-style coloured diagrams, health care delivery norms, committees, epidemiology & biostatistics, all national health programmes, environment & BMW, occupational health, health education, Gujarat schemes, master tables, 150 one-liners |
| [`pdf/COMH_MCQ_Bank_GSSSB.pdf`](pdf/COMH_MCQ_Bank_GSSSB.pdf) | 58 | **580 MCQs**: 16 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Concepts of Health, Disease & Community Health Nursing (levels of prevention)
2. Health Care Delivery System (committees, Alma-Ata, population norms, Ayushman Bharat, NHM, NHP)
3. Epidemiology (rates, incidence/ prevalence, study designs, screening, epidemic investigation)
4. Biostatistics, Demography & Vital Statistics (census, SRS, vital rates)
5. Communicable Disease Epidemiology & Control (transmission, isolation, quarantine, disinfection, IDSP)
6. National Programmes – Communicable Diseases (NTEP, NLEP, NCVBDC, NACP, hepatitis, rabies)
7. National Programmes – NCDs & Others (NP-NCD, NPCBVI, NMHP, COTPA, NPHCE, NIDDCP, health days)
8. RMNCH+A, Family Welfare & Population Control
9. Nutrition in Community Health (ICDS, PM POSHAN, POSHAN Abhiyaan, adulteration)
10. Environmental Health & Sanitation (water, chlorination, excreta, BMW Rules 2016, entomology)
11. Occupational Health (pneumoconiosis, lead, ESI Act, Factories Act)
12. Health Education, Communication & IEC/ BCC
13. Home Visit, Family Health Care, Records & Reports (bag technique)
14. Health of Special Groups – School, Urban, Tribal, Elderly, Disabled
15. Disaster Management & Emergency Services
16. Health Planning, Management, International Agencies, Insurance & Gujarat Schemes
17. Quick Revision – Master Tables & 150 One-Liners

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
