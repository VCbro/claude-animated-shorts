# Microbiology & Infection Control – GSSSB Staff Nurse

| PDF | Pages | Content |
|---|---|---|
| [`pdf/MICRO_Complete_Notes_GSSSB.pdf`](pdf/MICRO_Complete_Notes_GSSSB.pdf) | 66 | 10 chapters, 4 3D-style diagrams (bacteria & Gram stain, sterilisation methods, chain of infection & BMW colour coding), scientists, bacteria, viruses, fungi, parasites, sterilisation, infection control, vaccines & cold chain, specimen collection, 150 one-liners |
| [`pdf/MICRO_MCQ_Bank_GSSSB.pdf`](pdf/MICRO_MCQ_Bank_GSSSB.pdf) | 36 | **370 MCQs**: 9 topic-wise sections (Direct, Priority/Scenario, Advanced – NOT/EXCEPT, Match, Assertion-Reason) + **100-question GSSSB-pattern mock test**, answer key with explanation |

## Chapters (Notes)
1. Introduction, History & Microscopy (scientists, Koch's postulates, prokaryotes vs eukaryotes, normal flora)
2. Bacterial Morphology, Physiology & Lab Methods (structure, spores, stains, growth curve, culture media, toxins, AMR)
3. Sterilisation & Disinfection (autoclave, hot air oven, chemicals, Spaulding, indicators, CSSD, spills)
4. Infection, HAI & Infection Control (chain of infection, isolation precautions, hand hygiene, PPE, NSI & PEP, BMW Rules 2016)
5. Systematic Bacteriology (Staph, Strep, Neisseria, Clostridium, enteric bacteria, Vibrio, Pseudomonas, TB, leprosy, syphilis, rickettsia)
6. Virology (herpes, hepatitis, polio, measles, rubella, influenza, rabies, dengue, JE, Nipah, COVID-19, HIV)
7. Mycology & Parasitology (fungi, amoeba, Giardia, malaria, kala-azar, helminths, vectors)
8. Immunity, Serology & Vaccines (immunity types, serological tests, UIP schedule, cold chain, VVM, AEFI)
9. Specimen Collection, Transport & Lab Diagnosis (blood culture, urine, sputum, CSF, swabs, vacutainers, biosafety)
10. Quick Revision – Disease-organism, incubation periods, important days, 150 One-Liners

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
