import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { rng } from "../kit/anim";

/**
 * Our own torch-lit royal court (darbaar) in three.js: marble floor, red carpet, pillars with arches,
 * stepped dais + throne under a chhatri, flickering torches, stylised "chess-piece" figures
 * (king, guards, prisoner), a lion cage and a dark stepwell-style well. All original geometry.
 * Coordinates: carpet runs along -Z (towards the throne at z = -9). Figures stand on y = 0.
 */
type V3 = [number, number, number];
const gold = { color: "#d9a441", metalness: 0.85, roughness: 0.3 };
const skin = "#c98d62";

const Mat: React.FC<{ c: string; r?: number; m?: number; e?: string; ei?: number }> = ({ c, r = 0.6, m = 0, e, ei = 0 }) =>
  <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? "#000"} emissiveIntensity={ei} />;

/** Flickering torch (bowl + flame + warm point light). */
export const Torch: React.FC<{ p: V3; seed?: number; light?: boolean }> = ({ p, seed = 1, light = true }) => {
  const f = useCurrentFrame();
  const k = 0.85 + 0.15 * Math.sin(f * 0.9 + seed) + 0.08 * Math.sin(f * 2.3 + seed * 3);
  return <group position={p}>
    <mesh position={[0, -0.6, 0]}><cylinderGeometry args={[0.04, 0.05, 1.2, 10]} /><meshStandardMaterial {...gold} /></mesh>
    <mesh><cylinderGeometry args={[0.16, 0.08, 0.14, 16]} /><meshStandardMaterial {...gold} /></mesh>
    <mesh position={[0, 0.2, 0]} scale={[1, k, 1]}><coneGeometry args={[0.11, 0.38, 12]} /><meshBasicMaterial color="#ffb347" /></mesh>
    <mesh position={[0, 0.16, 0]} scale={[1, k, 1]}><coneGeometry args={[0.06, 0.22, 10]} /><meshBasicMaterial color="#fff1b0" /></mesh>
    {light && <pointLight position={[0, 0.35, 0]} intensity={2.4 * k} distance={7} decay={1.6} color="#ff9a3c" />}
  </group>;
};

/** The hall: floor, carpet, two pillar rows with arches, back wall with jaali windows, dais and throne. */
export const Hall: React.FC = () => {
  const floorTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d")!;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { g.fillStyle = (i + j) % 2 ? "#3a2a24" : "#4a362d"; g.fillRect(i * 128, j * 128, 128, 128); }
    const r = rng(4); g.strokeStyle = "rgba(255,230,200,.06)"; for (let i = 0; i < 60; i++) { g.beginPath(); g.moveTo(r() * 1024, r() * 1024); g.bezierCurveTo(r() * 1024, r() * 1024, r() * 1024, r() * 1024, r() * 1024, r() * 1024); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const carpetTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 1024; const g = c.getContext("2d")!;
    g.fillStyle = "#8e1b22"; g.fillRect(0, 0, 256, 1024); g.fillStyle = "#d9a441"; g.fillRect(14, 0, 8, 1024); g.fillRect(234, 0, 8, 1024);
    g.strokeStyle = "#c1452f"; g.lineWidth = 6; for (let y = 64; y < 1024; y += 128) { g.beginPath(); g.moveTo(128, y - 44); g.lineTo(172, y); g.lineTo(128, y + 44); g.lineTo(84, y); g.closePath(); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const arch = useMemo(() => new THREE.TorusGeometry(1.05, 0.12, 10, 32, Math.PI), []);
  const pillar = useMemo(() => new THREE.CylinderGeometry(0.22, 0.26, 4, 20), []);
  const jaali = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    g.fillStyle = "#1a0f14"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#ffcf8a"; g.lineWidth = 6;
    for (let i = -256; i < 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}><planeGeometry args={[16, 26]} /><meshStandardMaterial map={floorTex} roughness={0.25} metalness={0.15} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]}><planeGeometry args={[1.8, 16]} /><meshStandardMaterial map={carpetTex} roughness={0.9} /></mesh>
    {/* pillars + arches */}
    {[-1, 1].map((sd) => [0, -3, -6].map((z, i) => <group key={`${sd}${i}`} position={[sd * 3.2, 0, z + 1]}>
      <mesh geometry={pillar} position={[0, 2, 0]}><meshStandardMaterial color="#d8c3a5" roughness={0.5} /></mesh>
      <mesh position={[0, 4.05, 0]}><boxGeometry args={[0.7, 0.18, 0.7]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.7, 0.2, 0.7]} /><meshStandardMaterial color="#b9a284" /></mesh>
      {i < 2 && <mesh geometry={arch} position={[0, 4.1, -1.5]} rotation={[0, Math.PI / 2, 0]}><meshStandardMaterial color="#d8c3a5" roughness={0.5} /></mesh>}
    </group>))}
    {/* back wall with jaali windows */}
    <mesh position={[0, 3, -10.5]}><planeGeometry args={[16, 7]} /><meshStandardMaterial color="#5b2f2a" roughness={0.8} /></mesh>
    {[-4.5, 4.5].map((x) => <mesh key={x} position={[x, 3.2, -10.45]}><planeGeometry args={[1.6, 2.4]} /><meshBasicMaterial map={jaali} /></mesh>)}
    {/* dais steps */}
    {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.15 + i * 0.3, -7.6 - i * 0.5]}><boxGeometry args={[5 - i * 0.8, 0.3, 2.6 - i * 0.4]} /><meshStandardMaterial color={i % 2 ? "#e2d2b8" : "#cdb998"} roughness={0.4} /></mesh>)}
    {/* throne */}
    <group position={[0, 0.9, -9]}>
      <mesh geometry={useMemo(() => new RoundedBoxGeometry(1.5, 0.5, 1.1, 4, 0.08), [])} position={[0, 0.35, 0]}><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[0, 0.66, 0.05]}><boxGeometry args={[1.3, 0.14, 0.9]} /><meshStandardMaterial color="#9c1c2a" roughness={0.9} /></mesh>
      <mesh geometry={useMemo(() => new RoundedBoxGeometry(1.6, 2.0, 0.25, 4, 0.1), [])} position={[0, 1.4, -0.45]}><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[0, 1.35, -0.31]}><planeGeometry args={[1.1, 1.5]} /><meshStandardMaterial color="#9c1c2a" roughness={0.9} /></mesh>
      {/* chhatri (canopy) */}
      {[-0.95, 0.95].map((x) => [-0.4, 0.6].map((z) => <mesh key={`${x}${z}`} position={[x, 1.7, z]}><cylinderGeometry args={[0.05, 0.05, 2.6, 10]} /><meshStandardMaterial {...gold} /></mesh>))}
      <mesh position={[0, 3.15, 0.1]}><sphereGeometry args={[1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#b9252f" roughness={0.6} /></mesh>
      <mesh position={[0, 3.0, 0.1]}><cylinderGeometry args={[1.25, 1.25, 0.12, 32]} /><meshStandardMaterial {...gold} /></mesh>
      <mesh position={[0, 4.4, 0.1]}><coneGeometry args={[0.08, 0.4, 10]} /><meshStandardMaterial {...gold} /></mesh>
    </group>
    {[[-2.6, 1.6, -7.3], [2.6, 1.6, -7.3], [-2.6, 1.6, -1.6], [2.6, 1.6, -1.6], [-2.6, 1.6, 1.4], [2.6, 1.6, 1.4]].map((p, i) => <Torch key={i} p={p as V3} seed={i * 1.7} light={i < 4} />)}
  </group>;
};

/** Stylised figure: robe cone + head sphere + headwear. kind: king / guard / prisoner. */
export const Figure: React.FC<{ kind: "king" | "guard" | "prisoner"; p: V3; ry?: number; s?: number; seated?: boolean; nod?: number; glow?: number; free?: number }> = ({ kind, p, ry = 0, s = 1, seated = false, nod = 0, glow = 0, free = 0 }) => {
  const f = useCurrentFrame();
  const robe = kind === "king" ? "#4b2a6b" : kind === "guard" ? "#a3242c" : "#e9e3d6";
  const breathe = 1 + 0.012 * Math.sin(f / 9 + p[0]);
  const h = seated ? 0.95 : 1.35;
  return <group position={p} rotation={[0, ry, 0]} scale={s}>
    <mesh position={[0, h / 2, 0]} scale={[1, breathe, 1]}><cylinderGeometry args={[0.2, 0.36, h, 20]} /><Mat c={robe} r={0.7} /></mesh>
    {kind === "king" && <mesh position={[0, h * 0.55, 0.2]}><boxGeometry args={[0.05, h * 0.8, 0.02]} /><meshStandardMaterial {...gold} /></mesh>}
    <mesh position={[0, h + 0.05, 0]}><cylinderGeometry args={[0.13, 0.18, 0.12, 16]} /><Mat c={robe} /></mesh>
    <group position={[0, h + 0.3, 0]} rotation={[nod, 0, 0]}>
      <mesh><sphereGeometry args={[0.22, 24, 20]} /><Mat c={skin} r={0.55} /></mesh>
      {/* eyes */}
      {[-0.075, 0.075].map((x) => <mesh key={x} position={[x, 0.03, 0.2]}><sphereGeometry args={[0.028, 10, 10]} /><meshBasicMaterial color="#1a1110" /></mesh>)}
      {kind !== "prisoner" && <mesh position={[0, -0.06, 0.205]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.02, 0.14, 4, 8]} /><meshBasicMaterial color="#1a1110" /></mesh>}
      {kind === "king" && <group position={[0, 0.2, 0]}>
        <mesh><cylinderGeometry args={[0.2, 0.21, 0.14, 20, 1, true]} /><meshStandardMaterial {...gold} side={THREE.DoubleSide} /></mesh>
        {Array.from({ length: 8 }).map((_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 4) * 0.2, 0.12, Math.sin(i * Math.PI / 4) * 0.2]}><coneGeometry args={[0.035, 0.12, 6]} /><meshStandardMaterial {...gold} /></mesh>)}
        <mesh position={[0, 0.02, 0.21]}><sphereGeometry args={[0.035, 10, 10]} /><meshStandardMaterial color="#2fd06a" emissive="#2fd06a" emissiveIntensity={0.6} /></mesh>
      </group>}
      {kind === "guard" && <mesh position={[0, 0.14, 0]} scale={[1, 0.7, 1]}><sphereGeometry args={[0.25, 20, 14]} /><Mat c="#e08a1e" r={0.8} /></mesh>}
    </group>
    {kind === "guard" && <group position={[0.42, 0, 0.1]}>
      <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.025, 0.025, 2.4, 8]} /><Mat c="#4a3020" /></mesh>
      <mesh position={[0, 2.5, 0]}><coneGeometry args={[0.06, 0.25, 8]} /><meshStandardMaterial color="#c9ced0" metalness={0.9} roughness={0.2} /></mesh>
    </group>}
    {kind === "prisoner" && <group position={[0, 0.85, 0.3]}>
      {Array.from({ length: 5 }).map((_, i) => <mesh key={i} position={[(-0.16 + i * 0.08) * (1 + free * 6), free * (0.6 - Math.abs(i - 2) * 0.15) - free * free * 0.9, free * 0.4]} rotation={[free * i * 2, i % 2 ? Math.PI / 2 : 0, Math.PI / 2 + free * 3]}><torusGeometry args={[0.04, 0.012, 6, 12]} /><meshStandardMaterial color="#8a8f91" metalness={0.9} roughness={0.35} /></mesh>)}
    </group>}
    {glow > 0 && <pointLight position={[0, h + 0.4, 0.8]} intensity={1.5 * glow} distance={3} color="#C4F23C" />}
  </group>;
};

/** Lion cage with a stylised lion; `roar` 0-1 opens the jaw and lights the eyes. */
export const LionCage: React.FC<{ p: V3; roar?: number; ry?: number }> = ({ p, roar = 0, ry = 0 }) => {
  const f = useCurrentFrame();
  const pace = Math.sin(f / 14) * 0.25 * (1 - roar);
  return <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, 0.08, 0]}><boxGeometry args={[2.4, 0.16, 1.6]} /><meshStandardMaterial color="#3a2a20" roughness={0.8} /></mesh>
    <mesh position={[0, 1.9, 0]}><boxGeometry args={[2.4, 0.12, 1.6]} /><meshStandardMaterial color="#2b2b2b" metalness={0.8} roughness={0.35} /></mesh>
    {Array.from({ length: 13 }).map((_, i) => <mesh key={`f${i}`} position={[-1.15 + i * 0.19, 1, 0.78]}><cylinderGeometry args={[0.025, 0.025, 1.8, 8]} /><meshStandardMaterial color="#2b2b2b" metalness={0.85} roughness={0.3} /></mesh>)}
    {Array.from({ length: 13 }).map((_, i) => <mesh key={`b${i}`} position={[-1.15 + i * 0.19, 1, -0.78]}><cylinderGeometry args={[0.025, 0.025, 1.8, 8]} /><meshStandardMaterial color="#2b2b2b" metalness={0.85} roughness={0.3} /></mesh>)}
    {[-1, 1].map((sd) => Array.from({ length: 8 }).map((_, i) => <mesh key={`s${sd}${i}`} position={[sd * 1.18, 1, -0.7 + i * 0.2]}><cylinderGeometry args={[0.025, 0.025, 1.8, 8]} /><meshStandardMaterial color="#2b2b2b" metalness={0.85} roughness={0.3} /></mesh>))}
    {/* lion */}
    <group position={[pace, 0.16, 0]}>
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.28, 0.8, 8, 16]} /><Mat c="#c98a2e" r={0.8} /></mesh>
      {[[-0.35, 0.18], [0.35, 0.18], [-0.35, -0.18], [0.35, -0.18]].map(([x, z], i) => <mesh key={i} position={[x, 0.22, z]}><cylinderGeometry args={[0.07, 0.07, 0.45, 8]} /><Mat c="#c98a2e" /></mesh>)}
      <group position={[0.62, 0.85, 0]} rotation={[0, -0.6, 0]}>
        <mesh scale={[0.8, 1, 1]}><sphereGeometry args={[0.38, 20, 16]} /><Mat c="#6b3a14" r={0.95} /></mesh>
        <mesh position={[0.12, -0.02, 0.18]}><sphereGeometry args={[0.24, 20, 16]} /><Mat c="#d39a3a" /></mesh>
        {[-0.08, 0.08].map((x) => <mesh key={x} position={[0.2 + x * 0.5, 0.06, 0.38]}><sphereGeometry args={[0.03, 8, 8]} /><meshBasicMaterial color={roar > 0.3 ? "#ffd84a" : "#2a1a0a"} /></mesh>)}
        <mesh position={[0.18, -0.15 - 0.08 * roar, 0.34]}><boxGeometry args={[0.18, 0.04 + 0.12 * roar, 0.06]} /><meshBasicMaterial color="#4a0c0c" /></mesh>
      </group>
      <mesh position={[-0.75, 0.75, 0]} rotation={[0, 0, -0.9 + Math.sin(f / 6) * 0.2]}><cylinderGeometry args={[0.025, 0.025, 0.6, 6]} /><Mat c="#c98a2e" /></mesh>
    </group>
  </group>;
};

/** Andha kuan: a deep stone well (ring of blocks, dark shaft with fog), rope + pulley frame. */
export const Well: React.FC<{ p: V3; depthGlow?: number }> = ({ p, depthGlow = 0 }) => {
  const f = useCurrentFrame();
  const blocks = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);
  return <group position={p}>
    {blocks.map((i) => { const a = (i / 18) * Math.PI * 2; return [0, 1].map((row) => <mesh key={`${i}${row}`} position={[Math.cos(a + row * 0.17) * 0.95, 0.2 + row * 0.36, Math.sin(a + row * 0.17) * 0.95]} rotation={[0, -a, 0]}>
      <boxGeometry args={[0.36, 0.34, 0.26]} /><meshStandardMaterial color={row ? "#8c7f70" : "#7a6e61"} roughness={0.95} />
    </mesh>); })}
    {/* shaft */}
    <mesh position={[0, -2, 0]}><cylinderGeometry args={[0.82, 0.82, 4.4, 32, 1, true]} /><meshStandardMaterial color="#0b0807" side={THREE.BackSide} roughness={1} /></mesh>
    <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.83, 32]} /><meshBasicMaterial color="#020101" transparent opacity={0.92} /></mesh>
    {depthGlow > 0 && <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.2, 0.82, 48]} /><meshBasicMaterial color="#5a0e0a" transparent opacity={0.35 * depthGlow * (0.7 + 0.3 * Math.sin(f / 5))} /></mesh>}
    {/* frame + pulley + rope */}
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 1.05, 1.2, 0]}><boxGeometry args={[0.12, 2.0, 0.12]} /><Mat c="#4a3020" r={0.9} /></mesh>)}
    <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 2.3, 10]} /><Mat c="#4a3020" r={0.9} /></mesh>
    <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.16, 0.04, 8, 20]} /><meshStandardMaterial color="#6b6f70" metalness={0.8} roughness={0.4} /></mesh>
    <mesh position={[0.16, 1.1, 0]}><cylinderGeometry args={[0.012, 0.012, 1.9, 6]} /><Mat c="#b39669" /></mesh>
    <mesh position={[0.16, 0.12 + Math.sin(f / 20) * 0.05, 0]}><cylinderGeometry args={[0.12, 0.1, 0.2, 12]} /><Mat c="#5a4630" /></mesh>
  </group>;
};
