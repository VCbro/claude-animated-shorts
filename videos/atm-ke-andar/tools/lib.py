"""Small modelling helpers for the Blender build (bpy 5.x, Cycles)."""
import math
import bpy, bmesh
from mathutils import Vector, Matrix

V = Vector


def col(name):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


def link(ob, c="world"):
    col(c).objects.link(ob)
    return ob


def hexc(h, a=1.0):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda x: x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), a)


# ----------------------------------------------------------------------------- materials
def mat(name, color="#888888", rough=0.5, metal=0.0, emit=None, estr=0.0, alpha=1.0, coat=0.0,
        transm=0.0, ior=1.45, aniso=0.0, bump=None, spec=0.5):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    p = nt.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = hexc(color)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["IOR"].default_value = ior
    if "Specular IOR Level" in p.inputs: p.inputs["Specular IOR Level"].default_value = spec
    if coat: p.inputs["Coat Weight"].default_value = coat
    if transm: p.inputs["Transmission Weight"].default_value = transm
    if aniso: p.inputs["Anisotropic"].default_value = aniso
    if emit:
        p.inputs["Emission Color"].default_value = hexc(emit)
        p.inputs["Emission Strength"].default_value = estr
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
    if bump:  # (scale, strength) procedural noise bump
        n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = bump[0]
        n.inputs["Detail"].default_value = 8
        b = nt.nodes.new("ShaderNodeBump"); b.inputs["Strength"].default_value = bump[1]
        b.inputs["Distance"].default_value = bump[2] if len(bump) > 2 else 0.02
        nt.links.new(n.outputs["Fac"], b.inputs["Height"])
        nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


def mat_noise_color(name, c1, c2, scale=8.0, rough=0.8, bump=0.3, metal=0.0, detail=6, coord="Object"):
    """Base colour mixed between two colours by noise (concrete, soil, rubber, brushed metal)."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = detail
    nt.links.new(tc.outputs[coord], n.inputs["Vector"])
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = hexc(c1); r.color_ramp.elements[1].color = hexc(c2)
    r.color_ramp.elements[0].position = 0.35; r.color_ramp.elements[1].position = 0.65
    nt.links.new(n.outputs["Fac"], r.inputs["Fac"])
    nt.links.new(r.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if bump:
        b = nt.nodes.new("ShaderNodeBump"); b.inputs["Strength"].default_value = bump; b.inputs["Distance"].default_value = 0.01
        n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = scale * 6; n2.inputs["Detail"].default_value = 10
        nt.links.new(tc.outputs[coord], n2.inputs["Vector"])
        nt.links.new(n2.outputs["Fac"], b.inputs["Height"])
        nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


def mat_brushed(name, color="#c9ccd0", rough=0.28, along="X", scale=(1, 400, 400)):
    """Brushed metal: anisotropic-looking streaks from stretched noise in roughness + bump."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = hexc(color)
    p.inputs["Metallic"].default_value = 1.0
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = scale
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 3; n.inputs["Detail"].default_value = 12
    nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = rough * 0.6; mr.inputs["To Max"].default_value = rough * 1.5
    nt.links.new(n.outputs["Fac"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], p.inputs["Roughness"])
    b = nt.nodes.new("ShaderNodeBump"); b.inputs["Strength"].default_value = 0.05; b.inputs["Distance"].default_value = 0.001
    nt.links.new(n.outputs["Fac"], b.inputs["Height"]); nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    return m


def mat_emit(name, color, strength):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = hexc(color); e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    return m


def mat_vcol_emit(name, strength=4.0, attr="Col", alpha=1.0):
    """Emission coloured by a per-vertex colour attribute (tracer particles)."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
    a = nt.nodes.new("ShaderNodeAttribute"); a.attribute_name = attr
    e = nt.nodes.new("ShaderNodeEmission"); e.inputs["Strength"].default_value = strength
    nt.links.new(a.outputs["Color"], e.inputs["Color"])
    out = nt.nodes["Material Output"]
    if alpha < 1:
        tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mx = nt.nodes.new("ShaderNodeMixShader"); mx.inputs[0].default_value = alpha
        nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(e.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs["Surface"])
    else:
        nt.links.new(e.outputs[0], out.inputs["Surface"])
    return m


def mat_cutface(name, side_mat_color, cap_color, rough=0.35, metal=1.0, cap_dir=(0, -1, 0)):
    """One material for a part seen in section: faces whose normal points along cap_dir (the cut
    plane, facing the camera) get a flat cap colour, the rest is the real surface."""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name)
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    vt = nt.nodes.new("ShaderNodeVectorTransform"); vt.vector_type = "NORMAL"; vt.convert_from = "WORLD"; vt.convert_to = "OBJECT"
    nt.links.new(geo.outputs["Normal"], vt.inputs["Vector"])
    dp = nt.nodes.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; dp.inputs[1].default_value = cap_dir
    nt.links.new(vt.outputs["Vector"], dp.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.96; mr.inputs["From Max"].default_value = 0.99
    nt.links.new(dp.outputs["Value"], mr.inputs["Value"])
    mc = nt.nodes.new("ShaderNodeMix"); mc.data_type = "RGBA"
    mc.inputs[6].default_value = hexc(side_mat_color); mc.inputs[7].default_value = hexc(cap_color)
    nt.links.new(mr.outputs["Result"], mc.inputs[0]); nt.links.new(mc.outputs[2], p.inputs["Base Color"])
    mm = nt.nodes.new("ShaderNodeMapRange"); mm.inputs["To Min"].default_value = metal; mm.inputs["To Max"].default_value = 0.0
    nt.links.new(mr.outputs["Result"], mm.inputs["Value"]); nt.links.new(mm.outputs["Result"], p.inputs["Metallic"])
    mrr = nt.nodes.new("ShaderNodeMapRange"); mrr.inputs["To Min"].default_value = rough; mrr.inputs["To Max"].default_value = 0.6
    nt.links.new(mr.outputs["Result"], mrr.inputs["Value"]); nt.links.new(mrr.outputs["Result"], p.inputs["Roughness"])
    return m


# ----------------------------------------------------------------------------- mesh helpers
def mesh_obj(name, bm, mats=(), c="world", smooth=False, parent=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    link(ob, c)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if parent: ob.parent = parent
    return ob


def box(name, size, loc=(0, 0, 0), m=None, c="world", bevel=0.0, segs=2, parent=None, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=V(size), verts=bm.verts)
    ob = mesh_obj(name, bm, [m] if m else [], c, parent=parent)
    ob.location = loc; ob.rotation_euler = rot
    if bevel: bevel_mod(ob, bevel, segs)
    return ob


def bevel_mod(ob, w, segs=2, angle=40):
    b = ob.modifiers.new("bev", "BEVEL"); b.width = w; b.segments = segs
    b.limit_method = "ANGLE"; b.angle_limit = math.radians(angle); b.harden_normals = False
    return b


def subsurf(ob, lv=2):
    s = ob.modifiers.new("sub", "SUBSURF"); s.levels = lv; s.render_levels = lv
    return s


def cyl(name, r, h, loc=(0, 0, 0), m=None, c="world", segs=48, rot=(0, 0, 0), parent=None, cap=True, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
    ob = mesh_obj(name, bm, [m] if m else [], c, smooth=True, parent=parent)
    ob.location = loc; ob.rotation_euler = rot
    ob.data.shade_auto_smooth() if hasattr(ob.data, "shade_auto_smooth") else None
    return ob


def lathe(name, prof, m=None, c="world", segs=64, loc=(0, 0, 0), rot=(0, 0, 0), angle=2 * math.pi, parent=None, close=False):
    """Revolve a (r, z) profile about local Z."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, 0, z)) for r, z in prof]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    if close: es.append(bm.edges.new((vs[-1], vs[0])))
    full = abs(angle - 2 * math.pi) < 1e-6
    ret = bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=angle, steps=segs, use_duplicate=False)
    if full: bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=3e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = mesh_obj(name, bm, [m] if m else [], c, smooth=True, parent=parent)
    ob.location = loc; ob.rotation_euler = rot
    return ob


def loft(name, sections, m=None, c="world", cap=True, parent=None, smooth=True):
    """sections: list of equal-length point lists (rings). Rings are joined in order."""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in s] for s in sections]
    n = len(sections[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, [m] if m else [], c, smooth=smooth, parent=parent)


def rrect(w, h, r, n=4, cx=0.0, cz=0.0, y=0.0, plane="xz"):
    """Rounded rectangle ring (n points per corner), centred at (cx, cz), at depth y."""
    pts = []
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    for (sx, sz, a0) in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ccx, ccz = cx + sx * (w / 2 - r), cz + sz * (h / 2 - r)
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((ccx + r * math.cos(a), ccz + r * math.sin(a)))
    if plane == "xz": return [(x, y, z) for x, z in pts]
    if plane == "yz": return [(y, x, z) for x, z in pts]
    return [(x, z, y) for x, z in pts]


def curve_tube(name, pts, r, m=None, c="world", res=6, bevel_res=6, parent=None, cyclic=False, taper=None):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = r; cu.bevel_resolution = bevel_res; cu.resolution_u = res
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY" if res == 0 else "BEZIER")
    if sp.type == "POLY":
        sp.points.add(len(pts) - 1)
        for p, q in zip(sp.points, pts): p.co = (*q, 1)
    else:
        sp.bezier_points.add(len(pts) - 1)
        for p, q in zip(sp.bezier_points, pts):
            p.co = q; p.handle_left_type = p.handle_right_type = "AUTO"
    sp.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(name, cu)
    if m: cu.materials.append(m)
    link(ob, c)
    if parent: ob.parent = parent
    return ob


def set_curve_pts(ob, pts):
    sp = ob.data.splines[0]
    if sp.type == "POLY":
        for p, q in zip(sp.points, pts): p.co = (*q, 1)
    else:
        for p, q in zip(sp.bezier_points, pts):
            p.co = q; p.handle_left_type = p.handle_right_type = "AUTO"


def curve2d(name, polys, depth, m=None, c="world", bevel=0.0, bres=2, parent=None):
    """Filled 2D shape (outer + hole polygons in local XY), extruded +-depth along local Z."""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = bres
    for poly in polys:
        sp = cu.splines.new("POLY"); sp.points.add(len(poly) - 1)
        for p, q in zip(sp.points, poly): p.co = (q[0], q[1], 0, 1)
        sp.use_cyclic_u = True
    if m: cu.materials.append(m)
    ob = bpy.data.objects.new(name, cu); link(ob, c)
    if parent: ob.parent = parent
    return ob


def boolean(ob, cutter, op="DIFFERENCE", solver="EXACT", apply=True):
    md = ob.modifiers.new("bool", "BOOLEAN"); md.operation = op; md.object = cutter; md.solver = solver
    if solver == "EXACT" and hasattr(md, "material_mode"): md.material_mode = "TRANSFER"
    if apply:
        bpy.context.view_layer.objects.active = ob
        with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
            bpy.ops.object.modifier_apply(modifier=md.name)
    return md


def apply_mods(ob):
    bpy.context.view_layer.objects.active = ob
    for md in list(ob.modifiers):
        with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob]):
            bpy.ops.object.modifier_apply(modifier=md.name)


def to_mesh(ob):
    """Convert a curve object to a mesh in place (keeps name, parent, materials)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    nob = bpy.data.objects.new(ob.name + "_m", me)
    nob.matrix_world = ob.matrix_world.copy()
    for c in ob.users_collection: c.objects.link(nob)
    par = ob.parent
    name = ob.name
    bpy.data.objects.remove(ob)
    nob.name = name
    if par:
        mw = nob.matrix_world.copy(); nob.parent = par; nob.matrix_world = mw
    return nob


def empty(name, loc=(0, 0, 0), c="world", parent=None, rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None); link(ob, c)
    ob.location = loc; ob.rotation_euler = rot
    if parent: ob.parent = parent
    return ob


def area_light(name, loc, rot, size, power, color="#ffffff", c="lights", shape="RECTANGLE", size_y=None, parent=None):
    l = bpy.data.lights.new(name, "AREA"); l.energy = power; l.color = hexc(color)[:3]
    l.shape = shape; l.size = size
    if size_y: l.size_y = size_y
    ob = bpy.data.objects.new(name, l); link(ob, c); ob.location = loc; ob.rotation_euler = rot
    if parent: ob.parent = parent
    return ob


def point_light(name, loc, power, color="#ffffff", radius=0.05, c="lights", parent=None):
    l = bpy.data.lights.new(name, "POINT"); l.energy = power; l.color = hexc(color)[:3]; l.shadow_soft_size = radius
    ob = bpy.data.objects.new(name, l); link(ob, c); ob.location = loc
    if parent: ob.parent = parent
    return ob


def look_rot(frm, to, roll=0.0):
    d = (V(to) - V(frm)).normalized()
    q = d.to_track_quat("-Z", "Y")
    e = q.to_euler()
    if roll: e.rotate_axis("Z", roll)
    return e
