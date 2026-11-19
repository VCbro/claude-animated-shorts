# FREE DEMO Pack – GSSSB Staff Nurse Notes

Har subject ka ek **FREE DEMO PDF** website par "hook" ki tarah dene ke liye.

Har demo PDF me ye hai:

1. **Demo cover** – subject ka naam, full version ke stats (pages, MCQs, chapters), 4 sample page thumbnails aur "Full version me kya milega".
2. **~10 sample pages**:
   - **Notes:** cover, index aur diagram wale sabse rangeen hook pages (alag-alag chapters se), plus ek "PYQ / Exam Points" page.
   - **MCQ Bank:** cover, pehla question page, 100-Q mock test ka pehla page aur ek answer-key page.
3. Har sample page par **"FREE DEMO" watermark** aur **"FREE SAMPLE PAGE"** ribbon.
4. **Last page – "Demo khatam 🔒"**: baaki pages lock hain, full version ke fayde aur "Buy Now" ka call-to-action.

| Folder/ file | Kya hai |
|---|---|
| `pdf/<CODE>_DEMO_GSSSB.pdf` | Demo PDF (11 subjects) |
| `cover_images/<CODE>_demo_cover.png` | Website product card ke liye image |
| `demo_manifest.json` | Website automation ke liye data (title, pages, highlights, file paths) |
| `GSSSB_Nursing_DEMO_Pack.zip` | Upar ki sab cheezein ek zip me |
| `WEBSITE_PUBLISH_PROMPT.md` | Website wali Claude chat me paste karne ka ready prompt |
| `tools/make_demos.py` | Demo dobara banane ki script |

**Dobara banana** (jaise full PDFs update hone ke baad, ya store ka naam add karna ho):

```bash
cd tools
STORE_NAME="Aapki Site" python3 make_demos.py
```

Script khud hook pages chunti hai: notes me sabse rangeen (diagram) pages, jo alag-alag chapters se hon.
