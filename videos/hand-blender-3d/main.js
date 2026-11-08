import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { createMaterials } from './src/materials.js';
import { buildStudio } from './src/studio.js';
import { buildBlender } from './src/blender.js';
import { buildFluid, JAR } from './src/fluid.js';
import { Labels } from './src/labels.js';
import { Sound } from './src/audio.js';
import { createState, buildTimeline, SCENES, CAPTIONS, DURATION } from './src/timeline.js';

const params = new URLSearchParams(location.search);
const IS_PHONE = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900;
const QUALITY = params.get('quality') || (IS_PHONE ? 'medium' : 'high'); // high | medium | low
const $ = (s) => document.querySelector(s);

// ------------------------------------------------------------------ renderer
const stage = $('#stage');
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = QUALITY !== 'low';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.05, 1200);

const studio = buildStudio(renderer, scene);
const M = createMaterials();
const B = buildBlender(M);
scene.add(B.root);
// cool light at the far end of the shaft tunnel (light leaking in through the guard vents)
const tunnelLight = new THREE.PointLight(0x9fd8ff, 0, 10, 2);
tunnelLight.position.set(0, -16.2, 0);
B.model.add(tunnelLight);

// Flow loop for the jar, in blender-local (r, y): blade -> vents -> wall -> surface -> down the shaft -> under the bell
const LOOP = [[0.6, -20.0], [0.9, -18.0], [2.2, -17.3], [3.6, -17.0], [5.3, -17.6], [6.0, -15.5], [6.0, -11.0], [5.5, -8.3], [3.6, -7.9],
  [1.8, -9.4], [2.0, -12.8], [3.0, -14.8], [4.4, -18.6], [3.6, -20.1], [1.8, -20.3]];
const F = buildFluid(M, LOOP);
scene.add(F.group);

// x-ray copies of the housing materials (so steel elsewhere stays opaque)
const ghostMats = new Map();
B.ghost.forEach((m) => {
  if (!ghostMats.has(m.material)) ghostMats.set(m.material, m.material.clone());
  m.material = ghostMats.get(m.material);
});

// ------------------------------------------------------------------ post-processing
const rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: QUALITY === 'low' ? 0 : 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
let gtao = null;
if (QUALITY === 'high') {
  gtao = new GTAOPass(scene, camera, 16, 16);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.9;
  gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 1.5, scale: 1.0, samples: 12 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  composer.addPass(gtao);
}
const bokeh = new BokehPass(scene, camera, { focus: 60, aperture: 0.0003, maxblur: 0.008 });
if (QUALITY !== 'low') composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// The DOF depth pass must ignore transparent / overlay objects (glass, x-ray housing, glow effects)
const depthHide = [];
const origBokehRender = bokeh.render.bind(bokeh);
bokeh.render = (...a) => {
  const hidden = [];
  for (const o of depthHide) if (o.visible && (!o.userData.hideIf || o.userData.hideIf())) { o.visible = false; hidden.push(o); }
  origBokehRender(...a);
  hidden.forEach((o) => { o.visible = true; });
};
scene.traverse((o) => {
  const mat = o.material;
  if (!mat || o === F.liquid) return;
  if (mat.isShaderMaterial && mat.blending === THREE.AdditiveBlending) depthHide.push(o);
});
F.group.children.forEach((c) => { if (!c.isInstancedMesh) depthHide.push(c); });
B.ghost.forEach((m) => { m.userData.hideIf = () => state.housing < 0.6; depthHide.push(m); });

const pointMats = [];
scene.traverse((o) => { if (o.isPoints && o.material.uniforms?.uScale) pointMats.push(o.material); });

// ------------------------------------------------------------------ controls (free camera)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.enabled = false;
controls.minDistance = 3; controls.maxDistance = 180;

// ------------------------------------------------------------------ labels
const labels = new Labels($('#labels'));
const A = B.anchors;
const L = (o) => labels.add(o);
// Scene 2 – exploded view (8 major assemblies)
L({ anchor: A.housing, num: 1, title: 'Outer housing', sub: 'Stainless sleeve + soft-touch grip, two halves', group: 'explode' });
L({ anchor: A.motor, num: 2, title: 'Electric motor', sub: 'Universal (brushed AC/DC) motor', group: 'explode', side: 'left' });
L({ anchor: A.shaft, num: 3, title: 'Motor shaft', sub: 'With splined drive coupling', group: 'explode', side: 'left' });
L({ anchor: A.electrical, num: 4, title: 'Electrical connections', sub: 'Mains leads, board, motor wiring', group: 'explode', side: 'right' });
L({ anchor: A.buttons, num: 5, title: 'Speed control buttons', sub: 'I = normal · II = turbo', group: 'explode', side: 'left' });
L({ anchor: A.blendShaft, num: 6, title: 'Stainless blending shaft', sub: 'Detachable, inner drive rod', group: 'explode', side: 'right' });
L({ anchor: A.guard, num: 7, title: 'Protective blade guard', sub: 'Vented bell', group: 'explode', side: 'right' });
L({ anchor: A.bladesStatic, num: 8, title: 'Rotating blades', sub: '4-wing S-blade', group: 'explode', side: 'left' });
// Scene 3 – motor anatomy
L({ anchor: A.stator, title: 'Stator core', sub: 'Laminated steel, 2 poles', group: 'motorA', side: 'right' });
L({ anchor: A.fieldCoil, title: 'Field windings', sub: 'Copper coils around each pole', group: 'motorA', side: 'right', dy: 40 });
L({ anchor: A.rotor, title: 'Rotor (armature)', sub: 'Slotted laminated core', group: 'motorA', side: 'left' });
L({ anchor: A.frame, title: 'Motor frame & bearings', sub: 'Brackets, tie bolts, 2 bearings', group: 'motorA', side: 'left', dy: -60 });
L({ anchor: A.commutator, title: 'Commutator', sub: '12 copper bars', group: 'motorB', side: 'right', dy: -50 });
L({ anchor: A.brushes, title: 'Carbon brushes', sub: 'Spring-loaded, in brass holders', group: 'motorB', side: 'left' });
L({ anchor: A.armWinding, title: 'Armature windings', group: 'motorB', side: 'right', dy: 10 });
L({ anchor: A.fan, title: 'Cooling fan', sub: 'On the motor shaft', group: 'motorB', side: 'left', dy: 30 });
L({ anchor: A.energy, title: 'Current path', sub: 'Board → field coil → brush → armature → brush → field coil', group: 'visMotor', kind: 'vis', side: 'left', dy: -70 });
L({ anchor: A.fieldN, title: 'N', sub: 'Magnetic field', group: 'visMotor', kind: 'vis', side: 'right', dx: 40, dy: 70 });
L({ anchor: A.fieldS, title: 'S', group: 'visMotor', kind: 'vis', side: 'left', dx: 40, dy: 70 });
L({ anchor: A.torque, title: 'Rotation', sub: 'Torque on the armature', group: 'visMotor', kind: 'vis', side: 'left', dy: -40 });
// Scene 4
L({ anchor: A.coupling, title: 'Splined drive coupling', sub: 'Motor shaft → blending shaft', group: 'coupling', side: 'right' });
L({ anchor: A.collar, title: 'Twist-lock collar', group: 'coupling', side: 'left', dy: 50 });
L({ anchor: A.rod, title: 'Inner drive rod', sub: 'Turns at motor speed', group: 'tube', side: 'right', dx: 120, dy: 120 });
L({ anchor: A.bushing, title: 'Lower bushing', sub: 'Supports & seals the rod', group: 'tube', side: 'left', dx: 60, dy: 60 });
L({ anchor: A.guard, title: 'Blade guard (bell)', group: 'macro', side: 'right', dy: -80 });
L({ anchor: A.vent, title: 'Vent windows', sub: 'Let liquid escape outward', group: 'macro', side: 'left', dy: -60 });
L({ anchor: A.blades, title: '4-wing S-blade', group: 'macro', side: 'right', dy: 70 });
const rpmLabel = labels.items.length;
L({ anchor: A.rpm, title: 'Rotation direction', sub: '≈ 0 RPM', group: 'macro', kind: 'vis', side: 'left', dy: 60 });
// Scene 5 – flow (anchors in world space)
const flowAnchor = (x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); return o; };
L({ anchor: flowAnchor(0.7, JAR.blenderY - 19.6, 0), title: 'Suction', sub: 'Drawn up into the bell', group: 'fluid', kind: 'vis', side: 'left', dx: 140, dy: 50 });
L({ anchor: flowAnchor(4.6, JAR.blenderY - 17.2, 0), title: 'Radial outflow', sub: 'Thrown out through the vents', group: 'fluid', kind: 'vis', side: 'right', dy: 30 });
L({ anchor: flowAnchor(-6.0, JAR.blenderY - 12, 0), title: 'Circulation loop', sub: 'Up the wall, down the center', group: 'fluid', kind: 'vis', side: 'left' });
L({ anchor: flowAnchor(3.5, JAR.blenderY - 10, 3), title: 'Ingredients', sub: 'Fruit, greens, ice', group: 'fluid', side: 'right', dy: -50 });

// ------------------------------------------------------------------ state + timeline
const state = createState();
const tl = buildTimeline(state);
const sound = new Sound();
let started = false;
let freeCam = false;
let bladeAngle = 0;
const VISUAL_REV_PER_SEC = 5.5; // displayed rotation at full speed (real: ~200 rev/s)

// ------------------------------------------------------------------ sizing (fixed 16:9, max 1920x1080 backing store)
let W = 1, H = 1;
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  W = Math.min(vw, vh * 16 / 9); H = W * 9 / 16;
  stage.style.width = `${W}px`; stage.style.height = `${H}px`;
  const pr = Math.min(window.devicePixelRatio || 1, 1920 / W, IS_PHONE ? 1.5 : 4) * (QUALITY === 'low' ? 0.75 : 1);
  renderer.setPixelRatio(pr);
  renderer.setSize(W, H, false);
  composer.setPixelRatio(pr);
  composer.setSize(W, H);
  bloom.resolution.set(W * pr / 2, H * pr / 2);
  camera.aspect = 16 / 9; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ apply state to the scene
const EXPLODE_ORDER = ['cable', 'buttons', 'electrical', 'housingR', 'housingL', 'motor', 'shaft', 'blendShaft', 'guard', 'blades'];
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const target = new THREE.Vector3();

function applyCamera() {
  const c = state.cam;
  target.set(c.tx, c.ty, c.tz);
  camera.position.set(
    c.tx + c.dist * Math.cos(c.el) * Math.sin(c.az),
    c.ty + c.dist * Math.sin(c.el),
    c.tz + c.dist * Math.cos(c.el) * Math.cos(c.az));
  camera.lookAt(target);
  if (camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
}

function applyScene(dt, time) {
  const S = state;
  B.root.position.y = S.blenderY;
  B.root.rotation.y = S.spin;
  EXPLODE_ORDER.forEach((name, i) => {
    const p = B.parts[name];
    const e = smooth(S.explode * 1.45 - i * 0.05);
    p.position.copy(p.userData.explode).multiplyScalar(e);
  });
  // x-ray housing
  for (const mat of ghostMats.values()) {
    const o = S.housing;
    const tr = o < 0.999;
    if (mat.transparent !== tr) { mat.transparent = tr; mat.needsUpdate = true; }
    mat.opacity = o; mat.depthWrite = o > 0.6;
  }
  B.ghost.forEach((m) => { m.castShadow = S.housing > 0.6; });
  // cut-away
  const c = 6 * (1 - S.cut);
  B.clipPlanes.forEach((pl) => { pl.constant = c; });
  // rotation (one angle: blade and motor are directly coupled)
  bladeAngle += dt * S.speed * VISUAL_REV_PER_SEC * Math.PI * 2;
  B.spins.forEach((g) => { g.rotation.y = bladeAngle; });
  B.trail.material.uniforms.uAngle.value = bladeAngle;
  B.trail.material.uniforms.uOpacity.value = S.trail * Math.min(1, S.speed * 1.6) * 0.75;
  B.trail.visible = S.trail > 0.001;
  B.rpmArrow.userData.setOpacity(S.rpm, time);
  B.torqueArrow.userData.setOpacity(S.torque, time);
  B.field.visible = S.field > 0.001;
  B.field.children.forEach((t) => { t.material.uniforms.uOpacity.value = S.field * 0.8; t.material.uniforms.uTime.value = time; });
  B.energy.update(dt, time, S.energy);
  // fluid
  F.update(dt, time, { jar: S.jar, speedNorm: S.speed, mix: S.mix, flowArrows: S.flowArrows, flowEngage: S.flowEngage }, camera);
  // lights / glow
  studio.camLight.position.copy(camera.position);
  studio.camLight.intensity = S.camLight * 0.9;
  tunnelLight.intensity = S.camLight * 3;
  scene.environmentIntensity = 0.32 * (1 - 0.5 * S.camLight);
  studio.key.intensity = 2.4 + S.glow * 2.5;
  studio.rings[0].material.opacity = 0.9 + S.glow;
  // inside the guard / macro orbit: polished steel fills the frame, so keep bloom off it
  bloom.strength = (0.4 + S.glow * 0.9) * (1 - 0.8 * S.macroDamp);
  bloom.threshold = 0.9 + 0.5 * S.macroDamp;
  studio.top.intensity = 1.4 * (1 - 0.7 * S.macroDamp);
  studio.rimWarm.intensity = 1.1 * (1 - 0.8 * S.macroDamp);
  studio.rimBlue.intensity = 2.2 * (1 - 0.4 * S.macroDamp);
  // DOF
  bokeh.uniforms.focus.value = camera.position.distanceTo(target);
  bokeh.uniforms.aperture.value = S.aperture;
  // AO only where it is valid (no clipping, no transparent/overlay geometry on screen)
  if (gtao) gtao.enabled = S.cut + S.energy + S.field + S.torque + S.trail + S.rpm + S.jar + S.camLight < 0.001 && S.housing > 0.99;
  const ppu = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  pointMats.forEach((m) => { m.uniforms.uScale.value = ppu; });
}

// ------------------------------------------------------------------ HUD
const fadeEl = $('#fade');
const captionEl = $('#caption');
const chipEl = $('#sceneChip');
const legendEl = $('#legend');
const progressFill = $('#progressFill');
const timeEl = $('#time');
const playBtn = $('#play');
let lastCaption = null, lastScene = -1;

const navEl = $('#sceneNav');
SCENES.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 'nav'; b.title = s.name; b.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span><em>${s.name}</em>`;
  b.addEventListener('click', () => { if (!started) begin(); tl.seek(s.t + 0.001); bladeAngle = 0; });
  navEl.appendChild(b);
});
const ticks = $('#ticks');
SCENES.forEach((s) => { const t = document.createElement('i'); t.style.left = `${(s.t / DURATION) * 100}%`; ticks.appendChild(t); });

function updateHUD() {
  const t = tl.time();
  fadeEl.style.opacity = state.fade;
  const cap = CAPTIONS.find(([a, b]) => t >= a && t < b);
  const html = cap ? cap[2] : '';
  if (html !== lastCaption) {
    lastCaption = html;
    captionEl.classList.remove('show');
    if (html) { captionEl.innerHTML = html; void captionEl.offsetWidth; captionEl.classList.add('show'); }
  }
  let si = 0; SCENES.forEach((s, i) => { if (t >= s.t) si = i; });
  if (si !== lastScene) {
    lastScene = si;
    chipEl.innerHTML = `<span>${String(si + 1).padStart(2, '0')}</span>${SCENES[si].name}`;
    navEl.querySelectorAll('.nav').forEach((b, i) => b.classList.toggle('active', i === si));
  }
  chipEl.style.opacity = (si === 0 || si === 6) ? 0 : 1;
  const visOn = Math.max(state.lab.visMotor, state.lab.fluid, state.lab.macro);
  legendEl.style.opacity = visOn;
  progressFill.style.width = `${(t / DURATION) * 100}%`;
  const fmt = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  timeEl.textContent = `${fmt(t)} / ${fmt(DURATION)}`;
  // live RPM readout (real-world figure the motion represents)
  const rpm = Math.round((state.speed * 13000) / 100) * 100;
  const rl = labels.items[rpmLabel].el.querySelector('.s');
  if (rl) rl.textContent = `≈ ${rpm.toLocaleString('en-US')} RPM (slowed for display)`;
}

// ------------------------------------------------------------------ main loop
const clock = new THREE.Clock();
let elapsed = 0;
function frame() {
  requestAnimationFrame(frame);
  const raw = Math.min(clock.getDelta(), 1 / 20);
  const playing = started && !tl.paused();
  const dt = playing ? raw : 0;
  elapsed += dt;
  if (freeCam) controls.update(); else applyCamera();
  applyScene(dt, elapsed);
  labels.update(camera, W, H, state.lab);
  updateHUD();
  sound.update(state.speed, playing, state.fade);
  composer.render(raw);
}
applyCamera();
frame();

// ------------------------------------------------------------------ UI wiring
function begin() {
  if (started) return;
  started = true;
  $('#start').classList.add('hidden');
  sound.start();
  tl.play(0);
  setPlayIcon();
}
function setPlayIcon() { playBtn.classList.toggle('paused', tl.paused() || tl.progress() >= 1); }
function togglePlay() {
  if (!started) return begin();
  if (tl.progress() >= 1) { tl.restart(); bladeAngle = 0; } else tl.paused(!tl.paused());
  setPlayIcon();
}
tl.eventCallback('onComplete', setPlayIcon);

$('#startBtn').addEventListener('click', begin);
playBtn.addEventListener('click', togglePlay);
$('#restart').addEventListener('click', () => { if (!started) return begin(); tl.restart(); bladeAngle = 0; setPlayIcon(); });
$('#fullscreen').addEventListener('click', () => {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.()?.catch?.(() => {}); } catch (e) { /* not available (e.g. iPhone) */ }
});
const orbitBtn = $('#orbit');
function setFreeCam(on) {
  freeCam = on;
  controls.enabled = on;
  orbitBtn.classList.toggle('on', on);
  stage.classList.toggle('freecam', on);
  if (on) { controls.target.copy(target); controls.update(); }
}
orbitBtn.addEventListener('click', () => setFreeCam(!freeCam));
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => { soundBtn.classList.toggle('muted', sound.toggle()); });
$('#hideUi').addEventListener('click', () => document.body.classList.toggle('clean'));

// scrubbing
const bar = $('#progress');
let scrubbing = false;
const seekFromEvent = (e) => {
  const r = bar.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  if (!started) begin();
  tl.seek(x * DURATION);
};
bar.addEventListener('pointerdown', (e) => { scrubbing = true; bar.setPointerCapture(e.pointerId); seekFromEvent(e); });
bar.addEventListener('pointermove', (e) => { if (scrubbing) seekFromEvent(e); });
bar.addEventListener('pointerup', () => { scrubbing = false; });

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'r' || e.key === 'R') $('#restart').click();
  else if (e.key === 'f' || e.key === 'F') $('#fullscreen').click();
  else if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('clean');
  else if (e.key === 'o' || e.key === 'O') setFreeCam(!freeCam);
  else if (e.key === 'm' || e.key === 'M') soundBtn.click();
  else if (/^[1-7]$/.test(e.key)) navEl.children[+e.key - 1].click();
});

// auto-hide controls when the mouse is idle
let idleTimer;
const wake = () => { document.body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => document.body.classList.add('idle'), 2600); };
window.addEventListener('pointermove', wake); window.addEventListener('pointerdown', wake); wake();

if (params.has('autostart')) begin();
if (params.has('t')) { begin(); tl.seek(parseFloat(params.get('t'))); if (params.has('pause')) { tl.pause(); setPlayIcon(); } }
window.__app = { tl, state, seek: (t) => tl.seek(t), pause: () => tl.pause(), B, bloom, studio, scene };
