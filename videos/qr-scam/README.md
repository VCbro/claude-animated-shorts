# QR scan karte hi paise gaye (demo reel)

A 33 s Hinglish dark-3D explainer reel (1080x1920, 30 fps), made with the `viral-explainer-short` skill.
This folder is also the skill's template: copy it, then change `script.json` and `src/story.tsx`.

## Rebuild
```bash
npm install
bash tools/get_models.sh          # offline Hindi voice (piper rohan) from GitHub releases
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

Sources for the demo facts: NPCI and banks' public advisories say a UPI PIN is never needed to *receive* money, and
1930 is the National Cyber Crime Helpline (cybercrime.gov.in).
