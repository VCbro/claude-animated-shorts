  // SCORE BODY — how DNS works. A quiet pad under the voice, a pluck per hop, silence, then the payoff stab.
  const cu = CU;
  to = 'm';
  pad(0.0, cu.m1 + 0.2, ['D3', 'A3', 'Fs4'], 0.022, { type: 'triangle', cut: 900, att: 0.8, rel: 0.4 });
  pad(cu.m1 - 0.2, cu.silence - 0.15, ['D3', 'A3', 'E4', 'Fs4'], 0.026, { type: 'triangle', cut: 1100, att: 0.5, rel: 0.12, send: 0.0 });
  // the hops: a rising pluck as each question goes out, a lower one for each referral
  [[cu.asks + 0.1, 'D4'], [cu.root + 0.15, 'Fs4'], [cu.tld + 0.15, 'A4'], [cu.auth + 0.1, 'D5']].forEach(([t, n]) => pluck(t, nz(n), 0.12, 0.2, 0.5, 2600, 0.2));
  [[cu.rootCom - 0.1, 'A3'], [cu.tldEx - 0.1, 'Fs4']].forEach(([t, n]) => pluck(t, nz(n), 0.09, -0.2, 0.5, 2000, 0.2));
  [['D4', 0], ['Fs4', E8], ['A4', BEAT]].forEach(([n, dt], i) => pluck(cu.type + dt, nz(n), 0.08, -0.2 + i * 0.2, 0.45, 2400, 0.3));
  // the payoff: a short stab + sub on the hit, then a flat held chord
  chime(cu.hit, [nz('D5'), nz('A5'), nz('Fs6')], 0.16);
  pluck(cu.hit, nz('D4'), 0.3, 0, 0.6, 3000, 0.0); pluck(cu.hit, nz('A4'), 0.26, 0.15, 0.6, 3000, 0.0);
  sub(cu.hit, 0.5);
  pad(cu.hit + 0.35, cu.back + 0.3, ['D3', 'A3', 'D4', 'Fs4'], 0.022, { type: 'triangle', cut: 1200, att: 0.5, rel: 0.9, send: 0.3 });
  pad(cu.back + 0.2, DURATION + 0.4, ['D3', 'A3', 'E4', 'A4'], 0.009, { type: 'triangle', cut: 1000, att: 0.6, rel: 0.6, send: 0.3 });
  [['E5', 0], ['Fs5', E8], ['A5', BEAT]].forEach(([n, dt], i) => pluck(cu.already + dt, nz(n), 0.09, -0.2 + i * 0.2, 0.5, 3200, 0.35));
  to = 's';
  for (let i = 0; i < 7; i++) blip(cu.type + i * 0.12, 2200, 2000, 0.02, 0.012);           // typing ticks
  sweep(cu.left + 0.4, cu.m1, 0.008, 500, 2600, 0);                                       // into the first morph
  [cu.root + 0.85, cu.tld + 0.85, cu.auth + 0.85].forEach((t) => blip(t, 1700, 1400, 0.03, 0.03));   // arrivals
  for (let i = 0; i < 4; i++) blip(cu.ttl + 0.3 + i, 1200, 1150, 0.02, 0.012);            // the TTL ticking
