// Pure functions of time t (seconds) shared by the 3D world and the DOM overlays:
// scene table, watch poses, explode amounts, mechanism angles, camera path.
import * as THREE from "three";

export const FPS = 30;
export const DUR = 75;
export const FRAMES = DUR * FPS;

// scene starts (s)
export const S = { s1: 0, s2: 6.0, s3: 15.0, s4: 28.0, s5: 40.2, s6: 52.1, s7: 65.0, end: 75 };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : t < S.s6 ? 5 : t < S.s7 ? 6 : 7);
// flash-transitions (white light-leak peaks)
export const FLASHES = [S.s2, S.s3, S.s5, S.s6, S.s7];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];

// ---------------- mechanism layout (watch-local, dial normal +Z, 12 o'clock +Y, crown +X) ----------------
// Gear train with real ratios: barrel 80 -> centre pinion 10; centre 60 -> third pinion 8; third 64 -> fourth pinion 8;
// fourth 80 -> escape pinion 8. Centre wheel turns once an hour (minute hand), fourth wheel once a minute (small seconds).
export const L = {
  barrel: [-0.52, 0.735] as [number, number], center: [0, 0] as [number, number], third: [0.189, -0.594] as [number, number],
  fourth: [0, -1.1] as [number, number], escape: [0.42, -1.23] as [number, number], pallet: [0.70, -0.95] as [number, number],
  balance: [1.10, -0.55] as [number, number],
};
export const R = { barrel: 0.8, cPin: 0.1, center: 0.55, tPin: 0.0733, third: 0.48, fPin: 0.06, fourth: 0.40, ePin: 0.04, escape: 0.27, balance: 0.42 };

// ---------------- balance-wheel phase: integral of the shown beat frequency ----------------
// S1-S3 real time (2.5 Hz = 18,000 beats/h, a classic hand-wound calibre); S4 5x slow motion (0.5 Hz).
const fBal = (t: number) => {
  if (t < S.s4 - 0.6) return 2.5;
  if (t < S.s4 + 0.4) return lerp(2.5, 0.5, sstep(S.s4 - 0.6, S.s4 + 0.4, t));
  if (t < S.s5 - 0.5) return 0.5;
  return lerp(0.5, 2.5, sstep(S.s5 - 0.5, S.s5 + 0.5, t));
};
const DT = 1 / 240;
const phaseTab: number[] = [0];
for (let i = 1; i <= DUR / DT + 2; i++) phaseTab.push(phaseTab[i - 1] + fBal((i - 0.5) * DT) * DT);
export const balPhase = (t: number) => { const x = Math.max(0, t) / DT; const i = Math.floor(x); return lerp(phaseTab[i], phaseTab[i + 1] ?? phaseTab[i], x - i); };

export const AMP = 0.8 * Math.PI; // ~290 deg amplitude, like a healthy watch
export const balanceAngle = (t: number) => AMP * Math.sin(2 * Math.PI * balPhase(t));
// a beat happens at every zero crossing of the balance (twice per period)
export const beats = (t: number) => 2 * balPhase(t);
const IMP = 0.14; // part of a beat during which the escape wheel jumps
export const escSteps = (t: number) => { const u = beats(t) + IMP * 0.5; const k = Math.floor(u); return k + sstep(0, IMP, u - k); };
export const palletAngle = (t: number) => { const u = beats(t) + IMP * 0.5; const k = Math.floor(u); const s = k % 2 === 0 ? 1 : -1; return 0.16 * lerp(-s, s, sstep(0, IMP, u - k)); };
// train angles from the escape wheel (15 teeth, one tooth per two beats -> 1/30 rev per beat)
export const trainAngles = (t: number) => {
  const e = 2 * Math.PI * escSteps(t) / 30;
  const f = -e / 10;  // fourth (seconds): 5 beats/s -> escape 1/6 rev/s -> fourth 1 rev/min, clockwise
  const th = -f / 8;  // third
  const c = -th / 7.5; // centre (minutes)
  const b = -c / 8;   // barrel
  return { escape: e, fourth: f, third: th, center: c, barrel: b };
};

// mainspring wind state 0..1 (1 = fully wound) and ratchet angle
export const windAt = (t: number) => {
  if (t < 20.2) return 0.32;
  if (t < 23.0) return lerp(0.32, 1.0, sstep(20.2, 23.0, t));
  if (t < 28.0) return lerp(1.0, 0.82, sstep(23.4, 28.0, t));
  return 0.82;
};
export const ratchetAngle = (t: number) => -(windAt(Math.min(t, 23.0)) - 0.32) * 7.5;
export const crownSpin = (t: number) => (t > 20.2 && t < 23.0 ? (t - 20.2) * 9 : t >= 23 ? 2.8 * 9 : 0);

// ---------------- mechanical watch pose & explode ----------------
export type Pose = { pos: V3; rx: number; ry: number; rz: number; s: number };
export const mechPose = (t: number): Pose => {
  if (t < S.s2) { // hook: slow turntable
    const u = sstep(0, 4.4, t);
    return { pos: [0, 0, 0], rx: -0.18 + 0.1 * u, ry: lerp(-0.85, 0.12, u), rz: 0.05, s: 1 };
  }
  if (t < S.s3) { // intro + exploded view: tilt the dial up so the stack reads vertically
    const tilt = sstep(6.6, 8.6, t);
    return { pos: [0, lerp(0, -0.5, tilt), 0], rx: lerp(0, -1.12, tilt), ry: lerp(0, 0.55, sstep(6.0, 15, t)), rz: 0, s: 1 };
  }
  if (t < S.s5) return { pos: [0, 0, 0], rx: -0.62, ry: 0.0, rz: 0, s: 1 };
  if (t < S.s6) return { pos: [0, 0, 0], rx: -0.22, ry: 0.0, rz: 0, s: 1 };
  // ending: side by side
  const u = sstep(65, 75, t);
  return { pos: [-2.65, 0.2, 0], rx: -0.12, ry: 0.32 - 0.12 * u + 0.05 * Math.sin(t * 0.9), rz: 0.04, s: 1 };
};
export const explodeAt = (t: number) => (t >= S.s2 && t < S.s3 ? sstep(8.6, 10.6, t) * (1 - sstep(13.6, 15.0, t) * 0) : t >= S.s3 && t < S.s5 ? 1 : 0);
export const strapOut = (t: number) => (t >= S.s2 && t < S.s3 ? sstep(7.4, 8.8, t) : t >= S.s3 && t < S.s6 ? 1 : 0);
// local z offset per layer when exploded (dial normal is +Z)
export const EXPLODE = { crystal: 3.1, sec: 2.45, min: 2.3, hour: 2.15, dial: 1.6, movement: 0, case: -1.1, back: -2.0, crownX: 1.5 };
// dial see-through amount (1 = opaque)
export const dialOpacity = (t: number) => {
  if (t < S.s2) return 1 - 0.85 * sstep(4.1, 5.3, t);
  if (t >= S.s5 && t < S.s6) return lerp(0.18, 1, sstep(42.6, 43.4, t));
  return 1;
};
export const showUpper = (t: number) => !(t >= S.s3 && t < S.s5); // dial, hands, crystal, case visible?

// hands of the mechanical watch: display clock in seconds (10:09:30 at the start)
const HANDS0 = 10 * 3600 + 9 * 60 + 30;
const handRate = (t: number) => {
  if (t < S.s5 + 3.0) return 1;
  // S5 time-lapse: seconds (x20) -> minutes (x500) -> hours (x3600)
  if (t < 45.3) return lerp(1, 20, sstep(43.2, 43.8, t));
  if (t < 47.4) return lerp(20, 500, sstep(45.2, 45.8, t));
  if (t < 51.0) return lerp(500, 3600, sstep(47.3, 47.9, t));
  return lerp(3600, 1, sstep(51.0, 51.8, t));
};
const handTab: number[] = [HANDS0];
for (let i = 1; i <= DUR / DT + 2; i++) handTab.push(handTab[i - 1] + handRate((i - 0.5) * DT) * DT);
export const mechClock = (t: number) => { const x = Math.max(0, t) / DT; const i = Math.floor(x); return lerp(handTab[i], handTab[i + 1] ?? handTab[i], x - i); };
export const timeLapse = (t: number) => handRate(t);
// clock angles (radians, clockwise from 12, as rotation about +Z it is negative)
export const handAngles = (secs: number, tick = false) => {
  const s = tick ? Math.floor(secs) + sstep(0, 0.06, secs - Math.floor(secs)) : secs;
  return { sec: -2 * Math.PI * (s % 60) / 60, min: -2 * Math.PI * ((secs / 60) % 60) / 60, hour: -2 * Math.PI * ((secs / 3600) % 12) / 12 };
};

// ---------------- quartz watch ----------------
export const QZ = { battery: [0.55, 0.45] as [number, number], chip: [-0.42, 0.42] as [number, number], crystal: [-0.75, -0.55] as [number, number], coil: [0.45, -0.75] as [number, number] };
export const quartzPose = (t: number): Pose => {
  if (t < S.s7) {
    const flip = sstep(52.7, 53.8, t) - sstep(62.9, 63.9, t); // show the back (ry = pi) for the module, front for the final tick
    return { pos: [0, 0, 0], rx: -0.08, ry: 0.35 * (1 - sstep(52.1, 53.0, t)) + Math.PI * flip, rz: 0, s: 1 };
  }
  const u = sstep(65, 75, t);
  return { pos: [2.65, -0.2, 0], rx: -0.12, ry: -0.32 + 0.12 * u - 0.05 * Math.sin(t * 0.9 + 1), rz: -0.04, s: 1 };
};
export const quartzBackOff = (t: number) => (t >= S.s6 && t < S.s7 ? sstep(53.5, 54.4, t) * (1 - sstep(62.5, 63.3, t)) : 0);
export const quartzClock = (t: number) => 4 * 3600 + 50 * 60 + 2 + t; // real time: ticks once a second
export const crystalVib = (t: number) => (t > 56.5 && t < 63 ? sstep(56.5, 57.2, t) : 0);
export const crystalReveal = (t: number) => sstep(56.6, 57.4, t) * (1 - sstep(62.6, 63.2, t));
export const quartzCount = (t: number) => Math.round(32768 * sstep(57.4, 59.8, t));

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number; space?: "mech" | "quartz" };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3();
export const poseMatrix = (p: Pose, out = new THREE.Matrix4()) => {
  _e.set(p.rx, p.ry, p.rz, "XYZ"); _q.setFromEuler(_e);
  return out.compose(_v.set(...p.pos), _q, new THREE.Vector3(p.s, p.s, p.s));
};
const toWorld = (p: V3, pose: Pose): V3 => { poseMatrix(pose, _m); const v = new THREE.Vector3(...p).applyMatrix4(_m); return [v.x, v.y, v.z]; };

// keys per scene; "space" keys are given in watch-local coordinates (pose taken at the key's own time)
const KEYS: Key[][] = [
  [ // S1 hook: hero turntable, then dive into the dial
    { t: 0.0, pos: [0.6, 0.9, 19.0], look: [0, 0.3, 0], fov: 30, roll: -0.03 },
    { t: 3.7, pos: [0.15, 0.4, 15.0], look: [0, 0.1, 0], fov: 30, roll: 0.0 },
    { t: 6.0, pos: [0.05, -0.02, 0.5], look: [0, 0, -0.4], fov: 40, roll: 0.12 },
  ],
  [ // S2 outside view -> exploded stack
    { t: 6.0, pos: [3.2, 1.2, 12.5], look: [0, 0.1, 0], fov: 30, roll: 0.02 },
    { t: 8.6, pos: [2.2, 3.0, 13.5], look: [0, 0.4, 0], fov: 32, roll: 0.0 },
    { t: 12.6, pos: [0.6, 3.6, 13.8], look: [0, 0.55, 0], fov: 33, roll: -0.02 },
    { t: 15.0, pos: [0.2, 2.2, 6.0], look: [0, -0.8, 0], fov: 34, roll: 0.0 },
  ],
  [ // S3 mainspring + train (watch tilted, local coordinates)
    { t: 15.0, pos: [0.3, -2.6, 5.2], look: [0.05, -0.1, 0], fov: 34, space: "mech" },
    { t: 19.4, pos: [-1.0, -1.3, 3.7], look: [-0.35, 0.45, 0], fov: 33, space: "mech" },
    { t: 20.6, pos: [-0.85, -0.25, 2.3], look: [-0.52, 0.70, 0.05], fov: 32, space: "mech", roll: 0.04 },
    { t: 23.2, pos: [-0.75, -0.05, 2.05], look: [-0.5, 0.72, 0.05], fov: 32, space: "mech", roll: 0.05 },
    { t: 25.6, pos: [0.05, -1.25, 2.9], look: [0.05, -0.35, 0], fov: 33, space: "mech" },
    { t: 28.0, pos: [0.85, -1.85, 2.5], look: [0.55, -0.85, 0.05], fov: 32, space: "mech" },
  ],
  [ // S4 balance wheel + escapement
    { t: 28.0, pos: [1.7, -2.3, 3.1], look: [1.0, -0.65, 0.12], fov: 31, space: "mech", roll: 0.03 },
    { t: 32.8, pos: [1.55, -2.0, 2.65], look: [1.0, -0.62, 0.12], fov: 30, space: "mech", roll: 0.05 },
    { t: 33.6, pos: [1.0, -2.4, 2.6], look: [0.68, -1.0, 0.1], fov: 30, space: "mech", roll: -0.02 },
    { t: 37.6, pos: [0.9, -2.15, 2.3], look: [0.66, -0.98, 0.1], fov: 30, space: "mech", roll: -0.03 },
    { t: 40.2, pos: [0.7, -2.3, 3.0], look: [0.5, -0.8, 0.05], fov: 32, space: "mech" },
  ],
  [ // S5 hands
    { t: 40.2, pos: [0.0, -3.4, 6.6], look: [0, -0.3, 0], fov: 34, space: "mech" },
    { t: 43.0, pos: [0.1, -3.0, 5.6], look: [0, -0.3, 0.2], fov: 34, space: "mech" },
    { t: 43.9, pos: [0.25, -1.75, 1.75], look: [0.0, -1.1, 0.35], fov: 30, space: "mech", roll: 0.04 },
    { t: 45.3, pos: [0.15, -1.65, 1.6], look: [0.0, -1.08, 0.35], fov: 30, space: "mech", roll: 0.05 },
    { t: 46.0, pos: [0.4, -0.9, 3.3], look: [0.0, 0.15, 0.4], fov: 31, space: "mech", roll: -0.03 },
    { t: 47.5, pos: [0.3, -1.0, 3.1], look: [0.0, 0.15, 0.4], fov: 31, space: "mech", roll: -0.04 },
    { t: 48.3, pos: [0.0, -1.6, 6.6], look: [0, -0.05, 0.3], fov: 33, space: "mech" },
    { t: 52.1, pos: [0.0, -1.4, 5.9], look: [0, -0.05, 0.3], fov: 33, space: "mech", roll: 0.02 },
  ],
  [ // S6 quartz
    { t: 52.1, pos: [-1.2, 0.8, 13.0], look: [0, 0.1, 0], fov: 30 },
    { t: 54.4, pos: [-0.3, 0.6, 7.6], look: [0, 0.0, 0], fov: 31 },
    { t: 56.0, pos: [0.0, 0.4, 7.2], look: [0, 0.0, 0], fov: 31 },
    { t: 57.2, pos: [1.15, -0.25, 2.6], look: [0.75, -0.55, 0.3], fov: 30, roll: 0.04 },
    { t: 61.3, pos: [1.05, -0.35, 2.3], look: [0.75, -0.55, 0.3], fov: 30, roll: 0.05 },
    { t: 62.4, pos: [0.0, 0.2, 6.6], look: [0, -0.1, 0], fov: 31 },
    { t: 63.6, pos: [0.0, 0.2, 9.0], look: [0, 0, 0], fov: 30 },
    { t: 65.0, pos: [0.0, 0.1, 8.0], look: [0, 0, 0], fov: 30 },
  ],
  [ // S7 side by side
    { t: 65.0, pos: [0.0, 0.8, 46], look: [0, 0.3, 0], fov: 26 },
    { t: 75.0, pos: [0.0, 0.6, 42], look: [0, 0.2, 0], fov: 26, roll: 0.0 },
  ],
];
const SCENE_T = [S.s1, S.s2, S.s3, S.s4, S.s5, S.s6, S.s7, S.end];
const keyWorld = (k: Key): { pos: V3; look: V3 } => {
  if (!k.space) return { pos: k.pos, look: k.look };
  const p = k.space === "mech" ? mechPose(k.t - 1e-3 < S.s3 ? S.s3 + 0.01 : k.t) : quartzPose(k.t);
  return { pos: toWorld(k.pos, p), look: toWorld(k.look, p) };
};
export const camAt = (t: number): Cam => {
  const si = sceneAt(t) - 1;
  const ks = KEYS[si];
  let i = 0;
  while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1];
  const u = sstep(a.t, b.t, t);
  const wa = keyWorld(a), wb = keyWorld(b);
  // gentle creep so no hold is static
  const sceneU = (t - SCENE_T[si]) / (SCENE_T[si + 1] - SCENE_T[si]);
  const creep = 1 - 0.015 * sceneU;
  const look: V3 = [lerp(wa.look[0], wb.look[0], u), lerp(wa.look[1], wb.look[1], u), lerp(wa.look[2], wb.look[2], u)];
  const pos: V3 = [0, 1, 2].map((j) => look[j] + (lerp(wa.pos[j], wb.pos[j], u) - look[j]) * creep) as V3;
  return { pos, look, fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
export const makeCamera = (t: number, aspect: number, cam = new THREE.PerspectiveCamera()) => {
  const c = camAt(t);
  cam.fov = c.fov; cam.aspect = aspect; cam.near = 0.05; cam.far = 400;
  cam.position.set(...c.pos); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.look);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return cam;
};
