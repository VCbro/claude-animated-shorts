#!/usr/bin/env python3
"""Builds the whole PETROL KA SAFAR scene in Blender from code and saves petrol_ka_safar.blend.

    /home/user/bpyenv/bin/python tools/build.py

Everything is procedural: forecourt at blue hour, tanker, underground tank in section, submerged
pump, delivery line, dispenser with an openable side (filter, piston meter, pulser, display),
hatchback, hose + nozzle, gloved hand, and a separate macro section rig of the nozzle.
Per-frame motion is applied by tools/anim.py (pure function of time) at render time.
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector as V, Matrix, Euler
from lib import *
import geo as G
from shapely.ops import unary_union
from shapely.geometry import Polygon, Point, box as sbox

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PI = math.pi

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ============================================================================= materials
M = {}
M["concrete"] = mat_noise_color("concrete", "#8f8d88", "#a6a39c", scale=3, rough=0.85, bump=0.25)
M["concrete_dark"] = mat_noise_color("concrete_dark", "#6f6d69", "#85827c", scale=4, rough=0.9, bump=0.3)
M["asphalt"] = mat_noise_color("asphalt", "#2a2b2d", "#3a3b3e", scale=12, rough=0.9, bump=0.4)
M["soil"] = mat_noise_color("soil", "#6b4f36", "#8a6a4a", scale=2.5, rough=1.0, bump=0.4)
M["sand"] = mat_noise_color("sand", "#b59a6e", "#cdb48a", scale=30, rough=1.0, bump=0.5)
M["cap_soil"] = mat_noise_color("cap_soil", "#7a5a3c", "#93714f", scale=3, rough=1.0, bump=0.2)
M["cap_conc"] = mat_noise_color("cap_conc", "#9d9a93", "#b3afa7", scale=6, rough=0.95, bump=0.15)
M["cap_steel"] = mat("cap_steel", "#b9564a", 0.6)
M["steel_paint"] = mat("steel_paint", "#3d4146", 0.55, 0.3)
M["tank_in"] = mat("tank_in", "#8d9297", 0.45, 0.8)
M["steel"] = mat_brushed("steel", "#c7cacd", 0.3)
M["galv"] = mat_noise_color("galv", "#9aa0a4", "#b8bcc0", scale=20, rough=0.45, metal=1.0, bump=0.05)
M["pipe_yellow"] = mat("pipe_yellow", "#c8a227", 0.5, 0.2)
M["pipe_green"] = mat("pipe_green", "#2f6e4f", 0.5, 0.2)
M["cast"] = mat_noise_color("cast", "#7d8287", "#8f949a", scale=60, rough=0.55, metal=1.0, bump=0.1)
M["alu"] = mat_noise_color("alu", "#b5b9bd", "#c9ccd0", scale=80, rough=0.38, metal=1.0, bump=0.06)
M["copper"] = mat("copper", "#c27a4a", 0.35, 1.0)
M["motor"] = mat("motor", "#3c5f86", 0.45, 0.4)
M["rubber"] = mat_noise_color("rubber", "#111213", "#1b1c1e", scale=150, rough=0.6, bump=0.15)
M["hose"] = mat_noise_color("hose", "#0e0f10", "#1a1b1d", scale=400, rough=0.5, bump=0.25)
M["black_plastic"] = mat("black_plastic", "#141518", 0.45)
M["white_panel"] = mat("white_panel", "#e6e8ea", 0.35, 0.0, coat=0.3)
M["grey_panel"] = mat("grey_panel", "#3b4148", 0.4, 0.2)
M["green_trim"] = mat("green_trim", "#1f6f4a", 0.35, 0.0, coat=0.3)
M["yellow"] = mat("yellow", "#e2b11a", 0.45)
M["blackstripe"] = mat("blackstripe", "#141414", 0.5)
M["glass"] = mat("glass", "#9fb3c0", 0.03, 0.0, transm=1.0, ior=1.5)
M["glass_dark"] = mat("glass_dark", "#0e1418", 0.06, 0.0, coat=1.0, spec=0.8)
M["car_paint"] = mat("car_paint", "#9b1015", 0.32, 0.5, coat=1.0)
M["car_dark"] = mat("car_dark", "#121315", 0.5)
M["chrome"] = mat("chrome", "#e8eaec", 0.08, 1.0)
M["tail"] = mat("tail", "#8a0b0b", 0.2, 0.0, transm=0.4, emit="#ff1a10", estr=0.4)
M["head"] = mat("head", "#dfe6ea", 0.05, 0.0, transm=0.7)
M["tyre"] = mat_noise_color("tyre", "#151515", "#202020", scale=200, rough=0.85, bump=0.3)
M["tanker_white"] = mat("tanker_white", "#e9ebec", 0.3, 0.0, coat=0.5)
M["tanker_barrel"] = mat_brushed("tanker_barrel", "#d9dcdf", 0.22, scale=(400, 1, 1))
M["red"] = mat("red", "#b3191d", 0.4, 0.0, coat=0.4)
M["glove"] = mat_noise_color("glove", "#1e3d6b", "#24497e", scale=300, rough=0.65, bump=0.15)
M["sleeve"] = mat_noise_color("sleeve", "#2b4a6e", "#335478", scale=120, rough=0.9, bump=0.2)
M["lcd_digit"] = mat_emit("lcd_digit", "#7dff9a", 6.0)
M["lcd_digit_amber"] = mat_emit("lcd_digit_amber", "#ffc24a", 6.0)
M["canopy_light"] = mat_emit("canopy_light", "#ffd9a8", 22.0)
M["window_light"] = mat_emit("window_light", "#ffc98a", 3.0)
M["street_light"] = mat_emit("street_light", "#ffb070", 30.0)
M["fascia"] = mat("fascia", "#f1f2f3", 0.3, 0.0)
M["pcb"] = mat("pcb", "#1d5a35", 0.4)
M["filter"] = mat("filter", "#cf6a1f", 0.45, 0.2)
M["meter_body"] = mat_cutface("meter_body", "#8d949b", "#c25a4c", rough=0.35, metal=1.0)
M["housing_cut"] = mat_cutface("housing_cut", "#aeb3b8", "#c4634f", rough=0.32, metal=1.0, cap_dir=(0, 0, 1))
M["housing_in"] = mat_noise_color("housing_in", "#8e9397", "#a1a6aa", scale=200, rough=0.5, metal=1.0, bump=0.05)
M["neck_cut"] = mat_cutface("neck_cut", "#4a4f55", "#7d8288", rough=0.4, metal=0.8, cap_dir=(0, 0, 1))
M["petrol"] = mat("petrol", "#f2d78c", 0.08, 0.0, transm=0.35, ior=1.39, emit="#d9a441", estr=0.35)
M["petrol_flat"] = mat("petrol_flat", "#e9c873", 0.2, 0.0, alpha=0.6, emit="#e0b450", estr=0.08)
M["vapour"] = mat("vapour", "#d9e6f2", 0.4, 0.0, alpha=0.08)
M["tracer"] = mat_vcol_emit("tracer", 6.0)
M["spring"] = mat("spring", "#c8c9cb", 0.25, 1.0)
M["diaphragm"] = mat("diaphragm", "#1d1f22", 0.55)
M["chamber_low"] = mat("chamber_low", "#4a86d8", 0.5, 0.0, alpha=0.0, emit="#3f8cff", estr=1.2)
M["lever"] = mat("lever", "#1b1c1f", 0.4, 0.1)
M["guard"] = mat_brushed("guard", "#b0b4b8", 0.3)
M["backdrop"] = mat_noise_color("backdrop", "#1a2533", "#22303f", scale=1.5, rough=0.9, bump=0.0)

# ============================================================================= world, sky, lights
w = bpy.data.worlds.new("blue_hour"); sc.world = w
nt = w.node_tree
bg = nt.nodes["Background"]
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Generated"], sep.inputs[0])
# generated z of a world: direction, -1..1 -> use Normal-ish: build gradient on z of the view vector
nv = nt.nodes.new("ShaderNodeTexCoord")
sepn = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(nv.outputs["Window"], sepn.inputs[0])
geo_n = nt.nodes.new("ShaderNodeNewGeometry")
sepi = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(geo_n.outputs["Incoming"], sepi.inputs[0])
neg = nt.nodes.new("ShaderNodeMath"); neg.operation = "MULTIPLY"; neg.inputs[1].default_value = -1.0
nt.links.new(sepi.outputs["Z"], neg.inputs[0])
ramp = nt.nodes.new("ShaderNodeValToRGB")
el = ramp.color_ramp.elements
el[0].position = 0.0; el[0].color = hexc("#e9a36b")
el[1].position = 0.32; el[1].color = hexc("#1d3c74")
e2 = el.new(0.08); e2.color = hexc("#c98e78")
e3 = el.new(0.16); e3.color = hexc("#5d6fa3")
nt.links.new(neg.outputs[0], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.55

# ============================================================================= forecourt + surroundings
GZ = 0.0
slab_back = box("slab_back", (34, 20, G.SLAB), (2, 10, -G.SLAB / 2), M["concrete"])
slab_front = box("slab_front", (34, 26, G.SLAB), (2, -13, -G.SLAB / 2), M["concrete"])
road = box("road", (120, 14, 0.1), (0, -33, -0.05), M["asphalt"])
verge = box("verge", (120, 60, 0.1), (0, 40, -0.06), mat_noise_color("grass", "#2c3a22", "#3a4a2c", scale=4, rough=1.0, bump=0.3))
# expansion joints on the slab: thin dark strips
jm = mat("joint", "#55524d", 0.9)
for i in range(-4, 6):
    box(f"joint_x{i}", (0.02, 46, 0.004), (i * 3.0 + 1.0, -3, 0.001), jm)
for j in range(-6, 6):
    box(f"joint_y{j}", (34, 0.02, 0.004), (2, j * 3.0 + 0.5, 0.001), jm)

# canopy
can = empty("canopy")
for cx in (1.0, 12.0):
    for cy in (-4.2, 4.2):
        box(f"col_{cx}_{cy}", (0.45, 0.45, 5.2), (cx, cy, 2.6), M["white_panel"], bevel=0.02, parent=can)
        box(f"colbase_{cx}_{cy}", (0.6, 0.6, 0.5), (cx, cy, 0.25), M["concrete_dark"], bevel=0.02, parent=can)
box("roof", (14.5, 11.5, 0.5), (6.5, 0, 5.55), M["fascia"], bevel=0.03, parent=can)
box("fascia_band", (14.7, 11.7, 0.22), (6.5, 0, 5.62), M["green_trim"], bevel=0.01, parent=can)
box("roof_under", (14.3, 11.3, 0.02), (6.5, 0, 5.29), mat("soffit", "#d8d9da", 0.6), parent=can)
for i in range(4):
    for j in range(3):
        lx, ly = 1.6 + i * 3.3, -3.3 + j * 3.3
        box(f"clight_{i}_{j}", (1.1, 0.5, 0.03), (lx, ly, 5.27), M["canopy_light"], parent=can)
        area_light(f"cL_{i}_{j}", (lx, ly, 5.2), (0, 0, 0), 1.1, 260, "#ffd2a0", size_y=0.5)

# islands
def island(name, x, y, L=2.6, W=1.3):
    box(name, (W, L, 0.18), (x, y, 0.09), M["concrete_dark"], bevel=0.02)
    for s in (-1, 1):
        # yellow/black kerb edges
        box(name + f"_kerb{s}", (0.04, L, 0.18), (x + s * W / 2, y, 0.09), M["yellow"], bevel=0.005)
    for s in (-1, 1):
        p = cyl(name + f"_post{s}", 0.07, 0.8, (x, y + s * (L / 2 + 0.25), 0.4), M["yellow"])
        for k in range(3):
            cyl(name + f"_post{s}_b{k}", 0.071, 0.08, (x, y + s * (L / 2 + 0.25), 0.2 + k * 0.22), M["blackstripe"])
island("island1", G.DISP[0], G.DISP[1])
island("island2", G.DISP[0] + 0.0, 9.0)

# station office at the back
off = empty("office")
box("office_wall", (9, 4, 3.2), (6.5, 13.5, 1.6), mat("office_wall", "#d9d2c3", 0.8), bevel=0.02, parent=off)
box("office_roof", (9.6, 4.6, 0.25), (6.5, 13.5, 3.3), M["green_trim"], parent=off)
for i in range(4):
    box(f"office_win{i}", (1.4, 0.05, 1.2), (3.6 + i * 2.0, 11.48, 1.7), M["window_light"], parent=off)
box("office_door", (1.0, 0.05, 2.1), (11.0, 11.48, 1.05), M["glass_dark"], parent=off)
# vent pipes behind the tank
for i, vx in enumerate((-3.9, -3.6)):
    cyl(f"vent{i}", 0.04, 4.6, (vx, 3.0, 2.3), M["galv"])
    cyl(f"ventcap{i}", 0.07, 0.12, (vx, 3.0, 4.65), M["galv"])
# trees and street lights in the distance
leaf = mat_noise_color("leaf", "#1d2e1c", "#2d4128", scale=3, rough=0.9, bump=0.6)
bark = mat("bark", "#3a2e24", 0.9)
import random
random.seed(7)
for i in range(14):
    x = -18 + i * 3.4 + random.uniform(-0.8, 0.8); y = 19 + random.uniform(-1.5, 3)
    h = random.uniform(4, 7)
    cyl(f"trunk{i}", 0.15, h * 0.5, (x, y, h * 0.25), bark)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=h * 0.32, location=(x, y, h * 0.62))
    t = bpy.context.object; t.name = f"crown{i}"; t.data.materials.append(leaf); t.scale = (1, 1, 0.85)
    bpy.ops.object.shade_smooth()
    d = t.modifiers.new("disp", "DISPLACE"); tex = bpy.data.textures.new(f"cn{i}", "CLOUDS"); tex.noise_scale = 0.6; d.texture = tex; d.strength = 0.6
for i in range(5):
    x = -16 + i * 9
    cyl(f"pole{i}", 0.06, 7, (x, -26.5, 3.5), M["grey_panel"])
    box(f"lamp{i}", (0.8, 0.25, 0.12), (x + 0.35, -26.5, 7.0), M["grey_panel"])
    box(f"lampg{i}", (0.6, 0.2, 0.02), (x + 0.35, -26.5, 6.93), M["street_light"])
    point_light(f"lampL{i}", (x + 0.35, -26.5, 6.8), 900, "#ffae6a", 0.2)

# ============================================================================= underground (in section)
UG = "under"
TZ = G.TANK_C[1]
soil = box("soil", (34, 20, 4.8), (2, 10, -G.SLAB - 2.4), M["soil"], c=UG)
# cavities
def cavity(name, size, loc):
    return box(name, size, loc, M["cap_soil"], c="cutters")
cut_tank = cyl("cut_tank", G.TANK_R + 0.18, 7.2, (0, 0, TZ), M["cap_soil"], c="cutters", rot=(0, PI / 2, 0), segs=96)
cut_fill = cavity("cut_fill", (0.5, 0.9, 1.4), (G.FILL_X, 0, -0.5))
cut_stp = cavity("cut_stp", (1.3, 1.3, 1.25), (G.STP_X, 0, -0.42))
cut_trench = cavity("cut_trench", (4.6, 0.6, 0.5), (G.STP_X + 2.5, 0, G.DEL_Z))
cut_dsump = cavity("cut_dsump", (1.0, 0.9, 1.0), (G.DISP[0], 0, -0.3))
cut_vent = cavity("cut_vent", (1.0, 0.5, 0.5), (-3.4, 0.6, -0.65))
for cu in (cut_tank, cut_fill, cut_stp, cut_trench, cut_dsump):
    boolean(soil, cu)
# concrete slab (back) gets the manway openings
for cu in (cut_fill, cut_stp, cut_dsump):
    boolean(slab_back, cu)
# sand bed ring around the tank
sand = cyl("sand", G.TANK_R + 0.18, 7.0, (0, 3.5 - 3.5, TZ), M["sand"], c=UG, rot=(0, PI / 2, 0), segs=96)
inner = cyl("sand_in", G.TANK_R + 0.02, 7.4, (0, 0, TZ), M["sand"], c="cutters", rot=(0, PI / 2, 0), segs=96)
boolean(sand, inner)
half_cut = box("half_cut", (60, 30, 30), (0, -15, 0), M["cap_steel"], c="cutters")
half_cut_soil = box("half_cut_soil", (60, 30, 30), (0, -15, 0), M["cap_soil"], c="cutters")
half_cut_sand = box("half_cut_sand", (60, 30, 30), (0, -15, 0), M["sand"], c="cutters")
boolean(sand, half_cut_sand)

# --- the tank: steel shell with dished heads, hollow, cut in half
def tank_profile():
    r, L = G.TANK_R, (G.TANK_X1 - G.TANK_X0) / 2
    pts = []
    for i in range(13):
        a = PI / 2 * i / 12
        pts.append((r * math.sin(a) * 0.999, -L - 0.32 * math.cos(a)))
    pts += [(r, L)]
    for i in range(12, -1, -1):
        a = PI / 2 * i / 12
        pts.append((r * math.sin(a) * 0.999, L + 0.32 * math.cos(a)))
    return pts
prof = tank_profile()
tank = lathe("tank", [(max(r, 0.0005), z) for r, z in prof], M["steel_paint"], c=UG, segs=96, loc=(0, 0, TZ), rot=(0, PI / 2, 0))
sol = tank.modifiers.new("sol", "SOLIDIFY"); sol.thickness = 0.03; sol.offset = 1; sol.use_rim = True
sol.material_offset = 0
tank.data.materials.append(M["tank_in"])
sol.material_offset = 1
apply_mods(tank)
# make inner faces use the interior material: solidify offset puts the shell outward; flip
boolean(tank, half_cut)
# stiffening rings
for x in (-2.2, -1.1, 0.0, 1.1, 2.2):
    rg = lathe(f"tank_rib{x}", [(G.TANK_R + 0.0, -0.03), (G.TANK_R + 0.04, -0.03), (G.TANK_R + 0.04, 0.03), (G.TANK_R, 0.03)],
               M["steel_paint"], c=UG, segs=96, loc=(x, 0, TZ), rot=(0, PI / 2, 0), close=True)
    boolean(rg, half_cut)

# tank contents (rebuilt per frame by anim.py: level changes). Placeholder object:
liq = bpy.data.objects.new("tank_liquid", bpy.data.meshes.new("tank_liquid")); link(liq, UG)
liq.data.materials.append(M["petrol"])
vap = bpy.data.objects.new("tank_vapour", bpy.data.meshes.new("tank_vapour")); link(vap, UG)
vap.data.materials.append(M["vapour"])

# --- manway risers / sumps (concrete chambers)
def sump(name, x, w, d, z0):
    g = empty(name, (x, 0, 0), UG)
    for s in (-1, 1):
        box(name + f"_wx{s}", (0.08, d, -z0), (s * (w / 2 - 0.04), 0, z0 / 2), M["concrete_dark"], c=UG, parent=g)
    box(name + f"_wy", (w, 0.08, -z0), (0, d / 2 - 0.04, z0 / 2), M["concrete_dark"], c=UG, parent=g)
    box(name + "_floor", (w, d, 0.08), (0, 0, z0 + 0.04), M["concrete_dark"], c=UG, parent=g)
    return g
sump("stp_sump", G.STP_X, 1.24, 1.24, -1.0)
sump("fill_box", G.FILL_X, 0.46, 0.46, -0.7)
sump("disp_sump", G.DISP[0], 0.94, 0.84, -0.78)
# covers (exterior + cut)
fc = cyl("fill_cover", 0.3, 0.03, (G.FILL_X, 0, 0.015), M["cast"], c=UG); bevel_mod(fc, 0.005)
sc_ = box("stp_cover", (1.3, 1.3, 0.03), (G.STP_X, 0, 0.015), M["cast"], c=UG)
fcol = mat("fill_ring", "#d2a21c", 0.5)
cyl("fill_cover_ring", 0.32, 0.01, (G.FILL_X, 0, 0.005), fcol, c=UG)

# --- section pipes: built full, then cut in half by half_cut (cap = steel cut colour)
def pipe_path(name, pts, r, m, wall=0.006, c=UG, cut=True):
    ob = curve_tube(name, [(x, 0, z) for x, z in pts], r, m, c=c, res=0, bevel_res=8)
    ob.data.use_fill_caps = False
    ob = to_mesh(ob)
    s = ob.modifiers.new("sol", "SOLIDIFY"); s.thickness = wall; s.use_rim = True; s.offset = -1
    apply_mods(ob)
    if cut: boolean(ob, half_cut)
    return ob
def rounded(pts, r=0.08, n=5):
    """fillet a polyline's corners"""
    out = [pts[0]]
    for a, b, c in zip(pts, pts[1:], pts[2:]):
        a, b, c = V((*a, 0)), V((*b, 0)), V((*c, 0))
        d1 = (a - b).normalized(); d2 = (c - b).normalized()
        p1 = b + d1 * r; p2 = b + d2 * r
        for i in range(n + 1):
            t = i / n
            q = (1 - t) ** 2 * p1 + 2 * (1 - t) * t * b + t * t * p2
            out.append((q.x, q.y))
    out.append(pts[-1])
    return out
FILL_PTS = [(G.FILL_X, -0.12), (G.FILL_X, TZ - G.TANK_R + 0.15)]
pipe_path("fill_pipe", FILL_PTS, 0.05, M["galv"])
# fill adaptor + tanker coupling seat
cyl("fill_adaptor", 0.065, 0.12, (G.FILL_X, 0, -0.08), M["copper"], c="cutters")
fa = bpy.data.objects["fill_adaptor"]; bpy.context.scene.collection.children["cutters"].objects.unlink(fa); link(fa, UG)
fa.data.materials.clear(); fa.data.materials.append(M["copper"])
DEL_PTS = rounded([(G.STP_X + 0.12, G.HEAD_Z), (G.STP_X + 0.35, G.HEAD_Z), (G.STP_X + 0.35, G.DEL_Z), (G.DISP[0] - 0.12, G.DEL_Z), (G.DISP[0] - 0.12, 0.25)], 0.12)
pipe_path("delivery", DEL_PTS, 0.032, M["pipe_yellow"])
# riser + column pipe of the STP
pipe_path("stp_column", [(G.STP_X, G.HEAD_Z - 0.05), (G.STP_X, G.PUMP["stages"][1])], 0.045, M["galv"])
# pump head (manifold) in the sump
ph = cyl("pump_head", 0.13, 0.22, (G.STP_X, 0, G.HEAD_Z), M["cast"], c=UG); boolean(ph, half_cut)
ph2 = box("pump_head_box", (0.3, 0.26, 0.16), (G.STP_X + 0.02, 0, G.HEAD_Z + 0.08), M["cast"], c=UG, bevel=0.02); apply_mods(ph2); boolean(ph2, half_cut)
mot = cyl("pump_motor_cap", 0.11, 0.18, (G.STP_X, 0, G.HEAD_Z + 0.25), M["motor"], c=UG); boolean(mot, half_cut)
cyl("conduit", 0.012, 0.6, (G.STP_X - 0.05, 0.15, G.HEAD_Z + 0.55), M["black_plastic"], c=UG)
# submersible pump unit inside the tank: motor, intake screen, stages (impellers animate)
z0, z1 = G.PUMP["motor"]
mo = cyl("stp_motor", 0.085, z1 - z0, (G.STP_X, 0, (z0 + z1) / 2), M["motor"], c=UG); bevel_mod(mo, 0.01); apply_mods(mo); boolean(mo, half_cut)
# copper windings visible in the cut
win = cyl("stp_wind", 0.07, (z1 - z0) * 0.7, (G.STP_X, 0, (z0 + z1) / 2), M["copper"], c=UG); boolean(win, half_cut)
i0, i1 = G.PUMP["intake"]
scr = cyl("stp_screen", 0.08, i1 - i0, (G.STP_X, 0, (i0 + i1) / 2), M["galv"], c=UG, cap=False)
wf = scr.modifiers.new("wf", "WIREFRAME"); wf.thickness = 0.006
s0, s1 = G.PUMP["stages"]
sh = cyl("stp_stagecase", 0.08, s1 - s0, (G.STP_X, 0, (s0 + s1) / 2), M["galv"], c=UG, cap=False)
s_ = sh.modifiers.new("sol", "SOLIDIFY"); s_.thickness = 0.008; s_.use_rim = True; apply_mods(sh); boolean(sh, half_cut)
cyl("stp_shaft", 0.012, s1 - z1 + 0.02, (G.STP_X, 0, (z1 + s1) / 2), M["steel"], c=UG)
IMPS = []
for k in range(3):
    zc = s0 + (s1 - s0) * (k + 0.5) / 3
    g = empty(f"impeller{k}", (G.STP_X, 0, zc), UG)
    cyl(f"imp_hub{k}", 0.03, 0.03, (0, 0, 0), M["alu"], c=UG, parent=g)
    cyl(f"imp_shroud{k}", 0.068, 0.006, (0, 0, -0.03), M["alu"], c=UG, parent=g)
    for b in range(6):
        a = b * PI / 3
        bl = box(f"imp_blade{k}_{b}", (0.05, 0.006, 0.05), (0.04 * math.cos(a), 0.04 * math.sin(a), -0.004), M["alu"], c=UG, parent=g,
                 rot=(0, 0, a + 0.5))
    IMPS.append(g.name)
    # diffuser plate
    df = cyl(f"diffuser{k}", 0.074, 0.008, (G.STP_X, 0, zc + 0.045), M["cast"], c=UG); boolean(df, half_cut)

# ============================================================================= dispenser
DX, DY = G.DISP
D = empty("dispenser", (DX, DY, 0.18))
LOC = lambda x, y, z: (x, y, z)   # local to D
# frame and panels: lower hydraulic cabinet x in [-0.42, 0.42], y in [-0.45, 0.45], z 0..1.07
CAB_W, CAB_D, CAB_H = 0.84, 0.9, 1.07
box("d_plinth", (CAB_W + 0.04, CAB_D + 0.04, 0.08), (0, 0, 0.04), M["grey_panel"], parent=D, bevel=0.01)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f"d_post{sx}{sy}", (0.04, 0.04, CAB_H), (sx * (CAB_W / 2 - 0.02), sy * (CAB_D / 2 - 0.02), CAB_H / 2 + 0.08), M["grey_panel"], parent=D, bevel=0.006)
# panels on the +-x faces (nozzle faces) and back (+y); the -y side panel is the one we open
for sx in (-1, 1):
    box(f"d_panel_x{sx}", (0.012, CAB_D - 0.06, CAB_H - 0.06), (sx * (CAB_W / 2 - 0.01), 0, CAB_H / 2 + 0.08), M["white_panel"], parent=D, bevel=0.004)
    box(f"d_trim_x{sx}", (0.016, CAB_D - 0.06, 0.08), (sx * (CAB_W / 2 - 0.008), 0, 0.2), M["green_trim"], parent=D)
box("d_panel_back", (CAB_W - 0.06, 0.012, CAB_H - 0.06), (0, CAB_D / 2 - 0.01, CAB_H / 2 + 0.08), M["white_panel"], parent=D, bevel=0.004)
door = empty("d_door_pivot", (-CAB_W / 2 + 0.02, -CAB_D / 2 + 0.01, 0.08), parent=D)
box("d_door", (CAB_W - 0.06, 0.012, CAB_H - 0.06), (CAB_W / 2 - 0.02, 0, CAB_H / 2), M["white_panel"], parent=door, bevel=0.004)
box("d_door_trim", (CAB_W - 0.06, 0.016, 0.08), (CAB_W / 2 - 0.02, -0.002, 0.12), M["green_trim"], parent=door)
for k in range(5):
    box(f"d_louvre{k}", (0.5, 0.014, 0.012), (CAB_W / 2 - 0.02, -0.006, 0.75 + k * 0.035), M["grey_panel"], parent=door)
# head (electronics + display) z 1.15 .. 2.05, slightly wider
HZ0, HZ1 = 1.15, 2.05
box("d_head", (CAB_W + 0.06, CAB_D - 0.1, HZ1 - HZ0), (0, 0, (HZ0 + HZ1) / 2), M["white_panel"], parent=D, bevel=0.03)
box("d_head_band", (CAB_W + 0.08, CAB_D - 0.08, 0.1), (0, 0, HZ1 - 0.05), M["green_trim"], parent=D, bevel=0.01)
box("d_waist", (CAB_W - 0.02, CAB_D - 0.12, 0.08), (0, 0, 1.11), M["grey_panel"], parent=D, bevel=0.01)
box("d_cap", (CAB_W + 0.1, CAB_D - 0.06, 0.06), (0, 0, HZ1 + 0.03), M["grey_panel"], parent=D, bevel=0.01)
# display faces on +x and -x
img = bpy.data.images.load(os.path.join(ROOT, "assets/disp_face.png")); img.pack()
fm = bpy.data.materials.new("disp_face"); n2 = fm.node_tree
it = n2.nodes.new("ShaderNodeTexImage"); it.image = img
pb = n2.nodes["Principled BSDF"]; n2.links.new(it.outputs["Color"], pb.inputs["Base Color"])
pb.inputs["Roughness"].default_value = 0.25; pb.inputs["Coat Weight"].default_value = 1.0
n2.links.new(it.outputs["Color"], pb.inputs["Emission Color"]); pb.inputs["Emission Strength"].default_value = 0.25
FACE_W, FACE_H = 0.6, 0.78
for sx in (1, -1):
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    for v in bm.verts:
        v.co = V((0, v.co.x * FACE_W, v.co.y * FACE_H))
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        for l in f.loops:
            l[uv].uv = ((l.vert.co.y / FACE_W + 0.5) if sx > 0 else (0.5 - l.vert.co.y / FACE_W), l.vert.co.z / FACE_H + 0.5)
    f_ob = mesh_obj(f"d_face{sx}", bm, [fm], parent=D)
    f_ob.location = (sx * (CAB_W / 2 + 0.0345), 0, (HZ0 + HZ1) / 2 - 0.02)
    if sx < 0: f_ob.rotation_euler = (0, 0, 0)
    for n in f_ob.data.polygons: pass
    bezel = box(f"d_bezel{sx}", (0.01, FACE_W + 0.04, FACE_H + 0.04), (sx * (CAB_W / 2 + 0.028), 0, (HZ0 + HZ1) / 2 - 0.02), M["black_plastic"], parent=D, bevel=0.005)
    # glass over the display
    box(f"d_glass{sx}", (0.002, FACE_W, FACE_H), (sx * (CAB_W / 2 + 0.039), 0, (HZ0 + HZ1) / 2 - 0.02), mat("disp_glass", "#ffffff", 0.02, 0.0, transm=1.0, ior=1.5), parent=D)
# digits: text objects (DejaVu Sans Mono Bold), right aligned in each window
fnt = bpy.data.fonts.load("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"); fnt.pack()
# window centres in texture px (1000 x 1300): amount rows 198-482, litres 598-882, rate 998-1202
def face_pt(px, py):
    return ((px / 1000 - 0.5) * FACE_W, (0.5 - py / 1300) * FACE_H)
DIGITS = {}
for sx in (1, -1):
    for key, (py0, py1, size, mt) in {"amount": (198, 482, 0.13, M["lcd_digit"]), "litres": (598, 882, 0.13, M["lcd_digit"]),
                                       "rate": (998, 1202, 0.085, M["lcd_digit_amber"])}.items():
        cu = bpy.data.curves.new(f"txt_{key}{sx}", "FONT"); cu.font = fnt; cu.body = "0.00"; cu.size = size
        cu.align_x = "RIGHT"; cu.align_y = "CENTER"; cu.extrude = 0.0005
        ob = bpy.data.objects.new(f"txt_{key}{sx}", cu); link(ob); ob.parent = D
        cu.materials.append(mt)
        hy, hz = face_pt(930, (py0 + py1) / 2 + 30)
        ob.location = (sx * (CAB_W / 2 + 0.036), sx * hy, (HZ0 + HZ1) / 2 - 0.02 + hz)
        ob.rotation_euler = (PI / 2, 0, sx * PI / 2)
        DIGITS[f"{key}{sx}"] = ob.name
# nozzle boot (holster) on +x face, hose outlet on top
boot = box("d_boot", (0.1, 0.16, 0.22), (CAB_W / 2 + 0.06, 0.2, 0.86), M["black_plastic"], parent=D, bevel=0.02)
box("d_boot_lip", (0.12, 0.18, 0.03), (CAB_W / 2 + 0.07, 0.2, 0.98), M["green_trim"], parent=D, bevel=0.01)
cyl("d_hose_outlet", 0.035, 0.12, (CAB_W / 2 + 0.05, 0.3, HZ1 - 0.08), M["steel"], parent=D, rot=(0, PI / 2, 0))
# decal
dimg = bpy.data.images.load(os.path.join(ROOT, "assets/cab_decal.png")); dimg.pack()
dm = bpy.data.materials.new("decal"); n3 = dm.node_tree
it3 = n3.nodes.new("ShaderNodeTexImage"); it3.image = dimg
p3 = n3.nodes["Principled BSDF"]; n3.links.new(it3.outputs["Color"], p3.inputs["Base Color"]); n3.links.new(it3.outputs["Alpha"], p3.inputs["Alpha"])
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
uv = bm.loops.layers.uv.new()
for v in bm.verts: v.co = V((0, v.co.x * 0.4, v.co.y * 0.15))
for f in bm.faces:
    for l in f.loops: l[uv].uv = (l.vert.co.y / 0.4 + 0.5, l.vert.co.z / 0.15 + 0.5)
dec = mesh_obj("d_decal", bm, [dm], parent=D); dec.location = (CAB_W / 2 + 0.005, 0, 0.62)

# --- dispenser internals (visible when the -y door swings open); local to D, cut plane y = -0.05
INT = empty("d_internals", (0, 0, 0), parent=D)
fx, fz = G.D_FILTER; mx, mz = G.D_METER; px_, pz_ = G.D_PULSER
# inlet from the sump (shear valve) up to the filter
icu = curve_tube("d_inlet", [(-0.12, 0, -0.1), (-0.12, 0, 0.25), (fx, 0, 0.32)], 0.025, M["pipe_yellow"], res=0)
icu.parent = INT
cyl("d_shear", 0.045, 0.08, (-0.12, 0, 0.12), M["cast"], parent=INT)
# filter canister (cut)
fcan = lathe("d_filter", [(0.0001, -0.11), (0.06, -0.11), (0.065, -0.09), (0.065, 0.1), (0.07, 0.12), (0.0001, 0.12)], M["filter"], loc=(fx, 0, fz), parent=INT)
fel = lathe("d_filter_el", [(0.03, -0.09), (0.05, -0.09), (0.05, 0.09), (0.03, 0.09)], mat_noise_color("pleat", "#e8e2cf", "#cfc6ad", scale=900, rough=0.9, bump=0.6), loc=(fx, 0, fz), parent=INT, close=True)
cut_d = box("cut_disp", (3, 1, 3), (DX, -0.5 + DY, 1.0), M["cap_steel"], c="cutters")
# meter block with two horizontal cylinders and a scotch-yoke crank
mb = box("d_meter_block", (0.34, 0.16, 0.16), (mx, 0, mz), M["meter_body"], parent=INT, bevel=0.012)
apply_mods(mb)
for s in (-1, 1):
    cy_ = cyl(f"d_meter_cyl{s}", 0.065, 0.09, (mx + s * 0.13, 0, mz), M["meter_body"], parent=INT, rot=(0, PI / 2, 0))
mbore = cyl("d_meter_bore", 0.055, 0.44, (mx, 0, mz), M["meter_body"], c="cutters", rot=(0, PI / 2, 0))
# pistons + yoke + crank (animated)
PIST = []
for s in (-1, 1):
    p = cyl(f"d_piston{s}", 0.053, 0.05, (mx + s * 0.13, 0, mz), M["alu"], parent=INT, rot=(0, PI / 2, 0))
    PIST.append(p.name)
yoke = box("d_yoke", (0.2, 0.03, 0.05), (mx, 0, mz), M["steel"], parent=INT, bevel=0.004)
crank = empty("d_crank", (mx, 0.02, mz), parent=INT)
cyl("d_crank_disc", 0.04, 0.012, (0, 0, 0.04), M["steel"], parent=crank)
cyl("d_crank_pin", 0.008, 0.06, (0.035, 0, 0.012), M["steel"], parent=crank)
cyl("d_shaft", 0.008, pz_ - mz, (mx, 0.02, (mz + pz_) / 2 + 0.05), M["steel"], parent=INT)
# measured volume highlight inside each cylinder (scaled per frame)
MEAS = []
for s in (-1, 1):
    hb = cyl(f"d_meas{s}", 0.05, 1.0, (mx + s * 0.19, -0.0, mz), M["petrol_flat"], parent=INT, rot=(0, PI / 2, 0))
    MEAS.append(hb.name)
# pulser: slotted encoder disc + optical fork + board
pul = empty("d_pulser", (px_, 0.02, pz_), parent=INT)
disc = cyl("d_enc_disc", 0.058, 0.004, (0, 0, 0), mat("enc", "#2a2d31", 0.3, 0.6), parent=pul)
for k in range(12):
    a = k * PI / 6
    box(f"d_enc_slot{k}", (0.014, 0.005, 0.012), (0.046 * math.cos(a), 0.046 * math.sin(a), 0), mat("slot", "#e8ecef", 0.3), parent=pul, rot=(0, 0, a))
box("d_pulser_case", (0.05, 0.06, 0.04), (px_ + 0.075, 0.04, pz_), M["black_plastic"], parent=INT, bevel=0.006)
box("d_pulser_led", (0.012, 0.012, 0.012), (px_ + 0.06, 0.005, pz_ + 0.026), mat_emit("led_red", "#ff4040", 3.0), parent=INT)
# signal cable from the pulser up to the computer board in the head
CABLE = [(px_ + 0.08, -0.01, pz_), (0.22, -0.01, pz_ + 0.05), (0.26, -0.01, 1.1), (0.24, -0.01, 1.35), (0.1, -0.01, 1.45)]
cb = curve_tube("d_cable", CABLE, 0.006, mat("cable", "#e9e9ea", 0.4), res=12); cb.parent = INT
board = box("d_board", (0.3, 0.02, 0.2), (0.0, 0.0, 1.5), M["pcb"], parent=INT, bevel=0.003)
# outlet from the meter up to the hose outlet
OUT = [(mx + 0.17, 0, mz), (0.3, 0, mz + 0.05), (0.3, 0, 1.0), (0.38, 0, 1.12)]
oc = curve_tube("d_outlet", OUT, 0.022, M["pipe_yellow"], res=10); oc.parent = INT
fpipe = curve_tube("d_filter_to_meter", [(x_, 0, z_) for x_, z_ in rounded([(fx, fz + 0.12), (fx, mz + 0.17), (mx - 0.1, mz + 0.17), (mx - 0.1, mz + 0.07)], 0.04)], 0.02, M["pipe_yellow"], res=0); fpipe.parent = INT

for nm in ("d_filter", "d_meter_block", "d_meter_cyl-1", "d_meter_cyl1"):
    ob = bpy.data.objects[nm]
    if nm.startswith("d_meter"): boolean(ob, mbore)
    boolean(ob, cut_d)
for nm in ("d_inlet", "d_outlet", "d_filter_to_meter"):
    ob = to_mesh(bpy.data.objects[nm]); boolean(ob, cut_d)

# ============================================================================= car (hatchback)
CX, CY = G.CAR
CAR = empty("car", (CX, CY, 0))
ST = [(-1.92, 1.40, 0.40, 0.64), (-1.84, 1.58, 0.30, 0.76), (-1.5, 1.65, 0.27, 0.84), (-0.9, 1.68, 0.26, 0.93),
      (-0.3, 1.69, 0.26, 0.96), (0.5, 1.69, 0.26, 0.98), (1.25, 1.68, 0.27, 1.0), (1.7, 1.62, 0.31, 0.99), (1.87, 1.52, 0.4, 0.95), (1.93, 1.40, 0.5, 0.88)]
secs = [rrect(w_, zt - zb, 0.16, 3, 0.0, (zb + zt) / 2, y) for y, w_, zb, zt in ST]
body = loft("car_body", secs, M["car_paint"], parent=CAR)
subsurf(body, 2)
apply_mods(body)
GH = [(-0.95, 1.52, 0.93, 0.95), (-0.25, 1.30, 0.96, 1.46), (0.5, 1.27, 0.98, 1.5), (1.3, 1.25, 1.0, 1.48), (1.72, 1.36, 0.99, 1.08)]
gsecs = [rrect(w_, zt - zb, 0.1, 3, 0.0, (zb + zt) / 2, y) for y, w_, zb, zt in GH]
gh = loft("car_glass", gsecs, M["glass_dark"], parent=CAR)
subsurf(gh, 2); apply_mods(gh)
roof = loft("car_roof", [rrect(w_ - 0.06, 0.06, 0.03, 2, 0.0, zt - 0.01, y) for y, w_, zb, zt in GH[1:4]], M["car_paint"], parent=CAR)
subsurf(roof, 1)
# pillars
for s in (-1, 1):
    box(f"car_bpillar{s}", (0.03, 0.12, 0.5), (s * 0.66, 0.45, 1.22), M["car_dark"], parent=CAR, rot=(0, s * 0.12, 0))
# wheel arches + wheels
WH = [(-1.2, 0.29), (1.22, 0.29)]
for wy, wr in WH:
    for s in (-1, 1):
        ac = cyl(f"arch_cut{wy}{s}", wr + 0.06, 0.5, (CX + s * 0.8, CY + wy, wr + 0.02), M["car_dark"], c="cutters", rot=(0, PI / 2, 0))
        boolean(body, ac)
WHEELS = []
for wy, wr in WH:
    for s in (-1, 1):
        g = empty(f"wheel{wy}{s}", (s * 0.70, wy, wr), parent=CAR)
        tyre = lathe(f"tyre{wy}{s}", [(wr - 0.09, -0.085), (wr - 0.02, -0.088), (wr, -0.07), (wr + 0.004, 0.0), (wr, 0.07), (wr - 0.02, 0.088), (wr - 0.09, 0.085)],
                     M["tyre"], parent=g, rot=(0, PI / 2, 0))
        rim = lathe(f"rim{wy}{s}", [(0.0001, s * 0.07), (0.06, s * 0.07), (0.17, s * 0.06), (0.2, s * 0.05), (0.2, -s * 0.05)], M["alu"], parent=g, rot=(0, PI / 2, 0))
        cyl(f"well{wy}{s}", wr + 0.05, 0.3, (-s * 0.08, 0, 0.02), M["car_dark"], parent=g, rot=(0, PI / 2, 0))
        WHEELS.append(g.name)
# lights, grille, bumpers, mirrors, handles
for s in (-1, 1):
    hl = box(f"car_headlight{s}", (0.36, 0.08, 0.12), (s * 0.5, -1.86, 0.72), M["head"], parent=CAR, bevel=0.03, rot=(0.25, 0, -s * 0.15))
    tl = box(f"car_tail{s}", (0.2, 0.06, 0.24), (s * 0.66, 1.9, 0.85), M["tail"], parent=CAR, bevel=0.02)
    box(f"car_mirror{s}", (0.14, 0.06, 0.09), (s * 0.85, -0.85, 1.0), M["car_paint"], parent=CAR, bevel=0.02)
    box(f"car_handle{s}a", (0.012, 0.14, 0.025), (s * 0.85, -0.25, 0.9), M["car_dark"], parent=CAR, bevel=0.005)
    box(f"car_handle{s}b", (0.012, 0.14, 0.025), (s * 0.84, 0.7, 0.92), M["car_dark"], parent=CAR, bevel=0.005)
box("car_grille", (0.9, 0.05, 0.16), (0, -1.9, 0.52), M["car_dark"], parent=CAR, bevel=0.02)
box("car_bumper_f", (1.45, 0.12, 0.2), (0, -1.85, 0.4), M["car_dark"], parent=CAR, bevel=0.04)
box("car_bumper_r", (1.45, 0.12, 0.2), (0, 1.88, 0.45), M["car_dark"], parent=CAR, bevel=0.04)
box("car_plate_f", (0.5, 0.01, 0.12), (0, -1.94, 0.45), mat("plate", "#f2f2f2", 0.4), parent=CAR)
box("car_plate_r", (0.5, 0.01, 0.12), (0, 1.95, 0.6), mat("plate", "#f2f2f2", 0.4), parent=CAR)
# fuel filler on the left side (towards the dispenser, -x) near the rear
FIL = V((-0.845, 1.22, 0.86))      # car-local centre of the filler opening on the body surface
FIL_N = V((-1, 0, 0))
cupc = cyl("filler_cupcut", 0.075, 0.2, (CX + FIL.x, CY + FIL.y, FIL.z), M["car_dark"], c="cutters", rot=(0, PI / 2, 0))
boolean(body, cupc)
cup = lathe("filler_cup", [(0.073, 0.0), (0.073, -0.06), (0.05, -0.065), (0.033, -0.065)], mat("cup", "#1c1d20", 0.5), parent=CAR,
            loc=FIL + V((0.0, 0, 0)), rot=(0, -PI / 2, 0))
# filler neck: a pipe from the cup going inwards and down
NECK_DIR = V((0.6, 0.0, -0.8)).normalized()
neck = curve_tube("filler_neck", [tuple(FIL + V((0.06, 0, 0))), tuple(FIL + V((0.06, 0, 0)) + NECK_DIR * 0.35)], 0.03, mat("neckm", "#2c2f33", 0.4, 0.8), res=0)
neck.parent = CAR; neck.data.use_fill_caps = False
ring = lathe("filler_ring", [(0.03, 0.0), (0.036, 0.0), (0.036, -0.006), (0.03, -0.006)], M["chrome"], parent=CAR, loc=FIL + V((0.062, 0, 0)), rot=(0, -PI / 2, 0), close=True)
flap = empty("filler_flap", FIL + V((-0.005, -0.075, 0)), parent=CAR)
fl = cyl("filler_flapdisc", 0.07, 0.006, (0, 0.075, 0), M["car_paint"], parent=flap, rot=(0, PI / 2, 0))
flap.rotation_euler = (0, 0, -1.9)

# ============================================================================= tanker
TK = empty("tanker", (-8.2, 3.3, 0))
# chassis
box("tk_frame", (9.0, 0.9, 0.22), (0, 0, 0.75), M["car_dark"], parent=TK, bevel=0.01)
# cab at -x end
box("tk_cab", (2.0, 2.4, 2.1), (-4.4, 0, 1.75), M["tanker_white"], parent=TK, bevel=0.12)
box("tk_cab_lower", (2.05, 2.45, 0.6), (-4.4, 0, 0.95), M["red"], parent=TK, bevel=0.05)
box("tk_windscreen", (0.05, 2.1, 0.9), (-5.41, 0, 2.15), M["glass_dark"], parent=TK, bevel=0.04)
for s in (-1, 1):
    box(f"tk_sidewin{s}", (0.9, 0.04, 0.7), (-4.6, s * 1.21, 2.15), M["glass_dark"], parent=TK, bevel=0.02)
    box(f"tk_mirror{s}", (0.08, 0.1, 0.4), (-5.3, s * 1.4, 2.1), M["car_dark"], parent=TK)
box("tk_grille", (0.04, 1.4, 0.5), (-5.42, 0, 1.2), M["car_dark"], parent=TK)
box("tk_bumper", (0.2, 2.4, 0.3), (-5.45, 0, 0.6), M["grey_panel"], parent=TK, bevel=0.03)
for s in (-1, 1):
    box(f"tk_lamp{s}", (0.04, 0.3, 0.16), (-5.43, s * 0.9, 0.95), M["head"], parent=TK, bevel=0.02)
# barrel: elliptical loft along x
bsecs = []
for i, (x, k) in enumerate([(-3.3, 0.86), (-3.25, 0.97), (-3.1, 1.0), (3.6, 1.0), (3.75, 0.97), (3.8, 0.86)]):
    ring_pts = []
    for j in range(48):
        a = 2 * PI * j / 48
        ring_pts.append((x, 1.22 * k * math.cos(a), 2.15 + 0.95 * k * math.sin(a)))
    bsecs.append(ring_pts)
loft("tk_barrel", bsecs, M["tanker_barrel"], parent=TK)
for x in (-1.6, 0.25, 2.1):
    lathe(f"tk_band{x}", [(0.0, -0.04), (1.0, -0.04), (1.0, 0.04), (0.0, 0.04)], M["red"], parent=TK, loc=(x, 0, 2.15), rot=(0, PI / 2, 0), segs=48).scale = (0.96, 1.26, 1)
box("tk_walkway", (6.6, 0.6, 0.05), (0.25, 0, 3.12), M["galv"], parent=TK)
for x in (-2.5, -0.6, 1.3, 3.0):
    cyl(f"tk_manlid{x}", 0.25, 0.08, (x, 0, 3.12), M["galv"], parent=TK)
# rear: valve cabinet and discharge outlet towards the station
box("tk_rearbox", (0.5, 2.0, 0.6), (3.9, 0, 0.95), M["galv"], parent=TK, bevel=0.02)
cyl("tk_outlet", 0.05, 0.4, (4.05, -0.9, 0.85), M["copper"], parent=TK, rot=(PI / 2, 0, 0))
for wx in (-4.2, 1.6, 2.9):
    for s in (-1, 1):
        g = empty(f"tk_wheel{wx}{s}", (wx, s * 1.0, 0.5), parent=TK)
        lathe(f"tk_tyre{wx}{s}", [(0.32, -0.15), (0.48, -0.16), (0.5, 0), (0.48, 0.16), (0.32, 0.15)], M["tyre"], parent=g, rot=(PI / 2, 0, 0))
        lathe(f"tk_rim{wx}{s}", [(0.0001, 0.12), (0.3, 0.12), (0.3, -0.12)], M["galv"], parent=g, rot=(PI / 2, 0, 0))
# delivery hose from the tanker outlet to the fill point coupling
TH = curve_tube("tanker_hose", [(-4.15, 2.4, 0.85), (-3.6, 1.6, 0.35), (-3.0, 0.7, 0.12), (G.FILL_X, 0.0, 0.32), (G.FILL_X, 0.0, 0.12)], 0.05, M["hose"], res=16)
cpl = cyl("tk_coupling", 0.075, 0.12, (G.FILL_X, 0, 0.06), M["copper"])
cyl("tk_coupling_lever", 0.01, 0.25, (G.FILL_X + 0.08, 0, 0.12), M["copper"], rot=(0, 0.5, 0))
for k in range(2):
    box(f"tk_cone{k}", (0.3, 0.3, 0.02), (-2.0 + k * 1.2, -1.5, 0.01), mat("cone", "#ff6a10", 0.5))
    cyl(f"tk_conet{k}", 0.13, 0.5, (-2.0 + k * 1.2, -1.5, 0.27), mat("cone", "#ff6a10", 0.5), r2=0.02)

# ============================================================================= nozzle (exterior) + hose
# local frame = section rig frame: X right, Z up, spout along -Z from J = (0,0,0)
NZ = empty("nozzle")
def bodypt(u, v, y=0.0):
    x, z = G.B(u, v)
    return (x, y, z)
# body loft along the body axis (rounded sections)
bsec = []
for u, hv, wv, cv in [(-0.215, 0.022, 0.034, 0.0), (-0.2, 0.03, 0.042, 0.0), (-0.14, 0.036, 0.05, 0.0), (-0.06, 0.04, 0.056, 0.002),
                      (-0.01, 0.034, 0.05, 0.0), (0.016, 0.022, 0.04, -0.004)]:
    ring_pts = []
    for j in range(24):
        a = 2 * PI * j / 24
        ca, sa = math.cos(a), math.sin(a)
        # superellipse section (v, y)
        vv = hv * math.copysign(abs(sa) ** 0.7, sa) + cv
        yy = wv / 2 * math.copysign(abs(ca) ** 0.7, ca)
        ring_pts.append(bodypt(u, vv, yy))
    bsec.append(ring_pts)
nb = loft("nz_body", bsec, M["alu"], parent=NZ)
subsurf(nb, 1)
# rubber grip over the rear half
gsec = []
for u, hv, wv in [(-0.212, 0.026, 0.04), (-0.19, 0.034, 0.048), (-0.12, 0.04, 0.056), (-0.1, 0.04, 0.056)]:
    ring_pts = []
    for j in range(24):
        a = 2 * PI * j / 24
        ca, sa = math.cos(a), math.sin(a)
        ring_pts.append(bodypt(u, hv * math.copysign(abs(sa) ** 0.7, sa), wv / 2 * math.copysign(abs(ca) ** 0.7, ca)))
    gsec.append(ring_pts)
gr = loft("nz_grip", gsec, M["rubber"], parent=NZ); subsurf(gr, 1)
# swivel + hose ferrule at the rear
ru, rv = G.B(-0.235, 0.0)
sw = cyl("nz_swivel", 0.02, 0.05, (ru, 0, rv), M["alu"], parent=NZ, rot=(0, -(PI / 2 - G.A), 0))
# spout: lathe tube (outer/inner walls) with the sensing port drilled near the tip
spout = lathe("nz_spout", [(G.SP_RI, -G.SP_L), (G.SP_RO, -G.SP_L), (G.SP_RO, -0.03), (0.0145, -0.026), (0.0145, 0.004), (G.SP_RI, 0.004)],
              M["steel"], parent=NZ, close=True, segs=64)
port_cut = cyl("port_cut", G.PORT_R, 0.03, (0, 0, 0), M["car_dark"], c="cutters", rot=(0, PI / 2, 0))
port_cut.location = (NZ.location.x - 0.012, 0, G.PORT_Z)
boolean(spout, port_cut)
# spring retainer coil on the spout
coil = []
for i in range(120):
    a = i / 120 * 2 * PI * 5
    coil.append((0.0128 * math.cos(a), 0.0128 * math.sin(a), -0.04 - 0.03 * i / 120))
curve_tube("nz_coil", coil, 0.0012, M["spring"], res=0, parent=NZ)
# lever under the body, guard around it
LEV_PIV = G.B(-0.036, -0.075)      # front pivot on the latch stem (closed / open state shifts it)
lev = empty("nz_lever_pivot", (LEV_PIV[0], 0, LEV_PIV[1]), parent=NZ)
lu = [(0.0, 0.0), (-0.04, 0.012), (-0.09, 0.022), (-0.14, 0.025)]
lpts = []
for u, v in lu:
    x, z = (u * G.EU[0] + v * G.EV[0], u * G.EU[1] + v * G.EV[1])
    lpts.append((x, 0, z))
lv = curve_tube("nz_lever", lpts, 0.007, M["lever"], res=6, parent=lev)
lv.data.bevel_resolution = 4
lv.scale = (1, 2.2, 1)
gpts = [bodypt(-0.205, -0.02), bodypt(-0.2, -0.085), bodypt(-0.12, -0.105), bodypt(-0.04, -0.1), bodypt(-0.005, -0.045)]
curve_tube("nz_guard", gpts, 0.0055, M["guard"], res=10, parent=NZ)
# hose (rebuilt per frame by anim.py): a bezier from the dispenser outlet to the nozzle swivel
HOSE = curve_tube("hose", [(0, 0, i * 0.01) for i in range(40)], 0.016, M["hose"], res=0, bevel_res=6)

# ============================================================================= gloved hand + sleeve
HAND = empty("hand")
palm = box("hand_palm", (0.085, 0.03, 0.095), (0, 0, 0), M["glove"], parent=HAND, bevel=0.012, segs=3)
subsurf(palm, 2)
cuff = cyl("hand_cuff", 0.042, 0.06, (0, 0, -0.07), M["glove"], parent=HAND)
slv = cyl("hand_sleeve", 0.055, 0.35, (0, 0, -0.27), M["sleeve"], parent=HAND)
FINGERS = []
for i, (fx_, L) in enumerate([(-0.03, (0.045, 0.028, 0.022)), (-0.01, (0.05, 0.032, 0.024)), (0.01, (0.048, 0.03, 0.022)), (0.03, (0.04, 0.024, 0.02))]):
    base = empty(f"finger{i}_0", (fx_, 0.0, 0.05), parent=HAND)
    prev = base
    segs = [base.name]
    for k, l in enumerate(L):
        r = 0.0095 - k * 0.0008
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=(0, 0, 0)); s = bpy.context.object
        s.name = f"finger{i}_s{k}"; s.data.materials.append(M["glove"]); bpy.ops.object.shade_smooth()
        bpy.context.scene.collection.objects.unlink(s); link(s); s.parent = prev
        c_ = cyl(f"finger{i}_c{k}", r, l, (0, 0, l / 2), M["glove"], parent=prev)
        nxt = empty(f"finger{i}_{k + 1}", (0, 0, l), parent=prev)
        segs.append(nxt.name); prev = nxt
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.008, location=(0, 0, 0)); s = bpy.context.object
    s.name = f"finger{i}_tip"; s.data.materials.append(M["glove"]); bpy.ops.object.shade_smooth()
    bpy.context.scene.collection.objects.unlink(s); link(s); s.parent = prev
    FINGERS.append(segs)
th0 = empty("thumb_0", (-0.045, 0.0, 0.0), parent=HAND, rot=(0, -0.9, 0))
cyl("thumb_c0", 0.011, 0.045, (0, 0, 0.022), M["glove"], parent=th0)
th1 = empty("thumb_1", (0, 0, 0.045), parent=th0, rot=(0, 0.3, 0))
cyl("thumb_c1", 0.01, 0.035, (0, 0, 0.017), M["glove"], parent=th1)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.01, location=(0, 0, 0.035)); s = bpy.context.object
s.name = "thumb_tip"; s.data.materials.append(M["glove"]); bpy.ops.object.shade_smooth()
bpy.context.scene.collection.objects.unlink(s); link(s); s.parent = th1
HAND.location = (0, 0, -50)

# ============================================================================= nozzle macro section rig
RO = V(G.RIG_ORIGIN)
RIG = empty("rig", RO, rot=(PI / 2, 0, 0))      # rig local XY -> world XZ, local +Z -> world -Y
FRONT = 0.009     # thickness of the cut layer (cavities read as grooves), back layer behind it
def rig_shape(name, geom, z_front, depth, m, bevel=0.0):
    polys = []
    for ext, holes in G.polys_of(geom):
        polys.append(ext); polys += holes
    if not polys: return None
    ob = curve2d(name, polys, depth / 2, m, parent=RIG, bevel=bevel)
    ob.location = (0, 0, -(z_front + depth / 2))   # local -Z = world +Y (away from camera)
    return ob
hous = G.housing_cut()
rig_shape("rig_housing", hous, 0.0, FRONT, M["housing_cut"], bevel=0.0004)
rig_shape("rig_back", G.housing_outline().union(G.tube_wall()), FRONT, 0.025, M["housing_in"])
rig_shape("rig_neck", G.neck_walls(), 0.0, 0.02, M["neck_cut"], bevel=0.0003)
rig_shape("rig_neck_back", sbox(-G.NECK_RI - G.NECK_WALL, G.NECK_BOT, G.NECK_RI + G.NECK_WALL, G.NECK_TOP), 0.02, 0.004, mat("neck_in", "#3a3e44", 0.5, 0.7))
# fuel inside the passages (static) and neck (rebuilt per frame)
pf = G.main_cavities().intersection(G.housing_outline().buffer(0.02))
rig_shape("rig_fuel_passages", pf, 0.0015, FRONT - 0.002, M["petrol_flat"])
rig_neck_fuel = bpy.data.objects.new("rig_neck_fuel", bpy.data.curves.new("rig_neck_fuel", "CURVE")); link(rig_neck_fuel)
rig_neck_fuel.parent = RIG
# moving parts as 2D shapes in the rig (local origin each so anim can move them)
def rig_part(name, geom, depth, m, z_front=0.0012, bevel=0.0003):
    return rig_shape(name, geom, z_front, depth, m, bevel)
pop = Polygon([G.B(G.SEAT_U[0] - 0.004, 0.0045), G.B(G.SEAT_U[1] + 0.004, 0.0045), G.B(G.SEAT_U[1] + 0.002, 0.0085), G.B(G.SEAT_U[0] - 0.002, 0.0085)])
stem = Polygon([G.B(G.STEM_U - 0.0011, -0.052), G.B(G.STEM_U + 0.0011, -0.052), G.B(G.STEM_U + 0.0011, 0.005), G.B(G.STEM_U - 0.0011, 0.005)])
rig_part("rig_poppet", pop.union(stem), FRONT * 0.7, M["alu"])
rig_part("rig_seal", Polygon([G.B(G.SEAT_U[0] - 0.002, 0.0038), G.B(G.SEAT_U[1] + 0.002, 0.0038), G.B(G.SEAT_U[1] + 0.002, 0.0048), G.B(G.SEAT_U[0] - 0.002, 0.0048)]), FRONT * 0.7, M["rubber"])
# spring above the poppet: a 3D helix (rebuilt per frame for compression)
rig_spring = curve_tube("rig_spring", [(0, 0, 0)] * 40, 0.0011, M["spring"], res=0, parent=RIG)
# diaphragm: thin flexible strip (rebuilt per frame), plunger + latch balls + latch stem
rig_diaphragm = bpy.data.objects.new("rig_diaphragm", bpy.data.curves.new("rig_diaphragm", "CURVE")); link(rig_diaphragm); rig_diaphragm.parent = RIG
rig_diaphragm.data.materials.append(M["diaphragm"])
rig_chamber_low = rig_part("rig_chamber_low", G.round_poly(G.brect(G.CH_U[0], G.CH_U[1], G.CH_V[0], G.CH_V[1]), 0.004), 0.002, M["chamber_low"], z_front=0.004)
pl = G.brect(-0.0368, -0.0332, G.CH_V[0] - 0.026, G.CH_V[0] + 0.004)
rig_part("rig_plunger", pl, FRONT * 0.7, M["steel"])
# latch sleeve (fixed, below the chamber) and latch stem (drops on release)
sleeve = G.brect(-0.046, -0.024, G.CH_V[0] - 0.034, G.CH_V[0] - 0.012).difference(G.brect(-0.039, -0.031, G.CH_V[0] - 0.04, G.CH_V[0] - 0.01))
rig_part("rig_latch_sleeve", sleeve, FRONT, M["cast"], z_front=0.0005)
rig_part("rig_latch_stem", G.brect(-0.0385, -0.0315, G.CH_V[0] - 0.052, G.CH_V[0] - 0.024), FRONT * 0.6, M["steel"], z_front=0.0016)
BALLS = []
for s in (-1, 1):
    cx, cz = G.B(-0.035 + s * 0.0052, G.CH_V[0] - 0.02)
    b_ = rig_part(f"rig_ball{s}", Point(cx, cz).buffer(0.0026, 24), FRONT * 0.5, M["chrome"], z_front=0.0018)
    BALLS.append(b_.name)
# lever in the section view (3D bar under the body), pivoting on the latch stem bottom
rlev = empty("rig_lever_pivot", (0, 0, 0), parent=RIG)
LP0 = G.B(-0.035, G.CH_V[0] - 0.05)
rlev.location = (LP0[0], LP0[1], -0.004)
lever2d = []
for u, v in [(0.0, 0.0), (-0.03, 0.006), (-0.06, 0.016), (-0.1, 0.02), (-0.15, 0.018)]:
    lever2d.append((u * G.EU[0] + v * G.EV[0], u * G.EU[1] + v * G.EV[1]))
from shapely.geometry import LineString
lgeom = LineString(lever2d).buffer(0.0045)
lob = rig_shape("rig_lever", lgeom, 0.0, 0.012, M["lever"], bevel=0.0015)
lob.parent = rlev; lob.location = (0, 0, -0.006)
hin = [G.B(-0.21, -0.005), G.B(-0.26, -0.005), G.B(-0.33, 0.01), G.B(-0.42, 0.04)]
rh = curve_tube("rig_hose", [(x_, z_, -0.012) for x_, z_ in hin], 0.0155, M["hose"], res=0, bevel_res=6, parent=RIG)
rf = curve_tube("rig_ferrule", [(x_, z_, -0.012) for x_, z_ in hin[:2]], 0.0175, M["alu"], res=0, bevel_res=6, parent=RIG)
# rig backdrop: the car body panel behind, softly lit
bd = box("rig_backdrop", (1.2, 0.02, 1.2), (RO.x, 0.25, RO.z - 0.1), M["backdrop"])
area_light("rig_key", (RO.x - 0.25, -0.5, RO.z + 0.25), look_rot((RO.x - 0.25, -0.5, RO.z + 0.25), (RO.x, 0, RO.z - 0.06)), 0.6, 7, "#fff4e6")
area_light("rig_fill", (RO.x + 0.35, -0.4, RO.z - 0.2), look_rot((RO.x + 0.35, -0.4, RO.z - 0.2), (RO.x, 0, RO.z - 0.06)), 0.6, 3, "#d8e6ff")
area_light("rig_rim", (RO.x, 0.2, RO.z + 0.4), look_rot((RO.x, 0.2, RO.z + 0.4), (RO.x, 0, RO.z)), 0.4, 2, "#ffffff")

# ============================================================================= tracers (particle meshes, rebuilt per frame)
for nm, strength in (("P_fuel", 2.5), ("P_air", 2.0), ("P_signal", 6.0), ("P_rig_fuel", 1.6), ("P_rig_air", 1.6)):
    me = bpy.data.meshes.new(nm); ob = bpy.data.objects.new(nm, me); link(ob, "fx")
    me.materials.append(mat_vcol_emit("tracer_" + nm, strength))

# ============================================================================= section lighting rig (follows the camera in section shots)
area_light("sec_key", (0, -6, 2), (1.3, 0, 0), 6, 900, "#fff2e2")
area_light("sec_fill", (0, -6, -2), (1.7, 0, 0), 6, 500, "#dfe9ff")
area_light("meter_key", (DX - 0.6, -1.6, 1.4), look_rot((DX - 0.6, -1.6, 1.4), (DX, 0, 0.9)), 1.0, 80, "#fff4e8")
area_light("nozzle_key", (0, 0, -50), (0, 0, 0), 0.5, 40, "#fff0dd")
point_light("spot_pool", (0, 0, -50), 0.0, "#ffd9a8", 0.03)

# ============================================================================= camera + render settings
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); link(cam); sc.camera = cam
cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 24; cam_d.clip_start = 0.005; cam_d.clip_end = 300
r = sc.render
r.engine = "CYCLES"; r.resolution_x = 648; r.resolution_y = 1152; r.fps = 30
sc.cycles.device = "CPU"; sc.cycles.samples = 8; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.06
sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 1; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 3
sc.cycles.transparent_max_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.cycles.sample_clamp_indirect = 4.0
r.use_persistent_data = True
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
sc.view_settings.exposure = 0.0
r.image_settings.file_format = "JPEG"; r.image_settings.quality = 95
# hide cutters
c = bpy.data.collections.get("cutters")
if c:
    c.hide_render = True; c.hide_viewport = True
    for o in c.objects: o.hide_render = True; o.hide_viewport = True

out = os.path.join(ROOT, "petrol_ka_safar.blend")
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print("saved", out, len(bpy.data.objects), "objects")
