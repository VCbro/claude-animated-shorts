#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) from clean film frames (no captions/labels) + bold Hindi text."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8798
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
SHOTS = {"bg_lander": 2.5, "bg_hover": 123.0, "bg_descent": 96.0}
FONT = """@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2);unicode-range:U+0000-00FF,U+2248}
*{margin:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;font-family:B;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.sh{position:absolute;inset:0}
.txt{position:absolute;font-weight:800;color:#fff;line-height:1.02;-webkit-text-stroke:3px #0a0a0a;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}
.y{color:#ffd23f}.r{color:#ff4b3e}.c{color:#6fe3ff}
.tag{position:absolute;padding:8px 22px 2px;border-radius:14px;font-weight:800;font-size:40px;color:#111;background:#ffd23f;box-shadow:0 6px 20px rgba(0,0,0,.5)}
.x{position:absolute;font-weight:800;color:#ff4b3e;-webkit-text-stroke:4px #000;paint-order:stroke fill}"""
TRI = '<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:14px;border-radius:7px;background:linear-gradient(90deg,#ff9933 0 33.3%,#fff 33.3% 66.6%,#138808 66.6%)"></div>'
THUMBS = {
 "thumb1_pehla": """<div class=bg style="background-image:url(/out/thumbsrc/bg_lander.png);background-position:74% 78%;background-size:185%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.85) 0,rgba(0,0,0,.5) 45%,rgba(0,0,0,0) 70%)"></div>
  <div class=txt style="left:50px;top:70px;font-size:150px">भारत</div>
  <div class=txt style="left:50px;top:230px;font-size:170px"><span class=y>पहला!</span></div>
  """ + TRI.format(x=56, y=440, w=420) + """
  <div class=txt style="left:52px;top:480px;font-size:66px">चाँद के <span class=c>साउथ पोल</span> पर</div>""",
 "thumb2_parachute": """<div class=bg style="background-image:url(/out/thumbsrc/bg_hover.png);background-position:0% 45%;background-size:130%"></div>
  <div class=sh style="background:radial-gradient(circle at 62% 40%,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 40%,rgba(0,0,0,.88) 85%)"></div>
  <div class=txt style="left:44px;top:60px;font-size:120px">बिना</div>
  <div class=txt style="left:44px;top:190px;font-size:130px"><span class=r>पैराशूट?!</span></div>
  <div class=txt style="left:48px;top:420px;font-size:74px"><span class=c>6000 km/h</span> → <span class=y>0</span></div>
  <div class=tag style="right:40px;bottom:40px">चंद्रयान-3</div>""",
 "thumb3_15min": """<div class=bg style="background-image:url(/out/thumbsrc/bg_descent.png);background-position:40% 40%;background-size:125%"></div>
  <div class=sh style="background:linear-gradient(0deg,rgba(0,0,0,.9) 0,rgba(0,0,0,.45) 55%,rgba(0,0,0,.25) 100%)"></div>
  <div class=txt style="left:0;right:0;text-align:center;top:250px;font-size:190px"><span class=r>15:00</span></div>
  <div class=txt style="left:0;right:0;text-align:center;top:490px;font-size:86px">आख़िरी <span class=y>15 मिनट</span> का डर</div>
  <div class=tag style="left:40px;top:40px;background:#ff4b3e;color:#fff">चंद्रयान-3 लैंडिंग</div>""",
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
