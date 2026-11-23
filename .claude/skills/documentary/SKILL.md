---
name: documentary
description: Make a premium YouTube documentary (2D motion graphics in 5 themes, or 3D realistic with sky, ocean and film grade) (3-6 min, 1920x1080, 60 fps) in Hindi and/or English from the user's narration MP3, with word-synced captions, animated diagrams, labels, counters, chapter cards, a synthesized soundtrack, thumbnails and the YouTube title/description/tags. Use when the user types /documentary, or asks for a documentary / explainer film about a machine, place, mission or event (e.g. Chenab bridge, INS Vikrant, Chandrayaan-3, how trains work).
---

# /documentary: premium documentary (2D themes or 3D realistic)

Proven on: INS Vikrant (Hindi + English, 4:56 / 5:08), Chenab Bridge, Chandrayaan-3, Rail ka Jadu (4:08).
Every scene is a pure function of time drawn on a canvas in headless Chromium, so Hindi text shapes correctly,
renders are exactly repeatable and any frame can be checked on its own.

`template/` is the starting project. `examples/` holds a complete real film (INS Vikrant): its script, anchors,
`film.js` and soundtrack. Read `examples/vikrant_film.js` before writing a new film; copy its patterns.

## 0. Setup (once per machine)
```bash
cp -r ~/.claude/skills/documentary/template  my-film && cd my-film
npm install                       # fonts: Baloo 2 (Devanagari) + Montserrat
pip install -r requirements.txt   # playwright, faster-whisper, numpy, scipy
python3 -m playwright install chromium   # skip if Chromium is already there (or set CHROME_PATH)
```
ffmpeg must be on PATH. Set `CHROME_PATH` to use a specific Chromium.

## Choose the look first (ask the user only if the topic doesn't make it obvious)
Two engines, same pipeline (script → MP3 → Whisper timing → anchors → film → stills → sound → render):

| Mode | Folder | Best for |
|---|---|---|
| **2D motion graphics** | `template/` | Machines, maps, timelines, numbers, how-it-works. Fast (~0.1 s/frame) |
| **3D realistic** | `template-3d/` | Ships, aircraft, bridges, rockets, buildings, landscapes: anything that should feel "real" |

**2D themes:** write the name in `out/theme.txt` (see `web/themes.js`).
- `night`: deep navy with gold and cyan. The default, for defence, engineering and space.
- `cinematic`: warm/teal film grade, 2.2:1 letterbox, serif titles, more grain. For emotional and story-led films.
- `archive`: sepia film with grain and flicker, and serif type. For history and freedom-struggle films.
- `neon`: black with a magenta/cyan glow. For tech, AI, space and gaming.
- `news`: red caption box and white labels. For "breaking" explainers and current events.

A theme changes the backdrop (`studio()`), a colour grade of the canvas, grain, vignette, letterbox and every
caption/label/title style. `film.js` doesn't change, so you can test the same film in all 5 themes and pick the best.

**3D realistic** (`template-3d/`, three.js): `engine3d.js` gives a physical sky with sun (`setSky({elevation, azimuth,
turbidity, exposure...})` for dawn, noon, sunset or storm), a reflective ocean with a procedural normal map (no downloads),
sun shadows that follow the hero (`sunFollow`), bloom, and a film grade with warm highlights, teal shadows, grain,
vignette and a 2.2:1 letterbox. It also has `shot(t, keys, shake)` camera moves with a slight handheld drift, and DOM `text()` /
`label(txt, point3D, dx, dy, a, sub)` / captions, so Hindi shapes correctly. `web/film.js` is a complete example: a 262 m
carrier built from code (tapered hull with red boot-top, flight deck with ski-jump and markings, island, mast, radar,
parked jets, wake) with 3 shots: a low hero dolly with the title, an aerial reveal with labels, and a jet launch.
Rules for 3D: build the subject from code with real proportions; one slow, motivated camera move per line;
low angles near the water look big; light from a low sun (elevation 3-8°) looks cinematic; check every shot as a still.
Speed is about 2-5 s per frame with software WebGL, so render the 60 fps film overnight or at 30 fps (`--fps 30`).
Setup is the same as for the 2D template (`npm install`, which includes three.js).

## 1. Topic and script (before any MP3)
- Pick ONE strong, viral topic with a hook (a number, a mystery, a "how is this possible?"). Don't hand the user a long list.
- Research the facts; use only numbers you can source. Round them the way a narrator says them.
- Write the script in chapters: hook (≈45 s, ends with a question), 4-5 chapters with a spoken title each
  ("एक नाम, जो लौट आया।"), ending (callback to the hook + title line), CTA (a comment question).
- Mark emotion for ElevenLabs **v3** with square-bracket tags: `[whispers]`, `[tense]`, `[awed]`, `[proud]`, `[curious]`.
  They aren't spoken. Write numbers as words the narrator should say ("ढाई सौ", "two hundred and fifty").
- Give the user the script in a code block, and tell them which model and voice to use (Eleven v3 and a deep documentary voice).
- Save the tag-free script as `deliver/script_hi.txt` (or `script_en.txt`). It must match the audio word for word.

## 2. Timing from the MP3
```bash
ffmpeg -i <user mp3> voice/voice.mp3 ; ffmpeg -i voice/voice.mp3 -ar 16000 -ac 1 voice/v16.wav
VLANG=hi python3 tools/transcribe.py            # faster-whisper medium -> voice/whisper.json
VLANG=hi python3 tools/patch_probe.py 0 35 voice/patch_1.json   # re-transcribe any garbled span (7 s windows)
```
Whisper often garbles the first 20-30 s and long sentences: compare `whisper.json` with the script and patch those spans.
Then write `anchors.txt` (`name | first 2-4 words of the phrase`, in story order) and run
`VLANG=hi python3 tools/align.py`. That writes `out/anchors.json` (every anchor time + END), `out/captions.json` and `deliver/film_hi.srt`.
The alignment is fuzzy, so spelling differences don't matter ("619/676 matched" is normal). Interpolated words still get captions.
Check that every anchor time is increasing and that each one lands where the phrase is spoken.

## 3. The film (`web/film.js`)
One `add(a, b, draw)` per beat; times from anchors `A('c2_size')`. Engine API (`web/engine.js`):
- time: `R(t,a,d)` ramp, `win(t,a,b,f)` window, `eio/eob/ss` easings, `rnd(i)` deterministic noise
- camera: `cam(x,y,z)`, `camKeys(t,[[t,x,y,z],...])`, `screen()` back to pixel space, `scr(x,y)` world→screen
- draw: `studio()`, `fillRR`, `lin/rad` gradients, `line(pts,col,w,glow)`, `glowDot`, `flow(pts,t,col,{speed,gap,r,a})`, `arrow`, `sine`, `panel`
- DOM text (shaped Hindi): `text(html,x,y,{size,cls:'ttl'|'big',color,a})`, `label(text,wx,wy,dx,dy,a,sub)` with leader line, `chapter(t,a,n,title)`
- Captions are automatic (word highlight, from `out/captions.json`).

Style rules that made these films look premium:
- One clear hero drawing per chapter (carrier side-view, bridge arch, rocket) built from gradients, not clip-art.
  Reuse it across scenes with options (sepia for history, cutaway for inside, highlight for one part).
- Every number the narrator says appears on screen as a counter (`bigNum`, counts up with `eio`) or a chip.
- Labels with leader lines point at the exact part as it's named; at most 2 on screen.
- Keep the top-centre text away from tall parts of the drawing (masts, towers): put it left or higher.
- Mood through sky and sea gradients (dawn / night / storm), slow camera moves, grain and vignette.
- Chapter cards on each spoken chapter title. End with title + tricolour bar + CTA chip.

Bilingual: write every on-screen string as `L('हिंदी', 'English')` and read the language from `out/lang.txt`.
For the English film, copy the project to `<name>_en/` (don't touch `out/` of a running render), write
`deliver/script_en.txt`, run transcribe/align with `VLANG=en`, put `en` in `out/lang.txt`. The animation is the same; only
timing, captions and text change. If the user has no English MP3, Kokoro TTS (`kokoro-onnx`, voice `bm_george`)
can make one offline. Generate it line by line so the anchor times are exact.

## 4. Check stills before rendering
`PORT=8850 python3 tools/capture.py stills 3,25,60,...` → `out/stills/`. Make contact sheets with ffmpeg `xstack`
and look at every chapter: overlaps, text on top of the drawing, empty frames, tiny subjects. Fix, then repeat.

## 5. Sound
Adapt `tools/audio_example.py` (numpy only): ambience bed, SFX on anchors (whooshes on chapter cuts, booms on reveals,
ticks on counters), a soft score with a flute line, and the narrator on top with ducking. It writes `audio/mix.wav`.

## 6. Render
`bash tools/render1080.sh` runs 3 parallel captures at 60 fps (resumable), then H.264 CRF 18 with maxrate 12M and -14 LUFS.
That's about 200 MB for 5 minutes, under the 500 MB chat-upload limit.
- Every parallel capture needs its own `PORT` (render1080 uses PORT..PORT+2). Two projects at once → different bases.
- `out/frames` for 5 min is ~4 GB: delete it after the MP4 is checked.
- 4K: pass `--dpr 2` to capture, but the file goes over 500 MB. Offer 1080p60.

## 7. Deliverables
- `deliver/film.mp4`, plus `film_<lang>.srt` for YouTube subtitles.
- Thumbnails: `tools/thumbs.py` grabs clean frames (UI hidden) and composes 3 options with big Hindi/English text.
- `deliver/youtube.txt`: 3 titles, description with emoji bullets, chapters (first chapter at 0:00 and at least 10 s long),
  comma-separated tags, hashtags. For two languages, give both blocks and tell the user to upload two separate videos
  (set "Video language" correctly, link them in the descriptions). Most channels don't have the multi-language audio feature.

## Gotchas
- `letter-spacing` breaks Devanagari conjuncts: use it only on Latin text.
- `-x ** 2` is a JS syntax error: write `-(x ** 2)`.
- Danda (।) and nukta differences are normalised by align.py; keep them in the script.
- Commit `film.js`, `anchors.txt`, the scripts and patches. Don't commit frames, wavs or MP4s.
