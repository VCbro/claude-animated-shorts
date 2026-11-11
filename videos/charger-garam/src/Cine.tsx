// Sample clips for skill styles 13 (Cinematic Story 3D) and 14 (Cinematic Macro 3D): 4 shots × 4 s.
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { lerp } from "./kit/anim";
import { CINE, CineGrade, CineHandle, CineLabel, CineTitle, DotWall } from "./kit/Cine";
import { BlindsLight, CineStage } from "./three/CineStage";
import { CH, Charger, WallSetup } from "./three/Charger";

const HANDLE = "@KaiseChaltaHai3D";
const D = 120;

/** Night desk: wall socket with the charger, cable down to a phone lying on a wooden table. */
const NightDesk: React.FC<{ heat: number }> = ({ heat }) => (
  <group>
    <WallSetup wall="#2F4F4A" shellHeat={heat} />
    <mesh position={[0, -3.3, 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 8]} /><meshStandardMaterial color="#4A2F1C" roughness={0.55} /></mesh>
    <group position={[1.5, -3.22, 2.6]} rotation={[-Math.PI / 2, 0, 0.35]}>
      <mesh castShadow><boxGeometry args={[1.5, 3.1, 0.14]} /><meshPhysicalMaterial color="#101214" roughness={0.25} metalness={0.8} clearcoat={1} /></mesh>
      <mesh position={[0, 0, 0.075]}><planeGeometry args={[1.36, 2.94]} /><meshBasicMaterial color="#12351E" toneMapped={false} /></mesh>
      <mesh position={[0, 0.2, 0.08]}><ringGeometry args={[0.34, 0.42, 48]} /><meshBasicMaterial color="#7CF29A" toneMapped={false} /></mesh>
    </group>
    <pointLight position={[1.5, -2.6, 2.8]} color="#6CFF9A" intensity={3} distance={6} />
    <pointLight position={[0, 0.5, 2.4]} color={CH.hot} intensity={2 + heat * 18} distance={9} />
  </group>
);

// 13a ── wide: the night desk, moonlight through blinds
const A: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ background: "#05090A" }}>
    <CineStage dur={D} from={[4.4, -0.2, 10.5]} to={[3.4, -0.4, 8.6]} lookAt={[0.6, -0.7, 1.2]} fov={36} exposure={1.25} fog={["#06100F", 9, 26]}>
      <hemisphereLight args={["#6E9A9A", "#2A1C10", 0.5]} /><BlindsLight position={[-7, 6, 9]} intensity={1.8} /><NightDesk heat={lerp(f, [20, D], [0.1, 0.7])} />
    </CineStage>
    <CineGrade /><CineHandle text={HANDLE} />
    <CineTitle lines={["Raat bhar", "charging?"]} /><CineLabel text="Charger garam kyun hota hai" />
  </AbsoluteFill>;
};
// 13b ── close: the charger glows
const B: React.FC = () => {
  const f = useCurrentFrame(), h = 0.42 + Math.sin(f / 7) * 0.1;
  return <AbsoluteFill style={{ background: "#05090A" }}>
    <CineStage dur={D} from={[-3.6, -0.5, 6.6]} to={[-3.0, -0.4, 5.6]} lookAt={[0.2, -0.45, 0.9]} fov={38} exposure={1.1} fog={["#0A0606", 6, 20]}>
      <hemisphereLight args={["#6E9A9A", "#2A1C10", 0.4]} /><BlindsLight position={[-7, 6, 9]} intensity={1.5} /><NightDesk heat={h} />
    </CineStage>
    <CineGrade tone="red" /><CineHandle text={HANDLE} />
    <CineTitle lines={["Garam"]} color={CINE.red} size={230} y={170} underline={-1} /><CineLabel text="Kharaab nahi · jawab andar hai" red />
  </AbsoluteFill>;
};
// 14a ── macro: flying low over the board like a city at night
const C_: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 55%, #10302E 0%, #030708 80%)" }}>
    <CineStage dur={D} from={[1.5, -2.1, 1.6]} to={[1.15, -1.7, 1.25]} lookAt={[-0.05, 0.05, -0.1]} fov={38} exposure={1.05} env={0.3} fog={["#051112", 2.2, 5.5]} shadows={false}>
      <hemisphereLight args={["#3E6E6E", "#120C06", 0.35]} /><directionalLight position={[-2, 1, 2.5]} color="#FFB56A" intensity={2.6} /><directionalLight position={[2, -1, 1.2]} color="#49D6D0" intensity={1.3} />
      <Charger open={1} flow={0.6} sw={0.4} charge={0.4} heat={0.12} />
    </CineStage>
    <CineGrade tone="amber" vignette={0.9} /><CineHandle text={HANDLE} />
    <CineTitle lines={["230V ka", "safar"]} /><CineLabel text="Charger ke andar" />
  </AbsoluteFill>
);
// 14b ── hero: exploded charger turning in front of a dot wall
const E_: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill>
    <DotWall />
    <CineStage dur={D} from={[0.7, 0.9, 10.2]} to={[0.7, 0.7, 9.4]} lookAt={[0.7, 0.05, 0.4]} fov={30} exposure={1.05} env={0.45} shadows={false}>
      <hemisphereLight args={["#7FB8B4", "#1A120A", 0.4]} /><directionalLight position={[3, 3, 5]} color="#FFE2B8" intensity={2.6} /><directionalLight position={[-4, 1, -2]} color="#49D6D0" intensity={1.6} />
      <group rotation={[0.1, -0.4 + lerp(f, [0, D], [0, 0.35]), 0]}><Charger explode={lerp(f, [6, 70], [0, 1])} flow={0.5} /></group>
    </CineStage>
    <CineGrade vignette={0.86} /><CineHandle text={HANDLE} />
    <CineTitle lines={["Har purza", "ek kaam"]} color={CINE.red} /><CineLabel text="Asli charger ke andar" />
  </AbsoluteFill>;
};

export const Cine: React.FC = () => <AbsoluteFill style={{ background: "#000" }}>
  {[A, B, C_, E_].map((S, i) => <Sequence key={i} from={i * D} durationInFrames={D}><S /></Sequence>)}
</AbsoluteFill>;
