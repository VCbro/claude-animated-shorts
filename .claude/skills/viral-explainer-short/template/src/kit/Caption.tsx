import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F, SAFE, FPS } from "./theme";
import { io } from "./anim";
import { LINES, Line } from "./timeline";

/**
 * Kinetic captions, the signature of the format:
 *  - Bold sans, left-aligned, top third, max 2 lines, phrase by phrase (≤ 6 words per phrase).
 *  - Each word rises 14 px + fades in over 4 f at its spoken time.
 *  - Highlight words (line.hl) in lime, danger words (line.red) in red.
 *  - Phrase stays until the next phrase starts (or 0.35 s after the line ends).
 * Per-line placement override via `place` (e.g. {L4: "center"}). Hidden lines via `hide`.
 */
type Place = "top" | "center" | "low";
const clean = (s: string) => s.replace(/[.,!?:;]/g, "").toLowerCase();

const phrases = (l: Line) => {
  const out: { s: number; e: number }[] = [];
  let s = 0;
  l.words.forEach((w, i) => {
    const end = /[.?!]$/.test(w.w) || (/,$/.test(w.w) && i - s >= 2) || i - s >= 5;
    if (end || i === l.words.length - 1) { out.push({ s, e: i + 1 }); s = i + 1; }
  });
  // never leave a 1-word tail when the sentence carries on (merge it back)
  for (let i = out.length - 1; i > 0; i--) {
    const p = out[i], q = out[i - 1];
    if (p.e - p.s === 1 && !/[.?!]$/.test(l.words[q.e - 1].w) && q.e - q.s <= 5) { q.e = p.e; out.splice(i, 1); }
  }
  return out;
};

/** mode "rise" = classic word-by-word rise. mode "karaoke" = whole phrase shows dim, the spoken word gets a lime
 *  (or red) marker box, keywords (hl/red) punch 1.22x bigger. */
export type CaptionMode = "rise" | "karaoke";
export const Captions: React.FC<{ place?: Record<string, Place>; hide?: string[]; size?: number; mode?: CaptionMode }> = ({ place = {}, hide = [], size = 78, mode = "rise" }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  // active phrase across all lines
  let cur: { l: Line; s: number; e: number; t0: number } | null = null;
  for (let li = 0; li < LINES.length; li++) {
    const l = LINES[li];
    if (hide.includes(l.id)) continue;
    const ps = phrases(l);
    ps.forEach((p, pi) => {
      const t0 = l.words[p.s].t - 0.04;
      const next = pi < ps.length - 1 ? l.words[ps[pi + 1].s].t - 0.04 : Math.min(l.t1 + 0.35, LINES[li + 1]?.t0 ?? 1e9);
      if (t >= t0 && t < next) cur = { l, s: p.s, e: p.e, t0 };
    });
  }
  if (!cur) return null;
  const { l, s, e } = cur as { l: Line; s: number; e: number };
  const pl = place[l.id] ?? "top";
  const top = pl === "top" ? SAFE.top + 90 : pl === "center" ? 820 : 1180;
  const hl = l.hl.map(clean), red = l.red.map(clean);
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top, fontFamily: F.sans, fontWeight: 800,
      fontSize: size, lineHeight: 1.04, letterSpacing: -size * 0.035, color: C.white,
      textShadow: "0 4px 28px rgba(0,0,0,.75), 0 1px 2px rgba(0,0,0,.6)" }}>
      {l.words.slice(s, e).map((w, i) => {
        const wf = Math.round(w.t * FPS) - 1;
        const c = clean(w.w);
        const isRed = red.includes(c) || red.includes(w.w.toLowerCase()), isHl = hl.includes(c);
        const col = isRed ? C.red : isHl ? C.lime : C.white;
        if (mode === "karaoke") {
          const idx = s + i, nextT = l.words[idx + 1]?.t ?? l.t1 + 0.2;
          const on = t >= w.t - 0.03, live = on && t < nextT - 0.03;
          const k = io(f, wf, 3), big = isRed || isHl ? 1.22 : 1;
          const box = live ? (isRed ? C.red : C.lime) : "transparent";
          return (
            <span key={i} style={{ display: "inline-block", marginRight: size * 0.18, padding: `0 ${size * 0.1}px`, borderRadius: size * 0.16,
              background: box, color: live ? "#0A0D0C" : on ? col : "rgba(243,245,239,.38)", fontSize: size * big,
              transform: `scale(${live ? 1 + 0.08 * (1 - k) + 0.04 : 1})`, transformOrigin: "50% 60%",
              textShadow: live ? "none" : undefined, boxShadow: live ? `0 0 30px ${box}88` : "none" }}>{w.w}</span>
          );
        }
        const k = io(f, wf, 4);
        return (
          <span key={i} style={{ display: "inline-block", marginRight: size * 0.24, color: col, opacity: k,
            transform: `translateY(${(1 - k) * 14}px)` }}>{w.w}</span>
        );
      })}
    </div>
  );
};
