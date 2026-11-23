// Example film: two scenes. Copy this file, keep the import, write one add(a, b, draw) per beat.
// Times come from anchors (A('name')) that tools/align.py finds in the narration.
import { add, start, A, R, win, eio, eob, ctx, cam, camKeys, screen, studio, text, label, chapter, panel, line, flow, arrow, sine,
         glowDot, fillRR, lin, rad, TAU, END } from './engine.js';

add(0, A('second'), (t) => {
  studio('#0b1630', '#04070f');
  camKeys(t, [[0, 960, 540, 1.0], [A('second'), 960, 540, 1.15]]);
  // world drawing (camera applies)
  fillRR(760, 420, 400, 240, 30, lin(760, 420, 760, 660, [[0, '#e8543c'], [1, '#8f2418']]));
  flow([[200, 800], [1720, 800]], t, '#59d6ff', { speed: 300, gap: 40, r: 5 });
  label('लेबल', 960, 420, 120, -120, R(t, 0.5, 0.4), 'छोटी लाइन');
  screen();
  text('शीर्षक', 960, 200, { size: 90, cls: 'ttl', a: R(t, 0.2, 0.5) });
});
add(A('second'), END + 1, (t) => {
  studio('#120c14', '#05030a', 'rgba(255,90,60,.12)');
  cam(960, 540, 1);
  sine(560, 540, 800, 120, 3, t * 4, '#ffd166', 6, 1);
  chapter(t, A('second'), 1, 'पहला अध्याय');
});
await start();
