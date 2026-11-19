"""The film as a pure function of time: pose(t) sets every object, material value, text and the
camera for time t (seconds). Also returns overlay data (labels with projected anchors, captions
position, chips) for tools/overlay.py.

All sale readouts (display digits, meter crank, pulser, overlay numbers) come from one volume
function vol(t); price = displayed litres x RATE.
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector as V, Matrix, Quaternion, Euler
from bpy_extras.object_utils import world_to_camera_view
import geo as G
from shapely.geometry import Polygon, Point, box as sbox

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PI = math.pi
VO = json.load(open(os.path.join(ROOT, "voice/lines.json")))
LINE = {l["id"]: l for l in VO["lines"]}
END = round(VO["duration"] + 1.6, 2)
FPS = 30


def T(i): return LINE[i]["start"]
def TE(i): return LINE[i]["end"]


def nrm(w):
    import re
    return re.sub(r"[,?।.!\"]", "", w)


def wt(i, word, nth=0):
    ws = [w for w in LINE[i]["words"] if nrm(w["w"]) == word or nrm(w["w"]).startswith(word)]
    if not ws: raise KeyError(f"{word} not in {i}")
    return ws[min(nth, len(ws) - 1)]["t"]


clamp = lambda x, a=0.0, b=1.0: min(b, max(a, x))
def sstep(x):
    x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10)
ramp = lambda t, a, b: sstep((t - a) / (b - a)) if b > a else float(t >= a)
lerp = lambda a, b, k: a + (b - a) * k
def win(t, a, b, f=0.25): return ramp(t, a - f, a) * (1 - ramp(t, b, b + f))
def vlerp(a, b, k): return V(a).lerp(V(b), k)

# ============================================================================= story clock
T_CLICK0 = 1.25                                   # opening click (flash-forward)
S = {}                                            # scene boundaries
S["open"] = (0.0, T("start") - 0.42)
S["tank"] = (S["open"][1], T("customer") - 0.3)
S["cust"] = (S["tank"][1], T("pump") - 0.3)
S["pump"] = (S["cust"][1], T("meter") - 0.25)
S["meter"] = (S["pump"][1], T("nozzle") - 0.3)
S["nozzle"] = (S["meter"][1], T("shutoff") - 0.25)
S["shut"] = (S["nozzle"][1], T("finish") - 0.4)
S["fin"] = (S["shut"][1], END)
T_COVER = wt("shutoff", "ढकता") + 0.05
T_CLOSE = TE("shutoff") + 0.4                     # valve seats, the click
T_SQUEEZE = wt("customer", "दबाते") + 0.1
T_DISP = wt("meter", "लीटर") - 0.35               # cut to the display in the meter scene
T_1L = T_DISP + 0.9
T_250 = wt("meter", "रकम") + 0.05
T_RESET = wt("customer", "ज़ीरो") - 0.1


def scene_of(t):
    for k, (a, b) in S.items():
        if a <= t < b: return k
    return "fin"


# ============================================================================= sale volume (litres)
KNOTS = [(0.0, 0.0), (T_SQUEEZE, 0.0), (S["cust"][1], 0.12), (S["pump"][1], 0.42), (T_DISP, 0.93), (T_1L, 1.0),
         (T_250, 2.5), (S["meter"][1], 2.62), (S["nozzle"][1], 3.85), (T_CLOSE, 5.0), (999, 5.0)]


def vol(t):
    for (a, va), (b, vb) in zip(KNOTS, KNOTS[1:]):
        if a <= t < b:
            u = (t - a) / (b - a)
            if (a, va) == (T_DISP, 0.93): u = u * u * (3 - 2 * u) * 0.0 + u      # linear across the 1.00 pass
            return va + (vb - va) * u
    return KNOTS[-1][1]


def flow_rate(t, dt=1 / 60):
    return (vol(t + dt) - vol(t - dt)) / (2 * dt)


def disp_vals(t):
    """Sale display: (litres str, amount str). Litres truncated to 0.01 L, amount = litres x rate."""
    v = vol(t)
    cl = math.floor(v * 100 + 1e-6) / 100
    return f"{cl:.2f}", f"{cl * G.RATE:.2f}"


def flowing(t):
    return T_SQUEEZE <= t < T_CLOSE


# ============================================================================= camera shots
# key: (t, eye, target, lens_mm)
def K(t, eye, tgt, lens): return (t, V(eye), V(tgt), lens)


DX, DY = G.DISP
CAR = V((G.CAR[0], G.CAR[1], 0))
FIL_W = CAR + V((-0.845 + 0.062, 1.22, 0.86))
NDIR = V((0.6, 0, -0.8)).normalized()
NOZ_CAR_J = FIL_W - NDIR * 0.035
NOZ_CAR_ROT = Euler((0, -math.asin(0.6), 0))
NOZ_BOOT_J = V((DX + 0.84 / 2 + 0.06, DY + 0.2, 0.18 + 0.99))
NOZ_BOOT_ROT = Euler((0, 0, PI))
RIG = V(G.RIG_ORIGIN)
TZ = G.TANK_C[1]

SHOTS = []
def shot(a, b, keys, mode="ext", cap="low"):
    SHOTS.append(dict(a=a, b=b, keys=keys, mode=mode, cap=cap))

# --- 1 the click: extreme close-up on the spout in the filler neck, then the tip is revealed
a, b = S["open"]
J0 = NOZ_CAR_J
SEAT_DIR = V((-0.6, 0.55, 0.3)).normalized()
shot(a, b, [K(0.0, J0 + SEAT_DIR * 0.95, J0 + V((0.04, 0, -0.04)), 85),
            K(2.3, J0 + SEAT_DIR * 0.9, J0 + V((0.04, 0, -0.045)), 85),
            K(3.9, J0 + V((-0.21, 0.12, -0.105)), J0 + V((-0.01, 0, 0.015)), 60),
            K(b, J0 + V((-0.2, 0.115, -0.1)), J0 + V((-0.01, 0, 0.015)), 60)])
# --- 2 tanker -> fill pipe -> tank
a, b = S["tank"]
CPL = V((G.FILL_X, 0, 0.06))
shot(a, b, [K(a, CPL + V((-0.55, -0.95, 0.6)), CPL + V((0, 0, 0.05)), 85),
            K(a + 1.4, CPL + V((-0.8, -1.5, 0.75)), CPL + V((0, 0, 0.0)), 50),
            K(wt("start", "पाइप") - 0.2, CPL + V((0.35, -2.3, -0.45)), CPL + V((0, 0.4, -0.6)), 35),
            K(wt("start", "ज़मीन") + 0.1, V((-1.6, -5.2, -1.1)), V((-1.4, 0.5, -1.6)), 28),
            K(wt("start", "स्टोरेज") + 0.1, V((-4.6, -9.0, 0.7)), V((-0.6, 0.5, -1.3)), 24),
            K(b, V((-5.0, -9.6, 1.0)), V((-0.6, 0.5, -1.2)), 24)], mode="sec")
# --- 3 a new customer
a, b = S["cust"]
c1, c2, c3 = a + 2.4, wt("customer", "मीटर") + 0.45, T_SQUEEZE - 1.25
shot(a, c1, [K(a, V((2.6, -8.5, 1.7)), V((7.2, 0.6, 1.0)), 24), K(c1, V((3.2, -7.9, 1.75)), V((7.2, 0.6, 1.0)), 24)])
shot(c1, c2, [K(c1, V((DX + 1.75, -1.55, 1.55)), V((DX + 0.45, 0.05, 1.35)), 35),
              K(c2, V((DX + 1.65, -1.35, 1.5)), V((DX + 0.45, 0.05, 1.42)), 35)])
shot(c2, c3, [K(c2, FIL_W + V((-0.95, -2.2, 0.8)), FIL_W + V((-0.35, 0, 0.25)), 35),
              K(c3, FIL_W + V((-0.85, -1.95, 0.6)), FIL_W + V((-0.3, 0, 0.12)), 35)])
shot(c3, b, [K(c3, J0 + V((-0.42, -0.62, -0.02)), J0 + V((-0.14, -0.04, -0.03)), 50),
             K(b, J0 + V((-0.39, -0.58, -0.03)), J0 + V((-0.14, -0.04, -0.035)), 50)])
# --- 4 what moves the petrol: the submerged pump and the route to the dispenser
a, b = S["pump"]
PZ = (G.PUMP["intake"][0] + G.PUMP["stages"][1]) / 2
shot(a, b, [K(a, V((1.4, -7.5, -1.0)), V((1.6, 0.4, -1.8)), 28),
            K(wt("pump", "मोटर") - 0.3, V((G.STP_X, -1.6, PZ + 0.1)), V((G.STP_X, 0.2, PZ)), 35),
            K(wt("pump", "घुमाती") + 0.2, V((G.STP_X + 0.05, -1.25, PZ + 0.08)), V((G.STP_X, 0.2, PZ)), 35),
            K(wt("pump", "दबाव") - 0.1, V((G.STP_X + 0.4, -2.6, -0.9)), V((G.STP_X + 0.4, 0.2, -1.0)), 30),
            K(wt("pump", "डिस्पेंसर"), V((4.6, -4.6, -0.3)), V((4.6, 0.3, -0.35)), 26),
            K(b, V((5.6, -4.3, 0.2)), V((5.9, 0.3, 0.0)), 26)], mode="sec")
# --- 5 litres -> rupees
a, b = S["meter"]
DW = lambda x, y, z: V((DX + x, DY + y, 0.18 + z))
m1, m2, m3 = wt("meter", "मीटर") + 0.2, wt("meter", "पल्सर") - 0.25, T_DISP
shot(a, m1, [K(a, DW(-0.7, -2.4, 0.95), DW(0.0, 0, 0.8), 35), K(m1, DW(-0.25, -1.5, 0.65), DW(-0.06, 0, 0.6), 35)], mode="disp", cap="top")
shot(m1, m2, [K(m1, DW(0.05, -1.3, 0.72), DW(0.05, 0, 0.66), 35), K(m2, DW(0.05, -1.22, 0.74), DW(0.05, 0, 0.68), 35)], mode="disp", cap="top")
shot(m2, m3, [K(m2, DW(0.1, -0.95, 1.0), DW(0.1, 0, 0.98), 40), K(wt("meter", "सिग्नल") + 0.2, DW(0.18, -1.05, 1.18), DW(0.18, 0, 1.16), 40),
              K(m3, DW(0.18, -1.15, 1.2), DW(0.18, 0, 1.12), 40)], mode="disp", cap="top")
shot(m3, b, [K(m3, DW(2.3, -0.55, 1.5), DW(0.42, 0.0, 1.38), 35), K(b, DW(2.15, -0.5, 1.48), DW(0.42, 0.0, 1.38), 35)], mode="disp", cap="below")
# --- 6 two paths inside one nozzle
a, b = S["nozzle"]
n1 = a + 2.3
shot(a, n1, [K(a, V((DX + 0.75, -0.75, 2.25)), V((DX + 0.85, 0.5, 1.75)), 35), K(n1, J0 + V((-0.5, -0.75, 0.2)), J0 + V((-0.1, 0, 0.0)), 45)])
RIGC = RIG + V((-0.088, 0, -0.03))
shot(n1, b, [K(n1, RIGC + V((0, -1.3, 0.0)), RIGC, 60), K(b, RIGC + V((0, -1.18, 0.0)), RIGC, 60)], mode="rig", cap="top")
# --- 7 the shot the film builds toward: locked
a, b = S["shut"]
RC2 = RIG + V((-0.088, 0, -0.055))
shot(a, b, [K(a, RC2 + V((0, -1.36, 0)), RC2, 60), K(b, RC2 + V((0, -1.36, 0)), RC2, 60)], mode="rig", cap="top")
# --- 8 finish the transaction, then the whole route
a, b = S["fin"]
f1, f2 = wt("finish", "बिल") + 0.3, wt("finish", "ये") - 0.1
shot(a, f1, [K(a, DW(2.15, -0.5, 1.48), DW(0.42, 0.0, 1.38), 35), K(f1, DW(2.3, -0.55, 1.5), DW(0.42, 0.0, 1.38), 35)], cap="below")
shot(f1, f2, [K(f1, V((DX + 2.2, -2.0, 1.6)), V((DX + 0.8, 0.4, 1.0)), 30), K(f2, V((DX + 2.4, -2.2, 1.7)), V((DX + 0.8, 0.4, 1.0)), 30)])
shot(f2, b, [K(f2, V((4.3, -14.0, 1.2)), V((4.3, 0.5, -0.3)), 24), K(b, V((4.3, -15.6, 1.4)), V((4.3, 0.5, -0.4)), 24)], mode="sec")


def hermite(keys, t):
    if t <= keys[0][0]: return keys[0][1:]
    if t >= keys[-1][0]: return keys[-1][1:]
    i = 0
    while t > keys[i + 1][0]: i += 1
    a, b = keys[i], keys[i + 1]
    h = b[0] - a[0]; u = (t - a[0]) / h
    def tan(j, c):
        if j <= 0 or j >= len(keys) - 1: return V((0, 0, 0)) if c < 2 else 0.0
        return (keys[j + 1][c + 1] - keys[j - 1][c + 1]) / (keys[j + 1][0] - keys[j - 1][0])
    h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
    out = []
    for c in range(3):
        out.append(h00 * a[c + 1] + h10 * h * tan(i, c) + h01 * b[c + 1] + h11 * h * tan(i + 1, c))
    return out


def cur_shot(t):
    s = SHOTS[0]
    for sh in SHOTS:
        if t >= sh["a"]: s = sh
    return s


# ============================================================================= helpers on objects
O = lambda n: bpy.data.objects[n]


def show(name, on):
    ob = O(name); ob.hide_render = not on; ob.hide_viewport = not on


def show_tree(name, on):
    ob = O(name); show(name, on)
    for c in ob.children_recursive: c.hide_render = not on; c.hide_viewport = not on


def particles(name, pts):
    """pts: list of (pos, size, (r, g, b))"""
    me = O(name).data
    bm = bmesh.new()
    cl = bm.loops.layers.float_color.new("Col") if hasattr(bm.loops.layers, "float_color") else None
    for p, s, c in pts:
        r = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=s)
        vs = r["verts"]
        bmesh.ops.translate(bm, vec=V(p), verts=vs)
        fs = set(f for v in vs for f in v.link_faces)
        for f in fs:
            for l in f.loops: l[cl] = (*c, 1.0)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True


def path_sampler(pts):
    pts = [V(p) for p in pts]
    seg = [(a, b, (b - a).length) for a, b in zip(pts, pts[1:])]
    L = sum(s[2] for s in seg)
    def at(s):
        s = clamp(s, 0, L)
        for a, b, l in seg:
            if s <= l: return a.lerp(b, s / l if l else 0)
            s -= l
        return pts[-1].copy()
    return at, L


def curve_from_polys(ob, polys, extrude, z0):
    cu = ob.data
    cu.splines.clear()
    cu.dimensions = "2D"; cu.fill_mode = "BOTH"; cu.extrude = extrude
    for poly in polys:
        sp = cu.splines.new("POLY"); sp.points.add(len(poly) - 1)
        for p, q in zip(sp.points, poly): p.co = (q[0], q[1], 0, 1)
        sp.use_cyclic_u = True
    ob.location = (0, 0, -(z0 + extrude))


AMBER = (1.0, 0.55, 0.12)
AIRC = (0.55, 0.85, 1.0)
WHITE = (0.9, 0.95, 1.0)

# station section routes (world)
FILL_ROUTE = [V((G.FILL_X, -0.004, 0.25)), V((G.FILL_X, -0.004, -0.12)), V((G.FILL_X, -0.004, TZ - G.TANK_R + 0.17))]
SALE_ROUTE = [V((x, -0.004, z)) for x, z in G.SALE_PATH]
DISP_ROUTE_L = [(-0.12, -0.25), (-0.12, 0.25), (G.D_FILTER[0], 0.32), (G.D_FILTER[0], G.D_FILTER[1]), (G.D_FILTER[0], G.D_METER[1] + 0.17),
                (G.D_METER[0] - 0.1, G.D_METER[1] + 0.17), (G.D_METER[0] - 0.1, G.D_METER[1] + 0.05), (G.D_METER[0] - 0.17, G.D_METER[1]), (G.D_METER[0] + 0.17, G.D_METER[1]),
                (0.3, G.D_METER[1] + 0.05), (0.3, 1.0), (0.38, 1.12)]
DISP_ROUTE = [V((DX + x, DY - 0.03, 0.18 + z)) for x, z in DISP_ROUTE_L]
CABLE_W = [V((DX + x, DY + y - 0.01, 0.18 + z)) for x, y, z in
           [(G.D_PULSER[0] + 0.08, -0.01, G.D_PULSER[1]), (0.22, -0.01, G.D_PULSER[1] + 0.05), (0.26, -0.01, 1.1), (0.24, -0.01, 1.35), (0.1, -0.01, 1.45)]]


def stream(route, t, speed, spacing, size, color, phase=0.0, alpha=1.0, rate=1.0):
    at, L = path_sampler(route)
    out = []
    n = int(L / spacing) + 2
    off = (phase * speed) % spacing
    for i in range(n):
        s = i * spacing + off
        if s > L: break
        out.append((at(s), size, color))
    return out


# ============================================================================= nozzle placement
def nozzle_pose(t):
    """(location of J, rotation quaternion) of the exterior nozzle."""
    q_car = NOZ_CAR_ROT.to_quaternion(); q_boot = NOZ_BOOT_ROT.to_quaternion()
    sc = scene_of(t)
    if sc == "open":
        # seated, then withdrawn 15 cm along the neck so the tip and its port come into the light
        k = ramp(t, 2.35, 3.8)
        return NOZ_CAR_J - NDIR * 0.185 * k + V((0, 0, 0.02 * k)), q_car
    if sc in ("tank",):
        return NOZ_BOOT_J, q_boot
    if sc == "cust":
        # lift from the boot (c1..), carry, insert (c2..)
        c1 = S["cust"][0] + 2.4; c2 = wt("customer", "मीटर") + 0.45
        if t < c1 + 0.4: return NOZ_BOOT_J, q_boot
        if t < c2 - 0.2:
            k = ramp(t, c1 + 0.4, c1 + 1.5)
            return NOZ_BOOT_J + V((0.1, -0.05, 0.25)) * k, q_boot.slerp(q_boot, k)
        k = ramp(t, c2 - 0.2, c2 + 1.4)
        top = NOZ_CAR_J - NDIR * 0.22
        if k < 0.75:
            return vlerp(NOZ_BOOT_J + V((0.1, -0.05, 0.25)), top, k / 0.75), q_boot.slerp(q_car, k / 0.75)
        return vlerp(top, NOZ_CAR_J, (k - 0.75) / 0.25), q_car
    if sc == "fin":
        f1 = wt("finish", "बिल") + 0.3
        if t < f1 + 0.3: return NOZ_CAR_J, q_car
        k = ramp(t, f1 + 0.3, f1 + 2.6)
        top = NOZ_CAR_J - NDIR * 0.22
        if k < 0.2: return vlerp(NOZ_CAR_J, top, k / 0.2), q_car
        if k < 0.85: return vlerp(top, NOZ_BOOT_J + V((0.05, 0, 0.18)), (k - 0.2) / 0.65), q_car.slerp(q_boot, (k - 0.2) / 0.65)
        return vlerp(NOZ_BOOT_J + V((0.05, 0, 0.18)), NOZ_BOOT_J, (k - 0.85) / 0.15), q_boot
    return NOZ_CAR_J, q_car


def lever_angle(t):
    sc = scene_of(t)
    if sc == "open": return 0.0 if t < T_CLICK0 else -0.22 * ramp(t, T_CLICK0, T_CLICK0 + 0.05)
    if sc == "cust": return -0.22 + 0.22 * ramp(t, T_SQUEEZE - 0.3, T_SQUEEZE)
    if sc in ("pump", "meter", "nozzle"): return 0.0
    if sc == "shut": return 0.0
    if sc == "fin": return -0.22
    return -0.22


def hand_visible(t):
    sc = scene_of(t)
    if sc == "cust": return t >= S["cust"][0] + 2.4 + 0.1
    if sc == "fin":
        f1 = wt("finish", "बिल") + 0.3
        return f1 - 0.2 < t < f1 + 2.8
    if sc == "nozzle": return t < S["nozzle"][0] + 2.3
    return False


# ============================================================================= main pose
_static_done = {}


def pose(t, scn=None):
    scn = scn or bpy.context.scene
    sc = scene_of(t)
    sh = cur_shot(t)
    mode = sh["mode"]
    labels, chips = [], []

    # --- camera
    eye, tgt, lens = hermite(sh["keys"], t)
    cam = O("cam")
    cam.location = eye
    d = (tgt - eye).normalized()
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    # depth of field on the macro / close shots
    cd = cam.data
    cd.dof.use_dof = lens >= 50
    cd.dof.focus_distance = (tgt - eye).length
    cd.dof.aperture_fstop = 4.0 if lens < 70 else 5.6

    # --- section vs exterior: the front slab is wiped away (scaled from its -x edge) in section shots
    wipe = 0.0
    if mode == "sec":
        if sc == "tank": wipe = ramp(t, S["tank"][0] + 1.1, wt("start", "पाइप") - 0.1)
        elif sc == "pump": wipe = ramp(t, S["pump"][0] - 0.01, S["pump"][0] + 0.6)
        else: wipe = 1.0
    sf = O("slab_front")
    sf.scale.x = max(1e-4, 1 - wipe)
    sf.location.x = 2 + 17 * wipe        # keep the +x edge fixed while shrinking from the -x side
    show("slab_front", wipe < 0.999)

    # --- who is on the forecourt
    tanker_on = sc == "tank"
    show_tree("tanker", tanker_on)
    for n in ("tanker_hose", "tk_coupling", "tk_coupling_lever", "tk_cone0", "tk_cone1", "tk_conet0", "tk_conet1"):
        show(n, tanker_on)
    show_tree("car", sc != "tank")

    # --- tank contents
    if sc == "tank":
        lv = lerp(G.TANK_LEVEL0, G.TANK_LEVEL1, ramp(t, wt("start", "पाइप"), S["tank"][1] + 0.5))
    elif sc == "open": lv = G.TANK_LEVEL1
    else: lv = G.TANK_LEVEL1 - 0.004 * vol(t)
    build_tank_liquid(lv)

    # --- section lights: follow the camera in section shots, off elsewhere
    for n in ("sec_key", "sec_fill"):
        L = O(n)
        L.data.energy = (380 if n == "sec_key" else 160) if mode == "sec" else 0.0
        if mode == "sec":
            L.location = V((eye.x, -6.0, eye.z + (2.0 if n == "sec_key" else -1.5)))
            L.rotation_euler = (V((tgt.x, 0, tgt.z)) - L.location).to_track_quat("-Z", "Y").to_euler()
    O("meter_key").data.energy = 80 if mode == "disp" else 0.0
    # gentle light cue on the pump
    pool = O("spot_pool")
    if sc == "pump":
        pool.location = V((G.STP_X, -0.5, (G.PUMP["intake"][0] + G.PUMP["stages"][1]) / 2))
        pool.data.energy = 25 * win(t, S["pump"][0] + 0.3, wt("pump", "दबाव"), 0.6)
        pool.data.color = (1.0, 0.85, 0.65); pool.data.shadow_soft_size = 0.2
    elif sc == "open":
        # a narrow pool of canopy light on the spout tip as it comes out
        pj, _ = nozzle_pose(t)
        pool.location = pj + NDIR * 0.16 + V((-0.25, -0.2, 0.25))
        pool.data.energy = 6.0 * ramp(t, 2.6, 3.9)
        pool.data.color = (1.0, 0.85, 0.66); pool.data.shadow_soft_size = 0.02
    else:
        pool.data.energy = 0.0

    # --- pump impellers spin while the sale flows
    spin = 0.0
    if t > T_SQUEEZE: spin = (t - T_SQUEEZE) * 2 * PI * 1.6
    for k in range(3):
        O(f"impeller{k}").rotation_euler = (0, 0, spin + k * 0.4)

    # --- dispenser: door, meter, pulser, digits
    door = 0.0
    if sc == "meter": door = ramp(t, S["meter"][0] + 0.1, S["meter"][0] + 1.3)
    O("d_door_pivot").rotation_euler = (0, 0, -door * 1.95)
    show_tree("d_door_pivot", door < 0.995 or mode != "disp")
    v = vol(t)
    th = v / G.METER_L_PER_REV * 2 * PI
    stroke = 0.04
    O("d_crank").rotation_euler = (0, 0, th)
    xoff = stroke * math.cos(th)
    O("d_yoke").location.x = G.D_METER[0] + xoff
    for s, n in zip((-1, 1), ("d_piston-1", "d_piston1")):
        O(n).location.x = G.D_METER[0] + s * 0.13 + xoff
    # measured volume: the chamber behind each piston (amber where it is filling)
    for s, n in zip((-1, 1), ("d_meas-1", "d_meas1")):
        ob = O(n)
        # gap between the piston face and the cylinder end
        face = G.D_METER[0] + s * 0.13 + xoff + s * 0.025
        endc = G.D_METER[0] + s * 0.175
        L = max(0.001, abs(endc - face))
        ob.location.x = (face + endc) / 2; ob.scale = (1, 1, L)
        filling = (math.sin(th) * s) > 0
        ob.hide_render = not (mode == "disp" and filling)
    O("d_pulser").rotation_euler = (0, 0, th)
    lit, amt = disp_vals(t)
    if sc in ("open", "tank"): lit, amt = "12.40", "1240.00"
    if sc == "cust" and t < T_RESET: lit, amt = "12.40", "1240.00"
    if sc == "cust" and T_RESET <= t < T_RESET + 0.35: lit, amt = "", ""
    for sx in (1, -1):
        O(f"txt_litres{sx}").data.body = lit
        O(f"txt_amount{sx}").data.body = amt
        O(f"txt_rate{sx}").data.body = f"{G.RATE:.2f}"

    # --- exterior nozzle, lever, hand, hose
    jl, q = nozzle_pose(t)
    nz = O("nozzle")
    nz.rotation_mode = "QUATERNION"; nz.rotation_quaternion = q; nz.location = jl
    NMW = Matrix.Translation(jl) @ q.to_matrix().to_4x4()
    la = lever_angle(t)
    O("nz_lever_pivot").rotation_euler = (0, la, 0)
    nz.hide_render = mode == "rig"
    for c in nz.children_recursive: c.hide_render = mode == "rig"
    update_hose(NMW)
    update_hand(t, NMW, la)

    # --- tracers
    fuel, air, sig = [], [], []
    if sc == "tank" and t > S["tank"][0] + 0.8:
        fuel += stream(FILL_ROUTE, t, 0.9, 0.09, 0.022, AMBER, phase=t)
        # spreading at the bottom of the drop tube
        for i in range(10):
            a_ = (t * 0.6 + i / 10) % 1.0
            fuel.append((V((G.FILL_X + (a_ * 1.4) * (1 if i % 2 else -1), -0.004, TZ - G.TANK_R + 0.12)), 0.018 * (1 - a_), AMBER))
    if sc == "pump":
        k = ramp(t, S["pump"][0] + 0.2, S["pump"][0] + 2.8)
        at, L = path_sampler(SALE_ROUTE)
        for p_, s_, c_ in stream(SALE_ROUTE, t, 0.8, 0.11, 0.02, AMBER, phase=t):
            fuel.append((p_, s_, c_))
        # a brighter moving highlight once along the route
        hs = (t - S["pump"][0] - 0.8) / (S["pump"][1] - S["pump"][0] - 1.2) * L
        if 0 < hs < L:
            fuel.append((at(hs), 0.05, (1.0, 0.75, 0.35)))
    if mode == "disp":
        fuel += stream(DISP_ROUTE, t, 0.25 * (0.4 + flow_rate(t)), 0.035, 0.008, AMBER, phase=t)
        if T_SQUEEZE < t:
            # one pulse per encoder slot: 12 slots per rev
            pulses = th / (2 * PI) * 12
            at, L = path_sampler(CABLE_W)
            for j in range(int(pulses) - 8, int(pulses) + 1):
                if j < 0: continue
                tj = (j / 12) * G.METER_L_PER_REV
                # time this pulse was emitted (invert vol): approximate by distance in pulse count
                age = (pulses - j) * 0.35
                s_ = age * 0.9
                if s_ < L: sig.append((at(s_), 0.007, WHITE))
    particles("P_fuel", fuel)
    particles("P_air", air)
    particles("P_signal", sig)

    # --- macro rig
    rig_state(t, sc, mode)

    # --- overlay data: labels with projected anchors
    def lab(text, world_pt, a, b, side="right", sub=""):
        al = win(t, a, b, 0.2)
        if al <= 0.001: return
        co = world_to_camera_view(scn, cam, V(world_pt))
        if co.z <= 0: return
        labels.append(dict(text=text, sub=sub, x=co.x * 1080, y=(1 - co.y) * 1920, a=round(al, 3), side=side))
    if sc == "open":
        pj, _ = nozzle_pose(t)
        lab("छोटा छेद", NMW @ V((-G.SP_RO, 0, G.PORT_Z)), 3.9, S["open"][1], "left")
    if sc == "tank":
        lab("अंडरग्राउंड टैंक", V((-0.9, 0.0, TZ + 0.55)), wt("start", "स्टोरेज"), S["tank"][1] - 0.1, "right")
        lab("टैंकर", V((-8.5, 3.3, 2.9)), S["tank"][0] + 1.0, wt("start", "पाइप") - 0.2, "right")
    if sc == "pump":
        lab("सबमर्सिबल पंप", V((G.STP_X, 0.0, G.PUMP["stages"][0] + 0.05)), wt("pump", "पंप") - 0.2, wt("pump", "दबाव") - 0.3, "right")
        lab("डिलीवरी पाइप", V((4.4, 0.0, G.DEL_Z)), wt("pump", "डिस्पेंसर") - 0.3, S["pump"][1], "right")
    if sc == "meter":
        lab("फ़िल्टर", DW(G.D_FILTER[0], 0, G.D_FILTER[1]), wt("meter", "फ़िल्टर"), wt("meter", "मीटर") + 0.3, "left")
        lab("मीटर", DW(G.D_METER[0] - 0.1, 0, G.D_METER[1] + 0.06), wt("meter", "मीटर") + 0.3, wt("meter", "पल्सर") - 0.3, "left",
            sub="सरल चित्रण · 1 चक्कर = 0.5 लीटर")
        lab("पल्सर", DW(G.D_PULSER[0], 0, G.D_PULSER[1]), wt("meter", "पल्सर") - 0.1, T_DISP - 0.2, "left")
        lab("सिग्नल", DW(0.25, -0.02, 1.25), wt("meter", "सिग्नल"), T_DISP - 0.2, "right")
        if t >= T_DISP: chips.append(dict(id="rate", text="उदाहरण दर ₹100.00/लीटर", a=round(win(t, T_DISP + 0.2, S["meter"][1], 0.2), 3)))
    if sc == "nozzle" and mode == "rig":
        lab("पेट्रोल", RIG + V((G.B(-0.05, 0.014)[0], 0, G.B(-0.05, 0.014)[1])), wt("nozzle", "पेट्रोल"), S["nozzle"][1], "right")
        lab("हवा", RIG + V((-G.SP_RO, 0, G.PORT_Z)), wt("nozzle", "छेद") - 0.2, S["nozzle"][1], "left")
    if sc == "shut":
        lab("वेंचुरी", RIG + V((0.0058, 0, -0.019)), wt("shutoff", "वेंचुरी") - 0.1, T_COVER - 0.3, "right")
        lab("छेद ढका", RIG + V((-G.SP_RO, 0, G.PORT_Z)), T_COVER, wt("shutoff", "घटता") - 0.1, "left")
        cx, cz = G.B((G.CH_U[0] + G.CH_U[1]) / 2, (G.CH_V[0] + G.CH_V[1]) / 2)
        lab("दबाव घटा", RIG + V((cx, 0, cz)), wt("shutoff", "घटता") - 0.1, wt("shutoff", "खिसकता") - 0.1, "left")
        lab("डायफ्राम", RIG + V((cx, 0, cz + 0.004)), wt("shutoff", "खिसकता") - 0.1, wt("shutoff", "छूटती") - 0.1, "left")
        bx, bz = G.B(-0.035, G.CH_V[0] - 0.02)
        lab("कुंडी", RIG + V((bx, 0, bz)), wt("shutoff", "छूटती") - 0.1, wt("shutoff", "स्प्रिंग") - 0.05, "left")
        vx, vz = G.B((G.SEAT_U[0] + G.SEAT_U[1]) / 2, 0.012)
        lab("स्प्रिंग · वाल्व", RIG + V((vx, 0, vz)), wt("shutoff", "स्प्रिंग") - 0.05, S["shut"][1], "right")
        if wt("shutoff", "खिसकता") - 0.2 < t < T_CLOSE + 0.2:
            chips.append(dict(id="slow", text="स्लो मोशन", a=round(win(t, wt("shutoff", "खिसकता") - 0.1, T_CLOSE, 0.2), 3)))
    if sc == "pump":
        chips.append(dict(id="lower", text="इस स्टेशन में पंप टैंक के अंदर है", a=round(win(t, S["pump"][0] + 0.5, S["pump"][1] - 0.2, 0.3), 3)))
    if sc == "fin":
        f1 = wt("finish", "बिल") + 0.3
        chips.append(dict(id="note", text="उदाहरण: गाड़ी पहले से आधी भरी थी", a=round(win(t, S["fin"][0] + 0.4, f1, 0.25), 3)))
    return dict(t=round(t, 4), scene=sc, cap=sh["cap"], endt=round(wt("finish", "ये") + 0.2, 3), labels=labels, chips=chips, lit=lit, amt=amt)


# ============================================================================= sub-updates
def build_tank_liquid(frac):
    key = round(frac, 4)
    if _static_done.get("tank") == key: return
    _static_done["tank"] = key
    r = G.TANK_R - 0.03
    h = G.TANK_C[1] - r + 2 * r * frac
    zc = G.TANK_C[1]
    disk = Point(0, zc).buffer(r, 64)
    half = sbox(0.0, zc - r - 1, r + 1, zc + r + 1)
    liq = disk.intersection(half).intersection(sbox(-5, zc - 5, 5, h))
    vap = disk.intersection(half).difference(sbox(-5, zc - 5, 5, h))
    for name, g in (("tank_liquid", liq), ("tank_vapour", vap)):
        bm = bmesh.new()
        polys = G.polys_of(g)
        for ext, holes in polys:
            # extrude the (y, z) section along x
            x0, x1 = G.TANK_X0 + 0.02, G.TANK_X1 - 0.02
            ring0 = [bm.verts.new((x0, y, z)) for y, z in ext]
            ring1 = [bm.verts.new((x1, y, z)) for y, z in ext]
            n = len(ext)
            for i in range(n):
                try: bm.faces.new((ring0[i], ring0[(i + 1) % n], ring1[(i + 1) % n], ring1[i]))
                except ValueError: pass
            try:
                bm.faces.new(ring0); bm.faces.new(list(reversed(ring1)))
            except ValueError: pass
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(O(name).data); bm.free()


def update_hose(mw):
    """Hose from the dispenser outlet to the nozzle swivel: a cubic with a gravity sag."""
    out = V((DX + 0.42 + 0.11, DY + 0.3, 0.18 + 2.05 - 0.08))
    sx, sz = G.B(-0.24, 0.0)
    sw = mw @ V((sx, 0, sz))
    back = (mw.to_3x3() @ V((-G.EU[0], 0, -G.EU[1]))).normalized()
    P0, P1 = out, out + V((0.35, 0, -0.05))
    P3 = sw; P2 = sw + back * 0.45 + V((0, 0, -0.2))
    span = (P3 - P0).length
    sag = clamp(2.2 - span, 0.15, 0.9) * 0.55
    pts = []
    n = len(O("hose").data.splines[0].points)
    for i in range(n):
        u = i / (n - 1)
        p = (1 - u) ** 3 * P0 + 3 * (1 - u) ** 2 * u * P1 + 3 * (1 - u) * u * u * P2 + u ** 3 * P3
        p.z -= sag * 4 * u * (1 - u) * (1 - u * 0.6)
        p.z = max(p.z, 0.03)
        pts.append(p)
    sp = O("hose").data.splines[0]
    for p, q in zip(sp.points, pts): p.co = (*q, 1)


def update_hand(t, mw, la):
    hand = O("hand")
    on = hand_visible(t)
    for c in [hand] + list(hand.children_recursive):
        c.hide_render = not on
    if not on:
        hand.location = (0, 0, -50); return
    ev = V((G.EV[0], 0, G.EV[1])); eu = V((G.EU[0], 0, G.EU[1]))
    Z = -ev; Y = V((0, -1, 0)); X = Y.cross(Z)
    rot = Matrix((X, Y, Z)).transposed().to_4x4()
    pc = eu * -0.135 + ev * 0.035 + V((0, -0.052, 0))
    hand.matrix_world = mw @ Matrix.Translation(pc) @ rot
    squeeze = clamp((la + 0.22) / 0.22)
    base = [0.55, 1.05, 0.75]
    for i in range(4):
        for k in range(3):
            O(f"finger{i}_{k}").rotation_euler = (base[k] + 0.18 * squeeze * (k + 1) / 3 - 0.06 * i, 0, 0)


def rig_state(t, sc, mode):
    on = mode == "rig"
    rig = O("rig")
    for c in [rig] + list(rig.children_recursive):
        c.hide_render = not on
    for n in ("rig_backdrop", "rig_key", "rig_fill", "rig_rim"):
        O(n).hide_render = not on
    if not on:
        particles("P_rig_fuel", []); particles("P_rig_air", []); return
    tc = T_CLOSE
    tx = wt("shutoff", "खिसकता") - 0.1
    trel = wt("shutoff", "छूटती") - 0.05
    # diaphragm lift (towards the vacuum side = body up), latch balls, latch stem drop, valve
    dia = 0.0 if sc != "shut" else 0.75 * ramp(t, tx, tx + 0.9) + 0.25 * ramp(t, trel, tc)
    balls = 0.0 if sc != "shut" else ramp(t, trel, trel + 0.5)
    drop = 0.0 if sc != "shut" else ramp(t, trel + 0.4, tc) ** 1.5
    lift = G.VALVE_LIFT * (1 - drop)
    if t >= tc: lift = 0.0; drop = 1.0
    ev = V((G.EV[0], G.EV[1], 0))
    O("rig_poppet").location = (ev.x * lift, ev.y * lift, O("rig_poppet").location.z)
    O("rig_seal").location = (ev.x * lift, ev.y * lift, O("rig_seal").location.z)
    O("rig_plunger").location = (ev.x * 0.004 * dia, ev.y * 0.004 * dia, O("rig_plunger").location.z)
    sd = 0.018 * drop
    O("rig_latch_stem").location = (-ev.x * sd, -ev.y * sd, O("rig_latch_stem").location.z)
    LP0 = G.B(-0.035, G.CH_V[0] - 0.05)
    piv = O("rig_lever_pivot")
    piv.location = (LP0[0] - ev.x * sd, LP0[1] - ev.y * sd, piv.location.z)
    # lever: rotates so the valve stem contact drops with the poppet
    piv.rotation_euler = (0, 0, -0.13 * drop)
    eu = V((G.EU[0], G.EU[1], 0))
    for s, n in zip((-1, 1), ("rig_ball-1", "rig_ball1")):
        ob = O(n); ob.location = (eu.x * -s * 0.0028 * balls, eu.y * -s * 0.0028 * balls, ob.location.z)
    # chamber pressure tint
    press = 0.0 if sc != "shut" else ramp(t, T_COVER + 0.2, wt("shutoff", "घटता") + 0.3)
    O("rig_chamber_low").hide_render = press < 0.02
    m = bpy.data.materials["chamber_low"].node_tree.nodes["Principled BSDF"]
    m.inputs["Emission Strength"].default_value = 1.4 * press
    # spring: helix between poppet top and the chamber roof
    u0 = (G.SEAT_U[0] + G.SEAT_U[1]) / 2
    v0, v1 = 0.0085 + lift, 0.029
    pts = []
    n = 39
    for i in range(n + 1):
        a = i / n * 2 * PI * 5
        v_ = v0 + (v1 - v0) * i / n
        uu = u0 + 0.0085 * math.cos(a)
        x, z = G.B(uu, v_)
        pts.append((x, z, -0.006 + 0.004 * math.sin(a)))
    sp = O("rig_spring").data.splines[0]
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    # diaphragm: a thin bowed strip across the chamber
    us = [lerp(G.CH_U[0] + 0.001, G.CH_U[1] - 0.001, i / 24) for i in range(25)]
    vmid = (G.CH_V[0] + G.CH_V[1]) / 2 - 0.004
    top, bot = [], []
    for u in us:
        k = 1 - ((u - (G.CH_U[0] + G.CH_U[1]) / 2) / ((G.CH_U[1] - G.CH_U[0]) / 2)) ** 2
        vv = vmid + 0.0065 * dia * k
        top.append(G.B(u, vv + 0.0007)); bot.append(G.B(u, vv - 0.0007))
    curve_from_polys(O("rig_diaphragm"), [top + list(reversed(bot))], 0.004, 0.0005)
    # neck fuel: rises, covers the port exactly at T_COVER, stops at the click
    z_cover = G.PORT_Z + G.PORT_R
    if sc == "nozzle": lvl = -0.232
    else:
        lvl = lerp(-0.232, z_cover, ramp(t, S["shut"][0] + 0.5, T_COVER) ** 0.8 if t < T_COVER else 1.0)
        if t >= T_COVER: lvl = z_cover + 0.008 * clamp((min(t, tc) - T_COVER) / (tc - T_COVER))
    polys = []
    for ext, holes in G.polys_of(G.neck_fuel(lvl)):
        polys.append(ext); polys += holes
    curve_from_polys(O("rig_neck_fuel"), polys, 0.006, 0.002)
    if not O("rig_neck_fuel").data.materials: O("rig_neck_fuel").data.materials.append(bpy.data.materials["petrol_flat"])
    # fuel tracer through the nozzle; it stops only when the valve seats
    fp = [V((x, z, 0)) for x, z in G.fuel_path()]
    at, L = path_sampler(fp)
    pts_f = []
    if t < tc:
        sp_ = 0.12
        for i in range(40):
            s_ = (i * 0.012 + t * sp_) % L
            p = at(s_)
            pts_f.append((V((p.x, -0.0, p.y)), 0.0022, (1.0, 0.42, 0.04)))
    else:
        # frozen where they were at the click, fading out
        fade = 1 - ramp(t, tc, tc + 0.6)
        for i in range(40):
            s_ = (i * 0.012 + tc * 0.12) % L
            p = at(s_)
            if fade > 0.02: pts_f.append((V((p.x, 0, p.y)), 0.0022 * fade, (1.0, 0.42, 0.04)))
    # air markers: enter the port while it is open; stop dead at coverage and fade
    ap = [V((x, z, 0)) for x, z in G.air_path()]
    at2, L2 = path_sampler(ap)
    pts_a = []
    a_on = (sc == "nozzle" and t > wt("nozzle", "छेद") - 0.3) or sc == "shut"
    if a_on:
        tt = min(t, T_COVER) if sc == "shut" else t
        fade = 1.0 if (sc == "nozzle" or t < T_COVER) else 1 - ramp(t, T_COVER + 0.15, T_COVER + 0.9)
        t_on = wt("nozzle", "छेद") - 0.3
        for i in range(26):
            s_ = (i * 0.0085 + tt * 0.05) % L2
            # only markers that have had time to travel in
            if s_ > (tt - t_on) * 0.05 + 0.004 and sc == "nozzle": continue
            p = at2(s_)
            if fade > 0.02: pts_a.append((V((p.x, 0, p.y)), 0.0019 * fade, (0.35, 0.75, 1.0)))
    # rig particles live in rig local space (local XY = rig plane); convert to world
    R = O("rig").matrix_world
    particles("P_rig_fuel", [(R @ V((p.x, p.z, 0.0035)), s, c) for p, s, c in pts_f])
    particles("P_rig_air", [(R @ V((p.x, p.z, 0.0035)), s, c) for p, s, c in pts_a])
