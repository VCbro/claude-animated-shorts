# Motion system: rules for the coding agent

This folder turns a **campaign JSON** (brand brief) into finished product motion videos.
Remotion + React for the compositions; one shared timeline drives picture, sound and QA.

## Hard rules
1. **Brand data lives only in `campaigns/*.json` and `public/brands/<brand>/`.** Never hard-code copy, colours or numbers in `src/`.
2. **Templates are reviewed and locked.** `src/scenes/*` and `src/components/*` are the template library.
   For a new campaign, *configure* them through JSON. Do not redesign them per campaign.
   A template change is its own task: change it, re-run preview on **every** campaign, and review the contact sheets.
3. **Every frame is a pure function of the frame number.** Use `useCurrentFrame()`, `spring()` and `interpolate()`.
   No `Math.random()`, `Date.now()`, CSS transitions/animations, or `setTimeout` in compositions.
4. **Restrained motion.** Springs come from `src/lib/motion.ts` (`calm`, `soft`). No bounce, wobble, glow, or generic AI gradients.
5. **No unapproved claims.** Any number in hooks, CTAs or the toast must appear in `approvedClaims`. The validator enforces this.
6. **No fake screenshots.** Product UI is rebuilt from components with the client's real (or clearly fictional) data.
7. **Never call a video done until the real output has been inspected.** That means the preview contact sheets, plus the post-render checks on the decoded MP4 frames in `manifest.json`.

## Workflow
```bash
npm run validate -- campaigns/<id>.json   # schema, assets, text lengths, claims, contrast
npm run preview  -- campaigns/<id>.json   # key frames in debug mode + QA + contact sheets (out/<id>/preview)
#   -> look at out/<id>/preview/contact_*.png yourself before going on
npm run render   -- campaigns/<id>.json   # reference: 1 video per format
npm run render   -- campaigns/<id>.json --matrix all   # every format x hook x CTA
```
Outputs: `out/<id>/delivery/<format>/*.mp4`, posters, `review/` contact sheets, and `manifest.json` (sha256, duration, QA per file).

## Adding a campaign
1. Put the logo (SVG or PNG) in `public/brands/<brand>/`.
2. Copy `campaigns/tally-launch.json` to `campaigns/<id>.json` and edit the copy, colours, claims, KPIs and chart data.
3. Run validate, then preview, then inspect the sheets, then render.

## QA mechanics
- `TextBox` measures its own layout. If text needs more lines than budgeted, or a word is wider than the box, debug renders outline it in **#FF00FF**.
  `preview` counts magenta pixels in each frame.
- `preview` also flags content inside the outer 2.5% edge band (crop risk) and near-blank frames.
- `render` re-checks the encoded MP4: audio stream present, duration correct, and pixel checks on decoded frames.
