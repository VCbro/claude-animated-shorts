// "How a submersible pump works" — a 9:16 explainer short. Everything on screen is a pure
// function of time t (seconds): window.__renderAt(t) for the frame-exact recorder, ?t=12.3 for a
// still, otherwise it plays in real time.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Labels } from './explode.js';
import { D, LAYERS, buildEarth, buildBore, buildPump, buildRiser, buildSurface, buildCrew, buildSurfacePump, buildSky } from './scene.js';

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
scene.add(buildSky());
scene.add(new THREE.HemisphereLight('#d6ebff', '#3a2a1e', 0.85));
const key = new THREE.DirectionalLight('#fff1dc', 2.7);
key.position.set(3.5, 6.5, 6.0); key.target.position.set(0.6, -1.6, -0.5);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 0.5, far: 25 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight('#9fcfff', 0.7); fill.position.set(-4, 1, 3); scene.add(fill);
// a close light that follows close-ups so the steel reads
const closeL = new THREE.PointLight('#ffffff', 0, 3, 1.5); scene.add(closeL);

const camera = new THREE.PerspectiveCamera(36, W / H, 0.02, 90);

const E = buildEarth(); scene.add(E.group);
const B = buildBore(); scene.add(B.group);
const P = buildPump(); scene.add(P.root);
const RS = buildRiser(); scene.add(RS.group);
const S = buildSurface(); scene.add(S.group);
const C = buildCrew(); scene.add(C.group);
const SP = buildSurfacePump(); scene.add(SP.group);

// ----------------------------------------------------------------------------- the story's state
// pump position: installed (hook/question), hanging from the tripod (install), going down (deep), installed
const tI = T('install'), tD = T('deep'), tM = T('motor');
const clampY = (t) => lerp(1.75, 0.62, ramp(t, tI + 0.3, tD + 0.15));
const RISER_STUB = 0.36;
function pumpBottom(t) {
  if (t < tI - 0.01 || t >= tM - 0.01) return D.pumpY;
  if (t < tD) return clampY(t) - 0.1 - RISER_STUB - D.pumpLen;
  const y0 = clampY(tD) - 0.1 - RISER_STUB - D.pumpLen;
  return lerp(y0, D.pumpY, ramp(t, tD + 0.1, wt('deep', 'level') + 0.1));
}
const installed = (t) => t < tI - 0.01 || t >= tM - 0.01;

// run speed of the pump 0..1 (switched on in the motor line, off for the check valve, back on for "why")
const tOn = wt('motor', 'motor') - 0.1, tOff = wt('valve', 'stops') - 0.05, tOn2 = T('why') + 0.4;
function run(t) {
  if (t < tI - 0.01) return 1;
  if (t < tOn) return 0;
  return ramp(t, tOn, tOn + 1.4) * (1 - ramp(t, tOff, tOff + 0.9)) + ramp(t, tOn2, tOn2 + 1.2);
}
const OMEGA = 19;                       // rad/s on screen (a readable stand-in for 2900 rpm)
const DT = 1 / 600, NT = Math.ceil((END + 1) / DT);
const thTab = new Float32Array(NT + 1), cTab = new Float32Array(NT + 1), rTab = new Float32Array(NT + 1), phTab = new Float32Array(NT + 1);
for (let i = 1; i <= NT; i++) {
  const t = (i - 0.5) * DT, r = run(t);
  thTab[i] = thTab[i - 1] - OMEGA * r * DT;          // negative: vanes are backward-curved for this way round
  cTab[i] = cTab[i - 1] + 0.16 * r * DT;            // internal flow cycles
  rTab[i] = rTab[i - 1] + 1.55 * r * DT;            // distance along the column / delivery pipe
  phTab[i] = phTab[i - 1] + 6 * r * DT;             // rotating field
}
const look = (tab, t) => { const f = clamp(t / DT, 0, NT - 1), i = Math.floor(f); return lerp(tab[i], tab[i + 1], f - i); };
const theta = (t) => look(thTab, t), cyc = (t) => look(cTab, t), dist = (t) => look(rTab, t), phi = (t) => look(phTab, t);
function invC(c) {                                   // time at which cyc() reached c
  let lo = 0, hi = NT;
  if (c <= 0) return 0;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cTab[m] < c) lo = m; else hi = m; }
  return hi * DT;
}

// ----------------------------------------------------------------------------- camera shots
const k = (t, l, d, r, fov = 36) => ({ t, v: [...l, ...d, r, fov] });
const PB = D.pumpY, MOT = PB + 0.27, INT = PB + 0.61, STK = PB + 0.86, HEAD = PB + 1.12;
const deepKeys = [];
for (let i = 0; i <= 6; i++) {
  const t = lerp(tD, wt('deep', 'level') + 0.2, i / 6);
  const y = pumpBottom(t) + 0.6;
  deepKeys.push(k(t, [0.08, y + 0.25, 0], [0.22, 0.06, 1], lerp(3.6, 2.6, i / 6), 36));
}
deepKeys.push(k(tM - 0.05, [0.08, PB + 0.55, 0], [0.3, 0.1, 1], 2.0, 36));
const SHOTS = [
  [ // hook + question: the pump deep underwater, pull out to the whole bore, rise to the house
    k(0, [0, INT + 0.05, 0], [0.42, 0.1, 1], 1.15),
    k(wt('hook', 'completely') - 0.35, [0, INT + 0.1, 0], [0.36, 0.1, 1], 1.5),
    k(T('question') + 0.2, [0.3, -2.25, 0], [0.18, 0.09, 1], 9.3),
    k(wt('question', 'house') - 0.2, [0.6, -0.4, -0.2], [0.24, 0.12, 1], 7.2),
    k(tI - 0.05, [1.45, 1.6, -0.5], [0.38, 0.18, 1], 5.2),
  ],
  [ // install at the surface
    k(tI, [-0.1, 1.3, -0.25], [0.45, 0.2, 1], 5.0, 38),
    k(wt('install', 'pipe'), [-0.05, 1.15, -0.2], [0.3, 0.18, 1], 4.6, 38),
    k(tD - 0.05, [0.0, 0.85, -0.1], [0.12, 0.14, 1], 4.2, 38),
  ],
  deepKeys,
  [ // the motor
    k(tM, [0, MOT, 0], [0.6, 0.16, 1], 1.0),
    k(wt('motor', 'water') - 0.2, [0, MOT + 0.02, 0], [0.25, 0.14, 1], 0.95),
    k(T('intake') - 0.05, [0, MOT + 0.08, 0], [-0.25, 0.18, 1], 1.0),
  ],
  [ // the intake screen
    k(T('intake'), [0, INT, 0], [0.5, 0.08, 1], 0.72),
    k(T('stages') - 0.05, [0, INT + 0.01, 0], [0.12, 0.04, 1], 0.62),
  ],
  [ // the stack explodes into stages
    k(T('stages'), [0, STK - 0.05, 0], [0.42, 0.14, 1], 1.45),
    k(wt('stages', 'stack'), [0, STK + 0.05, 0], [0.36, 0.2, 1], 1.65),
    k(T('diffuser') - 0.05, [0, STK + 0.08, 0], [0.28, 0.22, 1], 1.6),
  ],
  [ // one stage: impeller out, diffuser up
    k(T('diffuser'), [0, PB + D.stageY(1) + 0.034 + 0.045, 0], [0.5, 0.5, 1], 0.5, 40),
    k(T('pressure') - 0.05, [0, PB + D.stageY(1) + 0.034 + 0.05, 0], [0.15, 0.42, 1], 0.46, 40),
  ],
  [ // pressure stage by stage
    k(T('pressure'), [0, STK - 0.04, 0], [0.38, 0.12, 1], 1.15),
    k(T('valve') - 0.05, [0, STK + 0.08, 0], [0.22, 0.1, 1], 1.1),
  ],
  [ // the check valve
    k(T('valve'), [0, HEAD + 0.01, 0], [0.5, 0.28, 1], 0.5, 38),
    k(T('why') - 0.05, [0, HEAD + 0.01, 0], [0.18, 0.2, 1], 0.44, 38),
  ],
  [ // why push from below: the whole bore, the surface pump beside it
    k(T('why'), [-0.45, -1.85, 0], [0.1, 0.06, 1], 9.4),
    k(T('outro') - 0.05, [-0.4, -1.85, 0], [0.18, 0.08, 1], 9.2),
  ],
  [ // outro: motor, stages, then all the way up to the tank
    k(T('outro'), [0, MOT, 0], [0.5, 0.15, 1], 1.35),
    k(wt('outro', 'stages') - 0.1, [0, STK, 0], [0.42, 0.15, 1], 1.35),
    k(wt('outro', 'pressure') + 0.4, [0.3, -1.6, 0], [0.3, 0.12, 1], 5.2),
    k(wt('outro', 'tank') + 0.2, [1.75, 2.85, -0.8], [0.3, 0.22, 1], 3.2),
    k(END, [1.7, 2.8, -0.8], [0.06, 0.2, 1], 3.6),
  ],
];
const SHOT = { hook: 0, install: 1, deep: 2, motor: 3, intake: 4, stages: 5, diffuser: 6, pressure: 7, valve: 8, why: 9, outro: 10 };
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
  camera.lookAt(v[0], v[1], v[2]);
  camera.fov = v[7]; camera.updateProjectionMatrix();
  camDist = v[6];
  closeL.position.copy(camera.position).add(v3(0.3, 0.4, 0));
  closeL.intensity = 1.6 * clamp((2.2 - v[6]) / 1.2);
  return si;
}

// ----------------------------------------------------------------------------- particles
const rnd = (() => { let s = 424242; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
function particles(n, size, opacity = 0.95) {
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, depthWrite: false, opacity, toneMapped: false }), n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.setColorAt(0, new THREE.Color());
  im.frustumCulled = false; im.renderOrder = 6;
  scene.add(im);
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
const pol = (r, a, y) => [r * Math.cos(a), y, -r * Math.sin(a)];     // pump-local cylindrical -> local xyz

// R: column pipe + delivery pipe, from the pump head to the tank
const route = new THREE.CurvePath();
const headOut = D.pumpY + D.headTop + 0.03;
route.add(new THREE.LineCurve3(v3(0, headOut, 0), v3(0, D.wellTop + 0.02, 0)));
for (const c of S.path.curves) route.add(c);
const LR = route.getLength(), NSR = 4000, sampR = [];
for (let i = 0; i <= NSR; i++) { const u = i / NSR; sampR.push(route.getPointAt(u), route.getTangentAt(u)); }
const tankS = LR;
const PR = particles(900, 0.0115);
const tmpV = new THREE.Vector3();
function updateRoute(t, vis, fillFrom) {
  const D0 = dist(t);
  for (let i = 0; i < PR.n; i++) {
    const sd = PR.seeds[i];
    let s = (D0 + sd[0] * LR) % LR;                 // continuous loop
    if (vis <= 0.001) { hide(PR, i); continue; }
    if (fillFrom != null) {                          // the pipe filling from the pump after switch-on
      const front = D0 - fillFrom;
      const s0 = (front - (1 - sd[0]) * LR);
      if (s0 < 0 || front <= 0) { hide(PR, i); continue; }
      s = s0 % LR;
    }
    const f = clamp(s / LR) * NSR, j = Math.min(NSR - 1, Math.floor(f)), u = f - j;
    const a = sampR[j * 2], b = sampR[j * 2 + 2], tg = sampR[j * 2 + 1];
    tmpV.set(sd[1] - 0.5, sd[2] - 0.5, sd[3] - 0.5); tmpV.addScaledVector(tg, -tmpV.dot(tg)).normalize().multiplyScalar(0.02 * Math.sqrt(sd[4]));
    const fade = clamp((tankS - s) / 0.12) * clamp(s / 0.05);
    const br = 0.75 + 0.25 * sd[4];
    put(PR, i, lerp(a.x, b.x, u) + tmpV.x, lerp(a.y, b.y, u) + tmpV.y, lerp(a.z, b.z, u) + tmpV.z, PR.size * lerp(0.4, 1, clamp((camDist - 0.6) / 2)) * (0.7 + 0.6 * sd[1]) * vis * fade, 0.25 * br, 0.62 * br, 1.0 * br);
  }
  done(PR);
}

// F: inside the pump. Up past the motor, in through the screen, through every stage, out the valve.
const PF = particles(620, 0.0042);
const S0 = 0.2, S1 = 0.27, S2 = 0.9;       // section boundaries along one trip
const VK = 1.1, DK = -1.25;
let explodeK = 0;
const EXP = 0.034;
const stageBase = (k) => D.stageY(k) + EXP * k * explodeK;
function updateFlow(t, vis, holdAbove = false) {
  const c = cyc(t), th = theta(t);
  const py = pumpBottom(t);
  for (let i = 0; i < PF.n; i++) {
    const [seed, lane, lane2, sa, sz] = PF.seeds[i];
    const s = (seed + c) % 1;
    if (vis <= 0.001) { hide(PF, i); continue; }
    let p, col = [0.35, 0.72, 1.0], size = PF.size * (0.75 + 0.5 * sz);
    if (s < S0) {                               // rising past the motor in the gap to the casing
      const kk = s / S0;
      p = pol(0.071 + 0.022 * lane, sa * Math.PI * 2 + kk * 0.6, lerp(-0.12, 0.55, kk));
      size *= ramp(kk, 0, 0.15);
      col = [0.3, 0.65, 1.0];
    } else if (s < S1) {                        // in through the screen
      const kk = (s - S0) / (S1 - S0);
      p = pol(lerp(0.088, 0.016, Math.pow(kk, 0.8)), sa * Math.PI * 2 + 0.6 + kk * 0.4, lerp(0.585, 0.64, kk) + 0.03 * lane2 * (1 - kk));
    } else if (s < S2) {                        // through the stages
      const ss = (s - S1) / (S2 - S1) * D.stages, kStage = Math.min(D.stages - 1, Math.floor(ss)), u = ss - kStage;
      const base = stageBase(kStage);
      const ch = Math.floor(sa * 6) / 6 * Math.PI * 2 + (Math.PI * 2 / 6) * (0.35 + 0.3 * lane);
      if (u < 0.42) {                            // riding the impeller vane outward (turns with it)
        const kk = u / 0.42, r = lerp(0.015, 0.052, Math.pow(kk, 0.85));
        p = pol(r, th + ch + VK * (r - 0.012) / 0.04, base + 0.008 + 0.012 * lane2);
        const sp = 0.6 + 0.6 * kk;
        col = [0.35 * sp + 0.2, 0.75 * sp + 0.15, 1.0];
      } else {                                   // back in and up through the diffuser
        const kk = (u - 0.42) / 0.58;
        const cExit = c - (u - 0.42) * (S2 - S1) / D.stages;          // cycles ago that it left the tip
        const thExit = theta(invC(cExit));
        const aExit = thExit + ch + VK;
        const r = lerp(0.056, 0.016, Math.pow(kk, 1.1));
        const a = aExit + DK * (0.057 - r) / 0.041 * 0.85;
        p = pol(r, a, lerp(base + 0.03, stageBase(kStage + 1 < D.stages ? kStage + 1 : kStage) + (kStage + 1 < D.stages ? 0.004 : D.stageH + 0.004), Math.pow(kk, 1.6)));
        const g = kStage / (D.stages - 1);
        col = [lerp(0.2, 0.75, g * kk + g * 0.3), lerp(0.55, 0.95, g), 1.0];
      }
      if (holdAbove) size *= 1;
    } else {                                     // out past the open valve into the column pipe
      const kk = (s - S2) / (1 - S2);
      const hb = stageBase(D.stages) - D.stageY(D.stages);
      const y = lerp(D.stageY(D.stages) + 0.006, D.headTop + 0.2, kk) + hb;
      const r = y < D.stageY(D.stages) + 0.06 + hb ? lerp(0.016, 0.034, ramp(kk, 0, 0.35)) : lerp(0.034, 0.02, ramp(kk, 0.35, 0.6));
      p = pol(r * (0.6 + 0.4 * lane), sa * Math.PI * 2, y);
      col = [0.85, 0.95, 1.0];
      size *= 1 - ramp(kk, 0.75, 1);
    }
    put(PF, i, p[0], p[1] + py, p[2], size * vis, col[0], col[1], col[2]);
  }
  done(PF);
}

// grit: sand grains that hit the screen and drop away
const PG = particles(90, 0.0055, 1);
function updateGrit(t, vis) {
  const py = pumpBottom(t);
  for (let i = 0; i < PG.n; i++) {
    const [seed, lane, l2, sa, sz] = PG.seeds[i];
    if (vis <= 0.001) { hide(PG, i); continue; }
    const s = (seed + (t - T('intake')) * 0.45 + 10) % 1;
    const a = sa * Math.PI * 2;
    let r, y;
    if (s < 0.5) { const kk = s / 0.5; r = lerp(0.096, 0.067, kk); y = lerp(0.66, 0.6, kk) - 0.04 * l2; }
    else { const kk = (s - 0.5) / 0.5; r = 0.067 + 0.02 * Math.sin(kk * Math.PI) * lane + 0.008; y = 0.6 - 0.04 * l2 - kk * kk * 0.35; }
    const p = pol(r, a, y);
    put(PG, i, p[0], p[1] + py, p[2], PG.size * (0.7 + 0.6 * sz) * vis * (1 - ramp(s, 0.85, 1)), 0.62, 0.44, 0.22);
  }
  done(PG);
}

// groundwater seeping toward the bore through the saturated layers, plus specks floating in the bore
const PW = particles(260, 0.012, 0.8);
function updateSeep(t, vis) {
  for (let i = 0; i < PW.n; i++) {
    const [seed, lane, l2, side, sz] = PW.seeds[i];
    if (vis <= 0.001) { hide(PW, i); continue; }
    const s = (seed + t * 0.05) % 1, sgn = side < 0.5 ? -1 : 1;
    const x0 = 0.4 + 2.6 * lane;
    const x = sgn * lerp(x0, D.boreR, s), y = lerp(D.waterY - 0.08, D.boreBottom + 0.15, l2) + 0.05 * Math.sin(s * 9 + seed * 20);
    put(PW, i, x, y, 0.012, PW.size * (0.6 + 0.6 * sz) * vis * ramp(s, 0, 0.1) * (1 - ramp(s, 0.9, 1)), 0.4, 0.78, 1.0);
  }
  done(PW);
}
const PK = particles(110, 0.0026, 0.7);
function updateSpecks(t, vis) {
  for (let i = 0; i < PK.n; i++) {
    const [seed, lane, l2, sa, sz] = PK.seeds[i];
    if (vis <= 0.001) { hide(PK, i); continue; }
    const y = D.pumpY - 0.2 + ((seed * 1.6 + t * 0.012 * (0.5 + sz)) % 1.6);
    const r = 0.068 + 0.03 * lane, a = sa * 6.283 + 0.3 * Math.sin(t * 0.5 + seed * 9);
    put(PK, i, r * Math.cos(a), y, -r * Math.sin(a), PK.size * (0.6 + 0.8 * sz) * vis, 0.8, 0.85, 0.75);
  }
  done(PK);
}

// ----------------------------------------------------------------------------- labels
const labels = new Labels(document.querySelector('.labels'), camera, canvas, { margin: 56, gap: 14 });
const allItems = [];
function label(obj, text, note, anchor, a, b) {
  const tr = TX.labels?.[text]; if (tr) [text, note] = tr;
  const it = labels.add(obj, text, { note, anchor }); it.win = [a, b]; allItems.push(it);
}
const lay = (n) => LAYERS.find((l) => l.name === n);
label(C.group, 'Chain hoist', 'on a tripod', [0, 2.45, 0], wt('install', 'lower'), wt('install', 'cable') - 0.2);
label(RS.pipe, 'Column pipe', 'the pump hangs from it', [D.riserR, 0.55, 0], wt('install', 'pipe'), tD - 0.1);
label(RS.cable, 'Power cable', 'tied to the pipe', [0, 0.8, 0], wt('install', 'cable'), tD - 0.1);
const yMid = (n) => (lay(n).top + lay(n).bot) / 2;
label(E.group, 'Soil', '', [-0.3, yMid('Clay'), 0], wt('deep', 'soil'), tM - 0.2);
label(E.group, 'Sand', '', [-0.32, yMid('Sand'), 0], wt('deep', 'sand'), tM - 0.2);
label(E.group, 'Rock', '', [-0.3, -3.9, 0], wt('deep', 'rock'), tM - 0.2);
label(E.group, 'Water level', 'groundwater', [0.32, D.waterY, 0], wt('deep', 'water'), tM - 0.2);
label(P.root, 'Sealed motor', 'cooled by the water', [D.pumpR, 0.3, 0.0], wt('motor', 'motor'), T('intake') - 0.2);
label(P.root, 'Intake screen', 'water in, sand out', [D.pumpR, 0.62, 0.0], wt('intake', 'intake'), T('stages') - 0.2);
label(P.stageGroups[4], 'Stages', 'impellers stacked up', [D.pumpR, 0.04, 0.0], wt('stages', 'stages'), T('diffuser') - 0.2);
label(P.stageGroups[1], 'Impeller', 'spins, flings outward', [0.045, 0.02, 0.02], wt('diffuser', 'impeller'), T('pressure') - 0.2);
label(P.stageGroups[1], 'Diffuser', 'guides it up', [-0.05, 0.055, 0.02], wt('diffuser', 'diffuser'), T('pressure') - 0.2);
label(P.head, 'Check valve', 'one-way door', [0.03, 0.04, 0.0], wt('valve', 'check'), T('why') - 0.2);
label(SP.group, 'Surface pump', 'pulls: only ~8 m', [D.suctionX, -0.9, 0.06], wt('why', 'surface'), T('outro') - 0.2);
label(P.root, 'Submersible', 'pushes from below', [0, 0.6, 0], wt('why', 'pushing'), T('outro') - 0.2);

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
const titleEl = document.getElementById('title'), stateEl = document.getElementById('state'), chainEl = document.getElementById('chain');
const meterEl = document.getElementById('meter'), depthEl = document.getElementById('depth'), pinEl = document.getElementById('pin8');
if (TX.pin8) pinEl.textContent = TX.pin8;
meterEl.innerHTML = `<b>${TX.pressure || 'Pressure'}</b><div>${'<i></i>'.repeat(D.stages)}</div>`;
const CH_W = ['motor', 'stages', 'pressure', 'tank'];
const CHAIN = CH_W.map((c, i) => [(TX.chain || ['Motor', 'Stages', 'Pressure', 'Your tank'])[i], wt('outro', c)]);
chainEl.innerHTML = CHAIN.map(([w], i) => (i ? '<i>▼</i>' : '') + `<div>${w}</div>`).join('');
function show(el, o, y = 0) { el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.002 ? 'visible' : 'hidden'; if (y) el.style.translate = `0 ${y}px`; }
const pressureAt = (kk) => T('pressure') + 0.15 + kk * 0.42;
function project(v) { const p = v.clone().project(camera); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H]; }

function updateOverlays(t) {
  const tt = win(t, -1, T('question') + 0.4, 0.35);
  show(titleEl, tt, (1 - clamp(tt)) * 20);
  // depth counter while the pump goes down
  const dv = win(t, tD + 0.2, tM - 0.3, 0.2);
  show(depthEl, dv);
  if (dv > 0) {
    const ft = Math.round(clamp((-pumpBottom(t)) / -D.pumpY) * 200);
    depthEl.innerHTML = `${ft}<small>${TX.feet || 'FT'}</small>`;
  }
  // pressure meter: one bar per stage
  const mv = win(t, T('pressure') + 0.05, T('valve') - 0.1, 0.2);
  show(meterEl, mv);
  [...meterEl.querySelectorAll('i')].forEach((el, i) => { const o = ramp(t, pressureAt(i), pressureAt(i) + 0.15); el.style.opacity = 0.18 + 0.82 * o; el.style.transform = `scaleY(${lerp(0.5, 1, o)})`; });
  // state chips
  let st = '', so = 0, colr = '#fff';
  const s1 = wt('why', 'eight'), s2 = wt('why', 'pushing');
  if (t > s1 - 0.3 && t < s2 - 0.05) { st = TX.suck || 'Suction ✗ max 8 m'; so = win(t, s1, s2 - 0.1, 0.15); colr = '#ff6b5e'; }
  if (t > s2 - 0.1 && t < T('outro') + 0.3) { st = TX.push || 'Push ✓ no limit'; so = win(t, s2, T('outro') - 0.1, 0.15); colr = '#5fe08a'; }
  const v0 = wt('valve', 'stops');
  if (t > v0 && t < T('why')) { st = TX.off || 'Pump off ➜ valve shut'; so = win(t, wt('valve', 'falling') - 0.1, T('why') - 0.15, 0.15); colr = '#ffd23f'; }
  stateEl.textContent = st; stateEl.style.color = colr; show(stateEl, so);
  // "8 m" tag beside the bracket
  const pv = win(t, wt('why', 'eight') - 0.1, T('outro') - 0.1, 0.2);
  show(pinEl, pv);
  if (pv > 0) { const [x, y] = project(v3(D.suctionX - 0.14, D.waterY + 0.355, 0.06)); pinEl.style.transform = `translate(${(x - pinEl.offsetWidth - 6).toFixed(1)}px, ${(y - pinEl.offsetHeight / 2).toFixed(1)}px)`; }
  // outro chain
  const cv = 1 - ramp(t, VOICE.duration - 0.1, VOICE.duration + 0.3);
  show(chainEl, t > CHAIN[0][1] - 0.3 ? cv : 0);
  [...chainEl.children].forEach((el, j) => {
    const idx = Math.floor(j / 2 + 0.5);
    const at = CHAIN[Math.min(idx, 3)][1] - (el.tagName === 'I' ? 0.12 : 0.05);
    const o = ramp(t, at, at + 0.18);
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
const _amber = new THREE.Color('#ff9a2e'), _red = new THREE.Color('#ff3b30'), _blue = new THREE.Color('#2f8bff'), _dark = new THREE.Color('#3a2a22'), _cyan = new THREE.Color('#4fd8ff');
const _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion(), _qr = new THREE.Quaternion().setFromAxisAngle(v3(0, 1, 0), Math.PI / 2), _qx = new THREE.Quaternion().setFromAxisAngle(v3(1, 0, 0), Math.PI / 2);

function chainLinks(im, from, to, offset, start = 0) {
  const d = to.clone().sub(from), L = d.length(), n = Math.floor(L / 0.026);
  const q0 = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), d.clone().normalize());
  for (let i = 0; i < n && start + i < im.count; i++) {
    const s = (i * 0.026 + (offset % 0.052)) / L; if (s > 1) { im.setMatrixAt(start + i, _m4.makeScale(0, 0, 0)); continue; }
    const q = q0.clone().multiply(i % 2 ? _qr : _qq);
    im.setMatrixAt(start + i, _m4.compose(from.clone().addScaledVector(d, s), q, _s.setScalar(1)));
  }
  return start + n;
}

// ----------------------------------------------------------------------------- per frame
function renderAt(t) {
  const shot = setCamera(t);
  const inst = installed(t), py = pumpBottom(t), r = run(t);

  // which pieces exist in this part of the story
  E.front.visible = shot === SHOT.install;
  C.group.visible = t >= tI - 0.01 && t < tM - 0.01;
  S.wellhead.visible = inst; S.pipe.visible = inst;
  SP.group.visible = shot === SHOT.why;

  // pump + riser
  P.root.position.y = py;
  const th = theta(t);
  for (const s of P.spinners) s.rotation.y = th;
  // exploded stack during "stages" and "diffuser"
  explodeK = ramp(t, wt('stages', 'not') - 0.1, wt('stages', 'stack') + 0.2) * (1 - ramp(t, T('pressure') - 0.25, T('pressure') + 0.35));
  P.stageGroups.forEach((g, kk) => { g.position.y = stageBase(kk); });
  P.head.position.y = stageBase(D.stages);
  const pumpTop = py + D.headTop + EXP * D.stages * explodeK + 0.025;
  const riserTop = inst ? D.wellTop + 0.02 : clampY(Math.min(t, tD));
  RS.pipe.position.y = pumpTop; RS.pipe.scale.y = Math.max(0.001, riserTop - pumpTop);
  RS.cable.position.y = pumpTop; RS.cable.scale.y = Math.max(0.001, riserTop - pumpTop);
  RS.pcable.position.set(-0.03, py + 0.53 + 0.32 + EXP * D.stages * explodeK * 0.5, -D.pumpR - 0.009);
  RS.pcable.scale.y = (0.64 + EXP * D.stages * explodeK) / 0.64;
  let ci = 0;
  for (let y = pumpTop + 0.9; y < riserTop - 0.08 && ci < 8; y += 0.9) RS.cpl.setMatrixAt(ci++, _m4.makeTranslation(0, y, 0));
  for (; ci < 8; ci++) RS.cpl.setMatrixAt(ci, _m4.makeScale(0, 0, 0));
  RS.cpl.instanceMatrix.needsUpdate = true;
  let ti = 0;
  for (let y = pumpTop + 0.3; y < riserTop - 0.05 && ti < 12; y += 0.45) RS.ties.setMatrixAt(ti++, _m4.compose(v3(0, y, 0), _qx, _s.setScalar(1)));
  for (; ti < 12; ti++) RS.ties.setMatrixAt(ti, _m4.makeScale(0, 0, 0));
  RS.ties.instanceMatrix.needsUpdate = true;
  // the column pipe becomes see-through when the flow inside matters
  RS.mat.opacity = 0.4;

  // casing + bore water: thin in close-ups so the pump reads clearly
  const close = clamp((2.6 - camDist) / 1.4);
  B.casingMat.opacity = lerp(0.3, 0.07, close);
  B.waterMat.opacity = lerp(0.22, 0.06, close);

  // x-ray of the pump's shells
  const xm = win(t, wt('motor', 'sealed') + 0.2, T('intake') - 0.1, 0.35) + win(t, T('outro') - 0.05, wt('outro', 'stages') - 0.2, 0.2);
  const xs = win(t, T('stages') + 0.4, T('valve') - 0.2, 0.35) + win(t, wt('outro', 'stages') - 0.2, wt('outro', 'pressure'), 0.2) + win(t, T('intake') + 0.3, T('stages') - 0.1, 0.3) * 0.6;
  const xh = win(t, T('valve') - 0.05, T('why') - 0.05, 0.3) + win(t, T('pressure') + 1.5, T('valve'), 0.3) * 0.7;
  xray(P.xr.motor, clamp(xm), 0.08); xray(P.xr.core, clamp(xm), 0.3); xray(P.xr.stages, clamp(xs), 0.1); xray(P.xr.head, clamp(xh), 0.1);

  // motor coils: warm when powered, then a rotating north/south pattern while running
  const powered = clamp(r * 1.5) * (t >= tI ? 1 : 1);
  const showField = win(t, wt('motor', 'motor'), T('intake'), 0.3) + win(t, T('outro'), wt('outro', 'stages'), 0.2);
  const ph = phi(t);
  for (const { a, m } of P.coilMats) {
    const d = Math.cos(a - ph);
    const n = Math.pow(Math.max(0, d), 3), s = Math.pow(Math.max(0, -d), 3);
    m.emissive.setRGB(0, 0, 0).lerp(_amber, powered * 0.35)
      .add(_red.clone().multiplyScalar(n * showField * 2.6)).add(_blue.clone().multiplyScalar(s * showField * 2.6));
  }
  P.shaftMat.emissive.copy(_amber).multiplyScalar(0.6 * win(t, wt('stages', 'trick'), wt('stages', 'impeller'), 0.25));
  // impellers glow in turn for "pressure", and as a cue for "impeller"
  P.impMats.forEach((m, kk) => {
    const g = 0.9 * ramp(t, pressureAt(kk), pressureAt(kk) + 0.15) * (1 - ramp(t, T('valve') - 0.3, T('valve')))
      + 0.5 * win(t, wt('stages', 'impeller'), wt('stages', 'stack') + 0.3, 0.2)
      + (kk === 1 ? 0.6 * win(t, wt('diffuser', 'impeller'), wt('diffuser', 'diffuser'), 0.2) : 0);
    m.emissive.copy(_amber).multiplyScalar(g);
  });
  // check valve opens with the flow, shuts when the pump stops
  const vOpen = clamp(r * 1.3) * (1 - ramp(t, wt('valve', 'falling') - 0.35, wt('valve', 'falling') + 0.05) * (t < tOn2 ? 1 : 0));
  P.poppet.position.y = lerp(P.poppet.userData.closedY, P.poppet.userData.openY, inst ? Math.max(vOpen, t < tI ? 1 : 0) : 0);

  // surface: panel lamps, tank level
  S.lampOn.emissive.set('#000').lerp(new THREE.Color('#3dff6a'), r > 0.05 ? 1 : 0);
  S.lampOff.emissive.set('#000').lerp(new THREE.Color('#ff3b30'), r <= 0.05 && inst ? 1 : 0);
  const fillFrom = t >= tM ? dist(tOn) : null;
  const tankArrive = (D0) => D0;
  const lvl = t < tI ? 0.45 : clamp(0.08 + 0.4 * clamp((dist(t) - dist(tOn) - LR) / (dist(END) - dist(tOn) - LR + 0.01)), 0.08, 0.5);
  S.tankWater.scale.y = lvl; S.tankWater.position.y = D.tank[1] + 0.02 + lvl / 2;

  // install crew
  if (C.group.visible) {
    const cy = clampY(t);
    C.clamp.position.set(0, cy, 0);
    const ofs = (1.75 - cy) * 6;
    let n = chainLinks(C.loadChain, v3(0, 2.3, 0), v3(0, cy + 0.08, 0), (1.75 - cy));
    for (; n < C.loadChain.count; n++) C.loadChain.setMatrixAt(n, _m4.makeScale(0, 0, 0));
    C.loadChain.instanceMatrix.needsUpdate = true;
    let m = chainLinks(C.handChain, v3(0.13, 2.45, 0.11), v3(0.3, 0.95, 0.12), ofs);
    m = chainLinks(C.handChain, v3(0.13, 2.45, -0.11), v3(0.32, 0.95, -0.02), -ofs, m);
    for (; m < C.handChain.count; m++) C.handChain.setMatrixAt(m, _m4.makeScale(0, 0, 0));
    C.handChain.instanceMatrix.needsUpdate = true;
    C.wheel.rotation.x = -ofs / 0.11;
    C.reel.rotation.x = -(1.75 - cy + (t > tD ? (D.pumpY - pumpBottom(t)) * -1 : 0)) / 0.22;
    // worker A pulls the hand chain, hand over hand
    const pull = ramp(t, tI + 0.2, tI + 0.6) * (1 - ramp(t, tD + 0.2, tD + 0.6));
    const phs = (t - tI) * Math.PI * 2 * 1.15;
    C.A.arms.forEach((a, j) => {
      const s = Math.sin(phs + j * Math.PI);
      a.sh.rotation.x = lerp(-1.0, -1.55 + 0.45 * s, pull); a.sh.rotation.z = (j ? -1 : 1) * 0.12;
      a.el.rotation.x = lerp(-0.4, -0.25 - 0.55 * (1 - s), pull);
    });
    C.A.torso.rotation.x = 0.06 * pull * Math.sin(phs * 2);
    C.A.legs.forEach((l, j) => { l.hip.rotation.x = j ? -0.15 : 0.12; l.knee.rotation.x = j ? 0.2 : 0.05; });
    // worker B steadies the pipe and cable
    const hgt = clamp(cy - 0.35, 0.75, 1.35);
    C.B.arms.forEach((a, j) => {
      a.sh.rotation.x = -1.15 - (1.3 - hgt) * 0.9 + 0.04 * Math.sin(t * 2 + j);
      a.sh.rotation.z = (j ? 1 : -1) * 0.12;
      a.el.rotation.x = -0.45 - (1.3 - hgt) * 0.6;
    });
    C.B.torso.rotation.x = clamp((1.2 - hgt) * 0.5, 0, 0.35);
    C.B.legs.forEach((l, j) => { l.hip.rotation.x = j ? -0.25 : 0.2 - C.B.torso.rotation.x; l.knee.rotation.x = j ? 0.35 : 0.3; });
    C.B.head.rotation.x = 0.25; C.A.head.rotation.x = -0.25 * pull;
  }

  // "why": the surface pump's water column stops at 8 m
  if (SP.group.visible) {
    const h = 0.71 * ramp(t, wt('why', 'suck') - 0.2, wt('why', 'eight') + 0.2);
    SP.col.scale.y = Math.max(0.001, h + 0.45);
    SP.col.position.y = D.waterY - 0.45;
    const bv = win(t, wt('why', 'eight') - 0.1, T('outro'), 0.2);
    const xb = D.suctionX - 0.1;
    SP.bar.position.set(xb, D.waterY + 0.355, 0.08); SP.bar.scale.y = 0.71;
    SP.t1.position.set(xb, D.waterY, 0.07); SP.t2.position.set(xb, D.waterY + 0.71, 0.07);
    SP.limit.position.set(D.suctionX, D.waterY + 0.71, 0.075);
    SP.brM.opacity = bv; SP.limit.material.opacity = bv * (0.6 + 0.4 * Math.sin(t * 9));
    SP.br.visible = bv > 0.01; SP.limit.visible = bv > 0.01;
  }

  // particles
  const flowVis = inst ? 1 : 0;
  updateRoute(t, flowVis * (shot === SHOT.diffuser || shot === SHOT.intake ? 0 : 1), fillFrom);
  const insideShots = [SHOT.hook, SHOT.motor, SHOT.intake, SHOT.stages, SHOT.diffuser, SHOT.pressure, SHOT.valve, SHOT.outro];
  const fv = inst && insideShots.includes(shot) && camDist < 3 ? 1 - win(t, T('stages') + 0.3, T('diffuser') - 0.1, 0.3) : 0;
  updateFlow(t, fv * clamp(r * 3 + (t > tOff ? 1 : 0)));
  updateGrit(t, shot === SHOT.intake ? win(t, wt('intake', 'mesh'), T('stages'), 0.2) : 0);
  updateSeep(t, 1);
  updateSpecks(t, inst ? 1 : 0);

  renderer.render(scene, camera);
  updateOverlays(t);
}

window.__T = { lines: LINE, END, T, run, pumpBottom };
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
