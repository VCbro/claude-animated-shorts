# How a submersible pump works

A 60-second vertical explainer short (1080x1920, 60 fps). It shows a borewell cut open through soil, clay, sand, gravel and rock, with a multistage submersible pump below the water level. The film covers:

- the install crew: a tripod with a chain hoist, two workers, a cable drum and a generator
- the pump going down past the layers, with a depth counter
- the sealed motor, the intake screen, the stack of impeller stages and the diffusers
- pressure building stage by stage
- the check valve
- why pushing from below beats sucking from the surface (the ~8 m limit)
- the water's route up to the roof tank

There are captions synced to each word, labels, synthesized music and sound effects. Everything is built from code in three.js; there are no model files.

It follows the same pipeline as `../water-motor`, using the same skills: exploded-view, threejs-scene and frame-capture.

## Rebuild

```bash
npm install            # or symlink node_modules from ../water-motor
MODELS=/home/user/models python3 tools/voice.py   # English narration (Kokoro af_heart) -> web/lines.js
python3 tools/audio.py
python3 tools/render.py video out/video_silent.mp4 --fps 60 --workers 4
bash tools/finalize.sh                            # -> out/submersible_short.mp4
```

The Hindi version uses a recorded voice (for example from ElevenLabs) of `deliver/voice_script_hindi.txt`:

```bash
python3 tools/voice_hi.py voice_hi/<voice>.mp3     # align by pauses, trim pauses, 1.25x -> web/lines_hi.js
VLANG=hi python3 tools/audio.py
VLANG=hi python3 tools/render.py video out/video_silent_hi.mp4 --fps 60 --workers 4
VLANG=hi bash tools/finalize.sh                    # -> out/submersible_short_hi.mp4
```

## Files

| File | What it holds |
| --- | --- |
| `tools/voice.py` | The English lines. Change a line and the whole timeline re-times itself |
| `tools/voice_hi.py` | Hindi alignment, cue words, and the Hindi labels, chips and title |
| `web/scene.js` | Ground layers, bore, pump (motor, screen, stages, valve), column pipe, house and tank, crew, surface pump |
| `web/main.js` | Timeline: pump position, run speed, camera shots, flow particles, labels, captions and chips |
| `tools/audio.py` | Score and sound effects, timed from the same cue words |
