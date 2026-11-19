#!/usr/bin/env python3
"""Shaped Devanagari textures for the dispenser (Blender does not shape Hindi text), rendered by
headless Chromium with the Baloo 2 font: the display face labels and the cabinet decal.

    python3 tools/textures.py   ->  assets/disp_face.png, assets/cab_decal.png
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-700-normal.woff2")
FONT_L = os.path.join(ROOT, "node_modules/@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2")
CSS = f"""@font-face {{ font-family: B; src: url(file://{FONT}); }} @font-face {{ font-family: B; src: url(file://{FONT_L}); }}
* {{ margin: 0; box-sizing: border-box; }} body {{ font-family: B, sans-serif; }}"""

FACE = f"""<html><head><style>{CSS}
body {{ width: 1000px; height: 1300px; background: #2b3138; color: #e9eef2; padding: 40px; }}
.row {{ height: 360px; margin-bottom: 40px; border-radius: 22px; background: #0d1411; position: relative;
  box-shadow: inset 0 0 0 8px #1a1f24, inset 0 0 40px rgba(0,0,0,.8); }}
.lab {{ position: absolute; left: 0; right: 0; top: -2px; height: 70px; background: #c9d2da; color: #1d252c; font-size: 52px;
  line-height: 76px; padding-left: 28px; border-radius: 22px 22px 0 0; font-weight: 700; }}
.top {{ height: 70px; font-size: 54px; text-align: center; color: #c9d2da; letter-spacing: .06em; margin-bottom: 20px; }}
</style></head><body>
<div class="top">PETROL · पेट्रोल</div>
<div class="row"><div class="lab">राशि (₹)</div></div>
<div class="row"><div class="lab">लीटर</div></div>
<div class="row" style="height:280px"><div class="lab">दर (₹ / लीटर)</div></div>
</body></html>"""

DECAL = f"""<html><head><style>{CSS}
body {{ width: 800px; height: 300px; background: transparent; display: flex; align-items: center; justify-content: center; }}
div {{ font-size: 120px; color: #1f6f4a; font-weight: 700; }}
</style></head><body><div>पेट्रोल</div></body></html>"""


def shot(html, path, w, h, transparent=False):
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", headless=True,
                               args=["--allow-file-access-from-files"])
        pg = b.new_page(viewport={"width": w, "height": h})
        tmp = path + ".html"; open(tmp, "w").write(html)
        pg.goto("file://" + tmp); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
        pg.screenshot(path=path, omit_background=transparent)
        b.close(); os.remove(tmp)


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
    shot(FACE, os.path.join(ROOT, "assets/disp_face.png"), 1000, 1300)
    shot(DECAL, os.path.join(ROOT, "assets/cab_decal.png"), 800, 300, True)
    print("ok")
