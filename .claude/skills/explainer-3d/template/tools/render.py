#!/usr/bin/env python3
"""Frame-exact renderer for the page (frame-capture skill, adapted for a page that is a pure
function of time). Each worker opens its own headless Chromium, calls window.__renderAt(t) for
its frames and pipes screenshots into ffmpeg; the chunks are joined losslessly at the end.

    python3 tools/render.py stills out/stills 0.5,4,12.3          # PNG stills at those times
    python3 tools/render.py video out/video.mp4 --fps 60 --workers 4 [--from 0 --to 10]

The page is served by tools/serve.py (Range-aware static server) from the project folder.
"""
import argparse, json, os, subprocess, sys, time, threading
from concurrent.futures import ProcessPoolExecutor
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get("CHROME_PATH") or None
ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync",
        "--hide-scrollbars", "--force-color-profile=srgb"]
PORT = int(os.environ.get("PORT", "8765"))
LANG = os.environ.get("VLANG", "en")
THEME = os.environ.get("VTHEME", "")
STYLE = os.environ.get("VSTYLE", "")
URL = f"http://127.0.0.1:{PORT}/web/index.html?record=1" + ("&lang=hi" if LANG == "hi" else "") + (f"&theme={THEME}" if THEME else "") + (f"&style={STYLE}" if STYLE else "")


def start_server():
    p = subprocess.Popen([sys.executable, os.path.join(ROOT, "tools/serve.py"), ROOT, "--port", str(PORT)],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    return p


def open_page(pw):
    b = pw.chromium.launch(executable_path=CHROME, args=ARGS, headless=True)
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(URL)
    try:
        pg.wait_for_function("window.__ready === true", timeout=120000)
    except Exception:
        print("page errors:", errs, file=sys.stderr); raise
    return b, pg, errs


def stills(out, times):
    os.makedirs(out, exist_ok=True)
    with sync_playwright() as pw:
        b, pg, errs = open_page(pw)
        for t in times:
            t0 = time.time()
            pg.evaluate(f"window.__renderAt({t})")
            pg.screenshot(path=f"{out}/t{t:06.2f}.png")
            print(f"t={t:6.2f}  {time.time() - t0:.2f}s", flush=True)
        if errs: print("errors:", errs)
        b.close()


def chunk(args):
    idx, f0, f1, fps, path = args
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
           "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-r", str(fps),
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", path]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    with sync_playwright() as pw:
        b, pg, errs = open_page(pw)
        for f in range(f0, f1):
            pg.evaluate(f"window.__renderAt({f / fps})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=96))
            n = f - f0 + 1
            if n % 60 == 0:
                el = time.time() - t0
                print(f"[w{idx}] {n}/{f1 - f0} frames  {el / n:.2f}s/f  eta {(f1 - f0 - n) * el / n / 60:.1f} min", flush=True)
        b.close()
    ff.stdin.close(); ff.wait()
    return path


def video(out, fps, workers, t_from, t_to):
    with sync_playwright() as pw:
        b, pg, _ = open_page(pw)
        dur = pg.evaluate("window.__duration")
        b.close()
    t_to = dur if t_to is None else min(t_to, dur)
    f0, f1 = int(round(t_from * fps)), int(round(t_to * fps))
    os.makedirs(os.path.join(ROOT, f"out/chunks_{LANG}{THEME}{STYLE}"), exist_ok=True)
    n = f1 - f0
    # more chunks than workers, so a slow chunk does not hold everyone up
    nch = workers * 3
    bounds = [f0 + n * i // nch for i in range(nch + 1)]
    jobs = [(i, bounds[i], bounds[i + 1], fps, os.path.join(ROOT, f"out/chunks_{LANG}{THEME}{STYLE}/c{i:03d}.mp4")) for i in range(nch)]
    print(f"{n} frames ({t_from:.2f}-{t_to:.2f}s at {fps} fps) in {nch} chunks on {workers} workers")
    with ProcessPoolExecutor(workers) as ex:
        paths = list(ex.map(chunk, jobs))
    lst = os.path.join(ROOT, f"out/chunks_{LANG}{THEME}{STYLE}/list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in paths))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out], check=True)
    print("wrote", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "video"])
    ap.add_argument("out")
    ap.add_argument("times", nargs="?", default="")
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--from", dest="t_from", type=float, default=0.0)
    ap.add_argument("--to", dest="t_to", type=float, default=None)
    a = ap.parse_args()
    srv = start_server()
    try:
        if a.mode == "stills": stills(a.out, [float(x) for x in a.times.split(",")])
        else: video(a.out, a.fps, a.workers, a.t_from, a.t_to)
    finally:
        srv.terminate()
