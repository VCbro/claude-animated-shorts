// पनडुब्बी कैसे डूबती और ऊपर आती है? — KAISECHALTAHAI3D #3. 1 unit = 1 m. A Scorpène-like boat (66 m), bow towards +x.
// X-ray beats show the ballast tanks (bow + stern), the HP-air bottles and the steel pressure hull.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.6;
sun.visible = false; sun.castShadow = false; renderer.localClippingEnabled = true;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const bubTex = (() => { const c = cv(64, 64), g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(32, 32, 22, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(24, 22, 5, 0, TAU); g.fill(); return new THREE.CanvasTexture(c); })();

// ================================================================ light + water
const key = new THREE.DirectionalLight(0xd8f0ff, 2.0); key.position.set(30, 200, 60); scene.add(key, key.target);
const surfU = { t: { value: 0 } };
const surface = add(new THREE.PlaneGeometry(3000, 3000, 1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: surfU, side: THREE.DoubleSide, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }',
  fragmentShader: `uniform float t; varying vec3 vP;
    float w(vec2 p){ return sin(p.x*0.21 + t*1.3) + sin(p.y*0.17 - t*1.1) + 0.6*sin((p.x+p.y)*0.37 + t*2.1) + 0.4*sin((p.x-p.y)*0.63 - t*1.7); }
    void main(){ float d = distance(cameraPosition.xz, vP.xz); float h = w(vP.xz);
      if (cameraPosition.y < 0.0) { vec3 c = mix(vec3(0.25,0.75,0.85), vec3(0.9,1.1,1.1), smoothstep(0.6, 2.2, h)); c *= exp(-d*0.004); gl_FragColor = vec4(c*1.3, 1.0); }
      else { vec3 c = mix(vec3(0.02,0.12,0.2), vec3(0.08,0.3,0.42), 0.5+0.12*h); c += vec3(1.4,1.3,1.1) * pow(max(0.0, h-1.6), 3.0) * 0.4; c = mix(c, vec3(0.55,0.7,0.85), smoothstep(200.0, 1400.0, d)); gl_FragColor = vec4(c, 1.0); } }` }), 0, 0, 0, scene, false);
const rays = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(6 + 8 * hash(i), 140), new THREE.MeshBasicMaterial({ color: HDR(0.25, 0.5, 0.55), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }));
  m.position.set((hash(i * 3) - 0.5) * 160, -70, (hash(i * 7) - 0.5) * 120); m.rotation.set(0, hash(i) * 3, 0.25 * (hash(i * 5) - 0.5)); scene.add(m); return m; });
const snow = particles(900, new THREE.Color(0.75, 0.85, 0.9), 0.08, { additive: false, opacity: 0.7 }); snow.p.material.map = dotTex; snow.p.material.transparent = true;

// ================================================================ the submarine
const SUB = new THREE.Group(); scene.add(SUB);
const L = 66, R = 3.1;
const hullPts = []; for (let i = 0; i <= 80; i++) { const u = i / 80, x = -L / 2 + u * L; let r = R;
  if (u > 0.88) r = R * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.88) / 0.12, 2))) + 0.01;
  if (u < 0.22) r = R * (0.25 + 0.75 * Math.pow(u / 0.22, 0.6)); hullPts.push(new THREE.Vector2(r, x)); }
const hullGeo = new THREE.LatheGeometry(hullPts, 64); hullGeo.rotateZ(-Math.PI / 2);
const hullMat = new THREE.MeshStandardMaterial({ color: 0x2c333c, roughness: 0.8, metalness: 0.15, envMap: ENV, envMapIntensity: 0.25 });
const xrayMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { a: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float a; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.0); gl_FragColor = vec4(vec3(0.3, 0.8, 1.4) * (0.05 + f * 0.8) * a, 1.0); }' });
const hull = new THREE.Mesh(hullGeo, hullMat); hull.castShadow = true; SUB.add(hull);
const hullX = new THREE.Mesh(hullGeo, xrayMat); SUB.add(hullX);
// sail with masts, cruciform stern, bow planes, propeller
const sailShape = new THREE.Shape(); sailShape.moveTo(-5, -1.4); sailShape.lineTo(4, -1.4); sailShape.absarc(4, 0, 1.4, -Math.PI / 2, Math.PI / 2, false); sailShape.lineTo(-5, 1.4); sailShape.absarc(-5, 0, 1.4, Math.PI / 2, Math.PI * 1.5, false);
const sailG = new THREE.ExtrudeGeometry(sailShape, { depth: 5.5, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 3 }); sailG.rotateX(-Math.PI / 2);
const sail = new THREE.Mesh(sailG, hullMat); sail.position.set(10, R - 0.4, 0); SUB.add(sail);
for (const [x, h] of [[11, 3.2], [9.5, 2.4], [8, 1.6]]) add(new THREE.CylinderGeometry(0.18, 0.22, h, 10), hullMat, x, R + 5.4 + h / 2, 0, SUB);
const finShape = (len, h) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len * 0.7, h); s.lineTo(len * 0.1, h); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.1 }); };
const stern = []; for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(finShape(5, 3.2), hullMat); const g = new THREE.Group(); g.add(f); f.position.set(-2.5, R * 0.42, -0.17); g.rotation.x = k * Math.PI / 2; g.position.x = -L / 2 + 5; SUB.add(g); stern.push(g); }
const bowPlanes = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(22, 0.3, s * R); SUB.add(g); const f = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 2.6), hullMat); f.position.z = s * 1.3; g.add(f); return g; });
const prop = new THREE.Group(); prop.position.set(-L / 2 - 0.4, 0, 0); SUB.add(prop);
for (let b = 0; b < 7; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.9, 0.7), new THREE.MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.9, roughness: 0.3, envMap: ENV })); bl.position.y = 1.0; bl.rotation.x = 0.5;
  const g = new THREE.Group(); g.rotation.x = b / 7 * TAU; g.add(bl); prop.add(g); }
add(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb08a4a, metalness: 0.9, roughness: 0.3, envMap: ENV }), 0, 0, 0, prop);
// insides for the x-ray: pressure hull with steel frames, ballast tanks (bow + stern), HP-air bottles
const inside = new THREE.Group(); SUB.add(inside);
const steel = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, metalness: 0.8, roughness: 0.35, emissive: 0x203040, emissiveIntensity: 0.6 });
const frames = []; for (let x = -20; x <= 20; x += 2.2) { const f = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.09, 6, 40), steel); f.rotation.y = Math.PI / 2; f.position.x = x; inside.add(f); frames.push(f); }
const phull = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 40, 40, 1, true).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6a8098, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
inside.add(phull);
const TANKS = [{ x: 25.5, len: 8, r: 2.5 }, { x: -24.5, len: 7, r: 2.4 }].map((tk) => {
  const shell = new THREE.Mesh(new THREE.CapsuleGeometry(tk.r, tk.len, 8, 24).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8ab8ff, transparent: true, opacity: 0.18, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide, emissive: 0x2a5a9a, emissiveIntensity: 0.4 }));
  shell.position.x = tk.x; inside.add(shell);
  const plane = new THREE.Plane(V(0, -1, 0), 0);
  const water = new THREE.Mesh(new THREE.CapsuleGeometry(tk.r * 0.96, tk.len, 8, 24).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1a8ad8, transparent: true, opacity: 0.85, roughness: 0.1, emissive: 0x0a4a8a, emissiveIntensity: 0.8, clippingPlanes: [plane] }));
  water.position.x = tk.x; inside.add(water); return { ...tk, shell, water, plane };
});
const bottles = []; for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 2.2, 6, 14).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2ad06a, emissive: 0x0a6030, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.4 }));
  b.position.set(2 + (k % 3) * 2.6, -1.5 + Math.floor(k / 3) * 0.75, 0.6 - Math.floor(k / 3) * 1.2); inside.add(b); bottles.push(b); }
const pipeMat = new THREE.MeshBasicMaterial({ color: HDR(0.4, 2.2, 1.0), transparent: true, opacity: 0 });
for (const tx of [25.5, -24.5]) { const c = new THREE.CatmullRomCurve3([V(5, -1.1, 0.2), V(tx * 0.5, 1.8, 0.2), V(tx - Math.sign(tx) * 3, 1.6, 0.2)]); inside.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.12, 6), pipeMat)); }
// bubbles: vents (top, when flooding) and flood holes (bottom, when blowing) + hook emergency blow
const bub = particles(700, new THREE.Color(0.85, 0.95, 1.0), 0.55, { additive: false, opacity: 0.85 }); bub.p.material.map = bubTex; bub.p.material.transparent = true;
const spray = particles(500, new THREE.Color(0.95, 0.97, 1.0), 1.2, { additive: false, opacity: 0.9 }); spray.p.material.map = dotTex; spray.p.material.transparent = true;
// pressure arrows around the hull
const arrowG = new THREE.ConeGeometry(0.5, 1.6, 10); arrowG.translate(0, -0.8, 0);
const arrows = new THREE.InstancedMesh(arrowG, new THREE.MeshBasicMaterial({ color: HDR(2.2, 0.5, 0.3) }), 48); arrows.frustumCulled = false; scene.add(arrows);

// ================================================================ the boat's path through the story
const st = { p: V(0, 0, 0), pitch: 0, fill: 0, blowing: 0, flooding: 0, xray: 0, frames: 0, depthShown: 0 };
function boat(t) {
  let y = -300, pitch = 0, x = 0, fill = 0.25, blowing = 0, flooding = 0, xr = 0, fr = 0, dShown = 300;
  if (t < 2.02) { y = -300; fill = 1; }
  else if (t < 2.72) { const k = seg(t, 2.02, 2.72); y = lerp(-60, -4, easeIn2(k)); pitch = 0.5; fill = 1 - k; blowing = 1; dShown = lerp(300, 0, k); }
  else if (t < 3.5) { const k = seg(t, 2.72, 3.5); y = lerp(-4, 4.5, Math.sin(k * Math.PI)) - 1.5 * k; pitch = lerp(0.5, 0, k); fill = 0; blowing = 1 - k; dShown = 0; }
  else if (t < 8.26) { y = -1.6 + 0.25 * Math.sin(t * 1.4); fill = 0; dShown = 0; if (t > 6.46) y = -1.6; }
  else if (t < 12.72) { y = -30; fill = 0; xr = smooth(seg(t, 8.3, 8.9)); dShown = 30; }
  else if (t < 17.9) { const f = smooth(seg(t, 13.98, 15.6)); fill = f; flooding = t > 13.9 && t < 15.8 ? 1 : 0; y = -30 - 46 * easeInOut(seg(t, 15.9, 17.6)); xr = 1; dShown = -y; }
  else if (t < 24.6) { blowing = t > 19.2 && t < 22.3 ? 1 : 0; fill = 1 - smooth(seg(t, 19.6, 22.3)); y = -76 + 36 * easeInOut(seg(t, 22.6, 24.4)); xr = 1; dShown = -y; }
  else if (t < 30.9) { y = -40 + 0.4 * Math.sin(t * 0.8); fill = 0.5; xr = 1 - smooth(seg(t, 30.3, 30.9)); dShown = 40; }
  else if (t < 35.4) { const k = seg(t, 33.1, 34.8); pitch = -0.32 * Math.sin(k * Math.PI * 0.5) * (1 - 0.3 * k); y = -40 - 16 * easeInOut(seg(t, 33.1, 35.4)); x = 30 * seg(t, 33.1, 35.4); fill = 0.55; dShown = -y; }
  else if (t < 46.2) { const k = seg(t, 35.5, 42.4); y = lerp(-60, -300, easeInOut(k)); pitch = -0.08 * Math.sin(k * Math.PI); fill = 0.6; dShown = lerp(60, 300, k); xr = smooth(seg(t, 43.6, 44.0)); fr = smooth(seg(t, 43.62, 44.4)); }
  else { y = -300 + 3 * Math.sin((t - 46.2) * 0.4); fill = 1; dShown = 300; x = (t - 46.2) * 4; if (t > 51.3) x = lerp((51.3 - 46.2) * 4, 0, smooth(seg(t, 51.3, 52.6))); }
  st.p.set(x, y, 0); st.pitch = pitch; st.fill = fill; st.blowing = blowing; st.flooding = flooding; st.xray = xr; st.frames = fr; st.depthShown = dShown; return st;
}
function easeIn2(k) { return k * k; }

// ================================================================ HD photo + cartoon sailor (overlay, full resolution)
const KAL = await img('img/kalvari.jpg');
const sailorSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#e2ad82"/><stop offset="1" stop-color="#c78e62"/></linearGradient></defs>
  <circle cx="300" cy="300" r="290" fill="#0d2238" stroke="#ffd24a" stroke-width="12"/>
  <path d="M120 600 Q120 420 300 400 Q480 420 480 600 Z" fill="#f4f6f8" stroke="#26160c" stroke-width="8"/><path d="M250 402 L300 470 L350 402" fill="#1c2a4a"/>
  <ellipse cx="300" cy="270" rx="100" ry="115" fill="url(#s)" stroke="#26160c" stroke-width="8"/>
  <path d="M180 200 Q300 120 420 200 L430 222 L170 222 Z" fill="#fff" stroke="#26160c" stroke-width="8"/><rect x="170" y="214" width="260" height="22" rx="10" fill="#111"/><circle cx="300" cy="180" r="14" fill="#e8b23a" stroke="#26160c" stroke-width="5"/>
  <ellipse cx="262" cy="282" rx="18" ry="15" fill="#fff" stroke="#26160c" stroke-width="5"/><ellipse cx="338" cy="282" rx="18" ry="15" fill="#fff" stroke="#26160c" stroke-width="5"/><circle cx="264" cy="284" r="8" fill="#2a1a0c"/><circle cx="336" cy="284" r="8" fill="#2a1a0c"/>
  <path d="M258 250 Q262 240 280 248 M320 248 Q338 240 342 250" stroke="#26160c" stroke-width="7" fill="none"/><path d="M272 335 Q300 352 328 335" fill="none" stroke="#7a1e24" stroke-width="8" stroke-linecap="round"/>
  <rect x="380" y="440" width="150" height="90" rx="14" fill="#333a44" stroke="#26160c" stroke-width="6"/><circle cx="455" cy="485" r="30" fill="#e8282c" stroke="#26160c" stroke-width="6"/>
  <path d="M470 380 Q520 400 500 470 L470 470 Q470 430 440 420 Z" fill="url(#s)" stroke="#26160c" stroke-width="6"/><text x="455" y="550" font-size="26" font-weight="800" text-anchor="middle" fill="#ffd24a" font-family="sans-serif">BLOW</text></svg>`;
const SAILOR = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sailorSVG));
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 30px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ---------------------------------------------------------------- environments (eyes are set by onCam)
const DEEP = { sky: false, sun: 0, ambI: 0.6, amb: '#3a6a9a', fog: 0.0075, fogCol: '#051a30', exposure: 1.0, dof: 0.2 };
const MID = { ...DEEP, ambI: 0.65, amb: '#4a8ab0', fog: 0.0065, fogCol: '#0b3a55' };
const SHAL = { ...DEEP, ambI: 0.7, amb: '#6ab0c8', fog: 0.0055, fogCol: '#176478' };
const AIR = { sky: true, e: 24, az: 2.2, sun: 2.4, ambI: 0.6, fog: 0.0012, exposure: 1.0, dof: 0.2 };
const z0 = V(0, 0, 0);
const KEYS = [[0, 0, z0, V(0, 0, -1), 38, DEEP], [2.02, 2.02, z0, V(0, 0, -1), 40, SHAL], [2.72, 2.72, z0, V(0, 0, -1), 40, AIR], [6.46, 6.46, z0, V(0, 0, -1), 40, SHAL],
  [8.26, 8.26, z0, V(0, 0, -1), 38, SHAL], [12.72, 12.72, z0, V(0, 0, -1), 38, MID], [24.76, 24.76, z0, V(0, 0, -1), 38, MID], [35.5, 35.5, z0, V(0, 0, -1), 40, MID], [39.4, 39.4, z0, V(0, 0, -1), 38, DEEP],
  [46.2, 46.2, z0, V(0, 0, -1), 38, DEEP]];
const F = film({ total, keys: KEYS, exposure: 1.0, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' }, hits: [[2.02, 0.015], [2.72, 0.02], [16.06, 0.01], [23.88, 0.01], [42.14, 0.015]],
  titles: [[-1, 1.95, '300 मीटर नीचे… एक बटन!', 88, '#ffd24a', 300, 'पनडुब्बी कैसे डूबती और ऊपर आती है?'], [3.6, 7.6, 'लोहा… फिर भी तैरता?', 92, '#ffffff', 300],
    [8.76, 12.6, 'बैलास्ट टैंक', 120, '#7fd8ff', 300], [16.06, 17.8, 'भारी → नीचे', 110, '#7fd8ff', 300], [22.74, 24.6, 'हल्की → ऊपर', 110, '#5dff8a', 300],
    [27.6, 30.6, 'संतुलन', 120, '#ffd24a', 300], [40.08, 43.5, '30 गुना दबाव!', 120, '#ff6a4a', 300, '300 मीटर पर'], [44.88, 46.1, 'मज़बूत स्टील', 110, '#9fd0ff', 300],
    [51.6, 999, '300 मीटर नीचे… एक बटन!', 88, '#ffd24a', 300, 'पनडुब्बी कैसे डूबती और ऊपर आती है?']],
  pills: [[13.6, 15.9, 'पानी अंदर • हवा बाहर (ऊपर के वाल्व)', 1300, '#7fd8ff'], [19.2, 22.3, 'दबी हुई हवा अंदर • पानी बाहर', 1300, '#5dff8a'], [31.6, 34.8, 'आगे के पंख (हाइड्रोप्लेन)', 1300, '#ffd24a'],
    [37.0, 39.2, 'हर 10 m = +1 गुना दबाव', 1300, '#ff9a6a']],
  overlay: (g, t, { txt, pill }) => {
    const b = boat(t);
    // depth gauge (right side)
    const showG = t < 2.72 || (t >= 12.72 && t < 24.6) || (t >= 35.5 && t < 46.2) || t >= 51.3;
    if (showG) { const x = 990, y0 = 430, h = 420, d = b.depthShown; g.save(); g.globalAlpha = 0.92; g.fillStyle = 'rgba(5,15,30,0.7)'; g.beginPath(); g.roundRect(x - 34, y0 - 20, 68, h + 40, 34); g.fill();
      const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#4ad0ff'); gr.addColorStop(1, '#0a2a6a'); g.fillStyle = gr; g.fillRect(x - 10, y0, 20, h);
      const yy = y0 + h * clamp(d / 320); g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(x - 30, yy); g.lineTo(x - 50, yy - 14); g.lineTo(x - 50, yy + 14); g.fill(); g.restore();
      txt(`${Math.round(d)} m`, x - 120, yy, 48, '#ffffff', 1, 1, 8); }
    // weight vs buoyancy
    if ((t >= 15.6 && t < 17.9) || (t >= 22.4 && t < 24.6) || (t >= 26.4 && t < 30.6)) { const wgt = t < 17.9 ? 1.35 : t < 24.6 ? 0.7 : 1, buoy = t < 17.9 ? 0.7 : t < 24.6 ? 1.35 : 1, a = 1;
      const arr = (x, dir, s, col, lab) => { g.save(); g.fillStyle = col; g.translate(x, 1180); g.scale(1, dir); g.fillRect(-14, 0, 28, 120 * s); g.beginPath(); g.moveTo(-40, 120 * s); g.lineTo(40, 120 * s); g.lineTo(0, 120 * s + 50); g.fill(); g.restore();
        txt(lab, x, 1180 + dir * (120 * s + 90), 40, col, a, 1, 8); };
      arr(400, 1, wgt, '#ff7a5a', 'वज़न'); arr(680, -1, buoy, '#5dd8ff', 'उछाल'); }
    // the sailor presses BLOW
    if (t >= 0.9 && t < 2.6 && SAILOR) { const k = backOut(seg(t, 0.9, 1.2), 1.6) * (1 - seg(t, 2.4, 2.6)); g.save(); g.translate(790, 1150); g.scale(0.5 * k, 0.5 * k); g.drawImage(SAILOR, -300, -300); g.restore();
      if (t > 1.76 && t < 2.3) txt('दबाओ!', 790, 1360, 46, '#ffd24a', 1, 1, 8); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(KAL, 47.5, 51.2, 540, 1080, 820, -0.03, 'कलवरी-क्लास पनडुब्बी • भारतीय नौसेना (असली)');
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
on((t) => {
  const b = boat(t); SUB.position.copy(b.p); SUB.rotation.set(0, 0, b.pitch);
  prop.rotation.x = t * 6; surfU.t.value = t;
  xrayMat.uniforms.a.value = b.xray; hull.material.transparent = b.xray > 0.01; hull.material.opacity = 1 - 0.88 * b.xray; hull.material.depthWrite = b.xray < 0.5;
  sail.material = hull.material; inside.visible = b.xray > 0.01;
  frames.forEach((f, i) => { f.material.emissiveIntensity = 0.6 + 2.2 * b.frames * (0.5 + 0.5 * Math.sin(t * 6 - i * 0.5)); });
  // tank water levels (world-space clipping planes)
  for (const tk of TANKS) { const c = tk.water.getWorldPosition(V(0, 0, 0)), lvl = c.y - tk.r + 2 * tk.r * b.fill; tk.plane.normal.set(0, -1, 0); tk.plane.constant = lvl; tk.shell.material.emissiveIntensity = 0.4 + 0.8 * (t > 8.76 && t < 12.6 ? 0.5 + 0.5 * Math.sin(t * 6) : 0); }
  bottles.forEach((bt) => (bt.material.emissiveIntensity = 0.5 + 2.5 * b.blowing)); pipeMat.opacity = b.blowing * (0.6 + 0.4 * Math.sin(t * 12));
  bowPlanes.forEach((p) => (p.rotation.z = t >= 31.6 && t < 35.2 ? -0.45 * Math.sin(seg(t, 31.8, 34.8) * Math.PI) : 0));
  stern.forEach((s, i) => (s.children[0].rotation.y = 0));
  // bubbles from vents (flooding), flood holes (blowing), emergency blow (hook)
  for (let i = 0; i < bub.n; i++) { let x = 0, y = -999, z = 0; const tk = TANKS[i % 2], k = (t * 0.8 + hash(i)) % 1;
    const local = (lx, ly, lz) => V(lx, ly, lz).applyEuler(SUB.rotation).add(SUB.position);
    if (b.flooding > 0 || (t >= 2.02 && t < 3.0) || b.blowing > 0) { const fromTop = b.flooding > 0; const p = local(tk.x + (hash(i * 3) - 0.5) * tk.len, fromTop ? tk.r + 0.4 : -tk.r - 0.3, (hash(i * 5) - 0.5) * 2);
      x = p.x + (hash(i * 7) - 0.5) * 3 * k; y = p.y + (fromTop ? 1 : (t < 3 ? 1 : -0.4)) * 14 * k + (fromTop ? 0 : 6 * k * k); z = p.z + (hash(i * 9) - 0.5) * 3 * k; }
    bub.pos[i * 3] = x; bub.pos[i * 3 + 1] = y; bub.pos[i * 3 + 2] = z; }
  bub.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < spray.n; i++) { let y = -999, x = 0, z = 0; if (t >= 2.72 && t < 4.4) { const k = seg(t, 2.72, 4.4), a = hash(i) * TAU, v = 6 + 18 * hash(i * 3), up = 10 + 20 * hash(i * 5);
      x = 26 + Math.cos(a) * v * k; z = Math.sin(a) * v * k; y = up * k - 22 * k * k; if (y < 0) y = -999; } spray.pos[i * 3] = x; spray.pos[i * 3 + 1] = y; spray.pos[i * 3 + 2] = z; }
  spray.geo.attributes.position.needsUpdate = true;
  // pressure arrows grow with depth
  const pa = t >= 36.8 && t < 46.2 ? smooth(seg(t, 36.8, 42.4)) : 0; arrows.visible = pa > 0.01;
  for (let i = 0; i < 48; i++) { const ring = i % 8, row = Math.floor(i / 8), a = ring / 8 * TAU, xx = -22 + row * 9, r = R + 1.5 + 2.2 * pa;
    const p = V(xx, Math.cos(a) * (R + 1.0 + 0.8 * pa), Math.sin(a) * (R + 1.0 + 0.8 * pa)).applyEuler(SUB.rotation).add(SUB.position); _q.setFromUnitVectors(V(0, -1, 0), V(0, -Math.cos(a), -Math.sin(a)).applyEuler(SUB.rotation));
    _m.compose(p, _q, V(1, 1, 1).multiplyScalar(0.25 + 0.55 * pa)); arrows.setMatrixAt(i, _m); } arrows.instanceMatrix.needsUpdate = true;
  rays.forEach((r) => (r.visible = b.p.y > -80 && t >= 3.5));
});
// cameras follow the boat
onCam((t, cam) => {
  const b = boat(t), P = b.p.clone();
  const set = (off, look) => { cam.position.copy(P).add(off); cam.lookAt(P.clone().add(look)); cam.updateMatrixWorld(); };
  if (t < 2.02) set(V(74 - 5 * t, 13, 46), V(2, 0, 0));
  else if (t < 2.72) set(V(58, -22, 62), V(10, 8, 0));
  else if (t < 3.5) { cam.position.set(95, 6, 72); cam.lookAt(16, 5, 0); cam.updateMatrixWorld(); }
  else if (t < 6.46) { const k = seg(t, 3.5, 6.46); cam.position.set(88 - 12 * k, 13 + 4 * k, 86 - 10 * k); cam.lookAt(4, 1, 0); cam.updateMatrixWorld(); }
  else if (t < 8.26) { cam.position.set(46, -46, 58); cam.lookAt(0, -3, 0); cam.updateMatrixWorld(); }
  else if (t < 12.72) { const k = seg(t, 8.26, 12.72); set(V(lerp(70, 62, k), 12, lerp(44, 40, k)), V(lerp(4, -2, k), -1, 0)); }
  else if (t < 17.9) { const k = seg(t, 12.72, 17.9); set(V(64 - 6 * k, 14, 46), V(2, 0, 0)); }
  else if (t < 24.6) set(V(-64, 12, 46), V(-2, 0, 0));
  else if (t < 30.9) { const k = seg(t, 24.76, 30.9); set(V(Math.cos(0.6 + k * 1.1) * 80, 10, Math.sin(0.6 + k * 1.1) * 80), V(0, 0, 0)); }
  else if (t < 35.4) { set(V(38, 5, 24), V(21, 0, 3)); }
  else if (t < 43.6) { const k = seg(t, 35.5, 43.6); set(V(70 - 14 * k, 16 - 8 * k, 48 - 10 * k), V(0, 0, 0)); }
  else if (t < 46.2) set(V(34, 7, 20), V(-4, 0, 0));
  else { const k = smooth(seg(t, 51.3, 52.6)); set(V(lerp(62, 74, k), lerp(11, 13, k), lerp(42, 46, k)), V(lerp(0, 2, k), 0, 0)); }
  // marine snow around the camera
  for (let i = 0; i < snow.n; i++) { const c = cam.position, s = 40; snow.pos[i * 3] = c.x + ((hash(i) * s + t * 0.3) % s) - s / 2; snow.pos[i * 3 + 1] = c.y + ((hash(i * 3) * s - t * 0.6) % s + s) % s - s / 2; snow.pos[i * 3 + 2] = c.z + ((hash(i * 7) * s) % s) - s / 2;
    if (c.y > 0) snow.pos[i * 3 + 1] = -999; } snow.geo.attributes.position.needsUpdate = true;
});
