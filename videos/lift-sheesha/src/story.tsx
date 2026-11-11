// ─────────────────────────────────────────────────────────────────────────────
//  Lift mein sheesha kyun?  –  cinematic 3D inside a lift cabin with a real mirror (style 13) + hero/top views (style 14).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { io, lerp } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { CINE, CineGrade, CineHandle, CineLabel, CineTitle, DotWall } from "./kit/Cine";
import { CineStage } from "./three/CineStage";
import { Figure, LiftCabin, Lobby, Wheelchair } from "./three/Lift";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id);
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";
type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const H_ = CHANNEL.handle;
const Black: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#04080A" }) => <AbsoluteFill style={{ background: bg }}>{children}</AbsoluteFill>;
const Amb = ({ k = 0.5 }: { k?: number }) => <hemisphereLight args={["#9FB8B8", "#2A2218", k]} />;
// camera standing by the doors, looking at the mirror wall
// camera on the landing, looking in through the open doors at the mirror wall
const OUT = { from: [0.3, 1.5, 3.5] as [number, number, number], to: [0.12, 1.45, 2.7] as [number, number, number], lookAt: [0, 1.3, -0.9] as [number, number, number], fov: 44, exposure: 1.3, env: 0.45, shadows: false } as const;

// 1 ── HOOK: inside the lift, the mirror
const S1: React.FC<SceneP> = ({ o, d }) => (
  <Black>
    <CineStage dur={d} {...OUT}><Amb /><LiftCabin doors={1} /><Lobby /><Figure position={[-0.2, 0, -0.25]} rotation={[0, Math.PI, 0]} /></CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Lift mein", "sheesha kyun?"]} /><CineLabel at={G(o, hit("L1", "kyun"))} text="Har lift mein hota hai" />
  </Black>
);
// 2 ── to fix your hair?  No.
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame(), no = G(o, hit("L2", "Nahi"));
  return <Black>
    <CineStage dur={d} from={[0.35, 1.6, 2.2]} to={[0.25, 1.6, 1.7]} lookAt={[-0.05, 1.5, -0.9]} fov={44} exposure={1.3} env={0.45} shadows={false}><Amb /><LiftCabin doors={1} /><Lobby /><Figure position={[-0.15, 0, -0.3]} rotation={[0, Math.PI, 0]} /></CineStage>
    <CineGrade tone={f >= no ? "red" : "teal"} /><CineHandle text={H_} />
    {f < no ? <CineTitle at={2} lines={["Baal theek", "karne ke liye?"]} /> : <CineTitle key="n" at={no} lines={["Nahi."]} color={CINE.red} size={230} y={170} underline={-1} />}
    <CineLabel at={G(o, hit("L2", "teen")) - 4} text="Iske peeche 3 badi wajah" red />
  </Black>;
};
// 3 ── reason 1: a small closed box (no mirror, doors closing)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black>
    <CineStage dur={d} from={[0.2, 1.5, 3.2]} to={[0.1, 1.45, 2.8]} lookAt={[0, 1.3, -0.9]} fov={44} exposure={0.95} env={0.25} shadows={false}><Amb k={0.25} /><LiftCabin mirror={0} light={0.5} doors={lerp(f, [4, d - 6], [1, 0.16])} /><Lobby light={0.35} /><Figure position={[0, 0, -0.2]} /></CineStage>
    <CineGrade vignette={0.92} /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L3", "ghabrahat")) - 6} lines={["1 · Ghabrahat"]} color={CINE.red} size={120} /><CineLabel at={G(o, hit("L3", "chhota")) - 4} text="Chhota sa band dabba" />
  </Black>;
};
// 4 ── the mirror appears: the same space looks twice as big
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black>
    <CineStage dur={d} {...OUT}><Amb /><LiftCabin doors={1} mirror={lerp(f, [4, 26], [0, 1])} light={lerp(f, [4, 26], [0.6, 1])} /><Lobby /><Figure position={[-0.2, 0, -0.2]} rotation={[0, Math.PI, 0]} /></CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L4", "dugni")) - 6} lines={["Jagah dugni", "badi dikhe"]} /><CineLabel at={G(o, hit("L4", "ghutan")) - 4} text="Ghutan kam lagti hai" />
  </Black>;
};
// 5 ── reason 2: safety. Someone stands behind you; you see them without turning
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame(), k = G(o, hit("L5", "peeche"));
  return <Black>
    <CineStage dur={d} from={[0.3, 1.62, 0.25]} to={[0.26, 1.62, 0.1]} lookAt={[-0.05, 1.5, -0.9]} fov={56} exposure={1.3} env={0.45} shadows={false}><Amb /><LiftCabin doors={1} /><Lobby light={0.5} />
      <Figure position={[-0.32, 0, -0.4]} rotation={[0, Math.PI, 0]} /><Figure position={[0.3, 0, 0.82]} rotation={[0, Math.PI, 0]} color="#5A2A26" skin="#7A3A34" glow={f >= k ? "#FF3B1F" : undefined} />
    </CineStage>
    <CineGrade tone={f >= k ? "red" : "teal"} /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L5", "suraksha")) - 6} lines={["2 · Suraksha"]} color={CINE.red} size={120} /><CineLabel at={G(o, hit("L5", "bina")) - 4} text={f < k ? "Bina mude dekho" : "Peeche kaun khada hai"} red={f >= k} />
  </Black>;
};
// 6 ── reason 3: the wheelchair (hero)
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black><DotWall />
    <CineStage dur={d} from={[2.0, 1.5, 4.6]} to={[1.7, 1.3, 4.0]} lookAt={[0, 0.72, 0]} fov={30} env={0.5}>
      <hemisphereLight args={["#9FC8C4", "#1A120A", 0.5]} /><directionalLight position={[3, 4, 4]} color="#FFE2B8" intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} /><directionalLight position={[-3, 2, -3]} color="#49D6D0" intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#0B1416" roughness={0.35} metalness={0.4} /></mesh>
      <Wheelchair rotation={[0, -0.5 + f / 120, 0]} />
    </CineStage>
    <CineGrade vignette={0.86} /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L6", "wheelchair")) - 8} lines={["3 · Wheelchair"]} color={CINE.red} size={116} /><CineLabel at={2} text="Sabse zaroori wajah" red />
  </Black>;
};
// 7 ── top view: no room to turn → look in the mirror and reverse straight out
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const sh = G(o, hit("L7", "Sheeshe")), out = G(o, hit("L7", "ulta"));
  const turn = f < sh ? Math.sin(f / 5) * 0.32 : 0;       // tries to turn, bumps the walls
  const z = lerp(f, [out, out + 50], [-0.2, 1.9]);
  return <Black bg="#050B0C">
    <CineStage dur={d} from={[0.0, 5.6, 1.4]} to={[0.0, 5.2, 1.6]} lookAt={[0, 0, 0.35]} fov={40} exposure={1.1} env={0.3} shadows={false}><Amb k={0.7} />
      <LiftCabin roof={false} doors={lerp(f, [out - 16, out], [0, 1])} /><pointLight position={[0, 2.2, 0]} color="#FFE9C8" intensity={3} distance={6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 2.2]}><planeGeometry args={[6, 2.6]} /><meshStandardMaterial color="#3A3F40" roughness={0.6} /></mesh>
      <Wheelchair position={[0, 0, z]} rotation={[0, Math.PI + turn, 0]} spin={-z * 3} />
      {f >= sh && f < out + 50 && <mesh position={[0, 1.2, (-0.9 + z) / 2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.012, 0.012, Math.abs(z + 0.9), 6]} /><meshBasicMaterial color="#C4F23C" toneMapped={false} /></mesh>}
    </CineStage>
    <CineGrade tone={f < sh ? "red" : "teal"} vignette={0.75} /><CineHandle text={H_} />
    {f < sh ? <CineTitle at={2} lines={["Ghumne ki", "jagah nahi"]} color={CINE.red} /> : <CineTitle key="b" at={sh} lines={["Sheeshe mein dekho", "ulta seedha bahar"]} size={92} />}
    <CineLabel at={f < sh ? 8 : sh + 6} key={f < sh ? "a" : "b"} text={f < sh ? "Wheelchair mud nahi sakti" : "Sheesha = peeche ki aankh"} red={f < sh} />
  </Black>;
};
// 8 ── fun fact: the wait feels shorter
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black>
    <CineStage dur={d} from={[-0.5, 1.45, 0.7]} to={[-0.42, 1.45, 0.5]} lookAt={[0.9, 1.35, 0.3]} fov={62} exposure={1.3} env={0.45} shadows={false}><Amb /><LiftCabin floor={1 + Math.floor(f / 9) % 9} /><Figure position={[0.25, 0, -0.45]} rotation={[0, Math.PI, 0]} /></CineStage>
    <CineGrade tone="amber" /><CineHandle text={H_} />
    <CineTitle at={G(o, hit("L8", "intezaar")) - 6} lines={["Intezaar", "chhota lage"]} /><CineLabel at={2} text="Ek mazedaar baat" />
  </Black>;
};
// 9 ── not decoration: safety (doors open, light floods in)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame(), s = G(o, hit("L9", "suraksha"));
  return <Black>
    <CineStage dur={d} {...OUT}><Amb /><LiftCabin doors={lerp(f, [6, 46], [0.1, 1])} /><Lobby /><Figure position={[0.2, 0, -0.2]} rotation={[0, Math.PI, 0]} /></CineStage>
    <CineGrade tone={f >= s ? "red" : "teal"} /><CineHandle text={H_} />
    {f < s ? <CineTitle at={G(o, hit("L9", "sajaawat")) - 6} lines={["Ye sajaawat", "nahi"]} /> : <CineTitle key="s" at={s} lines={["Suraksha hai"]} color={CINE.red} size={150} y={190} />}
    <CineLabel at={2} text="Agli baar lift mein yaad rakhna" />
  </Black>;
};
// 10 ── CTA
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return <Black>
    <CineStage dur={d} {...OUT}><Amb /><LiftCabin doors={1} /><Lobby /></CineStage>
    <CineGrade /><CineHandle text={H_} />
    <CineTitle at={2} lines={["Follow +", "Subscribe"]} />
    <div style={{ position: "absolute", top: 520, width: "100%", display: "flex", justifyContent: "center", opacity: io(f, 10, 8) }}><div style={{ background: CINE.red, color: CINE.paper, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 36, letterSpacing: 3, padding: "12px 30px", borderRadius: 40 }}>{H_}</div></div>
    <CineLabel at={G(o, hit("L10", "batao"))} text="Lift mein pehle kya dekhte ho?" />
  </Black>;
};

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7), P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10)];
export const IMPACTS = [hit("L2", "Nahi"), hit("L9", "suraksha")];
export const POPS = [hit("L3", "ghabrahat"), hit("L4", "dugni"), hit("L5", "suraksha"), hit("L5", "peeche"), hit("L6", "wheelchair"), hit("L7", "Sheeshe"), hit("L7", "ulta"), hit("L8", "intezaar")];
export const RISERS = [hit("L2", "Nahi"), at("L6")];
export const DURATION = TOTAL;
