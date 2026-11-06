# Animate skill: install, use, and demo

Source: https://github.com/cth9191/animate (MIT). It's a Claude Code skill that draws short videos procedurally on one `<canvas>`, writes the score in code, and renders to MP4 with headless Chromium and ffmpeg.

## 1. Requirements

| need | check |
|---|---|
| Node 18+ | `node -v` |
| Playwright + Chromium | `npm i -g playwright && npx playwright install chromium` |
| ffmpeg on PATH | `ffmpeg -version` |
| (voice-over only) Python `faster-whisper` | `pip install faster-whisper` |
| (voice-over only, optional) ElevenLabs connector | Claude → Settings → Connectors |

## 2. Install

Option A, as a plugin (inside Claude Code):

```
/plugin marketplace add cth9191/animate
/plugin install animate@animate
```

Option B, by hand:

```bash
git clone --depth 1 https://github.com/cth9191/animate /tmp/animate
mkdir -p ~/.claude/skills
cp -r /tmp/animate/plugins/animate/skills/animate ~/.claude/skills/animate
```

Restart Claude Code (or start a new session) and `/animate` appears in the skill list.

## 3. Make a video with the skill

```
/animate a 45-second history of the bicycle, cut paper
/animate how a hash map works, in the math style
/animate a narrated 45s explainer of how DNS works, math style, 16:9
```

The skill walks you through:

1. **Intake**: subject, formats, voice, style, music.
2. **Story check**: you approve a numbered beat table.
3. **Look check**: you approve 2–4 style frames.
4. **Storyboard**: you approve one key frame per beat.
5. **Build + render**: it animates, exports, and runs its review checks.
6. **Delivery**: you get the MP4 and the measured checks.

Styles: `cut-paper`, `crosshatch`, `riso`, `sketchbook`, `math`, `pixel`, `isometric`, or a new style made from your reference images.

## 4. Run the tools yourself (what this demo did)

```bash
S=~/.claude/skills/animate
cp -r $S/examples/history-of-ai pieces/                 # a ready-made 60 s cut-paper piece
node $S/tools/build.mjs  pieces/history-of-ai            # -> pieces/history-of-ai/index.html
node $S/tools/export.mjs pieces/history-of-ai --share    # frames + score -> renders/final.mp4, share.mp4
node $S/tools/review.mjs pieces/history-of-ai            # loudness, text, anchor and dead-beat checks
```

Other formats: `--formats 9:16,1:1,16:9`. Preview any frame by opening `index.html?t=12.5` in a browser.

To start your own piece, copy `$S/templates/piece/` to `pieces/<name>/`, set `"style"` in `piece.json`, and edit `src/scenes.js` and `src/score.js`.

## 5. Demo result

`pieces/history-of-ai/renders/share.mp4` is 1080×1920, 60 s, H.264 + AAC, about 29 MB.

- Export took about 7 minutes on 4 CPUs: 80 s for frames, the rest for audio and stems.
- Review: story arc PASS (4/4), anchor PASS (100%), text PASS, dead beats PASS, loudness −15.0 LUFS, true peak −1.0 dBFS.

Large intermediates (`frames/`, `final.mp4`, `*.wav`) aren't committed. Run the export command again to regenerate them.
