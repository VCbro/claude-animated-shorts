import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { lerp } from "../kit/anim";
import { W, H } from "../kit/theme";

/**
 * Three looks for one object, so a reel can cut from "outside" to "inside":
 *   look="real"  realistic 3D: PBR wood + brass, room reflections, soft shadows on the ceiling, plaster room with a window.
 *   look="toon"  bright cartoon 3D: 3-step toon shading + black ink outline (inverted hull), painted room.
 *   look="xray"  dark technical 3D: see-through cyan shells + edge lines, glowing copper coils, transparent canvas
 *                (put <Ground/> + <GridFloor/> behind it).
 * Everything is driven by plain numbers (angle, blades, air, heat, coilPhase) so story.tsx animates it per frame.
 */
type V3 = [number, number, number];
export type Look = "real" | "toon" | "xray";
export const REAL = { blade: "#7A4A26", metal: "#B9925A", rod: "#8E7445", air: "#3FA9F5" };
export const XR = { cyan: "#38D9FF", glow: "#7DF9FF", copper: "#FF9A3C", hot: "#FF4B3A", bg: "#050D1C" };
export const TOON = { blade: "#FF7A3D", metal: "#FFD23F", rod: "#3B3B58", ink: "#17121F", air: "#FFFFFF" };
export const REAL_ROOMS = {
  day: { wall: "#D9CDB6", wall2: "#CFC2AA", ceil: "#F4F0E8", trim: "#FBF9F4", sky: "#CFE9FF", sun: "#FFF6D8", curtain: "#B9573F", key: "#FFE6C4", fill: "#BFD9FF" },
  warm: { wall: "#EBCB9C", wall2: "#E0BD8A", ceil: "#F7EEDC", trim: "#FBF6EA", sky: "#FFE3A6", sun: "#FFB45A", curtain: "#A8442F", key: "#FFD09A", fill: "#FFE8C8" },
  cold: { wall: "#C5D0DF", wall2: "#B8C4D5", ceil: "#EEF2F8", trim: "#F8FAFD", sky: "#DDE9F7", sun: "#FFFFFF", curtain: "#3F5788", key: "#DCE8FF", fill: "#BFD0F0" },
};
export const ROOMS = {
  day: { wall: "#49B6E6", wall2: "#3FA7D8", ceil: "#FFF3CF", trim: "#FFFFFF", sky: "#BDEEFF", sun: "#FFE27A", curtain: "#FF5A5F" },
  warm: { wall: "#FFB24A", wall2: "#F59A36", ceil: "#FFF1D0", trim: "#FFFFFF", sky: "#FFE9A8", sun: "#FF7A2E", curtain: "#D8433F" },
  cold: { wall: "#7C9CCB", wall2: "#6C8CBC", ceil: "#EEF4FF", trim: "#FFFFFF", sky: "#DCEBFF", sun: "#FFFFFF", curtain: "#3D5A99" },
};
export type RoomTone = keyof typeof ROOMS;

const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const inkMat = (w: number) => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: w } },
  vertexShader: "uniform float w; void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position+normalize(normal)*w,1.0); }",
  fragmentShader: "void main(){ gl_FragColor = vec4(0.09,0.07,0.12,1.0); }" });
const INK = inkMat(0.03), INK_THIN = inkMat(0.016);

// ── geometry (built once) ────────────────────────────────────────────────────
export const HUB_Y = -0.95;
const G = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.11); sh.bezierCurveTo(0.5, -0.2, 1.25, -0.24, 1.42, -0.1); sh.quadraticCurveTo(1.52, 0, 1.42, 0.1); sh.bezierCurveTo(1.25, 0.24, 0.5, 0.2, 0, 0.11); sh.closePath();
  const blade = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24 });
  blade.rotateX(-Math.PI / 2); blade.translate(0.52, 0, 0);
  const prof = [[0, -0.23], [0.14, -0.22], [0.3, -0.16], [0.44, -0.08], [0.46, 0], [0.44, 0.1], [0.3, 0.17], [0, 0.17]].map((p) => new THREE.Vector2(p[0], p[1]));
  const cone = new THREE.ConeGeometry(0.13, 0.34, 20); cone.rotateX(Math.PI);
  return {
    blade, hub: new THREE.LatheGeometry(prof, 48), canopy: new THREE.CylinderGeometry(0.1, 0.26, 0.2, 32), rod: new THREE.CylinderGeometry(0.045, 0.045, 0.7, 16),
    arm: new THREE.BoxGeometry(0.24, 0.04, 0.12), core: new THREE.CylinderGeometry(0.11, 0.11, 0.26, 24), coil: new THREE.TorusGeometry(0.062, 0.028, 10, 22),
    rotorRing: new THREE.TorusGeometry(0.4, 0.022, 8, 60), cone, tail: new THREE.CylinderGeometry(0.035, 0.035, 0.4, 10),
  };
})();
const EDGES = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();
const edges = (g: THREE.BufferGeometry) => { if (!EDGES.has(g)) EDGES.set(g, new THREE.EdgesGeometry(g, 25)); return EDGES.get(g)!; };

/** One solid in either look. */
const Part: React.FC<{ geo: THREE.BufferGeometry; look: Look; color: string; xcolor?: string; position?: V3; rotation?: V3; scale?: number | V3; ink?: boolean | "thin"; opacity?: number; fill?: number; metal?: number; rough?: number }> =
  ({ geo, look, color, xcolor = XR.cyan, position, rotation, scale, ink = true, opacity = 1, fill = 0.1, metal = 0, rough = 0.5 }) => (
    <group position={position} rotation={rotation} scale={scale}>
      {look === "real" ? <mesh geometry={geo} castShadow={opacity >= 1} receiveShadow>
        <meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={metal ? 0.3 : 0.55} clearcoatRoughness={0.25} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
      </mesh> : look === "toon" ? <>
        <mesh geometry={geo}><meshToonMaterial color={color} gradientMap={GRAD} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} /></mesh>
        {ink && opacity >= 1 && <mesh geometry={geo} material={ink === "thin" ? INK_THIN : INK} />}
      </> : <>
        <mesh geometry={geo}><meshBasicMaterial color={xcolor} transparent opacity={fill * opacity} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
        <lineSegments geometry={edges(geo)}><lineBasicMaterial color={xcolor} transparent opacity={0.85 * opacity} /></lineSegments>
      </>}
    </group>
  );

const useHalo = () => useMemo(() => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}, []);
const mix = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getHexString();

/**
 * Ceiling fan hanging from y=0, hub at HUB_Y, blade tips at r≈2.
 * angle: rotor angle (rad) · blades: 2-5 · blur: rad swept per frame (draws trailing ghost blades as motion blur)
 * xray only → coilPhase: rad, the rotating field (coils light up in turn) · power: 0..1 coil brightness · heat: 0..1 motor turns red
 */
export const Fan: React.FC<{ look: Look; blades?: number; angle?: number; blur?: number; coilPhase?: number; power?: number; heat?: number; bladeColor?: string }> =
  ({ look, blades = 3, angle = 0, blur = 0, coilPhase = 0, power = 1, heat = 0, bladeColor }) => {
    const halo = useHalo();
    const K = look === "real" ? REAL : TOON;
    const bc = bladeColor ?? K.blade;
    const xc = mix(XR.cyan, XR.hot, heat * 0.85);
    const ghosts = blur > 0.12 ? 3 : 0;
    const NC = 10;
    return (
      <group>
        <Part geo={G.canopy} look={look} color={K.metal} position={[0, -0.1, 0]} metal={0.75} rough={0.3} />
        <Part geo={G.rod} look={look} color={K.rod} position={[0, -0.5, 0]} ink="thin" metal={0.75} rough={0.35} />
        {look === "xray" && <group position={[0, HUB_Y, 0]}>
          <mesh geometry={G.core}><meshBasicMaterial color="#CFE8FF" /></mesh>
          {Array.from({ length: NC }).map((_, i) => {
            const a = (i / NC) * Math.PI * 2;
            const lit = Math.pow(Math.max(0, Math.cos(coilPhase - a) * 0.5 + 0.5), 5) * power;
            const col = mix(mix("#7A4A20", XR.copper, 0.35 + lit * 0.65), XR.hot, heat * 0.6);
            return <group key={i} position={[Math.cos(a) * 0.27, 0, -Math.sin(a) * 0.27]} rotation={[0, a, 0]}>
              <mesh geometry={G.coil} rotation={[0, Math.PI / 2, 0]}><meshBasicMaterial color={col} /></mesh>
              <sprite scale={[0.3 + lit * 0.5, 0.3 + lit * 0.5, 1]}><spriteMaterial map={halo} color={heat > 0.5 ? XR.hot : XR.copper} transparent opacity={0.15 + lit * 0.75} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>
            </group>;
          })}
          {heat > 0.05 && <sprite scale={[2.2 * heat + 0.6, 2.2 * heat + 0.6, 1]}><spriteMaterial map={halo} color={XR.hot} transparent opacity={0.55 * heat} depthWrite={false} blending={THREE.AdditiveBlending} /></sprite>}
        </group>}
        <group rotation={[0, angle, 0]} position={[0, HUB_Y, 0]}>
          <Part geo={G.hub} look={look} color={K.metal} xcolor={xc} fill={0.07} metal={0.75} rough={0.28} />
          {look === "xray" && <mesh geometry={G.rotorRing} rotation={[Math.PI / 2, 0, 0]}><meshBasicMaterial color={xc} transparent opacity={0.9} /></mesh>}
          {Array.from({ length: blades }).map((_, i) => (
            <group key={`${blades}-${i}`} rotation={[0, (i / blades) * Math.PI * 2, 0]}>
              <group rotation={[0.2, 0, 0]}>
                <Part geo={G.blade} look={look} color={bc} xcolor={xc} fill={0.14} rough={0.42} />
                <Part geo={G.arm} look={look} color={K.rod} xcolor={xc} position={[0.5, 0.01, 0]} ink="thin" metal={0.75} rough={0.35} />
              </group>
              {Array.from({ length: ghosts }).map((__, k) => (
                <group key={k} rotation={[0, -((k + 1) / (ghosts + 1)) * blur, 0]}><group rotation={[0.2, 0, 0]}>
                  <Part geo={G.blade} look={look} color={bc} xcolor={xc} opacity={look === "xray" ? 0.45 : 0.28} ink={false} fill={0.14} rough={0.42} />
                </group></group>
              ))}
            </group>
          ))}
        </group>
      </group>
    );
  };

/** Air pushed down by the blades: looping darts under the blade ring. air 0..1 = how much / how fast. */
export const Air: React.FC<{ look: Look; air: number; radius?: number; color?: string; at?: number }> = ({ look, air, radius = 1.15, color, at = 0 }) => {
  const f = useCurrentFrame() - at;
  if (air <= 0.02 || f < 0) return null;
  const streams = Math.round(3 + air * 5), per = 3, speed = 0.35 + air * 1.1, size = 0.55 + air * 0.75;
  const grow = Math.min(1, f / 8);
  const c = color ?? (look === "toon" ? TOON.air : look === "real" ? REAL.air : XR.glow);
  const soft = look === "real" ? 0.82 : 0.9;
  return <group>{Array.from({ length: streams }).flatMap((_, s) => {
    const a = (s / streams) * Math.PI * 2 + 0.4, x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    return Array.from({ length: per }).map((__, j) => {
      const p = ((f / 30) * speed + j / per + s * 0.137) % 1;
      const k = Math.sin(Math.PI * p) * grow * size;
      const spread = 1 + p * 0.28;
      return <group key={`${s}-${j}`} position={[x * spread, HUB_Y - 0.45 - p * (1.6 + air * 1.5), z * spread]} scale={k}>
        {look === "toon" ? <>
          <mesh geometry={G.cone}><meshBasicMaterial color={c} /></mesh><mesh geometry={G.cone} material={INK} />
          <mesh geometry={G.tail} position={[0, 0.34, 0]}><meshBasicMaterial color={c} /></mesh><mesh geometry={G.tail} position={[0, 0.34, 0]} material={INK} />
        </> : <>
          <mesh geometry={G.cone}><meshBasicMaterial color={c} transparent opacity={soft} depthWrite={false} /></mesh>
          <mesh geometry={G.tail} position={[0, 0.34, 0]} scale={[0.6, 1.4, 0.6]}><meshBasicMaterial color={c} transparent opacity={soft * 0.6} depthWrite={false} /></mesh>
        </>}
      </group>;
    });
  })}</group>;
};

/** Painted cartoon room seen from below: ceiling, two walls, a window with sun and curtains. */
export const Room: React.FC<{ tone?: RoomTone }> = ({ tone = "day" }) => {
  const P = ROOMS[tone];
  const flat = (c: string) => <meshBasicMaterial color={c} />;
  const box = useMemo(() => ({ frame: new THREE.BoxGeometry(3.3, 3.0, 0.14), bar: new THREE.BoxGeometry(0.1, 2.7, 0.16), sill: new THREE.BoxGeometry(3.7, 0.16, 0.4), cur: new THREE.BoxGeometry(0.75, 3.3, 0.12), rod: new THREE.CylinderGeometry(0.05, 0.05, 4.6, 10), plate: new THREE.CylinderGeometry(0.55, 0.55, 0.05, 40) }), []);
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[40, 40]} />{flat(P.ceil)}</mesh>
    <mesh position={[0, -10, -5]}><planeGeometry args={[40, 20]} />{flat(P.wall)}</mesh>
    <mesh position={[-7, -10, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[40, 20]} />{flat(P.wall2)}</mesh>
    <mesh position={[0, -0.14, -4.95]}><boxGeometry args={[40, 0.28, 0.1]} />{flat(P.trim)}</mesh>
    <mesh position={[0, -0.3, -4.93]}><boxGeometry args={[40, 0.05, 0.1]} />{flat(TOON.ink)}</mesh>
    <mesh geometry={box.plate} position={[0, -0.025, 0]}>{flat(P.trim)}</mesh><mesh geometry={box.plate} position={[0, -0.025, 0]} material={INK_THIN} />
    <group position={[-1.4, -3.9, -4.9]}>
      <mesh geometry={box.frame}>{flat(P.trim)}</mesh><mesh geometry={box.frame} material={INK} />
      <mesh position={[0, 0, 0.08]}><planeGeometry args={[2.9, 2.6]} />{flat(P.sky)}</mesh>
      <mesh position={[0.6, 0.45, 0.085]}><circleGeometry args={[tone === "cold" ? 0.3 : 0.55, 40]} />{flat(P.sun)}</mesh>
      {tone === "cold" && [[-0.9, 0.7], [-0.3, -0.2], [0.9, -0.6], [-1.0, -0.8], [0.2, 0.9], [1.1, 0.2], [-0.5, 0.3], [0.5, -0.9]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.09]}><circleGeometry args={[0.07, 12]} />{flat("#FFFFFF")}</mesh>)}
      <mesh geometry={box.bar} position={[0, 0, 0.06]}>{flat(P.trim)}</mesh>
      <mesh geometry={box.bar} position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.12, 1]}>{flat(P.trim)}</mesh>
      <mesh geometry={box.sill} position={[0, -1.58, 0.1]}>{flat(P.trim)}</mesh><mesh geometry={box.sill} position={[0, -1.58, 0.1]} material={INK_THIN} />
      {[-2.0, 2.0].map((x) => <group key={x} position={[x, -0.05, 0.16]}><mesh geometry={box.cur}>{flat(P.curtain)}</mesh><mesh geometry={box.cur} material={INK} /></group>)}
      <mesh geometry={box.rod} position={[0, 1.72, 0.2]} rotation={[0, 0, Math.PI / 2]}>{flat(TOON.rod)}</mesh>
    </group>
  </group>;
};

/** Realistic room seen from below: matte plaster ceiling and walls that catch the blade shadows, cornice, daylight window, curtains. */
export const RealRoom: React.FC<{ tone?: RoomTone }> = ({ tone = "day" }) => {
  const P = REAL_ROOMS[tone];
  const sky = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, P.sky); gr.addColorStop(1, "#FFFFFF"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [P.sky]);
  const wall = (c: string) => <meshStandardMaterial color={c} roughness={0.95} />;
  const paint = <meshStandardMaterial color={P.trim} roughness={0.5} />;
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} />{wall(P.ceil)}</mesh>
    <mesh position={[0, -10, -5]} receiveShadow><planeGeometry args={[40, 20]} />{wall(P.wall)}</mesh>
    <mesh position={[-7, -10, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[40, 20]} />{wall(P.wall2)}</mesh>
    <mesh position={[0, -0.13, -4.9]} castShadow receiveShadow><boxGeometry args={[40, 0.26, 0.2]} />{paint}</mesh>
    <mesh position={[-6.9, -0.13, 0]} castShadow receiveShadow><boxGeometry args={[0.2, 0.26, 40]} />{paint}</mesh>
    <mesh position={[0, -0.03, 0]} receiveShadow><cylinderGeometry args={[0.6, 0.66, 0.06, 48]} />{paint}</mesh>
    <group position={[-1.4, -3.9, -4.9]}>
      <mesh castShadow><boxGeometry args={[3.3, 3.0, 0.16]} />{paint}</mesh>
      <mesh position={[0, 0, 0.09]}><planeGeometry args={[2.9, 2.6]} /><meshBasicMaterial map={sky} toneMapped={false} /></mesh>
      <mesh position={[0.6, 0.5, 0.095]}><circleGeometry args={[tone === "cold" ? 0.28 : 0.5, 40]} /><meshBasicMaterial color={P.sun} toneMapped={false} /></mesh>
      {tone === "cold" && [[-0.9, 0.7], [-0.3, -0.2], [0.9, -0.6], [-1.0, -0.8], [0.2, 0.9], [1.1, 0.2], [-0.5, 0.3], [0.5, -0.9]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.1]}><circleGeometry args={[0.06, 12]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>)}
      <mesh position={[0, 0, 0.08]}><boxGeometry args={[0.09, 2.7, 0.16]} />{paint}</mesh>
      <mesh position={[0, 0, 0.08]}><boxGeometry args={[3.0, 0.09, 0.16]} />{paint}</mesh>
      <mesh position={[0, -1.58, 0.12]} castShadow><boxGeometry args={[3.7, 0.14, 0.42]} />{paint}</mesh>
      {[-2.05, 2.05].map((x) => <group key={x} position={[x, -0.05, 0.2]}>{[-0.27, -0.09, 0.09, 0.27].map((dx) => <mesh key={dx} position={[dx, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.11, 3.3, 14]} /><meshStandardMaterial color={P.curtain} roughness={0.9} /></mesh>)}</group>)}
      <mesh position={[0, 1.72, 0.22]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 5.2, 12]} /><meshStandardMaterial color={REAL.rod} metalness={0.7} roughness={0.35} /></mesh>
    </group>
  </group>;
};

const Rig: React.FC<{ real?: boolean; dur: number; from: V3; to: V3; look: V3; lookTo?: V3; fov: number }> = ({ real, dur, from, to, look, lookTo, fov }) => {
  const f = useCurrentFrame();
  const { camera, gl, scene } = useThree();
  useMemo(() => {
    gl.toneMapping = real ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping; gl.toneMappingExposure = 0.98;
    if (real) { scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.5; gl.shadowMap.type = THREE.PCFSoftShadowMap; }
  }, [gl, scene, real]);
  const k = lerp(f, [0, dur], [0, 1]);
  const p = from.map((v, i) => v + (to[i] - v) * k) as V3;
  const l = lookTo ? (look.map((v, i) => v + (lookTo[i] - v) * k) as V3) : look;
  camera.position.set(...p); camera.lookAt(...l);
  (camera as THREE.PerspectiveCamera).fov = fov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

/** Canvas + moving camera. Toon stages are opaque (use <Room/>), x-ray stages are transparent over the dark ground. */
export const Stage: React.FC<{ dur: number; look: Look; tone?: RoomTone; from: V3; to: V3; lookAt: V3; lookTo?: V3; fov?: number; children: React.ReactNode }> = ({ dur, look, tone = "day", from, to, lookAt, lookTo, fov = 46, children }) => (
  <ThreeCanvas width={W} height={H} shadows={look === "real"} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }} camera={{ fov, near: 0.05, far: 120, position: from }}>
    <Rig real={look === "real"} dur={dur} from={from} to={to} look={lookAt} lookTo={lookTo} fov={fov} />
    {look === "real" && <>
      <hemisphereLight args={["#FFF4E4", "#B9A68C", 0.9]} />
      <directionalLight position={[2.6, -6.5, 3.6]} intensity={2.6} color={REAL_ROOMS[tone].key} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={7} shadow-bias={-0.0004}
        shadow-camera-left={-4.5} shadow-camera-right={4.5} shadow-camera-top={4.5} shadow-camera-bottom={-4.5} shadow-camera-near={0.5} shadow-camera-far={20} />
      <pointLight position={[-3.2, -3.4, 2.2]} intensity={14} color={REAL_ROOMS[tone].fill} />
    </>}
    {look === "toon" && <><ambientLight intensity={1.5} /><directionalLight position={[3, -6, 5]} intensity={2.2} /></>}
    {children}
  </ThreeCanvas>
);
