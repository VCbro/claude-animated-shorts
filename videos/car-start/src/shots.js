import * as THREE from 'three';
import { car, engineBay, ignition, spinArrow, fuelSpray, fireball, pulse, CYL_X, PINION } from './car.js';
import { glowSprite, sparks } from './props.js';
import { kf, lerp, easeOut, easeIn, easeInOut, range, V, cam, place, shake } from './anim.js';

export const DURATION = 27.62;

// [start, text, end?]
export const CAPTIONS = [
  [0.00, 'When you turn'], [0.48, 'the key'], [0.88, 'in the ignition'],
  [1.92, 'it completes'], [2.48, 'a circuit'], [3.04, 'to the battery'],
  [3.84, 'which sends'], [4.32, 'a burst'], [4.72, 'of electricity'], [5.68, 'to the starter'], [6.40, 'motor'],
  [6.96, 'The starter'], [7.44, 'spins'], [7.84, 'the flywheel'], [8.88, 'turning'], [9.20, 'the crankshaft'],
  [10.00, 'and moving'], [10.40, 'the pistons'], [11.04, 'up and down'],
  [11.76, 'As they move'], [12.72, 'fuel injectors'], [13.68, 'spray gasoline'], [14.72, 'into the cylinders'],
  [15.68, 'Then'], [15.92, 'the spark plugs'], [16.72, 'fire'],
  [17.20, 'igniting the fuel'], [18.16, 'in a small'], [18.96, 'controlled'], [19.52, 'explosion'],
  [20.24, 'That blast'], [20.88, 'shoves'], [21.20, 'the piston down'], [22.40, 'and the engine'],
  [23.12, 'keeps spinning'], [23.84, 'on its own'],
  [24.56, 'The starter'], [25.12, 'lets go'], [25.84, 'and the car'], [26.40, 'is running', 27.43],
];
export const FADES = [];

const BAY_Y = 0.12;
const W = (x, y, z) => [x, y + BAY_Y, z];          // engine-local -> world (bay sits at y = BAY_Y)
const dist = (c, p) => c.position.distanceTo(V(...p));
// crank angle for a spin that eases up to speed w over tr seconds, starting at t0
const spin = (t, w, t0 = 0, tr = 0.6) => { const u = t - t0; return u <= 0 ? 0 : u < tr ? w * u * u / (2 * tr) : w * (u - tr / 2); };

function bayStage(makeStage, opts) {
  const scene = makeStage({ shadowSize: 1.2, ...opts });
  const bay = engineBay(); bay.position.y = BAY_Y; scene.add(bay);
  return { scene, bay, E: bay.userData.P };
}

// ============ S1: key turns in the ignition ============
function sKey({ makeStage }) {
  const scene = makeStage({ shadowSize: 0.5, sunDir: [-1, 2, 4], sun: 1.6 });
  const ig = ignition(); ig.position.set(0, 1.2, 0); scene.add(ig);
  const { key, glowRing } = ig.userData.P;
  const c = cam(30);
  return {
    scene, camera: c,
    update(t) {
      key.rotation.z = -1.0 * easeInOut(range(t, 0.55, 1.15));
      const g = range(t, 1.0, 1.3);
      glowRing.material.opacity = g * 0.9;
      const p = kf(t, [[0, [0.17, 1.29, 0.34]], [1.92, [0.1, 1.25, 0.24]]]);
      const s = shake(t, 0.25);
      place(c, [p[0] + s[0], p[1] + s[1], p[2]], [0, 1.2, 0.02]);
      return { dof: { focus: dist(c, [0, 1.2, 0.03]), aperture: 0.03, maxblur: 0.01 }, bloom: 0.6, exposure: 1.0 };
    },
  };
}

// ============ S2: the car, turning x-ray, battery lights up ============
function sCar({ makeStage }) {
  const scene = makeStage({ shadowSize: 3.5 });
  const cr = car(); scene.add(cr);
  const P = cr.userData.P;
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      P.xray(easeInOut(range(t, 0.25, 1.0)));
      P.E.batMat.userData.hi(range(t, 1.05, 1.4));
      P.E.setCrank(0);
      const p = kf(t, [[0, [8.6, 2.6, 8.4]], [1.92, [7.0, 2.5, 7.0]]]);
      place(c, p, kf(t, [[0, [0.2, 0.55, 0]], [1.92, [0.9, 0.55, 0]]]));
      return { dof: { focus: dist(c, [1.3, 0.6, 0]), aperture: 0.0008, maxblur: 0.006 }, bloom: 0.45 };
    },
  };
}

// ============ S3: battery -> cable -> starter ============
function sBattery({ makeStage }) {
  const { scene, E } = bayStage(makeStage);
  const pz = pulse(E.cablePath); pz.position.y = BAY_Y; scene.add(pz);
  const c = cam(32);
  return {
    scene, camera: c,
    update(t) {
      E.setCrank(0);
      E.batMat.userData.hi(1);
      const u = easeInOut(range(t, 0.5, 2.3));
      pz.set(u * 1.15, t > 0.45 && t < 2.6 ? 1 : 0);
      E.cableMat.userData.hi(range(t, 0.5, 2.3) * 0.8);
      E.starterMat.userData.hi(range(t, 2.1, 2.5));
      const look = kf(t, [[0, W(0.12, 0.42, -0.36)], [0.5, W(0.14, 0.42, -0.34)], [2.4, W(0.33, 0.16, -0.16)], [3.12, W(0.36, 0.12, -0.14)]], easeInOut);
      const pos = kf(t, [[0, W(-0.25, 0.7, -0.95)], [0.5, W(-0.18, 0.66, -0.9)], [2.4, W(0.62, 0.42, -0.72)], [3.12, W(0.7, 0.36, -0.6)]], easeInOut);
      place(c, pos, look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.02, maxblur: 0.01 }, bloom: 0.6 };
    },
  };
}

// ============ S4: starter spins the flywheel, crank and pistons ============
function sFlywheel({ makeStage }) {
  const { scene, E } = bayStage(makeStage);
  const big = spinArrow(0.165); big.position.set(...W(0.3, 0.08, 0)); scene.add(big);
  const small = spinArrow(0.045); small.position.set(PINION.x + 0.03, PINION.y + BAY_Y, PINION.z); scene.add(small);
  const c = cam(32);
  return {
    scene, camera: c,
    update(t) {
      const th = spin(t, 4.2, 0.15);
      E.setCrank(th);
      E.starterMat.userData.hi(1); E.flyMat.userData.hi(range(t, 0.7, 1.0) * 0.8);
      const a = range(t, 0.15, 0.5) * (1 - range(t, 2.6, 3.0));
      big.rotation.x = -t * 1.2; big.userData.mat.opacity = a * 0.9;
      small.rotation.x = t * 4; small.userData.mat.opacity = a * 0.9;
      for (const p of E.pistons) p.userData.mat.userData.hi(range(t, 3.3, 3.7));
      const k = easeInOut(range(t, 1.7, 4.2));
      const pos = [lerp(0.78, 0.9, k), lerp(0.3, 0.82, k), lerp(-0.42, 0.62, k)];
      const look = [lerp(0.27, 0.0, k), lerp(0.16, 0.38, k), lerp(-0.08, 0.0, k)];
      const s = shake(t, 0.4);
      place(c, [pos[0] + s[0], pos[1] + s[1], pos[2]], look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.012, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

// ============ S5: injectors spray fuel into the cylinders ============
function sInject({ makeStage }) {
  const { scene, bay, E } = bayStage(makeStage);
  const sprays = CYL_X.map((x, i) => { const s = fuelSpray(3 + i); s.position.set(x, 0.372, 0.03); s.rotation.x = -0.65; s.renderOrder = 9; bay.add(s); return s; });
  const c = cam(30);
  return {
    scene, camera: c,
    update(t) {
      const th = 1.0 + t * 1.2;
      E.setCrank(th);
      for (const inj of E.injectors) inj.userData.mat.userData.hi(range(t, 0.7, 1.0));
      sprays.forEach((s, i) => { const tt = t - 1.0 - i * 0.12; s.update(tt < 0 ? -1 : tt % 0.9); });
      E.chamber.forEach(ch => { ch.material.color.set(0xffc928); ch.material.opacity = 0.32 * range(t, 1.2, 2.6); });
      const pos = kf(t, [[0, W(0.34, 0.58, 0.82)], [3.92, W(0.22, 0.52, 0.64)]]);
      const look = W(0.0, 0.36, 0);
      place(c, pos, look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.015, maxblur: 0.008 }, bloom: 0.55 };
    },
  };
}

// ============ S6: spark plug fires ============
function sSpark({ makeStage }) {
  const { scene, bay, E } = bayStage(makeStage);
  const i = 1;
  const tip = V(CYL_X[i], 0.372, 0);
  const sp = sparks(90, { speed: 0.05, spread: 1.4, gravity: -0.05, life: 0.35, size: 0.003, seed: 7, color: [0.6, 0.85, 1], dir: V(0, -1, 0) });
  sp.position.copy(tip); sp.renderOrder = 9; bay.add(sp);
  const flash = glowSprite(0xbfe6ff, 0.02); flash.position.copy(tip); flash.renderOrder = 9; bay.add(flash);
  const light = new THREE.PointLight(0x9fd8ff, 0, 0.15); light.position.copy(tip).y -= 0.01; bay.add(light);
  const c = cam(34);
  const TF = 1.04;
  return {
    scene, camera: c,
    update(t) {
      E.setCrank(Math.PI - 0.35 + 0.35 * easeOut(range(t, 0, 1.2)));
      E.plugs[i].userData.mat.userData.hi(range(t, 0.2, 0.6));
      E.chamber.forEach(ch => { ch.material.color.set(0xffc928); ch.material.opacity = 0.32; });
      const it = t - TF;
      sp.update(it);
      const f = it > 0 ? Math.exp(-it * 5) : 0;
      flash.scale.setScalar(0.01 + 0.04 * f); flash.material.opacity = f * 0.7;
      light.intensity = 0.6 * f;
      const pos = kf(t, [[0, W(0.12, 0.3, 0.42)], [1.52, W(0.07, 0.31, 0.34)]]);
      const look = W(CYL_X[i], 0.38, 0);
      const s = shake(t, it > 0 ? 0.6 : 0.15);
      place(c, [pos[0] + s[0], pos[1] + s[1], pos[2]], look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.02, maxblur: 0.01 }, bloom: 0.45 };
    },
  };
}

// ============ S7: slow-motion explosion pushes the piston down ============
function sBoom({ makeStage }) {
  const { scene, bay, E } = bayStage(makeStage);
  const i = 1;
  const fb = fireball(5); bay.add(fb);
  const c = cam(30);
  const T0 = 0.25;
  return {
    scene, camera: c,
    update(t) {
      const k = range(t, T0, 3.04);
      E.setCrank(Math.PI + Math.PI * 0.85 * easeInOut(range(t, T0 + 0.15, 3.04)));
      E.chamber.forEach((ch, j) => {
        if (j === i) { ch.material.color.set(0xff5a14).lerp(new THREE.Color(0xffc928), 1 - range(t, T0, T0 + 0.4)); ch.material.opacity = 0.3 + 0.25 * range(t, T0, T0 + 0.3) * (1 - range(t, 2.2, 3.0)); }
        else { ch.material.color.set(0xffc928); ch.material.opacity = 0.25; }
      });
      E.pistons[i].userData.mat.userData.hi(0.35);
      const hot = range(t, T0, T0 + 0.3) * (1 - range(t, 2.2, 3.0));
      E.cyl[i].material.color.set(0x2bff7a).lerp(new THREE.Color(0xff8a3a), hot);
      E.cyl[i].material.emissive.set(0x2bff7a).lerp(new THREE.Color(0xff5a14), hot);
      const ch = E.chamber[i];
      fb.position.set(CYL_X[i], ch.position.y, 0);
      fb.scale.set(1, Math.max(0.6, ch.scale.y / 0.06), 1);
      fb.set(t < T0 ? 0 : k, t);
      const pos = kf(t, [[0, W(0.2, 0.44, 0.5)], [3.04, W(0.12, 0.4, 0.4)]]);
      const look = W(CYL_X[i], 0.32, 0);
      const s = shake(t, t > T0 ? 1.4 * Math.exp(-(t - T0) * 1.5) + 0.2 : 0.2);
      place(c, [pos[0] + s[0], pos[1] + s[1], pos[2]], look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.02, maxblur: 0.01 }, bloom: 0.45, exposure: 0.9 };
    },
  };
}

// ============ S8: engine running on its own ============
const FIRE = [0, 3 * Math.PI, Math.PI, 2 * Math.PI]; // firing order 1-3-4-2 over a 4-pi cycle
function sRun({ makeStage }) {
  const { scene, bay, E } = bayStage(makeStage);
  const glows = CYL_X.map(x => { const g = glowSprite(0xff7a2a, 0.08); g.position.set(x, 0.34, 0); bay.add(g); return g; });
  const c = cam(34);
  // integrate a rising speed deterministically
  const theta = t => { let a = 0; const n = Math.ceil(t / 0.01); for (let s = 0; s < n; s++) { const tt = (s + 0.5) * (t / n); a += (4 + 14 * easeInOut(range(tt, 0, 2.5))) * (t / n); } return a; };
  return {
    scene, camera: c,
    update(t) {
      const th = theta(t);
      E.setCrank(th);
      E.starterMat.userData.hi(0.5);
      E.chamber.forEach((ch, j) => {
        const ph = ((th - FIRE[j]) % (4 * Math.PI) + 4 * Math.PI) % (4 * Math.PI);
        const f = Math.exp(-ph * 2.2);
        ch.material.color.set(0xff6a1a).lerp(new THREE.Color(0xffd040), 1 - f);
        ch.material.opacity = 0.12 + 0.6 * f;
        glows[j].position.y = ch.position.y; glows[j].material.opacity = f; glows[j].scale.setScalar(0.04 + 0.06 * f);
      });
      const a = -0.6 + t * 0.18;
      const R = lerp(1.0, 1.15, range(t, 0, 4.3));
      const look = W(0, 0.3, 0);
      const s = shake(t, 0.8);
      place(c, [Math.sin(a) * R + s[0], 0.66 + BAY_Y + s[1], Math.cos(a) * R], look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.004, maxblur: 0.006 }, bloom: 0.8 };
    },
  };
}

// ============ S9: the starter lets go ============
function sRelease({ makeStage }) {
  const { scene, E } = bayStage(makeStage);
  const c = cam(30);
  const pin0 = E.starter.position.clone();
  return {
    scene, camera: c,
    update(t) {
      const th = 18 * t + 3;
      E.setCrank(th);
      const out = easeInOut(range(t, 0.45, 0.9));
      E.starter.position.copy(pin0).add(V(0.045 * out, 0, 0));
      E.pinion.rotation.x = -th * 5.9 * (1 - out) - out * 40;  // pinion stops once out of mesh
      E.starterMat.userData.hi(1 - out);
      E.flyMat.userData.hi(0.4);
      const pos = kf(t, [[0, W(0.75, 0.22, -0.48)], [1.28, W(0.7, 0.26, -0.42)]]);
      const look = W(0.33, 0.04, -0.1);
      place(c, pos, look);
      return { dof: { focus: c.position.distanceTo(V(...look)), aperture: 0.015, maxblur: 0.008 }, bloom: 0.5 };
    },
  };
}

// ============ S10: the car is on ============
function sOn({ makeStage }) {
  const scene = makeStage({ shadowSize: 3.5 });
  const cr = car(); scene.add(cr);
  const P = cr.userData.P;
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      P.E.setCrank(20 * t);
      P.xray(1 - easeInOut(range(t, 0.1, 0.9)));
      P.lights(range(t, 0.55, 0.75));
      const p = kf(t, [[0, [10.4, 2.6, 6.2]], [1.78, [9.2, 2.3, 5.4]]]);
      const s = shake(t, 0.3);
      place(c, [p[0] + s[0], p[1] + s[1], p[2]], [0.7, 0.6, 0]);
      return { dof: { focus: dist(c, [1.5, 0.6, 0]), aperture: 0.0006, maxblur: 0.005 }, bloom: 0.5 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 1.92, build: sKey },
  { start: 1.92, end: 3.84, build: sCar },
  { start: 3.84, end: 6.96, build: sBattery },
  { start: 6.96, end: 11.76, build: sFlywheel },
  { start: 11.76, end: 15.68, build: sInject },
  { start: 15.68, end: 17.2, build: sSpark },
  { start: 17.2, end: 20.24, build: sBoom },
  { start: 20.24, end: 24.56, build: sRun },
  { start: 24.56, end: 25.84, build: sRelease },
  { start: 25.84, end: 27.62, build: sOn },
];
