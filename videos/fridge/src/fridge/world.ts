// 3D fridge: cabinet with see-through shell + doors, food, frosted freezer evaporator, compressor, rear condenser
// grid, capillary tube; refrigerant loop colour-coded; heat in (food -> evaporator) and out (condenser -> room).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { S, sceneAt, xray, refrigAmt, heatInAmt, heatOutAmt, compGlow, capGlow, frost, wallGap, hotFood, doorOpen } from "./timeline";
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
  root = new THREE.Group(); fridge = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = [];
  doorF = new THREE.Group(); doorR = new THREE.Group(); loop: Path; refr: THREE.Mesh[] = [];
  uEvap = 0; uCompIn = 0; uCompOut = 0; uCap = 0; compMat: THREE.MeshPhysicalMaterial; capMat: THREE.MeshBasicMaterial;
  heatIn: Puffs; heatOut: Puffs; cold: Puffs; steam: Puffs; frostM: THREE.InstancedMesh; wall: THREE.Mesh; bowl = new THREE.Group(); back: THREE.Mesh;
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1b2a44"); gr.addColorStop(0.75, "#0c1424"); gr.addColorStop(1, "#05070d"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); g.fillStyle = "rgba(160,200,255,0.05)"; for (let x = 0; x < 512; x += 48) g.fillRect(x, 0, 20, 1024); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a2f3a, roughness: 0.35, clearcoat: 0.5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.32; this.root.add(floor);
    this.wall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.2), new THREE.MeshPhysicalMaterial({ color: 0xd8cfc2, roughness: 0.9 })); this.wall.position.set(0, 0.6, -1.85); this.root.add(this.wall);
    const mk = (c: number, r = 0.22) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0.3, clearcoat: 0.8, transparent: true }); this.shell.push(m); return m; };
    const steel = mk(0xcfd4da, 0.25);
    const cab = new THREE.Mesh(new RoundedBoxGeometry(2.3, 4.5, 1.6, 4, 0.12), steel); this.fridge.add(cab);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(2.0, 4.1, 1.3), new THREE.MeshPhysicalMaterial({ color: 0xeef3f8, roughness: 0.5, side: THREE.BackSide })); inner.position.z = 0.1; this.fridge.add(inner);
    const div = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 1.3), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.4 })); div.position.set(0, 0.75, 0.1); this.fridge.add(div);
    for (const y of [-0.35, -1.25]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.03, 1.2), new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.05, transparent: true, opacity: 0.5 })); sh.position.set(0, y, 0.1); this.fridge.add(sh); }
    // doors (hinge on the left), handles
    const door = (h: number, y: number, g: THREE.Group) => { const d = new THREE.Mesh(new RoundedBoxGeometry(2.3, h, 0.12, 3, 0.05), mk(0xdfe3e8, 0.2)); d.position.set(1.15, 0, 0.06); g.add(d);
      const hd = new THREE.Mesh(new RoundedBoxGeometry(0.08, h * 0.45, 0.12, 2, 0.03), mk(0x8a9099, 0.3)); hd.position.set(2.1, 0, 0.2); g.add(hd); g.position.set(-1.15, y, 0.8); this.fridge.add(g); };
    door(1.38, 1.45, this.doorF); door(3.0, -0.75, this.doorR);
    // food
    const food: [number, number, number, number, number][] = [[-0.6, -0.95, 0.3, 0xe53935, 0.22], [0.0, -0.95, 0.25, 0xffb300, 0.2], [0.55, -0.85, 0.2, 0x43a047, 0.32], [-0.5, -1.95, 0.3, 0x8e24aa, 0.25], [0.4, -1.95, 0.1, 0xfb8c00, 0.22]];
    for (const [x, y, z, c, r] of food) { const f = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.6 })); f.position.set(x, y + r - 0.25, z); this.fridge.add(f); }
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 16), new THREE.MeshPhysicalMaterial({ color: [0x4fc3f7, 0xa5d6a7, 0xffcc80][k], roughness: 0.05, transparent: true, opacity: 0.8, clearcoat: 1 })); b.position.set(-0.6 + k * 0.3, 0.25, 0.35); this.fridge.add(b); }
    // freezer evaporator (serpentine in the back wall) + frost
    const cu = new THREE.MeshPhysicalMaterial({ color: 0xd9763a, metalness: 1, roughness: 0.3 });
    const evapRows = [1.95, 1.7, 1.45, 1.2, 0.98];
    const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const pts: THREE.Vector3[] = [P(-0.85, 2.05, -0.5)];
    evapRows.forEach((y, i) => { const a = i % 2 ? 0.85 : -0.85; pts.push(P(a, y, -0.5), P(-a, y, -0.5)); });
    const iE = pts.length - 1;
    pts.push(P(0.95, 0.6, -0.72), P(0.95, -1.6, -0.72), P(0.55, -1.75, -1.05));
    const iCi = pts.length - 1; pts.push(P(0.55, -1.95, -1.05), P(0.1, -1.95, -1.05)); const iCo = pts.length - 1;
    const condRows = [-1.55, -1.1, -0.65, -0.2, 0.25, 0.7, 1.15, 1.6];
    pts.push(P(-0.9, -1.55, -0.98)); condRows.forEach((y, i) => { const a = i % 2 ? 0.9 : -0.9; pts.push(P(a, y, -0.98), P(-a, y, -0.98)); });
    pts.push(P(-0.9, 1.95, -0.95)); const iCap = pts.length - 1; pts.push(P(-0.9, 2.05, -0.6), P(-0.85, 2.05, -0.5));
    this.loop = new Path(pts); this.uEvap = this.loop.uOf(iE); this.uCompIn = this.loop.uOf(iCi); this.uCompOut = this.loop.uOf(iCo); this.uCap = this.loop.uOf(iCap);
    const tube = (a: number, b: number, r: number, m: THREE.Material) => this.fridge.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(a, b + 1), false, "catmullrom", 0.02), (b - a) * 12, r, 8, false), m));
    tube(0, iE, 0.035, cu); tube(iE, iCi, 0.03, cu); tube(iCo, iCap, 0.032, new THREE.MeshPhysicalMaterial({ color: 0x23262b, metalness: 0.6, roughness: 0.4 }));
    this.capMat = glowMat([0.4, 1.4, 2.6]); this.fridge.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(iCap, pts.length)), 30, 0.03, 8, false), this.capMat));
    for (let k = 0; k < 9; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.012, 0.012), new THREE.MeshPhysicalMaterial({ color: 0x3a3e45, metalness: 0.6 })); w.position.set(0, -1.6 + k * 0.42, -0.95); w.rotation.z = 0; this.fridge.add(w); }
    this.compMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1d21, roughness: 0.35, metalness: 0.4, emissive: new THREE.Color(0, 0, 0) });
    const comp = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.3, 6, 20), this.compMat); comp.position.set(0.32, -1.88, -1.05); this.fridge.add(comp);
    this.frostM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.025, 0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, emissive: new THREE.Color(0.35, 0.45, 0.55) }), 260);
    const o = new THREE.Object3D(); for (let i = 0; i < 260; i++) { const y = evapRows[i % 5]; o.position.set(-0.9 + ((i * 0.618) % 1) * 1.8, y + (((i * 0.37) % 1) - 0.5) * 0.08, -0.47); o.scale.setScalar(0.6 + ((i * 0.77) % 1)); o.updateMatrix(); this.frostM.setMatrixAt(i, o.matrix); }
    this.fridge.add(this.frostM);
    for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), glowMat([1, 1, 1])); this.refr.push(m); this.fridge.add(m); }
    // hot food bowl (tip 2)
    const bowlM = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: 0.3, side: THREE.DoubleSide, clearcoat: 1 }));
    const soup = new THREE.Mesh(new THREE.CircleGeometry(0.33, 24), new THREE.MeshPhysicalMaterial({ color: 0xe0802a, roughness: 0.3, emissive: new THREE.Color(0.3, 0.08, 0) })); soup.rotation.x = -Math.PI / 2; soup.position.y = -0.04;
    this.bowl.add(bowlM, soup); this.root.add(this.bowl);
    this.heatIn = new Puffs(40, [1.0, 0.4, 0.08], 0.16, true); this.heatOut = new Puffs(60, [1.1, 0.42, 0.08], 0.26, true); this.cold = new Puffs(50, [0.3, 0.6, 1.0], 0.3, true); this.steam = new Puffs(30, [0.9, 0.9, 0.95], 0.25, false);
    this.fridge.add(this.heatIn.group, this.heatOut.group, this.cold.group); this.root.add(this.steam.group, this.fridge);
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const sc = sceneAt(t), dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    this.wall.visible = sc === 4 && t < 34.6; this.fridge.position.z = this.wall.visible ? -0.8 + 0.8 * wallGap(t) : 0;
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.82 * xr; m.depthWrite = xr < 0.05; });
    const dO = doorOpen(t); this.doorR.rotation.y = -dO * 1.6;
    this.cold.set(t, 1.4, dO > 0.05 ? dO : sc === 5 ? 0.5 : 0, (u, s) => [-0.6 + s[0] * 1.6, -1.6 + s[1] * 1.8 - u * 0.6, 0.9 + u * (1.6 + s[2]), Math.sin(Math.PI * u) * 0.7, 0.8 + 1.4 * u]);
    this.frostM.visible = frost(t) > 0.5;
    const cg = compGlow(t); this.compMat.emissive.setRGB(0.35 * cg, 0.07 * cg, 0.01 * cg); this.capMat.opacity = 0.8 * capGlow(t) * (0.7 + 0.3 * Math.sin(t * 9));
    const ra = refrigAmt(t), cold = new THREE.Color(0.35, 1.1, 2.6), gas = new THREE.Color(0.6, 1.4, 2.4), hot = new THREE.Color(3.0, 0.55, 0.12), warm = new THREE.Color(2.4, 1.2, 0.3);
    this.refr.forEach((m, i) => { const u = (((t * 0.06 + i / this.refr.length) % 1) + 1) % 1; this.loop.at(u, m.position); const c = (m.material as THREE.MeshBasicMaterial).color;
      if (u < this.uEvap) c.copy(cold).lerp(gas, u / this.uEvap); else if (u < this.uCompIn) c.copy(gas); else if (u < this.uCompOut) c.copy(gas).lerp(hot, (u - this.uCompIn) / (this.uCompOut - this.uCompIn)); else if (u < this.uCap) c.copy(hot).lerp(warm, (u - this.uCompOut) / (this.uCap - this.uCompOut)); else c.copy(cold);
      (m.material as THREE.MeshBasicMaterial).opacity = ra; m.visible = ra > 0.01; });
    this.heatIn.set(t, 2.0, heatInAmt(t), (u, s) => [-0.7 + s[0] * 1.4, -1.8 + s[1] * 2.4 + u * (1.6 - s[1] * 0.4), 0.4 - u * 0.85, Math.sin(Math.PI * u) * 0.8, 0.7 + s[2]]);
    this.heatOut.set(t, 2.2, heatOutAmt(t), (u, s) => [-0.9 + s[0] * 1.8, -1.6 + s[1] * 3.2 + u * 2.4, -1.1 - u * (0.6 + s[2]), Math.sin(Math.PI * u) * 0.7, 0.8 + 1.4 * u]);
    const hf = hotFood(t); this.bowl.visible = hf; this.bowl.position.set(0.1, 0.1, 1.9);
    this.steam.set(t, 1.5, hf ? 1 : 0, (u, s) => [0.1 + (s[0] - 0.5) * 0.4, 0.15 + u * 1.4, 1.9 + (s[1] - 0.5) * 0.4, Math.sin(Math.PI * u) * 0.5, 0.6 + 1.5 * u]);
  }
}
void S;
