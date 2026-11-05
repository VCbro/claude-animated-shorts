# Pharmacology for Nurses – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/PHARMA_Complete_Notes_GSSSB.pdf`](pdf/PHARMA_Complete_Notes_GSSSB.pdf) | 64 | 10 chapters, 5 3D-style diagrams, ADME & pharmacokinetics, dose/ drip-rate calculations, all drug groups with side effects & nursing care, antidote master table, special populations, high-alert drugs, 150 one-liners |
| [`pdf/PHARMA_MCQ_Bank_GSSSB.pdf`](pdf/PHARMA_MCQ_Bank_GSSSB.pdf) | 40 | **400 MCQs**: 10 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. General Pharmacology (definitions, ADME, half-life, pharmacodynamics, ADRs, drug laws, pharmacovigilance)
2. Drug Administration, Calculations & Nurse's Responsibilities (rights, routes, sites, abbreviations, drip rate, paediatric dose)
3. Autonomic Nervous System Drugs (cholinergic, OP poisoning, atropine, adrenaline, dopamine, α/β blockers)
4. Cardiovascular, Renal & Blood Drugs (antihypertensives, digoxin, antiarrhythmics, diuretics, anticoagulants, IV fluids, KCl, transfusion)
5. Respiratory & GI Drugs (asthma/ COPD, antihistamines, PPIs, antiemetics, laxatives)
6. CNS Drugs – Analgesics, Antiepileptics, Anaesthetics (opioids, NSAIDs, paracetamol, antiparkinson, NM blockers, local anaesthetics)
7. Antimicrobial Drugs (antibiotics, anti-TB, leprosy, antifungal, antiviral/ ART, antimalarial, anthelmintic)
8. Endocrine Drugs & Hormones (insulin, hypoglycaemia, OHAs, thyroid, steroids, contraceptives, oxytocics)
9. Anticancer Drugs, Immunopharmacology, Antidotes & Special Populations (chemo safety, antidote table, teratogens, elderly, interactions)
10. Quick Revision – Drug suffixes, DOC table, one drug–one clue, narrow TI, urine colours, 150 One-Liners

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
