// "How a submersible pump works": the borewell cut open, the ground layers, the multistage
// submersible pump, the column pipe up to a house tank, and the install crew (tripod + chain hoist,
// two workers, cable drum, generator). Everything procedural (threejs-scene / exploded-view skills).
//
// Units: about a metre at the surface. Depth is compressed (the bore is "60 m" in 6 units).
// Axes: y up, ground at y = 0, the bore on the y axis. The earth is cut open along the plane z = 0
// and the camera looks from +z at the cut face.
import * as THREE from 'three';

export const D = {
  boreR: 0.11,          // casing outer radius
  casingR: 0.1,         // casing inner radius
  waterY: -2.6,         // water table
  boreBottom: -5.45,
  earthBottom: -6.3,
  pumpR: 0.062,
  pumpY: -4.9,          // pump bottom when installed
  pumpLen: 1.16,
  stage0: 0.66, stageH: 0.08, stages: 5,
  riserR: 0.032,
  headTop: 1.16,
  wellTop: 0.12,        // casing stick-up above the ground
  house: { x0: 1.3, x1: 3.9, z0: -2.1, z1: -0.4, h: 2.6 },
  tank: [1.9, 2.66, -0.95],
  suctionX: -0.85,      // the surface pump's suction pipe (the "why" comparison)
};
D.stageY = (k) => D.stage0 + k * D.stageH;   // local y of the bottom of stage k

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide, ...o });
const mesh = (g, m, cast = true, recv = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; return o; };
const lathe = (pts, segs = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rng = (() => { let s = 98765; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function instanced(geo, m, list, cast = true) {
  const im = new THREE.InstancedMesh(geo, m, list.length);
  const m4 = new THREE.Matrix4();
  list.forEach(([p, q, s], i) => im.setMatrixAt(i, m4.compose(p, q || new THREE.Quaternion(), s || v3(1, 1, 1))));
  im.castShadow = cast; im.receiveShadow = true;
  return im;
}
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), a);

// ----------------------------------------------------------------------------- ground layers
// one tall texture for every vertical face: v runs from earthBottom (0) to the surface (1)
export const LAYERS = [
  { name: 'Soil', top: 0, bot: -0.38, c: '#5a3b26' },
  { name: 'Clay', top: -0.38, bot: -1.2, c: '#9c5d36' },
  { name: 'Sand', top: -1.2, bot: -2.05, c: '#cfa66a' },
  { name: 'Gravel', top: -2.05, bot: -3.55, c: '#8c7d6a' },
  { name: 'Rock', top: -3.55, bot: -6.3, c: '#6d6a68' },
];
function strataTexture() {
  const W = 512, H = 2048, H0 = -D.earthBottom;
  const Y = (y) => (-y / H0) * H;        // world y -> canvas row (0 at the surface)
  return canvasTex(W, H, (g) => {
    for (const L of LAYERS) {
      // wavy boundaries
      g.fillStyle = L.c;
      g.beginPath(); g.moveTo(0, Y(L.top) - 6);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, Y(L.top) + 7 * Math.sin(x * 0.021 + L.top * 5) + 4 * Math.sin(x * 0.07));
      g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    }
    // grain, pebbles, roots, cracks
    for (let i = 0; i < 26000; i++) {
      const x = rng() * W, y = rng() * H, l = rng();
      g.fillStyle = l < 0.5 ? `rgba(0,0,0,${0.05 + 0.08 * rng()})` : `rgba(255,240,210,${0.04 + 0.07 * rng()})`;
      g.fillRect(x, y, 1 + rng() * 2.5, 1 + rng() * 2.5);
    }
    const peb = (y0, y1, n, rmin, rmax, cols) => {
      for (let i = 0; i < n; i++) {
        const x = rng() * W, y = Y(y0) + rng() * (Y(y1) - Y(y0)), r = rmin + rng() * (rmax - rmin);
        g.fillStyle = cols[Math.floor(rng() * cols.length)];
        g.beginPath(); g.ellipse(x, y, r * (1 + rng() * 0.6), r, rng() * 3, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.25, 0, 0, Math.PI * 2); g.fill();
      }
    };
    peb(-1.2, -2.05, 300, 1.5, 3, ['#b48c55', '#e2c48c']);
    peb(-2.05, -3.55, 700, 4, 11, ['#a39a8c', '#7d7468', '#beb4a2', '#6a5f52']);
    peb(-3.55, -6.3, 160, 10, 26, ['#7b7875', '#5d5a58', '#8a8682']);
    g.strokeStyle = 'rgba(30,25,22,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 70; i++) {     // rock fractures
      let x = rng() * W, y = Y(-3.7) + rng() * (H - Y(-3.7));
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (rng() - 0.5) * 60; y += 10 + rng() * 30; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(40,24,12,0.6)'; g.lineWidth = 1.5;
    for (let i = 0; i < 90; i++) {     // roots in the topsoil
      let x = rng() * W, y = 2;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rng() - 0.5) * 18; y += rng() * Y(-0.3) / 5; g.lineTo(x, y); }
      g.stroke();
    }
    // the saturated zone below the water table
    const wy = Y(D.waterY);
    const gr = g.createLinearGradient(0, wy - 20, 0, wy + 40);
    gr.addColorStop(0, 'rgba(40,120,210,0)'); gr.addColorStop(1, 'rgba(40,120,210,0.32)');
    g.fillStyle = gr; g.fillRect(0, wy - 20, W, 60);
    g.fillStyle = 'rgba(40,120,210,0.32)'; g.fillRect(0, wy + 40, W, H);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,200,255,${0.15 + 0.25 * rng()})`; g.fillRect(rng() * W, wy + rng() * (H - wy), 2, 2); }
  });
}
function grassTexture() {
  const t = canvasTex(256, 256, (g) => {
    g.fillStyle = '#5f7a3a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) {
      const c = rng();
      g.fillStyle = c < 0.4 ? '#4c6a2c' : c < 0.7 ? '#7a9448' : c < 0.85 ? '#8a7350' : '#a08a5c';
      g.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2, 1 + rng() * 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildEarth() {
  const g = new THREE.Group();
  const strata = strataTexture();
  const grass = grassTexture();
  const { boreR: r, earthBottom: yb } = D;
  const X0 = -4.2, X1 = 6.0, Z0 = -3.4, H = -yb;
  const faceMat = (w) => { const t = strata.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(w / 2.2, 1); t.needsUpdate = true; return std({ map: t, roughness: 0.95, metalness: 0 }); };
  const topMat = (w, d) => { const t = grass.clone(); t.repeat.set(w / 1.4, d / 1.4); t.needsUpdate = true; return std({ map: t, roughness: 1, metalness: 0 }); };
  const block = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0;
    const fm = faceMat(w), sm = faceMat(d), tm = topMat(w, d);
    // +x, -x, +y, -y, +z, -z
    const b = mesh(new THREE.BoxGeometry(w, H, d), [sm, sm, tm, fm, fm, fm], false, true);
    b.position.set((x0 + x1) / 2, yb / 2, (z0 + z1) / 2);
    g.add(b);
    return b;
  };
  block(X0, -r, Z0, 0);
  block(r, X1, Z0, 0);
  block(-r, r, Z0, -r);
  // grass beyond the cut-out block, out to the horizon
  const far = (w, d, x, z) => { const m = mesh(new THREE.PlaneGeometry(w, d), topMat(w, d), false, true); m.rotation.x = -Math.PI / 2; m.position.set(x, -0.002, z); g.add(m); };
  far(90, 40, 0, Z0 - 20); far(40, -Z0, X0 - 20, Z0 / 2); far(40, -Z0, X1 + 20, Z0 / 2);
  // the back half of the bore wall
  const wallT = strata.clone(); wallT.wrapS = THREE.RepeatWrapping; wallT.repeat.set(0.3, 1); wallT.needsUpdate = true;
  const wall = mesh(new THREE.CylinderGeometry(r, r, H, 24, 1, true, Math.PI / 2, Math.PI), std({ map: wallT, roughness: 1, side: THREE.BackSide }), false);
  wall.position.y = yb / 2; g.add(wall);

  // front slab: closes the cut for the surface shots (install), hidden otherwise
  const front = new THREE.Group();
  const fx = (x0, x1) => { const w = x1 - x0, d = 3.0; const tm = topMat(w, d), fm = faceMat(w); const b = mesh(new THREE.BoxGeometry(w, 0.6, d), [fm, fm, tm, fm, fm, fm], false, true); b.position.set((x0 + x1) / 2, -0.3, d / 2); front.add(b); };
  fx(X0, -r); fx(r, X1);
  const fb = mesh(new THREE.BoxGeometry(2 * r, 0.6, 3 - r), [faceMat(1), faceMat(1), topMat(0.3, 3), faceMat(1), faceMat(1), faceMat(1)], false, true);
  fb.position.set(0, -0.3, r + (3 - r) / 2); front.add(fb);
  g.add(front);

  // water-table line across the cut face
  const wl = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, 0.018), new THREE.MeshBasicMaterial({ color: '#7fd4ff', transparent: true, opacity: 0.9, toneMapped: false }));
  wl.position.set((X0 + X1) / 2, D.waterY, 0.004); g.add(wl);

  return { group: g, front, waterLine: wl, X0, X1, Z0 };
}

// casing pipe and the water standing in it
export function buildBore() {
  const g = new THREE.Group();
  const H = D.wellTop - D.boreBottom;
  const casingMat = std({ color: '#c9d2da', roughness: 0.35, metalness: 0.3, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
  const casing = new THREE.Mesh(new THREE.CylinderGeometry(D.boreR, D.boreR, H, 40, 1, true), casingMat);
  casing.position.y = D.boreBottom + H / 2; casing.renderOrder = 3; g.add(casing);
  // slots of the screen section below the water table (dark ticks drawn on a texture)
  const rim = mesh(new THREE.TorusGeometry(D.boreR, 0.008, 8, 40), std({ color: '#9aa6b0', metalness: 0.6, roughness: 0.35 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = D.wellTop; g.add(rim);
  const waterMat = new THREE.MeshStandardMaterial({ color: '#2a8fe0', roughness: 0.1, transparent: true, opacity: 0.2, depthWrite: false, emissive: '#0b3e70', emissiveIntensity: 0.4 });
  const wh = D.waterY - D.boreBottom;
  const water = new THREE.Mesh(new THREE.CylinderGeometry(D.casingR, D.casingR, wh, 40), waterMat);
  water.position.y = D.boreBottom + wh / 2; water.renderOrder = 2; g.add(water);
  const surf = new THREE.Mesh(new THREE.CircleGeometry(D.casingR, 40), new THREE.MeshStandardMaterial({ color: '#6cc6ff', transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.05, emissive: '#1d6fae', emissiveIntensity: 0.6 }));
  surf.rotation.x = -Math.PI / 2; surf.position.y = D.waterY; surf.renderOrder = 2; g.add(surf);
  return { group: g, casingMat, waterMat, surf };
}

// ----------------------------------------------------------------------------- the pump
// local frame: y along the pump, 0 at the bottom of the motor. Parts that turn are in `spinners`.
export function buildPump() {
  const root = new THREE.Group();
  const R = D.pumpR;
  const SS = { color: '#cdd3d9', roughness: 0.22, metalness: 0.95 };
  const motorShell = std({ ...SS, envMapIntensity: 1.2 });
  const stageShell = std({ ...SS, color: '#c3cad1' });
  const headShell = std({ ...SS, color: '#bfc6cd' });
  const xr = { motor: [motorShell], stages: [stageShell], head: [headShell] };

  // motor
  const motor = new THREE.Group(); root.add(motor);
  motor.add(mesh(lathe([[0.001, 0], [R * 0.7, 0], [R - 0.004, 0.012], [R, 0.03], [R, 0.48], [R - 0.006, 0.5], [0.03, 0.5]]), motorShell));
  const bands = instanced(new THREE.TorusGeometry(R + 0.001, 0.0025, 6, 48), std({ ...SS, color: '#9fa8b1' }), [0.035, 0.475].map((y) => [v3(0, y, 0), new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), Math.PI / 2)]));
  motor.add(bands); xr.motor.push(bands.material);
  // stator core (laminations as a ribbed lathe) + copper windings
  const core = [[0.041, 0.08]];
  for (let i = 0; i <= 36; i++) { const y = 0.08 + i * 0.01; core.push([0.057, y], [0.0555, y + 0.005]); }
  core.push([0.057, 0.44], [0.041, 0.44], [0.041, 0.08]);
  const coreMat = std({ color: '#6f767e', roughness: 0.5, metalness: 0.7 });
  motor.add(mesh(lathe(core), coreMat));
  xr.core = [coreMat];
  const coilMats = [];
  const CR = 0.047, HALF = 0.34, AR = CR * Math.sin(HALF);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, m = std({ color: '#d07a3a', roughness: 0.35, metalness: 0.85, emissive: '#000000' });
    coilMats.push({ a, m });
    for (const y of [0.075, 0.445]) {
      const e = new THREE.Group(); e.position.set(Math.cos(a) * CR * Math.cos(HALF), y, -Math.sin(a) * CR * Math.cos(HALF)); e.rotation.y = a + Math.PI / 2;
      const tor = mesh(new THREE.TorusGeometry(AR, 0.0055, 6, 16, Math.PI), m);
      if (y < 0.2) tor.rotation.z = Math.PI;
      e.add(tor); motor.add(e);
    }
    for (const da of [-HALF, HALF]) {
      const b = mesh(new THREE.BoxGeometry(0.009, 0.37, 0.009), m);
      b.position.set(Math.cos(a + da) * CR, 0.26, -Math.sin(a + da) * CR);
      motor.add(b);
    }
  }
  // turning parts
  const spinners = [];
  const rotor = new THREE.Group(); root.add(rotor); spinners.push(rotor);
  rotor.add(mesh(lathe([[0.001, 0.09], [0.037, 0.09], [0.037, 0.43], [0.001, 0.43]], 32), std({ color: '#7b828a', roughness: 0.45, metalness: 0.8 })));
  const barList = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; barList.push([v3(Math.cos(a) * 0.0375, 0.26, Math.sin(a) * 0.0375), qY(-a).multiply(new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), 0.18))]); }
  rotor.add(instanced(new THREE.BoxGeometry(0.005, 0.33, 0.007), std({ color: '#e2b07a', roughness: 0.3, metalness: 0.9 }), barList));
  const shaftMat = std({ color: '#d4d9de', roughness: 0.25, metalness: 0.95, emissive: '#000000' });
  rotor.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.06, 16).translate(0, 0.05 + 0.53, 0), shaftMat));

  // seal housing + intake bracket
  root.add(mesh(lathe([[0.03, 0.5], [R - 0.004, 0.5], [R - 0.004, 0.535], [R, 0.545], [R, 0.56], [0.02, 0.56]]), std({ ...SS, color: '#a9b1b9' })));
  // coupling on the shaft inside the intake
  rotor.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 16).translate(0, 0.6, 0), std({ color: '#8d959c', metalness: 0.9, roughness: 0.3 })));
  // intake screen: vertical bars between two rings
  const screenMat = std({ ...SS, color: '#b8c0c8' });
  const bars = [];
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; bars.push([v3(Math.cos(a) * (R - 0.002), 0.61, Math.sin(a) * (R - 0.002)), qY(-a)]); }
  root.add(instanced(new THREE.BoxGeometry(0.0035, 0.1, 0.006), screenMat, bars));
  for (const y of [0.565, 0.655]) root.add(mesh(lathe([[R - 0.006, y - 0.006], [R + 0.001, y - 0.006], [R + 0.001, y + 0.006], [R - 0.006, y + 0.006]]), screenMat));

  // stages: bowl shell + diffuser (fixed) + impeller (turns); each stage its own group so the stack can explode
  const brass = std({ color: '#d9a640', roughness: 0.28, metalness: 0.9, emissive: '#000000' });
  const diffMat = std({ color: '#7f97ad', roughness: 0.4, metalness: 0.6 });
  const stageGroups = [], impellers = [], impMats = [];
  const vane = (r0, r1, k, th, h, m) => {        // a curved vane in the xz plane, extruded up by h
    const sh = new THREE.Shape(), back = [];
    for (let i = 0; i <= 16; i++) {
      const r = r0 + (r1 - r0) * i / 16, a = k * (r - r0) / (r1 - r0);
      const a1 = a + th / r, a2 = a - th / r;
      if (!i) sh.moveTo(r * Math.cos(a1), r * Math.sin(a1)); else sh.lineTo(r * Math.cos(a1), r * Math.sin(a1));
      back.push([r * Math.cos(a2), r * Math.sin(a2)]);
    }
    for (let i = back.length - 1; i >= 0; i--) sh.lineTo(...back[i]);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 4 });
    geo.rotateX(-Math.PI / 2);            // shape xy -> world xz (y up)
    return geo;
  };
  const impVane = vane(0.012, 0.052, 1.1, 0.0026, 0.022);
  const diffVane = vane(0.016, 0.057, -1.25, 0.0024, 0.032);
  for (let k = 0; k < D.stages; k++) {
    const sg = new THREE.Group(); sg.position.y = D.stageY(k); root.add(sg); stageGroups.push(sg);
    const h = D.stageH;
    sg.add(mesh(lathe([[R - 0.004, 0.0], [R, 0.004], [R, h - 0.004], [R - 0.004, h], [R - 0.008, h], [R - 0.008, 0]]), stageShell));
    sg.add(mesh(lathe([[R - 0.0005, h - 0.006], [R + 0.0025, h - 0.004], [R + 0.0025, h], [R - 0.0005, h]]), std({ ...SS, color: '#9aa3ac' })));
    // diffuser: a plate under the next eye + fixed return vanes
    const diff = new THREE.Group(); sg.add(diff);
    diff.add(mesh(lathe([[0.014, 0.068], [R - 0.008, 0.074], [R - 0.008, 0.078], [0.014, 0.076]], 40), diffMat));
    for (let i = 0; i < 7; i++) { const v = mesh(diffVane, diffMat); v.position.y = 0.036; v.rotation.y = i / 7 * Math.PI * 2; diff.add(v); }
    // impeller: back shroud on top, hub, six backward-curved vanes, eye facing down
    const im = new THREE.Group(); im.position.y = 0.006; sg.add(im); impellers.push(im); spinners.push(im);
    const bm = brass.clone(); impMats.push(bm);
    im.add(mesh(lathe([[0.012, 0.022], [0.052, 0.022], [0.052, 0.026], [0.012, 0.028]], 40), bm));
    im.add(mesh(lathe([[0.009, -0.002], [0.016, -0.002], [0.014, 0.032], [0.009, 0.032]], 24), bm));
    im.add(mesh(lathe([[0.021, 0.0], [0.024, 0.0], [0.024, 0.004], [0.021, 0.004]], 32), bm));     // eye ring
    for (let i = 0; i < 6; i++) { const v = mesh(impVane, bm); v.rotation.y = i / 6 * Math.PI * 2; im.add(v); }
  }

  // discharge head with the check valve
  const head = new THREE.Group(); head.position.y = D.stageY(D.stages); root.add(head);
  const hy = D.headTop - D.stageY(D.stages);
  head.add(mesh(lathe([[R - 0.008, 0], [R, 0.004], [R, 0.04], [0.045, 0.075], [0.037, hy - 0.01], [0.035, hy], [0.026, hy], [0.026, 0.02], [R - 0.008, 0.01]]), headShell));
  const valveMat = std({ color: '#3e4752', roughness: 0.4, metalness: 0.6 });
  head.add(mesh(lathe([[0.02, 0.026], [0.045, 0.026], [0.045, 0.034], [0.02, 0.034]], 40), valveMat));          // seat
  const poppet = new THREE.Group(); head.add(poppet);
  poppet.add(mesh(lathe([[0.001, 0.0], [0.03, 0.0], [0.03, 0.006], [0.012, 0.012], [0.001, 0.012]], 40), std({ color: '#e05a3a', roughness: 0.45, metalness: 0.2, emissive: '#000000' })));
  poppet.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 8).translate(0, 0.02, 0), valveMat));
  poppet.userData.closedY = 0.034; poppet.userData.openY = 0.058;
  poppet.position.y = poppet.userData.closedY;
  // top of head: threaded socket for the column pipe
  head.add(mesh(lathe([[0.033, hy], [0.04, hy], [0.04, hy + 0.03], [0.033, hy + 0.03]], 32), std({ ...SS, color: '#aab2ba' })));

  // cable guard strip running down the side (back) of the pump
  const guard = mesh(new THREE.BoxGeometry(0.02, 0.62, 0.006), std({ ...SS, color: '#b1b8bf' }));
  guard.position.set(-0.03, 0.53 + 0.31, -R - 0.003); root.add(guard);

  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, spinners, stageGroups, impellers, impMats, coilMats, poppet, shaftMat, xr, head };
}

// column (riser) pipe from the pump to the surface; length set each frame
export function buildRiser() {
  const g = new THREE.Group();
  const mat = std({ color: '#e6ecf0', roughness: 0.3, metalness: 0, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(D.riserR, D.riserR, 1, 28, 1, true).translate(0, 0.5, 0), mat);
  pipe.renderOrder = 4; g.add(pipe);
  const cplMat = std({ color: '#d2dbe2', roughness: 0.4, metalness: 0 });
  const cpl = new THREE.InstancedMesh(new THREE.CylinderGeometry(D.riserR + 0.008, D.riserR + 0.008, 0.06, 24), cplMat, 8);
  cpl.castShadow = true; g.add(cpl);
  const cableMat = std({ color: '#16191d', roughness: 0.6 });
  const cable = mesh(new THREE.BoxGeometry(0.018, 1, 0.007).translate(0, 0.5, 0), cableMat);
  cable.position.set(-0.012, 0, -D.riserR - 0.006); g.add(cable);
  // cable from the motor along the pump to the riser
  const pcable = mesh(new THREE.BoxGeometry(0.016, 0.64, 0.006), cableMat);
  g.add(pcable);
  const ties = new THREE.InstancedMesh(new THREE.TorusGeometry(D.riserR + 0.009, 0.003, 4, 20), std({ color: '#111', roughness: 0.6 }), 12);
  g.add(ties);
  return { group: g, pipe, mat, cpl, cable, pcable, ties };
}

// ----------------------------------------------------------------------------- surface: wellhead, pipe, house, tank, panel
export function buildSurface() {
  const g = new THREE.Group();
  const { house: Hs, tank: T } = D;
  // wellhead plate + elbow
  const steel = std({ color: '#8e979f', roughness: 0.45, metalness: 0.7 });
  const plate = mesh(new THREE.CylinderGeometry(D.boreR + 0.03, D.boreR + 0.03, 0.025, 32), steel); plate.position.y = D.wellTop + 0.012;
  const wellhead = new THREE.Group(); wellhead.add(plate); g.add(wellhead);

  // delivery: wellhead -> along the ground -> up the house wall -> into the roof tank
  const path = new THREE.CurvePath();
  const pts = [v3(0, D.wellTop + 0.02, 0), v3(0, 0.3, 0), v3(0.05, 0.36, -0.03), v3(1.2, 0.36, -0.62), v3(1.22, 0.42, -0.63), v3(1.22, 3.5, -0.63), v3(1.27, 3.56, -0.66), v3(T[0], 3.56, T[2]), v3(T[0], 3.5, T[2]), v3(T[0], 3.35, T[2])];
  const P = (i) => pts[i];
  path.add(new THREE.LineCurve3(P(0), P(1)));
  path.add(new THREE.QuadraticBezierCurve3(P(1), v3(0, 0.36, 0), P(2)));
  path.add(new THREE.LineCurve3(P(2), P(3)));
  path.add(new THREE.QuadraticBezierCurve3(P(3), v3(1.22, 0.36, -0.63), P(4)));
  path.add(new THREE.LineCurve3(P(4), P(5)));
  path.add(new THREE.QuadraticBezierCurve3(P(5), v3(1.22, 3.56, -0.63), P(6)));
  path.add(new THREE.LineCurve3(P(6), P(7)));
  path.add(new THREE.QuadraticBezierCurve3(P(7), v3(T[0], 3.56, T[2]), P(8)));
  path.add(new THREE.LineCurve3(P(8), P(9)));
  const pipeMat = std({ color: '#e8eef2', roughness: 0.3, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(path, 400, D.riserR, 20, false), pipeMat); pipe.renderOrder = 4; g.add(pipe);

  // house: plastered walls with windows, a door, parapet; roof tank
  const wallTex = canvasTex(512, 512, (c) => {
    c.fillStyle = '#efe3c8'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${130 + rng() * 60},${110 + rng() * 40},80,${rng() * 0.06})`; c.fillRect(rng() * 512, rng() * 512, 3, 3); }
    const win = (x, y, w, h) => { c.fillStyle = '#7b5a37'; c.fillRect(x - 10, y - 10, w + 20, h + 20); c.fillStyle = '#2b4760'; c.fillRect(x, y, w, h); c.fillStyle = '#7b5a37'; c.fillRect(x + w / 2 - 5, y, 10, h); c.fillRect(x, y + h / 2 - 5, w, 10); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x + 6, y + 6, w / 2 - 14, 18); };
    win(70, 90, 120, 130); win(320, 90, 120, 130);
    c.fillStyle = '#8a4f2b'; c.fillRect(330, 300, 110, 212); c.fillStyle = '#c99a4b'; c.fillRect(420, 400, 8, 14);
    c.fillStyle = '#c8b894'; c.fillRect(0, 480, 512, 32);
  });
  const plain = std({ color: '#e3d5b6', roughness: 0.92 });
  const front = std({ map: wallTex, roughness: 0.92 });
  const hw = Hs.x1 - Hs.x0, hd = Hs.z1 - Hs.z0;
  const house = mesh(new THREE.BoxGeometry(hw, Hs.h, hd), [plain, front, plain, plain, front, plain]);
  house.position.set((Hs.x0 + Hs.x1) / 2, Hs.h / 2, (Hs.z0 + Hs.z1) / 2); g.add(house);
  const roofMat = std({ color: '#bcae93', roughness: 0.9 });
  const roof = mesh(new THREE.BoxGeometry(hw + 0.14, 0.1, hd + 0.14), roofMat); roof.position.set(house.position.x, Hs.h + 0.05, house.position.z); g.add(roof);
  const par = [[hw + 0.14, 0.04, (Hs.z1 + 0.05)], [hw + 0.14, 0.04, (Hs.z0 - 0.05)]];
  for (const [w, d, z] of par) { const p = mesh(new THREE.BoxGeometry(w, 0.25, 0.06), roofMat); p.position.set(house.position.x, Hs.h + 0.22, z); g.add(p); }
  const pl = mesh(new THREE.BoxGeometry(0.06, 0.25, hd + 0.14), roofMat); pl.position.set(Hs.x0 - 0.04, Hs.h + 0.22, house.position.z); g.add(pl);
  // tank (black ribbed plastic, cut on the camera side so the water shows)
  const prof = [];
  for (let i = 0; i <= 14; i++) prof.push(new THREE.Vector2(0.36 + (i % 2 ? 0.012 : 0), i / 14 * 0.66));
  prof.push(new THREE.Vector2(0.3, 0.72), new THREE.Vector2(0.09, 0.75), new THREE.Vector2(0.09, 0.8), new THREE.Vector2(0.001, 0.8));
  const tank = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), std({ color: '#25292f', roughness: 0.55, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  tank.position.set(...T); tank.renderOrder = 3; tank.castShadow = true; g.add(tank);
  const tankWater = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 40), std({ color: '#2c9ce8', roughness: 0.2, emissive: '#0c5da0', emissiveIntensity: 0.6 }));
  tankWater.position.set(...T); g.add(tankWater);

  // starter panel on a post, cable to the wellhead
  const panel = new THREE.Group(); panel.position.set(-0.75, 0, -0.55); g.add(panel);
  const post = mesh(new THREE.BoxGeometry(0.07, 1.25, 0.07), std({ color: '#6b6f73', metalness: 0.5 })); post.position.y = 0.62; panel.add(post);
  const box = mesh(new THREE.BoxGeometry(0.42, 0.52, 0.18), std({ color: '#d9dee2', roughness: 0.45, metalness: 0.2 })); box.position.set(0, 1.2, 0.06); panel.add(box);
  const door = mesh(new THREE.BoxGeometry(0.36, 0.46, 0.01), std({ color: '#c7cdd2', roughness: 0.4 })); door.position.set(0, 1.2, 0.156); panel.add(door);
  const lampOn = std({ color: '#2a5a2f', emissive: '#000000' }), lampOff = std({ color: '#5a2420', emissive: '#000000' });
  const l1 = mesh(new THREE.SphereGeometry(0.022, 12, 8), lampOn); l1.position.set(-0.08, 1.34, 0.165); panel.add(l1);
  const l2 = mesh(new THREE.SphereGeometry(0.022, 12, 8), lampOff); l2.position.set(0.0, 1.34, 0.165); panel.add(l2);
  const btn = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16).rotateX(Math.PI / 2), std({ color: '#2b9a3c' })); btn.position.set(-0.08, 1.12, 0.17); panel.add(btn);
  const btn2 = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16).rotateX(Math.PI / 2), std({ color: '#c8322a' })); btn2.position.set(0.08, 1.12, 0.17); panel.add(btn2);
  const pc = new THREE.CatmullRomCurve3([v3(-0.75, 0.95, -0.48), v3(-0.72, 0.1, -0.45), v3(-0.4, 0.02, -0.25), v3(-0.06, 0.05, -0.08), v3(-0.03, D.wellTop + 0.03, -0.04)]);
  const pcab = mesh(new THREE.TubeGeometry(pc, 60, 0.011, 8, false), std({ color: '#16191d', roughness: 0.6 })); g.add(pcab);

  return { group: g, path, pipe, pipeMat, tankWater, wellhead, panel, lampOn, lampOff, house, tank };
}

// ----------------------------------------------------------------------------- people + machines for the install
function capsule(r, len, m) { return mesh(new THREE.CapsuleGeometry(r, len, 6, 14), m); }
export function makeWorker({ shirt = '#e8722c', pants = '#2c3e5a', skin = '#a8714a', helmet = '#f2c230' } = {}) {
  const w = new THREE.Group();
  const shirtM = std({ color: shirt, roughness: 0.85 }), pantsM = std({ color: pants, roughness: 0.9 }), skinM = std({ color: skin, roughness: 0.7 });
  const vest = std({ color: '#c9f24a', roughness: 0.7, emissive: '#1d2a00' });
  const bootM = std({ color: '#2a211b', roughness: 0.8 });
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.1 * s, 0.9, 0); w.add(hip);
    const thigh = capsule(0.075, 0.32, pantsM); thigh.position.y = -0.22; hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee);
    const shin = capsule(0.065, 0.32, pantsM); shin.position.y = -0.21; knee.add(shin);
    const boot = mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), bootM); boot.position.set(0, -0.43, 0.04); knee.add(boot);
    legs.push({ hip, knee });
  }
  const torso = new THREE.Group(); torso.position.y = 0.92; w.add(torso);
  const hips = mesh(new THREE.BoxGeometry(0.32, 0.16, 0.2), pantsM); hips.position.y = 0.04; torso.add(hips);
  const body = capsule(0.17, 0.32, shirtM); body.position.y = 0.33; body.scale.set(1, 1, 0.72); torso.add(body);
  const vestM = mesh(new THREE.CapsuleGeometry(0.175, 0.26, 6, 14), vest); vestM.position.y = 0.33; vestM.scale.set(1.01, 1, 0.75); torso.add(vestM);
  const neck = capsule(0.05, 0.05, skinM); neck.position.y = 0.6; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.76; torso.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.11, 24, 16), skinM));
  const hel = mesh(new THREE.SphereGeometry(0.125, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: helmet, roughness: 0.35 })); hel.position.y = 0.02; head.add(hel);
  const brim = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 24), std({ color: helmet, roughness: 0.35 })); brim.position.set(0, 0.02, 0.03); head.add(brim);
  const eyeM = std({ color: '#1b1410', roughness: 0.4 });
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeM); e.position.set(0.038 * s, -0.005, 0.098); head.add(e); }
  const mous = mesh(new THREE.BoxGeometry(0.06, 0.012, 0.01), std({ color: '#2a1a12' })); mous.position.set(0, -0.045, 0.1); head.add(mous);
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.22 * s, 0.5, 0); torso.add(sh);
    const up = capsule(0.055, 0.22, shirtM); up.position.y = -0.15; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    const fo = capsule(0.047, 0.2, skinM); fo.position.y = -0.13; el.add(fo);
    const hand = mesh(new THREE.SphereGeometry(0.05, 12, 8), std({ color: '#d4b04a', roughness: 0.8 })); hand.position.y = -0.28; el.add(hand);   // gloves
    arms.push({ sh, el });
  }
  w.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: w, torso, head, arms, legs };
}

export function buildCrew() {
  const g = new THREE.Group();
  const steel = std({ color: '#5d6873', roughness: 0.45, metalness: 0.7 });
  const yellow = std({ color: '#e8b528', roughness: 0.45, metalness: 0.3 });
  // tripod over the bore
  const apex = v3(0, 2.75, 0);
  const feet = [v3(-0.95, 0, 0.55), v3(0.95, 0, 0.55), v3(0, 0, -1.15)];
  for (const f of feet) {
    const d = apex.clone().sub(f), L = d.length();
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.04, L, 12), steel);
    leg.position.copy(f).addScaledVector(d, 0.5);
    leg.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize());
    g.add(leg);
    const shoe = mesh(new THREE.BoxGeometry(0.16, 0.03, 0.16), steel); shoe.position.copy(f); shoe.position.y = 0.015; g.add(shoe);
  }
  const cap = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16), steel); cap.position.copy(apex); g.add(cap);
  // chain hoist block
  const hoist = new THREE.Group(); hoist.position.set(0, 2.45, 0); g.add(hoist);
  const hk = mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16), steel); hk.position.y = 0.2; hoist.add(hk);
  const body = mesh(new THREE.BoxGeometry(0.2, 0.24, 0.15), yellow); hoist.add(body);
  const wheel = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 24).rotateZ(Math.PI / 2), std({ color: '#3a3f45', metalness: 0.7, roughness: 0.4 }));
  wheel.position.set(0.13, 0.0, 0); hoist.add(wheel);
  // load chain (from the block down to the clamp) and the hand chain loop (hanging to the worker)
  const linkG = new THREE.TorusGeometry(0.014, 0.004, 4, 8);
  const loadChain = new THREE.InstancedMesh(linkG, steel, 90); loadChain.castShadow = true; g.add(loadChain);
  const handChain = new THREE.InstancedMesh(linkG, std({ color: '#9aa2aa', metalness: 0.8, roughness: 0.3 }), 120); handChain.castShadow = true; g.add(handChain);
  // pipe clamp holding the column pipe
  const clamp = new THREE.Group(); g.add(clamp);
  const cb = mesh(new THREE.BoxGeometry(0.34, 0.05, 0.08), std({ color: '#c13c2c', roughness: 0.5, metalness: 0.4 })); clamp.add(cb);
  const sling = mesh(new THREE.TorusGeometry(0.08, 0.008, 6, 16), steel); sling.position.y = 0.07; sling.rotation.y = Math.PI / 2; clamp.add(sling);

  // cable drum on a stand
  const drum = new THREE.Group(); drum.position.set(-1.35, 0, -0.7); g.add(drum);
  for (const s of [-1, 1]) { const st = mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), steel); st.position.set(0.2 * s, 0.31, 0); drum.add(st); }
  const reel = new THREE.Group(); reel.position.y = 0.55; drum.add(reel);
  for (const s of [-1, 1]) { const f = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 32).rotateZ(Math.PI / 2), std({ color: '#a8743a', roughness: 0.8 })); f.position.x = 0.16 * s; reel.add(f); }
  const coil = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 32).rotateZ(Math.PI / 2), std({ color: '#17191c', roughness: 0.6 })); reel.add(coil);
  for (let i = 0; i < 6; i++) { const sp = mesh(new THREE.BoxGeometry(0.31, 0.03, 0.03), std({ color: '#8d5e2e' })); sp.rotation.x = i / 6 * Math.PI; sp.position.y = 0; reel.add(sp); }
  // generator set
  const gen = new THREE.Group(); gen.position.set(-2.6, 0, -1.4); gen.rotation.y = 0.5; g.add(gen);
  const gb = mesh(new THREE.BoxGeometry(1.3, 0.75, 0.7), std({ color: '#2c7a3f', roughness: 0.5, metalness: 0.3 })); gb.position.y = 0.48; gen.add(gb);
  const gr = mesh(new THREE.BoxGeometry(1.0, 0.3, 0.02), std({ color: '#1b2b20', roughness: 0.7 })); gr.position.set(0, 0.55, 0.36); gen.add(gr);
  const ex = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), std({ color: '#333' })); ex.position.set(0.45, 0.98, -0.1); gen.add(ex);
  for (const [x, z] of [[-0.45, 0.32], [0.45, 0.32], [-0.45, -0.32], [0.45, -0.32]]) { const wh = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 18).rotateX(Math.PI / 2), std({ color: '#1a1a1a', roughness: 0.9 })); wh.position.set(x, 0.11, z); gen.add(wh); }
  // spare column pipes lying on the ground
  const pm = std({ color: '#e1e7eb', roughness: 0.35 });
  for (let i = 0; i < 4; i++) { const p = mesh(new THREE.CylinderGeometry(D.riserR, D.riserR, 3, 16).rotateZ(Math.PI / 2), pm); p.position.set(1.15 + (i % 2) * 0.02, D.riserR + Math.floor(i / 2) * 0.06, -1.4 - i * 0.068 + Math.floor(i / 2) * 0.1); p.rotation.y = 0.35; g.add(p); }

  const A = makeWorker({ shirt: '#2f6db5' }); A.group.position.set(0.7, 0, -0.04); A.group.rotation.y = -Math.PI / 2 + 0.3; g.add(A.group);
  const B = makeWorker({ shirt: '#d9532b', skin: '#8e5c3b', helmet: '#f6f6f2' }); B.group.position.set(-0.47, 0, -0.16); B.group.rotation.y = Math.PI / 2 - 0.35; g.add(B.group);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, hoist, wheel, loadChain, handChain, clamp, reel, A, B, apex };
}

// the surface pump of the "why" comparison: a small monoblock + suction pipe down to the water
export function buildSurfacePump() {
  const g = new THREE.Group();
  const red = std({ color: '#d2452f', roughness: 0.4, metalness: 0.2 });
  const x = D.suctionX;
  const mb = new THREE.Group(); mb.position.set(x - 0.32, 0, -0.18); mb.scale.setScalar(1.6); g.add(mb);
  const m1 = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.34, 24).rotateZ(Math.PI / 2), red); m1.position.set(0, 0.16, 0); mb.add(m1);
  const m2 = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24).rotateZ(Math.PI / 2), red); m2.position.set(0.22, 0.16, 0); mb.add(m2);
  const base = mesh(new THREE.BoxGeometry(0.42, 0.03, 0.24), std({ color: '#7c2a1f' })); base.position.y = 0.015; mb.add(base);
  const pipeMat = std({ color: '#f4d9c9', roughness: 0.3, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide });
  const curve = new THREE.CurvePath();
  curve.add(new THREE.LineCurve3(v3(x - 0.05, 0.256, -0.18), v3(x - 0.02, 0.256, -0.18)));
  curve.add(new THREE.QuadraticBezierCurve3(v3(x - 0.02, 0.256, -0.18), v3(x, 0.256, -0.18), v3(x, 0.256, -0.1)));
  curve.add(new THREE.QuadraticBezierCurve3(v3(x, 0.256, -0.1), v3(x, 0.256, 0.06), v3(x, 0.15, 0.06)));
  curve.add(new THREE.LineCurve3(v3(x, 0.15, 0.06), v3(x, -3.05, 0.06)));
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.042, 16, false), pipeMat); pipe.renderOrder = 4; g.add(pipe);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 1, 16).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#3aa8ff', emissive: '#1a7fd8', emissiveIntensity: 1.2, roughness: 0.2 }));
  col.position.set(x, D.waterY, 0.06); g.add(col);
  // the "8 m" bracket
  const brM = new THREE.MeshBasicMaterial({ color: '#ff5a4a', toneMapped: false, transparent: true });
  const br = new THREE.Group(); g.add(br);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.01), brM); br.add(bar);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.01), brM), t2 = t1.clone(); br.add(t1, t2);
  const limit = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.025), new THREE.MeshBasicMaterial({ color: '#ff5a4a', toneMapped: false, transparent: true }));
  g.add(limit);
  return { group: g, col, br, bar, t1, t2, limit, brM, pipeMat };
}

export function buildSky() {
  const tex = canvasTex(4, 256, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3f86c9'); gr.addColorStop(0.38, '#8ec5ef'); gr.addColorStop(0.5, '#e9f3fa'); gr.addColorStop(0.505, '#a9b79c'); gr.addColorStop(0.6, '#55663f'); gr.addColorStop(1, '#2a3320');
    c.fillStyle = gr; c.fillRect(0, 0, 4, 256);
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 24), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -10;
  return sky;
}
