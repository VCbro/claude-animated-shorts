import os, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8888
srv = subprocess.Popen(["python3", os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
CSS = """@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/baloo-2/files/baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F}
@font-face{font-family:B;font-weight:800;src:url(/node_modules/@fontsource/montserrat/files/montserrat-latin-800-normal.woff2);unicode-range:U+0000-00FF}
*{margin:0}body{width:1080px;height:1920px;overflow:hidden;font-family:B;background:#000}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.t{position:absolute;left:0;right:0;text-align:center;font-weight:800;color:#fff;line-height:1.05;-webkit-text-stroke:6px #000;paint-order:stroke fill;text-shadow:0 10px 0 rgba(0,0,0,.5)}
.y{color:#ffb547}.r{color:#ff5a45}"""
T = {"thumb1_whistle": """<div class=bg style="background-image:url(/out/tsrc/t021.20.png)"></div><div class=t style="top:110px;font-size:150px">सीटी न होती<br><span class=y>तो?</span></div><div class=t style="bottom:180px;font-size:120px"><span class=r>💣</span> कुकर = बम</div>""",
     "thumb2_jam": """<div class=bg style="background-image:url(/out/tsrc/t025.20.png)"></div><div class=t style="top:110px;font-size:140px">सीटी <span class=r>जाम</span><br>हो जाए तो?</div><div class=t style="bottom:200px;font-size:96px">ये <span class=y>छोटा वाल्व</span><br>जान बचाता है</div>"""}
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]); pg = b.new_page(viewport={"width": 1080, "height": 1920})
        for tt in (21.2, 25.2):
            pg.goto(f"http://127.0.0.1:{PORT}/web/index.html?t={tt}"); pg.wait_for_function("window.__ready === true", timeout=120000)
            pg.add_style_tag(content="#ui,#cap,#lines{display:none!important}"); pg.screenshot(path=os.path.join(ROOT, f"out/tsrc/t{tt:06.2f}.png"))
        for k, body in T.items():
            pg.goto(f"http://127.0.0.1:{PORT}/web/index.html?t=0"); pg.set_content(f"<html><head><base href='http://127.0.0.1:{PORT}/'><style>{CSS}</style></head><body>{body}</body></html>")
            pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(ROOT, f"deliver/thumbs/{k}.png"))
        b.close()
finally: srv.terminate()
