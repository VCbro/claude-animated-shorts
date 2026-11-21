// Motion tokens. Restrained springs only: no bounce past the target, no wobble.
import { interpolate, spring, Easing } from 'remotion';

export const SPRING = {
  /** Default for text and cards: settles in ~0.6s, no overshoot. */
  calm: { damping: 200, stiffness: 120, mass: 1 },
  /** Slightly livelier, a hint of settle. For buttons and the logo. */
  soft: { damping: 26, stiffness: 140, mass: 1 },
} as const;

export const ease = Easing.bezier(0.22, 1, 0.36, 1); // expo-out style
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export function rise(frame: number, fps: number, delay = 0, config: keyof typeof SPRING = 'calm') {
  return spring({ frame: frame - delay, fps, config: SPRING[config] });
}

/** 0..1 between frame a and b with easing, clamped. */
export function seg(frame: number, a: number, b: number, easing = ease) {
  return interpolate(frame, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });
}

/** Scene envelope: fade/slide in over `inF` frames and out over the last `outF` frames. */
export function envelope(frame: number, duration: number, inF = 14, outF = 12) {
  const i = seg(frame, 0, inF);
  const o = 1 - seg(frame, duration - outF, duration, easeInOut);
  return Math.min(i, o);
}
