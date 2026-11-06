// Look constants. Measured from the reference reels (see SKILL references/STYLE_BIBLE.md).
// Dark "tech-noir explainer": near-black green-grey ground, one acid-lime accent, red only for danger.
export const C = {
  bg: "#0A0D0C",        // frame ground (ref median dark px ≈ rgb 9-13,12-18,11-18)
  bg2: "#121816",       // raised panels / vignette centre
  panel: "#161C1A",
  line: "#2A332F",
  lime: "#C4F23C",      // accent (ref lime median ≈ rgb 194,240,59)
  limeSoft: "#C4F23C55",
  red: "#E8573F",       // danger (ref ≈ rgb 219,107,82 / 194,91,45)
  redSoft: "#E8573F44",
  white: "#F3F5EF",
  grey: "#8C948F",
  dim: "#59615C",
  amber: "#FFB35A",     // warm bokeh / practical lights
  lcd: "#E8EADF",       // LCD panel face
  lcdInk: "#1C1F1B",
};

export const F = {
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

export const W = 1080, H = 1920, FPS = 30;

// Safe areas for Reels/Shorts UI: keep captions out of the bottom 22 % and right 12 %.
export const SAFE = { top: 200, left: 64, right: 150, bottom: 430 };
