// =====================================================================
//  ERAS, BRIDGES — how DNS works (read by kit/morph.js). No camera moves.
//  1: the name's trailing "." (grown to a circle) becomes the root server.
//  2: the copy of the answer at the resolver becomes the cache record.
// =====================================================================
const ERA_BG = [MC.bg, MC.bg, MC.bg];
const BRIDGES = [
  { tc: CU.m1, d: 0.45, A: () => ({ P: ellipsePts(SV[0].p[0], SV[0].p[1], SV_R, SV_R, 0, 96), c: QR }), B: () => ({ P: ellipsePts(SV[0].p[0], SV[0].p[1], SV_R, SV_R, 0, 96), c: QR }) },
  { tc: CU.m2, d: 0.45, A: () => ({ P: boxPts({ x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h }, 18), c: QA }), B: () => ({ P: boxPts(CACHE), c: QT }) },
];
