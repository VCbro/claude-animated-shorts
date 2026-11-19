#!/usr/bin/env python3
"""Render the shaped-Hindi overlay (captions, labels with leader lines, chips, titles) as a
transparent PNG sequence out/overlay/o00000.png with headless Chromium. Needs out/overlay.json
(render_frames.py overlay) and out/captions.json (captions.py). Skips frames already written.

    python3 tools/overlay.py [--step N]
"""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8791
step = int(sys.argv[sys.argv.index("--step") + 1]) if "--step" in sys.argv else 1
srv = subprocess.Popen([sys.executable, os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
os.makedirs(os.path.join(ROOT, "out/overlay"), exist_ok=True)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", headless=True)
        pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.goto(f"http://127.0.0.1:{PORT}/web/overlay.html")
        pg.wait_for_function("window.__ready === true", timeout=60000)
        n = pg.evaluate("window.__frames")
        t0 = time.time()
        for f in range(0, n, step):
            p = os.path.join(ROOT, f"out/overlay/o{f:05d}.png")
            if os.path.exists(p): continue
            pg.evaluate(f"window.__renderAt({f})")
            pg.screenshot(path=p, omit_background=True)
            if f % 300 == 0: print(f, n, f"{time.time() - t0:.0f}s", flush=True)
        b.close()
finally:
    srv.terminate()
print("overlay done")
