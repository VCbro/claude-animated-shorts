import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { clamp, inr, io, lerp, pop } from "./anim";
import { interpolate } from "remotion";

/** Label chip (the "JUMP TRICK" / "₹50,000 FINE" style): solid box, wipes in from the left at `at`. */
export const Chip: React.FC<{ at: number; x: number; y: number; lines: string[]; color?: string; bg?: string; size?: number; mono?: boolean; rot?: number }> = ({ at, x, y, lines, color = C.lime, bg = "rgba(10,13,12,.88)", size = 64, mono = false, rot = 0 }) => {
  const f = useCurrentFrame();
  const k = io(f, at, 6);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "table", background: bg, color: i === 0 ? color : C.white, padding: `${size * 0.08}px ${size * 0.2}px`, marginBottom: 4,
          fontFamily: mono ? F.mono : F.sans, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: mono ? 1 : -size * 0.03, borderRadius: 6 }}>{l}</div>
      ))}
    </div>
  );
};

/** Solid accent pill (lime bg, black text) – for the mantra / callback lines. */
export const Pill: React.FC<{ at: number; x: number; y: number; text: string; size?: number; bg?: string; color?: string }> = ({ at, x, y, text, size = 66, bg = C.lime, color = "#0A0D0C" }) => {
  const f = useCurrentFrame();
  const s = pop(f, at);
  return <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "0% 50%", background: bg, color, fontFamily: F.sans, fontWeight: 900,
    fontSize: size, padding: `${size * 0.1}px ${size * 0.25}px`, borderRadius: 14, letterSpacing: -size * 0.03, boxShadow: `0 0 40px ${bg}55` }}>{text}</div>;
};

/** Rubber-stamp slam ("SEALED", "BLOCKED", "FRAUD"): scales from 2.2 → 1 in 5 f with a hard landing. */
export const Stamp: React.FC<{ at: number; x: number; y: number; text: string; color?: string; rot?: number; size?: number; fill?: boolean }> = ({ at, x, y, text, color = C.red, rot = -8, size = 110, fill = true }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = interpolate(f, [at, at + 5], [2.2, 1], clamp);
  const o = interpolate(f, [at, at + 3], [0, 1], clamp);
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o,
    background: fill ? color : "transparent", border: `8px solid ${color}`, color: fill ? C.white : color, fontFamily: F.sans, fontWeight: 900, fontSize: size,
    padding: `${size * 0.08}px ${size * 0.3}px`, borderRadius: 16, letterSpacing: -2, boxShadow: fill ? `0 20px 60px rgba(0,0,0,.5)` : "none", whiteSpace: "nowrap" }}>{text}</div>;
};

/** Rolling number (₹ counters, scale math). Indian digit grouping. */
export const Counter: React.FC<{ at: number; dur?: number; from: number; to: number; x: number; y: number; prefix?: string; suffix?: string; size?: number; color?: string; dec?: number; align?: "left" | "center" }> = ({ at, dur = 24, from, to, x, y, prefix = "", suffix = "", size = 150, color = C.lime, dec = 0, align = "center" }) => {
  const f = useCurrentFrame();
  const v = lerp(f, [at, at + dur], [from, to]);
  return <div style={{ position: "absolute", left: x, top: y, transform: align === "center" ? "translateX(-50%)" : undefined, color, fontFamily: F.mono, fontWeight: 700, fontSize: size,
    letterSpacing: -size * 0.04, textShadow: `0 0 40px ${color}55`, opacity: io(f, at - 4, 5), whiteSpace: "nowrap" }}>{prefix}{inr(v, dec)}{suffix}</div>;
};

/** Expanding radar rings (alerts, location pings, "network checks"). */
export const Rings: React.FC<{ at: number; x: number; y: number; color?: string; n?: number; max?: number; period?: number }> = ({ at, x, y, color = C.red, n = 3, max = 420, period = 36 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return <>{Array.from({ length: n }).map((_, i) => {
    const k = (((f - at) / period + i / n) % 1);
    return <div key={i} style={{ position: "absolute", left: x - max / 2, top: y - max / 2, width: max, height: max, borderRadius: "50%", border: `4px solid ${color}`,
      transform: `scale(${0.1 + k * 0.9})`, opacity: (1 - k) * 0.9 }} />;
  })}<div style={{ position: "absolute", left: x - 14, top: y - 14, width: 28, height: 28, borderRadius: 14, background: color, boxShadow: `0 0 30px ${color}` }} /></>;
};

/** Numbered step marker (1 / 2 / 3 lime discs). */
export const StepDot: React.FC<{ at: number; x: number; y: number; n: number; size?: number }> = ({ at, x, y, n, size = 96 }) => {
  const f = useCurrentFrame();
  const s = pop(f, at);
  return <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size, background: C.lime, color: "#0A0D0C",
    fontFamily: F.sans, fontWeight: 900, fontSize: size * 0.55, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s})`, boxShadow: `0 0 0 8px ${C.lime}33, 0 0 40px ${C.lime}66` }}>{n}</div>;
};

/**
 * Animated dotted path (money / data flowing). `d` is an SVG path in 1080x1920 space; dots march along it.
 * `draw` = frame range over which the path is revealed.
 */
export const Flow: React.FC<{ d: string; at: number; dur?: number; color?: string; dot?: number; gap?: number; speed?: number; solid?: boolean; width?: number }> = ({ d, at, dur = 20, color = C.lime, dot = 14, gap = 30, speed = 3, solid = false, width = 6 }) => {
  const f = useCurrentFrame();
  const k = io(f, at, dur);
  const len = 4000;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs><mask id={`m${at}`}><path d={d} stroke="white" strokeWidth={60} fill="none" strokeDasharray={len} strokeDashoffset={len * (1 - k)} /></mask></defs>
      <g mask={`url(#m${at})`} style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
        {solid ? <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
          : <path d={d} stroke={color} strokeWidth={dot} fill="none" strokeLinecap="round" strokeDasharray={`0 ${gap}`} strokeDashoffset={-f * speed} />}
      </g>
    </svg>
  );
};

/** Seven-segment LCD readout (meters, displays). */
export const Lcd: React.FC<{ value: string; size?: number; ink?: string; ghost?: boolean }> = ({ value, size = 120, ink = C.lcdInk, ghost = true }) => (
  <div style={{ position: "relative", fontFamily: F.mono, fontWeight: 700, fontSize: size, color: ink, letterSpacing: size * 0.02, lineHeight: 1, fontStyle: "italic" }}>
    {ghost && <div style={{ position: "absolute", inset: 0, opacity: 0.07 }}>{value.replace(/[0-9]/g, "8")}</div>}
    <div>{value}</div>
  </div>
);
