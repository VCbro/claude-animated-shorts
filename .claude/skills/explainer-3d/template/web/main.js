// "How a water motor works" — a 9:16 explainer short. Everything on screen is a pure function of
// time t (seconds), so any frame can be rendered on its own: window.__renderAt(t) for the
// frame-exact recorder, ?t=12.3 for a still, otherwise it plays in real time.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { applyTheme, themeName } from './themes.js';
import { Labels } from './explode.js';
import { buildPump, buildSite, DIM } from './pump.js';

const params = new URLSearchParams(location.search);
const { VOICE } = await import(params.get('lang') === 'hi' ? './lines_hi.js' : './lines.js');
const TX = VOICE.text || {};
if (TX.font) document.documentElement.classList.add('lang-' + TX.font);
if (TX.title) document.getElementById('title').innerHTML = TX.title;
const W = 1080, H = 1920;

// ----------------------------------------------------------------------------- timing helpers
const LINE = Object.fromEntries(VOICE.lines.map((l) => [l.id, l]));
const T = (id) => LINE[id].start;
const TE = (id) => LINE[id].end;
const norm = (s) => s.toLowerCase().replace(/[^a-z']/g, '');
function wt(id, word, nth = 0) {          // time of a word in a line
  if (LINE[id].cues && word in LINE[id].cues) return LINE[id].cues[word];
  const ws = LINE[id].words.filter((w) => norm(w.w) === norm(word));
  if (!ws.length) throw new Error(`no word ${word} in ${id}`);
  return ws[Math.min(nth, ws.length - 1)].t;
}
const END = VOICE.duration + 1.4;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const ramp = (t, a, b) => sstep((t - a) / (b - a));
const win = (t, a, b, f = 0.25) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));   // fade in at a, out at b
const lerp = (a, b, k) => a + (b - a) * k;

// ----------------------------------------------------------------------------- renderer + scene
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
canvas.style.width = '100%'; canvas.style.height = '100%';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
const hemi = new THREE.HemisphereLight('#cfe6ff', '#26323f', 0.9); scene.add(hemi);
const key = new THREE.DirectionalLight('#fff3e2', 2.6);
key.position.set(1.6, 3.4, 2.4); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -1.9, right: 1.9, top: 2.2, bottom: -1.6, near: 0.5, far: 9 });
key.shadow.bias = -0.0005; key.shadow.normalBias = 0.01; key.shadow.radius = 3;
scene.add(key);
const rim = new THREE.DirectionalLight('#7fc4ff', 1.2); rim.position.set(-2, 1.5, -1.5); scene.add(rim);
const THEME = themeName();
applyTheme(THEME, { renderer, scene, hemi, key, rim, THREE });

const camera = new THREE.PerspectiveCamera(36, W / H, 0.01, 40);

const P = buildPump();
scene.add(P.root);
const S = buildSite();
scene.add(S.site);

// ----------------------------------------------------------------------------- spin (rotor + impeller angle)
// angular speed in rad/s as a function of time, integrated into a table so the angle is exact at any t
const tOn = 0.55;
function omega(t) {
  let w = 10 * ramp(t, tOn, tOn + 1.1);                               // switched on in the hook
  const st = T('stator'), drag = wt('field', 'drags');
  w *= 1 - ramp(t, st - 0.2, st + 0.5);                               // stop to explain from scratch
  w += 13 * ramp(t, drag - 0.1, drag + 1.6) * (1 - ramp(t, T('impeller') - 0.2, T('impeller') + 0.8));
  w += 8.5 * ramp(t, T('impeller') - 0.2, T('impeller') + 0.8);
  w += 3 * ramp(t, T('outro'), T('outro') + 1);
  return w;
}
function omegaField(t) {                                              // the rotating magnetic field
  return 7 * ramp(t, T('field') - 0.1, T('field') + 0.8) * (1 - ramp(t, T('impeller') + 0.5, T('impeller') + 1.5));
}
const DT = 1 / 600, NT = Math.ceil((END + 1) / DT);
const thetaTab = new Float32Array(NT + 1), phiTab = new Float32Array(NT + 1);
for (let i = 1; i <= NT; i++) {
  const t = (i - 0.5) * DT;
  thetaTab[i] = thetaTab[i - 1] - omega(t) * DT;      // negative: clockwise seen from the inlet
  phiTab[i] = phiTab[i - 1] - omegaField(t) * DT;
}
const look = (tab, t) => { const f = clamp(t / DT, 0, NT - 1), i = Math.floor(f); return lerp(tab[i], tab[i + 1], f - i); };
const theta = (t) => look(thetaTab, t), phi = (t) => look(phiTab, t);

// ----------------------------------------------------------------------------- camera shots
// each shot is a list of keys {t, l: look-at, d: direction to the camera, r: distance, fov}; they follow a
// C1 Hermite spline in time (zero velocity at the shot's ends), and a new shot is a hard cut
const k = (t, l, d, r, fov = 36) => ({ t, v: [...l, ...d, r, fov] });
const PUMP = [-0.1, 0.03, 0], MOTOR = [-0.19, 0.0, 0], IMP = [0.085, 0.03, 0.03], TANK = [0.02, 2.45, -0.5];
const SHOTS = [
  [ // hook + question: from the pump up the pipe to the tank, then back down
    k(0, PUMP, [0.62, 0.18, 0.78], 1.75, 38),
    k(1.6, [0.05, 0.75, 0.1], [0.62, 0.22, 0.76], 2.3, 40),
    k(T('question') - 0.1, TANK, [0.6, 0.32, 0.74], 2.7, 40),
    k(T('question') + 1.3, [0.02, 2.42, -0.5], [0.52, 0.3, 0.8], 2.5, 40),
    k(T('two'), PUMP, [0.55, 0.3, 0.78], 1.8, 36),
  ],
  [ // two machines on one shaft
    k(T('two'), PUMP, [0.55, 0.3, 0.78], 1.8, 36),
    k(T('stator') - 0.05, [-0.12, 0.03, 0], [0.15, 0.32, 0.94], 1.7, 36),
  ],
  [ // the stator, then round to the back for the rotating field
    k(T('stator'), MOTOR, [0.3, 0.38, 0.88], 1.1, 36),
    k(T('field') + 0.2, MOTOR, [0.0, 0.34, 0.94], 1.05, 36),
    k(T('field') + 2.2, MOTOR, [-0.9, 0.22, 0.38], 1.0, 36),
    k(T('impeller') - 0.05, MOTOR, [-0.95, 0.2, 0.25], 0.95, 36),
  ],
  [ // the shaft carries the spin into the pump; the casing opens
    k(T('impeller'), [-0.05, 0.03, 0], [-0.2, 0.35, 0.92], 1.45, 36),
    k(wt('impeller', 'blades') - 0.2, [0.07, 0.06, 0], [0.5, 0.38, 0.78], 1.15, 38),
    k(T('eye') - 0.1, IMP, [0.75, 0.3, 0.6], 1.0, 42),
  ],
  [ // inside the pump, looking into the inlet
    k(T('eye'), IMP, [0.75, 0.3, 0.6], 1.0, 42),
    k(T('fling'), [0.085, 0.03, 0.02], [0.95, 0.14, 0.28], 0.78, 46),
    k(T('volute') - 0.05, [0.085, 0.03, 0.03], [0.96, 0.1, 0.25], 0.8, 48),
    k(T('push') - 0.05, [0.085, 0.07, 0.05], [0.96, 0.12, 0.2], 0.95, 48),
  ],
  [ // up the delivery pipe to the tank
    k(T('push'), [0.085, 0.07, 0.05], [0.96, 0.12, 0.2], 0.95, 48),
    k(T('push') + 0.9, [0.08, 0.95, 0.1], [0.72, 0.18, 0.67], 1.8, 42),
    k(T('prime') - 0.05, TANK, [0.6, 0.32, 0.74], 2.6, 40),
  ],
  [ // priming: air versus water
    k(T('prime'), IMP, [0.82, 0.32, 0.47], 0.95, 46),
    k(T('outro') - 0.05, [0.085, 0.03, 0.03], [0.94, 0.16, 0.3], 0.85, 48),
  ],
  [ // outro hero orbit
    k(T('outro'), PUMP, [0.62, 0.3, 0.73], 1.85, 38),
    k(END, PUMP, [-0.35, 0.33, 0.88], 1.8, 38),
  ],
];
function hermite(keys, t, get) {
  if (t <= keys[0].t) return get(keys[0]);
  if (t >= keys[keys.length - 1].t) return get(keys[keys.length - 1]);
  let i = 0; while (t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], h = b.t - a.t, u = (t - a.t) / h;
  const va = get(a), vb = get(b);
  const tan = (j) => (j <= 0 || j >= keys.length - 1) ? va.map(() => 0)
    : get(keys[j + 1]).map((x, c) => (x - get(keys[j - 1])[c]) / (keys[j + 1].t - keys[j - 1].t));
  const ma = tan(i), mb = tan(i + 1);
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return va.map((x, c) => h00 * x + h10 * h * ma[c] + h01 * vb[c] + h11 * h * mb[c]);
}
function setCamera(t) {
  let s = SHOTS[0], si = 0;
  SHOTS.forEach((sh, i) => { if (t >= sh[0].t) { s = sh; si = i; } });
  const v = hermite(s, t, (q) => q.v);
  const d = new THREE.Vector3(v[3], v[4], v[5]).normalize();
  camera.position.set(v[0], v[1], v[2]).addScaledVector(d, v[6]);
  camera.lookAt(v[0], v[1], v[2]);
  camera.fov = v[7]; camera.updateProjectionMatrix();
  return si;
}

// ----------------------------------------------------------------------------- flow particles
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
function particles(n, size) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const m = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, opacity: 0.92, toneMapped: false });
  const im = new THREE.InstancedMesh(g, m, n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.setColorAt(0, new THREE.Color());
  im.frustumCulled = false; im.renderOrder = 5;
  scene.add(im);
  return { im, n, size, seeds: Array.from({ length: n }, () => [rnd(), rnd(), rnd(), rnd(), rnd()]) };
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
function put(sys, i, x, y, z, size, r, g, b) {
  _p.set(x, y, z); _s.setScalar(size);
  sys.im.setMatrixAt(i, _m.compose(_p, _q, _s));
  sys.im.setColorAt(i, _c.setRGB(r, g, b));
}
const hide = (sys, i) => { sys.im.setMatrixAt(i, _m.makeScale(0, 0, 0)); };

// A: the whole route, sump -> pump -> roof tank, used when the casing is closed
const routeA = new THREE.CurvePath();
for (const c of S.suction.curves) routeA.add(c);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
routeA.add(new THREE.LineCurve3(v3(0.215, 0, 0), v3(0.09, 0, 0)));
routeA.add(new THREE.LineCurve3(v3(0.09, 0, 0), v3(DIM.ductX, 0, DIM.ductZ)));
routeA.add(new THREE.LineCurve3(v3(DIM.ductX, 0, DIM.ductZ), v3(DIM.ductX, DIM.H + 0.06, DIM.ductZ)));
for (const c of S.delivery.curves) routeA.add(c);
const LA = routeA.getLength();
const lens = routeA.getCurveLengths();
const sSuctionEnd = lens[S.suction.curves.length - 1];
const sInsideEnd = lens[S.suction.curves.length + 2];
const sTank = LA;
const SPA = 600;
const A = particles(SPA, 0.0085);
const flowA = { v: 1.35, t0: tOn + 0.5 };
const tankArrive = flowA.t0 + sTank / flowA.v;
const sampA = [];  // precomputed points along the route (fast lookup)
const NSA = 3000;
for (let i = 0; i <= NSA; i++) { const s = i / NSA; sampA.push(routeA.getPointAt(s), routeA.getTangentAt(s)); }
function pointA(sNorm) {
  const f = clamp(sNorm) * NSA, i = Math.min(NSA - 1, Math.floor(f)), u = f - i;
  const a = sampA[i * 2], b = sampA[i * 2 + 2];
  return [lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u), sampA[i * 2 + 1]];
}
const tmpV = new THREE.Vector3();
function updateA(t, vis, hideInside) {
  for (let i = 0; i < SPA; i++) {
    const sd = A.seeds[i];
    const run = flowA.v * (t - flowA.t0) - sd[0] * LA;
    if (vis <= 0.001 || run < 0) { hide(A, i); continue; }
    const s = run % LA;
    if (hideInside && s > sSuctionEnd - 0.05 && s < sInsideEnd + 0.02) { hide(A, i); continue; }
    if (s > sSuctionEnd && s < sInsideEnd) { hide(A, i); continue; }        // inside the closed casing
    const [x, y, z, tg] = pointA(s / LA);
    // a random offset across the pipe
    tmpV.set(sd[1] - 0.5, sd[2] - 0.5, sd[3] - 0.5); tmpV.addScaledVector(tg, -tmpV.dot(tg)).normalize().multiplyScalar(0.021 * Math.sqrt(sd[4]));
    const fade = clamp((sTank - s) / 0.15);
    const b = 0.75 + 0.25 * sd[4];
    put(A, i, x + tmpV.x, y + tmpV.y, z + tmpV.z, A.size * (0.75 + 0.5 * sd[1]) * vis * fade, 0.25 * b, 0.62 * b, 1.0 * b);
  }
  A.im.instanceMatrix.needsUpdate = true; A.im.instanceColor.needsUpdate = true;
}

// B: inside the open pump, eye -> vanes -> volute -> throat -> up the pipe
const SPB = 480;
const B = particles(SPB, 0.0048);
const { Ri, R } = DIM;
const pos = (x, r, a) => [x, r * Math.sin(a), -r * Math.cos(a)];   // world position from (x, radius, screen angle)
const VPITCH = Math.PI * 2 / 6, KV = 1.05, RIN = 0.026;
function updateB(t, vis, tStart, mode) {
  const rate = 0.42;
  for (let i = 0; i < SPB; i++) {
    const [seed, lane, lane2, sa, sz] = B.seeds[i];
    const cyc = seed + rate * (t - tStart);
    if (vis <= 0.001 || cyc < 1) { hide(B, i); continue; }
    const s = cyc % 1;
    let p, col, size = B.size * (0.75 + 0.5 * sz);
    if (mode === 'air') {
      // air: churns with the impeller and goes nowhere
      const r = 0.03 + (Ri - 0.035) * lane, a = theta(t) + sa * Math.PI * 2 + 0.25 * Math.sin(t * 3 + seed * 20);
      p = pos(0.064 + 0.032 * lane2, r, a);
      const fl = 0.7 + 0.3 * Math.sin(t * 9 + sa * 30);
      col = [0.85 * fl, 0.9 * fl, 0.95 * fl]; size *= 1.5;
    } else if (s < 0.16) {                                  // inflow along the axis into the eye
      const kk = s / 0.16, r = 0.028 * Math.sqrt(lane);
      p = pos(lerp(0.2, 0.075, kk), r, sa * Math.PI * 2 + kk * 1.5);
      col = [0.35, 0.72, 1.0]; size *= ramp(kk, 0, 0.5);
    } else if (s < 0.4) {                                   // riding the vanes outward
      const kk = (s - 0.16) / 0.24, r = lerp(RIN + 0.004, Ri, Math.pow(kk, 0.85));
      const ch = Math.floor(sa * 6) * VPITCH + VPITCH * (0.3 + 0.4 * lane);
      const a = theta(t) + ch + KV * (r - RIN) / (Ri - RIN);
      p = pos(0.066 + 0.026 * lane2, r, a);
      const sp = 0.6 + 0.6 * kk;                            // faster near the tip: brighter
      col = [0.45 * sp + 0.25, 0.8 * sp + 0.15, 1.0 * sp + 0.1];
    } else if (s < 0.82) {                                  // round the volute, slowing
      const kk = (s - 0.4) / 0.42;
      const tExit = t - (s - 0.4) / rate;
      const ch = Math.floor(sa * 6) * VPITCH + VPITCH * (0.3 + 0.4 * lane);
      const aExit = theta(tExit) + ch + KV;
      let bExit = ((Math.PI - aExit) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const b = lerp(bExit, Math.PI * 2, Math.pow(kk, 0.8));
      const r = lerp(Ri + 0.004, Ri + 0.004 + lane * (R(b) - Ri - 0.012), Math.min(1, kk * 3));
      p = pos(lerp(0.066 + 0.026 * lane2, DIM.x0 + 0.008 + 0.054 * lane2, Math.min(1, kk * 3)), r, Math.PI - b);
      const sp = 1 - kk;
      col = [lerp(0.08, 0.7, sp), lerp(0.35, 0.95, sp), lerp(0.95, 1.1, sp)];
    } else {                                                // up the throat and into the pipe
      const kk = (s - 0.82) / 0.18;
      const y = kk * 0.85;
      const squeeze = ramp(y, DIM.H - 0.04, DIM.H + 0.08) * 0.7;
      const u = lerp(-(DIM.R0 + 0.008 + lane * (DIM.R1 - DIM.R0 - 0.016)), -DIM.ductZ, squeeze);
      const x = lerp(DIM.x0 + 0.008 + 0.054 * lane2, DIM.ductX, squeeze);
      p = [x, y, -u];
      col = [0.08, 0.35, 0.95];
      size *= 1 - ramp(y, 0.6, 0.85);
    }
    put(B, i, p[0], p[1], p[2], size * vis, col[0], col[1], col[2]);
  }
  B.im.instanceMatrix.needsUpdate = true; B.im.instanceColor.needsUpdate = true;
}

// power pulses along the cable
const PW = particles(14, 0.011);
const cablePts = S.cable.getSpacedPoints(400);
function updatePower(t, vis) {
  for (let i = 0; i < PW.n; i++) {
    const s = ((t * 0.9 + i / PW.n) % 1);
    const q = cablePts[Math.floor(s * 400)];
    put(PW, i, q.x, q.y, q.z, PW.size * vis * (0.7 + 0.3 * Math.sin(i)), 1.0, 0.85, 0.3);
  }
  PW.im.instanceMatrix.needsUpdate = true; PW.im.instanceColor.needsUpdate = true;
}

// ----------------------------------------------------------------------------- labels (exploded-view Labels)
const labels = new Labels(document.querySelector('.labels'), camera, canvas, { margin: 56, gap: 14 });
const allItems = [];
function label(obj, text, note, anchor, a, b) { const tr = TX.labels?.[text]; if (tr) [text, note] = tr; const it = labels.add(obj, text, { note, anchor }); it.win = [a, b]; allItems.push(it); }
label(P.parts.housing, 'Electric motor', 'makes the spin', [-0.2, 0.125, 0.04], wt('two', 'electric'), T('stator') - 0.2);
label(P.parts.casing, 'Pump', 'moves the water', [DIM.ductX, -0.12, 0.12], wt('two', 'pump'), T('stator') - 0.2);
label(P.root, 'Shaft', 'one shaft for both', [-0.02, 0.014, 0], wt('two', 'shaft'), wt('two', 'electric') - 0.1);
label(P.parts.coils, 'Stator', 'copper windings', [-0.12, 0.095, 0.03], wt('stator', 'copper'), T('field') + 1.0);
label(P.root, 'Rotor', 'gets dragged round', [-0.24, 0.0, 0.066], wt('field', 'rotor'), T('impeller') - 0.2);
label(P.root, 'Impeller', 'curved blades', [0.1, 0.05, 0.06], wt('impeller', 'impeller'), T('eye') + 0.1);
label(P.root, 'Eye', 'water comes in', [0.1, 0, 0], wt('eye', 'eye'), T('fling') + 0.2);
label(P.parts.casing, 'Volute', 'spiral that widens', [0.12, -0.16, -0.06], wt('volute', 'volute'), T('push') - 0.1);
label(S.site, 'Delivery pipe', 'to the tank', [DIM.ductX, 0.7, DIM.ductZ + 0.03], wt('push', 'pipe'), T('prime') - 0.4);

// ----------------------------------------------------------------------------- captions + chips
const capEl = document.getElementById('cap');
const CHUNKS = [];
for (const l of VOICE.lines) {
  let cur = [];
  l.words.forEach((w, i) => {
    cur.push(w);
    const end = /[.,?!\u0964\u2014]$/.test(w.w) || cur.length === 3 || i === l.words.length - 1;
    if (end) { CHUNKS.push({ words: cur, line: l }); cur = []; }
  });
}
CHUNKS.forEach((c, i) => {
  c.t0 = c.words[0].t - 0.04;
  const next = CHUNKS[i + 1];
  c.t1 = next && next.line === c.line ? next.words[0].t - 0.04 : c.line.end + 0.15;
});
let capKey = '';
function updateCaptions(t) {
  const c = CHUNKS.find((c) => t >= c.t0 && t < c.t1);
  const key = c ? c.t0 : '';
  if (key !== capKey) {
    capKey = key;
    capEl.innerHTML = c ? c.words.map((w) => `<span>${w.w.replace(/[.,?!\u0964\u2014"]/g, '').replace(/</g, '')}</span>`).join(' ') : '';
  }
  if (!c) return;
  const spans = capEl.children;
  c.words.forEach((w, i) => {
    const on = t >= w.t - 0.03 && (i === c.words.length - 1 || t < c.words[i + 1].t - 0.03);
    spans[i].classList.toggle('on', on);
    const age = t - (w.t - 0.03);
    const pop = age >= 0 ? 1 + 0.14 * Math.exp(-age * 18) * Math.cos(age * 30) * (age < 0.3 ? 1 : 0) : 1;
    spans[i].style.transform = `scale(${pop.toFixed(3)})`;
    spans[i].style.opacity = age >= -0.02 ? 1 : 0.55;
  });
}
const titleEl = document.getElementById('title'), rpmEl = document.getElementById('rpm'), stateEl = document.getElementById('state'), chainEl = document.getElementById('chain');
const CHAIN = ['electricity', 'magnetism', 'spin', 'pressure'].map((c, i) => [(TX.chain || ['Electricity', 'Magnetism', 'Spin', 'Pressure'])[i], wt('outro', c)]);
chainEl.innerHTML = CHAIN.map(([w], i) => (i ? '<i>▼</i>' : '') + `<div>${w}</div>`).join('');
function show(el, o, y = 0) { el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.002 ? 'visible' : 'hidden'; if (y) el.style.translate = `0 ${y}px`; }
function updateOverlays(t) {
  const tt = win(t, -1, T('question') + 0.6, 0.35) + ramp(t, VOICE.duration + 0.2, VOICE.duration + 0.6);
  show(titleEl, tt, (1 - clamp(tt)) * 20);
  // rpm counter
  const r0 = wt('field', 'nearly');
  const rv = win(t, r0, T('impeller') - 0.2, 0.2);
  show(rpmEl, rv);
  if (rv > 0) rpmEl.innerHTML = `${Math.round(2900 * sstep((t - r0) / 1.6)).toLocaleString('en-US')}<small>RPM</small>`;
  // state chips
  let st = '', so = 0, colr = '#fff';
  const p0 = wt('volute', 'pressure');
  if (t > p0 - 0.3 && t < T('push') + 0.4) { st = TX.speed || 'Speed ➜ Pressure'; so = win(t, p0, T('push'), 0.2); colr = '#ffd23f'; }
  const a0 = wt('prime', 'air'), w0 = wt('prime', 'water');
  if (t > a0 - 0.3 && t < w0 - 0.05) { st = TX.air || 'Air ✗ no flow'; so = win(t, a0, w0 - 0.1, 0.15); colr = '#ff6b5e'; }
  if (t > w0 - 0.1 && t < T('outro') + 0.3) { st = TX.water || 'Water ✓ flows'; so = win(t, w0, T('outro'), 0.15); colr = '#5fe08a'; }
  stateEl.textContent = st; stateEl.style.color = colr; show(stateEl, so);
  // outro chain
  const cv = 1 - ramp(t, VOICE.duration - 0.1, VOICE.duration + 0.2);
  show(chainEl, t > CHAIN[0][1] - 0.3 ? cv : 0);
  [...chainEl.children].forEach((el) => {
    const idx = Math.floor([...chainEl.children].indexOf(el) / 2 + 0.5);
    const at = CHAIN[Math.min(idx, 3)][1] - (el.tagName === 'I' ? 0.12 : 0.05);
    const o = ramp(t, at, at + 0.18);
    el.style.opacity = o; el.style.transform = `scale(${lerp(0.7, 1, o)})`;
  });
  // labels: only the ones in their window, faded
  labels.items = allItems.filter((it) => win(t, it.win[0], it.win[1], 0.2) > 0.01);
  for (const it of allItems) if (!labels.items.includes(it)) { it.el.style.display = it.line.style.display = 'none'; }
  labels.update();
  for (const it of labels.items) { const o = win(t, it.win[0], it.win[1], 0.2); it.el.style.opacity = o; it.line.style.opacity = o; }
  updateCaptions(t);
}

// ----------------------------------------------------------------------------- per-frame state
const allXray = P.xrayMats.map((m) => ({ m, base: m.opacity }));
function setXray(v) {
  for (const { m } of allXray) {
    const on = v > 0.002;
    if (m.transparent !== on) { m.transparent = on; m.needsUpdate = true; }
    m.opacity = lerp(1, 0.1, v);
    m.depthWrite = v < 0.5;
  }
  P.parts.housing.traverse((o) => { if (o.isMesh) o.castShadow = v < 0.5; });
}
const casingHome = P.parts.casing.position.clone(), frontHome = P.parts.frontCover.position.clone();
const _dark = new THREE.Color('#3a2a22'), _red = new THREE.Color('#ff3b30'), _blue = new THREE.Color('#2f8bff'), _amber = new THREE.Color('#ff9a2e');

function renderAt(t) {
  // switch
  S.toggle.rotation.x = -0.5 + 1.0 * ramp(t, tOn - 0.12, tOn);
  S.toggle.material.emissive.set(t > tOn ? '#5a0d06' : '#000000');

  // spin
  const th = theta(t);
  P.spin.rotation.x = th;

  // x-ray of the motor shells
  const shaftW = wt('two', 'shaft'), elec = wt('two', 'electric');
  const xr = Math.max(win(t, shaftW - 0.15, elec - 0.1, 0.3), win(t, T('stator') - 0.1, T('impeller') + 0.7, 0.4));
  setXray(xr);
  P.shaftMat.emissive.copy(_amber).multiplyScalar(0.9 * win(t, shaftW - 0.1, elec - 0.1, 0.25) + 0.7 * win(t, T('impeller'), wt('impeller', 'pump'), 0.25));

  // stator coils: warm glow when power flows in, then a rotating north/south pattern
  const pw = win(t, wt('stator', 'power'), T('impeller') + 0.3, 0.3);
  const fieldOn = ramp(t, T('field') - 0.1, T('field') + 0.6);
  const ph = phi(t);
  for (const c of P.coilList) {
    const d = Math.cos(c.angle - (-ph) - Math.PI / 2);
    const n = Math.pow(Math.max(0, d), 3), s = Math.pow(Math.max(0, -d), 3);
    c.mat.emissive.setRGB(0, 0, 0)
      .lerp(_amber, pw * (1 - fieldOn) * 0.9)
      .add(_red.clone().multiplyScalar(n * fieldOn * pw * 3.2))
      .add(_blue.clone().multiplyScalar(s * fieldOn * pw * 3.2));
    c.mat.color.set('#d07a3a').lerp(_dark, fieldOn * pw * 0.75);
  }
  updatePower(t, win(t, tOn - 0.1, tOn + 1.2, 0.2) + win(t, wt('stator', 'power') - 0.1, T('field') + 0.5, 0.3));

  // pump opens: casing lifts, front cover slides off; casing comes back for the flow, cover returns in the outro
  const open0 = wt('impeller', 'pump');
  const lift = ramp(t, open0 - 0.1, open0 + 0.9) * (1 - ramp(t, T('eye') - 0.35, T('eye') + 0.55));
  P.parts.casing.position.set(casingHome.x, casingHome.y + 0.42 * lift, casingHome.z);
  const off = ramp(t, open0 - 0.1, open0 + 0.9) * (1 - ramp(t, T('outro') + 0.2, T('outro') + 1.4));
  P.parts.frontCover.position.set(frontHome.x + 0.5 * off, frontHome.y, frontHome.z);
  P.parts.frontCover.visible = off < 0.97;
  S.sucGroup.visible = off < 0.03;
  P.brass.emissive.copy(_amber).multiplyScalar(0.35 * win(t, wt('impeller', 'impeller') - 0.1, T('eye'), 0.3));

  // the delivery pipe stays; the site fades back while we are inside the pump

  // tank fills once the water arrives
  const lvl = 0.04 + 0.46 * clamp((t - tankArrive) / (END - tankArrive));
  S.tankWater.scale.y = lvl; S.tankWater.position.y = 2.29 + lvl / 2;

  // flow
  const flowInsideOn = t > T('eye') - 0.05 && t < T('prime') - 0.05;
  updateA(t, t < T('stator') - 0.3 || t > T('push') - 0.3 ? 1 : 0, flowInsideOn || (t > T('prime') && t < T('outro') + 1.2));
  const bVis = win(t, T('eye'), T('prime') - 0.1, 0.2) + win(t, T('prime') - 0.05, T('outro') + 0.6, 0.1);
  const mode = t > T('prime') - 0.1 && t < wt('prime', 'water') - 0.05 ? 'air' : 'water';
  const bStart = t < T('prime') - 0.1 ? T('eye') - 0.2 : (mode === 'air' ? T('prime') - 1 : wt('prime', 'water') - 0.6);
  updateB(t, bVis, bStart, mode);

  const shot = setCamera(t);
  S.house.visible = shot === 0 || shot === 5;
  renderer.render(scene, camera);
  updateOverlays(t);
}

window.__T = { lines: LINE, END, T };
window.__renderAt = renderAt;
window.__duration = END;

await document.fonts.ready;
if (params.has('record')) {
  renderAt(0);
  window.__ready = true;
} else if (params.has('t')) {
  renderAt(+params.get('t'));
  window.__ready = true;
} else {
  const t0 = performance.now();
  const loop = () => { renderAt(((performance.now() - t0) / 1000) % END); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__ready = true;
}
