// Tiny synthesized soundtrack: an ambient pad plus a motor whine whose pitch follows motor speed.
export class Sound {
  constructor() { this.ctx = null; this.muted = false; }

  start() {
    if (this.ctx) return;
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0.0; this.master.connect(ctx.destination);
    // ambient pad
    this.pad = ctx.createGain(); this.pad.gain.value = 0.05; this.pad.connect(this.master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(this.pad);
    [55, 82.4, 110, 164.8].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6;
      const g = ctx.createGain(); g.gain.value = 0.25; o.connect(g); g.connect(lp); o.start();
    });
    // motor: two detuned saws + filtered noise (brush hiss)
    this.motor = ctx.createGain(); this.motor.gain.value = 0; this.motor.connect(this.master);
    this.mlp = ctx.createBiquadFilter(); this.mlp.type = 'lowpass'; this.mlp.frequency.value = 1200; this.mlp.Q.value = 3; this.mlp.connect(this.motor);
    this.oscs = [0, 7].map((d) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60; o.detune.value = d; o.connect(this.mlp); o.start(); return o; });
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 0.7;
    this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = 0;
    noise.connect(bp); bp.connect(this.noiseGain); this.noiseGain.connect(this.master); noise.start();
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, ctx.currentTime, 0.5);
    const resume = () => { if (ctx.state !== 'running') ctx.resume(); };
    window.addEventListener('pointerdown', resume); window.addEventListener('keydown', resume);
  }

  update(speedNorm, playing, fade) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const on = playing && !this.muted;
    this.master.gain.setTargetAtTime(on ? 0.8 * (1 - fade) : 0, t, 0.08);
    const f = 70 + speedNorm * 260;
    this.oscs.forEach((o) => o.frequency.setTargetAtTime(f, t, 0.05));
    this.mlp.frequency.setTargetAtTime(500 + speedNorm * 2600, t, 0.05);
    this.motor.gain.setTargetAtTime(speedNorm * 0.09, t, 0.06);
    this.noiseGain.gain.setTargetAtTime(speedNorm * 0.025, t, 0.06);
  }

  toggle() { this.muted = !this.muted; return this.muted; }
}
