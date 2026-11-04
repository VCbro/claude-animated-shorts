// "वॉशिंग मशीन कैसे काम करती है?" with host GEARO_B1
import * as THREE from "three";
import { VOICE_END } from "../lines";
import type { PoseName } from "../../../cast/src/cast/cast";
export const FPS = 30;
export const DUR = Math.ceil(VOICE_END);
export const FRAMES = DUR * FPS;
export const S = { s1: 0, s2: 6.8, s3: 14.7, s4: 23.6, s5: 33.7, s6: 40.0, end: DUR };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : t < S.s6 ? 5 : 6);
export const FLASHES = [S.s2, S.s4, S.s5, S.s6];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];
export const TIPS = [{ a: 35.18, b: 37.6, n: 1 }, { a: 37.78, b: 39.8, n: 2 }];
// host pose timeline
const POSES: [number, PoseName][] = [[0, "wave"], [2.8, "think"], [7.5, "point"], [14.0, "idle"], [15.2, "point"], [23.0, "idle"], [24.0, "hero"], [28.0, "point"], [33.8, "thumbs"], [40.2, "think"], [41.8, "hero"]];
export const hostPose = (t: number): PoseName => { let p: PoseName = "idle"; for (const [a, n] of POSES) if (t >= a) p = n; return p; };
export const hostVisible = (t: number) => sceneAt(t) === 1 || sceneAt(t) >= 5 || (t >= 7.0 && t < 11.0) || (t >= 15.0 && t < 18.6);
// machine states
export const xray = (t: number) => (t >= 10.8 && t < 14.7 ? sstep(10.8, 11.6, t) : t >= 28.3 && t < S.s5 ? sstep(30.0, 30.8, t) : 0);
const spinRate = (t: number) => { // drum rev/s (shown)
  if (t < S.s3) return 0.35;
  if (t < S.s4) return 0.55 * Math.sign(Math.sin((t - S.s3) * 0.9)) || 0.55;
  if (t < S.s5) return lerp(0.6, 2.4, sstep(23.8, 25.5, t));
  return 0.3;
};
const DT = 1 / 240; const tab: number[] = [0];
for (let i = 1; i <= DUR / DT + 2; i++) tab.push(tab[i - 1] + spinRate((i - 0.5) * DT) * DT * Math.PI * 2);
export const drumAngle = (t: number) => { const x = Math.max(0, t) / DT, i = Math.floor(x); return lerp(tab[i], tab[i + 1] ?? tab[i], x - i); };
export const spinning = (t: number) => (t >= 24.2 && t < S.s5 ? sstep(24.2, 25.5, t) : 0);
export const waterLevel = (t: number) => (t < S.s3 ? 0.15 : t < 18.0 ? lerp(0.15, 0.55, sstep(15.0, 18.0, t)) : t < S.s4 ? 0.55 : lerp(0.55, 0.0, sstep(24.0, 29.0, t)));
export const inletAmt = (t: number) => (t >= 14.9 && t < 18.6 ? 1 : 0);
export const foamAmt = (t: number) => (t >= 16.5 && t < 24.5 ? sstep(16.5, 17.5, t) * (1 - sstep(24.0, 24.5, t)) : 0);
export const flingAmt = (t: number) => (t >= 25.0 && t < 31.5 ? sstep(25.0, 25.8, t) : 0);
export const drainAmt = (t: number) => (t >= 29.5 && t < S.s5 ? sstep(29.5, 30.2, t) : 0);
export const rpm = (t: number) => Math.round(1200 * sstep(23.8, 26.0, t));
export const overload = (t: number) => t >= 35.0 && t < 37.7;
export const filterOut = (t: number) => (t >= 37.6 && t < 39.9 ? sstep(37.9, 38.6, t) : 0);
// camera
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number };
const KEYS: Key[][] = [
  [{ t: 0, pos: [0.6, 1.8, 11.0], look: [-0.5, 1.3, 0], fov: 32, roll: -0.02 }, { t: 6.8, pos: [-0.2, 1.7, 9.8], look: [-0.5, 1.3, 0], fov: 32 }],
  [{ t: 6.8, pos: [1.5, 2.2, 8.8], look: [0.2, 1.3, 0], fov: 32 }, { t: 10.6, pos: [1.0, 2.0, 7.4], look: [0.4, 1.3, 0.4], fov: 31 },
   { t: 11.6, pos: [7.0, 2.6, -5.0], look: [0.4, 1.0, -0.4], fov: 31, roll: -0.02 }, { t: 14.7, pos: [6.4, 2.4, -4.6], look: [0.4, 1.0, -0.4], fov: 31 }],
  [{ t: 14.7, pos: [-0.8, 2.6, 8.6], look: [0.0, 1.4, 0], fov: 32 }, { t: 18.6, pos: [-0.4, 2.4, 8.0], look: [0.1, 1.4, 0], fov: 32 },
   { t: 19.4, pos: [0.4, 1.3, 4.6], look: [0.4, 1.2, 0.8], fov: 30, roll: 0.03 }, { t: 23.6, pos: [0.5, 1.25, 4.3], look: [0.4, 1.2, 0.8], fov: 30, roll: 0.04 }],
  [{ t: 23.6, pos: [0.5, 1.3, 5.0], look: [0.4, 1.2, 0.8], fov: 30 }, { t: 28.0, pos: [0.4, 1.3, 4.6], look: [0.4, 1.2, 0.8], fov: 30, roll: -0.03 },
   { t: 29.0, pos: [3.6, 1.6, 7.6], look: [0.4, 0.6, 0], fov: 31 }, { t: 33.7, pos: [3.2, 1.5, 7.2], look: [0.4, 0.6, 0], fov: 31 }],
  [{ t: 33.7, pos: [-0.2, 1.9, 10.0], look: [-0.4, 1.2, 0], fov: 32 }, { t: 37.6, pos: [0.0, 1.8, 9.6], look: [-0.4, 1.2, 0], fov: 32 },
   { t: 38.2, pos: [1.6, 0.8, 5.2], look: [0.9, 0.35, 0.9], fov: 31 }, { t: 40.0, pos: [1.5, 0.8, 5.0], look: [0.9, 0.35, 0.9], fov: 31 }],
  [{ t: 40.0, pos: [-2.0, 1.8, 10.5], look: [-0.5, 1.3, 0], fov: 32 }, { t: DUR, pos: [1.0, 1.9, 10.0], look: [-0.5, 1.3, 0], fov: 32 }],
];
const ST = [S.s1, S.s2, S.s3, S.s4, S.s5, S.s6, S.end];
export const camAt = (t: number): Cam => {
  const si = sceneAt(t) - 1, ks = KEYS[si]; let i = 0; while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1], u = sstep(a.t, b.t, t), creep = 1 - 0.02 * (t - ST[si]) / (ST[si + 1] - ST[si]);
  const look = [0, 1, 2].map((j) => lerp(a.look[j], b.look[j], u)) as V3;
  const pos = [0, 1, 2].map((j) => look[j] + (lerp(a.pos[j], b.pos[j], u) - look[j]) * creep) as V3;
  return { pos, look, fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
export const makeCamera = (t: number, aspect: number, cam = new THREE.PerspectiveCamera()) => {
  const c = camAt(t); cam.fov = c.fov; cam.aspect = aspect; cam.near = 0.05; cam.far = 400;
  cam.position.set(...c.pos); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.look); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return cam;
};
