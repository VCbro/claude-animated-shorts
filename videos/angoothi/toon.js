// Respectful flat-vector cartoon characters (SVG strings), drawn in code. Thick warm outlines, cel shading.
// rama({ mouth })  — seated, right hand raised (abhaya) with the ring on it
// hanuman({ pose }) — 'namaste' | 'fly' | 'look'
const OL = '#2a160c', OW = 7;
const st = (fill, w = OW) => `fill="${fill}" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ln = (w = 5, c = OL) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const defs = `<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="0.5" stop-color="#f4b62e"/><stop offset="1" stop-color="#c47f12"/></linearGradient>
  <linearGradient id="silk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd23f"/><stop offset="0.6" stop-color="#f7b51c"/><stop offset="1" stop-color="#e09a0c"/></linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b8fe6"/><stop offset="1" stop-color="#3f6fc9"/></linearGradient>
  <linearGradient id="fur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f08a3a"/><stop offset="1" stop-color="#d8642a"/></linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2382e"/><stop offset="1" stop-color="#a81e1e"/></linearGradient>
  <radialGradient id="cheek" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff7a8a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff7a8a" stop-opacity="0"/></radialGradient>
</defs>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`;

function eye(x, y, s = 1, look = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-34 2 Q0 -30 34 2 Q0 24 -34 2 Z" fill="#fff" stroke="${OL}" stroke-width="5"/>
    <circle cx="${look * 8}" cy="0" r="15" fill="#3a2414"/><circle cx="${look * 8}" cy="0" r="8" fill="#0b0604"/>
    <circle cx="${look * 8 + 6}" cy="-6" r="5" fill="#fff"/>
    <path d="M-38 -2 Q0 -36 38 -2" ${ln(6)}/></g>`;
}
function crown(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-96 40 L-90 -20 Q-80 -70 -60 -100 Q-30 -136 0 -150 Q30 -136 60 -100 Q80 -70 90 -20 L96 40 Z" ${st('url(#gold)')}/>
    <path d="M-90 -20 Q0 -40 90 -20" ${ln(5)}/><path d="M-60 -100 Q0 -116 60 -100" ${ln(5)}/>
    ${[-70, -35, 0, 35, 70].map((px) => `<path d="M${px - 12} ${-104 - (70 - Math.abs(px)) * 0.45} Q${px} ${-150 - (70 - Math.abs(px)) * 0.5} ${px + 12} ${-104 - (70 - Math.abs(px)) * 0.45} Z" ${st('url(#gold)', 4)}/>`).join('')}
    <circle cx="0" cy="-160" r="13" ${st('#e23b4a', 5)}/>
    <circle cx="0" cy="-56" r="20" ${st('#e23b4a', 5)}/><circle cx="-6" cy="-62" r="6" fill="#fff" opacity="0.7"/>
    <circle cx="-48" cy="-4" r="11" ${st('#2fb07a', 4)}/><circle cx="48" cy="-4" r="11" ${st('#2fb07a', 4)}/>
    <circle cx="0" cy="-108" r="10" ${st('#2f7fe0', 4)}/>
    <path d="M-92 40 Q0 18 92 40 L92 58 Q0 36 -92 58 Z" ${st('url(#gold)', 5)}/>
    ${[-70, -42, -14, 14, 42, 70].map((px) => `<circle cx="${px}" cy="${44 - Math.abs(px) * 0.05}" r="5" fill="#fff" stroke="${OL}" stroke-width="2"/>`).join('')}
  </g>`;
}

export function rama({ mouth = 0, ring = true } = {}) {
  const W = 800, H = 1120;
  const m = mouth > 0.5 ? `<path d="M380 318 Q400 336 420 318 Q400 326 380 318 Z" fill="#7a1e24" stroke="${OL}" stroke-width="4"/>` : `<path d="M378 314 Q400 330 422 314" ${ln(5)}/>`;
  return svg(W, H, `
  <!-- bow (behind) -->
  <path d="M600 210 Q700 520 610 860" ${ln(16, '#6b3a16')}/><path d="M600 210 Q700 520 610 860" ${ln(6, '#c98a3a')}/>
  <path d="M600 210 L610 860" ${ln(3, '#e9dcc0')}/>
  <!-- hair falling to the shoulders -->
  <path d="M300 200 Q268 300 286 400 Q300 430 330 420 L340 260 Z" ${st('#1b1410')}/>
  <path d="M500 200 Q532 300 514 400 Q500 430 470 420 L460 260 Z" ${st('#1b1410')}/>
  <!-- angavastram (red shawl, behind the arms) -->
  <path d="M250 400 Q230 560 262 700 L300 690 Q290 560 300 420 Z" ${st('url(#red)')}/>
  <path d="M550 400 Q575 560 540 700 L500 690 Q512 560 500 420 Z" ${st('url(#red)')}/>
  <!-- legs (seated: shins down from the knees) -->
  <path d="M262 760 Q256 880 272 990 L342 990 Q350 880 346 770 Z" ${st('url(#silk)')}/>
  <path d="M454 770 Q450 880 458 990 L528 990 Q544 880 538 760 Z" ${st('url(#silk)')}/>
  <path d="M266 962 L344 962 M456 962 L534 962" ${ln(10, '#c47f12')}/>
  <path d="M300 800 Q306 880 300 950 M496 800 Q490 880 496 950" ${ln(4, '#b77f10')}/>
  <!-- feet -->
  <path d="M262 990 Q248 1040 270 1052 L350 1052 Q358 1030 342 990 Z" ${st('url(#blue)')}/>
  <path d="M458 990 Q442 1030 450 1052 L530 1052 Q552 1040 538 990 Z" ${st('url(#blue)')}/>
  <path d="M266 1000 L344 1000 M456 1000 L534 1000" ${ln(9, '#f4b62e')}/>
  <!-- lap (thighs towards us), knees -->
  <path d="M286 600 Q236 640 236 720 Q240 790 300 796 Q400 808 500 796 Q560 790 564 720 Q564 640 514 600 Z" ${st('url(#silk)')}/>
  <ellipse cx="296" cy="752" rx="52" ry="44" fill="none" stroke="#b77f10" stroke-width="4"/><ellipse cx="504" cy="752" rx="52" ry="44" fill="none" stroke="#b77f10" stroke-width="4"/>
  <path d="M400 620 Q392 700 400 790" ${ln(4, '#b77f10')}/><path d="M340 640 Q370 690 360 720 M460 640 Q430 690 440 720" ${ln(4, '#b77f10')}/>
  <path d="M286 604 Q400 640 514 604" ${ln(12, '#c0392b')}/>
  <!-- torso -->
  <path d="M272 410 Q300 380 360 372 L440 372 Q500 380 528 410 Q540 500 508 606 Q400 630 292 606 Q260 500 272 410 Z" ${st('url(#blue)')}/>
  <path d="M330 460 Q350 500 400 504 Q450 500 470 460" ${ln(4, '#2f58a8')}/><path d="M400 520 L400 580" ${ln(4, '#2f58a8')}/>
  <!-- sacred thread -->
  <path d="M330 390 Q400 520 500 600" ${ln(5, '#fff6e0')}/>
  <!-- necklaces -->
  <path d="M344 376 Q400 430 456 376" ${ln(14, '#f4b62e')}/><path d="M344 376 Q400 430 456 376" ${ln(4, OL)} opacity="0.5"/>
  <path d="M320 390 Q400 500 480 390" ${ln(7, '#fff')} stroke-dasharray="2 12"/>
  <path d="M300 400 Q300 560 400 600 Q500 560 500 400" fill="none" stroke="#e85a8a" stroke-width="16" stroke-linecap="round" stroke-dasharray="1 22"/>
  <path d="M306 404 Q306 556 400 594 Q494 556 494 404" fill="none" stroke="#fff3a0" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 22" stroke-dashoffset="11"/>
  <circle cx="400" cy="424" r="16" ${st('#e23b4a', 5)}/>
  <!-- left arm (viewer's right) resting on the knee -->
  <path d="M520 410 Q570 440 572 520 Q578 620 556 716 L512 708 Q530 620 522 520 Q520 470 500 440 Z" ${st('url(#blue)')}/>
  <path d="M528 450 Q556 452 566 470" ${ln(12, '#f4b62e')}/>
  <path d="M508 700 Q490 730 502 750 Q530 762 560 740 Q566 720 554 706 Z" ${st('url(#blue)')}/>
  <!-- right arm raised, abhaya mudra, the ring on the ring finger -->
  <path d="M280 410 Q236 440 232 520 Q232 570 250 590 L292 576 Q278 540 284 500 Q290 460 300 440 Z" ${st('url(#blue)')}/>
  <path d="M272 452 Q246 454 236 472" ${ln(12, '#f4b62e')}/>
  <path d="M250 590 Q236 520 238 470 L282 470 Q286 520 292 576 Z" ${st('url(#blue)')}/>
  <path d="M232 474 L290 474" ${ln(10, '#f4b62e')}/>
  <g transform="translate(262 420)">
    <path d="M-34 52 Q-40 0 -30 -36 Q-26 -48 -18 -40 L-14 -6 L-12 -58 Q-6 -70 2 -58 L2 -8 L6 -60 Q14 -72 20 -58 L18 -6 L24 -46 Q32 -56 38 -44 Q40 0 32 52 Z" ${st('url(#blue)', 6)}/>
    <circle cx="0" cy="18" r="10" fill="#e85a6a" opacity="0.7"/>
    ${ring ? `<rect x="5" y="-30" width="15" height="9" rx="3" ${st('url(#gold)', 3)}/><circle cx="12" cy="-26" r="4" fill="#ffe58a" stroke="${OL}" stroke-width="2"/>` : ''}
  </g>
  <!-- neck + head -->
  <path d="M368 320 L368 380 Q400 392 432 380 L432 320 Z" ${st('url(#blue)')}/>
  <ellipse cx="315" cy="262" rx="18" ry="26" ${st('url(#blue)')}/><ellipse cx="485" cy="262" rx="18" ry="26" ${st('url(#blue)')}/>
  <circle cx="312" cy="304" r="16" fill="none" stroke="#f4b62e" stroke-width="7"/><circle cx="488" cy="304" r="16" fill="none" stroke="#f4b62e" stroke-width="7"/>
  <path d="M316 230 Q316 150 400 150 Q484 150 484 230 Q486 310 440 344 Q400 362 360 344 Q314 310 316 230 Z" ${st('url(#blue)')}/>
  <ellipse cx="350" cy="292" rx="24" ry="14" fill="url(#cheek)"/><ellipse cx="450" cy="292" rx="24" ry="14" fill="url(#cheek)"/>
  ${eye(360, 252, 0.95)}${eye(440, 252, 0.95)}
  <path d="M400 262 Q394 286 404 290" ${ln(4, '#2a4a90')}/>
  ${m}
  <!-- tilak -->
  <path d="M388 176 Q386 214 400 222 Q414 214 412 176" ${ln(6, '#fff6e8')}/><path d="M400 186 L400 214" ${ln(5, '#e0262e')}/>
  <!-- hair line + crown -->
  <path d="M318 214 Q330 168 400 166 Q470 168 482 214 Q450 190 400 190 Q350 190 318 214 Z" ${st('#1b1410', 5)}/>
  ${crown(400, 152, 0.92)}
  `);
}

export function hanuman({ pose = 'namaste', mouth = 0 } = {}) {
  const W = 640, H = 1120;
  const face = (look = 0, surprised = false) => `
    <ellipse cx="208" cy="230" rx="34" ry="40" ${st('url(#fur)')}/><ellipse cx="208" cy="232" rx="18" ry="24" fill="#f6c08a"/>
    <ellipse cx="432" cy="230" rx="34" ry="40" ${st('url(#fur)')}/><ellipse cx="432" cy="232" rx="18" ry="24" fill="#f6c08a"/>
    <circle cx="320" cy="222" r="118" ${st('url(#fur)')}/>
    <path d="M236 236 Q232 160 290 150 Q320 172 350 150 Q408 160 404 236 Q410 300 320 312 Q230 300 236 236 Z" fill="#f7c895"/>
    <ellipse cx="320" cy="292" rx="78" ry="56" ${st('#f9d4a6', 6)}/>
    <ellipse cx="306" cy="270" rx="7" ry="5" fill="${OL}"/><ellipse cx="334" cy="270" rx="7" ry="5" fill="${OL}"/>
    ${surprised ? `<ellipse cx="320" cy="312" rx="18" ry="16" fill="#7a1e24" stroke="${OL}" stroke-width="5"/>` : (mouth > 0.5 ? `<path d="M284 304 Q320 334 356 304 Q320 318 284 304 Z" fill="#7a1e24" stroke="${OL}" stroke-width="5"/>` : `<path d="M280 302 Q320 330 360 302" ${ln(6)}/>`)}
    ${eye(282, 214, 0.9, look)}${eye(358, 214, 0.9, look)}
    <path d="M248 186 Q282 168 312 186 M328 186 Q358 168 392 186" ${ln(7)}/>
    <path d="M308 150 Q320 130 332 150 L326 176 Q320 184 314 176 Z" fill="#e0262e" stroke="${OL}" stroke-width="4"/>
    <circle cx="200" cy="268" r="13" fill="none" stroke="#f4b62e" stroke-width="7"/><circle cx="440" cy="268" r="13" fill="none" stroke="#f4b62e" stroke-width="7"/>
    <g transform="translate(320 120) scale(0.62)">${crownSmall()}</g>`;
  const tail = (d) => `<path d="${d}" fill="none" stroke="${OL}" stroke-width="40" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#fur)" stroke-width="27" stroke-linecap="round"/>`;
  const dhoti = `<path d="M232 600 Q220 690 236 770 L310 770 L320 700 L330 770 L404 770 Q420 690 408 600 Z" ${st('url(#red)')}/>
    <path d="M226 596 Q320 624 414 596 L414 626 Q320 652 226 626 Z" ${st('url(#gold)', 5)}/>
    <path d="M320 640 L320 700" ${ln(4, '#7a1414')}/><path d="M262 660 Q270 720 262 760 M378 660 Q370 720 378 760" ${ln(4, '#7a1414')}/>`;
  const torso = `<path d="M218 400 Q246 352 320 346 Q394 352 422 400 Q440 500 410 610 Q320 636 230 610 Q200 500 218 400 Z" ${st('url(#fur)')}/>
    <path d="M262 420 Q290 470 320 470 Q350 470 378 420" ${ln(5, '#b8521e')}/><path d="M320 480 L320 580" ${ln(4, '#b8521e')}/>
    <path d="M300 352 Q320 370 340 352 L340 380 Q320 392 300 380 Z" fill="#f7c895"/>
    <path d="M262 362 Q320 420 378 362" ${ln(13, '#f4b62e')}/><path d="M250 372 Q320 470 390 372" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="1 14"/>
    <path d="M272 362 Q320 520 400 600" ${ln(5, '#fff6e0')}/>`;
  const legsStand = `<path d="M244 760 Q236 900 248 1040 L304 1040 Q312 900 312 760 Z" ${st('url(#fur)')}/>
    <path d="M328 760 Q328 900 336 1040 L392 1040 Q404 900 396 760 Z" ${st('url(#fur)')}/>
    <path d="M236 1040 Q228 1076 250 1084 L310 1084 Q318 1060 304 1040 Z" ${st('#f7c895')}/><path d="M336 1040 Q322 1060 330 1084 L390 1084 Q412 1076 404 1040 Z" ${st('#f7c895')}/>
    <path d="M244 1030 L306 1030 M334 1030 L396 1030" ${ln(8, '#f4b62e')}/>`;
  const arm = (x, y, rot, hand = 'open') => `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M-30 0 Q-36 90 -24 180 L24 180 Q34 90 30 0 Z" ${st('url(#fur)')}/><path d="M-30 50 L30 50" ${ln(12, '#f4b62e')}/>
    <path d="M-22 170 Q-28 250 -18 320 L20 320 Q28 250 22 170 Z" ${st('url(#fur)')}/><path d="M-22 300 L22 300" ${ln(10, '#f4b62e')}/>
    <path d="M-26 316 Q-34 360 -14 384 Q0 396 14 384 Q34 360 26 316 Z" ${st('#f7c895')}/>
    ${hand === 'fist' ? '' : `<path d="M-14 380 L-16 400 M0 386 L0 406 M14 380 L16 400" ${ln(5)}/>`}</g>`;
  let body = '';
  if (pose === 'namaste') {
    body = `${tail('M410 690 Q560 640 540 420 Q526 300 590 270 Q630 262 618 300')}
      ${legsStand}${dhoti}${torso}
      <path d="M226 400 Q190 460 210 540 Q230 560 290 520 L300 486 Q256 500 254 470 Q260 430 250 400 Z" ${st('url(#fur)')}/>
      <path d="M414 400 Q450 460 430 540 Q410 560 350 520 L340 486 Q384 500 386 470 Q380 430 390 400 Z" ${st('url(#fur)')}/>
      <path d="M214 452 L252 448 M426 452 L388 448" ${ln(12, '#f4b62e')}/>
      <path d="M290 520 Q284 440 320 404 Q356 440 350 520 Q320 534 290 520 Z" ${st('#f7c895')}/><path d="M320 410 L320 524" ${ln(4)}/>
      ${face(0)}`;
  } else if (pose === 'fly') {
    body = `${tail('M400 640 Q520 560 560 380 Q580 300 620 290')}
      <g transform="translate(320 760) rotate(-18)"><path d="M-80 0 Q-120 90 -160 140 L-120 176 Q-60 120 -20 30 Z" ${st('url(#fur)')}/><path d="M-160 140 Q-190 170 -170 190 L-110 196 L-120 176 Z" ${st('#f7c895')}/></g>
      <g transform="translate(320 760) rotate(14)"><path d="M10 0 Q40 110 30 230 L84 236 Q96 110 70 10 Z" ${st('url(#fur)')}/><path d="M30 230 Q22 266 44 274 L100 274 Q104 250 84 236 Z" ${st('#f7c895')}/></g>
      ${dhoti}${torso}
      ${arm(232, 410, 150)}${arm(408, 410, -150)}
      ${face(0, true)}`;
  } else {  // look: right hand as a visor over the eyes, left hand holding the gada
    body = `${tail('M410 690 Q560 640 540 420 Q526 300 590 270 Q630 262 618 300')}
      <g transform="translate(470 520) rotate(-8)"><rect x="-9" y="0" width="18" height="460" rx="8" ${st('#8a5a2a', 6)}/>
        <ellipse cx="0" cy="470" rx="62" ry="74" ${st('url(#gold)')}/><path d="M-60 470 Q0 500 60 470 M-48 430 Q0 450 48 430 M-48 512 Q0 530 48 512" ${ln(5)}/><circle cx="0" cy="552" r="12" ${st('url(#gold)', 5)}/></g>
      ${legsStand}${dhoti}${torso}
      ${arm(412, 410, -14)}
      <path d="M226 400 Q176 360 150 300 L190 276 Q214 330 254 380 Z" ${st('url(#fur)')}/>
      <path d="M160 294 Q210 230 276 196 L296 232 Q232 262 196 318 Z" ${st('url(#fur)')}/><path d="M176 296 L206 316" ${ln(10, '#f4b62e')}/>
      ${face(1)}
      <path d="M262 196 Q300 176 352 184 Q366 196 352 206 Q306 206 276 224 Z" ${st('#f7c895')}/>
      <path d="M300 186 L346 192 M296 198 L340 202" ${ln(3)}/>`;
  }
  return svg(W, H, body);
}
function crownSmall() {
  return `<path d="M-90 40 L-70 -30 L-36 0 L0 -70 L36 0 L70 -30 L90 40 Z" ${st('url(#gold)', 8)}/>
    <path d="M-92 40 Q0 20 92 40 L92 62 Q0 42 -92 62 Z" ${st('url(#gold)', 7)}/><circle cx="0" cy="-70" r="14" ${st('#e23b4a', 6)}/><circle cx="0" cy="14" r="14" ${st('#2fb07a', 6)}/>`;
}
