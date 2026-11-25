// Looks for the 2D documentary. Put the name in out/theme.txt (or ?theme=<name> in the URL). Default: night.
//   night      deep navy, gold + cyan accents, faint grid (INS Vikrant / Chenab look)
//   cinematic  film look: warm/teal grade, 2.2:1 letterbox, serif titles, clean captions, more grain
//   archive    history: sepia film, heavy grain + flicker, serif type, old-paper panels
//   neon       tech / space / AI: black, magenta + cyan glow, glowing grid
//   news       breaking-news explainer: red caption box, white labels, bold sans
export const THEMES = {
  night: {
    grade: 'none', grain: 0.035, vig: 0.55, letterbox: 0, flicker: 0,
    studio: ['#0b1630', '#04070f', 'rgba(80,140,255,.18)', 'rgba(120,170,255,.06)'],
    css: { '--acc': '#ffd166', '--acc2': '#7fd8ff', '--panel': 'rgba(8,12,22,.82)', '--txt': '#ffffff', '--sub': '#d6e2f0',
      '--capbg': 'rgba(5,8,15,.55)', '--captxt': '#ffffff', '--capon': '#ffd166', '--capbottom': '54px', '--tfont': 'B', '--glow': '0 6px 30px rgba(0,0,0,.6)' },
  },
  cinematic: {
    grade: 'contrast(1.12) saturate(1.12) sepia(.14) hue-rotate(-6deg)', grain: 0.07, vig: 0.68, letterbox: 104, flicker: 0,
    studio: ['#0f1c24', '#03070a', 'rgba(255,160,90,.16)', null],
    css: { '--acc': '#ffb35c', '--acc2': '#7fe0d6', '--panel': 'rgba(6,10,12,.72)', '--txt': '#fff7ee', '--sub': '#e7d9c8',
      '--capbg': 'transparent', '--captxt': '#fff7ee', '--capon': '#ffcf8a', '--capbottom': '124px', '--tfont': 'T', '--glow': '0 4px 40px rgba(0,0,0,.75)' },
  },
  archive: {
    grade: 'sepia(.78) saturate(.75) contrast(1.1) brightness(.94)', grain: 0.13, vig: 0.78, letterbox: 0, flicker: 0.05,
    studio: ['#2b2117', '#0d0905', 'rgba(255,215,160,.16)', null],
    css: { '--acc': '#f3d39a', '--acc2': '#e9c58a', '--panel': 'rgba(40,28,16,.85)', '--txt': '#fbf1de', '--sub': '#e5d3b3',
      '--capbg': 'rgba(20,14,8,.55)', '--captxt': '#fbf1de', '--capon': '#f3d39a', '--capbottom': '54px', '--tfont': 'T', '--glow': '0 4px 24px rgba(0,0,0,.7)' },
  },
  neon: {
    grade: 'saturate(1.45) contrast(1.15) hue-rotate(12deg)', grain: 0.03, vig: 0.62, letterbox: 0, flicker: 0,
    studio: ['#0c0718', '#020104', 'rgba(255,61,242,.14)', 'rgba(44,246,255,.09)'],
    css: { '--acc': '#ff3df2', '--acc2': '#2cf6ff', '--panel': 'rgba(10,4,20,.84)', '--txt': '#ffffff', '--sub': '#d9c8ff',
      '--capbg': 'rgba(10,4,20,.6)', '--captxt': '#ffffff', '--capon': '#2cf6ff', '--capbottom': '54px', '--tfont': 'B', '--glow': '0 0 18px rgba(255,61,242,.7), 0 0 40px rgba(44,246,255,.35)' },
  },
  news: {
    grade: 'contrast(1.08) saturate(1.08)', grain: 0.02, vig: 0.45, letterbox: 0, flicker: 0,
    studio: ['#14181d', '#06070a', 'rgba(230,40,50,.12)', 'rgba(255,255,255,.05)'],
    css: { '--acc': '#ffffff', '--acc2': '#ff4d4d', '--panel': 'rgba(215,20,26,.95)', '--txt': '#ffffff', '--sub': '#ffe1e1',
      '--capbg': '#d7141a', '--captxt': '#ffffff', '--capon': '#ffe066', '--capbottom': '60px', '--tfont': 'B', '--glow': '0 6px 24px rgba(0,0,0,.55)' },
  },
};
export async function loadTheme() {
  const q = new URLSearchParams(location.search).get('theme');
  let n = q || (await fetch('/out/theme.txt').then((r) => (r.ok ? r.text() : '')).catch(() => '')).trim();
  if (!THEMES[n]) n = 'night';
  const th = THEMES[n], root = document.documentElement;
  root.classList.add('theme-' + n);
  for (const [k, v] of Object.entries(th.css)) root.style.setProperty(k, v);
  document.getElementById('c').style.filter = th.grade;
  return { name: n, ...th };
}
