# How a bike engine works (English + Hindi)

A ~60 s (English) / ~73 s (Hindi) vertical 3D explainer of a single-cylinder four-stroke motorcycle engine, made with
[raea](https://raea.io) (React + TypeScript compositions rendered by Bevy). It has a realistic cutaway model, the four
strokes in slow motion, and the drive from the crankshaft through the gearbox and chain to the rear wheel. There are
two versions of the narration and on-screen text, English and Hindi.

The rendered films aren't in git because they're too big. Rebuild them with the steps below.

## What's modelled

Everything is built in code with Manifold solids (`compositions/engine/geom.ts`), with no downloaded models:

| Part | Detail |
| --- | --- |
| Castings | finned barrel and studs, head with dome chamber, curved ports, guides and fins, cam carrier with ribs, crankcase with gearbox, sump and bearing bosses |
| Cutaway | each casting is split at z = 0, with red section caps; the front halves fly in and away for the reveal |
| Moving parts | piston with crown valve reliefs, three ring grooves, rings and wrist pin; I-beam rod with cap bolts; crankshaft with counterweight webs |
| Valvetrain | two valves with seats, coil springs that really compress, retainers, bucket tappets, twin camshafts turning at half crank speed |
| Ignition | spark plug with thread, hex, ribbed ceramic, electrodes and HT cap |
| Intake and exhaust | carburettor (slide tower, float bowl, air horn), exhaust header and silencer |
| Drive | primary gears, clutch, gearbox pair, sprockets, a roller chain whose links run on the real tangent path, swingarm, spoked rear wheel with tread |

`compositions/engine/kin.ts` holds the slider-crank maths, the valve lift windows (intake −12°…205°, exhaust 505°…732°),
the cam phasing, the combustion timing and the gear ratios. Everything is timed from the narration in `timing.json`.

## Rebuild

```bash
curl -fsSL https://raea.io/install | sh          # raea (0.1.7 used here)
pip install piper-tts numpy scipy soundfile pyloudnorm pillow
# voices (offline Piper, via sherpa-onnx's mirror) into ~/tts:
#   vits-piper-en_US-ryan-high, vits-piper-hi_IN-pratham-medium
#   https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/<name>.tar.bz2

python3 -I tools/make_hdr.py assets/studio.hdr   # the studio lighting panorama
python3 -I tools/make_voice.py                    # narration -> assets/voice/, timing.json
python3 -I -c "import json;open('compositions/engine/timing.ts','w').write('export const TIMING = '+json.dumps(json.load(open('timing.json')))+' as const;\n')"
python3 -I tools/audio.py                         # engine sound + music + voice -> out/mix-<lang>.wav
tools/render_all.sh                               # PNG frames -> out/picture-<lang>.mp4
tools/finalize.sh                                 # mux + raea check -> out/bike-engine-<lang>.mp4
```

- `compositions/media` must be a link to `../assets`, because raea's `staticFile` reads from there.
- On a machine with no GPU, install Mesa's lavapipe (`apt install mesa-vulkan-drivers`) and set
  `VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json`. That gives about 2.7 s a frame at 1080x1920.
- Stills for checking the look: `raea render compositions/film.tsx --composition engine-en --at 90,500,900 -o out/st/`.

## Files

| File | What it holds |
| --- | --- |
| `lines.json` | The narration, English and Hindi, nine beats |
| `compositions/film.tsx` | Registers `engine-en` and `engine-hi` (1080x1920, 30 fps) |
| `compositions/engine/geom.ts` | Every solid, built once |
| `compositions/engine/kin.ts` | Crank angle over time, slider-crank, valves, combustion, drivetrain, chain path |
| `compositions/engine/Engine.tsx` | Scene, materials, lights, gas and particles, cameras, labels and titles |
| `compositions/engine/copy.ts` | On-screen text per language |
| `tools/audio.py` | Engine sound (a thump on every power stroke, valve clicks, an rpm hum), music bed, ducking, -14 LUFS |

## Voice

The voices are offline Piper models: Ryan (en_US, high) and Pratham (hi_IN, medium). To use a real voice-over, put
`assets/voice/<lang>.wav` in place and write each beat's start and end into `timing.json`. The picture and the sound
re-time themselves from it.
