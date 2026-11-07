  // SCORE BODY — internet history. Chiptune that gets fuller every era (the sound grows up with the picture):
  // 1969 lone square blips, then arps, then a bass, then hats; silence; the LOGIN hit; a quiet tail.
  const cu = CU;
  const chip = (t, n, vel, dur = 0.11, pan = 0, type = 'square', cut = 3600) => {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut;
    const g = ac.createGain(); env(g, t, 0.002, vel, dur);
    osc(type, typeof n === 'number' ? n : nz(n), t, t + dur + 0.05).connect(lp); lp.connect(g); out(g, pan, 0.12);
  };
  const tri = (t, n, vel, dur = 0.2) => { const g = ac.createGain(); env(g, t, 0.003, vel, dur); osc('triangle', nz(n), t, t + dur + 0.05).connect(g); out(g, 0, 0); };
  const hat = (t, vel) => noiseHit(t, 0.03, 'highpass', 7000, 0.8, vel, 0.15);
  const ARP = ['D4', 'Fs4', 'A4', 'Fs4', 'E4', 'A4', 'B4', 'A4'];
  const BASS = ['D3', 'D3', 'A2', 'A2', 'B2', 'B2', 'G2', 'A2'];
  const stopAt = cu.silence - 0.15;
  to = 'm';
  for (let e = 0; e < 8; e++) {
    const t0 = ERA_T[e], t1 = Math.min(ERA_T[e + 1], stopAt);
    for (let t = Math.ceil(t0 / E8) * E8, i = 0; t < t1 - 0.05; t += E8, i++) {
      if (e === 0 && i % 4) continue;                                      // 1969: a lone blip every beat... every other beat
      if (e === 1 && i % 2) continue;                                      // 1971: quarter notes
      chip(t, ARP[i % 8], 0.022 + e * 0.002, 0.09, (i % 2 ? 0.15 : -0.15), e < 2 ? 'square' : 'sawtooth', 1800 + e * 300);
      if (e >= 2 && i % 2 === 0) tri(t, BASS[(i / 2) % 8 | 0], 0.08 + e * 0.006, 0.22);
    }
  }
  // the payoff: a stab, a sub and a coin-ish ding on the N, then a flat quiet chord
  chip(cu.hit, 'D5', 0.12, 0.45, -0.2); chip(cu.hit, 'Fs5', 0.1, 0.45, 0); chip(cu.hit, 'A5', 0.1, 0.45, 0.2);
  tri(cu.hit, 'D3', 0.3, 0.6); sub(cu.hit, 0.45);
  chip(cu.hit + 0.12, 'D6', 0.06, 0.35, 0.1);
  pad(cu.hit + 0.35, cu.end + 0.6, ['D3', 'A3', 'D4', 'Fs4'], 0.03, { type: 'triangle', cut: 1500, att: 0.3, rel: 0.4, send: 0.3 });
  pad(cu.end + 0.4, DURATION + 0.4, ['D3', 'A3', 'Fs4'], 0.01, { type: 'triangle', cut: 1000, att: 0.5, rel: 0.8, send: 0.3 });
  to = 's';
  for (let e = 3; e < 8; e++) for (let t = Math.ceil(ERA_T[e] / BEAT) * BEAT + E8; t < Math.min(ERA_T[e + 1], stopAt) - 0.05; t += BEAT) hat(t, 0.012 + (e - 3) * 0.002);
  // 1969: the teletype types LOGIN, two letters travel, the crash
  for (let i = 0; i < 5; i++) noiseHit(cu.login - 0.1 + i * 0.12, 0.025, 'bandpass', 2600, 4, 0.04);
  [cu.letL, cu.letO].forEach((t, i) => blip(t, 900 + i * 300, 1500 + i * 300, 0.3, 0.035));
  noiseHit(cu.crash, 0.45, 'lowpass', 900, 0.7, 0.12, 0, 0.2, 120);
  // a rising sweep into each morph
  M.forEach((tc) => sweep(tc - 0.4, tc, 0.006, 500, 2400, 0));
  noiseHit(cu.email, 0.06, 'bandpass', 3000, 2, 0.03); blip(cu.at, 1400, 2100, 0.08, 0.04);   // the hop, the @
  // 1998: the modem's screech (filtered noise sweeps and two tones)
  for (let i = 0; i < 4; i++) noiseHit(cu.modem + i * 0.28, 0.25, 'bandpass', 1200 + i * 600, 6, 0.03, 0, 0, 2400 + i * 400);
  blip(cu.modem - 0.3, 2100, 2100, 0.25, 0.02); blip(cu.modem, 1300, 1300, 0.2, 0.02);
  // typing the login on the phone: one tick per letter
  for (let i = 0; i < 4; i++) blip(cu.carry - 0.2 + (i + 1) * 0.25, 2400, 2300, 0.015, 0.015);
