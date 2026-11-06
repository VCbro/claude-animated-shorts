// 3D mixer grinder on a kitchen counter: see-through base (motor stator + armature, shaft, cooling fan, overload button),
// star coupler, transparent ribbed jar with 4 blades, food swirling into a vortex and blending into chutney. Host GEARO_B2.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeHero, pose } from "../../../cast/src/cast/cast";
import { lerp, xray, spin, running, blend, overheat, lidPress, hostPose, hostVisible } from "./timeline";
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





const J = new THREE.Vector3(0.4, 2.15, 0); // jar bottom centre
export class World {
  root = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = []; host = makeHero("GEARO", "B2"); back: THREE.Mesh;
  arm = new THREE.Group(); blades = new THREE.Group(); fan = new THREE.Group(); food: THREE.Mesh[] = []; paste: THREE.Mesh; pasteMat: THREE.MeshPhysicalMaterial;
  coilMat: THREE.MeshPhysicalMaterial; btn: THREE.Mesh; btnGlow: THREE.MeshBasicMaterial; lid = new THREE.Group(); hand: THREE.Mesh;
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#2a2140"); gr.addColorStop(0.7, "#120d1e"); gr.addColorStop(1, "#06040a"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const tiles = canvasTex(512, 512, (g) => { g.fillStyle = "#f3e9da"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#d8c8b0"; g.lineWidth = 5; for (let y = 0; y <= 512; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); for (let x = (y / 64) % 2 ? 0 : 64; x < 512; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); } } });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(4, 3);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5), new THREE.MeshPhysicalMaterial({ map: tiles, roughness: 0.4 })); wall.position.set(0, 3.25, -1.2); this.root.add(wall);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: 0x3a3340, roughness: 0.35, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; this.root.add(floor);
    const counter = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.0, 1.6, 3, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x5d4037, roughness: 0.5 })); counter.position.set(0.9, 0.5, -0.35); this.root.add(counter);
    const top = new THREE.Mesh(new RoundedBoxGeometry(3.5, 0.08, 1.7, 2, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x2b2b30, roughness: 0.15, clearcoat: 1 })); top.position.set(0.9, 1.04, -0.35); this.root.add(top);
    const mk = (c: number) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 0.9, transparent: true }); this.shell.push(m); return m; };
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.95, 1.0, 4, 0.16), mk(0xf5f5f5)); base.position.set(0.4, 1.555, 0); this.root.add(base);
    const stripe = new THREE.Mesh(new RoundedBoxGeometry(1.22, 0.12, 1.02, 2, 0.05), mk(0xc62828)); stripe.position.set(0.4, 1.25, 0); this.root.add(stripe);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xc62828, roughness: 0.3, clearcoat: 1 })); knob.position.set(0.4, 1.6, 0.52); this.root.add(knob);
    for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), new THREE.MeshBasicMaterial({ color: 0x333333 })); const a = -0.9 + k * 0.6; d.position.set(0.4 + Math.sin(a) * 0.22, 1.6 + Math.cos(a) * 0.22, 0.505); this.root.add(d); }
    this.btn = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 20).rotateZ(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xd32f2f, roughness: 0.3 })); this.btn.position.set(1.02, 1.25, 0.0); this.root.add(this.btn);
    this.btnGlow = glowMat([3.0, 0.4, 0.2]); const bg2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), this.btnGlow); bg2.position.copy(this.btn.position); this.root.add(bg2);
    // motor inside base
    this.coilMat = new THREE.MeshPhysicalMaterial({ color: 0xd9763a, metalness: 1, roughness: 0.3, emissive: new THREE.Color(0, 0, 0) });
    const stator = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.4, 32, 1, true), this.coilMat); stator.position.set(0.4, 1.5, 0); this.root.add(stator);
    for (let k = 0; k < 14; k++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.325, 0.012, 4, 32), this.coilMat); w.rotation.x = Math.PI / 2; w.position.set(0.4, 1.32 + k * 0.026, 0); this.root.add(w); }
    const armM = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.38, 12), new THREE.MeshPhysicalMaterial({ color: 0x5a5f68, metalness: 0.8, roughness: 0.35 })); this.arm.add(armM);
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.41), new THREE.MeshPhysicalMaterial({ color: 0xd9763a, metalness: 1 })); s.rotation.y = (k * Math.PI) / 6; this.arm.add(s); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 12), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1 })); shaft.position.y = 0.25; this.arm.add(shaft);
    const coup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 6), new THREE.MeshPhysicalMaterial({ color: 0x222222, roughness: 0.5 })); coup.position.y = 0.58; this.arm.add(coup);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.012), new THREE.MeshPhysicalMaterial({ color: 0x8a9099 })); b.rotation.y = (k * Math.PI) / 2; b.position.y = -0.24; this.arm.add(b); }
    this.arm.position.set(0.4, 1.5, 0); this.root.add(this.arm);
    // jar (ribbed glass look), handle, lid, blades
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 1.15, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, roughness: 0.03, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
    jar.position.set(J.x, J.y + 0.58, J.z); this.root.add(jar);
    for (let k = 0; k < 4; k++) { const rib = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.05, 0.06), new THREE.MeshPhysicalMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.5 })); const a = (k * Math.PI) / 2 + 0.4; rib.position.set(J.x + Math.cos(a) * 0.41, J.y + 0.58, J.z + Math.sin(a) * 0.41); rib.rotation.y = -a; this.root.add(rib); }
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.14, 40), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1, roughness: 0.2 })); collar.position.set(J.x, J.y - 0.03, J.z); this.root.add(collar);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 10, 24, Math.PI), new THREE.MeshPhysicalMaterial({ color: 0x222222, roughness: 0.4 })); handle.rotation.z = -Math.PI / 2; handle.position.set(J.x + 0.48, J.y + 0.6, J.z); this.root.add(handle);
    this.lid.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 40), new THREE.MeshPhysicalMaterial({ color: 0x1b1b1f, roughness: 0.35 }))); this.lid.position.set(J.x, J.y + 1.2, J.z); this.root.add(this.lid);
    this.hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x1c2028, roughness: 0.5 })); this.hand.scale.set(1.2, 0.6, 1); this.root.add(this.hand);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.012, 0.09), new THREE.MeshPhysicalMaterial({ color: 0xe6e9ee, metalness: 1, roughness: 0.15 })); b.rotation.y = (k * Math.PI) / 2; b.rotation.z = k % 2 ? 0.35 : -0.35; this.blades.add(b); }
    this.blades.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1 })));
    this.blades.position.set(J.x, J.y + 0.1, J.z); this.root.add(this.blades);
    // food
    const cols = [0xe53935, 0xe53935, 0xe53935, 0x43a047, 0x43a047, 0xf5f5f5, 0xffb300, 0xe53935, 0x43a047, 0xf5f5f5, 0xe53935, 0xffb300];
    cols.forEach((c, i) => { const m = new THREE.Mesh(i % 3 === 1 ? new THREE.CapsuleGeometry(0.05, 0.16, 4, 8) : new THREE.SphereGeometry(0.11, 14, 10), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.35, clearcoat: 0.6 })); this.food.push(m); this.root.add(m); });
    this.pasteMat = new THREE.MeshPhysicalMaterial({ color: 0xd84a2a, roughness: 0.3, clearcoat: 0.6, transparent: true });
    this.paste = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.45, 40), this.pasteMat); this.paste.position.set(J.x, J.y + 0.3, J.z); this.root.add(this.paste);
    this.host.position.set(-1.75, 0, 0.7); this.host.rotation.y = 0.45; this.root.add(this.host);
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.85 * xr; m.depthWrite = xr < 0.05; });
    const a = spin(t), run = running(t), oh = overheat(t);
    this.arm.rotation.y = a; this.blades.rotation.y = a;
    this.coilMat.emissive.setRGB(0.9 * oh + 0.15 * run * xr, 0.15 * oh, 0);
    this.btn.position.x = 1.02 + 0.06 * oh; this.btnGlow.opacity = oh * (0.5 + 0.4 * Math.sin(t * 10));
    const bl = blend(t);
    this.food.forEach((m, i) => {
      const ph = (i / this.food.length) * Math.PI * 2, swirl = run ? a * 0.18 + ph : ph;
      const lift = run ? 0.15 + 0.55 * (0.5 + 0.5 * Math.sin(a * 0.07 + i)) : 0.12 + (i % 4) * 0.12;
      const r = run ? 0.32 - 0.15 * (0.5 + 0.5 * Math.sin(a * 0.05 + i * 1.3)) : 0.1 + (i % 3) * 0.1;
      m.position.set(J.x + Math.cos(swirl) * r, J.y + lift, J.z + Math.sin(swirl) * r); m.rotation.set(a * 0.3 + i, a * 0.2, 0);
      m.scale.setScalar(Math.max(0.01, 1 - bl)); m.visible = bl < 0.99;
    });
    this.paste.visible = bl > 0.01; this.paste.scale.set(1, bl, 1); this.paste.position.y = J.y + 0.08 + 0.22 * bl; this.paste.rotation.y = a * 0.2; this.pasteMat.opacity = bl;
    const lp = lidPress(t); this.hand.visible = lp > 0.01; this.hand.position.set(J.x, J.y + 1.42 + 0.3 * (1 - lp), J.z); this.lid.position.y = J.y + 1.2 - 0.02 * lp;
    this.host.visible = hostVisible(t); pose(this.host, hostPose(t), t);
  }
}
