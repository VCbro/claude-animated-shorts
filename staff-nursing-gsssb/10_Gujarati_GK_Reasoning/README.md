# ગુજરાતી વ્યાકરણ (Gujarati Vyakaran) – Full Book Notes – GSSSB

| PDF | Pages | Content |
|---|---|---|
| [`pdf/GUJ_Complete_Notes_GSSSB.pdf`](pdf/GUJ_Complete_Notes_GSSSB.pdf) | 59 | 13 પ્રકરણ, 3 રંગીન ડાયાગ્રામ (વર્ણમાળા-ઉચ્ચારણ સ્થાન, સંધિ-સમાસ, અલંકાર-છંદ), દરેક પ્રકરણમાં ઉદાહરણ કોષ્ટકો, યાદ રાખવાની યુક્તિ, PYQ style points, 150 વન-લાઇનર |
| [`pdf/GUJ_MCQ_Bank_GSSSB.pdf`](pdf/GUJ_MCQ_Bank_GSSSB.pdf) | 45 | **460 MCQs**: 12 પ્રકરણવાર વિભાગ (Direct, Application, નથી/ NOT, જોડો, વિધાન-કારણ) + **100 પ્રશ્નોનો GSSSB-pattern mock test**, answer key with explanation |

## પ્રકરણ (Notes)
1. ભાષા, લિપિ અને વર્ણવિચાર (સ્વર, વ્યંજન, ઉચ્ચારણ સ્થાન, ઘોષ-અઘોષ, શ્રુતિ)
2. સંધિ (સ્વર – દીર્ઘ, ગુણ, વૃદ્ધિ, યણ્, અયાદિ; વ્યંજન; વિસર્ગ)
3. સમાસ (8 પ્રકાર, ઓળખ, ગૂંચવાતા સમાસ)
4. પદ પરિચય – નામ, સર્વનામ, વિશેષણ (લિંગ, વચન)
5. ક્રિયાપદ, કાળ, કૃદંત અને અવ્યય (ક્રિયાવિશેષણ, નામયોગી, ઉભયાન્વયી, કેવળપ્રયોગી, નિપાત)
6. વિભક્તિ અને કારક
7. પ્રયોગ (કર્તરિ, કર્મણિ, ભાવે, પ્રેરક), વાક્યરચના અને વિરામચિહ્નો
8. ઉપસર્ગ, પ્રત્યય અને શબ્દભંડોળ (તત્સમ-તદ્ભવ-દેશ્ય-વિદેશી)
9. અલંકાર (શબ્દાલંકાર, અર્થાલંકાર)
10. છંદ (લઘુ-ગુરુ, ગણ, અક્ષરમેળ, માત્રામેળ, ગઝલ, સોનેટ, હાઇકુ)
11. રૂઢિપ્રયોગ અને કહેવતો
12. સમાનાર્થી, વિરોધી, શબ્દસમૂહ માટે એક શબ્દ અને જોડણી
13. ઝડપી પુનરાવર્તન – માસ્ટર ઓળખ કોષ્ટક અને 150 વન-લાઇનર

## Folders
- `images/svg/` – editable diagrams · `images/png/` – same images as PNG (phone/ WhatsApp)
- `source/chapters/` – notes (Markdown) · `source/mcq/` – MCQ bank (Markdown)
- `source/fonts/` – Noto Sans Gujarati (SIL Open Font License) – Gujarati text rendering

## Rebuild
```bash
cd source
pip install markdown        # one time
python3 build.py            # both PDFs   (python3 build.py notes | mcq)
python3 shuffle_mcq.py      # only after adding new MCQs – spreads answers over a/b/c/d
node svg2png.js             # SVG -> PNG (needs Noto Sans Gujarati installed as a system font)
```

> Note: GSSSB exams me Gujarati Vyakaran ka weightage advertisement ke hisaab se badalta hai – latest official syllabus zaroor check karein.
