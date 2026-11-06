// 3D ceiling fan: canopy, downrod, see-through motor (copper stator coils, outer rotor shell carrying 3 pitched blades,
// start capacitor), rotating-magnetic-field glow, air pushed down; room with ceiling and floor. Host ROBO_B1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeHero, pose } from "../../../cast/src/cast/cast";
import { xray, fanAngle, fieldAmt, capGlow, airAmt, dusty, hostPose, hostVisible } from "./timeline";
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





const M = new THREE.Vector3(0.3, 3.8, 0); // motor centre
export class World {
  root = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = []; host = makeHero("ROBO", "B1"); back: THREE.Mesh;
  rotor = new THREE.Group(); field: THREE.Mesh[] = []; capMat: THREE.MeshBasicMaterial; air: Puffs; dust: THREE.Mesh[] = [];
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.7));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#14304a"); gr.addColorStop(0.7, "#0a1726"); gr.addColorStop(1, "#04080e"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshPhysicalMaterial({ color: 0x9fc6d9, roughness: 0.85 })); wall.position.set(0, 2.5, -2.2); this.root.add(wall);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(256, 224, (g) => { const gr = g.createLinearGradient(0, 0, 0, 224); gr.addColorStop(0, "#ffd27a"); gr.addColorStop(1, "#ff8a3c"); g.fillStyle = gr; g.fillRect(0, 0, 256, 224); g.strokeStyle = "#5a3a20"; g.lineWidth = 12; g.strokeRect(0, 0, 256, 224); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 224); g.stroke(); }) })); win.position.set(2.0, 2.5, -2.19); this.root.add(win);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshPhysicalMaterial({ color: 0xeef2f5, roughness: 0.9, side: THREE.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4.75, 0.8); this.root.add(ceil);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: 0x3a3f48, roughness: 0.35, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; this.root.add(floor);
    const mk = (c: number) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.8, transparent: true }); this.shell.push(m); return m; };
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.2, 32), mk(0xf5f5f5)); canopy.position.set(M.x, 4.65, M.z); this.root.add(canopy);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12), new THREE.MeshPhysicalMaterial({ color: 0xe8e8e8, metalness: 0.5 })); rod.position.set(M.x, 4.3, M.z); this.root.add(rod);
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.14, 0.12, 2, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.4 })); cap.position.set(M.x, 4.12, M.z); this.root.add(cap);
    this.capMat = glowMat([0.4, 1.6, 3.0]); const cg = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), this.capMat); cg.position.copy(cap.position); this.root.add(cg);
    // stator (fixed): iron core + 12 copper coils
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), new THREE.MeshPhysicalMaterial({ color: 0x5a5f68, metalness: 0.8, roughness: 0.35 })); core.position.copy(M); this.root.add(core);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const c = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.03, 8, 16), new THREE.MeshPhysicalMaterial({ color: 0xd9763a, metalness: 1, roughness: 0.3 })); c.position.set(M.x + Math.cos(a) * 0.33, M.y, M.z + Math.sin(a) * 0.33); c.rotation.y = -a; this.root.add(c); }
    for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 8, 20, Math.PI / 3), glowMat([1.6, 0.6, 3.0])); f.rotation.x = Math.PI / 2; f.position.copy(M); this.field.push(f); this.root.add(f); }
    // rotor shell (outer, rotates) + blades
    const shellM = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.34, 48, 1, true), mk(0xf7f7f7)); this.rotor.add(shellM);
    for (const y of [0.17, -0.17]) { const lid = new THREE.Mesh(new THREE.CircleGeometry(0.49, 48), mk(0xf0f0f0)); lid.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; lid.position.y = y; this.rotor.add(lid); }
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mk(0xd9a54a)); bot.position.y = -0.17; this.rotor.add(bot);
    const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xb98a5a, roughness: 0.45, clearcoat: 0.6 });
    for (let k = 0; k < 3; k++) { const g = new THREE.Group(); g.rotation.y = (k / 3) * Math.PI * 2;
      const arm = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.04, 0.12, 2, 0.02), new THREE.MeshPhysicalMaterial({ color: 0xd9a54a, metalness: 0.8, roughness: 0.3 })); arm.position.set(0.6, -0.05, 0); g.add(arm);
      const bl = new THREE.Mesh(new RoundedBoxGeometry(1.35, 0.025, 0.32, 2, 0.012), bladeMat); bl.position.set(1.4, -0.06, 0); bl.rotation.x = 0.22; g.add(bl);
      for (let d = 0; d < 6; d++) { const s = new THREE.Mesh(new THREE.CircleGeometry(0.03 + (d % 3) * 0.01, 8), new THREE.MeshBasicMaterial({ color: 0x8a7a6a, transparent: true })); s.rotation.x = -Math.PI / 2 + 0.22; s.position.set(0.9 + d * 0.2, -0.04 + 0.002, (d % 2 ? 0.07 : -0.07)); g.add(s); this.dust.push(s); }
      this.rotor.add(g); }
    this.rotor.position.copy(M); this.root.add(this.rotor);
    this.air = new Puffs(70, [0.3, 0.6, 1.0], 0.2, true); this.root.add(this.air.group);
    this.host.position.set(-1.6, 0, 0.8); this.host.rotation.y = 0.45; this.root.add(this.host);
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.8 * xr; m.depthWrite = xr < 0.05; });
    this.rotor.rotation.y = -fanAngle(t);
    const fa = fieldAmt(t); this.field.forEach((f, k) => { f.rotation.z = -t * 3 + (k * Math.PI * 2) / 3; (f.material as THREE.MeshBasicMaterial).opacity = fa * 0.9; f.visible = fa > 0.01; });
    this.capMat.opacity = capGlow(t) * (0.35 + 0.2 * Math.sin(t * 10));
    const ds = dusty(t); this.dust.forEach((d) => { (d.material as THREE.MeshBasicMaterial).opacity = ds; d.visible = ds > 0.01; });
    this.air.set(t, 1.6, airAmt(t), (u, s) => { const a = s[0] * Math.PI * 2, r = 0.6 + s[1] * 1.6; return [M.x + Math.cos(a) * r * (1 + 0.3 * u), M.y - 0.3 - u * (3.0 + s[2]), M.z + Math.sin(a) * r * (1 + 0.3 * u) * 0.6, Math.sin(Math.PI * u) * 0.6, 0.6 + 1.2 * u]; });
    this.host.visible = hostVisible(t); pose(this.host, hostPose(t), t);
  }
}
