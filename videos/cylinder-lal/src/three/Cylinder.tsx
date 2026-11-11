import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";

/**
 * Indian LPG cylinder, built to the real silhouette: domed steel body with a weld seam, foot ring, three-stay collar
 * (handle ring) and a brass valve; optional regulator + orange hose. Stands on y=0, about 2.05 units tall, r≈0.62.
 * cut=true slices the front half away to show the liquid inside (LPG is stored as a liquid under pressure).
 * level: liquid height 0..1 · vapour: 0..1 gas leaving the valve · stink: 0..1 turns that gas yellow-green (odourant)
 */
type V3 = [number, number, number];
const BODY = new THREE.LatheGeometry([[0, 0.12], [0.3, 0.13], [0.5, 0.2], [0.6, 0.34], [0.62, 0.5], [0.62, 1.3], [0.6, 1.46], [0.5, 1.6], [0.3, 1.69], [0.12, 1.72], [0, 1.72]].map(([r, y]) => new THREE.Vector2(r, y)), 64);
const INNER = new THREE.LatheGeometry([[0, 0.15], [0.3, 0.16], [0.48, 0.23], [0.575, 0.36], [0.595, 0.5], [0.595, 1.3], [0.575, 1.44], [0.48, 1.57], [0.3, 1.66], [0, 1.69]].map(([r, y]) => new THREE.Vector2(r, y)), 64);
const CUT = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];

const useTex = () => useMemo(() => {
  const halo = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!; const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  // paint wear: slightly uneven roughness + stencil band
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = "#fff"; g.fillRect(0, 0, 1024, 512);
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.07})`; g.fillRect(r() * 1024, r() * 512, 2 + r() * 26, 1 + r() * 3); }
  g.fillStyle = "rgba(255,255,255,0.0)"; g.font = "900 54px Arial, sans-serif"; g.textAlign = "center"; g.fillStyle = "rgba(0,0,0,.42)";
  const wear = new THREE.CanvasTexture(c); wear.colorSpace = THREE.SRGBColorSpace; wear.wrapS = THREE.RepeatWrapping;
  return { halo, wear };
}, []);

export const GasCylinder: React.FC<{ color?: string; position?: V3; rotation?: V3; scale?: number | V3; cut?: boolean; level?: number; regulator?: boolean; vapour?: number; stink?: number; glow?: number }> =
  ({ color = "#C4161C", position, rotation, scale, cut = false, level = 0.72, regulator = false, vapour = 0, stink = 0, glow = 0 }) => {
    const f = useCurrentFrame();
    const { halo, wear } = useTex();
    const hose = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.2, 2.02, 0), new THREE.Vector3(0.55, 2.05, 0.05), new THREE.Vector3(0.9, 2.4, 0.1), new THREE.Vector3(1.3, 3.0, -0.2), new THREE.Vector3(1.7, 3.05, -0.5)]), 50, 0.035, 10), []);
    const paint = (extra = {}) => <meshPhysicalMaterial color={color} map={wear} roughness={0.34} metalness={0.25} clearcoat={0.7} clearcoatRoughness={0.3} side={cut ? THREE.DoubleSide : THREE.FrontSide} clippingPlanes={cut ? CUT : []} emissive={color} emissiveIntensity={glow * 0.5} {...extra} />;
    const ly = 0.2 + level * 1.25;
    const gasCol = "#" + new THREE.Color("#DCEBFF").lerp(new THREE.Color("#B6D22A"), stink).getHexString();
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <mesh geometry={BODY} castShadow receiveShadow>{paint()}</mesh>
        <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.622, 0.012, 8, 64]} />{paint()}</mesh>
        {/* foot ring */}
        <mesh position={[0, 0.09, 0]} castShadow><cylinderGeometry args={[0.5, 0.5, 0.18, 48, 1, true]} />{paint({ side: THREE.DoubleSide })}</mesh>
        <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.018, 8, 48]} />{paint()}</mesh>
        {/* collar: three stays + handle ring */}
        {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 3 + 0.5) * 0.34, 1.76, Math.sin((i * 2 * Math.PI) / 3 + 0.5) * 0.34]} rotation={[0, -((i * 2 * Math.PI) / 3 + 0.5), 0]} castShadow><boxGeometry args={[0.03, 0.26, 0.16]} />{paint()}</mesh>)}
        <mesh position={[0, 1.95, 0]} castShadow><cylinderGeometry args={[0.36, 0.36, 0.16, 48, 1, true]} />{paint({ side: THREE.DoubleSide })}</mesh>
        <mesh position={[0, 2.03, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.36, 0.022, 8, 48]} />{paint()}</mesh>
        {/* brass valve */}
        <mesh position={[0, 1.8, 0]} castShadow><cylinderGeometry args={[0.075, 0.09, 0.2, 6]} /><meshStandardMaterial color="#C9A24A" metalness={0.95} roughness={0.25} /></mesh>
        <mesh position={[0, 1.93, 0]}><cylinderGeometry args={[0.055, 0.055, 0.08, 20]} /><meshStandardMaterial color="#D8B55C" metalness={0.95} roughness={0.2} /></mesh>
        {regulator && <group>
          <mesh position={[0, 2.02, 0]} castShadow><cylinderGeometry args={[0.2, 0.22, 0.1, 32]} /><meshPhysicalMaterial color="#3F5E8C" roughness={0.35} metalness={0.4} clearcoat={0.6} /></mesh>
          <mesh position={[0, 2.11, 0]}><cylinderGeometry args={[0.08, 0.1, 0.09, 20]} /><meshStandardMaterial color="#15171A" roughness={0.4} /></mesh>
          <mesh geometry={hose} castShadow><meshStandardMaterial color="#E0691C" roughness={0.55} /></mesh>
        </group>}
        {/* inside: steel wall, liquid, vapour space */}
        {cut && <>
          <mesh geometry={INNER}><meshStandardMaterial color="#5A5F66" roughness={0.6} metalness={0.7} side={THREE.BackSide} clippingPlanes={CUT} /></mesh>
          <mesh position={[0, (0.2 + ly) / 2, 0]}><cylinderGeometry args={[0.57, 0.5, ly - 0.2, 48]} /><meshPhysicalMaterial color="#8FD6FF" transparent opacity={0.62} roughness={0.08} clearcoat={1} clippingPlanes={CUT} side={THREE.DoubleSide} emissive="#2A7FB8" emissiveIntensity={0.35} /></mesh>
          <mesh position={[0, ly + Math.sin(f / 9) * 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.57, 48, Math.PI, Math.PI]} /><meshBasicMaterial color="#D8F3FF" transparent opacity={0.85} side={THREE.DoubleSide} /></mesh>
          {Array.from({ length: 14 }).map((_, i) => { const p = ((f / 50) + i * 0.173) % 1; return <sprite key={i} position={[Math.sin(i * 2.4) * 0.38, 0.3 + p * (ly - 0.35), -0.02 - (i % 4) * 0.08]} scale={[0.05, 0.05, 1]}><spriteMaterial map={halo} color="#FFFFFF" transparent opacity={0.8 * Math.sin(Math.PI * p)} depthWrite={false} /></sprite>; })}
        </>}
        {/* gas leaving the valve */}
        {vapour > 0.02 && Array.from({ length: 34 }).map((_, i) => {
          const p = ((f / 55) + i * 0.0931) % 1, a = i * 2.39, sp = 0.12 + p * 0.95;
          const s = (0.25 + p * 0.95) * (0.6 + vapour * 0.6);
          return <sprite key={i} position={[Math.cos(a) * sp * 0.7 + Math.sin(f / 30 + i) * 0.05, 2.0 + p * 1.9, Math.sin(a) * sp * 0.5]} scale={[s, s, 1]}><spriteMaterial map={halo} color={gasCol} transparent opacity={(0.1 + stink * 0.45) * vapour * Math.sin(Math.PI * p)} depthWrite={false} /></sprite>;
        })}
      </group>
    );
  };

/** Blue burner flame ring. */
export const Flame: React.FC<{ position?: V3; r?: number; on?: number }> = ({ position, r = 0.26, on = 1 }) => {
  const f = useCurrentFrame();
  return <group position={position}>{Array.from({ length: 18 }).map((_, i) => {
    const a = (i / 18) * Math.PI * 2, h = (0.16 + Math.sin(f * 0.9 + i * 1.7) * 0.03) * on;
    return <mesh key={i} position={[Math.cos(a) * r, h / 2, Math.sin(a) * r]}><coneGeometry args={[0.035, h, 8]} /><meshBasicMaterial color="#4FA8FF" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>;
  })}<pointLight position={[0, 0.2, 0]} color="#5FB0FF" intensity={1.6 * on} distance={4} /></group>;
};

/** Kitchen corner at night: tiled floor, wall, cabinet + stone counter, two-burner stove, the cylinder on the floor. */
export const Kitchen: React.FC<{ flame?: number; children?: React.ReactNode; wall?: string }> = ({ flame = 1, children, wall = "#2F4F48" }) => {
  const tiles = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!; g.fillStyle = "#B9AE98"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#6E6557"; g.lineWidth = 5; g.strokeRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[30, 30]} /><meshStandardMaterial map={tiles} roughness={0.45} /></mesh>
    <mesh position={[0, 6, -1.6]} receiveShadow><planeGeometry args={[30, 14]} /><meshStandardMaterial color={wall} roughness={0.9} /></mesh>
    {/* cabinet + counter */}
    <mesh position={[2.3, 1.35, -0.7]} castShadow receiveShadow><boxGeometry args={[3.4, 2.7, 1.7]} /><meshStandardMaterial color="#5B3A22" roughness={0.6} /></mesh>
    {[1.45, 3.15].map((x) => <mesh key={x} position={[x, 1.35, 0.16]}><boxGeometry args={[1.5, 2.3, 0.04]} /><meshStandardMaterial color="#6B4529" roughness={0.5} /></mesh>)}
    <mesh position={[2.3, 2.78, -0.65]} castShadow receiveShadow><boxGeometry args={[3.7, 0.16, 1.95]} /><meshPhysicalMaterial color="#1B1D1F" roughness={0.2} metalness={0.3} clearcoat={1} /></mesh>
    {/* stove */}
    <mesh position={[2.2, 2.98, -0.6]} castShadow><boxGeometry args={[2.3, 0.22, 1.1]} /><meshStandardMaterial color="#C9CDD2" metalness={0.9} roughness={0.3} /></mesh>
    {[1.65, 2.75].map((x, i) => <group key={x} position={[x, 3.1, -0.6]}>
      <mesh><cylinderGeometry args={[0.3, 0.34, 0.06, 32]} /><meshStandardMaterial color="#2A2A2C" roughness={0.6} metalness={0.6} /></mesh>
      {i === 0 && flame > 0.02 && <Flame position={[0, 0.03, 0]} on={flame} />}
    </group>)}
    {children}
  </group>;
};
