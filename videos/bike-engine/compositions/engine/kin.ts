// Motion: the crank angle over the film (timed from the narration), and everything that follows from it.
import { AXIS, DIM, DRIVE, SEAT } from "./geom";
import { TIMING } from "./timing";

export type Lang = "en" | "hi";
export const FPS = 30;
export const BEATS = ["hook", "reveal", "parts", "intake", "compression", "power", "exhaust", "drive", "outro"] as const;
export type Beat = (typeof BEATS)[number];

const DEG = Math.PI / 180;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));

/** Each beat's slot in seconds: from halfway through the gap before its line to halfway through the gap after. */
export function slots(lang: Lang) {
  const t = TIMING[lang];
  const b = t.beats;
  const out: Record<Beat, { t0: number; t1: number; say0: number; say1: number }> = {} as never;
  b.forEach((row, i) => {
    const t0 = i === 0 ? 0 : (b[i - 1].end + row.start) / 2;
    const t1 = i === b.length - 1 ? t.total : (row.end + b[i + 1].start) / 2;
    out[row.id as Beat] = { t0, t1, say0: row.start, say1: row.end };
  });
  return out;
}
export const totalFrames = (lang: Lang) => Math.ceil(TIMING[lang].total * FPS);

/** Where we are: the beat, the fraction through its slot, the slot's seconds. */
export function where(lang: Lang, sec: number) {
  const s = slots(lang);
  for (const id of BEATS) {
    const { t0, t1 } = s[id];
    if (sec < t1 || id === "outro") return { beat: id, u: clamp01((sec - t0) / (t1 - t0)), t: sec - t0, T: t1 - t0, slots: s };
  }
  throw new Error("unreachable");
}

// ---- the crank angle (degrees, unwrapped; cycle phase 0 = TDC at the start of intake) -----------------------------
const V_RUN = 600;   // deg/s while it runs fast: the piston passes ~3 times a second, under the flash limit
const V_DRIVE = 600;

export function crankDeg(lang: Lang, sec: number): number {
  const s = slots(lang);
  const T = (id: Beat) => s[id].t1 - s[id].t0;
  const hookEnd = V_RUN * T("hook");
  const revealTarget = Math.ceil((hookEnd + V_RUN * T("reveal") * 0.6 * 0.5) / 720) * 720;
  const partsEnd = revealTarget + 720;
  const strokeBase = partsEnd;
  const w = where(lang, sec);
  const u = w.u;
  switch (w.beat) {
    case "hook": return V_RUN * w.t;
    case "reveal": {
      const x = clamp01(w.t / (T("reveal") * 0.6));
      return lerp(hookEnd, revealTarget, 1 - (1 - x) * (1 - x));
    }
    case "parts": return revealTarget + 720 * smoother(span(u, 0.08, 0.95));
    case "intake": return strokeBase + 180 * smoother(span(u, 0.12, 0.86));
    case "compression": return strokeBase + 180 + 180 * smoother(span(u, 0.12, 0.86));
    case "power": {
      // the spark at 360 first, then the slam: a fast start that eases at the bottom
      const x = span(u, 0.26, 0.7);
      return strokeBase + 360 + 180 * (1 - Math.pow(1 - x, 2.4));
    }
    case "exhaust": return strokeBase + 540 + 180 * smoother(span(u, 0.12, 0.86));
    case "drive":
    case "outro": {
      const t = sec - s.drive.t0;
      const a = 1.6;
      const x = Math.min(t, a) / a;
      const ramp = V_DRIVE * a * (x * x * x - (x * x * x * x) / 2);
      return strokeBase + 720 + ramp + (t > a ? V_DRIVE * (t - a) : 0);
    }
  }
}
/** The drivetrain's phase: the crank angle plus a whole number of cycles, so the gears, chain and wheel keep the angles
 *  they had when the opening ran at 1080 deg/s (frames rendered then still line up with frames rendered now). */
export function drivePhaseDeg(lang: Lang, deg: number) {
  const s = slots(lang);
  const T = (id: Beat) => s[id].t1 - s[id].t0;
  const target = (v: number) => Math.ceil((v * T("hook") + v * T("reveal") * 0.6 * 0.5) / 720) * 720;
  return deg + target(1080) - target(V_RUN);
}
export const phase = (deg: number) => ((deg % 720) + 720) % 720;

// ---- slider-crank ---------------------------------------------------------------------------------------------
/** Crank turns counter-clockwise seen from the front (+z), as a bike's crank does with the rear wheel at +x. */
export function crankState(deg: number) {
  const th = deg * DEG;
  const { r, L } = DIM;
  const px = -r * Math.sin(th), py = r * Math.cos(th);   // crank pin
  const pinY = py + Math.sqrt(L * L - px * px);           // wrist pin
  const rodAngle = Math.asin(px / L);                      // about z, small end at the top
  return { crankAngle: th, pinY, rodAngle, crownY: pinY + DIM.pinToCrown };
}

// ---- valves ----------------------------------------------------------------------------------------------------
function bump(c: number, a: number, b: number) {
  for (const k of [-720, 0, 720]) {
    const x = c + k;
    if (x > a && x < b) { const s = Math.sin((Math.PI * (x - a)) / (b - a)); return s * s; }
  }
  return 0;
}
export const VALVE = {
  in: { open: -12, close: 205 },
  ex: { open: 505, close: 732 },
};
export function valveLift(kind: "in" | "ex", deg: number) {
  const v = VALVE[kind];
  return DIM.liftMax * bump(phase(deg), v.open, v.close);
}
/** Cam rotation about z (radians): the lobe's nose meets its valve at peak lift. Cams turn at half crank speed. */
export function camAngle(kind: "in" | "ex", deg: number) {
  const v = VALVE[kind];
  const peak = (v.open + v.close) / 2;
  const a = AXIS[kind];
  const nose = Math.atan2(-a[1], -a[0]);
  // the cam turns the same way as the crank (counter-clockwise), at half speed; unwrap against the peak
  return nose + ((deg - peak) / 2) * DEG;
}

// ---- combustion and the charge -----------------------------------------------------------------------------------
export function charge(deg: number) {
  const c = phase(deg);
  const fill = c < 180 ? smooth(c / 180) : c < 540 ? 1 : 1 - smooth((c - 540) / 180);
  const squeeze = c >= 180 && c < 360 ? smooth((c - 180) / 180) : c >= 360 && c < 380 ? 1 : 0;
  const spark = c >= 352 && c < 372 ? Math.sin(((c - 352) / 20) * Math.PI) : 0;
  const burn = c >= 356 && c < 560 ? Math.min(1, (c - 356) / 10) * Math.exp(-(c - 362) / 75) : 0;
  const burnt = c >= 360 ? 1 : 0;   // after the bang, the gas is exhaust until the next intake
  return { c, fill, squeeze, spark, burn, burnt };
}

// ---- drivetrain ------------------------------------------------------------------------------------------------
export function driveAngles(deg: number) {
  const th = deg * DEG;                                                                // crank, CCW
  const clutch = -th * (DRIVE.crankGear.teeth / DRIVE.clutch.teeth);                 // CW
  const counter = -clutch * (DRIVE.main.teeth / DRIVE.counter.teeth);                // CCW
  const rear = counter * (DRIVE.front.teeth / DRIVE.rear.teeth);                     // CCW
  return { crank: th, clutch, counter, rear };
}

// chain path around the front and rear sprockets (pitch radii), in the plane z = DRIVE.front.z
const rf = DRIVE.front.r - 0.06, rr = DRIVE.rear.r - 0.06;
const F = [DRIVE.front.x, DRIVE.front.y], R = [DRIVE.rear.x, DRIVE.rear.y];
const d = Math.hypot(R[0] - F[0], R[1] - F[1]);
const gam = Math.atan2(R[1] - F[1], R[0] - F[0]);
const alp = Math.acos((rf - rr) / d);
const aUp = gam + alp, aDn = gam - alp;
const seg1 = d * Math.sin(alp);                       // each straight run
const arcR = rr * (2 * alp), arcF = rf * (2 * Math.PI - 2 * alp);
// close the loop on the arc lengths
export const CHAIN_LEN = 2 * Math.sqrt(d * d - (rr - rf) * (rr - rf)) + arcR + arcF;
void seg1;
export const LINKS = Math.round(CHAIN_LEN / 0.16);
export const PITCH = CHAIN_LEN / LINKS;
const straight = Math.sqrt(d * d - (rr - rf) * (rr - rf));

/** A point of the chain loop at arc length s (wrapped), with the tangent's angle about z. */
export function chainAt(s: number): { x: number; y: number; a: number } {
  let x = ((s % CHAIN_LEN) + CHAIN_LEN) % CHAIN_LEN;
  const p1 = [F[0] + rf * Math.cos(aUp), F[1] + rf * Math.sin(aUp)];
  const q1 = [R[0] + rr * Math.cos(aUp), R[1] + rr * Math.sin(aUp)];
  if (x < straight) {
    const t = x / straight;
    return { x: lerp(p1[0], q1[0], t), y: lerp(p1[1], q1[1], t), a: Math.atan2(q1[1] - p1[1], q1[0] - p1[0]) };
  }
  x -= straight;
  if (x < arcR) {
    const ang = aUp - x / rr;
    return { x: R[0] + rr * Math.cos(ang), y: R[1] + rr * Math.sin(ang), a: ang - Math.PI / 2 };
  }
  x -= arcR;
  const q2 = [R[0] + rr * Math.cos(aDn), R[1] + rr * Math.sin(aDn)];
  const p2 = [F[0] + rf * Math.cos(aDn), F[1] + rf * Math.sin(aDn)];
  if (x < straight) {
    const t = x / straight;
    return { x: lerp(q2[0], p2[0], t), y: lerp(q2[1], p2[1], t), a: Math.atan2(p2[1] - q2[1], p2[0] - q2[0]) };
  }
  x -= straight;
  const ang = aDn - x / rf;
  return { x: F[0] + rf * Math.cos(ang), y: F[1] + rf * Math.sin(ang), a: ang - Math.PI / 2 };
}
/** How far the chain has moved: the front sprocket's turn times its pitch radius. The top run moves toward -x. */
export const chainTravel = (counter: number) => counter * rf;

// ---- gas particle paths ----------------------------------------------------------------------------------------
export type P3 = [number, number, number];
export const PATH_IN: P3[] = [
  [-3.35, 3.32, 0], [-2.6, 3.32, 0], [-1.75, 3.32, 0], [-1.4, 3.42, 0], [-0.95, 3.5, 0], [-0.55, 3.42, 0],
  [SEAT.in[0], SEAT.in[1], 0], [-0.25, 2.95, 0], [-0.05, 2.55, 0],
];
export const PATH_EX: P3[] = [
  [0.05, 2.6, 0], [0.25, 2.95, 0], [SEAT.ex[0], SEAT.ex[1], 0], [0.55, 3.4, 0], [0.95, 3.42, 0], [1.4, 3.3, 0],
  [1.75, 3.2, 0], [2.25, 3.12, 0], [2.7, 2.75, 0], [2.95, 2.0, 0], [3.0, 0.8, 0], [3.05, -0.4, 0], [3.35, -1.15, 0],
  [4.0, -1.45, 0], [4.8, -1.55, 0], [6.5, -1.55, 0], [8.2, -1.55, 0],
];
export function along(path: P3[], u: number): P3 {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); lens.push(l); total += l; }
  let x = clamp01(u) * total;
  for (let i = 0; i < lens.length; i++) {
    if (x <= lens[i]) { const t = x / lens[i]; return [lerp(path[i][0], path[i + 1][0], t), lerp(path[i][1], path[i + 1][1], t), 0]; }
    x -= lens[i];
  }
  return path[path.length - 1];
}
export const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
