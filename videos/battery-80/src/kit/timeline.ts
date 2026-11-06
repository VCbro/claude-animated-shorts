import TL from "../data/timeline.json";
import { FPS } from "./theme";

export type Word = { w: string; t: number };
export type Line = { id: string; t0: number; t1: number; cap: string; hl: string[]; red: string[]; words: Word[] };
export const TIMELINE = TL as { fps: number; duration: number; frames: number; lines: Line[] };
export const LINES = TIMELINE.lines;
export const TOTAL = TIMELINE.frames;

export const line = (id: string): Line => {
  const l = LINES.find((x) => x.id === id);
  if (!l) throw new Error(`no line ${id}`);
  return l;
};
/** Frame where line `id` starts (+ optional seconds offset). Cuts land 2 frames before the word. */
export const at = (id: string, off = 0) => Math.round((line(id).t0 + off) * FPS) - 2;
/** Frame of the n-th word of a line (0-based). Visual hits land 0-3 frames before their word. */
export const wordAt = (id: string, n: number) => Math.round(line(id).words[Math.min(n, line(id).words.length - 1)].t * FPS) - 2;
/** Frame of the first word in line `id` that contains `needle` (case-insensitive). */
export const hit = (id: string, needle: string) => {
  const l = line(id);
  const i = l.words.findIndex((w) => w.w.toLowerCase().includes(needle.toLowerCase()));
  return wordAt(id, Math.max(0, i));
};
export const endOf = (id: string) => Math.round(line(id).t1 * FPS);
