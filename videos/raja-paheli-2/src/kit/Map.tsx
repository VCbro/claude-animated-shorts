import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { io, lerp } from "./anim";
import IND from "../data/india_dots.json";

type City = keyof typeof IND.cities;

/**
 * Dot-matrix India (official outline). Dots reveal top→bottom from `at`; optional tint wave (e.g. red "blacklist"
 * spreading from a city), city pings with labels, and arcs between cities (phone travelled, money moved).
 * Map is drawn at width `w` centred on (x, y).
 */
export const IndiaMap: React.FC<{ at?: number; x?: number; y?: number; w?: number; color?: string; spread?: { from: City; at: number; color?: string; dur?: number };
  pings?: { city: City; at: number; color?: string; label?: string }[]; arcs?: { a: City; b: City; at: number; color?: string }[] }> = ({ at = 0, x = 540, y = 1000, w = 900, color = "#5E6862", spread, pings = [], arcs = [] }) => {
  const f = useCurrentFrame();
  const s = w / IND.w, h = IND.h * s;
  const P = (c: City) => [IND.cities[c][0] * s, IND.cities[c][1] * s];
  const sp = spread ? P(spread.from) : null;
  const R = spread ? lerp(f, [spread.at, spread.at + (spread.dur ?? 40)], [0, 1300]) : 0;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        {IND.dots.map(([dx, dy], i) => {
          const px = dx * s, py = dy * s;
          const k = io(f, at + (py / h) * 18, 6);
          let fill = color;
          if (sp && f >= spread!.at) { const d = Math.hypot(px - sp[0], py - sp[1]); if (d < R) fill = spread!.color ?? C.red; }
          return <circle key={i} cx={px} cy={py} r={w / 290 * k} fill={fill} opacity={0.85} />;
        })}
        {arcs.map((a, i) => {
          const [x1, y1] = P(a.a), [x2, y2] = P(a.b);
          const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.25 - 60;
          const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
          const k = io(f, a.at, 22);
          return <path key={i} d={d} fill="none" stroke={a.color ?? C.lime} strokeWidth={5} strokeLinecap="round" strokeDasharray={2000} strokeDashoffset={2000 * (1 - k)} style={{ filter: `drop-shadow(0 0 8px ${a.color ?? C.lime})` }} />;
        })}
      </svg>
      {pings.map((p, i) => {
        if (f < p.at) return null;
        const [px, py] = P(p.city), col = p.color ?? C.lime, k = ((f - p.at) / 30) % 1;
        return <React.Fragment key={i}>
          <div style={{ position: "absolute", left: px - 60, top: py - 60, width: 120, height: 120, borderRadius: 60, border: `3px solid ${col}`, transform: `scale(${0.2 + k})`, opacity: 1 - k }} />
          <div style={{ position: "absolute", left: px - 11, top: py - 11, width: 22, height: 22, borderRadius: 11, background: col, boxShadow: `0 0 24px ${col}` }} />
          {p.label && <div style={{ position: "absolute", left: px + 24, top: py - 16, color: C.white, fontFamily: F.mono, fontSize: 26, letterSpacing: 2, opacity: io(f, p.at + 4, 6), whiteSpace: "nowrap" }}>{p.label.toUpperCase()}</div>}
        </React.Fragment>;
      })}
    </div>
  );
};
