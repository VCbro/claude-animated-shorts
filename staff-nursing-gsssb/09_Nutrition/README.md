# Nutrition & Dietetics – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/NUTRI_Complete_Notes_GSSSB.pdf`](pdf/NUTRI_Complete_Notes_GSSSB.pdf) | 62 | 10 chapters, 4 3D-style diagrams (ICMR-NIN My Plate, vitamins chart, PEM & SAM screening), nutrients & RDA (ICMR-NIN 2020), life-span nutrition, malnutrition, therapeutic diets, food safety & adulteration, national programmes, 150 one-liners |
| [`pdf/NUTRI_MCQ_Bank_GSSSB.pdf`](pdf/NUTRI_MCQ_Bank_GSSSB.pdf) | 36 | **370 MCQs**: 9 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction, Food Groups, Energy & Balanced Diet (kcal values, BMR, RDA, My Plate 2024, cooking)
2. Macronutrients – Carbohydrates, Proteins, Fats, Fibre & Water
3. Vitamins (A, D, E, K, B-complex, C – sources, deficiency, prophylaxis)
4. Minerals & Trace Elements (calcium, iron & Anaemia Mukt Bharat, iodine, zinc, fluoride)
5. Nutrition Through the Life Span (pregnancy, lactation, breastfeeding, complementary feeding, LBW, elderly)
6. Malnutrition & Nutritional Assessment (PEM, SAM/ MAM, NRC, WHO 10 steps, obesity, anthropometry)
7. Therapeutic Nutrition & Diet in Diseases (hospital diets, DM, HTN, renal, liver, GI, burns, tube feeding, TPN)
8. Food Hygiene, Safety, Preservation & Adulteration (food poisoning, pasteurisation, +F, FSSAI, adulteration tests)
9. National Nutrition Programmes & Nutrition Education (ICDS, POSHAN, PM POSHAN, NFSA, NFHS-5)
10. Quick Revision – Richest sources, deficiency diseases, RDA table, 150 One-Liners

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
