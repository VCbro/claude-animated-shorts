// LOC-01 (east genetics lab), PROP-01 (terrarium) and LOC-02 (the alley). Procedural low-poly.
import * as THREE from 'three';
import { mat, mesh, glow, CYAN } from './rig.js';

const srgb = h => { const n = parseInt(h.slice(1), 16); return { r: (n >> 16 & 255) / 255, g: (n >> 8 & 255) / 255, b: (n & 255) / 255 }; };
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function noiseTex(base, amp, size = 256, seed = 3, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const r = rng(seed);
  const col = srgb(base);
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (r() - 0.5) * amp + (Math.sin(i * 0.013) * 0.5) * amp * 0.2;
    img.data[i * 4] = Math.max(0, Math.min(255, col.r * 255 + n * 255));
    img.data[i * 4 + 1] = Math.max(0, Math.min(255, col.g * 255 + n * 255));
    img.data[i * 4 + 2] = Math.max(0, Math.min(255, col.b * 255 + n * 255));
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // a few soft blotches
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.025)`;
    g.beginPath(); g.arc(r() * size, r() * size, 10 + r() * 50, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  return t;
}

// soft additive light shaft: a prism from a window opening along the light direction
function shaft(corners, dir, len, strength, color = '#e6eef5') {
  const far = corners.map(p => p.clone().addScaledVector(dir, len));
  const pos = [], fade = [];
  const quad = (a, b, c, d, fa, fb, fc, fd) => { pos.push(...a, ...b, ...c, ...a, ...c, ...d); fade.push(fa, fb, fc, fa, fc, fd); };
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(corners[i].toArray(), corners[j].toArray(), far[j].toArray(), far[i].toArray(), 0, 0, 1, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('fade', new THREE.Float32BufferAttribute(fade, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, k: { value: strength } },
    vertexShader: `attribute float fade; varying float vF; varying vec3 vN; varying vec3 vV;
      void main(){ vF=fade; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; uniform float k; varying float vF; varying vec3 vN; varying vec3 vV;
      void main(){ float a = k * pow(1.-vF, 1.6) * (0.35 + 0.65*smoothstep(0.,0.15,vF)); gl_FragColor=vec4(color*a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.renderOrder = 5;
  return o;
}

// ------------------------------------------------------------------------------------------ PROP-01
export class Terrarium {
  constructor() {
    const W = 0.36, H = 0.22, D = 0.24;
    this.W = W; this.H = H; this.D = D;
    this.root = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: '#d6e6ea', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false });
    const steel = mat('#a3aaaf', 0.35, 0.85);
    // glass walls
    for (const [w, h, p, r] of [[W, H, [0, H / 2, D / 2], 0], [W, H, [0, H / 2, -D / 2], 0], [D, H, [W / 2, H / 2, 0], Math.PI / 2], [D, H, [-W / 2, H / 2, 0], Math.PI / 2]]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass); g.position.set(...p); g.rotation.y = r; g.renderOrder = 3; this.root.add(g);
    }
    // frame edges
    const e = 0.008;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(box(e, H, e), steel, this.root, [sx * W / 2, H / 2, sz * D / 2]);
    for (const y of [0.004, H]) {
      for (const sz of [-1, 1]) mesh(box(W, e, e), steel, this.root, [0, y, sz * D / 2]);
      for (const sx of [-1, 1]) mesh(box(e, e, D), steel, this.root, [sx * W / 2, y, 0]);
    }
    mesh(box(W - 0.01, 0.006, D - 0.01), mat('#7d8388', 0.6), this.root, [0, 0.003, 0]);
    // sand + twig
    mesh(box(W - 0.014, 0.03, D - 0.014), mat('#b6ad97', 1), this.root, [0, 0.018, 0]);
    const twig = mat('#6e675e', 1);
    mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.2, 4), twig, this.root, [-0.03, 0.07, -0.02], [0.2, 0.3, 1.05]);
    mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.09, 4), twig, this.root, [0.04, 0.1, -0.03], [0.5, 0.1, 0.4]);
    // blank tag on the front frame
    mesh(box(0.06, 0.022, 0.002), mat('#c4c9cc', 0.3, 0.7), this.root, [0.11, 0.03, D / 2 + 0.003]);
    // the cyan lamp
    const lampM = new THREE.MeshBasicMaterial({ color: CYAN });
    mesh(box(0.05, 0.012, 0.012), lampM, this.root, [-0.12, H - 0.015, -D / 2 + 0.012], null, false);
    const gl = glow(CYAN, 0.32, 0.5); gl.position.set(-0.08, H - 0.05, -0.05); this.root.add(gl);
    this.light = new THREE.PointLight(CYAN, 0.35, 0.9, 2); this.light.position.set(-0.06, H - 0.04, -0.04); this.root.add(this.light);
    // lid: pivots on the back top edge
    this.lid = new THREE.Group(); this.lid.position.set(0, H, -D / 2); this.root.add(this.lid);
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(W, D), glass); lg.rotation.x = -Math.PI / 2; lg.position.set(0, 0.006, D / 2); lg.renderOrder = 3; this.lid.add(lg);
    for (const sz of [0, D]) mesh(box(W, e, e), steel, this.lid, [0, 0.006, sz]);
    for (const sx of [-1, 1]) mesh(box(e, e, D), steel, this.lid, [sx * W / 2, 0.006, D / 2]);
    // latch on the lid front edge + catch on the front frame
    this.latch = mesh(box(0.03, 0.012, 0.012), steel, this.lid, [0, 0.004, D + 0.008]);
    mesh(box(0.024, 0.02, 0.006), steel, this.root, [0, H - 0.012, D / 2 + 0.005]);
  }
  setLid(deg) { this.lid.rotation.x = -THREE.MathUtils.degToRad(deg); }
}

// ------------------------------------------------------------------------------------------ LOC-01
export function buildLab() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#9aa4ab');
  scene.fog = new THREE.FogExp2('#aab3b9', 0.028);
  const r = rng(11);
  const wall = mat('#c3c8cb', 0.95), floorM = new THREE.MeshStandardMaterial({ map: noiseTex('#8c9092', 0.08, 256, 5, [6, 12]), roughness: 0.75, flatShading: true });
  const white = mat('#dde0e1', 0.7), cab = mat('#98a1a7', 0.75), steel = mat('#a6acb0', 0.35, 0.8), dark = mat('#4c5257', 0.6);
  const X = 4, Z = 9, H = 3.2;
  mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), floorM, scene, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  mesh(box(2 * X, 0.1, 2 * Z), mat('#b9bec1', 0.95, 0, { emissive: '#4d5459' }), scene, [0, H + 0.05, 0]);
  // fluorescent panels (off)
  for (let z = -7; z <= 7; z += 3.5) for (const x of [-1.9, 1.9]) mesh(box(0.6, 0.03, 1.2), mat('#d5d9db', 0.5), scene, [x, H - 0.015, z], null, false);
  // right, far walls
  mesh(box(0.2, H, 2 * Z), wall, scene, [X + 0.1, H / 2, 0]);
  mesh(box(2 * X, H, 0.2), wall, scene, [0, H / 2, -Z - 0.1]);
  // near wall with the door opening (x 2.4..3.4, h 2.1)
  mesh(box(6.4, H, 0.2), wall, scene, [-0.8, H / 2, Z + 0.1]);
  mesh(box(0.6, H, 0.2), wall, scene, [3.7, H / 2, Z + 0.1]);
  mesh(box(1.0, H - 2.1, 0.2), wall, scene, [2.9, 2.1 + (H - 2.1) / 2, Z + 0.1]);
  const door = new THREE.Group(); door.position.set(2.4, 0, Z + 0.02); scene.add(door);
  mesh(box(0.98, 2.08, 0.05), mat('#7f878c', 0.45, 0.5), door, [0.49, 1.04, 0]);
  mesh(box(0.03, 0.03, 0.16), steel, door, [0.85, 1.05, -0.06]);
  mesh(box(0.08, 0.12, 0.03), dark, scene, [2.2, 1.25, Z - 0.015]); // badge reader
  const led = new THREE.Mesh(box(0.012, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: '#e8eef2' })); led.position.set(2.2, 1.29, Z - 0.032); scene.add(led);
  // surveillance camera, corner above the door
  const cam = new THREE.Group(); cam.position.set(3.75, 2.95, Z - 0.2); scene.add(cam);
  mesh(box(0.05, 0.2, 0.05), dark, cam, [0, 0.1, 0.1]);
  mesh(box(0.11, 0.1, 0.24), mat('#d9dcde', 0.6), cam, [-0.05, -0.02, -0.04], [0.45, 0.55, 0]);
  // left wall with three windows (z -5, 0, 5; 2.2 wide; y .9..2.7)
  const WZ = [-5, 0, 5], WW = 2.2, Y0 = 0.9, Y1 = 2.7;
  mesh(box(0.2, Y0, 2 * Z), wall, scene, [-X - 0.1, Y0 / 2, 0]);
  mesh(box(0.2, H - Y1, 2 * Z), wall, scene, [-X - 0.1, Y1 + (H - Y1) / 2, 0]);
  const edges = [-Z, ...WZ.flatMap(z => [z - WW / 2, z + WW / 2]), Z];
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i], b = edges[i + 1];
    mesh(box(0.2, Y1 - Y0, b - a), wall, scene, [-X - 0.1, (Y0 + Y1) / 2, (a + b) / 2]);
  }
  const sky = new THREE.MeshBasicMaterial({ color: '#e9eff3' });
  const slat = mat('#e3e5e6', 0.6);
  for (const z of WZ) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(WW, Y1 - Y0), sky); g.position.set(-X - 0.25, (Y0 + Y1) / 2, z); g.rotation.y = Math.PI / 2; scene.add(g);
    mesh(box(0.05, 0.05, WW), white, scene, [-X + 0.02, Y0 - 0.02, z]); // sill
    for (let y = 1.85; y < Y1; y += 0.07) mesh(box(0.012, 0.045, WW - 0.04), slat, scene, [-X + 0.03, y, z], [0, 0, 0.5]);
    mesh(box(0.04, 0.04, WW), steel, scene, [-X + 0.04, 1.84, z]);
  }
  // sunlight through the windows
  const sunDir = new THREE.Vector3(1, -0.72, -0.28).normalize();
  const sun = new THREE.DirectionalLight('#e8eef4', 4.2);
  sun.position.copy(sunDir.clone().multiplyScalar(-14)); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#c9d3da', '#7a7f83', 0.95));
  const fill = new THREE.PointLight('#d8e0e6', 4, 14, 1.6); fill.position.set(0, 2.9, -2); scene.add(fill);
  for (const z of WZ) {
    const c = [[Y0, z - WW / 2], [Y0, z + WW / 2], [1.83, z + WW / 2], [1.83, z - WW / 2]].map(([y, zz]) => new THREE.Vector3(-X + 0.05, y, zz));
    scene.add(shaft(c, sunDir, 3.0, 0.3));
    const c2 = [[1.86, z - WW / 2], [1.86, z + WW / 2], [Y1, z + WW / 2], [Y1, z - WW / 2]].map(([y, zz]) => new THREE.Vector3(-X + 0.05, y, zz));
    scene.add(shaft(c2, sunDir, 3.4, 0.09));
  }

  // benches
  function bench(cx, cz, lx, lz) {
    const g = new THREE.Group(); g.position.set(cx, 0, cz); scene.add(g);
    mesh(box(lx, 0.04, lz), white, g, [0, 0.9, 0]);
    mesh(box(lx - 0.06, 0.82, lz - 0.08), cab, g, [0, 0.43, 0]);
    // drawer seams
    const nx = Math.max(1, Math.round((lx > lz ? lx : lz) / 0.6));
    for (let i = 1; i < nx; i++) {
      const t = -0.5 + i / nx;
      if (lx > lz) { for (const s of [-1, 1]) mesh(box(0.008, 0.78, 0.004), dark, g, [t * (lx - 0.06), 0.43, s * (lz / 2 - 0.038)], null, false); }
      else { for (const s of [-1, 1]) mesh(box(0.004, 0.78, 0.008), dark, g, [s * (lx / 2 - 0.038), 0.43, t * (lz - 0.08)], null, false); }
    }
    mesh(box(lx - 0.06, 0.06, lz - 0.08), dark, g, [0, 0.03, 0]);
    return g;
  }
  const props = (cx, cz, len) => {
    const noMon = cx > 0;
    for (let z = cz - len / 2 + 0.4; z < cz + len / 2 - 0.3; z += 0.55 + r() * 0.6) {
      const k = r(), x = cx + (r() - 0.5) * 0.4;
      if (k < 0.22) { // microscope
        const g = new THREE.Group(); g.position.set(x, 0.92, z); g.rotation.y = r() * 6; scene.add(g);
        mesh(box(0.16, 0.03, 0.2), mat('#e9ebec', 0.5), g, [0, 0.015, 0]);
        mesh(box(0.04, 0.24, 0.05), mat('#e9ebec', 0.5), g, [0, 0.14, -0.07]);
        mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), dark, g, [0, 0.22, -0.02], [0.5, 0, 0]);
      } else if (k < 0.45) { // tube rack
        const g = new THREE.Group(); g.position.set(x, 0.92, z); scene.add(g);
        mesh(box(0.22, 0.05, 0.08), mat('#d8dadb', 0.6), g, [0, 0.025, 0]);
        for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 5), mat(r() > 0.5 ? '#cfd6d9' : '#aeb7bc', 0.2), g, [-0.09 + i * 0.036, 0.08, 0], null, false);
      } else if (k < 0.62 && !noMon) { // monitor, screen glows (no text)
        const g = new THREE.Group(); g.position.set(x, 0.92, z); g.rotation.y = cx < 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(g);
        mesh(box(0.12, 0.02, 0.1), dark, g, [0, 0.01, 0]);
        mesh(box(0.03, 0.18, 0.03), dark, g, [0, 0.1, -0.02]);
        mesh(box(0.42, 0.26, 0.025), dark, g, [0, 0.3, 0]);
        const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.22), new THREE.MeshBasicMaterial({ color: '#c3ccd1' })); sc.position.set(0, 0.3, 0.014); g.add(sc);
      } else if (k < 0.8) { // bottles
        for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.16 + r() * 0.1, 6), mat(['#c8d1d4', '#9aa59f', '#d8d2c4'][i], 0.25), scene, [x + (r() - 0.5) * 0.2, 1.0, z + (r() - 0.5) * 0.2]);
      } else { // centrifuge
        mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.22, 8), mat('#e4e6e7', 0.5), scene, [x, 1.03, z]);
      }
    }
  };
  for (const cx of [-1.9, 1.9]) for (const [cz, len] of [[-3.8, 5.6], [3.0, 5.6]]) { bench(cx, cz, 0.8, len); props(cx, cz, len); }
  // far bench + shelf with an upright
  bench(0, -8.25, 3.4, 0.8);
  const shelfY = 1.6;
  mesh(box(3.4, 0.03, 0.6), white, scene, [0, shelfY + 0.015, -8.7]);
  for (const x of [-1.6, 0.95, 1.6]) mesh(box(0.03, shelfY - 0.92, 0.03), steel, scene, [x, (0.92 + shelfY) / 2, -8.58]);
  for (const [x, w] of [[-1.3, 0.3], [-0.85, 0.22], [1.3, 0.35]]) mesh(box(w, 0.18, 0.25), mat('#cdd4d7', 0.2, 0, { transparent: true, opacity: 0.6 }), scene, [x, shelfY + 0.12, -8.75]);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), mat('#9aa59f', 0.25), scene, [-0.4, shelfY + 0.14, -8.8]);
  // right wall: incubators + fume hood
  for (const z of [-5.8, -4.9]) {
    const g = new THREE.Group(); g.position.set(3.6, 0, z); scene.add(g);
    mesh(box(0.7, 1.8, 0.85), mat('#d7dadc', 0.55), g, [0, 0.9, 0]);
    mesh(box(0.02, 1.2, 0.6), mat('#b9c0c4', 0.3), g, [-0.36, 1.0, 0]);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ color: '#dfe5e8' })); p.position.set(-0.375, 1.68, 0.2); p.rotation.y = -Math.PI / 2; g.add(p);
  }
  { const g = new THREE.Group(); g.position.set(3.45, 0, -1.6); scene.add(g);
    mesh(box(1.0, 0.9, 1.6), cab, g, [0, 0.45, 0]);
    mesh(box(1.0, 1.4, 1.6), mat('#c9cfd2', 0.5), g, [0.05, 1.6, 0]);
    mesh(box(0.02, 0.8, 1.4), mat('#dbe4e7', 0.05, 0, { transparent: true, opacity: 0.3 }), g, [-0.46, 1.45, 0]); }
  // left wall: low cabinets + steel shelving with sealed enclosures at the far end
  for (const z of [-7.5, 7.4]) {
    const g = new THREE.Group(); g.position.set(-3.6, 0, z); scene.add(g);
    for (const y of [0.05, 0.7, 1.35, 2.0]) mesh(box(0.5, 0.025, 1.6), steel, g, [0, y, 0]);
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) mesh(box(0.025, 2.05, 0.025), steel, g, [sx * 0.24, 1.02, sz * 0.79]);
    for (const y of [0.7, 1.35]) for (let i = 0; i < 3; i++) mesh(box(0.34, 0.24, 0.4), mat('#c7ced1', 0.15, 0, { transparent: true, opacity: 0.55 }), g, [0, y + 0.14, -0.5 + i * 0.5]);
  }
  for (const z of [-2.5, 2.5]) mesh(box(0.55, 0.85, 2.4), cab, scene, [-3.7, 0.425, z]);

  scene.traverse(o => { if (o.isMesh && o.material && o.material.transparent) o.castShadow = false; });
  return { scene, door, led, sunDir };
}

// ------------------------------------------------------------------------------------------ LOC-02
function brickTex(base, seed, lit = 0) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'); const r = rng(seed);
  const col = srgb(base);
  g.fillStyle = '#4a4542'; g.fillRect(0, 0, 512, 512);
  const bw = 64, bh = 32 * 512 / 512 / 1;
  for (let row = 0; row < 16; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let i = -1; i < 9; i++) {
      const k = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${col.r * 255 * k | 0},${col.g * 255 * k | 0},${col.b * 255 * k | 0})`;
      g.fillRect(i * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
    }
  }
  void lit;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

export function buildAlley() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1424');
  scene.fog = new THREE.FogExp2('#0d1626', 0.045);
  const TILE_W = 8 * 0.23, TILE_H = 16 * 0.077;
  function building(x0, x1, z0, z1, h, base, seed, windows) {
    const t = brickTex(base, seed);
    const face = (w) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(w / TILE_W, h / TILE_H); return new THREE.MeshStandardMaterial({ map: tt, roughness: 0.92, flatShading: true }); };
    const mats = [face(z1 - z0), face(z1 - z0), mat('#1e2127', 0.9), mat('#1e2127'), face(x1 - x0), face(x1 - x0)];
    const b = new THREE.Mesh(box(x1 - x0, h, z1 - z0), mats); b.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    b.castShadow = b.receiveShadow = true; scene.add(b);
    // parapet cap
    mesh(box(x1 - x0 + 0.1, 0.12, z1 - z0 + 0.1), mat('#3d3b3a', 0.9), scene, [(x0 + x1) / 2, h + 0.06, (z0 + z1) / 2]);
    const fx = x0 > 0 ? x0 : x1, s = x0 > 0 ? -1 : 1;
    for (const [y, z, lit] of windows) {
      mesh(box(0.06, 1.3, 0.95), mat('#2c2d30', 0.8), scene, [fx + s * 0.02, y, z]);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.15), lit ? new THREE.MeshBasicMaterial({ color: '#6f8199' }) : mat('#141a22', 0.15, 0.3));
      gl.position.set(fx + s * 0.055, y, z); gl.rotation.y = s * Math.PI / 2; scene.add(gl);
      mesh(box(0.14, 0.06, 1.05), mat('#4a4846', 0.9), scene, [fx + s * 0.07, y - 0.69, z]);
    }
  }
  // east wall (he climbs it): windowless lower floors, small windows on the 4th floor only, far from z=2
  building(-9, -1.6, -16, 13, 13.2, '#6a4c42', 21, [[11.3, -6, 0], [11.3, -9, 0], [11.3, 8, 0], [11.3, 10.6, 0]]);
  const rw = [];
  for (const y of [2.0, 5.2, 8.4, 11.4]) for (const z of [-7.5, -3.8, 4.6, 8.2]) rw.push([y, z, (y === 8.4 && z === -3.8) || (y === 5.2 && z === 8.2)]);
  building(1.6, 9, -16, 13, 12.2, '#5a4740', 33, rw);
  // ground: wet asphalt + puddles
  const ground = new THREE.MeshStandardMaterial({ map: noiseTex('#24282d', 0.06, 256, 9, [4, 12]), roughness: 0.38, metalness: 0.15, flatShading: true });
  mesh(new THREE.PlaneGeometry(40, 60), ground, scene, [0, 0, 0], [-Math.PI / 2, 0, 0]);
  for (const [x, z, sx, sz] of [[0.3, 5.0, 1.2, 0.7], [-0.6, -0.8, 0.9, 1.4], [0.7, -4.5, 0.7, 0.5], [-0.2, 9.0, 1.4, 0.8]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.5, 9), new THREE.MeshStandardMaterial({ color: '#10141a', roughness: 0.04, metalness: 0.6 }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, 0.004, z); p.scale.set(sx, sz, 1); p.receiveShadow = true; scene.add(p);
  }
  // curb strips along the walls
  for (const x of [-1.5, 1.5]) mesh(box(0.2, 0.08, 29), mat('#3a3d41', 0.9), scene, [x, 0.04, -1.5]);
  // trash bins along the right wall
  for (const z of [-2.4, -3.5, -5.6]) {
    const g = new THREE.Group(); g.position.set(1.15, 0, z); g.rotation.y = (z * 7) % 0.3; scene.add(g);
    mesh(box(0.62, 0.95, 0.75), mat('#2f3a3a', 0.6, 0.3), g, [0, 0.475, 0]);
    mesh(box(0.66, 0.05, 0.8), mat('#283131', 0.5, 0.3), g, [-0.02, 0.98, 0], [0, 0, 0.05]);
  }
  // back wall at the dead end
  mesh(box(3.4, 3.0, 0.3), mat('#2a2c30', 0.9), scene, [0, 1.5, -15.5]);
  // streetlamp at the alley mouth
  const pole = mat('#2b2f34', 0.5, 0.6);
  mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.7, 6), pole, scene, [1.35, 2.35, 9.0]);
  mesh(box(0.9, 0.06, 0.06), pole, scene, [0.95, 4.65, 9.0]);
  mesh(box(0.34, 0.1, 0.2), pole, scene, [0.55, 4.6, 9.0]);
  const bulb = new THREE.Mesh(box(0.26, 0.02, 0.14), new THREE.MeshBasicMaterial({ color: '#eef4ff' })); bulb.position.set(0.55, 4.54, 9.0); scene.add(bulb);
  const lg = glow('#cfe0ff', 1.6, 0.65); lg.position.set(0.55, 4.45, 9.0); scene.add(lg);
  const spot = new THREE.SpotLight('#cfdfff', 240, 30, 0.8, 0.6, 1.5);
  spot.position.set(0.55, 4.5, 9.0); spot.target.position.set(-0.7, 0, 3.0);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0005; spot.shadow.camera.near = 0.5; spot.shadow.camera.far = 30;
  scene.add(spot, spot.target);
  // soft volumetric cone under the lamp
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.4, 20, 1, true), new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color('#bcd0ff') } },
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY=(position.y+2.2)/4.4; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 color; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN,vV)),1.5); float a = 0.075*f*pow(vY,1.4); gl_FragColor=vec4(color*a,a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  cone.position.set(0.1, 2.3, 7.6); cone.rotation.x = -0.18; cone.rotation.z = -0.1; scene.add(cone);
  // night fill + moon
  scene.add(new THREE.HemisphereLight('#4a5f86', '#0d1118', 1.5));
  const wp = new THREE.SpotLight('#dfe8ff', 420, 30, 0.7, 0.85, 1.4);
  wp.position.set(1.45, 9.6, -1.6); wp.target.position.set(-1.6, 8.2, 2.0); wp.castShadow = true; wp.shadow.mapSize.set(1024, 1024); wp.shadow.bias = -0.0005;
  scene.add(wp, wp.target);
  mesh(box(0.2, 0.14, 0.18), mat('#2b2f34', 0.5, 0.6), scene, [1.52, 9.65, -1.6]);
  const wg = glow('#dfe8ff', 0.7, 0.6); wg.position.set(1.4, 9.6, -1.6); scene.add(wg);
  const moon = new THREE.DirectionalLight('#8aa0d0', 1.3); moon.position.set(4, 20, 6); scene.add(moon);
  // faint street glow at the mouth
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), new THREE.MeshBasicMaterial({ color: '#1b2638' })); sg.position.set(0, 2.5, 16); sg.rotation.y = Math.PI; scene.add(sg);
  return { scene };
}
