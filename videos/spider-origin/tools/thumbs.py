#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) from clean film frames (no captions/labels) + bold text."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8833
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
SHOTS = {"bg_bite": 80.8, "bg_wall": 101.0, "bg_same": 180.5, "bg_city": 12.0}
FONT = """@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2);unicode-range:U+0000-00FF,U+2190-21FF,U+2248}
*{margin:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;font-family:B;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.sh{position:absolute;inset:0}
.txt{position:absolute;font-weight:800;color:#fff;line-height:1.02;-webkit-text-stroke:3px #0a0a0a;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}
.y{color:#ffd23f}.r{color:#ff4b3e}.c{color:#6fe3ff}
.tag{position:absolute;padding:8px 22px 2px;border-radius:14px;font-weight:800;font-size:40px;color:#111;background:#ffd23f;box-shadow:0 6px 20px rgba(0,0,0,.5)}
.x{position:absolute;font-weight:800;color:#ff4b3e;-webkit-text-stroke:4px #000;paint-order:stroke fill}"""
THUMBS = {
 "thumb1_bite": """<div class=bg style="background-image:url(/out/thumbsrc/bg_bite.png);background-position:20% 62%;background-size:165%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.3) 50%,rgba(0,0,0,0) 75%)"></div>
  <div class=txt style="left:44px;top:60px;font-size:120px">ONE BITE.</div>
  <div class=txt style="left:44px;top:200px;font-size:84px"><span class=r>CHANGED</span></div>
  <div class=txt style="left:44px;top:300px;font-size:84px">EVERYTHING</div>
  <div class=tag style="left:44px;bottom:44px">NEW YORK · 1962</div>""",
 "thumb2_wall": """<div class=bg style="background-image:url(/out/thumbsrc/bg_wall.png);background-position:74% 46%;background-size:150%"></div>
  <div class=sh style="background:linear-gradient(180deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.2) 45%,rgba(0,0,0,0) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:80px;font-size:96px">HE CLIMBED <span class=y>WALLS</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:200px;font-size:52px">The true-style origin of Spider-Man</div>""",
 "thumb3_same": """<div class=bg style="background-image:url(/out/thumbsrc/bg_same.png);background-position:50% 45%;background-size:115%"></div>
  <div class=sh style="background:radial-gradient(circle at 50% 45%,rgba(0,0,0,0) 0,rgba(0,0,0,.35) 50%,rgba(0,0,0,.85) 95%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:40px;font-size:96px">HE LET HIM <span class=r>GO.</span></div>
  <div class=tag style="right:40px;bottom:40px">THE ORIGIN OF SPIDER-MAN</div>""",
}
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None)
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        pg.goto(f"http://127.0.0.1:{PORT}/web/doc.html"); pg.wait_for_function("window.__ready === true", timeout=60000)
        pg.add_style_tag(content="#ui,#lines,#cap{display:none!important}")
        for k, t in SHOTS.items():
            pg.evaluate(f"window.__renderAt({t})"); pg.screenshot(path=os.path.join(ROOT, f"out/thumbsrc/{k}.png"))
        tp = b.new_page(viewport={"width": 1280, "height": 720})
        for name, body in THUMBS.items():
            tp.goto(f"http://127.0.0.1:{PORT}/web/doc.html")  # same origin for fonts/images
            tp.set_content(f"<html><head><base href='http://127.0.0.1:{PORT}/'><style>{FONT}</style></head><body>{body}</body></html>")
            tp.evaluate("document.fonts.ready.then(()=>1)"); tp.wait_for_timeout(500)
            tp.screenshot(path=os.path.join(ROOT, f"deliver/thumbs/{name}.png"))
        b.close()
finally:
    srv.terminate()
print("ok")
