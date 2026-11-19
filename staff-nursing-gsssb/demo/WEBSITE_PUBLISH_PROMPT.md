# Website par DEMO publish karne ke liye – Claude chat me paste karne wala prompt

Neeche wala poora text copy karke **apni website wali Claude chat** me paste karein.
Agar wo chat GitHub repo nahi khol sakti, to `GSSSB_Nursing_DEMO_Pack.zip` usi chat me upload karke
yahi prompt bhejein. Prompt me "zip me" wala option bhi diya hai.

---

```
Meri website par har nursing subject ke product page par ek "FREE DEMO" download add karna hai.

Demo files yahan hain (GitHub):
- Repo: VCbro/claude-animated-shorts
- Branch: claude/msn-subject-notes-pdf-tla9mg
- Folder: staff-nursing-gsssb/demo/
  - pdf/<CODE>_DEMO_GSSSB.pdf          → har subject ka free demo PDF (~12-13 pages, watermark ke saath)
  - cover_images/<CODE>_demo_cover.png → product/demo card ki image
  - demo_manifest.json                  → sab subjects ki details (title, pages, MCQs, highlights, file paths)
(Agar repo access nahi hai to maine jo GSSSB_Nursing_DEMO_Pack.zip upload ki hai, usme yahi sab hai.)

Subject codes: MSN, FON, CHN, OBG, COMH, MHN, PHARMA, AP, MICRO, NUTRI, GUJ

Kaam:
1. demo_manifest.json padho. Har entry ko meri site ke matching paid product se jodo
   (title se match karo; agar koi match na mile to mujhe list dikha kar pucho).
2. Demo PDFs aur cover images ko site ke public static/assets folder (ya jo storage site use karti hai) me copy karo.
3. Har product page par:
   - "📄 Free Demo Dekhein / Download Karein" button – demo PDF ka link (naya tab, download allowed).
   - Demo cover image + 3-4 highlights (manifest ke "highlights") + "Full PDF: X notes pages + Y MCQs".
   - Demo button ke paas hi "Buy Full Version" button rakho (existing buy link).
4. Ek naya page "/free-demos" banao jisme saare 11 subjects ke demo cards grid me hon
   (cover image, title, "Free Demo" button, "Buy Now" button). Homepage/nav me iska link do.
5. SEO: har demo card par alt text, page title "Free GSSSB Staff Nurse Notes Demo – <Subject>".
6. Paid full PDFs ka link kahin bhi public na ho – sirf demo PDFs public rahen.
7. Build/test karke deploy/publish karo, aur mujhe live URLs ki list do.
```

---

## Files ki list
| Code | Subject |
|---|---|
| MSN | Medical-Surgical Nursing |
| FON | Fundamentals of Nursing |
| CHN | Child Health Nursing |
| OBG | Midwifery & OBG |
| COMH | Community Health Nursing |
| MHN | Mental Health Nursing |
| PHARMA | Pharmacology |
| AP | Anatomy & Physiology |
| MICRO | Microbiology |
| NUTRI | Nutrition |
| GUJ | ગુજરાતી વ્યાકરણ |

Store ka naam demo cover/last page par dikhana ho to dobara banayein:
`cd staff-nursing-gsssb/demo/tools && STORE_NAME="Aapki Site ka Naam" python3 make_demos.py`
