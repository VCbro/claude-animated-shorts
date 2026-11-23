#!/usr/bin/env python3
"""Contact sheet of PNG stills: python3 tools/sheet.py out.jpg a.png b.png ..."""
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
w, h = 360, 640
cols = min(4, len(files)); rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((w, h))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    d.text(((i % cols) * w + 6, (i // cols) * h + 4), f.split("/")[-1], fill="yellow")
sheet.save(out, quality=88)
