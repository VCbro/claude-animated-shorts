// "कैसे चलता है?" channel cast: 6 ORIGINAL game-style 3D heroes (semi-chibi, ~4 heads tall), 2 bundles each,
// built from primitives so any video can import them: makeHero("GEARO", "B1") -> THREE.Group, then pose(h, "point", t).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type HeroName = "GEARO" | "VOLTI" | "FROSTY" | "BLAZE" | "ROBO" | "TICK";
export type Bundle = "B1" | "B2";
export type PoseName = "idle" | "wave" | "point" | "thumbs" | "think" | "hero";

type Look = { suit: number; trim: number; skin: number; hair: number; visor: number; glow: [number, number, number]; emblem: string; hat: "cap" | "hood" | "helmet" | "spikes" | "dome" | "tophat"; prop: "wrench" | "bolt" | "snow" | "flame" | "antenna" | "clock" };
export const HEROES: Record<HeroName, { hindi: string; role: string; bundles: Record<Bundle, { name: string } & Look> }> = {
  GEARO: { hindi: "गियरो", role: "मैकेनिक – मशीनें, इंजन, गियर", bundles: {
    B1: { name: "Workshop Orange", suit: 0xff7a1a, trim: 0x2b3240, skin: 0xe0a57a, hair: 0x2a1a10, visor: 0xffd23a, glow: [2.4, 1.6, 0.4], emblem: "⚙", hat: "cap", prop: "wrench" },
    B2: { name: "Gold Gear Elite", suit: 0x2b3240, trim: 0xffc94d, skin: 0xe0a57a, hair: 0x2a1a10, visor: 0xffc94d, glow: [2.6, 1.8, 0.4], emblem: "⚙", hat: "helmet", prop: "wrench" } } },
  VOLTI: { hindi: "वोल्टी", role: "बिजली – सर्किट, बैटरी, चार्जर", bundles: {
    B1: { name: "Neon Circuit", suit: 0x1e2a52, trim: 0x29e3ff, skin: 0xc98d68, hair: 0x5b2bd6, visor: 0x29e3ff, glow: [0.5, 2.4, 3.0], emblem: "⚡", hat: "spikes", prop: "bolt" },
    B2: { name: "Thunder Purple", suit: 0x4a1f8f, trim: 0xffe14d, skin: 0xc98d68, hair: 0xffffff, visor: 0xffe14d, glow: [3.0, 2.6, 0.4], emblem: "⚡", hat: "spikes", prop: "bolt" } } },
  FROSTY: { hindi: "फ्रॉस्टी", role: "ठंडक – AC, फ्रिज, कूलर", bundles: {
    B1: { name: "Arctic Tech", suit: 0xeaf4ff, trim: 0x3aa8ff, skin: 0xf0c2a0, hair: 0x9fd8ff, visor: 0x8fe3ff, glow: [0.6, 1.8, 3.0], emblem: "❄", hat: "hood", prop: "snow" },
    B2: { name: "Midnight Ice", suit: 0x0f2b4a, trim: 0xbff0ff, skin: 0xf0c2a0, hair: 0xffffff, visor: 0xbff0ff, glow: [0.9, 2.2, 3.0], emblem: "❄", hat: "hood", prop: "snow" } } },
  BLAZE: { hindi: "ब्लेज़", role: "गर्मी – प्रेस, गीज़र, इंजन की गर्मी", bundles: {
    B1: { name: "Inferno Red", suit: 0xc4221f, trim: 0xffb347, skin: 0xb9805c, hair: 0x1a0d08, visor: 0xff7a1a, glow: [3.0, 0.9, 0.2], emblem: "🔥", hat: "helmet", prop: "flame" },
    B2: { name: "Black Ember", suit: 0x1a1a1f, trim: 0xff5a1f, skin: 0xb9805c, hair: 0xff5a1f, visor: 0xff5a1f, glow: [3.0, 0.7, 0.1], emblem: "🔥", hat: "helmet", prop: "flame" } } },
  ROBO: { hindi: "रोबो", role: "साइडकिक – मज़ेदार फैक्ट्स, क्विज़", bundles: {
    B1: { name: "Classic Chrome", suit: 0xd5dbe2, trim: 0x3aa8ff, skin: 0xd5dbe2, hair: 0x3aa8ff, visor: 0x0b1530, glow: [0.6, 2.0, 3.0], emblem: "?", hat: "dome", prop: "antenna" },
    B2: { name: "Mint Bot", suit: 0x7fe0c0, trim: 0xffffff, skin: 0x7fe0c0, hair: 0xff5a8a, visor: 0x0b1530, glow: [3.0, 1.0, 1.6], emblem: "?", hat: "dome", prop: "antenna" } } },
  TICK: { hindi: "कैप्टन टिक", role: "समय – घड़ी, इतिहास, विज्ञान की कहानियाँ", bundles: {
    B1: { name: "Brass Captain", suit: 0x5a2f1a, trim: 0xd9a54a, skin: 0xe0a57a, hair: 0x8a8a8a, visor: 0xd9a54a, glow: [2.6, 1.8, 0.5], emblem: "⌚", hat: "tophat", prop: "clock" },
    B2: { name: "Royal Navy", suit: 0x14275a, trim: 0xffd27a, skin: 0xe0a57a, hair: 0x8a8a8a, visor: 0xffd27a, glow: [2.6, 1.9, 0.6], emblem: "⌚", hat: "tophat", prop: "clock" } } },
};

const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const hex = (n: number) => "#" + n.toString(16).padStart(6, "0");
const phys = (c: number, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3, ...o });
const at = (m: THREE.Object3D, x: number, y: number, z: number) => { m.position.set(x, y, z); return m; };
const glow = (c: [number, number, number]) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), toneMapped: false });

// face: big friendly eyes + brows + mouth (mouth index for expressions)
const faceTex = (L: Look, robot: boolean) => tex(512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  if (robot) { g.fillStyle = hex(L.visor); g.beginPath(); g.roundRect(70, 150, 372, 200, 90); g.fill();
    g.fillStyle = `rgb(${L.glow.map((v) => Math.min(255, v * 90)).join(",")})`; for (const x of [180, 332]) { g.beginPath(); g.ellipse(x, 240, 42, 52, 0, 0, 7); g.fill(); }
    g.strokeStyle = g.fillStyle as string; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.arc(256, 290, 50, 0.2, Math.PI - 0.2); g.stroke(); return; }
  for (const x of [182, 330]) {
    g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(x, 250, 46, 58, 0, 0, 7); g.fill();
    g.fillStyle = "#3b2416"; g.beginPath(); g.ellipse(x + 4, 258, 30, 38, 0, 0, 7); g.fill();
    g.fillStyle = "#0b0705"; g.beginPath(); g.ellipse(x + 5, 262, 17, 22, 0, 0, 7); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + 16, 242, 9, 0, 7); g.fill();
  }
  g.strokeStyle = hex(L.hair); g.lineWidth = 14; g.lineCap = "round";
  g.beginPath(); g.moveTo(140, 175); g.quadraticCurveTo(182, 158, 222, 172); g.stroke(); g.beginPath(); g.moveTo(290, 172); g.quadraticCurveTo(330, 158, 372, 175); g.stroke();
  g.strokeStyle = "#7a2f22"; g.lineWidth = 11; g.beginPath(); g.arc(256, 318, 46, 0.25, Math.PI - 0.25); g.stroke();
  g.fillStyle = "rgba(255,120,120,0.28)"; for (const x of [130, 382]) { g.beginPath(); g.ellipse(x, 318, 34, 20, 0, 0, 7); g.fill(); }
});
const emblemTex = (L: Look) => tex(256, 256, (g) => { g.fillStyle = hex(L.trim); g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); g.fillStyle = hex(L.suit); g.beginPath(); g.arc(128, 128, 98, 0, 7); g.fill();
  g.font = "bold 130px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = hex(L.trim); g.fillText(L.emblem, 128, 138); });

export type Hero = THREE.Group & { userData: { j: Record<string, THREE.Object3D>; glowMats: THREE.MeshBasicMaterial[] } };

export const makeHero = (name: HeroName, bundle: Bundle = "B1"): Hero => {
  const L = HEROES[name].bundles[bundle]; const robot = name === "ROBO";
  const g = new THREE.Group() as Hero; const j: Record<string, THREE.Object3D> = {};
  const suit = phys(L.suit), trim = phys(L.trim, { metalness: 0.3 }), skin = phys(L.skin, { roughness: 0.55, clearcoat: 0.1, sheen: 0.4 }), hair = phys(L.hair, { roughness: 0.5 }), dark = phys(0x1c2028, { roughness: 0.5 });
  const metal = robot ? phys(L.suit, { metalness: 0.8, roughness: 0.25 }) : null;
  const gm = glow(L.glow);
  // hips/torso
  const hips = new THREE.Group(); hips.position.y = 1.05; g.add(hips); j.hips = hips;
  const torso = new THREE.Group(); hips.add(torso); j.torso = torso;
  torso.add(at(new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.82, 0.5, 4, 0.18), metal ?? suit), 0, 0.42, 0));
  const belt = new THREE.Mesh(new RoundedBoxGeometry(0.82, 0.12, 0.54, 2, 0.05), dark); belt.position.y = 0.06; torso.add(belt);
  const buckle = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.1, 0.04, 2, 0.02), trim); buckle.position.set(0, 0.06, 0.28); torso.add(buckle);
  for (const x of [-0.3, 0.3]) { const p = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.14, 0.1, 2, 0.03), dark); p.position.set(x, 0.02, 0.28); torso.add(p); }
  const chest = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshPhysicalMaterial({ map: emblemTex(L), roughness: 0.3, clearcoat: 1 })); chest.position.set(0, 0.52, 0.255); torso.add(chest);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.52), gm); stripe.position.y = 0.2; torso.add(stripe);
  const pack = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.6, 0.22, 3, 0.08), trim); pack.position.set(0, 0.45, -0.34); torso.add(pack);
  const packGlow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.02), gm); packGlow.position.set(0, 0.55, -0.46); torso.add(packGlow);
  // head
  const neck = new THREE.Group(); neck.position.y = 0.86; torso.add(neck); j.head = neck;
  const head = new THREE.Mesh(robot ? new RoundedBoxGeometry(0.86, 0.72, 0.72, 5, 0.22) : new THREE.SphereGeometry(0.42, 40, 30), metal ?? skin); head.position.y = 0.4; head.scale.set(1, robot ? 1 : 1.02, 0.95); neck.add(head);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: faceTex(L, robot), transparent: true, toneMapped: true })); face.position.set(0, 0.38, robot ? 0.37 : 0.405); neck.add(face);
  if (!robot) {
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.44, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), hair); hairCap.position.y = 0.44; hairCap.rotation.x = -0.25; neck.add(hairCap);
    for (const x of [-0.42, 0.42]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), skin); ear.position.set(x, 0.38, 0); neck.add(ear); }
  }
  const hat = new THREE.Group(); hat.position.y = 0.4; neck.add(hat);
  if (L.hat === "cap") { const c = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), suit); c.position.y = 0.08; hat.add(c); const b = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.04, 0.3, 2, 0.02), suit); b.position.set(0, 0.24, 0.38); b.rotation.x = 0.15; hat.add(b);
    const gog = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.04, 8, 40), dark); gog.rotation.x = Math.PI / 2 - 0.25; gog.position.y = 0.22; hat.add(gog); for (const x of [-0.14, 0.14]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 20).rotateX(Math.PI / 2), phys(L.visor, { metalness: 0.2, roughness: 0.05, clearcoat: 1 })); l.position.set(x, 0.3, 0.38); hat.add(l); } }
  if (L.hat === "helmet") { const h = new THREE.Mesh(new THREE.SphereGeometry(0.48, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), trim); h.position.y = 0.02; hat.add(h); const v = new THREE.Mesh(new THREE.SphereGeometry(0.49, 32, 10, -0.9, 1.8, Math.PI * 0.38, 0.32), phys(L.visor, { metalness: 0.3, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.75 })); v.rotation.y = Math.PI / 2 - Math.PI / 2; hat.add(v); const fin = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.16, 0.6, 2, 0.03), gm); fin.position.y = 0.46; hat.add(fin); }
  if (L.hat === "hood") { const h = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), suit); h.position.set(0, 0.0, -0.2); h.scale.set(1, 1, 1.0); hat.add(h); const fur = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 10, 40), phys(0xffffff, { roughness: 0.9, sheen: 1 })); fur.position.set(0, -0.02, 0.18); fur.rotation.x = -0.35; hat.add(fur); }
  if (L.hat === "spikes") for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 12), hair); const a = -0.9 + k * 0.36; s.position.set(Math.sin(a) * 0.3, 0.3 + Math.cos(a) * 0.1, -0.05); s.rotation.set(-0.4, 0, -a * 0.8); hat.add(s); }
  if (L.hat === "dome") { const d = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), phys(L.hair, { roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 })); d.position.y = 0.36; hat.add(d); const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), dark); ant.position.y = 0.6; hat.add(ant); const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), gm); tip.position.y = 0.8; hat.add(tip); }
  if (L.hat === "tophat") { const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 40), suit); brim.position.y = 0.3; hat.add(brim); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.45, 40), suit); top.position.y = 0.53; hat.add(top); const band = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.08, 40), trim); band.position.y = 0.36; hat.add(band); const gear = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), trim); gear.position.set(0, 0.4, 0.32); hat.add(gear); const mono = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 24), trim); mono.position.set(0.15, 0.0, 0.42); hat.add(mono); }
  // arms (shoulder pivot -> elbow pivot -> glove)
  const arm = (side: 1 | -1) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.47, 0.72, 0); torso.add(sh); j[side > 0 ? "armR" : "armL"] = sh;
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), trim); sh.add(pad);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 6, 14), metal ?? suit); up.position.y = -0.2; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.4; sh.add(el); j[side > 0 ? "elbowR" : "elbowL"] = el;
    const lo = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 6, 14), metal ?? suit); lo.position.y = -0.16; el.add(lo);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), gm); cuff.position.y = -0.27; el.add(cuff);
    const hand = new THREE.Group(); hand.position.y = -0.38; el.add(hand); j[side > 0 ? "handR" : "handL"] = hand;
    hand.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), dark));
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 8), dark); thumb.position.set(side * -0.09, 0.02, 0.06); thumb.rotation.z = side * 0.6; hand.add(thumb); j[side > 0 ? "thumbR" : "thumbL"] = thumb;
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), dark); finger.position.set(0, -0.12, 0.04); hand.add(finger); j[side > 0 ? "fingerR" : "fingerL"] = finger;
  };
  arm(1); arm(-1);
  // legs + boots
  for (const side of [1, -1] as const) {
    const hp = new THREE.Group(); hp.position.set(side * 0.2, 0.0, 0); hips.add(hp); j[side > 0 ? "legR" : "legL"] = hp;
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 14), metal ?? dark); th.position.y = -0.25; hp.add(th);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), trim); knee.position.set(0, -0.48, 0.08); hp.add(knee);
    const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.22, 6, 14), metal ?? suit); sh.position.y = -0.68; hp.add(sh);
    const boot = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.42, 3, 0.08), trim); boot.position.set(0, -0.95, 0.06); hp.add(boot);
    const sole = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.06, 0.44, 2, 0.03), dark); sole.position.set(0, -1.04, 0.06); hp.add(sole);
  }
  // signature prop in the left hand
  const prop = new THREE.Group(); j.prop = prop; (j.handL as THREE.Group).add(prop); prop.position.set(0, -0.05, 0.1);
  if (L.prop === "wrench") { const s = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.6, 0.05, 2, 0.02), phys(0xc8ccd4, { metalness: 1, roughness: 0.25 })); s.position.y = 0.2; prop.add(s); const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 8, 16, Math.PI * 1.5), s.material); h.position.y = 0.52; prop.add(h); }
  if (L.prop === "bolt") { const sh = new THREE.Shape(); sh.moveTo(0.05, 0.3); sh.lineTo(-0.12, 0.0); sh.lineTo(0.0, 0.0); sh.lineTo(-0.06, -0.3); sh.lineTo(0.14, 0.06); sh.lineTo(0.02, 0.06); sh.closePath(); prop.add(at(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }), gm), 0, 0.25, 0)); }
  if (L.prop === "snow") for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), gm); b.position.y = 0.3; b.rotation.z = (k * Math.PI) / 3; prop.add(b); }
  if (L.prop === "flame") { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 16), gm); f.position.y = 0.28; prop.add(f); const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), gm); f2.position.y = 0.12; prop.add(f2); }
  if (L.prop === "antenna") { const s = new THREE.Mesh(new THREE.TorusKnotGeometry(0.1, 0.03, 48, 8), gm); s.position.y = 0.25; prop.add(s); }
  if (L.prop === "clock") { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32).rotateX(Math.PI / 2), trim); c.position.y = 0.22; prop.add(c); const fc = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), phys(0xfff6e0, { roughness: 0.3 })); fc.position.set(0, 0.22, 0.03); prop.add(fc); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.01), dark); hd.position.set(0, 0.26, 0.04); prop.add(hd); }
  g.userData = { j, glowMats: [gm] };
  return g;
};

// poses (radians), blended with a breathing idle; t = seconds for life (blink-free: eyes are painted)
const P: Record<PoseName, Record<string, [number, number, number]>> = {
  idle: { armR: [0, 0, 0.18], armL: [0, 0, -0.18], elbowR: [-0.15, 0, 0], elbowL: [-0.15, 0, 0] },
  wave: { armR: [0, 0, 2.6], elbowR: [0, 0, 0.5], armL: [0, 0, -0.2], elbowL: [-0.2, 0, 0] },
  point: { armR: [-1.45, 0.25, 0.25], elbowR: [-0.1, 0, 0], armL: [0, 0, -0.2], elbowL: [-0.3, 0, 0] },
  thumbs: { armR: [-1.0, 0, 0.35], elbowR: [-1.4, 0, 0], armL: [0, 0, -0.2], elbowL: [-0.2, 0, 0] },
  think: { armR: [-0.6, 0, 0.3], elbowR: [-2.2, 0, 0], armL: [-0.4, 0, -0.5], elbowL: [-1.2, 0, 0], head: [0.1, 0, 0.18] },
  hero: { armR: [0, 0, 0.5], elbowR: [-1.9, 0, 0.6], armL: [0, 0, -0.5], elbowL: [-1.9, 0, -0.6], legR: [0, 0, 0.12], legL: [0, 0, -0.12], torso: [-0.06, 0, 0] },
};
export const pose = (h: Hero, name: PoseName, t: number, mix = 1) => {
  const { j } = h.userData; const target = P[name], base = P.idle;
  for (const k of ["armR", "armL", "elbowR", "elbowL", "head", "torso", "legR", "legL"]) {
    const a = base[k] ?? [0, 0, 0], b = target[k] ?? a; const o = j[k]; if (!o) continue;
    o.rotation.set(a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix, a[2] + (b[2] - a[2]) * mix);
  }
  if (name === "wave") j.elbowR.rotation.z += Math.sin(t * 8) * 0.35 * mix;
  if (name === "thumbs") { j.thumbR.rotation.z = -2.2 * mix; j.thumbR.position.y = 0.1 * mix; }
  j.torso.position.y = Math.sin(t * 2.2) * 0.012; j.head.rotation.z += Math.sin(t * 1.3) * 0.04; j.head.rotation.x += Math.sin(t * 1.7) * 0.03;
  j.prop.rotation.y = t * 1.5;
  h.userData.glowMats.forEach((m) => m.color.multiplyScalar(1));
};
