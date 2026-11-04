import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 over [a, a+d] frames with ease-out. */
export const io = (f: number, a: number, d = 8, e = easeOut) => interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: e });
/** Linear map with clamp. */
export const lerp = (f: number, i: number[], o: number[], e = easeInOut) => interpolate(f, i, o, { ...clamp, easing: e });
/** Overshoot pop (scale) starting at frame `at`. */
export const pop = (f: number, at: number, damping = 11, mass = 0.6) =>
  spring({ frame: f - at, fps: FPS, config: { damping, mass, stiffness: 170 } });
/** Seconds → frames. */
export const sf = (s: number) => Math.round(s * FPS);

/** Deterministic PRNG. */
export const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Impact shake: flips sign every frame, decays over `len` frames. */
export const shake = (f: number, at: number, amp = 18, len = 8) => {
  const k = f - at;
  if (k < 0 || k > len) return { x: 0, y: 0, r: 0 };
  const d = (1 - k / len) ** 2, s = k % 2 ? -1 : 1;
  return { x: s * amp * d, y: -s * amp * 0.6 * d, r: s * 0.8 * d };
};

/** Indian number format: 1400000 -> 14,00,000 */
export const inr = (n: number, dec = 0) => n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
