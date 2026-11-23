// The Parker Incident: the page is a pure function of time. window.__renderAt(t) draws frame t.
import * as THREE from 'three';
import { VOICE } from './lines.js';
import { PLAN } from './plan.js';
import { Person, Spider, walkCycle, mat, mesh, CYAN } from './rig.js';
import { buildLab, buildAlley, Terrarium } from './world.js';

// ------------------------------------------------------------------------------------------ time helpers
const LINE = Object.fromEntries(VOICE.lines.map(l => [l.id, l]));
const norm = s => s.toLowerCase().replace(/[^a-z']/g, '');
const T = id => LINE[id].start, E = id => LINE[id].end;
function wt(id, w, nth = 0) {
  const ws = LINE[id].words.filter(x => norm(x.w) === norm(w));
  if (!ws.length) throw new Error(`no word ${w} in ${id}`);
  return ws[Math.min(nth, ws.length - 1)].t;
}
const at = s => typeof s === 'number' ? s : s.length === 2 ? T(s[0]) + s[1] : wt(s[0], s[1]) + s[2];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sm = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mixV = (a, b, k) => a.clone().lerp(b, k);
function lerpAngle(a, b, k) { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * k; }
function rampLinear(t, a, b, r) { // 0..1 with constant speed in the middle and eased ends
  const D = b - a, u = clamp(t - a, 0, D), v = 1 / (D - r);
  if (u < r) return 0.5 * v * u * u / r;
  if (u < D - r) return v * (u - r / 2);
  return 1 - 0.5 * v * (D - u) * (D - u) / r;
}

const S2 = T('s2a') - 1.5, S3 = T('s3a') - 1.6, END_AT = VOICE.duration + 0.4, DUR = VOICE.duration + 5.0;
const P = {};
for (const [k, v] of Object.entries(PLAN)) if (k !== 'walks') P[k] = typeof v === 'number' ? v : at(v);
const W = {};
for (const [k, w] of Object.entries(PLAN.walks)) {
  const pts = w.path.map(([x, z]) => new THREE.Vector2(x, z));
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const len = cum[cum.length - 1];
  W[k] = { ...w, pts, cum, len, t0: at(w.t0), t1: at(w.t0) + len / w.speed };
}
function pathAt(w, d) {
  d = clamp(d, 0, w.len);
  let i = 1; while (i < w.cum.length - 1 && w.cum[i] < d) i++;
  const k = (d - w.cum[i - 1]) / (w.cum[i] - w.cum[i - 1]);
  return w.pts[i - 1].clone().lerp(w.pts[i], k);
}
function walkAt(w, t) {
  const d = clamp((t - w.t0) * w.speed, 0, w.len);
  const p = pathAt(w, d);
  const a = pathAt(w, d - 0.3), b = pathAt(w, d + 0.45);
  const dir = b.sub(a);
  const heading = Math.atan2(dir.x, dir.y);
  const amt = sm(w.t0, w.t0 + 0.35, t) * (1 - sm(w.t1 - 0.3, w.t1 + 0.05, t));
  return { x: p.x, z: p.y, heading, phase: d / w.step * Math.PI, amt, d };
}

// ------------------------------------------------------------------------------------------ renderer + worlds
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const EXPO = { lab: 1.0, alley: 1.12 };
renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 200);

const lab = buildLab(), alley = buildAlley();
const terr = new Terrarium(); terr.root.position.set(-0.2, 0.92, -8.3); lab.scene.add(terr.root);
// bench lamp (off) at the back of the far bench: the specimen's route to the hand
{
  const g = new THREE.Group(); lab.scene.add(g);
  const st = mat('#a6acb0', 0.35, 0.8);
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 8), st, g, [0.92, 0.93, -8.5]);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.58, 6), st, g, [0.92, 1.21, -8.5]);
  const arm = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.58, 6), st, g, [0.71, 1.5, -8.3]);
  arm.lookAt(0.5, 1.5, -8.1); arm.rotateX(Math.PI / 2);
  const hd = mesh(new THREE.ConeGeometry(0.07, 0.09, 8, 1, true), mat('#c9ced1', 0.5, 0, { side: THREE.DoubleSide }), g, [0.5, 1.465, -8.05]);
  void hd;
}
const LAMP = v3(0.5, 1.425, -8.05), HANDSPOT = v3(0.5, 0.936, -8.05);
// clipboard
const clip = new THREE.Group(); lab.scene.add(clip);
mesh(new THREE.BoxGeometry(0.23, 0.008, 0.31), mat('#9b8466', 0.9), clip, [0, 0, 0]);
mesh(new THREE.BoxGeometry(0.2, 0.002, 0.26), mat('#e9e9e4', 0.9), clip, [0, 0.005, -0.015]);
mesh(new THREE.BoxGeometry(0.08, 0.012, 0.03), mat('#a6acb0', 0.35, 0.8), clip, [0, 0.008, 0.14]);

const person = new Person();
const spider = new Spider(); lab.scene.add(spider.root, spider.thread);

// ------------------------------------------------------------------------------------------ the actor
const FACE = Math.PI; // facing the far bench (-z)
function localToWorld(p, x, y, z) {
  const c = Math.cos(p.heading), s = Math.sin(p.heading);
  return v3(p.x + x * c + z * s, (p.y || 0) + y, p.z - x * s + z * c);
}
const dirToWorld = (p, x, y, z) => localToWorld({ x: 0, z: 0, heading: p.heading }, x, y, z);

function idle(p, t) { p.bob = 0.004 * Math.sin(t * 1.7); }

function actor1(t) {
  const w = walkAt(W.enter, t), c = walkCycle(w.phase, w.amt);
  const p = { x: w.x, z: w.z, heading: t > W.enter.t1 ? FACE : w.heading, bob: c.bob, twist: c.twist, legs: c.legs,
    arms: { L: { ...c.armL }, R: { ...c.armR } }, lean: 0.03, headPitch: 0.05 };
  if (t > W.enter.t1 - 0.1) idle(p, t);
  const lean = sm(W.enter.t1 + 0.1, W.enter.t1 + 1.6, t);
  p.lean = lerp(0.03, 0.3, lean); p.headPitch = lerp(0.05, 0.42, lean);
  // left hand to the latch, then the lid lifts
  const lift = sm(P.lid_lift, P.lid_lift + 1.3, t);
  const latch = v3(-0.2, 1.155 + 0.05 * lift, -8.165 + 0.004 * lift);
  p.arms.L = { ...p.arms.L, ik: latch, w: sm(P.latch - 1.3, P.latch - 0.2, t), pole: v3(0.7, -0.5, -0.4) };
  p.headYaw = 0.18 * lean;
  return { p, lid: 14 * lift };
}

function actor2(t) {
  const c = P.contact, lv = W.leave;
  const p = { x: 0.15, z: -7.6, heading: FACE, lean: 0.31, headPitch: 0.55, headYaw: 0.16, arms: { L: {}, R: {} },
    legs: { L: { hip: 0.08, knee: 0.08 }, R: { hip: 0.04, knee: 0.05 } } };
  idle(p, t);
  // flinch
  const fl = sm(c + 0.08, c + 0.32, t);
  const settle = sm(c + 0.4, c + 1.4, t);
  p.lean = lerp(0.31, 0.1, fl) + 0.04 * settle;
  p.headYaw = lerp(0.16, -0.32, sm(c + 0.15, c + 0.6, t));
  p.headPitch = lerp(0.55, 0.32, sm(c + 0.15, c + 0.6, t));
  const once = wt('s2f', 'once');
  p.headPitch += 0.28 * (sm(once - 0.6, once - 0.2, t) - sm(once + 0.3, once + 0.8, t));
  // right hand: flat on the bench → flinch to the chest → raised to look at it
  const flat = HANDSPOT.clone();
  const chest = localToWorld(p, -0.1, 1.2, 0.27);
  const raised = localToWorld(p, -0.05, 1.31, 0.35);
  const rk = sm(P.lid_close + 1.0, P.lid_close + 1.8, t);
  let rt = mixV(flat, chest, fl); rt = mixV(rt, raised, rk);
  const handFlat = { fingers: v3(0.15, 0, -1), palm: v3(0, -1, 0) };
  const handUp = { fingers: v3(-0.25, 1, 0.1), palm: dirToWorld(p, 0, 0, -1) };
  p.arms.R = { ik: rt, w: 1, pole: v3(-0.8, -0.4, -0.3), hand: fl > 0.5 ? handUp : handFlat, hw: fl > 0.5 ? rk : 1 - fl * 2 };
  if (rk > 0) { p.headYaw = lerp(p.headYaw, -0.1, rk); p.headPitch = lerp(p.headPitch, 0.25, rk); }
  // left hand: clipboard → bench → lid
  const hold = localToWorld(p, 0.12, 1.06, 0.33);
  const putPt = v3(-0.62, 0.95, -8.02);
  const pd = sm(P.put_down, P.put_down + 0.6, t);
  const lc0 = Math.max(P.lid_close + 0.15, P.put_down + 0.9);
  const lidK = sm(lc0, lc0 + 0.6, t);
  const lidDeg = 14 * (1 - lidK);
  const lidFront = v3(-0.2, 1.14 + 0.24 * Math.sin(THREE.MathUtils.degToRad(lidDeg)) + 0.02, -8.17);
  const toLid = sm(P.put_down + 0.6, lc0, t), back = sm(lc0 + 0.7, lc0 + 1.5, t);
  let lt = mixV(hold, putPt, pd); lt = mixV(lt, lidFront, toLid);
  p.arms.L = { ik: lt, w: 1 - back, pole: v3(0.8, -0.5, -0.3), hand: { fingers: dirToWorld(p, 0, -0.3, 1), palm: v3(0, -1, 0) }, hw: toLid * (1 - back), el: 0.2 };
  // clipboard pose
  const cbHand = hold.clone().add(dirToWorld(p, 0, 0.02, 0.05));
  const cbPos = mixV(cbHand, v3(-0.62, 0.928, -8.0), pd);
  const cbQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(lerp(-0.85, 0, pd), FACE + 0.1 * pd, 0, 'YXZ'));
  // walking out
  if (t > lv.t0 - 0.6) {
    const w = walkAt(lv, t), cy = walkCycle(w.phase, w.amt);
    const k = sm(lv.t0 - 0.5, lv.t0 + 0.4, t);
    p.x = w.x; p.z = w.z; p.heading = lerpAngle(FACE, w.heading, k);
    p.bob = cy.bob; p.twist = cy.twist; p.legs = cy.legs;
    p.lean = lerp(p.lean, 0.05, k); p.headPitch = lerp(p.headPitch, 0.1, k); p.headYaw = lerp(p.headYaw, 0, k);
    p.arms.L = { ...cy.armL, w: 0 };
    p.arms.R = { ik: localToWorld(p, -0.1, 1.15, 0.25), w: 1 - k * 0.6, pole: v3(-0.8, -0.4, -0.3), el: 1.2, fwd: 0.4 };
  }
  return { p, lid: lidDeg, cbPos, cbQ };
}

function actor3(t) {
  const w = walkAt(W.alley, t), c = walkCycle(w.phase, w.amt);
  const WALL = -1.6, Z0 = 2.0, FW = -Math.PI / 2;
  const arrived = sm(W.alley.t1 - 0.2, W.alley.t1 + 0.9, t);
  const p = { x: w.x, z: w.z, heading: lerpAngle(w.heading, FW, arrived), bob: c.bob, twist: c.twist, legs: c.legs,
    arms: { L: { ...c.armL }, R: { ...c.armR } }, lean: 0.03, headPitch: 0.05 };
  if (t > W.alley.t1) idle(p, t);
  const brick = wt('s3c', 'brick');
  p.headPitch = 0.05 - 0.55 * (sm(brick - 0.4, brick + 0.8, t) - sm(P.hand_right - 1.2, P.hand_right - 0.2, t) * 0.7);
  const flatQ = { fingers: v3(0, 1, 0), palm: v3(-1, 0, 0) };
  const rFlat = v3(WALL + 0.035, 1.5, Z0 - 0.22), lFlat = v3(WALL + 0.035, 1.52, Z0 + 0.22);
  const kR = sm(P.hand_right - 0.3, P.hand_right + 0.5, t), kL = sm(P.hand_left - 0.3, P.hand_left + 0.5, t);
  p.arms.R = { ...p.arms.R, ik: rFlat, w: kR, pole: v3(-0.8, -0.6, -0.2), hand: flatQ, hw: kR };
  p.arms.L = { ...p.arms.L, ik: lFlat, w: kL, pole: v3(0.8, -0.6, -0.2), hand: flatQ, hw: kL };
  p.lean = lerp(0.03, 0.1, Math.max(kR, kL));
  // the climb
  const c0 = P.climb_start, c1 = c0 + P.climb_time;
  if (t > c0 - 0.4) {
    const f = rampLinear(t, c0, c1, 1.0), h = P.climb_height * f;
    const k = sm(c0 - 0.4, c0 + 0.5, t);
    p.y = h; p.x = lerp(p.x, WALL + 0.34, k); p.lean = lerp(p.lean, 0.16, k);
    p.headPitch = lerp(p.headPitch, -0.35, k);
    const C = 0.9, phase = h / C;
    for (const [side, s, zoff] of [['R', 0, -0.23], ['L', 0.5, 0.23]]) {
      const u = phase + s, kk = Math.floor(u), fr = u - kk;
      const g0 = 1.5 + (kk - s) * C, g1 = g0 + C;
      const reach = sm(0.72, 1.0, fr);
      const gy = lerp(g0, g1, reach) + 0.12 * Math.sin(Math.PI * reach) * 0;
      const off = 0.09 * Math.sin(Math.PI * reach);
      const tgt = v3(WALL + 0.035 + off, gy + 0.25, Z0 + zoff);
      const a = p.arms[side];
      a.ik = mixV(side === 'R' ? rFlat : lFlat, tgt, k); a.w = 1; a.hand = flatQ; a.hw = 1;
      const legPh = (u + 0.5) * Math.PI * 2;
      p.legs = p.legs || {};
      const L = side === 'R' ? 'L' : 'R';
      p.legs[L] = { hip: lerp(0, 0.75 + 0.35 * Math.sin(legPh), k), knee: lerp(0, 1.15 + 0.35 * Math.sin(legPh), k), ankle: 0.25 * k };
    }
    p.bob = 0; p.twist = 0;
  }
  return { p };
}

// ------------------------------------------------------------------------------------------ the specimen
const EX = P.spider_exit, CT = P.contact;
const SK = [ // t, pos, normal
  [S2, [-0.27, 0.954, -8.31], [0, 1, 0]],
  [S2 + 2.5, [-0.25, 0.954, -8.3], [0, 1, 0]],
  [EX - 0.6, [-0.17, 0.954, -8.225], [0, 1, 0]],
  [EX - 0.2, [-0.165, 0.975, -8.19], [0, 0, -1]],
  [EX + 0.45, [-0.16, 1.11, -8.19], [0, 0, -1]],
  [EX + 0.8, [-0.15, 1.152, -8.178], [0, 1, 0]],
  [EX + 1.1, [-0.145, 1.12, -8.168], [0, 0, 1]],
  [EX + 1.9, [-0.13, 0.94, -8.168], [0, 0, 1]],
  [EX + 2.2, [-0.11, 0.922, -8.14], [0, 1, 0]],
  [EX + 4.4, [0.35, 0.922, -8.4], [0, 1, 0]],
  [39.0, [0.86, 0.922, -8.46], [0, 1, 0]],
  [39.2, [0.9, 0.942, -8.465], [0, 1, 0]],
  [39.35, [0.92, 0.965, -8.487], [0, 0, 1]],
  [40.35, [0.92, 1.47, -8.487], [0, 0, 1]],
  [40.55, [0.905, 1.489, -8.48], [0, -1, 0]],
  [41.15, [0.53, 1.489, -8.09], [0, -1, 0]],
  [41.35, [0.5, 1.42, -8.05], [0, -1, 0]],
  [CT - 0.6, [0.5, 1.02, -8.05], [0, 1, 0]],
  [CT, [0.5, 0.956, -8.05], [0, 1, 0]],
  [CT + 0.12, [0.5, 0.956, -8.05], [0, 1, 0]],
  [CT + 0.38, [0.56, 0.922, -8.02], [0, 1, 0]],
  [CT + 1.6, [-0.55, 0.922, -8.6], [0, 1, 0]],
];
function spiderAt(t) {
  if (t >= CT + 1.6) return null;
  let i = 1; while (i < SK.length - 1 && SK[i][0] < t) i++;
  const [ta, pa, na] = SK[i - 1], [tb, pb, nb] = SK[i];
  const k = clamp((t - ta) / (tb - ta), 0, 1);
  const pos = v3(...pa).lerp(v3(...pb), k), n = v3(...na).lerp(v3(...nb), sm(0, 1, k)).normalize();
  const seg = v3(...pb).sub(v3(...pa));
  const speed = seg.length() / Math.max(1e-3, tb - ta);
  const fwd = seg.lengthSq() > 1e-8 ? seg.normalize() : v3(0, 0, 1);
  const hanging = t > 41.35 && t < CT;
  // jitter while idle inside
  if (t < EX - 0.6) pos.x += 0.004 * Math.sin(t * 2.1);
  return { pos, n, fwd: hanging ? v3(0, 0, 1) : fwd, moving: hanging ? 0.15 : clamp(speed * 12, 0, 1), phase: t * 22, hanging };
}

// ------------------------------------------------------------------------------------------ shots
const W1 = W.enter, W2 = W.leave, W3 = W.alley;
const CAM_LAB = { pos: v3(3.72, 2.86, 8.55), look: v3(0.2, 0.7, -2.5), fov: 64 };
const shots = [
  { t0: 0, cam: () => CAM_LAB, tag: 'CAM 02 · EAST LAB' },
  { t0: 9.3, cam: t => { const w = walkAt(W1, t - 0.35); return { pos: v3(2.72, 1.62, w.z + 1.15), look: v3(w.x, 1.2, w.z - 0.2), fov: 50 }; } },
  { t0: W1.t1 - 0.3, cam: t => { const k = sm(W1.t1 - 0.3, 21.2, t); return { pos: mixV(v3(-0.42, 1.82, -6.55), v3(-0.3, 1.7, -7.02), k), look: v3(-0.2, 1.02, -8.3), fov: 44 }; } },
  { t0: P.latch - 1.6, cam: t => { const k = sm(P.latch - 1.6, S2, t); return { pos: mixV(v3(-0.78, 1.24, -7.68), v3(-0.66, 1.2, -7.76), k), look: v3(-0.18, 1.13, -8.17), fov: 36 }; } },
  // scene 2
  { t0: S2, cam: t => { const a = 0.1 * sm(S2, EX + 2.4, t); return { pos: v3(0.15, 2.9, -8.05), look: v3(0.15, 0.92, -8.1), fov: 42, up: v3(Math.sin(a), 0, -Math.cos(a)) }; }, bracket: true },
  { t0: EX + 2.4, cam: t => { const s = spiderAt(t - 0.12) || spiderAt(EX + 2.4); return { pos: s.pos.clone().add(v3(0.035, 0.065, 0.25)), look: s.pos.clone().add(v3(0, 0.008, 0)), fov: 34 }; } },
  { t0: 39.3, cam: t => { const s = spiderAt(t - 0.1); return { pos: v3(0.66, 1.08, -7.9), look: s.pos, fov: 40 }; } },
  { t0: 41.2, cam: t => { const k = sm(41.2, CT + 0.6, t); return { pos: mixV(v3(1.02, 1.2, -8.42), v3(0.84, 1.08, -8.32), k), look: v3(0.48, lerp(1.2, 0.99, k), -8.0), fov: 38 }; } },
  { t0: CT + 0.6, cam: () => ({ pos: v3(1.6, 1.52, -6.55), look: v3(-0.02, 1.12, -7.95), fov: 42 }) },
  { t0: P.lid_close + 1.4, cam: t => { const h = person.markWorld(); return { pos: v3(0.5, 1.46, -8.5), look: v3(0.14, 1.3, -7.45), fov: 34, mark: true }; } },
  { t0: W2.t0 - 0.4, cam: () => CAM_LAB, tag: 'CAM 02 · EAST LAB' },
  // scene 3
  { t0: S3, cam: () => ({ pos: v3(1.4, 4.1, -5.2), look: v3(-0.5, 0.9, 4.2), fov: 58 }), tag: 'CAM 07 · ALLEY REAR' },
  { t0: W3.t1 + 0.3, cam: t => { const k = sm(W3.t1 + 0.3, P.climb_start, t); return { pos: mixV(v3(0.95, 1.4, 4.75), v3(0.78, 1.42, 4.3), k), look: v3(-1.35, 1.38, 2.0), fov: 40 }; } },
  { t0: P.climb_start, cam: t => {
      const c0 = P.climb_start, c1 = c0 + P.climb_time;
      const hc = P.climb_height * rampLinear(t - 0.35, c0, c1, 1.0) + 1.3;
      const follow = { pos: v3(1.0, hc + 0.2, 5.3), look: v3(-1.3, hc, 2.0) };
      const k = sm(c1 - 0.6, c1 + 8.5, t);
      return { pos: mixV(follow.pos, v3(3.4, 16.8, 9.8), k), look: mixV(follow.look, v3(-1.4, 11.9, 2.0), Math.min(1, k * 1.6)), fov: lerp(46, 42, k) };
    } },
];
for (const s of shots) s.tag = s.tag || '';
function shotAt(t) { let s = shots[0]; for (const x of shots) if (t >= x.t0) s = x; return s; }

// ------------------------------------------------------------------------------------------ overlays
const $ = id => document.getElementById(id);
const DISPLAY = {
  s1a: 'August 9. 08:41.', s2a: '08:43. The lid is open for ninety seconds.', s2b: 'The specimen leaves the enclosure at 08:44.',
  s2e: 'At 08:45, contact. The back of the right hand.', s2g: 'At 09:02, he signs out. The specimen does not appear on any frame after 08:45.',
  s3a: '23:16. Same date.', s3e: 'At 23:17, he is eleven meters up.', s1d: 'One enclosure, specimen 8-C, is marked for transfer.',
  s3f: 'The transfer form for specimen 8-C lists its species as unclassified.',
};
const pad = n => String(Math.floor(n)).padStart(2, '0');
const fmt = s => `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}`;
const hms = (h, m, s = 0) => h * 3600 + m * 60 + s;
function clockAt(t) {
  if (t < S2) return hms(8, 41) + Math.max(0, t - T('s1a'));
  if (t < S3) {
    const A = [[S2, hms(8, 43, 2)], [T('s2b'), hms(8, 44, 0)], [CT, hms(8, 45, 3)], [W2.t0 - 0.4, hms(8, 45, 14)]];
    if (t >= W2.t0 - 0.4) return hms(9, 2, 0) + (t - (W2.t0 - 0.4));
    for (let i = 1; i < A.length; i++) if (t < A[i][0]) return lerp(A[i - 1][1], A[i][1], (t - A[i - 1][0]) / (A[i][0] - A[i - 1][0]));
    return A[A.length - 1][1];
  }
  const a = T('s3a'), b = T('s3e') + 0.5;
  if (t < a) return hms(23, 16);
  if (t < b) return lerp(hms(23, 16), hms(23, 17), (t - a) / (b - a));
  return hms(23, 17) + (t - b);
}
const grain = $('grain').getContext('2d'), gimg = grain.createImageData(640, 360);
function drawGrain(seed) {
  let s = (seed * 2654435761) >>> 0;
  const d = gimg.data;
  for (let i = 0; i < d.length; i += 4) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; const v = (s >>> 0) % 256; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  grain.putImageData(gimg, 0, 0);
}
function project(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, ok: p.z < 1 }; }

// ------------------------------------------------------------------------------------------ frame
let curScene = null;
function renderAt(t) {
  const scn = t < S3 ? lab.scene : alley.scene;
  if (curScene !== scn) { scn.add(person.root); curScene = scn; }
  let st;
  if (t < S2) st = actor1(t); else if (t < S3) st = actor2(t); else st = actor3(t);
  person.pose(st.p);
  // marks + props
  person.mark.visible = t >= CT + 0.05;
  person.markGlow.material.opacity = 0.55 + 0.15 * Math.sin(t * 2.3);
  if (t < S3) {
    terr.setLid(st.lid ?? 14);
    const dk = sm(P.door_open, P.door_open + 1.0, t) * (1 - sm(P.door_close, P.door_close + 1.2, t))
      + sm(W2.t1 - 2.6, W2.t1 - 1.6, t);
    lab.door.rotation.y = 1.25 * Math.min(1, dk);
    lab.led.material.color.set(t > P.door_open - 0.4 && t < P.door_open + 0.4 ? '#ffffff' : '#9aa2a8');
    clip.visible = t >= S2;
    if (st.cbPos) { clip.position.copy(st.cbPos); clip.quaternion.copy(st.cbQ); }
    const s = t >= S2 ? spiderAt(t) : { pos: v3(-0.27, 0.954, -8.31), n: v3(0, 1, 0), fwd: v3(1, 0, 0.3), moving: 0, phase: 0 };
    spider.root.visible = !!s;
    if (s) spider.place(s.pos, s.n, s.fwd, s.phase, s.moving);
    spider.thread.visible = !!s && t > 41.25 && t < CT + 0.1;
    if (spider.thread.visible) spider.setThread(LAMP, s.pos.clone().add(v3(0, 0.008, 0)));
  }
  // camera
  const sh = shotAt(t), c = sh.cam(t);
  camera.position.copy(c.pos); camera.up.copy(c.up || v3(0, 1, 0)); camera.lookAt(c.look);
  camera.fov = c.fov; camera.updateProjectionMatrix();
  renderer.toneMappingExposure = t < S3 ? EXPO.lab : EXPO.alley;
  renderer.render(scn, camera);

  // overlays
  const fadeIn = 1 - sm(3.0, 3.9, t);
  const dip = sm(S3 - 0.55, S3 - 0.05, t) * (1 - sm(S3 + 0.15, S3 + 0.8, t));
  const out = sm(END_AT, END_AT + 0.7, t);
  $('fade').style.opacity = Math.max(fadeIn, dip, out);
  $('open').style.opacity = sm(0.3, 0.9, t) * (1 - sm(2.5, 3.0, t));
  $('end').style.opacity = sm(END_AT + 0.8, END_AT + 1.5, t);
  const showUI = t > 3.5 && t < END_AT ? 1 : 0;
  const cctv = sh.tag ? 1 : 0;
  $('cctv').style.opacity = cctv * showUI * 0.9;
  $('camtag').style.opacity = cctv * showUI;
  $('camtag').innerHTML = sh.tag ? `${sh.tag}<i style="opacity:${0.4 + 0.6 * (Math.floor(t * 1.2) % 2)}"></i>` : '';
  $('clock').style.opacity = showUI;
  $('clock').innerHTML = `<small>${t < S3 ? 'EAST GENETICS LAB' : 'ALLEY · RESIDENCE'}</small>AUG 09 · ${fmt(clockAt(t))}`;
  const ch = t < S2 ? [3.9, 'CHAPTER 1', 'THE ROUTINE'] : t < S3 ? [S2 + 0.3, 'CHAPTER 2', 'THE CONTACT'] : [S3 + 0.8, 'CHAPTER 3', 'THE WALL'];
  const chk = sm(ch[0], ch[0] + 0.6, t) * (1 - sm(ch[0] + 3.6, ch[0] + 4.3, t));
  $('chapter').style.opacity = chk * showUI; $('chapter').innerHTML = `${ch[1]}<b>${ch[2]}</b>`;
  let sub = '';
  for (const l of VOICE.lines) if (t >= l.start - 0.05 && t <= l.end + 0.3) sub = DISPLAY[l.id] || l.text;
  $('sub').textContent = sub; $('sub').style.opacity = showUI;
  // brackets
  const mk = $('mark'); let mo = 0;
  if (sh.bracket && t > EX - 0.3) { const s = spiderAt(t); if (s) { const q = project(s.pos); mk.style.left = q.x + 'px'; mk.style.top = q.y + 'px'; mk.querySelector('span').textContent = 'SPECIMEN 8-C'; mo = sm(EX - 0.3, EX + 0.2, t); } }
  if (c.mark) { const q = project(person.markWorld()); mk.style.left = q.x + 'px'; mk.style.top = q.y + 'px'; mk.querySelector('span').textContent = 'CONTACT · 08:45:03'; mo = sm(sh.t0 + 0.6, sh.t0 + 1.1, t); }
  mk.style.opacity = mo;
  drawGrain(Math.round(t * 30));
}

window.__renderAt = renderAt;
window.__duration = DUR;
const qs = new URLSearchParams(location.search);
document.fonts.ready.then(() => {
  renderAt(0);
  window.__ready = true;
  if (!qs.has('record')) {
    if (qs.has('t')) renderAt(parseFloat(qs.get('t')));
    else { const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; loop(); }
  }
});
void CYAN;
