// Renders seek-demo/index.html to MP4: Playwright opens the page, waits for fonts,
// calls window.seek(frame / fps) for every frame, screenshots it, and pipes the PNGs into ffmpeg.
// A small synthesized soundtrack (pure math, no samples) is muxed in.
// Usage: node seek-demo/render.mjs [out.mp4] [--fps 30]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const out = resolve(args.find((a) => a.endsWith('.mp4')) ?? resolve(here, '../out/seek-demo.mp4'));
const fps = Number(args[args.indexOf('--fps') + 1]) || 30;
mkdirSync(dirname(out), { recursive: true });

// --- synthesized audio -------------------------------------------------------
function synth(duration, sr = 48000) {
  const n = Math.round(duration * sr);
  const buf = new Float32Array(n);
  const tone = (start, len, f, amp, decay) => {
    const s0 = Math.round(start * sr);
    for (let i = 0; i < len * sr && s0 + i < n; i++) {
      const t = i / sr;
      const env = Math.min(1, t / 0.004) * Math.exp(-t * decay);
      buf[s0 + i] += amp * env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t));
    }
  };
  tone(0.2, 1.5, 220, 0.18, 2.5);                                   // title swell
  for (let i = 0; i < 12; i++) tone(1.6 + i * 0.12, 0.2, 880 + i * 40, 0.08, 30); // bar ticks
  for (let k = 0; k < 20; k++) tone(3 + k * 0.1, 0.08, 1200, 0.03, 60);           // progress ticks
  tone(5, 2.5, 523.25, 0.16, 1.6); tone(5, 2.5, 659.25, 0.12, 1.6); tone(5, 2.5, 783.99, 0.1, 1.6); // done chord
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  return pcm;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(here, 'index.html')).href);
await page.evaluate(() => window.ready);
const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * fps);

const wav = out.replace(/\.mp4$/, '.wav');
writeFileSync(wav, synth(duration));

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-i', wav, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-shortest', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const canvas = page.locator('#c');
for (let f = 0; f < total; f++) {
  await page.evaluate((t) => window.seek(t), f / fps);
  const png = await canvas.screenshot({ type: 'png' });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % fps === 0) process.stdout.write(`\rframe ${f}/${total}`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg exit ' + c)))));
await browser.close();
console.log(`\nwrote ${out}`);
