// 3D wall geyser (storage water heater): cut-away tank with insulation, water slices coloured by temperature,
// heating element, thermostat + lamp, cold inlet, hot outlet to a steaming tap, wall switch, host BLAZE_B1.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { makeHero, pose } from "../../../cast/src/cast/cast";
import { lerp, xray, heat, sliceTemp, powerOn, lampOn, coldInAmt, convAmt, outAmt, thermoGlow, insulGlow, switchOff, hostPose, hostVisible } from "./timeline";
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




const C = new THREE.Vector3(0.5, 2.4, 0); const H = 2.4, R = 0.85, N = 12;
export class World {
  root = new THREE.Group(); shell: THREE.MeshPhysicalMaterial[] = []; slices: THREE.MeshPhysicalMaterial[] = []; host = makeHero("BLAZE", "B1");
  elemMat: THREE.MeshPhysicalMaterial; elemGlow: THREE.Mesh; lampMat: THREE.MeshBasicMaterial; thermoMat: THREE.MeshBasicMaterial; insulMat: THREE.MeshPhysicalMaterial;
  coldIn: THREE.Mesh[] = []; conv: Puffs; out: THREE.Mesh[] = []; outPath: Path; inPath: Path; steam: Puffs; rocker = new THREE.Group(); back: THREE.Mesh;
  key = new THREE.DirectionalLight(0xfff3e4, 2.6); rim = new THREE.DirectionalLight(0xc4dcff, 2.2); fill = new THREE.DirectionalLight(0xffe0c0, 0.8);
  constructor() {
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x50586a, 0.6));
    const bg = canvasTex(512, 1024, (g) => { const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, "#3a1f18"); gr.addColorStop(0.7, "#1a0f0c"); gr.addColorStop(1, "#070405"); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024); });
    this.back = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: bg })); this.root.add(this.back);
    const tiles = canvasTex(512, 512, (g) => { g.fillStyle = "#cfe3ea"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#9fb8c2"; g.lineWidth = 6; for (let k = 0; k <= 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); } });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(4, 3);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.5), new THREE.MeshPhysicalMaterial({ map: tiles, roughness: 0.25, clearcoat: 0.6 })); wall.position.set(0, 3.25, -1.0); this.root.add(wall);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshPhysicalMaterial({ color: 0x3a3f48, roughness: 0.35, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; this.root.add(floor);
    const mk = (c: number) => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 0.9, transparent: true }); this.shell.push(m); return m; };
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(R + 0.12, H - 0.4, 8, 48), mk(0xf6f7f9)); body.position.copy(C); this.root.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.135, R + 0.135, 0.12, 48), mk(0xc4221f)); band.position.set(C.x, C.y + 0.5, C.z); this.root.add(band);
    const brand = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshPhysicalMaterial({ map: canvasTex(512, 170, (g) => { g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 170); g.fillStyle = "#c4221f"; g.font = "bold 92px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("HOT 🔥", 256, 90); }), transparent: true }));
    brand.position.set(C.x, C.y + 0.1, R + 0.15); this.root.add(brand); this.shell.push(brand.material as THREE.MeshPhysicalMaterial);
    for (const y of [C.y + 0.9, C.y - 0.9]) { const br = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.12, 0.3, 2, 0.04), new THREE.MeshPhysicalMaterial({ color: 0x8a9099, metalness: 0.8 })); br.position.set(C.x, y, -0.92); this.root.add(br); }
    // insulation (visible in x-ray), inner tank, water slices
    this.insulMat = new THREE.MeshPhysicalMaterial({ color: 0xf2c94c, roughness: 0.9, transparent: true, opacity: 0.55, emissive: new THREE.Color(0, 0, 0), side: THREE.DoubleSide });
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.06, R + 0.06, H - 0.1, 48, 1, true), this.insulMat); ins.position.copy(C); this.root.add(ins);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.08, R - 0.08, H - 0.3, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xb8bec8, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); inner.position.copy(C); this.root.add(inner);
    const sh = (H - 0.4) / N;
    for (let i = 0; i < N; i++) { const m = new THREE.MeshPhysicalMaterial({ color: 0x3aa0e0, roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false, emissive: new THREE.Color(0, 0, 0) }); this.slices.push(m);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.12, R - 0.12, sh * 0.96, 40), m); s.position.set(C.x, C.y - (H - 0.4) / 2 + sh * (i + 0.5), C.z); this.root.add(s); }
    // heating element (U rod) + thermostat
    this.elemMat = new THREE.MeshPhysicalMaterial({ color: 0x8a8d93, metalness: 1, roughness: 0.35, emissive: new THREE.Color(0, 0, 0) });
    const ep = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.15, 0, 0.55), new THREE.Vector3(-0.15, 0, -0.35), new THREE.Vector3(0, 0, -0.5), new THREE.Vector3(0.15, 0, -0.35), new THREE.Vector3(0.15, 0, 0.55)]);
    const elem = new THREE.Mesh(new THREE.TubeGeometry(ep, 40, 0.045, 10, false), this.elemMat); elem.position.set(C.x, C.y - H / 2 + 0.35, C.z); this.root.add(elem);
    this.elemGlow = new THREE.Mesh(new THREE.TubeGeometry(ep, 40, 0.1, 8, false), glowMat([2.2, 0.6, 0.1])); this.elemGlow.position.copy(elem.position); this.root.add(this.elemGlow);
    this.thermoMat = glowMat([1.0, 2.0, 3.0]);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 10).rotateX(Math.PI / 2), this.thermoMat); tr.position.set(C.x + 0.4, C.y - H / 2 + 0.55, C.z + 0.25); this.root.add(tr);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24).rotateX(Math.PI / 2), mk(0xe6e8eb)); cap.position.set(C.x, C.y - H / 2 + 0.45, R + 0.08); this.root.add(cap);
    this.lampMat = glowMat([3.0, 0.8, 0.1]); const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), this.lampMat); lamp.position.set(C.x + 0.35, C.y + 0.5, R + 0.14); this.root.add(lamp);
    // pipes: cold in (blue, bottom left), hot out (red, from the top inside, down to a tap)
    const pipe = (pts: THREE.Vector3[], col: number, r = 0.06) => this.root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1), 60, r, 10, false), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.3, metalness: 0.4 })));
    const inPts = [new THREE.Vector3(-0.9, 0.1, -0.9), new THREE.Vector3(-0.9, 0.8, -0.6), new THREE.Vector3(C.x - 0.35, C.y - H / 2 - 0.35, 0.0), new THREE.Vector3(C.x - 0.35, C.y - H / 2 + 0.2, 0.0)];
    pipe(inPts, 0x1e88e5); this.inPath = new Path(new THREE.CatmullRomCurve3(inPts).getPoints(40));
    const outPts = [new THREE.Vector3(C.x + 0.35, C.y + H / 2 - 0.35, 0.0), new THREE.Vector3(C.x + 0.35, C.y - H / 2 - 0.3, 0.0), new THREE.Vector3(C.x + 0.9, 0.9, 0.0), new THREE.Vector3(C.x + 1.2, 0.95, 0.4), new THREE.Vector3(C.x + 1.25, 0.85, 0.7)];
    pipe(outPts, 0xd32f2f); this.outPath = new Path(new THREE.CatmullRomCurve3(outPts).getPoints(50));
    const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.25, 16), new THREE.MeshPhysicalMaterial({ color: 0xd8dde3, metalness: 1, roughness: 0.15 })); tap.position.set(C.x + 1.25, 0.75, 0.7); this.root.add(tap);
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.55, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x1e88e5, roughness: 0.3, side: THREE.DoubleSide })); bucket.position.set(C.x + 1.25, 0.28, 0.75); this.root.add(bucket);
    for (let i = 0; i < 12; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat([0.4, 1.2, 2.6])); this.coldIn.push(d); this.root.add(d); }
    for (let i = 0; i < 18; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glowMat([2.8, 0.7, 0.15])); this.out.push(d); this.root.add(d); }
    this.conv = new Puffs(50, [1.2, 0.45, 0.1], 0.14, true); this.steam = new Puffs(30, [0.92, 0.92, 0.96], 0.3, false); this.root.add(this.conv.group, this.steam.group);
    // wall switch
    const plate = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.5, 0.06, 2, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xf5f5f0, roughness: 0.3 })); plate.position.set(-0.8, 2.6, -0.96); this.root.add(plate);
    this.rocker.add(new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.26, 0.06, 2, 0.02), new THREE.MeshPhysicalMaterial({ color: 0xd32f2f, roughness: 0.3 }))); this.rocker.position.set(-0.8, 2.6, -0.91); this.root.add(this.rocker);
    this.host.position.set(-1.75, 0, 0.7); this.host.rotation.y = 0.45; this.root.add(this.host);
  }
  update(t: number, cam: THREE.PerspectiveCamera) {
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const side = new THREE.Vector3().crossVectors(dir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(dir, f); l.target.position.copy(cam.position).addScaledVector(dir, 8); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    this.back.position.copy(cam.position).addScaledVector(dir, 30); this.back.lookAt(cam.position);
    const xr = xray(t); this.shell.forEach((m) => { m.opacity = 1 - 0.82 * xr; m.depthWrite = xr < 0.05; });
    this.slices.forEach((m, i) => { const k = sliceTemp(i, N, t); m.color.setRGB(lerp(0.15, 0.95, k), lerp(0.55, 0.25, k), lerp(0.95, 0.1, k)); m.emissive.setRGB(0.25 * k, 0.05 * k, 0); m.opacity = 0.75 * xr; });
    const ig = insulGlow(t); this.insulMat.opacity = (0.12 + 0.45 * ig) * xr; this.insulMat.emissive.setRGB(0.35 * ig, 0.25 * ig, 0);
    const p = powerOn(t), h = heat(t); this.elemMat.emissive.setRGB(1.6 * p, 0.35 * p, 0.05 * p); (this.elemGlow.material as THREE.MeshBasicMaterial).opacity = 0.5 * p * xr; this.elemGlow.visible = p > 0 && xr > 0.02;
    this.lampMat.color.setRGB(3.0 * lampOn(t) + 0.15, 0.8 * lampOn(t) + 0.05, 0.1 * lampOn(t) + 0.02);
    const tg = thermoGlow(t); this.thermoMat.color.setRGB(1.0 + 2 * tg, 2.0, 3.0); this.thermoMat.opacity = 0.3 + 0.7 * tg;
    const ci = coldInAmt(t); this.coldIn.forEach((d, i) => { this.inPath.at((t * 0.5 + i / this.coldIn.length) % 1, d.position); d.visible = ci > 0; });
    const oa = outAmt(t); this.out.forEach((d, i) => { this.outPath.at((t * 0.45 + i / this.out.length) % 1, d.position); d.visible = oa > 0 && (xr > 0.3 || i % 2 === 0); });
    this.conv.set(t, 2.4, convAmt(t) * xr, (u, s) => { const ang = s[0] * Math.PI * 2, r = 0.15 + s[1] * 0.35; const y = C.y - H / 2 + 0.35 + u * (H - 0.6); const outw = u > 0.85 ? (u - 0.85) * 3 : 0; return [C.x + Math.cos(ang) * (r + outw), y, C.z + Math.sin(ang) * (r + outw), Math.sin(Math.PI * u) * 0.8, 0.7 + s[2]]; });
    this.steam.set(t, 1.6, oa * (h > 0.5 ? 1 : 0), (u, s) => [C.x + 1.25 + (s[0] - 0.5) * 0.4, 0.55 + u * 1.2, 0.75 + (s[1] - 0.5) * 0.4, Math.sin(Math.PI * u) * 0.45, 0.6 + 1.4 * u]);
    this.rocker.rotation.x = lerp(-0.25, 0.25, switchOff(t));
    this.host.visible = hostVisible(t); pose(this.host, hostPose(t), t);
  }
}
