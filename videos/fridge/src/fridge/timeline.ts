// Pure time functions for "फ्रिज ठंडा कैसे करता है?"
import * as THREE from "three";
import { VOICE_END } from "../lines";
export const FPS = 30;
export const DUR = Math.ceil(VOICE_END);
export const FRAMES = DUR * FPS;
export const S = { s1: 0, s2: 6.2, s3: 27.6, s4: 30.9, s5: 39.2, end: DUR };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : 5);
export const FLASHES = [S.s2, S.s4, S.s5];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];
export const TIPS = [{ a: 32.45, b: 34.45, n: 1 }, { a: 34.55, b: 36.6, n: 2 }, { a: 36.7, b: 39.1, n: 3 }];
// states
export const xray = (t: number) => (t >= S.s2 && t < S.s4 ? sstep(6.4, 7.4, t) : t < S.s2 ? sstep(2.6, 3.6, t) * 0.7 : 0);
export const refrigAmt = (t: number) => (t >= 10.3 && t < S.s4 ? sstep(10.3, 11.0, t) : 0);
export const heatInAmt = (t: number) => (t >= 13.7 && t < S.s3 ? sstep(13.7, 14.4, t) : t >= 6.6 && t < 10.3 ? 0.6 : 0);
export const heatOutAmt = (t: number) => (t >= 20.3 && t < S.s4 ? sstep(20.3, 21.0, t) : 0);
export const compGlow = (t: number) => (t >= 17.1 && t < S.s4 ? sstep(17.1, 17.8, t) : 0);
export const capGlow = (t: number) => (t >= 23.6 && t < S.s3 ? sstep(23.6, 24.2, t) : 0);
export const frost = (t: number) => (t < S.s4 || t >= S.s5 ? 1 : 0.6);
export const wallGap = (t: number) => (t >= 32.3 && t < 34.6 ? sstep(32.8, 33.8, t) : 0);
export const hotFood = (t: number) => t >= 34.5 && t < 36.7;
export const doorOpen = (t: number) => {
  if (t >= 36.6 && t < 39.2) { const u = (t - 36.8) / 0.8; return u < 0 ? 0 : Math.sin(Math.PI * Math.min(1, u % 1)) * 0.9; }
  return t >= S.s5 ? 0 : 0;
};
// camera
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number };
const KEYS: Key[][] = [
  [{ t: 0, pos: [3.4, 1.2, 10.5], look: [0, 0.4, 0], fov: 32, roll: -0.02 }, { t: 6.2, pos: [1.6, 1.0, 9.0], look: [0, 0.3, 0], fov: 32 }],
  [
    { t: 6.2, pos: [2.6, 1.4, 11.5], look: [0, 0.2, 0], fov: 32 },
    { t: 13.4, pos: [3.4, 1.8, 10.8], look: [0, 0.4, 0], fov: 32 },
    { t: 14.6, pos: [1.6, 2.4, 6.0], look: [0, 1.5, -0.3], fov: 31, roll: 0.02 },
    { t: 16.6, pos: [1.4, 2.3, 5.6], look: [0, 1.5, -0.3], fov: 31 },
    { t: 17.6, pos: [5.0, -0.6, -6.0], look: [0.3, -1.6, -0.9], fov: 31, roll: -0.02 },
    { t: 20.0, pos: [4.6, -0.5, -5.6], look: [0.3, -1.6, -0.9], fov: 31 },
    { t: 21.0, pos: [3.0, 1.2, -10.5], look: [0, 0.2, -0.9], fov: 32 },
    { t: 23.4, pos: [2.4, 1.0, -10.0], look: [0, 0.2, -0.9], fov: 32 },
    { t: 24.4, pos: [8.5, 1.5, -4.5], look: [0, 0.4, -0.5], fov: 32 },
    { t: 27.6, pos: [8.0, 1.6, -3.8], look: [0, 0.5, -0.5], fov: 32 },
  ],
  [{ t: 27.6, pos: [2.2, 0.8, -10.0], look: [0, 0.3, -0.9], fov: 32 }, { t: 30.9, pos: [1.6, 0.9, -9.0], look: [0, 0.4, -0.9], fov: 32 }],
  [
    { t: 30.9, pos: [7.0, 1.4, 6.5], look: [0, 0.0, -0.6], fov: 32 },
    { t: 34.4, pos: [9.0, 1.6, 2.0], look: [0, 0.0, -0.8], fov: 32 },
    { t: 35.0, pos: [3.0, 1.5, 9.5], look: [0, 0.0, 0.4], fov: 32 },
    { t: 39.2, pos: [3.6, 1.4, 10.0], look: [0, 0.0, 0.4], fov: 32 },
  ],
  [{ t: 39.2, pos: [-2.6, 1.0, 11.0], look: [0, 0.4, 0], fov: 31 }, { t: DUR, pos: [2.4, 1.1, 10.5], look: [0, 0.5, 0], fov: 31 }],
];
const ST = [S.s1, S.s2, S.s3, S.s4, S.s5, S.end];
export const camAt = (t: number): Cam => {
  const si = sceneAt(t) - 1, ks = KEYS[si];
  let i = 0; while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1], u = sstep(a.t, b.t, t);
  const creep = 1 - 0.02 * (t - ST[si]) / (ST[si + 1] - ST[si]);
  const look = [0, 1, 2].map((j) => lerp(a.look[j], b.look[j], u)) as V3;
  const pos = [0, 1, 2].map((j) => look[j] + (lerp(a.pos[j], b.pos[j], u) - look[j]) * creep) as V3;
  return { pos, look, fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
export const makeCamera = (t: number, aspect: number, cam = new THREE.PerspectiveCamera()) => {
  const c = camAt(t); cam.fov = c.fov; cam.aspect = aspect; cam.near = 0.05; cam.far = 400;
  cam.position.set(...c.pos); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.look);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return cam;
};
