import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { lerp } from "../kit/anim";
import { W, H } from "../kit/theme";

type V3 = [number, number, number];
const Rig: React.FC<{ dur: number; from: V3; to: V3; look: V3; lookTo?: V3; fov: number; exposure: number; env: number; fog?: [string, number, number] }> = ({ dur, from, to, look, lookTo, fov, exposure, env, fog }) => {
  const f = useCurrentFrame();
  const { camera, gl, scene } = useThree();
  useMemo(() => {
    gl.localClippingEnabled = true; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = exposure; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = env;
    scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  }, [gl, scene, exposure, env, fog?.join()]); // eslint-disable-line
  const k = lerp(f, [0, dur], [0, 1]);
  const p = from.map((v, i) => v + (to[i] - v) * k) as V3;
  const l = lookTo ? (look.map((v, i) => v + (lookTo[i] - v) * k) as V3) : look;
  camera.position.set(...p); camera.lookAt(...l);
  (camera as THREE.PerspectiveCamera).fov = fov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

/**
 * Low-key cinematic stage: no default lights (add 1 key + 1 rim + practical point lights as children), fog for depth,
 * low reflection level, slow push-in. Transparent canvas, so a CSS backdrop can sit behind it.
 */
export const CineStage: React.FC<{ dur: number; from: V3; to: V3; lookAt: V3; lookTo?: V3; fov?: number; exposure?: number; env?: number; fog?: [string, number, number]; shadows?: boolean; children: React.ReactNode }> =
  ({ dur, from, to, lookAt, lookTo, fov = 32, exposure = 1, env = 0.18, fog, shadows = true, children }) => (
    <ThreeCanvas width={W} height={H} shadows={shadows} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }} camera={{ fov, near: 0.05, far: 160, position: from }}>
      <Rig dur={dur} from={from} to={to} look={lookAt} lookTo={lookTo} fov={fov} exposure={exposure} env={env} fog={fog} />
      {children}
    </ThreeCanvas>
  );

/** Key light that throws window-blind stripes: a spot light with a striped cookie texture (nothing in the camera's way). */
export const BlindsLight: React.FC<{ position: V3; color?: string; intensity?: number; slats?: number }> = ({ position, color = "#9CC6FF", intensity = 2.2, slats = 7 }) => {
  const map = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!;
    g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512); g.filter = "blur(5px)"; g.fillStyle = "#fff";
    for (let i = 0; i < slats; i++) g.fillRect(40, 60 + i * (400 / slats), 432, (400 / slats) * 0.55);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [slats]);
  const d = Math.hypot(...position);
  return <spotLight position={position} color={color} intensity={intensity * d * d * 0.9} angle={0.5} penumbra={0.4} decay={2} map={map} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} />;
};
