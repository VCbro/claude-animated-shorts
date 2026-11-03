// The 3D world: mechanical watch (with a full visible movement), quartz watch (with its module), studio backdrop,
// bokeh, energy / electricity pulses. update(t) poses everything from the pure functions in timeline.ts.
import * as THREE from "three";
import { M, glowMat, mechDialTex, quartzDialTex, perlageTex, leatherTex, pcbTex, batteryTex, gearGeo, wheel, jewel, screw, caseGeo, lugGeo, crownGeo, handGeo, strapGeo, spiralPoints, Ribbon } from "./models";
import {
  S, L, R, sceneAt, sstep, lerp, clamp01, mechPose, quartzPose, poseMatrix, explodeAt, strapOut, EXPLODE, dialOpacity, showUpper, trainAngles, balanceAngle, palletAngle,
  windAt, ratchetAngle, crownSpin, mechClock, handAngles, quartzClock, quartzBackOff, crystalVib, crystalReveal, QZ, beats,
} from "./timeline";

const at = (o: THREE.Object3D, x: number, y: number, z = 0) => { o.position.set(x, y, z); return o; };

class Pulses {
  group = new THREE.Group();
  meshes: THREE.Mesh[] = [];
  constructor(n: number, color: [number, number, number], r: number, private path: THREE.CurvePath<THREE.Vector3> | THREE.Curve<THREE.Vector3>) {
    const geo = new THREE.SphereGeometry(r, 12, 8);
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, glowMat(color)); this.meshes.push(m); this.group.add(m); }
  }
  set(t: number, speed: number, amount: number) {
    this.group.visible = amount > 0.01;
    const n = this.meshes.length;
    this.meshes.forEach((m, i) => {
      const u = (((t * speed + i / n) % 1) + 1) % 1;
      m.position.copy(this.path.getPointAt(u));
      const fade = Math.sin(Math.PI * u);
      (m.material as THREE.MeshBasicMaterial).opacity = amount * (0.35 + 0.65 * fade);
      m.scale.setScalar(0.6 + 0.6 * fade);
    });
  }
}
const poly = (pts: [number, number, number][]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");

export class World {
  root = new THREE.Group();
  // mechanical watch
  mech = new THREE.Group(); mCase = new THREE.Group(); mBack = new THREE.Group(); mCrown = new THREE.Group(); mCrownSpin = new THREE.Group();
  mDial = new THREE.Group(); mHour = new THREE.Group(); mMin = new THREE.Group(); mSec = new THREE.Group(); mCrystal = new THREE.Group();
  mMove = new THREE.Group(); strapTop = new THREE.Group(); strapBot = new THREE.Group();
  dialMat: THREE.MeshPhysicalMaterial;
  barrel = new THREE.Group(); ratchet = new THREE.Group(); center = new THREE.Group(); third = new THREE.Group(); fourth = new THREE.Group(); escape = new THREE.Group();
  pallet = new THREE.Group(); balance = new THREE.Group(); cannon = new THREE.Group(); minuteWheel = new THREE.Group(); hourWheel = new THREE.Group();
  spring = new Ribbon(420, 0.014, 0.15); springMat: THREE.MeshPhysicalMaterial;
  hair = new Ribbon(360, 0.006, 0.03);
  energy: Pulses; handPulse: Pulses;
  // quartz
  qz = new THREE.Group(); qBack = new THREE.Group(); qHour = new THREE.Group(); qMin = new THREE.Group(); qSec = new THREE.Group(); qModule = new THREE.Group();
  qCan: THREE.Mesh; qCanMat: THREE.MeshPhysicalMaterial; prongA = new THREE.Group(); prongB = new THREE.Group(); qRings: THREE.Mesh[] = []; qCoilMat: THREE.MeshPhysicalMaterial; qRotor = new THREE.Group();
  qBattGlow: THREE.Mesh; qGears: THREE.Group[] = [];
  elec: Pulses; elec2: Pulses;
  // studio
  bg: THREE.Mesh; bgMat: THREE.ShaderMaterial; bokeh: THREE.Points; bokehMat: THREE.ShaderMaterial;
  key: THREE.DirectionalLight; rim: THREE.DirectionalLight; fill: THREE.DirectionalLight;

  constructor() {
    // ---------- lights ----------
    this.key = new THREE.DirectionalLight(0xfff0dc, 2.6); this.key.position.set(-6, 8, 9);
    this.rim = new THREE.DirectionalLight(0xbfd6ff, 3.0); this.rim.position.set(7, 3, -6);
    this.fill = new THREE.DirectionalLight(0xffd6a0, 0.8); this.fill.position.set(5, -6, 6);
    this.root.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x404858, 0.4));

    // ---------- studio backdrop ----------
    this.bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { cTop: { value: new THREE.Color() }, cBot: { value: new THREE.Color() }, cGlow: { value: new THREE.Color() }, glowDir: { value: new THREE.Vector3(0, 0, -1) } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform vec3 cTop, cBot, cGlow; uniform vec3 glowDir; varying vec3 vD;
        void main(){ float h = vD.y*0.5+0.5; vec3 c = mix(cBot, cTop, smoothstep(0.0,1.0,h));
          float g = pow(max(dot(normalize(vD), glowDir), 0.0), 6.0); c += cGlow * g;
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.bg = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), this.bgMat); this.bg.renderOrder = -10;
    this.root.add(this.bg);
    {
      const n = 110, pos = new Float32Array(n * 3), size = new Float32Array(n), hue = new Float32Array(n);
      let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < n; i++) {
        const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rad = 40 + r() * 60;
        pos.set([Math.sin(ph) * Math.cos(th) * rad, Math.cos(ph) * rad * 0.8, Math.sin(ph) * Math.sin(th) * rad], i * 3);
        size[i] = 2 + r() * 5; hue[i] = r();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("size", new THREE.BufferAttribute(size, 1)); g.setAttribute("hue", new THREE.BufferAttribute(hue, 1));
      this.bokehMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() }, scale: { value: 1000 }, time: { value: 0 }, amt: { value: 1 } },
        vertexShader: `attribute float size; attribute float hue; varying float vH; uniform float scale, time;
          void main(){ vH = hue; vec3 p = position + vec3(sin(time*0.2+hue*20.0), cos(time*0.17+hue*13.0), 0.0)*1.5;
            vec4 mv = modelViewMatrix * vec4(p,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 cA, cB; uniform float amt, time; varying float vH;
          void main(){ vec2 q = gl_PointCoord*2.0-1.0; float d = length(q); if (d>1.0) discard;
            float a = smoothstep(1.0, 0.82, d) * (0.55 + 0.45*smoothstep(0.6, 0.95, d));
            float tw = 0.7 + 0.3*sin(time*1.3 + vH*40.0);
            gl_FragColor = vec4(mix(cA, cB, vH) * a * 0.22 * amt * tw, 1.0); }`,
      });
      this.bokeh = new THREE.Points(g, this.bokehMat); this.bokeh.renderOrder = -5; this.bokeh.frustumCulled = false;
      this.root.add(this.bokeh);
    }

    // ---------- mechanical watch ----------
    const goldCase = M.gold;
    this.mCase.add(new THREE.Mesh(caseGeo(1.9), goldCase));
    for (const [x, y, rz] of [[-0.95, 1.95, 0], [0.95, 1.95, 0], [-0.95, -1.95, Math.PI], [0.95, -1.95, Math.PI]]) {
      const l = new THREE.Mesh(lugGeo(), goldCase); l.position.set(x, y, -0.06); l.rotation.z = rz; this.mCase.add(l);
    }
    const leather = new THREE.MeshPhysicalMaterial({ map: leatherTex("#5b3216", "#e9c79a"), roughness: 0.62, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0.6, 0.4, 0.3) });
    this.strapTop.add(new THREE.Mesh(strapGeo(1.55, 0.13, 5.0, 2.4), leather)); this.strapTop.position.set(0, 2.62, -0.1);
    this.strapBot.add(new THREE.Mesh(strapGeo(1.55, 0.13, 5.0, 2.4), leather)); this.strapBot.rotation.z = Math.PI; this.strapBot.position.set(0, -2.62, -0.1);
    // spring bars
    for (const y of [2.62, -2.62]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 12), M.steel); b.rotation.z = Math.PI / 2; b.position.set(0, y, -0.06); this.mCase.add(b); }
    this.mBack.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.1, 0.12, 96).rotateX(Math.PI / 2), M.goldSatin), 0, 0, -0.48));
    const crown = new THREE.Mesh(crownGeo(), M.gold); this.mCrownSpin.add(crown);
    this.mCrownSpin.position.set(2.4, 0, 0.04);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12), M.steel); stem.rotation.z = Math.PI / 2; stem.position.set(2.0, 0, 0.04);
    this.mCrown.add(this.mCrownSpin, stem);
    // dial
    this.dialMat = new THREE.MeshPhysicalMaterial({ map: mechDialTex(), metalness: 0.55, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.15, transparent: true });
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.9, 128), this.dialMat); dial.position.z = 0.3; this.mDial.add(dial);
    for (let i = 0; i < 12; i++) {
      if (i === 6) continue;
      const a = (i / 12) * Math.PI * 2;
      const n = i === 0 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.3, 0.05), M.gold);
        const off = n === 2 ? (k - 0.5) * 0.12 : 0;
        b.position.set(Math.sin(a) * 1.47 + Math.cos(a) * off, Math.cos(a) * 1.47 - Math.sin(a) * off, 0.33); b.rotation.z = -a;
        this.mDial.add(b);
      }
    }
    const subRing = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.015, 8, 64), M.gold); subRing.position.set(0, -1.1, 0.31); this.mDial.add(subRing);
    // hands (dial z .3)
    { const [g, c] = handGeo(1.05, 0.085, 0.18, "dauphine"); this.mHour.add(new THREE.Mesh(g, M.goldHand), new THREE.Mesh(c, M.goldHand)); this.mHour.position.z = 0.36; }
    { const [g, c] = handGeo(1.6, 0.07, 0.2, "dauphine"); this.mMin.add(new THREE.Mesh(g, M.goldHand), new THREE.Mesh(c, M.goldHand)); this.mMin.position.z = 0.4; }
    { const [g, c] = handGeo(0.42, 0.018, 0.1, "needle"); this.mSec.add(new THREE.Mesh(g, M.goldHand), new THREE.Mesh(c, M.goldHand)); this.mSec.position.set(0, -1.1, 0.36); }
    this.mCrystal.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.93, 1.93, 0.07, 96).rotateX(Math.PI / 2), M.crystal), 0, 0, 0.55));

    // movement
    const ptex = perlageTex(); ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping; ptex.repeat.set(3, 3);
    const plateMat = new THREE.MeshPhysicalMaterial({ map: ptex, metalness: 1, roughness: 0.3, color: new THREE.Color(1, 1, 1) });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.88, 0.1, 128).rotateX(Math.PI / 2), [M.rhodium, plateMat, M.rhodium]); plate.position.z = -0.3;
    const plateTop = new THREE.Mesh(new THREE.CircleGeometry(1.875, 128), plateMat); plateTop.position.z = -0.249;
    this.mMove.add(plate, plateTop);
    // barrel (cutaway drum so the mainspring shows)
    const drum = new THREE.Mesh(gearGeo({ N: 80, R: R.barrel, hole: 0.7 }, 0.2), M.brass);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.71, 64), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.55, 0.4, 0.22), metalness: 1, roughness: 0.4 })); floor.position.z = -0.09;
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 24).rotateX(Math.PI / 2), M.steel);
    this.barrel.add(drum, floor, arbor);
    this.springMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.75, 0.77, 0.82), metalness: 1, roughness: 0.22, emissive: new THREE.Color(0, 0, 0), side: THREE.DoubleSide });
    const springMesh = new THREE.Mesh(this.spring.geo, this.springMat); springMesh.position.z = -0.0; springMesh.frustumCulled = false;
    const rgear = new THREE.Mesh(gearGeo({ N: 30, R: 0.21, kind: "ratchet", hole: 0.04 }, 0.05), M.steel);
    this.ratchet.add(rgear, at(screw(0.06), 0, 0, 0.035)); this.ratchet.position.z = 0.13;
    const barrelHolder = at(new THREE.Group(), L.barrel[0], L.barrel[1], -0.12);
    barrelHolder.add(this.barrel, springMesh, this.ratchet);
    this.mMove.add(barrelHolder);
    const click = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.04), M.steel); click.position.set(L.barrel[0] + 0.24, L.barrel[1] + 0.12, 0.02); click.rotation.z = 0.5; this.mMove.add(click);
    // train
    at(this.center, 0, 0, -0.06).add(wheel({ N: 60, R: R.center, spokes: 4 }, 0.04, M.brass, 0.5, { N: 10, R: R.cPin, z: -0.06, len: 0.08 }));
    at(this.third, L.third[0], L.third[1], 0.03).add(wheel({ N: 64, R: R.third, spokes: 5 }, 0.035, M.brass, 0.32, { N: 8, R: R.tPin, z: -0.09, len: 0.07 }));
    at(this.fourth, L.fourth[0], L.fourth[1], -0.06).add(wheel({ N: 80, R: R.fourth, spokes: 5 }, 0.035, M.brass, 0.5, { N: 8, R: R.fPin, z: 0.09, len: 0.07 }));
    at(this.escape, L.escape[0], L.escape[1], 0.1).add(wheel({ N: 15, R: R.escape, spokes: 4, kind: "escape" }, 0.03, M.steel, 0.3, { N: 8, R: R.ePin, z: -0.16, len: 0.07 }));
    for (const w of [this.center, this.third, this.fourth, this.escape]) { this.mMove.add(w); const j = jewel(0.04); j.position.set(w.position.x, w.position.y, 0.18); this.mMove.add(j); }
    // pallet fork (straight-line lever: escape -> pallet -> balance)
    {
      const dir = new THREE.Vector2(L.balance[0] - L.pallet[0], L.balance[1] - L.pallet[1]);
      const ang = Math.atan2(dir.y, dir.x);
      const body = new THREE.Group();
      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.03), M.steel); lever.position.x = 0.2; body.add(lever);
      const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.03), M.steel); forkL.position.set(0.45, 0.035, 0); body.add(forkL);
      const forkR = forkL.clone(); forkR.position.y = -0.035; body.add(forkR);
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.03), M.steel); cross.position.x = -0.1; body.add(cross);
      for (const sy of [1, -1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.035), M.ruby); st.position.set(-0.17, sy * 0.15, 0); st.rotation.z = sy * 0.5; body.add(st); }
      const pv = jewel(0.03); body.add(pv);
      body.rotation.z = ang;
      this.pallet.add(body); at(this.pallet, L.pallet[0], L.pallet[1], 0.1);
      this.mMove.add(this.pallet);
    }
    // balance wheel + hairspring + cock
    {
      const rimS = new THREE.Shape(); rimS.absarc(0, 0, R.balance, 0, Math.PI * 2, false);
      const h = new THREE.Path(); h.absarc(0, 0, R.balance - 0.05, 0, Math.PI * 2, true); rimS.holes.push(h);
      const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(rimS, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 64 }).translate(0, 0, -0.03), M.gold);
      this.balance.add(rim);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(R.balance * 2 - 0.06, 0.04, 0.03), M.gold); sp.rotation.z = a; if (k > 0) { sp.scale.x = 0.5; sp.position.set(Math.cos(a) * (R.balance - 0.03) * 0.5, Math.sin(a) * (R.balance - 0.03) * 0.5, 0); } this.balance.add(sp); }
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 10), M.goldSatin); sc.rotation.z = a + Math.PI / 2; sc.position.set(Math.cos(a) * (R.balance + 0.02), Math.sin(a) * (R.balance + 0.02), 0); this.balance.add(sc); }
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 20).rotateX(Math.PI / 2), M.gold); this.balance.add(hub);
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 24).rotateX(Math.PI / 2), M.steel); roller.position.z = -0.08; this.balance.add(roller);
      const imp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8).rotateX(Math.PI / 2), M.ruby); imp.position.set(-0.07, -0.07, -0.09); this.balance.add(imp);
      const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 10).rotateX(Math.PI / 2), M.steel); this.balance.add(ar);
      const bh = at(new THREE.Group(), L.balance[0], L.balance[1], 0.2);
      bh.add(this.balance);
      const hm = new THREE.Mesh(this.hair.geo, M.blued); hm.position.z = 0.06; hm.frustumCulled = false; bh.add(hm);
      // cock: slim arm from the rim of the plate to the balance pivot
      const cs = new THREE.Shape(); cs.moveTo(0, -0.07); cs.lineTo(0.75, -0.13); cs.lineTo(0.75, 0.13); cs.lineTo(0, 0.07); cs.closePath();
      const cock = new THREE.Mesh(new THREE.ExtrudeGeometry(cs, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }), M.rhodium);
      void cock;
      const cj = jewel(0.03); cj.position.z = 0.06; this.balance.add(cj);
      this.mMove.add(bh);
    }
    // motion works under the dial (cannon pinion -> minute wheel -> hour wheel, 12:1)
    at(this.cannon, 0, 0, 0.18).add(new THREE.Mesh(gearGeo({ N: 10, R: 0.067, kind: "pinion", hole: 0.025 }, 0.05), M.steel));
    at(this.minuteWheel, 0.19, 0.19, 0.18).add(wheel({ N: 30, R: 0.2, spokes: 0 }, 0.03, M.brass, 0.12, { N: 9, R: 0.052, z: 0.04, len: 0.04 }));
    at(this.hourWheel, 0, 0, 0.23).add(new THREE.Mesh(gearGeo({ N: 36, R: 0.207, hole: 0.05 }, 0.025), M.brass));
    this.mMove.add(this.cannon, this.minuteWheel, this.hourWheel);
    for (const [x, y] of [[-1.5, -0.7], [-1.3, 1.1], [1.45, 0.75], [-0.6, -1.55], [0.95, 1.4]]) { const s = screw(0.07); s.position.set(x, y, -0.235); this.mMove.add(s); }
    // energy pulses along the train (barrel -> centre -> third -> fourth -> escape -> pallet -> balance)
    this.energy = new Pulses(12, [4.0, 2.4, 0.7], 0.018, poly([[L.barrel[0], L.barrel[1], 0.12], [0, 0, 0.12], [L.third[0], L.third[1], 0.14], [L.fourth[0], L.fourth[1], 0.12], [L.escape[0], L.escape[1], 0.17], [L.pallet[0], L.pallet[1], 0.17], [L.balance[0], L.balance[1], 0.28]]));
    this.mMove.add(this.energy.group);
    this.handPulse = new Pulses(8, [4.0, 2.6, 0.8], 0.028, poly([[0, 0, -0.05], [0, 0, 0.2], [0, 0, 0.5], [0.0, 0.6, 0.5], [0, 1.4, 0.5]]));
    this.mMove.add(this.handPulse.group);

    this.mech.add(this.mCase, this.mBack, this.mCrown, this.mDial, this.mHour, this.mMin, this.mSec, this.mCrystal, this.mMove, this.strapTop, this.strapBot);
    this.root.add(this.mech);

    // ---------- quartz watch ----------
    this.qz.add(new THREE.Mesh(caseGeo(1.9), M.steel));
    for (const [x, y, rz] of [[-0.95, 1.95, 0], [0.95, 1.95, 0], [-0.95, -1.95, Math.PI], [0.95, -1.95, Math.PI]]) { const l = new THREE.Mesh(lugGeo(), M.steel); l.position.set(x, y, -0.06); l.rotation.z = rz; this.qz.add(l); }
    const rubber = new THREE.MeshPhysicalMaterial({ map: leatherTex("#17191d", "#9aa3ad"), roughness: 0.55, metalness: 0, clearcoat: 0.3 });
    { const s = new THREE.Mesh(strapGeo(1.55, 0.13, 5.0, 2.4), rubber); s.position.set(0, 2.62, -0.1); this.qz.add(s); const s2 = new THREE.Mesh(strapGeo(1.55, 0.13, 5.0, 2.4), rubber); s2.rotation.z = Math.PI; s2.position.set(0, -2.62, -0.1); this.qz.add(s2); }
    { const c = new THREE.Mesh(crownGeo(), M.steel); c.position.set(2.4, 0, 0.04); this.qz.add(c); }
    const qd = new THREE.Mesh(new THREE.CircleGeometry(1.9, 128), new THREE.MeshPhysicalMaterial({ map: quartzDialTex(), metalness: 0.0, roughness: 0.45, clearcoat: 0.5 })); qd.position.z = 0.3; this.qz.add(qd);
    { const [g, c] = handGeo(1.05, 0.07, 0.15, "baton"); this.qHour.add(new THREE.Mesh(g, M.black), new THREE.Mesh(c, M.black)); this.qHour.position.z = 0.34; }
    { const [g, c] = handGeo(1.55, 0.055, 0.18, "baton"); this.qMin.add(new THREE.Mesh(g, M.black), new THREE.Mesh(c, M.black)); this.qMin.position.z = 0.38; }
    { const [g, c] = handGeo(1.72, 0.022, 0.42, "needle"); this.qSec.add(new THREE.Mesh(g, M.red), new THREE.Mesh(c, M.red)); this.qSec.position.z = 0.42; }
    this.qz.add(this.qHour, this.qMin, this.qSec, at(new THREE.Mesh(new THREE.CylinderGeometry(1.93, 1.93, 0.07, 96).rotateX(Math.PI / 2), M.crystal), 0, 0, 0.55));
    // caseback
    this.qBack.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.1, 0.12, 96).rotateX(Math.PI / 2), M.steel), 0, 0, -0.48));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; const s = screw(0.09); s.rotation.y = Math.PI; s.position.set(Math.cos(a) * 1.75, Math.sin(a) * 1.75, -0.555); this.qBack.add(s); }
    this.qz.add(this.qBack);
    // module (on the back side, -Z)
    {
      const pcb = new THREE.Mesh(new THREE.CircleGeometry(1.85, 96), new THREE.MeshPhysicalMaterial({ map: pcbTex(), roughness: 0.5, metalness: 0.1, clearcoat: 0.7 }));
      pcb.rotation.y = Math.PI; pcb.position.z = -0.26; this.qModule.add(pcb);
      const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.86, 1.86, 0.06, 96).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x1a1d22, roughness: 0.5 })); plat.position.z = -0.22; this.qModule.add(plat);
      const batt = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 64).rotateX(Math.PI / 2), M.steel); batt.position.set(QZ.battery[0], QZ.battery[1], -0.36); this.qModule.add(batt);
      const bface = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64), new THREE.MeshPhysicalMaterial({ map: batteryTex(), metalness: 0.9, roughness: 0.25 })); bface.rotation.y = Math.PI; bface.position.set(QZ.battery[0], QZ.battery[1], -0.445); this.qModule.add(bface);
      this.qBattGlow = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.655, 64), glowMat([0.5, 1.4, 2.0])); this.qBattGlow.rotation.y = Math.PI; this.qBattGlow.position.set(QZ.battery[0], QZ.battery[1], -0.45); this.qModule.add(this.qBattGlow);
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.03), M.steel); clip.position.set(QZ.battery[0] - 0.3, QZ.battery[1] - 0.45, -0.46); clip.rotation.z = 0.6; this.qModule.add(clip);
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.08), M.black); chip.position.set(QZ.chip[0], QZ.chip[1], -0.33); this.qModule.add(chip);
      for (let k = 0; k < 6; k++) for (const sd of [-1, 1]) { const pin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.02), M.gold); pin.position.set(QZ.chip[0] - 0.16 + k * 0.064, QZ.chip[1] + sd * 0.24, -0.3); this.qModule.add(pin); }
      // crystal can (lying along x) + tuning fork inside
      this.qCanMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.88, 0.9, 0.93), metalness: 1, roughness: 0.18, transparent: true });
      this.qCan = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 6, 24), this.qCanMat); this.qCan.rotation.z = Math.PI / 2; this.qCan.position.set(QZ.crystal[0], QZ.crystal[1], -0.42); this.qModule.add(this.qCan);
      const fork = at(new THREE.Group(), QZ.crystal[0] - 0.25, QZ.crystal[1], -0.42);
      const qmat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.85, 0.95, 1.0), metalness: 0, roughness: 0.1, emissive: new THREE.Color(0.25, 0.5, 0.65), clearcoat: 1 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.04), qmat); fork.add(base);
      for (const [g, sy] of [[this.prongA, 1], [this.prongB, -1]] as const) { const pr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), qmat); pr.position.x = 0.23; g.add(pr); g.position.set(0.03, sy * 0.055, 0); fork.add(g); }
      this.qModule.add(fork);
      for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.215, 48), glowMat([0.6, 1.6, 2.6])); r.rotation.y = Math.PI; r.position.set(QZ.crystal[0], QZ.crystal[1], -0.5); this.qRings.push(r); this.qModule.add(r); }
      // stepper motor: coil + stator + rotor
      this.qCoilMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.95, 0.45, 0.22), metalness: 1, roughness: 0.32, emissive: new THREE.Color(0, 0, 0) });
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.72, 32, 24).rotateZ(Math.PI / 2), this.qCoilMat); coil.position.set(QZ.coil[0], QZ.coil[1], -0.42); this.qModule.add(coil);
      for (let k = 0; k < 22; k++) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.008, 4, 24), this.qCoilMat); w.rotation.y = Math.PI / 2; w.position.set(QZ.coil[0] - 0.33 + k * 0.031, QZ.coil[1], -0.42); this.qModule.add(w); }
      const st1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.05), M.darkSteel); st1.position.set(QZ.coil[0] - 0.42, QZ.coil[1] + 0.25, -0.4); this.qModule.add(st1);
      const st2 = st1.clone(); st2.position.x = QZ.coil[0] + 0.42; this.qModule.add(st2);
      this.qRotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24).rotateX(Math.PI / 2), M.black));
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.065), M.red); this.qRotor.add(mk);
      this.qRotor.position.set(QZ.coil[0], QZ.coil[1] + 0.55, -0.4); this.qModule.add(this.qRotor);
      for (const [x, y, r, n] of [[0, 0, 0.32, 40], [0.05, -0.38, 0.17, 24], [0.3, -0.05, 0.12, 18]] as const) {
        const g = new THREE.Group(); g.add(new THREE.Mesh(gearGeo({ N: n, R: r, spokes: r > 0.2 ? 4 : 0 }, 0.03), M.whiteGear)); g.position.set(x, y, -0.32); this.qGears.push(g); this.qModule.add(g);
      }
      this.elec = new Pulses(10, [1.0, 3.2, 5.0], 0.03, poly([[QZ.battery[0], QZ.battery[1], -0.5], [0.1, 0.75, -0.42], [QZ.chip[0], QZ.chip[1], -0.42], [-0.7, -0.05, -0.42], [QZ.crystal[0], QZ.crystal[1], -0.52]]));
      this.elec2 = new Pulses(8, [1.0, 3.2, 5.0], 0.03, poly([[QZ.chip[0], QZ.chip[1], -0.42], [-0.1, 0.0, -0.42], [0.1, -0.45, -0.45], [QZ.coil[0], QZ.coil[1], -0.6]]));
      this.qModule.add(this.elec.group, this.elec2.group);
    }
    this.qz.add(this.qModule);
    this.root.add(this.qz);
  }

  update(t: number, cam: THREE.PerspectiveCamera) {
    const sc = sceneAt(t);
    // ---- studio colours per scene ----
    const warm = { top: [0.012, 0.016, 0.035], bot: [0.001, 0.001, 0.003], glow: [0.07, 0.035, 0.008], a: [1.0, 0.7, 0.35], b: [1.0, 0.85, 0.6] };
    const cool = { top: [0.004, 0.02, 0.04], bot: [0.0, 0.002, 0.006], glow: [0.01, 0.05, 0.08], a: [0.3, 0.8, 1.0], b: [0.6, 0.9, 1.0] };
    const end = { top: [0.02, 0.014, 0.04], bot: [0.001, 0.001, 0.004], glow: [0.06, 0.04, 0.05], a: [1.0, 0.75, 0.45], b: [0.5, 0.8, 1.0] };
    const k1 = sstep(S.s6 - 0.2, S.s6 + 0.3, t), k2 = sstep(S.s7 - 0.2, S.s7 + 0.3, t);
    const mix3 = (key: "top" | "bot" | "glow" | "a" | "b") => [0, 1, 2].map((j) => lerp(lerp(warm[key][j], cool[key][j], k1), end[key][j], k2)) as [number, number, number];
    this.bgMat.uniforms.cTop.value.setRGB(...mix3("top")).multiplyScalar(0.45); this.bgMat.uniforms.cBot.value.setRGB(...mix3("bot")); this.bgMat.uniforms.cGlow.value.setRGB(...mix3("glow")).multiplyScalar(0.5);
    this.bokehMat.uniforms.cA.value.setRGB(...mix3("a")); this.bokehMat.uniforms.cB.value.setRGB(...mix3("b")); this.bokehMat.uniforms.time.value = t;
    const camDir = new THREE.Vector3(); cam.getWorldDirection(camDir);
    this.bgMat.uniforms.glowDir.value.copy(camDir);
    this.bg.position.copy(cam.position); this.bokeh.position.copy(cam.position);
    this.bokehMat.uniforms.scale.value = 1920 * 0.5 / Math.tan((cam.fov * Math.PI) / 360) / 6;
    // light rig follows the camera so every shot keeps its key/rim relationship
    const side = new THREE.Vector3().crossVectors(camDir, cam.up).normalize();
    const up = new THREE.Vector3().crossVectors(side, camDir).normalize();
    const place = (l: THREE.DirectionalLight, s: number, u: number, f: number) => { l.position.copy(cam.position).addScaledVector(side, s).addScaledVector(up, u).addScaledVector(camDir, f); l.target.position.set(0, 0, 0); l.target.updateMatrixWorld(); };
    place(this.key, -8, 9, 2); place(this.rim, 9, 4, 22); place(this.fill, 6, -5, 1);

    // ---- mechanical watch ----
    const mVis = sc <= 5 || sc === 7;
    this.mech.visible = mVis;
    if (mVis) {
      poseMatrix(mechPose(t), this.mech.matrix); this.mech.matrixAutoUpdate = false; this.mech.matrixWorldNeedsUpdate = true;
      const e = explodeAt(t), so = strapOut(t), up2 = showUpper(t);
      this.mCrystal.position.z = EXPLODE.crystal * e; this.mSec.position.z = 0.36 + EXPLODE.sec * e; this.mMin.position.z = 0.4 + EXPLODE.min * e; this.mHour.position.z = 0.36 + EXPLODE.hour * e;
      this.mDial.position.z = EXPLODE.dial * e; this.mCase.position.z = EXPLODE.case * e; this.mBack.position.z = EXPLODE.back * e; this.mCrown.position.x = EXPLODE.crownX * e; this.mCrown.position.z = EXPLODE.case * e * 0.0;
      for (const g of [this.mCrystal, this.mSec, this.mMin, this.mHour, this.mDial, this.mCase, this.mBack, this.mCrown]) g.visible = up2;
      this.mCrystal.visible = up2 && !(t >= S.s5 && t < S.s6);
      this.strapTop.visible = this.strapBot.visible = so < 0.999;
      this.strapTop.position.set(0, 2.62 + so * 7, -0.1); this.strapBot.position.set(0, -2.62 - so * 7, -0.1);
      this.dialMat.opacity = dialOpacity(t); this.dialMat.depthWrite = this.dialMat.opacity > 0.95;
      // hands
      const ha = handAngles(mechClock(t));
      this.mHour.rotation.z = ha.hour; this.mMin.rotation.z = ha.min;
      // small seconds is on the fourth wheel: real time follows the train, time-lapse follows the clock
      const tr = trainAngles(t);
      this.mSec.rotation.z = t >= S.s5 + 2.8 && t < S.s6 ? ha.sec : tr.fourth - 2.2;
      // movement
      this.mMove.visible = !(t < S.s2 && dialOpacity(t) > 0.99) || true;
      this.barrel.rotation.z = tr.barrel; this.center.rotation.z = tr.center; this.third.rotation.z = tr.third; this.fourth.rotation.z = tr.fourth; this.escape.rotation.z = tr.escape;
      this.cannon.rotation.z = tr.center; this.minuteWheel.rotation.z = -tr.center / 3; this.hourWheel.rotation.z = tr.center / 12;
      this.ratchet.rotation.z = ratchetAngle(t); this.mCrownSpin.rotation.x = crownSpin(t);
      const th = balanceAngle(t); this.balance.rotation.z = th;
      this.pallet.rotation.z = palletAngle(t);
      this.hair.set(spiralPoints(0.06, 0.27, 8, 360, (u) => th * (1 - u) * 0.9, 0.3));
      // mainspring: wound = coils packed round the arbor, unwound = against the drum wall
      const w = windAt(t);
      const rOut = lerp(0.68, 0.38, w), rIn = 0.1;
      this.spring.set(spiralPoints(rIn, rOut, 10, 420, (u) => -w * 2.2 * u * u, tr.barrel * 0 - w * 3.0));
      const glow = t >= S.s3 && t < S.s4 ? sstep(20.4, 22.8, t) * (1 - 0.6 * sstep(24, 28, t)) : 0;
      this.springMat.emissive.setRGB(1.6 * glow, 0.75 * glow, 0.15 * glow);
      this.energy.set(t, 0.22, t >= S.s3 && t < S.s4 ? sstep(23.0, 23.8, t) * (1 - sstep(27.3, 28.0, t)) : 0);
      this.handPulse.set(t, 0.45, t >= S.s5 && t < S.s6 ? sstep(40.6, 41.2, t) * (1 - sstep(42.6, 43.2, t)) : 0);
    }

    // ---- quartz watch ----
    const qVis = sc >= 6;
    this.qz.visible = qVis;
    if (qVis) {
      poseMatrix(quartzPose(t), this.qz.matrix); this.qz.matrixAutoUpdate = false; this.qz.matrixWorldNeedsUpdate = true;
      const qa = handAngles(quartzClock(t), true);
      this.qHour.rotation.z = qa.hour; this.qMin.rotation.z = qa.min; this.qSec.rotation.z = qa.sec;
      const off = quartzBackOff(t);
      this.qBack.position.set(7.5 * off, 1.5 * off, -0.3 * off); this.qBack.visible = off < 0.99 || sc === 7;
      this.qModule.visible = sc === 6 && off > 0.01;
      const rev = crystalReveal(t);
      this.qCanMat.opacity = 1 - 0.85 * rev; this.qCanMat.depthWrite = rev < 0.05;
      const vib = crystalVib(t);
      const d = 0.05 * vib * Math.sin(2 * Math.PI * 7.5 * t);
      this.prongA.rotation.z = d; this.prongB.rotation.z = -d;
      this.qRings.forEach((r, k) => { const u = (t * 1.6 + k / 3) % 1; r.scale.setScalar(0.8 + 1.3 * u); (r.material as THREE.MeshBasicMaterial).opacity = vib * (1 - u) * 0.45; r.visible = vib > 0.01; });
      const battOn = sstep(53.9, 54.4, t) * (1 - sstep(62.4, 62.9, t));
      (this.qBattGlow.material as THREE.MeshBasicMaterial).opacity = battOn * (0.6 + 0.4 * Math.sin(t * 6));
      this.elec.set(t, 0.5, sstep(54.4, 55.0, t) * (1 - sstep(62.3, 62.8, t)));
      // once a second: pulse to the coil, rotor turns 180 deg, gears step (matches the second hand)
      const fr = quartzClock(t) % 1;
      const pulse = t > 61.0 && t < 62.8 ? Math.exp(-fr * 9) : 0;
      this.elec2.set(t, 0.9, t > 60.8 && t < 62.8 ? 1 : 0);
      this.qCoilMat.emissive.setRGB(2.2 * pulse, 0.9 * pulse, 0.25 * pulse);
      const steps = Math.floor(quartzClock(t)) + sstep(0, 0.06, fr);
      this.qRotor.rotation.z = steps * Math.PI;
      this.qGears.forEach((g, k) => (g.rotation.z = (k % 2 ? -1 : 1) * steps * (0.2 / (k + 1))));
    }
  }
}
