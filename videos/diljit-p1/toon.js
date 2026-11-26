// Flat-vector cartoon characters for the Diljit • Patiala shorts (SVG strings). Thick warm outlines, cel shading.
// diljit({ look: 'metgala' | 'stage', view: 'front' | 'back', kid })   maharaja({})
const OL = '#26160c', OW = 7;
const st = (fill, w = OW) => `fill="${fill}" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ln = (w = 5, c = OL) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const defs = `<defs>
  <linearGradient id="ivory" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.65" stop-color="#f3ead6"/><stop offset="1" stop-color="#ddd0b4"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="0.5" stop-color="#e8b23a"/><stop offset="1" stop-color="#b87a14"/></linearGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9a074"/><stop offset="1" stop-color="#b98058"/></linearGradient>
  <linearGradient id="emer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fd69a"/><stop offset="1" stop-color="#14805a"/></linearGradient>
  <linearGradient id="navy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3f6a"/><stop offset="1" stop-color="#22264a"/></linearGradient>
</defs>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 110}" viewBox="0 0 ${w} ${h + 110}">${defs}<g transform="translate(0 110)">${body}</g></svg>`;
const eye = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 2 Q0 -24 30 2 Q0 20 -30 2 Z" fill="#fff" stroke="${OL}" stroke-width="5"/>
  <circle cx="0" cy="0" r="13" fill="#3a2414"/><circle cx="0" cy="0" r="7" fill="#0b0604"/><circle cx="5" cy="-5" r="4" fill="#fff"/></g>`;
const pearls = (d, n = 1) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${11 * n}" stroke-linecap="round" stroke-dasharray="0.1 ${15 * n}"/><path d="${d}" fill="none" stroke="${OL}" stroke-width="${2}" opacity="0.25"/>`;

// the necklace (Patiala-style): layered strands + a big centre stone
function necklace(cx, y, s = 1, centre = '#f2c230') {
  return `<g transform="translate(${cx} ${y}) scale(${s})">
    ${pearls('M-70 0 Q0 60 70 0')}${pearls('M-82 6 Q0 96 82 6')}
    <path d="M-92 12 Q0 140 92 12" fill="none" stroke="#dfe8f0" stroke-width="10" stroke-linecap="round" stroke-dasharray="0.1 13"/>
    <path d="M-60 10 Q0 70 60 10" ${ln(9, '#2fae7a')}/>
    ${[-46, -24, 24, 46].map((x) => `<ellipse cx="${x}" cy="${30 + Math.abs(x) * -0.1 + 40}" rx="9" ry="12" ${st('url(#emer)', 3)}/>`).join('')}
    <path d="M0 96 l22 26 l-22 26 l-22 -26 Z" ${st(centre, 4)}/><path d="M0 104 l12 18 l-12 18" fill="none" stroke="#fff" stroke-width="3" opacity="0.7"/>
    <circle cx="0" cy="160" r="10" ${st('#e23b4a', 3)}/></g>`;
}
function turban(cx, y, s = 1, { kalgi = true, col = '#fbf6ea' } = {}) {
  return `<g transform="translate(${cx} ${y}) scale(${s})">
    <path d="M-112 40 Q-124 -40 -70 -92 Q0 -130 70 -92 Q124 -40 112 40 Q60 62 0 60 Q-60 62 -112 40 Z" ${st(col)}/>
    <path d="M-104 10 Q0 -70 104 10 M-96 -30 Q0 -96 96 -30 M-80 -66 Q0 -112 80 -66" ${ln(4, '#cbbd9c')}/>
    <path d="M-110 36 Q0 0 110 36" ${ln(10, '#e8b23a')}/>
    ${kalgi ? `<path d="M6 -96 Q30 -170 10 -230 Q-2 -180 -14 -118 Z" ${st('#fff', 4)}/><path d="M2 -120 Q14 -170 8 -214" ${ln(3, '#d8d0c0')}/>
      <circle cx="0" cy="-92" r="20" ${st('url(#emer)', 4)}/><circle cx="0" cy="-92" r="30" fill="none" stroke="#e8b23a" stroke-width="7"/>` : ''}
    ${pearls('M-104 46 Q-80 20 -52 40', 0.8)}</g>`;
}
function face(cx, y, s = 1, { shades = false, beard = 'trim', smile = true } = {}) {
  return `<g transform="translate(${cx} ${y}) scale(${s})">
    <ellipse cx="-92" cy="20" rx="16" ry="24" ${st('url(#skin)')}/><ellipse cx="92" cy="20" rx="16" ry="24" ${st('url(#skin)')}/>
    <path d="M-88 -20 Q-90 -84 0 -88 Q90 -84 88 -20 Q90 70 40 104 Q0 120 -40 104 Q-90 70 -88 -20 Z" ${st('url(#skin)')}/>
    ${beard === 'royal' ? `<path d="M-86 10 Q-100 130 0 190 Q100 130 86 10 Q60 70 0 74 Q-60 70 -86 10 Z" ${st('#1d1612')}/>
      <path d="M-70 52 Q-30 34 0 46 Q30 34 70 52 Q86 40 98 18 Q60 70 0 62 Q-60 70 -98 18 Q-86 40 -70 52 Z" ${st('#1d1612', 4)}/>`
      : `<path d="M-86 0 Q-92 100 0 134 Q92 100 86 0 Q66 60 0 64 Q-66 60 -86 0 Z" ${st('#1d1612')}/><path d="M-46 50 Q0 30 46 50 Q0 44 -46 50 Z" ${st('#1d1612', 4)}/>`}
    ${shades ? `<path d="M-74 -30 L-8 -30 Q-6 6 -40 8 Q-72 6 -74 -30 Z M8 -30 L74 -30 Q72 6 40 8 Q6 6 8 -30 Z" ${st('#121214', 5)}/><path d="M-8 -26 L8 -26" ${ln(5)}/>
      <path d="M-62 -24 L-30 -24" ${ln(4, '#5a5a66')}/><path d="M20 -24 L52 -24" ${ln(4, '#5a5a66')}/>` : `${eye(-38, -20, 0.95)}${eye(38, -20, 0.95)}<path d="M-66 -52 Q-38 -64 -12 -50 M12 -50 Q38 -64 66 -52" ${ln(7)}/>`}
    <path d="M0 -10 Q-8 18 4 24" ${ln(4, '#8a5a3a')}/>
    ${smile ? `<path d="M-22 74 Q0 86 22 74" ${ln(5, '#f0e0d0')}/>` : ''}</g>`;
}

// Diljit: 'metgala' (ivory sherwani, cape, emerald + pearl necklaces) or 'stage' (white kurta, shades). kid = the little fan.
export function diljit({ look = 'metgala', view = 'front', kid = false } = {}) {
  const W = 700, H = 1200;
  if (view === 'back') return svg(W, H, `
    <path d="M140 400 Q100 700 80 1150 L620 1150 Q600 700 560 400 Q350 340 140 400 Z" ${st('url(#ivory)')}/>
    <path d="M250 560 Q300 520 380 540 Q430 590 470 640 Q440 720 470 800 Q420 900 360 940 Q300 880 250 900 Q220 820 240 740 Q200 660 250 560 Z" fill="none" stroke="#d6a43a" stroke-width="6" stroke-dasharray="14 8"/>
    ${['ੳ ਅ ੲ', 'ਸ ਹ ਕ ਖ', 'ਗ ਘ ਙ ਚ ਛ', 'ਜ ਝ ਞ ਟ ਠ', 'ਡ ਢ ਣ ਤ ਥ', 'ਦ ਧ ਨ ਪ ਫ', 'ਬ ਭ ਮ ਯ ਰ', 'ਲ ਵ ੜ'].map((r, i) => `<text x="355" y="${600 + i * 44}" font-size="38" font-weight="800" text-anchor="middle" fill="#c8962e" font-family="sans-serif">${r}</text>`).join('')}
    ${[[200, 450, 300, 620], [480, 470, 560, 700], [170, 820, 260, 1000], [470, 860, 560, 1060]].map(([a, b, c, d]) => `<path d="M${a} ${b} Q${(a + c) / 2 + 40} ${(b + d) / 2} ${c} ${d}" ${ln(4, '#e4dccb')}/>`).join('')}
    <path d="M290 330 L410 330 L420 400 L280 400 Z" ${st('url(#skin)')}/>
    ${turban(350, 250, 1.15, { kalgi: false })}
    <path d="M250 300 Q350 330 450 300" ${ln(10, '#e8b23a')}/>${pearls('M250 318 Q350 356 450 318', 1)}`);
  if (look === 'stage') return svg(W, H, `
    <path d="M200 420 Q160 700 170 1060 L330 1060 L350 900 L370 1060 L530 1060 Q540 700 500 420 Q350 380 200 420 Z" ${st('url(#ivory)')}/>
    <path d="M350 430 L350 760" ${ln(4, '#cbbd9c')}/><path d="M230 470 Q260 640 250 760" ${ln(4, '#cbbd9c')}/>
    <path d="M200 430 Q140 520 160 660 Q170 700 200 690 Q196 600 236 520 Z" ${st('url(#ivory)')}/>
    <path d="M500 430 Q610 380 640 250 L600 236 Q570 330 480 380 Z" ${st('url(#ivory)')}/>
    <path d="M596 240 Q606 170 630 150 Q660 160 650 200 L640 250 Z" ${st('#f4f4f4')}/><path d="M612 160 L640 168 M606 190 L640 196" ${ln(3, '#bbb')}/>
    <path d="M160 660 Q150 700 176 716 Q206 712 202 680 Z" ${st('url(#skin)')}/>
    <path d="M220 440 Q260 520 250 1000" ${ln(16, '#3a3a3a')}/><path d="M480 440 Q450 520 470 1000" ${ln(16, '#3a3a3a')}/>
    <path d="M290 330 L410 330 L420 420 L280 420 Z" ${st('url(#skin)')}/>
    ${face(350, 250, 1.15, { shades: true })}${turban(350, 158, 1.15, { kalgi: false })}
    <path d="M220 1060 L320 1060 L320 1110 L210 1110 Z M380 1060 L480 1060 L490 1110 L380 1110 Z" ${st('#1a1a1a')}/>`);
  const k = kid ? 1 : 1;
  return svg(W, H, `
    <!-- cape (behind) -->
    <path d="M150 420 Q80 700 60 1150 L640 1150 Q620 700 550 420 Z" ${st('url(#ivory)')}/>
    <path d="M100 900 Q120 1000 110 1140 M600 900 Q580 1000 590 1140" ${ln(4, '#d6c9a8')}/>
    <circle cx="560" cy="520" r="34" fill="none" stroke="#c8962e" stroke-width="10"/><circle cx="548" cy="520" r="28" fill="url(#ivory)"/>
    <!-- sherwani -->
    <path d="M220 420 Q190 700 200 1100 L500 1100 Q510 700 480 420 Q350 390 220 420 Z" ${st('url(#ivory)')}/>
    <path d="M230 700 L470 700 L470 740 L230 740 Z" ${st('url(#gold)', 5)}/>
    <path d="M350 430 L350 1100" ${ln(4, '#cbbd9c')}/>${[480, 540, 600, 660, 800, 860, 920].map((y) => `<circle cx="350" cy="${y}" r="7" ${st('url(#gold)', 3)}/>`).join('')}
    <path d="M210 1000 Q350 1030 490 1000 L500 1100 L200 1100 Z" ${st('#efe5cf')}/>${[230, 280, 330, 380, 430, 470].map((x) => `<path d="M${x} 1010 l10 30 l10 -30" ${ln(3, '#c8962e')}/>`).join('')}
    <!-- arms: hands folded on the sword hilt -->
    <path d="M222 440 Q180 560 210 760 L260 800 Q250 640 270 520 Z" ${st('url(#ivory)')}/>
    <path d="M478 440 Q520 560 490 760 L440 800 Q450 640 430 520 Z" ${st('url(#ivory)')}/>
    <path d="M246 776 L262 820 M454 776 L438 820" ${ln(10, '#c8962e')}/>
    <path d="M338 830 L362 830 L360 1000 L340 1000 Z" ${st('url(#gold)', 4)}/><path d="M318 820 L382 820" ${ln(10, '#c8962e')}/>
    <path d="M262 790 Q300 770 340 800 Q350 830 330 846 Q290 850 262 826 Z" ${st('url(#skin)')}/>
    <path d="M438 790 Q400 770 360 800 Q350 830 370 846 Q410 850 438 826 Z" ${st('url(#skin)')}/>
    <circle cx="300" cy="802" r="7" ${st('#e23b4a', 3)}/><circle cx="404" cy="802" r="7" ${st('url(#emer)', 3)}/>
    <!-- neck, necklaces, head -->
    <path d="M296 330 L404 330 L410 420 L290 420 Z" ${st('url(#skin)')}/>
    ${necklace(350, 396, 1.55)}
    ${face(350, 250, 1.15)}${turban(350, 158, 1.15)}`);
}

// Maharaja Bhupinder Singh (cartoon): grand turban with aigrette, royal beard, dark achkan, the long Patiala necklace.
export function maharaja() {
  const W = 700, H = 1200;
  return svg(W, H, `
    <path d="M200 420 Q170 700 180 1100 L520 1100 Q530 700 500 420 Q350 390 200 420 Z" ${st('url(#navy)')}/>
    <path d="M350 430 L350 1100" ${ln(4, '#16183a')}/>${[480, 560, 640, 720, 800].map((y) => `<circle cx="350" cy="${y}" r="8" ${st('url(#gold)', 3)}/>`).join('')}
    <path d="M190 1000 Q350 1030 510 1000" ${ln(10, '#c8962e')}/><path d="M220 760 L480 760 L480 800 L220 800 Z" ${st('url(#gold)', 5)}/>
    <path d="M200 440 Q150 600 180 800 L230 820 Q220 640 250 520 Z" ${st('url(#navy)')}/><path d="M500 440 Q560 600 520 800 L470 820 Q480 640 450 520 Z" ${st('url(#navy)')}/>
    <path d="M186 800 Q180 840 206 852 Q236 846 230 816 Z" ${st('url(#skin)')}/><path d="M514 800 Q520 840 494 852 Q464 846 470 816 Z" ${st('url(#skin)')}/>
    <path d="M500 820 L560 1080" ${ln(14, '#8a5a2a')}/><path d="M500 820 L560 1080" ${ln(5, '#e8b23a')}/>
    <path d="M296 360 L404 360 L410 430 L290 430 Z" ${st('url(#skin)')}/>
    <!-- the long Patiala necklace: five platinum strands + the big yellow stone -->
    <g transform="translate(350 420)">
      ${[0, 1, 2, 3, 4].map((i) => `<path d="M${-80 - i * 10} ${i * 4} Q${-40 - i * 8} ${300 + i * 80} 0 ${330 + i * 70} Q${40 + i * 8} ${300 + i * 80} ${80 + i * 10} ${i * 4}" fill="none" stroke="#e8f0f6" stroke-width="${11 - i}" stroke-linecap="round" stroke-dasharray="0.1 ${13 + i}"/>`).join('')}
      <path d="M0 330 l40 48 l-40 48 l-40 -48 Z" ${st('#f6c62a', 5)}/><path d="M0 344 l24 34 l-24 34" fill="none" stroke="#fff" stroke-width="4" opacity="0.7"/>
      <path d="M-40 280 Q0 320 40 280" ${ln(6, '#e8f0f6')}/></g>
    ${face(350, 270, 1.15, { beard: 'royal' })}
    <g transform="translate(350 172) scale(1.2)">
      <path d="M-120 40 Q-132 -50 -70 -100 Q0 -136 70 -100 Q132 -50 120 40 Q60 64 0 62 Q-60 64 -120 40 Z" ${st('#f1c6c6')}/>
      <path d="M-110 6 Q0 -76 110 6 M-100 -36 Q0 -100 100 -36" ${ln(4, '#c79a9a')}/>
      <path d="M-116 34 Q0 -6 116 34" ${ln(12, '#e8b23a')}/>
      <path d="M8 -100 Q40 -190 14 -250 Q-6 -190 -16 -120 Z" ${st('#fff', 4)}/>
      <circle cx="0" cy="-96" r="22" ${st('#e23b4a', 4)}/><circle cx="0" cy="-96" r="34" fill="none" stroke="#e8b23a" stroke-width="8"/>
      ${pearls('M-112 50 Q0 80 112 50', 1)}</g>`);
}
