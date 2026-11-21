// Layout tokens per aspect ratio. Templates read these instead of hard-coding pixels.
import type { Format } from '../schema';
import { FORMAT_SIZE } from '../timeline';

export type Layout = {
  format: Format;
  w: number;
  h: number;
  /** Safe-area padding: nothing important may sit outside it. */
  pad: number;
  /** Type scale multiplier (1 = 1080px short side). */
  s: number;
  portrait: boolean;
  square: boolean;
  type: { hero: number; title: number; body: number; small: number; kpi: number };
};

export function layoutFor(format: Format): Layout {
  const { width: w, height: h } = FORMAT_SIZE[format];
  const portrait = h > w;
  const square = h === w;
  const s = Math.min(w, h) / 1080;
  const hero = format === '16x9' ? 128 : format === '1x1' ? 100 : 120;
  return {
    format, w, h, portrait, square, s,
    pad: format === '16x9' ? 128 : 96,
    type: { hero, title: 56, body: 34, small: 24, kpi: 52 },
  };
}
