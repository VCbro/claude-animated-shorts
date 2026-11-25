// Render STYLES for the 3D explainer: they change how every 3D part is drawn (materials, outlines, edges),
// on top of a THEME (backdrop, lights, captions). Works on any machine without touching the model code:
// after the scene is built, applyStyle() swaps each standard material for a styled twin, and syncStyle()
// (called every frame) copies the timeline's live changes (colour, opacity, emissive, visibility) onto the twin.
// Pick with ?style=<name> in the URL, or VSTYLE=<name> for tools/render.py. Default: real.
//   real      physically based metal/plastic (the original look)
//   clay      matte clay model, soft and premium (Apple keynote / product render feel)
//   toon      cel-shaded cartoon: 3-step shading + black ink outlines
//   pastel    toon with soft pastel colours and grey outlines (kids / friendly)
//   lowpoly   flat-shaded facets, saturated colours (stylised game look)
//   chrome    everything polished metal, tinted by the part colour (luxury / sci-fi)
//   xray      see-through glowing shells, inner parts readable (medical-scan feel)
//   hologram  cyan additive hologram with scanlines and fresnel rim (sci-fi HUD)
//   blueprint white technical lines on dark fill (engineering drawing)
//   sketch    white paper model with black pencil edges (hand-drawn / whiteboard)
//   neonedge  dark solid parts with glowing coloured edges (Tron / cyberpunk)
import * as THREE from 'three';

export const STYLES = ['real', 'clay', 'toon', 'pastel', 'lowpoly', 'chrome', 'xray', 'hologram', 'blueprint', 'sketch', 'neonedge'];
export function styleName() {
  const q = new URLSearchParams(location.search).get('style');
  return STYLES.includes(q) ? q : 'real';
}

const PAIRS = [];          // [orig material, styled material, kind]
const EDGES = [];          // [mesh, lineSegments, orig material]
const HULLS = [];          // [mesh, outline mesh]
let STYLE = 'real', TIME = 0;

function toonRamp(steps) {
  const d = new Uint8Array(steps); for (let i = 0; i < steps; i++) d[i] = Math.round((0.35 + 0.65 * i / (steps - 1)) * 255);
  const t = new THREE.DataTexture(d, steps, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
const RAMP3 = toonRamp(3);

const holoMat = () => new THREE.ShaderMaterial({
  uniforms: { uCol: { value: new THREE.Color('#5ff4ff') }, uA: { value: 1 }, uT: { value: 0 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: `varying vec3 n; varying vec3 vd; varying vec3 wp; void main(){ vec4 w = modelMatrix*vec4(position,1.);
    #ifdef USE_INSTANCING
      w = modelMatrix*instanceMatrix*vec4(position,1.);
    #endif
    wp = w.xyz; vec4 mv = viewMatrix*w; n = normalize(mat3(viewMatrix)*mat3(modelMatrix)*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA, uT; varying vec3 n; varying vec3 vd; varying vec3 wp;
    void main(){ float f = pow(1.-abs(dot(normalize(n), normalize(vd))), 2.);
      float scan = .55 + .45*step(.5, fract(wp.y*60. - uT*1.5));
      gl_FragColor = vec4(uCol*(.25 + 1.4*f)*scan, (.08 + .75*f)*uA); }`,
});
const xrayMat = (col) => new THREE.ShaderMaterial({
  uniforms: { uCol: { value: new THREE.Color(col) }, uA: { value: 1 } },
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: `varying vec3 n; varying vec3 vd; void main(){ vec4 p = vec4(position,1.);
    #ifdef USE_INSTANCING
      p = instanceMatrix*p;
    #endif
    vec4 mv = modelViewMatrix*p; n = normalize(normalMatrix*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying vec3 n; varying vec3 vd;
    void main(){ float f = pow(1.-abs(dot(normalize(n), normalize(vd))), 1.8);
      gl_FragColor = vec4(mix(uCol, vec3(1.), .35)*(.5 + .9*f), (.10 + .8*f)*uA); }`,
});

function styled(orig, mesh) {
  const c = orig.color ? orig.color.clone() : new THREE.Color('#ccc');
  const base = { transparent: orig.transparent, opacity: orig.opacity, side: orig.side, depthWrite: orig.depthWrite, map: orig.map || null, vertexColors: orig.vertexColors };
  switch (STYLE) {
    case 'clay': return new THREE.MeshStandardMaterial({ ...base, map: null, color: c.clone().lerp(new THREE.Color('#e9e2d8'), 0.72), roughness: 0.92, metalness: 0 });
    case 'toon': return new THREE.MeshToonMaterial({ ...base, color: c, gradientMap: RAMP3 });
    case 'pastel': { const p = c.clone(); const hsl = {}; p.getHSL(hsl); p.setHSL(hsl.h, Math.min(0.55, hsl.s * 0.8 + 0.15), 0.72 + 0.15 * hsl.l);
      return new THREE.MeshToonMaterial({ ...base, map: null, color: p, gradientMap: RAMP3 }); }
    case 'lowpoly': { const p = c.clone(); const hsl = {}; p.getHSL(hsl); p.setHSL(hsl.h, Math.min(1, hsl.s * 1.25), hsl.l);
      return new THREE.MeshStandardMaterial({ ...base, map: null, color: p, roughness: 0.75, metalness: 0.05, flatShading: true }); }
    case 'chrome': return new THREE.MeshStandardMaterial({ ...base, map: null, color: c.clone().lerp(new THREE.Color('#ffffff'), 0.45), roughness: 0.12, metalness: 1 });
    case 'xray': return xrayMat(c);
    case 'hologram': return holoMat();
    case 'blueprint': return new THREE.MeshLambertMaterial({ color: '#0a2246', emissive: '#0e2f5c', emissiveIntensity: 1, transparent: true, opacity: 0.35 * (orig.opacity ?? 1), depthWrite: false, side: THREE.DoubleSide });
    case 'sketch': return new THREE.MeshLambertMaterial({ ...base, map: null, color: new THREE.Color('#f6f3ec').lerp(c, 0.12) });
    case 'neonedge': return new THREE.MeshStandardMaterial({ ...base, map: null, color: '#0b0d12', roughness: 0.5, metalness: 0.4 });
  }
  return orig;
}
const EDGE_COL = { blueprint: '#e6f3ff', sketch: '#1b1b1b', toon: '#101010', pastel: '#5a5a66', neonedge: null };

// call once after the whole scene is built
export function applyStyle(scene, name = styleName()) {
  STYLE = name; if (name === 'real') return name;
  const meshes = []; scene.traverse((o) => { if (o.isMesh && !o.isSprite) meshes.push(o); });
  const cache = new Map();
  for (const m of meshes) {
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const isStd = mats.every((x) => x && (x.isMeshStandardMaterial || x.isMeshPhysicalMaterial || x.isMeshLambertMaterial || x.isMeshPhongMaterial));
    if (!isStd) continue;                         // leave particles, shaders and helper materials alone
    const out = mats.map((o) => {
      if (!cache.has(o)) {
        const s = styled(o, m);
        // the timeline may still write colour/emissive on mesh.material: give shader twins the same fields
        if (!s.color) s.color = o.color ? o.color.clone() : new THREE.Color();
        if (!s.emissive) { s.emissive = new THREE.Color(); s.emissiveIntensity = 0; }
        cache.set(o, s); PAIRS.push([o, s]);
      }
      return cache.get(o);
    });
    m.material = Array.isArray(m.material) ? out : out[0];
    if (STYLE === 'hologram' || STYLE === 'xray') m.castShadow = false;
    // edges (ink / pencil / blueprint / neon): child line segments follow the mesh
    const ec = EDGE_COL[STYLE];
    if (ec !== undefined && !m.isInstancedMesh && m.geometry.attributes.position.count < 60000) {
      let col = ec ? new THREE.Color(ec) : null;
      if (!col) { const hsl = { h: 0.52, s: 1, l: 0.6 }; if (mats[0].color) mats[0].color.getHSL(hsl); col = new THREE.Color().setHSL(hsl.s < 0.15 ? 0.52 : hsl.h, 1, 0.62); }
      const lm = new THREE.LineBasicMaterial({ color: col, transparent: true, depthWrite: false, toneMapped: STYLE !== 'neonedge' });
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, STYLE === 'sketch' ? 24 : 32), lm);
      e.renderOrder = 10; m.add(e); EDGES.push([m, e, mats[0]]);
    }
    // toon outlines: inverted hull (back faces pushed out along the normal)
    if ((STYLE === 'toon' || STYLE === 'pastel') && !m.isInstancedMesh && m.geometry.attributes.normal && m.geometry.attributes.position.count < 60000) {
      const hm = new THREE.MeshBasicMaterial({ color: STYLE === 'toon' ? '#0a0a0a' : '#4b4b58', side: THREE.BackSide });
      hm.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.004;'); };
      const h = new THREE.Mesh(m.geometry, hm); h.renderOrder = -1; m.add(h); HULLS.push([m, h, mats[0]]);
    }
  }
  return name;
}

// call every frame before rendering
export function syncStyle(t = 0) {
  if (STYLE === 'real') return; TIME = t;
  for (const [o, s] of PAIRS) {
    const a = (o.visible === false ? 0 : 1) * (o.transparent ? o.opacity : 1);
    if (s.uniforms) { if (s.uniforms.uA) s.uniforms.uA.value = a; if (s.uniforms.uT) s.uniforms.uT.value = t; if (STYLE === 'xray' && o.color) s.uniforms.uCol.value.copy(o.color); continue; }
    if (STYLE === 'toon' || STYLE === 'lowpoly') { if (o.color && STYLE === 'toon') s.color.copy(o.color); }
    if (o.emissive && s.emissive && !s.uniforms && STYLE !== 'blueprint') { s.emissive.copy(o.emissive); s.emissiveIntensity = o.emissiveIntensity; }
    if (STYLE === 'blueprint') s.opacity = 0.35 * a; else { s.opacity = o.opacity; s.transparent = o.transparent; }
    s.visible = o.visible;
  }
  for (const [m, e, o] of EDGES) {
    const a = (o.transparent ? o.opacity : 1);
    e.material.opacity = STYLE === 'blueprint' ? 0.9 * Math.max(0.25, a) : STYLE === 'neonedge' ? 1 : Math.min(1, a * 1.2);
    e.visible = o.visible !== false;
  }
  for (const [m, h, o] of HULLS) h.visible = !o.transparent || o.opacity > 0.9;
}
