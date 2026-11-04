import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { inr, io, lerp, pop, rng } from "./anim";

/**
 * 3D-tilted phone (CSS 3D): glossy black slab with a metal rim, a moving specular sweep, a soft floor shadow.
 * Tilt animates from (rx0, ry0) to (rx1, ry1) over `dur` frames — the reference phones always drift a few degrees.
 * Children render on the screen (content box 560 x 1180 at scale 1).
 */
export const Phone: React.FC<{ x?: number; y?: number; scale?: number; rx?: [number, number]; ry?: [number, number]; rz?: [number, number]; dur?: number;
  glow?: string; screenBg?: string; children?: React.ReactNode; enter?: number }> = ({ x = 540, y = 980, scale = 1, rx = [8, 4], ry = [-16, -8], rz = [3, 1], dur = 90, glow, screenBg = "#07090A", children, enter }) => {
  const f = useCurrentFrame();
  const e = enter === undefined ? 1 : pop(f, enter, 14);
  const a = lerp(f, [0, dur], [rx[0], rx[1]]), b = lerp(f, [0, dur], [ry[0], ry[1]]), c = lerp(f, [0, dur], [rz[0], rz[1]]);
  const W = 600, H = 1240;
  const sweep = ((f * 1.2) % 260) - 80;
  return (
    <div style={{ position: "absolute", left: x - W / 2, top: y - H / 2, width: W, height: H, perspective: 2600, transform: `scale(${scale * e})` }}>
      {/* floor shadow */}
      <div style={{ position: "absolute", left: 40, right: 40, bottom: -90, height: 120, borderRadius: "50%", background: "rgba(0,0,0,.65)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg)` }}>
        {/* side thickness */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 86, background: "linear-gradient(90deg,#2b302f,#0c0e0e 30%,#3a403e 70%,#121414)", transform: "translateZ(-22px)" }} />
        {/* body */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 86, background: "linear-gradient(135deg,#3b4240 0%,#161918 18%,#0b0d0d 60%,#2a2f2d 100%)",
          boxShadow: glow ? `0 0 0 4px ${glow}, 0 0 60px ${glow}88, 0 40px 120px rgba(0,0,0,.7)` : "0 40px 120px rgba(0,0,0,.75)" }}>
          <div style={{ position: "absolute", inset: 18, borderRadius: 70, background: screenBg, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 564, height: 1204 }}>{children}</div>
            {/* dynamic island */}
            <div style={{ position: "absolute", left: 212, top: 22, width: 140, height: 40, borderRadius: 20, background: "#000" }} />
            {/* specular sweep */}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${sweep}%, rgba(255,255,255,.07) ${sweep + 8}%, transparent ${sweep + 22}%)` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Status bar inside a Phone screen. */
export const StatusBar: React.FC<{ time?: string; color?: string; noService?: boolean }> = ({ time = "18:40", color = C.white, noService }) => (
  <div style={{ position: "absolute", left: 44, right: 44, top: 28, display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontWeight: 700, fontSize: 24, color }}>
    <span>{time}</span>
    <span style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      {noService ? <span style={{ fontSize: 18, opacity: 0.7 }}>No SIM</span> : [8, 12, 16, 20].map((h, i) => <span key={i} style={{ width: 6, height: h, background: color, borderRadius: 2 }} />)}
      <span style={{ width: 40, height: 20, border: `2px solid ${color}`, borderRadius: 6, marginLeft: 8, position: "relative" }}><span style={{ position: "absolute", inset: 2, right: 10, background: color, borderRadius: 2 }} /></span>
    </span>
  </div>
);

/** Chat header (contact name + avatar). */
export const ChatHead: React.FC<{ name: string; sub?: string; avatar?: string }> = ({ name, sub = "online", avatar = "#5B7E9C" }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 80, height: 110, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 20, padding: "0 34px", fontFamily: F.sans }}>
    <div style={{ width: 70, height: 70, borderRadius: 35, background: avatar, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 800, fontSize: 32 }}>{name[0]}</div>
    <div><div style={{ color: C.white, fontWeight: 700, fontSize: 32 }}>{name}</div><div style={{ color: C.lime, fontSize: 21, fontFamily: F.mono }}>{sub}</div></div>
  </div>
);

/** Chat bubble that pops in at `at`. `me` = right side. */
export const Bubble: React.FC<{ at: number; y: number; me?: boolean; children: React.ReactNode; w?: number }> = ({ at, y, me = false, children, w = 380 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = pop(f, at, 13);
  return <div style={{ position: "absolute", top: y, [me ? "right" : "left"]: 30, maxWidth: w, transform: `scale(${s})`, transformOrigin: me ? "100% 100%" : "0% 100%",
    background: me ? "#1F3A12" : "#1A201E", color: C.white, borderRadius: 28, [me ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 8,
    padding: "20px 26px", fontFamily: F.sans, fontSize: 34, fontWeight: 500, lineHeight: 1.25 }}>{children}</div>;
};

/** Pseudo-QR (decorative): finder squares + seeded modules. Not scannable on purpose. */
export const QR: React.FC<{ size: number; seed?: number; color?: string; bg?: string }> = ({ size, seed = 7, color = "#0A0D0C", bg = "#F3F5EF" }) => {
  const n = 25, r = rng(seed), m = size / (n + 4);
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); if (!finder(x, y) && v > 0.52) cells.push(<rect key={`${x}_${y}`} x={(x + 2) * m} y={(y + 2) * m} width={m} height={m} rx={m * 0.18} fill={color} />); }
  const F3 = (x: number, y: number) => <g key={`f${x}${y}`}><rect x={(x + 2) * m} y={(y + 2) * m} width={7 * m} height={7 * m} rx={m * 1.4} fill={color} /><rect x={(x + 3) * m} y={(y + 3) * m} width={5 * m} height={5 * m} rx={m} fill={bg} /><rect x={(x + 4) * m} y={(y + 4) * m} width={3 * m} height={3 * m} rx={m * 0.6} fill={color} /></g>;
  return <svg width={size} height={size}><rect width={size} height={size} rx={size * 0.06} fill={bg} />{cells}{F3(0, 0)}{F3(n - 7, 0)}{F3(0, n - 7)}</svg>;
};

/** PIN pad: dots fill one by one from `at` every `step` frames; keys flash as pressed. */
export const PinPad: React.FC<{ at: number; step?: number; digits?: number; seq?: number[]; title?: string; accent?: string }> = ({ at, step = 5, digits = 4, seq = [5, 2, 8, 1], title = "Enter UPI PIN", accent = C.lime }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(digits, Math.floor((f - at) / step) + 1));
  const pressed = f >= at ? seq[Math.min(seq.length - 1, Math.floor((f - at) / step))] : -1;
  const flash = f >= at && (f - at) % step < 3 && (f - at) / step < digits;
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2];
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white }}>
      <div style={{ position: "absolute", top: 170, width: "100%", textAlign: "center", fontSize: 30, fontWeight: 600, color: C.grey }}>{title}</div>
      <div style={{ position: "absolute", top: 240, width: "100%", display: "flex", justifyContent: "center", gap: 34 }}>
        {Array.from({ length: digits }).map((_, i) => <div key={i} style={{ width: 30, height: 30, borderRadius: 15, border: `3px solid ${i < n && f >= at ? accent : C.dim}`, background: i < n && f >= at ? accent : "transparent", boxShadow: i < n && f >= at ? `0 0 16px ${accent}` : "none" }} />)}
      </div>
      <div style={{ position: "absolute", top: 480, left: 60, right: 60, display: "grid", gridTemplateColumns: "repeat(3,1fr)", rowGap: 34, justifyItems: "center" }}>
        {keys.map((k, i) => <div key={i} style={{ width: 120, height: 120, borderRadius: 60, background: k < 0 ? "transparent" : k === pressed && flash ? accent : "#1A1F1D", color: k === pressed && flash ? "#0A0D0C" : C.white,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 600 }}>{k === -2 ? "⌫" : k === -1 ? "" : k}</div>)}
      </div>
    </div>
  );
};

/** Dialer: types `number` from `at`, one digit every `step` f. */
export const Dialer: React.FC<{ at: number; number: string; step?: number; label?: string }> = ({ at, number, step = 5, label }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(number.length, Math.floor((f - at) / step) + 1));
  const shown = f >= at ? number.slice(0, n) : "";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  const last = shown[shown.length - 1];
  const flash = f >= at && (f - at) % step < 3 && (f - at) / step < number.length;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white }}>
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center", fontSize: 92, fontWeight: 600, letterSpacing: 6 }}>{shown}<span style={{ opacity: (f % 20) < 10 ? 1 : 0, color: C.lime }}>|</span></div>
      {label && <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontSize: 24, color: C.lime, fontFamily: F.mono, letterSpacing: 2 }}>{label}</div>}
      <div style={{ position: "absolute", top: 450, left: 60, right: 60, display: "grid", gridTemplateColumns: "repeat(3,1fr)", rowGap: 30, justifyItems: "center" }}>
        {keys.map((k) => <div key={k} style={{ width: 120, height: 120, borderRadius: 60, background: k === last && flash ? C.lime : "#1A1F1D", color: k === last && flash ? "#0A0D0C" : C.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 600 }}>{k}</div>)}
      </div>
      <div style={{ position: "absolute", top: 1040, left: 222, width: 120, height: 120, borderRadius: 60, background: "#2FBF5A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#06210F", transform: `scale(${f > at + number.length * step + 6 ? 1 + 0.06 * Math.sin(f / 3) : 1})` }}>CALL</div>
    </div>
  );
};

/** Bank / app notification toast sliding down from the top of the screen. */
export const Toast: React.FC<{ at: number; title: string; body: string; color?: string; y?: number }> = ({ at, title, body, color = C.red, y = 90 }) => {
  const f = useCurrentFrame();
  const k = io(f, at, 8);
  if (f < at) return null;
  return <div style={{ position: "absolute", left: 22, right: 22, top: y - (1 - k) * 160, opacity: k, background: "rgba(28,33,31,.96)", borderRadius: 30, padding: "22px 26px", fontFamily: F.sans, borderLeft: `8px solid ${color}`, boxShadow: "0 20px 50px rgba(0,0,0,.5)" }}>
    <div style={{ color, fontFamily: F.mono, fontSize: 20, letterSpacing: 2 }}>{title.toUpperCase()}</div>
    <div style={{ color: C.white, fontSize: 30, fontWeight: 700, marginTop: 6 }}>{body}</div>
  </div>;
};

/** Wireframe "x-ray" phone outline (inside-the-device shots). */
export const XrayPhone: React.FC<{ x?: number; y?: number; scale?: number; color?: string; at?: number; children?: React.ReactNode }> = ({ x = 540, y = 960, scale = 1, color = C.lime, at = 0, children }) => {
  const f = useCurrentFrame();
  const k = io(f, at, 14);
  const W = 560, H = 1150;
  return (
    <div style={{ position: "absolute", left: x - W / 2, top: y - H / 2, width: W, height: H, transform: `scale(${scale}) perspective(2400px) rotateY(${lerp(f, [0, 120], [-14, -6])}deg) rotateX(6deg)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", filter: `drop-shadow(0 0 14px ${color})` }}>
        <rect x={6} y={6} width={W - 12} height={H - 12} rx={80} fill="rgba(196,242,60,.03)" stroke={color} strokeWidth={5} strokeDasharray={3400} strokeDashoffset={3400 * (1 - k)} />
        {[[70, 160, 200, 260], [300, 160, 190, 150], [300, 340, 190, 260], [70, 460, 200, 300], [70, 800, 420, 200]].map(([a, b, c, d], i) =>
          <rect key={i} x={a} y={b} width={c} height={d} rx={10} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={2.5} opacity={io(f, at + 8 + i * 3, 8)} />)}
        {Array.from({ length: 14 }).map((_, i) => <rect key={`p${i}`} x={110 + i * 24} y={H - 90} width={12} height={34} fill={color} opacity={0.6 * io(f, at + 20, 8)} />)}
      </svg>
      {children}
    </div>
  );
};

/** Incoming-call screen (full phone screen). Pulsing answer button; `at` = when it rings in. */
export const IncomingCall: React.FC<{ at?: number; name: string; number?: string; label?: string; danger?: boolean }> = ({ at = 0, name, number, label = "INCOMING CALL", danger = false }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = io(f, at, 6), p = 1 + 0.08 * Math.abs(Math.sin((f - at) / 5));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k, background: "linear-gradient(180deg,#1b2420 0%,#07090A 70%)", fontFamily: F.sans, color: C.white, textAlign: "center" }}>
      <div style={{ marginTop: 200, fontFamily: F.mono, fontSize: 22, letterSpacing: 3, color: danger ? C.red : C.lime }}>{label}</div>
      <div style={{ marginTop: 26, fontSize: 60, fontWeight: 800 }}>{name}</div>
      {number && <div style={{ marginTop: 10, fontSize: 30, color: C.grey, fontFamily: F.mono }}>{number}</div>}
      <div style={{ margin: "80px auto 0", width: 180, height: 180, borderRadius: 90, border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90, fontWeight: 900, color: C.grey }}>{name[0]}</div>
      <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, display: "flex", justifyContent: "space-around" }}>
        <div style={{ width: 130, height: 130, borderRadius: 65, background: "#E5484D", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26 }}>END</div>
        <div style={{ width: 130, height: 130, borderRadius: 65, background: "#2FBF5A", transform: `scale(${p})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26, color: "#06210F", boxShadow: "0 0 40px #2FBF5A88" }}>CALL</div>
      </div>
    </div>
  );
};

/** Bank-style SMS card (can be used inside a Phone or on its own). `ring` highlights a part: "sender" | "body" | "amount". */
export const SmsCard: React.FC<{ x: number; y: number; w?: number; sender: string; body: string; time?: string; at?: number; ring?: "sender" | "body" | "amount"; ringAt?: number; ringColor?: string; scale?: number; rot?: number }> = ({ x, y, w = 820, sender, body, time = "18:42", at = 0, ring, ringAt = 0, ringColor = C.lime, scale = 1, rot = -2 }) => {
  const f = useCurrentFrame();
  const s = pop(f, at, 13);
  const on = ring && f >= ringAt;
  const R = (k: string): React.CSSProperties => (on && ring === k ? { boxShadow: `0 0 0 5px ${ringColor}, 0 0 40px ${ringColor}88`, borderRadius: 12 } : {});
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, transform: `scale(${s * scale}) rotate(${rot}deg)`, transformOrigin: "50% 50%", background: "#1A201E", borderRadius: 36, padding: "34px 40px", fontFamily: F.sans, boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: `2px solid ${C.line}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.mono, fontSize: 34, color: C.white, fontWeight: 700, padding: "4px 10px", ...R("sender") }}>{sender}</span>
        <span style={{ fontSize: 26, color: C.grey }}>{time}</span>
      </div>
      <div style={{ marginTop: 22, fontSize: 38, lineHeight: 1.3, color: "#D9DED7", padding: "4px 10px", ...R("body") }}>{body}</div>
    </div>
  );
};

/** Bank-app balance screen (inside a Phone). Counter rolls from `from` to `to` starting at `rollAt`. */
export const BalanceScreen: React.FC<{ bank?: string; from: number; to: number; rollAt?: number; color?: string; note?: string; noteColor?: string }> = ({ bank = "MY BANK", from, to, rollAt = 0, color = C.white, note, noteColor = C.lime }) => {
  const f = useCurrentFrame();
  const v = lerp(f, [rollAt, rollAt + 18], [from, to]);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white }}>
      <div style={{ position: "absolute", top: 120, left: 40, fontFamily: F.mono, fontSize: 24, letterSpacing: 3, color: C.grey }}>{bank}</div>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: 4, color: C.grey }}>AVAILABLE BALANCE</div>
      <div style={{ position: "absolute", top: 350, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 92, fontWeight: 700, color, letterSpacing: -3 }}>₹{inr(v)}</div>
      {note && <div style={{ position: "absolute", top: 500, width: "100%", textAlign: "center", fontSize: 30, fontWeight: 700, color: noteColor, opacity: io(f, rollAt + 10, 6) }}>{note}</div>}
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 40, right: 40, top: 640 + i * 130, height: 100, borderRadius: 20, background: "#141917", display: "flex", alignItems: "center", padding: "0 26px", justifyContent: "space-between", fontSize: 26, color: C.grey }}>
        <span>{["Grocery · UPI", "Recharge · UPI", "Salary · NEFT"][i]}</span><span style={{ fontFamily: F.mono, color: i === 2 ? C.lime : C.grey }}>{["−₹640", "−₹299", "+₹18,000"][i]}</span></div>)}
    </div>
  );
};
