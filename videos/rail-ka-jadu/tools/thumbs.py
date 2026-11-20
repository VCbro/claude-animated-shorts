#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) from clean film frames (no captions/labels) + bold Hindi text."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8796
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
SHOTS = {"bg_wheel": 100.8, "bg_spark": 26.6, "bg_brake": 208.6, "bg_run": 5.0}
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
 "thumb1_steering": """<div class=bg style="background-image:url(/out/thumbsrc/bg_run.png);background-position:80% 62%;background-size:175%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.88) 0,rgba(0,0,0,.6) 42%,rgba(0,0,0,0) 70%)"></div>
  <svg style="position:absolute;right:60px;top:40px;width:250px;height:250px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.7))" viewBox="-130 -130 260 260">
    <circle r="100" fill="none" stroke="#f2f2f2" stroke-width="22"/><path d="M-100 0H100M0 0V100" stroke="#f2f2f2" stroke-width="20"/><circle r="26" fill="#f2f2f2"/>
    <path d="M-115 -115L115 115" stroke="#000" stroke-width="34" stroke-linecap="round"/><path d="M-115 -115L115 115" stroke="#ff4b3e" stroke-width="22" stroke-linecap="round"/></svg>
  <div class=txt style="left:48px;top:60px;font-size:120px">स्टीयरिंग<br><span class=r>नहीं!</span></div>
  <div class=txt style="left:48px;top:350px;font-size:98px">फिर ट्रेन<br><span class=y>मुड़ती कैसे?</span></div>""",
 "thumb2_volt": """<div class=bg style="background-image:url(/out/thumbsrc/bg_spark.png);background-position:70% 40%;background-size:125%"></div>
  <div class=sh style="background:radial-gradient(circle at 70% 40%,rgba(0,0,0,0) 0,rgba(0,0,0,.35) 40%,rgba(0,0,0,.85) 85%)"></div>
  <div class=txt style="left:44px;top:60px;font-size:150px"><span class=c>25,000</span></div>
  <div class=txt style="left:52px;top:230px;font-size:104px">वोल्ट ⚡</div>
  <div class=txt style="left:48px;top:430px;font-size:84px">ट्रेन के <span class=y>ऊपर!</span></div>
  <div class=tag style="right:40px;bottom:40px">भारतीय रेल का जादू</div>""",
 "thumb3_brake": """<div class=bg style="background-image:url(/out/thumbsrc/bg_brake.png);background-position:75% 52%;background-size:118%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.9) 0,rgba(0,0,0,.4) 55%,rgba(0,0,0,.2) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:390px;font-size:128px">रुकने में <span class=r>1 KM?!</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:560px;font-size:70px">5000 टन की <span class=y>ट्रेन का ब्रेक</span></div>
  <div class=tag style="left:40px;top:40px;background:#ff4b3e;color:#fff">⚠ जानलेवा</div>""",
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
