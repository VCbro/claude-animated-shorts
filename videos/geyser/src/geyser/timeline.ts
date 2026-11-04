// "गीज़र पानी कैसे गर्म करता है?" with host BLAZE_B1
import * as THREE from "three";
import { VOICE_END } from "../lines";
import type { PoseName } from "../../../cast/src/cast/cast";
export const FPS = 30;
export const DUR = Math.ceil(VOICE_END);
export const FRAMES = DUR * FPS;
export const S = { s1: 0, s2: 7.4, s3: 13.1, s4: 23.8, s5: 31.3, s6: 38.6, end: DUR };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : t < S.s6 ? 5 : 6);
export const FLASHES = [S.s2, S.s4, S.s5, S.s6];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];
export const TIPS = [{ a: 32.9, b: 35.25, n: 1 }, { a: 35.4, b: 38.4, n: 2 }];
const POSES: [number, PoseName][] = [[0, "wave"], [2.9, "think"], [7.8, "point"], [13.0, "idle"], [31.5, "thumbs"], [38.9, "think"], [40.6, "hero"]];
export const hostPose = (t: number): PoseName => { let p: PoseName = "idle"; for (const [a, n] of POSES) if (t >= a) p = n; return p; };
export const hostVisible = (t: number) => sceneAt(t) === 1 || sceneAt(t) >= 5 || (t >= 7.4 && t < 12.6);
export const xray = (t: number) => (t >= S.s2 + 0.2 && t < S.s5 ? sstep(S.s2 + 0.2, S.s2 + 1.2, t) : 0);
// heat: 1 = hot tank. Cold in S2, heats in S3 (hot water collects at the top first), stays hot after.
export const heat = (t: number) => (t < S.s2 ? 1 : t < 13.6 ? 0 : t < S.s4 ? sstep(13.6, 23.4, t) : 1);
export const sliceTemp = (i: number, n: number, t: number) => clamp01(heat(t) * 1.7 - (1 - i / (n - 1)) * 0.7);
export const powerOn = (t: number) => (t >= 13.5 && t < 24.6) || t < S.s2 ? 1 : 0;
export const lampOn = (t: number) => (t < S.s2 ? 1 : powerOn(t) ? 1 : t >= S.s5 && t < 33.6 ? 1 : 0);
export const coldInAmt = (t: number) => (t >= 9.8 && t < 13.1 ? sstep(9.8, 10.4, t) : 0);
export const convAmt = (t: number) => (t >= 17.9 && t < S.s4 ? sstep(17.9, 18.6, t) : 0);
export const outAmt = (t: number) => (t < S.s2 ? 1 : t >= 20.6 && t < S.s4 ? sstep(20.6, 21.2, t) : t >= S.s6 ? 1 : 0);
export const thermoGlow = (t: number) => (t >= 24.2 && t < 27.4 ? sstep(24.2, 24.8, t) : 0);
export const insulGlow = (t: number) => (t >= 27.6 && t < S.s5 ? sstep(27.6, 28.3, t) : 0);
export const switchOff = (t: number) => (t >= 33.3 && t < S.s6 ? sstep(33.3, 33.7, t) : 0);
export const tempC = (t: number) => Math.round(lerp(20, 60, heat(t)));
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number };
const KEYS: Key[][] = [
  [{ t: 0, pos: [0.4, 2.4, 11.5], look: [-0.4, 1.9, 0], fov: 32, roll: -0.02 }, { t: S.s2, pos: [-0.3, 2.2, 10.4], look: [-0.4, 1.8, 0], fov: 32 }],
  [{ t: S.s2, pos: [1.8, 2.8, 12.0], look: [0.2, 1.9, 0], fov: 32 }, { t: 12.6, pos: [1.4, 2.4, 10.6], look: [0.4, 1.6, 0], fov: 31 }],
  [{ t: S.s3, pos: [1.0, 1.4, 4.4], look: [0.5, 1.35, 0], fov: 30, roll: 0.03 }, { t: 17.6, pos: [0.9, 1.4, 4.1], look: [0.5, 1.35, 0], fov: 30, roll: 0.04 },
   { t: 18.6, pos: [2.2, 2.8, 10.6], look: [0.7, 2.0, 0], fov: 31 }, { t: S.s4, pos: [1.8, 2.7, 10.0], look: [0.7, 1.9, 0], fov: 31 }],
  [{ t: S.s4, pos: [-0.4, 1.5, 4.4], look: [0.2, 1.4, 0.2], fov: 30, roll: -0.03 }, { t: 27.2, pos: [-0.3, 1.5, 4.1], look: [0.2, 1.4, 0.2], fov: 30 },
   { t: 28.0, pos: [2.0, 5.6, 5.4], look: [0.5, 3.2, 0], fov: 31 }, { t: S.s5, pos: [1.6, 5.4, 5.0], look: [0.5, 3.2, 0], fov: 31 }],
  [{ t: S.s5, pos: [-0.2, 2.2, 10.8], look: [-0.4, 1.8, 0], fov: 32 }, { t: 35.3, pos: [0.0, 2.1, 10.2], look: [-0.4, 1.8, 0], fov: 32 }, { t: 36.0, pos: [-1.2, 2.0, 9.6], look: [-0.6, 1.7, 0], fov: 32 }, { t: S.s6, pos: [-1.0, 2.0, 9.4], look: [-0.6, 1.7, 0], fov: 32 }],
  [{ t: S.s6, pos: [-2.0, 2.3, 11.0], look: [-0.4, 1.9, 0], fov: 32 }, { t: DUR, pos: [1.0, 2.4, 10.4], look: [-0.4, 1.9, 0], fov: 32 }],
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
