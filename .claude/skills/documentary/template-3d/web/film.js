// Example 3D realistic film: an aircraft carrier (generic, INS Vikrant-like proportions, 262 m) at sea at sunset.
// Shots: low hero dolly -> aerial reveal with labels -> jet launch off the ski-jump. Replace the model and the shot
// list for a new subject; keep the engine. Times come from anchors (A('name')) when the film has a voice.
import { THREE, scene, camera, setSky, sunFollow, shot, onFrame, start, text, label, win, R, eio, lerp, clamp, rnd, K, bloom } from './engine3d.js';

const has = (n) => n in K;
const at = (n, d) => (has(n) ? K[n] : d);          // anchor time, or a default for the demo

setSky({ elevation: 4.5, azimuth: 70, turbidity: 5, rayleigh: 3.0, mie: 0.004, exposure: 0.48, water: 0x052433, sunCol: '#ffbf80', sunInt: 3.6 });

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

// ------------------------------------------------------------------ timeline
const SPEED = 10;                                    // ship speed, m/s (~20 knots)
const tA = 0, tB = at('h_this', 4.2), tC = at('c3_go', 8.4);
onFrame((t) => {
  const sx = SPEED * t; ship.position.set(sx, 0, 0);
  ship.rotation.z = 0.004 * Math.sin(t * 0.7); ship.rotation.x = 0.006 * Math.sin(t * 0.5 + 1);
  // wake particles (deterministic)
  const wp = wg.attributes.position.array;
  for (let i = 0; i < NW; i++) { const age = (rnd(i) * 40 + t) % 40, side = rnd(i + 7) > 0.5 ? 1 : -1;
    wp[i * 3] = sx - age * SPEED + 30 * rnd(i + 3); wp[i * 3 + 1] = 0.3; wp[i * 3 + 2] = side * (BEAM / 2 + age * 1.1 * rnd(i + 5)) + (rnd(i + 9) - 0.5) * 3; }
  wg.attributes.position.needsUpdate = true;
  // hero jet: holds at the start line with afterburner, then runs to the ski-jump and climbs away
  const run = clamp((t - tC - 0.3) / 2.4), xr = 60 + 205 * run * run;
  const k = clamp((xr - 215) / 53), climb = Math.max(0, xr - 266);
  hero.position.set(xr + climb * 1.4, DECK_Y + 1.9 + 9 * k * k + climb * 0.55, 0);
  hero.rotation.set(0, 0, 0.24 * k + (climb > 0 ? 0.22 : 0));
  flame.scale.set(1, 0.6 + 0.6 * R(t, tC, 0.6) + 0.15 * Math.sin(t * 40), 1); flame.material.opacity = 0.5 + 0.4 * R(t, tC, 0.5);
  sunFollow(new THREE.Vector3(sx + 130, 0, 0));
  bloom.strength = 0.35 + 0.25 * R(t, tC, 0.5);

  // shots (world positions follow the ship)
  if (t < tB) shot(t, [[tA, [sx + 330, 7, 120], [sx + 150, 22, 0], 32], [tB, [sx + 300, 5, 95], [sx + 140, 24, 0], 30]], 0.12);
  else if (t < tC) shot(t, [[tB, [sx - 120, 160, 230], [sx + 120, 10, 0], 34], [tC, [sx - 60, 120, 260], [sx + 140, 10, 0], 32]], 0.05);
  else shot(t, [[tC, [sx + 255, 52, 110], [sx + 200, 24, 0], 32], [tC + 3.6, [sx + 300, 58, 120], [sx + 290, 40, 0], 34]], 0.1);   // side view of the bow: the jet runs up the ski-jump

  // titles + labels (screen text is DOM, so Hindi shapes correctly)
  text('<div class="kick">Bharatiya Nausena · R11</div>', 960, 330, { size: 28, a: win(t, 0.6, tB - 0.2, 0.5), cls: '' });
  text('INS विक्रांत', 960, 420, { size: 120, a: win(t, 0.8, tB - 0.2, 0.6) });
  const P = (x, y, z) => new THREE.Vector3(sx + x, y, z);
  label('स्की-जंप', P(258, DECK_Y + 9, 0), 120, -120, win(t, tB + 0.6, tC - 0.2, 0.3), 'उड़ान के लिए मुड़ा रनवे');
  label('आइलैंड', P(161, DECK_Y + 30, -16), -150, -110, win(t, tB + 1.2, tC - 0.2, 0.3), 'जहाज़ का कंट्रोल');
  label('262 मीटर', P(60, DECK_Y + 2, 22), -140, 90, win(t, tB + 1.8, tC - 0.2, 0.3), 'फ्लाइट डेक');
});
start();
