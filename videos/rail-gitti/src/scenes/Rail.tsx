import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { P, ink } from "../kit/Flat2D";
import { rng } from "../kit/anim";

/** Our own flat illustrations for the railway-ballast reel. SVG, 1080x1920 frame space. */
const STONE = ["#9a9590", "#7f7a75", "#b3aea8", "#8b857e"];

/** A heap of angular stones in a trapezoid (cross-section) between y0 (top) and y1 (bottom). */
const Stones: React.FC<{ x0: number; x1: number; y0: number; y1: number; slope?: number; seed?: number; round?: boolean; n?: number }> = ({ x0, x1, y0, y1, slope = 140, seed = 3, round = false, n = 220 }) => {
  const pts = useMemo(() => {
    const r = rng(seed); const out: number[][] = [];
    for (let i = 0; i < n; i++) {
      const y = y0 + r() * (y1 - y0); const k = (y - y0) / (y1 - y0);
      const xa = x0 + slope * (1 - k), xb = x1 - slope * (1 - k);
      out.push([xa + r() * (xb - xa), y, 14 + r() * 16, r() * 6, Math.floor(r() * 4)]);
    }
    return out;
  }, [x0, x1, y0, y1, slope, seed, n]);
  return <g>{pts.map(([x, y, s, a, c], i) => round
    ? <circle key={i} cx={x} cy={y} r={s * 0.8} fill={STONE[c]} stroke={P.ink} strokeWidth={3} />
    : <path key={i} d={`M ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.9} L ${x + s * 0.8} ${y - s * 0.5} L ${x + s} ${y + s * 0.4} L ${x + s * 0.1} ${y + s * 0.9} Z`} transform={`rotate(${a * 60} ${x} ${y})`} fill={STONE[c]} stroke={P.ink} strokeWidth={3} strokeLinejoin="round" />)}</g>;
};

/** Side view: track on a ballast bank with a passing train. trainX = train front x. sink 0..1 bends the rails down (no-ballast). */
export const TrackSide: React.FC<{ trainX?: number; ballast?: number; sink?: number }> = ({ trainX = -2000, ballast = 1, sink = 0 }) => {
  const f = useCurrentFrame();
  const railY = 1290 + sink * 60;
  const wob = (x: number) => sink * 40 * Math.sin(x / 90 + f / 3);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={-400} y={1380} width={1880} height={1400} fill="#8a6a45" />
      <rect x={0} y={1380} width={1080} height={20} fill="#6f8f3a" />
      {ballast > 0 && <g opacity={ballast}><path d="M -40 1420 L 120 1300 L 960 1300 L 1120 1420 Z" fill="#8b857e" {...ink} /><Stones x0={-40} x1={1120} y0={1305} y1={1415} slope={150} seed={2} n={260} /></g>}
      {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 130 - 20} y={railY + 4 + wob(i * 130)} width={80} height={26} rx={4} fill="#6b6460" {...ink} strokeWidth={4} />)}
      <path d={`M 0 ${railY + wob(0)} ${Array.from({ length: 28 }, (_, i) => `L ${i * 40} ${railY + wob(i * 40)}`).join(" ")}`} fill="none" stroke={P.iron} strokeWidth={18} />
      {/* train */}
      <g transform={`translate(${trainX},${railY - 330})`}>
        {[0, 1, 2].map((c) => <g key={c} transform={`translate(${-c * 560},0)`}>
          <rect x={-520} y={40} width={500} height={250} rx={24} fill={c ? "#2f6db3" : "#c0392b"} {...ink} />
          {Array.from({ length: 5 }).map((_, w) => <rect key={w} x={-490 + w * 92} y={80} width={62} height={60} rx={8} fill="#d8ecf6" {...ink} strokeWidth={4} />)}
          <rect x={-520} y={180} width={500} height={22} fill="#f2c14e" />
          {[-450, -330, -190, -80].map((wx) => <circle key={wx} cx={wx} cy={300} r={34} fill="#3a3a3a" {...ink} />)}
        </g>)}
        <path d="M -20 60 Q 70 60 80 160 L 80 290 L -20 290 Z" fill="#c0392b" {...ink} />
      </g>
    </svg>
  );
};

/** Cross-section: rail on a sleeper on ballast on soil. load 0..1 shows force arrows spreading; rain 0..1; hold 0..1 shows side-push vs grip; grass 0..1 tries to grow. */
export const Section: React.FC<{ load?: number; rain?: number; hold?: number; grass?: number; mud?: number }> = ({ load = 0, rain = 0, hold = 0, grass = 0, mud = 0 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={-400} y={1180} width={1880} height={1600} fill={mud ? "#5e4a33" : "#8a6a45"} />
      {Array.from({ length: 30 }).map((_, i) => <circle key={i} cx={(i * 211) % 1080} cy={1250 + ((i * 97) % 600)} r={6} fill="#6f5436" />)}
      <path d="M 40 1190 L 250 900 L 830 900 L 1040 1190 Z" fill="#8b857e" {...ink} />
      <Stones x0={40} x1={1040} y0={905} y1={1185} slope={210} seed={5} n={300} />
      <rect x={180} y={840} width={720} height={70} rx={8} fill="#7a7470" {...ink} />
      {[330, 750].map((x) => <g key={x}><rect x={x - 20} y={770} width={40} height={70} fill={P.iron} {...ink} strokeWidth={4} /><rect x={x - 46} y={740} width={92} height={36} rx={6} fill={P.iron2} {...ink} strokeWidth={4} /></g>)}
      {load > 0 && <g opacity={Math.min(1, load * 1.4)}>
        {[330, 750].map((x) => <path key={x} d={`M ${x} 560 L ${x} 700`} stroke={P.red} strokeWidth={22} markerEnd="" />)}
        {[330, 750].map((x) => <path key={`h${x}`} d={`M ${x - 30} 690 L ${x} 735 L ${x + 30} 690 Z`} fill={P.red} />)}
        {Array.from({ length: 9 }).map((_, i) => { const a = -0.9 + i * 0.225, L = 340 * load; const x0 = 540, y0 = 920; return <g key={i}><line x1={x0} y1={y0} x2={x0 + Math.sin(a) * L * 1.5} y2={y0 + Math.cos(a) * L} stroke={P.lime} strokeWidth={10} strokeLinecap="round" opacity={0.9} /></g>; })}
      </g>}
      {rain > 0 && Array.from({ length: 40 }).map((_, i) => { const t = ((f * 0.02 + i / 40) % 1); const x = 60 + (i * 137) % 960; const y = 300 + t * 1300; const inside = y > 905; return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 34} stroke={inside ? "#2a9dc8" : "#7cc7ee"} strokeWidth={6} strokeLinecap="round" opacity={rain * (y > 1500 ? 0.3 : 0.9)} />; })}
      {hold > 0 && <g opacity={hold}>
        <path d={`M 40 875 L ${150 + Math.sin(f / 4) * 8} 875`} stroke={P.red} strokeWidth={18} /><path d={`M ${150 + Math.sin(f / 4) * 8} 850 L ${195 + Math.sin(f / 4) * 8} 875 L ${150 + Math.sin(f / 4) * 8} 900 Z`} fill={P.red} />
        {[200, 880].map((x) => <circle key={x} cx={x} cy={875} r={46} fill="none" stroke={P.lime} strokeWidth={10} />)}
      </g>}
      {grass > 0 && [260, 420, 600, 780].map((x, i) => { const h = 70 * Math.min(1, grass) * (0.5 + 0.5 * Math.sin(f / 10 + i)) ; return <g key={x}><path d={`M ${x} 905 q -10 ${-h} -20 ${-h * 1.2} M ${x} 905 q 8 ${-h} 22 ${-h * 1.1}`} stroke="#6f9a3a" strokeWidth={7} fill="none" strokeLinecap="round" /></g>; })}
    </svg>
  );
};

/** Two panels: angular stones locked vs round stones rolling away. t drives the roll. */
export const StoneShapes: React.FC<{ t?: number }> = ({ t = 0 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {[0, 1].map((k) => <g key={k} transform={`translate(${60 + k * 500},620)`}>
        <rect width={460} height={760} rx={30} fill={k ? "#3a2320" : "#23301e"} {...ink} />
        <rect x={60} y={300} width={340} height={44} rx={6} fill="#7a7470" {...ink} strokeWidth={4} />
        {k === 0 ? <Stones x0={30} x1={430} y0={350} y1={700} slope={70} seed={9} n={90} />
          : <g>{Array.from({ length: 22 }).map((_, i) => { const bx = 60 + (i % 7) * 52, by = 380 + Math.floor(i / 7) * 60; const roll = t * (i % 2 ? 1 : -1) * (40 + (i % 5) * 30); return <circle key={i} cx={bx + roll} cy={by + Math.abs(roll) * 0.6} r={24} fill={STONE[i % 4]} stroke={P.ink} strokeWidth={3} />; })}
            <rect x={60} y={300 + t * 80} width={340} height={44} rx={6} fill="#7a7470" {...ink} strokeWidth={4} transform={`rotate(${t * 8 * Math.sin(f / 5)} 230 322)`} /></g>}
        <text x={230} y={90} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={56} fill={k ? P.red : P.lime}>{k ? "GOL ✕" : "NUKEELE ✓"}</text>
      </g>)}
    </svg>
  );
};
