// ─────────────────────────────────────────────────────────────────────────────
//  Charger garam kyun hota hai?  –  Realistic 3D outside (wall socket), realistic parts under a glass shell inside.
//  The inside is a real flyback charger layout (see src/three/Charger.tsx); the current runs top → bottom.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Stamp } from "./kit/Marks";
import { EndCard } from "./kit/EndCard";
import { CH, Charger, CStage, U, WallSetup } from "./three/Charger";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id); // creator: no subtitles
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const INKBG = "rgba(23,18,31,.94)";
type V3 = [number, number, number];

const Wall: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: "#C9BEA6" }}>{children}<Vignette amt={0.32} /></AbsoluteFill>;
const Inside: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Ground><AbsoluteFill style={{ background: "radial-gradient(110% 70% at 50% 45%, #14222E 0%, #070B10 75%)" }} />{children}<Vignette /></Ground>
);
// whole-board camera
const WIDE = { from: [1.3, 0.3, 6.3] as V3, to: [0.9, 0.15, 5.7] as V3, lookAt: [0, 0.12, 0] as V3 };

/** Rising heat squiggles (2D overlay) above a hot object. */
const HeatWaves: React.FC<{ x: number; y: number; k: number; n?: number; w?: number }> = ({ x, y, k, n = 4, w = 300 }) => {
  const f = useCurrentFrame();
  if (k <= 0.02) return null;
  return <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, k) }}>
    {Array.from({ length: n }).map((_, i) => {
      const p = ((f / 34) + i / n) % 1, x0 = x - w / 2 + (i + 0.5) * (w / n), y0 = y - p * 260;
      const d = `M ${x0} ${y0} q 26 -30 0 -60 q -26 -30 0 -60 q 26 -30 0 -60`;
      return <path key={i} d={d} fill="none" stroke={CH.hot} strokeWidth={12} strokeLinecap="round" opacity={Math.sin(Math.PI * p) * 0.85} />;
    })}
  </svg>;
};

/** Small scope card: what the electricity looks like at this stage. */
const Wave: React.FC<{ at: number; x: number; y: number; kind: "ac" | "bumps" | "dc" | "pwm" | "low"; label: string; color?: string }> = ({ at: a, x, y, kind, label, color = CH.hv }) => {
  const f = useCurrentFrame();
  const w = 400, h = 190, mid = 110, amp = 52, ph = f * 0.28;
  let d = "";
  for (let i = 0; i <= 90; i++) {
    const t = (i / 90) * Math.PI * 5 + ph, px = 20 + (i / 90) * (w - 40);
    const v = kind === "ac" ? Math.sin(t) : kind === "bumps" ? Math.abs(Math.sin(t)) * 1.6 - 0.8 : kind === "dc" ? 0.85 + Math.sin(t * 2) * 0.04 : kind === "pwm" ? (Math.sin(t * 2.2) > 0 ? 0.9 : -0.9) : -0.55;
    d += `${i ? "L" : "M"} ${px.toFixed(1)} ${(mid - v * amp).toFixed(1)} `;
  }
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 22, background: "rgba(8,12,16,.92)", border: `3px solid ${color}`, transform: `scale(${pop(f, a)})`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", left: 20, top: 10, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 2, color }}>{label}</div>
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}><path d={`M 20 ${mid} H ${w - 20}`} stroke="#2A332F" strokeWidth={2} /><path d={d} fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }} /></svg>
  </div>;
};
const Arrow: React.FC<{ at: number; x: number; y: number }> = ({ at: a, x, y }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: x, top: y, fontFamily: F.sans, fontWeight: 900, fontSize: 90, color: C.white, opacity: io(f, a, 6) }}>→</div>;
};

// 1 ── HOOK: the charger on the wall gets hot
const S1: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const k = lerp(f, [4, G(o, hit("L1", "garam")) + 8], [0.05, 0.85]);
  return <Wall>
    <CStage dur={d} mode="wall" from={[2.9, 0.7, 6.4]} to={[2.3, 0.5, 5.4]} lookAt={[0.2, -0.35, 0.8]} fov={38}><WallSetup shellHeat={k} /></CStage>
    <HeatWaves x={470} y={640} k={k} />
    <Pill at={G(o, hit("L1", "garam"))} x={90} y={1270} text="CHARGER GARAM" size={104} bg={C.red} color={C.white} />
    <Chip at={G(o, hit("L1", "kyun"))} x={90} y={1430} lines={["KYUN?"]} size={100} color={C.white} bg={INKBG} />
  </Wall>;
};

// 2 ── is it going bad?  No.
const S2: React.FC<SceneP> = ({ o, d }) => (
  <Wall>
    <CStage dur={d} mode="wall" from={[-3.0, 1.0, 6.0]} to={[-2.6, 0.8, 5.4]} lookAt={[0.1, -0.3, 0.8]} fov={38}><WallSetup shellHeat={0.6} /></CStage>
    <HeatWaves x={600} y={640} k={0.7} />
    <Chip at={2} x={80} y={1280} lines={["KHARAAB HO", "RAHA HAI?"]} size={86} color={C.lime} bg={INKBG} />
    <Stamp at={G(o, hit("L2", "Nahi"))} x={600} y={1010} text="NAHI." size={170} rot={-7} />
  </Wall>
);

// 3 ── the answer is inside: the shell turns to glass
const S3: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  return <Inside>
    <CStage dur={d} mode="studio" from={[2.2, 0.6, 7.2]} to={WIDE.from} lookAt={WIDE.lookAt}><Charger open={lerp(f, [3, 22], [0, 1])} /></CStage>
    <Chip at={6} x={80} y={1420} lines={["JAWAB ANDAR HAI"]} size={84} color={CH.cyan} />
    <Hud left="Charger ke andar" right="3D" clock="00" dot={CH.cyan} />
  </Inside>;
};

// 4 ── 230 V comes in, the phone needs 5 V
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const v5 = G(o, hit("L3", "paanch"));
  return <Inside>
    <CStage dur={d} mode="studio" {...WIDE}><Charger open={1} flow={0.45} upto={lerp(f, [G(o, hit("L3", "tees")), v5], [0.05, 1])} /></CStage>
    <Pill at={G(o, hit("L3", "tees"))} x={640} y={250} text="230V" size={120} bg={CH.hv} color={C.white} />
    <Chip at={G(o, hit("L3", "tees")) + 4} x={640} y={400} lines={["DEEWAR SE"]} size={44} mono color={C.white} />
    <Pill at={v5} x={110} y={1360} text="5V" size={150} />
    <Chip at={v5 + 4} x={400} y={1410} lines={["PHONE KO CHAHIYE"]} size={42} mono color={C.white} />
    <Hud left="Bijli ka safar" right="230V → 5V" clock="01" dot={CH.hv} />
  </Inside>;
};

// 5 ── rectifier makes it one-way, the big capacitor stores it
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const sd = G(o, hit("L4", "seedha")), cp = G(o, hit("L4", "capacitor"));
  return <Inside>
    <CStage dur={d} mode="studio" from={[0.9, 0.75, 3.0]} to={[0.55, 0.6, 2.55]} lookAt={[0, 0.34, -0.1]} fov={36}>
      <Charger open={1} flow={0.6} upto={lerp(f, [0, cp], [U.bridge, U.cap + 0.04])} charge={lerp(f, [cp, cp + 24], [0, 1])} />
    </CStage>
    <Wave at={2} x={80} y={250} kind="ac" label="DEEWAR: AC" />
    <Wave at={sd} x={600} y={250} kind="bumps" label="SEEDHI: DC" color={CH.cyan} />
    <Chip at={sd} x={80} y={1280} lines={["BRIDGE = BIJLI SEEDHI"]} size={62} color={CH.cyan} />
    <Chip at={cp} x={80} y={1390} lines={["BADA CAPACITOR = BIJLI JAMA"]} size={56} color={C.white} />
    <Hud left="Step 1" right="rectifier + capacitor" clock="02" dot={CH.cyan} />
  </Inside>;
};

// 6 ── the switch chops it thousands of times a second
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const sw = G(o, hit("L5", "switch")), hz = G(o, hit("L5", "hazaaron"));
  return <Inside>
    <CStage dur={d} mode="studio" from={[1.3, 0.35, 2.7]} to={[1.0, 0.2, 2.3]} lookAt={[0.24, 0.06, -0.1]} fov={36}>
      <Charger open={1} flow={0.7} upto={U.fet + 0.05} charge={0.8} sw={f >= sw ? (Math.floor(f / 2) % 2 ? 1 : 0.15) : 0} />
    </CStage>
    <Chip at={sw} x={80} y={250} lines={["CHHOTA SWITCH"]} size={84} color={C.lime} />
    <Wave at={hz - 6} x={600} y={390} kind="pwm" label="CHAALU / BAND" color={C.lime} />
    <Pill at={hz} x={80} y={1300} text="1 SECOND MEIN" size={64} bg={C.white} />
    <Pill at={hz + 5} x={80} y={1410} text="HAZAARON BAAR" size={92} />
    <Hud left="Step 2" right="switch (MOSFET)" clock="03" dot={C.lime} />
  </Inside>;
};

// 7 ── the yellow transformer steps it down to 5 V
const S7: React.FC<SceneP> = ({ o, d }) => {
  const tr = G(o, hit("L6", "transformer")), v5 = G(o, hit("L6", "paanch"));
  return <Inside>
    <CStage dur={d} mode="studio" from={[-1.4, -0.05, 3.0]} to={[-1.0, -0.15, 2.5]} lookAt={[-0.05, -0.24, 0]} fov={36}><Charger open={1} flow={0.7} upto={1} charge={0.8} sw={0.5} /></CStage>
    <Chip at={tr} x={80} y={250} lines={["PEELA", "TRANSFORMER"]} size={84} color="#F0BF2C" />
    <Pill at={tr + 6} x={80} y={1340} text="230V" size={100} bg={CH.hv} color={C.white} />
    <Arrow at={v5 - 4} x={440} y={1330} />
    <Pill at={v5} x={580} y={1340} text="5V" size={100} />
    <Hud left="Step 3" right="transformer" clock="04" dot="#F0BF2C" />
  </Inside>;
};

// 8 ── a little electricity is lost here → that loss is the heat
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const b = G(o, hit("L7", "barbaad")), g = G(o, hit("L7", "garmi"));
  const heat = lerp(f, [b, g + 12], [0, 0.85]);
  return <Inside>
    <CStage dur={d} mode="studio" from={WIDE.to} to={[0.6, 0.05, 5.0]} lookAt={WIDE.lookAt}><Charger open={1} flow={0.55} charge={0.6} sw={0.4} heat={heat} /></CStage>
    <HeatWaves x={560} y={520} k={lerp(f, [g, g + 10], [0, 1])} w={420} />
    <Chip at={b} x={80} y={1290} lines={["THODI BIJLI BARBAAD"]} size={70} color={C.red} />
    <Pill at={g} x={80} y={1410} text="= GARMI" size={112} bg={C.red} color={C.white} />
    <Hud left="Garmi ka raaz" right="loss = heat" clock="05" dot={C.red} />
  </Inside>;
};

// 9 ── fast charging: more power, more heat
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const g = G(o, hit("L8", "garmi"));
  return <Inside>
    <CStage dur={d} mode="studio" from={[-1.0, 0.2, 5.6]} to={[-0.7, 0.1, 5.0]} lookAt={WIDE.lookAt}><Charger open={1} flow={1} charge={1} sw={Math.floor(f / 2) % 2} heat={lerp(f, [0, g + 10], [0.5, 1])} /></CStage>
    <HeatWaves x={540} y={500} k={lerp(f, [g - 6, g + 6], [0.3, 1])} w={460} n={5} />
    <Pill at={2} x={80} y={250} text="FAST CHARGING" size={104} />
    <Chip at={G(o, hit("L8", "taaqat"))} x={80} y={1300} lines={["ZYADA TAAQAT"]} size={76} color={C.lime} />
    <Chip at={g} x={80} y={1410} lines={["= ZYADA GARMI"]} size={84} color={C.red} />
    <Hud left="Fast charging" right="zyada power" clock="06" dot={C.red} />
  </Inside>;
};

// 10 ── warm is normal; too hot to touch → unplug
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const par = G(o, hit("L9", "Par")), nik = G(o, hit("L9", "nikaal"));
  const k = f < par ? 0.3 : lerp(f, [par, nik], [0.3, 1.1]);
  return <Wall>
    <CStage dur={d} mode="wall" from={[2.6, 0.6, 5.8]} to={[2.2, 0.5, 5.2]} lookAt={[0.2, -0.35, 0.8]} fov={38}><WallSetup shellHeat={k} /></CStage>
    <HeatWaves x={470} y={640} k={k} n={f < par ? 2 : 5} />
    {f < par ? <Pill at={G(o, hit("L9", "normal")) - 6} x={80} y={1320} text="HALKA GARAM = NORMAL" size={66} />
      : <><Chip at={par} x={80} y={1230} lines={["HAATH NA RAKH PAO?"]} size={70} color={C.white} bg={INKBG} /><Stamp at={nik} x={540} y={1460} text="NIKAAL DO" size={120} rot={-5} /></>}
  </Wall>;
};

// 11 ── genuine vs fake: the fake has fewer safety parts
const S11: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const nq = G(o, hit("L10", "naqli")), kam = G(o, hit("L10", "kam"));
  return <Inside>
    <CStage dur={d} mode="studio" from={[0.5, 0.2, 7.6]} to={[0.2, 0.1, 7.0]} lookAt={[0, 0.15, 0]}>
      <Charger open={1} flow={0.4} charge={0.5} position={[-0.62, 0, 0]} scale={0.82} />
      <Charger open={1} cheap flow={0.4} heat={lerp(f, [nq, kam], [0.15, 0.75])} position={[0.62, 0, 0]} scale={0.82} />
    </CStage>
    <Pill at={2} x={120} y={300} text="ASLI" size={88} />
    <Pill at={nq} x={640} y={300} text="NAQLI" size={88} bg={C.red} color={C.white} />
    <Chip at={kam - 8} x={80} y={1270} lines={["SURAKSHA KE PURZE"]} size={66} color={C.white} />
    <Stamp at={kam} x={540} y={1450} text="KAM" size={120} rot={-4} />
    <Hud left="Asli vs naqli" right="andar ka fark" clock="07" dot={C.red} />
  </Inside>;
};

// 12 ── CTA
const S12: React.FC<SceneP> = ({ o }) => (
  <Ground>
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "subscribe")) + 4} logo="3D" />
    <Chip at={G(o, hit("L11", "batao"))} x={110} y={1560} lines={["TUMHARA CHARGER", "KITNA GARAM HOTA HAI?"]} size={54} />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(hit("L2", "Jawab"), S3), P(at("L3"), S4), P(at("L4"), S5), P(at("L5"), S6),
  P(at("L6"), S7), P(at("L7"), S8), P(at("L8"), S9), P(at("L9"), S10), P(at("L10"), S11), P(at("L11"), S12),
];
export const IMPACTS = [hit("L2", "Nahi"), hit("L9", "nikaal"), hit("L10", "kam")];
export const POPS = [hit("L1", "garam"), hit("L1", "kyun"), hit("L3", "tees"), hit("L3", "paanch"), hit("L4", "seedha"), hit("L4", "capacitor"), hit("L5", "switch"), hit("L5", "hazaaron"),
  hit("L6", "transformer"), hit("L6", "paanch"), hit("L7", "barbaad"), hit("L7", "garmi"), hit("L8", "taaqat"), hit("L8", "garmi"), hit("L9", "normal"), hit("L10", "naqli"), hit("L11", "subscribe") + 4];
export const RISERS = [hit("L2", "Jawab"), hit("L7", "garmi")];
export const DURATION = TOTAL;
