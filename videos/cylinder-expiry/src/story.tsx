// ─────────────────────────────────────────────────────────────────────────────
//  Tumhara cylinder expire to nahi?  –  reach rules v2: stake in frame 1, bright open, ~30 s, ends on "abhi check karo".
//  Fact: the A/B/C/D + year code inside a collar stay is the cylinder's TEST DUE date (not a gas expiry).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { CINE, CineGrade, CineHandle, CineLabel, CineTitle, DotWall } from "./kit/Cine";
import { BlindsLight, CineStage } from "./three/CineStage";
import { GasCylinder, Kitchen, STAY0 } from "./three/Cylinder";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id);
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";
type SceneP = { o: number; d: number };
type V3 = [number, number, number];
const G = (o: number, g: number) => g - o;
const H_ = CHANNEL.handle;
const OK = "#7CF29A";
const Black: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#04080A" }) => <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>;
const DayKitchen = () => <><hemisphereLight args={["#FFF1DC", "#6A5236", 1.1]} /><BlindsLight position={[-8, 7, 9]} color="#FFE6C0" intensity={2.4} /><pointLight position={[1.0, 4.6, 3]} color="#FFD9A0" intensity={30} distance={14} /></>;
const HeroLights: React.FC<{ rim?: string }> = ({ rim = "#49D6D0" }) => <><hemisphereLight args={["#CFE4E0", "#2A2018", 0.8]} /><directionalLight position={[3, 4, 5]} color="#FFE8C8" intensity={3} /><directionalLight position={[-4, 2, -3]} color={rim} intensity={2.2} /></>;
// camera that looks across the collar at the inside of the code stay
const cs = Math.cos(STAY0), sn = Math.sin(STAY0);
const CODE_AT: V3 = [cs * 0.33, 1.77, sn * 0.33];
const PHI = STAY0 + Math.PI + 0.75; // off to one side so the valve does not hide the code
const camAt = (r: number, y: number): V3 => [Math.cos(PHI) * r, y, Math.sin(PHI) * r];

/** Big painted-stencil code for 2D explanation shots. */
const Code: React.FC<{ text: string; x: number; y: number; size?: number; color?: string; at?: number }> = ({ text, x, y, size = 300, color = CINE.paper, at: a = 0 }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${pop(f, a)})`, fontFamily: "Anton, Impact, sans-serif", fontSize: size, letterSpacing: 6, color, textShadow: "0 8px 40px rgba(0,0,0,.8)", whiteSpace: "nowrap" }}>{text}</div>;
};
const Row: React.FC<{ at: number; y: number; k: string; v: string; hot?: boolean }> = ({ at: a, y, k, v, hot }) => {
  const f = useCurrentFrame(), t = io(f, a, 7);
  return <div style={{ position: "absolute", left: 80, right: 80, top: y, height: 190, display: "flex", alignItems: "center", gap: 36, opacity: t, transform: `translateX(${(1 - t) * -60}px)`, background: "rgba(6,10,10,.82)", borderLeft: `14px solid ${hot ? CINE.red : "#3A4A48"}` }}>
    <div style={{ width: 190, textAlign: "center", fontFamily: "Anton, Impact, sans-serif", fontSize: 160, color: hot ? CINE.red : CINE.paper, lineHeight: 1 }}>{k}</div>
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 62, letterSpacing: 3, color: CINE.paper }}>{v}</div>
  </div>;
};
const Badge: React.FC<{ at: number; x: number; y: number; text: string; color: string }> = ({ at: a, x, y, text, color }) => {
  const f = useCurrentFrame();
  return f < a ? null : <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(-5deg) scale(${lerp(f, [a, a + 5], [2, 1])})`, background: color, color: "#0A0D0C", fontFamily: "Anton, Impact, sans-serif", fontSize: 76, letterSpacing: 2, padding: "6px 30px", whiteSpace: "nowrap", boxShadow: "0 16px 50px rgba(0,0,0,.6)" }}>{text}</div>;
};

// 1 ── HOOK (bright kitchen, fast move to the cylinder top): the stake first
const S1: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const q = G(o, hit("L1", "Tumhare"));
  return <Black bg="#3A2A18">
    <CineStage dur={Math.min(d, 26)} from={[-1.4, 2.6, 11]} to={[-0.9, 2.9, 3.6]} lookAt={[0.2, 1.6, 0]} lookTo={[-0.55, 1.75, 0.2]} fov={38} exposure={1.5} env={0.5} fog={["#3A2A18", 14, 40]}>
      <DayKitchen /><Kitchen wall="#C9A56A"><GasCylinder position={[-0.6, 0, 0.2]} regulator code="A-26" glow={0.15 + Math.sin(f / 4) * 0.1} /></Kitchen>
    </CineStage>
    <CineGrade tone="amber" vignette={0.6} grain={0.1} /><CineHandle text={H_} />
    {f < q ? <CineTitle at={0} lines={["Ruko!"]} color={CINE.red} size={260} y={170} underline={-1} /> : <CineTitle key="q" at={q} lines={["Cylinder ki", "taareekh nikal gayi?"]} size={96} />}
    <CineLabel at={q + 6} text="Abhi 10 second me check karo" red />
  </Black>;
};
// 2 ── where the code is: inside one of the three stays
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const c = G(o, hit("L2", "code")), j = G(o, hit("L2", "Jaise"));
  return <Black bg="#0B1414">
    <CineStage dur={d} from={[-cs * 2.6 + 0.9, 3.3, -sn * 2.6 + 1.6]} to={camAt(0.85, 2.7)} lookAt={[0, 1.8, 0]} lookTo={CODE_AT} fov={34} exposure={1.25} env={0.5} fog={["#0B1414", 4, 14]} shadows={false}>
      <HeroLights /><pointLight position={[0, 2.5, 0]} color="#FFE8C8" intensity={2.5} distance={3} />
      <GasCylinder code="A-26" mark={f >= c ? 0.55 + Math.sin(f / 4) * 0.4 : 0} />
    </CineStage>
    <CineGrade vignette={0.7} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Upar ki 3 pattiyan", "ek ke andar code"]} size={88} /><CineLabel at={j} text="Jaise: A-26" red />
  </Black>;
};
// 3 ── A B C D = the four quarters
const S3: React.FC<SceneP> = ({ o }) => (
  <Black><DotWall color="#7A2A20" bg="#120605" />
    <CineGrade tone="red" vignette={0.7} /><CineHandle text={H_} />
    <CineTitle at={0} lines={["Akshar = mahina"]} size={104} y={200} />
    <Row at={G(o, hit("L3", "A"))} y={480} k="A" v="JAN – MARCH" hot />
    <Row at={G(o, hit("L3", "B,"))} y={700} k="B" v="APRIL – JUNE" />
    <Row at={G(o, hit("L3", "C,"))} y={920} k="C" v="JULY – SEPT" />
    <Row at={G(o, hit("L3", "D,"))} y={1140} k="D" v="OCT – DEC" />
  </Black>
);
// 4 ── the number is the year: A-26 = till March 2026
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const y = G(o, hit("L4", "Yaani")), m = G(o, hit("L4", "March"));
  return <Black bg="#0B1414">
    <CineStage dur={d} from={camAt(0.85, 2.7)} to={camAt(0.72, 2.55)} lookAt={CODE_AT} fov={34} exposure={1.25} env={0.5} shadows={false}>
      <HeroLights /><pointLight position={[0, 2.5, 0]} color="#FFE8C8" intensity={2.5} distance={3} /><GasCylinder code="A-26" mark={0.6} />
    </CineStage>
    <AbsoluteFill style={{ background: "rgba(4,8,8,.55)", opacity: io(f, y, 8) }} />
    <CineGrade vignette={0.7} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Number = saal"]} size={104} />
    <Code at={y} text="A-26" x={540} y={820} size={330} />
    {f >= m && <><div style={{ position: "absolute", top: 1040, width: "100%", textAlign: "center", fontFamily: "Anton, Impact, sans-serif", fontSize: 110, color: CINE.red, opacity: io(f, m, 6), letterSpacing: 2 }}>MARCH 2026 TAK</div></>}
    <CineLabel at={m + 8} text="Jaanch isse pehle honi chahiye" />
  </Black>;
};
// 5 ── it is not the gas expiring: it is the cylinder's test date
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame(), t = G(o, hit("L5", "wo"));
  return <Black><DotWall color="#1B5F7A" bg="#04121A" />
    <CineStage dur={d} from={[1.4, 1.9, 6.6]} to={[0.5, 1.5, 5.2]} lookAt={[0, 1.2, 0]} fov={32} exposure={1.2} env={0.45} shadows={false}><HeroLights /><GasCylinder cut level={0.7} rotation={[0, -0.15 + f / 200, 0]} /></CineStage>
    <CineGrade vignette={0.75} /><CineHandle text={H_} />
    {f < t ? <CineTitle at={2} lines={["Gas ki expiry", "nahi hai"]} /> : <CineTitle key="t" at={t} lines={["Cylinder ki", "jaanch ki taareekh"]} color={CINE.red} size={96} />}
    <CineLabel at={t + 6} text="Test due date" />
  </Black>;
};
// 6 ── date passed? don't take it
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const no = G(o, hit("L6", "mat")), dl = G(o, hit("L6", "Delivery"));
  return <Black><DotWall />
    <CineStage dur={d} from={[0.2, 2.0, 12.4]} to={[0.1, 1.8, 11]} lookAt={[0, 1.2, 0]} fov={30} exposure={1.25} env={0.45}>
      <HeroLights /><mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color="#0B1416" roughness={0.35} metalness={0.4} /></mesh>
      <GasCylinder position={[-0.95, 0, 0]} glow={f >= no ? 0.5 : 0} /><GasCylinder position={[0.95, lerp(f, [dl, dl + 9], [-4, 0]), 0]} />
    </CineStage>
    <CineGrade vignette={0.75} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Taareekh nikal gayi?"]} size={92} y={190} />
    <Code at={4} text="A-26" x={300} y={470} size={120} color={CINE.red} />
    <Badge at={no} x={300} y={1190} text="MAT LO" color={CINE.red} />
    {f >= dl && <><Code at={dl + 6} text="C-28" x={790} y={470} size={120} color={OK} /><Badge at={dl + 12} x={790} y={1190} text="THEEK" color={OK} /></>}
    <CineLabel at={dl} text="Delivery wale se doosra maango" />
  </Black>;
};
// 7 ── do it now (bright kitchen again) + comment bait
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame(), c = G(o, hit("L7", "code"));
  return <Black bg="#3A2A18">
    <CineStage dur={d} from={[-1.0, 2.9, 4.4]} to={[-0.9, 2.8, 3.4]} lookAt={[-0.55, 1.75, 0.2]} fov={38} exposure={1.5} env={0.5} fog={["#3A2A18", 14, 40]}>
      <DayKitchen /><Kitchen wall="#C9A56A"><GasCylinder position={[-0.6, 0, 0.2]} regulator code="A-26" /></Kitchen>
    </CineStage>
    <CineGrade tone="amber" vignette={0.6} grain={0.1} /><CineHandle text={H_} />
    <CineTitle at={0} lines={["Abhi check karo"]} color={CINE.red} size={130} y={190} />
    <CineLabel at={c - 4} text="Apna code comment me likho" red y={1380} />
    <div style={{ position: "absolute", top: 1490, width: "100%", display: "flex", justifyContent: "center", opacity: io(f, c + 14, 8) }}><div style={{ background: CINE.paper, color: "#0A0D0C", fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: 3, padding: "10px 28px", borderRadius: 40 }}>Follow {H_}</div></div>
  </Black>;
};

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7)];
export const IMPACTS = [1, hit("L6", "mat")];
export const POPS = [hit("L2", "code"), hit("L3", "A"), hit("L3", "B,"), hit("L3", "C,"), hit("L3", "D,"), hit("L4", "Yaani"), hit("L4", "March"), hit("L6", "Delivery"), hit("L7", "code")];
export const RISERS = [at("L2")];
export const DURATION = TOTAL;
