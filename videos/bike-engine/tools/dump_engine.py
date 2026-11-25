#!/usr/bin/env python3
"""Dump the page's crank angle and ignition times (the timeline the picture uses) for the sound."""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANG = os.environ.get("VLANG", "en"); PORT = 8790
srv = subprocess.Popen([sys.executable, f"{ROOT}/tools/serve.py", ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        pg = b.new_page(viewport={"width": 540, "height": 960})
        pg.goto(f"http://127.0.0.1:{PORT}/web/index.html?record=1" + ("&lang=hi" if LANG == "hi" else ""))
        pg.wait_for_function("window.__ready === true", timeout=120000)
        d = pg.evaluate("(() => { const T = window.__T, n = Math.ceil(T.END * 1000); const th = []; for (let i = 0; i <= n; i++) th.push(T.theta(i / 1000)); return { th, ign: T.IGN.map((g) => [g.t, g.tau]) }; })()")
        b.close()
finally:
    srv.terminate()
json.dump(d, open(f"{ROOT}/audio/engine{'_hi' if LANG == 'hi' else ''}.json", "w"))
print("ignitions", len(d["ign"]))
