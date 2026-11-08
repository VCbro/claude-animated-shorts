import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Visual-explanation effects. Everything in this file is NOT a physical part:
// it is drawn in cyan / magenta "hologram" style so it reads as an overlay.
// ---------------------------------------------------------------------------

export const VIS_CYAN = new THREE.Color(0x36d6ff);
export const VIS_MAGENTA = new THREE.Color(0xff4fd8);
export const VIS_AMBER = new THREE.Color(0xffb347);

const flowVert = /* glsl */`
  varying vec2 vUv;
  #include <clipping_planes_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }`;
const flowFrag = /* glsl */`
  uniform vec3 uColor; uniform float uTime; uniform float uSpeed;
  uniform float uDash; uniform float uOpacity; uniform float uBase;
  varying vec2 vUv;
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    float d = fract(vUv.x * uDash - uTime * uSpeed);
    float pulse = smoothstep(0.0, 0.12, d) * (1.0 - smoothstep(0.25, 0.7, d));
    float a = (uBase + pulse) * uOpacity;
    gl_FragColor = vec4(uColor * (0.6 + 1.6 * pulse), a);
  }`;

export function flowMaterial(color, { dash = 6, speed = 1, base = 0.18 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uSpeed: { value: speed },
      uDash: { value: dash }, uOpacity: { value: 0 }, uBase: { value: base },
    },
    vertexShader: flowVert, fragmentShader: flowFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

export function flowTube(points, { radius = 0.06, color = VIS_CYAN, dash = 6, speed = 1, closed = false, tension = 0.5, segments = 200 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', tension);
  const geo = new THREE.TubeGeometry(curve, segments, radius, 8, closed);
  const mat = flowMaterial(color, { dash, speed });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 10;
  mesh.userData.curve = curve;
  return mesh;
}

// Soft glowing round sprites
const pointsVert = /* glsl */`
  attribute float aSize; attribute vec3 aColor; attribute float aAlpha;
  uniform float uScale; varying vec3 vColor; varying float vAlpha;
  void main() {
    vColor = aColor; vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const pointsFrag = /* glsl */`
  uniform float uOpacity; uniform float uHard; varying vec3 vColor; varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float a = mix(pow(1.0 - r, 2.0), 1.0 - smoothstep(0.7, 1.0, r), uHard);
    gl_FragColor = vec4(vColor, a * uOpacity * vAlpha);
  }`;

export function glowPoints(count, { color = VIS_CYAN, size = 1, additive = true, hard = 0 } = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const sizes = new Float32Array(count).fill(size);
  const cols = new Float32Array(count * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < count; i++) c.toArray(cols, i * 3);
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 300 }, uOpacity: { value: 0 }, uHard: { value: hard } },
    vertexShader: pointsVert, fragmentShader: pointsFrag, transparent: true, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 11;
  return pts;
}

// Electric current visual: glowing tube + charge particles running along a path
export class EnergyFlow {
  constructor(points, { color = VIS_AMBER, count = 90 } = {}) {
    this.group = new THREE.Group();
    this.tube = flowTube(points, { radius: 0.05, color, dash: 22, speed: 1.4, tension: 0.35, segments: 500 });
    this.curve = this.tube.userData.curve;
    this.group.add(this.tube);
    this.points = glowPoints(count, { color, size: 0.3 });
    this.group.add(this.points);
    this.count = count;
    this.offsets = Array.from({ length: count }, (_, i) => i / count);
    this.t = 0;
    this._v = new THREE.Vector3();
  }
  update(dt, time, amount, direction = 1) {
    this.group.visible = amount > 0.001;
    if (!this.group.visible) return;
    this.tube.material.uniforms.uTime.value = time * direction;
    this.tube.material.uniforms.uOpacity.value = amount * 0.55;
    this.points.material.uniforms.uOpacity.value = amount;
    this.t += dt * 0.07 * direction;
    const pos = this.points.geometry.attributes.position;
    for (let i = 0; i < this.count; i++) {
      const u = ((this.offsets[i] + this.t) % 1 + 1) % 1;
      this.curve.getPointAt(u, this._v);
      pos.setXYZ(i, this._v.x, this._v.y, this._v.z);
    }
    pos.needsUpdate = true;
  }
}

// Curved arrow (direction-of-rotation indicator), lying in the XZ plane
export function rotationArrow(radius, { color = VIS_CYAN, tube = 0.06, arc = Math.PI * 1.6, dir = 1 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(radius, tube, 8, 96, arc);
  geo.rotateX(Math.PI / 2); // into XZ plane, arc runs from +x toward +z
  const mat = flowMaterial(color, { dash: 4, speed: -1.2 * dir, base: 0.35 });
  const ring = new THREE.Mesh(geo, mat);
  ring.renderOrder = 10;
  g.add(ring);
  const headMat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const head = new THREE.Mesh(new THREE.ConeGeometry(tube * 3.2, tube * 8, 16), headMat);
  head.renderOrder = 10;
  // Rotation +Y is counter-clockwise seen from above: x -> -z. Our torus arc goes x -> +z
  // so the arrow head sits at the arc START pointing toward -z (the direction of motion).
  head.position.set(radius, 0, 0);
  head.rotation.x = -Math.PI / 2 * dir;
  g.add(head);
  g.userData.mats = [mat, headMat];
  g.userData.setOpacity = (o, time) => {
    g.visible = o > 0.001;
    mat.uniforms.uOpacity.value = o;
    mat.uniforms.uTime.value = time;
    headMat.opacity = o;
  };
  return g;
}

// Motion trail disc behind each of the 4 blade wings
export function bladeTrail(inner, outer, wings = 4) {
  const geo = new THREE.RingGeometry(inner, outer, 128, 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAngle: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xcfe9ff) } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uAngle; uniform float uOpacity; uniform vec3 uColor; varying vec2 vP;
      void main(){
        float th = atan(vP.y, vP.x); float r = length(vP);
        float a = 0.0;
        for (int i = 0; i < ${wings}; i++) {
          float d = mod(uAngle + float(i) * 6.2831853 / ${wings}.0 - th, 6.2831853);
          a += exp(-d * 2.6);
        }
        float radial = smoothstep(${inner.toFixed(2)}, ${(inner + 0.6).toFixed(2)}, r) * (1.0 - smoothstep(${(outer - 0.3).toFixed(2)}, ${outer.toFixed(2)}, r));
        gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0) * radial * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2; // geometry (x,y) -> world (x, -z); atan(y,x) == blade angle
  mesh.renderOrder = 12;
  return mesh;
}
