import * as THREE from 'three';
import { glowPoints, flowTube, VIS_CYAN } from './effects.js';
import { textTexture } from './materials.js';

/*
  Glass jar + liquid + ingredient particles.
  Flow model (simplified but physically plausible for an immersion blender):
  the spinning blade sucks liquid up into the open bottom of the bell, throws it out
  radially through the vent windows; it rises along the jar wall, turns inward at
  the surface (forming a vortex dip around the shaft) and is drawn down again - a
  toroidal circulation with a swirl component.
*/

export const JAR = { floorY: -32, R: 6.65, Ro: 7.0, innerBottom: -31.2, top: -12, surface: -18, blenderY: -10.6 };

const liquidVert = /* glsl */`
  uniform float uTime; uniform float uDepth; uniform float uSurface; uniform float uR; uniform float uSpin;
  varying vec3 vWorld; varying float vTop;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    vTop = 0.0;
    if (p.y > uSurface - 0.001) {
      vTop = 1.0;
      float k = 1.0 - clamp(r / uR, 0.0, 1.0);
      float th = atan(p.z, p.x);
      p.y -= uDepth * k * k * 1.6;
      p.y += 0.07 * uSpin * sin(th * 5.0 + r * 1.7 - uTime * 7.0) * (1.0 - k);
      p.y += 0.03 * sin(r * 3.0 - uTime * 2.0);
    }
    vec4 w = modelMatrix * vec4(p, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const liquidFrag = /* glsl */`
  uniform float uTime; uniform float uMix; uniform float uSwirl; uniform float uOpacity;
  uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColMix; uniform vec3 uCam; uniform float uBottom; uniform float uSurface;
  varying vec3 vWorld; varying float vTop;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    vec3 v = normalize(uCam - vWorld);
    if (dot(n, v) < 0.0) n = -n;
    float r = length(vWorld.xz);
    float th = atan(vWorld.z, vWorld.x) - uSwirl / (0.6 + r * 0.35);
    float h = (vWorld.y - uBottom) / (uSurface - uBottom);
    float n1 = noise(vec2(th * 2.0, vWorld.y * 0.5 + uSwirl * 0.2)) + 0.5 * noise(vec2(th * 5.0, vWorld.y * 1.3));
    float boundary = 0.45 + 0.35 * (n1 - 0.7) * (0.4 + uMix * 2.0);
    float layer = smoothstep(boundary - 0.06, boundary + 0.06, h);
    vec3 layered = mix(uColA, uColB, layer);
    float streak = smoothstep(0.55, 0.9, noise(vec2(th * 3.0 + vWorld.y * 0.4, r * 0.8 + uTime * 0.1)));
    layered = mix(layered, mix(uColA, uColB, 0.5), streak * uMix * 0.8);
    vec3 col = mix(layered, uColMix, smoothstep(0.35, 1.0, uMix));
    vec3 L = normalize(vec3(0.5, 0.9, 0.6));
    float diff = 0.55 + 0.45 * max(dot(n, L), 0.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 hdir = normalize(L + v);
    float spec = pow(max(dot(n, hdir), 0.0), 80.0) * (0.4 + 0.6 * vTop);
    vec3 c = col * diff + fres * vec3(0.35, 0.4, 0.45) + spec * 1.2;
    gl_FragColor = vec4(c, uOpacity * (0.82 + 0.18 * fres));
  }`;

export function buildFluid(M, loopLocal) {
  const group = new THREE.Group();
  const { R, Ro, innerBottom, top, floorY, surface, blenderY } = JAR;

  // ----- Glass jar (outer front faces + inner back faces, thick base) -----
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe9f4ff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16,
    envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, depthWrite: false, side: THREE.FrontSide,
  });
  const outerProf = [[0.0, floorY], [Ro - 0.5, floorY], [Ro - 0.1, floorY + 0.15], [Ro, floorY + 0.6], [Ro, top - 0.2], [Ro - 0.05, top]].map(([r, y]) => new THREE.Vector2(r, y));
  const outer = new THREE.Mesh(new THREE.LatheGeometry(outerProf, 128), glassMat);
  outer.renderOrder = 30;
  const innerMat = glassMat.clone(); innerMat.side = THREE.BackSide; innerMat.opacity = 0.1;
  const innerProf = [[0.0, innerBottom], [R - 0.4, innerBottom], [R, innerBottom + 0.4], [R, top], [Ro - 0.05, top]].map(([r, y]) => new THREE.Vector2(r, y));
  const innerWall = new THREE.Mesh(new THREE.LatheGeometry(innerProf, 128), innerMat);
  innerWall.renderOrder = 5;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(Ro - 0.17, 0.18, 12, 128), glassMat.clone());
  lip.rotation.x = Math.PI / 2; lip.position.y = top; lip.material.opacity = 0.35; lip.renderOrder = 31;
  group.add(outer, innerWall, lip);
  // Printed graduation marks on the glass
  const marks = new THREE.Group();
  const markTex = textTexture('', { w: 4, h: 4 });
  for (let i = 0; i < 7; i++) {
    const y = innerBottom + 3 + i * 2.2;
    const len = i % 2 === 0 ? 1.2 : 0.6;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.07), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false }));
    m.position.set(Ro * Math.sin(-0.45) - 0.0, y, Ro * Math.cos(-0.45) + 0.01); m.rotation.y = -0.45; m.renderOrder = 32; marks.add(m);
    if (i % 2 === 0) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), new THREE.MeshBasicMaterial({ map: textTexture(`${200 + i * 100}`, { w: 160, h: 60, font: '600 40px Montserrat, Arial', color: '#ffffff' }), transparent: true, opacity: 0.7, depthWrite: false }));
      t.position.set(Math.sin(-0.33) * (Ro + 0.02), y + 0.05, Math.cos(-0.33) * (Ro + 0.02)); t.rotation.y = -0.33; t.renderOrder = 32; marks.add(t);
    }
  }
  markTex.dispose();
  group.add(marks);

  // ----- Liquid -----
  const prof = [new THREE.Vector2(0.001, innerBottom + 0.05), new THREE.Vector2(R - 0.45, innerBottom + 0.05), new THREE.Vector2(R - 0.06, innerBottom + 0.45),
    new THREE.Vector2(R - 0.06, surface)];
  for (let i = 1; i <= 40; i++) prof.push(new THREE.Vector2((R - 0.06) * (1 - i / 40) + 0.001, surface));
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uDepth: { value: 0 }, uSurface: { value: surface }, uR: { value: R }, uSpin: { value: 0 },
      uMix: { value: 0 }, uSwirl: { value: 0 }, uOpacity: { value: 0.62 },
      uColA: { value: new THREE.Color(0x8e1739) }, uColB: { value: new THREE.Color(0xf3e3b8) }, uColMix: { value: new THREE.Color(0xe0687a) },
      uCam: { value: new THREE.Vector3() }, uBottom: { value: innerBottom }, uSurface2: { value: surface },
    },
    vertexShader: liquidVert, fragmentShader: liquidFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), liquidMat);
  liquid.renderOrder = 20;
  group.add(liquid);

  // ----- Flow loop (r, y) in world coords -----
  const loopCurve = new THREE.CatmullRomCurve3(loopLocal.map(([r, y]) => new THREE.Vector3(r, y + blenderY, 0)), true, 'centripetal');
  const LUT = loopCurve.getSpacedPoints(600);
  const sampleLoop = (u) => LUT[Math.floor((((u % 1) + 1) % 1) * 600)];
  const bladeU = 1 / loopLocal.length; // index 1 = at the blade

  // ----- Ingredient chunks (opaque, swirl through the liquid) -----
  const kinds = [
    { geo: new THREE.IcosahedronGeometry(0.42, 1), color: 0x7a0f2a, rough: 0.35, n: 34, name: 'berries' },
    { geo: new THREE.DodecahedronGeometry(0.45, 0), color: 0xf2d27a, rough: 0.5, n: 30, name: 'banana' },
    { geo: new THREE.OctahedronGeometry(0.4, 0), color: 0x3f8f3a, rough: 0.6, n: 22, name: 'leaves' },
    { geo: new THREE.BoxGeometry(0.55, 0.55, 0.55), color: 0xffffff, rough: 0.05, n: 14, name: 'ice', transmission: true },
  ];
  const chunks = [];
  for (const k of kinds) {
    const mat = k.transmission
      ? new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.55, clearcoat: 1 })
      : new THREE.MeshPhysicalMaterial({ color: k.color, roughness: k.rough, clearcoat: 0.4, sheen: 0.3 });
    const inst = new THREE.InstancedMesh(k.geo, mat, k.n);
    inst.frustumCulled = false; inst.castShadow = false;
    group.add(inst);
    const data = Array.from({ length: k.n }, () => ({
      u: Math.random(), th: Math.random() * Math.PI * 2, dr: (Math.random() - 0.5) * 1.6, dy: (Math.random() - 0.5) * 1.4,
      sp: 0.75 + Math.random() * 0.5, s: 0.7 + Math.random() * 0.6, rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0), spinRate: Math.random() * 3,
      // initial resting position (before blending)
      rest: new THREE.Vector3(),
    }));
    data.forEach((d) => {
      const a = Math.random() * Math.PI * 2, rr = 3.6 + Math.random() * 2.3;
      d.rest.set(Math.cos(a) * rr, k.name === 'ice' || k.name === 'leaves' ? surface - 0.5 - Math.random() * 1.2 : innerBottom + 0.5 + Math.random() * 8, Math.sin(a) * rr);
    });
    chunks.push({ inst, data, kind: k });
  }

  // ----- Fine particles: pulp / micro droplets that reveal the flow -----
  const FINE = 1400;
  const fine = glowPoints(FINE, { size: 0.2, additive: false, hard: 0.9 });
  fine.renderOrder = 21;
  const fineData = Array.from({ length: FINE }, () => ({ u: Math.random(), th: Math.random() * Math.PI * 2, dr: (Math.random() - 0.5) * 2.2, dy: (Math.random() - 0.5) * 1.8, sp: 0.6 + Math.random() * 0.8, c: Math.floor(Math.random() * 3) }));
  const fineCols = [new THREE.Color(0xb3264f), new THREE.Color(0xfff0c9), new THREE.Color(0x6fbf5a)];
  const mixCol = new THREE.Color(0xe36f80);
  group.add(fine);

  // ----- Visual flow arrows (circulation) in the X-Y plane on both sides -----
  const arrows = new THREE.Group();
  for (const s of [1, -1]) {
    const pts = loopLocal.map(([r, y]) => new THREE.Vector3(s * r, y + blenderY, 0.0));
    const t = flowTube(pts, { radius: 0.09, color: VIS_CYAN, dash: 7, speed: 0.9, closed: true, segments: 300 });
    arrows.add(t);
  }
  group.add(arrows);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), tmpCol = new THREE.Color();
  let swirl = 0;

  function update(dt, time, st, camera) {
    group.visible = st.jar > 0.001;
    if (!group.visible) return;
    const sp = st.speedNorm; // 0..1
    swirl += dt * sp * 2.2;
    const U = liquidMat.uniforms;
    U.uTime.value = time; U.uDepth.value = 2.2 * sp * sp; U.uSpin.value = sp; U.uMix.value = st.mix; U.uSwirl.value = swirl;
    U.uOpacity.value = (0.6 + 0.3 * st.mix) * st.jar;
    U.uCam.value.copy(camera.position);
    glassMat.opacity = 0.16 * st.jar; innerMat.opacity = 0.1 * st.jar; lip.material.opacity = 0.35 * st.jar;
    marks.children.forEach((m) => { m.material.opacity = 0.6 * st.jar; });
    arrows.children.forEach((t) => { t.material.uniforms.uOpacity.value = st.flowArrows; t.material.uniforms.uTime.value = time; });
    arrows.visible = st.flowArrows > 0.001;

    const flowRate = 0.22 * sp;
    // chunks
    for (const { inst, data } of chunks) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        d.u += dt * flowRate * d.sp;
        const p = sampleLoop(d.u);
        const r = Math.min(R - 0.55, Math.max(0.3, p.x + d.dr * (0.5 + 0.5 * Math.min(1, p.x / 3))));
        d.th += dt * sp * (3.2 / (0.8 + r * 0.6)) * d.sp;
        pos.set(Math.cos(d.th) * r, p.y + d.dy * 0.6, Math.sin(d.th) * r);
        // blend from resting position into the flow as speed starts
        const engage = Math.min(1, st.flowEngage);
        pos.lerpVectors(d.rest, pos, engage);
        pos.y = Math.min(pos.y, surface - 0.35);
        d.rot.x += dt * d.spinRate * sp * 3; d.rot.y += dt * d.spinRate * sp * 2;
        q.setFromEuler(d.rot);
        const shrink = Math.pow(Math.max(0, 1 - st.mix * 1.15), 0.8);
        const s = d.s * shrink * st.jar;
        sc.set(s, s, s);
        m4.compose(pos, q, sc);
        inst.setMatrixAt(i, m4);
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.material.opacity = inst.material.transparent ? 0.55 * st.jar : 1;
    }
    // fine particles
    const P = fine.geometry.attributes.position, C = fine.geometry.attributes.aColor, A = fine.geometry.attributes.aAlpha;
    for (let i = 0; i < FINE; i++) {
      const d = fineData[i];
      d.u += dt * flowRate * d.sp * 1.1;
      const p = sampleLoop(d.u);
      const r = Math.min(R - 0.3, Math.max(0.25, p.x + d.dr * (0.4 + 0.6 * Math.min(1, p.x / 3))));
      d.th += dt * sp * (3.6 / (0.8 + r * 0.6)) * d.sp;
      P.setXYZ(i, Math.cos(d.th) * r, Math.min(p.y + d.dy * 0.5, surface - 0.2), Math.sin(d.th) * r);
      tmpCol.copy(fineCols[d.c]).lerp(mixCol, Math.min(1, st.mix * 1.3));
      C.setXYZ(i, tmpCol.r, tmpCol.g, tmpCol.b);
      A.setX(i, 0.85);
    }
    P.needsUpdate = true; C.needsUpdate = true; A.needsUpdate = true;
    fine.material.uniforms.uOpacity.value = st.jar * Math.min(1, sp * 2.0 + 0.15) * (1 - 0.75 * st.mix);
  }

  return { group, update, liquid, bladeU };
}
