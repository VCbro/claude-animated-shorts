#!/usr/bin/env python3
"""Three YouTube thumbnails (1280x720) for हाजी कासम की वीजळी from the package images."""
import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8800
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
FONT = """@font-face{font-family:T;src:url(/node_modules/@fontsource/tiro-devanagari-hindi/files/tiro-devanagari-hindi-devanagari-400-normal.woff2);unicode-range:U+0900-097F,U+200C-200D}
@font-face{font-family:T;src:url(/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2);unicode-range:U+0000-00FF,U+2013-2022}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F,U+200C-200D}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff2);unicode-range:U+0000-00FF,U+2013-2022}
@font-face{font-family:G;font-weight:600;src:url(/node_modules/@fontsource/noto-serif-gujarati/files/noto-serif-gujarati-gujarati-600-normal.woff2)}
*{margin:0;box-sizing:border-box}body{width:1280px;height:720px;overflow:hidden;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}.sh{position:absolute;inset:0}
.t{position:absolute;color:#fff;line-height:1.05;text-shadow:0 6px 0 rgba(0,0,0,.45),0 0 40px rgba(0,0,0,.7);-webkit-text-stroke:2px rgba(0,0,0,.6);paint-order:stroke fill}
.ti{font-family:T}.b{font-family:B;font-weight:800}.g{color:#f5c76b}.r{color:#ff5a45}
.tag{position:absolute;padding:8px 20px 4px;border-radius:6px;font-family:B;font-weight:800;font-size:30px;color:#1a120a;background:#f5c76b;box-shadow:0 6px 20px rgba(0,0,0,.5)}
.card{position:absolute;padding:14px 14px 40px;background:#efe3c8;box-shadow:0 18px 40px rgba(0,0,0,.6)}
.card img{display:block;width:100%;filter:sepia(.35) contrast(1.1)}
.card span{position:absolute;left:16px;bottom:8px;font-family:T;font-style:italic;color:#3a2614;font-size:20px}"""
THUMBS = {
 "thumb1_never": """<div class=bg style="background-image:url(/images/12_Distant_Steamer_Through_Rain.png);background-position:60% 50%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.88) 0,rgba(0,0,0,.55) 50%,rgba(0,0,0,.15) 100%)"></div>
  <div class="t b" style="left:50px;top:40px;font-size:150px"><span class=g>1888</span></div>
  <div class="t ti" style="left:54px;top:230px;font-size:96px">कभी नहीं</div>
  <div class="t ti" style="left:54px;top:345px;font-size:96px"><span class=r>पहुँचा</span></div>
  <div class="t b" style="left:58px;top:500px;font-size:46px">700+ लोग · मांडवी → बंबई</div>
  <div class=card style="right:60px;top:300px;width:470px;transform:rotate(4deg)"><img src="/images/01_Vaitarna.png"><span>SS Vaitarna, 1885 · असली तस्वीर</span></div>
  <div class=tag style="right:60px;top:40px">सच्ची कहानी</div>""",
 "thumb2_cup": """<div class=bg style="background-image:url(/images/04_Blue-and-Gold_Teacups_in_1880s_Bombay.png);background-position:70% 60%;background-size:120%"></div>
  <div class=sh style="background:linear-gradient(90deg,rgba(0,0,0,.9) 0,rgba(0,0,0,.6) 42%,rgba(0,0,0,0) 72%)"></div>
  <div class="t ti" style="left:50px;top:60px;font-size:84px">एक चाय की प्याली</div>
  <div class="t ti" style="left:50px;top:170px;font-size:70px">जो बेटी तक पहुँची…</div>
  <div class="t ti" style="left:50px;top:300px;font-size:84px"><span class=g>माता-पिता</span></div>
  <div class="t ti" style="left:50px;top:400px;font-size:84px"><span class=r>नहीं</span></div>
  <div class=tag style="left:50px;bottom:50px">वीजळी · 1888</div>""",
 "thumb3_song": """<div class=bg style="background-image:url(/images/16_Ravanhatta_Song_by_Lamplight.png);background-position:30% 40%;background-size:115%"></div>
  <div class=sh style="background:linear-gradient(270deg,rgba(0,0,0,.9) 0,rgba(0,0,0,.55) 48%,rgba(0,0,0,.1) 80%)"></div>
  <div class="t" style="right:50px;top:50px;font-family:G;font-weight:600;font-size:96px;text-align:right" ><span class=g>વીજળી</span></div>
  <div class="t ti" style="right:50px;top:200px;font-size:80px;text-align:right">इस गीत के पीछे</div>
  <div class="t ti" style="right:50px;top:300px;font-size:80px;text-align:right">छिपा है एक</div>
  <div class="t ti" style="right:50px;top:400px;font-size:96px;text-align:right"><span class=r>जहाज़ का सच</span></div>
  <div class=tag style="right:50px;bottom:50px">हाजी कासम की वीजळी</div>""",
}
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
        tp = b.new_page(viewport={"width": 1280, "height": 720})
        for name, body in THUMBS.items():
            tp.goto(f"http://127.0.0.1:{PORT}/web/doc.html")
            tp.set_content(f"<html><head><meta charset=utf-8><base href='http://127.0.0.1:{PORT}/'><style>{FONT}</style></head><body>{body}</body></html>")
            tp.evaluate("document.fonts.ready.then(()=>1)"); tp.wait_for_timeout(700)
            tp.screenshot(path=os.path.join(ROOT, f"deliver/thumbs/{name}.png"))
        b.close()
finally:
    srv.terminate()
print("ok")
