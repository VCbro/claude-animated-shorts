import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F, SAFE } from "./theme";
import { io, lerp, rng, shake } from "./anim";

/** Scene ground: flat near-black with a soft centre lift and a vignette. `tone` tints the ground. */
export const Ground: React.FC<{ tone?: "dark" | "red" | "warm"; children?: React.ReactNode }> = ({ tone = "dark", children }) => {
  const centre = tone === "red" ? "#3a1714" : tone === "warm" ? "#2a1d12" : C.bg2;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 42%, ${centre} 0%, ${C.bg} 70%)` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Film finishing: vignette + a faint scanline-free noise-free grade. Put it last in every scene. */
export const Vignette: React.FC<{ amt?: number }> = ({ amt = 0.55 }) => (
  <AbsoluteFill style={{ pointerEvents: "none",
    background: `radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${amt}) 100%)` }} />
);

/**
 * Virtual camera for 2.5D scenes. Every hold creeps (no dead frames): push from s0 to s1 over the scene,
 * optional drift (px) and roll (deg). `kick` = list of impact frames (local) for flip shakes.
 */
export const Cam: React.FC<{ dur: number; s0?: number; s1?: number; dx?: number; dy?: number; roll?: number;
  ox?: number; oy?: number; kick?: number[]; children: React.ReactNode }> = ({ dur, s0 = 1, s1 = 1.06, dx = 0, dy = 0, roll = 0, ox = 50, oy = 50, kick = [], children }) => {
  const f = useCurrentFrame();
  const s = lerp(f, [0, dur], [s0, s1]);
  let kx = 0, ky = 0, kr = 0;
  kick.forEach((k) => { const v = shake(f, k); kx += v.x; ky += v.y; kr += v.r; });
  const x = lerp(f, [0, dur], [0, dx]) + kx, y = lerp(f, [0, dur], [0, dy]) + ky;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px,${y}px) scale(${s}) rotate(${lerp(f, [0, dur], [0, roll]) + kr}deg)`, transformOrigin: `${ox}% ${oy}%` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Warm out-of-focus practical lights (bazaar / shop / street). Drawn behind the subject. */
export const Bokeh: React.FC<{ n?: number; seed?: number; hue?: "warm" | "cool" | "lime" | "red"; drift?: number; opacity?: number }> = ({ n = 26, seed = 4, hue = "warm", drift = 40, opacity = 1 }) => {
  const f = useCurrentFrame();
  const r = rng(seed);
  const pal = { warm: ["#FFB35A", "#FF9A3C", "#FFD08A", "#F3C27A"], cool: ["#7FA7C9", "#9BC0D6", "#5B7E9C"], lime: ["#C4F23C", "#9BD12F"], red: ["#E8573F", "#FF7A5C"] }[hue];
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = r() * 1180 - 50, y = r() * 2000 - 40, sz = 40 + r() * 190, c = pal[Math.floor(r() * pal.length)];
        const a = 0.18 + r() * 0.5, sp = (r() - 0.5) * drift, ph = r() * 6.28;
        const bl = sz > 140 ? 18 : 6;
        return <div key={i} style={{ position: "absolute", left: x + (f / 30) * sp, top: y + Math.sin(f / 50 + ph) * 8, width: sz, height: sz, borderRadius: "50%",
          background: `radial-gradient(circle, ${c} 0%, ${c} 55%, ${c}00 72%)`, opacity: a, filter: `blur(${bl}px)`, mixBlendMode: "screen" }} />;
      })}
    </AbsoluteFill>
  );
};

/** Top HUD bar: "● PLACE · TIME" left, a small label + lime timer right. Present on most shots. */
export const Hud: React.FC<{ left: string; right?: string; clock?: string; dot?: string }> = ({ left, right, clock, dot = C.lime }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.left, top: 120, fontFamily: F.mono, opacity: io(f, 0, 6) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.white, fontSize: 27, letterSpacing: 3, fontWeight: 500 }}>
        <span style={{ width: 13, height: 13, borderRadius: 7, background: dot, boxShadow: `0 0 12px ${dot}`, opacity: 0.6 + 0.4 * Math.abs(Math.sin(f / 9)) }} />
        {left.toUpperCase()}
      </div>
      {(right || clock) && (
        <div style={{ position: "absolute", right: 0, top: -6, textAlign: "right" }}>
          {right && <div style={{ color: C.grey, fontSize: 19, letterSpacing: 2.5 }}>{right.toUpperCase()}</div>}
          {clock && <div style={{ color: C.lime, fontSize: 31, letterSpacing: 2, marginTop: 4 }}>{clock}</div>}
        </div>
      )}
    </div>
  );
};

/** Faint perspective floor grid for "inside / data" shots. */
export const GridFloor: React.FC<{ y?: number; color?: string; opacity?: number }> = ({ y = 1250, color = C.lime, opacity = 0.12 }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: -600, right: -600, top: y, height: 1400, perspective: 900, opacity }}>
      <div style={{ width: "100%", height: "100%", transform: "rotateX(72deg)", transformOrigin: "50% 0%",
        backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`,
        backgroundSize: "120px 120px", backgroundPosition: `0 ${(f * 2) % 120}px`,
        maskImage: "linear-gradient(to bottom, black, transparent 70%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)" }} />
    </div>
  );
};
