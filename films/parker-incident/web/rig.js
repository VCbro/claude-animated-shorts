// CHAR-01 (the intern) and PROP-02 (specimen 8-C): low-poly, procedural, posed from code.
import * as THREE from 'three';

export const CYAN = new THREE.Color('#3fdbe8');
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0);

export function mat(c, r = 0.85, m = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, flatShading: true, ...extra });
}
export function mesh(geo, m, parent, pos, rot, shadow = true) {
  const o = new THREE.Mesh(geo, m);
  o.castShadow = shadow; o.receiveShadow = true;
  if (pos) o.position.set(...pos);
  if (rot) o.rotation.set(...rot);
  parent.add(o);
  return o;
}

let glowTex;
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}
export function glow(color, size, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, size);
  return s;
}

// ------------------------------------------------------------------------------------------ the intern
const UA = 0.29, FA = 0.26, HAND = 0.05;

export class Person {
  constructor() {
    const coat = mat('#b3c9da', 0.9, 0, { side: THREE.DoubleSide }), shirt = mat('#6c7176'), pants = mat('#3a3f45'),
      shoe = mat('#25272a', 0.6), skin = mat('#c49f88', 0.8), hair = mat('#2a2421', 0.9), wire = mat('#8d949a', 0.35, 0.8);
    this.root = new THREE.Group();
    this.hips = new THREE.Group(); this.hips.position.y = 0.95; this.root.add(this.hips);
    mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.18, 6), pants, this.hips, [0, 0.02, 0]);
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.52, 6), shirt, this.torso, [0, 0.28, 0]);
    mesh(new THREE.CylinderGeometry(0.215, 0.275, 0.98, 7, 1, true), coat, this.torso, [0, 0.06, 0]);
    mesh(new THREE.CylinderGeometry(0.11, 0.215, 0.07, 7), coat, this.torso, [0, 0.585, 0]);
    // lapels: a darker V so the coat reads as a coat
    mesh(new THREE.BoxGeometry(0.16, 0.2, 0.01), shirt, this.torso, [0, 0.47, 0.2], [-0.12, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 6), skin, this.torso, [0, 0.64, 0]);
    this.head = new THREE.Group(); this.head.position.y = 0.69; this.torso.add(this.head);
    const hd = mesh(new THREE.IcosahedronGeometry(0.112, 1), skin, this.head, [0, 0.07, 0.005]); hd.scale.set(0.92, 1.08, 1);
    mesh(new THREE.SphereGeometry(0.119, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, this.head, [0, 0.095, -0.012], [-0.28, 0, 0]);
    mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), skin, this.head, [0, 0.055, 0.112], [0.3, 0, 0]); // nose block
    for (const s of [-1, 1]) {
      mesh(new THREE.TorusGeometry(0.027, 0.004, 4, 10), wire, this.head, [s * 0.042, 0.078, 0.104], null, false);
      mesh(new THREE.BoxGeometry(0.004, 0.004, 0.1), wire, this.head, [s * 0.072, 0.082, 0.055], null, false);
    }
    mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), wire, this.head, [0, 0.082, 0.106], null, false);

    this.arms = {};
    for (const [k, s] of [['L', 1], ['R', -1]]) {
      const sh = new THREE.Group(); sh.position.set(s * 0.235, 0.5, 0); this.torso.add(sh);
      mesh(new THREE.SphereGeometry(0.068, 6, 4), coat, sh, [0, -0.01, 0]);
      mesh(new THREE.CylinderGeometry(0.056, 0.048, UA, 6), coat, sh, [0, -UA / 2, 0]);
      const el = new THREE.Group(); el.position.y = -UA; sh.add(el);
      mesh(new THREE.CylinderGeometry(0.048, 0.042, FA - 0.02, 6), coat, el, [0, -(FA - 0.02) / 2, 0]);
      const wr = new THREE.Group(); wr.position.y = -FA; el.add(wr);
      // hand: palm normal = local +z, fingers = local -y
      mesh(new THREE.BoxGeometry(0.075, 0.095, 0.028), skin, wr, [0, -0.05, 0]);
      mesh(new THREE.BoxGeometry(0.022, 0.05, 0.022), skin, wr, [-s * 0.045, -0.03, 0.012], [0, 0, s * 0.4]);
      this.arms[k] = { s, sh, el, wr };
    }
    // the mark on the back of the right hand (back = local -z)
    const m = new THREE.Group(); m.position.set(0.005, -0.055, -0.016); this.arms.R.wr.add(m);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.006, 10), new THREE.MeshBasicMaterial({ color: CYAN }));
    dot.rotation.y = Math.PI; m.add(dot);
    this.markGlow = glow(CYAN, 0.05, 0.8); this.markGlow.position.z = -0.004; m.add(this.markGlow);
    this.mark = m; m.visible = false;

    this.legs = {};
    for (const [k, s] of [['L', 1], ['R', -1]]) {
      const hp = new THREE.Group(); hp.position.set(s * 0.09, -0.02, 0); this.hips.add(hp);
      mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.45, 6), pants, hp, [0, -0.225, 0]);
      const kn = new THREE.Group(); kn.position.y = -0.45; hp.add(kn);
      mesh(new THREE.CylinderGeometry(0.058, 0.045, 0.43, 6), pants, kn, [0, -0.215, 0]);
      const an = new THREE.Group(); an.position.y = -0.44; kn.add(an);
      mesh(new THREE.BoxGeometry(0.09, 0.06, 0.23), shoe, an, [0, -0.0, 0.05]);
      this.legs[k] = { hp, kn, an };
    }
    this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
  }

  // p: {x,y,z,heading,bob,lean,twist,roll,headPitch,headYaw, legs:{L:{hip,knee},R}, arms:{L:{fwd,abd,el,tw, ik, w, pole, hand, hw}}}
  pose(p) {
    const r = this.root;
    r.position.set(p.x, p.y || 0, p.z);
    r.rotation.set(0, p.heading || 0, 0);
    this.hips.position.y = 0.95 + (p.bob || 0);
    this.torso.rotation.set(p.lean || 0, p.twist || 0, p.roll || 0);
    this.head.rotation.set(p.headPitch || 0, p.headYaw || 0, 0);
    for (const k of ['L', 'R']) {
      const l = (p.legs && p.legs[k]) || {};
      this.legs[k].hp.rotation.set(-(l.hip || 0), 0, (l.abd || 0) * (k === 'L' ? 1 : -1));
      this.legs[k].kn.rotation.set(l.knee || 0, 0, 0);
      this.legs[k].an.rotation.set(l.ankle || 0, 0, 0);
    }
    r.updateMatrixWorld(true);
    for (const k of ['L', 'R']) this.arm(k, (p.arms && p.arms[k]) || {});
  }

  arm(k, a) {
    const A = this.arms[k], s = A.s;
    // forward kinematics
    const qs = new THREE.Quaternion().setFromEuler(new THREE.Euler(-(a.fwd || 0), a.tw || 0, s * (a.abd ?? 0.08), 'XZY'));
    const qe = new THREE.Quaternion().setFromEuler(new THREE.Euler(-(a.el ?? 0.15), 0, 0));
    const qw = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -s * Math.PI / 2 + (a.wtw || 0), 0));
    const w = a.ik && a.w > 0 ? Math.min(1, a.w) : 0;
    if (w > 0) {
      const t = this.torso.worldToLocal(a.ik.clone()).sub(A.sh.position);
      const d = Math.min(Math.max(t.length(), 0.08), UA + FA + HAND - 0.002);
      const b = FA + HAND;
      const dir = t.clone().normalize();
      const alpha = Math.acos(THREE.MathUtils.clamp((UA * UA + d * d - b * b) / (2 * UA * d), -1, 1));
      const beta = Math.acos(THREE.MathUtils.clamp((UA * UA + b * b - d * d) / (2 * UA * b), -1, 1));
      const pole = (a.pole ? a.pole.clone() : new THREE.Vector3(s * 0.5, -0.6, -0.5)).normalize();
      let n = new THREE.Vector3().crossVectors(dir, pole);
      if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
      n.normalize();
      const u = dir.clone().applyAxisAngle(n, alpha);
      const q1 = new THREE.Quaternion().setFromUnitVectors(DOWN, u);
      const nl = n.clone().applyQuaternion(q1.clone().invert());
      const q2 = new THREE.Quaternion().setFromAxisAngle(nl, -(Math.PI - beta));
      qs.slerp(q1, w); qe.slerp(q2, w);
    }
    A.sh.quaternion.copy(qs); A.el.quaternion.copy(qe); A.wr.quaternion.copy(qw);
    if (a.hand && a.hw > 0) {
      // hand: {fingers: world dir, palm: world normal}
      A.sh.updateMatrixWorld(true);
      const y = a.hand.fingers.clone().normalize().negate();
      const z = a.hand.palm.clone().normalize();
      const x = new THREE.Vector3().crossVectors(y, z).normalize();
      z.crossVectors(x, y).normalize();
      const qWorld = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
      const parentQ = new THREE.Quaternion(); A.el.getWorldQuaternion(parentQ);
      const ql = parentQ.invert().multiply(qWorld);
      A.wr.quaternion.slerp(ql, Math.min(1, a.hw));
    }
  }

  handWorld(k) { const v = new THREE.Vector3(0, -0.05, 0); this.arms[k].wr.localToWorld(v); return v; }
  markWorld() { const v = new THREE.Vector3(); this.mark.getWorldPosition(v); return v; }
}

export function walkCycle(phase, amt = 1) {
  const s = Math.sin(phase), c = Math.cos(phase);
  return {
    bob: 0.028 * amt * (Math.abs(c) - 0.5),
    legs: {
      L: { hip: 0.42 * s * amt, knee: (0.08 + 0.7 * Math.max(0, c)) * amt, ankle: -0.15 * Math.max(0, c) * amt },
      R: { hip: -0.42 * s * amt, knee: (0.08 + 0.7 * Math.max(0, -c)) * amt, ankle: -0.15 * Math.max(0, -c) * amt },
    },
    armL: { fwd: -0.32 * s * amt, el: 0.2 + 0.15 * amt * Math.max(0, -s) },
    armR: { fwd: 0.32 * s * amt, el: 0.2 + 0.15 * amt * Math.max(0, s) },
    twist: 0.06 * s * amt,
  };
}

// ------------------------------------------------------------------------------------------ specimen 8-C
export class Spider {
  constructor() {
    const body = mat('#2a2e33', 0.45, 0.1), cyan = new THREE.MeshBasicMaterial({ color: CYAN });
    this.root = new THREE.Group();
    this.inner = new THREE.Group(); this.root.add(this.inner);
    const S = 1.0;
    const ab = mesh(new THREE.IcosahedronGeometry(0.0072 * S, 1), body, this.inner, [0, 0.006, -0.008]); ab.scale.set(1, 0.72, 1.3);
    const ce = mesh(new THREE.IcosahedronGeometry(0.0048 * S, 0), body, this.inner, [0, 0.0052, 0.0045]); ce.scale.set(1, 0.7, 1.1);
    // cyan markings along the back
    for (const [z, w] of [[-0.003, 0.0034], [-0.0075, 0.0042], [-0.012, 0.0032]]) {
      mesh(new THREE.BoxGeometry(w, 0.0012, 0.0016), cyan, this.inner, [0, 0.0112, z], null, false);
    }
    mesh(new THREE.BoxGeometry(0.0016, 0.0011, 0.009), cyan, this.inner, [0, 0.0108, -0.008], null, false);
    this.glow = glow(CYAN, 0.035, 0.55); this.glow.position.set(0, 0.012, -0.007); this.inner.add(this.glow);
    this.legs = [];
    const legMat = mat('#2a2e33', 0.5);
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? 1 : -1, j = i % 4;
      const g = new THREE.Group(); g.position.set(side * 0.003, 0.0055, 0.006 - j * 0.0022); this.inner.add(g);
      const yaw = side * (0.55 + j * 0.42) - (side > 0 ? 0 : 0); // splay forward → back
      g.rotation.y = side > 0 ? Math.PI / 2 - (0.9 - j * 0.55) : -Math.PI / 2 + (0.9 - j * 0.55);
      const up = new THREE.Group(); up.rotation.z = 0; g.add(up);
      const s1 = mesh(new THREE.CylinderGeometry(0.0007, 0.0009, 0.011, 4), legMat, up, [0, 0, 0.0055], [Math.PI / 2, 0, 0], false);
      s1.rotation.set(Math.PI / 2 - 0.0, 0, 0);
      const knee = new THREE.Group(); knee.position.z = 0.011; up.add(knee);
      mesh(new THREE.CylinderGeometry(0.0004, 0.0007, 0.014, 4), legMat, knee, [0, 0, 0.007], [Math.PI / 2, 0, 0], false);
      this.legs.push({ g, up, knee, side, j });
      void yaw;
    }
    this.thread = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]),
      new THREE.LineBasicMaterial({ color: '#dfe9ee', transparent: true, opacity: 0.75 }));
    this.thread.frustumCulled = false; this.thread.visible = false;
  }

  // pos, normal (surface up), forward dir, gait phase, moving 0..1
  place(pos, normal, fwd, phase, moving) {
    this.root.position.copy(pos);
    const y = normal.clone().normalize();
    let z = fwd.clone().sub(y.clone().multiplyScalar(fwd.dot(y)));
    if (z.lengthSq() < 1e-8) z = new THREE.Vector3(0, 0, 1).sub(y.clone().multiplyScalar(y.z));
    z.normalize();
    const x = new THREE.Vector3().crossVectors(y, z).normalize();
    this.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    for (const L of this.legs) {
      const ph = phase + (L.j % 2 ? Math.PI : 0) + (L.side > 0 ? 0 : Math.PI);
      L.up.rotation.x = -0.55 + 0.25 * moving * Math.sin(ph);   // lift the femur
      L.up.rotation.y = 0.25 * moving * Math.cos(ph);
      L.knee.rotation.x = 1.25 - 0.2 * moving * Math.sin(ph);
    }
  }
  setThread(a, b) {
    const p = this.thread.geometry.attributes.position;
    p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
  }
}
