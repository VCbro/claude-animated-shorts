import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { lerp } from "./anim";

/**
 * Flat 2D illustration kit (cheap to build, fast to render): warm storybook palette, thick ink outline,
 * soft long shadows. Everything is plain SVG at 1080x1920. `Pan` gives every hold a camera move.
 */
export const P = {
  ink: "#2b1a12", sky1: "#5fb3d9", sky2: "#bfe3ee", sand: "#e8c28a", sand2: "#d6a868", stone: "#d99a5b", stone2: "#b9763f",
  wood: "#8a4b24", wood2: "#6b3517", iron: "#5d6266", iron2: "#c9ced0", hill: "#c98a52", hill2: "#a96b3a", leaf: "#6d9a3a",
  red: "#e8573f", lime: "#C4F23C", white: "#fff8ec", grey: "#8c8a86",
};
export const ink = { stroke: P.ink, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Day sky with sun + soft clouds + distant dunes. */
export const SkyBG: React.FC<{ warm?: number }> = ({ warm = 0 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={warm ? "#f39c5a" : P.sky1} /><stop offset="1" stopColor={warm ? "#fde2b0" : P.sky2} /></linearGradient></defs>
        <rect width={1080} height={1920} fill="url(#sk)" />
        <circle cx={840} cy={360} r={90} fill="#fff3c4" opacity={0.95} />
        {[[160, 300, 1], [620, 520, 0.8], [900, 760, 0.6]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${((x + f * (0.3 + i * 0.1)) % 1300) - 110},${y}) scale(${s})`} opacity={0.9}>
            <ellipse cx={0} cy={0} rx={90} ry={34} fill="#fff" /><ellipse cx={60} cy={-20} rx={60} ry={34} fill="#fff" /><ellipse cx={-50} cy={-12} rx={50} ry={28} fill="#fff" />
          </g>))}
        <path d="M0 1240 Q 200 1150 420 1220 T 820 1190 T 1080 1210 L 1080 1920 L 0 1920 Z" fill={P.sand2} opacity={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/** Camera move over a full-frame layer: from (x,y,s) to (x,y,s), focus coordinates in frame px. */
export const Pan: React.FC<{ d: number; from: [number, number, number]; to: [number, number, number]; children: React.ReactNode }> = ({ d, from, to, children }) => {
  const f = useCurrentFrame();
  const x = lerp(f, [0, d], [from[0], to[0]]), y = lerp(f, [0, d], [from[1], to[1]]), s = lerp(f, [0, d], [from[2], to[2]]);
  return <AbsoluteFill style={{ transform: `translate(${540 - x * s}px, ${960 - y * s}px) scale(${s})`, transformOrigin: "0 0" }}>{children}</AbsoluteFill>;
};
