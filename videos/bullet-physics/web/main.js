// "How a gun fires a bullet" — basic physics, 30 s, 9:16, silent. Pure function of time:
// window.__renderAt(t) renders any frame. Units ~ cm. Muzzle points +x in every shot.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920, DUR = 30;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const s5 = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const lerp = (a, b, k) => a + (b - a) * k;
const map = (t, a, b, u, v, e = s5) => lerp(u, v, e((t - a) / (b - a)));
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.7;
const key = new THREE.DirectionalLight('#fff1e0', 2.2); key.position.set(3, 6, 8); scene.add(key);
const rim = new THREE.DirectionalLight('#9fc8ff', 1.6); rim.position.set(-6, 3, -6); scene.add(rim);
scene.add(new THREE.HemisphereLight('#d8e2ee', '#22262c', 0.5));
const camera = new THREE.PerspectiveCamera(26, W / H, 0.1, 400);
scene.add(camera);

// backdrop: graphite vignette <-> neutral studio (uMix), parented to the camera
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { uMix: { value: 0 } }, depthWrite: false, depthTest: false,
  vertexShader: 'varying vec2 v; void main(){ v=uv; gl_Position=vec4(position.xy,0.9999,1.); }',
  fragmentShader: `varying vec2 v; uniform float uMix;
    void main(){
      vec2 p = (v - vec2(.5,.42)) * vec2(1., 1.78);
      float d = length(p);
      vec3 g = mix(vec3(.085,.095,.11), vec3(.018,.02,.025), smoothstep(.0,1.0,d));
      float floorY = smoothstep(.405,.4,v.y);
      vec3 s = vec3(.17,.175,.185) * (1. - .2*d);
      s = mix(s, vec3(.105,.11,.12) * (1.-.25*d), floorY);
      vec3 c = mix(g, s, uMix);
      float n = fract(sin(dot(v*1000., vec2(12.9898,78.233)))*43758.5453);
      gl_FragColor = vec4(c + (n-.5)*.012, 1.);
    }`,
}));
bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

// ---------------------------------------------------------------- materials
const steel = new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 1, roughness: 0.32 });
const brass = new THREE.MeshStandardMaterial({ color: '#cfae63', metalness: 1, roughness: 0.28, side: THREE.DoubleSide });
const brassIn = new THREE.MeshStandardMaterial({ color: '#7a6232', metalness: 1, roughness: 0.5, side: THREE.BackSide });
const copper = new THREE.MeshStandardMaterial({ color: '#d27a45', metalness: 1, roughness: 0.2 });
function ghost(col = '#cfd6de', base = 0.05, edge = 0.55) {     // x-ray steel: fresnel rim, see-through body
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(col) }, uBase: { value: base }, uEdge: { value: edge }, uA: { value: 1 } },
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec3 n; varying vec3 vd; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.);
      n = normalize(normalMatrix*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uBase, uEdge, uA; varying vec3 n; varying vec3 vd;
      void main(){ float f = pow(1.-abs(dot(normalize(n), normalize(vd))), 2.2);
        float top = .6+.4*normalize(n).y;
        gl_FragColor = vec4(uCol*(.55+.6*f)*top, (uBase + uEdge*f)*uA); }`,
  });
}
const edgeMat = (o) => new THREE.LineBasicMaterial({ color: '#e6ecf2', transparent: true, opacity: o, depthWrite: false });

// ---------------------------------------------------------------- geometry (gun frame: chamber rear at x = -4)
const BORE = 0.19, CASE_R = 0.255, MUZZLE = 10, CASE_REAR = -3.95, CASE_FRONT = -1.75;
const BASE0 = -2.25, BLEN = 1.45;          // bullet base at rest, bullet length
const gun = new THREE.Group(); scene.add(gun);
const alongX = (g) => g.rotateZ(-Math.PI / 2);

// barrel: transparent tube, chamber wider
const barrelOut = alongX(new THREE.CylinderGeometry(0.5, 0.5, MUZZLE + 4.4, 64, 1, true)).translate((MUZZLE - 4.4) / 2, 0, 0);
const barrel = new THREE.Mesh(barrelOut, ghost('#d5dde6', 0.06, 0.6)); barrel.renderOrder = 5; gun.add(barrel);
const bore = new THREE.Mesh(alongX(new THREE.CylinderGeometry(BORE + 0.005, BORE + 0.005, MUZZLE - CASE_FRONT, 48, 1, true)).translate((MUZZLE + CASE_FRONT) / 2, 0, 0), ghost('#e8eef5', 0.03, 0.35));
bore.renderOrder = 5; gun.add(bore);
const muzzleRing = new THREE.Mesh(new THREE.RingGeometry(BORE + 0.01, 0.5, 64).rotateY(Math.PI / 2).translate(MUZZLE, 0, 0), ghost('#e8eef5', 0.25, 0.3)); muzzleRing.renderOrder = 5; gun.add(muzzleRing);
for (const x of [MUZZLE, -4.4]) {
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([...Array(65)].map((_, i) => new THREE.Vector3(x, 0.5 * Math.cos(i / 64 * 6.2832), 0.5 * Math.sin(i / 64 * 6.2832)))), edgeMat(0.6));
  gun.add(ring);
}
// body shell (slide + frame + grip), x-ray steel with crisp silhouette lines
function rbox(w, h, d, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 8 }).translate(0, 0, -d / 2);
}
const shellParts = [];
const slide = rbox(15.2, 1.55, 1.15, 0.25).translate(2.55, 0.12, 0); shellParts.push(slide);
const frame = rbox(9.5, 0.7, 1.0, 0.2).translate(0.0, -1.0, 0); shellParts.push(frame);
const gs = new THREE.Shape(); gs.moveTo(-5.0, -0.6); gs.lineTo(-2.0, -0.6); gs.lineTo(-3.0, -5.6); gs.quadraticCurveTo(-3.2, -6.1, -3.8, -6.1);
gs.lineTo(-5.6, -6.1); gs.quadraticCurveTo(-6.2, -6.1, -6.1, -5.5); gs.lineTo(-5.0, -0.6);
const grip = new THREE.ExtrudeGeometry(gs, { depth: 1.1, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 3 }).translate(0, 0, -0.55); shellParts.push(grip);
const guardS = new THREE.Shape(); guardS.moveTo(-1.9, -1.3); guardS.quadraticCurveTo(-1.6, -2.9, 0.6, -2.7); guardS.quadraticCurveTo(1.6, -2.5, 1.5, -1.3);
guardS.lineTo(1.2, -1.3); guardS.quadraticCurveTo(1.25, -2.25, 0.5, -2.4); guardS.quadraticCurveTo(-1.3, -2.55, -1.55, -1.3); guardS.lineTo(-1.9, -1.3);
const guard = new THREE.ExtrudeGeometry(guardS, { depth: 0.5, bevelEnabled: false }).translate(0, 0, -0.25); shellParts.push(guard);
const shellMat = ghost('#aab4bf', 0.05, 0.45);
const shellGroup = new THREE.Group(); gun.add(shellGroup);
const shellEdges = [];
for (const g of shellParts) {
  const m = new THREE.Mesh(g, shellMat); m.renderOrder = 6; shellGroup.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g, 35), edgeMat(0.38)); e.renderOrder = 7; shellGroup.add(e); shellEdges.push(e);
}
// solid steel grip panels give the silhouette weight (opaque, dark)
const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: 0.9, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }).translate(0, 0, -0.45).scale(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: '#2a2e34', metalness: 0.6, roughness: 0.55, transparent: true, opacity: 0.55, depthWrite: false }));
panel.renderOrder = 4; shellGroup.add(panel);

// cartridge case: cutaway (back half) so the propellant is visible; rim + head
const caseLen = CASE_FRONT - CASE_REAR;
const caseG = alongX(new THREE.CylinderGeometry(CASE_R, CASE_R, caseLen, 64, 1, true, Math.PI / 2, Math.PI)).translate((CASE_REAR + CASE_FRONT) / 2, 0, 0);
const caseM = new THREE.Mesh(caseG, brass); gun.add(caseM);
const caseHead = new THREE.Mesh(alongX(new THREE.CylinderGeometry(CASE_R + 0.03, CASE_R + 0.03, 0.18, 64)).translate(CASE_REAR + 0.09, 0, 0), brass); gun.add(caseHead);
const caseEdge = new THREE.LineSegments(new THREE.EdgesGeometry(caseG, 20), new THREE.LineBasicMaterial({ color: '#f3d58e', transparent: true, opacity: 0.5 })); gun.add(caseEdge);
// front half of the case as a faint shell, so it reads as one closed cartridge
const caseFront = new THREE.Mesh(alongX(new THREE.CylinderGeometry(CASE_R, CASE_R, caseLen, 64, 1, true, -Math.PI / 2, Math.PI)).translate((CASE_REAR + CASE_FRONT) / 2, 0, 0), ghost('#f0cf80', 0.06, 0.5));
caseFront.renderOrder = 4; gun.add(caseFront);
const primer = new THREE.Mesh(alongX(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 32)).translate(CASE_REAR - 0.01, 0, 0), copper); gun.add(primer);

// propellant grains (instanced), burn away
const NG = 90, grainMat = new THREE.MeshStandardMaterial({ color: '#3b3f35', roughness: 0.8, metalness: 0.1, emissive: new THREE.Color('#ff7a1a'), emissiveIntensity: 0 });
const grains = new THREE.InstancedMesh(alongX(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10)), grainMat, NG); gun.add(grains);
const GP = [...Array(NG)].map((_, i) => {
  const a = Math.PI / 2 + hash(i) * Math.PI, r = Math.sqrt(hash(i + 50)) * (CASE_R - 0.06);
  return [CASE_REAR + 0.25 + hash(i + 99) * (BASE0 - CASE_REAR - 0.35), r * Math.cos(a) * 0.95, r * Math.sin(a) * 0.95, hash(i + 7) * 6.28];
});
const dm = new THREE.Object3D();

// bullet (lathe, copper), separate from the case
const prof = [];
for (let i = 0; i <= 24; i++) { const k = i / 24; prof.push(new THREE.Vector2(BORE * Math.sqrt(Math.max(0.0005, 1 - Math.pow(1 - k, 2.2) * 0)) * (k < 0.45 ? 1 : Math.cos((k - 0.45) / 0.55 * 1.48)), k * BLEN)); }
prof.unshift(new THREE.Vector2(0, 0)); prof.splice(1, 0, new THREE.Vector2(BORE * 0.92, 0));
const bulletG = new THREE.LatheGeometry(prof, 64).rotateZ(-Math.PI / 2);
const bullet = new THREE.Mesh(bulletG, copper); scene.add(bullet);

// gas column inside case + barrel (amber, additive, animated noise)
const gasMat = new THREE.ShaderMaterial({
  uniforms: { uP: { value: 0 }, uI: { value: 0 }, uX0: { value: 0 }, uX1: { value: 1 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: 'varying vec3 p; varying vec3 n; varying vec3 vd; void main(){ p=position; vec4 mv=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); vd=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
  fragmentShader: `uniform float uP, uI, uX0, uX1; varying vec3 p; varying vec3 n; varying vec3 vd;
    float h(vec3 q){ return fract(sin(dot(q, vec3(12.9898,78.233,37.719)))*43758.5453); }
    float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
    void main(){
      float k = clamp((p.x-uX0)/max(.001,uX1-uX0), 0., 1.);
      float nz = noise(vec3(p.x*3.-uP*40., p.y*9., p.z*9.)) * .6 + noise(vec3(p.x*7.-uP*70., p.y*15., p.z*15.)) * .4;
      float f = 1.-abs(dot(normalize(n), normalize(vd)));
      float a = uI * (.35 + .65*nz) * (.55 + .45*f) * smoothstep(0.,.08,k) * smoothstep(1.,.96,k);
      vec3 c = mix(vec3(1.,.45,.08), vec3(1.,.82,.45), nz*(1.-k*.6));
      gl_FragColor = vec4(c*a*1.25, a);
    }`,
});
const gasG = alongX(new THREE.CylinderGeometry(1, 1, 1, 48, 24, false)).translate(0.5, 0, 0);
const gas = new THREE.Mesh(gasG, gasMat); gas.renderOrder = 3; gun.add(gas);

// muzzle gas: deterministic soft particles (amber glow fading to grey smoke)
const NP = 260;
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
pg.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(NP), 1));
pg.setAttribute('aHot', new THREE.BufferAttribute(new Float32Array(NP), 1));
pg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(NP), 1));
const puffMat = new THREE.ShaderMaterial({
  uniforms: { uScale: { value: H / 2 / Math.tan(THREE.MathUtils.degToRad(13)) } },
  transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  vertexShader: `attribute float aSize, aHot, aA; varying float vh, va; uniform float uScale;
    void main(){ vh=aHot; va=aA; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize = min(900., aSize*uScale/-mv.z); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vh, va;
    void main(){ vec2 q=gl_PointCoord*2.-1.; float r=dot(q,q); if(r>1.) discard;
      float s = exp(-r*3.2);
      vec3 smoke = vec3(.42,.40,.38); vec3 hot = vec3(1.,.62,.2);
      vec3 c = mix(smoke, hot*1.6, vh);
      gl_FragColor = vec4(c, s*va); }`,
});
const puffs = new THREE.Points(pg, puffMat); puffs.frustumCulled = false; puffs.renderOrder = 8; scene.add(puffs);
const PD = [...Array(NP)].map((_, i) => {
  const fw = hash(i + 3) < 0.28;                       // part of the jet that follows the bullet
  const th = fw ? hash(i + 11) * 0.35 : 0.25 + hash(i + 11) * 1.25;   // angle from +x
  const ph = hash(i + 17) * 6.283;
  return { d: new THREE.Vector3(Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph)), v: (fw ? 2.0 : 0.75) * (0.5 + hash(i + 23)), sz: 0.1 + hash(i + 29) * 0.18, k: 6 + hash(i + 31) * 6, delay: hash(i + 37) * 0.025 };
});

// primer flash glow (sprite) + light
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,240,1)'); r.addColorStop(0.25, 'rgba(255,190,90,.8)'); r.addColorStop(1, 'rgba(255,120,20,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
flash.position.set(CASE_REAR + 0.05, 0, 0); gun.add(flash);
const flashL = new THREE.PointLight('#ffb060', 0, 6, 1.5); flashL.position.set(CASE_REAR + 0.4, 0, 0.3); gun.add(flashL);
const gasL = new THREE.PointLight('#ff9a40', 0, 5, 1.5); scene.add(gasL);
const muzzleL = new THREE.PointLight('#ffa050', 0, 8, 1.6); scene.add(muzzleL);

// studio reference line (wide recoil shot): where the gun's rear started
const refLine = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 11), new THREE.MeshBasicMaterial({ color: '#f2f4f6', transparent: true, opacity: 0, depthWrite: false }));
refLine.position.set(-6.25, -1.0, -2.5); scene.add(refLine);

// ---------------------------------------------------------------- physics (psi: 0 = primer fires, 1 = bullet base leaves muzzle)
const L = MUZZLE - BASE0, P0 = 0.2, EXP = 1.7;
const VEXIT = L * EXP / (1 - P0);                          // speed at the muzzle, per unit psi
function travel(psi) {
  if (psi <= P0) return 0;
  if (psi <= 1) return L * Math.pow((psi - P0) / (1 - P0), EXP);
  return L + VEXIT * (psi - 1);
}
const RECOIL = 0.07;
const gunX = (psi) => -RECOIL * (psi <= 1 ? travel(psi) : L + 0.55 * VEXIT * (psi - 1) * (1 + 0.3 * clamp(psi - 1)));
const burn = (psi) => clamp((psi - 0.01) / 0.24);

function setPhysics(psi) {
  const gx = gunX(psi); gun.position.x = gx;
  const s = travel(psi); const baseW = BASE0 + s;          // bullet in world (recoil-free reference for bullet)
  bullet.position.x = baseW;
  // grains
  const b = burn(psi);
  for (let i = 0; i < NG; i++) {
    const g = GP[i]; const life = clamp(1 - (b - hash(i + 5) * 0.4) / 0.6);
    dm.position.set(g[0], g[1], g[2]); dm.rotation.set(g[3], g[3] * 0.7, 0); dm.scale.setScalar(Math.max(0.001, life));
    dm.updateMatrix(); grains.setMatrixAt(i, dm.matrix);
  }
  grains.instanceMatrix.needsUpdate = true;
  grainMat.emissiveIntensity = psi > 0 ? 2.5 * Math.sin(Math.PI * clamp(b * 1.1)) : 0;
  // gas column: from case rear to bullet base (gun frame)
  const x0 = CASE_REAR + 0.12, x1 = Math.min(MUZZLE, baseW - gx);
  const inside = psi > 0.005 && psi < 1.06;
  gas.visible = inside;
  if (inside) {
    gas.position.x = x0; gas.scale.set(Math.max(0.01, x1 - x0), 1, 1);
    const r = BORE - 0.012; gas.scale.y = gas.scale.z = r;
    // the case part is wider: scale radius by x is not possible on one mesh, so use the case radius when still in the case
    if (x1 < CASE_FRONT + 0.05) gas.scale.y = gas.scale.z = CASE_R - 0.03;
    const I = clamp(psi / 0.08) * (psi < 1 ? 1 : 1 - (psi - 1) / 0.06) * (0.9 + 0.3 * (1 - clamp(s / L)));
    gasMat.uniforms.uI.value = I; gasMat.uniforms.uP.value = psi; gasMat.uniforms.uX0.value = 0; gasMat.uniforms.uX1.value = 1;
    gasL.intensity = 6 * I; gasL.position.set(gx + (x0 + x1) / 2, 0.5, 0.8);
  } else gasL.intensity = 0;
  // primer flash
  const fl = psi > 0 ? Math.exp(-psi / 0.012) * (psi < 0.08 ? 1 : 0) : 0;
  flash.scale.setScalar(0.2 + 1.8 * fl); flash.material.opacity = fl; flashL.intensity = 30 * fl;
  // muzzle gas
  const pos = pg.attributes.position.array, sz = pg.attributes.aSize.array, hot = pg.attributes.aHot.array, al = pg.attributes.aA.array;
  const e = psi - 1; const mx = MUZZLE + gx;
  for (let i = 0; i < NP; i++) {
    const d = PD[i], te = e - d.delay;
    if (te <= 0) { al[i] = 0; continue; }
    const tt = te * 12;                                     // expansion clock
    const r = d.v * (1 - Math.exp(-d.k * te)) / d.k * 12;
    pos[i * 3] = mx + 0.05 + d.d.x * r; pos[i * 3 + 1] = d.d.y * r + 0.15 * tt * hash(i + 41); pos[i * 3 + 2] = d.d.z * r;
    sz[i] = d.sz * (0.6 + Math.min(2.4, 1.0 + tt * 0.7));
    hot[i] = Math.exp(-tt * 1.2);
    al[i] = clamp(tt * 6) * (0.10 + 0.32 * hot[i]) * Math.exp(-tt * 0.15);
  }
  pg.attributes.position.needsUpdate = pg.attributes.aSize.needsUpdate = pg.attributes.aHot.needsUpdate = pg.attributes.aA.needsUpdate = true;
  muzzleL.intensity = e > 0 ? 10 * Math.exp(-e * 30) : 0; muzzleL.position.set(mx + 0.8, 0.6, 1.2);
}

// ---------------------------------------------------------------- shots
const OPEN_PSI = 1.075;
function frameShot(cx, cy, width, yaw = 0, pitch = 0) {    // look at (cx,cy,0) so `width` units fill the frame width
  const vh = width / camera.aspect; const d = vh / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(cx + d * Math.sin(yaw), cy + d * Math.sin(pitch), d * Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(cx, cy, 0);
}
// subject sits a bit below centre so the upper third stays clear (camera aims above the barrel)
const OPEN = { cx: MUZZLE + 1.25, cy: 2.0, w: 5.6, yaw: 0.0, pitch: 0.02 };
const CHAMBER = { cx: -1.5, cy: 1.35, w: 5.0, yaw: 0.0, pitch: 0.02 };

function psiAt(t) {
  if (t < 1.6) return lerp(OPEN_PSI - 0.025, OPEN_PSI, s5(t / 1.6) * 0.6 + t / 1.6 * 0.4);   // extreme slow motion
  if (t < 2.1) return OPEN_PSI;                                                             // freeze
  if (t < 4.4) return map(t, 2.1, 4.4, OPEN_PSI, -0.04, (x) => s5(x));                     // rewind
  if (t < 5.6) return -0.04;
  if (t < 12) return map(t, 5.6, 12, 0, 0.32, (x) => Math.pow(x, 1.15));                   // ignition, burn, first push
  if (t < 17.2) return map(t, 12, 17.2, 0.32, 0.985, (x) => x * x * (1.3 - 0.3 * x));       // ride with the bullet
  if (t < 20) return map(t, 17.2, 20, 0.985, 1.11, (x) => 1 - Math.pow(1 - x, 2.4));        // slow at the exit
  if (t < 20.7) return -0.04;                                                               // replay, wide
  if (t < 25.3) return map(t, 20.7, 25.3, -0.04, 1.32, (x) => x);
  if (t < 26) return 1.32;
  return lerp(OPEN_PSI, OPEN_PSI + 0.006, (t - 26) / 4);                                    // closing hold
}

function shot(t, psi) {
  let studio = 0, ref = 0, shellA = 1;
  if (t < 5.6) {                                     // opening -> rewind dolly to the chamber
    const k = s5((t - 2.1) / 2.4);
    const sh = { cx: lerp(OPEN.cx, CHAMBER.cx, k), cy: lerp(OPEN.cy, CHAMBER.cy, k), w: lerp(OPEN.w, CHAMBER.w, k) };
    frameShot(sh.cx + gunX(psi) * k, sh.cy, sh.w + Math.sin(k * Math.PI) * 2.5, 0, 0.02);
    if (t < 2.1) frameShot(OPEN.cx - 0.12 * t, OPEN.cy, OPEN.w - 0.1 * t, 0, 0.02);   // slow push during slow-mo
  } else if (t < 12) {                               // steady side view on the cartridge
    frameShot(CHAMBER.cx + 0.25 + 0.04 * (t - 5.6), CHAMBER.cy, CHAMBER.w - 0.05 * (t - 5.6), 0, 0.02);
  } else if (t < 20) {                               // tracking alongside the bullet, slight 3/4
    const bx = bullet.position.x + BLEN * 0.4;
    const k = s5((t - 17.2) / 2.0);
    frameShot(Math.min(bx + 0.9, MUZZLE + 1.8), 1.2 - 0.05 * k, 4.6 + 1.0 * k, 0.3 - 0.15 * k, 0.07);
  } else if (t < 26) {                               // wide fixed studio view, whole gun
    studio = 1; ref = 0.55; shellA = 1.25;
    frameShot(2.6, 0.2, 21, 0, 0.0);
  } else {
    frameShot(OPEN.cx - 0.12 * 2.1 - 0.05 * (t - 26), OPEN.cy, OPEN.w - 0.1 * 2.1 - 0.03 * (t - 26), 0, 0.02);
  }
  bg.material.uniforms.uMix.value = studio;
  refLine.material.opacity = ref * 1.4;
  shellMat.uniforms.uA.value = shellA;
  for (const e of shellEdges) e.material.opacity = studio ? 0.6 : 0.38;
  scene.environmentIntensity = studio ? 0.9 : 0.7;
}

// ---------------------------------------------------------------- post + loop
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.4, 0.55, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());

function renderAt(t) {
  t = clamp(t, 0, DUR - 1 / 120);
  const psi = psiAt(t);
  setPhysics(psi);
  shot(t, psi);
  // dips to black on the hard cuts (4 frames)
  const cuts = [12, 20, 26];
  let dip = 0; for (const c of cuts) dip = Math.max(dip, 1 - clamp(Math.abs(t - c) / 0.07));
  renderer.toneMappingExposure = (1.0 - 0.9 * dip) * (t < 0.25 ? s5(t / 0.25) * 0.85 + 0.15 : 1) * (t > 29.5 ? 1 : 1);
  bloom.strength = 0.38 + (bg.material.uniforms.uMix.value ? -0.25 : 0);
  composer.render();
}
window.__renderAt = renderAt; window.__duration = DUR;
const params = new URLSearchParams(location.search);
if (params.has('t')) renderAt(parseFloat(params.get('t')));
else if (!params.has('record')) { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
else renderAt(0);
window.__ready = true;
