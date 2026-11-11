import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lerp } from "../kit/anim";
import { W, H } from "../kit/theme";

/**
 * A USB wall charger with its real insides, laid out the way a flyback (switch-mode) charger board is:
 *   AC pins → fuse → bridge rectifier → big 400 V capacitor → controller IC + MOSFET switch → yellow-taped
 *   ferrite transformer → output diode + capacitors → USB port, with an optocoupler across the isolation gap.
 * Built upright (pins at +y, USB at -y) so the current runs top → bottom in a vertical frame.
 * Numbers drive it: open (shell solid → glass), flow/upto (current dots), sw (switch blink), charge (capacitor glow),
 * heat (hot parts glow), shellHeat (outside glow), cheap (the fake: tan board, parts missing),
 * explode (0..1 exploded view: parts lift off the board, shell slides aside), cut (x of a clipping plane: cutaway shell).
 */
type V3 = [number, number, number];
export const CH = { hv: "#FF5A2A", lv: "#C4F23C", hot: "#FF3B1F", cyan: "#5FD8FF" };
const BZ = -0.185; // top surface of the board
// Component centres on the board (x, y).
export const AT = {
  pinL: [-0.2, 0.74], pinR: [0.2, 0.74], fuse: [-0.24, 0.52], bridge: [0.2, 0.5], coil: [-0.32, 0.3], cap: [0.0, 0.2], ic: [0.34, 0.22],
  fet: [0.3, -0.02], trafo: [-0.1, -0.2], opto: [0.32, -0.3], diode: [-0.3, -0.5], cap2: [0.02, -0.5], cap3: [0.24, -0.52], usb: [0, -0.6],
} as const;
const PATH = new THREE.CatmullRomCurve3(([AT.pinL, AT.fuse, AT.bridge, AT.cap, AT.fet, AT.trafo, AT.diode, AT.cap2, [0, -0.74]] as readonly (readonly number[])[]).map(([x, y]) => new THREE.Vector3(x, y, BZ + 0.36)), false, "catmullrom", 0.4);
/** Path position (0..1) of a component – use it for `upto`. */
export const U = (() => {
  const near = (p: readonly number[]) => { let b = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const q = PATH.getPointAt(i / 400); const d = (q.x - p[0]) ** 2 + (q.y - p[1]) ** 2; if (d < bd) { bd = d; b = i / 400; } } return b; };
  return { fuse: near(AT.fuse), bridge: near(AT.bridge), cap: near(AT.cap), fet: near(AT.fet), trafo: near(AT.trafo), diode: near(AT.diode), usb: 1 };
})();

const useHalo = () => useMemo(() => {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}, []);

/** Board artwork: solder mask, copper traces between the parts, pads, the isolation slot, white silk outlines. */
const usePcb = (cheap: boolean) => useMemo(() => {
  const w = 704, h = 1008, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!;
  const X = (x: number) => (x / 0.88 + 0.5) * w, Y = (y: number) => (0.5 - y / 1.26) * h;
  g.fillStyle = cheap ? "#B98F52" : "#17633A"; g.fillRect(0, 0, w, h);
  g.strokeStyle = cheap ? "#C9A46A" : "#2C8A55"; g.lineCap = "round"; g.lineJoin = "round";
  const tr = (pts: readonly (readonly number[])[], lw: number) => { g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); };
  tr([AT.pinL, [-0.36, 0.62], AT.fuse, [-0.05, 0.56], AT.bridge], 16); tr([AT.pinR, [0.3, 0.62], AT.bridge], 16);
  tr([AT.bridge, [0.2, 0.36], [0.0, 0.36], AT.cap], 22); tr([AT.cap, [0.0, 0.02], AT.fet], 22); tr([AT.ic, AT.fet], 9); tr([AT.fet, [0.12, -0.12], AT.trafo], 22);
  tr([AT.trafo, [-0.3, -0.38], AT.diode], 26); tr([AT.diode, [-0.14, -0.58], AT.cap2, AT.cap3], 24); tr([AT.cap2, AT.usb], 26); tr([AT.opto, [0.36, -0.44], AT.cap3], 8); tr([AT.opto, [0.38, -0.1], AT.ic], 8);
  for (let i = 0; i < 26; i++) { g.lineWidth = 3; g.globalAlpha = 0.5; const x = -0.4 + ((i * 37) % 80) / 100, y = -0.6 + ((i * 53) % 120) / 100; tr([[x, y], [x + 0.06, y], [x + 0.06, y - 0.05]], 3); g.globalAlpha = 1; }
  if (!cheap) { g.fillStyle = "#0B2A1A"; g.beginPath(); g.roundRect(X(0.06), Y(-0.33), X(0.4) - X(0.06), 12, 6); g.fill(); g.beginPath(); g.roundRect(X(0.1), Y(-0.38), 12, Y(-0.62) - Y(-0.38), 6); g.fill(); }
  g.fillStyle = "#D7DCE0"; Object.values(AT).forEach(([x, y]) => [[-0.05, 0], [0.05, 0]].forEach(([dx]) => { g.beginPath(); g.arc(X(x + dx), Y(y - 0.07), 7, 0, 7); g.fill(); }));
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 3;
  ([[AT.bridge, 0.26, 0.2], [AT.cap, 0.5, 0.32], [AT.fet, 0.2, 0.28], [AT.trafo, 0.52, 0.46], [AT.diode, 0.18, 0.24], [AT.ic, 0.18, 0.15]] as const).forEach(([[x, y], a, b]) => g.strokeRect(X(x - a / 2), Y(y + b / 2), (a / 0.88) * w, (b / 1.26) * h));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}, [cheap]);

const GEO = (() => ({ shell: new RoundedBoxGeometry(1.0, 1.4, 0.62, 6, 0.11), plate: new RoundedBoxGeometry(2.1, 2.1, 0.1, 4, 0.08), plug: new RoundedBoxGeometry(0.3, 0.14, 0.34, 3, 0.04) }))();
const SHELL_EDGES = new THREE.EdgesGeometry(GEO.shell, 30);
const mixc = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getHexString();

/** 0..1: every part with a `lift` rises off the board by lift × explode (exploded view). */
const Ex = React.createContext(0);
const Box: React.FC<{ lift?: number; at: readonly number[]; size: V3; color: string; z?: number; rough?: number; metal?: number; glow?: string; glowK?: number }> = ({ lift = 0, at, size, color, z = 0, rough = 0.55, metal = 0, glow = "#000000", glowK = 0 }) => (
  <mesh position={[at[0], at[1], BZ + z + size[2] / 2 + lift * React.useContext(Ex)]} castShadow><boxGeometry args={size} /><meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={0.3} emissive={glow} emissiveIntensity={glowK} /></mesh>
);
/** Cylinder lying along `axis` (x or z) sitting on the board. */
const Cyl: React.FC<{ lift?: number; at: readonly number[]; r: number; len: number; axis?: "x" | "z"; color: string; z?: number; rough?: number; metal?: number; glow?: string; glowK?: number; children?: React.ReactNode }> = ({ lift = 0, at, r, len, axis = "x", color, z = 0, rough = 0.45, metal = 0, glow = "#000000", glowK = 0, children }) => (
  <group position={[at[0], at[1], BZ + z + (axis === "x" ? r : len / 2) + lift * React.useContext(Ex)]} rotation={axis === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
    <mesh castShadow><cylinderGeometry args={[r, r, len, 32]} /><meshPhysicalMaterial color={color} roughness={rough} metalness={metal} clearcoat={0.5} emissive={glow} emissiveIntensity={glowK} /></mesh>
    {children}
  </group>
);

export type ChargerP = { explode?: number; cut?: number; open?: number; flow?: number; upto?: number; sw?: number; charge?: number; heat?: number; shellHeat?: number; cheap?: boolean };
export const Charger: React.FC<ChargerP & { position?: V3; rotation?: V3; scale?: number }> = ({ explode = 0, cut, open = 0, flow = 0, upto = 1, sw = 0, charge = 0, heat = 0, shellHeat = 0, cheap = false, position, rotation, scale }) => {
  const f = useCurrentFrame();
  const halo = useHalo(), pcb = usePcb(cheap);
  const k = cheap ? 0.72 : 1;
  const Glow = ({ at, color, s, o, z = 0.4 }: { at: readonly number[]; color: string; s: number; o: number; z?: number }) => o > 0.01 ? (
    <sprite position={[at[0], at[1], BZ + z]} scale={[s, s, 1]}><spriteMaterial map={halo} color={color} transparent opacity={Math.min(1, o)} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} /></sprite>
  ) : null;
  const n = Math.round(10 + flow * 30), speed = 0.1 + flow * 0.3;
  return (
    <group position={position} rotation={rotation} scale={scale}><Ex.Provider value={explode}>
      {/* board */}
      <mesh position={[0, 0, BZ - 0.016]}><boxGeometry args={[0.88, 1.26, 0.03]} /><meshStandardMaterial color={cheap ? "#8E6B3A" : "#0F4A2A"} roughness={0.6} /></mesh>
      <mesh position={[0, 0, BZ]}><planeGeometry args={[0.88, 1.26]} /><meshPhysicalMaterial map={pcb} roughness={0.38} clearcoat={0.6} clearcoatRoughness={0.3} /></mesh>
      {/* AC pins (brass) + leads down to the board */}
      {[AT.pinL, AT.pinR].map((p, i) => <group key={i} position={[0, 0.55 * explode, 0]}>
        <mesh position={[p[0], 0.93, 0]} castShadow><cylinderGeometry args={[0.048, 0.048, 0.46, 24]} /><meshStandardMaterial color="#D9B25A" metalness={0.95} roughness={0.22} /></mesh>
        <mesh position={[p[0], 0.69, BZ / 2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.014, 0.014, 0.2, 8]} /><meshStandardMaterial color="#C8CCD0" metalness={0.9} roughness={0.3} /></mesh>
      </group>)}
      {!cheap && <Cyl lift={0.5} at={AT.fuse} r={0.036} len={0.2} color="#D9CFB4" z={0.02}><mesh><cylinderGeometry args={[0.038, 0.038, 0.03, 20]} /><meshStandardMaterial color="#B8442E" /></mesh></Cyl>}
      <Box lift={0.7} at={AT.bridge} size={[0.22, 0.15, 0.075]} color="#18181B" rough={0.35} />
      {!cheap && <Cyl lift={0.45} at={AT.coil} r={0.075} len={0.1} axis="z" color="#2A2A2E"><mesh><cylinderGeometry args={[0.082, 0.082, 0.07, 28]} /><meshStandardMaterial color="#C8742C" metalness={0.8} roughness={0.35} /></mesh></Cyl>}
      {/* the big 400 V electrolytic capacitor */}
      <Cyl lift={1.0} at={AT.cap} r={0.14 * k} len={0.44 * k} color="#1D2B52" glow={CH.cyan} glowK={charge * 0.22}>
        <mesh position={[0, 0.06 * k, 0]}><cylinderGeometry args={[0.142 * k, 0.142 * k, 0.07 * k, 32, 1, true, 0, 1.3]} /><meshStandardMaterial color="#D5DAE2" roughness={0.5} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.221 * k, 0]}><cylinderGeometry args={[0.128 * k, 0.128 * k, 0.004, 32]} /><meshStandardMaterial color="#C9CDD2" metalness={0.9} roughness={0.3} /></mesh>
      </Cyl>
      <Box lift={0.55} at={AT.ic} size={[0.14, 0.1, 0.035]} color="#151517" rough={0.3} />
      {/* MOSFET switch with its metal tab */}
      <Box lift={0.75} at={AT.fet} size={[0.13, 0.17, 0.05]} color="#161618" rough={0.3} glow={heat > 0.05 ? CH.hot : CH.lv} glowK={Math.max(heat * 0.9, sw * 1.2)} />
      <Box lift={0.75} at={[AT.fet[0], AT.fet[1] + 0.115]} size={[0.13, 0.06, 0.018]} color="#C4C8CC" metal={0.9} rough={0.3} />
      {/* flyback transformer: ferrite core + yellow tape over the windings */}
      <group scale={[k, k, k]} position={[AT.trafo[0] * (1 - k), AT.trafo[1] * (1 - k), BZ * (1 - k) + 1.25 * explode]}>
        <Box at={AT.trafo} size={[0.5, 0.42, 0.03]} color="#111113" />
        <Box at={AT.trafo} size={[0.46, 0.34, 0.3]} color="#2C2C31" z={0.03} rough={0.7} glow={CH.hot} glowK={heat * 0.35} />
        <Box at={AT.trafo} size={[0.3, 0.39, 0.33]} color="#F0BF2C" z={0.02} rough={0.42} glow={CH.hot} glowK={heat * 0.45} />
        <Box at={[AT.trafo[0], AT.trafo[1] - 0.2]} size={[0.26, 0.012, 0.24]} color="#C8742C" z={0.06} metal={0.8} rough={0.4} />
      </group>
      {!cheap && <Box lift={0.5} at={AT.opto} size={[0.09, 0.13, 0.05]} color="#E9E6DC" rough={0.4} />}
      <Box lift={0.7} at={AT.diode} size={[0.12, 0.16, 0.05]} color="#161618" rough={0.3} glow={CH.hot} glowK={heat * 0.8} />
      <Box lift={0.7} at={[AT.diode[0], AT.diode[1] + 0.11]} size={[0.12, 0.055, 0.018]} color="#C4C8CC" metal={0.9} rough={0.3} />
      <Cyl lift={0.85} at={AT.cap2} r={0.078 * k} len={0.2} axis="z" color="#26262A"><mesh position={[0, 0.101, 0]}><cylinderGeometry args={[0.07 * k, 0.07 * k, 0.004, 24]} /><meshStandardMaterial color="#C9CDD2" metalness={0.9} roughness={0.3} /></mesh></Cyl>
      {!cheap && <Cyl lift={0.6} at={AT.cap3} r={0.05} len={0.16} axis="z" color="#3A2E1A"><mesh position={[0, 0.081, 0]}><cylinderGeometry args={[0.044, 0.044, 0.004, 20]} /><meshStandardMaterial color="#C9CDD2" metalness={0.9} roughness={0.3} /></mesh></Cyl>}
      {/* USB-A port */}
      <Box lift={0.35} at={AT.usb} size={[0.32, 0.26, 0.15]} color="#C9CDD2" metal={0.95} rough={0.25} />
      <Box lift={0.35} at={[AT.usb[0], AT.usb[1] - 0.02]} size={[0.24, 0.2, 0.04]} color="#F4F4F0" z={0.055} />

      {/* glows: capacitor charge, switch, heat */}
      <Glow at={AT.cap} color={CH.cyan} s={0.8} o={charge * 0.3} />
      <Glow at={AT.fet} color={CH.lv} s={0.5} o={sw * 0.9} />
      <Glow at={AT.fet} color={CH.hot} s={0.4 + heat * 0.7} o={heat * 0.9} />
      <Glow at={AT.trafo} color={CH.hot} s={0.6 + heat * 0.9} o={heat * 0.75} />
      <Glow at={AT.diode} color={CH.hot} s={0.35 + heat * 0.6} o={heat * 0.85} />
      {/* current: dots along the path, orange on the 230 V side, lime after the transformer */}
      {flow > 0.02 && Array.from({ length: n }).map((_, i) => {
        const u = (i / n + (f / 30) * speed) % 1;
        if (u > upto) return null;
        const p = PATH.getPointAt(u), hv = u < U.trafo, s = (hv ? 0.11 : 0.085) * (0.8 + flow * 0.4);
        return <sprite key={i} position={[p.x, p.y, p.z]} scale={[s, s, 1]}><spriteMaterial map={halo} color={hv ? CH.hv : CH.lv} transparent opacity={0.95} depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} /></sprite>;
      })}

      {/* shell: white plastic that turns to glass */}
      <mesh geometry={GEO.shell} position={[1.35 * explode, 0, 0.01 + 0.5 * explode]} rotation={[0, -0.5 * explode, 0]} castShadow={open < 0.3} renderOrder={5}>
        <meshPhysicalMaterial side={cut === undefined ? THREE.FrontSide : THREE.DoubleSide} clippingPlanes={cut === undefined ? [] : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), cut)]} color={mixc("#F4F3EE", "#BFE9FF", open)} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} transparent opacity={lerp(open, [0, 1], [1, 0.07])} depthWrite={open < 0.02}
          emissive={CH.hot} emissiveIntensity={shellHeat * 0.42} />
      </mesh>
      {open > 0.3 && <lineSegments geometry={SHELL_EDGES} position={[0, 0, 0.01]}><lineBasicMaterial color="#9FE3FF" transparent opacity={0.55 * open} /></lineSegments>}
      <Glow at={[0, 0]} color={CH.hot} s={1.9 + shellHeat * 0.5} o={shellHeat * 0.26} z={0.5} />
    </Ex.Provider></group>
  );
};

/** Wall + switchboard plate + the charger plugged in + its cable (outside shots). */
export const WallSetup: React.FC<ChargerP & { wall?: string }> = ({ wall = "#C9BEA6", ...p }) => {
  const cable = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 1.72), new THREE.Vector3(0, -0.12, 2.15), new THREE.Vector3(0.05, -1.2, 2.3), new THREE.Vector3(0.25, -2.7, 2.1), new THREE.Vector3(0.5, -5, 1.9)]), 60, 0.045, 12), []);
  const white = <meshPhysicalMaterial color="#F4F3EE" roughness={0.3} clearcoat={0.8} />;
  return <group>
    <mesh receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial color={wall} roughness={0.95} /></mesh>
    <mesh geometry={GEO.plate} position={[0.3, 0.05, 0.05]} castShadow receiveShadow>{white}</mesh>
    <group position={[0.92, 0.2, 0.1]}>
      <mesh rotation={[0.16, 0, 0]} position={[0, 0, 0.03]} castShadow><boxGeometry args={[0.34, 0.6, 0.08]} />{white}</mesh>
      <mesh position={[0, 0.2, 0.09]}><circleGeometry args={[0.035, 20]} /><meshBasicMaterial color="#FF3B1F" toneMapped={false} /></mesh>
    </group>
    {[[0.92, -0.5], [0.3, -0.75], [0.3, 0.85]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.101]}><circleGeometry args={[0.035, 16]} /><meshStandardMaterial color="#9A9A96" metalness={0.6} roughness={0.4} /></mesh>)}
    <Charger {...p} position={[0, 0, 0.8]} rotation={[-Math.PI / 2, 0, 0]} />
    <mesh geometry={GEO.plug} position={[0, 0, 1.6]} castShadow>{white}</mesh>
    <mesh geometry={cable} castShadow>{white}</mesh>
  </group>;
};

const Rig: React.FC<{ exposure: number; dur: number; from: V3; to: V3; look: V3; lookTo?: V3; fov: number }> = ({ exposure, dur, from, to, look, lookTo, fov }) => {
  const f = useCurrentFrame();
  const { camera, gl, scene } = useThree();
  useMemo(() => {
    gl.localClippingEnabled = true; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = exposure; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  }, [gl, scene]);
  const k = lerp(f, [0, dur], [0, 1]);
  const p = from.map((v, i) => v + (to[i] - v) * k) as V3;
  const l = lookTo ? (look.map((v, i) => v + (lookTo[i] - v) * k) as V3) : look;
  camera.position.set(...p); camera.lookAt(...l);
  (camera as THREE.PerspectiveCamera).fov = fov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  return null;
};

/** mode="wall": daylight room with shadows on the wall. mode="studio": transparent canvas over the dark ground, product lighting. */
export const CStage: React.FC<{ dur: number; mode: "wall" | "studio"; from: V3; to: V3; lookAt: V3; lookTo?: V3; fov?: number; children: React.ReactNode }> = ({ dur, mode, from, to, lookAt, lookTo, fov = 30, children }) => (
  <ThreeCanvas width={W} height={H} shadows={mode === "wall"} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }} camera={{ fov, near: 0.05, far: 120, position: from }}>
    <Rig exposure={mode === "wall" ? 0.8 : 1} dur={dur} from={from} to={to} look={lookAt} lookTo={lookTo} fov={fov} />
    {mode === "wall" ? <>
      <hemisphereLight args={["#FFF6E8", "#B9A68C", 0.6]} />
      <directionalLight position={[-3.5, 4.5, 6]} intensity={2.4} color="#FFE9CC" castShadow shadow-mapSize={[2048, 2048]} shadow-radius={8} shadow-bias={-0.0004}
        shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-6} shadow-camera-near={0.5} shadow-camera-far={24} />
      <pointLight position={[3, -1, 4]} intensity={10} color="#CFE2FF" />
    </> : <>
      <hemisphereLight args={["#FFFFFF", "#22303C", 0.75]} />
      <directionalLight position={[2, 3, 5]} intensity={2.3} color="#FFF1DC" />
      <directionalLight position={[-3, 1, -2]} intensity={1.3} color="#8FC4FF" />
      <pointLight position={[-1.5, -1, 2.5]} intensity={5} color="#BFE0FF" />
    </>}
    {children}
  </ThreeCanvas>
);
