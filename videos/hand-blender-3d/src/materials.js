import * as THREE from 'three';

// Procedural textures (no external image files needed)

function canvasTexture(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Fine horizontal streaks = brushed stainless steel roughness
function brushedRoughness() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#6a6a6a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * h;
      const v = 80 + Math.random() * 70;
      g.strokeStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.35})`;
      g.lineWidth = Math.random() * 1.4;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 2); g.stroke();
    }
  }, { repeat: [1, 4], srgb: false });
}

// Tight copper wire turns for windings (colour + bump)
function windingTextures() {
  const draw = (bump) => (g, w, h) => {
    for (let y = 0; y < h; y += 4) {
      const grad = g.createLinearGradient(0, y, 0, y + 4);
      if (bump) {
        grad.addColorStop(0, '#000'); grad.addColorStop(0.5, '#fff'); grad.addColorStop(1, '#000');
      } else {
        grad.addColorStop(0, '#5a2a10'); grad.addColorStop(0.45, '#f0a070'); grad.addColorStop(1, '#6b3014');
      }
      g.fillStyle = grad; g.fillRect(0, y, w, 4);
    }
  };
  // Wire runs along the tube (u), turns stack along v: stripes across v
  const map = canvasTexture(16, 256, draw(false), { repeat: [1, 1] });
  const bump = canvasTexture(16, 256, draw(true), { repeat: [1, 1], srgb: false });
  return { map, bump };
}

// Fine dimple noise for soft-touch rubber grip
function rubberBump() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const v = Math.floor(100 + Math.random() * 80);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  }, { repeat: [6, 6], srgb: false });
}

// Ribbed grip lines on the soft-touch part
function gripMap() {
  return canvasTexture(64, 512, (g, w, h) => {
    g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = '#0d0e11'; g.fillRect(0, y, w, 10);
    }
  }, { repeat: [24, 1] });
}

// PCB with traces
function pcbMap() {
  return canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = '#0f4a2c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a94a'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      g.beginPath();
      let x = Math.random() * w, y = Math.random() * h;
      g.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        if (Math.random() < 0.5) x = Math.random() * w; else y = Math.random() * h;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = '#d8c070';
    for (let i = 0; i < 40; i++) {
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 6, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#eaeaea'; g.font = 'bold 22px monospace';
    g.fillText('SPEED CTRL', 30, 40); g.fillText('230V~', 60, h - 30);
  });
}

export function textTexture(text, { w = 256, h = 128, color = '#e8eef5', bg = null, font = '600 64px Montserrat, Arial' } = {}) {
  return canvasTexture(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2);
  });
}

export function createMaterials() {
  const brushed = brushedRoughness();
  const wind = windingTextures();
  const m = {};

  // Polished stainless (shaft, guard)
  m.steel = new THREE.MeshPhysicalMaterial({
    color: 0xe2e6ea, metalness: 1, roughness: 0.16, envMapIntensity: 1.25,
    clearcoat: 0.2, clearcoatRoughness: 0.2,
  });
  // Brushed stainless (body sleeve)
  m.brushed = new THREE.MeshPhysicalMaterial({
    color: 0xc9ced4, metalness: 1, roughness: 0.32, roughnessMap: brushed,
    envMapIntensity: 1.1,
  });
  m.blade = new THREE.MeshPhysicalMaterial({
    color: 0xf0f3f6, metalness: 1, roughness: 0.09, envMapIntensity: 1.6, side: THREE.DoubleSide,
  });
  m.chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, envMapIntensity: 1.8 });
  m.softTouch = new THREE.MeshPhysicalMaterial({
    color: 0x1a1c20, map: gripMap(), roughness: 0.78, metalness: 0,
    bumpMap: rubberBump(), bumpScale: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0x30343a),
  });
  m.gloss = new THREE.MeshPhysicalMaterial({ color: 0x0b0c0f, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 });
  m.plasticGrey = new THREE.MeshStandardMaterial({ color: 0x3a3e45, roughness: 0.55, metalness: 0 });
  m.plasticWhite = new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.45, metalness: 0 });
  m.button = new THREE.MeshPhysicalMaterial({ color: 0x15171b, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  m.rubberCable = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.6, metalness: 0 });

  // Motor materials
  m.lamination = new THREE.MeshStandardMaterial({ color: 0x5d636b, metalness: 0.85, roughness: 0.42, side: THREE.DoubleSide });
  m.section = new THREE.MeshBasicMaterial({ color: 0xb33a2e, side: THREE.BackSide }); // engineering cut-face colour
  m.copperWinding = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: wind.map, bumpMap: wind.bump, bumpScale: 1.5,
    metalness: 0.9, roughness: 0.32, envMapIntensity: 1.2, side: THREE.DoubleSide,
  });
  m.copper = new THREE.MeshPhysicalMaterial({ color: 0xc8743d, metalness: 1, roughness: 0.25, envMapIntensity: 1.3 });
  m.mica = new THREE.MeshStandardMaterial({ color: 0x3b2a1c, roughness: 0.7 });
  m.graphite = new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.9, metalness: 0.1 });
  m.brass = new THREE.MeshPhysicalMaterial({ color: 0xc9a84a, metalness: 1, roughness: 0.3 });
  m.bearing = new THREE.MeshPhysicalMaterial({ color: 0xbfc5cc, metalness: 1, roughness: 0.2 });
  m.fan = new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.55, side: THREE.DoubleSide });
  m.frame = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.55, side: THREE.DoubleSide });

  // Electrical
  m.pcb = new THREE.MeshStandardMaterial({ map: pcbMap(), roughness: 0.6 });
  m.wireBrown = new THREE.MeshStandardMaterial({ color: 0x6b3b1d, roughness: 0.45 });
  m.wireBlue = new THREE.MeshStandardMaterial({ color: 0x1e4fa8, roughness: 0.45 });
  m.wireEnamel = new THREE.MeshPhysicalMaterial({ color: 0xd2662a, metalness: 0.8, roughness: 0.3 });
  m.chip = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.5 });
  m.capacitor = new THREE.MeshStandardMaterial({ color: 0xd8b31d, roughness: 0.5 });
  m.bushing = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5, metalness: 0.3 });

  return m;
}
