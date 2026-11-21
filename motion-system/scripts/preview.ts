// Storyboard + QA before any full export.
// npm run preview -- campaigns/<id>.json [--formats 16x9,1x1,9x16] [--hook a] [--cta trial]
// Renders key frames in debug mode, checks them for overflow / edge collisions / blank frames,
// and builds one contact sheet per format. Exit code 1 if any frame fails.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { FORMATS, type Campaign, type Format } from '../src/schema';
import { timeline, uiClickFrame } from '../src/timeline';
import { arg, browserExecutable, bundleProject, campaignPathArg, loadCampaign, printReport, rgb, ROOT } from './lib';

export type FrameQA = { frame: number; label: string; file: string; ok: boolean; issues: string[] };

export function keyframes(c: Campaign) {
  const { spans, total } = timeline(c);
  const at = (name: string) => spans.find((s) => s.name === name)!;
  const fps = c.fps;
  const t = at('title'), u = at('ui'), d = at('data'), x = at('cta');
  return [
    { label: 'title in', frame: t.from + Math.round(0.6 * fps) },
    { label: 'title hold', frame: t.from + t.duration - 16 },
    { label: 'ui load', frame: u.from + Math.round(1.6 * fps) },
    { label: 'ui click', frame: u.from + uiClickFrame(fps) + 1 },
    { label: 'ui result', frame: u.from + uiClickFrame(fps) + 60 },
    { label: 'data grow', frame: d.from + Math.round(1.0 * fps) },
    { label: 'data hold', frame: d.from + d.duration - 16 },
    { label: 'cta', frame: x.from + Math.round(1.0 * fps) },
    { label: 'end card', frame: total - 1 },
  ];
}

/** Pixel checks on a rendered frame. */
export function inspect(file: string, bg: string): string[] {
  const { w, h, data } = rgb(file);
  const [br, bgG, bb] = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const issues: string[] = [];
  let magenta = 0, content = 0, edge = 0;
  const band = Math.round(Math.min(w, h) * 0.025);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 235 && g < 30 && b > 235) magenta++;
      const diff = Math.abs(r - br) + Math.abs(g - bgG) + Math.abs(b - bb);
      if (diff > 48) {
        content++;
        if (x < band || y < band || x >= w - band || y >= h - band) edge++;
      }
    }
  if (magenta > 40) issues.push(`text overflow: ${magenta} magenta outline pixels`);
  if (edge > 60) issues.push(`content inside the ${band}px edge band (${edge} px): possible crop/overflow`);
  if (content / (w * h) < 0.002) issues.push('frame is nearly blank');
  return issues;
}

export async function preview(c: Campaign, opts: { formats: Format[]; hookId: string; ctaId: string; serveUrl?: string; outDir?: string }) {
  const serveUrl = opts.serveUrl ?? (await bundleProject());
  const outDir = opts.outDir ?? resolve(ROOT, 'out', c.id, 'preview');
  const results: Record<string, FrameQA[]> = {};
  const kfs = keyframes(c);
  for (const format of opts.formats) {
    const dir = resolve(outDir, format);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const inputProps = { campaign: c, format, hookId: opts.hookId, ctaId: opts.ctaId, debug: true };
    const composition = await selectComposition({ serveUrl, id: 'ProductVideo', inputProps, browserExecutable: browserExecutable(), logLevel: 'error' });
    results[format] = [];
    for (const [k, kf] of kfs.entries()) {
      const file = resolve(dir, `${String(k).padStart(2, '0')}_f${kf.frame}.png`);
      await renderStill({ serveUrl, composition, frame: kf.frame, output: file, inputProps, browserExecutable: browserExecutable(), logLevel: 'error' });
      const issues = inspect(file, c.brand.colors.background);
      results[format].push({ ...kf, file, ok: issues.length === 0, issues });
      console.log(`  ${format} ${kf.label.padEnd(10)} f${String(kf.frame).padEnd(4)} ${issues.length ? '✗ ' + issues.join('; ') : '✓'}`);
    }
    // Contact sheet: 3 columns, labelled.
    const cell = format === '9x16' ? '360:640' : format === '1x1' ? '480:480' : '640:360';
    const inputs = results[format].flatMap((r) => ['-i', r.file]);
    const labelled = results[format]
      .map((r, i) => `[${i}:v]scale=${cell},drawtext=text='${r.label} · f${r.frame}${r.ok ? '' : ' · FAIL'}':x=12:y=h-34:fontsize=20:fontcolor=${r.ok ? 'white' : 'red'}:box=1:boxcolor=black@0.55:boxborderw=6[v${i}]`)
      .join(';');
    const rows = Math.ceil(results[format].length / 3);
    const layout = Array.from({ length: results[format].length }, (_, i) => {
      const [cw, ch] = cell.split(':').map(Number);
      return `${(i % 3) * (cw + 8)}_${Math.floor(i / 3) * (ch + 8)}`;
    }).join('|');
    const xs = results[format].map((_, i) => `[v${i}]`).join('');
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', `${labelled};${xs}xstack=inputs=${results[format].length}:layout=${layout}:fill=0x222222`, '-frames:v', '1', resolve(outDir, `contact_${format}.png`)]);
    void rows;
  }
  const ok = Object.values(results).every((list) => list.every((r) => r.ok));
  writeFileSync(resolve(outDir, 'qa.json'), JSON.stringify({ campaign: c.id, ok, results }, null, 2));
  return { ok, results, outDir, serveUrl };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const path = campaignPathArg();
  const r = loadCampaign(path);
  printReport(r, path);
  if (!r.campaign) process.exit(1);
  const c = r.campaign;
  const formats = (arg('formats', FORMATS.join(',')) as string).split(',') as Format[];
  const res = await preview(c, { formats, hookId: arg('hook', c.hooks[0].id)!, ctaId: arg('cta', c.ctas[0].id)! });
  console.log(`\ncontact sheets + qa.json in ${res.outDir}`);
  console.log(res.ok ? '✓ preview QA passed' : '✗ preview QA failed: fix the flagged frames before rendering');
  process.exit(res.ok ? 0 : 1);
}
