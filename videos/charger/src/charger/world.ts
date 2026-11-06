// 3D phone charger: wall socket, see-through charger (diode bridge, transformer, capacitors, IC, USB port),
// USB cable, phone on a stand with a cut-away Li-ion battery; AC (orange, back-and-forth) -> DC (cyan, one way). Host VOLTI_B1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeHero, pose } from "../../../cast/src/cast/cast";
import { lerp, xray, acAmt, dcAmt, focus, ionAmt, battery, hostPose, hostVisible } from "./timeline";
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
  root = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = []; host = makeHero("VOLTI", "B1"); back: THREE.Mesh;
  ac: THREE.Mesh[] = []; dc: THREE.Mesh[] = []; dcPath: Path; ions: THREE.Mesh[] = []; hi: THREE.MeshBasicMaterial[] = [];
  screen: THREE.CanvasTexture; scrCtx: CanvasRenderingContext2D; lastB = -1; phoneShell: THREE.MeshPhysicalMaterial;
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#1b1640"); gr.addColorStop(0.7, "#0b0a1e"); gr.addColorStop(1, "#05040b"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5), new THREE.MeshPhysicalMaterial({ color: 0x2a2f52, roughness: 0.8 })); wall.position.set(0, 3.25, -1.0); this.root.add(wall);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: 0x23263a, roughness: 0.35, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; this.root.add(floor);
    const sock = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.7, 0.12, 3, 0.06), new THREE.MeshPhysicalMaterial({ color: 0xf5f5f0, roughness: 0.3 })); sock.position.set(0.3, 2.0, -0.92); this.root.add(sock);
    const sw = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.34, 0.06, 2, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x1e88e5 })); sw.position.set(0.85, 2.55, -0.84); this.root.add(sw);
    // charger body (see-through) + PCB + parts
    const mk = (c: number) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 0.9, transparent: true }); this.shell.push(m); return m; };
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 1.3, 0.75, 4, 0.14), mk(0xf8f8fa)); body.position.set(0.3, 2.0, -0.48); this.root.add(body);
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x0f6b3a, roughness: 0.5, clearcoat: 0.6 })); pcb.position.set(0.3, 2.0, -0.62); this.root.add(pcb);
    const hl = (r: number, x: number, y: number, z: number, c: [number, number, number]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12), glowMat(c)); m.position.set(x, y, z); this.root.add(m); this.hi.push(m.material as THREE.MeshBasicMaterial); return m; };
    for (let k = 0; k < 4; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 14), new THREE.MeshPhysicalMaterial({ color: 0x151515, roughness: 0.3 })); d.rotation.z = Math.PI / 2; d.position.set(-0.08 - (k % 2) * 0.2, 2.35 - Math.floor(k / 2) * 0.18, -0.55); this.root.add(d);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.03, 14), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1 })); band.rotation.z = Math.PI / 2; band.position.set(-0.02 - (k % 2) * 0.2, 2.35 - Math.floor(k / 2) * 0.18, -0.55); this.root.add(band); }
    hl(0.32, -0.18, 2.26, -0.55, [1.6, 1.4, 0.2]);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.22), new THREE.MeshPhysicalMaterial({ color: 0x2b2d33, roughness: 0.4 })); core.position.set(0.3, 2.05, -0.5); this.root.add(core);
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 24), new THREE.MeshPhysicalMaterial({ color: 0xf2c94c, roughness: 0.5 })); coil.position.set(0.3, 2.05, -0.38); coil.rotation.x = Math.PI / 2; this.root.add(coil);
    hl(0.34, 0.3, 2.05, -0.45, [1.8, 0.7, 0.15]);
    for (const y of [2.3, 1.9]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 20), new THREE.MeshPhysicalMaterial({ color: 0x1e5bd6, roughness: 0.3, clearcoat: 1 })); c.rotation.x = Math.PI / 2; c.position.set(0.68, y, -0.46); this.root.add(c); const top = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1 })); top.position.set(0.68, y, -0.31); this.root.add(top); }
    hl(0.32, 0.68, 2.1, -0.45, [0.4, 1.4, 2.6]);
    const ic = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x111111, clearcoat: 1 })); ic.position.set(0.0, 1.7, -0.58); this.root.add(ic);
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), new THREE.MeshPhysicalMaterial({ color: 0xcfd4da, metalness: 1, roughness: 0.2 })); usb.position.set(0.3, 1.38, -0.4); this.root.add(usb);
    // table + phone on a stand
    const tab = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 40), new THREE.MeshPhysicalMaterial({ color: 0x6d4c41, roughness: 0.5, clearcoat: 0.4 })); tab.position.set(1.3, 0.78, 0.7); this.root.add(tab);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.78, 16), tab.material); leg.position.set(1.3, 0.39, 0.7); this.root.add(leg);
    const stand = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.4, 2, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x222222 })); stand.position.set(1.3, 0.86, 0.75); this.root.add(stand);
    const phone = new THREE.Group(); phone.position.set(1.3, 1.62, 0.8); phone.rotation.x = -0.15; this.root.add(phone);
    this.phoneShell = new THREE.MeshPhysicalMaterial({ color: 0x1b1d24, roughness: 0.25, clearcoat: 1, transparent: true }); this.shell.push(this.phoneShell);
    phone.add(new THREE.Mesh(new RoundedBoxGeometry(0.78, 1.5, 0.09, 4, 0.08), this.phoneShell));
    const c = document.createElement("canvas"); c.width = 256; c.height = 512; this.scrCtx = c.getContext("2d")!; this.screen = new THREE.CanvasTexture(c); this.screen.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.38), new THREE.MeshBasicMaterial({ map: this.screen, transparent: true })); scr.position.z = 0.047; phone.add(scr); this.shell.push(scr.material as unknown as THREE.MeshPhysicalMaterial);
    // battery inside the phone: cathode (red) | separator | anode (dark) + ions
    const cath = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.1, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xd84343, roughness: 0.4 })); cath.position.set(-0.17, -0.05, 0.0); phone.add(cath);
    const anode = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.1, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x2b2d33, roughness: 0.4 })); anode.position.set(0.17, -0.05, 0.0); phone.add(anode);
    const sep = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.1, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xffffff })); sep.position.set(0, -0.05, 0.005); phone.add(sep);
    for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), glowMat([2.6, 2.2, 0.4])); this.ions.push(m); phone.add(m); }
    // cable from the USB port to the phone
    const cp = [new THREE.Vector3(0.3, 1.3, -0.35), new THREE.Vector3(0.35, 0.95, 0.0), new THREE.Vector3(0.9, 0.84, 0.6), new THREE.Vector3(1.3, 0.88, 0.85), new THREE.Vector3(1.3, 0.9, 0.82)];
    this.root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), 60, 0.03, 8, false), new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: 0.4 })));
    const dp = [new THREE.Vector3(-0.18, 2.26, -0.5), new THREE.Vector3(0.3, 2.05, -0.36), new THREE.Vector3(0.68, 2.1, -0.36), new THREE.Vector3(0.3, 1.38, -0.32), ...cp.slice(1)];
    this.dcPath = new Path(new THREE.CatmullRomCurve3(dp).getPoints(80));
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), glowMat([2.8, 1.0, 0.2])); this.ac.push(m); this.root.add(m); }
    for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), glowMat([0.3, 2.0, 3.0])); this.dc.push(m); this.root.add(m); }
    this.host.position.set(-1.75, 0, 0.7); this.host.rotation.y = 0.45; this.root.add(this.host);
  }
  drawScreen(b: number) {
    if (b === this.lastB) return; this.lastB = b; const g = this.scrCtx;
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#1a1f4a"); gr.addColorStop(1, "#0b0d1e"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = "#fff"; g.lineWidth = 8; g.strokeRect(78, 170, 100, 180); g.fillStyle = "#fff"; g.fillRect(108, 156, 40, 14);
    g.fillStyle = b > 80 ? "#4caf50" : "#ffe066"; const h = 166 * b / 100; g.fillRect(85, 343 - h, 86, h);
    g.fillStyle = "#fff"; g.font = "bold 56px sans-serif"; g.textAlign = "center"; g.fillText(b + "%", 128, 430); g.font = "bold 44px sans-serif"; g.fillText("⚡", 128, 120);
    this.screen.needsUpdate = true;
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.85 * xr; m.depthWrite = xr < 0.05; });
    this.phoneShell.opacity = t >= 28.0 && t < 33.9 ? 0.25 : 1 - 0.85 * xr * 0;
    const f = focus(t); this.hi.forEach((m, i) => { m.opacity = f === i + 1 ? 0.18 + 0.06 * Math.sin(t * 6) : 0; });
    const aa = acAmt(t); this.ac.forEach((m, i) => { const u = i / this.ac.length; const s = Math.sin(t * 9 + u * 6); m.position.set(lerp(0.3, -0.18, u) + 0.05 * s, lerp(2.0, 2.26, u), lerp(-0.9, -0.55, u) + 0.06 * s); (m.material as THREE.MeshBasicMaterial).opacity = aa * (0.6 + 0.4 * s); m.visible = aa > 0 && (xr > 0.3 || t < 10); });
    const da = dcAmt(t); this.dc.forEach((m, i) => { const u = (t * 0.12 + i / this.dc.length) % 1; this.dcPath.at(u, m.position); m.visible = da > 0 && (u > 0.5 || xr > 0.3); });
    const ia = ionAmt(t); this.ions.forEach((m, i) => { const k = ((i * 0.618) % 1), y = -0.55 + ((i * 0.37) % 1) * 1.0; const prog = Math.min(1, Math.max(0, (t - 28.2) * 0.25 - k * 0.6));
      m.position.set(lerp(-0.2, 0.2, prog) + 0.02 * Math.sin(t * 5 + i), y, 0.03); m.visible = ia > 0.01; });
    this.drawScreen(battery(t));
    this.host.visible = hostVisible(t); pose(this.host, hostPose(t), t);
  }
}
