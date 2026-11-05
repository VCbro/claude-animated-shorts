# MSN – Medical-Surgical Nursing (GSSSB Staff Nurse)

**PDF:** [`pdf/MSN_Complete_Notes_GSSSB.pdf`](pdf/MSN_Complete_Notes_GSSSB.pdf) – 158 pages, A4, full colour.

## Chapters
1. Introduction to MSN & Nursing Process
2. Fluid, Electrolyte & Acid-Base Balance
3. Shock, Pain, Inflammation & Infection Control
4. Perioperative Nursing
5. Cardiovascular System
6. Respiratory System
7. Gastrointestinal System
8. Liver, Biliary System & Pancreas
9. Renal, Urinary & Male Reproductive
10. Endocrine System
11. Neurological System
12. Musculoskeletal System
13. Integumentary System & Burns
14. Blood & Haematology
15. Immunology, HIV/AIDS & Communicable Diseases
16. Oncology Nursing
17. Eye & ENT
18. Emergency, Critical Care & Disaster Nursing
19. Geriatric Nursing & Quick Revision (master tables, important days, 100 one-liners)
20. Grand Test – 60 mixed MCQs

Har chapter ke end me practice MCQs aur answer key hai.

## Boxes in the PDF
| Box | Meaning |
|---|---|
| ★ Key Points (blue) | Sabse important facts |
| Asha Didi ki Tip (yellow, avatar) | Samjhane wali baat / trick |
| ! Nursing Alert (red) | Galti mat karna – safety points |
| ✎ Exam Point (purple) | Exam me baar-baar aata hai |
| ♫ Mnemonic (green) | Yaad karne ki trick |
| D Definition (gold) | Exact definition |

## Images (`images/`)
`svg/` me editable diagrams aur `png/` me same images (2× resolution):
avatar_nurse, cover_art, heart_anatomy, ecg_conduction, respiratory_system, gi_tract, nephron, endocrine_glands, brain_lobes, fracture_types, rule_of_nines, pressure_ulcer_stages, eye_anatomy, ear_anatomy, iv_fluid_tonicity, patient_positions.

## PDF dobara banana ho to (`source/`)
Notes `source/chapters/*.md` me Markdown me likhe hain. Kuch badalna ho to wahi file edit karo, phir:

```bash
cd source
pip install markdown          # one time
python3 build.py              # -> ../pdf/MSN_Complete_Notes_GSSSB.pdf
node svg2png.js               # (optional) SVG diagrams -> PNG
```
Node + Playwright (Chromium) chahiye. Fonts (Poppins, Noto Sans) `source/fonts/` me saved hain, internet ki zaroorat nahi.

> Note: Ye notes standard nursing textbooks aur national programme guidelines par based hain. Drug doses, programme names aur guidelines time ke saath badalte hain – exam se pehle latest official notification zaroor dekh lena.
