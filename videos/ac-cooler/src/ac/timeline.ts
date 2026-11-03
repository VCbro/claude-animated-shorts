// Pure time functions for "AC ठंडा कैसे करता है? / कूलर का पानी कहाँ जाता है?"
import * as THREE from "three";
import { VOICE_END } from "../lines";

export const FPS = 30;
export const DUR = Math.ceil(VOICE_END);
export const FRAMES = DUR * FPS;
export const S = { s1: 0, s2: 7.2, s3: 28.45, s4: 40.45, s5: 54.0, s6: 61.9, end: DUR };
export const sceneAt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? 2 : t < S.s4 ? 3 : t < S.s5 ? 4 : t < S.s6 ? 5 : 6);
export const FLASHES = [S.s2, S.s3, S.s4, S.s6];
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const sstep = (a: number, b: number, x: number) => { const u = clamp01((x - a) / (b - a)); return u * u * u * (u * (u * 6 - 15) + 10); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export type V3 = [number, number, number];

// layout: indoor unit (room, top) and outdoor unit (outside, bottom), separated by a wall band at y = 0
export const IN = { pos: [0, 2.35, 0] as V3 };
export const OUT = { pos: [0, -2.35, 0] as V3 };
export const COOLER = { pos: [0, 0, 0] as V3 };

// what is shown
export const acVisible = (t: number) => t < S.s4 || t >= S.s6;
export const coolerVisible = (t: number) => (t >= S.s4 && t < S.s6) || t >= S.s6 || t < 4.0 && t >= 3.9 && false;
export const xrayAC = (t: number) => (t >= S.s2 && t < S.s4 ? sstep(S.s2 + 0.3, S.s2 + 1.3, t) : 0);
export const xrayCooler = (t: number) => (t >= S.s4 && t < S.s6 ? sstep(S.s4 + 1.4, S.s4 + 2.4, t) : 0);
// refrigerant flow & roles
export const refrigAmt = (t: number) => (t >= 11.4 && t < S.s3 ? sstep(11.4, 12.2, t) : t >= S.s3 && t < S.s4 ? 0.6 : 0);
export const heatInAmt = (t: number) => (t < S.s2 ? 0 : t < S.s3 ? sstep(15.2, 16.0, t) : t < S.s4 ? 0.4 : 0);
export const heatOutAmt = (t: number) => (t >= 7.6 && t < 11.4 ? sstep(7.6, 8.3, t) : t >= 18.6 && t < S.s3 ? sstep(18.6, 19.4, t) : 0);
export const coldAirAmt = (t: number) => (t < S.s2 ? 1 : t < S.s3 ? sstep(15.4, 16.4, t) : t < S.s4 ? 0.6 : t >= S.s6 ? 0.8 : 0);
export const compressorGlow = (t: number) => (t >= 18.6 && t < S.s3 ? sstep(18.6, 19.6, t) : 0);
export const valveGlow = (t: number) => (t >= 24.0 && t < S.s3 ? sstep(24.0, 24.6, t) : 0);
export const fanSpeed = (t: number) => (t < S.s2 ? 0.4 : 2.2);
// condensation
export const humidAmt = (t: number) => (t >= 30.5 && t < S.s4 ? sstep(30.5, 31.3, t) : 0);
export const dropsGrow = (t: number) => (t >= 31.4 && t < S.s4 ? sstep(31.4, 34.5, t) : t < S.s2 ? 1 : t >= S.s6 ? 1 : 0);
export const drainAmt = (t: number) => (t < S.s2 ? 1 : t >= 37.4 && t < S.s4 ? sstep(37.4, 38.0, t) : t >= S.s6 ? 1 : 0);
// cooler
export const pumpAmt = (t: number) => (t >= 41.4 && t < S.s6 ? sstep(41.4, 42.4, t) : t >= S.s6 ? 1 : 0);
export const trickleAmt = (t: number) => (t >= 43.4 && t < S.s6 ? sstep(43.4, 44.4, t) : t >= S.s6 ? 1 : 0);
export const airInAmt = (t: number) => (t >= 45.5 && t < S.s6 ? sstep(45.5, 46.3, t) : t >= S.s6 ? 0.7 : 0);
export const vapourAmt = (t: number) => (t >= 48.4 && t < S.s5 ? sstep(48.4, 49.4, t) * 0.6 : t >= S.s5 && t < S.s6 ? 1 : 0);
export const tankLevel = (t: number) => (t < S.s5 + 1.0 ? 1 : lerp(1, 0.45, sstep(S.s5 + 1.0, S.s6 - 0.6, t)));
export const humidity = (t: number) => Math.round(lerp(35, 78, sstep(54.6, 60.5, t)));

// ---------- camera ----------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { t: number; pos: V3; look: V3; fov: number; roll?: number };
const KEYS: Key[][] = [
  [ // S1 hook: AC blowing + dripping, then reveal both
    { t: 0.0, pos: [2.6, 2.6, 12.5], look: [1.0, 1.7, 0], fov: 32, roll: -0.03 },
    { t: 3.8, pos: [1.8, 1.6, 13.0], look: [1.2, 1.0, 0], fov: 32 },
    { t: 7.2, pos: [0.2, 0.0, 21.0], look: [0, -0.3, 0], fov: 30 },
  ],
  [ // S2 cycle: full diagram, then compressor, then back up
    { t: 7.2, pos: [0.0, 0.0, 21.0], look: [0, -0.3, 0], fov: 30 },
    { t: 15.0, pos: [0.3, 0.1, 20.0], look: [0, -0.2, 0], fov: 30 },
    { t: 16.0, pos: [0.8, 3.2, 9.6], look: [0, 2.1, 0], fov: 31, roll: 0.02 },
    { t: 18.3, pos: [0.6, 3.1, 9.2], look: [0, 2.1, 0], fov: 31 },
    { t: 19.3, pos: [2.0, -1.5, 10.2], look: [0.3, -2.4, 0], fov: 31, roll: -0.02 },
    { t: 23.7, pos: [1.6, -1.6, 9.6], look: [0.3, -2.4, 0], fov: 31 },
    { t: 24.8, pos: [0.0, 0.0, 20.6], look: [0, -0.3, 0], fov: 30 },
    { t: 28.45, pos: [0.2, 0.0, 19.8], look: [0, -0.3, 0], fov: 30 },
  ],
  [ // S3 condensation close-up on the indoor coil, then the drain
    { t: 28.45, pos: [0.8, 2.6, 4.2], look: [0.2, 2.25, 0], fov: 30 },
    { t: 31.0, pos: [0.4, 2.4, 2.9], look: [0.2, 2.2, 0], fov: 30, roll: 0.03 },
    { t: 36.8, pos: [0.3, 2.35, 2.6], look: [0.2, 2.15, 0], fov: 30, roll: 0.04 },
    { t: 38.0, pos: [3.6, 1.0, 7.0], look: [1.4, 0.6, 0], fov: 31 },
    { t: 40.45, pos: [3.4, 0.6, 6.6], look: [1.5, 0.2, 0], fov: 31 },
  ],
  [ // S4 cooler cutaway
    { t: 40.45, pos: [4.4, 2.2, 13.0], look: [0, 0.1, 0], fov: 30 },
    { t: 43.0, pos: [2.8, 1.9, 10.6], look: [0, 0.2, 0], fov: 30 },
    { t: 45.4, pos: [-4.2, 1.5, 9.8], look: [0, 0.2, 0], fov: 30, roll: -0.02 },
    { t: 48.3, pos: [-3.4, 1.2, 9.4], look: [0, 0.2, 0], fov: 30 },
    { t: 50.0, pos: [1.3, 1.0, 11.6], look: [0, 0.4, 0], fov: 30 },
    { t: 54.0, pos: [0.8, 1.1, 11.0], look: [0, 0.4, 0], fov: 30 },
  ],
  [ // S5 vapour into the room
    { t: 54.0, pos: [0.8, 1.1, 11.0], look: [0, 0.4, 0], fov: 30 },
    { t: 58.0, pos: [-1.8, 2.2, 12.0], look: [0, 1.2, 0], fov: 30 },
    { t: 61.9, pos: [-2.2, 2.4, 12.6], look: [0, 1.3, 0], fov: 30 },
  ],
  [ // S6 side by side
    { t: 61.9, pos: [0, 0.6, 18.0], look: [0, 0.4, 0], fov: 30 },
    { t: DUR, pos: [0, 0.5, 16.5], look: [0, 0.4, 0], fov: 30 },
  ],
];
const SCENE_T = [S.s1, S.s2, S.s3, S.s4, S.s5, S.s6, S.end];
export const camAt = (t: number): Cam => {
  const si = sceneAt(t) - 1; const ks = KEYS[si];
  let i = 0; while (i < ks.length - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1]; const u = sstep(a.t, b.t, t);
  const sceneU = (t - SCENE_T[si]) / (SCENE_T[si + 1] - SCENE_T[si]); const creep = 1 - 0.02 * sceneU;
  const look: V3 = [0, 1, 2].map((j) => lerp(a.look[j], b.look[j], u)) as V3;
  const pos: V3 = [0, 1, 2].map((j) => look[j] + (lerp(a.pos[j], b.pos[j], u) - look[j]) * creep) as V3;
  return { pos, look, fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
export const makeCamera = (t: number, aspect: number, cam = new THREE.PerspectiveCamera()) => {
  const c = camAt(t); cam.fov = c.fov; cam.aspect = aspect; cam.near = 0.05; cam.far = 400;
  cam.position.set(...c.pos); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.look);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return cam;
};
// S6 placement of the two machines
export const endPose = (t: number) => ({ ac: { pos: [0, 2.6, 0] as V3, s: 0.8 }, cooler: { pos: [0, -2.3, 0] as V3, s: 0.72 }, u: sstep(S.s6, S.s6 + 1, t) });
