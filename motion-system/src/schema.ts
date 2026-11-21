// Campaign schema: all brand data lives here, never in animation code.
// A campaign JSON is validated against this before any frame is rendered.
import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'colour must be #RRGGBB');
const sec = z.number().min(1).max(20);

export const FORMATS = ['16x9', '1x1', '9x16'] as const;
export const formatSchema = z.enum(FORMATS);
export type Format = z.infer<typeof formatSchema>;

export const campaignSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id: lowercase letters, digits, dashes'),
  fps: z.number().int().min(24).max(60).default(30),
  brand: z.object({
    name: z.string().min(1).max(24),
    /** Path inside public/, e.g. brands/tally/logo.svg */
    logo: z.string().regex(/\.(svg|png)$/, 'logo must be .svg or .png'),
    colors: z.object({
      background: hex,
      surface: hex,
      ink: hex,
      muted: hex,
      line: hex,
      accent: hex,
      positive: hex,
    }),
  }),
  /** Every number or factual statement shown on screen must be one of these. */
  approvedClaims: z
    .array(z.object({ id: z.string(), text: z.string().min(4).max(64), source: z.string().min(1) }))
    .min(1),
  hooks: z
    .array(z.object({ id: z.string(), headline: z.string().min(4), sub: z.string().default('') }))
    .min(1),
  ctas: z
    .array(z.object({ id: z.string(), line: z.string().min(4), button: z.string().min(2).max(22) }))
    .min(1),
  url: z.string().min(4).max(40),
  scenes: z.object({
    title: z.object({ duration: sec }),
    ui: z.object({
      duration: sec,
      screenTitle: z.string().max(28),
      nav: z.array(z.string().max(14)).min(2).max(6),
      kpis: z
        .array(z.object({ label: z.string().max(20), value: z.number(), prefix: z.string().default(''), suffix: z.string().default(''), delta: z.string().max(10) }))
        .length(3),
      series: z.array(z.number()).min(6).max(24),
      button: z.string().max(18),
      toast: z.string().max(36),
    }),
    data: z.object({
      duration: sec,
      claimId: z.string(),
      labels: z.array(z.string().max(4)).min(3).max(12),
      values: z.array(z.number().nonnegative()).min(3).max(12),
      unit: z.string().max(8).default(''),
      caption: z.string().max(60),
    }),
    cta: z.object({ duration: sec }),
  }),
});

export type Campaign = z.infer<typeof campaignSchema>;

export const videoPropsSchema = z.object({
  campaign: campaignSchema,
  format: formatSchema,
  hookId: z.string(),
  ctaId: z.string(),
  /** QA mode: outlines any text box that overflows in magenta so the frame inspector can catch it. */
  debug: z.boolean().default(false),
  /** Synthesized soundtrack inside public/, written by scripts/audio.ts. */
  audio: z.string().optional(),
});
export type VideoProps = z.infer<typeof videoPropsSchema>;
