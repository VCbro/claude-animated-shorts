// Original synthesized soundtrack, timed from the campaign timeline (no samples, no licences).
// A soft pad, a pulse, a whoosh on each scene change, UI ticks and a click on the cursor press.
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { Campaign } from '../src/schema';
import { timeline, uiClickFrame } from '../src/timeline';
import { PUBLIC } from './lib';

const SR = 48000;

export function writeSoundtrack(c: Campaign): string {
  const { spans, total } = timeline(c);
  const dur = total / c.fps;
  const n = Math.ceil(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1; // seeded: same file every run

  const add = (i: number, l: number, r = l) => { if (i >= 0 && i < n) { L[i] += l; R[i] += r; } };

  // Pad: A minor 9 voicing, slow attack, gentle movement.
  const chords = [[220, 261.63, 329.63, 493.88], [174.61, 220, 261.63, 392], [196, 246.94, 293.66, 440], [220, 277.18, 329.63, 440]];
  spans.forEach((s, k) => {
    const t0 = s.from / c.fps;
    const len = s.duration / c.fps;
    for (const [j, f] of chords[k % chords.length].entries())
      for (let i = 0; i < len * SR; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.8) * Math.min(1, (len - t) / 0.6 + 0.0001);
        const v = 0.022 * env * Math.sin(2 * Math.PI * f * t + j) * (1 + 0.25 * Math.sin(2 * Math.PI * 0.2 * t + j));
        add(Math.round((t0 + t) * SR), v * (j % 2 ? 0.8 : 1.2), v * (j % 2 ? 1.2 : 0.8));
      }
  });

  // Soft pulse on the beat (100 bpm), low sine kick.
  for (let b = 0; b * 0.6 < dur - 1; b++) {
    const s0 = Math.round(b * 0.6 * SR);
    for (let i = 0; i < 0.25 * SR; i++) {
      const t = i / SR;
      const f = 60 + 50 * Math.exp(-t * 30);
      add(s0 + i, 0.09 * Math.exp(-t * 14) * Math.sin(2 * Math.PI * f * t));
    }
  }

  // Whoosh into each scene: filtered noise swell.
  spans.slice(1).forEach((s) => {
    const center = s.from / c.fps;
    let lp = 0;
    for (let i = -0.5 * SR; i < 0.25 * SR; i++) {
      const t = i / SR;
      const env = t < 0 ? Math.pow((t + 0.5) / 0.5, 2) : Math.exp(-t * 18);
      lp += (rnd() - lp) * 0.08;
      add(Math.round(center * SR) + i, 0.18 * env * lp, 0.18 * env * lp * 0.8);
    }
  });

  // UI: ticks as KPIs count up, click on the cursor press, chime when the forecast lands.
  const ui = spans.find((s) => s.name === 'ui')!;
  const tone = (at: number, f: number, amp: number, decay: number, len = 0.4) => {
    for (let i = 0; i < len * SR; i++) {
      const t = i / SR;
      add(Math.round(at * SR) + i, amp * Math.exp(-t * decay) * Math.sin(2 * Math.PI * f * t));
    }
  };
  for (let k = 0; k < 3; k++) tone(ui.from / c.fps + (8 + k * 5) / c.fps, 1800, 0.05, 60, 0.1);
  const click = (ui.from + uiClickFrame(c.fps)) / c.fps;
  for (let i = 0; i < 0.03 * SR; i++) add(Math.round(click * SR) + i, 0.35 * Math.exp(-i / SR / 0.004) * rnd());
  tone(click + 0.02, 2400, 0.06, 80, 0.1);
  tone(click + 0.8, 880, 0.07, 6, 1.2);
  tone(click + 0.8, 1318.5, 0.05, 6, 1.2);

  // Data bars: rising plucks.
  const data = spans.find((s) => s.name === 'data')!;
  c.scenes.data.values.forEach((_, i) => tone((data.from + 14 + i * 4) / c.fps, 440 * Math.pow(2, i / 6), 0.05, 18, 0.3));

  // Logo resolve chord.
  const cta = spans.find((s) => s.name === 'cta')!;
  for (const f of [261.63, 329.63, 392, 523.25]) tone(cta.from / c.fps + 0.05, f, 0.05, 1.8, 3);

  // Master fade-out and soft limit.
  const fade = 1.2 * SR;
  const pcm = Buffer.alloc(44 + n * 4);
  const hdr = (o: number, s: string) => pcm.write(s, o);
  hdr(0, 'RIFF'); pcm.writeUInt32LE(36 + n * 4, 4); hdr(8, 'WAVEfmt '); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
  hdr(36, 'data'); pcm.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const g = Math.min(1, (n - i) / fade);
    pcm.writeInt16LE(Math.round(Math.tanh(L[i] * g * 1.4) * 0.9 * 32767), 44 + i * 4);
    pcm.writeInt16LE(Math.round(Math.tanh(R[i] * g * 1.4) * 0.9 * 32767), 46 + i * 4);
  }
  mkdirSync(resolve(PUBLIC, 'generated'), { recursive: true });
  const rel = `generated/${c.id}.wav`;
  const file = resolve(PUBLIC, rel);
  writeFileSync(file, pcm);
  // Loudness-normalise for social platforms (-16 LUFS integrated, -1.5 dBTP).
  const tmp = file.replace(/\.wav$/, '.norm.wav');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', String(SR), tmp]);
  renameSync(tmp, file);
  return rel;
}
