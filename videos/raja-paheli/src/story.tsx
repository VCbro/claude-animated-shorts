// ─────────────────────────────────────────────────────────────────────────────
//  "Raja ki paheli" – our own version of the classic liar's-choice riddle (answer in SCRIPT.md, for Part 2).
//  Own court, own characters, own lines. three.js darbaar + kit overlays. Kokoro voice.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, wordAt, TOTAL } from "./kit/timeline";
import { Bokeh, Cam, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Rings, Stamp } from "./kit/Marks";
import { Phone, StatusBar } from "./kit/Phone";
import { EndCard } from "./kit/EndCard";
import { Studio3D } from "./three/Studio";
import { Figure, Hall, LionCage, Torch, Well } from "./three/Darbaar";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = [];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;

const Night: React.FC<{ red?: boolean }> = ({ red }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${red ? "#3a0d0b" : "#3b1e18"} 0%, #120807 70%)` }} />
);

/** The court with the cast in place. */
const Court: React.FC<{ king?: number; prisonerGlow?: number }> = ({ king = 0, prisonerGlow = 0 }) => (
  <>
    <Hall />
    <Figure kind="king" p={[0, 1.55, -9]} seated nod={king} />
    <Figure kind="guard" p={[-1.3, 0, -5.2]} ry={0.3} />
    <Figure kind="guard" p={[1.3, 0, -5.2]} ry={-0.3} />
    <Figure kind="guard" p={[-0.75, 0, -0.6]} ry={0.2} />
    <Figure kind="guard" p={[0.75, 0, -0.6]} ry={-0.2} />
    <Figure kind="prisoner" p={[0, 0, -0.9]} ry={Math.PI} glow={prisonerGlow} />
  </>
);

// small SVG icons for the decree card
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

// 1a ── HOOK: the lion in its cage (roars on "pinjra")
const S1a: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const r = G(o, hit("L1", "pinjra"));
  return (
    <AbsoluteFill><Night />
      <Studio3D dur={d + 20} from={[2.4, 1.9, 5.6]} to={[1.8, 1.6, 4.6]} look={[0.1, 0.9, 0]} fov={36}>
        <LionCage p={[0, 0, 0]} roar={lerp(f, [r - 4, r + 4], [0, 1])} ry={-0.25} />
        <Torch p={[-1.8, 1.6, -0.8]} seed={2} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 14]} /><meshStandardMaterial color="#3a2a24" roughness={0.4} /></mesh>
      </Studio3D>
      <Hud left="Raja ka darbaar" right="saza #1" clock="00:00" dot={C.red} />
      <Vignette amt={0.6} />
    </AbsoluteFill>
  );
};
// 1b ── or the blind well (camera cranes over it and looks down)
const S1b: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><Night red />
    <Studio3D dur={d} from={[2.8, 3.0, 4.4]} to={[1.3, 4.0, 2.4]} look={[0, 0.6, 0]} lookTo={[0, -0.2, 0]} fov={38}>
      <Well p={[0, 0, 0]} depthGlow={1} />
      <Torch p={[1.6, 1.6, -0.6]} seed={4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 14]} /><meshStandardMaterial color="#2e221d" roughness={0.6} /></mesh>
    </Studio3D>
    <Chip at={G(o, hit("L1", "ek"))} x={110} y={1380} lines={["SIRF EK MILEGA"]} size={56} color={C.red} mono />
    <Hud left="Andha kuan" right="saza #2" clock="00:01" dot={C.red} />
    <Vignette amt={0.6} />
  </AbsoluteFill>
);

// 2 ── you are the prisoner (wide court from behind you)
const S2: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><Night />
    <Studio3D dur={d + 10} from={[0.0, 2.3, 3.6]} to={[0.0, 2.0, 2.4]} look={[0, 1.4, -6]} fov={44}>
      <Court />
    </Studio3D>
    <Pill at={G(o, hit("L2", "qaidi"))} x={400} y={1330} text="TUM" size={80} bg={C.white} />
    <Hud left="Raja ka darbaar" right="qaidi" clock="00:04" />
    <Vignette />
  </AbsoluteFill>
);

// 3 ── the king speaks: one line only
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill><Night />
      <Studio3D dur={d + 10} from={[0.6, 2.9, -5.6]} to={[0.35, 2.85, -6.4]} look={[0, 3.25, -9]} fov={34}>
        <Court king={Math.sin(f / 5) * 0.05} />
      </Studio3D>
      <Pill at={G(o, hit("L3", "ek"))} x={110} y={1330} text="SIRF 1 LINE" size={84} />
      <Hud left="Raja" right="farmaan" clock="00:06" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 4 ── the decree: truth → cage, lie → well
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const a = G(o, hit("L4", "sach")), b = G(o, hit("L5", "Jhooth"));
  const row = (k: number, mark: string, mc: string, word: string, icon: React.ReactNode, label: string, y: number) => (
    <div style={{ position: "absolute", left: 110, right: 110, top: y, height: 190, display: "flex", alignItems: "center", gap: 26, opacity: io(f, k, 6), transform: `translateX(${(1 - io(f, k, 8)) * -40}px)` }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: mc, color: "#0A0D0C", fontSize: 56, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans }}>{mark}</div>
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 64, color: mc, width: 220 }}>{word}</div>
      <div style={{ fontSize: 60, color: C.white }}>→</div>
      <div style={{ transform: `scale(${0.6 + 0.4 * pop(f, k + 6, 10)})` }}>{icon}</div>
    </div>
  );
  return (
    <Ground tone="warm"><Bokeh n={18} seed={8} opacity={0.45} />
      <Cam dur={d} s0={1} s1={1.05}>
        <div style={{ position: "absolute", left: 80, right: 80, top: 600, height: 720, borderRadius: 28, background: "linear-gradient(#f1e3c2,#d9c49a)", boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: "6px solid #8a5a22" }}>
          <div style={{ textAlign: "center", fontFamily: F.mono, fontWeight: 800, fontSize: 44, color: "#5a2a12", marginTop: 28, letterSpacing: 6 }}>RAJ-FARMAAN</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, filter: "none" }}>
          {row(a, "✓", "#2f9e57", "SACH", <CageIcon s={150} c="#3a2418" />, "pinjra", 760)}
          {row(b, "✕", C.red, "JHOOTH", <WellIcon s={150} c="#3a2418" />, "kuan", 1010)}
        </div>
      </Cam>
      <Hud left="Raja ka niyam" right="2 raaste" clock="00:09" />
      <Vignette />
    </Ground>
  );
};

// 5 ── the king never goes back on his word
const S5: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><Night />
    <Studio3D dur={d + 10} from={[-1.4, 3.1, -6.0]} to={[-0.9, 3.0, -6.8]} look={[0, 3.2, -9]} fov={36}>
      <Court />
    </Studio3D>
    <Stamp at={G(o, hit("L6", "nahi"))} x={540} y={1440} text="PAKKA FARMAAN" size={86} rot={-5} />
    <Hud left="Raja ki zubaan" right="no undo" clock="00:13" dot={C.red} />
    <Vignette />
  </AbsoluteFill>
);

// 6 ── truth = death, lie = death
const S6: React.FC<SceneP> = ({ o, d }) => {
  const m1 = G(o, hit("L7", "maut")), j = G(o, hit("L7", "Jhooth"));
  const m2 = G(o, wordAt("L7", 8));
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.06} kick={[m1, m2]}>
        <div style={{ position: "absolute", left: 120, top: 640 }}><CageIcon s={230} /></div>
        <div style={{ position: "absolute", right: 120, top: 640 }}><WellIcon s={230} /></div>
        <Pill at={2} x={100} y={940} text="SACH" size={70} bg="#2f9e57" color="#fff" />
        <Pill at={j} x={600} y={940} text="JHOOTH" size={70} bg={C.red} color="#fff" />
        <Stamp at={m1} x={280} y={1180} text="MAUT" size={96} rot={-8} />
        <Stamp at={m2} x={790} y={1180} text="MAUT" size={96} rot={7} />
      </Cam>
      <Hud left="Dono raaste" right="khatam" clock="00:16" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 7 ── but one line forces the king to free you (prisoner close-up, an idea lights up)
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const c = G(o, hit("L8", "chhodna"));
  return (
    <AbsoluteFill><Night />
      <Studio3D dur={d + 10} from={[0.6, 2.0, -3.2]} to={[0.35, 1.95, -2.5]} look={[0, 1.5, -0.9]} fov={36}>
        <Court prisonerGlow={lerp(f, [G(o, hit("L8", "line")), c], [0, 1])} />
      </Studio3D>
      {f >= c && <Rings at={c} x={540} y={760} color={C.lime} n={3} max={300} />}
      <Chip at={G(o, hit("L8", "line"))} x={110} y={1330} lines={["EK LINE AISI HAI..."]} size={56} mono />
      {f >= c && <Pill at={c} x={110} y={1440} text="AAZAAD!" size={90} />}
      <Hud left="Qaidi" right="dimaag" clock="00:19" />
      <Vignette />
    </AbsoluteFill>
  );
};

// 8 ── only sharp minds get it (a giant question mark ticking)
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Ground><Bokeh n={14} seed={3} hue="lime" opacity={0.25} />
      <Cam dur={d} s0={1} s1={1.08}>
        <div style={{ position: "absolute", top: 560, width: "100%", textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 520, color: C.lime, transform: `scale(${0.85 + 0.15 * pop(f, 2, 9)}) rotate(${Math.sin(f / 8) * 4}deg)`, textShadow: `0 0 60px ${C.lime}88` }}>?</div>
        <Pill at={G(o, hit("L9", "tez"))} x={150} y={1330} text="TEZ DIMAAG TEST" size={76} bg={C.white} />
      </Cam>
      <Hud left="Paheli" right="sochte raho" clock="?" />
      <Vignette />
    </Ground>
  );
};

// 9 ── comment it (phone with an empty comment box + blinking cursor)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Ground><Bokeh n={12} seed={6} hue="lime" opacity={0.2} />
      <Cam dur={d} s0={1} s1={1.05}>
        <Phone y={1120} scale={0.78} rx={[6, 3]} ry={[-10, -4]} dur={d} enter={0}>
          <StatusBar time="21:07" />
          <div style={{ position: "absolute", top: 180, left: 40, right: 40, fontFamily: F.sans, color: C.white }}>
            <div style={{ fontSize: 40, fontWeight: 800 }}>Comments</div>
            {[0, 1, 2].map((i) => <div key={i} style={{ marginTop: 34, display: "flex", gap: 18, alignItems: "center", opacity: 0.35 }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: "#2a302e" }} />
              <div style={{ flex: 1 }}><div style={{ height: 16, width: "60%", background: "#2a302e", borderRadius: 8 }} /><div style={{ height: 16, width: "90%", background: "#2a302e", borderRadius: 8, marginTop: 12 }} /></div>
            </div>)}
          </div>
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 70, height: 96, borderRadius: 48, border: `4px solid ${C.lime}`, display: "flex", alignItems: "center", padding: "0 30px", fontFamily: F.sans, fontSize: 32, color: C.grey }}>
            Wo line hai: <span style={{ color: C.lime, marginLeft: 8, opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>|</span>
          </div>
        </Phone>
        <Pill at={G(o, hit("L10", "Comment"))} x={110} y={560} text="COMMENT KARO" size={76} />
      </Cam>
      <Hud left="Tumhari baari" right="comment" clock="00:27" />
      <Vignette />
    </Ground>
  );
};

// 10a ── answer in Part 2
const S10a: React.FC<SceneP> = ({ d }) => (
  <Ground tone="warm"><Bokeh n={16} seed={9} opacity={0.4} />
    <Cam dur={d} s0={1.02} s1={1.08}>
      <Chip at={0} x={110} y={760} lines={["JAWAB"]} size={60} mono color={C.grey} />
      <Pill at={2} x={110} y={880} text="PART 2 MEIN" size={120} />
    </Cam>
    <Hud left="Agla part" right="jald" clock="P2" />
    <Vignette />
  </Ground>
);
// 10b ── end card
const S10b: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "Follow")) + 4} logo="3D" />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1a), P(hit("L1", "ya"), S1b), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L6"), S5),
  P(at("L7"), S6), P(at("L8"), S7), P(at("L9"), S8), P(at("L10"), S9), P(at("L11"), S10a), P(hit("L11", "Follow"), S10b),
];
export const IMPACTS = [hit("L1", "pinjra"), hit("L7", "maut"), wordAt("L7", 8)];
export const POPS = [hit("L1", "ek"), hit("L2", "qaidi"), hit("L3", "ek"), hit("L4", "sach"), hit("L5", "Jhooth"), hit("L6", "nahi"), hit("L8", "chhodna"), hit("L9", "tez"), hit("L10", "Comment"), hit("L11", "part"), hit("L11", "Follow")];
export const RISERS = [at("L8"), at("L11")];
export const DURATION = TOTAL;
