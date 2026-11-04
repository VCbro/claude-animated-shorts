# Meter zero tha. Par density? (petrol quality check)

A 56 s Hinglish dark-3D explainer reel (1080x1920, 30 fps), made with the `viral-explainer-short` skill.
The voice is Kokoro `hm_psi` (offline). Facts and sources are in `SCRIPT.md`.

## Rebuild
```bash
npm install
bash tools/get_models.sh          # offline Hindi voices (Kokoro + piper) from GitHub releases
bash tools/render.sh              # voice → cues → sound → render → QA  → out/final.mp4
node tools/stills.mjs out/s_ 60,300,600 0.5   # quick look checks
```

## Files
| File | What it is |
|---|---|
| `script.json` | voice lines: Devanagari `tts`, Roman `cap`, lime `hl`, red `red`, pause `gap` |
| `src/story.tsx` | the shots (one component per shot, each tied to a word) + channel info + sound cues |
| `src/kit/*` | reusable look: theme, captions, HUD, camera, phone UI, map, chips, stamps, counters, end card |
| `src/three/Studio.tsx` | real 3D product-shot studio + 3D phone / QR standee |
| `tools/voice.py` | TTS (piper / sarvam / eleven / your own files) → voice.wav + timeline.json |
| `tools/audio.py` | synthesized tension bed + SFX + ducking → public/mix.wav at -14 LUFS |
| `tools/cues.mjs`, `tools/stills.mjs`, `tools/render.sh`, `tools/qa.sh` | cue export, stills, full render, QA |

Sources: see SCRIPT.md.
