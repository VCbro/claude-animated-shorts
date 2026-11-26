// The Patiala necklace in 3D (Cartier, 1928): five platinum strands of diamonds, a collar, drops, and the big yellow centre stone.
// necklace3D(THREE, { empty }) -> { group, stone, sockets, setSparkle(t) }   empty=true: the 1998 skeleton (big stones missing)
export function necklace3D(THREE, { envMap = null, empty = false, scale = 1 } = {}) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const g = new THREE.Group(); g.scale.setScalar(scale);
  const plat = new THREE.MeshStandardMaterial({ color: 0xe6ecf2, metalness: 1, roughness: 0.25, envMap, envMapIntensity: 0.5 });
  const dia = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 0, envMap, envMapIntensity: 1.6, emissive: 0x9fb8ff, emissiveIntensity: 0.15, clearcoat: 1 });
  const yel = new THREE.MeshPhysicalMaterial({ color: 0xffc21a, metalness: 0, roughness: 0.04, envMap, envMapIntensity: 1.3, emissive: 0xff9a00, emissiveIntensity: 0.45, clearcoat: 1 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0xc0102a, roughness: 0.08, envMap, envMapIntensity: 1, emissive: 0x500010, emissiveIntensity: 0.4 });
  const gem = new THREE.OctahedronGeometry(1, 0); gem.scale(1, 0.7, 1);
  const N_STR = 5, PER = 46, pos = [];
  for (let s = 0; s < N_STR; s++) {
    const sag = 0.12 + s * 0.055, wid = 0.13 + s * 0.012;
    const curve = new THREE.CatmullRomCurve3([V(-wid, 0.02 * s, 0), V(-wid * 0.8, -sag * 0.55, 0.02), V(0, -sag, 0.03), V(wid * 0.8, -sag * 0.55, 0.02), V(wid, 0.02 * s, 0)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.0012, 5, false), plat));
    for (let i = 0; i < PER; i++) pos.push({ p: curve.getPointAt(i / (PER - 1)), r: 0.0042 - s * 0.0003 });
  }
  // collar of bigger stones
  const collar = new THREE.CatmullRomCurve3([V(-0.1, 0.03, 0), V(0, -0.045, 0.02), V(0.1, 0.03, 0)]);
  for (let i = 0; i < 20; i++) pos.push({ p: collar.getPointAt(i / 19), r: 0.0075, big: true });
  const dM = new THREE.InstancedMesh(gem, dia, pos.length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
  pos.forEach((d, i) => { q.setFromEuler(new THREE.Euler(i * 0.7, i * 1.3, 0)); m.compose(d.p, q, V(d.r, d.r, d.r)); dM.setMatrixAt(i, m); });
  dM.frustumCulled = false; g.add(dM);
  // drops and the centre
  const sockets = [];
  for (const [x, y, r] of [[-0.05, -0.08, 0.012], [0.05, -0.08, 0.012], [0, -0.18, 0.01], [-0.03, -0.25, 0.009], [0.03, -0.25, 0.009]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.15, r * 0.16, 8, 24), plat); ring.position.set(x, y, 0.035); g.add(ring);
    const st = new THREE.Mesh(gem, ruby); st.scale.setScalar(r); st.position.set(x, y, 0.035); st.visible = !empty; g.add(st); sockets.push({ ring, st });
  }
  const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.004, 10, 40), plat); cRing.position.set(0, -0.34, 0.04); g.add(cRing);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.01, 6), plat); p.position.set(Math.cos(a) * 0.033, -0.34 + Math.sin(a) * 0.033, 0.046); p.rotation.x = Math.PI / 2; g.add(p); }
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), yel); stone.scale.set(0.03, 0.034, 0.02); stone.position.set(0, -0.34, 0.045); stone.visible = !empty; g.add(stone);
  for (const s of [-1, 1]) { const ch = new THREE.CatmullRomCurve3([V(s * 0.012, -0.29, 0.04), V(s * 0.02, -0.31, 0.042), V(s * 0.028, -0.32, 0.043)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(ch, 10, 0.0015, 5, false), plat)); }
  const setSparkle = (t) => { dia.emissiveIntensity = 0.12 + 0.08 * Math.sin(t * 7); yel.emissiveIntensity = 0.4 + 0.15 * Math.sin(t * 3.1); };
  return { group: g, stone, sockets, dM, setSparkle, mats: { plat, dia, yel, ruby } };
}
