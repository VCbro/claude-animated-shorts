// 3D realistic documentary engine (three.js). Physically based sky + sun, ocean, shadows, bloom, a film grade
// (contrast, warm/teal split, grain, vignette, 2.2:1 letterbox), DOM text/labels/captions on top.
// Like the 2D engine, everything is a pure function of time: renderAt(t) -> any frame, exactly repeatable.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
// size: 1920x1080 (YouTube) by default; ?size=1080x1920 or VIEW=1080x1920 for capture.py -> vertical Shorts/Reels
const _sz = (new URLSearchParams(location.search).get('size') || window.__VIEW || '1920x1080').split('x').map(Number);
export const W = _sz[0], H = _sz[1];
if (H > W) document.documentElement.classList.add('vertical');
document.documentElement.style.setProperty('--W', W + 'px'); document.documentElement.style.setProperty('--H', H + 'px');
export const K = await fetch('/out/anchors.json').then((r) => r.json()).catch(() => ({ END: 12 }));
const CAPS = await fetch('/out/captions.json').then((r) => r.json()).catch(() => []);
export const END = K.END;
export const A = (n) => { if (!(n in K)) throw new Error('anchor ' + n); return K[n]; };

// ------------------------------------------------------------------ time helpers (same as the 2D engine)
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const lerp = (a, b, u) => a + (b - a) * u;
export const R = (t, a, d = 0.5) => ss((t - a) / d);
export const win = (t, a, b, f = 0.3) => R(t, a, f) * (1 - R(t, b - f, f));
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------ renderer, sky, sun, ocean
export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(35, W / H, 0.5, 30000);

const sky = new Sky(); sky.scale.setScalar(20000); scene.add(sky);
const SU = sky.material.uniforms;
export const sunDir = new THREE.Vector3();
export const sunLight = new THREE.DirectionalLight('#ffffff', 3); scene.add(sunLight); scene.add(sunLight.target);
sunLight.castShadow = true; sunLight.shadow.mapSize.set(2048, 2048);
Object.assign(sunLight.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 10, far: 2000 });
sunLight.shadow.bias = -0.0004;
export const hemi = new THREE.HemisphereLight('#bcd4ff', '#2a2a30', 0.6); scene.add(hemi);
const pmrem = new THREE.PMREMGenerator(renderer); let envRT = null;

// procedural ocean normal map (tileable sum of waves), so no texture download is needed
function waterNormals(n = 256) {
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); const im = g.createImageData(n, n);
  const hgt = (x, y) => { let h = 0; for (let k = 0; k < 40; k++) { const fx = Math.floor((rnd(k) - 0.5) * 70), fy = Math.floor((rnd(k + 20) - 0.5) * 70), ph = rnd(k + 40) * 6.283;
    h += Math.sin((fx * x + fy * y) / n * 6.283 + ph) / (2 + Math.hypot(fx, fy)); } return h; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1); const v = new THREE.Vector3(-dx * 6, -dy * 6, 1).normalize();
    const i = (y * n + x) * 4; im.data[i] = (v.x * 0.5 + 0.5) * 255; im.data[i + 1] = (v.y * 0.5 + 0.5) * 255; im.data[i + 2] = (v.z * 0.5 + 0.5) * 255; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0); const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
}
export const ocean = new Water(new THREE.PlaneGeometry(20000, 20000), {
  textureWidth: 512, textureHeight: 512, waterNormals: waterNormals(), sunDirection: new THREE.Vector3(), sunColor: 0xffffff,
  waterColor: 0x062a3a, distortionScale: 1.3, fog: false,
});
ocean.rotation.x = -Math.PI / 2; scene.add(ocean);

// sky look: elevation/azimuth of the sun in degrees, haze. Call from a film to set the mood (dawn, noon, storm...).
export function setSky({ elevation = 4, azimuth = 200, turbidity = 8, rayleigh = 2.2, mie = 0.006, exposure = 0.5, water = 0x062a3a, sunCol = '#ffd2a0', sunInt = 3.2 } = {}) {
  SU.turbidity.value = turbidity; SU.rayleigh.value = rayleigh; SU.mieCoefficient.value = mie; SU.mieDirectionalG.value = 0.86;
  const phi = THREE.MathUtils.degToRad(90 - elevation), th = THREE.MathUtils.degToRad(azimuth);
  sunDir.setFromSphericalCoords(1, phi, th); SU.sunPosition.value.copy(sunDir);
  ocean.material.uniforms.sunDirection.value.copy(sunDir).normalize(); ocean.material.uniforms.waterColor.value.set(water);
  sunLight.color.set(sunCol); sunLight.intensity = sunInt;
  renderer.toneMappingExposure = exposure;
  if (envRT) envRT.dispose();
  const s2 = new THREE.Scene(); const sk = new Sky(); sk.scale.setScalar(1000); Object.assign(sk.material.uniforms, {}); for (const k in SU) sk.material.uniforms[k].value = SU[k].value; s2.add(sk);
  envRT = pmrem.fromScene(s2); scene.environment = envRT.texture;
}
// keep the shadow camera around a point of interest (call each frame with the hero's position)
export function sunFollow(p, dist = 900) { sunLight.position.copy(p).addScaledVector(sunDir, dist); sunLight.target.position.copy(p); }

// ------------------------------------------------------------------ camera shots
// keys: [[t, [px,py,pz], [tx,ty,tz], fov], ...]; smooth (eased) between keys. shake: amplitude in degrees (handheld feel)
export function shot(t, keys, shake = 0.08) {
  let a = keys[0], b = keys[0], u = 0;
  if (t >= keys[keys.length - 1][0]) a = b = keys[keys.length - 1];
  else for (let i = 0; i < keys.length - 1; i++) if (t >= keys[i][0] && t < keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; u = eio((t - a[0]) / (b[0] - a[0])); break; }
  const P = (i) => lerp(a[1][i], b[1][i], u), T = (i) => lerp(a[2][i], b[2][i], u);
  camera.position.set(P(0), P(1), P(2)); camera.fov = lerp(a[3] ?? 35, b[3] ?? 35, u); camera.updateProjectionMatrix();
  camera.lookAt(T(0), T(1), T(2));
  if (shake) { camera.rotateX(THREE.MathUtils.degToRad(shake * Math.sin(t * 1.3) * 0.7)); camera.rotateY(THREE.MathUtils.degToRad(shake * Math.sin(t * 0.9 + 1))); }
}

// ------------------------------------------------------------------ post: bloom + film grade + grain + vignette + letterbox
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.6, 0.85); composer.addPass(bloom);
composer.addPass(new OutputPass());
export const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uBox: { value: W > H ? 104 / 1080 : 0 }, uFade: { value: 1 }, uWarm: { value: 0.12 }, uVig: { value: 0.55 }, uGrain: { value: 0.05 } },
  vertexShader: 'varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT, uBox, uFade, uWarm, uVig, uGrain; varying vec2 v;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, v).rgb;
      float l = dot(c, vec3(.299,.587,.114));
      c = mix(c, c * vec3(1.06,1.0,.92), uWarm*smoothstep(.35,.9,l));          // warm highlights
      c = mix(c, c * vec3(.9,1.0,1.08), uWarm*(1.-smoothstep(.05,.45,l)));      // teal shadows
      c = (c - .5) * 1.06 + .5;                                                  // contrast
      vec2 q = v - .5; c *= 1. - uVig * dot(q*vec2(1.2,1.), q*vec2(1.2,1.)) * 1.6;
      c += (h(v*1000. + uT) - .5) * uGrain;
      if (v.y < uBox || v.y > 1. - uBox) c = vec3(0.);
      gl_FragColor = vec4(c * uFade, 1.);
    }`,
});
composer.addPass(grade);

// ------------------------------------------------------------------ DOM layer: text, labels (leader lines), captions
const UIel = document.getElementById('ui'), LNel = document.getElementById('lines'), CAPel = document.getElementById('cap');
let UI = [], LINES = [];
export function text(html, x, y, { size = 60, a = 1, cls = 'ttl', color = '#fff', align = 'center' } = {}) {
  if (a <= 0.01) return;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  UI.push(`<div class="t ${cls}" style="left:${x}px;top:${y}px;font-size:${size}px;color:${color};opacity:${a};transform:translate(${tx},-50%) translateY(${(1 - a) * 14}px)">${html}</div>`);
}
const _v = new THREE.Vector3();
export const toScreen = (p) => { camera.updateMatrixWorld(); _v.copy(p).project(camera); return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H, _v.z < 1]; };
// label pinned to a 3D point, box offset (dx,dy) in pixels
export function label(txt, p, dx, dy, a, sub = '') {
  if (a <= 0.01) return; const [x, y, vis] = toScreen(p); if (!vis) return;
  const bx = x + dx, by = y + dy;
  LINES.push(`<line x1="${x}" y1="${y}" x2="${bx}" y2="${by}" stroke="rgba(255,255,255,${0.85 * a})" stroke-width="2"/><circle cx="${x}" cy="${y}" r="6" fill="none" stroke="rgba(255,207,138,${a})" stroke-width="2.5"/>`);
  UI.push(`<div class="t lab" style="left:${bx}px;top:${by}px;opacity:${a};transform:translate(${dx < 0 ? '-100%' : '0'},-50%)">${txt}${sub ? `<i>${sub}</i>` : ''}</div>`);
}
function captions(t) {
  const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
  if (!c) { CAPel.innerHTML = ''; return; }
  CAPel.innerHTML = c.words.map((w, i) => `<span class="${t >= w.t - 0.03 && (i === c.words.length - 1 || t < c.words[i + 1].t - 0.03) ? 'on' : ''}">${w.w}</span>`).join(' ');
  CAPel.style.opacity = Math.min(1, (t - c.t0) / 0.06, (c.t1 - t) / 0.06);
}

// ------------------------------------------------------------------ frame loop
let UPDATE = () => {};
export const onFrame = (fn) => { UPDATE = fn; };
export function renderAt(t) {
  UI = []; LINES = [];
  ocean.material.uniforms.time.value = t * 0.6;
  UPDATE(t);
  grade.uniforms.uT.value = t; grade.uniforms.uFade.value = Math.min(1, t / 0.8, (END + 0.6 - t) / 0.8);
  composer.render();
  UIel.innerHTML = UI.join(''); LNel.innerHTML = LINES.join(''); captions(t);
}
export async function start() {
  window.__renderAt = renderAt; window.__END = END;
  await document.fonts.ready; renderAt(0); window.__ready = true;
  if (!new URLSearchParams(location.search).has('record') && !navigator.webdriver) {
    const t0 = performance.now(); const loop = () => { renderAt(((performance.now() - t0) / 1000) % END); requestAnimationFrame(loop); }; loop();
  }
}
