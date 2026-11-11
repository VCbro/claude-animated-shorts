// ─────────────────────────────────────────────────────────────────────────────
//  Pankhe mein 3 hi blade kyun?  –  Realistic 3D outside, X-Ray 3D inside (see SKILL "Outside / inside 3D").
//  Outside / hook / answer shots: look="real" + <Room/>.   "Andar kya ho raha hai" shots: look="xray" on the dark ground.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "./kit/theme";
import { lerp } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Stamp } from "./kit/Marks";
import { EndCard } from "./kit/EndCard";
import { Air, Fan, RealRoom, REAL_ROOMS, Stage, XR, HUB_Y } from "./three/Fan";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id); // creator: no subtitles
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const TAU = Math.PI * 2;
/** Rotor angle after f frames at `rps` turns per second, and the angle swept per frame (for motion blur). */
const spin = (f: number, rps: number) => ({ angle: (f / 30) * rps * TAU, blur: (rps * TAU) / 30 });
const INKBG = "rgba(23,18,31,.94)";
const Real: React.FC<{ tone?: keyof typeof REAL_ROOMS; children: React.ReactNode }> = ({ tone = "day", children }) => (
  <AbsoluteFill style={{ background: REAL_ROOMS[tone].wall }}>{children}<Vignette amt={0.3} /></AbsoluteFill>
);
const Xray: React.FC<{ children: React.ReactNode; grid?: boolean }> = ({ children, grid = true }) => (
  <Ground><AbsoluteFill style={{ background: `radial-gradient(110% 70% at 50% 40%, #0B2038 0%, ${XR.bg} 72%)` }} />{grid && <GridFloor y={1320} color={XR.cyan} opacity={0.14} />}{children}<Vignette /></Ground>
);

// 1 ── HOOK: the fan everyone has (real room, push in from below)
const S1: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Real>
    <Stage dur={d} look="real" from={[2.6, -5.4, 7.6]} to={[1.9, -4.6, 6.2]} lookAt={[0, -1.7, 0]}>
      <RealRoom /><Fan look="real" blades={3} {...spin(f, 0.55)} /><Air look="real" air={0.35} />
    </Stage>
    <Pill at={G(o, hit("L1", "teen"))} x={90} y={1270} text="3 HI BLADE" size={120} />
    <Chip at={G(o, hit("L1", "kyun"))} x={90} y={1440} lines={["KYUN?"]} size={96} color={C.white} bg={INKBG} />
  </Real>;
};

// 2 ── why not 4 or 5? (blades are added on the words)
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const c4 = G(o, hit("L2", "Chaar")), c5 = G(o, hit("L2", "paanch"));
  const n = f < c4 ? 3 : f < c5 ? 4 : 5;
  return <Real>
    <Stage dur={d} look="real" from={[0.9, -5.6, 4.4]} to={[0.5, -5.2, 3.8]} lookAt={[0, -1.1, 0]} fov={50}>
      <RealRoom /><Fan look="real" blades={n} {...spin(f, 0.3)} blur={0} />
    </Stage>
    <Pill at={c4} x={110} y={1290} text="4 ?" size={150} bg={C.white} />
    <Pill at={c5} x={470} y={1290} text="5 ?" size={150} />
  </Real>;
};

// 3 ── more blades = more air?  NO.
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const no = G(o, hit("L3", "Nahi"));
  return <Real tone="warm">
    <Stage dur={d} look="real" tone="warm" from={[2.3, -5.0, 6.9]} to={[2.0, -4.7, 6.4]} lookAt={[0, -1.7, 0]}>
      <RealRoom tone="warm" /><Fan look="real" blades={5} {...spin(f, 0.8)} /><Air look="real" air={f < no ? 0.95 : 0.2} />
    </Stage>
    <Chip at={2} x={80} y={1270} lines={["ZYADA BLADE =", "ZYADA HAWA?"]} size={78} color={C.lime} bg={INKBG} />
    <Stamp at={no} x={540} y={960} text="NAHI." size={170} rot={-7} />
  </Real>;
};

// 4 ── the real game is inside: the fan turns into an x-ray, camera dives to the hub
const S4: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  return <Xray>
    <Stage dur={d} look="xray" from={[2.0, -4.7, 6.4]} to={[1.3, -3.2, 3.6]} lookAt={[0, -1.7, 0]} lookTo={[0, HUB_Y, 0]}>
      <Fan look="xray" blades={3} {...spin(f, 0.5)} coilPhase={f * 0.25} power={0.5} />
    </Stage>
    <Chip at={4} x={80} y={1300} lines={["ASLI KHEL", "ANDAR HAI"]} size={96} color={XR.glow} />
    <Hud left="Pankhe ke andar" right="x-ray" clock="3D" dot={XR.cyan} />
  </Xray>;
};

// 5 ── the motor: copper coils → magnetic pull → the whole fan turns
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const coil = G(o, hit("L4", "coil")), bij = G(o, hit("L4", "bijli")), mag = G(o, hit("L4", "chumbak")), go = G(o, hit("L4", "ghumaati"));
  const power = lerp(f, [bij, bij + 12], [0.08, 1]);
  const t = Math.max(0, f - mag) / 30;
  const angle = TAU * 0.35 * t * Math.min(1, t / 1.2); // rotor eases up to speed once the field pulls
  return <Xray grid={false}>
    <Stage dur={d} look="xray" from={[1.0, -2.5, 2.2]} to={[0.5, -2.9, 1.5]} lookAt={[0, HUB_Y + 0.05, 0]} fov={44}>
      <Fan look="xray" blades={3} angle={angle} coilPhase={Math.max(0, f - bij) * 0.3} power={power} />
    </Stage>
    <Chip at={G(o, hit("L4", "motor"))} x={80} y={420} lines={["MOTOR"]} size={110} color={XR.glow} />
    <Chip at={coil} x={80} y={1250} lines={["TAAMBE KI COIL"]} size={66} color={XR.copper} />
    <Chip at={mag} x={80} y={1350} lines={["+ CHUMBAK KI TAAQAT"]} size={66} color={XR.glow} />
    <Pill at={go} x={80} y={1470} text="= PANKHA GHOOMA" size={70} bg={XR.cyan} />
    <Hud left="Motor" right="x-ray" clock="01" dot={XR.cyan} />
  </Xray>;
};

// 6 ── every blade pushes air down … but every blade also loads the motor
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const lek = G(o, hit("L5", "Lekin")), bojh = G(o, hit("L5", "bojh"));
  const heat = lerp(f, [lek, bojh + 10], [0, 0.6]);
  return <Xray>
    <Stage dur={d} look="xray" from={[2.4, -4.2, 7.2]} to={[2.0, -3.8, 6.6]} lookAt={[0, -1.9, 0]}>
      <Fan look="xray" blades={3} {...spin(f, 1.3)} coilPhase={f * 0.5} heat={heat} /><Air look="xray" air={0.75} />
    </Stage>
    <Chip at={G(o, hit("L5", "neeche"))} x={80} y={1290} lines={["BLADE = HAWA NEECHE"]} size={66} color={XR.glow} />
    <Chip at={bojh} x={80} y={1400} lines={["BLADE = MOTOR PAR BOJH"]} size={66} color={C.red} />
    <Hud left="Har blade" right="x-ray" clock="02" dot={XR.cyan} />
  </Xray>;
};

// 7 ── 5 blades: motor tires, fan slows
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const thak = G(o, hit("L6", "thak")), slow = G(o, hit("L6", "dheema"));
  const rps = lerp(f, [thak, slow + 20], [1.3, 0.3]);
  const angle = Array.from({ length: f }).reduce((a: number, _, i) => a + (lerp(i, [thak, slow + 20], [1.3, 0.3]) * TAU) / 30, 0);
  return <Xray>
    <Stage dur={d} look="xray" from={[2.2, -4.4, 6.8]} to={[1.6, -3.8, 5.6]} lookAt={[0, -1.6, 0]}>
      <Fan look="xray" blades={5} angle={angle} blur={(rps * TAU) / 30} coilPhase={f * 0.5} heat={lerp(f, [0, slow], [0.35, 1])} /><Air look="xray" air={lerp(f, [thak, slow + 20], [0.6, 0.2])} />
    </Stage>
    <Pill at={2} x={80} y={1270} text="5 BLADE" size={110} bg={C.white} />
    <Chip at={thak} x={80} y={1420} lines={["MOTOR THAKI"]} size={70} color={C.red} />
    <Stamp at={slow} x={700} y={1130} text="DHEEMA" size={96} rot={6} />
    <Hud left="5 blade test" right="x-ray" clock="03" dot={C.red} />
  </Xray>;
};

// 8 ── 2 blades: fast, but little air
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Xray>
    <Stage dur={d} look="xray" from={[2.2, -4.4, 6.8]} to={[1.8, -4.0, 6.0]} lookAt={[0, -1.7, 0]}>
      <Fan look="xray" blades={2} {...spin(f, 3.1)} coilPhase={f * 0.9} /><Air look="xray" air={0.12} />
    </Stage>
    <Pill at={2} x={80} y={1270} text="2 BLADE" size={110} bg={C.white} />
    <Chip at={G(o, hit("L7", "tez"))} x={80} y={1420} lines={["TEZ GHOOMA"]} size={70} color={XR.glow} />
    <Chip at={G(o, hit("L7", "kam"))} x={560} y={1420} lines={["HAWA KAM"]} size={70} color={C.red} />
    <Hud left="2 blade test" right="x-ray" clock="04" dot={XR.cyan} />
  </Xray>;
};

// 9 ── 3 blades: the balance (back outside, bright)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Real>
    <Stage dur={d} look="real" from={[2.5, -5.2, 7.4]} to={[2.0, -4.7, 6.5]} lookAt={[0, -1.9, 0]}>
      <RealRoom /><Fan look="real" blades={3} {...spin(f, 2.1)} /><Air look="real" air={0.9} />
    </Stage>
    <Chip at={G(o, hit("L8", "santulan"))} x={80} y={250} lines={["3 BLADE =", "SAHI SANTULAN"]} size={84} color={C.lime} bg={INKBG} />
    <Pill at={G(o, hit("L8", "raftaar"))} x={80} y={1230} text="TEZ RAFTAAR" size={72} />
    <Pill at={G(o, hit("L8", "bharpoor"))} x={80} y={1340} text="BHARPOOR HAWA" size={72} bg={C.white} />
    <Pill at={G(o, hit("L8", "kharch"))} x={80} y={1450} text="KAM KHARCH" size={72} />
  </Real>;
};

// 10 ── cold countries: 4-5 blades, gentle air
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Real tone="cold">
    <Stage dur={d} look="real" tone="cold" from={[2.4, -5.0, 7.0]} to={[2.0, -4.7, 6.4]} lookAt={[0, -1.8, 0]}>
      <RealRoom tone="cold" /><Fan look="real" blades={5} {...spin(f, 0.45)} bladeColor="#3A2C22" /><Air look="real" air={0.15} />
    </Stage>
    <Chip at={2} x={80} y={1270} lines={["THANDE DESH"]} size={84} color="#BFE0FF" bg={INKBG} />
    <Pill at={G(o, hit("L9", "chaar"))} x={80} y={1390} text="4-5 BLADE" size={78} bg={C.white} />
    <Chip at={G(o, hit("L9", "halki"))} x={520} y={1400} lines={["HALKI HAWA"]} size={62} color={C.white} bg={INKBG} />
  </Real>;
};

// 11 ── India's heat: fast air → 3 blades
const S11: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const tez = G(o, hit("L10", "Tez"));
  return <Real tone="warm">
    <Stage dur={d} look="real" tone="warm" from={[2.3, -5.0, 6.9]} to={[1.7, -4.4, 5.8]} lookAt={[0, -1.8, 0]}>
      <RealRoom tone="warm" /><Fan look="real" blades={3} {...spin(f, f < tez ? 0.6 : 2.4)} /><Air look="real" air={f < tez ? 0.2 : 1} at={0} />
    </Stage>
    <Chip at={2} x={80} y={1250} lines={["BHARAT KI GARMI"]} size={70} color="#FFD23F" bg={INKBG} />
    <Pill at={tez} x={80} y={1350} text="TEZ HAWA" size={90} bg={C.white} />
    <Pill at={G(o, hit("L10", "Isliye"))} x={80} y={1480} text="ISLIYE 3 BLADE" size={92} />
  </Real>;
};

// 12 ── CTA
const S12: React.FC<SceneP> = ({ o }) => (
  <Ground>
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "subscribe")) + 4} logo="3D" />
    <Chip at={G(o, hit("L11", "batao"))} x={110} y={1560} lines={["TUMHARE PANKHE MEIN", "KITNE BLADE?"]} size={56} />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(hit("L3", "Asli"), S4), P(at("L4"), S5), P(at("L5"), S6),
  P(at("L6"), S7), P(at("L7"), S8), P(at("L8"), S9), P(at("L9"), S10), P(at("L10"), S11), P(at("L11"), S12),
];
export const IMPACTS = [hit("L3", "Nahi"), hit("L6", "dheema")];
export const POPS = [hit("L1", "teen"), hit("L2", "Chaar"), hit("L2", "paanch"), hit("L4", "motor"), hit("L4", "coil"), hit("L4", "chumbak"), hit("L4", "ghumaati"),
  hit("L5", "neeche"), hit("L5", "bojh"), hit("L7", "kam"), hit("L8", "raftaar"), hit("L8", "bharpoor"), hit("L8", "kharch"), hit("L9", "halki"), hit("L10", "Tez"), hit("L10", "Isliye"), hit("L11", "subscribe") + 4];
export const RISERS = [hit("L3", "Asli"), at("L8")];
export const DURATION = TOTAL;
