# Child Health (Paediatric) Nursing – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/CHN_Complete_Notes_GSSSB.pdf`](pdf/CHN_Complete_Notes_GSSSB.pdf) | 102 | 19 chapters, 14 3D-style coloured diagrams, growth & milestones, immunization, IMNCI, newborn care, all systemic disorders, paediatric drugs & dose calculations, emergencies, Exam Points (PYQ style), master tables, 150 one-liners |
| [`pdf/CHN_MCQ_Bank_GSSSB.pdf`](pdf/CHN_MCQ_Bank_GSSSB.pdf) | 64 | **640 MCQs**: 18 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction to Child Health Nursing & National Programmes (RBSK, RKSK, HBNC, HBYC, ICDS, POSHAN, child rights & laws)
2. Growth & Development (anthropometry, formulas, dentition, milestones, Erikson/ Freud/ Piaget, play)
3. Nutrition, IYCF & Malnutrition (SAM, WHO 10 steps, vitamin & mineral deficiencies, Anaemia Mukt Bharat)
4. Immunization (UIP schedule, dose/ route/ site, cold chain, VVM, open vial policy, AEFI)
5. Hospitalised Child, Paediatric Procedures & Drug Calculations
6. High-Risk Newborn & Neonatal Disorders (thermoregulation, KMC, jaundice & phototherapy, sepsis, RDS, SNCU)
7. IMNCI, Diarrhoea & Dehydration (Plan A/B/C, ORS, zinc, worms)
8. Respiratory Disorders
9. Cardiovascular Disorders (CHD, TOF, CHF & digoxin, rheumatic fever, Kawasaki)
10. Gastrointestinal Disorders (cleft lip/ palate, TEF, pyloric stenosis, intussusception, Hirschsprung)
11. Genitourinary & Renal Disorders (nephrotic, AGN, UTI, Wilms, hypospadias, enuresis)
12. Neurological Disorders (hydrocephalus, spina bifida, meningitis, seizures, CP)
13. Haematological & Oncological Disorders (thalassaemia, sickle cell, haemophilia, ALL, chemotherapy care)
14. Endocrine, Metabolic & Genetic Disorders (hypothyroidism, T1DM/ DKA, PKU, Down syndrome)
15. Communicable Diseases (exanthems, VPDs, dengue, malaria, HIV, scabies)
16. Musculoskeletal Disorders, Fractures & Burns
17. Behavioural & Developmental Disorders, Child Abuse, Accidents & Poisoning
18. Paediatric Emergencies & Life Support (ETAT, CPR, shock, emergency drugs)
19. Quick Revision – Master Tables & 150 One-Liners

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
