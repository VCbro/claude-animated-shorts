# LOG: how DNS works

## Run 1 (2026-11-07)
- **Intake:** narrated, 9:16 (the user first asked for 16:9, then confirmed 9:16), math style, pi hero, composed score. The ElevenLabs connector isn't connected, so the voice is Kokoro `af_heart` (local), picked from 3 samples.
- **Setup fixes:** faster-whisper 1.2.1 fails with PyAV 19 (`metadata_errors` argument), so I pinned `av<16`. Hugging Face model downloads also need the host `us.aws.cdn.hf.co`.
- **Look:** the system fonts here have no reliable `→` glyph (it rendered as a dash), so the arrow is drawn as a stroke (`arrowTex`). Proposed rule for craft.md: draw arrows, never type them.
- **Bug caught on the stills:** `runS(t0, d)` with a negative `d` returns 1 before `t0`, which put the growing root circle on screen from frame 0. Durations are now clamped with `Math.max(0.35, ...)`.
- **Storyboard:** panel 3 originally fell inside the morph window (a blank frame), so I moved it to `left + 0.35`.
