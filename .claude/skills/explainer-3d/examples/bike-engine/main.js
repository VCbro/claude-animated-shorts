// "How a bike engine works": a 9:16 explainer short. Everything on screen is a pure function of
// time t (seconds): window.__renderAt(t) for the frame-exact recorder, ?t=12.3 for a still,
// otherwise it plays in real time.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Labels } from './explode.js';
import { EN, BK, pinY, camLiftAt, ROCK, VLEV, buildWorld, buildEngine, buildBike } from './scene.js';

const params = new URLSearchParams(location.search);
const { VOICE } = await import(params.get('lang') === 'hi' ? './lines_hi.js' : './lines.js');
const TX = VOICE.text || {};
if (TX.font) document.documentElement.classList.add('lang-' + TX.font);
if (TX.title) document.getElementById('title').innerHTML = TX.title;
const W = 1080, H = 1920;

// ----------------------------------------------------------------------------- timing helpers
const LINE = Object.fromEntries(VOICE.lines.map((l) => [l.id, l]));
const T = (id) => LINE[id].start;
const norm = (s) => s.toLowerCase().replace(/[^a-z']/g, '');
function wt(id, word, nth = 0) {
  if (LINE[id].cues && word in LINE[id].cues) return LINE[id].cues[word];
  const ws = LINE[id].words.filter((w) => norm(w.w) === norm(word));
  if (!ws.length) throw new Error(`no word ${word} in ${id}`);
  return ws[Math.min(nth, ws.length - 1)].t;
}
const END = VOICE.duration + 1.4;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const ramp = (t, a, b) => sstep((t - a) / (b - a));
const win = (t, a, b, f = 0.25) => ramp(t, a - f, a) * (1 - ramp(t, b, b + f));
const lerp = (a, b, k) => a + (b - a) * k;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;

// ----------------------------------------------------------------------------- renderer + scene
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
canvas.style.width = '100%'; canvas.style.height = '100%';
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
scene.fog = new THREE.Fog('#d9cfc0', 25, 160);
const WD = buildWorld(); scene.add(WD.group);
scene.add(new THREE.HemisphereLight('#cfe2ff', '#6b5a3e', 0.9));
const sun = new THREE.DirectionalLight('#ffe2b8', 3.0);
sun.position.copy(WD.sunDir).multiplyScalar(6).add(v3(0, 0.4, 0)); sun.target.position.set(-0.05, 0.4, 0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -1.4, right: 1.4, top: 1.4, bottom: -1.4, near: 2, far: 12 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.01; sun.shadow.radius = 3;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight('#bcd6ff', 0.8); rim.position.set(-3, 2.5, -4); scene.add(rim);
const closeL = new THREE.PointLight('#ffffff', 0, 1.2, 1.5); scene.add(closeL);

const camera = new THREE.PerspectiveCamera(34, W / H, 0.008, 700);

const E = buildEngine(); scene.add(E.EG);
const B = buildBike(E); scene.add(B.group);
E.EG.updateMatrixWorld(true);
const EW = (x, y, z = 0) => v3(x, y, z).applyMatrix4(E.EG.matrixWorld);
const burnL = new THREE.PointLight('#ffa040', 0, 0.22, 2); burnL.position.set(0, 0.168, 0.02); E.EG.add(burnL);

// ----------------------------------------------------------------------------- crank angle
// Fast while running, slow while the parts are named, one stroke at a time for the four strokes
// (each stroke eases in and out between dead centres), fast again, then a stroke per word at the end.
const FAST = 16;                           // rad/s, ~2.5 rev/s on screen
const tB0 = wt('intake', 'piston') - 0.1;
const WINDOWS = [
  [tB0, T('compress') - 0.1, 180],
  [wt('compress', 'close') - 0.05, T('power') - 0.1, 172],
  [wt('power', 'spark') - 0.05, wt('power', 'spark') + 0.3, 10],
  [wt('power', 'blast') - 0.08, T('exhaust') - 0.1, 178],
  [wt('exhaust', 'rises') - 0.3, T('cycle') - 0.05, 180],
  [T('cycle'), wt('cycle', 'flywheel') - 0.15, 720],
  [wt('outro', 'suck') - 0.05, wt('outro', 'squeeze') - 0.08, 180],
  [wt('outro', 'squeeze') - 0.05, wt('outro', 'bang') - 0.1, 172],
  [wt('outro', 'bang') - 0.06, wt('outro', 'blow') - 0.08, 188],
  [wt('outro', 'blow') - 0.05, wt('outro', "that's") - 0.1, 180],
];
const tC0 = wt('cycle', 'flywheel') - 0.15, tC1 = wt('outro', 'suck') - 0.05;
function wA(t) {                           // before the strokes
  if (t >= tB0) return 0;
  return lerp(FAST, 2.2, ramp(t, wt('question', 'ride') - 0.2, T('parts') + 0.1)) * (1 - ramp(t, T('intake') - 0.6, T('intake') - 0.1));
}
function wSteady(t) {                      // after the cycle line, until the outro
  if (t < tC0 || t >= tC1) return 0;
  const up = lerp(lerp(7.5, 12, ramp(t, T('drive') - 0.3, T('drive') + 0.3)), 15, ramp(t, T('fins') - 0.3, T('fins') + 0.3));
  return up * ramp(t, tC0, tC0 + 0.5) * (1 - ramp(t, T('outro') - 0.45, tC1 - 0.02));
}
const wE = (t) => FAST * ramp(t, wt('outro', "that's") - 0.1, wt('outro', "that's") + 0.6);
function wWin(t) {
  let w = 0;
  for (const [a, b, d] of WINDOWS) if (t > a && t < b) { const u = (t - a) / (b - a); w += d * DEG / (b - a) * 2 * Math.sin(Math.PI * u) ** 2; }
  return w;
}
const DT = 1 / 1200, NT = Math.ceil((END + 1) / DT);
let steadyI = 0;
for (let i = 0; i < NT; i++) steadyI += wSteady((i + 0.5) * DT) * DT;
const SCALE = Math.max(1, Math.round(steadyI / (4 * Math.PI))) * 4 * Math.PI / Math.max(steadyI, 1e-6);
const omega = (t) => wA(t) + wWin(t) + wSteady(t) * SCALE + wE(t);
const thTab = new Float64Array(NT + 1), fiTab = new Float64Array(NT + 1), feTab = new Float64Array(NT + 1);
for (let i = 1; i <= NT; i++) thTab[i] = thTab[i - 1] + omega((i - 0.5) * DT) * DT;
const shift = thTab[Math.round(tB0 / DT)];
const camMax = EN.camLift;
for (let i = 0; i <= NT; i++) thTab[i] -= shift;
for (let i = 1; i <= NT; i++) {
  const th = thTab[i], d = Math.abs(thTab[i] - thTab[i - 1]);
  fiTab[i] = fiTab[i - 1] + camLiftAt('I', th) / camMax * d;
  feTab[i] = feTab[i - 1] + camLiftAt('E', th) / camMax * d;
}
const look = (tab, t) => { const f = clamp(t / DT, 0, NT - 1), i = Math.floor(f); return tab[i] + (tab[i + 1] - tab[i]) * (f - i); };
const theta = (t) => look(thTab, t), flowI = (t) => look(fiTab, t), flowE = (t) => look(feTab, t);
const cycDeg = (th) => { const c = (th / DEG) % 720; return c < 0 ? c + 720 : c; };
// ignition: each time the crank passes 355 deg of the cycle
const IGN = [];
for (let i = 1; i <= NT; i++) {
  const a = thTab[i - 1] / DEG - 355, b = thTab[i] / DEG - 355;
  if (Math.floor(a / 720) !== Math.floor(b / 720) && b > a) {
    const w = (thTab[i] - thTab[i - 1]) / DT;
    IGN.push({ t: i * DT, tau: clamp(40 * DEG / Math.max(w, 1e-3), 0.035, 0.42) });
  }
}
function lastIgn(t) { let r = null; for (const g of IGN) { if (g.t <= t) r = g; else break; } return r; }

// ----------------------------------------------------------------------------- camera shots
const k = (t, l, d, r, fov = 34) => ({ t, v: [...(Array.isArray(l) ? l : [l.x, l.y, l.z]), ...d, r, fov] });
const BIKE = v3(-0.06, 0.55, 0);
const SHOTS = [
  [ // hook: the bike by the road, pushing in on the engine
    k(0, v3(0.02, 0.55, 0), [0.85, 0.22, 1], 4.7, 32),
    k(wt('hook', 'explosion') - 0.15, EW(0, 0.08), [0.5, 0.14, 1], 1.55, 32),
    k(T('question') - 0.05, EW(0, 0.11), [0.32, 0.12, 1], 1.05, 32),
  ],
  [ // question: right into the engine, the case opens
    k(T('question'), EW(0, 0.11), [0.26, 0.1, 1], 1.0),
    k(T('parts') - 0.05, EW(0, 0.09), [0.14, 0.06, 1], 0.85),
  ],
  [ // the parts
    k(T('parts'), EW(0, 0.085), [0.12, 0.05, 1], 0.84),
    k(T('valves') - 0.05, EW(0, 0.095), [0.2, 0.08, 1], 0.78),
  ],
  [ // valves and camshaft
    k(T('valves'), EW(0, 0.21), [0.2, 0.14, 1], 0.5),
    k(wt('valves', 'camshaft') - 0.1, EW(0, 0.225), [0.06, 0.1, 1], 0.46),
    k(T('intake') - 0.05, EW(0, 0.225), [-0.08, 0.12, 1], 0.47),
  ],
  [ // 1 intake: from the carburettor side
    k(T('intake'), EW(-0.04, 0.155), [-0.3, 0.06, 1], 0.64),
    k(T('compress') - 0.05, EW(-0.02, 0.145), [-0.16, 0.04, 1], 0.6),
  ],
  [ // 2 compression: square on, tight
    k(T('compress'), EW(0, 0.145), [0.04, 0.0, 1], 0.58),
    k(T('power') - 0.05, EW(0, 0.155), [0.1, 0.03, 1], 0.5),
  ],
  [ // 3 power: the plug side
    k(T('power'), EW(0.004, 0.16), [0.2, 0.1, 1], 0.5),
    k(wt('power', 'blast'), EW(0.004, 0.15), [0.18, 0.08, 1], 0.54),
    k(T('exhaust') - 0.05, EW(0, 0.13), [0.2, 0.07, 1], 0.64),
  ],
  [ // 4 exhaust: out through the port, then follow the pipe to the silencer
    k(T('exhaust'), EW(0.02, 0.155), [0.3, 0.1, 1], 0.6),
    k(wt('exhaust', 'burnt') - 0.1, EW(0.05, 0.15), [0.38, 0.12, 1], 0.68),
    k(wt('exhaust', 'silencer') + 0.15, v3(-0.32, 0.33, 0.15), [0.3, 0.22, 1], 1.25),
    k(T('cycle') - 0.05, v3(-0.45, 0.36, 0.15), [0.26, 0.18, 1], 1.3),
  ],
  [ // the whole cycle, crank and flywheel
    k(T('cycle'), EW(0, 0.09), [0.15, 0.08, 1], 0.86),
    k(wt('cycle', 'flywheel') - 0.1, EW(0, 0.06), [0.24, 0.1, 1], 0.8),
    k(T('drive') - 0.05, EW(0, 0.04), [0.34, 0.14, 1], 0.8),
  ],
  [ // drive: the left side, crank to clutch to gearbox to chain to wheel
    k(T('drive'), EW(-0.06, 0.0, -0.04), [0.12, 0.08, -1], 0.7),
    k(wt('drive', 'gearbox') + 0.2, EW(-0.12, -0.02, -0.06), [0.04, 0.1, -1], 0.78),
    k(wt('drive', 'chain') + 0.1, v3(-0.36, 0.37, -0.08), [0.0, 0.12, -1], 1.2),
    k(T('fins') - 0.05, v3(-0.46, 0.36, -0.08), [-0.1, 0.14, -1], 1.35),
  ],
  [ // fins: the closed engine from the right, air flowing through
    k(T('fins'), EW(0, 0.13), [0.55, 0.26, 1], 0.75),
    k(T('outro') - 0.05, EW(0, 0.15), [0.26, 0.2, 1], 0.66),
  ],
  [ // outro: one stroke per word, then pull back to the whole bike
    k(T('outro'), EW(0, 0.14), [0.12, 0.05, 1], 0.6),
    k(wt('outro', "that's") - 0.1, EW(0, 0.135), [0.16, 0.06, 1], 0.64),
    k(wt('outro', "that's") + 0.75, v3(0.0, 0.55, 0), [0.62, 0.17, 1], 3.8, 32),
    k(END, v3(0.02, 0.55, 0), [0.85, 0.2, 1], 4.7, 32),
  ],
];
const SHOT = { hook: 0, question: 1, parts: 2, valves: 3, intake: 4, compress: 5, power: 6, exhaust: 7, cycle: 8, drive: 9, fins: 10, outro: 11 };
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
let camDist = 1;
function setCamera(t) {
  let s = SHOTS[0], si = 0;
  SHOTS.forEach((sh, i) => { if (t >= sh[0].t) { s = sh; si = i; } });
  const v = hermite(s, t, (q) => q.v);
  const d = new THREE.Vector3(v[3], v[4], v[5]).normalize();
  camera.position.set(v[0], v[1], v[2]).addScaledVector(d, v[6]);
  // the blast shakes the camera
  const tb = wt('power', 'blast') - 0.05, tb2 = wt('outro', 'bang');
  const sh = (t > tb ? 0.006 * Math.exp(-(t - tb) * 5) : 0) + (t > tb2 ? 0.004 * Math.exp(-(t - tb2) * 6) : 0);
  if (sh > 1e-5) camera.position.add(v3(Math.sin(t * 91) * sh, Math.sin(t * 77 + 1) * sh, Math.sin(t * 63 + 2) * sh * 0.5));
  camera.lookAt(v[0], v[1], v[2]);
  camera.fov = v[7]; camera.updateProjectionMatrix();
  camDist = v[6];
  closeL.position.copy(camera.position).add(v3(0.1, 0.15, 0.05));
  closeL.intensity = 0.3 * clamp((1.1 - v[6]) / 0.6);
  return si;
}

// ----------------------------------------------------------------------------- particles
const rnd = (() => { let s = 424242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
function particles(n, size, parent, opacity = 0.95, detail = 1) {
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, detail), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, depthWrite: false, opacity, toneMapped: false }), n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.setColorAt(0, new THREE.Color());
  im.frustumCulled = false; im.renderOrder = 6;
  parent.add(im);
  return { im, n, size, seeds: Array.from({ length: n }, () => [rnd(), rnd(), rnd(), rnd(), rnd()]) };
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
function put(sys, i, x, y, z, size, r, g, b) {
  _p.set(x, y, z); _s.setScalar(Math.max(0, size));
  sys.im.setMatrixAt(i, _m.compose(_p, _q, _s));
  sys.im.setColorAt(i, _c.setRGB(r, g, b));
}
const hide = (sys, i) => sys.im.setMatrixAt(i, _m.makeScale(0, 0, 0));
const done = (sys) => { sys.im.instanceMatrix.needsUpdate = true; sys.im.instanceColor.needsUpdate = true; };
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const FRESH = [0.35, 0.82, 1.0], FUEL = [1.0, 0.72, 0.18], HOT = [1.0, 0.95, 0.7], FIRE = [1.0, 0.5, 0.12], BURNT = [0.55, 0.47, 0.42];

// gas in the cylinder: fills from the top on intake, squeezed, burns outward from the plug, pushed out
const GAS = particles(560, 0.0019, E.EG);
const PT = v3(...EN.plugTip);
function gasState(t) {
  const th = theta(t), c = cycDeg(th);
  const g = lastIgn(t);
  const age = g ? t - g.t : 99, tau = g ? g.tau : 0.1;
  return { th, c, age, tau };
}
function updateGas(t, vis) {
  const { th, c, age, tau } = gasState(t);
  const crown = pinY(th) + 0.0226;
  for (let i = 0; i < GAS.n; i++) {
    const [s0, s1, s2, s3, s4] = GAS.seeds[i];
    if (vis <= 0.001) { hide(GAS, i); continue; }
    const rho = Math.sqrt(s0) * 0.0272, a = s1 * Math.PI * 2 + (c < 180 ? c * DEG * 0.4 : 0.4 * Math.PI);
    const top = EN.deck + 0.015 * (1 - (rho / EN.bore) ** 2);
    const y = crown + 0.0015 + s2 * (top - crown - 0.002);
    const x = rho * Math.cos(a), z = rho * Math.sin(a);
    const fuel = s4 < 0.12;
    let col, size = GAS.size * (0.7 + 0.6 * s3) * (fuel ? 0.75 : 1), o = 1;
    if (c < 180) {                                   // intake: fills from the valve down
      const fill = Math.pow(c / 180, 0.8) * 1.15;
      if (s2 < 1 - fill) { hide(GAS, i); continue; }
      col = fuel ? FUEL : FRESH;
    } else if (c < 355) {                            // compression: denser and brighter
      const k = (c - 180) / 175;
      col = fuel ? FUEL : mix3(FRESH, [0.6, 0.92, 1.0], k * k);
    } else if (c < 540) {                            // burn from the plug, then cooling burnt gas
      const d = Math.hypot(x - PT.x, y - PT.y, z - PT.z);
      const front = 0.075 * clamp(age / tau);
      if (d > front) col = fuel ? FUEL : [0.6, 0.92, 1.0];
      else {
        const lit = clamp((age - tau * d / 0.075) / (tau * 1.2));
        const cool = clamp((c - 380) / 160);
        col = mix3(mix3(HOT, FIRE, lit), BURNT, cool * cool);
        size *= 1.15;
      }
    } else {                                          // exhaust: grey, thinning out
      col = BURNT; o = 0.85;
    }
    put(GAS, i, x, y, z, size * vis * o, col[0], col[1], col[2]);
  }
  done(GAS);
  // glow of the burn
  const burning = (c >= 355 && c < 560) ? clamp(age / (tau * 0.6)) * (1 - clamp((c - 380) / 170)) : 0;
  burnL.intensity = 0.12 * burning * vis;
  burnL.position.y = lerp(EN.deck + 0.004, crown + 0.02, 0.4);
  return { c, age, tau, burning };
}

// intake tract: air + petrol mix from the carburettor through the port, moving only while the valve is open
const IN_PTS = [[-0.2, 0.224], [-0.15, 0.215], [-0.1, 0.211], [-0.062, 0.207], [-0.04, 0.194], [-0.021, 0.184], [-0.012, 0.176], [-0.006, 0.158], [0.0, 0.14]];
const inCurve = new THREE.CatmullRomCurve3(IN_PTS.map(([x, y]) => v3(x, y, 0)));
const IN_L = inCurve.getLength(), inSamp = inCurve.getSpacedPoints(400);
const INT = particles(220, 0.0019, E.EG);
const SV = 0.905;                             // curve parameter of the valve throat
function updateIntake(t, vis) {
  const f = flowI(t) * 0.055;
  for (let i = 0; i < INT.n; i++) {
    const [s0, s1, s2, s3, s4] = INT.seeds[i];
    if (vis <= 0.001) { hide(INT, i); continue; }
    const s = (s0 + f / IN_L) % 1;
    const p = inSamp[Math.round(s * 400)];
    const r = s < 0.45 ? 0.009 : 0.0065, a = s1 * Math.PI * 2;
    const fade = s < SV ? 1 : 1 - ramp(s, SV, 1);
    const fuel = s4 < 0.15;
    const col = fuel ? FUEL : FRESH;
    put(INT, i, p.x + r * Math.sqrt(s2) * Math.cos(a) * 0.5, p.y + r * Math.sqrt(s2) * Math.sin(a) * 0.6, r * Math.sqrt(s2) * Math.sin(a + 1.3), INT.size * (0.7 + 0.5 * s3) * vis * fade * ramp(s, 0, 0.04), col[0], col[1], col[2]);
  }
  done(INT);
}

// exhaust: chamber -> port -> header -> silencer -> out, in world coordinates; smoke from the tip
const EX_LOCAL = [[0.006, 0.16], [0.013, 0.177], [0.026, 0.184], [0.044, 0.188], [0.062, 0.188]].map(([x, y]) => EW(x, y));
const hdrPts = B.header.getPoints(40).slice(1);
const sDir = B.sB.clone().sub(B.sA).normalize();
const exCurve = new THREE.CatmullRomCurve3([...EX_LOCAL, ...hdrPts, B.sA.clone().addScaledVector(sDir, 0.1), B.sA.clone().lerp(B.sB, 0.6), B.sB.clone(), B.tipW.clone()], false, 'centripetal');
const EX_L = exCurve.getLength(), exSamp = exCurve.getSpacedPoints(1600);
const sPort = (() => { let best = 0, bd = 9; exSamp.forEach((p, i) => { const d = p.distanceTo(EX_LOCAL[4]); if (d < bd) { bd = d; best = i; } }); return best / 1600; })();
const sSil = (() => { let best = 0, bd = 9; exSamp.forEach((p, i) => { const d = p.distanceTo(B.sA); if (d < bd) { bd = d; best = i; } }); return best / 1600; })();
const EXH = particles(700, 0.0035, scene);
const SMK = particles(90, 0.03, scene, 0.28, 2);
const EXK = 0.16;
function updateExhaust(t, vis, insideVis) {
  const f = flowE(t) * EXK;
  for (let i = 0; i < EXH.n; i++) {
    const [s0, s1, s2, s3, s4] = EXH.seeds[i];
    if (vis <= 0.001) { hide(EXH, i); continue; }
    const s = (s0 + f / EX_L) % 1;
    const p = exSamp[Math.round(s * 1600)];
    const inPort = s < sPort;
    if (inPort && insideVis <= 0.01) { hide(EXH, i); continue; }
    const inSil = s > sSil;
    const r = (inPort ? 0.006 : inSil ? 0.03 : 0.011) * Math.sqrt(s2), a = s1 * Math.PI * 2;
    const sz = EXH.size * (inPort ? 0.55 : inSil ? 1.1 : 0.9) * (0.7 + 0.6 * s3);
    const k = clamp(s / sPort);
    const col = mix3([0.85, 0.5, 0.25], [0.62, 0.56, 0.52], clamp((s - sPort) / 0.25));
    put(EXH, i, p.x + r * Math.cos(a) * 0.4, p.y + r * Math.sin(a), p.z + r * Math.cos(a), sz * vis * (inPort ? insideVis * ramp(k, 0, 0.15) : 1) * (1 - ramp(s, 0.985, 1)), col[0], col[1], col[2]);
  }
  done(EXH);
  // smoke puffs at the tip, as strong as the recent exhaust flow
  const rate = (flowE(t) - flowE(Math.max(0, t - 0.5))) / 0.5;
  for (let i = 0; i < SMK.n; i++) {
    const [s0, s1, s2, s3, s4] = SMK.seeds[i];
    const u = (s0 + t * 0.6) % 1;
    const age = u * 1.6;
    const tb = t - age;
    const r0 = (flowE(Math.max(0, tb)) - flowE(Math.max(0, tb - 0.4))) / 0.4;
    const strength = clamp(r0 / 4);
    if (strength <= 0.01 || vis <= 0.001) { hide(SMK, i); continue; }
    const p = B.tipW.clone().addScaledVector(sDir, 0.05 + age * 0.35).add(v3((s1 - 0.5) * age * 0.25, age * 0.22 + (s2 - 0.5) * age * 0.15, (s3 - 0.5) * age * 0.25));
    const g = 0.72 + 0.1 * s4;
    put(SMK, i, p.x, p.y, p.z, SMK.size * (0.4 + age * 1.8) * strength * (1 - u) * vis, g, g * 0.98, g * 0.96);
  }
  done(SMK);
  return rate;
}

// cooling air through the fins (engine frame): cool going in, warm coming out
const AIR = particles(320, 0.0021, E.EG, 0.9);
function updateAir(t, vis) {
  for (let i = 0; i < AIR.n; i++) {
    const [s0, s1, s2, s3, s4] = AIR.seeds[i];
    if (vis <= 0.001) { hide(AIR, i); continue; }
    const u = (s0 + t * 0.55) % 1;
    const x = lerp(0.13, -0.13, u);
    const gap = Math.floor(s1 * 17);
    const y = gap < 10 ? 0.074 + gap * 0.0084 + 0.0056 : 0.166 + (gap - 10) * 0.0084 + 0.0056;
    const z = lerp(-0.07, 0.075, s2);
    const heat = clamp((0.05 - x) / 0.09) * (1 - ramp(u, 0.85, 1) * 0.4);
    const col = mix3([0.7, 0.88, 1.0], [1.0, 0.45, 0.12], heat);
    put(AIR, i, x, y, z, AIR.size * (0.7 + 0.6 * s3) * vis * ramp(u, 0, 0.08) * (1 - ramp(u, 0.9, 1)), col[0], col[1], col[2]);
  }
  done(AIR);
}

// ----------------------------------------------------------------------------- labels
const labels = new Labels(document.querySelector('.labels'), camera, canvas, { margin: 56, gap: 14 });
const allItems = [];
function label(obj, text, note, anchor, a, b) {
  const tr = TX.labels?.[text]; if (tr) [text, note] = tr;
  const it = labels.add(obj, text, { note, anchor }); it.win = [a, b]; allItems.push(it);
}
label(E.piston, 'Piston', 'slides up and down', [0.0283, 0.0, 0.01], wt('parts', 'piston'), T('valves') - 0.2);
label(E.EG, 'Cylinder', "the piston's home", [-0.058, 0.13, 0], wt('parts', 'cylinder'), T('valves') - 0.2);
label(E.conrod, 'Connecting rod', 'piston to crank', [0.006, EN.L * 0.45, 0.006], wt('parts', 'connecting'), T('valves') - 0.2);
label(E.EG, 'Crankshaft', 'turns it into spin', [0.045, -0.03, 0.02], wt('parts', 'crankshaft'), T('valves') - 0.2);
label(E.valveI.g, 'Intake valve', 'air + fuel in', [0, 0.04, 0], wt('valves', 'air'), T('intake') - 0.2);
label(E.valveE.g, 'Exhaust valve', 'burnt gas out', [0, 0.04, 0], wt('valves', 'exhaust'), T('intake') - 0.2);
label(E.EG, 'Camshaft', 'opens the valves', [0.0, EN.camY + 0.016, 0.01], wt('valves', 'camshaft'), T('intake') - 0.2);
label(E.EG, 'Carburettor', 'mixes air + petrol', [-0.122, 0.245, 0.02], wt('intake', 'petrol') - 0.15, T('compress') - 0.2);
label(E.plug, 'Spark plug', 'makes the spark', [0, 0.06, 0], wt('power', 'spark'), T('exhaust') - 0.2);
label(B.group, 'Silencer', 'quiets the gas', [-0.62, 0.43, 0.2], wt('exhaust', 'silencer') + 0.1, T('cycle') - 0.15);
label(E.EG, 'Flywheel', 'stores the spin', [0.035, -0.035, 0.022], wt('cycle', 'flywheel'), T('drive') - 0.2);
label(E.EG, 'Clutch', 'connects / disconnects', [EN.M[0] + 0.03, EN.M[1] + 0.06, 0.07], wt('drive', 'clutch'), T('fins') - 0.2);
label(E.EG, 'Gearbox', 'changes speed', [EN.C[0], EN.C[1] - 0.05, -0.03], wt('drive', 'gearbox'), T('fins') - 0.2);
label(B.group, 'Chain', 'to the wheel', [-0.42, 0.41, -0.095], wt('drive', 'chain'), T('fins') - 0.2);
label(B.group, 'Rear wheel', '', [-0.63, 0.6, -0.04], wt('drive', 'wheel'), T('fins') - 0.2);
label(E.EG, 'Cooling fins', 'heat into the air', [0.058, 0.115, 0.04], wt('fins', 'fins'), T('outro') - 0.2);

// ----------------------------------------------------------------------------- captions + overlays
const capEl = document.getElementById('cap');
const CHUNKS = [];
for (const l of VOICE.lines) {
  let cur = [];
  l.words.forEach((w, i) => {
    cur.push(w);
    const end = /[.,?!।—]$/.test(w.w) || cur.length === 3 || i === l.words.length - 1;
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
    capEl.innerHTML = c ? c.words.map((w) => `<span>${w.w.replace(/[.,?!।—"]/g, '').replace(/</g, '')}</span>`).join(' ') : '';
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
const $ = (id) => document.getElementById(id);
const titleEl = $('title'), bangEl = $('bang'), strokeEl = $('stroke'), cycEl = $('cyc'), dialEl = $('dial'), pathEl = $('path'), chainEl = $('chain');
bangEl.innerHTML = TX.bang || '<b>50</b> bangs / second';
cycEl.textContent = TX.cyc || '2 turns = 1 bang';
const STROKES = TX.strokes || ['1 Intake', '2 Compression', '3 Power', '4 Exhaust'];
const SCOL = ['#49d6ff', '#5fe08a', '#ff8a2e', '#c9bfb4'];
// the cycle dial: four quarters of 720 degrees, a needle at the crank's place in the cycle
const arc = (a0, a1, r) => {
  const p = (a) => [100 + r * Math.sin(a), 100 - r * Math.cos(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
dialEl.innerHTML = `<circle cx="100" cy="100" r="92" fill="rgba(10,14,22,.84)" stroke="rgba(255,255,255,.18)" stroke-width="3"/>`
  + SCOL.map((c, i) => `<path d="${arc(i * Math.PI / 2 + 0.05, (i + 1) * Math.PI / 2 - 0.05, 68)}" stroke="${c}" stroke-width="20" fill="none" opacity=".35" id="q${i}"/>`).join('')
  + `<line id="needle" x1="100" y1="100" x2="100" y2="40" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="100" r="10" fill="#fff"/>`;
const needle = dialEl.querySelector('#needle'), quarters = [0, 1, 2, 3].map((i) => dialEl.querySelector('#q' + i));
const PATH_W = ['spin', 'clutch', 'gearbox', 'chain', 'wheel'];
const PATH = PATH_W.map((w, i) => [(TX.path || ['Crank', 'Clutch', 'Gearbox', 'Chain', 'Wheel'])[i], wt('drive', w)]);
pathEl.innerHTML = PATH.map(([w], i) => (i ? '<i>▸</i>' : '') + `<div>${w}</div>`).join('');
const CH_W = ['suck', 'squeeze', 'bang', 'blow'];
const CHAIN = CH_W.map((c, i) => [(TX.chain || ['Suck', 'Squeeze', 'Bang', 'Blow'])[i], wt('outro', c)]);
chainEl.innerHTML = CHAIN.map(([w], i) => (i ? '<i>▼</i>' : '') + `<div style="color:${SCOL[i]}">${w}</div>`).join('');
function show(el, o, y = 0) { el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.002 ? 'visible' : 'hidden'; if (y) el.style.translate = `0 ${y}px`; }
const STROKE_LINES = ['intake', 'compress', 'power', 'exhaust'];

function updateOverlays(t, c) {
  const tt = win(t, -1, T('question') + 0.3, 0.35);
  show(titleEl, tt, (1 - clamp(tt)) * 20);
  show(bangEl, win(t, wt('hook', 'fifty') - 0.1, T('parts') - 0.25, 0.2));
  // stroke chip: which stroke the crank is in
  const sv = win(t, T('intake'), T('drive') - 0.15, 0.15);
  show(strokeEl, sv);
  const q = Math.min(3, Math.floor(c / 180));
  let si = q;
  for (let i = 0; i < 4; i++) if (t >= T(STROKE_LINES[i]) && t < (i < 3 ? T(STROKE_LINES[i + 1]) : T('cycle'))) si = i;
  if (sv > 0) { strokeEl.textContent = STROKES[si]; strokeEl.style.color = SCOL[si]; }
  show(cycEl, win(t, wt('cycle', 'crank') - 0.1, T('drive') - 0.15, 0.15));
  const dv = Math.max(win(t, T('intake'), T('drive') - 0.15, 0.15), win(t, T('outro'), wt('outro', "that's") + 0.2, 0.15));
  show(dialEl, dv);
  if (dv > 0) {
    needle.setAttribute('transform', `rotate(${(c / 2).toFixed(2)} 100 100)`);
    quarters.forEach((el, i) => el.setAttribute('opacity', i === q ? '1' : '.3'));
  }
  // drive path
  show(pathEl, win(t, T('drive') + 0.05, T('fins') - 0.15, 0.15));
  [...pathEl.querySelectorAll('div')].forEach((el, i) => el.classList.toggle('on', t >= PATH[i][1] - 0.1));
  // outro chain
  const cv = 1 - ramp(t, wt('outro', "that's") + 0.6, wt('outro', "that's") + 1.0);
  show(chainEl, t > CHAIN[0][1] - 0.3 ? cv : 0);
  [...chainEl.children].forEach((el, j) => {
    const idx = Math.floor(j / 2 + 0.5);
    const at = CHAIN[Math.min(idx, 3)][1] - (el.tagName === 'I' ? 0.12 : 0.05);
    const o = ramp(t, at, at + 0.15);
    el.style.opacity = o; el.style.transform = `scale(${lerp(0.7, 1, o)})`;
  });
  labels.items = allItems.filter((it) => win(t, it.win[0], it.win[1], 0.2) > 0.01);
  for (const it of allItems) if (!labels.items.includes(it)) { it.el.style.display = it.line.style.display = 'none'; }
  labels.update();
  for (const it of labels.items) { const o = win(t, it.win[0], it.win[1], 0.2); it.el.style.opacity = o; it.line.style.opacity = o; }
  updateCaptions(t);
}

// ----------------------------------------------------------------------------- x-ray helpers
function xray(mats, v, lo = 0.1) {
  for (const m of mats) {
    const on = v > 0.002;
    if (m.transparent !== on) { m.transparent = on; m.needsUpdate = true; }
    m.opacity = lerp(1, lo, v); m.depthWrite = v < 0.5;
  }
}
const _amber = new THREE.Color('#ff9a2e'), _heat = new THREE.Color('#ff3a0a');
const _m4 = new THREE.Matrix4(), _qz = new THREE.Quaternion(), Z = v3(0, 0, 1);

// ----------------------------------------------------------------------------- per frame
const chainPitch = B.chain.L / B.nLinks, camPitch = E.camLoop.L / E.camChain.count;
function renderAt(t) {
  const shot = setCamera(t);
  const th = theta(t);

  // --- mechanism
  E.crank.rotation.z = -th;
  const py = pinY(th);
  E.piston.position.y = py;
  const bx = EN.r * Math.sin(th), by = EN.r * Math.cos(th);
  E.conrod.position.set(bx, by, 0); E.conrod.rotation.z = Math.atan2(bx, py - by);
  E.cam.rotation.z = -th / 2;
  const cI = camLiftAt('I', th), cE = camLiftAt('E', th);
  E.rockI.rotation.z = cI / ROCK; E.rockE.rotation.z = -cE / ROCK;
  for (const [V, c] of [[E.valveI, cI], [E.valveE, cE]]) {
    const lift = c / ROCK * VLEV;
    V.valve.position.y = -lift;
    V.ret.position.y = 0.077 - lift;
    V.spr.position.y = 0.048; V.spr.scale.y = 0.029 - lift;
  }
  for (let i = 0; i < E.camChain.count; i++) {
    const [x, y, a] = E.camLoop.at(i * camPitch + th * 0.0125);
    E.camChain.setMatrixAt(i, _m4.compose(_p.set(x, y, 0), _qz.setFromAxisAngle(Z, a), _s.set(1, 1, 1)));
  }
  E.camChain.instanceMatrix.needsUpdate = true;
  // primary drive -> clutch/mainshaft -> gear pairs -> countershaft -> sprocket -> chain -> wheel
  const mA = th * EN.rPrim / EN.rClutch;
  E.mainS.rotation.z = mA;
  EN.pairs.forEach(([rm, rc], i) => { E.ctrGears[i].rotation.z = -mA * rm / rc; });
  const [rmE, rcE] = EN.pairs[EN.engaged];
  const cA = -mA * rmE / rcE;
  E.ctrS.rotation.z = cA;
  const chainOff = -cA * EN.rFront;
  B.rear.spin.rotation.z = -chainOff / EN.rRear;
  for (let i = 0; i < B.nLinks; i++) {
    const s = i * chainPitch + chainOff;
    const [x, y] = B.chain.at(s), [xm, ym, am] = B.chain.at(s + chainPitch / 2);
    B.rollers.setMatrixAt(i, _m4.compose(_p.set(x, y, EN.chainZ), _q.identity(), _s.set(1, 1, 1)));
    _qz.setFromAxisAngle(Z, am);
    B.plates.setMatrixAt(i * 2, _m4.compose(_p.set(xm, ym, EN.chainZ + 0.0045), _qz, _s.set(1, 1, 1)));
    B.plates.setMatrixAt(i * 2 + 1, _m4.compose(_p.set(xm, ym, EN.chainZ - 0.0045), _qz, _s.set(1, 1, 1)));
  }
  B.rollers.instanceMatrix.needsUpdate = true; B.plates.instanceMatrix.needsUpdate = true;

  // --- the cut: the front half slides away for the inside shots
  const open = shot === SHOT.question ? ramp(t, wt('question', 'bang') - 0.1, wt('question', 'ride') + 0.25)
    : [SHOT.parts, SHOT.valves, SHOT.intake, SHOT.compress, SHOT.power, SHOT.exhaust, SHOT.cycle, SHOT.drive].includes(shot) ? 1
    : shot === SHOT.outro ? 1 - ramp(t, wt('outro', "that's") + 0.05, wt('outro', "that's") + 0.45) : 0;
  E.front.position.z = 0.22 * open;
  E.front.visible = open < 0.98;
  const hookX = shot === SHOT.hook ? ramp(t, wt('hook', 'explosion') - 0.15, wt('hook', 'explosion') + 0.25) : 0;
  xray(E.X.front, clamp(Math.max(open * 1.3, hookX * 0.8)), 0.12);
  // crankcase see-through when the crank or gears matter
  const caseX = shot === SHOT.hook ? hookX * 0.75
    : shot === SHOT.question ? lerp(0.75, 0.85, open)
    : [SHOT.parts, SHOT.cycle].includes(shot) ? 0.88
    : shot === SHOT.drive ? 0.9
    : [SHOT.valves, SHOT.intake, SHOT.compress, SHOT.power].includes(shot) ? 0.8
    : shot === SHOT.exhaust ? 0.8 * (1 - ramp(t, wt('exhaust', 'burnt'), wt('exhaust', 'silencer')))
    : shot === SHOT.outro ? 0.85 * open : 0;
  xray(E.X.case, caseX, 0.1); xray(E.X.cover, caseX, 0.08);

  // --- highlights
  const glow = (m, k, col = _amber) => { m.emissive.copy(col).multiplyScalar(k); };
  glow(E.pistonMat, 0.5 * win(t, wt('parts', 'piston'), wt('parts', 'cylinder'), 0.15));
  glow(E.rodMat, 0.5 * win(t, wt('parts', 'connecting'), wt('parts', 'crankshaft'), 0.15));
  glow(E.webMat, 0.45 * win(t, wt('parts', 'crankshaft'), T('valves') - 0.3, 0.15) + 0.45 * win(t, wt('cycle', 'flywheel'), T('drive') - 0.2, 0.15)
    + 0.5 * win(t, wt('drive', 'spin') - 0.1, wt('drive', 'clutch') - 0.1, 0.1));
  glow(E.gearMat, 0.4 * win(t, wt('drive', 'clutch') - 0.1, wt('drive', 'chain') - 0.1, 0.1));
  const heatK = win(t, wt('fins', 'heat') - 0.6, T('outro') - 0.05, 0.3);
  for (const m of E.heat.slice(0, 2)) m.emissive.copy(_heat).multiplyScalar(0.24 * heatK);

  // --- particles
  const inside = clamp(Math.max(open, hookX)) * (shot === SHOT.hook || t > T('intake') - 0.3 ? 1 : 0);
  const st = updateGas(t, inside);
  E.spark.visible = false;
  const g = lastIgn(t);
  if (g && t - g.t < 0.03 + g.tau * 0.6) {
    const k2 = Math.exp(-(t - g.t) / (0.02 + g.tau * 0.35));
    E.spark.visible = inside > 0.05; E.spark.scale.setScalar(0.6 + 1.6 * k2); E.spark.material.opacity = k2;
  }
  updateIntake(t, inside * (shot === SHOT.drive ? 0 : 1));
  updateExhaust(t, [SHOT.drive, SHOT.fins].includes(shot) ? 0 : 1, inside);
  updateAir(t, shot === SHOT.fins ? win(t, T('fins') + 0.1, T('outro') - 0.05, 0.2) : 0);

  renderer.render(scene, camera);
  updateOverlays(t, st.c);
}

window.__T = { lines: LINE, END, T, theta, IGN };
window.__renderAt = renderAt;
window.__duration = END;

await document.fonts.ready;
if (params.has('record')) { renderAt(0); window.__ready = true; }
else if (params.has('t')) { renderAt(+params.get('t')); window.__ready = true; }
else {
  const t0 = performance.now();
  const loop = () => { renderAt(((performance.now() - t0) / 1000) % END); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  window.__ready = true;
}
