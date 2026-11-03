# जादुई जंगल का रहस्य – एक छोटी सी दोस्ती

An 88-second Hindi 3D cartoon short made with the `cartoon-3d-short` skill. It has two versions:
`JaduiJungle` (16:9, 1920x1080) and `JaduiJungleShorts` (9:16, 1080x1920, for YouTube Shorts), both 30 fps.
three.js + @react-three/fiber inside Remotion. Chintu, Sheru, the magic tree and the other characters are
2D Canvas cards in a 3D forest.

The rendered film isn't in git because it's too big (~245 MB). Rebuild it with the steps below.

## Rebuild

```bash
npm install
pip install numpy scipy soundfile espeakng_loader onnxruntime
# neural Hindi voices (Piper, from the sherpa-onnx model releases)
mkdir -p models && for m in pratham rohan priyamvada; do
  curl -sL https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-hi_IN-$m-medium.tar.bz2 | tar xj -C models; done

python3 tools/make_voice.py      # Hindi voice -> voice/voice.wav, voice/lines.json, src/lines.ts (subtitle timings)
python3 tools/audio.py           # music + SFX + voice mix -> audio/mix.wav
bash tools/render_chunks.sh      # renders 8 chunks to out/chunks/ (skips ones already done)
bash tools/finalize.sh           # joins chunks, adds audio -> out/final.mp4, then runs QA
# vertical Shorts version
COMP=JaduiJungleShorts OUT=out/chunks_v bash tools/render_chunks.sh
OUT=out/chunks_v FINAL=out/final_shorts.mp4 bash tools/finalize.sh
```

- `CHROME_PATH` sets the Chromium / headless-shell binary. The default is the Playwright one in `/opt/pw-browsers`.
- Speed: about 3.5 s per frame on 4 CPU cores with no GPU (software GL), so about 2.5 h for the whole film.
- Stills for checking the look: `node tools/stills.mjs out/x_ 300,1200,2000 0.5`. Add `COMP=JaduiJungleShorts` for the vertical version.
- The vertical version uses the same cameras with a wider lens. `vertCam` and the per-shot nudges in `VSHOT` are in `story.ts`, and the overlays rearrange themselves for 9:16.

## Files

| File | What it holds |
| --- | --- |
| `SCRIPT.md` | Scene table |
| `tools/make_voice.py` | Lines, speakers, start times, voice settings |
| `src/jungle/story.ts` | Layout, timing, acting, the 18 camera shots |
| `src/jungle/world.ts` | Sky, ground, trees, river, magic tree, flowers, posing every frame |
| `src/jungle/chars.ts` | How Chintu, Sheru, the tree face, the bird and the animals are drawn |
| `src/jungle/Film.tsx` | Post effects (ink, bloom, grade), title, subtitles, moral, end card |
| `tools/audio.py` | Synthesized score, sound effects, ducking, loudness |

## Voice

The voices are Piper VITS neural Hindi models run with onnxruntime (`tools/piper_tts.py`). espeak-ng only turns the
text into phonemes.

| Part | Voice |
| --- | --- |
| Narrator | Rohan |
| Chintu | Priyamvada, pitched up to sound like a child |
| Sheru | Priyamvada, pitched up further and faster |
| Magic Tree | Pratham, deep and slow, with reverb |

Casting is in `VOICES` in `tools/make_voice.py`. Piper gives no word timings, so `word_times()` maps each phrase onto
the pauses in the audio and spreads its words over that span.

The model adds random variation, so line lengths change a little on every run. After a rerun, check for
`!! overlaps next line`, and always rebuild the mix and re-render. The old espeak version is `tools/make_voice_espeak.py`.

To use a real recording instead: put one wav per line in the order of `LINES`, load those instead of calling
`render()`, fix the word times, then rerun `audio.py`, the render and `finalize.sh`.
