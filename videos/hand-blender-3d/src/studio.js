import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const FLOOR_Y = -32;

export function buildStudio(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environmentIntensity = 0.55;
  scene.background = new THREE.Color(0x030406);
  scene.fog = new THREE.FogExp2(0x040509, 0.0055);

  const g = new THREE.Group();
  scene.add(g);

  // Gradient dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(0x0b111b) }, uBot: { value: new THREE.Color(0x010203) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 uTop; uniform vec3 uBot; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(uBot, uTop, smoothstep(-0.1, 0.5, h)), 1.0); }',
  }));
  g.add(dome);

  // Floor: dark satin with contact shadows
  const floor = new THREE.Mesh(new THREE.CircleGeometry(260, 96), new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.6, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true;
  g.add(floor);

  // Glowing futuristic floor rings + grid
  const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending });
  const rings = [];
  [[11, 11.15, 0x2fb8ff, 0.9], [14, 14.06, 0x2fb8ff, 0.35], [22, 22.05, 0x2fb8ff, 0.18]].forEach(([a, b, c, o]) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 160), ringMat(c, o));
    r.rotation.x = -Math.PI / 2; r.position.y = FLOOR_Y + 0.02; g.add(r); rings.push(r);
  });
  const grid = new THREE.GridHelper(240, 60, 0x1a2a3a, 0x0f1822);
  grid.position.y = FLOOR_Y + 0.01; grid.material.transparent = true; grid.material.opacity = 0.35; grid.material.depthWrite = false;
  g.add(grid);

  // Background light bars (out of focus = bokeh-like studio panels)
  const bars = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 70), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x2a6c9a : 0x1a2a3c, transparent: true, opacity: 0.55, fog: false }));
    bar.position.set(Math.sin(a) * 140, 10, Math.cos(a) * 140); bar.lookAt(0, 10, 0);
    bars.add(bar);
  }
  g.add(bars);

  // Lights
  const hemi = new THREE.HemisphereLight(0x9fb8d8, 0x080606, 0.35);
  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(28, 48, 34); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -40, right: 40, top: 45, bottom: -45, near: 1, far: 160 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
  const rimBlue = new THREE.SpotLight(0x5fb8ff, 2.2, 0, 0.5, 0.6, 0); rimBlue.position.set(-42, 26, -34);
  const rimWarm = new THREE.SpotLight(0xffa25a, 1.1, 0, 0.5, 0.6, 0); rimWarm.position.set(44, 8, -36);
  const top = new THREE.SpotLight(0xffffff, 1.4, 0, 0.22, 0.9, 0); top.position.set(0, 80, 6);
  [rimBlue, rimWarm, top].forEach((l) => { l.target.position.set(0, 0, 0); scene.add(l.target); });
  g.add(hemi, key, rimBlue, rimWarm, top);
  // Small practical light that travels with the camera (used inside the shaft)
  const camLight = new THREE.PointLight(0xfff4e6, 0, 14, 2);
  scene.add(camLight);

  return { group: g, key, rimBlue, rimWarm, top, hemi, camLight, rings, floor };
}
