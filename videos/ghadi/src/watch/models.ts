// Geometry + material builders for the two watches. Units: 1 = ~10 mm of a real 44 mm watch (case radius 2.2).
import * as THREE from "three";

// ---------------- materials ----------------
export const M = {
  gold: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.76, 0.40), metalness: 1, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.1 }),
  goldHand: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.78, 0.42), metalness: 1, roughness: 0.3, emissive: new THREE.Color(0.22, 0.14, 0.04) }),
  goldSatin: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(1.0, 0.74, 0.38), metalness: 1, roughness: 0.34 }),
  brass: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.95, 0.70, 0.36), metalness: 1, roughness: 0.27 }),
  rhodium: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 0.87, 0.9), metalness: 1, roughness: 0.2 }),
  steel: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.9, 0.91, 0.93), metalness: 1, roughness: 0.24, clearcoat: 0.3 }),
  darkSteel: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.32, 0.33, 0.36), metalness: 1, roughness: 0.3 }),
  blued: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.12, 0.22, 0.75), metalness: 0.9, roughness: 0.25 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.85, 0.02, 0.1), metalness: 0, roughness: 0.05, clearcoat: 1, emissive: new THREE.Color(0.25, 0, 0.02) }),
  crystal: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.07, depthWrite: false, envMapIntensity: 1.0, clearcoat: 0.5 }),
  black: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.02, 0.025), metalness: 0.2, roughness: 0.35, clearcoat: 0.6 }),
  copper: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.95, 0.45, 0.25), metalness: 1, roughness: 0.3, emissive: new THREE.Color(0, 0, 0) }),
  whiteGear: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.92, 0.92, 0.9), metalness: 0, roughness: 0.4 }),
  red: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.9, 0.05, 0.05), metalness: 0.2, roughness: 0.3, clearcoat: 0.5 }),
};
export const glowMat = (c: [number, number, number]) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

// ---------------- canvas textures ----------------
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.needsUpdate = true;
  return t;
};
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// navy sunburst dial with minute track and a small-seconds sub-dial at 6 o'clock
export const mechDialTex = () => canvasTex(2048, 2048, (g) => {
  const C = 1024, S = 1024 / 1.9; // px per unit (dial radius 1.9)
  const grd = g.createRadialGradient(C, C, 50, C, C, 1024);
  grd.addColorStop(0, "#23407a"); grd.addColorStop(0.7, "#14275a"); grd.addColorStop(1, "#08122e");
  g.fillStyle = grd; g.fillRect(0, 0, 2048, 2048);
  // sunburst brushing
  for (let i = 0; i < 1400; i++) {
    const a = (i / 1400) * Math.PI * 2;
    g.strokeStyle = `rgba(${150 + rnd() * 100},${170 + rnd() * 80},255,${0.025 + rnd() * 0.05})`;
    g.lineWidth = 2; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * 1100, C + Math.sin(a) * 1100); g.stroke();
  }
  // minute track
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const big = i % 5 === 0;
    g.strokeStyle = big ? "#f3d08a" : "#c9d3ea"; g.lineWidth = big ? 9 : 4;
    const r0 = (big ? 1.68 : 1.73) * S, r1 = 1.82 * S;
    g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.stroke();
  }
  g.strokeStyle = "rgba(240,210,150,0.8)"; g.lineWidth = 3;
  g.beginPath(); g.arc(C, C, 1.665 * S, 0, Math.PI * 2); g.stroke();
  // sub-dial (snailed)
  const sx = C, sy = C + 1.1 * S, sr = 0.46 * S;
  for (let r = sr; r > 6; r -= 5) { g.strokeStyle = `rgba(${r % 10 < 5 ? 40 : 18},${r % 10 < 5 ? 66 : 40},${r % 10 < 5 ? 120 : 90},0.9)`; g.lineWidth = 5; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = "#f3d08a"; g.lineWidth = 5; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0;
    g.strokeStyle = big ? "#f3d08a" : "#c9d3ea"; g.lineWidth = big ? 6 : 2.5;
    const r0 = sr - (big ? 34 : 18), r1 = sr - 6;
    g.beginPath(); g.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); g.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); g.stroke();
  }
  g.fillStyle = "#f3d08a"; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  [["60", 0], ["15", 1], ["30", 2], ["45", 3]].forEach(([s, q]) => { const a = (Number(q) / 4) * Math.PI * 2 - Math.PI / 2; g.fillText(String(s), sx + Math.cos(a) * (sr - 72), sy + Math.sin(a) * (sr - 72)); });
  g.font = "600 52px serif"; g.fillStyle = "#f3d08a"; g.fillText("CHRONO · MÉCANIQUE", C, C - 0.62 * S);
  g.font = "500 34px serif"; g.fillStyle = "#c9d3ea"; g.fillText("HAND WOUND", C, C - 0.48 * S);
});

export const quartzDialTex = () => canvasTex(2048, 2048, (g) => {
  const C = 1024, S = 1024 / 1.9;
  const grd = g.createRadialGradient(C, C - 200, 50, C, C, 1100);
  grd.addColorStop(0, "#ffffff"); grd.addColorStop(1, "#dfe5ea");
  g.fillStyle = grd; g.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0;
    g.strokeStyle = big ? "#111" : "#555"; g.lineWidth = big ? 12 : 4;
    const r0 = (big ? 1.58 : 1.7) * S, r1 = 1.8 * S;
    g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.stroke();
  }
  g.fillStyle = "#111"; g.font = "800 200px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  [["12", 0], ["3", 1], ["6", 2], ["9", 3]].forEach(([s, q]) => { const a = (Number(q) / 4) * Math.PI * 2 - Math.PI / 2; g.fillText(String(s), C + Math.cos(a) * 1.25 * S, C + Math.sin(a) * 1.25 * S + 8); });
  g.font = "700 64px sans-serif"; g.fillStyle = "#c21b1b"; g.fillText("QUARTZ", C, C + 0.62 * S);
  g.font = "500 40px sans-serif"; g.fillStyle = "#444"; g.fillText("32768 Hz", C, C + 0.8 * S);
});

// perlage (overlapping circular graining) on the main plate
export const perlageTex = () => canvasTex(1024, 1024, (g) => {
  g.fillStyle = "#b9bcc4"; g.fillRect(0, 0, 1024, 1024);
  for (let y = -40; y < 1100; y += 46) for (let x = -40; x < 1100; x += 46) {
    const cx = x + ((y / 46) % 2) * 23, cy = y;
    const gr = g.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 34);
    gr.addColorStop(0, "#e4e6ea"); gr.addColorStop(0.55, "#cdd0d6"); gr.addColorStop(1, "#b4b8c0");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 33, 0, Math.PI * 2); g.fill();
  }
});

export const leatherTex = (base: string, stitch: string) => canvasTex(256, 1024, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * 256, rnd() * 1024, 2, 2); }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`; g.fillRect(rnd() * 256, rnd() * 1024, 2, 2); }
  g.strokeStyle = stitch; g.lineWidth = 5; g.setLineDash([16, 10]);
  for (const x of [18, 238]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
});

export const pcbTex = () => canvasTex(1024, 1024, (g) => {
  g.fillStyle = "#0d5a36"; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "#d9b25a"; g.lineCap = "round";
  for (let i = 0; i < 26; i++) {
    g.lineWidth = 6 + rnd() * 6; g.beginPath();
    let x = rnd() * 1024, y = rnd() * 1024; g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { if (rnd() > 0.5) x += (rnd() - 0.5) * 500; else y += (rnd() - 0.5) * 500; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = "#e8c46a"; g.beginPath(); g.arc(rnd() * 1024, rnd() * 1024, 9, 0, Math.PI * 2); g.fill(); }
});

export const batteryTex = () => canvasTex(512, 512, (g) => {
  const gr = g.createRadialGradient(256, 256, 20, 256, 256, 256);
  gr.addColorStop(0, "#f4f5f7"); gr.addColorStop(1, "#a9adb5"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let r = 250; r > 0; r -= 3) { g.strokeStyle = `rgba(255,255,255,${0.04 + (r % 7) * 0.006})`; g.lineWidth = 1.5; g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = "#3a3d44"; g.font = "800 150px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("+", 256, 200);
  g.font = "700 64px sans-serif"; g.fillText("1.55 V", 256, 340);
});

// ---------------- gears ----------------
type GearOpt = { N: number; R: number; spokes?: number; hub?: number; rim?: number; kind?: "spur" | "escape" | "ratchet" | "pinion"; hole?: number };
const gearCache = new Map<string, THREE.Shape>();
export const gearShape = (o: GearOpt) => {
  const key = JSON.stringify(o);
  if (gearCache.has(key)) return gearCache.get(key)!;
  const { N, R, kind = "spur" } = o;
  const m = (2 * R) / N;
  const add = kind === "pinion" ? 1.1 * m : kind === "escape" ? 0.0 : m;
  const ded = kind === "pinion" ? 1.4 * m : 1.25 * m;
  const ra = R + add, rr = R - ded;
  const s = new THREE.Shape();
  const p = (2 * Math.PI) / N;
  for (let i = 0; i < N; i++) {
    const a0 = i * p;
    const pts: [number, number][] = kind === "escape"
      ? [[rr * 0.86, a0], [ra * 1.0, a0 + 0.62 * p], [ra * 0.97, a0 + 0.8 * p], [rr * 0.95, a0 + 0.86 * p]]
      : kind === "ratchet"
        ? [[rr, a0], [ra, a0 + 0.86 * p], [rr, a0 + 0.9 * p]]
        : [[rr, a0], [rr, a0 + 0.08 * p], [R * 0.98 + add * 0.1, a0 + 0.2 * p], [ra, a0 + 0.3 * p], [ra, a0 + 0.46 * p], [R * 0.98 + add * 0.1, a0 + 0.56 * p], [rr, a0 + 0.68 * p]];
    pts.forEach(([r, a], j) => { const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y); });
  }
  s.closePath();
  const hole = o.hole ?? Math.min(0.03, R * 0.25);
  if (o.spokes && o.spokes > 0) {
    const ri = rr - (o.rim ?? Math.max(0.035, R * 0.12));
    const rh = o.hub ?? Math.max(0.06, R * 0.2);
    const sw = Math.max(0.02, R * 0.07); // spoke half-width
    for (let k = 0; k < o.spokes; k++) {
      const c0 = (k / o.spokes) * Math.PI * 2, c1 = ((k + 1) / o.spokes) * Math.PI * 2;
      const da0 = sw / ri, db0 = sw / rh;
      const h = new THREE.Path();
      h.absarc(0, 0, ri, c0 + da0, c1 - da0, false);
      h.absarc(0, 0, rh, c1 - db0, c0 + db0, true);
      h.closePath();
      s.holes.push(h);
    }
  }
  const hp = new THREE.Path(); hp.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(hp);
  gearCache.set(key, s);
  return s;
};
export const gearGeo = (o: GearOpt, depth: number) => {
  const g = new THREE.ExtrudeGeometry(gearShape(o), { depth, bevelEnabled: true, bevelThickness: Math.min(0.006, depth * 0.2), bevelSize: Math.min(0.006, o.R * 0.02), bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
};

// a gear + arbor + jewel as one group; rotate the returned group about z
export const wheel = (o: GearOpt, depth: number, mat: THREE.Material, arbor = 0.32, pinion?: { N: number; R: number; z: number; len: number }) => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(gearGeo(o, depth), mat));
  const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, arbor, 16), M.steel);
  ar.rotation.x = Math.PI / 2; g.add(ar);
  if (pinion) {
    const pm = new THREE.Mesh(gearGeo({ N: pinion.N, R: pinion.R, kind: "pinion", hole: 0.015 }, pinion.len), M.steel);
    pm.position.z = pinion.z; g.add(pm);
  }
  return g;
};
export const jewel = (r = 0.045) => {
  const g = new THREE.Group();
  const setting = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.02, 24), M.gold); setting.rotation.x = Math.PI / 2; g.add(setting);
  const j = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 24), M.ruby); j.rotation.x = Math.PI / 2; j.position.z = 0.008; g.add(j);
  return g;
};
export const screw = (r = 0.05) => {
  const g = new THREE.Group();
  const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 20), M.blued); h.rotation.x = Math.PI / 2; g.add(h);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 2.05, r * 0.25, 0.02), M.black); slot.position.z = 0.012; g.add(slot);
  return g;
};

// ---------------- case, crown, hands, strap ----------------
export const caseGeo = (R0 = 1.9) => {
  const pts = [[R0 - 0.02, -0.42], [R0 + 0.18, -0.44], [R0 + 0.3, -0.32], [R0 + 0.34, -0.05], [R0 + 0.33, 0.25], [R0 + 0.26, 0.42], [R0 + 0.14, 0.52], [R0 + 0.02, 0.56], [R0 - 0.05, 0.56], [R0 - 0.05, 0.47], [R0 - 0.02, 0.4], [R0 - 0.02, -0.42]].map(([r, z]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(pts, 128); g.rotateX(Math.PI / 2); return g;
};
export const lugGeo = () => {
  const s = new THREE.Shape(); s.moveTo(-0.16, 0); s.lineTo(0.16, 0); s.lineTo(0.13, 0.95); s.quadraticCurveTo(0, 1.05, -0.13, 0.95); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 }); g.translate(0, 0, -0.21); return g;
};
export const crownGeo = () => {
  const g = new THREE.CylinderGeometry(0.26, 0.26, 0.3, 48, 1); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x), r = Math.hypot(x, z); if (r > 0.2) { const k = 1 + 0.07 * Math.sign(Math.cos(a * 24)); p.setX(i, Math.cos(a) * 0.26 * k); p.setZ(i, Math.sin(a) * 0.26 * k); } }
  g.computeVertexNormals(); g.rotateZ(Math.PI / 2); return g;
};
export const handGeo = (len: number, w: number, tail: number, kind: "dauphine" | "baton" | "needle") => {
  const s = new THREE.Shape();
  if (kind === "dauphine") { s.moveTo(0, -tail); s.lineTo(w, 0); s.lineTo(0, len); s.lineTo(-w, 0); s.closePath(); }
  else if (kind === "baton") { s.moveTo(-w, -tail); s.lineTo(w, -tail); s.lineTo(w * 0.8, len); s.lineTo(-w * 0.8, len); s.closePath(); }
  else { s.moveTo(-w, -tail); s.lineTo(w, -tail); s.lineTo(w * 0.35, len); s.lineTo(-w * 0.35, len); s.closePath(); }
  const hub = new THREE.Path(); hub.absarc(0, 0, w * 1.6, 0, Math.PI * 2, false);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
  const c = new THREE.CylinderGeometry(Math.max(0.05, w * 1.4), Math.max(0.05, w * 1.4), 0.04, 24); c.rotateX(Math.PI / 2); c.translate(0, 0, 0.012);
  return [g, c] as const;
};
// a strap that leaves the lugs and curls back around an imaginary wrist
export const strapGeo = (w = 1.7, th = 0.13, len = 4.6, curl = 2.3) => {
  const n = 40, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const pt = (s: number) => { const a = (s * len) / curl; return new THREE.Vector2(curl * Math.sin(a), -curl * (1 - Math.cos(a))); }; // (y, z)
  for (let i = 0; i <= n; i++) {
    const s = i / n, p = pt(s), q = pt(Math.min(1, s + 0.01)), d = q.clone().sub(pt(Math.max(0, s - 0.01))).normalize();
    const nrm = new THREE.Vector2(-d.y, d.x);
    const taper = 1 - 0.12 * s;
    for (const [sx, sn] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
      pos.push(sx * w * 0.5 * taper, p.x + nrm.x * sn * th * 0.5, p.y + nrm.y * sn * th * 0.5);
      uv.push(sx < 0 ? 0 : 1, s * 4);
    }
  }
  for (let i = 0; i < n; i++) for (let f = 0; f < 4; f++) {
    const a = i * 4 + f, b = i * 4 + ((f + 1) % 4), c = a + 4, d = b + 4;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};

// spiral (mainspring / hairspring) as a flat ribbon in the XY plane
export const spiralPoints = (rIn: number, rOut: number, turns: number, n: number, twist: (u: number) => number = () => 0, phase = 0) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = phase + u * turns * Math.PI * 2 + twist(u), r = rIn + (rOut - rIn) * u;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return pts;
};
// update an existing ribbon geometry in place (fixed vertex count)
export class Ribbon {
  geo = new THREE.BufferGeometry();
  private n: number;
  constructor(n: number, private w: number, private h: number) {
    this.n = n;
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) for (let f = 0; f < 4; f++) { const a = i * 4 + f, b = i * 4 + ((f + 1) % 4), c = a + 4, d = b + 4; idx.push(a, b, c, b, d, c); }
    this.geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 12), 3));
    this.geo.setIndex(idx);
  }
  set(pts: THREE.Vector3[]) {
    const p = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(this.n - 1, i + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      const nx = -ty / l, ny = tx / l, q = pts[i];
      const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      c.forEach(([s, z], k) => p.setXYZ(i * 4 + k, q.x + nx * s * this.w * 0.5, q.y + ny * s * this.w * 0.5, z * this.h * 0.5));
    }
    p.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
}
