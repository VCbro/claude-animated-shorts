"""Shared geography and 2D section geometry (Blender units = metres, Z up).

The station section plane is y = 0: section cameras sit at -y looking +y, and every underground
part is cut there. Above ground the full forecourt exists for the exterior shots.
"""
import math
from shapely.geometry import Polygon, Point, LineString, box as sbox
from shapely.ops import unary_union
from shapely import affinity

# ----------------------------------------------------------------------------- station layout
TANK_C = (0.0, -2.25)         # (x, z) of tank axis, axis along x, y = 0
TANK_R, TANK_X0, TANK_X1 = 1.2, -3.2, 3.2
SLAB = 0.3                    # concrete forecourt thickness
FILL_X = -2.4                 # fill pipe / spill box
STP_X = 2.2                   # submersible turbine pump manway
DISP = (6.5, 0.0)             # dispenser (x, y)
DEL_Z = -0.86                 # delivery line depth
CAR = (8.85, 0.25)            # car centre (x, y); length along y, nose towards -y
TANK_LEVEL0, TANK_LEVEL1 = 0.38, 0.72   # tank fill fraction before / after the delivery

# path of product during the sale: pump intake -> stages -> riser -> pump head -> delivery -> dispenser
PUMP_Z0 = TANK_C[1] - TANK_R + 0.12     # motor bottom
PUMP = dict(motor=(PUMP_Z0, PUMP_Z0 + 0.36), intake=(PUMP_Z0 + 0.36, PUMP_Z0 + 0.44),
            stages=(PUMP_Z0 + 0.44, PUMP_Z0 + 0.80))
HEAD_Z = -0.58
SALE_PATH = [(STP_X, PUMP_Z0 + 0.40), (STP_X, PUMP_Z0 + 0.80), (STP_X, HEAD_Z), (STP_X + 0.35, HEAD_Z),
             (STP_X + 0.35, DEL_Z), (DISP[0] - 0.12, DEL_Z), (DISP[0] - 0.12, 0.25)]
FILL_PATH = [(FILL_X, 0.02), (FILL_X, TANK_C[1] - TANK_R + 0.18)]

# ----------------------------------------------------------------------------- dispenser internals
# local to the dispenser origin (x along the island, z up, y=0 is the cut plane of the open side)
D_FILTER = (-0.18, 0.55)      # filter canister centre (x, z)
D_METER = (0.05, 0.62)        # meter centre
D_PULSER = (0.05, 0.98)       # pulser on the meter shaft
D_HEAD_Z = (1.25, 2.15)
METER_L_PER_REV = 0.5         # litres per meter revolution (each of the 2 strokes = 0.25 L)
RATE = 100.0                  # example rate, rupees per litre

# ----------------------------------------------------------------------------- nozzle section rig
# rig plane coordinates (X right, Z up); the spout points straight down from J = (0, 0)
RIG_ORIGIN = (60.0, 0.0, 1.0)
A = math.radians(40)
EU = (math.cos(A), -math.sin(A))          # body axis, rear -> front
EV = (math.sin(A), math.cos(A))           # body "up"
SP_RO, SP_RI, SP_L = 0.0115, 0.0094, 0.20  # spout outer / inner radius, length
PORT_Z = -0.183                            # sensing port centre (on the -x wall)
PORT_R = 0.0038
ST_X, ST_RO, ST_RI = -0.0066, 0.0026, 0.0015   # sensing tube inside the spout


def B(u, v):
    return (u * EU[0] + v * EV[0], u * EU[1] + v * EV[1])


def bpoly(pts):
    return Polygon([B(u, v) for u, v in pts])


def brect(u0, u1, v0, v1):
    return bpoly([(u0, v0), (u1, v0), (u1, v1), (u0, v1)])


def round_poly(p, r):
    return p.buffer(r, join_style=1).buffer(-r, join_style=1)


# body outline in body coordinates (u along the axis, 0 at the spout junction; v up)
BODY_OUT = [(-0.215, -0.021), (-0.2, -0.03), (-0.14, -0.036), (-0.06, -0.036), (-0.01, -0.03), (0.02, -0.012),
            (0.024, 0.012), (0.012, 0.034), (-0.06, 0.04), (-0.13, 0.038), (-0.2, 0.03), (-0.215, 0.021)]
CH_U, CH_V = (-0.06, -0.012), (-0.082, -0.036)   # diaphragm chamber bump under the front of the body
SEAT_U = (-0.097, -0.078)
STEM_U = -0.0875
VALVE_LIFT = 0.009


def housing_outline():
    body = round_poly(bpoly(BODY_OUT), 0.006)
    bump = round_poly(brect(CH_U[0] - 0.004, CH_U[1] + 0.004, CH_V[0] - 0.004, -0.02), 0.006)
    boss = Polygon([(-0.0175, 0.012), (0.0175, 0.012), (0.0175, -0.035), (-0.0175, -0.035)])
    spout_wall = sbox(-SP_RO, -SP_L, SP_RO, -0.02)
    return unary_union([body, bump, boss, spout_wall])


def venturi_bore():
    """Spout bore with a venturi throat near the top."""
    zs = [0.006, -0.008, -0.016, -0.022, -0.03, -0.042]
    rs = [SP_RI + 0.0012, SP_RI, 0.0058, 0.0058, 0.0075, SP_RI]
    left = [(-r, z) for r, z in zip(rs, zs)] + [(-SP_RI, -SP_L - 0.01)]
    right = [(SP_RI, -SP_L - 0.01)] + [(r, z) for r, z in reversed(list(zip(rs, zs)))]
    return Polygon(left + right)


def main_cavities():
    inlet = brect(-0.23, -0.108, -0.016, 0.006)
    lower = round_poly(brect(-0.112, -0.064, -0.026, -0.003), 0.003)
    seat = brect(SEAT_U[0] + 0.0025, SEAT_U[1] - 0.0025, -0.004, 0.006)
    upper = round_poly(brect(-0.112, -0.064, 0.004, 0.03), 0.003)
    outlet = brect(-0.07, -0.006, 0.006, 0.022)
    junction = Point(B(-0.008, 0.012)).buffer(0.0115)
    j2 = Point(0, 0.0).buffer(SP_RI + 0.0012)
    stem_hole = brect(STEM_U - 0.0013, STEM_U + 0.0013, -0.045, -0.02)
    return unary_union([inlet, lower, seat, upper, outlet, junction, j2, venturi_bore(), stem_hole])


def sense_cavities():
    """Sensing passages: tip port -> tube in the spout -> chamber; chamber -> venturi throat."""
    tube = sbox(ST_X - ST_RI, PORT_Z - 0.001, ST_X + ST_RI, -0.03)
    port = sbox(-SP_RO - 0.001, PORT_Z - PORT_R, ST_X, PORT_Z + PORT_R)
    ch = round_poly(brect(CH_U[0], CH_U[1], CH_V[0], CH_V[1]), 0.004)
    # drilled channel from the top of the tube up-left into the chamber
    c1 = LineString([(ST_X, -0.03), (ST_X, -0.036), B(CH_U[1] - 0.006, CH_V[1] + 0.006)]).buffer(0.0016)
    # channel from the venturi throat into the chamber
    c2 = LineString([(-0.0055, -0.019), (-0.013, -0.019), B(CH_U[1] - 0.012, CH_V[1] + 0.012)]).buffer(0.0013)
    plunger = brect(-0.0372, -0.0328, CH_V[0] - 0.012, CH_V[0] + 0.001)
    return unary_union([tube, port, ch, c1, c2, plunger])


def tube_wall():
    return sbox(ST_X - ST_RO, PORT_Z - PORT_R - 0.0012, ST_X + ST_RO, -0.03).difference(
        sbox(ST_X - ST_RI, PORT_Z - 0.001, ST_X + ST_RI, -0.02)).difference(
        sbox(-SP_RO - 0.001, PORT_Z - PORT_R, ST_X, PORT_Z + PORT_R))


def housing_cut():
    h = housing_outline().difference(unary_union([main_cavities(), sense_cavities()]))
    return unary_union([h, tube_wall()])


def spout_solid():
    return sbox(-SP_RO, -SP_L, SP_RO, 0.0)


# path of the main fuel tracer in rig coordinates
def fuel_path():
    pts = [B(-0.23, -0.005), B(-0.16, -0.005), B(-0.112, -0.012), B(-0.0875, -0.012), B(-0.0875, 0.006),
           B(-0.0875, 0.016), B(-0.06, 0.014), B(-0.03, 0.014), (0.0, -0.004), (0.0, -0.02), (0.0, -0.06),
           (0.0, -0.2), (0.0, -0.225)]
    return pts


def air_path():
    # from outside the port, through the port, up the tube, into the chamber, down to the venturi throat
    pts = [(-0.022, PORT_Z - 0.006), (-SP_RO - 0.002, PORT_Z), (ST_X, PORT_Z + 0.002), (ST_X, -0.034),
           B(CH_U[1] - 0.006, CH_V[1] + 0.006), B(-0.036, -0.044), B(CH_U[1] - 0.012, CH_V[1] + 0.012),
           (-0.013, -0.019), (-0.004, -0.019), (0.0, -0.03), (0.0, -0.06)]
    return pts


# filler neck of the car, around the spout tip (rig coordinates)
NECK_RI, NECK_WALL = 0.03, 0.0022
NECK_TOP, NECK_BOT = -0.115, -0.32


def neck_walls():
    l = sbox(-NECK_RI - NECK_WALL, NECK_BOT, -NECK_RI, NECK_TOP)
    r = sbox(NECK_RI, NECK_BOT, NECK_RI + NECK_WALL, NECK_TOP)
    return unary_union([l, r])


def neck_fuel(level):
    """Fuel inside the neck below `level` (rig Z), minus the spout."""
    inner = sbox(-NECK_RI, NECK_BOT, NECK_RI, min(level, NECK_TOP))
    if level <= NECK_BOT + 1e-4: return Polygon()
    return inner.difference(spout_solid().buffer(0.0003))


def polys_of(g):
    """shapely geometry -> list of (exterior, [holes]) coordinate lists."""
    if g.is_empty: return []
    gs = list(g.geoms) if hasattr(g, "geoms") else [g]
    out = []
    for p in gs:
        if p.geom_type != "Polygon" or p.area < 1e-9: continue
        out.append(([tuple(c) for c in p.exterior.coords[:-1]], [[tuple(c) for c in h.coords[:-1]] for h in p.interiors]))
    return out
