import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { io } from "./anim";
import { F } from "./theme";

/**
 * Cinematic explainer look (skill styles 13 "Cinematic Story 3D" and 14 "Cinematic Macro 3D").
 * Low-key 3D under a film grade: condensed caps title at the top with a short red underline, a small typewriter
 * label low in the frame, the channel handle at the very top, teal shadows / amber highlights, heavy vignette, grain.
 */
export const CINE = { paper: "#EFE7D6", red: "#E4503A", teal: "#0C2526", amber: "#E3A552", ink: "#07090A" };

/** Top title: 1-2 lines, Anton caps. `underline` = which line gets the red bar. Fades up over 8 frames at `at`. */
export const CineTitle: React.FC<{ at?: number; lines: string[]; color?: string; y?: number; size?: number; underline?: number }> = ({ at = 4, lines, color = CINE.paper, y = 210, size = 104, underline = lines.length - 1 }) => {
  const f = useCurrentFrame(), k = io(f, at, 9);
  return <div style={{ position: "absolute", top: y + (1 - k) * 18, width: "100%", textAlign: "center", opacity: k, fontFamily: "Anton, Impact, sans-serif", textTransform: "uppercase", color, fontSize: size, lineHeight: 1.06, letterSpacing: 2, textShadow: "0 6px 26px rgba(0,0,0,.75), 0 2px 0 rgba(0,0,0,.5)" }}>
    {lines.map((l, i) => <div key={i}>{l}{i === underline && <div style={{ margin: "10px auto 0", width: 150, height: 7, background: CINE.red, transform: `scaleX(${io(f, at + 6, 8)})` }} />}</div>)}
  </div>;
};

/** Small typewriter label (wipes in). red = alert label. */
export const CineLabel: React.FC<{ at?: number; text: string; y?: number; red?: boolean }> = ({ at = 10, text, y = 1470, red = false }) => {
  const f = useCurrentFrame(), k = io(f, at, 8);
  return <div style={{ position: "absolute", top: y, width: "100%", display: "flex", justifyContent: "center" }}>
    <div style={{ clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, background: red ? CINE.red : "rgba(8,10,10,.82)", color: CINE.paper, fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 7, padding: "12px 22px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{text}</div>
  </div>;
};

export const CineHandle: React.FC<{ text: string }> = ({ text }) => <div style={{ position: "absolute", top: 64, width: "100%", textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: CINE.paper, opacity: 0.6 }}>{text}</div>;

/** Film finish over the picture: split-tone tint, vignette, animated grain. Put it above the 3D, below the text. */
export const CineGrade: React.FC<{ tone?: "teal" | "red" | "amber"; vignette?: number; grain?: number }> = ({ tone = "teal", vignette = 0.82, grain = 0.16 }) => {
  const f = useCurrentFrame();
  const tint = tone === "red" ? "linear-gradient(180deg,#5A1410 0%,#2A0907 100%)" : tone === "amber" ? "linear-gradient(180deg,#6B4A1E 0%,#1B2A2A 100%)" : "linear-gradient(180deg,#123B3C 0%,#3A2A12 100%)";
  return <>
    <AbsoluteFill style={{ background: tint, mixBlendMode: "soft-light", opacity: 0.75 }} />
    <AbsoluteFill style={{ background: `radial-gradient(95% 70% at 50% 48%, rgba(0,0,0,0) 38%, rgba(0,0,0,${vignette}) 100%)` }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 72%, rgba(0,0,0,.6) 100%)" }} />
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}>
      <filter id="cg"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#cg)" />
    </svg>
  </>;
};

/** Halftone dot wall behind a hero object (macro style). */
export const DotWall: React.FC<{ color?: string; bg?: string }> = ({ color = "#1E6E6A", bg = "#06181A" }) => (
  <AbsoluteFill style={{ background: bg }}><AbsoluteFill style={{ backgroundImage: `radial-gradient(${color} 32%, transparent 34%)`, backgroundSize: "64px 64px", opacity: 0.55, maskImage: "radial-gradient(70% 45% at 50% 50%, black 30%, transparent 100%)", WebkitMaskImage: "radial-gradient(70% 45% at 50% 50%, black 30%, transparent 100%)" }} /></AbsoluteFill>
);
