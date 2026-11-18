---
name: gta-viral-clipper
description: Cut viral 9:16 GTA / gaming Shorts & Reels in 4K 60fps with a realistic look, a 5-second hook teaser, captions and a Hinglish post kit, from a YouTube link or original MP4, using the in-repo gta6-clipper tool. Use when the user gives a GTA/gaming video and wants viral clips.
---

# GTA viral clipper — 4K 60fps (in-repo)

Tool: `gta6-clipper/clipper.py` in this repo. Reply to the user in simple Hinglish.

**Defaults now:** 2160x3840 (4K 9:16), 60 fps (motion-interpolated if source is 24/30), `--look real`
(light contrast + CAS sharpen, no cartoon filters), lanczos scaling, H.264 high bitrate (YouTube-style GOP),
hook text for the first 5 s, optional teaser.

## Setup (once per session / per computer)
`cd gta6-clipper && bash install.sh base`

## Source quality (important)
- Best: a **YouTube link** — fetch pulls the highest res + highest fps (up to 4K60).
  YouTube is often blocked in cloud sessions (proxy 403 / "not a bot"); then run the tool on the
  user's own PC (WSL/Linux/Mac) or ask for the **original** file.
- Never use WhatsApp-forwarded video (compressed to ~480p). Ask for the original via Google Drive,
  or WhatsApp "Document" (not Video). If fetch prints `WARNING: source is only ...p`, tell the user
  the 4K output is upscaled, not true 4K detail.

## Workflow
1. Fetch: `python3 clipper.py fetch <youtube-url-or-mp4> -o work/<name>` (add `--cookies cookies.txt` for bot-check).
2. Analyze: long video `-n 10 --min-len 20 --max-len 45`; under 3 min `-n 4 --min-len 12 --max-len 30`.
   Read `work/<name>/candidates.md`, view `thumbs/*.jpg`, and a timeline sheet:
   `ffmpeg -i work/<name>/source.mp4 -vf "fps=1/3,scale=320:-1,tile=5x6" -frames:v 1 work/<name>/timeline.jpg` (tile i = second 3*i).
3. Pick the BEST moments: strongest action/visual, clear payoff, skip ESRB/intro/logo/subscribe, non-overlapping.
4. For every clip choose a **teaser**: the single most shocking 3–5 s moment *inside or near* the clip.
   It plays first with the hook text, then the full reel plays. Write `work/<name>/clips.json`:
```json
[{"start": 45.0, "end": 60.0, "teaser": [52.0, 56.0], "mode": "track",
  "hook": "FLORIDA PAGAL HAI",
  "title": "GTA 6 mein Florida wale crazy log",
  "description": "Sabse funny moment kaunsa laga? Comment karo 👇",
  "hashtags": "#gta6 #gtavi #rockstargames #shorts"}]
```
   - `mode`: `track` trailer/cinematic, `blur` gameplay with HUD, `fill` static centre.
   - Hook: 2–5 words, ALL CAPS, curiosity/shock, Hinglish, no emoji (font can't draw them).
   - Without `teaser`, the hook just shows on the first 5 s (`--hook-secs`).
   - Optional `main_hook`: text shown on the full-reel part.
5. Render (4K60 is the default):
   `python3 clipper.py render work/<name> --plan work/<name>/clips.json`
   - Flags: `--res 4k|1440|1080`, `--fps 60|30`, `--look real|vivid|none`, `--no-interp`,
     `--teaser-max 5`, `--crf 17`, `--preset medium`, `--lang hi --model small`, `--no-captions`.
   - 4K60 with interpolation is slow (~4–5 min per 20 s clip on 4 CPUs). For a quick preview use
     `--res 1080` first, then final in 4K.
6. Check: hstack frames at 1 s, ~5 s and middle of 1–2 clips; confirm hook, crop, teaser cut.
   Then send the mp4s + `post_kit.md`.

## Posting tips to share
- YouTube Shorts keeps 4K; Instagram/Reels shows max 1080x1920 (still upload the 4K file — it downsizes cleanly).
- Upload from the original file (Drive/PC), not via WhatsApp. 1–2 clips per day, "GTA 6" first in title.
- Official trailers / other creators' videos can get Content ID claims: add own voice/reaction.
- Never upload anywhere without the user's ok. `work/` is git-ignored.
