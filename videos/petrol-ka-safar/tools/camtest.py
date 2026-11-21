"""Quick camera test: camtest.py t 'ex,ey,ez' 'tx,ty,tz' lens out.jpg [res]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector as V
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "petrol_ka_safar.blend"))
import anim
args = sys.argv[sys.argv.index("--") + 1:]
sc = bpy.context.scene; sc.cycles.samples = 6
res = int(args[5]) if len(args) > 5 else 360
sc.render.resolution_y = res; sc.render.resolution_x = round(res * 9 / 16)
for spec in args[0].split(";"):
    t, e, g, lens, out = spec.split("|")
    anim.pose(float(t))
    cam = bpy.data.objects["cam"]
    e = V([float(x) for x in e.split(",")]); g = V([float(x) for x in g.split(",")])
    cam.location = e; cam.rotation_euler = (g - e).to_track_quat("-Z", "Y").to_euler(); cam.data.lens = float(lens)
    cam.data.dof.use_dof = False
    sc.render.filepath = out; bpy.ops.render.render(write_still=True)
