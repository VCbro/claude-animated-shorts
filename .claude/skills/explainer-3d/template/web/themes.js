// Looks for the 3D explainer. One name switches the backdrop, the 3D lighting, a colour grade of the 3D layer,
// and the caption/label/chip style. Works for any machine: no model changes needed.
// Pick with ?theme=<name> in the URL, or VTHEME=<name> for tools/render.py. Default: studio.
//   studio    deep blue studio, yellow + cyan accents (the original water-motor look)
//   noir      graphite black, warm gold key light, gold accents: premium / luxury
//   blueprint engineering blueprint: blue grid paper, cool light, white mono labels
//   neon      near-black with magenta/cyan rim lights and glowing captions: tech / gaming
//   clean     bright white studio, soft shadows, dark captions: Apple-style product look
//   sunset    warm orange-purple dusk gradient, golden rim: cinematic / emotional
export const THEMES = {
  studio: {
    grade: 'none',
    css: { '--bg': 'radial-gradient(120% 75% at 50% 38%, #24415c 0%, #142739 48%, #0a1520 100%)', '--y': '#ffd23f', '--c': '#49d6ff',
      '--panel': 'rgba(8,18,30,.80)', '--txt': '#ffffff', '--sub': '#d8e6f2', '--stroke': '#000', '--line': 'rgba(255,255,255,.85)', '--glow': 'none' },
    hemi: ['#cfe6ff', '#26323f', 0.9], key: ['#fff3e2', 2.6], rim: ['#7fc4ff', 1.2], fill: null, exposure: 1.05, env: 0.55,
  },
  noir: {
    grade: 'saturate(.55) sepia(.35) contrast(1.18) brightness(.92)',
    css: { '--bg': 'radial-gradient(110% 70% at 50% 40%, #2b2622 0%, #141210 50%, #050505 100%)', '--y': '#f2c46d', '--c': '#ffe3a8',
      '--panel': 'rgba(12,10,8,.82)', '--txt': '#fff8ec', '--sub': '#e3d3b8', '--stroke': '#000', '--line': 'rgba(242,196,109,.9)', '--glow': '0 0 24px rgba(242,196,109,.35)' },
    hemi: ['#ffe9c8', '#1a1612', 0.45], key: ['#ffd9a0', 3.2], rim: ['#ffb45e', 2.0], fill: null, exposure: 1.0, env: 0.35,
  },
  blueprint: {
    grade: 'grayscale(1) sepia(1) hue-rotate(178deg) saturate(2.8) brightness(.88) contrast(1.15)',
    css: { '--bg': 'linear-gradient(rgba(255,255,255,.07) 2px, transparent 2px) 0 0/60px 60px, linear-gradient(90deg, rgba(255,255,255,.07) 2px, transparent 2px) 0 0/60px 60px, linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px) 0 0/12px 12px, linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0/12px 12px, radial-gradient(120% 80% at 50% 40%, #1d5aa8 0%, #123f7c 55%, #0a2550 100%)',
      '--y': '#ffffff', '--c': '#9fe3ff', '--panel': 'rgba(10,40,90,.85)', '--txt': '#ffffff', '--sub': '#cfe6ff', '--stroke': '#0a2550', '--line': 'rgba(255,255,255,.95)', '--glow': 'none', '--font': '"Mono", "Mont", "Baloo", monospace' },
    hemi: ['#dff1ff', '#0e3060', 1.1], key: ['#f2f8ff', 2.2], rim: ['#bfe8ff', 1.6], fill: null, exposure: 1.1, env: 0.6,
  },
  neon: {
    grade: 'saturate(1.7) contrast(1.2) hue-rotate(-18deg) brightness(.95)',
    css: { '--bg': 'radial-gradient(100% 60% at 50% 42%, #1a0f2e 0%, #0b0716 55%, #020104 100%)', '--y': '#ff3df2', '--c': '#2cf6ff',
      '--panel': 'rgba(10,4,20,.82)', '--txt': '#ffffff', '--sub': '#d9c8ff', '--stroke': '#12001e', '--line': 'rgba(44,246,255,.95)', '--glow': '0 0 18px rgba(255,61,242,.75), 0 0 42px rgba(44,246,255,.45)' },
    hemi: ['#b9a6ff', '#12001e', 0.35], key: ['#e9e4ff', 1.6], rim: ['#ff3df2', 3.2], fill: ['#2cf6ff', 2.6, [2.2, 0.8, 1.6]], exposure: 1.0, env: 0.3,
  },
  clean: {
    grade: 'saturate(.85) brightness(1.1) contrast(.95)',
    css: { '--bg': 'radial-gradient(120% 80% at 50% 35%, #ffffff 0%, #eef1f5 55%, #d9dee5 100%)', '--y': '#ff5a1f', '--c': '#0a7cff',
      '--panel': 'rgba(255,255,255,.92)', '--txt': '#11161c', '--sub': '#4a5560', '--stroke': '#ffffff', '--line': 'rgba(17,22,28,.75)', '--glow': 'none', '--shadow': '0 10px 30px rgba(20,30,45,.18)' },
    hemi: ['#ffffff', '#c9d0d8', 1.25], key: ['#ffffff', 2.4], rim: ['#ffffff', 0.8], fill: null, exposure: 1.12, env: 0.8,
  },
  sunset: {
    grade: 'sepia(.3) saturate(1.35) hue-rotate(-14deg) contrast(1.05)',
    css: { '--bg': 'linear-gradient(180deg, #2a1640 0%, #6b2a55 30%, #d8604a 62%, #f5a855 82%, #3b2030 100%)', '--y': '#ffd36b', '--c': '#ffb0d0',
      '--panel': 'rgba(30,12,28,.78)', '--txt': '#fff6ee', '--sub': '#ffd9c8', '--stroke': '#1a0710', '--line': 'rgba(255,232,200,.9)', '--glow': '0 0 26px rgba(255,170,90,.35)' },
    hemi: ['#ffd2b0', '#3a1c34', 0.8], key: ['#ffb070', 2.9], rim: ['#ff7ab8', 1.8], fill: null, exposure: 1.05, env: 0.45,
  },
};

export function themeName() {
  const q = new URLSearchParams(location.search).get('theme');
  return q && THEMES[q] ? q : 'studio';
}

// css: sets the CSS variables and a `theme-<name>` class on <html>. lights: { renderer, scene, hemi, key, rim }.
export function applyTheme(name, { renderer, scene, hemi, key, rim, THREE }) {
  const th = THEMES[name];
  const root = document.documentElement;
  root.classList.add('theme-' + name);
  for (const [k, v] of Object.entries(th.css)) root.style.setProperty(k, v);
  hemi.color.set(th.hemi[0]); hemi.groundColor.set(th.hemi[1]); hemi.intensity = th.hemi[2];
  key.color.set(th.key[0]); key.intensity = th.key[1];
  rim.color.set(th.rim[0]); rim.intensity = th.rim[1];
  if (th.fill) { const f = new THREE.DirectionalLight(th.fill[0], th.fill[1]); f.position.set(...th.fill[2]); scene.add(f); }
  renderer.domElement.style.filter = th.grade;     // colour grade of the 3D layer only (captions stay crisp)
  renderer.toneMappingExposure = th.exposure;
  scene.environmentIntensity = th.env;
  return th;
}
