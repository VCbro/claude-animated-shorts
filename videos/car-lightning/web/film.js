// Lightning hits a car: the Faraday-cage Short. Night storm, cinematic 3D realistic, 1080x1920. Pure function of time.
import { THREE, scene, camera, setSky, shot, onFrame, start, text, label, win, R, eio, lerp, clamp, rnd, K, bloom, W, H, ocean, grade, sunLight, hemi, renderer } from './engine3d.js';
const A = (n) => K[n], END = K.END;
setSky({ elevation: -3, azimuth: 200, turbidity: 12, rayleigh: 0.6, mie: 0.02, exposure: 0.55, sunCol: '#8fa6d8', sunInt: 0.25 });
ocean.visible = false;
scene.fog = new THREE.FogExp2('#0b1220', 0.012);
hemi.color.set('#7f95c8'); hemi.groundColor.set('#141820'); hemi.intensity = 0.9;
renderer.toneMappingExposure = 0.9;
sunLight.color.set('#9fb6ff'); sunLight.intensity = 1.8; sunLight.position.set(-20, 30, 18); sunLight.target.position.set(0, 0, 0);
const lamp = new THREE.SpotLight('#ffcf8f', 420, 30, 0.65, 0.5, 1.4); lamp.position.set(2.5, 8, 4); lamp.target.position.set(0, 0.6, 0); lamp.castShadow = true; scene.add(lamp); scene.add(lamp.target);
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 8, 10), new THREE.MeshStandardMaterial({ color: '#2a2d33', metalness: 0.6, roughness: 0.4 })); pole.position.set(2.5, 4, 5.2); scene.add(pole);
const flashL = new THREE.DirectionalLight('#cfe0ff', 0); flashL.position.set(-10, 40, 8); scene.add(flashL); scene.add(flashL.target);
const glowL = new THREE.PointLight('#9ec4ff', 0, 12, 2); scene.add(glowL);

// ------------------------------------------------------------------ world: wet road, verge, distant lights
const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 14), new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.12, metalness: 0.4 }));
road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
const lines = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.15), new THREE.MeshStandardMaterial({ color: '#d8d0b0', roughness: 0.4 })); lines.rotation.x = -Math.PI / 2; lines.position.set(0, 0.01, 2.2); scene.add(lines);
const verge = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ color: '#0d120e', roughness: 0.9 })); verge.rotation.x = -Math.PI / 2; verge.position.y = -0.02; scene.add(verge);
for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshBasicMaterial({ color: rnd(i) > 0.5 ? '#ffcf8a' : '#9fc0ff' })); l.position.set(-200 + rnd(i + 1) * 400, 0.5 + rnd(i + 2) * 6, -120 - rnd(i + 3) * 80); scene.add(l); }
for (let i = 0; i < 26; i++) { const tr = new THREE.Mesh(new THREE.ConeGeometry(2 + 2 * rnd(i), 10 + 8 * rnd(i + 4), 7), new THREE.MeshStandardMaterial({ color: '#05080a', roughness: 1 }));
  tr.position.set(-90 + i * 7 + 3 * rnd(i + 5), 6, -22 - 10 * rnd(i + 6)); scene.add(tr); }

// ------------------------------------------------------------------ the car (sedan, x = length, front at +x)
function carBody(soft) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: '#8a1018', metalness: 0.6, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
  const s = new THREE.Shape(); s.moveTo(-2.3, 0.35); s.lineTo(2.25, 0.35); s.quadraticCurveTo(2.45, 0.4, 2.4, 0.8); s.lineTo(2.2, 0.98); s.lineTo(0.9, 1.05); s.lineTo(-1.7, 1.05); s.lineTo(-2.25, 0.95); s.lineTo(-2.3, 0.35);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 4 }), paint);
  body.position.z = -0.85; body.castShadow = true; g.add(body);
  // greenhouse: pillars (paint) + glass, or a soft top
  const c = new THREE.Shape(); c.moveTo(-1.5, 1.05); c.lineTo(0.75, 1.05); c.lineTo(0.15, 1.55); c.lineTo(-1.15, 1.55); c.lineTo(-1.5, 1.05);
  const cabinG = new THREE.ExtrudeGeometry(c, { depth: 1.5, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 });
  const glass = new THREE.Mesh(cabinG, new THREE.MeshPhysicalMaterial({ color: '#0a1018', metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55 }));
  glass.position.z = -0.75; g.add(glass);
  const roofG = new THREE.BoxGeometry(1.32, 0.06, 1.52); const roof = new THREE.Mesh(roofG, soft ? new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.95 }) : paint);
  roof.position.set(-0.5, 1.58, 0); roof.castShadow = true; g.add(roof);
  for (const z of [-0.78, 0.78]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.06), paint); p.position.set(0.42, 1.3, z); p.rotation.z = 0.7; g.add(p);
    const q = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.06), paint); q.position.set(-1.32, 1.3, z); q.rotation.z = -0.55; g.add(q); }
  // wheels
  const tyreM = new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.7, metalness: 0.1 }), rimM = new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 1, roughness: 0.25 });
  const wheels = [];
  for (const x of [-1.45, 1.45]) for (const z of [-0.88, 0.88]) {
    const w = new THREE.Group(); const ty = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.11, 14, 32), tyreM); w.add(ty);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 24), rimM); rim.rotation.x = Math.PI / 2; w.add(rim);
    w.position.set(x, 0.41, z); g.add(w); wheels.push(w);
  }
  // lights
  for (const z of [-0.6, 0.6]) { const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.35), new THREE.MeshBasicMaterial({ color: '#fff6dc' })); hl.position.set(2.42, 0.72, z); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.35), new THREE.MeshBasicMaterial({ color: '#ff2a1a' })); tl.position.set(-2.38, 0.85, z); g.add(tl); }
  // the driver (calm silhouette)
  const drv = new THREE.Group(); const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.35, 6, 12), new THREE.MeshStandardMaterial({ color: '#15171b', roughness: 0.8 })); torso.position.y = 1.15; drv.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), torso.material); head.position.y = 1.5; drv.add(head); drv.position.set(-0.55, 0, -0.35); g.add(drv);
  const dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.2), new THREE.MeshBasicMaterial({ color: '#3fa8ff' })); dash.position.set(0.55, 1.05, 0); g.add(dash);
  const cabinL = new THREE.PointLight('#7fb8ff', 0.6, 2.0, 2); cabinL.position.set(0.2, 1.25, 0); g.add(cabinL);
  g.userData = { body, roof, glass, wheels, paint };
  return g;
}
const car = carBody(false); scene.add(car);
const soft = carBody(true); soft.position.set(0, 0, 0); scene.add(soft);
const headBeam = new THREE.SpotLight('#fff1d6', 120, 40, 0.5, 0.6, 1.5); headBeam.position.set(2.5, 0.75, 0); headBeam.target.position.set(20, 0, 0); car.add(headBeam); car.add(headBeam.target);

// x-ray shell for the Faraday-cage section
const xr = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'varying vec3 n; varying vec3 vd; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform float uA; varying vec3 n; varying vec3 vd; void main(){ float f = pow(1.-abs(dot(normalize(n),normalize(vd))),1.5); gl_FragColor = vec4(vec3(.75,.88,1.)*(.35+1.3*f), (.05+.8*f)*uA); }' });
const xbody = new THREE.Mesh(car.userData.body.geometry, xr); xbody.position.copy(car.userData.body.position); xbody.renderOrder = 6; car.add(xbody);
const safe = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 20), new THREE.MeshBasicMaterial({ color: '#4cff9a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
safe.scale.set(1.6, 0.75, 1.0); safe.position.set(-0.4, 1.25, 0); car.add(safe);

// current path over the metal shell: roof -> pillars -> sills -> wheels area -> ground
const PATHS = [[[-0.5, 1.62, 0], [0.35, 1.55, 0.7], [0.75, 1.1, 0.85], [1.6, 0.9, 0.9], [1.45, 0.2, 0.95], [1.6, 0.0, 1.1]],
  [[-0.5, 1.62, 0], [-1.2, 1.55, -0.7], [-1.5, 1.05, -0.85], [-1.6, 0.6, -0.92], [-1.45, 0.15, -0.95], [-1.6, 0.0, -1.1]],
  [[-0.5, 1.62, 0], [0.35, 1.55, -0.7], [0.75, 1.1, -0.85], [1.6, 0.9, -0.9], [1.45, 0.2, -0.95], [1.6, 0.0, -1.1]],
  [[-0.5, 1.62, 0], [-1.2, 1.55, 0.7], [-1.5, 1.05, 0.85], [-1.6, 0.6, 0.92], [-1.45, 0.15, 0.95], [-1.6, 0.0, 1.1]]].map((p) => new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v))));

// ------------------------------------------------------------------ lightning bolt (branching tubes, deterministic per seed)
function boltGeo(seed, from, to, branches = 4, r = 0.25) {
  const pts = [], n = 22;
  for (let i = 0; i <= n; i++) { const u = i / n; const j = Math.sin(u * Math.PI) * 1;
    pts.push(new THREE.Vector3(lerp(from.x, to.x, u) + (rnd(seed + i) - 0.5) * 9 * j, lerp(from.y, to.y, u), lerp(from.z, to.z, u) + (rnd(seed + i * 3) - 0.5) * 6 * j)); }
  const geos = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 120, r, 6)];
  for (let b = 0; b < branches; b++) { const k = 3 + Math.floor(rnd(seed + 40 + b) * 12), s = pts[k], bp = [s];
    for (let i = 1; i <= 6; i++) bp.push(new THREE.Vector3(s.x + (rnd(seed + b * 9 + i) - 0.5) * 6 * i, s.y - 4.5 * i, s.z + (rnd(seed + b * 7 + i) - 0.3) * 3 * i));
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 40, r * 0.45, 5)); }
  return geos;
}
const boltMat = new THREE.MeshBasicMaterial({ color: '#e8f1ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
const glowMat = new THREE.MeshBasicMaterial({ color: '#6fa8ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
function makeBolt(seed, from, to, br, r = 0.25) { const g = new THREE.Group(); boltGeo(seed, from, to, br, r).forEach((geo) => g.add(new THREE.Mesh(geo, boltMat))); boltGeo(seed, from, to, br, r * 4).forEach((geo) => g.add(new THREE.Mesh(geo, glowMat))); scene.add(g); return g; }
const boltCar = makeBolt(11, new THREE.Vector3(-14, 95, -8), new THREE.Vector3(-0.5, 1.65, 0), 5);
const boltSoft = makeBolt(77, new THREE.Vector3(10, 95, -6), new THREE.Vector3(-0.5, 1.62, 0), 4);
const tallMat = new THREE.MeshBasicMaterial({ color: '#e8f1ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
const boltTall = makeBolt(31, new THREE.Vector3(-60, 700, -40), new THREE.Vector3(-0.5, 1.65, 0), 7, 2.2);

// rain (line segments) + current sparks (points)
const NR = 2600, rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NR * 6), 3));
const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#a9bdd8', transparent: true, opacity: 0.35 })); rain.frustumCulled = false; scene.add(rain);
const NS = 500, sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3)); sg.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(NS), 1)); sg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(NS), 1));
const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: { uScale: { value: H / 2 / Math.tan(THREE.MathUtils.degToRad(20)) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'attribute float aS, aA; varying float va; uniform float uScale; void main(){ va = aA; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = min(120., aS*uScale/-mv.z); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'varying float va; void main(){ vec2 q = gl_PointCoord*2.-1.; float r = dot(q,q); if (r>1.) discard; gl_FragColor = vec4(vec3(.65,.85,1.)*1.6, exp(-r*3.)*va); }' }));
sparks.frustumCulled = false; scene.add(sparks);

// ------------------------------------------------------------------ timeline
const tStrike = A('strike'), tIn = A('inside'), tTy = A('tyres'), tWr = A('wrong'), tKm = A('km'), tBody = A('body'), tCur = A('current'), tOut = A('outer'), tGr = A('ground'), tTips = A('tips'), tWin = A('windows'), tRoof = A('roof'), tNext = A('next');
const STRIKES = [0.0, 0.09, 0.2, tIn + 0.9, tKm + 0.6, tKm + 0.75, tNext + 0.9, tNext + 1.0, tNext + 1.12, END - 0.02];
function flashAt(t) { let f = 0; for (const s of STRIKES) { const d = t - s; if (d >= 0 && d < 0.35) f = Math.max(f, Math.exp(-d * 14)); } return f; }
const big = (html, y, a, size = 104, col = '#fff') => text(`<span style="font-family:B;font-weight:800;color:${col};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45)">${html}</span>`, W / 2, y, { size, a, cls: '' });
const chip = (html, y, a, col = 'rgba(127,200,255,.55)') => text(`<span style="font-family:B;font-weight:800;padding:12px 30px 8px;border-radius:22px;background:rgba(4,10,20,.84);box-shadow:0 0 0 3px ${col}">${html}</span>`, W / 2, y, { size: 50, a, cls: '' });

onFrame((t) => {
  const f = flashAt(t);
  const softOn = t >= tRoof && t < END - 0.5;
  car.visible = !softOn; soft.visible = softOn;
  // bolts: hardtop strikes at the start / km / loop end, soft-top strike at "next"
  boltCar.visible = t < tTy || t > END - 0.5; boltSoft.visible = softOn; boltTall.visible = t >= tKm && t < tBody;
  boltMat.opacity = f; glowMat.opacity = 0.45 * f;
  if (boltTall.visible) { boltMat.opacity = Math.max(f, 0.55 + 0.3 * Math.sin(t * 40) * R(t, tKm + 0.4, 0.1)); glowMat.opacity = Math.max(0.45 * f, 0.3); }
  flashL.intensity = 9 * f; glowL.intensity = 40 * f; glowL.position.set(-0.5, 3, 0);
  grade.uniforms.uFlash.value = 0.55 * f;
  grade.uniforms.uAlarm.value = softOn && t > tNext + 0.85 ? 0.35 * R(t, tNext + 0.85, 0.2) : (softOn ? 0.12 * (0.5 + 0.5 * Math.sin(t * 7)) : 0);
  bloom.strength = 0.5 + 1.2 * f;
  // x-ray + current + safe zone
  const xa = win(t, tBody + 0.2, tTips + 0.4, 0.4);
  xr.uniforms.uA.value = xa; car.userData.paint.transparent = true; car.userData.paint.opacity = 1 - 0.85 * xa; car.userData.paint.depthWrite = xa < 0.5;
  safe.material.opacity = 0.22 * win(t, tCur + 0.6, tTips + 0.4, 0.4) * (0.8 + 0.2 * Math.sin(t * 5));
  const flowA = win(t, tCur, tTips + 0.2, 0.3);
  const pos = sg.attributes.position.array, sz = sg.attributes.aS.array, al = sg.attributes.aA.array, v = new THREE.Vector3();
  for (let i = 0; i < NS; i++) {
    if (i < 400) { const life = ((t * 0.9 + rnd(i)) % 1); PATHS[i % 4].getPoint(life, v); v.applyMatrix4(car.matrixWorld);
      pos[i * 3] = v.x + (rnd(i + 1) - 0.5) * 0.04; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; sz[i] = 0.06 + 0.06 * rnd(i + 2); al[i] = flowA * (0.6 + 0.4 * Math.sin(t * 30 + i)); }
    else { const e = ((t * 2 + rnd(i)) % 1), k = (i - 400) % 4, ex = [[1.6, 1.1], [-1.6, -1.1], [1.6, -1.1], [-1.6, 1.1]][k];        // ground sparks at the wheels
      pos[i * 3] = ex[0] + (rnd(i + 3) - 0.5) * e * 1.4; pos[i * 3 + 1] = 0.05 + e * 0.6 * rnd(i + 4); pos[i * 3 + 2] = ex[1] + (rnd(i + 5) - 0.5) * e * 1.4;
      sz[i] = 0.05 + 0.05 * rnd(i); al[i] = win(t, tGr - 0.2, tTips + 0.2, 0.2) * (1 - e); }
  }
  sg.attributes.position.needsUpdate = sg.attributes.aS.needsUpdate = sg.attributes.aA.needsUpdate = true;
  // rain around the camera
  const rp = rg.attributes.position.array, cp = camera.position;
  for (let i = 0; i < NR; i++) { const y = 30 - ((t * 22 + rnd(i) * 30) % 30), x = cp.x + (rnd(i + 1) - 0.5) * 40, z = cp.z - 2 - rnd(i + 2) * 36;
    rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = z; rp[i * 6 + 3] = x + 0.08; rp[i * 6 + 4] = y - 0.7; rp[i * 6 + 5] = z; }
  rg.attributes.position.needsUpdate = true;
  // windows roll up on "windows" (glass group slides) — shown by the tips chips; glass stays
  // shots (car centred at origin, front to +x)
  if (t < tIn || t > END - 0.5) shot(t, [[0, [6.5, 1.1, 7.5], [0, 2.2, 0], 44], [tIn, [6.2, 1.0, 7.0], [0, 2.4, 0], 44], [END - 0.5, [6.5, 1.1, 7.5], [0, 2.2, 0], 44]], 0.25 + 0.6 * f);
  else if (t < tTy) shot(t, [[tIn, [1.2, 1.9, 8.6], [-0.3, 1.05, 0], 36], [tTy, [0.8, 1.8, 7.6], [-0.3, 1.1, 0], 34]], 0.15);
  else if (t < tKm) shot(t, [[tTy, [3.6, 0.45, 3.6], [1.3, 0.5, 0.88], 40], [tKm, [3.2, 0.4, 3.2], [1.35, 0.5, 0.88], 38]], 0.12);
  else if (t < tBody) shot(t, [[tKm, [40, 3, 70], [0, 40, 0], 60], [tBody, [30, 4, 55], [0, 60, 0], 64]], 0.2 + 0.5 * f);
  else if (t < tTips) shot(t, [[tBody, [5.5, 3.2, 6.5], [0, 0.9, 0], 40], [tGr, [4.6, 2.2, 6.0], [0, 0.7, 0], 40], [tTips, [4.4, 2.0, 5.8], [0, 0.8, 0], 40]], 0.1);
  else if (t < tRoof) shot(t, [[tTips, [1.2, 1.9, 8.6], [-0.3, 1.05, 0], 36], [tRoof, [0.8, 1.8, 7.8], [-0.3, 1.1, 0], 34]], 0.12);
  else shot(t, [[tRoof, [4.5, 4.2, 6.0], [0, 1.0, 0], 42], [tNext + 0.8, [5.2, 3.0, 6.6], [0, 1.4, 0], 42], [END - 0.5, [6.0, 1.8, 7.2], [0, 2.0, 0], 44]], 0.15 + 0.6 * f);

  // overlays (screen text never repeats the narration word for word)
  big('अंदर वाला ज़िंदा?', 300, Math.max(1 - R(t, tIn - 0.15, 0.2), R(t, END - 0.45, 0.15)), 112, '#ffe066');
  chip('<span style="color:#6dff9e">✓</span> एक खरोंच नहीं', 1180, win(t, tIn + 0.4, tTy, 0.25));
  big('टायर?', 300, win(t, tTy + 0.2, tKm, 0.25), 130);
  big('<span style="color:#ff5a45">✕</span> रबर ढाल नहीं', 470, win(t, tWr, tKm, 0.2), 84);
  chip('बादल → ज़मीन: <span style="color:#ffe066">कई किलोमीटर</span>', 300, win(t, tKm + 0.9, tBody, 0.3));
  big('धातु की बॉडी', 300, win(t, tBody + 0.2, tCur, 0.25), 104, '#9fd0ff');
  label('करंट बाहर-बाहर', new THREE.Vector3(0.4, 1.55, 0.7), 150, -220, win(t, tOut, tTips, 0.3), 'Faraday cage');
  chip('<span style="color:#6dff9e">●</span> अंदर सुरक्षित', 300, win(t, tCur + 0.8, tOut + 0.3, 0.3));
  chip('<span style="color:#ffe066">⚡</span> ज़मीन में', 300, win(t, tGr, tTips, 0.3));
  chip('1 · कार के अंदर रहें', 300, win(t, tTips + 0.3, tRoof, 0.25));
  chip('2 · खिड़की बंद', 410, win(t, tWin, tRoof, 0.25));
  chip('3 · धातु न छुएँ', 520, win(t, tWin + 1.0, tRoof, 0.25));
  big('कपड़े की छत?', 300, win(t, tRoof + 0.2, tNext + 0.8, 0.25), 104, '#ff8a6b');
  big('<span style="color:#ff5a45">ख़तरा!</span>', 300, win(t, tNext + 0.85, END - 0.5, 0.15), 150);
});
start();
