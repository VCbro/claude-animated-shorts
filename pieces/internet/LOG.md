# LOG: a short history of the internet

## Run 1 (2026-11-07)
- **Script:** the first take ran 56 s, because spoken years are long. I tightened it to 91 words, about 47 s.
- **Build bugs:** palettes were used before they were defined (scenes.js loads before bridges.js), so I moved them into scenes.js. I also forgot `piece.json` at first, and the build fell back to cut-paper.
- **Look fixes:** 1969 was crowded at 54×96, so I removed the labels and used captions instead. The 2007 finger ran the full height of the frame. Captions on fine eras were tiny, so they now render at 135×240 at most. In 1971 the hero overlapped a cabinet.
- **Review, first pass:** story arc FAIL (2/4). The journey median was −39 dB because short chip notes leave silence, and the tail didn't decay. Fixes: a pad bed under each era, a softer tail pad.
- **Missed by the text check:** the pixel caption "UCLA > STANFORD" was 95 px wide on a 90 px frame and clipped at both edges. The text check only traces system-font text, not `pixText`. Now "TO STANFORD". Proposed rule: check a pixel caption's width against the caption's resolution.
- **Final review:** morphs PASS (7, on the grid), narration PASS, story arc PASS (4/4), text PASS. Loudest moment at 42.3 s (−8.8 dBFS) after 0.9 s of silence; mix −13.9 LUFS, true peak −1.5 dBFS. DEAD BEATS WARN: 1.75–6.0 s, while LOGIN types and before the letters fly.
