# LOG: how DNS works

## Run 1 (2026-11-07)
- **Intake:** narrated, 9:16 (the user first asked for 16:9, then confirmed 9:16), math style, pi hero, composed score. The ElevenLabs connector isn't connected, so the voice is Kokoro `af_heart` (local), picked from 3 samples.
- **Setup fixes:** faster-whisper 1.2.1 fails with PyAV 19 (`metadata_errors` argument), so I pinned `av<16`. Hugging Face model downloads also need the host `us.aws.cdn.hf.co`.
- **Look:** the system fonts here have no reliable `→` glyph (it rendered as a dash), so the arrow is drawn as a stroke (`arrowTex`). Proposed rule for craft.md: draw arrows, never type them.
- **Bug caught on the stills:** `runS(t0, d)` with a negative `d` returns 1 before `t0`, which put the growing root circle on screen from frame 0. Durations are now clamped with `Math.max(0.35, ...)`.
- **Storyboard:** panel 3 originally fell inside the morph window (a blank frame), so I moved it to `left + 0.35`.

## Run 1: review
- **First export:** 3 failures. Narration lines 4 and 10 ran over 3.5 words/s. The `?` and the address overlapped for 2 frames during the swap. The closing music didn't decay (−17.1 vs a gift median of −15.8). Fixes: re-voiced the 2 lines at speed 0.78 and 0.85; the `?` now fades out before the address is written; the closing pad is down to 0.009. The piece is now 45.0 s.
- **Final review:** cuts PASS, morphs PASS (14.75 s, 35.25 s), narration PASS (115 words), story arc PASS (4/4), text PASS. Loudest moment at 28.0 s (−8.6 dBFS) after 1.0 s of silence; mix −14.1 LUFS, true peak −1.5 dBFS.
- **Open warning:** DEAD BEATS (5 stretches of 4.5–7.5 s). Math holds are still while the voice explains. Weakest stretch: 0.5–8 s (address bar, then `?`, before the resolver appears). Possible fix: draw the device's own question on the laptop screen, and give the servers a working arc while they "think".

| shot | what | result |
|---|---|---|
| 1 ask | name, `?`, resolver, read right to left, `.` → root | PASS (slow open, see the warning) |
| 2 chain | 3 hops, 2 referrals, silence, answer, back to device | PASS |
| 3 cache | TTL counting down, asked again, 0 hops | PASS |

## Run 2 (user asked for suggestions 1, 2, 9 and 12)
- **Done:** the device's screen types the name and pulses `?.?.?.?` (1); servers show a working arc and glow while they speak (2); the root and .com servers speak in a second voice, Kokoro `am_michael` (9); a 16:9 layout from the same piece, with servers as a staircase (12). Length is now 46.5 s.
- **Sound:** after the second voice went in, the loudest moment moved away from the hit, and later the silence act's last window caught the hit's attack. The post-hit chord now ends before the "back" line, the hop plucks are quieter, and the silence act ends 0.125 s before the hit.
- **Review (both formats):** cuts, morphs, narration (116 words), story arc 4/4 and text all PASS. Loudest moment at 29.8 s (−9.1 dBFS) after 1.0 s of silence; mix −14.2 LUFS, true peak −1.5 dBFS.
- **Still open:** DEAD BEATS warns on 5 stretches. The added motion (arcs, glows, the pulsing `?`) is too small to move the whole-frame change measure. Fixing it would take bigger changes, such as a push-in or a scene change per beat.
