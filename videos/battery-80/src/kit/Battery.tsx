import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { io, lerp, pop } from "./anim";

/** Colour for a charge level: lime in 20-80, amber above, red at 95+ or below 15. */
export const levelColor = (v: number) => (v >= 95 || v < 15 ? C.red : v > 82 ? C.amber : C.lime);

/**
 * Big battery icon (SVG). `level` 0-100 (animate it from the story), optional heat shimmer, bolt, % label,
 * and an optional 20-80 safe band drawn on the side.
 */
export const BatteryIcon: React.FC<{ x?: number; y?: number; w?: number; level: number; hot?: number; bolt?: boolean; label?: boolean; band?: number; color?: string }> = ({ x = 540, y = 1050, w = 420, level, hot = 0, bolt = true, label = true, band = 0, color }) => {
  const f = useCurrentFrame();
  const h = w * 1.85, r = w * 0.12, pad = w * 0.06;
  const col = color ?? levelColor(level);
  const fillH = (h - pad * 2) * Math.max(0, Math.min(1, level / 100));
  const wob = hot > 0 ? Math.sin(f / 2.3) * 3 * hot : 0;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      {hot > 0 && <div style={{ position: "absolute", inset: -w * 0.35, borderRadius: "50%", background: `radial-gradient(${C.red}${Math.round(90 * hot).toString(16).padStart(2, "0")}, transparent 65%)`, filter: "blur(20px)" }} />}
      <svg width={w} height={h + w * 0.12} viewBox={`0 ${-w * 0.12} ${w} ${h + w * 0.12}`} style={{ position: "absolute", left: 0, top: -w * 0.12, overflow: "visible", filter: `drop-shadow(0 0 ${18 + 30 * hot}px ${col}88)` }}>
        <rect x={w * 0.34} y={-w * 0.1} width={w * 0.32} height={w * 0.12} rx={w * 0.03} fill={C.line} />
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={r} fill="#0d1110" stroke={col} strokeWidth={8} />
        <rect x={pad} y={h - pad - fillH} width={w - pad * 2} height={fillH} rx={r * 0.6} fill={col} opacity={0.92} />
        {band > 0 && <g opacity={band}>
          <line x1={-40} x2={w + 40} y1={h - pad - (h - pad * 2) * 0.8} y2={h - pad - (h - pad * 2) * 0.8} stroke={C.white} strokeWidth={5} strokeDasharray="14 10" />
          <line x1={-40} x2={w + 40} y1={h - pad - (h - pad * 2) * 0.2} y2={h - pad - (h - pad * 2) * 0.2} stroke={C.white} strokeWidth={5} strokeDasharray="14 10" />
          <text x={w + 56} y={h - pad - (h - pad * 2) * 0.8 + 16} fill={C.white} fontFamily={F.mono} fontSize={46} fontWeight={700}>80</text>
          <text x={w + 56} y={h - pad - (h - pad * 2) * 0.2 + 16} fill={C.white} fontFamily={F.mono} fontSize={46} fontWeight={700}>20</text>
        </g>}
        {bolt && <path transform={`translate(${w / 2 - 60 + wob},${h / 2 - 110}) scale(1.5)`} d="M48 0 L8 82 L40 82 L28 146 L76 56 L44 56 Z" fill="#0A0D0C" opacity={0.85} />}
      </svg>
      {label && <div style={{ position: "absolute", top: h + 30, width: "100%", textAlign: "center", fontFamily: F.mono, fontWeight: 800, fontSize: w * 0.34, color: col, letterSpacing: -4, textShadow: `0 0 30px ${col}66` }}>{Math.round(level)}%</div>}
    </div>
  );
};

/** Half-circle stress gauge. `v` 0-1 sweeps the needle from green to red. */
export const Gauge: React.FC<{ x?: number; y?: number; r?: number; v: number; label?: string; at?: number }> = ({ x = 540, y = 1250, r = 300, v, label = "STRESS", at = 0 }) => {
  const f = useCurrentFrame();
  const k = pop(f, at, 13);
  const arc = (a0: number, a1: number) => { const p = (a: number) => [x + r * Math.cos(Math.PI * (1 - a)), y - r * Math.sin(Math.PI * (1 - a))]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`; };
  const ang = Math.PI * (1 - v);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: k }}>
      <path d={arc(0, 0.55)} stroke={C.lime} strokeWidth={34} fill="none" />
      <path d={arc(0.57, 0.8)} stroke={C.amber} strokeWidth={34} fill="none" />
      <path d={arc(0.82, 1)} stroke={C.red} strokeWidth={34} fill="none" style={{ filter: `drop-shadow(0 0 ${v > 0.8 ? 26 : 0}px ${C.red})` }} />
      <line x1={x} y1={y} x2={x + (r - 50) * Math.cos(ang)} y2={y - (r - 50) * Math.sin(ang)} stroke={C.white} strokeWidth={12} strokeLinecap="round" />
      <circle cx={x} cy={y} r={26} fill={C.white} />
      <text x={x} y={y + 100} textAnchor="middle" fill={v > 0.8 ? C.red : C.grey} fontFamily={F.mono} fontWeight={700} fontSize={48} letterSpacing={8}>{label}</text>
    </svg>
  );
};

/** X-ray of a Li-ion cell: lithium dots move from the left electrode (−) to the right (+ graphite side) as `level`
 *  rises; at high level they pack tight and red pressure arrows push outward (`press` 0-1). */
export const CellXray: React.FC<{ y?: number; level: number; press?: number }> = ({ y = 1100, level, press = 0 }) => {
  const f = useCurrentFrame();
  const W = 820, H = 520, x0 = 540 - W / 2, y0 = y - H / 2;
  const n = 64, moved = Math.round(n * level / 100);
  const col = press > 0.5 ? C.red : C.lime;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <g style={{ filter: `drop-shadow(0 0 12px ${col})` }} fill="none" stroke={col} strokeWidth={6}>
        <rect x={x0} y={y0} width={W} height={H} rx={40} />
        <line x1={540} y1={y0 + 30} x2={540} y2={y0 + H - 30} strokeDasharray="6 14" opacity={0.6} />
        <rect x={x0 + 30} y={y0 + 30} width={110} height={H - 60} rx={12} opacity={0.7} />
        <rect x={x0 + W - 140} y={y0 + 30} width={110} height={H - 60} rx={12} opacity={0.7} />
      </g>
      {Array.from({ length: n }).map((_, i) => {
        const right = i < moved;
        const gx = i % 4, gy = Math.floor(i / 4);
        const tx = right ? x0 + W - 300 + gx * 38 - (press * 0) : x0 + 180 + gx * 38;
        const ty = y0 + 50 + gy * ((H - 100) / 16) + Math.sin(f / 4 + i) * (right ? 2 + 4 * press : 3);
        return <circle key={i} cx={tx} cy={ty} r={9} fill={right ? (press > 0.5 ? C.red : C.lime) : C.grey} opacity={0.9} />;
      })}
      <text x={x0 + 85} y={y0 + H + 70} textAnchor="middle" fill={C.grey} fontFamily={F.mono} fontSize={40}>−</text>
      <text x={x0 + W - 85} y={y0 + H + 70} textAnchor="middle" fill={C.grey} fontFamily={F.mono} fontSize={40}>+</text>
      {press > 0 && [0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4, d = 380 + 30 * Math.sin(f / 3), s = io(f, 0, 6) * press;
        const cx = 540 + Math.cos(a) * d * 1.05, cy = y + Math.sin(a) * d * 0.72;
        return <g key={i} transform={`translate(${cx},${cy}) rotate(${(a * 180) / Math.PI}) scale(${s})`}><path d="M -40 -26 L 20 0 L -40 26 Z" fill={C.red} /></g>;
      })}
    </svg>
  );
};

/** iOS/Android-style settings list for the phone screen. Rows: title + optional toggle that flips on at `on`. */
export const Settings: React.FC<{ title: string; crumb?: string; rows: { t: string; sub?: string; on?: number; ring?: number }[] }> = ({ title, crumb, rows }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white }}>
      {crumb && <div style={{ position: "absolute", top: 110, left: 36, fontSize: 26, color: C.lime }}>‹ {crumb}</div>}
      <div style={{ position: "absolute", top: 160, left: 36, right: 36, fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
      <div style={{ position: "absolute", top: 300, left: 26, right: 26, borderRadius: 26, background: "#151a19", overflow: "hidden" }}>
        {rows.map((r, i) => {
          const k = r.on === undefined ? 0 : io(f, r.on, 7);
          const ring = r.ring !== undefined && f >= r.ring;
          return (
            <div key={i} style={{ position: "relative", padding: "30px 28px", borderTop: i ? `2px solid ${C.line}` : "none", display: "flex", alignItems: "center", gap: 16,
              background: ring ? `${C.lime}18` : "transparent", boxShadow: ring ? `inset 0 0 0 4px ${C.lime}` : "none", borderRadius: ring ? 20 : 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{r.t}</div>
                {r.sub && <div style={{ fontSize: 22, color: C.grey, marginTop: 6, lineHeight: 1.25 }}>{r.sub}</div>}
              </div>
              {r.on !== undefined && <div style={{ width: 96, height: 56, borderRadius: 28, background: k > 0.5 ? C.lime : "#39403e", position: "relative", transition: "none" }}>
                <div style={{ position: "absolute", top: 5, left: 5 + 40 * k, width: 46, height: 46, borderRadius: 23, background: "#fff" }} />
              </div>}
              {r.on === undefined && <div style={{ fontSize: 32, color: C.grey }}>›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Battery-health style screen: "Maximum capacity" percentage rolling down from `from` to `to`. */
export const HealthScreen: React.FC<{ from: number; to: number; at: number; dur?: number }> = ({ from, to, at, dur = 30 }) => {
  const f = useCurrentFrame();
  const v = lerp(f, [at, at + dur], [from, to]);
  const col = v < 95 ? C.red : C.white;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white }}>
      <div style={{ position: "absolute", top: 160, left: 36, fontSize: 40, fontWeight: 800 }}>Battery Health</div>
      <div style={{ position: "absolute", top: 300, left: 26, right: 26, borderRadius: 26, background: "#151a19", padding: "40px 30px" }}>
        <div style={{ fontSize: 28, color: C.grey }}>Maximum Capacity</div>
        <div style={{ fontSize: 150, fontWeight: 900, color: col, letterSpacing: -6, marginTop: 10 }}>{Math.round(v)}%</div>
        <div style={{ height: 22, borderRadius: 11, background: "#2a302e", marginTop: 20, overflow: "hidden" }}>
          <div style={{ width: `${v}%`, height: "100%", background: col }} />
        </div>
        <div style={{ fontSize: 22, color: C.grey, marginTop: 24, lineHeight: 1.3 }}>Capacity relative to when new</div>
      </div>
    </div>
  );
};
