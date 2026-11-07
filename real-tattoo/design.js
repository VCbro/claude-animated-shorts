// The tattoo design: an original swallow carrying a fern sprig. Local coordinates, bird faces left, ~580 x 460 px.
// Each path is a centre-line; regions are polygons for washes (colour, shading).
const Q = (x0, y0, cx, cy, x1, y1, n = 14) => qctrl(x0, y0, cx, cy, x1, y1, n);
const rev = a => a.slice().reverse();
const lerpPts = (A, B, k) => A.map((p, i) => [lerp(p[0], B[i][0], k), lerp(p[1], B[i][1], k)]);

function swallowDesign() {
  const P = {};                                                    // named centre-lines
  P.back = Q(-150, -78, -60, -118, 120, 18, 18);
  P.belly = Q(-160, -28, -40, 42, 120, 42, 18);
  P.mid = Q(-160, -52, -40, -38, 120, 30, 18);                    // invisible: the colour boundary back/belly
  P.head = Q(-150, -78, -194, -80, -194, -52, 10).concat(Q(-194, -52, -190, -30, -160, -28, 10).slice(1));
  P.beak = Q(-192, -62, -208, -60, -226, -53, 6).concat(Q(-226, -53, -208, -47, -192, -44, 6).slice(1));
  P.fwLead = Q(-90, -82, -20, -212, 180, -252, 18);               // far wing, raised
  P.fwTrail = Q(180, -252, 80, -150, 32, -70, 18);
  P.fwF1 = Q(166, -240, 100, -180, 50, -110, 10);
  P.fwF2 = Q(140, -246, 60, -196, -5, -118, 10);
  P.nwLead = Q(-80, -30, -40, 120, 150, 212, 18);                 // near wing, down
  P.nwTrail = Q(150, 212, 92, 92, 40, 12, 18);
  P.nwF1 = Q(140, 196, 72, 112, 14, 6, 10);
  P.nwF2 = Q(118, 204, 40, 136, -24, -6, 10);
  P.tailU1 = Q(112, 12, 200, -12, 302, -42, 12);
  P.tailU2 = Q(302, -42, 222, 8, 124, 30, 12);
  P.tailL1 = Q(120, 36, 210, 70, 292, 122, 12);
  P.tailL2 = Q(292, 122, 202, 62, 118, 46, 12);
  P.stem = Q(-214, -52, -282, 40, -232, 202, 20);
  P.eye = Q(-171, -59, -168, -61, -165, -58, 4);
  // fern leaflets along the stem, alternating sides, getting smaller
  const leaves = [];
  for (let i = 0; i < 8; i++) {
    const s = .14 + i * .105, k = Math.min(P.stem.length - 2, Math.floor(s * (P.stem.length - 1)));
    const [x, y] = P.stem[k], [x2, y2] = P.stem[k + 1], a = Math.atan2(y2 - y, x2 - x);
    const side = i % 2 ? 1 : -1, len = 46 - i * 3.6, ang = a + side * 1.05;
    leaves.push(Q(x, y, x + Math.cos(ang - side * .3) * len * .6, y + Math.sin(ang - side * .3) * len * .6, x + Math.cos(ang) * len, y + Math.sin(ang) * len, 8));
  }
  // the order a line is drawn in: structure first (body, head), then wings, tail, then the fern
  const order = ['back', 'belly', 'head', 'beak', 'eye', 'fwLead', 'fwTrail', 'fwF1', 'fwF2', 'nwLead', 'nwTrail', 'nwF1', 'nwF2', 'tailU1', 'tailU2', 'tailL1', 'tailL2', 'stem'];
  const weight = { eye: 1.6, fwF1: .55, fwF2: .55, nwF1: .55, nwF2: .55, stem: .8 };
  const lines = order.map(k => ({ k, pts: P[k], w: weight[k] || 1 })).concat(leaves.map((pts, i) => ({ k: 'leaf' + i, pts, w: .75, leaf: true })));
  // colour regions
  const R = {
    back: P.back.concat(rev(P.mid)),
    fw: P.fwLead.concat(P.fwTrail.slice(1)),
    nw: P.nwLead.concat(P.nwTrail.slice(1)),
    tailU: P.tailU1.concat(P.tailU2.slice(1)),
    tailL: P.tailL1.concat(P.tailL2.slice(1)),
    throat: [[-188, -46], [-176, -32], [-150, -24], [-128, -24], [-132, -40], [-152, -50], [-176, -54]],
    shFw: P.fwTrail.concat(rev(lerpPts(P.fwTrail, rev(P.fwLead), .38))),
    shNw: P.nwTrail.concat(rev(lerpPts(P.nwTrail, rev(P.nwLead), .4))),
    shBelly: P.belly.concat(rev(lerpPts(P.belly, P.mid, .42))),
  };
  return { P, lines, leaves, R };
}
