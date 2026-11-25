#!/usr/bin/env python3
"""Build atm_ke_andar.blend: an ATM lobby (Poly Haven CC0 HDRI, PBR textures and props) plus five
cutaway sets, each at its own spot in the world:
    A lobby (0,0,0)    B card reader RB    C PIN pad RC    D network + bank RD
    E safe / dispenser RE    F deposit-machine note scanner RF
Run:  /home/user/bpyenv/bin/python tools/build.py
"""
import math, os, sys, random, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector as V, Matrix
from lib import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(ROOT, "assets/tex"); PH = os.path.join(ROOT, "assets/ph")
PI = math.pi
RB, RC, RD, RE, RF = V((20, 0, 1)), V((40, 0, 1)), V((60, 0, 0)), V((80, 0, 1)), V((100, 0, 1))
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


# ============================================================================= materials
def img(path):
    return bpy.data.images.load(path, check_existing=True)


def mat_img(name, path, rough=0.4, metal=0.0, alpha=False, emit=0.0, coat=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.name = "img"; t.image = img(path)
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    if alpha: nt.links.new(t.outputs["Alpha"], p.inputs["Alpha"])
    if emit:
        nt.links.new(t.outputs["Color"], p.inputs["Emission Color"]); p.inputs["Emission Strength"].default_value = emit
    p.inputs["Roughness"].default_value = rough; p.inputs["Metallic"].default_value = metal
    if coat: p.inputs["Coat Weight"].default_value = coat
    return m


def mat_screen(name, path, strength=1.6):
    m = bpy.data.materials.new(name); nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.name = "img"; t.image = img(path)
    p.inputs["Base Color"].default_value = (0, 0, 0, 1); p.inputs["Roughness"].default_value = 0.08
    p.inputs["Coat Weight"].default_value = 0.6
    nt.links.new(t.outputs["Color"], p.inputs["Emission Color"]); p.inputs["Emission Strength"].default_value = strength
    return m


def mat_note(name, path, uvpath=None):
    """Banknote paper. An optional UV-fluorescence mask is added as emission (strength driven in anim)."""
    m = bpy.data.materials.new(name); nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = img(path)
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = 0.62; p.inputs["Specular IOR Level"].default_value = 0.3
    if uvpath:
        u = nt.nodes.new("ShaderNodeTexImage"); u.image = img(uvpath)
        nt.links.new(u.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 0.0
    return m


def mat_pbr(name, tex, scale=1.0, rot=(0, 0, 0), tint=None, rough_mul=1.0, metal=0.0):
    """Poly Haven PBR set (diffuse / rough / GL normal), projected by object coordinates."""
    m = bpy.data.materials.new(name); nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale); mp.inputs["Rotation"].default_value = rot
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    d = os.path.join(PH, "tex", tex, tex)
    def tx(k, non_color=False):
        n = nt.nodes.new("ShaderNodeTexImage"); n.image = img(f"{d}_{k}.jpg")
        if non_color: n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"]); return n
    dif = tx("Diffuse")
    if tint:
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs[0].default_value = 1
        nt.links.new(dif.outputs["Color"], mx.inputs[6]); mx.inputs[7].default_value = hexc(tint)
        nt.links.new(mx.outputs[2], p.inputs["Base Color"])
    else:
        nt.links.new(dif.outputs["Color"], p.inputs["Base Color"])
    r = tx("Rough", True)
    mr = nt.nodes.new("ShaderNodeMath"); mr.operation = "MULTIPLY"; mr.inputs[1].default_value = rough_mul
    nt.links.new(r.outputs["Color"], mr.inputs[0]); nt.links.new(mr.outputs[0], p.inputs["Roughness"])
    n = tx("nor_gl", True); nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.6
    nt.links.new(n.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    p.inputs["Metallic"].default_value = metal
    return m


def mat_beam(name, color, strength):
    """Light sheet: emission mixed with transparency (strength node named 'em')."""
    m = bpy.data.materials.new(name); nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission"); e.name = "em"; e.inputs["Color"].default_value = hexc(color); e.inputs["Strength"].default_value = strength
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    ad = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(e.outputs[0], ad.inputs[0]); nt.links.new(tr.outputs[0], ad.inputs[1])
    nt.links.new(ad.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    return m


def mat_glow(name, color, strength):
    """Emission material whose colour/strength anim changes (node 'em')."""
    if bpy.data.materials.get(name): return bpy.data.materials[name]
    m = mat_emit(name, color, strength); m.node_tree.nodes["Emission"].name = "em"
    return m


M = dict(
    paint=mat_noise_color("atm_paint", "#2a2e35", "#33373f", scale=30, rough=0.42, bump=0.05),
    paint_lt=mat_noise_color("atm_paint_lt", "#c8ccd2", "#d4d8dd", scale=30, rough=0.38, bump=0.04),
    steel=mat_brushed("steel", "#c9cdd2", 0.26),
    steel_dk=mat_brushed("steel_dk", "#8d9299", 0.3),
    chrome=mat("chrome", "#e6e8ea", 0.08, 1.0),
    black=mat("black_plastic", "#0c0d0f", 0.45),
    rubber=mat_noise_color("rubber", "#121212", "#1b1b1b", scale=200, rough=0.85, bump=0.1),
    dark=mat("dark_recess", "#050506", 0.6),
    glass=mat("glass", "#ffffff", 0.02, 0.0, transm=1.0, ior=1.5),
    green_bezel=mat("green_bezel", "#1fd46b", 0.25, emit="#2bff86", estr=1.5, transm=0.3),
    gold=mat("gold", "#e3b552", 0.22, 1.0),
    pcb=mat_noise_color("pcb", "#0d4a2a", "#0f5a33", scale=60, rough=0.35, bump=0.05),
    copper=mat("copper", "#c9773f", 0.25, 1.0),
    wall=mat_pbr("wall", "painted_plaster_wall", 0.8, rot=(PI / 2, 0, 0), tint="#e9e4dc"),
    wall_side=mat_pbr("wall_side", "painted_plaster_wall", 0.8, rot=(PI / 2, 0, PI / 2), tint="#e9e4dc"),
    floor=mat_pbr("floor", "marble_tiles", 0.7, rough_mul=0.5),
    ground=mat_pbr("ground", "granite_tile_02", 0.35, tint="#3a4150", rough_mul=0.6),
    safe=mat_cutface("safe_steel", "#30353b", "#4d535b", rough=0.55, metal=0.2, cap_dir=(0, -1, 0)),
    housing=mat_cutface("housing", "#2b2f36", "#9aa3ad", rough=0.4, metal=0.0, cap_dir=(0, 0, 1)),
    tray=mat("tray", "#4a6fa5", 0.4, 0.3),
    ceiling=mat("ceiling", "#eceae6", 0.8),
    led_g=mat_glow("led_green", "#33ff88", 6), led_r=mat_glow("led_red", "#ff3333", 0),
)
M["note"] = mat_note("note_real", f"{TEX}/note_real.png", f"{TEX}/note_uv.png")
M["note_fake"] = mat_note("note_fake", f"{TEX}/note_fake.png")
M["note_edge"] = mat("note_edge", "#b7a6bd", 0.8)
M["card"] = mat_img("card", f"{TEX}/card.png", 0.3, alpha=True, coat=0.5)
M["card_back"] = mat("card_back", "#e8e8e8", 0.4)
M["screen"] = mat_screen("atm_screen", f"{TEX}/scr_insert.png", 1.8)
for k in ("scr_insert", "scr_pin", "scr_wait", "scr_ok"): img(f"{TEX}/{k}.png").use_fake_user = True
M["fascia"] = mat_img("fascia", f"{TEX}/fascia.png", 0.3, emit=2.2)
M["bank_sign"] = mat_img("bank_sign", f"{TEX}/bank_sign.png", 0.4, emit=1.5)
M["reject"] = mat_img("reject_lbl", f"{TEX}/reject.png", 0.5)
M["cass"] = mat_img("cass_lbl", f"{TEX}/cass.png", 0.5)
M["secure"] = mat_img("secure_lbl", f"{TEX}/secure.png", 0.4, emit=0.4)


def plane(name, w, h, m, loc, rot=(0, 0, 0), c="world", parent=None):
    """UV-mapped rectangle in local XY (u along X)."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new()
    vs = [bm.verts.new((x * w / 2, y * h / 2, 0)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    f = bm.faces.new(vs)
    for l, (u, v) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uv].uv = (u, v)
    ob = mesh_obj(name, bm, [m], c, parent=parent); ob.location = loc; ob.rotation_euler = rot
    return ob


def sheet(name, w, h, th, m, m_edge, c, loc=(0, 0, 0), rot=(0, 0, 0)):
    """Note / card: textured plane given thickness with solidify (rim gets the edge material)."""
    ob = plane(name, w, h, m, loc, rot, c)
    ob.data.materials.append(m_edge)
    s = ob.modifiers.new("sol", "SOLIDIFY"); s.thickness = th; s.offset = 0; s.material_offset_rim = 1
    return ob


def text(name, body, size, loc, m, c, rot=(0, 0, 0), parent=None, align="CENTER"):
    cu = bpy.data.curves.new(name, "FONT"); cu.body = body; cu.size = size; cu.align_x = align; cu.align_y = "CENTER"
    cu.extrude = size * 0.03
    ob = bpy.data.objects.new(name, cu); link(ob, c); ob.location = loc; ob.rotation_euler = rot
    cu.materials.append(m)
    if parent: ob.parent = parent
    return ob


def append_model(name, c, loc, rot=(0, 0, 0), size=None, skip=()):
    """Append a Poly Haven model (.blend) under an empty; optional uniform scale to a target height."""
    f = glob.glob(f"{PH}/models/{name}/{name}.blend")[0]
    with bpy.data.libraries.load(f, link=False) as (src, dst):
        dst.objects = src.objects
    root = empty("ph_" + name, loc, c, rot=rot)
    obs = [o for o in dst.objects if o and not any(s in o.name for s in skip)]
    for o in obs:
        link(o, c)
        if o.parent is None or o.parent not in obs: o.parent = root
    if size:
        meshes = [o for o in obs if o.type == "MESH"]
        bpy.context.view_layer.update()
        zs = [(o.matrix_world @ V(b)).z for o in meshes for b in o.bound_box]
        root.scale = (size / (max(zs) - min(zs)),) * 3
    return root


# ============================================================================= A: lobby + ATM
CA = "setA"
box("floor", (6, 6, 0.02), (0, -1.5, -0.01), M["floor"], CA)
box("back_wall", (6, 0.1, 3.0), (0, 0.85, 1.5), M["wall"], CA)
box("wall_l", (0.1, 6, 3.0), (-1.7, -1.5, 1.5), M["wall_side"], CA)
box("wall_r", (0.1, 6, 3.0), (1.7, -1.5, 1.5), M["wall_side"], CA)
box("ceiling", (6, 6, 0.05), (0, -1.5, 2.85), M["ceiling"], CA)
box("skirting", (3.4, 0.02, 0.1), (0, 0.79, 0.05), M["steel_dk"], CA)
for i, x in enumerate((-0.9, 0.9)):
    box(f"ceil_panel{i}", (0.6, 0.6, 0.01), (x, -0.9, 2.82), mat_emit("ceil_led", "#fff6ea", 4.0), CA)
area_light("lob_ceil_l", (-0.9, -0.9, 2.78), (0, 0, 0), 0.6, 160, "#fff1df", CA)
area_light("lob_ceil_r", (0.9, -0.9, 2.78), (0, 0, 0), 0.6, 160, "#fff1df", CA)
area_light("lob_key", (-1.2, -2.0, 1.9), look_rot((-1.2, -2.0, 1.9), (0, 0.2, 1.2)), 1.2, 140, "#fff4e6", CA)
area_light("lob_hood", (0, -0.05, 1.70), (0, 0, 0), 0.6, 18, "#ffffff", CA, size_y=0.15)

atm = empty("atm", (0, 0, 0), CA)
P = dict(c=CA, parent=atm)
box("atm_plinth", (0.8, 0.8, 0.08), (0, 0.38, 0.04), M["black"], **P)
box("atm_lower", (0.76, 0.76, 0.86), (0, 0.38, 0.51), M["paint"], bevel=0.008, **P)
box("atm_upper", (0.76, 0.6, 0.68), (0, 0.46, 1.28), M["paint"], bevel=0.008, **P)
box("atm_lower_door", (0.66, 0.01, 0.74), (0, -0.006, 0.5), M["paint_lt"], bevel=0.004, **P)
box("atm_lock", (0.05, 0.02, 0.05), (0.26, -0.014, 0.62), M["chrome"], bevel=0.01, **P)
for i in range(6): box(f"atm_vent{i}", (0.4, 0.004, 0.008), (0, -0.012, 0.18 + i * 0.03), M["dark"], **P)
# keypad shelf (sloped)
box("atm_shelf", (0.72, 0.26, 0.04), (0, 0.04, 0.955), M["steel"], bevel=0.006, rot=(math.radians(12), 0, 0), **P)
# PIN pad on shelf (lobby copy, simplified keys)
kp = empty("lob_kp", (-0.06, 0.03, 0.985), rot=(math.radians(12), 0, 0), **P)
for r_ in range(4):
    for c_ in range(4):
        box(f"lob_key{r_}{c_}", (0.03, 0.025, 0.008), ((c_ - 1.5) * 0.038 + (0.02 if c_ == 3 else 0), (1.5 - r_) * 0.032, 0),
            [M["steel"], mat("key_red", "#c62828", 0.4), mat("key_yel", "#f9a825", 0.4), mat("key_grn", "#2e7d32", 0.4)][0 if c_ < 3 else 1 + min(r_, 2)],
            CA, bevel=0.003, parent=kp)
box("lob_kp_shroud", (0.22, 0.16, 0.02), (0, 0.0, 0.004), M["black"], CA, parent=kp)
# privacy wings
for s in (-1, 1):
    box(f"atm_wing{s}", (0.02, 0.24, 0.66), (s * 0.37, 0.06, 1.28), M["steel_dk"], bevel=0.006, **P)
# screen
box("atm_bezel", (0.46, 0.04, 0.36), (-0.05, 0.155, 1.33), M["black"], bevel=0.01, rot=(math.radians(-8), 0, 0), **P)
plane("atm_screen", 0.36, 0.27, M["screen"], (-0.05, 0.133, 1.335), (math.radians(82), 0, 0), CA, atm)
for s in (-1, 1):
    for i in range(4):
        box(f"atm_sbtn{s}{i}", (0.03, 0.02, 0.018), (-0.05 + s * 0.255, 0.15, 1.24 + i * 0.055), M["steel"], bevel=0.004, **P)
# card slot (right of screen) with lit green bezel
box("atm_card_bezel", (0.11, 0.05, 0.05), (0.30, 0.135, 1.30), M["green_bezel"], bevel=0.008, **P)
box("atm_card_slot", (0.07, 0.06, 0.004), (0.30, 0.13, 1.30), M["dark"], **P)
point_light("card_glow", (0.30, 0.08, 1.30), 0.6, "#3bff8c", 0.02, CA)
# cash slot below screen with shutter
box("atm_cash_frame", (0.28, 0.01, 0.06), (-0.05, 0.162, 1.075), M["steel"], bevel=0.003, **P)
box("atm_cash_hole", (0.22, 0.004, 0.03), (-0.05, 0.158, 1.075), M["dark"], **P)
box("atm_shutter", (0.222, 0.004, 0.032), (-0.05, 0.153, 1.075), M["steel_dk"], **P)
box("atm_receipt", (0.1, 0.03, 0.012), (-0.27, 0.155, 1.08), M["black"], **P)
# hood + fascia
box("atm_hood", (0.84, 0.42, 0.22), (0, 0.3, 1.73), M["paint"], bevel=0.01, **P)
plane("atm_fascia", 0.8, 0.16, M["fascia"], (0, 0.088, 1.73), (PI / 2, 0, 0), CA, atm)
box("atm_hood_lip", (0.84, 0.18, 0.02), (0, 0.0, 1.615), M["steel_dk"], **P)
# props (Poly Haven CC0 models)
append_model("potted_plant_01", CA, (-1.1, 0.35, 0), size=1.3)
append_model("metal_trash_can", CA, (0.95, 0.35, 0), size=0.6)
append_model("security_camera_01", CA, (1.35, 0.55, 2.55), rot=(0, 0, math.radians(215)), size=0.3)
# lobby card + presented cash bundle
card_l = sheet("card_l", 0.0856, 0.054, 0.0008, M["card"], M["card_back"], CA)
bundle = empty("bundle", (-0.05, 0.16, 1.075), CA)
for i in range(8):
    sheet(f"bundle_n{i}", 0.156, 0.066, 0.0003, M["note"], M["note_edge"], CA, (0, 0.0, -0.007 + i * 0.002)).parent = bundle

# ============================================================================= B: card reader (cutaway)
CB = "setB"
rb = empty("rb", RB, CB)
house = box("rb_house", (0.08, 0.14, 0.05), (0, 0.065, 0.0025), M["housing"], CB, parent=rb)
cut = box("rb_cut_chan", (0.064, 0.2, 0.004), (0, 0.06, 0), None, "cutters", parent=rb)
boolean(house, cut)
cut2 = box("rb_cut_rollers", (0.06, 0.12, 0.034), (0, 0.06, 0), None, "cutters", parent=rb)
boolean(house, cut2)
cut3 = box("rb_cut_quarter", (0.2, 0.3, 0.06), (0.0, 0.06, 0.0305), None, "cutters", parent=rb)
boolean(house, cut3)
box("rb_mouth", (0.09, 0.012, 0.03), (0.0, -0.01, 0.0), M["green_bezel"], CB, parent=rb)
mo = box("rb_mouth_cut", (0.066, 0.05, 0.004), (0, -0.01, 0), None, "cutters", parent=rb)
boolean(bpy.data.objects["rb_mouth"], mo)
rollers = []
for i, y in enumerate((0.018, 0.058, 0.098)):
    for s, z in (("lo", -0.0088), ("hi", 0.0088)):
        x0, w = 0.0, 0.05
        r = cyl(f"rb_roll_{s}{i}", 0.0083, w, (x0, y, z), M["rubber"], CB, 32, (0, PI / 2, 0), rb)
        cyl(f"rb_axle_{s}{i}", 0.0018, 0.062, (0.0, 0, 0), M["chrome"], CB, 16, (0, 0, 0), r)
        rollers.append(r.name)
        for k in range(6):
            box(f"rb_tread_{s}{i}{k}", (0.0012, 0.0012, w * 0.98), (0.0083 * math.cos(k * PI / 3), 0.0083 * math.sin(k * PI / 3), 0), M["rubber"], CB, parent=r)
# drive gears outside right wall
for i, y in enumerate((0.018, 0.058, 0.098)):
    cyl(f"rb_gear{i}", 0.011, 0.004, (0.043, y, -0.0088), M["steel"], CB, 24, (0, PI / 2, 0), rb)
cyl("rb_motor", 0.012, 0.03, (0.055, 0.12, -0.02), M["steel_dk"], CB, 32, (0, PI / 2, 0), rb)
# chip contact head (drops onto the chip)
head = empty("rb_head", (0.0105, 0.105, 0.0075), CB, parent=rb)
box("rb_head_blk", (0.016, 0.016, 0.006), (0, 0, 0.002), M["black"], CB, parent=head)
for i in range(8):
    cyl(f"rb_pin{i}", 0.0006, 0.004, ((i % 2 - 0.5) * 0.007, (i // 2 - 1.5) * 0.0032, -0.002), M["gold"], CB, 8, parent=head)
# PCB (Poly Haven circuit_board) below the reader + glowing trace to its chip
append_model("circuit_board", CB, RB + V((0.0, 0.06, -0.034))).scale = (0.25, 0.25, 0.25)
trace_pts = [RB + V(p) for p in ((0.0105, 0.105, 0.012), (0.03, 0.105, 0.016), (0.05, 0.10, 0.0), (0.05, 0.08, -0.03), (0.02, 0.07, -0.032))]
curve_tube("rb_trace", trace_pts, 0.0007, mat_glow("trace_glow", "#59d6ff", 0.0), CB, res=0)
card_r = sheet("card_r", 0.0856, 0.054, 0.0008, M["card"], M["card_back"], CB)
area_light("rb_key", RB + V((-0.25, -0.15, 0.25)), look_rot(RB + V((-0.25, -0.15, 0.25)), RB + V((0, 0.06, 0))), 0.3, 16, "#fff2e2", CB)
area_light("rb_rim", RB + V((0.2, 0.3, 0.15)), look_rot(RB + V((0.2, 0.3, 0.15)), RB + V((0, 0.06, 0))), 0.3, 10, "#cfe0ff", CB)
box("rb_floor", (2, 2, 0.01), RB + V((0, 0, -0.06)), mat("studio", "#14171c", 0.5), CB)

# ============================================================================= C: PIN pad (EPP) cutaway
CC = "setC"
rc = empty("rc", RC, CC)
box("rc_plate", (0.11, 0.1, 0.004), (0, 0, 0.0), M["steel"], CC, bevel=0.002, parent=rc)
pad_keys = {}
LAB = [["1", "2", "3", "X"], ["4", "5", "6", "<"], ["7", "8", "9", "O"], ["", "0", "", ""]]
for r_ in range(4):
    for c_ in range(4):
        x, y = (c_ - 1.5) * 0.024 + (0.004 if c_ == 3 else 0), (1.5 - r_) * 0.021
        if r_ == 3 and c_ == 3: continue
        mk = M["steel"] if c_ < 3 else [mat("key_red", "#c62828"), mat("key_yel", "#f9a825"), mat("key_grn", "#2e7d32")][min(r_, 2)]
        k = box(f"rc_key{r_}{c_}", (0.019, 0.016, 0.006), (x, y, 0.005), mk, CC, bevel=0.0018, parent=rc)
        if LAB[r_][c_]:
            text(f"rc_lab{r_}{c_}", LAB[r_][c_], 0.009, (0, -0.0005, 0.0031), mat("key_ink", "#15181c", 0.5), CC, parent=k)
        pad_keys[LAB[r_][c_] or f"b{r_}{c_}"] = k.name
        ring = box(f"rc_glow{r_}{c_}", (0.021, 0.018, 0.001), (x, y, 0.0022), mat_glow(f"kglow{r_}{c_}", "#5ab8ff", 0.0), CC, parent=rc)
# exploded layers beneath: membrane, PCB, shield can, secure chip
box("rc_membrane", (0.105, 0.095, 0.002), (0, 0, -0.024), mat("membrane", "#2d2d33", 0.6), CC, parent=rc)
box("rc_pcb", (0.105, 0.095, 0.002), (0, 0, -0.052), M["pcb"], CC, parent=rc)
for i in range(14):
    curve_tube(f"rc_tr{i}", [RC + V(p) for p in (((i - 7) * 0.007, -0.045, -0.0508), ((i - 7) * 0.007, -0.02, -0.0508),
                                                  ((i - 7) * 0.003, 0.0, -0.0508))], 0.0004, M["copper"], CC, res=0)
box("rc_can", (0.036, 0.03, 0.006), (0.0, 0.018, -0.048), M["chrome"], CC, parent=rc)
box("rc_chip", (0.022, 0.018, 0.003), (0.0, 0.018, -0.0435), mat_glow("chip_glow", "#ffcc55", 0.0), CC, parent=rc)
plane("rc_chip_lbl", 0.02, 0.0067, M["secure"], (0.0, 0.018, -0.0418), (0, 0, 0), CC, rc)
cable = [RC + V(p) for p in ((0.0, 0.035, -0.05), (0.0, 0.07, -0.056), (0.0, 0.15, -0.06), (0.0, 0.35, -0.065))]
curve_tube("rc_cable", cable, 0.003, M["black"], CC, res=12)
curve_tube("rc_cable_glow", cable, 0.0034, mat_beam("cable_glow", "#59d6ff", 0.0), CC, res=12)
area_light("rc_key", RC + V((-0.2, -0.25, 0.3)), look_rot(RC + V((-0.2, -0.25, 0.3)), RC), 0.3, 14, "#fff2e2", CC)
area_light("rc_rim", RC + V((0.25, 0.2, 0.1)), look_rot(RC + V((0.25, 0.2, 0.1)), RC), 0.3, 8, "#cfe0ff", CC)
box("rc_floor", (2, 2, 0.01), RC + V((0, 0, -0.1)), mat("studio", "#14171c", 0.5), CC)

# ============================================================================= D: network to the bank (night)
CD = "setD"
box("nd_ground", (40, 60, 0.02), RD + V((0, 15, -0.01)), M["ground"], CD)
# a small lit ATM kiosk at the start
box("nd_kiosk", (1.3, 1.2, 2.4), RD + V((0, -0.6, 1.2)), M["paint_lt"], CD, bevel=0.03)
plane("nd_kiosk_sign", 1.2, 0.24, M["fascia"], RD + V((0, -1.21, 2.15)), (PI / 2, 0, 0), CD)
box("nd_kiosk_door", (0.8, 0.02, 1.8), RD + V((0, -1.21, 0.9)), mat("door_glow", "#ffffff", 0.1, emit="#fff1d6", estr=1.6), CD)
# the bank
BK = RD + V((0, 14, 0))
box("bk_plinth", (8, 4, 0.5), BK + V((0, 0, 0.25)), mat("bk_stone", "#d9d3c7", 0.7), CD, bevel=0.02)
for i in range(3): box(f"bk_step{i}", (6, 0.35, 0.17), BK + V((0, -2.15 - i * 0.35, 0.42 - i * 0.17)), mat("bk_stone", "#d9d3c7"), CD)
for i in range(6):
    cyl(f"bk_col{i}", 0.22, 3.2, BK + V((-3 + i * 1.2, -1.5, 2.1)), mat("bk_stone"), CD, 24)
box("bk_wall", (7.4, 2.6, 3.2), BK + V((0, 0.2, 2.1)), mat("bk_wall", "#c9c2b4", 0.8), CD)
win_m = mat_glow("bk_win", "#ffd9a0", 3.0)
for i in range(3): box(f"bk_win{i}", (0.9, 0.05, 1.8), BK + V((-2.2 + i * 2.2, -1.12, 1.9)), win_m, CD)
box("bk_entab", (8, 3.6, 0.5), BK + V((0, 0, 3.95)), mat("bk_stone"), CD)
ped = loft("bk_pediment", [[(-4, y, 4.2), (4, y, 4.2), (0, y, 5.4)] for y in (-1.8, 1.8)], mat("bk_stone"), CD, smooth=False)
ped.location = BK
plane("bk_sign", 3.2, 0.7, M["bank_sign"], BK + V((0, -1.81, 3.95)), (PI / 2, 0, 0), CD)
# distant city blocks with lit windows
cw = mat_glow("city_win", "#ffc98a", 1.2); cb = mat("city", "#1a1f29", 0.8)
for i in range(26):
    x = random.choice([-1, 1]) * random.uniform(5, 16); y = random.uniform(-2, 30); h = random.uniform(3, 12)
    wd, dp = random.uniform(2, 4), random.uniform(2, 4)
    box(f"city{i}", (wd, dp, h), RD + V((x, y, h / 2)), cb, CD)
    for k in range(int(h // 1.6)):
        for j in (-1, 1):
            if random.random() < 0.6: box(f"city{i}w{k}{j}", (0.6, 0.02, 0.5), RD + V((x + j * wd * 0.25, y - dp / 2 - 0.02, 1 + k * 1.5)), cw, CD)
# network path: glowing fibre on the ground with relay posts
NET = [RD + V(p) for p in ((0, -0.1, 0.03), (0.6, 1.5, 0.03), (-1.2, 4.0, 0.03), (1.0, 7.0, 0.03), (-0.6, 10.0, 0.03), (0, 11.6, 0.03), (0, 11.9, 0.5))]
curve_tube("nd_fibre", NET, 0.03, mat_glow("fibre", "#2f8cff", 1.4), CD, res=16)
for i, p in enumerate(NET[1:5]):
    cyl(f"nd_post{i}", 0.06, 1.2, p + V((0.4, 0, 0.6)), M["steel_dk"], CD, 16)
    box(f"nd_post_led{i}", (0.1, 0.1, 0.06), p + V((0.4, 0, 1.23)), M["led_g"], CD)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=RD); pk = bpy.context.active_object; pk.name = "nd_packet"
for c in pk.users_collection: c.objects.unlink(pk)
link(pk, CD); pk.data.materials.append(mat_glow("packet", "#7fd8ff", 30))
point_light("nd_packet_light", (0, 0, 0), 40, "#7fd8ff", 0.1, CD).parent = pk
area_light("nd_moon", RD + V((-8, -6, 12)), look_rot(RD + V((-8, -6, 12)), BK), 8, 900, "#9fb6ff", CD)
area_light("nd_bank_flood", BK + V((0, -7, 0.3)), look_rot(BK + V((0, -7, 0.3)), BK + V((0, -1.5, 2.5))), 3, 900, "#ffe2b8", CD)

# ============================================================================= E: safe with cassettes, picker, transport, sensor, diverter, reject bin, stacker
CE = "setE"
re = empty("re", RE, CE)
safe = box("safe_shell", (1.3, 0.42, 0.86), (0.22, 0, 0.36), M["safe"], CE, parent=re)
inner = box("safe_inner", (1.2, 0.34, 0.76), (0.22, 0, 0.36), None, "cutters", parent=re)
boolean(safe, inner)
front = box("safe_front_cut", (1.6, 0.4, 1.2), (0.22, -0.25, 0.36), None, "cutters", parent=re)
boolean(safe, front)
# cassettes
for k, zt in enumerate((0.30, 0.15, 0.0)):
    tray = box(f"cas_tray{k}", (0.22, 0.1, 0.12), (-0.16, 0.0, zt - 0.055), M["tray"], CE, bevel=0.004, parent=re)
    tc = box(f"cas_cut{k}", (0.2, 0.2, 0.12), (-0.16, -0.06, zt - 0.045), None, "cutters", parent=re)
    boolean(tray, tc)
    stack = box(f"cas_stack{k}", (0.156, 0.066, 0.08 if k else 0.072), (-0.16, 0.0, zt - 0.048 - (0.0 if k else 0.004)), M["note_edge"], CE, parent=re)
    if k: plane(f"cas_top{k}", 0.156, 0.066, M["note"], (-0.16, 0.0, zt - 0.0079), (0, 0, 0), CE, re)
# pick arm with suction cups
arm = empty("pick_arm", (-0.02, 0.0, 0.40), CE, parent=re)
box("pick_beam", (0.1, 0.012, 0.012), (-0.05, 0, 0), M["steel"], CE, parent=arm)
cyl("pick_hub", 0.012, 0.05, (0, 0, 0), M["steel_dk"], CE, 24, (PI / 2, 0, 0), arm)
for s in (-1, 1):
    cyl(f"pick_stem{s}", 0.003, 0.03, (-0.09, s * 0.02, -0.015), M["chrome"], CE, 12, parent=arm)
    cyl(f"pick_cup{s}", 0.007, 0.008, (-0.09, s * 0.02, -0.032), mat("cup", "#e0802a", 0.6), CE, 24, parent=arm, r2=0.004)
curve_tube("pick_hose", [RE + V(p) for p in ((-0.02, 0.03, 0.40), (0.0, 0.08, 0.5), (0.1, 0.12, 0.55))], 0.003, M["rubber"], CE)
# transport rollers + belts
TZ = 0.36
for i, x in enumerate((0.02, 0.10, 0.22, 0.30, 0.40, 0.52)):
    for s in (-1, 1):
        r = cyl(f"tr_roll{i}{s}", 0.008, 0.09, (x, 0, TZ + s * 0.0095), M["rubber"], CE, 24, (PI / 2, 0, 0), re)
        rollers.append(r.name)
        box(f"tr_mark{i}{s}", (0.002, 0.002, 0.092), (0.008, 0, 0), M["steel"], CE, parent=r)
for s in (-1, 1):
    for yy in (-0.025, 0.025):
        box(f"tr_belt{s}{yy}", (0.52, 0.012, 0.002), (0.27, yy, TZ + s * 0.0018 + s * 0.0005), M["rubber"], CE, parent=re)
box("tr_frame", (0.62, 0.006, 0.06), (0.27, 0.06, TZ), M["steel_dk"], CE, parent=re)
# thickness sensor
SX = 0.16
box("sen_top", (0.05, 0.11, 0.03), (SX, 0, TZ + 0.026), M["black"], CE, bevel=0.003, parent=re)
box("sen_bot", (0.05, 0.11, 0.03), (SX, 0, TZ - 0.026), M["black"], CE, bevel=0.003, parent=re)
beam = plane("sen_beam", 0.11, 0.022, mat_beam("sen_beam", "#33ff88", 3.0), (SX, 0, TZ), (PI / 2, 0, PI / 2), CE, re)
box("sen_led", (0.012, 0.004, 0.006), (SX, -0.057, TZ + 0.03), mat_glow("sen_led", "#33ff88", 8), CE, parent=re)
point_light("sen_light", RE + V((SX, -0.06, TZ + 0.03)), 0.4, "#33ff88", 0.01, CE)
# diverter gate + reject bin
DX = 0.30
gate = empty("gate", (DX, 0, TZ - 0.004), CE, parent=re)
box("gate_flap", (0.06, 0.09, 0.003), (0.03, 0, 0), M["steel"], CE, parent=gate)
bin_ = box("rej_bin", (0.2, 0.1, 0.14), (0.45, 0, 0.09), mat("rej_bin", "#8b1e1e", 0.45, 0.2), CE, bevel=0.004, parent=re)
bc = box("rej_cut", (0.19, 0.2, 0.14), (0.45, -0.055, 0.1), None, "cutters", parent=re)
boolean(bin_, bc)
plane("rej_lbl", 0.09, 0.03, M["reject"], (0.45, -0.051, 0.05), (PI / 2, 0, 0), CE, re)
curve_tube("rej_chute", [RE + V(p) for p in ((0.33, 0.04, 0.34), (0.40, 0.04, 0.24), (0.43, 0.04, 0.17))], 0.003, M["steel"], CE, res=0)
# stacker: wheel + platform
wheel = cyl("stk_wheel", 0.03, 0.06, (0.58, 0, TZ + 0.01), M["steel_dk"], CE, 32, (PI / 2, 0, 0), re)
for k in range(6):
    box(f"stk_tine{k}", (0.03, 0.05, 0.002), (0.03 * math.cos(k * PI / 3), 0.03 * math.sin(k * PI / 3), 0), M["black"], CE, parent=wheel,
        rot=(0, 0, k * PI / 3))
box("stk_plat", (0.18, 0.09, 0.006), (0.70, 0, TZ - 0.02), M["steel"], CE, parent=re)
box("stk_wall", (0.006, 0.09, 0.06), (0.79, 0, TZ + 0.008), M["steel"], CE, parent=re)
# notes (picked one by one)
NOTES = 16
for i in range(NOTES):
    sheet(f"note{i}", 0.156, 0.066, 0.0005, M["note"], M["note_edge"], CE)
area_light("re_key", RE + V((0.1, -0.9, 0.9)), look_rot(RE + V((0.1, -0.9, 0.9)), RE + V((0.2, 0, 0.3))), 0.8, 32, "#fff2e2", CE)
area_light("re_fill", RE + V((0.9, -0.5, 0.2)), look_rot(RE + V((0.9, -0.5, 0.2)), RE + V((0.2, 0, 0.3))), 0.6, 12, "#cfe0ff", CE)
area_light("re_top", RE + V((0.2, 0, 0.72)), (0, 0, 0), 0.8, 10, "#fff6ea", CE, size_y=0.25)
box("re_floor", (4, 4, 0.01), RE + V((0, 0, -0.08)), mat("studio2", "#16181c", 0.6), CE)

# ============================================================================= F: deposit machine note scanner
CF = "setF"
rf = empty("rf", RF, CF)
box("sc_bed", (0.9, 0.16, 0.03), (0, 0, -0.016), M["steel_dk"], CF, parent=rf)
for yy in (-0.035, 0.035):
    box(f"sc_belt{yy}", (0.86, 0.022, 0.003), (0, yy, 0.0), M["rubber"], CF, parent=rf)
for i, x in enumerate((-0.42, 0.42)):
    r = cyl(f"sc_roll{i}", 0.015, 0.13, (x, 0, -0.012), M["rubber"], CF, 24, (PI / 2, 0, 0), rf); rollers.append(r.name)
for s in (-1, 1):
    box(f"sc_pillar{s}", (0.06, 0.02, 0.1), (0, s * 0.09, 0.045), M["paint"], CF, bevel=0.003, parent=rf)
box("sc_bridge", (0.06, 0.2, 0.04), (0, 0, 0.11), M["paint"], CF, bevel=0.004, parent=rf)
box("sc_lens", (0.01, 0.16, 0.006), (0, 0, 0.088), mat_glow("sc_lens", "#bfeaff", 6), CF, parent=rf)
plane("sc_sheet", 0.16, 0.085, mat_beam("sc_sheet", "#9fe3ff", 0.0), (0, 0, 0.045), (PI / 2, 0, PI / 2), CF, rf)
box("sc_maghead", (0.03, 0.03, 0.02), (0.16, -0.05, -0.02), M["chrome"], CF, parent=rf)
box("sc_magglow", (0.032, 0.032, 0.004), (0.16, -0.05, -0.006), mat_glow("mag_glow", "#ffb347", 0.0), CF, parent=rf)
box("sc_uvlamp", (0.2, 0.03, 0.015), (0.16, 0.11, 0.14), M["black"], CF, parent=rf)
box("sc_uvtube", (0.18, 0.012, 0.006), (0.16, 0.11, 0.132), mat_glow("uv_tube", "#9b5cff", 0.0), CF, parent=rf)
area_light("sc_uv", RF + V((0.16, 0.12, 0.25)), look_rot(RF + V((0.16, 0.12, 0.25)), RF + V((0.16, 0, 0))), 0.3, 0.0, "#7b3cff", CF)
box("sc_status", (0.03, 0.006, 0.012), (0.0, -0.101, 0.11), mat_glow("sc_status", "#33ff88", 0.0), CF, parent=rf)
f_note = sheet("f_note", 0.156, 0.066, 0.0005, M["note"], M["note_edge"], CF)
f_fake = sheet("f_fake", 0.156, 0.066, 0.0005, M["note_fake"], M["note_edge"], CF)
thread_glow = plane("f_thread", 0.009, 0.066, mat_glow("thread_glow", "#5affc0", 0.0), (0.0, 0, 0.0004), (0, 0, 0), CF, f_note)
thread_glow.location = (-0.078 + 0.156 * 531 / 1200, 0, 0.0004)
ink = []
for i in range(40):
    u, v = random.uniform(0.04, 0.24), random.uniform(0.62, 0.92)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.0009, subdivisions=1, location=(-0.078 + u * 0.156, -0.033 + v * 0.066, 0.0008))
    o = bpy.context.active_object; o.name = f"f_ink{i}"
    for c in o.users_collection: c.objects.unlink(o)
    link(o, CF); o.parent = f_note; o.data.materials.append(mat_glow("ink_glow", "#ffb347", 0.0))
area_light("sc_key", RF + V((-0.3, -0.35, 0.35)), look_rot(RF + V((-0.3, -0.35, 0.35)), RF), 0.4, 20, "#fff2e2", CF)
area_light("sc_rim", RF + V((0.35, 0.3, 0.2)), look_rot(RF + V((0.35, 0.3, 0.2)), RF), 0.4, 10, "#cfe0ff", CF)
box("sc_floor", (3, 3, 0.01), RF + V((0, 0, -0.05)), mat("studio3", "#121418", 0.5), CF)

# ============================================================================= world: HDRI (Poly Haven) mixed with a flat colour
w = bpy.data.worlds.new("world"); sc.world = w; nt = w.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)
tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.name = "map"
env = nt.nodes.new("ShaderNodeTexEnvironment"); env.name = "env"; env.image = img(f"{PH}/hdri/cinema_lobby_1k.hdr")
img(f"{PH}/hdri/bank_vault_1k.hdr").use_fake_user = True
bg = nt.nodes.new("ShaderNodeBackground"); bg.name = "bg"; bg.inputs["Strength"].default_value = 0.6
bg2 = nt.nodes.new("ShaderNodeBackground"); bg2.name = "flat"; bg2.inputs["Color"].default_value = hexc("#0d1117"); bg2.inputs["Strength"].default_value = 1.0
mix = nt.nodes.new("ShaderNodeMixShader"); mix.name = "mix"; mix.inputs[0].default_value = 0.0
out = nt.nodes.new("ShaderNodeOutputWorld")
nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
nt.links.new(env.outputs["Color"], bg.inputs["Color"])
nt.links.new(bg.outputs[0], mix.inputs[1]); nt.links.new(bg2.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs["Surface"])

# ============================================================================= camera + render
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); link(cam, "world"); sc.camera = cam
cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 24; cam_d.clip_start = 0.002; cam_d.clip_end = 200
r = sc.render
r.engine = "CYCLES"; r.resolution_x = 540; r.resolution_y = 960; r.fps = 30
sc.cycles.device = "CPU"; sc.cycles.samples = 6; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.08
sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 1; sc.cycles.glossy_bounces = 1; sc.cycles.transmission_bounces = 2
sc.cycles.transparent_max_bounces = 6; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False
sc.cycles.sample_clamp_indirect = 4.0
r.use_persistent_data = True
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
r.image_settings.file_format = "JPEG"; r.image_settings.quality = 95
c = bpy.data.collections.get("cutters")
if c:
    c.hide_render = True; c.hide_viewport = True
    for o in c.objects: o.hide_render = True; o.hide_viewport = True
sc["rollers"] = rollers
out = os.path.join(ROOT, "atm_ke_andar.blend")
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print("saved", out, len(bpy.data.objects), "objects")
