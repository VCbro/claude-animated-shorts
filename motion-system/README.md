# Product Motion System

A reusable, automated motion design system. It takes a **structured brand brief (campaign JSON)** and produces
**validated product motion videos in 16:9, 1:1 and 9:16**, with hook and CTA variants, an original synthesized soundtrack,
contact-sheet review and a delivery manifest.

It also includes a small **Canvas `seek(t)` demo** that shows how deterministic frame rendering works.

```
campaign JSON ──► validate ──► preview frames + QA ──► render MP4 matrix ──► inspect MP4 ──► manifest
 (brand brief)    (schema,      (debug mode, overflow,    (format × hook × CTA)  (audio, duration,  (sha256, QA,
                   claims,       edge, blank checks,                             decoded frames)    posters)
                   contrast)     contact sheets)
```

## Quick start
Requires Node 18+ and ffmpeg. Remotion downloads its own headless Chrome on first render.
Set `REMOTION_BROWSER=/path/to/chrome-headless-shell` to use one you already have.

```bash
cd motion-system
npm install
npm run validate                      # checks campaigns/tally-launch.json
npm run preview                       # storyboard frames + QA -> out/tally-launch/preview/contact_*.png
npm run render                        # 3 reference MP4s (one per format)
npm run render -- --matrix all        # all 18: 3 formats x 3 hooks x 2 CTAs
npm run studio                        # live preview in Remotion Studio
npm run seek-demo                     # the Canvas seek(t) demo -> out/seek-demo.mp4 (needs `npm i playwright`)
```

## The 25-second reference video
| Scene | Template | What it shows |
|---|---|---|
| 1 · 4s | `TitleScene` | Strong opening title (the **hook** variant), with words rising behind a mask |
| 2 · 8s | `UIScene` + `Dashboard` | Product UI: KPIs count up and the chart draws in. The cursor arcs to **Run forecast**, clicks, the forecast extends and a toast confirms. The camera pushes in. |
| 3 · 7s | `DataScene` | An **approved claim** as the headline, plus an animated bar chart from campaign data |
| 4 · 6s | `CTAScene` | Logo, product identity, the **CTA** variant, button and URL |

The demo brand, **Tally**, is a fictional cash-flow product. Its claims are marked as placeholders, and the validator warns about that until you replace them.

## Layout
| Path | Purpose |
|---|---|
| `campaigns/*.json` | Brand briefs: colours, logo, approved claims, hooks, CTAs, UI and chart data, scene timings |
| `src/schema.ts` | Zod schema for campaigns and video props |
| `src/timeline.ts` | One timeline shared by video, audio and QA |
| `src/scenes/` | The four reviewed scene templates |
| `src/components/` | `TextBox` (overflow guard), `WordRise`, `Logo`, `Button`, `Cursor`, `Dashboard` |
| `src/lib/` | Motion tokens (restrained springs), layout tokens per aspect ratio, theme, bundled fonts |
| `scripts/validate.ts` | Asset, text-length, claim and WCAG contrast checks |
| `scripts/preview.ts` | Key frames in debug mode, pixel QA, labelled contact sheets |
| `scripts/render.ts` | Batch render, MP4 inspection, posters, `manifest.json` |
| `scripts/audio.ts` | Original soundtrack synthesized from the timeline, normalised to -16 LUFS |
| `seek-demo/` | Canvas `seek(t)` page + Playwright→ffmpeg renderer |

## Design rules
Premium, restrained and typographic. No AI gradients, no glow, and no fake screenshots.
See `CLAUDE.md` for the rules the coding agent follows. The main one: templates are **reviewed and reusable**, and campaigns only configure them.
