// Pure time functions for "प्रेस कैसे काम करती है": scenes, iron pose, heat, thermostat cycle, camera.
import * as THREE from "three";
import { VOICE_END } from "../lines";

export const FPS = 30;
export const DUR = Math.ceil(VOICE_END);
export const FRAMES = DUR * FPS;
export const S = { s1: 0, s2: 6.2, s3: 16.1, s4: 24.7, s5: 39.25, s6: 45.15, s7: 60.5, end: DUR };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : t < S.s6 ? 5 : t < S.s7 ? 6 : 7);
export const FLASHES = [S.s2, S.s3, S.s4, S.s5, S.s6, S.s7];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];

// safety tips (overlay cards + 3D staging)
export const TIPS = [
  { a: 46.98, b: 48.9, n: 1 }, { a: 49.07, b: 51.75, n: 2 }, { a: 51.94, b: 54.45, n: 3 }, { a: 54.61, b: 57.55, n: 4 }, { a: 57.72, b: 60.3, n: 5 },
];

// ---------- iron pose ----------
// the iron lies on the board, tip toward +X; ironing passes glide it along X
export const ironX = (t: number) => {
  if (t < S.s2) return lerp(-2.6, 1.6, sstep(0.0, 5.6, t));
  if (t >= 20.0 && t < S.s4) return lerp(-2.4, 1.7, sstep(20.0, 24.3, t));
  if (t >= S.s3 && t < 20.0) return -2.4;
  return 0;
};
// covered (pressed) interval of the cloth for the current pass
export const pressed = (t: number): [number, number] | null => {
  if (t < S.s2) return [-2.6 - 1.6, ironX(t) + 1.75];
  if (t >= 20.0 && t < S.s4) return [-2.4 - 1.6, ironX(t) + 1.75];
  if (t >= S.s3 && t < 20.0) return [-99, -98];
  return null; // cloth hidden / flat elsewhere
};
export const clothVisible = (t: number) => t < S.s2 || (t >= S.s3 && t < S.s4);
// stand the iron on its heel (safety tip 4 and ending)
export const upright = (t: number) => (t >= 54.9 && t < S.s7 ? sstep(54.9, 55.9, t) : t >= S.s7 ? 1 : 0);
export const ironSpin = (_t: number) => 0;
// see-through shell (x-ray)
export const xray = (t: number) => {
  if (t >= S.s2 && t < S.s3) return sstep(6.6, 7.6, t);
  if (t >= S.s3 && t < S.s4) return 1 - sstep(16.1, 16.8, t) * 0.0;
  if (t >= S.s4 && t < S.s6) return 1;
  return 0;
};

// ---------- power, heat, thermostat ----------
// contacts closed (power flowing)?
const OFF: [number, number][] = [[32.0, 34.6], [36.6, 37.6], [38.5, 39.4]];
export const plugged = (t: number) => !(t >= 52.6 && t < 54.4) && !(t >= 56.3 && t < S.s7);
export const powerOn = (t: number) => {
  if (!plugged(t)) return 0;
  if (t >= S.s2 && t < 10.3) return 0;
  for (const [a, b] of OFF) if (t >= a && t < b) return 0;
  return 1;
};
// thermostat strip bend 0..1 (1 = bent away, contacts open)
export const bend = (t: number) => {
  let v = 0;
  for (const [a, b] of OFF) v = Math.max(v, sstep(a - 0.35, a, t) * (1 - sstep(b, b + 0.35, t)));
  return v;
};
// element / soleplate heat 0..1
export const heat = (t: number) => {
  if (t < S.s2) return 0.85;
  if (t < S.s3) return t < 10.3 ? 0.0 : sstep(10.6, 15.2, t) * 0.95;
  if (t < S.s4) return 0.95;
  if (t < S.s5) {
    // rises to 1 then gently oscillates with the thermostat
    let h = lerp(0.8, 1.0, sstep(25, 31.6, t));
    for (const [a, b] of OFF) if (t >= a) h -= 0.12 * sstep(a, Math.min(b, a + 2), t) - 0.12 * sstep(b, b + 1.6, t);
    return h;
  }
  if (t < S.s6) return 0.95;
  if (t < 56.3) return 0.9;
  return lerp(0.9, 0.7, sstep(56.3, 60, t));
};
export const lightOn = (t: number) => (plugged(t) && !(t >= S.s2 && t < 10.3) ? powerOn(t) : 0);
// voltage pulses visible
export const pulsesAmt = (t: number) => (t >= 10.2 && t < S.s3 ? sstep(10.2, 10.7, t) : t >= S.s4 && t < S.s5 ? 1 : 0) * powerOn(t);

// steam bursts
export const steamAmt = (t: number) => (t < S.s2 ? 0.45 : t >= 21 && t < S.s4 ? 0.4 : t >= S.s5 && t < S.s6 ? sstep(40.4, 41.2, t) : 0);
export const dropsAmt = (t: number) => (t >= S.s5 && t < S.s6 ? sstep(39.6, 40.0, t) * (1 - sstep(44.6, 45.0, t)) : 0);

// safety staging
export const cordDamage = (t: number) => t >= 48.9 && t < 51.9;
export const plugOut = (t: number) => (t >= 51.9 && t < 54.6 ? sstep(52.4, 53.1, t) * (1 - sstep(53.9, 54.4, t) * 0) : 0);

// ---------- camera ----------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number; follow?: boolean; k?: number };
const KEYS: Key[][] = [
  [ // S1: low glide alongside the iron over the shirt
    { t: 0.0, pos: [-1.8, 1.5, 6.6], look: [-1.0, 0.55, 0], fov: 34, roll: -0.03, follow: true },
    { t: 3.0, pos: [-0.4, 1.9, 6.0], look: [0.0, 0.6, 0], fov: 34, roll: 0.0, follow: true },
    { t: 6.2, pos: [0.6, 1.6, 4.4], look: [0.4, 0.55, 0], fov: 34, roll: 0.03, follow: true },
  ],
  [ // S2: x-ray, heating element
    { t: 6.2, pos: [1.2, 3.6, 7.0], look: [0, 0.5, 0], fov: 32 },
    { t: 10.0, pos: [0.4, 5.2, 4.8], look: [0, 0.3, 0], fov: 34, roll: 0.02 },
    { t: 13.4, pos: [-0.2, 5.0, 3.6], look: [0.0, 0.2, 0], fov: 34 },
    { t: 16.1, pos: [-0.6, 4.6, 3.4], look: [0.0, 0.2, 0], fov: 34, roll: -0.02 },
  ],
  [ // S3: soleplate + pressing
    { t: 16.1, pos: [-2.4, 0.5, 4.2], look: [-2.4, 0.15, 0], fov: 32, follow: true, k: 1.35 },
    { t: 19.8, pos: [-2.6, 0.8, 4.6], look: [-2.4, 0.2, 0], fov: 32, follow: true, k: 1.35 },
    { t: 21.0, pos: [-1.0, 2.6, 6.2], look: [-0.6, 0.3, 0], fov: 34, follow: true },
    { t: 24.7, pos: [0.4, 3.0, 6.4], look: [0.6, 0.3, 0], fov: 34, follow: true },
  ],
  [ // S4: thermostat close-up
    { t: 24.7, pos: [1.2, 2.6, 5.4], look: [0, 0.6, 0], fov: 32 },
    { t: 27.8, pos: [-0.3, 0.9, 2.6], look: [-0.3, 0.45, 0], fov: 30, roll: 0.03, k: 1.9 },
    { t: 31.2, pos: [-0.3, 0.8, 1.9], look: [-0.3, 0.45, 0], fov: 30, roll: 0.04, k: 2.1 },
    { t: 35.4, pos: [-0.25, 0.8, 1.8], look: [-0.3, 0.45, 0], fov: 30, roll: 0.05, k: 2.1 },
    { t: 36.4, pos: [0.9, 1.6, 3.4], look: [0.4, 0.75, 0.2], fov: 31 },
    { t: 39.25, pos: [1.0, 1.7, 3.2], look: [0.45, 0.75, 0.2], fov: 31, roll: -0.02 },
  ],
  [ // S5: steam (low, side)
    { t: 39.25, pos: [2.6, 1.3, 4.6], look: [0.3, 0.45, 0], fov: 32 },
    { t: 45.15, pos: [1.6, 0.9, 4.0], look: [0.2, 0.4, 0], fov: 32, roll: 0.03 },
  ],
  [ // S6: safety
    { t: 45.15, pos: [0.5, 2.2, 7.6], look: [0, 0.5, 0], fov: 32 },
    { t: 48.7, pos: [0.2, 2.0, 7.0], look: [0, 0.5, 0], fov: 32 },
    { t: 49.2, pos: [-3.0, 0.9, 3.3], look: [-3.3, 0.1, 1.1], fov: 30, roll: 0.04, k: 1.1 },
    { t: 51.6, pos: [-3.1, 0.8, 3.0], look: [-3.3, 0.1, 1.1], fov: 30, roll: 0.05, k: 1.1 },
    { t: 52.0, pos: [-5.0, 1.2, 4.6], look: [-6.1, 0.25, 1.6], fov: 30 },
    { t: 54.3, pos: [-5.2, 1.1, 4.3], look: [-6.1, 0.25, 1.6], fov: 30 },
    { t: 54.7, pos: [0.4, 2.2, 8.0], look: [-1.2, 1.0, 0], fov: 32 },
    { t: 57.5, pos: [-0.6, 2.2, 7.6], look: [-2.2, 1.5, 0], fov: 32 },
    { t: 60.5, pos: [-1.2, 2.3, 7.2], look: [-2.3, 1.6, 0], fov: 32 },
  ],
  [ // S7: hero
    { t: 60.5, pos: [1.6, 2.0, 9.2], look: [-2.3, 1.7, 0], fov: 30 },
    { t: DUR, pos: [-5.6, 2.2, 8.2], look: [-2.3, 1.8, 0], fov: 30 },
  ],
];
const SCENE_T = [S.s1, S.s2, S.s3, S.s4, S.s5, S.s6, S.s7, S.end];
export const camAt = (t: number): Cam => {
  const si = sceneAt(t) - 1;
  const ks = KEYS[si];
  let i = 0;
  while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1];
  const u = sstep(a.t, b.t, t);
  const fx = (k: Key) => (k.follow ? ironX(t) - ironX(k.t) : 0);
  const far = (k: Key, j: number) => k.look[j] + (k.pos[j] - k.look[j]) * (k.k ?? 1.75);
  const pa: V3 = [far(a, 0) + fx(a), far(a, 1), far(a, 2)], pb: V3 = [far(b, 0) + fx(b), far(b, 1), far(b, 2)];
  const la: V3 = [a.look[0] + fx(a), a.look[1], a.look[2]], lb: V3 = [b.look[0] + fx(b), b.look[1], b.look[2]];
  const sceneU = (t - SCENE_T[si]) / (SCENE_T[si + 1] - SCENE_T[si]);
  const creep = 1 - 0.02 * sceneU;
  const look: V3 = [0, 1, 2].map((j) => lerp(la[j], lb[j], u)) as V3;
  const pos: V3 = [0, 1, 2].map((j) => look[j] + (lerp(pa[j], pb[j], u) - look[j]) * creep) as V3;
  return { pos, look, fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
export const makeCamera = (t: number, aspect: number, cam = new THREE.PerspectiveCamera()) => {
  const c = camAt(t);
  cam.fov = c.fov; cam.aspect = aspect; cam.near = 0.05; cam.far = 400;
  cam.position.set(...c.pos); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.look);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return cam;
};
// iron group transform (for overlay projection): heel pivot at local (-1.62, 0, 0)
export const ironMatrix = (t: number, out = new THREE.Matrix4()) => {
  const up = upright(t), spin = ironSpin(t);
  const m = new THREE.Matrix4().makeTranslation(ironX(t), 0.03, 0);
  const ry = new THREE.Matrix4().makeRotationY(spin);
  const piv = new THREE.Matrix4().makeTranslation(-1.62, 0, 0);
  const rz = new THREE.Matrix4().makeRotationZ(up * Math.PI / 2);
  const unp = new THREE.Matrix4().makeTranslation(1.62, 0, 0);
  return out.copy(m).multiply(ry).multiply(piv).multiply(rz).multiply(unp);
};
