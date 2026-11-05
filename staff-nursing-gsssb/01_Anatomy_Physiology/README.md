# Anatomy & Physiology – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/AP_Complete_Notes_GSSSB.pdf`](pdf/AP_Complete_Notes_GSSSB.pdf) | 66 | 13 chapters, 6 3D-style diagrams (heart, respiratory tree, nephron, brain & neuron, digestive system), all body systems with physiology & clinical correlations, normal values master table, largest/ smallest table, 150 one-liners |
| [`pdf/AP_MCQ_Bank_GSSSB.pdf`](pdf/AP_MCQ_Bank_GSSSB.pdf) | 46 | **460 MCQs**: 12 system-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason, Calculations) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction, Cell & Tissues (terminology, planes, organelles, transport, cell division, tissues)
2. Skeletal System & Joints (206 bones, skull & fontanelles, vertebrae, joints, calcium)
3. Muscular System (muscle types, sarcomere, contraction, important muscles, IM sites)
4. Cardiovascular System (heart, valves, conduction, cardiac cycle, ECG, BP, vessels, fetal circulation)
5. Blood, Lymphatic System & Immunity (RBC, WBC, platelets, coagulation, blood groups, antibodies)
6. Respiratory System (airway, lungs, surfactant, lung volumes, gas transport, breathing patterns)
7. Digestive System (mouth to anus, liver, pancreas, enzymes, absorption, metabolism)
8. Urinary System, Body Fluids, Electrolytes & Acid–Base (nephron, GFR, urine, ABG)
9. Nervous System (neuron, brain, CSF, spinal cord, reflexes, cranial nerves, ANS, GCS)
10. Special Senses & Integumentary System (eye, ear, smell, taste, skin, temperature regulation)
11. Endocrine System (pituitary, thyroid, parathyroid, adrenal, pancreas, other glands)
12. Reproductive System (male & female organs, menstrual cycle, lactation, fertilisation, placenta)
13. Quick Revision – Master Tables & 150 One-Liners

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
