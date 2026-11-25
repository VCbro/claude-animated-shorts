// Pressure cooker Short: cinematic 3D, 1080x1920. Pure function of time: window.__renderAt(t).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920;
const K = await (await fetch('/out/anchors.json')).json();
const CAPS = await (await fetch('/out/captions.json')).json();
const END = K.END, A = (n) => K[n];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, u) => a + (b - a) * u;
const R = (t, a, d = 0.5) => ss((t - a) / d);
const win = (t, a, b, f = 0.3) => R(t, a, f) * (1 - R(t, b - f, f));
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------ renderer + kitchen
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#120a07'); scene.fog = new THREE.Fog('#120a07', 180, 420);
{ // studio reflection map: warm softboxes + a window strip on a dark room, so chrome steel shows bright streaks
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#3a2a20'; g.fillRect(0, 0, 1024, 512);
  const box = (x, w, col) => { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, 90, w, 300); };
  box(120, 120, '#ffe2bd'); box(470, 60, '#ffffff'); box(760, 160, '#ffcf99'); g.fillStyle = '#6a5040'; g.fillRect(0, 400, 1024, 112);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(t).texture; scene.environmentIntensity = 1.0;
}
const camera = new THREE.PerspectiveCamera(32, W / H, 0.5, 400);
const key = new THREE.SpotLight('#ffc48a', 2600, 160, 0.55, 0.6, 1.6); key.position.set(28, 55, 40); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key); scene.add(key.target);
const rim = new THREE.DirectionalLight('#7fb2ff', 1.4); rim.position.set(-40, 30, -30); scene.add(rim);
scene.add(new THREE.HemisphereLight('#ffd9b8', '#1a0f0a', 0.35));
const flameL = new THREE.PointLight('#4f8dff', 0, 40, 2); flameL.position.set(0, 1, 0); scene.add(flameL);

const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const tiles = tex(512, 512, (g, w, h) => { g.fillStyle = '#d9c7ad'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9c8a70'; g.lineWidth = 6;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); } });
tiles.repeat.set(10, 6);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(400, 240), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.45 })); wall.position.set(0, 80, -45); wall.receiveShadow = true; scene.add(wall);
const granite = tex(512, 512, (g, w, h) => { g.fillStyle = '#2a2420'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { const v = 40 + 80 * rnd(i); g.fillStyle = `rgba(${v},${v * 0.9},${v * 0.8},.5)`; g.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2, 2); } });
granite.repeat.set(4, 2);
const counter = new THREE.Mesh(new THREE.BoxGeometry(400, 4, 120), new THREE.MeshStandardMaterial({ map: granite, roughness: 0.3, metalness: 0.1 })); counter.position.set(0, -6, 0); counter.receiveShadow = true; scene.add(counter);
// gas stove: black glass, burner, pan supports, blue flame
const stove = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 40), new THREE.MeshStandardMaterial({ color: '#0d0d10', roughness: 0.08, metalness: 0.6 })); stove.position.set(0, -2.5, 0); stove.receiveShadow = true; scene.add(stove);
const burner = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.6, 48), new THREE.MeshStandardMaterial({ color: '#3a3a3c', metalness: 0.8, roughness: 0.35 })); burner.position.set(0, -0.4, 0); scene.add(burner);
for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const s = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: '#1a1a1c', roughness: 0.6 })); s.position.set(Math.cos(a) * 9, 0.6, Math.sin(a) * 9); s.rotation.y = -a; scene.add(s); }
const NF = 36, flameMat = new THREE.MeshBasicMaterial({ color: '#4a8cff', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
const flames = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 3, 8), flameMat, NF); scene.add(flames);
const dm = new THREE.Object3D();

// ------------------------------------------------------------------ the cooker (lathe profiles), steel + x-ray twins
const steel = new THREE.MeshStandardMaterial({ color: '#e4e7ea', metalness: 1, roughness: 0.12, transparent: true, envMapIntensity: 1.6, side: THREE.DoubleSide });
const black = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.45, metalness: 0.1, transparent: true });
const xray = new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uCol: { value: new THREE.Color('#ffd7a8') } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'varying vec3 n; varying vec3 vd; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform float uA; uniform vec3 uCol; varying vec3 n; varying vec3 vd; void main(){ float f = pow(1.-abs(dot(normalize(n),normalize(vd))),1.7); gl_FragColor = vec4(uCol*(.4+1.1*f), (.06+.7*f)*uA); }',
});
const cooker = new THREE.Group(); scene.add(cooker);
const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const bodyG = lathe([[0, 0], [10.2, 0], [11, 0.6], [11.2, 2], [11.2, 15], [11.6, 15.6], [11.8, 16.2]]);
const lidG = lathe([[0, 18.2], [3, 18.1], [8, 17.4], [10.6, 16.6], [11.3, 16.3], [11.3, 15.9]]);
const twin = (g, mat, parent) => { const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); const x = new THREE.Mesh(g, xray); x.renderOrder = 5; parent.add(x); return m; };
const body = twin(bodyG, steel, cooker);
const lidGrp = new THREE.Group(); cooker.add(lidGrp);
twin(lidG, steel, lidGrp);
const handleG = new THREE.BoxGeometry(18, 2.4, 3.4); handleG.translate(20, 14.2, 0);
twin(handleG, black, cooker);
const lidHandleG = new THREE.BoxGeometry(17, 2.0, 3.0); lidHandleG.translate(19.5, 17.9, 0);
twin(lidHandleG, black, lidGrp);
// vent pipe + whistle weight (the "seeti")
const ventG = new THREE.CylinderGeometry(0.55, 0.65, 2.6, 24); ventG.translate(0, 19.3, 0); twin(ventG, steel, lidGrp);
const hole = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: '#050505' })); hole.rotation.x = -Math.PI / 2; hole.position.y = 20.62; lidGrp.add(hole);
const weight = new THREE.Group(); lidGrp.add(weight);
const wG = lathe([[0, 20.0], [1.6, 20.0], [1.9, 20.6], [1.9, 22.4], [1.3, 23.6], [0.7, 24.6], [0.9, 25.4], [0, 25.6]], 48);
twin(wG, black, weight);
// safety valve (small plug on the lid, near the handle)
const valve = new THREE.Group(); lidGrp.add(valve);
const vG = new THREE.CylinderGeometry(0.9, 1.0, 1.2, 24); vG.translate(5.6, 17.9, 2.2); twin(vG, new THREE.MeshStandardMaterial({ color: '#b9433a', roughness: 0.5, transparent: true }), valve);
// inside: water, food grains, food blob that jams the vent
const water = new THREE.Mesh(new THREE.CylinderGeometry(10.8, 10.8, 7, 64, 1), new THREE.MeshStandardMaterial({ color: '#3f86c9', transparent: true, opacity: 0, roughness: 0.1, metalness: 0, emissive: '#0d2c4a', emissiveIntensity: 0.4 }));
water.position.y = 4.6; cooker.add(water);
const NG = 220, grains = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.6, transparent: true, opacity: 0 }), NG); cooker.add(grains);
for (let i = 0; i < NG; i++) grains.setColorAt(i, new THREE.Color(rnd(i + 3) > 0.5 ? '#f2c04a' : '#f4efe2'));
const NB = 160, bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshStandardMaterial({ color: '#dff2ff', transparent: true, opacity: 0, roughness: 0.05 }), NB); cooker.add(bubbles);
const blob = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 14), new THREE.MeshStandardMaterial({ color: '#c98b2e', roughness: 0.8 })); blob.position.set(0, 18.4, 0); blob.scale.setScalar(0.001); lidGrp.add(blob);

// steam: soft points (inside haze, whistle jet, valve jet, ambient wisp)
const NS = 700, sg = new THREE.BufferGeometry();
sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
sg.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(NS), 1));
sg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(NS), 1));
const steamMat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: H / 2 / Math.tan(THREE.MathUtils.degToRad(16)) } }, transparent: true, depthWrite: false,
  vertexShader: 'attribute float aS, aA; varying float va; uniform float uScale; void main(){ va = aA; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = min(700., aS*uScale/-mv.z); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'varying float va; void main(){ vec2 q = gl_PointCoord*2.-1.; float r = dot(q,q); if (r>1.) discard; gl_FragColor = vec4(vec3(1.,.97,.93), exp(-r*3.)*va); }' });
const steam = new THREE.Points(sg, steamMat); steam.frustumCulled = false; steam.renderOrder = 9; scene.add(steam);

// ------------------------------------------------------------------ post: bloom + grade + vignette + grain
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.45, 0.6, 0.82); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uFlash: { value: 0 }, uRed: { value: 0 } },
  vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uFlash, uRed; varying vec2 v;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, v).rgb; float l = dot(c, vec3(.3,.59,.11));
      c = mix(c, c*vec3(1.08,1.,.9), smoothstep(.3,.9,l)*.6); c = mix(c, c*vec3(.92,.98,1.08), (1.-smoothstep(.0,.35,l))*.5);
      vec2 q = v-.5; c *= 1. - .9*dot(q*vec2(1.6,1.), q*vec2(1.6,1.));
      c = mix(c, c*vec3(1.3,.6,.55), uRed*.75*(.25+.75*length(q)*1.6));
      c += uFlash; c += (h(v*900.+uT)-.5)*.035; gl_FragColor = vec4(c,1.); }` });
composer.addPass(grade);

// ------------------------------------------------------------------ physics of the story
// pressure 0..1 (gauge full scale = red zone at 0.85+), temperature from it
const tLid = A('lid'), tPress = A('press'), tDeg = A('deg'), tFast = A('fast'), tMore = A('more'), tLift = A('lift'), tWh = A('whistle'), tJam = A('jam'), tValve = A('valve'), tClean = A('clean'), tEnd = A('end');
const WH = tLift + 0.7;                       // whistle lifts
const POP = tValve + 1.7;                     // valve pops
function pressure(t) {
  let p = 0.08 + 0.55 * R(t, tPress, 3.2) + 0.25 * R(t, tMore, 1.6);
  if (t > WH) p -= 0.35 * R(t, WH, 0.4) * (1 - R(t, tJam, 0.5));
  if (t > tJam) p = Math.min(1.1, p + 0.45 * R(t, tJam + 0.3, 2.0));
  if (t > POP) p = lerp(p, 0.3, R(t, POP, 0.8));
  if (t > tClean) p = 0.6;
  return p;
}
const tempC = (t) => Math.round(lerp(100, 120, eio((t - tDeg) / 2.2)));

function setState(t) {
  const p = pressure(t), boil = R(t, tPress, 2) * (t < tClean ? 1 : 0.6);
  // lid closes and locks at the start of "lid"
  const lc = eio((t - tLid) / 1.4); lidGrp.position.y = (1 - lc) * 9; lidGrp.rotation.y = (1 - lc) * 0.9;
  if (t < tLid) { lidGrp.position.y = 0; lidGrp.rotation.y = 0; }        // opening shot: already closed (loop match)
  // x-ray amount by section
  const xr = Math.max(win(t, tLid + 1.6, tLift - 0.1, 0.5), win(t, tJam, tClean - 0.2, 0.4));
  xray.uniforms.uA.value = xr; steel.opacity = 1 - 0.88 * xr; black.opacity = 1 - 0.75 * xr;
  steel.depthWrite = black.depthWrite = xr < 0.5;
  water.material.opacity = 0.75 * xr; grains.material.opacity = xr; bubbles.material.opacity = 0.9 * xr * boil;
  // vibration when pressure is high
  const shake = Math.max(0, p - 0.82) * 0.5; cooker.position.set(Math.sin(t * 61) * shake, 0, Math.cos(t * 53) * shake);
  // whistle weight: jumps on release, rattles while venting
  const vent = (t > WH && t < tJam) ? 1 : 0, jam = t > tJam && t < tClean + 0.6;
  weight.position.y = vent ? 1.6 * R(t, WH, 0.12) + 0.35 * Math.abs(Math.sin(t * 38)) : 0;
  const off = win(t, tClean - 0.2, tEnd - 0.1, 0.5); weight.position.y += 9 * off; weight.position.x = 7 * off;   // lifted off to show the vent hole
  blob.scale.setScalar(jam ? 0.001 + R(t, tJam + 0.2, 0.6) * (1 - R(t, tClean + 0.3, 0.8)) : 0.001);
  // safety valve pops off
  const pv = clamp((t - POP) / 1.2); valve.position.set(pv * 6, pv * 9 - pv * pv * 6, pv * 3); valve.rotation.x = pv * 6;
  if (t > tClean) valve.position.set(0, 0, 0), valve.rotation.x = 0;
  // flame
  for (let i = 0; i < NF; i++) { const a = i / NF * Math.PI * 2; dm.position.set(Math.cos(a) * 5.6, 1.6, Math.sin(a) * 5.6);
    dm.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); dm.scale.set(1, 0.8 + 0.35 * Math.sin(t * 23 + i * 1.7), 1); dm.updateMatrix(); flames.setMatrixAt(i, dm.matrix); }
  flames.instanceMatrix.needsUpdate = true; flameL.intensity = 260 + 60 * Math.sin(t * 17);
  // food grains tumble with the boil
  for (let i = 0; i < NG; i++) { const a = rnd(i) * 6.283 + t * (0.4 + boil * 1.6) * (rnd(i + 9) - 0.5) * 2, r = 9.5 * Math.sqrt(rnd(i + 1));
    dm.position.set(Math.cos(a) * r, 1.4 + 6.2 * rnd(i + 2) + boil * 0.8 * Math.sin(t * 5 + i), Math.sin(a) * r); dm.scale.set(1, 0.6, 1.3); dm.rotation.set(t * rnd(i), i, 0); dm.updateMatrix(); grains.setMatrixAt(i, dm.matrix); }
  grains.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < NB; i++) { const life = ((t * (0.8 + rnd(i))) + rnd(i + 4)) % 1, r = 9.8 * Math.sqrt(rnd(i + 5)), a = rnd(i + 6) * 6.283;
    dm.position.set(Math.cos(a) * r, 1.2 + life * 6.8, Math.sin(a) * r); dm.scale.setScalar(0.5 + life); dm.rotation.set(0, 0, 0); dm.updateMatrix(); bubbles.setMatrixAt(i, dm.matrix); }
  bubbles.instanceMatrix.needsUpdate = true;
  // steam particles: 0-299 inside haze, 300-519 whistle jet, 520-639 valve jet, 640-699 ambient wisp
  const pos = sg.attributes.position.array, sz = sg.attributes.aS.array, al = sg.attributes.aA.array;
  const slow = (t > WH && t < WH + 2.6) ? 0.35 : 1;               // slow-motion feel on the first whistle
  for (let i = 0; i < NS; i++) {
    let x = 0, y = -999, z = 0, s = 0, a = 0;
    if (i < 300) { const life = ((t * 0.25 + rnd(i)) % 1); const r = 10 * Math.sqrt(rnd(i + 1)), ang = rnd(i + 2) * 6.283 + t * 0.6;
      x = Math.cos(ang) * r; z = Math.sin(ang) * r; y = 8.5 + life * 8; s = 2.2 + 2 * rnd(i + 3); a = 0.10 * xr * (0.3 + p); }
    else if (i < 520) { const on = vent;
      const life = ((t * (1.1 * slow) + rnd(i)) % 1); const sp = 0.6 + rnd(i + 4);
      x = (rnd(i + 5) - 0.5) * life * 9; z = (rnd(i + 6) - 0.5) * life * 9; y = 25.5 + life * 34 * sp; s = 1.2 + 7 * life; a = on ? 0.55 * (1 - life) * (t > tClean ? 0.5 : 1) : 0; }
    else if (i < 640) { const on = t > POP && t < tClean; const life = ((t * 1.3 + rnd(i)) % 1);
      x = 5.6 + life * 18; y = 18.5 + life * 10 + (rnd(i + 7) - 0.5) * life * 6; z = 2.2 + (rnd(i + 8) - 0.5) * life * 8; s = 1.2 + 6 * life; a = on ? 0.6 * (1 - life) * R(t, POP, 0.2) : 0; }
    else { const life = ((t * 0.18 + rnd(i)) % 1); x = Math.sin(life * 6 + i) * 1.2 * life; z = 0; y = 25.6 + life * 14; s = 1 + 3 * life; a = 0.22 * (1 - life) * (vent ? 0 : 1); }
    pos[i * 3] = x + cooker.position.x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; sz[i] = s; al[i] = a;
  }
  sg.attributes.position.needsUpdate = sg.attributes.aS.needsUpdate = sg.attributes.aA.needsUpdate = true;
  grade.uniforms.uRed.value = clamp((p - 0.85) / 0.25) * (t < POP + 0.3 ? 1 : 0);
  grade.uniforms.uFlash.value = 0.25 * Math.max(0, 1 - Math.abs(t - WH) / 0.12) + 0.2 * Math.max(0, 1 - Math.abs(t - POP) / 0.12);
  return p;
}

// ------------------------------------------------------------------ camera
const C = (t, pos, tgt, fov) => ({ t, pos, tgt, fov });
// distances sized for 9:16: the cooker (about 30 cm with handle) fills ~75% of the width in the wide shots
const OPEN = C(0, [17, 31, 50], [0, 23.2, 0], 30);                // whistle close-up (first and last frame match)
const SH = [
  OPEN, C(2.6, [50, 58, 128], [4, 12, 0], 32), C(tLid - 0.1, [56, 52, 132], [4, 11, 0], 32),
  C(tLid, [44, 54, 112], [4, 14, 0], 32), C(tPress - 0.2, [30, 46, 100], [2, 10, 0], 32),
  C(tPress, [26, 44, 96], [1, 9, 0], 32), C(tFast, [14, 30, 64], [0, 6, 0], 32),
  C(tMore, [30, 46, 98], [3, 11, 0], 32), C(tLift - 0.1, [24, 40, 78], [2, 16, 0], 32),
  C(tLift, [15, 32, 52], [0, 24, 0], 32), C(WH + 2.6, [12, 31, 44], [0, 27, 0], 34), C(tJam - 0.1, [26, 48, 92], [3, 18, 0], 32),
  C(tJam, [30, 48, 92], [4, 16, 0], 32), C(POP - 0.2, [26, 44, 80], [5, 17, 1], 32), C(tClean - 0.1, [40, 52, 104], [8, 18, 2], 32),
  C(tClean, [3, 40, 9], [0, 20.5, 0], 30), C(tEnd - 0.2, [4, 38, 12], [0, 20.5, 0], 30),
  C(tEnd, [24, 40, 70], [0, 20, 0], 32), C(END - 0.5, [17, 31, 50], [0, 23.2, 0], 30),
];
function camAt(t) {
  let a = SH[0], b = SH[0], u = 0;
  for (let i = 0; i < SH.length - 1; i++) if (t >= SH[i].t && t < SH[i + 1].t) { a = SH[i]; b = SH[i + 1]; u = eio((t - a.t) / (b.t - a.t)); break; }
  if (t >= SH[SH.length - 1].t) a = b = SH[SH.length - 1];
  camera.position.set(...a.pos.map((v, i) => lerp(v, b.pos[i], u)));
  camera.fov = lerp(a.fov, b.fov, u); camera.updateProjectionMatrix();
  camera.lookAt(...a.tgt.map((v, i) => lerp(v, b.tgt[i], u)));
  camera.rotateZ(0.006 * Math.sin(t * 0.9)); camera.rotateX(0.004 * Math.sin(t * 1.3));
}

// ------------------------------------------------------------------ DOM overlays
const UIel = document.getElementById('ui'), LNel = document.getElementById('lines'), CAPel = document.getElementById('cap');
let UI = [], LN = [];
const _v = new THREE.Vector3();
const scr = (x, y, z) => { camera.updateMatrixWorld(); _v.set(x, y, z).project(camera); return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, _v.z < 1]; };
const el = (html, x, y, a, cls = '', extra = '') => { if (a > 0.01) UI.push(`<div class="t ${cls}" style="left:${x}px;top:${y}px;opacity:${a};${extra}">${html}</div>`); };
function label(txt, sub, p3, dx, dy, a) {
  if (a <= 0.01) return; const [x, y, vis] = scr(...p3); if (!vis) return;
  LN.push(`<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="rgba(255,255,255,${0.9 * a})" stroke-width="4"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="rgba(255,207,122,${a})" stroke-width="4"/>`);
  el(`${txt}${sub ? `<i>${sub}</i>` : ''}`, x + dx, y + dy, a, 'lab');
}
function gauge(p, a) {      // pressure dial (SVG), top-left
  if (a <= 0.01) return; const cx = 220, cy = 330, r = 130, ang = lerp(-2.4, 2.4, clamp(p / 1.1));
  const arc = (a0, a1, col) => { const p0 = [cx + Math.sin(a0) * r, cy - Math.cos(a0) * r], p1 = [cx + Math.sin(a1) * r, cy - Math.cos(a1) * r];
    return `<path d="M${p0[0]} ${p0[1]} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p1[0]} ${p1[1]}" stroke="${col}" stroke-width="18" fill="none" opacity="${a}"/>`; };
  LN.push(`<circle cx="${cx}" cy="${cy}" r="${r + 26}" fill="rgba(14,8,6,${0.85 * a})" stroke="rgba(255,255,255,${0.3 * a})" stroke-width="3"/>` + arc(-2.4, 0.9, '#7cf09a') + arc(0.9, 1.7, '#ffb547') + arc(1.7, 2.4, '#ff5a45') +
    `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ang) * (r - 24)}" y2="${cy - Math.cos(ang) * (r - 24)}" stroke="white" stroke-width="9" stroke-linecap="round" opacity="${a}"/><circle cx="${cx}" cy="${cy}" r="14" fill="white" opacity="${a}"/>`);
  el('दबाव', cx, cy + 92, a, '', 'font-weight:800;font-size:34px');
}
function captions(t) {
  const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
  if (!c) { CAPel.innerHTML = ''; return; }
  CAPel.innerHTML = c.words.map((w, i) => `<span class="${t >= w.t - 0.03 && (i === c.words.length - 1 || t < c.words[i + 1].t - 0.03) ? 'on' : ''}">${w.w}</span>`).join(' ');
}

// ------------------------------------------------------------------ frame
function renderAt(t) {
  t = clamp(t, 0, END - 1e-3); UI = []; LN = [];
  const p = setState(t); camAt(t);
  key.target.position.set(0, 10, 0);
  // hook (first frame shows it at full strength) and loop tag at the end
  el('सीटी न होती<br><em>तो?</em>', W / 2, 300, 1 - R(t, 2.4, 0.4), 'hook');
  el('सीटी न होती<br><em>तो?</em>', W / 2, 300, R(t, tEnd + 0.4, 0.5), 'hook');
  gauge(p, Math.max(win(t, tPress, tLift, 0.4), win(t, tJam, tClean, 0.4)));
  el(`<b>${t < tDeg ? 100 : tempC(t)}°C</b>`, 820, 330, win(t, tDeg - 0.2, tMore, 0.3), 'chip');
  el('तेज़ पकाई', W / 2, 1220, win(t, tFast + 0.2, tMore, 0.3), 'chip');
  label('सीटी (वज़न)', 'भाप का रास्ता', [0, 25.5, 0], 200, -160, win(t, tLift + 0.2, tWh + 1.2, 0.3));
  el('<span class="bad">✕</span> सीटी जाम', W / 2, 1220, win(t, tJam + 0.6, POP, 0.3), 'chip');
  label('सेफ़्टी वाल्व', 'पिघलकर खुलता है', [5.6, 18, 2.2], 220, 160, win(t, tValve + 0.2, POP + 1.2, 0.3));
  el('<span class="ok">✓</span> भाप बाहर, ख़तरा टला', W / 2, 1220, win(t, POP + 0.4, tClean, 0.3), 'chip');
  el('छेद साफ़ रखें', W / 2, 1220, win(t, tClean + 0.6, tEnd, 0.3), 'chip');
  grade.uniforms.uT.value = t;
  composer.render();
  UIel.innerHTML = UI.join(''); LNel.innerHTML = LN.join(''); captions(t);
}
window.__renderAt = renderAt; window.__duration = END;
await document.fonts.ready;
const params = new URLSearchParams(location.search);
if (params.has('t')) renderAt(parseFloat(params.get('t'))); else renderAt(0);
window.__ready = true;
