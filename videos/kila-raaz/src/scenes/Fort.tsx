import React from "react";
import { useCurrentFrame } from "remotion";
import { P, ink } from "../kit/Flat2D";

/** Our own flat illustrations for the fort reel. All SVG, 1080x1920 frame space. */

/** Big wooden fort gate in a stone arch. spikes 0..1 slides iron spikes out; shake px; crack 0..1. */
export const Gate: React.FC<{ x?: number; y?: number; s?: number; spikes?: number; shake?: number; crack?: number; label?: string }> = ({ x = 540, y = 1150, s = 1, spikes = 0, shake = 0, crack = 0, label }) => {
  const f = useCurrentFrame();
  const jx = shake ? Math.sin(f * 2.3) * shake : 0;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x + jx},${y}) scale(${s})`}>
        {/* stone arch + towers */}
        <rect x={-460} y={-640} width={920} height={900} fill={P.stone} {...ink} />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={-460 + i * 105} y={-700} width={70} height={66} fill={P.stone} {...ink} />)}
        {Array.from({ length: 7 }).map((_, r) => Array.from({ length: 9 }).map((_, c) => <rect key={`${r}${c}`} x={-450 + c * 102 + (r % 2) * 50} y={-620 + r * 120} width={92} height={108} fill="none" stroke={P.stone2} strokeWidth={3} opacity={0.5} />))}
        <path d="M -300 260 L -300 -260 Q -300 -470 0 -470 Q 300 -470 300 -260 L 300 260 Z" fill={P.ink} />
        {/* doors */}
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <path d={sd < 0 ? "M -285 255 L -285 -255 Q -285 -452 -6 -455 L -6 255 Z" : "M 6 255 L 6 -455 Q 285 -452 285 -255 L 285 255 Z"} fill={P.wood} {...ink} />
            {Array.from({ length: 6 }).map((_, i) => <line key={i} x1={sd * 6} x2={sd * 285} y1={-380 + i * 110} y2={-380 + i * 110} stroke={P.wood2} strokeWidth={14} />)}
            {Array.from({ length: 5 }).map((_, i) => <line key={`v${i}`} x1={sd * (40 + i * 55)} x2={sd * (40 + i * 55)} y1={-430} y2={250} stroke={P.wood2} strokeWidth={4} opacity={0.6} />)}
            {/* iron spikes: rows at elephant-head height (y -300..-60) */}
            {spikes > 0 && [-300, -180, -60].map((yy) => Array.from({ length: 4 }).map((_, i) => {
              const cx = sd * (60 + i * 62), L = 70 * spikes;
              return <g key={`${yy}${i}`}>
                <circle cx={cx} cy={yy} r={16} fill={P.iron} {...ink} strokeWidth={4} />
                <path d={`M ${cx - 12} ${yy} L ${cx} ${yy - L * 0.15} L ${cx + 12} ${yy} Z`} fill={P.iron2} transform={`translate(0,${-L * 0.0}) `} />
                <path d={`M ${cx - 11} ${yy - 4} L ${cx} ${yy - 8 - L} L ${cx + 11} ${yy - 4} Z`} fill={P.iron2} stroke={P.ink} strokeWidth={4} strokeLinejoin="round" style={{ transformBox: "fill-box" }} />
              </g>;
            }))}
          </g>
        ))}
        {/* crack */}
        {crack > 0 && <path d="M -6 -200 L 30 -140 L -20 -80 L 40 0 L -10 80" fill="none" stroke="#fff3c4" strokeWidth={8} strokeDasharray={600} strokeDashoffset={600 * (1 - crack)} />}
        {label && <g><rect x={-170} y={-620} width={340} height={90} rx={14} fill={P.white} {...ink} /><text x={0} y={-560} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={54} fill={P.ink}>{label}</text></g>}
      </g>
    </svg>
  );
};

/** Side-view war elephant (flat, our own drawing). x,y = feet centre. walk animates legs. dir 1 faces right. */
export const Elephant: React.FC<{ x: number; y: number; s?: number; walk?: boolean; dir?: 1 | -1; hurt?: number }> = ({ x, y, s = 1, walk = true, dir = 1, hurt = 0 }) => {
  const f = useCurrentFrame();
  const sw = walk ? Math.sin(f / 3.2) * 12 : 0;
  const body = "#8f8b93", body2 = "#77737c";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${x},${y}) scale(${s * dir},${s}) rotate(${hurt * -8})`}>
        <ellipse cx={0} cy={6} rx={230} ry={24} fill="#000" opacity={0.18} />
        {[[-120, sw], [-60, -sw], [70, -sw], [130, sw]].map(([lx, a], i) => <rect key={i} x={lx - 28} y={-200} width={56} height={200} rx={20} fill={i % 2 ? body2 : body} {...ink} transform={`rotate(${a} ${lx} -200)`} />)}
        <path d="M -200 -170 Q -220 -380 -20 -400 Q 160 -410 190 -260 Q 200 -180 150 -160 L -170 -150 Z" fill={body} {...ink} />
        {/* armour cloth */}
        <path d="M -120 -380 Q 0 -400 110 -370 L 120 -230 Q 0 -210 -130 -240 Z" fill={P.red} {...ink} />
        <path d="M -110 -260 L 110 -250" stroke="#f2c14e" strokeWidth={10} />
        {/* head + trunk + tusk + ear */}
        <path d="M 150 -360 Q 280 -390 300 -260 Q 305 -170 330 -80 Q 338 -40 310 -40 Q 290 -60 280 -150 Q 250 -200 170 -190 Z" fill={body} {...ink} />
        <path d="M 160 -340 Q 110 -330 110 -250 Q 120 -200 175 -205 Z" fill={body2} {...ink} />
        <path d="M 262 -205 Q 330 -190 350 -230" fill="none" stroke={P.white} strokeWidth={14} strokeLinecap="round" />
        <circle cx={240} cy={-300} r={9} fill={P.ink} />
        {/* howdah rider */}
        <rect x={-80} y={-460} width={140} height={70} rx={12} fill="#f2c14e" {...ink} />
        <circle cx={-10} cy={-500} r={26} fill="#c98d62" {...ink} strokeWidth={4} />
        <path d="M -40 -520 Q -10 -560 22 -520 Z" fill={P.red} {...ink} strokeWidth={4} />
        {hurt > 0 && <g transform="translate(330,-330)" opacity={hurt}><path d="M 0 0 L 30 -40 M 20 10 L 60 -10 M 10 30 L 50 40" stroke={P.red} strokeWidth={10} strokeLinecap="round" /></g>}
      </g>
    </svg>
  );
};

/** Top-down path map: straight path vs zig-zag path to a gate. `straight`/`zig` 0..1 draw progress, dot 0..1 = elephant position. */
export const PathMap: React.FC<{ straight?: number; zig?: number; dotS?: number; dotZ?: number }> = ({ straight = 0, zig = 0, dotS = -1, dotZ = -1 }) => {
  const zz = "M 240 1560 L 240 1340 L 820 1340 L 820 1120 L 240 1120 L 240 900 L 820 900 L 820 700";
  const st = "M 540 1560 L 540 700";
  const along = (pts: number[][], t: number) => { // polyline interpolation
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])); const tot = seg.reduce((a, b) => a + b, 0);
    let d = t * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const k = d / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } d -= seg[i]; }
    return pts[pts.length - 1];
  };
  const zp = [[240, 1560], [240, 1340], [820, 1340], [820, 1120], [240, 1120], [240, 900], [820, 900], [820, 700]];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={60} y={560} width={960} height={1080} rx={40} fill={P.sand} {...ink} />
      {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={100 + ((i * 197) % 880)} cy={600 + ((i * 131) % 1000)} r={5} fill={P.sand2} />)}
      <rect x={700} y={600} width={240} height={110} rx={10} fill={P.stone} {...ink} />
      <text x={820} y={672} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={40} fill={P.ink}>DARWAZA</text>
      {straight > 0 && <path d={st} fill="none" stroke={P.red} strokeWidth={22} strokeDasharray="40 24" pathLength={1} strokeDashoffset={0} opacity={0.9} style={{ clipPath: `inset(${(1 - straight) * 100}% 0 0 0)` }} />}
      {zig > 0 && <path d={zz} fill="none" stroke={P.lime} strokeWidth={30} strokeLinejoin="round" strokeDasharray={4000} strokeDashoffset={4000 * (1 - zig)} />}
      {dotS >= 0 && (() => { const [x, y] = along([[540, 1560], [540, 700]], dotS); return <circle cx={x} cy={y} r={34} fill="#8f8b93" {...ink} />; })()}
      {dotZ >= 0 && (() => { const [x, y] = along(zp, dotZ); return <circle cx={x} cy={y} r={34} fill="#8f8b93" {...ink} />; })()}
    </svg>
  );
};

/** Hill fort silhouette (wide): hill, walls with crenellations and loopholes, zig-zag road with numbered gates. */
export const HillFort: React.FC<{ gates?: number; climbers?: number; arrows?: boolean }> = ({ gates = 0, climbers = 0, arrows = false }) => {
  const f = useCurrentFrame();
  const road = [[140, 1640], [520, 1560], [260, 1460], [640, 1380], [380, 1290], [720, 1210], [480, 1130], [600, 1060]];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d="M -40 1760 Q 240 1300 470 1080 Q 560 1000 700 1060 Q 940 1250 1120 1760 Z" fill={P.hill} {...ink} />
      <path d="M 150 1760 Q 320 1450 470 1300 L 520 1760 Z" fill={P.hill2} opacity={0.5} />
      <polyline points={road.map((p) => p.join(",")).join(" ")} fill="none" stroke={P.sand} strokeWidth={26} strokeLinejoin="round" />
      {/* fort on top */}
      <rect x={300} y={760} width={560} height={320} fill={P.stone} {...ink} />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={300 + i * 72} y={720} width={44} height={44} fill={P.stone} {...ink} strokeWidth={5} />)}
      {[[300, 640], [800, 600]].map(([x, y], i) => <g key={i}><rect x={x - 40} y={y} width={140} height={480} fill={P.stone2} {...ink} />{Array.from({ length: 3 }).map((_, k) => <rect key={k} x={x - 40 + k * 50} y={y - 36} width={36} height={38} fill={P.stone2} {...ink} strokeWidth={5} />)}</g>)}
      <path d="M 520 1080 L 520 960 Q 580 900 640 960 L 640 1080 Z" fill={P.ink} />
      {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={360 + i * 80} y={820} width={14} height={44} rx={6} fill={P.ink} />)}
      {/* gates along the road */}
      {road.slice(1).map((p, i) => i < Math.floor(gates) && <g key={i} transform={`translate(${p[0]},${p[1]})`}>
        <rect x={-34} y={-70} width={68} height={70} fill={P.stone} {...ink} strokeWidth={4} /><path d="M -18 0 L -18 -38 Q 0 -56 18 -38 L 18 0 Z" fill={P.ink} />
        <circle cx={0} cy={-100} r={26} fill={P.lime} {...ink} strokeWidth={4} /><text x={0} y={-90} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={28} fill={P.ink}>{i + 1}</text>
      </g>)}
      {/* climbing enemies */}
      {Array.from({ length: Math.floor(climbers * 8) }).map((_, i) => { const t = ((f * 0.004 + i / 8) % 1) * 0.6; const k = Math.floor(t * 7), r = t * 7 - k; const a = road[k], b = road[k + 1]; return <circle key={i} cx={a[0] + (b[0] - a[0]) * r} cy={a[1] + (b[1] - a[1]) * r - 14} r={12} fill={P.red} {...ink} strokeWidth={3} />; })}
      {arrows && Array.from({ length: 6 }).map((_, i) => { const t = ((f * 0.025 + i / 6) % 1); return <line key={i} x1={370 + i * 80 + t * 40} y1={850 + t * 420} x2={370 + i * 80 + t * 40 + 18} y2={850 + t * 420 + 50} stroke={P.ink} strokeWidth={6} strokeLinecap="round" />; })}
    </svg>
  );
};

/** Wall close-up with loopholes and soldiers shooting down (arrows fly). */
export const WallLoopholes: React.FC<{ shoot?: number }> = ({ shoot = 0 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={0} y={560} width={1080} height={900} fill={P.stone} {...ink} />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={i * 140 + 10} y={500} width={90} height={80} fill={P.stone} {...ink} />)}
      {Array.from({ length: 6 }).map((_, r) => Array.from({ length: 8 }).map((_, c) => <rect key={`${r}${c}`} x={c * 140 + (r % 2) * 70 - 20} y={600 + r * 140} width={130} height={130} fill="none" stroke={P.stone2} strokeWidth={3} opacity={0.5} />))}
      {[200, 540, 880].map((x, i) => <g key={i}>
        <rect x={x - 22} y={720} width={44} height={170} rx={20} fill={P.ink} />
        <circle cx={x} cy={760} r={14} fill="#c98d62" />
        {shoot > 0 && Array.from({ length: 3 }).map((_, k) => { const t = ((f * 0.03 + k / 3 + i * 0.2) % 1); return <g key={k} opacity={shoot}><line x1={x + t * 120} y1={880 + t * 640} x2={x + t * 120 + 22} y2={880 + t * 640 + 60} stroke={P.ink} strokeWidth={7} strokeLinecap="round" /><path d={`M ${x + t * 120 + 22} ${880 + t * 640 + 60} l -14 -4 l 10 -12 Z`} fill={P.iron} /></g>; })}
      </g>)}
      <rect x={0} y={1460} width={1080} height={460} fill={P.sand} {...ink} />
    </svg>
  );
};
