import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { rng } from "../kit/anim";

/**
 * Our own cut-away stepwell (vav) diorama, built in stages:
 *   well → steps → stone walls → 7 pillared pavilion levels → carvings → water → silt flood → excavation.
 * The earth is a cross-section block (front face open, striped soil layers). Desert top with acacia trees + huts.
 * X runs along the well (entrance at x = -5, shaft at x = +4.6), depth to y = -5. Front of the cut faces +Z.
 */
type V3 = [number, number, number];
const DEPTH = 5, X0 = -5, X1 = 4, ZB = -1.4, ZF = 1.4, BOT = -16;
export const LEVELS = 7;
const stepTop = (x: number) => {
  if (x <= X0) return 0;
  if (x >= X1) return -DEPTH;
  const n = 28, k = Math.floor(((x - X0) / (X1 - X0)) * n);
  return -DEPTH * (k / (n - 1));
};

const soilTex = () => {
  const c = document.createElement("canvas"); c.width = 512; c.height = 1024; const g = c.getContext("2d")!;
  const bands = ["#8a5a33", "#7a4a2a", "#6b3e24", "#5c341f", "#4e2b1a", "#432516"];
  bands.forEach((b, i) => { g.fillStyle = b; g.fillRect(0, (i * 1024) / bands.length, 512, 1024 / bands.length + 2); });
  const r = rng(11);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,230,190" : "20,10,5"},${0.06 + r() * 0.08})`; const s = 2 + r() * 7; g.beginPath(); g.ellipse(r() * 512, r() * 1024, s, s * 0.7, r() * 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const stoneTex = (carved: boolean) => {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = "#cfc3ad"; g.fillRect(0, 0, 1024, 512);
  const r = rng(carved ? 5 : 3);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < 1024; x += 128) {
    g.fillStyle = `hsl(36, ${14 + r() * 8}%, ${70 + r() * 8}%)`; g.fillRect(x + 2, y + 2, 124, 60);
  }
  if (carved) {
    for (let x = 32; x < 1024; x += 96) {
      g.fillStyle = "#a79a82"; g.fillRect(x, 70, 64, 150); g.fillRect(x, 290, 64, 150);
      for (const y0 of [70, 290]) {
        g.fillStyle = "#8d806a"; g.beginPath(); g.arc(x + 32, y0 + 26, 14, 0, 7); g.fill();
        g.fillRect(x + 20, y0 + 40, 24, 70); g.fillRect(x + 12, y0 + 58, 40, 10);
        g.fillStyle = "#b8ab92"; g.beginPath(); g.moveTo(x - 4, y0); g.lineTo(x + 32, y0 - 22); g.lineTo(x + 68, y0); g.fill();
      }
    }
    g.fillStyle = "#b3a68c"; for (let x = 0; x < 1024; x += 16) { g.fillRect(x, 248, 10, 18); g.fillRect(x, 470, 10, 18); }
  }
  g.strokeStyle = "rgba(60,45,30,.35)"; g.lineWidth = 2; for (let y = 0; y < 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

const Tree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.04, 0.07, 0.9, 6]} /><meshStandardMaterial color="#5a3a22" /></mesh>
    {[[0, 1.0, 0, 0.45], [0.3, 0.95, 0.1, 0.32], [-0.28, 0.98, -0.08, 0.34]].map(([x, y, z, r], i) =>
      <mesh key={i} position={[x, y, z]} scale={[1, 0.55, 1]}><sphereGeometry args={[r, 12, 10]} /><meshStandardMaterial color="#4f7d2c" roughness={0.9} /></mesh>)}
  </group>
);
const Hut: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.7, 0.5, 0.5]} /><meshStandardMaterial color="#efe6d6" roughness={0.9} /></mesh>
    <mesh position={[0, 0.62, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.55, 0.3, 4]} /><meshStandardMaterial color="#c0573a" /></mesh>
  </group>
);

/** Tiny stylised people (worker or queen). */
export const Person: React.FC<{ p: V3; kind?: "worker" | "queen"; s?: number; ry?: number }> = ({ p, kind = "worker", s = 0.35, ry = 0 }) => {
  const f = useCurrentFrame();
  const robe = kind === "queen" ? "#b3263a" : "#f2efe8";
  return <group position={p} scale={s} rotation={[0, ry, 0]}>
    <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.18, kind === "queen" ? 0.42 : 0.26, 1.2, 14]} /><meshStandardMaterial color={robe} roughness={0.8} /></mesh>
    <mesh position={[0, 1.42, 0]} rotation={[Math.sin(f / 10) * 0.05, 0, 0]}><sphereGeometry args={[0.2, 16, 12]} /><meshStandardMaterial color="#b97f58" /></mesh>
    {kind === "queen" ? <>
      <mesh position={[0, 1.62, 0]}><cylinderGeometry args={[0.13, 0.15, 0.12, 12]} /><meshStandardMaterial color="#e3b04b" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, 1.2, -0.12]} scale={[1, 1.6, 0.4]}><sphereGeometry args={[0.28, 12, 10]} /><meshStandardMaterial color="#e3b04b" metalness={0.5} roughness={0.4} /></mesh>
    </> : <mesh position={[0, 1.55, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.21, 12, 10]} /><meshStandardMaterial color="#f5f1e6" /></mesh>}
  </group>;
};

/** The diorama. Every stage parameter is 0..1 (pav is 0..7 levels). */
export const Vav3D: React.FC<{ well?: number; steps?: number; walls?: number; pav?: number; carve?: boolean; water?: number; silt?: number; queen?: boolean; workers?: boolean }> =
  ({ well = 1, steps = 0, walls = 0, pav = 0, carve = false, water = 1, silt = 0, queen = false, workers = true }) => {
  const f = useCurrentFrame();
  const soil = useMemo(soilTex, []);
  const stone = useMemo(() => stoneTex(false), []);
  const carved = useMemo(() => stoneTex(true), []);
  const sandTex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!;
    g.fillStyle = "#d9b77e"; g.fillRect(0, 0, 512, 512); const r = rng(2);
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "120,90,50" : "255,240,210"},.18)`; g.fillRect(r() * 512, r() * 512, 2, 2); }
    for (let i = 0; i < 60; i++) { g.strokeStyle = "rgba(120,140,60,.45)"; g.beginPath(); const x = r() * 512, y = r() * 512; g.moveTo(x, y); g.lineTo(x + 3, y - 10); g.moveTo(x, y); g.lineTo(x - 4, y - 8); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 6); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  // columns of soil under the steps (cut proportionally to `steps`)
  const cols = useMemo(() => Array.from({ length: 36 }, (_, i) => X0 - 0.5 + i * ((X1 + 0.5 - X0 + 0.5) / 36)), []);
  const cw = (X1 + 1 - X0) / 36;
  const wellX = X1 + 0.6;
  const soilW = useMemo(() => { const t = soilTex(); t.repeat.set(1 / 6, 1 / 9); t.offset.set(0, 0.02); return t; }, []);
  const sk = Math.round(steps * 50) / 50;
  const front = useMemo(() => {
    const sh = new THREE.Shape(); sh.moveTo(-30, BOT); sh.lineTo(-30, 0);
    const cut = sk * (X1 + 1 - X0);
    sh.lineTo(X0 - 0.5, 0);
    for (let i = 0; i <= 200; i++) { const x = X0 - 0.5 + (i / 200) * (X1 + 0.5 - X0 + 0.5); const y = x - (X0 - 0.5) < cut ? stepTop(x) : 0; sh.lineTo(x, y); }
    if (well > 0) { sh.lineTo(wellX - 0.55, 0); sh.lineTo(wellX - 0.55, -DEPTH); sh.lineTo(wellX + 0.55, -DEPTH); sh.lineTo(wellX + 0.55, 0); }
    sh.lineTo(30, 0); sh.lineTo(30, BOT); sh.lineTo(-30, BOT);
    return new THREE.ShapeGeometry(sh);
  }, [sk, well, wellX]);
  const siltY = -DEPTH + silt * (DEPTH + 0.02);
  return <group>
    {/* desert top (with a gap over the trench) */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -9.4]}><planeGeometry args={[40, 16]} /><meshStandardMaterial map={sandTex} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14.5, 0, -0.0]}><planeGeometry args={[19, 2.8]} /><meshStandardMaterial map={sandTex} roughness={1} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14.7, 0, 0]}><planeGeometry args={[19, 2.8]} /><meshStandardMaterial map={sandTex} roughness={1} /></mesh>
    {/* back earth block behind the trench */}
    <mesh position={[0, BOT / 2 - 0.02, ZB - 6]}><boxGeometry args={[60, -BOT, 12]} /><meshStandardMaterial color="#5c341f" roughness={1} /></mesh>
    {/* soil under the stepped floor: uncut part rises back to ground level as `steps` goes 0 → 1 */}
    {cols.map((x, i) => {
      const cut = steps * (X1 + 1 - X0);
      const top = x - (X0 - 0.5) < cut ? stepTop(x) : 0;
      const h = -BOT + top;
      return <mesh key={i} position={[x + cw / 2, BOT + h / 2, 0]}><boxGeometry args={[cw + 0.002, h, ZF - ZB]} /><meshStandardMaterial color="#7a4a2a" roughness={1} /></mesh>;
    })}
    {/* side earth beyond both ends */}
    <mesh position={[X0 - 15.5, BOT / 2, 0]}><boxGeometry args={[30, -BOT, ZF - ZB]} /><meshStandardMaterial color="#7a4a2a" roughness={1} /></mesh>
    <mesh position={[wellX + 15.6, BOT / 2, 0]}><boxGeometry args={[29.2, -BOT, ZF - ZB]} /><meshStandardMaterial color="#7a4a2a" roughness={1} /></mesh>
    {/* the cut face: one shape following the dug profile, soil bands in world space */}
    <mesh geometry={front} position={[0, 0, ZF + 0.004]}><meshStandardMaterial map={soilW} roughness={1} /></mesh>
    {/* stone step treads once walls exist */}
    {steps > 0.99 && walls > 0 && Array.from({ length: 28 }).map((_, k) => {
      const x = X0 + ((k + 0.5) * (X1 - X0)) / 28;
      return <mesh key={k} position={[x, stepTop(x) + 0.02, 0]}><boxGeometry args={[(X1 - X0) / 28 + 0.01, 0.05, ZF - ZB - 0.1]} /><meshStandardMaterial color="#e6dcc8" roughness={0.7} /></mesh>;
    })}
    {/* stone retaining wall (back), rises with `walls` */}
    {walls > 0 && <mesh position={[(X0 + wellX) / 2, -DEPTH + (DEPTH * walls) / 2, ZB + 0.06]} scale={[1, walls, 1]}>
      <planeGeometry args={[wellX - X0 + 0.4, DEPTH]} /><meshStandardMaterial map={carve ? carved : stone} roughness={0.75} />
    </mesh>}
    {/* pavilions: pillared frames at each level */}
    {Array.from({ length: LEVELS }).map((_, k) => {
      const vis = Math.max(0, Math.min(1, pav - k));
      if (vis <= 0) return null;
      const x = X0 + 1.0 + k * ((X1 - X0 - 1.0) / LEVELS);
      const base = stepTop(x) + 0.02, top = 0;
      const H = (top - base) * vis;
      return <group key={k} position={[x, base, 0]}>
        {[[-0.35, ZB + 0.25], [0.35, ZB + 0.25], [-0.35, ZF - 0.25], [0.35, ZF - 0.25]].map(([dx, z], i) =>
          <group key={i}>
            <mesh position={[dx, H / 2, z]}><cylinderGeometry args={[0.13, 0.15, H, 12]} /><meshStandardMaterial color={carve ? "#d3c6ab" : "#e2d8c4"} roughness={0.6} /></mesh>
            {[0.15, 0.5, 0.85].map((t) => <mesh key={t} position={[dx, H * t, z]}><boxGeometry args={[0.36, 0.08, 0.36]} /><meshStandardMaterial color="#cbbd9f" roughness={0.6} /></mesh>)}
          </group>)}
        {[0.33, 0.66, 1].map((t, i) => t <= vis + 0.001 && <mesh key={i} position={[0, H * t / vis * vis - 0.06, 0]}><boxGeometry args={[1.0, 0.12, ZF - ZB]} /><meshStandardMaterial color="#d9cdb4" roughness={0.6} /></mesh>)}
      </group>;
    })}
    {/* well shaft at the deep end */}
    {well > 0 && <group position={[wellX, 0, 0]}>
      <mesh position={[0, -DEPTH / 2, 0]}><cylinderGeometry args={[0.55, 0.55, DEPTH, 24, 1, true]} /><meshStandardMaterial color={walls > 0 ? "#cfc3ad" : "#5a3a24"} side={THREE.DoubleSide} roughness={0.9} /></mesh>
      <group position={[0, 0.05, 0]}>{[-0.7, 0.7].map((z) => <mesh key={z} position={[0, 0.7, z]}><boxGeometry args={[0.08, 1.4, 0.08]} /><meshStandardMaterial color="#5a3a22" /></mesh>)}
        <mesh position={[0, 1.4, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.04, 1.6, 8]} /><meshStandardMaterial color="#5a3a22" /></mesh>
        <mesh position={[0, 1.4 - 2.8 - Math.sin(f / 25) * 0.4, 0]}><cylinderGeometry args={[0.008, 0.008, 2.8, 4]} /><meshStandardMaterial color="#c9b48a" /></mesh>
        <mesh position={[0, 1.4 - 2.8 * 2 / 2 - 1.4 - Math.sin(f / 25) * 0.4, 0]}><cylinderGeometry args={[0.12, 0.1, 0.18, 12]} /><meshStandardMaterial color="#6b4a2c" /></mesh>
      </group>
    </group>}
    {/* water at the bottom */}
    {water > 0 && <mesh position={[(X1 + wellX) / 2 - 0.3, -DEPTH + 0.25 * water, 0]}><boxGeometry args={[1.9, 0.5 * water, ZF - ZB - 0.02]} /><meshPhysicalMaterial color="#2a9dc8" transparent opacity={0.85} roughness={0.08} metalness={0} clearcoat={1} emissive="#0b4a66" emissiveIntensity={0.3} /></mesh>}
    {/* silt / flood mud filling the trench */}
    {silt > 0 && <mesh position={[(X0 + wellX) / 2, (-DEPTH + siltY) / 2, 0]}><boxGeometry args={[wellX - X0 + 0.9, siltY + DEPTH, ZF - ZB + 0.02]} /><meshStandardMaterial color="#6e4a2c" roughness={1} transparent opacity={0.97} /></mesh>}
    {/* trees, huts, people on top */}
    {[[-9, -3.5, 1.2], [-6.5, -5, 1], [-2, -4.2, 1.1], [2.5, -6, 0.9], [7, -3.6, 1.2], [10, -5.5, 1], [-11, -7, 0.9], [5, -8, 1]].map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} />)}
    <Hut p={[-8, 0, -6.5]} ry={0.3} /><Hut p={[8.5, 0, -7]} ry={-0.2} />
    {workers && <><Person p={[X0 - 0.8, 0, -1.9]} ry={0.5} /><Person p={[wellX + 0.9, 0, -1.9]} ry={-0.6} /></>}
    {queen && <Person p={[-1.2, 0, -2.0]} kind="queen" s={0.5} ry={0.3} />}
  </group>;
};

/** Close-up of a carved stepwell wall: stone courses, framed niches with small stone deities, bracket bands.
 *  Our own simplified design. Faces +Z, centred at the origin, ~6 x 4 units. `dust` 0..1 overlays silt colour. */
export const CarvedWall: React.FC<{ dust?: number }> = ({ dust = 0 }) => {
  const tex = useMemo(() => stoneTex(false), []);
  const stoneC = dust > 0 ? "#a8875e" : "#d6cab2";
  const statue = (x: number, y: number, i: number) => (
    <group key={`${x}${y}`} position={[x, y, 0.12]}>
      <mesh position={[0, 0, -0.06]}><boxGeometry args={[0.62, 1.1, 0.1]} /><meshStandardMaterial color="#9c8f77" roughness={0.9} /></mesh>
      <mesh position={[0, 0.62, 0]}><coneGeometry args={[0.42, 0.28, 4]} /><meshStandardMaterial color={stoneC} roughness={0.7} /></mesh>
      {[-0.32, 0.32].map((dx) => <mesh key={dx} position={[dx, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 1.1, 8]} /><meshStandardMaterial color={stoneC} roughness={0.7} /></mesh>)}
      <mesh position={[0, -0.12, 0.02]}><cylinderGeometry args={[0.1, 0.17, 0.62, 10]} /><meshStandardMaterial color={stoneC} roughness={0.8} /></mesh>
      <mesh position={[0, 0.28, 0.02]}><sphereGeometry args={[0.1, 12, 10]} /><meshStandardMaterial color={stoneC} roughness={0.8} /></mesh>
      <mesh position={[0, 0.4, 0.0]}><coneGeometry args={[0.07, 0.14, 8]} /><meshStandardMaterial color={stoneC} roughness={0.8} /></mesh>
      {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.14, 0.02 + (i % 2) * 0.08, 0.04]} rotation={[0, 0, sd * (0.6 + (i % 3) * 0.3)]}><cylinderGeometry args={[0.025, 0.025, 0.36, 6]} /><meshStandardMaterial color={stoneC} roughness={0.8} /></mesh>)}
      <mesh position={[0, -0.5, 0.02]}><boxGeometry args={[0.4, 0.08, 0.14]} /><meshStandardMaterial color={stoneC} /></mesh>
    </group>
  );
  return <group>
    <mesh><planeGeometry args={[9, 6]} /><meshStandardMaterial map={tex} color={dust > 0 ? "#b89a74" : "#ffffff"} roughness={0.8} /></mesh>
    {[-1.45, 1.45].map((y) => <mesh key={y} position={[0, y, 0.08]}><boxGeometry args={[9, 0.16, 0.18]} /><meshStandardMaterial color={stoneC} roughness={0.7} /></mesh>)}
    {[-0.95, 0.95].map((y) => Array.from({ length: 30 }).map((_, i) => <mesh key={`${y}${i}`} position={[-4.4 + i * 0.3, y * 1.62, 0.12]}><boxGeometry args={[0.16, 0.12, 0.1]} /><meshStandardMaterial color={stoneC} /></mesh>))}
    {Array.from({ length: 7 }).map((_, i) => statue(-3.6 + i * 1.2, 0, i))}
    {Array.from({ length: 7 }).map((_, i) => statue(-3.0 + i * 1.2, 2.3, i + 3))}
    {Array.from({ length: 7 }).map((_, i) => statue(-3.0 + i * 1.2, -2.3, i + 5))}
  </group>;
};
