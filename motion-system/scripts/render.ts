// Full export: validate -> preview QA -> soundtrack -> render MP4s -> inspect the real output -> manifest.
// npm run render -- campaigns/<id>.json [--matrix reference|all] [--formats 16x9,1x1,9x16] [--skip-preview]
//   reference (default): one video per format with the first hook + first CTA
//   all: every format x hook x CTA (e.g. 3 x 3 x 2 = 18 videos)
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, relative, resolve } from 'node:path';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { FORMATS, type Format } from '../src/schema';
import { timeline } from '../src/timeline';
import { arg, browserExecutable, bundleProject, campaignPathArg, flag, loadCampaign, printReport, ROOT, sha256 } from './lib';
import { inspect, preview } from './preview';
import { writeSoundtrack } from './audio';

const path = campaignPathArg();
const report = loadCampaign(path);
printReport(report, path);
if (!report.campaign) process.exit(1);
const c = report.campaign;
const formats = (arg('formats', FORMATS.join(',')) as string).split(',') as Format[];
const matrix = arg('matrix', 'reference');
const browser = browserExecutable();

console.log('\n[1/4] soundtrack + bundle');
const audio = writeSoundtrack(c); // before bundling: the bundle snapshots public/
const serveUrl = await bundleProject();

if (!flag('skip-preview')) {
  console.log('[2/4] preview frames + QA');
  const p = await preview(c, { formats, hookId: c.hooks[0].id, ctaId: c.ctas[0].id, serveUrl });
  if (!p.ok) {
    console.log('✗ preview QA failed; nothing exported. See out/<id>/preview/qa.json and the contact sheets.');
    process.exit(1);
  }
} else console.log('[2/4] preview skipped (--skip-preview)');


const jobs = formats.flatMap((format) =>
  (matrix === 'all' ? c.hooks : [c.hooks[0]]).flatMap((h) => (matrix === 'all' ? c.ctas : [c.ctas[0]]).map((x) => ({ format, hookId: h.id, ctaId: x.id }))),
);
const out = resolve(ROOT, 'out', c.id, 'delivery');
rmSync(out, { recursive: true, force: true });
console.log(`[3/4] rendering ${jobs.length} video(s) -> ${relative(ROOT, out)}`);

type Entry = Record<string, unknown>;
const files: Entry[] = [];
const posters: Entry[] = [];
const { total } = timeline(c);

for (const [k, job] of jobs.entries()) {
  const dir = resolve(out, job.format);
  mkdirSync(dir, { recursive: true });
  const inputProps = { campaign: c, ...job, debug: false, audio };
  const composition = await selectComposition({ serveUrl, id: 'ProductVideo', inputProps, browserExecutable: browser, logLevel: 'error' });
  const file = resolve(dir, `${c.id}_${job.format}_hook-${job.hookId}_cta-${job.ctaId}.mp4`);
  const t0 = Date.now();
  let last = -1;
  await renderMedia({
    serveUrl, composition, inputProps, codec: 'h264', crf: 18, pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '192k',
    outputLocation: file, browserExecutable: browser, logLevel: 'error',
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) { last = pct; process.stdout.write(`\r  (${k + 1}/${jobs.length}) ${basename(file)} ${pct}%   `); }
    },
  });

  // Inspect the actual MP4, not the composition: probe streams and pixel-check decoded frames.
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', file]).toString());
  const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === 'video');
  const hasAudio = probe.streams.some((s: { codec_type: string }) => s.codec_type === 'audio');
  const issues: string[] = [];
  if (!hasAudio) issues.push('no audio stream');
  const dur = Number(probe.format.duration);
  if (Math.abs(dur - total / c.fps) > 0.1) issues.push(`duration ${dur}s, expected ${total / c.fps}s`);
  for (const t of [1.5, total / c.fps / 2, total / c.fps - 0.2]) {
    const png = resolve(dir, `.qa_${k}.png`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', png]);
    issues.push(...inspect(png, c.brand.colors.background).map((i) => `t=${t.toFixed(1)}s ${i}`));
    rmSync(png);
  }
  console.log(`\r  (${k + 1}/${jobs.length}) ${basename(file)} ${((Date.now() - t0) / 1000).toFixed(0)}s ${issues.length ? '✗ ' + issues.join('; ') : '✓'}`);
  files.push({
    file: relative(out, file), format: job.format, hook: job.hookId, cta: job.ctaId,
    width: v.width, height: v.height, fps: c.fps, duration: dur, audio: hasAudio,
    bytes: statSync(file).size, sha256: sha256(file), qa: { ok: issues.length === 0, issues },
  });
}

for (const format of formats) {
  const dir = resolve(out, format);
  const inputProps = { campaign: c, format, hookId: c.hooks[0].id, ctaId: c.ctas[0].id, debug: false };
  const composition = await selectComposition({ serveUrl, id: 'ProductVideo', inputProps, browserExecutable: browser, logLevel: 'error' });
  const poster = resolve(dir, `${c.id}_${format}_poster.png`);
  await renderStill({ serveUrl, composition, frame: total - 1, output: poster, inputProps, browserExecutable: browser, logLevel: 'error' });
  posters.push({ file: relative(out, poster), format });
  const sheet = resolve(ROOT, 'out', c.id, 'preview', `contact_${format}.png`);
  try {
    mkdirSync(resolve(out, 'review'), { recursive: true });
    copyFileSync(sheet, resolve(out, 'review', `contact_${format}.png`));
  } catch { /* preview skipped */ }
}

console.log('[4/4] manifest');
const ok = files.every((f) => (f.qa as { ok: boolean }).ok);
const claim = c.approvedClaims.find((x) => x.id === c.scenes.data.claimId)!;
const manifest = {
  campaign: c.id,
  brand: c.brand.name,
  campaignSha: report.hash,
  generatedAt: new Date().toISOString(),
  matrix,
  approvedClaimsShown: [claim, ...c.approvedClaims.filter((x) => [...c.hooks, ...c.ctas].some((h) => JSON.stringify(h).includes(x.text.match(/\d+/)?.[0] ?? '\u0000')))].filter((x, i, a) => a.indexOf(x) === i),
  warnings: report.warnings,
  qa: { ok },
  videos: files,
  posters,
  review: formats.map((f) => `review/contact_${f}.png`),
};
writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${ok ? '✓' : '✗'} ${files.length} video(s), manifest at ${relative(ROOT, resolve(out, 'manifest.json'))}`);
process.exit(ok ? 0 : 1);
