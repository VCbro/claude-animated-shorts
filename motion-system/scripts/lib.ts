// Shared helpers for the pipeline scripts: campaign loading + validation, bundling, browser, pixels.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { campaignSchema, type Campaign } from '../src/schema';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC = resolve(ROOT, 'public');

// ---------------------------------------------------------------- args
export function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}
export const flag = (name: string) => process.argv.includes(`--${name}`);
export const campaignPathArg = () => resolve(process.argv.slice(2).find((a) => a.endsWith('.json')) ?? resolve(ROOT, 'campaigns/tally-launch.json'));

// ---------------------------------------------------------------- validation
/** On-screen text limits (characters). Generous enough for real copy, tight enough to protect layouts. */
export const LIMITS = { hookHeadline: 44, hookSub: 80, ctaLine: 36, claim: 40, caption: 60, toast: 36 };

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const numbersIn = (s: string) => s.match(/\d[\d.,]*\s?(%|×|x\b)?/g)?.map((m) => m.replace(/[.,\s]+$/, '').trim()) ?? [];

export type Report = { campaign?: Campaign; errors: string[]; warnings: string[]; hash: string };

export function loadCampaign(path: string): Report {
  const raw = readFileSync(path, 'utf8');
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 12);
  const errors: string[] = [];
  const warnings: string[] = [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { errors: [`invalid JSON: ${(e as Error).message}`], warnings, hash };
  }
  const parsed = campaignSchema.safeParse(json);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${i.path.join('.') || '(root)'}: ${i.message}`);
    return { errors, warnings, hash };
  }
  const c = parsed.data;

  // Assets
  const logo = resolve(PUBLIC, c.brand.logo);
  if (!existsSync(logo)) errors.push(`brand.logo: file not found at public/${c.brand.logo}`);
  else if (logo.endsWith('.svg') && !/<svg[\s>]/.test(readFileSync(logo, 'utf8'))) errors.push('brand.logo: not a valid SVG');

  // References and structure
  const claimIds = new Set(c.approvedClaims.map((x) => x.id));
  if (!claimIds.has(c.scenes.data.claimId)) errors.push(`scenes.data.claimId "${c.scenes.data.claimId}" is not an approved claim`);
  if (c.scenes.data.labels.length !== c.scenes.data.values.length) errors.push('scenes.data: labels and values must be the same length');
  for (const [name, list] of [['hooks', c.hooks], ['ctas', c.ctas], ['approvedClaims', c.approvedClaims]] as const) {
    const ids = list.map((x) => x.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) errors.push(`${name}: duplicate id(s) ${[...new Set(dup)].join(', ')}`);
  }

  // Text lengths
  const len = (label: string, s: string, max: number) => s.length > max && errors.push(`${label}: ${s.length} chars, max ${max} ("${s}")`);
  c.hooks.forEach((h) => { len(`hooks.${h.id}.headline`, h.headline, LIMITS.hookHeadline); len(`hooks.${h.id}.sub`, h.sub, LIMITS.hookSub); });
  c.ctas.forEach((x) => len(`ctas.${x.id}.line`, x.line, LIMITS.ctaLine));
  c.approvedClaims.forEach((x) => len(`approvedClaims.${x.id}.text`, x.text, LIMITS.claim));
  len('scenes.data.caption', c.scenes.data.caption, LIMITS.caption);
  len('scenes.ui.toast', c.scenes.ui.toast, LIMITS.toast);

  // Claims: any number in marketing copy must come from an approved claim.
  const approvedText = c.approvedClaims.map((x) => x.text).join(' | ');
  const copy: [string, string][] = [
    ...c.hooks.flatMap((h) => [[`hooks.${h.id}.headline`, h.headline], [`hooks.${h.id}.sub`, h.sub]] as [string, string][]),
    ...c.ctas.map((x) => [`ctas.${x.id}.line`, x.line] as [string, string]),
    ['scenes.ui.toast', c.scenes.ui.toast],
  ];
  for (const [label, text] of copy)
    for (const num of numbersIn(text)) if (!approvedText.includes(num.replace(/\s/g, ''))) errors.push(`${label}: "${num}" is not backed by an approved claim ("${text}")`);
  for (const x of c.approvedClaims) if (/fictional|placeholder|replace/i.test(x.source)) warnings.push(`approvedClaims.${x.id}: source is a placeholder ("${x.source}")`);

  // Colour contrast (WCAG)
  const col = c.brand.colors;
  const need = (a: string, b: string, min: number, label: string) => {
    const r = contrast(a, b);
    if (r < min) errors.push(`brand.colors: ${label} contrast ${r.toFixed(2)} < ${min}`);
  };
  need(col.ink, col.background, 7, 'ink on background');
  need(col.ink, col.surface, 7, 'ink on surface');
  need(col.muted, col.background, 4.5, 'muted on background');
  need(col.background, col.ink, 4.5, 'button text');
  need(col.accent, col.background, 3, 'accent on background');

  return { campaign: errors.length ? undefined : c, errors, warnings, hash };
}

export function printReport(r: Report, path: string) {
  console.log(`campaign ${path} (sha ${r.hash})`);
  for (const w of r.warnings) console.log(`  warn  ${w}`);
  for (const e of r.errors) console.log(`  ERROR ${e}`);
  console.log(r.errors.length ? `  ✗ ${r.errors.length} error(s)` : '  ✓ valid');
}

// ---------------------------------------------------------------- rendering
export function browserExecutable(): string | undefined {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const pw = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
  return existsSync(pw) ? pw : undefined; // undefined: Remotion downloads its own headless shell
}

export async function bundleProject() {
  const { bundle } = await import('@remotion/bundler');
  return bundle({ entryPoint: resolve(ROOT, 'src/index.ts'), publicDir: PUBLIC });
}

// ---------------------------------------------------------------- pixels
/** Decodes an image to raw RGB with ffmpeg (no native image deps). */
export function rgb(path: string) {
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path]).toString().trim();
  const [w, h] = probe.split(',').map(Number);
  const data = execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
  return { w, h, data };
}

export function sha256(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}
