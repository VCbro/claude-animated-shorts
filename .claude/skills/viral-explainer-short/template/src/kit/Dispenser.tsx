import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { io, lerp, pop } from "./anim";
import { Lcd } from "./Marks";

/**
 * Fuel-dispenser display panel (2.5D, CSS): AMOUNT ₹ / LITRE / DENSITY rows of 7-segment LCDs on a graphite housing.
 * Values come from props each frame (roll them with lerp in the story). `ring` highlights one row ("density" etc.).
 */
export const DispenserPanel: React.FC<{ x?: number; y?: number; scale?: number; amount: string; litre: string; density: string; rate?: string;
  ring?: "amount" | "litre" | "density"; ringAt?: number; ringColor?: string; densityColor?: string; tilt?: [number, number]; dur?: number }> = ({ x = 540, y = 1000, scale = 1, amount, litre, density, rate = "103.44", ring, ringAt = 0, ringColor = C.lime, densityColor, tilt = [-8, -3], dur = 90 }) => {
  const f = useCurrentFrame();
  const W = 760, H = 900;
  const ry = lerp(f, [0, dur], tilt);
  const Row = ({ k, label, unit, value, big, color }: { k: string; label: string; unit: string; value: string; big: number; color?: string }) => {
    const on = ring === k && f >= ringAt;
    return (
      <div style={{ position: "relative", margin: "0 40px 26px", background: C.lcd, borderRadius: 14, padding: "16px 26px 10px", boxShadow: on ? `0 0 0 6px ${ringColor}, 0 0 50px ${ringColor}99` : "inset 0 3px 10px rgba(0,0,0,.25)", transform: `scale(${on ? 1 + 0.04 * pop(f, ringAt, 9) : 1})` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 22, color: "#5a5f55", letterSpacing: 2 }}><span>{label}</span><span>{unit}</span></div>
        <div style={{ textAlign: "right" }}><Lcd value={value} size={big} ink={color ?? C.lcdInk} /></div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", left: x - W / 2, top: y - H / 2, width: W, height: H, transform: `scale(${scale}) perspective(2400px) rotateY(${ry}deg) rotateX(4deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "linear-gradient(160deg,#2c3331 0%,#151a18 45%,#0d100f 100%)", boxShadow: "0 50px 120px rgba(0,0,0,.7), inset 0 2px 0 rgba(255,255,255,.08)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 30, height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.sans, fontWeight: 900, fontSize: 46, color: C.lime, letterSpacing: 4 }}>
        <span>PETROL</span><span style={{ fontFamily: F.mono, fontSize: 22, color: C.grey, fontWeight: 500 }}>RATE ₹/L {rate}</span>
      </div>
      <div style={{ position: "absolute", top: 120, left: 0, right: 0 }}>
        <Row k="amount" label="AMOUNT" unit="₹" value={amount} big={140} />
        <Row k="litre" label="LITRE" unit="L" value={litre} big={110} />
        <Row k="density" label="DENSITY" unit="kg/m³" value={density} big={96} color={densityColor} />
      </div>
    </div>
  );
};

/** Range bar (e.g. density 700-800 with the OK band 720-775). Marker value animates via `value`. */
export const RangeBar: React.FC<{ x?: number; y?: number; w?: number; min: number; max: number; lo: number; hi: number; value: number; at?: number; unit?: string }> = ({ x = 90, y = 1100, w = 900, min, max, lo, hi, value, at = 0, unit = "" }) => {
  const f = useCurrentFrame();
  const px = (v: number) => ((v - min) / (max - min)) * w;
  const ok = value >= lo && value <= hi;
  const k = io(f, at, 10);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: k }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: w, height: 40, borderRadius: 20, background: C.redSoft, border: `2px solid ${C.red}66` }} />
      <div style={{ position: "absolute", top: 0, left: px(lo), width: (px(hi) - px(lo)) * k, height: 40, borderRadius: 20, background: C.lime, boxShadow: `0 0 30px ${C.lime}88` }} />
      {[lo, hi].map((v) => <div key={v} style={{ position: "absolute", top: 60, left: px(v) - 80, width: 160, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 52, color: C.lime }}>{v}</div>)}
      <div style={{ position: "absolute", top: -96, left: px(value) - 70, width: 140, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 46, color: ok ? C.white : C.red }}>{value.toFixed(0)}{unit}</div>
      <div style={{ position: "absolute", top: -34, left: px(value) - 16, width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `24px solid ${ok ? C.white : C.red}` }} />
    </div>
  );
};

/** Filter-paper test: two drops fall at `drop`, then (if `stain`) a brown ring spreads at `stainAt`. */
export const FilterPaper: React.FC<{ x?: number; y?: number; size?: number; drop: number; stain?: boolean; stainAt?: number }> = ({ x = 540, y = 1050, size = 560, drop, stain = true, stainAt = 0 }) => {
  const f = useCurrentFrame();
  const r = size / 2;
  const s = stain ? io(f, stainAt, 24) : 0;
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: size, height: size }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #FBFBF6, #E2E3DA)", boxShadow: "0 30px 80px rgba(0,0,0,.55)", transform: "perspective(1600px) rotateX(38deg)" }}>
        {[-40, 50].map((dx, i) => {
          const land = drop + i * 6;
          const wet = io(f, land, 10);
          return <React.Fragment key={i}>
            <div style={{ position: "absolute", left: r + dx - 40 * wet, top: r - 30 * wet + i * 20, width: 80 * wet, height: 60 * wet, borderRadius: "50%", background: "rgba(255,214,120,.45)" }} />
            {stain && <div style={{ position: "absolute", left: r + dx - 70 * s, top: r - 52 * s + i * 20, width: 140 * s, height: 104 * s, borderRadius: "50%", border: `${10 * s}px solid rgba(120,72,30,${0.75 * s})`, background: `rgba(150,96,40,${0.28 * s})` }} />}
          </React.Fragment>;
        })}
      </div>
      {[-40, 50].map((dx, i) => {
        const t = lerp(f, [drop - 14 + i * 6, drop + i * 6], [0, 1]);
        return t > 0 && t < 1 ? <div key={i} style={{ position: "absolute", left: r + dx - 14, top: -380 + t * (r + 380) + i * 20, width: 28, height: 40, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: C.amber, boxShadow: `0 0 20px ${C.amber}` }} /> : null;
      })}
    </div>
  );
};
