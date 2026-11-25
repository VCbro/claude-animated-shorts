#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) from clean film frames (no captions/labels) + bold Hindi text."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8830
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
SHOTS = {"bg_eiffel": 15.6, "bg_train": 7.0, "bg_meet": 123.6, "bg_wide": 230.0}
FONT = """@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2);unicode-range:U+0000-00FF,U+2248}
*{margin:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;font-family:B;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.sh{position:absolute;inset:0}
.txt{position:absolute;font-weight:800;color:#fff;line-height:1.02;-webkit-text-stroke:3px #0a0a0a;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}
.y{color:#ffd23f}.r{color:#ff4b3e}.c{color:#6fe3ff}
.tag{position:absolute;padding:8px 22px 2px;border-radius:14px;font-weight:800;font-size:40px;color:#111;background:#ffd23f;box-shadow:0 6px 20px rgba(0,0,0,.5)}
.x{position:absolute;font-weight:800;color:#ff4b3e;-webkit-text-stroke:4px #000;paint-order:stroke fill}"""
THUMBS = {
 "thumb1_eiffel": """<div class=bg style="background-image:url(/out/thumbsrc/bg_eiffel.png);background-position:50% 55%;background-size:118%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.25) 0,rgba(0,0,0,0) 40%),linear-gradient(90deg,rgba(0,0,0,.75) 0,rgba(0,0,0,.2) 45%,rgba(0,0,0,0) 70%)"></div>
  <div class=txt style="left:44px;top:50px;font-size:118px">एफ़िल टावर</div>
  <div class=txt style="left:44px;top:185px;font-size:118px"><span class=y>से भी ऊँचा!</span></div>
  <div class=txt style="left:48px;top:470px;font-size:96px"><span class=c>359 m</span></div>
  <div class=tag style="right:40px;bottom:40px">चिनाब ब्रिज 🇮🇳</div>""",
 "thumb2_clouds": """<div class=bg style="background-image:url(/out/thumbsrc/bg_train.png);background-position:30% 45%;background-size:150%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.8) 0,rgba(0,0,0,.2) 50%,rgba(0,0,0,0) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:400px;font-size:120px">बादलों के <span class=y>ऊपर ट्रेन!</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:56px">दुनिया का सबसे ऊँचा रेलवे आर्च पुल</div>""",
 "thumb3_air": """<div class=bg style="background-image:url(/out/thumbsrc/bg_meet.png);background-position:50% 35%;background-size:125%"></div>
  <div class=sh style="background:radial-gradient(circle at 50% 30%,rgba(0,0,0,0) 0,rgba(0,0,0,.45) 45%,rgba(0,0,0,.85) 90%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:380px;font-size:120px">हवा में <span class=y>कैसे बना?</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:540px;font-size:58px">नीचे से कोई क्रेन नहीं पहुँच सकती थी</div>
  <div class=tag style="left:40px;top:40px">चिनाब ब्रिज</div>""",
}
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
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
