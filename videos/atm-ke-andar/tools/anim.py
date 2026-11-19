"""The film as a pure function of time: pose(t) sets every object for time t (seconds) and returns
overlay data (labels anchored to 3D points, chips, captions mode)."""
import math, os, json
import bpy
from mathutils import Vector as V, Matrix, Euler
from bpy_extras.object_utils import world_to_camera_view

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
END = 39.2
PI = math.pi
RB, RC, RD, RE, RF = V((20, 0, 1)), V((40, 0, 1)), V((60, 0, 0)), V((80, 0, 1)), V((100, 0, 1))
BK = RD + V((0, 14, 0))
O = bpy.data.objects
sc = bpy.context.scene
cam = O["cam"]
TEX = os.path.join(ROOT, "assets/tex")


def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ss(x): x = clamp(x); return x * x * (3 - 2 * x)
def ramp(t, a, b): return ss((t - a) / (b - a)) if b > a else float(t >= a)
def lerp(a, b, u): return a + (b - a) * u
def lv(a, b, u): return V(a).lerp(V(b), u)
def win(t, a, b, f=0.15): return ramp(t, a, a + f) * (1 - ramp(t, b - f, b))


# ----------------------------------------------------------------------------- world: camera rays see a flat colour, the rest sees the HDRI
wnt = sc.world.node_tree
if "lp" not in wnt.nodes:
    lp = wnt.nodes.new("ShaderNodeLightPath"); lp.name = "lp"
    mm = wnt.nodes.new("ShaderNodeMath"); mm.name = "camfac"; mm.operation = "MULTIPLY"
    wnt.links.new(lp.outputs["Is Camera Ray"], mm.inputs[0]); wnt.links.new(mm.outputs[0], wnt.nodes["mix"].inputs[0])
HDR = {k: bpy.data.images[k] for k in bpy.data.images.keys() if k.endswith(".hdr")}
SCR = {k: bpy.data.images[k + ".png"] for k in ("scr_insert", "scr_pin", "scr_wait", "scr_ok")}

SETS = {"A": "setA", "B": "setB", "C": "setC", "D": "setD", "E": "setE", "F": "setF"}
WORLD = {  # hdri, strength, camera-ray flat factor, flat colour
    "A": ("cinema_lobby_1k.hdr", 0.5, 0.0, "#0d1117"), "B": ("cinema_lobby_1k.hdr", 0.35, 1.0, "#0b0e13"),
    "C": ("cinema_lobby_1k.hdr", 0.35, 1.0, "#0b0e13"), "D": ("cinema_lobby_1k.hdr", 0.03, 1.0, "#070b16"),
    "E": ("bank_vault_1k.hdr", 0.2, 1.0, "#0c0e11"), "F": ("cinema_lobby_1k.hdr", 0.3, 1.0, "#0b0e13")}


def hexc(h):
    h = h.lstrip("#"); f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return tuple(f(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


# ----------------------------------------------------------------------------- shots: (t0, t1, set, [(t, eye, target, lens)])
def A(*p): return V(p)
SHOTS = [
    (0.0, 3.85, "A", [(0.0, A(1.15, -2.2, 1.5), A(0.0, 0.25, 1.12), 30), (2.0, A(0.78, -0.98, 1.42), A(0.2, 0.14, 1.25), 34),
                      (3.85, A(0.46, -0.26, 1.38), A(0.30, 0.12, 1.30), 40)]),
    (3.85, 8.75, "B", [(3.85, RB + A(-0.17, -0.13, 0.15), RB + A(0.0, 0.04, 0.0), 40), (6.6, RB + A(-0.15, -0.06, 0.14), RB + A(0.004, 0.065, 0.0), 42),
                       (8.75, RB + A(-0.10, 0.01, 0.12), RB + A(0.01, 0.095, 0.0), 44)]),
    (8.75, 11.9, "C", [(8.75, RC + A(-0.10, -0.14, 0.12), RC + A(0.0, 0.0, -0.006), 44), (10.3, RC + A(-0.02, -0.17, 0.0), RC + A(0.0, 0.015, -0.042), 40),
                       (11.9, RC + A(0.07, -0.13, -0.01), RC + A(0.0, 0.06, -0.05), 40)]),
    (11.9, 15.05, "D", [(11.9, RD + A(2.6, -5.0, 3.2), RD + A(0.0, 4.0, 0.8), 28), (13.4, RD + A(2.4, 4.0, 2.4), BK + A(0, -1.5, 2.2), 30),
                        (15.05, RD + A(1.4, 7.5, 2.1), BK + A(0, -1.6, 2.4), 32)]),
    (15.05, 17.1, "E", [(15.05, RE + A(0.24, -1.45, 0.78), RE + A(0.22, 0, 0.32), 30), (17.1, RE + A(0.02, -0.82, 0.62), RE + A(-0.04, 0, 0.32), 32)]),
    (17.1, 19.86, "E", [(17.1, RE + A(-0.26, -0.40, 0.50), RE + A(-0.06, 0, 0.32), 40), (19.86, RE + A(-0.12, -0.42, 0.48), RE + A(0.0, 0, 0.33), 40)]),
    (19.86, 23.98, "E", [(19.86, RE + A(0.06, -0.46, 0.50), RE + A(0.18, 0, 0.33), 38), (21.8, RE + A(0.12, -0.46, 0.48), RE + A(0.22, 0, 0.32), 38),
                         (23.98, RE + A(0.22, -0.52, 0.44), RE + A(0.30, 0, 0.27), 36)]),
    (23.98, 25.75, "E", [(23.98, RE + A(0.52, -0.46, 0.56), RE + A(0.64, 0, 0.35), 40), (25.75, RE + A(0.62, -0.40, 0.52), RE + A(0.68, 0, 0.35), 42)]),
    (25.75, 28.6, "A", [(25.75, A(0.14, -0.58, 1.26), A(-0.05, 0.12, 1.08), 40), (28.6, A(0.06, -0.44, 1.20), A(-0.05, 0.12, 1.07), 42)]),
    (28.6, 35.4, "F", [(28.6, RF + A(-0.12, -0.42, 0.42), RF + A(-0.02, 0, 0.0), 20), (30.7, RF + A(0.06, -0.34, 0.36), RF + A(0.12, 0, 0.0), 22),
                       (33.5, RF + A(0.10, -0.32, 0.34), RF + A(0.14, 0, 0.0), 24), (35.4, RF + A(-0.08, -0.42, 0.40), RF + A(-0.02, 0, 0.0), 20)]),
    (35.4, END + 0.1, "A", [(35.4, A(0.36, -0.62, 1.36), A(0.0, 0.2, 1.3), 34), (END, A(0.95, -2.7, 1.62), A(0.0, 0.3, 1.18), 28)]),
]


def shot_at(t):
    for s in SHOTS:
        if s[0] <= t < s[1]: return s
    return SHOTS[-1]


def cam_at(t, keys):
    if t <= keys[0][0]: return keys[0][1:]
    for a, b in zip(keys, keys[1:]):
        if t <= b[0]:
            u = (t - a[0]) / (b[0] - a[0])
            u = 0.5 - 0.5 * math.cos(PI * u)  # cosine ease per segment
            # blend neighbouring segment velocities a bit: plain ease is fine for 2-3 keys
            return lv(a[1], b[1], u), lv(a[2], b[2], u), lerp(a[3], b[3], u)
    return keys[-1][1:]


# ----------------------------------------------------------------------------- E: note logistics in the safe
TZ = 0.36; SX = 0.16; DX = 0.30; TOP = 0.284; DZ = 0.0016; NOTES = 16
PICKS = [(0, 17.45, 0.42, "n"), (1, 18.25, 0.42, "n"), (2, 19.05, 0.42, "n"), (3, 19.75, 0.42, "n"), (4, 20.5, 0.42, "n"),
         (5, 21.2, 0.42, "n"), (6, 21.75, 0.40, "r"), (7, 21.75, 0.40, "r2")] + [(8 + k, 23.55 + k * 0.27, 0.95, "n") for k in range(8)]
PICK_T = {i: (tp, v, rt) for i, tp, v, rt in PICKS}


def path_pts(route, k_land):
    z0 = TOP + 0.0008
    base = [(-0.16, z0), (-0.10, 0.325), (-0.02, TZ), (DX, TZ)]
    if route == "n":
        return base + [(0.56, TZ + 0.004), (0.70, TZ - 0.0165 + k_land * 0.0012)]
    return base + [(0.36, 0.312), (0.41, 0.22), (0.45, 0.028 + k_land * 0.002)]


def along(pts, s):
    """Point and slope angle at arc length s along a polyline of (x, z)."""
    for a, b in zip(pts, pts[1:]):
        L = math.dist(a, b)
        if s <= L:
            u = s / L
            return (lerp(a[0], b[0], u), lerp(a[1], b[1], u)), math.atan2(b[1] - a[1], b[0] - a[0]), False
        s -= L
    return pts[-1], 0.0, True


def plen(pts): return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))


def note_state(t):
    """World positions for notes 0..15 plus sensor/gate/stack state."""
    out = {}; landed_n = 0; landed_r = 0; under = []
    order_land = []
    for i in range(NOTES):
        tp, v, rt = PICK_T[i]
        if rt == "n" and t >= tp:
            pts = path_pts("n", 0); L = plen(pts)
            if (t - tp) * v >= L: order_land.append((tp + L / v, i))
    order_land.sort(); kland = {i: k for k, (_, i) in enumerate(order_land)}
    rem = [i for i in range(NOTES) if t < PICK_T[i][0]]
    for i in range(NOTES):
        tp, v, rt = PICK_T[i]
        if t < tp:
            k = len(rem) - 1 - rem.index(i)
            out[i] = (V((-0.16, 0, TOP + 0.0008 + k * DZ)), 0.0); continue
        r = "n" if rt == "n" else "r"
        kl = kland.get(i, landed_n) if r == "n" else (0 if rt == "r" else 1)
        pts = path_pts(r, kl)
        u = t - tp; s = v * (u - 0.12 * (1 - math.exp(-u / 0.12)))  # soft start
        (x, z), ang, done = along(pts, max(0.0, s))
        if done: ang = 0.0
        if rt == "r2": x += 0.012; z -= 0.0012
        if r == "n" and done: landed_n += 1
        out[i] = (V((x, 0, z)), ang)
        if abs(x - SX) < 0.085 and not done: under.append(rt)
    return out, landed_n, under


# ----------------------------------------------------------------------------- helpers
def set_visible(setkey):
    for k, cn in SETS.items():
        bpy.data.collections[cn].hide_render = k != setkey


def emit(mat, strength=None, color=None):
    n = bpy.data.materials[mat].node_tree.nodes["em"]
    if strength is not None: n.inputs["Strength"].default_value = strength
    if color is not None: n.inputs["Color"].default_value = hexc(color) if isinstance(color, str) else color


def mix_col(a, b, u):
    ca, cb = hexc(a), hexc(b); return tuple(lerp(x, y, u) for x, y in zip(ca, cb))


def place_note(ob, p_local, ang, origin):
    ob.location = origin + p_local
    ob.rotation_euler = (0, -ang, 0)


def screen(name): bpy.data.materials["atm_screen"].node_tree.nodes["img"].image = SCR[name]


ROLL = list(sc["rollers"])


# ----------------------------------------------------------------------------- pose
def pose(t):
    s0, s1, setk, keys = shot_at(t)
    set_visible(setk)
    hd, st, cf, flat = WORLD[setk]
    wnt.nodes["env"].image = HDR[hd]; wnt.nodes["bg"].inputs["Strength"].default_value = st
    wnt.nodes["camfac"].inputs[1].default_value = cf; wnt.nodes["flat"].inputs["Color"].default_value = hexc(flat)
    eye, tgt, lens = cam_at(t, keys)
    cam.location = eye; d = (tgt - eye).normalized(); cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    cam.data.dof.use_dof = setk in "BCEF"
    cam.data.dof.focus_distance = (tgt - eye).length; cam.data.dof.aperture_fstop = {"B": 4.0, "C": 4.5, "E": 5.6, "F": 8.0}.get(setk, 8)
    labels = []; chips = []
    bpy.context.view_layer.update()

    def lab(text, p, a0, a1, side="right", sub=None):
        al = win(t, a0, a1, 0.25)
        if al <= 0.001: return
        co = world_to_camera_view(sc, cam, V(p))
        if co.z <= 0: return
        labels.append(dict(text=text, sub=sub, x=round(co.x * 1080, 1), y=round((1 - co.y) * 1920, 1), a=round(al, 3), side=side))

    # ---------------- A lobby
    if setk == "A":
        screen("scr_ok" if 25.0 < t < 35.4 else "scr_insert")
        cl = O["card_l"]; cl.rotation_euler = (0, 0, -PI / 2)
        if t < 3.85:
            u1 = ramp(t, 1.0, 2.5); u2 = ramp(t, 2.6, 3.85)
            p = lv((0.42, -0.42, 1.18), (0.30, -0.02, 1.30), u1) + V((0, 0.13 * u2, 0))
            cl.location = p; cl.rotation_euler = (math.radians(14) * (1 - u1), 0, -PI / 2 + 0.5 * (1 - u1))
            cl.hide_render = t < 1.0
        else:
            cl.hide_render = True
        sh = O["atm_shutter"]; u = ramp(t, 25.95, 26.35) if 25 < t < 35.4 else 0.0
        sh.location.z = 1.075 - 0.03 * u; sh.scale.z = 1 - 0.95 * u
        b = O["bundle"]; ub = ramp(t, 26.4, 27.4) if 25 < t < 35.4 else 0.0
        b.location.y = 0.2 - 0.08 * ub; b.hide_render = ub <= 0
        for ch in b.children: ch.hide_render = ub <= 0
        if 25 < t < 35.4:
            lab("कैश शटर", (-0.05, 0.15, 1.10), 25.85, 28.4, "left")
        if t < 3.85:
            lab("कार्ड स्लॉट", (0.30, 0.11, 1.32), 0.6, 3.6, "right")

    # ---------------- B card reader
    if setk == "B":
        cr = O["card_r"]; u = ramp(t, 4.4, 6.6)
        y = lerp(-0.035, 0.0745, u); cr.location = RB + V((0.0, y, 0.0)); cr.rotation_euler = (0, 0, -PI / 2)
        for n in ROLL:
            if n.startswith("rb_roll_"):
                sgn = 1 if "lo" in n else -1
                O[n].rotation_euler = (0, PI / 2, 0); O[n].rotation_euler.rotate_axis("Z", sgn * (y + 0.035) / 0.0083)
        O["rb_head"].location.z = 0.0075 - 0.0034 * ramp(t, 6.85, 7.15)
        emit("trace_glow", 14 * ramp(t, 7.2, 7.6) * (0.75 + 0.25 * math.sin(t * 18)))
        lab("रोलर", RB + V((0.0, 0.058, -0.016)), 4.6, 6.8, "left")
        lab("चिप रीडर", RB + V((0.0105, 0.105, 0.012)), 6.9, 8.7, "left")

    # ---------------- C PIN pad
    if setk == "C":
        presses = [("1", 8.95), ("5", 9.35), ("9", 9.75), ("0", 10.15)]
        for k, n in [(k, n) for k, n in globals()["KEYS"].items()]:
            O[n].location.z = 0.005
        for i, (k, tk) in enumerate(presses):
            d = win(t, tk, tk + 0.26, 0.08)
            O[KEYS[k]].location.z = 0.005 - 0.0022 * d
            r_, c_ = KPOS[k]; emit(f"kglow{r_}{c_}", 25 * d)
        emit("chip_glow", 10 * ramp(t, 10.3, 10.8) * (0.8 + 0.2 * math.sin(t * 20)))
        emit("cable_glow", 6 * ramp(t, 11.15, 11.6))
        lab("PIN पैड", RC + V((-0.03, 0.03, 0.009)), 8.9, 10.3, "left")
        lab("सुरक्षित चिप", RC + V((0.0, 0.018, -0.042)), 10.4, 11.85, "right", "PIN → गुप्त कोड")

    # ---------------- D network + bank
    if setk == "D":
        pk = O["nd_packet"]; u = ramp(t, 11.95, 13.45)
        pts = [RD + V(p) for p in ((0, -0.1, 0.25), (0.6, 1.5, 0.25), (-1.2, 4.0, 0.25), (1.0, 7.0, 0.25), (-0.6, 10.0, 0.25), (0, 11.6, 0.3), (0, 11.9, 0.7))]
        L = [0] + [(b - a).length for a, b in zip(pts, pts[1:])]; tot = sum(L); s = u * tot
        for a, b, l in zip(pts, pts[1:], L[1:]):
            if s <= l: pk.location = a.lerp(b, s / l if l else 0); break
            s -= l
        else: pk.location = pts[-1]
        pk.hide_render = not (11.95 <= t < 13.6)
        O["nd_packet_light"].hide_render = pk.hide_render
        g = ramp(t, 13.62, 14.0)
        emit("bk_win", 3 + 5 * g, mix_col("#ffd9a0", "#3dff7a", g))
        emit("fibre", 1.4 + 2 * g, mix_col("#2f8cff", "#3dff7a", g))
        if t > 13.62: chips.append(dict(id="ok", text="✓ हाँ, पैसे हैं", a=round(win(t, 13.62, 15.05, 0.2), 3)))

    # ---------------- E safe
    if setk == "E":
        ns, landed, under = note_state(t)
        for i in range(NOTES):
            p, ang = ns[i]; place_note(O[f"note{i}"], p, ang, RE)
        # pick arm: down to grab at tp-0.18..tp, lift tp..tp+0.25
        ang = 0.0
        for i, tp, v, rt in PICKS:
            if rt == "r2": continue
            dn = ramp(t, tp - 0.2, tp - 0.02); up = ramp(t, tp, tp + 0.22)
            ang = max(ang, dn * (1 - up))
        O["pick_arm"].rotation_euler = (0, math.radians(-38 * ang + 8), 0)
        run = 17.2 <= t <= 25.9
        for n in ROLL:
            if n.startswith("tr_roll"):
                O[n].rotation_euler = (PI / 2, 0, 0); O[n].rotation_euler.rotate_axis("Z", (t - 17.2) * 40 * (1 if n.endswith("1") else -1) if run else 0)
        O["stk_wheel"].rotation_euler = (PI / 2, 0, 0); O["stk_wheel"].rotation_euler.rotate_axis("Z", -t * 6)
        dbl = any(r in ("r", "r2") for r in under)
        red = ramp(t, 22.15, 22.3) * (1 - ramp(t, 23.3, 23.5))
        busy = 1.0 if under else 0.0
        emit("sen_beam", 2.0 + 3 * busy, mix_col("#33ff88", "#ff3344", red))
        emit("sen_led", 8, mix_col("#33ff88", "#ff3344", red))
        bpy.data.lights["sen_light"].color = mix_col("#33ff88", "#ff3344", red)[:3]
        O["gate"].rotation_euler = (0, math.radians(38) * ramp(t, 22.0, 22.25) * (1 - ramp(t, 23.2, 23.45)), 0)
        lab("नोट कैसेट", RE + V((-0.22, -0.05, 0.27)), 15.6, 17.2, "left")
        lab("वैक्यूम कप", RE + V((-0.11, 0.0, 0.37)), 17.4, 19.8, "right")
        lab("मोटाई सेंसर", RE + V((SX, -0.05, TZ + 0.04)), 19.95, 23.9, "left")
        lab("रिजेक्ट बिन", RE + V((0.45, -0.05, 0.16)), 22.6, 23.95, "right")
        lab("स्टैकर", RE + V((0.70, -0.04, TZ + 0.02)), 24.1, 25.7, "left")
        if 21.95 < t < 23.95: chips.append(dict(id="warn", text="दो नोट चिपके! ✗", a=round(win(t, 22.2, 23.9, 0.15), 3)))
        if t > 23.98: chips.append(dict(id="count", text=f"गिनती: {landed} नोट", a=round(win(t, 24.0, 25.75, 0.15), 3)))

    # ---------------- F deposit scanner
    if setk == "F":
        fn, ff = O["f_note"], O["f_fake"]
        xr = lerp(-0.45, 0.16, ss((t - 28.7) / 2.0)) + 0.45 * ramp(t, 33.45, 34.0)
        fn.location = RF + V((xr, 0, 0.0035)); fn.hide_render = t > 34.0
        for ch in fn.children: ch.hide_render = fn.hide_render
        xf = lerp(-0.5, -0.04, ramp(t, 33.7, 34.2)) - 0.45 * ramp(t, 34.55, 35.35)
        ff.location = RF + V((xf, 0, 0.0035)); ff.hide_render = t < 33.6
        scan = max(win(t, 29.2, 30.7, 0.2), win(t, 33.9, 34.6, 0.1))
        fake = ramp(t, 34.2, 34.35)
        emit("sc_sheet", 4 * scan, mix_col("#9fe3ff", "#ff3344", fake))
        emit("sc_status", 6 * ramp(t, 29.0, 29.2), mix_col("#33ff88", "#ff3344", fake))
        emit("thread_glow", 12 * win(t, 31.05, 32.05, 0.15))
        mg = win(t, 32.1, 32.75, 0.1)
        emit("mag_glow", 10 * mg); emit("ink_glow", 14 * mg * (0.6 + 0.4 * math.sin(t * 40)))
        uv = win(t, 32.75, 33.55, 0.12)
        emit("uv_tube", 12 * uv); bpy.data.lights["sc_uv"].energy = 8 * uv
        for l in ("sc_key", "sc_rim"): bpy.data.lights[l].energy = {"sc_key": 20, "sc_rim": 10}[l] * (1 - 0.85 * uv)
        bpy.data.materials["note_real"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 6.0 * uv
        for n in ROLL:
            if n.startswith("sc_roll"): O[n].rotation_euler = (PI / 2, 0, 0); O[n].rotation_euler.rotate_axis("Z", -(xr + 0.5) / 0.015)
        lab("स्कैनर", RF + V((0, 0, 0.13)), 28.9, 30.7, "right")
        lab("धागा", RF + V((xr - 0.078 + 0.156 * 531 / 1200, -0.02, 0.004)), 31.1, 32.05, "left")
        lab("स्याही", RF + V((xr - 0.06, 0.01, 0.004)), 32.1, 32.75, "left")
        lab("UV चमक", RF + V((xr + 0.03, -0.01, 0.004)), 32.75, 33.55, "right")
        if t > 34.2: chips.append(dict(id="fake", text="नकली नोट! ✗ वापस", a=round(win(t, 34.25, 35.4, 0.12), 3)))
        if 29.0 < t < 30.75: chips.append(dict(id="ok2", text="जमा करने वाली मशीन", a=round(win(t, 28.8, 30.7, 0.2), 3)))

    cap = "low" if setk in "BCEF" else "low"
    return dict(t=round(t, 3), set=setk, cap=cap, labels=labels, chips=chips)


KEYS, KPOS = {}, {}
import re
for n in [o.name for o in O if re.fullmatch(r"rc_key\d\d", o.name)]:
    r_, c_ = int(n[6]), int(n[7])
    LAB = [["1", "2", "3", "X"], ["4", "5", "6", "<"], ["7", "8", "9", "O"], ["", "0", "", ""]]
    k = LAB[r_][c_] or f"b{r_}{c_}"; KEYS[k] = n; KPOS[k] = (r_, c_)
