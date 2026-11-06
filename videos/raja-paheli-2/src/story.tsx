// ─────────────────────────────────────────────────────────────────────────────
//  "Raja ki paheli – Part 2 (jawab)". Same court and cast as Part 1, the logic loop explained, chains break.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Bokeh, Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Rings, Stamp } from "./kit/Marks";
import { Phone, StatusBar } from "./kit/Phone";
import { EndCard } from "./kit/EndCard";
import { Studio3D } from "./three/Studio";
import { Figure, Hall } from "./three/Darbaar";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = ["L2"];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;

const Night: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #3b1e18 0%, #120807 70%)" }} />;

const Court: React.FC<{ king?: number; glow?: number; free?: number }> = ({ king = 0, glow = 0, free = 0 }) => (
  <>
    <Hall />
    <Figure kind="king" p={[0, 1.55, -9]} seated nod={king} />
    <Figure kind="guard" p={[-1.3, 0, -5.2]} ry={0.3} />
    <Figure kind="guard" p={[1.3, 0, -5.2]} ry={-0.3} />
    <Figure kind="guard" p={[-0.75, 0, -0.6]} ry={0.2} />
    <Figure kind="guard" p={[0.75, 0, -0.6]} ry={-0.2} />
    <Figure kind="prisoner" p={[0, 0, -0.9]} ry={Math.PI} glow={glow} free={free} />
  </>
);

const CageIcon: React.FC<{ s?: number; c?: string }> = ({ s = 120, c = C.white }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><rect x={10} y={12} width={80} height={76} rx={6} fill="none" stroke={c} strokeWidth={6} />
    {[26, 42, 58, 74].map((x) => <line key={x} x1={x} y1={12} x2={x} y2={88} stroke={c} strokeWidth={5} />)}
    <circle cx={50} cy={52} r={14} fill="#c98a2e" /><circle cx={50} cy={52} r={22} fill="none" stroke="#6b3a14" strokeWidth={7} /></svg>
);
const WellIcon: React.FC<{ s?: number; c?: string }> = ({ s = 120, c = C.white }) => (
  <svg width={s} height={s} viewBox="0 0 100 100"><ellipse cx={50} cy={60} rx={36} ry={12} fill="#050303" stroke={c} strokeWidth={6} />
    <path d="M14 60 L14 86 Q50 100 86 86 L86 60" fill="none" stroke={c} strokeWidth={6} />
    <line x1={18} y1={60} x2={18} y2={14} stroke={c} strokeWidth={5} /><line x1={82} y1={60} x2={82} y2={14} stroke={c} strokeWidth={5} />
    <line x1={12} y1={16} x2={88} y2={16} stroke={c} strokeWidth={6} /><line x1={50} y1={16} x2={50} y2={52} stroke={c} strokeWidth={3} /></svg>
);

// 1 ── "Part 2: the answer" – the court again
const S1: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><Night />
    <Studio3D dur={d + 10} from={[0.0, 2.4, 3.8]} to={[0.0, 2.1, 2.6]} look={[0, 1.4, -6]} fov={44}>
      <Court />
    </Studio3D>
    <Pill at={2} x={110} y={1260} text="PART 2" size={70} bg={C.white} />
    <Pill at={G(o, hit("L1", "jawab"))} x={110} y={1380} text="JAWAB" size={96} />
    <Hud left="Raja ka darbaar" right="kal ki paheli" clock="P2" />
    <Vignette />
  </AbsoluteFill>
);

// 2 ── the prisoner's line (close-up from the king's side, idea glow)
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill><Night />
      <Studio3D dur={d + 10} from={[0.9, 2.2, -4.3]} to={[0.6, 2.1, -3.6]} look={[0, 1.45, -0.9]} fov={36}>
        <Court glow={lerp(f, [0, 20], [0, 1])} />
      </Studio3D>
      <div style={{ position: "absolute", left: 90, right: 150, top: 1180, padding: "26px 34px", borderRadius: 28, background: "rgba(10,13,12,.9)", border: `4px solid ${C.lime}`,
        fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: C.white, lineHeight: 1.15, opacity: io(f, G(o, hit("L2", "Mujhe")), 6) }}>
        "Mujhe <span style={{ color: C.lime }}>andhe kuyein</span> mein daala jaayega."
      </div>
      <Hud left="Qaidi ki line" right="bas ek" clock="1 LINE" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 3 ── the king is trapped
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const p = G(o, hit("L3", "phas"));
  return (
    <AbsoluteFill><Night />
      <Cam dur={d} s0={1} s1={1.03} kick={[p]}>
        <Studio3D dur={d + 10} from={[0.6, 2.9, -5.6]} to={[0.4, 2.85, -6.3]} look={[0, 3.25, -9]} fov={34}>
          <Court king={f >= p ? Math.sin((f - p) / 2) * 0.12 * Math.max(0, 1 - (f - p) / 20) : 0} />
        </Studio3D>
      </Cam>
      <Stamp at={p} x={540} y={640} text="RAJA PHAS GAYA" size={86} rot={-5} />
      <Hud left="Raja" right="uljhan" clock="?!" dot={C.red} />
      <Vignette />
    </AbsoluteFill>
  );
};

/** Logic chain: three boxes appear one by one, last one turns red with a ✕ ("contradiction"). */
const Chain: React.FC<{ steps: { at: number; t: string; c: string; icon?: React.ReactNode }[]; breakAt: number }> = ({ steps, breakAt }) => {
  const f = useCurrentFrame();
  return (
    <>
      {steps.map((s, i) => {
        const k = io(f, s.at, 7), y = 560 + i * 300;
        return <React.Fragment key={i}>
          {i > 0 && <div style={{ position: "absolute", left: 520, top: y - 86, fontSize: 64, color: C.grey, opacity: k }}>↓</div>}
          <div style={{ position: "absolute", left: 90, right: 270, top: y, height: 200, borderRadius: 26, background: "rgba(10,13,12,.85)", border: `4px solid ${s.c}`,
            display: "flex", alignItems: "center", gap: 26, padding: "0 30px", opacity: k, transform: `translateY(${(1 - k) * 30}px) scale(${i === steps.length - 1 && f >= breakAt ? 1 + 0.04 * (1 - io(f, breakAt, 6)) : 1})`,
            boxShadow: i === steps.length - 1 && f >= breakAt ? `0 0 50px ${C.red}88` : "none" }}>
            {s.icon}
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: C.white, lineHeight: 1.12 }}>{s.t}</div>
          </div>
        </React.Fragment>;
      })}
      {f >= breakAt && <Stamp at={breakAt} x={880} y={1260} text="✕" size={120} rot={0} />}
    </>
  );
};

// 4 ── if it's TRUE → cage → then "well" was false ✕
const S4: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor opacity={0.07} />
    <Cam dur={d} s0={1} s1={1.04}>
      <Chain breakAt={G(o, hit("L5", "jhooth"))} steps={[
        { at: 2, t: "Line SACH hai", c: "#2f9e57" },
        { at: G(o, hit("L4", "sher")), t: "Niyam: sher ka pinjra", c: C.amber, icon: <CageIcon s={110} /> },
        { at: G(o, hit("L5", "kuyein")), t: "Toh 'kuan' wali baat JHOOTH", c: C.red },
      ]} />
    </Cam>
    <Hud left="Raasta 1" right="agar sach" clock="1/2" />
    <Vignette />
  </Ground>
);

// 5 ── if it's FALSE → well → then the line became true ✕
const S5: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor opacity={0.07} />
    <Cam dur={d} s0={1} s1={1.04}>
      <Chain breakAt={G(o, hit("L7", "sach"))} steps={[
        { at: 2, t: "Line JHOOTH hai", c: C.red },
        { at: G(o, hit("L6", "kuan")), t: "Niyam: andha kuan", c: C.amber, icon: <WellIcon s={110} /> },
        { at: G(o, hit("L7", "toh")), t: "Toh line SACH ho gayi", c: "#2f9e57" },
      ]} />
    </Cam>
    <Hud left="Raasta 2" right="agar jhooth" clock="2/2" />
    <Vignette />
  </Ground>
);

// 6 ── both ways the king breaks his own word (spinning loop)
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const t = G(o, hit("L8", "toot"));
  const ang = f * 4;
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.06} kick={[t]}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540,1000) rotate(${ang})`}>
            <circle r={300} fill="none" stroke={C.white} strokeWidth={10} strokeDasharray="40 30" opacity={0.6} />
            <path d="M 300 0 l -26 -34 l 52 0 Z" fill={C.white} />
            <path d="M -300 0 l -26 34 l 52 0 Z" fill={C.white} />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 160, top: 860 }}><CageIcon s={190} /></div>
        <div style={{ position: "absolute", right: 160, top: 860 }}><WellIcon s={190} /></div>
        <Pill at={2} x={330} y={1360} text="DONO GALAT" size={70} bg={C.white} />
        <Stamp at={t} x={540} y={640} text="BAAT TOOTI" size={100} rot={-4} />
      </Cam>
      <Hud left="Paradox" right="koi raasta nahi" clock="∞" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 7 ── so the king must free him (3D: chains fly off, lime light)
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const a = G(o, hit("L9", "aazaad"));
  return (
    <AbsoluteFill><Night />
      <Studio3D dur={d + 10} from={[2.4, 2.2, -5.0]} to={[1.6, 1.9, -4.0]} look={[0, 1.1, -0.9]} fov={38}>
        <Court free={lerp(f, [a - 2, a + 16], [0, 1])} glow={f >= a ? 1.2 : 0.3} />
      </Studio3D>
      {f >= a && <Rings at={a} x={540} y={900} color={C.lime} n={3} max={340} />}
      <Pill at={a} x={110} y={1360} text="AAZAAD!" size={110} />
      <Hud left="Faisla" right="raja ki haar" clock="✓" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 8 ── did you get it? (comments with a lime tick)
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const s = G(o, hit("L10", "sahi"));
  return (
    <Ground><Bokeh n={12} seed={6} hue="lime" opacity={0.2} />
      <Cam dur={d} s0={1} s1={1.05}>
        <Phone y={1120} scale={0.78} rx={[6, 3]} ry={[-10, -4]} dur={d} enter={0}>
          <StatusBar time="09:12" />
          <div style={{ position: "absolute", top: 180, left: 40, right: 40, fontFamily: F.sans, color: C.white }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>Comments</div>
            {["Mujhe kuyein mein daala jaayega", "Main pinjre mein jaaunga?", "Mujhe kuyein mein..."].map((t, i) => {
              const ok = i !== 1;
              return <div key={i} style={{ marginTop: 34, display: "flex", gap: 18, alignItems: "center", opacity: io(f, 4 + i * 6, 6) }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: "#2a302e" }} />
                <div style={{ flex: 1, fontSize: 28, lineHeight: 1.2 }}>{t}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: ok ? C.lime : C.red, opacity: io(f, s + i * 4, 5) }}>{ok ? "✓" : "✕"}</div>
              </div>;
            })}
          </div>
        </Phone>
        <Pill at={G(o, hit("L10", "Comment"))} x={110} y={560} text="SAHI THA?" size={80} />
      </Cam>
      <Hud left="Tumhari baari" right="comment" clock="✓/✕" />
      <Vignette />
    </Ground>
  );
};

// 9 ── end card
const S9: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "follow"))} logo="3D" />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L6"), S5), P(at("L8"), S6), P(at("L9"), S7), P(at("L10"), S8), P(at("L11"), S9),
];
export const IMPACTS = [hit("L3", "phas"), hit("L8", "toot")];
export const POPS = [hit("L1", "jawab"), hit("L4", "sach"), hit("L4", "sher"), hit("L5", "jhooth"), hit("L6", "jhooth"), hit("L6", "kuan"), hit("L7", "sach"), hit("L9", "aazaad"), hit("L10", "sahi"), hit("L11", "follow")];
export const RISERS = [at("L8"), hit("L9", "aazaad")];
export const DURATION = TOTAL;
