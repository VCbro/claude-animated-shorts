# How a water motor works

A 55-second vertical explainer short (1080x1920, 60 fps). It shows a code-built 3D monoblock water pump: the motor, the rotating magnetic field, the impeller, the volute and priming. It has narration, captions synced to each word, labels, music and sound effects.

It was built with the **Open 3D Skills** installed in `.claude/skills/`:
- **exploded-view:** opening the pump, x-ray shells and `Labels` with leader lines (`web/explode.js`).
- **threejs-scene:** procedural geometry made from lathes, extrusions and tubes, plus the lighting.
- **frame-capture:** a frame-exact recorder on a virtual clock, so every frame is perfect at 60 fps no matter how slowly it renders.

The rendered film isn't in git because it's too big. Rebuild it with the steps below.

## Rebuild

```bash
npm install
pip install playwright kokoro-onnx soundfile scipy numpy pillow
# voice models (offline): kokoro-v1.0.int8.onnx -> $MODELS/kokoro.onnx, voices-v1.0.bin -> $MODELS/voices.bin
#   from github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

MODELS=/home/user/models python3 tools/voice.py   # voice/voice.wav, voice/lines.json, web/lines.js (all timing)
python3 tools/audio.py                            # music + SFX + voice -> audio/mix.wav
python3 tools/render.py video out/video_silent.mp4 --fps 60 --workers 4
bash tools/finalize.sh                            # -> out/water_motor_short.mp4 (-14 LUFS) + QA frames
```

- **Stills for checking the look:** `python3 tools/render.py stills out/stills 3,12.5,30` then `python3 tools/sheet.py out/sheet.jpg out/stills/*.png`.
- **Live preview:** `python3 tools/serve.py . --port 8000`, then open `http://127.0.0.1:8000/web/index.html`. Add `?t=30` to the URL to freeze one moment.
- **Speed:** about 3.8 s per frame per worker with software WebGL (SwiftShader) on 4 cores. The full film takes about 55 minutes, and much less on a GPU.
- **Chromium:** `CHROME_PATH` sets which Chromium is used.

## Files

| File | What it holds |
| --- | --- |
| `SCRIPT.md` | Facts, lines and the picture for each line |
| `tools/voice.py` | Narration lines and pauses. Change a line here and everything else re-times itself |
| `web/pump.js` | The pump, motor, impeller, volute, pipes, house and tank, all built from code |
| `web/main.js` | Timeline: spin speed, camera shots, flow particles, labels, captions and chips |
| `tools/audio.py` | Synthesized score and SFX, ducked under the voice |
| `tools/render.py` | Parallel frame-exact recorder (headless Chromium → ffmpeg) |
