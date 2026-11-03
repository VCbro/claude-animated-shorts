// 3D world: split AC (indoor unit above the wall band = room, outdoor unit below = outside) with the refrigerant loop,
// condensation + drain, and a cut-away desert air cooler (tank, pump, pads, trickle, fan, vapour).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  S, sceneAt, sstep, lerp, clamp01, IN, OUT, acVisible, xrayAC, xrayCooler, refrigAmt, heatInAmt, heatOutAmt, coldAirAmt, compressorGlow, valveGlow,
  fanSpeed, humidAmt, dropsGrow, drainAmt, pumpAmt, trickleAmt, airInAmt, vapourAmt, tankLevel, endPose,
} from "./timeline";

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
let seed = 9; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const glowMat = (c: [number, number, number]) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

let puffTex: THREE.Texture | null = null;
const getPuffTex = () => puffTex ??= canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
class Puffs {
  group = new THREE.Group(); sprites: THREE.Sprite[] = []; seeds: Float32Array;
  constructor(public n: number, color: [number, number, number], public size: number, additive: boolean) {
    this.seeds = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) this.seeds[i] = rnd();
    for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: getPuffTex(), color: new THREE.Color(...color), transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !additive }); const sp = new THREE.Sprite(m); this.sprites.push(sp); this.group.add(sp); }
  }
  set(t: number, life: number, amount: number, emit: (u: number, s: Float32Array, i: number) => [number, number, number, number, number]) {
    this.group.visible = amount > 0.01; if (!this.group.visible) return;
    for (let i = 0; i < this.n; i++) {
      const u = (((t / life + this.seeds[i * 4]) % 1) + 1) % 1; const [x, y, z, al, sz] = emit(u, this.seeds.subarray(i * 4, i * 4 + 4), i);
      const sp = this.sprites[i]; sp.position.set(x, y, z); sp.scale.setScalar(this.size * sz); (sp.material as THREE.SpriteMaterial).opacity = al * amount;
    }
  }
}
// polyline path with exact arc-length sampling
class Path {
  pts: THREE.Vector3[]; cum: number[] = [0]; len = 0;
  constructor(pts: THREE.Vector3[]) { this.pts = pts; for (let i = 1; i < pts.length; i++) { this.len += pts[i].distanceTo(pts[i - 1]); this.cum.push(this.len); } }
  at(u: number, out = new THREE.Vector3()) {
    const d = (((u % 1) + 1) % 1) * this.len; let i = 1; while (i < this.cum.length - 1 && this.cum[i] < d) i++;
    const k = (d - this.cum[i - 1]) / (this.cum[i] - this.cum[i - 1] || 1); return out.lerpVectors(this.pts[i - 1], this.pts[i], k);
  }
  uOf(index: number) { return this.cum[index] / this.len; }
}
const fins = (n: number, w: number, h: number, d: number, mat: THREE.Material, axis: "x" | "z" = "x") => {
  const g = new THREE.BoxGeometry(axis === "x" ? 0.012 : d, h, axis === "x" ? d : 0.012);
  const m = new THREE.InstancedMesh(g, mat, n); const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * (w / n); o.position.set(axis === "x" ? x : 0, 0, axis === "x" ? 0 : x); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }
  return m;
};

export class World {
  root = new THREE.Group();
  back: THREE.Mesh; backMat: THREE.MeshBasicMaterial; texSplit: THREE.Texture; texRoom: THREE.Texture; wall = new THREE.Group();
  ac = new THREE.Group(); indoor = new THREE.Group(); outdoor = new THREE.Group(); acShellMats: THREE.MeshPhysicalMaterial[] = [];
  blower: THREE.Mesh; fanOut = new THREE.Group(); compMat: THREE.MeshPhysicalMaterial; compGlow: THREE.Mesh; valveGlowM: THREE.Mesh;
  loop: Path; refr: THREE.Mesh[] = []; uEvapEnd = 0; uCompIn = 0; uCompOut = 0; uValve = 0;
  heatIn: Puffs; coldAir: Puffs; heatOut: Puffs; humid: Puffs;
  coilDrops: THREE.InstancedMesh; drain: Path; drainDrops: THREE.Mesh[] = [];
  cooler = new THREE.Group(); clShellMats: THREE.MeshPhysicalMaterial[] = []; padMats: THREE.MeshPhysicalMaterial[] = []; clFan = new THREE.Group(); water: THREE.Mesh;
  pumpPath: Path; pumpDrops: THREE.Mesh[] = []; trickle: THREE.Mesh[] = []; airIn: Puffs; airOut: Puffs; vapour: Puffs;
  key: THREE.DirectionalLight; rim: THREE.DirectionalLight; fill: THREE.DirectionalLight;

  constructor() {
    this.key = new THREE.DirectionalLight(0xfff3e4, 2.6); this.rim = new THREE.DirectionalLight(0xc4dcff, 2.2); this.fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    // ---------- backdrops ----------
    this.texSplit = canvasTex(1024, 2048, (g) => {
      let gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#0c1a33"); gr.addColorStop(1, "#16335a"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
      g.fillStyle = "rgba(160,200,255,0.06)"; for (let x = 0; x < 1024; x += 64) g.fillRect(x, 0, 30, 1024);
      gr = g.createLinearGradient(0, 1024, 0, 2048); gr.addColorStop(0, "#f08a3a"); gr.addColorStop(0.45, "#9a3d16"); gr.addColorStop(1, "#2a0f06"); g.fillStyle = gr; g.fillRect(0, 1024, 1024, 1024);
      const sun = g.createRadialGradient(760, 1180, 10, 760, 1180, 260); sun.addColorStop(0, "rgba(255,240,180,1)"); sun.addColorStop(0.25, "rgba(255,200,90,0.7)"); sun.addColorStop(1, "rgba(255,140,40,0)"); g.fillStyle = sun; g.fillRect(400, 900, 760, 700);
      g.fillStyle = "#3a160a"; let x = 0; while (x < 1024) { const w = 60 + rnd() * 110, h = 120 + rnd() * 320; g.fillRect(x, 1500 - h, w, h + 600); x += w + 6; }
    });
    this.texRoom = canvasTex(1024, 2048, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 2048); gr.addColorStop(0, "#2a2018"); gr.addColorStop(1, "#120d09"); g.fillStyle = gr; g.fillRect(0, 0, 1024, 2048);
      g.fillStyle = "rgba(255,220,170,0.05)"; for (let y = 0; y < 2048; y += 90) g.fillRect(0, y, 1024, 40);
      const w = g.createLinearGradient(0, 300, 0, 1100); w.addColorStop(0, "#9fd1ff"); w.addColorStop(1, "#ffd9a3"); g.fillStyle = w; g.fillRect(640, 300, 300, 520);
      g.strokeStyle = "#4a3424"; g.lineWidth = 22; g.strokeRect(640, 300, 300, 520); g.beginPath(); g.moveTo(790, 300); g.lineTo(790, 820); g.moveTo(640, 560); g.lineTo(940, 560); g.stroke();
      g.fillStyle = "#3b2a1c"; g.fillRect(0, 1700, 1024, 348);
    });
    this.backMat = new THREE.MeshBasicMaterial({ map: this.texSplit, toneMapped: true });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(26, 52), this.backMat); this.back.position.set(0, 0, -6); this.root.add(this.back);
    // wall band between room and outside
    const brick = canvasTex(1024, 128, (g) => { g.fillStyle = "#8a4b33"; g.fillRect(0, 0, 1024, 128); g.fillStyle = "#c9b8a6"; for (let y = 0; y < 128; y += 32) { g.fillRect(0, y, 1024, 4); for (let x = (y / 32) % 2 ? 0 : 40; x < 1024; x += 80) g.fillRect(x, y, 4, 32); } });
    brick.wrapS = THREE.RepeatWrapping; brick.repeat.set(4, 1);
    const wallM = new THREE.Mesh(new THREE.BoxGeometry(16, 0.55, 2.2), new THREE.MeshPhysicalMaterial({ map: brick, roughness: 0.9 })); this.wall.add(wallM); this.wall.position.set(0, 0.05, -1.4);
    this.root.add(this.wall);

    // ---------- indoor unit ----------
    const mkShell = (col: number, list: THREE.MeshPhysicalMaterial[], rough = 0.25) => { const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, clearcoat: 0.8, clearcoatRoughness: 0.1, transparent: true }); list.push(m); return m; };
    const white = mkShell(0xf4f6f8, this.acShellMats);
    const ib = new THREE.Mesh(new RoundedBoxGeometry(3.5, 1.05, 0.9, 4, 0.18), white); this.indoor.add(ib);
    const louver = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.08, 0.3, 2, 0.03), mkShell(0xe9ecef, this.acShellMats)); louver.position.set(0, -0.48, 0.42); louver.rotation.x = 0.6; this.indoor.add(louver);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.02), glowMat([0.4, 1.6, 3.0])); led.position.set(1.2, -0.25, 0.46); this.indoor.add(led);
    const alu = new THREE.MeshPhysicalMaterial({ color: 0xc8ced6, metalness: 0.9, roughness: 0.35 });
    const copper = new THREE.MeshPhysicalMaterial({ color: 0xd9763a, metalness: 1, roughness: 0.28 });
    const evap = fins(110, 3.1, 0.72, 0.22, alu); evap.position.set(0, 0.08, 0.12); this.indoor.add(evap);
    for (const y of [0.33, 0.18, 0.03, -0.12]) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.15, 12), copper); tb.rotation.z = Math.PI / 2; tb.position.set(0, y + 0.0, 0.12); this.indoor.add(tb); }
    this.blower = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 3.0, 24, 1), new THREE.MeshPhysicalMaterial({ map: canvasTex(64, 256, (g) => { g.fillStyle = "#2a2d33"; g.fillRect(0, 0, 64, 256); g.fillStyle = "#4a4f58"; for (let i = 0; i < 256; i += 16) g.fillRect(0, i, 64, 6); }), roughness: 0.5 }));
    this.blower.rotation.z = Math.PI / 2; this.blower.position.set(0, -0.28, -0.1); this.indoor.add(this.blower);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 0.4), new THREE.MeshPhysicalMaterial({ color: 0x8a96a5, roughness: 0.5 })); tray.position.set(0, -0.32, 0.12); this.indoor.add(tray);
    // condensation droplets on the fins
    const dropMat = new THREE.MeshPhysicalMaterial({ color: 0xa9dcff, roughness: 0.02, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.9, emissive: new THREE.Color(0.08, 0.25, 0.45) });
    this.coilDrops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), dropMat, 160); this.indoor.add(this.coilDrops);
    this.indoor.position.set(...IN.pos); this.ac.add(this.indoor);

    // ---------- outdoor unit ----------
    const grey = mkShell(0xd9dde2, this.acShellMats, 0.35);
    const ob = new THREE.Mesh(new RoundedBoxGeometry(3.1, 2.15, 1.0, 3, 0.08), grey); this.outdoor.add(ob);
    const grill = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 8, 48), new THREE.MeshPhysicalMaterial({ color: 0x333840, metalness: 0.6, roughness: 0.4 })); grill.position.set(-0.45, 0, 0.52); this.outdoor.add(grill);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.02, 0.02), grill.material); b.position.set(-0.45, -0.65 + k * 0.26, 0.53); this.outdoor.add(b); }
    for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x23262b, roughness: 0.4 })); bl.position.y = 0.38; const g = new THREE.Group(); g.add(bl); g.rotation.z = (k * Math.PI) / 2; g.rotation.y = 0.0; this.fanOut.add(g); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 20).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x23262b })); this.fanOut.add(hub);
    this.fanOut.position.set(-0.45, 0, 0.42); this.outdoor.add(this.fanOut);
    const cond = fins(90, 2.9, 1.9, 0.12, alu); cond.position.set(0, 0, -0.38); this.outdoor.add(cond);
    this.compMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1d21, roughness: 0.35, metalness: 0.4, emissive: new THREE.Color(0, 0, 0) });
    const comp = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 20), this.compMat); comp.position.set(0.98, -0.3, 0.1); this.outdoor.add(comp);
    this.compGlow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), glowMat([2.2, 0.5, 0.1])); this.compGlow.scale.set(1, 1.5, 1); this.compGlow.position.copy(comp.position); this.outdoor.add(this.compGlow);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), new THREE.MeshPhysicalMaterial({ color: 0xd6b25e, metalness: 1, roughness: 0.3 })); valve.position.set(1.3, -0.85, 0.35); this.outdoor.add(valve);
    this.valveGlowM = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), glowMat([0.6, 1.6, 3.0])); this.valveGlowM.position.copy(valve.position); this.outdoor.add(this.valveGlowM);
    this.outdoor.position.set(...OUT.pos); this.ac.add(this.outdoor);

    // ---------- refrigerant loop (world coords) ----------
    const iy = IN.pos[1], oy = OUT.pos[1];
    const evapRows = [0.33, 0.18, 0.03, -0.12].map((y) => y + iy);
    const pts: THREE.Vector3[] = [V(1.85, evapRows[0], 0.12)];
    evapRows.forEach((y, i) => { const a = i % 2 ? -1.5 : 1.5, b = -a; pts.push(V(a, y, 0.12), V(b, y, 0.12)); });
    const iEvapEnd = pts.length - 1;
    pts.push(V(-1.75, evapRows[3] - 0.25, 0.0), V(1.95, iy - 0.6, -0.15), V(1.95, 0.35, -0.15), V(1.6, oy + 1.2, 0.0), V(0.98, oy + 0.35, 0.1));
    const iCompIn = pts.length - 1;
    pts.push(V(0.98, oy - 0.3, 0.1), V(0.98, oy - 0.85, 0.1));
    const iCompOut = pts.length - 1;
    const condRows = [0.8, 0.5, 0.2, -0.1, -0.4, -0.7].map((y) => y + oy);
    pts.push(V(1.35, condRows[0], -0.38)); condRows.forEach((y, i) => { const a = i % 2 ? -1.35 : 1.35, b = -a; pts.push(V(a, y, -0.38), V(b, y, -0.38)); });
    pts.push(V(1.3, oy - 0.85, 0.35));
    const iValve = pts.length - 1;
    pts.push(V(1.75, oy + 1.25, 0.15), V(2.15, 0.35, 0.05), V(2.15, iy - 0.4, 0.05), V(1.85, evapRows[0], 0.12));
    this.loop = new Path(pts);
    this.uEvapEnd = this.loop.uOf(iEvapEnd); this.uCompIn = this.loop.uOf(iCompIn); this.uCompOut = this.loop.uOf(iCompOut); this.uValve = this.loop.uOf(iValve);
    for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glowMat([1, 1, 1])); this.refr.push(m); this.ac.add(m); }
    // visible copper pipes between the units (suction insulated, liquid bare)
    const pipe = (p: THREE.Vector3[], r: number, mat: THREE.Material) => this.ac.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p, false, "catmullrom", 0.2), 80, r, 12, false), mat));
    pipe([V(1.75, iy - 0.3, -0.1), V(1.95, iy - 0.6, -0.15), V(1.95, 0.35, -0.15), V(1.6, oy + 1.2, 0.0), V(1.2, oy + 1.0, 0.1)], 0.07, new THREE.MeshPhysicalMaterial({ color: 0xf0f0ea, roughness: 0.7 }));
    pipe([V(1.75, iy - 0.2, 0.1), V(2.15, iy - 0.4, 0.05), V(2.15, 0.35, 0.05), V(1.75, oy + 1.25, 0.15), V(1.5, oy + 1.0, 0.3)], 0.04, copper);
    // drain hose
    const dpts = [V(1.6, iy - 0.42, 0.15), V(2.4, iy - 0.6, 0.2), V(2.55, 0.6, 0.25), V(2.6, -0.4, 0.4), V(2.75, -0.8, 0.6)];
    this.ac.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dpts), 60, 0.05, 10, false), new THREE.MeshPhysicalMaterial({ color: 0xdfe6ee, roughness: 0.3, transparent: true, opacity: 0.85 })));
    this.drain = new Path(new THREE.CatmullRomCurve3(dpts).getPoints(40));
    for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), dropMat); d.scale.set(1, 1.3, 1); this.drainDrops.push(d); this.ac.add(d); }
    // air particles
    this.heatIn = new Puffs(40, [1.0, 0.4, 0.08], 0.2, true); this.coldAir = new Puffs(50, [0.3, 0.6, 1.0], 0.24, true); this.heatOut = new Puffs(50, [1.1, 0.42, 0.08], 0.28, true); this.humid = new Puffs(60, [0.6, 0.7, 0.8], 0.07, true);
    this.ac.add(this.heatIn.group, this.coldAir.group, this.heatOut.group, this.humid.group);
    this.root.add(this.ac);

    // ---------- air cooler ----------
    const maroon = mkShell(0x7a1f2b, this.clShellMats, 0.3), cream = mkShell(0xf1ebe1, this.clShellMats, 0.35);
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.75, 1.8, 3, 0.08), maroon); base.position.y = -1.25; this.cooler.add(base);
    const top = new THREE.Mesh(new RoundedBoxGeometry(2.35, 0.26, 1.85, 3, 0.08), maroon); top.position.y = 1.55; this.cooler.add(top);
    for (const [x, z] of [[-1.1, -0.85], [1.1, -0.85], [-1.1, 0.85], [1.1, 0.85]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), cream); p.position.set(x, 0.2, z); this.cooler.add(p); }
    const fp = new THREE.Shape(); fp.moveTo(-1.08, -0.88); fp.lineTo(1.08, -0.88); fp.lineTo(1.08, 1.42); fp.lineTo(-1.08, 1.42); fp.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0.3, 0.85, 0, Math.PI * 2, true); fp.holes.push(hole);
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(fp, { depth: 0.06, bevelEnabled: false, curveSegments: 48 }), cream); front.position.set(0, 0, 0.84); this.cooler.add(front);
    for (let k = 0; k < 7; k++) { const g = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.025, 0.02), new THREE.MeshPhysicalMaterial({ color: 0x555a62, metalness: 0.5 })); g.position.set(0, -0.45 + k * 0.25, 0.92); this.cooler.add(g); }
    for (let k = 0; k < 4; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.75, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x2f6fb0, roughness: 0.3, clearcoat: 0.6 })); bl.position.y = 0.42; bl.rotation.y = 0.35; const g = new THREE.Group(); g.add(bl); g.rotation.z = (k * Math.PI) / 2; this.clFan.add(g); }
    this.clFan.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x222222 })));
    this.clFan.position.set(0, 0.3, 0.6); this.cooler.add(this.clFan);
    const padTex = canvasTex(512, 512, (g) => { g.fillStyle = "#c9a35a"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#8a6a32"; g.lineWidth = 3; const r = 16; for (let y = 0; y < 540; y += r * 1.5) for (let x = 0; x < 540; x += r * Math.sqrt(3)) { const cx = x + ((y / (r * 1.5)) % 2) * r * Math.sqrt(3) / 2; g.beginPath(); for (let a = 0; a < 6; a++) { const an = Math.PI / 6 + (a * Math.PI) / 3; g.lineTo(cx + r * Math.cos(an), y + r * Math.sin(an)); } g.closePath(); g.stroke(); } });
    const mkPad = () => { const m = new THREE.MeshPhysicalMaterial({ map: padTex, roughness: 0.9, transparent: true, side: THREE.DoubleSide, color: new THREE.Color(1, 1, 1) }); this.padMats.push(m); return m; };
    const padL = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), mkPad()); padL.rotation.y = -Math.PI / 2; padL.position.set(-1.1, 0.25, 0); this.cooler.add(padL);
    const padR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), mkPad()); padR.rotation.y = Math.PI / 2; padR.position.set(1.1, 0.25, 0); this.cooler.add(padR);
    const padB = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.3), mkPad()); padB.position.set(0, 0.25, -0.86); this.cooler.add(padB);
    this.water = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 1.6), new THREE.MeshPhysicalMaterial({ color: 0x3aa0e0, roughness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1, emissive: new THREE.Color(0.02, 0.1, 0.2) }));
    this.water.position.set(0, -1.32, 0); this.cooler.add(this.water);
    const pump = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 2, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x222428, roughness: 0.4 })); pump.position.set(0.75, -1.4, -0.5); this.cooler.add(pump);
    const ppts = [V(0.75, -1.25, -0.5), V(0.95, -0.9, -0.72), V(0.98, 1.3, -0.75), V(0.6, 1.38, -0.78), V(-0.98, 1.38, -0.78), V(-1.0, 1.38, 0.6)];
    this.cooler.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ppts, false, "catmullrom", 0.1), 80, 0.045, 10, false), new THREE.MeshPhysicalMaterial({ color: 0x2a2d33, roughness: 0.4, transparent: true, opacity: 0.9 })));
    this.pumpPath = new Path(new THREE.CatmullRomCurve3(ppts, false, "catmullrom", 0.1).getPoints(60));
    for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat([0.4, 1.4, 2.6])); this.pumpDrops.push(d); this.cooler.add(d); }
    for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), dropMat); d.scale.set(1, 1.8, 1); this.trickle.push(d); this.cooler.add(d); }
    this.airIn = new Puffs(50, [1.0, 0.42, 0.1], 0.2, true); this.airOut = new Puffs(50, [0.3, 0.6, 1.0], 0.24, true); this.vapour = new Puffs(60, [0.9, 0.95, 1.0], 0.32, false);
    this.cooler.add(this.airIn.group, this.airOut.group, this.vapour.group);
    this.root.add(this.cooler);
  }

  update(t: number, cam: THREE.PerspectiveCamera) {
    const sc = sceneAt(t);
    const camDir = new THREE.Vector3(); cam.getWorldDirection(camDir);
    const side = new THREE.Vector3().crossVectors(camDir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, camDir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(camDir, f); l.target.position.copy(cam.position).addScaledVector(camDir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    // backdrop & layout per scene
    const roomScene = sc >= 4;
    this.backMat.map = roomScene ? this.texRoom : this.texSplit; this.backMat.needsUpdate = true;
    this.back.position.set(cam.position.x * 0.6, roomScene ? 2 : 0, -6); this.back.lookAt(cam.position.x * 0.6, roomScene ? 2 : 0, 10);
    this.wall.visible = !roomScene;
    const e = endPose(t), end = sc === 6;
    this.ac.visible = acVisible(t);
    if (end) { this.ac.position.set(e.ac.pos[0], e.ac.pos[1] - IN.pos[1] * e.ac.s, 0); this.ac.scale.setScalar(e.ac.s); this.outdoor.visible = false; }
    else { this.ac.position.set(0, 0, 0); this.ac.scale.setScalar(1); this.outdoor.visible = true; }
    this.cooler.visible = sc >= 4;
    if (end) { this.cooler.position.set(...e.cooler.pos); this.cooler.scale.setScalar(e.cooler.s); } else { this.cooler.position.set(0, 0, 0); this.cooler.scale.setScalar(1); }

    // ---- AC ----
    if (this.ac.visible) {
      const xr = xrayAC(t);
      this.acShellMats.forEach((m) => { m.opacity = 1 - 0.8 * xr; m.depthWrite = xr < 0.05; });
      this.blower.rotation.x = t * 14; this.fanOut.rotation.z = -t * 9 * fanSpeed(t);
      const cg = compressorGlow(t); this.compMat.emissive.setRGB(0.9 * cg, 0.2 * cg, 0.03 * cg); (this.compGlow.material as THREE.MeshBasicMaterial).opacity = 0.35 * cg * (0.8 + 0.2 * Math.sin(t * 12)) * xr;
      (this.valveGlowM.material as THREE.MeshBasicMaterial).opacity = 0.5 * valveGlow(t) * (0.7 + 0.3 * Math.sin(t * 8));
      // refrigerant particles: blue after the valve until the compressor, red after the compressor until the valve
      const ra = refrigAmt(t) * (end ? 0 : 1);
      const cold = new THREE.Color(0.35, 1.1, 2.6), coldGas = new THREE.Color(0.6, 1.4, 2.4), hot = new THREE.Color(3.0, 0.55, 0.12), warm = new THREE.Color(2.4, 1.2, 0.3);
      this.refr.forEach((m, i) => {
        const u = (((t * 0.07 + i / this.refr.length) % 1) + 1) % 1; this.loop.at(u, m.position);
        const c = (m.material as THREE.MeshBasicMaterial).color;
        if (u < this.uEvapEnd) c.copy(cold).lerp(coldGas, u / this.uEvapEnd);
        else if (u < this.uCompIn) c.copy(coldGas);
        else if (u < this.uCompOut) c.copy(coldGas).lerp(hot, (u - this.uCompIn) / (this.uCompOut - this.uCompIn));
        else if (u < this.uValve) c.copy(hot).lerp(warm, (u - this.uCompOut) / (this.uValve - this.uCompOut));
        else c.copy(cold);
        (m.material as THREE.MeshBasicMaterial).opacity = ra; m.visible = ra > 0.01;
      });
      const iy = IN.pos[1], oy = OUT.pos[1];
      // room heat drawn into the indoor unit (top intake)
      this.heatIn.set(t, 2.2, heatInAmt(t), (u, s) => { const x = (s[0] - 0.5) * 3.4; return [x, lerp(iy - 1.2 - s[1] * 1.2, iy + 0.55, u), lerp(1.8 + s[2], 0.1, u), Math.sin(Math.PI * u) * 0.8, 0.8 + s[3]]; });
      // cold air out of the louver
      this.coldAir.set(t, 2.0, coldAirAmt(t), (u, s) => { const x = (s[0] - 0.5) * 3.0; return [x + (s[3] - 0.5) * u, iy - 0.5 - u * (1.4 + s[1]), 0.5 + u * (2.2 + s[2]), Math.sin(Math.PI * Math.min(1, u * 1.3)) * 0.7, 0.7 + 1.4 * u]; });
      // hot air out of the outdoor fan
      this.heatOut.set(t, 1.6, heatOutAmt(t) * (end ? 0 : 1), (u, s) => { const a = s[0] * Math.PI * 2, r = 0.7 * Math.sqrt(s[1]); return [-0.45 + Math.cos(a) * r * (1 + u), oy + Math.sin(a) * r * (1 + u) + u * 0.5, 0.6 + u * (3.0 + s[2]), (1 - u) * 0.8, 0.8 + 1.5 * u]; });
      // humid air -> droplets on the cold fins
      this.humid.set(t, 1.6, humidAmt(t), (u, s) => { const x = (s[0] - 0.5) * 3.0; return [x, iy + 0.1 + (s[1] - 0.5) * 0.6, lerp(1.6, 0.25, u), u < 0.9 ? 0.8 : 0, 0.7 + s[2]]; });
      const dg = dropsGrow(t); const o = new THREE.Object3D();
      for (let i = 0; i < 160; i++) {
        const fx = ((i * 0.6180339) % 1), fy = ((i * 0.7548776) % 1);
        const slide = ((t * 0.12 + fy) % 1);
        const y = 0.42 - 0.72 * (dg > 0.99 ? slide : fy);
        o.position.set(-1.5 + fx * 3.0, y, 0.24); o.scale.setScalar(Math.max(0.001, dg * (0.6 + 0.6 * ((i * 0.37) % 1)))); o.updateMatrix(); this.coilDrops.setMatrixAt(i, o.matrix);
      }
      this.coilDrops.instanceMatrix.needsUpdate = true; this.coilDrops.visible = dg > 0.01;
      const dr = drainAmt(t);
      this.drainDrops.forEach((d, i) => {
        const u = ((t * 0.45 + i / this.drainDrops.length) % 1);
        if (u < 0.75) this.drain.at(u / 0.75, d.position); else { this.drain.at(0.999, d.position); d.position.y -= (u - 0.75) * 4 * ((u - 0.75) * 4) * 0.9; }
        d.visible = dr > 0.01;
      });
    }

    // ---- cooler ----
    if (this.cooler.visible) {
      const xr = end ? 0.5 : xrayCooler(t);
      this.clShellMats.forEach((m) => { m.opacity = 1 - 0.7 * xr; m.depthWrite = xr < 0.05; });
      const tr = trickleAmt(t);
      this.padMats.forEach((m) => { m.opacity = 1 - 0.55 * xr; m.color.setRGB(lerp(1, 0.62, tr), lerp(1, 0.6, tr), lerp(1, 0.62, tr)); });
      this.clFan.rotation.z = -t * 16;
      const lv = tankLevel(t); this.water.scale.y = lv; this.water.position.y = -1.6 + 0.55 * lv / 2;
      const pa = pumpAmt(t);
      this.pumpDrops.forEach((d, i) => { this.pumpPath.at((t * 0.5 + i / this.pumpDrops.length) % 1, d.position); (d.material as THREE.MeshBasicMaterial).opacity = pa * xr; d.visible = pa > 0.01; });
      this.trickle.forEach((d, i) => {
        const sdx = (i * 0.6180339) % 1, sp = (i * 0.414) % 1; const u = (t * (0.35 + 0.15 * sp) + sdx) % 1;
        const faces = i % 3; const y = lerp(1.35, -0.95, u);
        if (faces === 0) d.position.set(-1.08, y, (sdx - 0.5) * 1.5); else if (faces === 1) d.position.set(1.08, y, (sdx - 0.5) * 1.5); else d.position.set((sdx - 0.5) * 2.0, y, -0.84);
        d.visible = tr > 0.01;
      });
      // hot outside air through the wet pads -> cool -> out of the fan
      const ai = airInAmt(t);
      this.airIn.set(t, 2.4, ai, (u, s) => { const sideX = s[0] < 0.5 ? -1 : 1; const x = sideX * lerp(2.8, 1.1, Math.min(1, u * 2)); return [x, 0.25 + (s[1] - 0.5) * 2.0, (s[2] - 0.5) * 1.4, u < 0.5 ? 0.8 : 0, 0.8 + s[3]]; });
      this.airOut.set(t, 2.4, ai, (u, s) => {
        const sideX = s[0] < 0.5 ? -1 : 1;
        if (u < 0.45) { const k = u / 0.45; return [sideX * lerp(1.05, 0.2, k), 0.25 + (s[1] - 0.5) * 2.0 * (1 - k) + 0.05 * k, lerp((s[2] - 0.5) * 1.4, 0.4, k), 0.5 * k, 0.6 + s[3] * 0.5]; }
        const k = (u - 0.45) / 0.55; return [(s[1] - 0.5) * 1.2 * (1 + 2 * k), 0.3 + (s[2] - 0.5) * 1.2 * (1 + k), 0.9 + k * (4.5 + s[3]), Math.sin(Math.PI * Math.min(1, k * 1.2 + 0.1)) * 0.8, 0.8 + 1.8 * k];
      });
      // water vapour leaves with the air and spreads into the room
      this.vapour.set(t, 3.4, vapourAmt(t), (u, s) => [(s[0] - 0.5) * 1.4 * (1 + 3 * u), 0.3 + u * (1.4 + 2.2 * s[1]), 0.9 + u * (4.0 + 2 * s[2]), Math.sin(Math.PI * u) * 0.16, 0.6 + 2.0 * u]);
    }
  }
}
void clamp01; void S;
