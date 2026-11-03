// 3D world for the iron short: ironing board + shirt (wrinkles flatten under the soleplate), a cut-away steam iron
// (shell, soleplate, heating element, bimetal thermostat, indicator light, tank), cord + plug + socket, steam, sparks.
import * as THREE from "three";
import {
  S, sceneAt, sstep, lerp, clamp01, ironX, pressed, clothVisible, ironMatrix, xray, powerOn, bend, heat, lightOn, pulsesAmt,
  steamAmt, dropsAmt, cordDamage, plugOut, upright,
} from "./timeline";

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
let seed = 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const glowMat = (c: [number, number, number]) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

// iron outline in the XY plane (tip +X), scaled by k
const outline = (k = 1, inset = 0) => {
  const s = new THREE.Shape();
  const b = -1.62 * k + inset, w = 1.0 * k - inset, tip = 1.9 * k - inset * 1.6;
  s.moveTo(b, -w + 0.12); s.quadraticCurveTo(b, -w, b + 0.12, -w);
  s.bezierCurveTo(0.2 * k, -w * 1.02, 1.2 * k, -w * 0.7, tip, 0);
  s.bezierCurveTo(1.2 * k, w * 0.7, 0.2 * k, w * 1.02, b + 0.12, w);
  s.quadraticCurveTo(b, w, b, w - 0.12); s.closePath();
  return s;
};
const flat = (g: THREE.BufferGeometry) => { g.rotateX(-Math.PI / 2); return g; }; // shape XY -> XZ, extrude along +Y

class Pulses {
  group = new THREE.Group(); meshes: THREE.Mesh[] = [];
  constructor(n: number, color: [number, number, number], r: number, private path: THREE.Curve<THREE.Vector3>) {
    const geo = new THREE.SphereGeometry(r, 12, 8);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, glowMat(color)); this.meshes.push(m); this.group.add(m); }
  }
  set(t: number, speed: number, amount: number) {
    this.group.visible = amount > 0.01; const n = this.meshes.length;
    this.meshes.forEach((m, i) => {
      const u = (((t * speed + i / n) % 1) + 1) % 1; m.position.copy(this.path.getPointAt(u));
      (m.material as THREE.MeshBasicMaterial).opacity = amount * (0.5 + 0.5 * Math.sin(Math.PI * u)); m.scale.setScalar(0.7 + 0.5 * Math.sin(Math.PI * u));
    });
  }
}
const curve = (pts: [number, number, number][], closed = false) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed, "centripetal");

// soft particle cloud (steam / heat shimmer / sparks) as sprites with a radial texture
let puffTex: THREE.Texture | null = null;
const getPuffTex = () => puffTex ??= canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
class Puffs {
  pts = new THREE.Group(); sprites: THREE.Sprite[] = []; n: number; seeds: Float32Array; size: number;
  mat = { uniforms: { scale: { value: 0 } } }; // kept for API compatibility
  constructor(n: number, color: [number, number, number], size: number, additive: boolean) {
    this.n = n; this.size = size;
    this.seeds = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) this.seeds[i] = rnd();
    for (let i = 0; i < n; i++) {
      const m = new THREE.SpriteMaterial({ map: getPuffTex(), color: new THREE.Color(...color), transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !additive });
      const sp = new THREE.Sprite(m); this.sprites.push(sp); this.pts.add(sp);
    }
  }
  set(t: number, life: number, amount: number, emit: (i: number, u: number, s: Float32Array) => [number, number, number, number, number]) {
    this.pts.visible = amount > 0.01; if (!this.pts.visible) return;
    for (let i = 0; i < this.n; i++) {
      const u = (((t / life + this.seeds[i * 4]) % 1) + 1) % 1;
      const [x, y, z, al, sz] = emit(i, u, this.seeds.subarray(i * 4, i * 4 + 4));
      const sp = this.sprites[i]; sp.position.set(x, y, z); sp.scale.setScalar(this.size * sz * 2); (sp.material as THREE.SpriteMaterial).opacity = al * amount;
    }
  }
}

export class World {
  root = new THREE.Group();
  bg: THREE.Mesh; bgMat: THREE.ShaderMaterial;
  board = new THREE.Group(); cloth: THREE.Mesh; clothBase: Float32Array;
  iron = new THREE.Group(); shellMats: THREE.MeshPhysicalMaterial[] = []; soleMat: THREE.MeshPhysicalMaterial; elemMat: THREE.MeshPhysicalMaterial; elemGlow: THREE.Mesh;
  lampMat: THREE.MeshPhysicalMaterial; lampGlow: THREE.Mesh; strip: THREE.Group[] = []; spark: THREE.Mesh;
  power: Pulses; cordGrp = new THREE.Group(); damage = new THREE.Group(); dSparks: Puffs; plug = new THREE.Group(); socket = new THREE.Group();
  steam: Puffs; shimmer: Puffs; drops: THREE.Mesh[] = []; heatGlow: THREE.Mesh;
  key: THREE.DirectionalLight; rim: THREE.DirectionalLight; fill: THREE.DirectionalLight;

  constructor() {
    this.key = new THREE.DirectionalLight(0xfff1df, 2.6); this.rim = new THREE.DirectionalLight(0xbcd4ff, 2.4); this.fill = new THREE.DirectionalLight(0xffe2c0, 0.8);
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x404858, 0.5));
    // backdrop: warm room bokeh feel
    this.bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { cTop: { value: new THREE.Color(0.02, 0.025, 0.05) }, cBot: { value: new THREE.Color(0.004, 0.004, 0.008) }, cGlow: { value: new THREE.Color(0.06, 0.035, 0.015) }, dir: { value: new THREE.Vector3(0, 0, -1) } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform vec3 cTop,cBot,cGlow,dir; varying vec3 vD; void main(){ float h=vD.y*0.5+0.5; vec3 c=mix(cBot,cTop,smoothstep(0.,1.,h));
        c += cGlow*pow(max(dot(normalize(vD),dir),0.),5.); gl_FragColor=vec4(c,1.); }`,
    });
    this.bg = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), this.bgMat); this.root.add(this.bg);

    // ---------- ironing board ----------
    const coverTex = canvasTex(1024, 512, (g) => {
      g.fillStyle = "#2b4f7a"; g.fillRect(0, 0, 1024, 512);
      for (let y = 0; y < 512; y += 64) for (let x = 0; x < 1024; x += 64) { g.fillStyle = (x + y) % 128 ? "#335d8e" : "#284a72"; g.fillRect(x, y, 64, 64); }
      g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 3; for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    });
    coverTex.wrapS = coverTex.wrapT = THREE.RepeatWrapping; coverTex.repeat.set(3, 1.5);
    const bs = new THREE.Shape(); bs.moveTo(-9, -2.1); bs.lineTo(6.5, -2.1); bs.quadraticCurveTo(10.5, 0, 6.5, 2.1); bs.lineTo(-9, 2.1); bs.closePath();
    const boardTop = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(bs, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 3 })), new THREE.MeshPhysicalMaterial({ map: coverTex, roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color(0.5, 0.6, 0.8) }));
    boardTop.position.y = -0.24; this.board.add(boardTop);
    this.root.add(this.board);
    // shirt cloth with wrinkles
    const clothTex = canvasTex(1024, 512, (g) => {
      g.fillStyle = "#e9eef6"; g.fillRect(0, 0, 1024, 512);
      g.strokeStyle = "rgba(70,110,180,0.55)"; g.lineWidth = 6; for (let x = 0; x < 1024; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
      g.strokeStyle = "rgba(70,110,180,0.35)"; g.lineWidth = 4; for (let y = 0; y < 512; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
      for (let i = 0; i < 20000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.04})`; g.fillRect(rnd() * 1024, rnd() * 512, 2, 2); }
    });
    const cg = new THREE.PlaneGeometry(8.4, 3.8, 168, 76); cg.rotateX(-Math.PI / 2);
    this.cloth = new THREE.Mesh(cg, new THREE.MeshPhysicalMaterial({ map: clothTex, roughness: 0.8, sheen: 0.8, sheenColor: new THREE.Color(0.8, 0.85, 1), side: THREE.DoubleSide }));
    this.cloth.position.set(-0.6, 0.0, 0); this.clothBase = (cg.attributes.position.array as Float32Array).slice();
    this.root.add(this.cloth);

    // ---------- iron ----------
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.15 });
    this.soleMat = new THREE.MeshPhysicalMaterial({ color: 0xd2d6dc, metalness: 1, roughness: 0.22, emissive: new THREE.Color(0, 0, 0) });
    const sole = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(outline(1), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 2, curveSegments: 32 })), this.soleMat);
    this.iron.add(sole);
    const holes = new THREE.Group();
    for (let i = 0; i < 18; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: 0x111111 })); h.rotation.x = Math.PI / 2; h.position.set(-0.9 + (i % 6) * 0.42, -0.028, (Math.floor(i / 6) - 1) * 0.42); holes.add(h); }
    this.iron.add(holes);
    // shell (two-tone plastic) - see-through for x-ray shots
    const mkShell = (col: number, op = 1) => { const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: op }); this.shellMats.push(m); return m; };
    const shellA = mkShell(0x1fa3b8), shellB = mkShell(0xf4f6f8);
    const body = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(outline(0.9, 0), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.16, bevelSegments: 5, curveSegments: 32 })), shellB);
    body.position.y = 0.36; body.scale.set(0.98, 1, 0.95); this.iron.add(body);
    const skirt = new THREE.Mesh(flat(new THREE.ExtrudeGeometry(outline(0.99, 0), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 32 })), shellA);
    skirt.position.y = 0.15; this.iron.add(skirt);
    const handleCurve = curve([[-1.35, 0.6, 0], [-1.25, 1.25, 0], [-0.7, 1.52, 0], [0.3, 1.5, 0], [0.85, 1.25, 0], [1.05, 0.7, 0]]);
    const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 64, 0.2, 20, false), shellA); this.iron.add(handle);
    for (const x of [-1.35, 1.05]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), shellA); cap.position.set(x, x < 0 ? 0.6 : 0.7, 0); this.iron.add(cap); }
    // water tank window (front) + spray nozzle
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x7fd3ff, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.45, clearcoat: 1 }));
    tank.scale.set(1.1, 0.55, 0.75); tank.position.set(0.85, 0.62, 0); this.iron.add(tank);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 12), chrome); nozzle.rotation.z = -1.2; nozzle.position.set(1.55, 0.55, 0); this.iron.add(nozzle);
    // temperature dial on top
    const dialTex = canvasTex(256, 256, (g) => { g.fillStyle = "#f6f7f9"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.fillStyle = "#e53935"; g.font = "bold 44px sans-serif"; g.textAlign = "center"; g.fillText("•  ••  •••", 128, 60); g.fillStyle = "#333"; g.fillRect(122, 140, 12, 90); });
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.1, 40), [new THREE.MeshPhysicalMaterial({ color: 0xdddddd, roughness: 0.3 }), new THREE.MeshPhysicalMaterial({ map: dialTex, roughness: 0.3, clearcoat: 1 }), new THREE.MeshPhysicalMaterial({ color: 0xdddddd })]);
    dial.position.set(-0.15, 0.82, 0.0); this.iron.add(dial);
    // indicator lamp
    this.lampMat = new THREE.MeshPhysicalMaterial({ color: 0x551100, emissive: new THREE.Color(0, 0, 0), roughness: 0.1, clearcoat: 1 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10), this.lampMat); lamp.position.set(0.3, 0.8, 0.3); this.iron.add(lamp);
    this.lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10), glowMat([1.3, 0.3, 0.04])); this.lampGlow.position.copy(lamp.position); this.iron.add(this.lampGlow);
    // heating element (cast into the soleplate, shown on top in x-ray)
    this.elemMat = new THREE.MeshPhysicalMaterial({ color: 0x8a8d93, metalness: 1, roughness: 0.35, emissive: new THREE.Color(0, 0, 0) });
    const elemPath = curve([[-1.45, 0.17, 0.55], [-0.6, 0.17, 0.72], [0.5, 0.17, 0.55], [1.35, 0.17, 0.1], [1.35, 0.17, -0.1], [0.5, 0.17, -0.55], [-0.6, 0.17, -0.72], [-1.45, 0.17, -0.55]]);
    const elem = new THREE.Mesh(new THREE.TubeGeometry(elemPath, 120, 0.06, 12, false), this.elemMat); this.iron.add(elem);
    this.elemGlow = new THREE.Mesh(new THREE.TubeGeometry(elemPath, 120, 0.13, 10, false), glowMat([2.0, 0.5, 0.08])); this.iron.add(this.elemGlow);
    // thermostat: post + bimetal strip (two layers, bends) + fixed upper contact
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.18), new THREE.MeshPhysicalMaterial({ color: 0xf0e6d0, roughness: 0.6 })); post.position.set(-0.78, 0.33, 0); this.iron.add(post);
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xe0903a, metalness: 0.6, roughness: 0.35, emissive: new THREE.Color(0.25, 0.1, 0.02) }), steelM = new THREE.MeshPhysicalMaterial({ color: 0xc8ccd4, metalness: 0.6, roughness: 0.3, emissive: new THREE.Color(0.08, 0.08, 0.1) });
    let parent: THREE.Object3D = this.iron; const N = 10, segL = 0.085;
    for (let i = 0; i < N; i++) {
      const g = new THREE.Group(); g.position.set(i === 0 ? -0.73 : segL, i === 0 ? 0.42 : 0, 0);
      const a = new THREE.Mesh(new THREE.BoxGeometry(segL + 0.004, 0.022, 0.14), brass); a.position.set(segL / 2, 0.011, 0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(segL + 0.004, 0.022, 0.14), steelM); b.position.set(segL / 2, -0.011, 0);
      g.add(a, b); parent.add(g); this.strip.push(g); parent = g;
    }
    const contact = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), chrome); contact.position.set(segL * 0.8, 0.035, 0); parent.add(contact);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.025, 0.12), steelM); arm.position.set(-0.36, 0.53, 0); this.iron.add(arm);
    const upC = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), chrome); upC.position.set(0.0 + 0.002, 0.505, 0); this.iron.add(upC);
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), glowMat([4, 3.2, 1.6])); this.spark.position.set(0.0, 0.48, 0); this.iron.add(this.spark);
    // power path: cord -> thermostat -> element -> back
    this.power = new Pulses(14, [3.5, 2.6, 0.6], 0.03, curve([[-1.75, 0.5, 0.1], [-1.2, 0.45, 0.2], [-0.78, 0.5, 0.0], [-0.4, 0.5, 0.0], [0.0, 0.47, 0.0], [-0.6, 0.3, 0.35], [-1.45, 0.2, 0.55], [-0.6, 0.2, 0.72], [0.5, 0.2, 0.55], [1.35, 0.2, 0.05], [0.5, 0.2, -0.55], [-0.6, 0.2, -0.72], [-1.45, 0.2, -0.55], [-1.75, 0.45, -0.1]]));
    this.iron.add(this.power.group);
    // heat glow under the soleplate
    this.heatGlow = new THREE.Mesh(flat(new THREE.ShapeGeometry(outline(1.06), 24)), glowMat([1.6, 0.45, 0.08])); this.heatGlow.position.y = -0.035; this.iron.add(this.heatGlow);
    // water drops (steam scene)
    for (let i = 0; i < 5; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0x8fd8ff, roughness: 0.02, transparent: true, opacity: 0.85, clearcoat: 1, emissive: new THREE.Color(0.05, 0.2, 0.35) })); d.scale.set(1, 1.4, 1); this.drops.push(d); this.iron.add(d); }
    this.root.add(this.iron);

    // ---------- cord, damaged segment, plug + socket ----------
    const cordMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, roughness: 0.5, clearcoat: 0.3 });
    const cordPath = curve([[-1.7, 0.5, 0], [-2.3, 0.45, 0.25], [-2.9, 0.12, 0.8], [-3.3, 0.1, 1.1], [-3.9, 0.1, 1.4], [-5.2, 0.1, 1.6], [-5.9, 0.12, 1.6]]);
    this.cordGrp.add(new THREE.Mesh(new THREE.TubeGeometry(cordPath, 120, 0.05, 12, false), cordMat));
    // damage: a gash with copper strands + sparks at (-3.3, 0.1, 1.1)
    const gash = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.02, 8, 16, Math.PI * 1.2), new THREE.MeshPhysicalMaterial({ color: 0x222222, roughness: 0.8 }));
    gash.position.set(-3.3, 0.13, 1.1); gash.rotation.set(0.3, 0.6, 0); this.damage.add(gash);
    for (let k = 0; k < 6; k++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), new THREE.MeshPhysicalMaterial({ color: 0xd8742a, metalness: 1, roughness: 0.3 })); w.position.set(-3.3 + (k - 3) * 0.015, 0.16 + (k % 2) * 0.02, 1.1); w.rotation.set(0.4 + k * 0.3, k, 1.0 + k * 0.2); this.damage.add(w); }
    this.dSparks = new Puffs(40, [4.0, 2.8, 1.0], 0.05, true); this.damage.add(this.dSparks.pts);
    this.cordGrp.add(this.damage);
    this.root.add(this.cordGrp);
    const socketMat = new THREE.MeshPhysicalMaterial({ color: 0xf5f5f0, roughness: 0.35, clearcoat: 0.6 });
    const sbox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), socketMat); sbox.position.set(-6.55, 0.1, 1.6); this.socket.add(sbox);
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.3), new THREE.MeshPhysicalMaterial({ color: 0xd32f2f, roughness: 0.3 })); sw.position.set(-6.75, 0.28, 1.95); this.socket.add(sw);
    this.root.add(this.socket);
    const plugBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.34), socketMat); this.plug.add(plugBody);
    for (const z of [-0.08, 0.08]) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8), new THREE.MeshPhysicalMaterial({ color: 0xd6b25e, metalness: 1, roughness: 0.25 })); pin.rotation.z = Math.PI / 2; pin.position.set(-0.28, 0, z); this.plug.add(pin); }
    this.root.add(this.plug);

    // ---------- particles ----------
    this.steam = new Puffs(90, [0.92, 0.95, 1.0], 0.22, false); this.root.add(this.steam.pts);
    this.shimmer = new Puffs(40, [1.2, 0.45, 0.1], 0.08, true); this.root.add(this.shimmer.pts);
  }

  update(t: number, cam: THREE.PerspectiveCamera) {
    const sc = sceneAt(t);
    const camDir = new THREE.Vector3(); cam.getWorldDirection(camDir);
    this.bg.position.copy(cam.position); this.bgMat.uniforms.dir.value.copy(camDir);
    const side = new THREE.Vector3().crossVectors(camDir, cam.up).normalize(), up = new THREE.Vector3().crossVectors(side, camDir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(camDir, f); l.target.position.copy(cam.position).addScaledVector(camDir, 6); l.target.updateMatrixWorld(); };
    place(this.key, -7, 9, 1); place(this.rim, 8, 4, 18); place(this.fill, 6, -4, 0);
    const scale = cam.projectionMatrix.elements[5] * 1920 * 0.5;
    void scale;

    // iron pose
    this.iron.matrixAutoUpdate = false; ironMatrix(t, this.iron.matrix); this.iron.matrixWorldNeedsUpdate = true;
    const xr = xray(t);
    const thermoShot = t >= 26.0 && t < 36.4 ? sstep(26.0, 27.2, t) * (1 - sstep(35.6, 36.4, t)) : 0;
    this.shellMats.forEach((m) => { m.opacity = (1 - 0.78 * xr) * (1 - 0.8 * thermoShot); m.depthWrite = xr < 0.05; });
    const h = heat(t);
    const hot = new THREE.Color().setRGB(1.0, 0.32, 0.05);
    this.elemMat.emissive.copy(hot).multiplyScalar(2.2 * h * h);
    (this.elemGlow.material as THREE.MeshBasicMaterial).opacity = 0.55 * h * h * xr * (1 - 0.8 * thermoShot);
    this.elemGlow.visible = xr > 0.02 && h > 0.05;
    this.soleMat.emissive.setRGB(0.5 * h * h, 0.12 * h * h, 0.02 * h * h);
    const glowShow = sc === 3 || sc === 5 || sc === 7 || (sc === 6 && t > 57.6);
    (this.heatGlow.material as THREE.MeshBasicMaterial).opacity = glowShow ? 0.35 * h : 0;
    const lo = lightOn(t);
    this.lampMat.emissive.setRGB(2.0 * lo, 0.35 * lo, 0.05 * lo);
    (this.lampGlow.material as THREE.MeshBasicMaterial).opacity = 0.55 * lo;
    // thermostat bend
    const bd = bend(t);
    this.strip.forEach((g, i) => (g.rotation.z = i === 0 ? 0 : -0.035 * bd));
    const sparkT = [32.0, 36.6, 38.5].reduce((m, a) => Math.max(m, Math.exp(-(((t - a + 0.05) / 0.06) ** 2))), 0);
    this.spark.visible = sparkT > 0.02; (this.spark.material as THREE.MeshBasicMaterial).opacity = sparkT; this.spark.scale.setScalar(0.6 + 1.2 * sparkT);
    this.power.set(t, 0.45, pulsesAmt(t) * xr);
    // drops from the tank onto the hot plate
    const da = dropsAmt(t);
    this.drops.forEach((d, i) => {
      const u = ((t * 0.9 + i / this.drops.length) % 1);
      d.position.set(0.95 - i * 0.18, lerp(0.55, 0.16, u * u), (i % 2 ? 0.12 : -0.12));
      d.visible = da > 0.01 && u < 0.97; (d.material as THREE.MeshPhysicalMaterial).opacity = 0.85 * da;
    });

    // cloth wrinkles: flatten where the soleplate has passed
    this.cloth.visible = clothVisible(t);
    if (this.cloth.visible) {
      const pr = pressed(t)!;
      const p = this.cloth.geometry.attributes.position as THREE.BufferAttribute, b = this.clothBase;
      const ox = this.cloth.position.x;
      for (let i = 0; i < p.count; i++) {
        const x = b[i * 3] + ox, z = b[i * 3 + 2];
        let w = 0.06 * Math.sin(x * 3.1 + Math.sin(z * 1.7) * 2.0) * Math.sin(z * 2.3 + x * 0.7) + 0.035 * Math.sin(x * 7.3 - z * 4.1) + 0.03 * Math.sin(z * 6.5 + x * 1.3);
        w = Math.abs(w) * 1.6;
        const inside = Math.abs(z) < 1.05 ? sstep(pr[0] - 0.2, pr[0] + 0.1, x) * (1 - sstep(pr[1] - 0.25, pr[1] + 0.15, x)) : 0;
        const edge = Math.abs(z) < 1.05 ? 1 - sstep(0.9, 1.08, Math.abs(z)) : 0;
        p.setY(i, w * (1 - inside * edge) + 0.004);
      }
      p.needsUpdate = true; this.cloth.geometry.computeVertexNormals();
    }
    this.board.visible = true;

    // cord / damage / plug
    this.damage.visible = cordDamage(t);
    this.dSparks.set(t, 0.35, cordDamage(t) ? 0.6 + 0.4 * Math.sin(t * 37) : 0, (i, u, s) => {
      const burst = Math.floor(t * 3 + s[1] * 2) % 2;
      return [-3.3 + (s[2] - 0.5) * 0.4 * u, 0.17 + 0.5 * u * s[3] - 0.6 * u * u, 1.1 + (s[0] - 0.5) * 0.4 * u, (1 - u) * burst, 0.4 + 0.6 * s[3]];
    });
    const po = plugOut(t);
    this.plug.position.set(-5.95 + 0.9 * po, 0.12 + 0.25 * Math.sin(Math.PI * po) , 1.6);
    const cordShow = sc === 1 || sc === 6 || sc === 2;
    this.cordGrp.visible = cordShow && upright(t) < 0.01; this.plug.visible = this.socket.visible = sc === 6 && t < 54.7;

    // steam + heat shimmer (world space, relative to the iron)
    const sa = steamAmt(t), ix = ironX(t);
    this.steam.set(t, 1.6, sa, (i, u, s) => {
      const fromHoles = sc === 5 || sc === 3;
      const x0 = ix - 1.0 + s[0] * 2.6, z0 = (s[1] - 0.5) * (fromHoles ? 2.2 : 1.8);
      const y = (fromHoles ? 0.02 : 0.1) + u * (1.2 + s[2]);
      return [x0 + (s[3] - 0.5) * u * 1.2, y, z0 + Math.sign(z0) * u * 0.8, Math.sin(Math.PI * u) * 0.32, 0.6 + 1.6 * u];
    });
    const up_ = upright(t);
    this.shimmer.set(t, 1.2, (sc === 3 || (sc === 6 && t > 57.6) || sc === 2) ? h * 0.8 : 0, (i, u, s) => {
      if (up_ > 0.5) return [-1.62 - 0.05 + (s[0] - 0.5) * 0.1, 0.1 + s[1] * 3.4, (s[2] - 0.5) * 1.6, Math.sin(Math.PI * u) * 0.6, 0.6 + s[3]];
      return [ix - 1.5 + s[0] * 3.3, -0.02 + u * 0.5, (s[1] - 0.5) * 1.8, Math.sin(Math.PI * u) * 0.5, 0.6 + s[3]];
    });
  }
}
void clamp01; void powerOn;
