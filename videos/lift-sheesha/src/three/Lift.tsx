import React, { useMemo } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

/**
 * A small passenger lift cabin with a real mirror (planar reflection) on the back wall.
 * Inside: x -0.9..0.9, y 0..2.5, z -0.9 (mirror wall) .. 0.9 (doors). Brushed-steel walls, stone floor, handrail,
 * LED ceiling, sliding doors, button panel with a floor display on the right wall.
 * mirror: 0..1 (0 = plain steel back wall, 1 = mirror uncovered) · doors: 0 closed .. 1 open · roof=false for top views
 */
type V3 = [number, number, number];
const WX = 0.9, WZ = 0.9, HT = 2.5;
const steel = (c = "#8E979B", r = 0.38) => <meshStandardMaterial color={c} metalness={0.85} roughness={r} />;

export const LiftCabin: React.FC<{ mirror?: number; doors?: number; roof?: boolean; floor?: number; light?: number; alarm?: number }> = ({ mirror = 1, doors = 0, roof = true, floor = 4, light = 1, alarm = 0 }) => {
  const refl = useMemo(() => { const r = new Reflector(new THREE.PlaneGeometry(1.5, 1.45), { textureWidth: 1024, textureHeight: 1024, color: 0x9aa7a8, clipBias: 0.002 }); r.position.set(0, 1.55, -WZ + 0.012); return r; }, []);
  const disp = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 96; const g = c.getContext("2d")!;
    g.fillStyle = "#120302"; g.fillRect(0, 0, 128, 96); g.fillStyle = "#FF4A2A"; g.font = "bold 70px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(floor), 78, 52);
    g.beginPath(); g.moveTo(14, 62); g.lineTo(30, 30); g.lineTo(46, 62); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [floor]);
  const floorTex = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; g.fillStyle = "#2A2D2E"; g.fillRect(0, 0, 256, 256); let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 3); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
  const dw = 0.5, slide = doors * 0.48;
  return (
    <group>
      {/* floor, ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[WX * 2, WZ * 2]} /><meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.2} /></mesh>
      {roof && <group position={[0, HT, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[WX * 2, WZ * 2]} />{steel("#5E666A", 0.5)}</mesh>
        {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 1.2]} /><meshBasicMaterial color={alarm > 0.5 ? "#FF6A4A" : "#FFF3DC"} toneMapped={false} opacity={0.4 + light * 0.6} transparent /></mesh>)}
      </group>}
      <pointLight position={[0, HT - 0.35, 0.1]} color={alarm > 0.5 ? "#FF5A3A" : "#FFE9C8"} intensity={5 * light} distance={8} decay={1.4} />
      {/* side walls: steel panels with seams */}
      {[-1, 1].map((sx) => <group key={sx} position={[sx * WX, HT / 2, 0]} rotation={[0, -sx * Math.PI / 2, 0]}>
        <mesh receiveShadow><planeGeometry args={[WZ * 2, HT]} />{steel()}</mesh>
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0, 0.004]}><planeGeometry args={[0.012, HT]} /><meshBasicMaterial color="#1B1F21" /></mesh>)}
        <mesh position={[0, -0.35, 0.07]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, WZ * 1.7, 12]} />{steel("#C9CED1", 0.2)}</mesh>
      </group>)}
      {/* back wall + mirror (covered by a steel panel until `mirror` → 1) */}
      <mesh position={[0, HT / 2, -WZ]} receiveShadow><planeGeometry args={[WX * 2, HT]} />{steel("#7D868A")}</mesh>
      <primitive object={refl} />
      <mesh position={[0, 1.55 + mirror * 1.6, -WZ + 0.02]}><planeGeometry args={[1.52, 1.47]} />{steel("#868F93", 0.42)}</mesh>
      {[[0, 2.29, 1.56, 0.03], [0, 0.81, 1.56, 0.03], [-0.765, 1.55, 0.03, 1.5], [0.765, 1.55, 0.03, 1.5]].map(([x, y, w, h], i) => <mesh key={i} position={[x, y, -WZ + 0.025]}><boxGeometry args={[w, h, 0.02]} />{steel("#C9CED1", 0.25)}</mesh>)}
      <mesh position={[0, 0.72, -WZ + 0.08]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.022, 0.022, 1.5, 12]} />{steel("#C9CED1", 0.2)}</mesh>
      {/* front: jambs, header, sliding doors */}
      {[-1, 1].map((sx) => <mesh key={sx} position={[sx * (dw + (WX - dw) / 2), HT / 2, WZ]} rotation={[0, Math.PI, 0]}><planeGeometry args={[WX - dw, HT]} />{steel("#7D868A")}</mesh>)}
      <mesh position={[0, 2.3, WZ]} rotation={[0, Math.PI, 0]}><planeGeometry args={[dw * 2, 0.4]} />{steel("#7D868A")}</mesh>
      {[-1, 1].map((sx) => <mesh key={sx} position={[sx * (dw / 2 + slide), 1.05, WZ + 0.03]}><boxGeometry args={[dw, 2.1, 0.03]} />{steel("#A7AFB3", 0.3)}</mesh>)}
      {/* button panel + floor display on the right wall near the doors */}
      <group position={[WX - 0.006, 1.25, 0.45]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh><boxGeometry args={[0.26, 0.8, 0.012]} />{steel("#3A4043", 0.35)}</mesh>
        <mesh position={[0, 0.3, 0.008]}><planeGeometry args={[0.2, 0.14]} /><meshBasicMaterial map={disp} toneMapped={false} /></mesh>
        {Array.from({ length: 10 }).map((_, i) => <mesh key={i} position={[(i % 2 ? 0.05 : -0.05), 0.14 - Math.floor(i / 2) * 0.085, 0.01]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.026, 0.026, 0.01, 20]} /><meshBasicMaterial color={i === 3 ? "#FFB23A" : "#C9CED1"} toneMapped={false} /></mesh>)}
      </group>
    </group>
  );
};

const cloth = (c: string) => <meshStandardMaterial color={c} roughness={0.85} />;
/** Simple mannequin (no face): standing, or seated for the wheelchair. Feet on y=0 when standing. */
export const Figure: React.FC<{ position?: V3; rotation?: V3; color?: string; skin?: string; seated?: boolean; glow?: string }> = ({ position, rotation, color = "#C3C9CC", skin = "#D2D6D8", seated = false, glow }) => {
  const hip = seated ? 0.55 : 0.92;
  return <group position={position} rotation={rotation}>
    <mesh position={[0, hip + 0.36, 0]} castShadow><capsuleGeometry args={[0.17, 0.42, 8, 16]} />{cloth(color)}</mesh>
    <mesh position={[0, hip + 0.86, 0]} castShadow><sphereGeometry args={[0.125, 24, 20]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
    <mesh position={[0, hip + 0.7, 0]}><cylinderGeometry args={[0.05, 0.06, 0.1, 12]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
    <mesh position={[0, hip + 0.56, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.085, 0.3, 6, 12]} />{cloth(color)}</mesh>
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * 0.24, hip + 0.33, seated ? 0.1 : 0]} rotation={[seated ? -0.9 : 0, 0, s * 0.08]} castShadow><capsuleGeometry args={[0.055, 0.5, 6, 12]} />{cloth(color)}</mesh>
      {seated ? <>
        <mesh position={[s * 0.1, hip + 0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow><capsuleGeometry args={[0.075, 0.36, 6, 12]} />{cloth(color)}</mesh>
        <mesh position={[s * 0.1, hip - 0.24, 0.42]} castShadow><capsuleGeometry args={[0.065, 0.38, 6, 12]} />{cloth(color)}</mesh>
      </> : <mesh position={[s * 0.09, 0.46, 0]} castShadow><capsuleGeometry args={[0.075, 0.78, 6, 12]} />{cloth(color)}</mesh>}
    </group>)}
    {glow && <pointLight position={[0, 1.4, 0.3]} color={glow} intensity={1.2} distance={2.2} />}
  </group>;
};

/** Wheelchair with a seated figure. Faces +z; wheels on y=0. */
export const Wheelchair: React.FC<{ position?: V3; rotation?: V3; spin?: number; rider?: boolean }> = ({ position, rotation, spin = 0, rider = true }) => {
  const metal = <meshStandardMaterial color="#C9CED1" metalness={0.9} roughness={0.25} />;
  return <group position={position} rotation={rotation}>
    {[-1, 1].map((s) => <group key={s} position={[s * 0.3, 0.3, -0.05]} rotation={[spin, 0, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.28, 0.022, 10, 40]} /><meshStandardMaterial color="#141516" roughness={0.8} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[s * 0.035, 0, 0]}><torusGeometry args={[0.24, 0.01, 8, 40]} />{metal}</mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[(i * Math.PI) / 4, 0, 0]}><cylinderGeometry args={[0.006, 0.006, 0.54, 6]} />{metal}</mesh>)}
    </group>)}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 0.24, 0.07, 0.36]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.055, 0.02, 8, 20]} /><meshStandardMaterial color="#141516" roughness={0.8} /></mesh>)}
    <mesh position={[0, 0.5, 0.06]} castShadow><boxGeometry args={[0.46, 0.05, 0.44]} />{cloth("#1B2A3A")}</mesh>
    <mesh position={[0, 0.78, -0.17]} castShadow><boxGeometry args={[0.46, 0.5, 0.04]} />{cloth("#1B2A3A")}</mesh>
    {[-1, 1].map((s) => <group key={s}>
      <mesh position={[s * 0.24, 0.62, -0.19]}><cylinderGeometry args={[0.014, 0.014, 0.95, 8]} />{metal}</mesh>
      <mesh position={[s * 0.24, 0.42, 0.14]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.014, 0.014, 0.62, 8]} />{metal}</mesh>
      <mesh position={[s * 0.24, 0.26, 0.36]}><cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />{metal}</mesh>
      <mesh position={[s * 0.24, 1.08, -0.27]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.018, 0.018, 0.16, 8]} /><meshStandardMaterial color="#141516" /></mesh>
    </group>)}
    <mesh position={[0, 0.12, 0.5]}><boxGeometry args={[0.36, 0.02, 0.14]} />{metal}</mesh>
    {rider && <Figure seated position={[0, 0, 0.0]} color="#C4502F" />}
  </group>;
};

/** The landing outside the lift: floor, a warm wall with a framed board, a potted plant. Seen through the doors and in the mirror. */
export const Lobby: React.FC<{ light?: number }> = ({ light = 1 }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 4]}><planeGeometry args={[12, 6.2]} /><meshStandardMaterial color="#8C8474" roughness={0.4} /></mesh>
    <mesh position={[0, 2, 6.6]} rotation={[0, Math.PI, 0]}><planeGeometry args={[12, 5]} /><meshStandardMaterial color="#C98F4E" roughness={0.9} /></mesh>
    <mesh position={[0.2, 1.75, 6.55]} rotation={[0, Math.PI, 0]}><planeGeometry args={[1.5, 1.0]} /><meshStandardMaterial color="#F0E6D0" roughness={0.6} /></mesh>
    <mesh position={[0.2, 1.75, 6.56]} rotation={[0, Math.PI, 0]}><ringGeometry args={[0.2, 0.3, 32]} /><meshStandardMaterial color="#B5442E" /></mesh>
    <group position={[-1.5, 0, 5.6]}><mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.22, 0.17, 0.5, 20]} /><meshStandardMaterial color="#7A4A2A" roughness={0.7} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.sin(i * 1.3) * 0.16, 0.8 + (i % 3) * 0.18, Math.cos(i * 1.3) * 0.16]} rotation={[0.3 * Math.sin(i), i, 0.4]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color="#2F7A45" roughness={0.8} /></mesh>)}</group>
    <pointLight position={[0, 2.3, 4.2]} color="#FFD9A0" intensity={9 * light} distance={12} decay={1.3} />
  </group>
);
