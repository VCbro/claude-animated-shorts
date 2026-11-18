// Every solid of the engine, built once at module level. Units: 1 = ~36 mm (bore 1.56 ~ 56 mm).
// World: y up, crankshaft along z through the origin, intake on -x, exhaust on +x. The cutaway plane is z = 0:
// castings are split there; the back half stays, the front half can be slid away.
import { crossSection, manifold, sdf } from "raea/3d";

type V3 = [number, number, number];

// ---- dimensions shared with the kinematics -------------------------------------------------------------------
export const DIM = {
  r: 0.55,              // crank throw (stroke 1.1)
  L: 1.9,               // connecting rod, centre to centre
  bore: 0.8,            // bore radius
  pistonR: 0.785,
  pinToCrown: 0.5,      // wrist pin to piston crown
  deck: 3.05,           // barrel top / head face
  barrelBottom: 1.15,
  headTop: 3.95,
  domeTop: 3.3,         // combustion chamber roof
  valveTilt: (22 * Math.PI) / 180,
  seatX: 0.36,
  seatY: 3.2,
  camAlong: 1.56,       // cam centre along the valve axis from the seat
  liftMax: 0.15,
};

// ---- small helpers --------------------------------------------------------------------------------------------
// manifold.cylinder and cone are centred on z; these stand them along +y from y = 0, or lay them along -x from x = 0
const cyl = (r: number, h: number, _seg = 0) => manifold.cylinder(r, h).move(0, 0, h / 2).rotate(-90, 0, 0);
const cylZ = (r: number, h: number, _seg = 0) => manifold.cylinder(r, h); // centred on z
const coneY = (r1: number, r2: number, h: number) => manifold.cone(r1, r2, h).move(0, 0, h / 2).rotate(-90, 0, 0); // r1 at y=0
const alongX = (r: number, len: number) => manifold.cylinder(r, len).move(0, 0, -len / 2).rotate(0, 90, 0); // x in [-len, 0]
const coneX = (rFar: number, rNear: number, h: number) => manifold.cone(rFar, rNear, h).move(0, 0, -h / 2).rotate(0, 90, 0); // rFar at x=-h
const tubeY = (ro: number, ri: number, h: number, seg = 72) => cyl(ro, h, seg).minus(cyl(ri, h + 0.2, seg).move(0, -0.1, 0));

export function gearOutline(teeth: number, rTip: number, depth: number, shape: "gear" | "sprocket" = "gear") {
  const pts: [number, number][] = [];
  const rRoot = rTip - depth;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    if (shape === "gear") {
      const f = [0, 0.18, 0.32, 0.5, 0.68, 0.82];
      const r = [rRoot, rRoot, rTip, rTip, rRoot, rRoot];
      // involute-ish: root, flank up, tip, flank down
      const prof: [number, number][] = [[0.0, rRoot], [0.15, rRoot + depth * 0.15], [0.3, rTip], [0.45, rTip], [0.6, rRoot + depth * 0.15], [0.75, rRoot]];
      void f; void r;
      for (const [fa, rr] of prof) pts.push([rr * Math.cos(a0 + fa * step), rr * Math.sin(a0 + fa * step)]);
    } else {
      // sprocket: round valleys for the rollers, pointed teeth
      for (let k = 0; k <= 6; k++) {
        const fa = (k / 6) * 0.55;
        const rr = rRoot + depth * 0.25 * Math.sin((k / 6) * Math.PI) - depth * 0.05;
        pts.push([rr * Math.cos(a0 + fa * step), rr * Math.sin(a0 + fa * step)]);
      }
      pts.push([rTip * Math.cos(a0 + 0.775 * step), rTip * Math.sin(a0 + 0.775 * step)]);
    }
  }
  return crossSection.polygon(pts);
}

/** A spur gear or sprocket lying in the x-y plane (axis z), centred on z = 0. */
export function gear(teeth: number, rTip: number, depth: number, thick: number, bore: number, shape: "gear" | "sprocket" = "gear", lightening = 0) {
  let g = gearOutline(teeth, rTip, depth, shape).extrude(thick).move(0, 0, -thick / 2);
  g = g.minus(cylZ(bore, thick + 0.2, 32));
  if (lightening > 0) {
    const rr = (rTip - depth + bore) / 2;
    for (let i = 0; i < lightening; i++) {
      const a = (i / lightening) * Math.PI * 2;
      g = g.minus(cylZ((rTip - depth - bore) * 0.28, thick + 0.2, 32).move(rr * Math.cos(a), rr * Math.sin(a), 0));
    }
  }
  // a chamfer ring on each face reads as machining
  const face = cylZ(rTip - depth - 0.03, 0.02, 64).minus(cylZ(rTip - depth - 0.07, 0.1, 64));
  return g.union(face.move(0, 0, thick / 2), face.move(0, 0, -thick / 2));
}

function hexPrism(r: number, h: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) pts.push([r * Math.cos((i * Math.PI) / 3), r * Math.sin((i * Math.PI) / 3)]);
  return crossSection.polygon(pts).extrude(h).rotate(-90, 0, 0); // along +y
}

function bolt(len: number, r = 0.055) {
  return hexPrism(r * 1.8, r * 1.3).union(cyl(r * 1.25, r * 0.25).move(0, r * 1.3, 0)).union(cyl(r, len).move(0, -len, 0));
}

function along(p: V3, dir: V3, s: number): V3 { return [p[0] + dir[0] * s, p[1] + dir[1] * s, p[2] + dir[2] * s]; }

// valve axes (unit vectors pointing up and out of the head)
export const AXIS = {
  in: [-Math.sin(DIM.valveTilt), Math.cos(DIM.valveTilt), 0] as V3,
  ex: [Math.sin(DIM.valveTilt), Math.cos(DIM.valveTilt), 0] as V3,
};
export const SEAT = { in: [-DIM.seatX, DIM.seatY, 0] as V3, ex: [DIM.seatX, DIM.seatY, 0] as V3 };
export const CAM = { in: along(SEAT.in, AXIS.in, DIM.camAlong), ex: along(SEAT.ex, AXIS.ex, DIM.camAlong) };

// ---- port centrelines (also the paths the gas particles follow) -----------------------------------------------
export const PORT_IN: [number, number, number, number][] = [
  [-0.36, 3.24, 0, 0.21], [-0.55, 3.42, 0, 0.21], [-0.95, 3.5, 0, 0.21], [-1.4, 3.42, 0, 0.21], [-1.75, 3.32, 0, 0.21],
];
export const PORT_EX: [number, number, number, number][] = [
  [0.36, 3.24, 0, 0.2], [0.55, 3.4, 0, 0.2], [0.95, 3.42, 0, 0.2], [1.4, 3.3, 0, 0.2], [1.75, 3.2, 0, 0.2],
];
// exhaust header: out of the head, down the front, back under the engine to the silencer
export const HEADER: [number, number, number][] = [
  [1.7, 3.2, 0], [2.25, 3.12, 0], [2.7, 2.75, 0], [2.95, 2.0, 0], [3.0, 0.8, 0], [3.05, -0.4, 0], [3.35, -1.15, 0], [4.0, -1.45, 0], [4.8, -1.55, 0],
];
// intake: carburettor and air horn
export const CARB_X0 = -1.75;

// ---- cylinder barrel --------------------------------------------------------------------------------------------
function barrelSolid() {
  const h = DIM.deck - DIM.barrelBottom;
  const sleeve = tubeY(0.98, DIM.bore, h).move(0, DIM.barrelBottom, 0);
  const fins: ReturnType<typeof cyl>[] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const y = DIM.barrelBottom + 0.17 + i * ((h - 0.3) / (n - 1));
    const w = 2.35 + 0.25 * Math.sin((i / (n - 1)) * Math.PI); // fins swell in the middle, like a real barrel
    fins.push(manifold.roundedBox(w, 0.055, w * 0.92, 0.22).move(0, y, 0));
  }
  const base = manifold.roundedBox(2.0, 0.12, 1.9, 0.12).move(0, DIM.barrelBottom + 0.06, 0);
  const top = manifold.roundedBox(2.15, 0.1, 2.0, 0.14).move(0, DIM.deck - 0.05, 0);
  const studs = [-0.82, 0.82].flatMap((x) => [-0.78, 0.78].map((z) => cyl(0.1, h).move(x, DIM.barrelBottom, z)));
  let b = sleeve.union(...fins, base, top, ...studs);
  b = b.minus(cyl(DIM.bore, h + 1).move(0, DIM.barrelBottom - 0.5, 0));
  for (const x of [-0.82, 0.82]) for (const z of [-0.78, 0.78]) b = b.minus(cyl(0.05, h + 1).move(x, DIM.barrelBottom - 0.5, z));
  return b;
}

// ---- cylinder head with combustion chamber, ports, guides ---------------------------------------------------------
function headSolid() {
  const y0 = DIM.deck, y1 = DIM.headTop;
  let body = manifold.roundedBox(2.2, y1 - y0, 2.05, 0.12).move(0, (y0 + y1) / 2, 0);
  const fins = [0.2, 0.36, 0.52, 0.68].map((dy) => manifold.roundedBox(2.75, 0.05, 2.45, 0.24).move(0, y0 + dy, 0));
  body = body.union(...fins);
  // port bosses outside the head so the ports have walls to the flanges
  const bossIn = sdf.tube(PORT_IN.map(([x, y, z, r]) => [x, y, z, r + 0.09] as [number, number, number, number])).solid(0.04);
  const bossEx = sdf.tube(PORT_EX.map(([x, y, z, r]) => [x, y, z, r + 0.09] as [number, number, number, number])).solid(0.04);
  const flangeIn = alongX(0.36, 0.07).move(-1.68, 3.32, 0);
  const flangeEx = alongX(0.36, 0.07).move(1.82, 3.2, 0);
  body = body.union(bossIn, bossEx, flangeIn, flangeEx);
  // combustion chamber: a shallow dome over the bore
  const dome = manifold.sphere(1.05).move(0, DIM.domeTop - 1.05, 0).intersect(cyl(DIM.bore, 1).move(0, y0 - 0.01, 0));
  body = body.minus(dome);
  // ports
  body = body.minus(sdf.tube(PORT_IN).solid(0.035), sdf.tube(PORT_EX).solid(0.035));
  // valve guides and spring pockets along each axis, the plug bore, the cam tunnel
  for (const k of ["in", "ex"] as const) {
    const a = AXIS[k], s = SEAT[k];
    const angle = k === "in" ? DIM.valveTilt * (180 / Math.PI) : -DIM.valveTilt * (180 / Math.PI);
    const guide = cyl(0.05, 1.6, 24).rotate(0, 0, angle).move(...s);
    const pocket = cyl(0.19, 1.0, 48).rotate(0, 0, angle).move(...along(s, a, 0.62));
    body = body.minus(guide, pocket);
  }
  body = body.minus(cyl(0.11, 1.2, 32).move(0, DIM.domeTop - 0.05, 0), cyl(0.24, 1, 48).move(0, 3.6, 0));
  // the seats: hardened rings, a slightly smaller hole
  return body;
}

// ---- cam carrier and cover --------------------------------------------------------------------------------------
function camBoxSolid() {
  const y0 = DIM.headTop;
  const top = CAM.in[1] + 0.42;
  let box = manifold.roundedBox(2.55, top - y0, 1.9, 0.2).move(0, (y0 + top) / 2, 0);
  // ribs on the cover
  for (const x of [-0.6, -0.2, 0.2, 0.6]) box = box.union(manifold.roundedBox(0.06, 0.12, 1.7, 0.03).move(x, top, 0));
  box = box.minus(manifold.roundedBox(2.35, top - y0 + 0.2, 1.7, 0.15).move(0, (y0 + top) / 2 - 0.1, 0));
  // central plug tube
  box = box.union(tubeY(0.27, 0.22, top - y0 + 0.15).move(0, y0, 0));
  // bolts along the rim
  return box;
}

// ---- crankcase with gearbox ---------------------------------------------------------------------------------------
function crankcaseSolid() {
  const outer = manifold.union(
    cylZ(1.35, 1.7, 96),
    manifold.roundedBox(2.15, 1.3, 1.7, 0.2).move(0, 0.55, 0),
    manifold.roundedBox(2.5, 1.6, 1.7, 0.35).move(1.75, -0.3, 0),
    manifold.roundedBox(1.8, 0.35, 1.5, 0.15).move(0.6, -1.3, 0), // sump
  );
  const inner = manifold.union(
    cylZ(1.22, 1.5, 96),
    manifold.roundedBox(1.85, 1.25, 1.5, 0.15).move(0, 0.65, 0),
    manifold.roundedBox(2.25, 1.35, 1.5, 0.3).move(1.75, -0.3, 0),
  );
  let c = outer.minus(inner);
  c = c.minus(cyl(DIM.bore + 0.05, 1).move(0, 0.9, 0));
  // bearing bosses for the crank and the two gearbox shafts on the back wall
  for (const [x, y] of [[0, 0], [1.4, -0.1], [2.25, -0.72]] as [number, number][]) {
    c = c.union(cylZ(0.3, 0.3, 48).move(x, y, -0.8)).minus(cylZ(0.13, 2.2, 32).move(x, y, 0));
  }
  // perimeter bolts on the outside face of the back half
  return c;
}

// ---- moving parts -------------------------------------------------------------------------------------------------
function pistonSolid() {
  // origin at the wrist pin; crown at +pinToCrown
  const R = DIM.pistonR, crown = DIM.pinToCrown, skirt = 0.48;
  let p = cyl(R, crown + skirt, 96).move(0, -skirt, 0);
  // crown: slight dome with two valve reliefs
  p = p.union(manifold.sphere(2.4).move(0, crown - 2.4 + 0.06, 0).intersect(cyl(R - 0.04, 0.2, 96).move(0, crown - 0.01, 0)));
  for (const k of ["in", "ex"] as const) {
    const a = AXIS[k];
    const ang = k === "in" ? DIM.valveTilt * (180 / Math.PI) : -DIM.valveTilt * (180 / Math.PI);
    p = p.minus(cyl(0.3, 0.3, 48).rotate(0, 0, ang).move(SEAT[k][0] * 0.95 - a[0] * 0.02, crown + 0.035, 0));
  }
  // hollow skirt from below
  p = p.minus(cyl(R - 0.09, crown + skirt - 0.18, 96).move(0, -skirt - 0.01, 0));
  // ring grooves
  for (const dy of [crown - 0.1, crown - 0.2, crown - 0.31]) p = p.minus(tubeY(R + 0.1, R - 0.05, 0.035, 96).move(0, dy, 0));
  // pin bosses and the pin hole
  p = p.union(manifold.roundedBox(0.36, 0.42, 2 * R - 0.12, 0.08).intersect(cyl(R - 0.02, 1, 64).move(0, -0.5, 0)).move(0, 0.02, 0));
  p = p.minus(cylZ(0.11, 2 * R + 0.2, 32));
  // the slot the rod swings in
  p = p.minus(manifold.box(1.25, 0.8, 0.26).move(0, -0.2, 0));
  return p;
}
function ringsSolid() {
  const R = DIM.pistonR, crown = DIM.pinToCrown;
  return manifold.union(...[crown - 0.1, crown - 0.2, crown - 0.31].map((dy, i) =>
    tubeY(R + 0.004, R - 0.04, i === 2 ? 0.032 : 0.026, 96).move(0, dy + 0.004, 0)));
}
function pinSolid() { return cylZ(0.105, 2 * DIM.pistonR - 0.1, 32).minus(cylZ(0.06, 2, 24)); }

function rodSolid() {
  // origin at the small end (wrist pin), big end at -L along y; lies in x-y, thickness along z
  const L = DIM.L;
  const outline = crossSection.circle(0.19, 48).hull(crossSection.circle(0.37, 64).move(0, -L));
  let rod = outline.extrude(0.22).move(0, 0, -0.11);
  // I-beam: pockets on both faces
  const pocket = crossSection.circle(0.08, 24).move(0, -0.42).hull(crossSection.circle(0.14, 24).move(0, -L + 0.62)).extrude(0.06);
  rod = rod.minus(pocket.move(0, 0, 0.07), pocket.move(0, 0, -0.13));
  rod = rod.minus(cylZ(0.11, 1, 32), cylZ(0.215, 1, 48).move(0, -L, 0));
  // big-end cap line and its two bolts
  rod = rod.minus(manifold.box(1, 0.012, 1).move(0, -L, 0));
  for (const x of [-0.29, 0.29]) rod = rod.union(cyl(0.05, 0.5, 16).move(x, -L - 0.3, 0), hexPrism(0.075, 0.07).move(x, -L - 0.37, 0));
  return rod;
}

function crankSolid() {
  // centred on the crank axis; the throw points +y at zero angle
  const r = DIM.r;
  const web = crossSection.circle(0.36, 64).move(0, r).hull(crossSection.circle(0.3, 48))
    .union(crossSection.circle(1.0, 128).intersect(crossSection.rect(2.2, 1.2).move(0, -0.55)));
  const w = web.extrude(0.22);
  const webs = manifold.union(w.move(0, 0, 0.12), w.move(0, 0, -0.34));
  const pin = cylZ(0.2, 0.5, 48).move(0, r, 0);
  const mainFront = cylZ(0.17, 1.2, 48).move(0, 0, 0.88);
  const mainBack = cylZ(0.17, 1.4, 48).move(0, 0, -0.98);
  // lightening holes and a balance drilling in each web
  let c = webs.union(pin, mainFront, mainBack);
  for (const z of [0.23, -0.23]) c = c.minus(cylZ(0.09, 0.4, 24).move(0.55, -0.55, z), cylZ(0.09, 0.4, 24).move(-0.55, -0.55, z));
  return c;
}

function valveSolid() {
  // origin at the seat face centre, stem along +y
  const head = cyl(0.27, 0.05).union(coneY(0.27, 0.06, 0.16).move(0, 0.05, 0));
  const stem = cyl(0.045, 1.16, 24).move(0, 0.18, 0);
  const keeper = coneY(0.07, 0.1, 0.07).move(0, 1.1, 0);
  return head.union(stem, keeper);
}
function springSolid() {
  // along +y from 0 to 1 (scaled to the gap each frame), coil radius 0.15
  const pts: [number, number, number, number][] = [];
  const turns = 6.5, n = 160;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push([0.15 * Math.cos(a), 0.03 + t * 0.94, 0.15 * Math.sin(a), 0.028]);
  }
  return sdf.tube(pts).solid(0.012);
}
function bucketSolid() { return cyl(0.17, 0.15, 48).minus(cyl(0.13, 0.12, 48).move(0, -0.01, 0)); }
function retainerSolid() { return coneY(0.12, 0.19, 0.05); }

function camshaftSolid() {
  // axis z, centred; lobe nose along +x at zero angle; lobe at z=0
  const lobe = crossSection.circle(0.17, 64).hull(crossSection.circle(0.075, 48).move(0.17 + DIM.liftMax - 0.075, 0)).extrude(0.22).move(0, 0, -0.11);
  const shaft = cylZ(0.075, 1.9, 32).move(0, 0, -0.35);
  const journals = [0.45, -0.55].map((z) => cylZ(0.13, 0.14, 48).move(0, 0, z));
  const sprocket = gear(28, 0.5, 0.06, 0.08, 0.075, "sprocket", 5).move(0, 0, -1.2);
  return lobe.union(shaft, ...journals, sprocket);
}

function plugSolid() {
  // origin at the electrode tip, along +y
  const thread = cyl(0.1, 0.38, 32).move(0, 0.03, 0);
  const threads = manifold.union(...Array.from({ length: 9 }, (_, i) => tubeY(0.112, 0.09, 0.018, 32).move(0, 0.06 + i * 0.035, 0)));
  const washer = tubeY(0.15, 0.1, 0.03, 32).move(0, 0.41, 0);
  const hex = hexPrism(0.16, 0.16).move(0, 0.44, 0);
  const crimp = coneY(0.13, 0.1, 0.08).move(0, 0.6, 0);
  const ground = manifold.roundedBox(0.04, 0.06, 0.04, 0.01).move(0.06, 0.01, 0).union(manifold.box(0.03, 0.02, 0.03).move(-0.02, -0.03, -0.015));
  const center = cyl(0.016, 0.1, 12).move(0, -0.02, 0);
  return { metal: thread.union(threads, washer, hex, crimp, ground), electrode: center };
}
function insulatorSolid() {
  const body = coneY(0.105, 0.085, 0.6).move(0, 0.66, 0);
  const ribs = manifold.union(...Array.from({ length: 5 }, (_, i) => manifold.torus(0.095 - i * 0.003, 0.012).rotate(90, 0, 0).move(0, 0.95 + i * 0.065, 0)));
  const nose = coneY(0.03, 0.06, 0.12).move(0, 0.0, 0);
  return body.union(ribs, nose);
}
function plugCapSolid() {
  // rubber boot over the plug top, then the HT lead curving away
  const boot = coneY(0.17, 0.14, 0.55).move(0, 1.18, 0).union(coneY(0.14, 0.08, 0.2).move(0, 1.72, 0));
  const lead = sdf.tube([[0, 1.85, 0, 0.055], [0.05, 2.15, 0, 0.055], [0.3, 2.45, 0, 0.055], [0.8, 2.6, -0.2, 0.055], [1.5, 2.55, -0.6, 0.055]]).solid(0.02);
  return boot.union(lead);
}

// ---- intake: carburettor and air horn, exhaust: header and silencer -----------------------------------------------
function carbSolid() {
  const x0 = CARB_X0, y = 3.32;
  let carb = alongX(0.3, 0.9).move(x0, y, 0)
    .union(manifold.roundedBox(0.55, 0.75, 0.55, 0.1).move(x0 - 0.45, y + 0.33, 0))  // slide tower
    .union(cyl(0.12, 0.25).move(x0 - 0.45, y + 0.7, 0))                             // cable boss
    .union(manifold.roundedBox(0.6, 0.4, 0.6, 0.12).move(x0 - 0.45, y - 0.47, 0))    // float bowl
    .union(alongX(0.36, 0.06).move(x0, y, 0))                                        // flange
    .union(coneX(0.42, 0.3, 0.6).move(x0 - 0.9, y, 0))                              // air horn
    .union(alongX(0.46, 0.05).move(x0 - 1.48, y, 0));                               // horn lip
  carb = carb.minus(alongX(0.2, 3).move(x0 + 0.1, y, 0), coneX(0.38, 0.24, 0.64).move(x0 - 0.88, y, 0));
  return carb;
}
function headerSolid() {
  const outer = sdf.tube(HEADER.map(([x, y, z]) => [x, y, z, 0.21] as [number, number, number, number])).solid(0.03);
  const inner = sdf.tube(HEADER.map(([x, y, z], i) => [x - (i === 0 ? 0.1 : 0), y, z, 0.17] as [number, number, number, number])).solid(0.03);
  const can = manifold.cylinder(0.5, 2.6).rotate(0, 90, 0).move(6.0, -1.55, 0)
    .union(manifold.cone(0.5, 0.22, 0.35).rotate(0, 90, 0).move(7.475, -1.55, 0))
    .union(manifold.cone(0.22, 0.5, 0.4).rotate(0, 90, 0).move(4.5, -1.55, 0))
    .union(manifold.cylinder(0.1, 0.4).rotate(0, 90, 0).move(7.8, -1.55, 0));
  const canInner = manifold.cylinder(0.44, 3.4).rotate(0, 90, 0).move(6.0, -1.55, 0);
  return outer.union(can).minus(inner, canInner, manifold.cylinder(0.07, 1).rotate(0, 90, 0).move(7.8, -1.55, 0));
}

// ---- drivetrain ---------------------------------------------------------------------------------------------------
export const DRIVE = {
  crankGear: { teeth: 22, r: 0.5, z: -0.6 },
  clutch: { teeth: 46, r: 0.98, x: 1.4, y: -0.1, z: -0.6 },
  // gearbox pair on the mainshaft and countershaft
  main: { teeth: 24, r: 0.48, x: 1.4, y: -0.1, z: 0.5 },
  counter: { teeth: 30, r: 0.6, x: 2.25, y: -0.72, z: 0.5 },
  front: { teeth: 14, r: 0.52, x: 2.25, y: -0.72, z: 1.2 },
  rear: { teeth: 42, r: 1.56, x: 13.5, y: -0.4, z: 1.2 },
  wheelR: 5.4,
};
// gear centres must sit at the sum of pitch radii; shift the counter shaft accordingly
{
  const d = Math.hypot(DRIVE.counter.x - DRIVE.main.x, DRIVE.counter.y - DRIVE.main.y);
  const want = DRIVE.main.r + DRIVE.counter.r - 0.06;
  const ux = (DRIVE.counter.x - DRIVE.main.x) / d, uy = (DRIVE.counter.y - DRIVE.main.y) / d;
  DRIVE.counter.x = DRIVE.main.x + ux * want; DRIVE.counter.y = DRIVE.main.y + uy * want;
  DRIVE.front.x = DRIVE.counter.x; DRIVE.front.y = DRIVE.counter.y;
  DRIVE.clutch.x = DRIVE.main.x; DRIVE.clutch.y = DRIVE.main.y;
  const dc = Math.hypot(DRIVE.clutch.x, DRIVE.clutch.y);
  const wc = DRIVE.crankGear.r + DRIVE.clutch.r - 0.06;
  DRIVE.clutch.x *= wc / dc; DRIVE.clutch.y *= wc / dc; DRIVE.main.x = DRIVE.clutch.x; DRIVE.main.y = DRIVE.clutch.y;
}

function chainLinkSolid() {
  // one pitch of roller chain along +x, pitch 0.16, centred on z = 0
  const p = 0.16;
  const plate = crossSection.circle(0.055, 24).hull(crossSection.circle(0.055, 24).move(p, 0)).extrude(0.02);
  const plates = plate.move(0, 0, 0.07).union(plate.move(0, 0, -0.09));
  const roller = cylZ(0.04, 0.12, 20);
  const pinHead = cylZ(0.022, 0.2, 12);
  return plates.union(roller, pinHead);
}

function wheelSolids() {
  const R = DRIVE.wheelR;
  const tyre = manifold.torus(R - 0.62, 0.62).scale(1, 1, 0.9);
  // tread blocks
  const treads = manifold.union(...Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * 360;
    return manifold.roundedBox(0.16, 0.12, 0.85, 0.03).rotate(0, 0, 0).move(0, R + 0.02, (i % 2 ? 0.18 : -0.18)).rotate(0, 0, a);
  }));
  const rim = manifold.torus(R - 1.25, 0.12).union(
    cylZ(R - 1.18, 0.75, 160).minus(cylZ(R - 1.3, 1, 160)),
  );
  const hub = cylZ(0.75, 0.9, 64).union(cylZ(0.9, 0.12, 64).move(0, 0, 0.38), cylZ(0.9, 0.12, 64).move(0, 0, -0.38))
    .union(cylZ(1.25, 0.35, 96).move(0, 0, -0.55)).minus(cylZ(0.2, 2, 32)); // brake drum on the far side
  const spokes = manifold.union(...Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const side = i % 2 ? 0.38 : -0.38;
    const a2 = a + (i % 4 < 2 ? 0.35 : -0.35);
    const p0: V3 = [0.85 * Math.cos(a2), 0.85 * Math.sin(a2), side];
    const p1: V3 = [(R - 1.3) * Math.cos(a), (R - 1.3) * Math.sin(a), side * 0.15];
    return manifold.hull([[p0[0], p0[1], p0[2]], [p1[0], p1[1], p1[2]], [p0[0] + 0.02, p0[1] + 0.02, p0[2]], [p1[0] + 0.02, p1[1] + 0.02, p1[2]],
      [p0[0], p0[1], p0[2] + 0.03], [p1[0], p1[1], p1[2] + 0.03]]);
  }));
  const axle = cylZ(0.18, 2.6, 32).union(hexPrism(0.26, 0.18).rotate(90, 0, 0).move(0, 0, 1.3));
  return { tyre: tyre.union(treads), rim, hub, spokes, axle };
}

// ---- section helpers ---------------------------------------------------------------------------------------------
function split(s: ReturnType<typeof cyl>) {
  const back = s.trim(0, 0, -1, 0);
  const front = s.trim(0, 0, 1, 0);
  const cap = back.crossSection(-0.002).extrude(0.003).move(0, 0, -0.0025);
  return { back, front, cap };
}

const barrel = barrelSolid();
const head = headSolid();
const camBox = camBoxSolid();
const crankcase = crankcaseSolid();
const carb = carbSolid();
const header = headerSolid();

export const CAST = {
  barrel: split(barrel),
  head: split(head),
  camBox: split(camBox),
  crankcase: split(crankcase),
  carb: split(carb),
  header: split(header),
};

// head and crankcase bolts (outside, never cut)
export const BOLTS = manifold.union(
  ...[-0.92, 0.92].flatMap((x) => [-0.85].map((z) => bolt(0.3).move(x, DIM.headTop + 0.02, z))),
  ...Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (0.15 + (i / 6) * 1.3);
    return bolt(0.2).rotate(90, 0, 0).move(1.28 * Math.cos(a + Math.PI / 2) * 1.0, 1.28 * Math.sin(a + Math.PI / 2) - 0.1, -0.9);
  }),
);

function swingarmSolid() {
  const a = DRIVE.front, b = DRIVE.rear;
  const arm = manifold.hull(
    manifold.roundedBox(0.7, 0.55, 0.28, 0.1).move(a.x + 0.35, a.y - 0.25, 0),
    manifold.roundedBox(0.9, 0.42, 0.24, 0.1).move(b.x - 0.6, b.y, 0),
  ).minus(manifold.roundedBox(8.0, 0.22, 1, 0.08).move((a.x + b.x) / 2 + 0.2, (a.y + b.y) / 2 - 0.1, 0));
  const pivot = cylZ(0.3, 0.5, 48).move(a.x + 0.25, a.y - 0.25, 0);
  return arm.union(pivot).move(0, 0, 0.84);
}

export const PARTS = {
  swingarm: swingarmSolid(),
  piston: pistonSolid(),
  rings: ringsSolid(),
  pin: pinSolid(),
  rod: rodSolid(),
  crank: crankSolid(),
  valve: valveSolid(),
  spring: springSolid(),
  bucket: bucketSolid(),
  retainer: retainerSolid(),
  camshaft: camshaftSolid(),
  plug: plugSolid(),
  insulator: insulatorSolid(),
  plugCap: plugCapSolid(),
  seat: tubeY(0.3, 0.22, 0.05, 64),
  crankGear: gear(DRIVE.crankGear.teeth, DRIVE.crankGear.r, 0.07, 0.2, 0.17, "gear", 0),
  clutch: gear(DRIVE.clutch.teeth, DRIVE.clutch.r, 0.07, 0.26, 0.15, "gear", 6),
  clutchBasket: cylZ(0.82, 0.5, 96).minus(cylZ(0.74, 0.6, 96)).move(0, 0, -0.36),
  mainGear: gear(DRIVE.main.teeth, DRIVE.main.r, 0.07, 0.22, 0.13, "gear", 0),
  counterGear: gear(DRIVE.counter.teeth, DRIVE.counter.r, 0.07, 0.22, 0.13, "gear", 5),
  shaft: cylZ(0.13, 1.6, 32),
  front: gear(DRIVE.front.teeth, DRIVE.front.r, 0.1, 0.13, 0.13, "sprocket", 0),
  rear: gear(DRIVE.rear.teeth, DRIVE.rear.r, 0.1, 0.13, 0.25, "sprocket", 6),
  link: chainLinkSolid(),
  wheel: wheelSolids(),
  gasColumn: cyl(DIM.bore - 0.004, 1, 72).trim(0, 0, -1, 0),
  gasDome: manifold.sphere(1.05).move(0, DIM.domeTop - 1.05, 0).intersect(cyl(DIM.bore - 0.004, 1, 72).move(0, DIM.deck, 0)).trim(0, 0, -1, 0),
  puff: manifold.sphere(0.05),
};
