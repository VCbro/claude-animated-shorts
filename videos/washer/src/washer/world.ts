// 3D front-load washing machine (cut-away cabinet, perforated drum with lifters, tumbling clothes, water, foam,
// motor + belt, inlet valve, drain pump + filter) and the host GEARO_B1 from the channel cast.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeHero, pose } from "../../../cast/src/cast/cast";
import { sceneAt, lerp, xray, drumAngle, spinning, waterLevel, inletAmt, foamAmt, flingAmt, drainAmt, overload, filterOut, hostPose, hostVisible } from "./timeline";
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



const DC = new THREE.Vector3(0.4, 1.25, 0.0); // drum centre (axis along z)
export class World {
  root = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = []; drum = new THREE.Group(); clothes: THREE.Mesh[] = []; water: THREE.Mesh;
  host = makeHero("GEARO", "B1"); belt: THREE.Mesh; motorPul = new THREE.Group(); inlet: THREE.Mesh[] = []; fling: THREE.Mesh[] = []; drain: Path; drainDrops: THREE.Mesh[] = [];
  foam: Puffs; filter = new THREE.Group(); back: THREE.Mesh;
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1b3050"); gr.addColorStop(0.75, "#0c1626"); gr.addColorStop(1, "#05070d"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); g.fillStyle = "rgba(160,220,255,0.06)"; for (let y = 0; y < 1024; y += 64) for (let x = (y / 64) % 2 ? 0 : 32; x < 512; x += 64) g.fillRect(x, y, 30, 30); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(10, 64), new THREE.MeshPhysicalMaterial({ color: 0x24303f, roughness: 0.3, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; this.root.add(floor);
    const mk = (c: number, r = 0.25) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 0.8, transparent: true }); this.shell.push(m); return m; };
    const white = mk(0xf3f5f7);
    for (const [w, h, d, x, y, z] of [[0.08, 2.7, 1.9, -0.61, 1.35, 0], [0.08, 2.7, 1.9, 1.41, 1.35, 0], [2.1, 0.08, 1.9, 0.4, 2.66, 0], [2.1, 0.08, 1.9, 0.4, 0.04, 0], [2.1, 2.7, 0.08, 0.4, 1.35, -0.91]] as const) { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.03), white); b.position.set(x, y, z); this.root.add(b); }
    const fs = new THREE.Shape(); fs.moveTo(-1.05, -1.35); fs.lineTo(1.05, -1.35); fs.lineTo(1.05, 1.35); fs.lineTo(-1.05, 1.35); fs.closePath();
    const hole = new THREE.Path(); hole.absarc(DC.x - 0.4, DC.y - 1.35, 0.7, 0, Math.PI * 2, true); fs.holes.push(hole);
    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 64 }), white); front.position.set(0.4, 1.35, 0.89); this.root.add(front);
    const panel = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.42, 0.06, 2, 0.03), mk(0xdfe4ea)); panel.position.set(0.4, 2.42, 0.95); this.root.add(panel);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 32).rotateX(Math.PI / 2), mk(0xc8ccd4, 0.2)); knob.position.set(0.95, 2.42, 1.0); this.root.add(knob);
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), glowMat([0.4, 1.6, 2.6])); disp.position.set(0.35, 2.42, 0.99); this.root.add(disp);
    const drawer = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.22, 0.08, 2, 0.03), mk(0xe8ecf0)); drawer.position.set(-0.25, 2.42, 0.98); this.root.add(drawer);
    // door: chrome ring + glass
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 16, 64), new THREE.MeshPhysicalMaterial({ color: 0xc8ccd4, metalness: 1, roughness: 0.2 })); ring.position.set(DC.x, DC.y, 0.98); this.root.add(ring);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.7, 40, 16, 0, Math.PI * 2, 0, 0.5), new THREE.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.0, transparent: true, opacity: 0.1, envMapIntensity: 0.4, depthWrite: false }));
    glass.rotation.x = Math.PI / 2; glass.position.set(DC.x, DC.y, 0.72); this.root.add(glass);
    // drum: perforated steel cylinder (open front), 3 lifters
    const perf = canvasTex(512, 256, (g) => { g.fillStyle = "#c9ced6"; g.fillRect(0, 0, 512, 256); g.fillStyle = "#3a3f47"; for (let y = 8; y < 256; y += 18) for (let x = (y / 18) % 2 ? 6 : 15; x < 512; x += 18) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } });
    perf.wrapS = THREE.RepeatWrapping; perf.repeat.set(3, 1);
    const shellD = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.4, 64, 1, true).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: perf, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }));
    this.drum.add(shellD);
    const backD = new THREE.Mesh(new THREE.CircleGeometry(0.88, 64), new THREE.MeshPhysicalMaterial({ color: 0xaab0b8, metalness: 0.9, roughness: 0.35 })); backD.position.z = -0.7; this.drum.add(backD);
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.22, 1.3, 2, 0.05), new THREE.MeshPhysicalMaterial({ color: 0xe0e4ea, roughness: 0.3 })); const a = (k / 3) * Math.PI * 2; l.position.set(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0); l.rotation.z = a; this.drum.add(l); }
    const pul = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 48).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x8a9099, metalness: 1, roughness: 0.3 })); pul.position.z = -0.95; this.drum.add(pul);
    for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.05), pul.material); sp.rotation.z = (k * Math.PI) / 3; sp.position.z = -0.95; this.drum.add(sp); }
    this.drum.position.copy(DC); this.root.add(this.drum);
    // clothes (soft blobs) + water + foam
    const cols = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0x8e24aa, 0xff7043, 0xffffff];
    cols.forEach((c, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color(1, 1, 1) })); m.scale.set(1.3, 0.7, 1.0 + (i % 3) * 0.2); this.clothes.push(m); this.root.add(m); });
    this.water = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 1.36, 48, 1, false).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x3aa0e0, roughness: 0.05, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false, clippingPlanes: [] }));
    this.water.position.copy(DC); this.root.add(this.water);
    this.foam = new Puffs(50, [1, 1, 1], 0.16, false); this.root.add(this.foam.group);
    // motor + belt (behind/below the drum)
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 24).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x2a2d33, metalness: 0.5, roughness: 0.4 })); motor.position.set(0.4, 0.3, -0.8); this.root.add(motor);
    const mp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xc8ccd4, metalness: 1 })); this.motorPul.add(mp); this.motorPul.position.set(0.4, 0.3, -0.95); this.root.add(this.motorPul);
    const beltPath = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22, 1.25, -0.95), new THREE.Vector3(0.4, 1.89, -0.95), new THREE.Vector3(1.02, 1.25, -0.95), new THREE.Vector3(0.49, 0.3, -0.95), new THREE.Vector3(0.31, 0.3, -0.95)].map((v) => v.add(new THREE.Vector3(0.4 - 0.4, 0, 0))), true);
    this.belt = new THREE.Mesh(new THREE.TubeGeometry(beltPath, 80, 0.025, 6, true), new THREE.MeshPhysicalMaterial({ color: 0x111111, roughness: 0.6 })); this.root.add(this.belt);
    // inlet valve + hose at the top back
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 16), new THREE.MeshPhysicalMaterial({ color: 0x3a8bff, roughness: 0.4 })); valve.position.set(-0.3, 2.45, -0.85); this.root.add(valve);
    for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), glowMat([0.4, 1.4, 2.6])); this.inlet.push(d); this.root.add(d); }
    for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glowMat([0.5, 1.5, 2.6])); this.fling.push(d); this.root.add(d); }
    // drain pump + filter (bottom front right) + hose out the back
    const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 20).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x2a2d33, roughness: 0.4 })); pump.position.set(0.95, 0.3, 0.5); this.root.add(pump);
    const fcap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 20).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: 0.3 })); this.filter.add(fcap);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 16, 1, true).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9aa0a8, wireframe: true })); mesh.position.z = -0.2; this.filter.add(mesh);
    this.filter.position.set(0.95, 0.3, 0.9); this.root.add(this.filter);
    const dp = [new THREE.Vector3(0.95, 0.3, 0.4), new THREE.Vector3(1.2, 0.5, -0.4), new THREE.Vector3(1.2, 2.2, -1.1), new THREE.Vector3(1.6, 2.0, -1.6), new THREE.Vector3(1.7, 0.2, -1.8)];
    this.root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(dp), 60, 0.05, 8, false), new THREE.MeshPhysicalMaterial({ color: 0x8a96a5, roughness: 0.5 })));
    this.drain = new Path(new THREE.CatmullRomCurve3(dp).getPoints(40));
    for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), glowMat([0.5, 1.5, 2.6])); this.drainDrops.push(d); this.root.add(d); }
    // host
    this.host.position.set(-1.65, 0, 0.6); this.host.rotation.y = 0.45; this.root.add(this.host);
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.85 * xr; m.depthWrite = xr < 0.05; });
    const a = drumAngle(t), sp = spinning(t); this.drum.rotation.z = -a; this.motorPul.rotation.z = -a * 7.7;
    // clothes: tumble at the bottom while washing, pinned to the wall while spinning
    const n = this.clothes.length, many = overload(t) ? 1 : 0;
    this.clothes.forEach((c, i) => {
      const off = (i / n) * Math.PI * 2;
      const tumble = -Math.PI / 2 + 0.9 * Math.sin(a + off) + 0.25 * Math.sin(a * 1.7 + i);
      const ang = tumble * (1 - sp) + (-a + off) * sp, r = lerp(0.35 + 0.25 * ((i * 0.37) % 1), 0.68, sp) - many * 0.15;
      c.position.set(DC.x + Math.cos(ang) * r, DC.y + Math.sin(ang) * r, DC.z - 0.4 + (i % 3) * 0.35); c.rotation.set(a * 0.7 + i, a * 0.4, ang);
      c.scale.setScalar(1 + many * 0.55).multiply(new THREE.Vector3(1.3, 0.7, 1.0 + (i % 3) * 0.2));
    });
    const wl = waterLevel(t); this.water.visible = wl > 0.01; this.water.scale.set(1, wl * 1.0 + 0.001, 1); this.water.position.y = DC.y - 0.86 + 0.86 * wl;
    this.foam.set(t, 1.6, foamAmt(t), (u, s) => { const ang = -Math.PI / 2 + (s[0] - 0.5) * 2.4; const r = 0.3 + s[1] * 0.45; return [DC.x + Math.cos(ang) * r, DC.y - 0.86 + 0.86 * wl + 0.05 + u * 0.2, DC.z + (s[2] - 0.5) * 1.1 + 0.3, Math.sin(Math.PI * u) * 0.9, 0.6 + s[3]]; });
    const ia = inletAmt(t); this.inlet.forEach((d, i) => { const u = (t * 1.4 + i / this.inlet.length) % 1; d.position.set(lerp(-0.3, 0.1, u), lerp(2.35, DC.y + 0.2, u * u), lerp(-0.85, -0.3, u)); d.visible = ia > 0; });
    const fa = flingAmt(t); this.fling.forEach((d, i) => { const u = (t * 2.2 + i / this.fling.length) % 1; const ang = i * 2.39 - a; const r = 0.88 + u * 0.12; d.position.set(DC.x + Math.cos(ang) * r, DC.y + Math.sin(ang) * r - u * u * 0.4, DC.z + ((i * 0.618) % 1 - 0.5) * 1.2); d.visible = fa > 0.01; });
    const dr = drainAmt(t); this.drainDrops.forEach((d, i) => { this.drain.at((t * 0.6 + i / this.drainDrops.length) % 1, d.position); d.visible = dr > 0.01; });
    this.filter.position.z = 0.9 + filterOut(t) * 0.6;
    // host
    this.host.visible = hostVisible(t); pose(this.host, hostPose(t), t);
    void sceneAt;
  }
}
