"""Re-render a frame range of one film into its frames folder (after a change that touched only those frames).
usage: python3 -I tools/patch_frames.py en 0 300"""
import os, shutil, subprocess, sys
lang, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tmp = os.path.join(root, "out", f"patch-{lang}-{a}")
shutil.rmtree(tmp, ignore_errors=True)
env = dict(os.environ, PATH=os.path.expanduser("~/.local/bin") + ":" + os.environ["PATH"], VK_ICD_FILENAMES="/usr/share/vulkan/icd.d/lvp_icd.json")
frames = list(range(a, b + 1))
r = subprocess.run(["raea", "render", "compositions/film.tsx", "--composition", f"engine-{lang}", "--at", ",".join(map(str, frames)), "-o", tmp + "/"],
                   cwd=root, env=env, capture_output=True, text=True)
print("\n".join(l for l in (r.stdout + r.stderr).splitlines() if "APPLIED" in l or "REFUSED" in l or "raea render:" in l))
for i, f in enumerate(frames):
    shutil.move(os.path.join(tmp, f"frame-{i:05d}.png"), os.path.join(root, "out", f"frames-{lang}", f"frame-{f:05d}.png"))
shutil.rmtree(tmp)
print("patched", lang, a, b)
