#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) from clean film frames (no captions/labels) + bold Hindi text."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8831
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
SHOTS = {"bg_land": 234.5, "bg_ski": 184.0, "bg_city": 133.0, "bg_hero": 26.5}
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
 "hi_thumb1_3sec": """<div class=bg style="background-image:url(/out/thumbsrc/bg_land.png);background-position:22% 48%;background-size:160%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.8) 0,rgba(0,0,0,.25) 50%,rgba(0,0,0,0) 75%)"></div>
  <div class=txt style="left:44px;top:40px;font-size:150px"><span class=y>3 सेकंड</span></div>
  <div class=txt style="left:44px;top:205px;font-size:96px">में 250 से <span class=r>0!</span></div>
  <div class=tag style="left:44px;bottom:44px">INS विक्रांत 🇮🇳</div>""",
 "hi_thumb2_ski": """<div class=bg style="background-image:url(/out/thumbsrc/bg_ski.png);background-position:75% 40%;background-size:140%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.15) 55%,rgba(0,0,0,0) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:400px;font-size:112px">इतने छोटे रनवे से <span class=y>उड़ान?</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:56px">INS विक्रांत का स्की-जंप राज़</div>""",
 "hi_thumb3_city": """<div class=bg style="background-image:url(/out/thumbsrc/bg_city.png);background-position:50% 50%;background-size:125%"></div>
  <div class=sh style="background:radial-gradient(circle at 50% 55%,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 50%,rgba(0,0,0,.85) 90%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:40px;font-size:120px">समंदर पर <span class=y>तैरता शहर!</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:64px"><span class=c>45,000 टन</span> · 2,000+ कमरे</div>""",
 "en_thumb1_3sec": """<div class=bg style="background-image:url(/out/thumbsrc/bg_land.png);background-position:22% 48%;background-size:160%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.8) 0,rgba(0,0,0,.25) 50%,rgba(0,0,0,0) 75%)"></div>
  <div class=txt style="left:44px;top:50px;font-size:120px">250 → <span class=r>0</span></div>
  <div class=txt style="left:44px;top:200px;font-size:120px"><span class=y>IN 3 SEC!</span></div>
  <div class=tag style="left:44px;bottom:44px">INS VIKRANT 🇮🇳</div>""",
 "en_thumb2_ski": """<div class=bg style="background-image:url(/out/thumbsrc/bg_ski.png);background-position:75% 40%;background-size:140%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.15) 55%,rgba(0,0,0,0) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:410px;font-size:104px">TAKE OFF FROM <span class=y>THIS?</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:52px">The ski-jump secret of INS Vikrant</div>""",
 "en_thumb3_city": """<div class=bg style="background-image:url(/out/thumbsrc/bg_city.png);background-position:50% 50%;background-size:125%"></div>
  <div class=sh style="background:radial-gradient(circle at 50% 55%,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 50%,rgba(0,0,0,.85) 90%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:50px;font-size:104px">A <span class=y>FLOATING CITY</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:60px"><span class=c>45,000 tonnes</span> · Made in India</div>""",
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
