import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { lerp, rng } from "../kit/anim";

/**
 * Our own generic jet airliner (no real livery) + a fuselage skin panel with a window cut-out
 * that visualises stress (heat-map + stress lines), a growing fatigue crack and a split.
 * Fuselage runs along +X. Units: metres-ish (length 6).
 */
type V3 = [number, number, number];

// ── window outline: square-ish (tight corners) or round (oval). Centered at 0, w x h.
export const windowShape = (w: number, h: number, round: boolean, rc = 0.08) => {
  const s = new THREE.Shape();
  if (round) { s.absellipse(0, 0, w / 2, h / 2, 0, Math.PI * 2, false, 0); return s; }
  const x = -w / 2, y = -h / 2, r = Math.min(rc * w, w / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

const R = 0.34, LEN = 6;
const profile = () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) { // nose 0..0.9
    const t = i / 40; pts.push(new THREE.Vector2(R * Math.sqrt(1 - Math.pow(1 - t, 2.2)) + 0.0001, t * 0.9));
  }
  pts.push(new THREE.Vector2(R, 4.6));
  for (let i = 1; i <= 20; i++) { // tail cone 4.6..6, rising
    const t = i / 20; pts.push(new THREE.Vector2(R * (1 - 0.82 * Math.pow(t, 1.3)), 4.6 + t * 1.4));
  }
  return pts;
};

/** Generic airliner. `inflate` 0-1 swells the cabin, `stress` 0-1 shows red hoop rings, `round` window style. */
export const Airliner3D: React.FC<{ position?: V3; rotation?: V3; inflate?: number; stress?: number; round?: boolean; shake?: number; nightGlow?: number }> = ({ position = [0, 0, 0], rotation = [0, 0, 0], inflate = 0, stress = 0, round = true, shake = 0, nightGlow = 1 }) => {
  const f = useCurrentFrame();
  const body = useMemo(() => { const g = new THREE.LatheGeometry(profile(), 64); g.rotateZ(-Math.PI / 2); return g; }, []);
  const wing = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.95, 0); s.lineTo(1.75, -2.6); s.lineTo(1.4, -2.6); s.lineTo(-0.05, -0.05);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2 });
    g.rotateX(Math.PI / 2); return g;
  }, []);
  const fin = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.75, 0); s.lineTo(1.05, 0.95); s.lineTo(0.8, 0.95); s.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.015, bevelSegments: 2 });
  }, []);
  const tailplane = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.5, 0); s.lineTo(0.85, -0.95); s.lineTo(0.65, -0.95); s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g;
  }, []);
  const win = useMemo(() => new THREE.ShapeGeometry(windowShape(0.07, round ? 0.1 : 0.085, round, 0.08)), [round]);
  const winMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a2430", emissive: "#FFB867", emissiveIntensity: 0.9 * nightGlow, roughness: 0.2, metalness: 0.3 }), [nightGlow]);
  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#dfe3e4", metalness: 0.75, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 }), []);
  const k = 1 + 0.06 * inflate;
  const n = 30, blink = Math.floor(f / 12) % 3 === 0;
  const jx = shake ? (Math.sin(f * 2.1) * 0.02 * shake) : 0, jy = shake ? Math.cos(f * 2.7) * 0.02 * shake : 0;
  const ws = useMemo(() => Array.from({ length: n }, (_, i) => 1.1 + i * 0.105), []);
  return (
    <group position={[position[0] + jx, position[1] + jy, position[2]]} rotation={rotation}><group position={[-LEN / 2, 0, 0]}>
      <group scale={[1, k, k]}>
        <mesh geometry={body} material={skin} />
        {/* lime cheat-line + dark belly band */}
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[2.75, 0, 0]}><cylinderGeometry args={[R * 1.004, R * 1.004, 3.7, 64, 1, true, Math.PI * 0.42, Math.PI * 0.16]} /><meshStandardMaterial color="#C4F23C" emissive="#C4F23C" emissiveIntensity={0.25} side={THREE.DoubleSide} /></mesh>
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[2.75, 0, 0]}><cylinderGeometry args={[R * 1.004, R * 1.004, 3.7, 64, 1, true, Math.PI * 1.42, Math.PI * 0.16]} /><meshStandardMaterial color="#C4F23C" emissive="#C4F23C" emissiveIntensity={0.25} side={THREE.DoubleSide} /></mesh>
        {/* windows, both sides */}
        {ws.map((x, i) => [1, -1].map((sd) => <mesh key={`${i}${sd}`} geometry={win} material={winMat} position={[x, 0.07, sd * R * 1.006]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]} />))}
        {/* cockpit */}
        {[-1, 1].map((sd) => <mesh key={sd} position={[0.42, 0.13, sd * 0.2]} rotation={[0, sd * 0.9, -0.3]}><boxGeometry args={[0.13, 0.06, 0.005]} /><meshStandardMaterial color="#0b1016" roughness={0.1} metalness={0.6} /></mesh>)}
        {/* stress hoop rings */}
        {stress > 0 && Array.from({ length: 9 }).map((_, i) => <mesh key={i} position={[1.2 + i * 0.4, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[R * 1.03, 0.012, 8, 64]} /><meshBasicMaterial color="#FF4A33" transparent opacity={stress * (0.55 + 0.45 * Math.sin(f / 3 + i))} /></mesh>)}
      </group>
      {/* wings (left / right) */}
      <mesh geometry={wing} material={skin} position={[2.2, -0.12, R * 0.6]} />
      <mesh geometry={wing} material={skin} position={[2.2, -0.12 + 0.05, -R * 0.6]} scale={[1, -1, -1]} />
      {/* engines under wings */}
      {[[2.35, -0.3, 0.95], [2.35, -0.3, -0.95], [2.85, -0.27, 1.65], [2.85, -0.27, -1.65]].map((p, i) => (
        <group key={i} position={p as V3}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.11, 0.09, 0.55, 32]} /><meshPhysicalMaterial color="#c9ced0" metalness={0.85} roughness={0.25} clearcoat={0.5} /></mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} position={[-0.276, 0, 0]}><circleGeometry args={[0.1, 32]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[0.08, 0.13, 0]}><boxGeometry args={[0.3, 0.12, 0.03]} /><meshStandardMaterial color="#b6bcbe" metalness={0.8} roughness={0.3} /></mesh>
        </group>
      ))}
      {/* tail */}
      <mesh geometry={fin} material={skin} position={[4.95, 0.2, -0.02]} />
      <mesh position={[5.3, 0.62, 0.0]}><boxGeometry args={[0.35, 0.3, 0.05]} /><meshStandardMaterial color="#C4F23C" emissive="#C4F23C" emissiveIntensity={0.3} /></mesh>
      <mesh geometry={tailplane} material={skin} position={[5.05, 0.12, 0.05]} />
      <mesh geometry={tailplane} material={skin} position={[5.05, 0.15, -0.05]} scale={[1, -1, -1]} />
      {/* nav lights */}
      <mesh position={[3.95, -0.12, 2.63]}><sphereGeometry args={[0.03, 12, 12]} /><meshBasicMaterial color="#38ff6a" /></mesh>
      <mesh position={[3.95, -0.12, -2.63]}><sphereGeometry args={[0.03, 12, 12]} /><meshBasicMaterial color="#ff3b30" /></mesh>
      {blink && <pointLight position={[3.0, 0.45, 0]} intensity={1.2} distance={2} color="#ffffff" />}
      {blink && <mesh position={[3.0, R + 0.03, 0]}><sphereGeometry args={[0.025, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>}
    </group></group>
  );
};

// ── stress colour map (calm blue → lime → amber → red)
const ramp = (v: number): [number, number, number] => {
  const stops: [number, number[]][] = [[0, [16, 40, 70]], [0.35, [40, 120, 110]], [0.55, [196, 242, 60]], [0.75, [255, 176, 64]], [1, [255, 60, 40]]];
  v = Math.max(0, Math.min(1, v));
  for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i]; const t = (v - a) / (b - a);
    return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t];
  }
  return [255, 60, 40];
};

/** Draw the skin panel texture: brushed metal + rivet rows, stress heat-map (`heat` 0-1), moving stress lines,
 *  window hole outline, crack from the top-right corner (`crack` 0-1). Panel UV space 1:1 (square). */
const drawPanel = (g: CanvasRenderingContext2D, S: number, opt: { round: boolean; heat: number; lines: number; crack: number; t: number; ww: number; wh: number; cx: number; cy: number }) => {
  const { round, heat, lines, crack, t, ww, wh, cx, cy } = opt;
  // metal base
  g.fillStyle = "#9aa1a4"; g.fillRect(0, 0, S, S);
  const r = rng(3);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(0, r() * S, S, 1 + r() * 2); }
  // heat map (low-res field, then scaled)
  if (heat > 0) {
    const N = 96, img = g.createImageData(N, N);
    const hw = ww / 2, hh = wh / 2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N - cx, y = (j + 0.5) / N - cy;
      let v: number;
      if (round) {
        const d = Math.sqrt((x / hw) ** 2 + (y / hh) ** 2); // 1 at edge
        v = 0.3 + 0.28 * Math.exp(-(d - 1) * 3.2);
      } else {
        let c = 0; for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const dx = x - sx * hw, dy = y - sy * hh; c += Math.exp(-Math.sqrt(dx * dx + dy * dy) / 0.05); }
        v = 0.22 + 1.1 * c;
      }
      const inside = round ? (x / hw) ** 2 + (y / hh) ** 2 < 1 : Math.abs(x) < hw && Math.abs(y) < hh;
      const [rr, gg, bb] = ramp(v * heat + 0.05);
      const o = (j * N + i) * 4; img.data[o] = rr; img.data[o + 1] = gg; img.data[o + 2] = bb; img.data[o + 3] = inside ? 0 : Math.round(200 * heat);
    }
    const c2 = document.createElement("canvas"); c2.width = c2.height = N; c2.getContext("2d")!.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true; g.drawImage(c2, 0, 0, S, S);
  }
  // stress lines: horizontal hoop lines bending around the hole, dashes flowing
  if (lines > 0) {
    g.lineWidth = S * 0.004; g.setLineDash([S * 0.02, S * 0.014]); g.lineDashOffset = -t * S * 0.006;
    for (let k = 0; k < 15; k++) {
      const y0 = (k + 0.5) / 15; g.beginPath();
      for (let i = 0; i <= 80; i++) {
        const x = i / 80, dx = (x - cx) / (ww * 0.9), dy0 = y0 - cy;
        const near = Math.exp(-dx * dx * 3);
        const lim = wh / 2 + 0.03; let y = y0;
        if (Math.abs(dy0) < lim + 0.12) { const push = (lim + 0.12 - Math.abs(dy0)) * near * (round ? 1 : 0.85); y = y0 + Math.sign(dy0 || 1) * push; }
        i ? g.lineTo(x * S, y * S) : g.moveTo(x * S, y * S);
      }
      g.strokeStyle = `rgba(255,255,255,${0.55 * lines})`; g.stroke();
    }
    g.setLineDash([]);
  }
  // rivets
  g.fillStyle = "rgba(40,44,46,.55)";
  for (let k = 0; k < 6; k++) for (let i = 0; i < 40; i++) { const y = [0.06, 0.94, 0.5 - wh / 2 - 0.09, 0.5 + wh / 2 + 0.09, 0.2, 0.8][k]; g.beginPath(); g.arc((i + 0.5) / 40 * S, y * S, S * 0.0035, 0, 7); g.fill(); }
  // window frame shadow
  g.save(); g.translate(cx * S, cy * S);
  g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = S * 0.012;
  const p = new Path2D(); const w = ww * S, h = wh * S;
  if (round) p.ellipse(0, 0, w / 2 + 6, h / 2 + 6, 0, 0, 7); else p.rect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
  g.stroke(p); g.restore();
  // crack from the top-right corner straight up (and bottom-right down), jagged, glowing
  if (crack > 0 && !round) {
    const x0 = (cx + ww / 2) * S, yT = (cy - wh / 2) * S, yB = (cy + wh / 2) * S;
    const jag = (from: number, to: number) => { const rr = rng(9); g.beginPath(); g.moveTo(x0, from); const n = 30; for (let i = 1; i <= n; i++) { const yy = from + (to - from) * (i / n) * crack; g.lineTo(x0 + (rr() - 0.5) * S * 0.014, yy); } g.stroke(); };
    g.strokeStyle = "rgba(255,90,60,.55)"; g.lineWidth = S * 0.02; jag(yT, 0); jag(yB, S);
    g.strokeStyle = "#fff6e8"; g.lineWidth = S * 0.005; jag(yT, 0); jag(yB, S);
  }
};

/**
 * Close-up fuselage skin panel with a window. heat/lines/crack drive the texture; split 0-1 tears the panel
 * apart along the crack (right side flies off) with debris. Faces +Z, 2 x 2 units, centred at origin.
 */
export const SkinPanel3D: React.FC<{ round: boolean; heat?: number; lines?: number; crack?: number; split?: number; position?: V3; rotation?: V3 }> = ({ round, heat = 0, lines = 0, crack = 0, split = 0, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  const f = useCurrentFrame();
  const ww = round ? 0.26 : 0.27, wh = round ? 0.38 : 0.33, cx = round ? 0.5 : 0.5 - 0.135, cy = 0.5;
  const S = 1024;
  const canvas = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = S; return c; }, []);
  const tex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, [canvas]);
  drawPanel(canvas.getContext("2d")!, S, { round, heat, lines, crack, t: f, ww, wh, cx, cy }); tex.needsUpdate = true;
  // the two halves share the texture via UV ranges
  const halves = useMemo(() => [0, 1].map((h) => {
    const g = new THREE.PlaneGeometry(1, 2, 1, 1);
    const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + h * 0.5);
    return g;
  }), []);
  // frame + glass geometry (real 3D window)
  const frame = useMemo(() => {
    const outer = windowShape(ww * 2 + 0.12, wh * 2 + 0.12, round, 0.1); outer.holes.push(windowShape(ww * 2, wh * 2, round, 0.06) as unknown as THREE.Path);
    return new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 });
  }, [round, ww, wh]);
  const glass = useMemo(() => new THREE.ShapeGeometry(windowShape(ww * 2, wh * 2, round, 0.06)), [round, ww, wh]);
  const wx = (cx - 0.5) * 2, wy = -(cy - 0.5) * 2;
  const s = split, fly = s * s;
  const deb = useMemo(() => { const r = rng(5); return Array.from({ length: 26 }, () => [r() - 0.5, r() * 2 - 1, r(), r() * 6, r()]); }, []);
  return (
    <group position={position} rotation={rotation}>
      {/* left half (holds the window) */}
      <group position={[-0.5 - fly * 0.25, 0, 0]} rotation={[0, fly * 0.25, fly * 0.06]}>
        <mesh geometry={halves[0]}><meshPhysicalMaterial map={tex} metalness={0.55} roughness={0.38} clearcoat={0.3} /></mesh>
        <group position={[wx + 0.5, wy, 0]}>
          <mesh geometry={frame} position={[0, 0, -0.02]}><meshPhysicalMaterial color="#b9c0c2" metalness={0.9} roughness={0.25} clearcoat={0.6} /></mesh>
          <mesh geometry={glass} position={[0, 0, 0.004]}><meshPhysicalMaterial color="#0d1a2a" metalness={0.2} roughness={0.05} clearcoat={1} emissive="#0b2a44" emissiveIntensity={0.35} /></mesh>
        </group>
      </group>
      {/* right half */}
      <group position={[0.5 + fly * 1.6, fly * 0.5, fly * 0.9]} rotation={[fly * 0.6, -fly * 1.4, -fly * 0.5]}>
        <mesh geometry={halves[1]}><meshPhysicalMaterial map={tex} metalness={0.55} roughness={0.38} clearcoat={0.3} /></mesh>
      </group>
      {/* debris */}
      {s > 0 && deb.map(([x, y, z, rr, sz], i) => (
        <mesh key={i} position={[0.0 + x * 0.2 + fly * (1 + z * 2.4), y * 0.9 + fly * (z - 0.2) * 1.4, fly * (1.5 + z * 2)]} rotation={[rr + f * 0.2, rr * 2 + f * 0.17, 0]}>
          <boxGeometry args={[0.03 + sz * 0.06, 0.02 + sz * 0.05, 0.006]} /><meshStandardMaterial color="#c3c8ca" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {crack > 0 && !round && <pointLight position={[0, wy + 0.5, 0.25]} intensity={1.5 * crack} distance={1.5} color="#ff5533" />}
    </group>
  );
};

/** Rounded slab "cloud" puffs for depth around the airliner (cheap low-poly spheres). */
export const Clouds3D: React.FC<{ n?: number; seed?: number; y?: number; drift?: number }> = ({ n = 14, seed = 2, y = -1.4, drift = 0.01 }) => {
  const f = useCurrentFrame();
  const c = useMemo(() => { const r = rng(seed); return Array.from({ length: n }, () => [r() * 18 - 9, y + r() * 0.5, r() * 10 - 8, 0.8 + r() * 1.6]); }, [n, seed, y]);
  const geo = useMemo(() => new RoundedBoxGeometry(1, 0.35, 0.8, 4, 0.17), []);
  return <group position={[-f * drift * 3, 0, 0]}>{c.map(([x, yy, z, s], i) => <mesh key={i} geometry={geo} position={[x, yy, z]} scale={[s * 1.6, s * 0.6, s]}><meshStandardMaterial color="#2a3346" roughness={1} transparent opacity={0.55} /></mesh>)}</group>;
};

export { lerp };
