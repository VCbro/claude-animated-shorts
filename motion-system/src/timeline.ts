// Shared timing: used by the composition, the sound designer and the preview script,
// so picture, sound and QA frames always agree.
import type { Campaign, Format } from './schema';

export const SCENE_ORDER = ['title', 'ui', 'data', 'cta'] as const;
export type SceneName = (typeof SCENE_ORDER)[number];

export const FORMAT_SIZE: Record<Format, { width: number; height: number }> = {
  '16x9': { width: 1920, height: 1080 },
  '1x1': { width: 1080, height: 1080 },
  '9x16': { width: 1080, height: 1920 },
};

export type Span = { name: SceneName; from: number; duration: number };

export function timeline(c: Campaign): { spans: Span[]; total: number } {
  let from = 0;
  const spans = SCENE_ORDER.map((name) => {
    const duration = Math.round(c.scenes[name].duration * c.fps);
    const s = { name, from, duration };
    from += duration;
    return s;
  });
  return { spans, total: from };
}

/** Local frame (inside the UI scene) at which the cursor clicks the button. */
export const uiClickFrame = (fps: number) => Math.round(3.4 * fps);
