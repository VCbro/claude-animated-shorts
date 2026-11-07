// =====================================================================
//  ERAS, RESOLUTIONS, BRIDGES — a short history of the internet (read by kit/morph.js and the pixel hooks).
//  Every era is drawn finer than the one before: 20 px -> 15 -> 12 -> 10 -> 8 -> 6 -> 4 -> 3 px per pixel.
//  The key object of each era sits at the same screen spot (KX, KY) and becomes the next era's.
// =====================================================================
const ERA_RES = [[54, 96], [72, 128], [90, 160], [108, 192], [135, 240], [180, 320], [270, 480], [360, 640]];
const ERA_BG = ['#0f2a14', '#1a0e04', '#14101e', '#232a4e', '#232a4e', '#14101e', '#232a4e', '#14101e'];
const ERA_POST = [
  { pal: GREEN, scan: 0.3, vignette: 0.55, rim: [GREEN[3], GREEN[0]] },
  { pal: AMBER, scan: 0.25, vignette: 0.45, rim: [AMBER[3], AMBER[0]] },
  { pal: P8, scan: 0.18, vignette: 0.3 },
  { pal: P12, scan: 0.12 },
  { pal: PAL16 }, { pal: PAL16 }, { pal: PAL16 }, { pal: PAL16 },
];
function pieceCam() { return null; }
const KX = 520, KY = 800;   // where every era's key object sits (world px)
const fanPts = (cx, cy, r, a0, a1, n = 40) => [[cx, cy], ...arcPts(cx, cy, r, a0, a1, n)];
const BR = {
  O: () => ({ P: ellipsePts(660, 800, 100, 140, 0, 64), c: GREEN[3] }),
  AT: (c) => ({ P: ellipsePts(KX, KY, 170, 170, 0, 64), c }),
  GLOBE: () => ({ P: ellipsePts(KX, KY, 168, 168, 0, 64), c: PAL16.blue }),
  MODEM: () => ({ P: rrectPts(KX - 200, KY - 80, 400, 160, 16, 4), c: PAL16.white }),
  FAN: () => ({ P: fanPts(KX, KY + 170, 330, -Math.PI * 0.75, -Math.PI * 0.25), c: PAL16.sky }),
  PLAY: () => ({ P: [[KX - 90, KY - 110], [KX + 130, KY], [KX - 90, KY + 110]], c: PAL16.yellow }),
  PLAYER: () => ({ P: rrectPts(KX - 320, KY - 180, 640, 360, 10, 4), c: PAL16.grey }),
  PHONE: () => ({ P: rrectPts(KX - 150, KY - 290, 300, 580, 30, 6), c: PAL16.slate }),
};
const BRIDGES = [
  { tc: CU.m1, d: 0.4, A: BR.O, B: () => BR.AT(AMBER[3]) },
  { tc: CU.m2, d: 0.4, A: () => BR.AT(AMBER[3]), B: BR.GLOBE },
  { tc: CU.m3, d: 0.4, A: BR.GLOBE, B: BR.MODEM },
  { tc: CU.m4, d: 0.4, A: BR.MODEM, B: BR.FAN },
  { tc: CU.m5, d: 0.4, A: BR.FAN, B: BR.PLAY },
  { tc: CU.m6, d: 0.4, A: BR.PLAYER, B: BR.PHONE },
  { tc: CU.m7, d: 0.4, A: BR.PHONE, B: BR.PHONE },
];
