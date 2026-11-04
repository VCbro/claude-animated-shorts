import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lerp, rng } from "../kit/anim";
import { W, H } from "../kit/theme";

/**
 * Real 3D product-shot studio (three.js in Remotion). Transparent canvas, so CSS <Bokeh/> behind it shows through.
 * Look: dark glossy "Blender product render" – PBR materials + RoomEnvironment reflections, one warm key,
 * one cool rim, soft contact shadow, slow smootherstep dolly. Software GL renders ~1-2 s/frame at 1080x1920.
 */
type V3 = [number, number, number];
const Rig: React.FC<{ dur: number; from: V3; to: V3; look: V3; lookTo?: V3; fov: number }> = ({ dur, from, to, look, lookTo, fov }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
    gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05;
  }, [gl, scene]);
  const k = lerp(f, [0, dur], [0, 1]);
  const p = from.map((v, i) => v + (to[i] - v) * k) as V3;
  const l = lookTo ? (look.map((v, i) => v + (lookTo[i] - v) * k) as V3) : look;
  camera.position.set(...p); camera.lookAt(...l);
  (camera as THREE.PerspectiveCamera).fov = fov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

export const Studio3D: React.FC<{ dur: number; from: V3; to: V3; look: V3; lookTo?: V3; fov?: number; warm?: boolean; children: React.ReactNode }> = ({ dur, from, to, look, lookTo, fov = 32, warm = true, children }) => (
  <ThreeCanvas width={W} height={H} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }} camera={{ fov, near: 0.05, far: 100, position: from }}>
    <Rig dur={dur} from={from} to={to} look={look} lookTo={lookTo} fov={fov} />
    <ambientLight intensity={0.08} />
    <directionalLight position={[2.5, 4, 3]} intensity={warm ? 2.2 : 1.6} color={warm ? "#FFD6A0" : "#E8F0FF"} />
    <directionalLight position={[-3, 2, -2]} intensity={1.4} color="#9CC4FF" />
    <pointLight position={[0, 1.2, 1.5]} intensity={1.2} distance={6} color={warm ? "#FFB35A" : "#C4F23C"} />
    {children}
  </ThreeCanvas>
);

/** Counter / table top with a soft radial contact shadow. */
export const Table: React.FC<{ y?: number; color?: string; size?: number }> = ({ y = 0, color = "#1b1f1e", size = 8 }) => {
  const shadow = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, "rgba(0,0,0,.75)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  }, []);
  return <group position={[0, y, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[size, 64]} /><meshStandardMaterial color={color} roughness={0.42} metalness={0.1} transparent opacity={0.96} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}><planeGeometry args={[1.6, 1.2]} /><meshBasicMaterial map={shadow} transparent depthWrite={false} /></mesh>
  </group>;
};

/** Draws into a canvas once and returns a texture. */
export const useCanvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[] = []) =>
  useMemo(() => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, deps); // eslint-disable-line

export const drawQR = (g: CanvasRenderingContext2D, x: number, y: number, size: number, seed = 7, ink = "#0A0D0C") => {
  const n = 25, r = rng(seed), m = size / n;
  const finder = (a: number, b: number) => (a < 7 && b < 7) || (a >= n - 7 && b < 7) || (a < 7 && b >= n - 7);
  g.fillStyle = ink;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (!finder(i, j) && r() > 0.52) g.fillRect(x + i * m, y + j * m, m * 0.96, m * 0.96);
  for (const [a, b] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    g.fillStyle = ink; g.fillRect(x + a * m, y + b * m, 7 * m, 7 * m);
    g.fillStyle = "#F3F5EF"; g.fillRect(x + (a + 1) * m, y + (b + 1) * m, 5 * m, 5 * m);
    g.fillStyle = ink; g.fillRect(x + (a + 2) * m, y + (b + 2) * m, 3 * m, 3 * m);
  }
};

/** Shop-counter QR standee (acrylic stand + printed card). */
export const QrStand: React.FC<{ position?: V3; rotY?: number; title?: string; seed?: number }> = ({ position = [0, 0, 0], rotY = 0, title = "SCAN & PAY", seed = 11 }) => {
  const tex = useCanvasTex(600, 840, (g) => {
    g.fillStyle = "#F3F5EF"; g.fillRect(0, 0, 600, 840);
    g.fillStyle = "#0A0D0C"; g.fillRect(0, 0, 600, 150);
    g.fillStyle = "#C4F23C"; g.font = "900 64px Inter, sans-serif"; g.textAlign = "center"; g.fillText(title, 300, 100);
    drawQR(g, 75, 200, 450, seed);
    g.fillStyle = "#0A0D0C"; g.font = "700 34px Inter, sans-serif"; g.fillText("UPI · any app", 300, 760);
  }, [title, seed]);
  const card = useMemo(() => new RoundedBoxGeometry(0.6, 0.84, 0.012, 4, 0.03), []);
  return <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.03, 0.05]}><boxGeometry args={[0.66, 0.06, 0.26]} /><meshStandardMaterial color="#202624" roughness={0.3} metalness={0.6} /></mesh>
    <group position={[0, 0.48, 0.02]} rotation={[-0.12, 0, 0]}>
      <mesh geometry={card}><meshStandardMaterial color="#ffffff" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.0075]}><planeGeometry args={[0.58, 0.82]} /><meshStandardMaterial map={tex} roughness={0.55} /></mesh>
      {/* acrylic sleeve */}
      <mesh position={[0, 0, 0.016]}><boxGeometry args={[0.64, 0.88, 0.004]} /><meshPhysicalMaterial color="#ffffff" transmission={0} transparent opacity={0.12} roughness={0.05} metalness={0} clearcoat={1} /></mesh>
    </group>
  </group>;
};

/** Hero phone in 3D: rounded slab, metal frame, screen texture from a draw function (redrawn when `key` changes). */
export const Phone3D: React.FC<{ position?: V3; rotation?: V3; draw: (g: CanvasRenderingContext2D) => void; drawKey?: string; glow?: string }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], draw, drawKey = "", glow }) => {
  const tex = useCanvasTex(540, 1170, draw, [drawKey]);
  const body = useMemo(() => new RoundedBoxGeometry(0.36, 0.76, 0.03, 6, 0.05), []);
  return <group position={position} rotation={rotation}>
    <mesh geometry={body}><meshPhysicalMaterial color="#1a1d1c" roughness={0.22} metalness={0.85} clearcoat={1} clearcoatRoughness={0.1} /></mesh>
    <mesh position={[0, 0, 0.0155]}><planeGeometry args={[0.33, 0.715]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    {glow && <mesh position={[0, 0, -0.02]}><planeGeometry args={[0.5, 0.9]} /><meshBasicMaterial color={glow} transparent opacity={0.12} /></mesh>}
  </group>;
};
