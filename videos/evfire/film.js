// EV बैटरी में आग क्यों लगती है? — KAISECHALTAHAI3D #8. 1 unit = 1 m. Car centred at origin, nose toward +x. Big cell lab at X = 100.
import { THREE, V, TAU, W, H, film, scene, renderer, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.4;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const smokeTex = (() => { const c = cv(128, 128), g = c.getContext('2d'); for (let i = 0; i < 14; i++) { const x = 64 + (hash(i) - 0.5) * 50, y = 64 + (hash(i * 3) - 0.5) * 50, r = 22 + 18 * hash(i * 5), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } return new THREE.CanvasTexture(c); })();
const LAB = V(100, 0, 0);

// ================================================================ underground parking (moderate greys)
const conc = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.fillStyle = '#6c6f74'; g.fillRect(0, 0, 512, 512); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${hash(i) < 0.5 ? '30,30,34' : '170,170,175'},${0.06 * hash(i * 3)})`; g.fillRect(512 * hash(i * 5), 512 * hash(i * 7), 4, 4); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 8); return t; })();
add(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: conc, roughness: 0.55, envMap: ENV, envMapIntensity: 0.25 }), 0, 0, 0, scene, false).receiveShadow = true;
for (const x of [-3.2, 3.2]) add(new THREE.PlaneGeometry(0.1, 5.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.6 }), x * 0 + (x < 0 ? -2.6 : 2.6), 0.002, 0.2, scene, false).rotation.z = Math.PI / 2;
for (const z of [-1.35, 1.35]) add(new THREE.PlaneGeometry(5.6, 0.1).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.6 }), 0, 0.002, z + (z < 0 ? -0.15 : 0.15) * 0, scene, false);
add(new THREE.PlaneGeometry(40, 3.2), mat(0x8a8d92, 0.9), 0, 1.6, -2.6, scene, false);
add(new THREE.PlaneGeometry(40, 40).rotateX(Math.PI / 2), mat(0x55585e, 0.9), 0, 3.2, 0, scene, false);
const stripe = (() => { const c = cv(64, 256), g = c.getContext('2d'); for (let i = -4; i < 12; i++) { g.fillStyle = i % 2 ? '#f2c21a' : '#1a1a1a'; g.beginPath(); g.moveTo(0, i * 32); g.lineTo(64, i * 32 - 32); g.lineTo(64, i * 32); g.lineTo(0, i * 32 + 32); g.fill(); } return tex(c); })();
for (const [x, z] of [[-3.6, -2.1], [3.6, -2.1], [-3.6, 4.6], [3.6, 4.6], [-9, -2.1], [9, -2.1]]) { add(new THREE.BoxGeometry(0.6, 3.2, 0.6), mat(0x9a9da2, 0.85), x, 1.6, z, scene); add(new THREE.BoxGeometry(0.62, 1.0, 0.62), new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.7 }), x, 0.5, z, scene, false); }
const tubes = []; for (let x = -12; x <= 12; x += 4) for (const z of [-1.2, 2.4]) { add(new THREE.BoxGeometry(1.4, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: HDR(2.2, 2.3, 2.5) }), x, 3.15, z, scene, false); }
// other cars (grey silhouettes) for depth
for (const x of [-6.4]) { const g2 = group(x, 0, 0.2); add(new THREE.BoxGeometry(4.0, 0.7, 1.7), mat(0x5a6068, 0.5, 0.3), 0, 0.65, 0, g2); add(new THREE.BoxGeometry(2.4, 0.55, 1.6), mat(0x2a3038, 0.3, 0.3), -0.3, 1.25, 0, g2); }
// wall charger (company charger) + label
const charger = group(1.9, 1.15, -2.56); add(new THREE.BoxGeometry(0.34, 0.5, 0.14), mat(0xf4f4f4, 0.4), 0, 0, 0.07, charger); add(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ color: HDR(0.3, 2.4, 0.8) }), 0, 0.1, 0.141, charger, false);
add(new THREE.BoxGeometry(0.22, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: HDR(0.2, 1.6, 2.4) }), 0, -0.1, 0.141, charger, false);

// ================================================================ the EV (bold electric blue, glossy)
const prof = new THREE.Shape(); [[-2.02, 0.32], [2.0, 0.32], [2.08, 0.5], [2.05, 0.7], [1.3, 0.88], [0.42, 1.42], [-1.38, 1.5], [-1.9, 1.24], [-2.05, 0.7]].forEach(([x, y], i) => (i ? prof.lineTo(x, y) : prof.moveTo(x, y)));
const bodyGeo = new THREE.ExtrudeGeometry(prof, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 6, curveSegments: 12 }); bodyGeo.translate(0, 0, -0.8);
const bodyM = new THREE.MeshPhysicalMaterial({ color: 0x1460ff, metalness: 0.4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06, envMap: ENV, envMapIntensity: 1.1, transparent: true, opacity: 1 });
const car = group(0, 0, 0); const body = add(bodyGeo, bodyM, 0, 0, 0, car); body.castShadow = true;
const gl = new THREE.Shape(); [[1.36, 0.86], [0.44, 1.49], [-1.4, 1.565], [-1.99, 1.24], [-1.93, 0.93]].forEach(([x, y], i) => (i ? gl.lineTo(x, y) : gl.moveTo(x, y)));
const glassM = new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, metalness: 0.2, roughness: 0.05, clearcoat: 1, envMap: ENV, envMapIntensity: 1.3, transparent: true, opacity: 1 });
const glass = add(new THREE.ExtrudeGeometry(gl, { depth: 1.64, bevelEnabled: false }).translate(0, 0, -0.82), glassM, 0, 0, 0, car, false);
const pillarM = new THREE.MeshPhysicalMaterial({ color: 0x1460ff, metalness: 0.4, roughness: 0.25, clearcoat: 1, envMap: ENV, transparent: true });
for (const x of [-0.45, 0.02]) add(new THREE.BoxGeometry(0.1, 0.6, 1.66), pillarM, x, 1.2, 0, car, false);
const wheels = []; for (const x of [-1.32, 1.32]) for (const z of [-0.8, 0.8]) { const w = group(x, 0.33, z, car); add(new THREE.CylinderGeometry(0.33, 0.33, 0.23, 32).rotateX(Math.PI / 2), mat(0x121316, 0.85), 0, 0, 0, w); add(new THREE.CylinderGeometry(0.2, 0.2, 0.24, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.25, envMap: ENV }), 0, 0, 0, w, false); wheels.push(w); }
const lampM = new THREE.MeshBasicMaterial({ color: HDR(2.6, 2.7, 3.0) }); for (const z of [-0.62, 0.62]) add(new THREE.BoxGeometry(0.06, 0.06, 0.42), lampM, 2.07, 0.68, z, car, false);
add(new THREE.BoxGeometry(0.05, 0.05, 1.5), new THREE.MeshBasicMaterial({ color: HDR(2.6, 0.15, 0.15) }), -2.1, 0.95, 0, car, false);
add(new THREE.BoxGeometry(0.4, 0.02, 0.012), new THREE.MeshBasicMaterial({ color: HDR(0.2, 2.0, 2.6) }), 0.9, 0.5, 0.865, car, false); // EV badge strip
for (const x of [2.06, -2.08]) add(new THREE.BoxGeometry(0.16, 0.2, 1.74), mat(0x15171c, 0.6), x, 0.42, 0, car);
for (const z of [-0.87, 0.87]) { add(new THREE.BoxGeometry(3.2, 0.12, 0.04), mat(0x15171c, 0.6), 0, 0.4, z, car, false); add(new THREE.BoxGeometry(0.16, 0.1, 0.16), bodyM, 0.95, 1.0, z * 1.08, car, false); }
const port = add(new THREE.BoxGeometry(0.14, 0.12, 0.02), mat(0x111111, 0.4), 1.45, 0.86, -0.87, car, false);
// battery pack (under the floor): tray, 924 cells, modules, orange HV cables, BMS board
const pack = group(0, 0, 0, car);
const trayM = new THREE.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0 });
add(new THREE.BoxGeometry(2.8, 0.03, 1.5), trayM, 0, 0.22, 0, pack, false);
const NX = 42, NZ = 22, CS = 0.062, CELLS = [];
const cellMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.1, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }), NX * NZ); cellMesh.frustumCulled = false; pack.add(cellMesh);
{ const m4 = new THREE.Matrix4(); let i = 0; for (let ix = 0; ix < NX; ix++) for (let iz = 0; iz < NZ; iz++) { const x = -1.3 + ix * CS + (ix >= 21 ? 0.04 : 0), z = -0.65 + iz * CS + (iz >= 11 ? 0.04 : 0); m4.makeTranslation(x, 0.29, z); cellMesh.setMatrixAt(i, m4); cellMesh.setColorAt(i, new THREE.Color(0, 0, 0)); CELLS.push({ x, z }); i++; } }
const modM = new THREE.MeshBasicMaterial({ color: HDR(0.9, 0.95, 1.0), transparent: true, opacity: 0 }); for (const x of [-1.33, 0.0, 1.32]) add(new THREE.BoxGeometry(0.012, 0.11, 1.42), modM, x + (x === 0 ? 0.0 : 0), 0.29, 0, pack, false); for (const z of [-0.68, 0.02, 0.73]) add(new THREE.BoxGeometry(2.66, 0.11, 0.012), modM, 0, 0.29, z, pack, false);
const hvM = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0x6a2a00, roughness: 0.5, transparent: true, opacity: 0 });
for (const z of [-0.3, 0.3]) rod(V(1.36, 0.36, z), V(1.62, 0.6, z * 0.5), 0.018, hvM, pack);
const bms = group(1.47, 0.3, 0, pack); const bmsM = new THREE.MeshStandardMaterial({ color: 0x0e8a3a, emissive: 0x0a4a1a, emissiveIntensity: 0.4, roughness: 0.5, transparent: true, opacity: 0 });
add(new THREE.BoxGeometry(0.16, 0.02, 0.5), bmsM, 0, 0, 0, bms, false); const chipM = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, transparent: true, opacity: 0 }); add(new THREE.BoxGeometry(0.07, 0.02, 0.07), chipM, 0, 0.02, 0, bms, false);
const bmsLight = add(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: HDR(0.3, 3, 0.6), transparent: true, opacity: 0 }), 0.04, 0.03, 0.18, bms, false);
const wires = []; for (let k = 0; k < 6; k++) { const z = -0.55 + k * 0.22, pts = [V(1.42, 0.31, (k - 2.5) * 0.06), V(1.2, 0.36, z), V(-0.6 + 0.4 * (k % 3), 0.36, z)]; const m = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.005, 5), new THREE.MeshBasicMaterial({ color: HDR(0.4, 2.4, 0.8), transparent: true, opacity: 0 }), 0, 0, 0, pack, false); wires.push(m); }
const pulses = particles(36, HDR(0.6, 3, 1.2), 0.05); pulses.p.material.map = dotTex; scene.remove(pulses.p); car.add(pulses.p);
// fire + smoke + glow light
const flames = particles(420, HDR(3.0, 1.3, 0.3), 0.28); flames.p.material.map = dotTex;
const embers = particles(160, HDR(3.0, 1.8, 0.5), 0.05); embers.p.material.map = dotTex;
const smoke = particles(160, new THREE.Color(0.12, 0.12, 0.13), 1.4, { additive: false, opacity: 0.55 }); smoke.p.material.map = smokeTex;
const fireL = new THREE.PointLight(0xff7a2a, 0, 9, 1.6); fireL.position.set(0, 0.5, 0); scene.add(fireL);

// ================================================================ the big cell lab (cut-away cell + layer sandwich)
const labBg = add(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { heat: { value: 0 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float heat; varying vec3 vP; void main(){ float y = vP.y * 0.5 + 0.5; vec3 c = mix(vec3(0.015,0.02,0.05), vec3(0.05,0.09,0.16), y); c = mix(c, mix(vec3(0.12,0.02,0.0), vec3(0.35,0.08,0.02), y), heat); gl_FragColor = vec4(c, 1.0); }' }), LAB.x, 1.5, LAB.z, scene, false);
const lab = group(LAB.x, 0, LAB.z);
add(new THREE.CylinderGeometry(3.2, 3.2, 0.1, 64), new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.3, metalness: 0.5, envMap: ENV, envMapIntensity: 0.4 }), 0, -0.05, 0, lab);
const cell = group(0, 0, 0, lab);
const canM = new THREE.MeshPhysicalMaterial({ color: 0x18b86a, roughness: 0.3, clearcoat: 1, envMap: ENV, envMapIntensity: 0.7, side: THREE.DoubleSide, emissive: 0x000000 });
add(new THREE.CylinderGeometry(0.9, 0.9, 3.2, 64, 1, true, Math.PI * 0.5, Math.PI * 1.5), canM, 0, 1.6, 0, cell);
const capM = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.25, envMap: ENV });
add(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 64, 1, false, Math.PI * 0.5, Math.PI * 1.5), capM, 0, 3.22, 0, cell); add(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 32), capM, 0, 3.3, 0, cell);
add(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 64, 1, false, Math.PI * 0.5, Math.PI * 1.5), capM, 0, -0.0 + 0.04, 0, cell);
// +/- signs on the can
const signTex = (s, col) => { const c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = col; g.font = '900 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 64, 70); return tex(c); };
add(new THREE.PlaneGeometry(0.5, 0.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: signTex('+', '#ff4a3a'), transparent: true }), -0.45, 3.36, -0.2, cell, false);
// jelly roll inside the cut (spiral of three strands: cathode red, separator white, anode blue)
const roll = group(0, 0, 0, cell); const STR = [[0xe0402a, 0], [0xf4f4f4, 0.035], [0x2a6aff, 0.07]];
const PHI = -0.65; cell.rotation.y = PHI; renderer.localClippingEnabled = true;
const uq = (th) => V(Math.sin(th), 0, Math.cos(th)), CLIP = [uq(PHI), uq(PHI + Math.PI / 2)].map((u) => new THREE.Plane(u.clone().negate(), u.dot(LAB)));
const rollM = STR.map(([c]) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, side: THREE.DoubleSide, emissive: 0x000000, clippingPlanes: CLIP, clipIntersection: true }));
STR.forEach(([c, off], k) => { const pts = []; for (let i = 0; i <= 400; i++) { const th = i / 400 * TAU * 7, r = 0.1 + (0.75 * i / 400) + off * 0.1; pts.push(new THREE.Vector2(Math.cos(th) * (r + off), Math.sin(th) * (r + off))); }
  const shp = new THREE.Shape(); pts.forEach((p, i) => (i ? shp.lineTo(p.x, p.y) : shp.moveTo(p.x, p.y))); for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i], l = p.length(), s = (l + 0.022) / l; shp.lineTo(p.x * s, p.y * s); }
  add(new THREE.ExtrudeGeometry(shp, { depth: 3.0, bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2), rollM[k], 0, 0.1, 0, roll, false); });
// layer sandwich (pulled out to the right of the cell)
const sand = group(2.3, 1.6, 0.7, lab); sand.rotation.y = -0.35;
const cathM = new THREE.MeshPhysicalMaterial({ color: 0xe0402a, roughness: 0.4, clearcoat: 0.6, envMap: ENV, envMapIntensity: 0.5, emissive: 0x000000 });
const anoM = new THREE.MeshPhysicalMaterial({ color: 0x2a6aff, roughness: 0.4, clearcoat: 0.6, envMap: ENV, envMapIntensity: 0.5, emissive: 0x000000 });
const sepM = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f2, roughness: 0.6, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
const cath = add(new THREE.BoxGeometry(0.22, 2.0, 1.3), cathM, -0.32, 0, 0, sand); const ano = add(new THREE.BoxGeometry(0.22, 2.0, 1.3), anoM, 0.32, 0, 0, sand);
const sep = add(new THREE.BoxGeometry(0.03, 2.1, 1.4, 1, 24, 16), sepM, 0, 0, 0, sand); const sepPos = sep.geometry.attributes.position.array.slice();
const ions = particles(90, HDR(3, 2.4, 0.5), 0.07); ions.p.material.map = dotTex; scene.remove(ions.p); sand.add(ions.p);
const sparks = particles(220, HDR(3, 2.6, 1.2), 0.05); sparks.p.material.map = dotTex; scene.remove(sparks.p); sand.add(sparks.p);
const nail = group(3.4, 1.7, 0.2, lab); const nailM = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.3, envMap: ENV });
add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 16).rotateZ(Math.PI / 2), nailM, 0.8, 0, 0, nail); add(new THREE.ConeGeometry(0.05, 0.25, 16).rotateZ(Math.PI / 2), nailM, -0.12, 0, 0, nail); add(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24).rotateZ(Math.PI / 2), nailM, 1.6, 0, 0, nail);
const labSmoke = particles(120, new THREE.Color(0.25, 0.24, 0.24), 0.9, { additive: false, opacity: 0.5 }); labSmoke.p.material.map = smokeTex;
const heatL = new THREE.PointLight(0xff5a1a, 0, 8, 1.5); heatL.position.set(LAB.x + 0.5, 1.8, 1.4); scene.add(heatL);

// ---------------------------------------------------------------- cartoon owner (2D cut-out) with the charger plug
async function cutout(svgStr, { h = 1.7, border = 10, res = 1200 } = {}) {
  const im = await img(svgURL(svgStr)), iw = im.naturalWidth, ih = im.naturalHeight, sc = res / ih, w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
  const st = cv(w, hh), s2 = st.getContext('2d'); for (let a = 0; a < 24; a++) s2.drawImage(im, o + Math.cos(a / 24 * TAU) * border, o + Math.sin(a / 24 * TAU) * border, iw * sc, ih * sc);
  s2.globalCompositeOperation = 'source-in'; s2.fillStyle = '#f6f0e1'; s2.fillRect(0, 0, w, hh);
  const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(st, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc); const t = tex(c);
  const geo = new THREE.PlaneGeometry(h * w / hh, h); geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.2 })); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); const grp = new THREE.Group(); grp.add(m); scene.add(grp); return grp;
}
const ownerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="1300" viewBox="0 0 560 1300"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#d9a074"/><stop offset="1" stop-color="#b98058"/></linearGradient></defs>
  <path d="M200 1240 L215 820 L275 820 L265 1240 Z M290 1240 L285 820 L345 820 L360 1240 Z" fill="#2a3448" stroke="#26160c" stroke-width="9"/>
  <path d="M180 1240 L270 1240 L270 1280 L170 1280 Z M290 1240 L380 1240 L390 1280 L290 1280 Z" fill="#1a1a1a" stroke="#26160c" stroke-width="8"/>
  <path d="M160 520 Q280 470 400 520 L380 860 L180 860 Z" fill="#ffd24a" stroke="#26160c" stroke-width="9"/>
  <path d="M170 530 Q120 640 150 760 L190 750 Q175 650 205 560 Z" fill="#ffd24a" stroke="#26160c" stroke-width="8"/><ellipse cx="168" cy="770" rx="30" ry="28" fill="url(#s)" stroke="#26160c" stroke-width="7"/>
  <path d="M390 530 Q480 600 470 690 L430 690 Q430 620 370 580 Z" fill="#ffd24a" stroke="#26160c" stroke-width="8"/><ellipse cx="452" cy="705" rx="30" ry="28" fill="url(#s)" stroke="#26160c" stroke-width="7"/>
  <rect x="430" y="600" width="70" height="90" rx="14" fill="#f4f4f4" stroke="#26160c" stroke-width="7"/><path d="M465 690 Q470 800 520 900" fill="none" stroke="#111" stroke-width="12"/><circle cx="465" cy="625" r="10" fill="#3ad06a"/>
  <rect x="255" y="440" width="50" height="60" fill="url(#s)" stroke="#26160c" stroke-width="7"/>
  <ellipse cx="280" cy="350" rx="104" ry="112" fill="url(#s)" stroke="#26160c" stroke-width="9"/><path d="M178 330 Q190 220 280 220 Q372 220 384 330 Q360 270 280 268 Q205 270 178 330 Z" fill="#1d1612"/>
  <circle cx="244" cy="350" r="11" fill="#2a1a0c"/><circle cx="318" cy="350" r="11" fill="#2a1a0c"/><path d="M226 322 Q244 312 262 322 M300 322 Q318 312 336 322" stroke="#1d1612" stroke-width="7" fill="none"/>
  <path d="M250 400 Q280 424 310 400" fill="none" stroke="#7a1e24" stroke-width="8" stroke-linecap="round"/><path d="M230 384 Q280 372 330 384" fill="none" stroke="#1d1612" stroke-width="10" stroke-linecap="round"/></svg>`;
const owner = await cutout(ownerSVG, { h: 1.72, res: 900 }); owner.position.set(2.75, 0, -1.55); owner.rotation.y = 0.73;
const cable = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.9, 0.95, -2.5), V(1.95, 0.2, -2.2), V(1.7, 0.15, -1.4), V(1.5, 0.5, -1.0), V(1.46, 0.84, -0.9)]), 40, 0.02, 6), mat(0x111111, 0.6), 0, 0, 0, scene, false);

// ================================================================ photos
const PH = { pack: await img('img/ev_pack.jpg'), cell: await img('img/cell.jpg') };
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ================================================================ timeline helpers
const FIRE = (t) => Math.max(1 - smooth(seg(t, 2.9, 3.7)), smooth(seg(t, 33.0, 35.6)) * (1 - smooth(seg(t, 36.1, 36.8))), smooth(seg(t, 51.4, 52.4)) * 0.6);
const XRAY = (t) => (t >= 5.58 && t < 8.76) ? smooth(seg(t, 5.7, 6.4)) : (t >= 28.58 && t < 42.04) ? 1 - smooth(seg(t, 41.4, 42.0)) : 0;
const LABT = (t) => t >= 8.76 && t < 28.58;
// per-cell heat in the pack (chain reaction from a corner, 29.2 -> 35.6), cooled again by the BMS story (36.1+)
const ORG = { x: 1.1, z: 0.5 };
function cellHeat(c, t) { const d = Math.hypot(c.x - ORG.x, c.z - ORG.z); const h = smooth(seg(t, 29.2 + d * 2.4, 29.9 + d * 2.4)); return h * (1 - smooth(seg(t, 36.1, 37.2))); }

// ================================================================ cameras
const GAR = { sky: false, e: 70, az: 2.4, sun: 1.3, ambI: 0.75, amb: '#c8d4e8', fog: 0.0, exposure: 1.05, dof: 0.5 };
const XRE = { ...GAR, sun: 0.9, ambI: 0.5, exposure: 0.95, dof: 0.35 };
const LABE = { sky: false, e: 55, az: 2.2, sun: 2.0, ambI: 0.6, amb: '#9ab0d8', fog: 0.0, exposure: 1.05, dof: 0.3 };
const l = (x, y, z) => V(LAB.x + x, y, LAB.z + z);
const KEYS = [
  [0, 0, V(6.9, 1.7, 6.3), V(0, 0.75, 0), 44, GAR], [0.05, 2.8, V(6.1, 1.5, 5.5), V(0, 0.7, 0), 44, GAR], [2.82, 5.5, V(5.6, 2.0, 5.0), V(0.1, 0.6, 0), 44, GAR],
  [5.58, 5.58, V(4.9, 5.4, 4.6), V(0, 0.3, 0), 42, XRE], [5.6, 8.7, V(4.2, 4.7, 3.9), V(0, 0.3, 0), 42, XRE],
  [8.76, 8.76, l(1.9, 2.4, 10.0), l(1.2, 1.6, 0), 40, LABE], [8.8, 14.6, l(1.5, 2.2, 8.8), l(1.3, 1.6, 0.2), 40, LABE],
  [14.68, 14.68, l(1.8, 2.5, 9.4), l(1.5, 1.6, 0), 40, LABE], [14.7, 19.2, l(1.6, 2.3, 8.8), l(1.5, 1.6, 0), 40, LABE],
  [19.28, 19.28, l(0.9, 2.3, 6.0), l(2.3, 1.6, 0.7), 40, LABE], [19.3, 23.6, l(1.2, 2.0, 5.1), l(2.3, 1.6, 0.7), 40, LABE],
  [23.72, 23.72, l(1.2, 2.6, 9.4), l(0.9, 1.7, 0), 40, LABE], [23.75, 28.5, l(0.9, 2.3, 8.2), l(0.8, 1.7, 0), 40, LABE],
  [28.58, 28.58, V(3.9, 4.3, 3.6), V(0.3, 0.3, 0.1), 42, XRE], [28.6, 35.9, V(4.7, 5.2, 4.4), V(0, 0.3, 0), 42, XRE],
  [36.12, 36.12, V(3.4, 2.5, 2.3), V(1.2, 0.35, 0), 42, XRE], [36.15, 41.9, V(4.0, 3.3, 3.2), V(0.8, 0.35, 0), 42, XRE],
  [42.04, 42.04, V(6.0, 1.7, 1.9), V(2.1, 0.9, -1.3), 54, GAR], [42.1, 49.4, V(5.6, 1.6, 1.6), V(2.1, 0.9, -1.3), 54, GAR],
  [49.58, 51.7, V(6.9, 1.7, 6.3), V(0, 0.75, 0), 44, GAR]];
const F = film({ total, keys: KEYS, exposure: 1.0, shutter: 0.3 / 30, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' },
  hits: [[21.58, 0.012], [28.22, 0.01], [34.66, 0.012]],
  titles: [[-1, 2.7, 'एक छोटा सेल…', 104, '#ffb21a', 300, 'और पूरी गाड़ी जल गई!'], [2.9, 5.4, 'लिथियम बैटरी ख़तरनाक क्यों?', 80, '#7fd8ff', 300],
    [6.9, 8.6, 'हज़ारों छोटे सेल', 104, '#5dff8a', 300], [12.4, 14.5, 'सेपरेटर', 120, '#ffffff', 300, 'बेहद पतली दीवार'], [20.0, 21.4, 'दीवार पिघली!', 110, '#ff9a4a', 300],
    [21.5, 23.6, 'शॉर्ट सर्किट!', 120, '#ff4a4a', 300], [27.8, 28.5, 'थर्मल रनअवे', 120, '#ff4a4a', 300], [34.5, 36.0, 'चेन-रिएक्शन!', 120, '#ff4a4a', 300],
    [37.2, 41.9, 'BMS', 160, '#5dff8a', 300, 'बैटरी का दिमाग़'], [42.1, 43.0, 'आप क्या करें?', 100, '#ffd24a', 300], [49.6, 999, 'छोटी सावधानी…', 100, '#ffd24a', 300, 'बड़ी आग से बचाती है!']],
  pills: [],
  labels: [[10.5, 14.5, '+ परत', l(2.3 - 0.32 * 0.94, 2.4, 0.7 - 0.32 * 0.34), -200, -260, '#ff6a5a'], [11.2, 14.5, '− परत', l(2.3 + 0.32 * 0.94, 2.3, 0.7 + 0.32 * 0.34), 190, -200, '#6aa0ff'],
    [36.6, 41.9, 'BMS', V(1.47, 0.32, 0), 120, -260, '#5dff8a']],
  overlay: (g, t, { txt, pill }) => {
    // causes (14.68-19.2)
    const C = [[15.74, 'चोट', '#ff9a4a'], [17.24, 'ज़्यादा चार्ज', '#ffd24a'], [18.3, 'ज़्यादा गरम', '#ff4a4a']];
    if (t >= 15.6 && t < 19.3) C.forEach(([a, s, col], i) => pill(s, 540, 380 + i * 110, col, seg(t, a, a + 0.25) * (1 - seg(t, 19.0, 19.3)), 56));
    // thermometer (23.7-28.5 lab, 29-35.9 pack)
    const temp = t < 28.58 ? (t >= 22.6 ? lerp(60, 600, smooth(seg(t, 23.0, 28.0))) : 0) : (t < 36.1 ? lerp(600, 750, seg(t, 29, 35)) : 0);
    if (temp > 0 && t < 36.1) { const a = seg(t, 22.6, 23.0) * (1 - seg(t, 35.8, 36.1)); txt(`${Math.round(temp)} °C`, 540, 1250, 120, temp > 300 ? '#ff4a4a' : '#ffb21a', a, 1, 12); }
    if (t >= 30.3 && t < 33.8) txt('फिर अगला… फिर अगला…', 540, 520, 60, '#ffb21a', seg(t, 32.2, 32.5) * (1 - seg(t, 33.5, 33.8)), 1, 9);
    // BMS dashboard (38.6-41.9)
    if (t >= 38.6 && t < 42.0) { const a = seg(t, 38.6, 39.0) * (1 - seg(t, 41.7, 42.0)); g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(6,18,12,0.85)'; g.strokeStyle = '#5dff8a'; g.lineWidth = 4; g.beginPath(); g.roundRect(160, 900, 760, 330, 28); g.fill(); g.stroke(); g.restore();
      [['हर सेल का तापमान', `${(31 + 2 * Math.sin(t * 2)).toFixed(0)} °C  ✓`], ['चार्ज', '80%  ✓'], ['गड़बड़ी हो तो', 'करंट बंद!']].forEach(([k2, v], i) => { txt(k2, 380, 975 + i * 95, 44, '#ffffff', a * seg(t, 39.0 + i * 0.6, 39.3 + i * 0.6), 1, 0); txt(v, 760, 975 + i * 95, 46, '#5dff8a', a * seg(t, 39.0 + i * 0.6, 39.3 + i * 0.6), 1, 0); }); }
    // tips (42.04-49.5)
    const tips = [[43.12, '✓ कंपनी का चार्जर', '#5dff8a'], [44.78, '✓ बैटरी को चोट से बचाओ', '#5dff8a'], [46.36, '✗ फूली या गरम बैटरी? चार्ज मत करो', '#ff5a4a']];
    if (t >= 43.0 && t < 49.5) tips.forEach(([a, s, col], i) => pill(s, 540, 1060 + i * 112, col, seg(t, a, a + 0.25) * (1 - seg(t, 49.2, 49.5)), 46));
    if (t >= 46.4 && t < 49.4) { const a = seg(t, 46.5, 46.8) * (1 - seg(t, 49.1, 49.4)), b = 0.5 + 0.5 * Math.sin(t * 5); g.save(); g.globalAlpha = a; g.translate(540, 700); g.lineWidth = 12; g.strokeStyle = '#ffffff'; g.fillStyle = '#ff7a1a';
      g.beginPath(); g.moveTo(-170, -70); g.quadraticCurveTo(0, -70 - 50 * b - 30, 170, -70); g.lineTo(170, 70); g.quadraticCurveTo(0, 70 + 50 * b + 30, -170, 70); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(170, -30, 30, 60);
      g.strokeStyle = '#ff2a2a'; g.lineWidth = 24; g.beginPath(); g.moveTo(-150, -150); g.lineTo(150, 150); g.moveTo(150, -150); g.lineTo(-150, 150); g.stroke(); g.restore(); txt('फूली बैटरी', 540, 880, 50, '#ffb21a', a, 1, 8); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(PH.pack, 6.3, 8.7, 540, 1150, 880, -0.02, 'असली EV बैटरी पैक (16 kWh, पुराना मॉडल)');
    card(PH.cell, 8.9, 10.3, 540, 1120, 620, 0.03, 'असली लिथियम-आयन सेल');
  } });
const { on } = F;

// ================================================================ animation
const col = new THREE.Color(), cool = new THREE.Color(0.1, 0.75, 1.1), warm = new THREE.Color(2.6, 1.2, 0.2), hot = new THREE.Color(3.2, 0.5, 0.15), ok = new THREE.Color(0.2, 1.6, 0.6);
on((t) => {
  // car x-ray
  const xr = XRAY(t); bodyM.opacity = 1 - 0.85 * xr; bodyM.depthWrite = xr < 0.01; glassM.opacity = 1 - 0.8 * xr; glassM.depthWrite = xr < 0.01; pillarM.opacity = 1 - 0.85 * xr;
  trayM.opacity = xr; modM.opacity = 0.5 * xr; hvM.opacity = xr; const bv = t >= 36.12 && t < 42.04 ? 1 : 0.35; bmsM.opacity = xr * bv; chipM.opacity = xr * bv;
  cellMesh.visible = xr > 0.01; const bmsOn = t >= 36.6 && t < 42.04;
  CELLS.forEach((c, i) => { const h = cellHeat(c, t); if (h < 0.5) col.copy(cool).lerp(warm, h * 2); else col.copy(warm).lerp(hot, (h - 0.5) * 2); if (bmsOn) col.lerp(ok, 0.35 + 0.25 * Math.sin(t * 4 + c.x * 6));
    col.multiplyScalar(xr); cellMesh.setColorAt(i, col); }); cellMesh.instanceColor.needsUpdate = true;
  wires.forEach((w) => (w.material.opacity = bmsOn ? xr : 0)); bmsLight.material.opacity = bmsOn ? (Math.sin(t * 10) > 0 ? 1 : 0.2) : 0; bmsM.emissiveIntensity = bmsOn ? 1.2 : 0.4;
  for (let j = 0; j < pulses.n; j++) { const k = (t * 0.7 + hash(j)) % 1, w = j % 6, zz = -0.55 + w * 0.22, p = bmsOn ? V(1.42, 0.31, (w - 2.5) * 0.06).lerp(V(-0.6 + 0.4 * (w % 3), 0.36, zz), k) : V(0, -99, 0); pulses.pos[j * 3] = p.x; pulses.pos[j * 3 + 1] = p.y; pulses.pos[j * 3 + 2] = p.z; } pulses.geo.attributes.position.needsUpdate = true;
  // fire under the car (hook, chain-reaction climax, loop tail)
  const fi = FIRE(t), fx = t > 30 && t < 40 ? ORG.x : 0;
  for (let i = 0; i < flames.n; i++) { const k = (t * (1.1 + 0.6 * hash(i)) + hash(i * 3)) % 1, on2 = hash(i * 7) < fi; const x0 = (fx ? fx - 0.6 : -1.3) + (fx ? 1.3 : 2.6) * hash(i * 11), z0 = (hash(i * 13) - 0.5) * 1.7;
    flames.pos[i * 3] = on2 ? x0 + 0.15 * Math.sin(t * 7 + i) : 0; flames.pos[i * 3 + 1] = on2 ? 0.2 + k * (0.9 + 1.0 * hash(i * 17)) : -99; flames.pos[i * 3 + 2] = on2 ? z0 * (1 - 0.4 * k) + (z0 > 0 ? 0.25 : -0.25) * k : 0; }
  flames.geo.attributes.position.needsUpdate = true; flames.p.material.size = 0.26; flames.p.material.opacity = 0.9;
  for (let i = 0; i < embers.n; i++) { const k = (t * 0.6 + hash(i * 5)) % 1, on2 = hash(i * 9) < fi; embers.pos[i * 3] = on2 ? (hash(i) - 0.5) * 3 + 0.4 * Math.sin(t + i) : 0; embers.pos[i * 3 + 1] = on2 ? 0.3 + k * 3 : -99; embers.pos[i * 3 + 2] = on2 ? (hash(i * 3) - 0.5) * 2.2 : 0; } embers.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < smoke.n; i++) { const k = (t * 0.25 + hash(i * 3)) % 1, on2 = hash(i * 7) < fi; smoke.pos[i * 3] = on2 ? (hash(i) - 0.5) * 2.4 - 0.6 * k : 0; smoke.pos[i * 3 + 1] = on2 ? 1.0 + k * 2.2 : -99; smoke.pos[i * 3 + 2] = on2 ? (hash(i * 5) - 0.5) * 2 : 0; } smoke.geo.attributes.position.needsUpdate = true;
  fireL.intensity = 14 * fi * (0.8 + 0.2 * Math.sin(t * 23) * Math.sin(t * 7)); fireL.visible = fi > 0.01;
  // owner + charger cable only in the tips beat
  const tp = t >= 42.04 && t < 49.58; owner.visible = tp; cable.visible = tp;
  // lab
  const lb = LABT(t); lab.visible = lb; labBg.visible = lb; heatL.visible = lb;
  roll.visible = true; const sx = smooth(seg(t, 9.6, 10.4)); sand.scale.setScalar(Math.max(0.001, sx)); sand.position.x = lerp(0.3, 2.3, sx);
  // ions shuttle across the separator (charging/discharging), stop once it melts
  const melt = smooth(seg(t, 20.0, 21.4));
  for (let i = 0; i < ions.n; i++) { const k = (t * 0.5 + hash(i)) % 1, dir = i % 2 ? 1 : -1, on2 = t > 10.6 && t < 21.4; ions.pos[i * 3] = on2 ? dir * lerp(-0.22, 0.22, k) : 0; ions.pos[i * 3 + 1] = on2 ? (hash(i * 3) - 0.5) * 1.8 : -99; ions.pos[i * 3 + 2] = (hash(i * 5) - 0.5) * 1.2; } ions.geo.attributes.position.needsUpdate = true;
  // separator melts: shrinks + holes (vertex sag), plates slide together
  const P = sep.geometry.attributes.position.array; for (let i = 0; i < P.length; i += 3) { const y0 = sepPos[i + 1], z0 = sepPos[i + 2], n = Math.sin(y0 * 7 + z0 * 5) * 0.5 + 0.5; P[i + 1] = y0 * (1 - 0.35 * melt * n) - 0.4 * melt * n; P[i + 2] = z0 * (1 - 0.3 * melt * n); P[i] = sepPos[i] * (1 - melt); }
  sep.geometry.attributes.position.needsUpdate = true; sepM.opacity = 0.85 * (1 - 0.6 * melt); const touch = smooth(seg(t, 21.0, 21.6)); cath.position.x = -0.32 + 0.2 * touch; ano.position.x = 0.32 - 0.2 * touch;
  for (let i = 0; i < sparks.n; i++) { const k = ((t - 21.5) * 2.2 + hash(i)) % 1, on2 = t > 21.5 && t < 28.6; sparks.pos[i * 3] = on2 ? (hash(i * 7) - 0.5) * 0.9 * k : 0; sparks.pos[i * 3 + 1] = on2 ? (hash(i * 3) - 0.5) * 1.6 + 0.9 * k - 1.2 * k * k : -99; sparks.pos[i * 3 + 2] = on2 ? 0.66 + 1.2 * k * hash(i * 9) : 0; } sparks.geo.attributes.position.needsUpdate = true;
  // heat: plates, roll and can glow (22.6 -> 28.5)
  const ht = smooth(seg(t, 18.3, 19.2)) * 0.25 + smooth(seg(t, 22.4, 28.2)) * 0.75;
  for (const m of [cathM, anoM, ...rollM]) m.emissive.setRGB(0.9 * ht, 0.25 * ht * ht, 0.03 * ht); anoM.emissive.multiplyScalar(0.35 + 0.65 * smooth(seg(t, 24, 27))); canM.emissive.setRGB(0.6 * ht * ht, 0.12 * ht * ht, 0);
  heatL.intensity = 16 * ht; labBg.material.uniforms.heat.value = ht * 0.8;
  for (let i = 0; i < labSmoke.n; i++) { const k = (t * 0.35 + hash(i * 3)) % 1, on2 = t > 25.0 && hash(i * 7) < smooth(seg(t, 25, 27)); labSmoke.pos[i * 3] = LAB.x + (hash(i) - 0.5) * 0.4 + 0.6 * k; labSmoke.pos[i * 3 + 1] = on2 ? 3.4 + 2.5 * k : -99; labSmoke.pos[i * 3 + 2] = (hash(i * 5) - 0.5) * 0.4; } labSmoke.geo.attributes.position.needsUpdate = true;
  // the nail (injury) 15.7-16.6
  const nk = easeOut(seg(t, 15.75, 16.15)) * (1 - smooth(seg(t, 18.9, 19.3))); nail.visible = t > 15.3 && t < 19.3; nail.position.x = lerp(4.3, 2.78, nk); nail.position.z = lerp(0.6, 0.85, nk);
  wheels.forEach((w) => (w.rotation.z = 0));
});
