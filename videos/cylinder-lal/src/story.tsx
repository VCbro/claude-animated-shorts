// ─────────────────────────────────────────────────────────────────────────────
//  Cylinder laal hi kyun hota hai?  –  cinematic 3D: style 13 (kitchen at night) + style 14 (hero / cutaway / macro).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { io, lerp } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { CINE, CineGrade, CineHandle, CineLabel, CineTitle, DotWall } from "./kit/Cine";
import { BlindsLight, CineStage } from "./three/CineStage";
import { GasCylinder, Kitchen } from "./three/Cylinder";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id);
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";
type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const H_ = CHANNEL.handle;
const Black: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#04080A" }) => <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>;
const KitchenLights = () => <><hemisphereLight args={["#6E9A9A", "#2A1C10", 0.42]} /><BlindsLight position={[-8, 7, 9]} intensity={1.7} /><pointLight position={[1.2, 4.6, 2.5]} color="#FFB56A" intensity={16} distance={12} /></>;
const HeroLights: React.FC<{ rim?: string }> = ({ rim = "#49D6D0" }) => <><hemisphereLight args={["#9FC8C4", "#1A120A", 0.45]} /><directionalLight position={[3, 4, 5]} color="#FFE2B8" intensity={2.8} castShadow shadow-mapSize={[1024, 1024]} /><directionalLight position={[-4, 2, -3]} color={rim} intensity={2.2} /></>;
const Floor: React.FC<{ color?: string }> = ({ color = "#0B1416" }) => <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><meshStandardMaterial color={color} roughness={0.35} metalness={0.4} /></mesh>;

// 1 ── HOOK: the red cylinder in the kitchen
const S1: React.FC<SceneP> = ({ o, d }) => (
  <Black>
    <CineStage dur={d} from={[-1.2, 2.5, 12.5]} to={[-0.4, 2.1, 10.4]} lookAt={[0.35, 1.7, 0]} fov={36} exposure={1.25} fog={["#06100F", 10, 30]}>
      <KitchenLights /><Kitchen><GasCylinder position={[-0.6, 0, 0.2]} regulator /></Kitchen>
    </CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Cylinder", "laal hi kyun?"]} /><CineLabel at={G(o, hit("L1", "kyun"))} text="Roz dekhte ho · socha kabhi?" />
  </Black>
);
// 2 ── why not blue, green, yellow?
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const t = [G(o, hit("L2", "Neela")), G(o, hit("L2", "hara")), G(o, hit("L2", "peela"))];
  return <Black><DotWall />
    <CineStage dur={d} from={[0, 1.7, 12.2]} to={[0, 1.5, 11]} lookAt={[0, 1.05, 0]} fov={30} env={0.4}>
      <HeroLights /><Floor />
      {(["#1F3F8F", "#1F7A3A", "#D9B21C"] as const).map((c, i) => <GasCylinder key={c} color={c} position={[(i - 1) * 1.17, lerp(f, [t[i], t[i] + 8], [-3, 0]), 0]} scale={0.84} />)}
    </CineStage>
    <CineGrade vignette={0.86} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Neela? Hara?", "Peela?"]} /><CineLabel at={G(o, hit("L2", "vigyaan")) - 4} text="Iske peeche poora vigyaan hai" />
  </Black>;
};
// 3 ── red = danger
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black bg="#120403">
    <CineStage dur={d} from={[1.8, 1.9, 6.6]} to={[1.2, 1.5, 5.4]} lookAt={[0, 1.1, 0]} fov={32} env={0.35} fog={["#160504", 6, 18]}>
      <HeroLights rim="#FF3B1F" /><Floor color="#150707" />
      <GasCylinder rotation={[0, f / 90, 0]} glow={0.25 + Math.sin(f / 6) * 0.12} />
    </CineStage>
    <CineGrade tone="red" /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L3", "khatra")) - 6} lines={["Laal = khatra"]} color={CINE.red} size={128} /><CineLabel at={G(o, hit("L3", "LPG"))} text="Andar LPG · jaldi aag pakadti hai" red />
  </Black>;
};
// 4 ── seen first from far away (fog, a yard of grey cylinders, one red)
const S4: React.FC<SceneP> = ({ o, d }) => (
  <Black bg="#0A1213">
    <CineStage dur={d} from={[0, 1.7, 22]} to={[0, 1.6, 16]} lookAt={[0, 1.0, 0]} fov={30} env={0.25} fog={["#16201F", 6, 30]}>
      <hemisphereLight args={["#9FB8B4", "#1A1A16", 0.7]} /><directionalLight position={[4, 8, 6]} color="#DCE8E6" intensity={1.2} /><Floor color="#1A2222" />
      {[[-3.2, 0], [-1.1, 0], [1.1, 0], [3.2, 0], [-4.2, -3], [-2.1, -3], [2.1, -3], [4.2, -3], [-3.2, -6], [3.2, -6], [-1.3, -9], [1.3, -9]].map(([x, z], i) => <GasCylinder key={i} color="#6E7676" position={[x, 0, z]} />)}
      <GasCylinder position={[0, 0, -6]} glow={2.2} /><pointLight position={[0, 2.4, -4.6]} color="#FF3B1F" intensity={30} distance={10} />
    </CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L4", "door")) - 4} lines={["Door se", "sabse pehle"]} /><CineLabel at={G(o, hit("L4", "nazar")) - 4} text="Laal sabse jaldi nazar aata hai" />
  </Black>
);
// 5 ── inside: not gas, a liquid
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const out = G(o, hit("L5", "Bahar"));
  return <Black><DotWall color="#1B5F7A" bg="#04121A" />
    <CineStage dur={d} from={[1.2, 1.8, 6.4]} to={[0.6, 1.5, 5.2]} lookAt={[0, 1.2, 0]} fov={32} env={0.4}>
      <HeroLights /><GasCylinder cut level={0.72} vapour={lerp(f, [out, out + 20], [0, 1])} rotation={[0, -0.15, 0]} />
    </CineStage>
    <CineGrade vignette={0.86} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Andar gas", "nahi hai"]} /><CineLabel at={G(o, hit("L5", "taral")) - 6} text={f < out ? "Dabaakar banaya taral" : "Bahar aate hi = gas"} red={f >= out} />
  </Black>;
};
// 6 ── LPG has no smell of its own
const S6: React.FC<SceneP> = ({ o, d }) => (
  <Black bg="#06100F">
    <CineStage dur={d} from={[1.5, 2.9, 3.6]} to={[1.1, 2.7, 3.0]} lookAt={[0, 2.25, 0]} fov={36} env={0.4} fog={["#06100F", 3, 12]}>
      <HeroLights /><GasCylinder vapour={1} />
    </CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L6", "LPG")) - 4} lines={["LPG ki koi", "gandh nahi"]} /><CineLabel at={2} text="Ek aur raaz" />
  </Black>
);
// 7 ── so a strong smell is added
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const b = G(o, hit("L7", "badbu"));
  return <Black bg="#0A1006">
    <CineStage dur={d} from={[-1.4, 2.8, 3.8]} to={[-1.0, 2.9, 3.2]} lookAt={[0, 2.5, 0]} fov={38} env={0.4} fog={["#0A1006", 3, 12]}>
      <HeroLights rim="#B6D22A" /><GasCylinder vapour={1} stink={lerp(f, [b, b + 18], [0, 1])} />
    </CineStage>
    <CineGrade tone="amber" /><CineHandle text={H_} />
    <CineTitle at={b - 4} lines={["Badbu milayi", "jaati hai"]} color={CINE.red} /><CineLabel at={G(o, hit("L7", "leak"))} text="Leak hote hi pata chal jaaye" red />
  </Black>;
};
// 8 ── home red, shop blue
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const nb = G(o, hit("L8", "dukaan"));
  return <Black><DotWall />
    <CineStage dur={d} from={[0.3, 2.0, 12.4]} to={[0.2, 1.8, 11.2]} lookAt={[0.1, 1.35, 0]} fov={30} env={0.4}>
      <HeroLights /><Floor />
      <GasCylinder position={[-0.95, 0, 0]} /><GasCylinder color="#1F3F8F" position={[0.95, lerp(f, [nb, nb + 8], [-4, 0]), 0]} scale={[1.12, 1.36, 1.12]} />
    </CineStage>
    <CineGrade vignette={0.86} /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Ghar: laal", "Dukaan: neela"]} underline={-1} /><CineLabel at={nb + 6} text="14.2 kg ghar · 19 kg hotel / dukaan" />
  </Black>;
};
// 9 ── smell gas? what to do
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const steps: [number, string[], string, boolean][] = [
    [0, ["Badbu aaye", "toh?"], "Gas leak ke 3 kaam", false],
    [G(o, hit("L9", "maachis")), ["Maachis, switch", "mat chhuo"], "Chingari = aag", true],
    [G(o, hit("L9", "Khidki")), ["Khidki kholo"], "Hawa aane do", false],
    [G(o, hit("L9", "regulator")), ["Regulator", "band karo"], "Gas ka raasta band", false],
    [G(o, hit("L9", "unnees")), ["1906"], "LPG emergency helpline", true],
  ];
  const i = steps.reduce((a, s, k) => (f >= s[0] ? k : a), 0), s = steps[i];
  return <Black>
    <CineStage dur={d} from={[-2.6, 2.6, 11.5]} to={[-1.4, 2.2, 9.4]} lookAt={[0.3, 1.9, 0]} fov={36} exposure={1.25} fog={["#0A0F06", 9, 28]}>
      <KitchenLights /><Kitchen flame={0}><GasCylinder position={[-0.6, 0, 0.2]} regulator vapour={0.9} stink={1} /></Kitchen>
    </CineStage>
    <CineGrade tone={s[3] ? "red" : "teal"} /><CineHandle text={H_} />
    <CineTitle key={i} at={s[0] + 1} lines={s[1]} color={s[3] ? CINE.red : CINE.paper} size={i === 4 ? 240 : 104} y={i === 4 ? 170 : 210} underline={i === 4 ? -1 : s[1].length - 1} /><CineLabel key={`l${i}`} at={s[0] + 5} text={s[2]} red={s[3]} />
  </Black>;
};
// 10 ── CTA
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black>
    <CineStage dur={d} from={[1.6, 2.4, 11.6]} to={[1.3, 2.2, 10.6]} lookAt={[0.4, 1.7, 0]} fov={36} exposure={1.25} fog={["#06100F", 9, 28]}>
      <KitchenLights /><Kitchen><GasCylinder position={[-0.6, 0, 0.2]} regulator /></Kitchen>
    </CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Follow +", "Subscribe"]} />
    <div style={{ position: "absolute", top: 520, width: "100%", display: "flex", justifyContent: "center", opacity: io(f, 10, 8) }}><div style={{ background: CINE.red, color: CINE.paper, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 36, letterSpacing: 3, padding: "12px 30px", borderRadius: 40 }}>{H_}</div></div>
    <CineLabel at={G(o, hit("L10", "batao"))} text="Tumhara cylinder kitne din chalta hai?" />
  </Black>;
};

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7), P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10)];
export const IMPACTS = [hit("L3", "khatra"), hit("L9", "unnees")];
export const POPS = [hit("L2", "Neela"), hit("L2", "hara"), hit("L2", "peela"), hit("L5", "Bahar"), hit("L7", "badbu"), hit("L8", "dukaan"), hit("L9", "maachis"), hit("L9", "Khidki"), hit("L9", "regulator")];
export const RISERS = [at("L3"), hit("L9", "unnees")];
export const DURATION = TOTAL;
