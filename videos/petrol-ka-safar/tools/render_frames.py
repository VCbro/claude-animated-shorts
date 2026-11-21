#!/usr/bin/env python3
"""Render the film (or stills) from petrol_ka_safar.blend with Cycles, one exact frame at a time.

    /home/user/bpyenv/bin/python tools/render_frames.py stills 1.0,9.5,30.2   # -> out/stills/
    /home/user/bpyenv/bin/python tools/render_frames.py frames [--from F] [--to F] [--step N] [--samples N]
    /home/user/bpyenv/bin/python tools/render_frames.py overlay                # labels/captions data -> out/overlay.json

Frames go to out/frames/f00000.jpg; existing frames are skipped, so a killed render resumes.
"""
import argparse, json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "petrol_ka_safar.blend"))
import anim

sc = bpy.context.scene


def render(path, samples=None):
    if samples: sc.cycles.samples = samples
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "frames", "overlay"])
    ap.add_argument("times", nargs="?", default="")
    ap.add_argument("--from", dest="f0", type=int, default=0)
    ap.add_argument("--to", dest="f1", type=int, default=None)
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--samples", type=int, default=None)
    ap.add_argument("--res", type=int, default=None, help="vertical resolution override")
    ap.add_argument("--outdir", default="out/frames")
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    if a.res: sc.render.resolution_y = a.res; sc.render.resolution_x = round(a.res * 9 / 16)
    nf = int(round(anim.END * anim.FPS))
    if a.mode == "stills":
        os.makedirs(os.path.join(ROOT, "out/stills"), exist_ok=True)
        for t in [float(x) for x in a.times.split(",")]:
            t0 = time.time()
            anim.pose(t)
            render(os.path.join(ROOT, f"out/stills/t{t:06.2f}.jpg"), a.samples)
            print(f"t={t:6.2f} {time.time() - t0:.1f}s", flush=True)
    elif a.mode == "overlay":
        data = []
        for f in range(nf):
            data.append(anim.pose(f / anim.FPS))
        json.dump(dict(fps=anim.FPS, frames=data, end=anim.END), open(os.path.join(ROOT, "out/overlay.json"), "w"), ensure_ascii=False)
        print("overlay frames", len(data))
    else:
        os.makedirs(os.path.join(ROOT, a.outdir), exist_ok=True)
        f1 = nf if a.f1 is None else min(a.f1, nf)
        t0 = time.time(); n = 0
        for f in range(a.f0, f1, a.step):
            p = os.path.join(ROOT, a.outdir, f"f{f:05d}.jpg")
            if os.path.exists(p) and os.path.getsize(p) > 1000: continue
            anim.pose(f / anim.FPS)
            render(p + ".tmp.jpg", a.samples)
            os.replace(p + ".tmp.jpg", p)
            n += 1
            if n % 10 == 0:
                el = time.time() - t0
                print(f"frame {f}/{f1}  {el / n:.1f}s/f", flush=True)
        print("done", n, "frames")


main()
