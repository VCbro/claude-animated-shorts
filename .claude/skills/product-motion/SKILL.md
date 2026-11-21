---
name: product-motion
description: Make premium product motion videos (launch videos, product UI demos, feature reveals, data or claim videos, CTAs) from a campaign JSON brief, in 16:9, 1:1 and 9:16, with hook and CTA variants. Use when the user asks for a product video, launch motion package, SaaS or dashboard animation, motion ad variants, or "use the motion system".
---

# Product motion system

The system lives in `motion-system/`. Read `motion-system/CLAUDE.md` first. It holds the hard rules.

## Steps
1. **Brief.** Get the product name, logo (SVG or PNG), colours, **approved claims with sources**, 2–3 hooks, 1–2 CTAs, the UI data (KPIs and a series) and the chart data.
   Never invent claims or numbers. If you need placeholders, label them as fictional.
2. **Campaign.** Put the logo in `motion-system/public/brands/<brand>/`. Copy `campaigns/tally-launch.json` to `campaigns/<id>.json` and fill it in.
3. `npm run validate -- campaigns/<id>.json`. Fix every error.
4. `npm run preview -- campaigns/<id>.json`. Open `out/<id>/preview/contact_*.png` and look at every frame yourself
   (hierarchy, spacing, legibility, anything cropped), not only the automated QA.
5. Show the user the contact sheets as the storyboard. Get approval before batch rendering.
6. `npm run render -- campaigns/<id>.json` for the reference set, or `--matrix all` for every format × hook × CTA.
7. Pull frames from the real MP4s with ffmpeg and look at them. Then report using `out/<id>/delivery/manifest.json`.

## Rules
- Configure the templates. Never redesign them per campaign. Changing a template is a separate, reviewed task.
- Motion must be frame-driven and deterministic, with the restrained springs from `src/lib/motion.ts`.
- No AI gradients, no glow, and no fake product screenshots.
- A video is done only once the rendered output has been inspected.
