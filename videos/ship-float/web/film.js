// 45,000 tonnes of iron floats: Archimedes in a vertical cinematic Short. Pure function of time.
import { THREE, scene, camera, setSky, sunFollow, shot, onFrame, start, text, label, win, R, eio, lerp, clamp, rnd, K, bloom, W, H, ocean, grade, renderer } from './engine3d.js';
const A = (n) => K[n];
setSky({ elevation: 5, azimuth: 250, turbidity: 6, rayleigh: 2.6, mie: 0.005, exposure: 0.5, water: 0x06283a, sunCol: '#ffc58a', sunInt: 3.4 });
// ------------------------------------------------------------------ materials
const hullPaint = new THREE.MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.62, metalness: 0.35, vertexColors: true });
const deckMat = (() => {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#3a3e43'; g.fillRect(0, 0, 2048, 512);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? 255 : 0},${rnd(i) > 0.5 ? 255 : 0},${rnd(i) > 0.5 ? 255 : 0},${0.03 * rnd(i + 3)})`; g.fillRect(rnd(i + 1) * 2048, rnd(i + 2) * 512, 30 * rnd(i + 5), 6); }
  g.strokeStyle = '#e9e4d2'; g.lineWidth = 5; g.setLineDash([40, 30]);
  g.beginPath(); g.moveTo(60, 300); g.lineTo(1990, 230); g.stroke();                       // take-off line to the ski-jump
  g.setLineDash([]); g.lineWidth = 4; g.strokeStyle = '#f2c94c';
  g.beginPath(); g.moveTo(200, 120); g.lineTo(1300, 330); g.stroke();                      // angled landing line
  g.strokeStyle = '#e9e4d2'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(80 + i * 34, 80); g.lineTo(80 + i * 34, 430); g.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.1 });
})();
const islandMat = new THREE.MeshStandardMaterial({ color: '#8a9199', roughness: 0.55, metalness: 0.3 });
const darkMat = new THREE.MeshStandardMaterial({ color: '#1d2126', roughness: 0.4, metalness: 0.5 });
const glassMat = new THREE.MeshStandardMaterial({ color: '#0d1620', roughness: 0.08, metalness: 0.9 });

// ------------------------------------------------------------------ carrier (x: stern -> bow, y up, z port(+)/starboard(-))
const ship = new THREE.Group(); scene.add(ship);
const LEN = 262, BEAM = 34, DECK_Y = 18;
{ // hull: side profile extruded across the beam, then tapered towards the bow and keel
  const s = new THREE.Shape(); s.moveTo(0, -8); s.lineTo(220, -8); s.quadraticCurveTo(250, -8, 262, 10); s.lineTo(266, DECK_Y); s.lineTo(-2, DECK_Y); s.lineTo(0, -8);
  const g = new THREE.ExtrudeGeometry(s, { depth: BEAM, steps: 1, bevelEnabled: false, curveSegments: 24 }); g.translate(0, 0, -BEAM / 2);
  const p = g.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i); let z = p.getZ(i);
    const bow = clamp((x - 170) / 96), keel = clamp((DECK_Y - y) / (DECK_Y + 8));
    z *= (1 - 0.92 * Math.pow(bow, 1.6)) * (1 - 0.35 * keel * keel);
    p.setZ(i, z);
    const red = y < 0.6 ? 1 : 0; col.push(red ? 0.42 : 1, red ? 0.12 : 1, red ? 0.1 : 1);        // anti-fouling red below the waterline
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const hull = new THREE.Mesh(g, hullPaint); hull.castShadow = hull.receiveShadow = true; ship.add(hull);
}
{ // flight deck: wider than the hull (overhang), ski-jump curve at the bow
  const s = new THREE.Shape(); s.moveTo(-4, -18); s.lineTo(200, -20); s.lineTo(266, -6); s.lineTo(268, 6); s.lineTo(196, 22); s.lineTo(150, 30); s.lineTo(40, 30); s.lineTo(-4, 20); s.lineTo(-4, -18);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false, steps: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, DECK_Y, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); const k = clamp((x - 215) / 53); p.setY(i, p.getY(i) + 9 * k * k); }   // ski-jump (~12-14°)
  g.computeVertexNormals();
  // UVs: top-down mapping of the deck texture
  const uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 4) / 272, (p.getZ(i) + 30) / 60);
  const deck = new THREE.Mesh(g, [deckMat, islandMat]); deck.castShadow = deck.receiveShadow = true; ship.add(deck);
}
const box = (w, h, d, x, y, z, m = islandMat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; ship.add(b); return b; };
{ // island (starboard side), bridge windows, mast, radar
  box(30, 14, 9, 158, DECK_Y + 8.5, -16); box(22, 8, 8, 160, DECK_Y + 19, -16); box(14, 5, 7.4, 161, DECK_Y + 25.5, -16);
  box(22.4, 1.6, 8.6, 160, DECK_Y + 21.5, -16, glassMat); box(14.4, 1.4, 7.8, 161, DECK_Y + 26.5, -16, glassMat);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 22, 12), islandMat); mast.position.set(161, DECK_Y + 39, -16); mast.castShadow = true; ship.add(mast);
  box(10, 0.6, 0.6, 161, DECK_Y + 44, -16, darkMat); box(0.6, 0.6, 7, 161, DECK_Y + 40, -16, darkMat);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 16), new THREE.MeshStandardMaterial({ color: '#d9dde1', roughness: 0.4 })); dome.position.set(161, DECK_Y + 51, -16); ship.add(dome);
  box(8, 9, 7, 176, DECK_Y + 7, -17); // aft block
}
// parked jets (simple swept-wing silhouettes)
function jetGeo() {
  const s = new THREE.Shape(); s.moveTo(8, 0); s.lineTo(2, 0.9); s.lineTo(-1, 6); s.lineTo(-3.4, 6); s.lineTo(-2.4, 1.1); s.lineTo(-6, 1.0); s.lineTo(-7.4, 3.2); s.lineTo(-8.4, 3.2);
  s.lineTo(-8, 0); s.lineTo(-8.4, -3.2); s.lineTo(-7.4, -3.2); s.lineTo(-6, -1.0); s.lineTo(-2.4, -1.1); s.lineTo(-3.4, -6); s.lineTo(-1, -6); s.lineTo(2, -0.9); s.lineTo(8, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.3, bevelSegments: 2 }); g.rotateX(-Math.PI / 2);
  const body = new THREE.CylinderGeometry(0.9, 0.7, 15, 12); body.rotateZ(Math.PI / 2); body.translate(0, 0.6, 0);
  const fin = new THREE.BoxGeometry(2.6, 3.2, 0.3); fin.translate(-6, 2.2, 0);
  return [g, body, fin];
}
const jetMat = new THREE.MeshStandardMaterial({ color: '#9aa3ab', roughness: 0.45, metalness: 0.5 });
function makeJet() { const j = new THREE.Group(); for (const g of jetGeo()) { const m = new THREE.Mesh(g, jetMat); m.castShadow = true; j.add(m); } return j; }
for (let i = 0; i < 7; i++) { const j = makeJet(); j.position.set(40 + i * 15, DECK_Y + 1.9, 21 - (i % 2) * 3); j.rotation.y = -2.2; ship.add(j); }
const hero = makeJet(); ship.add(hero);
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 6, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffb066', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
flame.rotation.z = Math.PI / 2; flame.position.set(-10.5, 0.6, 0); hero.add(flame);
// wake: foam particles behind and beside the hull
const NW = 900, wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NW * 3), 3));
const wake = new THREE.Points(wg, new THREE.PointsMaterial({ color: '#e8f2f6', size: 2.2, transparent: true, opacity: 0.55, depthWrite: false })); scene.add(wake);

// ------------------------------------------------------------------ extra objects
const hullMesh = ship.children[0];
{ // explainer exaggeration: a deeper underwater hull (real draft ~8 m) so the displaced water reads on a phone
  const p = hullMesh.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) * 3.6);
  p.needsUpdate = true; hullMesh.geometry.computeVertexNormals(); }
const clipBelow = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);                 // keeps y < 0
// displaced water: the submerged part of the hull, glowing cyan
const dispMat = new THREE.MeshBasicMaterial({ color: '#39d7ff', transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [clipBelow], side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
const disp = new THREE.Mesh(hullMesh.geometry, dispMat); disp.scale.set(1.01, 1.01, 1.04); ship.add(disp);
// x-ray hull, air inside, flood water
const xrayMat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'varying vec3 n; varying vec3 vd; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); vd = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform float uA; varying vec3 n; varying vec3 vd; void main(){ float f = pow(1.-abs(dot(normalize(n),normalize(vd))),1.6); gl_FragColor = vec4(vec3(.85,.95,1.)*(.4+1.2*f), (.05+.75*f)*uA); }' });
const xhull = new THREE.Mesh(hullMesh.geometry, xrayMat); xhull.renderOrder = 6; ship.add(xhull);
const inner = hullMesh.geometry.clone(); inner.computeBoundingBox();
const air = new THREE.Mesh(inner, new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
air.scale.set(0.97, 0.9, 0.86); air.position.set(4, 0.6, 0); ship.add(air);
const floodPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -100);
const flood = new THREE.Mesh(inner, new THREE.MeshBasicMaterial({ color: '#1f8fd0', transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [floodPlane] }));
flood.scale.copy(air.scale); flood.position.copy(air.position); flood.renderOrder = 7; ship.add(flood);
// upward push arrows under the hull
const arrows = new THREE.Group(); ship.add(arrows);
const arrowMat = new THREE.MeshBasicMaterial({ color: '#7fe8ff', transparent: true, opacity: 0, depthWrite: false });
for (let i = 0; i < 7; i++) { const a = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 14, 12), arrowMat); sh.position.y = -7; const hd = new THREE.Mesh(new THREE.ConeGeometry(4, 7, 16), arrowMat); hd.position.y = 3.5; a.add(sh, hd); a.position.set(30 + i * 32, -50, 0); arrows.add(a); }
// the nail (scaled up, there is nothing to compare it with underwater): far from the ship
const NX = -3000;
const nail = new THREE.Group(); scene.add(nail);
const steel = new THREE.MeshStandardMaterial({ color: '#8d9399', metalness: 1, roughness: 0.35 });
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7, 24), steel); nail.add(shaft);
const headN = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 32), steel); headN.position.y = 3.6; nail.add(headN);
const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 24), steel); tip.rotation.x = Math.PI; tip.position.y = -4; nail.add(tip);
nail.rotation.z = 0.35;
const nailDisp = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), new THREE.MeshBasicMaterial({ color: '#39d7ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(nailDisp);
// particles: splash, bubbles, flood spray
const NP = 600, pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
pg.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(NP), 1)); pg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(NP), 1));
const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: { uScale: { value: H / 2 / Math.tan(THREE.MathUtils.degToRad(20)) } }, transparent: true, depthWrite: false,
  vertexShader: 'attribute float aS, aA; varying float va; uniform float uScale; void main(){ va = aA; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = min(300., aS*uScale/-mv.z); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'varying float va; void main(){ vec2 q = gl_PointCoord*2.-1.; float r = dot(q,q); if (r>1.) discard; float ring = smoothstep(.55,.95,r)*.9 + .25; gl_FragColor = vec4(vec3(.9,.97,1.), ring*va); }' }));
pts.frustumCulled = false; pts.renderOrder = 9; scene.add(pts);

// ------------------------------------------------------------------ timeline
const tNail = A('nail'), tShip = A('ship'), tWhy = A('why'), tPush = A('push'), tUp = A('up'), tEq = A('equal'), tFl = A('floats'), tSol = A('solid'), tHol = A('hollow'), tHole = A('hole'), tSink = A('sink'), tSame = A('same'), END = K.END;
const SPLIT = (t) => (t < tShip) || (t >= tPush && t < tFl + 0.6) || (t >= tSol);
const nailY = (t) => { const tt = t < tShip ? t : t - tSol + 1.4;                     // falls, hits the water at 0.5 s, sinks slowly
  return tt < 0.5 ? 9 - 30 * tt * tt * 1.2 : 0.0 - 2.2 * (tt - 0.5) - 0.6 * (tt - 0.5) ** 2; };
const _v = new THREE.Vector3();
function waterline() {                     // screen uv-y of the water surface straight ahead of the camera
  const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; d.normalize();
  _v.copy(camera.position).addScaledVector(d, 2000); _v.y = 0; camera.updateMatrixWorld(); _v.project(camera); return _v.y * 0.5 + 0.5;
}
const big = (html, y, a, size = 120, col = '#fff') => text(`<span style="font-family:B;font-weight:800;color:${col};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45)">${html}</span>`, W / 2, y, { size, a, cls: '' });
const chip = (html, y, a) => text(`<span style="font-family:B;font-weight:800;padding:12px 30px 8px;border-radius:22px;background:rgba(4,14,22,.82);box-shadow:0 0 0 3px rgba(127,232,255,.45)">${html}</span>`, W / 2, y, { size: 52, a, cls: '' });
const fmt = (n) => Math.round(n).toLocaleString('en-IN');

onFrame((t) => {
  const split = SPLIT(t);
  ocean.visible = !split;
  grade.uniforms.uUnder.value = split && !new URLSearchParams(location.search).has('raw') ? 1 : 0;
  // ship: anchored, gentle bob; sinks at the end (stern first)
  const sk = clamp((t - tSink + 0.4) / 2.2);
  ship.position.set(0, 0.4 * Math.sin(t * 0.9) - 34 * eio(sk) + 1.5 * R(t, tUp + 0.5, 1.5) * (1 - R(t, tEq, 1)), 0);
  ship.rotation.set(0.006 * Math.sin(t * 0.7), 0, -0.10 * eio(sk));
  sunFollow(new THREE.Vector3(133, 0, 0));
  // displaced water + arrows + x-ray + air + flood
  dispMat.opacity = 0.9 * win(t, tPush + 0.6, tFl + 0.4, 0.5) * (0.85 + 0.15 * Math.sin(t * 6));
  arrowMat.opacity = 0.85 * win(t, tUp + 0.2, tEq + 0.4, 0.4);
  arrows.children.forEach((a, i) => { a.position.y = -50 + 7 * ((t * 1.4 + i * 0.37) % 1); });
  const xr = win(t, tHol, END + 1, 0.5);
  xrayMat.uniforms.uA.value = xr; hullMesh.visible = xr < 0.6;
  air.material.opacity = 0.22 * win(t, tHol + 0.3, tHole + 1.2, 0.4);
  const lvl = lerp(-9, 16, eio((t - tHole - 0.4) / 2.6)); floodPlane.constant = lvl + ship.position.y;
  flood.material.opacity = t > tHole ? 0.7 : 0;
  grade.uniforms.uAlarm.value = t > tHole && t < tSame ? 0.22 * (0.5 + 0.5 * Math.sin(t * 9)) : 0;
  grade.uniforms.uFlash.value = 0.6 * Math.max(0, 1 - Math.abs(t - tWhy) / 0.12) + 0.35 * Math.max(0, 1 - Math.abs(t - 0.5) / 0.1);
  // nail
  const nailOn = t < tShip || (t >= tSol && t < tHol) || t >= tSame;
  nail.visible = nailOn;
  const ny = t >= tSame ? 9 - 0 : nailY(t); nail.position.set(NX, ny, 0); nail.rotation.z = 0.35 + 0.15 * Math.sin(t * 2);
  nailDisp.material.opacity = (t >= tSol + 0.8 && t < tHol) ? 0.6 * R(t, tSol + 0.8, 0.4) : 0; nailDisp.position.set(NX + 4, ny, 0); nailDisp.scale.setScalar(1.6);
  // particles
  const pos = pg.attributes.position.array, sz = pg.attributes.aS.array, al = pg.attributes.aA.array;
  for (let i = 0; i < NP; i++) {
    let x = 0, y = -999, z = 0, s = 0, a = 0;
    if (i < 160) { const e = t - 0.5;                              // splash crown + droplets when the nail hits
      if (e > 0 && e < 1.6 && t < tShip) { const ang = rnd(i) * 6.283, v = 3 + 6 * rnd(i + 1), up = 6 + 10 * rnd(i + 2);
        x = NX + Math.cos(ang) * v * e; z = Math.sin(ang) * v * e * 0.6; y = up * e - 14 * e * e; s = 0.2 + 0.5 * rnd(i + 3); a = y > -0.2 ? 0.9 * (1 - e / 1.6) : 0; } }
    else if (i < 360) { const life = ((t * 0.6 + rnd(i)) % 1);        // bubbles from the nail / the sinking ship
      if (nailOn && (t < tShip || t >= tSol) && t < tSame) { x = NX + (rnd(i + 4) - 0.5) * 2; y = ny + life * 10; z = (rnd(i + 5) - 0.5) * 2; s = 0.15 + 0.3 * rnd(i + 6); a = y < 0 ? 0.6 * (1 - life) : 0; }
      else if (t > tSink) { x = 40 + 200 * rnd(i + 7); y = -30 + life * 30; z = (rnd(i + 8) - 0.5) * 30; s = 0.8 + 2 * rnd(i + 9); a = y < 0 ? 0.5 * (1 - life) : 0; } }
    else { const life = ((t * 1.5 + rnd(i)) % 1);                    // water jet through the hole, into the hull
      if (t > tHole && t < tSink + 1) { x = 90 + (rnd(i + 10) - 0.5) * 4 * life; y = -2 + ship.position.y + (rnd(i + 11) - 0.5) * 3 * life; z = 17 - life * 14; s = 0.4 + 1.6 * life; a = 0.7 * (1 - life); } }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; sz[i] = s; al[i] = a;
  }
  pg.attributes.position.needsUpdate = pg.attributes.aS.needsUpdate = pg.attributes.aA.needsUpdate = true;

  // shots
  if (t < tShip || t >= tSame) shot(t, [[0, [NX - 6, 0.3, 30], [NX, -0.5, 0], 42], [tShip, [NX - 4, 0.25, 26], [NX, -2.5, 0], 42], [tSame, [NX - 6, 0.3, 30], [NX, -0.5, 0], 42]], 0.05);
  else if (t < tWhy) shot(t, [[tShip, [380, 6, 230], [150, 18, 0], 34], [tWhy, [350, 30, 260], [140, 22, 0], 36]], 0.12);
  else if (t < tPush) shot(t, [[tWhy, [350, 30, 260], [140, 22, 0], 36]], 0.1);
  else if (t < tFl + 0.6) shot(t, [[tPush, [150, 1, 300], [140, -22, 0], 40], [tEq, [150, 1, 280], [140, -22, 0], 40], [tFl + 0.6, [150, 1, 270], [140, -20, 0], 40]], 0.05);
  else if (t < tSol) shot(t, [[tFl + 0.6, [340, 22, 250], [150, 16, 0], 34], [tSol, [330, 26, 240], [150, 16, 0], 34]], 0.1);
  else if (t < tHol) shot(t, [[tSol, [NX - 5, 0.3, 30], [NX + 1, -6, 0], 44], [tHol, [NX - 4, 0.3, 26], [NX + 1, -12, 0], 44]], 0.05);
  else if (t < tHole) shot(t, [[tHol, [150, 1, 280], [140, -16, 0], 40], [tHole, [140, 1, 270], [130, -18, 0], 40]], 0.06);
  else shot(t, [[tHole, [140, 1, 270], [130, -18, 0], 40], [tSame, [140, 1, 300], [120, -30, 0], 42]], 0.06);
  grade.uniforms.uWL.value = split ? waterline() : -1;

  // overlays
  big('लोहे की कील', 300, win(t, 0.0, tShip - 0.2, 0.15), 110);
  big('डूब गई ↓', 440, win(t, 1.0, tShip - 0.2, 0.2), 90, '#ff6b57');
  big('45,000 टन', 300, win(t, tShip + 0.3, tWhy, 0.3), 140, '#ffcf6b');
  big('लोहा… फिर भी तैरता!', 450, win(t, tShip + 0.9, tWhy, 0.3), 78);
  big('क्यों?', H * 0.42, win(t, tWhy - 0.05, tPush + 0.2, 0.1), 220, '#ffcf6b');
  chip('हटाया गया पानी', 300, win(t, tPush + 1.0, tUp + 0.2, 0.3));
  chip('<span style="color:#7fe8ff">↑</span> पानी का धक्का <span style="color:#7fe8ff">↑</span>', 300, win(t, tUp + 0.4, tEq, 0.3));
  // balance: ship weight vs displaced water
  const bq = win(t, tEq, tFl + 0.4, 0.4), n = 45000 * eio((t - tEq - 0.4) / 3.0), tilt = 14 * (1 - eio((t - tEq - 0.4) / 3.0));
  text(`<svg style="position:static;width:900px;height:420px" width="900" height="420" viewBox="0 0 900 420"><g transform="rotate(${-tilt} 450 120)"><line x1="90" y1="120" x2="810" y2="120" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <rect x="40" y="130" width="220" height="120" rx="16" fill="rgba(4,14,22,.85)" stroke="#ffcf6b" stroke-width="4"/><rect x="640" y="130" width="220" height="120" rx="16" fill="rgba(4,14,22,.85)" stroke="#7fe8ff" stroke-width="4"/></g>
    <polygon points="450,120 400,400 500,400" fill="rgba(255,255,255,.85)"/></svg>`, W / 2, 360, { size: 10, a: bq, cls: '' });
  text(`<span style="font-family:B;font-weight:800;color:#ffcf6b">जहाज़<br>45,000 टन</span>`, W / 2 - 300, 340 + Math.sin(-tilt * Math.PI / 180) * 360 * 0 + tilt * 6.5, { size: 40, a: bq, cls: '' });
  text(`<span style="font-family:B;font-weight:800;color:#7fe8ff">हटाया पानी<br>${fmt(n)} टन</span>`, W / 2 + 300, 340 - tilt * 6.5, { size: 40, a: bq, cls: '' });
  chip('<span style="color:#7cf09a">✓</span> बराबर = तैरता है', 640, win(t, tFl - 0.4, tSol, 0.3));
  big('ठोस कील', 300, win(t, tSol + 0.2, tHol, 0.3), 110);
  chip('हटाया पानी: <span style="color:#ff6b57">बहुत कम</span>', 450, win(t, tSol + 1.2, tHol, 0.3));
  big('अंदर से खोखला', 300, win(t, tHol + 0.3, tHole, 0.3), 100);
  label('हवा', new THREE.Vector3(150, 8 + ship.position.y, 0), 160, -200, win(t, tHol + 0.8, tHole, 0.3), 'जहाज़ का ज़्यादातर हिस्सा');
  big('छेद हुआ तो…', 300, win(t, tHole + 0.2, tSame, 0.3), 110, '#ff6b57');
  big('लोहे की कील', 300, R(t, tSame + 0.4, 0.3), 110);
});
start();
