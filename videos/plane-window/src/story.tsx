// ─────────────────────────────────────────────────────────────────────────────
//  "Plane ki khidki gol kyun?" – Comet 1954, metal fatigue (facts + sources in SCRIPT.md). Creator's own voice.
//  Heavy on real three.js: our own generic airliner, a skin panel with a stress heat-map, crack and tear.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop, rng } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Counter, Pill, Rings, Stamp } from "./kit/Marks";
import { EndCard, Poll } from "./kit/EndCard";
import { Studio3D } from "./three/Studio";
import { Airliner3D, Clouds3D, SkinPanel3D } from "./three/Plane";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = [];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;

/** Night sky behind the 3D canvas: deep gradient, stars, moon glow. */
const Sky: React.FC<{ red?: number }> = ({ red = 0 }) => {
  const f = useCurrentFrame();
  const stars = useMemo(() => { const r = rng(42); return Array.from({ length: 90 }, () => [r() * 1080, r() * 1300, r() * 2 + 0.6, r()]); }, []);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #04060c 0%, #0a1222 45%, ${red ? "#2a0d0a" : "#16233a"} 100%)` }}>
      <div style={{ position: "absolute", left: 700, top: 260, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(#e8eef8 0%, #9fb2d0 30%, transparent 70%)", opacity: 0.35, filter: "blur(6px)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {stars.map(([x, y, s, p], i) => <circle key={i} cx={x} cy={y} r={s} fill="#fff" opacity={0.35 + 0.35 * Math.sin(f / 9 + p * 6)} />)}
      </svg>
      {red > 0 && <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, ${C.red}55, transparent 60%)`, opacity: red }} />}
    </AbsoluteFill>
  );
};

// 1a ── HOOK: airliner cruising at night, round windows glowing
const S1a: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const g = G(o, hit("L1", "gol"));
  return (
    <AbsoluteFill><Sky />
      <Studio3D dur={d + 10} from={[-4.2, 2.4, 10.5]} to={[-3.2, 1.6, 9.0]} look={[0, 0.1, 0]} fov={34} warm={false}>
        <Clouds3D seed={3} />
        <Airliner3D round rotation={[0.06, -1.05 + f * 0.0016, 0.1]} />
      </Studio3D>
      <Rings at={g} x={540} y={1060} color={C.lime} n={2} max={260} />
      <Hud left="35,000 ft · raat" right="cruise" clock="00:00" />
      <Vignette />
    </AbsoluteFill>
  );
};
// 1b ── "chaukor khidki wale plane toot gaye" – old jet with square-ish windows, stress rings go red, shake
const S1b: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const t = G(o, hit("L1", "toot"));
  return (
    <AbsoluteFill><Sky red={io(f, t - 4, 6)} />
      <Studio3D dur={d + 10} from={[3.0, 1.8, 9.0]} to={[2.2, 1.3, 7.8]} look={[0, 0, 0]} fov={34} warm={false}>
        <Clouds3D seed={5} />
        <Airliner3D round={false} stress={lerp(f, [4, t], [0, 1])} shake={f >= t ? 1 : 0} rotation={[0.02, 1.0, -0.08]} nightGlow={0.7} />
      </Studio3D>
      <Chip at={4} x={110} y={1360} lines={["CHAUKOR KHIDKI"]} size={56} color={C.amber} mono />
      {f >= t && <Stamp at={t} x={540} y={1520} text="TOOT GAYE" size={100} rot={-5} />}
      <Hud left="Purana jet" right="1950s" clock="00:02" dot={C.red} />
      <Vignette />
    </AbsoluteFill>
  );
};

// 2 ── 1954, the first jet airliner (year flip + blueprint drawing itself)
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const y = Math.round(lerp(f, [0, 16], [2026, 1954]));
  const draw = lerp(f, [6, d - 8], [0, 1]);
  const path = "M90 120 Q 60 120 40 100 Q 60 80 110 78 L 520 78 Q 580 78 600 50 L 640 20 L 660 20 L 650 80 L 700 90 L 700 110 L 560 112 L 520 120 Z M 300 100 L 420 190 L 470 190 L 380 100 M 300 86 L 400 10 L 440 10 L 380 86";
  return (
    <Ground><GridFloor opacity={0.1} />
      <Cam dur={d} s0={1} s1={1.06}>
        <div style={{ position: "absolute", top: 560, width: "100%", textAlign: "center", fontFamily: F.mono, fontWeight: 800, fontSize: 210, color: C.white, letterSpacing: -8 }}>{y}</div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(160,980) scale(1.06)" style={{ filter: `drop-shadow(0 0 10px ${C.lime})` }}>
            <path d={path} fill="none" stroke={C.lime} strokeWidth={4} strokeDasharray={3000} strokeDashoffset={3000 * (1 - draw)} />
            {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={150 + i * 30} y={88} width={14} height={11} fill="none" stroke={C.lime} strokeWidth={2} opacity={io(f, 14 + i, 4)} />)}
          </g>
        </svg>
        <Pill at={G(o, hit("L2", "pehla"))} x={110} y={1300} text="PEHLA JET AIRLINER" size={66} />
        <Chip at={G(o, hit("L2", "Comet"))} x={110} y={1440} lines={["NAAM: COMET"]} size={60} mono />
      </Cam>
      <Hud left="Itihaas" right="1950s" clock="1954" />
      <Vignette />
    </Ground>
  );
};

// 3 ── two Comets vanish from radar
const Radar: React.FC<{ x: number; y: number; at: number; lost: number; label: string; date: string }> = ({ x, y, at: a, lost, label, date }) => {
  const f = useCurrentFrame();
  const k = io(f, a, 8), sw = (f * 6) % 360, gone = f >= lost;
  return (
    <div style={{ position: "absolute", left: x - 230, top: y - 230, width: 460, height: 560, opacity: k, transform: `scale(${0.9 + 0.1 * k})` }}>
      <svg width={460} height={460}>
        <circle cx={230} cy={230} r={220} fill="#07120c" stroke={C.lime} strokeWidth={4} opacity={0.9} />
        {[70, 140].map((r) => <circle key={r} cx={230} cy={230} r={r} fill="none" stroke={C.lime} strokeOpacity={0.25} strokeWidth={2} />)}
        <path d={`M230 230 L ${230 + 220 * Math.cos((sw * Math.PI) / 180)} ${230 + 220 * Math.sin((sw * Math.PI) / 180)}`} stroke={C.lime} strokeWidth={4} opacity={0.8} />
        {!gone && <circle cx={300} cy={150} r={14} fill={C.lime} />}
        {gone && <g stroke={C.red} strokeWidth={8} strokeLinecap="round" opacity={pop(f, lost, 10)}><line x1={280} y1={130} x2={320} y2={170} /><line x1={320} y1={130} x2={280} y2={170} /></g>}
      </svg>
      <div style={{ textAlign: "center", fontFamily: F.mono, fontSize: 30, color: gone ? C.red : C.lime, marginTop: 14, fontWeight: 700 }}>{gone ? "SIGNAL LOST" : label}</div>
      <div style={{ textAlign: "center", fontFamily: F.mono, fontSize: 26, color: C.grey, marginTop: 6 }}>{date}</div>
    </div>
  );
};
const S3: React.FC<SceneP> = ({ o, d }) => {
  const t = G(o, hit("L3", "toot"));
  return (
    <Ground>
      <Cam dur={d} s0={1} s1={1.05} kick={[t]}>
        <Radar x={300} y={900} at={2} lost={t - 10} label="COMET 1" date="JAN 1954 · ELBA" />
        <Radar x={780} y={1200} at={G(o, hit("L3", "do"))} lost={t} label="COMET 2" date="APR 1954 · NAPLES" />
      </Cam>
      <Hud left="Radar" right="hawa mein" clock="1954" dot={C.red} />
      <Vignette />
    </Ground>
  );
};

// 4 ── 56 lives (quiet, respectful)
const S4: React.FC<SceneP> = ({ d }) => (
  <Ground tone="red">
    <Cam dur={d} s0={1} s1={1.04}>
      <Counter at={0} dur={14} from={0} to={56} x={540} y={760} size={300} color={C.red} align="center" />
      <div style={{ position: "absolute", top: 1130, width: "100%", textAlign: "center", fontFamily: F.mono, fontSize: 40, letterSpacing: 10, color: C.grey }}>2 HAADSE · 1954</div>
    </Cam>
    <Hud left="Nuksaan" right="1954" clock="56" dot={C.red} />
    <Vignette amt={0.65} />
  </Ground>
);

// 5 ── "bomb?" – no, something else (question → magnifier on metal)
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const s = G(o, hit("L5", "sach"));
  return (
    <Ground><GridFloor opacity={0.07} />
      <Cam dur={d} s0={1} s1={1.07}>
        <div style={{ position: "absolute", top: 720, left: 110, fontFamily: F.sans, fontWeight: 900, fontSize: 170, color: f < s ? C.white : "#3a403e", textDecoration: f >= s ? "line-through" : "none", textDecorationColor: C.red, textDecorationThickness: 14 }}>BOMB?</div>
        {f >= s && <Pill at={s} x={110} y={1040} text="SACH KUCHH AUR" size={84} />}
        {f >= s && <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: io(f, s, 8) }}>
          <circle cx={700} cy={1380} r={130} fill="#9aa1a4" stroke={C.white} strokeWidth={14} />
          <path d="M650 1330 L 690 1380 L 670 1420 L 720 1460" stroke={C.red} strokeWidth={6} fill="none" />
          <line x1={795} y1={1475} x2={900} y2={1580} stroke={C.white} strokeWidth={26} strokeLinecap="round" />
        </svg>}
      </Cam>
      <Hud left="Jaanch" right="investigation" clock="?" />
      <Vignette />
    </Ground>
  );
};

// 6 ── METAL FATIGUE: 3D skin panel, square window, faint stress waking up
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0A0D0C" }}>
      <Studio3D dur={d + 10} from={[0.9, 0.4, 3.4]} to={[0.5, 0.25, 2.9]} look={[-0.25, 0, 0]} fov={34}>
        <SkinPanel3D round={false} heat={lerp(f, [0, d], [0.1, 0.45])} lines={lerp(f, [0, d], [0, 0.6])} />
      </Studio3D>
      <Pill at={G(o, hit("L6", "metal"))} x={110} y={1360} text="METAL FATIGUE" size={86} bg={C.white} />
      <Hud left="Plane ki body" right="close-up" clock="01" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 7a ── climbing: cabin pressurised, fuselage swells like a balloon (altimeter up)
const S7a: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const ph = G(o, hit("L7", "phoolti"));
  const inf = lerp(f, [G(o, hit("L7", "hawa")), ph + 6], [0, 1]);
  const alt = Math.round(lerp(f, [0, d], [0, 35000]) / 100) * 100;
  return (
    <AbsoluteFill><Sky />
      <Studio3D dur={d} from={[1.0, -1.2, 10.0]} to={[0.8, -0.5, 8.6]} look={[0, 0.3, 0]} fov={34} warm={false}>
        <Clouds3D seed={8} y={-1.8} />
        <Airliner3D round={false} inflate={inf} stress={inf * 0.8} rotation={[0, -1.0, 0.32]} />
      </Studio3D>
      <div style={{ position: "absolute", left: 110, top: 1320, fontFamily: F.mono, fontWeight: 800, fontSize: 84, color: C.lime }}>{alt.toLocaleString("en-IN")} ft ↑</div>
      <Chip at={G(o, hit("L7", "hawa"))} x={110} y={1450} lines={["ANDAR HAWA BHARI"]} size={50} mono />
      {f >= ph && <Pill at={ph} x={560} y={1440} text="PHOOLI" size={70} bg={C.amber} />}
      <Hud left="Upar jaate hue" right="pressure ↑" clock="02" />
      <Vignette />
    </AbsoluteFill>
  );
};
// 7b ── descending: it shrinks back
const S7b: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const inf = lerp(f, [G(o, hit("L7", "sikud")) - 4, d], [1, 0]);
  const alt = Math.round(lerp(f, [0, d], [35000, 2000]) / 100) * 100;
  return (
    <AbsoluteFill><Sky />
      <Studio3D dur={d} from={[-1.4, 2.6, 10.0]} to={[-1.0, 1.8, 8.6]} look={[0, 0, 0]} fov={34} warm={false}>
        <Clouds3D seed={9} y={-1.2} />
        <Airliner3D round={false} inflate={inf} stress={inf * 0.5} rotation={[0, 1.05, -0.22]} />
      </Studio3D>
      <div style={{ position: "absolute", left: 110, top: 1320, fontFamily: F.mono, fontWeight: 800, fontSize: 84, color: C.white }}>{alt.toLocaleString("en-IN")} ft ↓</div>
      <Chip at={G(o, hit("L7", "sikud"))} x={110} y={1450} lines={["WAPAS SIKUDI"]} size={50} mono color={C.white} />
      <Hud left="Neeche aate hue" right="pressure ↓" clock="03" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 8 ── every flight, thousands of times (pressure cycle wave + counter)
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const hz = G(o, hit("L8", "Hazaaron"));
  const cyc = lerp(f, [hz - 6, d], [1, 18]);
  const pts = Array.from({ length: 200 }, (_, i) => { const x = i / 199; const ph = x * cyc * Math.PI * 2; return `${100 + x * 880},${1180 - Math.max(0, Math.sin(ph)) * 220}`; }).join(" ");
  const show = Math.round(lerp(f, [2, 20], [2, 200]));
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1} s1={1.05}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={100} y1={1180} x2={980} y2={1180} stroke={C.line} strokeWidth={4} />
          <polyline points={pts.split(" ").slice(0, show).join(" ")} fill="none" stroke={f >= hz ? C.amber : C.lime} strokeWidth={8} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${f >= hz ? C.amber : C.lime})` }} />
          <text x={100} y={1250} fill={C.grey} fontFamily="JetBrains Mono" fontSize={30}>CABIN PRESSURE · har flight = 1 cycle</text>
        </svg>
        <Counter at={hz - 4} dur={Math.max(10, d - hz)} from={1} to={10000} x={110} y={600} size={170} color={C.amber} suffix="+" />
        <Chip at={hz} x={110} y={800} lines={["FLIGHTS"]} size={52} mono color={C.grey} />
      </Cam>
      <Hud left="Socho" right="har flight" clock="×1000s" />
      <Vignette />
    </Ground>
  );
};

// 9 ── stress runs to the window's sharp corner (3D heat map lights the corners red)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const k = G(o, hit("L9", "kone"));
  return (
    <AbsoluteFill style={{ background: "#0A0D0C" }}>
      <Studio3D dur={d + 8} from={[0.1, 0.1, 3.0]} to={[0.05, 0.25, 1.7]} look={[-0.27, 0.05, 0]} lookTo={[-0.05, 0.3, 0]} fov={34}>
        <SkinPanel3D round={false} heat={lerp(f, [0, k], [0.45, 1])} lines={1} />
      </Studio3D>
      {f >= k && <Rings at={k} x={600} y={820} color={C.red} n={3} max={240} />}
      <Chip at={G(o, hit("L9", "zor"))} x={110} y={1360} lines={["SAARA ZOR → KONE PE"]} size={56} color={C.red} />
      <Hud left="Stress map" right="tez kona" clock="04" dot={C.red} />
      <Vignette />
    </AbsoluteFill>
  );
};

// 10 ── crack grows from the corner, then the skin tears open (3D, debris, shake)
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const c = G(o, hit("L10", "crack")), p = G(o, hit("L10", "phat"));
  return (
    <AbsoluteFill style={{ background: f >= p ? "#1a0705" : "#0A0D0C" }}>
      <Cam dur={d} s0={1} s1={1.04} kick={[p]}>
        <Studio3D dur={d} from={[0.25, 0.35, 1.9]} to={[0.6, 0.2, 2.6]} look={[0, 0.15, 0]} fov={36}>
          <SkinPanel3D round={false} heat={1} lines={0.5} crack={lerp(f, [c - 6, p], [0, 1])} split={lerp(f, [p, p + 22], [0, 1])} />
        </Studio3D>
      </Cam>
      {f >= p && <AbsoluteFill style={{ background: "#fff", opacity: 1 - io(f, p, 6) }} />}
      <Chip at={c} x={110} y={1360} lines={["FATIGUE CRACK"]} size={56} color={C.red} mono />
      {f >= p && <Stamp at={p + 2} x={540} y={1560} text="BODY PHAT GAYI" size={84} rot={-4} />}
      <Hud left="Kone se" right="crack" clock="05" dot={C.red} />
      <Vignette amt={0.6} />
    </AbsoluteFill>
  );
};

// 11 ── the fix: remove the corners (square morphs into a rounded window)
const S11: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const m = lerp(f, [G(o, hit("L11", "Kone")), G(o, hit("L11", "hata")) + 8], [0, 1]);
  const w = 360, h = 460, r = 18 + m * (w / 2 - 18);
  return (
    <Ground><GridFloor />
      <Cam dur={d} s0={1} s1={1.06}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <rect x={540 - w / 2} y={1020 - h / 2} width={w} height={h} rx={r} ry={Math.min(r * 1.25, h / 2)} fill="#0d1a2a" stroke={m > 0.5 ? C.lime : C.amber} strokeWidth={22} style={{ filter: `drop-shadow(0 0 22px ${m > 0.5 ? C.lime : C.amber})` }} />
          {m < 0.4 && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => <circle key={i} cx={540 + sx * w / 2} cy={1020 + sy * h / 2} r={40} fill="none" stroke={C.red} strokeWidth={8} opacity={(1 - m * 2.5) * (0.6 + 0.4 * Math.sin(f / 3))} />)}
        </svg>
        <Chip at={G(o, hit("L11", "engineers"))} x={110} y={560} lines={["ENGINEERS KA JAWAB"]} size={52} mono color={C.grey} />
        <Pill at={G(o, hit("L11", "hata"))} x={110} y={1400} text="KONE HATAO" size={86} />
      </Cam>
      <Hud left="Fix" right="design" clock="06" />
      <Vignette />
    </Ground>
  );
};

// 12 ── round window: the stress flows around evenly (3D, calm colours, lime signal)
const S12: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const b = G(o, hit("L12", "barabar"));
  return (
    <AbsoluteFill style={{ background: "#0A0D0C" }}>
      <Studio3D dur={d + 8} from={[-0.7, 0.35, 3.4]} to={[-0.35, 0.15, 2.7]} look={[0, 0, 0]} fov={34}>
        <SkinPanel3D round heat={lerp(f, [0, 12], [0.3, 0.75])} lines={1} />
      </Studio3D>
      {f >= b && <Rings at={b} x={540} y={960} color={C.lime} n={2} max={320} />}
      <Chip at={G(o, hit("L12", "chaaron"))} x={110} y={1360} lines={["ZOR CHAARON TARAF BARABAR"]} size={48} color={C.lime} />
      <Hud left="Gol khidki" right="stress map" clock="07" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 13 ── today: modern jet, camera glides along the row of rounded windows + mantra pills
const S13: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><Sky />
    <Studio3D dur={d} from={[-1.8, 0.5, 2.8]} to={[0.6, 0.35, 2.5]} look={[-0.9, 0.0, 0]} lookTo={[1.1, 0.0, 0]} fov={40} warm={false}>
      <Clouds3D seed={12} y={-1.6} />
      <Airliner3D round rotation={[0, 0, 0]} />
    </Studio3D>
    <Pill at={G(o, hit("L13", "khidki"))} x={110} y={1260} text="KONA NAHI." size={84} bg={C.white} />
    <Pill at={G(o, hit("L13", "gol"))} x={110} y={1390} text="GOL." size={110} />
    <Hud left="Aaj ka plane" right="har airline" clock="2026" />
    <Vignette />
  </AbsoluteFill>
);

// 14 ── CTA end card
const S14: React.FC<SceneP> = ({ o }) => (
  <AbsoluteFill><Sky />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L14", "Follow"))} logo="3D" />
    <Vignette />
  </AbsoluteFill>
);

// 15 ── poll
const S15: React.FC<SceneP> = ({ o }) => (
  <AbsoluteFill><Sky />
    <Poll q="Ye pata tha?" a="Haan, pata tha" b="Nahi, aaj pata chala" pickAt={G(o, hit("L15", "Haan"))} pick={1} />
    <Vignette />
  </AbsoluteFill>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1a), P(hit("L1", "Kyunki"), S1b), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6),
  P(at("L7"), S7a), P(hit("L7", "Neeche"), S7b), P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10), P(at("L11"), S11),
  P(at("L12"), S12), P(at("L13"), S13), P(at("L14"), S14), P(at("L15"), S15),
];
export const IMPACTS = [hit("L1", "toot"), hit("L3", "toot"), hit("L10", "phat")];
export const POPS = [hit("L1", "gol"), hit("L2", "1954"), hit("L2", "pehla"), hit("L2", "Comet"), hit("L4", "56"), hit("L5", "sach"), hit("L6", "metal"), hit("L7", "phoolti"), hit("L7", "sikud"), hit("L8", "Hazaaron"), hit("L9", "kone"), hit("L10", "crack"), hit("L11", "hata"), hit("L12", "barabar"), hit("L13", "khidki"), hit("L13", "gol"), hit("L14", "Follow"), hit("L15", "Haan")];
export const RISERS = [hit("L10", "phat"), at("L13")];
export const DURATION = TOTAL;
