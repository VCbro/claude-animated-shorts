---
name: gta-viral-clipper
description: Cut viral 9:16 GTA / gaming Shorts & Reels (hook title, captions, Hinglish post kit) from a YouTube link or MP4 using the in-repo gta6-clipper tool. Use when the user gives a GTA/gaming video and wants viral clips.
---

# GTA viral clipper (in-repo)

Tool lives in `gta6-clipper/` of this repo. Reply to the user in simple Hinglish.

## Setup (once per session)
`cd gta6-clipper && bash install.sh base` (ffmpeg, yt-dlp, faster-whisper, sherpa-onnx, OpenCV, speech model).

## Workflow
1. Fetch: `python3 clipper.py fetch <youtube-url-or-mp4> -o work/<name>`
   - YouTube "Sign in to confirm you're not a bot" -> ask for the MP4 or `--cookies cookies.txt`.
2. Analyze: long video `-n 10 --min-len 20 --max-len 45`; under 3 min `-n 4 --min-len 12 --max-len 30`:
   `python3 clipper.py analyze work/<name> -n 10 --min-len 20 --max-len 45`
   - Read `work/<name>/candidates.md`, view `thumbs/*.jpg`, and a timeline sheet:
     `ffmpeg -i work/<name>/source.mp4 -vf "fps=1/3,scale=320:-1,tile=5x6" -frames:v 1 work/<name>/timeline.jpg` (tile i = second 3*i).
3. Pick moments: strong first 3 s, clear payoff, skip ESRB/intro/logo/subscribe, non-overlapping.
4. Write `work/<name>/clips.json` (list of `{start,end,mode,hook,title,description,hashtags}`).
   - `mode`: `blur` gameplay with HUD, `track` trailer/cinematic, `fill` static centre.
   - Hook: max ~5 words, ALL CAPS, curiosity/shock, Hinglish. Avoid emoji in hooks (font may not render).
   - Description ends with a question to drive comments.
5. Render: `python3 clipper.py render work/<name> --plan work/<name>/clips.json`
   (flags: `--hook-secs 4`, `--lang hi --model small` for Hindi commentary, `--no-captions`).
6. Check: hstack the cover jpgs in `work/<name>/clips/` and look at them; then send the mp4s + `post_kit.md` to the user.

## Viral tips to share
- Post 1-2 clips per day, first 1 s must move; titles with "GTA 6" up front.
- Official trailers/other creators' videos can get Content ID claims: add own voice/reaction for originality.
- Never upload anywhere without the user's ok. `work/` is git-ignored (large files).
