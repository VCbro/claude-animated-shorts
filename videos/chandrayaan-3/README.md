# doc2d — premium 2D motion-graphics documentary (Hindi)

Proven on `videos/rail-ka-jadu` (4 min 8 s, 1920x1080, 60 fps, rendered in ~25 min on 4 CPU cores).
Canvas scenes are pure functions of time; Chromium draws each frame, so Hindi text is shaped correctly and
renders are fast and exactly repeatable.

## Steps
1. `cp -r templates/doc2d videos/<name>`; `cd videos/<name>`; `ln -s ../water-motor/node_modules node_modules`
2. Put the narration at `voice/voice.mp3` and the exact script at `deliver/script_hi.txt`
   (include any chapter headings the narrator read aloud).
3. Word times: `ffmpeg -i voice/voice.mp3 -ar 16000 -ac 1 voice/v16.wav`, then
   `HF_HUB_DISABLE_XET=1 /home/user/fwenv/bin/python tools/transcribe.py` (faster-whisper medium, ~real time).
   If Whisper skips a stretch (it happens), re-transcribe that span alone and save it as
   `voice/patch_<n>.json` = `{"from": t0, "to": t1, "words": [{"w","t0","t1"}...]}`.
4. Write `anchors.txt` (`name | exact phrase`, story order), then `python3 tools/align.py`
   -> `out/anchors.json`, `out/captions.json`, `deliver/film_hi.srt`. It aligns the script to Whisper with
   fuzzy Needleman-Wunsch (rail film: 643/654 words matched) so captions keep the script's spelling.
5. Write `web/film.js`: one `add(a, b, draw)` per beat, times from `A('anchor')`. Engine API (`web/engine.js`):
   - time: `R(t, a, d)` ramp, `win(t, a, b, f)` window, `eio/eob/ss` easings, `rnd(i)` deterministic noise
   - camera: `cam(x, y, z)`, `camKeys(t, [[t, x, y, z]...])`, `screen()` back to pixels, `scr(x, y)` world->screen
   - draw: `studio()` background, `fillRR`, `lin/rad` gradients, `line(pts, col, w, glow)`, `glowDot`,
     `flow(pts, t, col, {speed, gap, r, a})` particles, `arrow`, `sine`, `panel`
   - text (DOM, shaped Hindi): `text(html, x, y, {size, cls:'ttl'|'big', color, a, scale})`,
     `label(text, wx, wy, dx, dy, a, sub)` with leader line, `chapter(t, a, n, title)`
   - draw panels/text in screen space: call `screen()` first, or they move with the camera.
6. Stills: `PORT=8794 python3 tools/capture.py stills 2,30,61` -> `out/stills/`. Check them; fix; repeat.
7. Frames: `python3 tools/capture.py frames --fps 60` (resumable, ~0.09 s/frame).
8. Sound: adapt `tools/audio_example.py` (bed + SFX on anchors + ducked narration) -> `audio/mix.wav`.
9. `bash tools/finalize.sh` -> `deliver/film.mp4` (-14 LUFS). Shorts: see `videos/rail-ka-jadu/tools/shorts.sh`.

## Gotchas
- Two captures at once need different `PORT`s, or the second page is served by the first project's server.
- `letter-spacing` breaks Devanagari conjuncts: use it only on Latin text.
- 3-digit hex colours are expanded by `glowDot`; gradients elsewhere want 6-digit hex.
