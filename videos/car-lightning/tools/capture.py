#!/usr/bin/env python3
"""Capture web/doc.html frame by frame with headless Chromium.
    python3 tools/capture.py stills 1.0,20,45      -> out/stills/s0001.00.jpg ...
    python3 tools/capture.py frames [--fps 30] [--from F] [--to F]   -> out/frames/f00000.jpg (skips existing)
"""
import os, sys, subprocess, time
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("PORT", 8794))
mode = sys.argv[1]
arg = lambda k, d: type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
srv = subprocess.Popen([sys.executable, os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--disable-gpu-vsync", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        VW, VH = map(int, os.environ.get("VIEW", "1920x1080").split("x"))
        pg = b.new_page(viewport={"width": VW, "height": VH}, device_scale_factor=arg("--dpr", 1.0))
        logs = []; pg.on("console", lambda m: logs.append(m.text)); pg.on("pageerror", lambda e: logs.append("ERR " + str(e)))
        pg.goto(f"http://127.0.0.1:{PORT}/web/doc.html?size={VW}x{VH}")
        try: pg.wait_for_function("window.__ready === true", timeout=60000)
        except Exception: print("\n".join(logs)); raise
        if mode == "stills":
            os.makedirs(os.path.join(ROOT, "out/stills"), exist_ok=True)
            for t in [float(x) for x in sys.argv[2].split(",")]:
                pg.evaluate(f"window.__renderAt({t})")
                pg.screenshot(path=os.path.join(ROOT, f"out/stills/s{t:07.2f}.jpg"), type="jpeg", quality=92)
        else:
            fps = arg("--fps", 30); end = pg.evaluate("window.__END"); n = int(end * fps)
            f0, f1 = arg("--from", 0), min(arg("--to", n), n)
            os.makedirs(os.path.join(ROOT, "out/frames"), exist_ok=True)
            t0 = time.time(); k = 0
            for f in range(f0, f1):
                p = os.path.join(ROOT, f"out/frames/f{f:05d}.jpg")
                if os.path.exists(p): continue
                pg.evaluate(f"window.__renderAt({f / fps})")
                pg.screenshot(path=p + ".tmp", type="jpeg", quality=arg("--q", 93)); os.replace(p + ".tmp", p); k += 1
                if f % 300 == 0: print(f"frame {f}/{n} {(time.time() - t0) / max(1, k):.2f}s/f", flush=True)
            print("done", k)
        if logs: print("\n".join(logs[-10:]))
        b.close()
finally:
    srv.terminate()
