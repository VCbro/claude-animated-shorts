---
name: explainer-3d
description: Make a 50-60 s vertical (1080x1920, 60 fps) 3D "how it works" YouTube Short / Reel of a machine (water motor, bike engine, submersible pump, AC, mixer...) in Hindi or English. The machine is built from code in three.js with x-ray shells, cutaways, exploded views, flow particles, labels with leader lines, word-synced captions, music and SFX. Comes in 11 render styles (real, clay, toon, pastel, lowpoly, chrome, xray, hologram, blueprint, sketch, neonedge) x 6 colour themes (studio, noir, blueprint, neon, clean, sunset) = 66 looks. Use when the user types /explainer-3d, or asks for a 3D explainer short "like the motor video".
---

# /explainer-3d: 3D machine explainer short (motor-video style)

Proven on: How a water motor works (57 s), Bike engine (52 s) and Submersible pump (52 s), each in English and Hindi.
`template/` is the complete water-motor project. `examples/` has the scene and timeline of the bike engine and the
submersible pump, to show how a new machine is built. `reference/` has the three.js, exploded-view and frame-capture
notes these films were built with (geometry, lighting, shaders, performance). Read them when building a new model.

## 0. Setup
```bash
cp -r ~/.claude/skills/explainer-3d/template  my-short && cd my-short
npm install                                   # three + fonts
pip install playwright kokoro-onnx soundfile scipy numpy pillow
python3 -m playwright install chromium        # or set CHROME_PATH
# offline English voice (optional): kokoro-v1.0.int8.onnx -> ~/models/kokoro.onnx, voices-v1.0.bin -> ~/models/voices.bin
#   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
```
Live preview: `python3 tools/serve.py . --port 8000`, then open `http://127.0.0.1:8000/web/index.html?t=12` to freeze a moment.

## Themes (pick one per video, or render two and let the user choose)
`VTHEME=<name>` for `tools/render.py`, or `?theme=<name>` in the preview URL. Defined in `web/themes.js`:
- `studio`: deep blue studio with yellow and cyan. The original water-motor look, safe for any machine.
- `noir`: graphite black, warm gold light and a desaturated grade. Premium and luxury (cars, watches, engines).
- `blueprint`: blue grid paper, monochrome-blue grade and mono labels. Engineering and "how it's designed".
- `neon`: black with magenta/cyan rim lights and glowing captions. Tech, gadgets, gaming, AI hardware.
- `clean`: a bright white Apple-style studio with dark captions. Home appliances and product explainers.
- `sunset`: an orange-purple dusk gradient with a golden rim. Emotional and story hooks.

A theme sets the backdrop, the 3D lights and exposure, a colour grade of the 3D layer only (captions stay sharp),
and the caption, label and chip style. The model and timeline don't change, so a theme works for any machine.
Add a theme by copying one entry in `THEMES`.

## Styles (HOW the 3D is drawn) — combine with any theme
`VSTYLE=<name>` for `tools/render.py`, `?style=<name>` in the preview URL. Defined in `web/styles.js`; it restyles every
part after the scene is built and follows the timeline's live colour/opacity changes, so it works on any machine.

| Style | Look | Use for |
|---|---|---|
| `real` | physically based metal and plastic (default) | realistic explainers |
| `clay` | matte clay model | premium product / Apple-keynote feel |
| `toon` | cel shading + black ink outlines | cartoon / kids / fun facts |
| `pastel` | soft pastel toon, grey outlines | friendly, educational, kids |
| `lowpoly` | flat-shaded facets, saturated | game-like, stylised |
| `chrome` | everything polished metal | luxury, sci-fi, "engine porn" |
| `xray` | see-through glowing shells | inside views, medical-scan feel |
| `hologram` | cyan additive hologram + scanlines | sci-fi HUD, future tech |
| `blueprint` | white technical lines on dark blue | engineering drawing |
| `sketch` | white paper model + pencil edges | whiteboard / hand-drawn |
| `neonedge` | dark parts with glowing edges | Tron / cyberpunk / gaming |

Good pairs: `real`+`studio`, `clay`+`clean`, `toon`+`sunset`, `chrome`+`noir`, `hologram`+`neon`, `blueprint`+`blueprint`, `sketch`+`clean`.
Render 3-4 stills in different pairs and let the user pick before the full render.

## 3D realistic Shorts (outdoor, cinematic)
For subjects that should look real in a vertical Short (ships, aircraft, rockets, bridges, cars in a landscape), use the
documentary skill's `template-3d/` engine in vertical mode: `VIEW=1080x1920 python3 tools/capture.py ...`
(physical sky + sun, ocean, shadows, bloom, film grade; captions move up for 9:16). For indoor machine close-ups keep this
template with `real` style + `studio`/`noir` theme and follow `reference/threejs-scene.md` (soft shadows, light presets).
Pick colours/type from `reference/taste/palettes.json` and `type.json` (64 curated palettes, MIT, from taste-skill).

## 1. Script (`SCRIPT.md`)
Facts first (with numbers you can source), then about 12 lines, each with **the picture** that goes with it:
hook (a daily-life moment) → question → "two machines in one" style overview → each part in the order energy flows →
the key physics (speed → pressure, combustion → push) → a practical tip (priming, why it overheats) → one-line chain recap + title.
For Hindi, give the user the Hindi lines with ElevenLabs v3 `[tags]` and ask for the MP3.

## 2. Voice and timing
- English, offline: put the lines in `tools/voice.py` (`(id, text, pause_after)`), then run `python3 tools/voice.py`.
  It writes `voice/voice.wav`, `voice/lines.json` and `web/lines.js` with every line and word time.
- Hindi from the user's MP3: put the MP3 in `voice_hi/elevenlabs.mp3` and the Hindi lines in `tools/voice_hi.py`, then run
  `python3 tools/voice_hi.py voice_hi/elevenlabs.mp3`. It splits the audio at pauses with dynamic programming (`align_hi.py`)
  and writes `web/lines_hi.js`. `cues` map English cue words used by the timeline to Hindi words.
- Everything in the film is timed from these: `T('lineId')` (line start), `wt('lineId','word')` (word time).
  Change a line and the whole film re-times itself.

## 3. Build the machine (`web/<machine>.js`, like `web/pump.js` / `examples/*/scene.js`)
- Procedural geometry only: `LatheGeometry` for round parts (housings, pistons, shafts), extruded shapes for blades and
  brackets, tubes for pipes and wires, instancing for bolts and fins. Real proportions; one `DIM` object with all sizes.
- Every part is a named group so the timeline can move it: casing halves (to open), covers (to slide off), the
  rotating parts (shaft, impeller, crank), and the flow path (a curve for particles).
- Materials: painted metal (MeshStandard, clearcoat), copper windings, brass impeller, clear plastic, water.
- X-ray: swap a shell to a fresnel transparent material to see inside. Cutaway: a clipping plane or half-geometry.
- `web/explode.js` gives `Labels`: HTML labels pinned to 3D points with leader lines that avoid the model.

## 4. Timeline (`web/main.js`)
The page is a pure function of time: `renderAt(t)` sets the spin, camera, flow particles, labels, chips and captions for that t.
- Camera: keyframes `k(time, target, direction, distance, fov)` blended smoothly; one move per line, slow and motivated.
- Spin speeds ramp with the narration ("spins up to 2,900 rpm" → counter chip + rotor speed).
- Flow particles follow the flow path; colour/speed show the physics (bright fast near the impeller, slow dark in the volute).
- Captions: big, bold, word-highlighted, in the lower third. A title card at the start and a recap chain at the end.
- 9:16 framing: the subject fills the width, the top and bottom 15% stay clear for the platform UI.

## 5. Check, sound, render
```bash
python3 tools/render.py stills out/stills 3,12.5,30 && python3 tools/sheet.py out/sheet.jpg out/stills/*.png   # look, fix, repeat
python3 tools/audio.py                                        # synth score + SFX on cue words + ducked voice -> audio/mix.wav
python3 tools/render.py video out/video_silent.mp4 --fps 60 --workers 4      # frame-exact, parallel, resumable chunks
bash tools/finalize.sh                                        # mux + -14 LUFS -> out/short.mp4, QA frames in out/qa/
```
Theme: `VTHEME=noir python3 tools/render.py ...`. Hindi: `VLANG=hi python3 tools/render.py ...` and `VLANG=hi bash tools/finalize.sh` (they use `lines_hi.js`, `mix_hi.wav`).
Software WebGL takes about 1-4 s per frame per worker. Check stills before every full render.

## 6. Deliver
The MP4 (under 150 MB), a Shorts title with #shorts, a description, tags and hashtags, and 2-3 thumbnail options
(a frame with the machine opened + big 2-3 word text).

## Rules learned the hard way
- Code-built 3D beats a generic 3D-model download: exact parts, exact motion, no licence problems.
- Keep the same model, colours and screen direction across every shot. Never cut to a different-looking machine.
- Don't fill the frame with labels: at most 2 at once, each shown while it's named.
- Big captions beat small labels on a phone. Test every still at phone size.
