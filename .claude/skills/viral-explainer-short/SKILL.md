---
name: viral-explainer-short
description: Make a 45-80 s vertical Hinglish "dark 3D explainer" reel for Instagram/YouTube Shorts in the viral scam/sach format (near-black tech-noir look, acid-lime accent, red for danger, HUD place/time labels, word-by-word bold captions with lime keywords, 3D tilted phones and glossy 3D product shots, x-ray views with glowing dotted paths, dot-matrix India map with city pings, counters, stamps, numbered 1-2-3 steps, callback mantra pills, Follow/poll end card, Hindi male voice-over, synthesized tension bed + SFX at -14 LUFS), built with Remotion + three.js. Use when the user gives a topic for a reel "like those two viral videos", asks for a scam / fraud / "ye trick" / consumer-awareness / tech-sach reel in Hindi or Hinglish, or says "use the viral explainer skill".
---

# Viral explainer reel (Hinglish, dark 3D, Remotion + three.js)

Read `references/STYLE_BIBLE.md` first: the measured format, the 9-beat script and the picture vocabulary.
The project template is in `template/` (copy it to `videos/<name>/`, then `npm install`). It is the same code as the proven demo `videos/qr-scam/` in the repo (33 s, "QR scan karte hi paise gaye"). Second reel: `videos/upi-galti-se/` (50 s, fake-credit SMS scam, Kokoro voice). Third: `videos/petrol-density/` (56 s, density + filter paper, 3D dispenser). Fourth: `videos/battery-80/` (69 s, the creator's own voice, karaoke captions).

## Hard rules
- **Our own content only.** The reference reels are for style study. Never copy their lines, shots, channel name or
  branding, and never upload them anywhere. The channel is **Kaise Chalta Hai 3D, @KaiseChaltaHai3D** (`CHANNEL` in story.tsx). The end card shows Follow + Subscribe, and the CTA line always opens with "Follow aur subscribe karo."
- **Facts are real and sourced.** Research every number, law, helpline and case with WebSearch (mode "extended" for
  recent cases) and write the sources at the top of `SCRIPT.md`. If a fact can't be verified, cut it. No made-up
  cities, fines or counts. Helplines go on screen exactly (1930 cyber fraud, 1915 consumer, 112 emergency, etc.).
- **Safety.** Explain how a scam works only far enough for viewers to recognise and avoid it, never as a how-to.
  Always end with the protective action.
- **Maps of India use the official outline.** `src/data/india_dots.json` already has it, with all of J&K and Ladakh
  built in by `tools/make_india_dots.mjs`. Never swap in a raw world-atlas outline.
- Language: Hinglish voice, Roman-Hinglish captions. The TTS gets Devanagari text, the captions get Roman text.

## Pipeline
1. **Topic → facts → SCRIPT.md.** Pick a trending, money- or safety-relevant topic in India (scams, rights, hidden
   charges, phone or UPI tricks, govt services). Get 3-6 verified facts with sources.
2. **Script** (`script.json`), using the 9 beats in STYLE_BIBLE §3: hook with a twist → stakes → "ise kehte hain…" → inside
   look → "socho…" scale math → real proof with a city → "toh 3 cheezein yaad rakho" → mantra → CTA aimed at a specific person + a yes/no
   question. About 3 words/s and 3-8 words per sentence, addressing the viewer as "tum".
   - Each line has `tts` (Devanagari, with acronyms spelled out: "यू पी आई", "आई एम ई आई", numbers in words),
     `cap` (Roman caption), `hl` (lime words), `red` (danger words) and `gap` (seconds of pause before it; 0.25-0.35 before a new beat).
   - Show the script to the user for approval before rendering. When the user says "just do it", go straight through.
3. **Voice**: `python3 tools/voice.py [--engine piper|sarvam|eleven|files]`. This writes `voice/voice.wav` and
   `src/data/timeline.json`, with exact line times and estimated word times.
   - `kokoro` is the default: offline Kokoro-82M, the most human-sounding offline Hindi. Set `KOKORO_VOICE` to `hm_psi` (male, default),
     `hm_omega` (male), `hf_alpha` or `hf_beta` (female). `bash tools/get_models.sh` downloads it from GitHub releases.
   - `piper` (`hi_IN-rohan-medium`) is the older offline fallback and sounds more robotic.
   - Pronunciation fixes for Kokoro: write "पांच" (anusvara), not "पाँच". Say "मैसेज" instead of spelling out SMS. Put a word before a number
     that opens a sentence ("पूरे पांच हज़ार…"). Keep nukta on ज़/फ़ only where you need the z/f sound.
   - `sarvam` (Bulbul) and `eleven` (ElevenLabs multilingual v2) sound far more human. They need `SARVAM_API_KEY` or `ELEVENLABS_API_KEY` set
     as an environment variable, with `api.sarvam.ai` or `api.elevenlabs.io` allowed in the environment's network settings.
   - `take` (best, the creator's own voice): ONE phone recording of the whole script. Convert + denoise it to
     `voice/clean.wav` (`ffmpeg -i rec.m4a -af "highpass=f=75,afftdn=nr=12:nf=-42:tn=1" -ar 48000 voice/clean.wav`), transcribe it in
     pieces with Whisper turbo (sherpa-onnx-whisper-turbo from the k2-fsa asr-models release; split on 0.2 s silences, pad 1 s of zeros
     or it truncates), then give each line `"src": [[t0,t1],...]` in script.json: pick the clean take, skip stumbles and retakes, and
     make `cap` match what was actually said. Set `"voice_src": "voice/clean.wav"` and `"speed": 1.06`. voice.py squeezes inner pauses,
     time-stretches, and times caption words on the voiced frames. Proven on `videos/battery-80/`. When a scripted line is missing from
     the take, show it as a graphic instead of re-ordering the story.
   - `files` uses the user's own recording split per line: one `voice/lines/<id>.wav` per line.
   - Check the result with Whisper (`WHISPER=1 bash tools/get_models.sh`, then transcribe): every line must be intelligible.
4. **Story** (`src/story.tsx`): one component per shot. Start each shot on a word with `at("L5")`, `hit("L5","QR")` or
   `wordAt("L5",2)`, and convert to local frames with `G(o, …)`. Cut every 1.5-3 s. Use the kit (below) and nothing ad hoc
   unless a new prop is needed. When you add one, put it in `src/kit/` so later videos can reuse it.
   - `CAPTION_MODE = "karaoke"` (new default): the phrase shows dim, the spoken word gets a lime (red for `red` words) marker box, and
     keywords punch 1.22x. `"rise"` is the older word-by-word rise.
   - `CAPTION_HIDE` lists lines whose words are shown as graphics (the mantra). `CAPTION_PLACE` moves captions.
   - `IMPACTS`, `POPS` and `RISERS` feed the sound.
5. **Look check**: `node tools/stills.mjs out/s_ <10 frames> 0.5` gives JPGs plus a contact sheet. Read the sheet and fix
   overlaps, empty frames, tiny text and caption-on-subject collisions. Repeat until it is clean. A still takes ~3 s, and a 3D still ~9 s.
6. **Render**: `bash tools/render.sh` (voice → cues → sound → render → QA). `SKIP_VOICE=1` keeps the voice, `SCALE=1.3333` gives 2K and
   `CONC=3` sets parallel tabs. On 4 CPUs with software GL a 33 s reel took about 25 min at 1080p. Never `pgrep -f "remotion render"` in a wait loop: it matches the loop itself.
7. **QA** (`tools/qa.sh`, run automatically): no black or frozen spans, -14 LUFS, peak ≤ -1 dBTP, contact sheet every 2 s.
   Look at the sheet. Then send the mp4 with SendUserFile, commit the source (never commit mp4/wav renders, models or node_modules) and push.
8. **Post kit (always, every reel)**: write `videos/<name>/INSTAGRAM.md` and send it with the mp4. Copy the format of
   `videos/upi-galti-se/INSTAGRAM.md`: an on-cover title plus 3 alternatives, a copy-paste caption (hook, why, ✅ 1-2-3 steps with exact
   helplines, mantra, share-to-whom line, HAAN/NA question, "Follow karo @KaiseChaltaHai3D"), 20-25 hashtags (topic + Indian
   reach + #KaiseChaltaHai3D), cover-frame pick, pinned comment, and a YouTube Shorts title. Emoji are fine here (only the video can't have them). Facts must match SCRIPT.md.

## Kit (`src/kit/`, `src/three/`)
| Component | Use |
|---|---|
| `Ground tone=dark/red/warm`, `Vignette` | every shot's base and finish |
| `Cam dur s0 s1 dx dy roll kick=[f]` | the creeping push in every shot, with flip shakes on impacts |
| `Hud left right clock dot` | the "● PLACE · TIME" bar with a micro label and lime timer |
| `Bokeh hue=warm/cool/lime/red` | real-world places at night |
| `GridFloor` | inside / data / rule shots |
| `Captions` (in Short.tsx) | automatic word-by-word captions from timeline.json |
| `Chip`, `Pill`, `Stamp`, `Counter`, `Rings`, `StepDot`, `Flow`, `Lcd` | labels, mantra pills, SEALED/BLOCKED, ₹ counters, alert pings, 1-2-3 steps, dotted money/data paths, 7-segment meters |
| `Phone` (CSS 3D tilt) + `StatusBar`, `ChatHead`, `Bubble`, `PinPad`, `Dialer`, `Toast`, `QR`, `IncomingCall`, `BalanceScreen` | phone UI stories |
| `SmsCard ring=sender/body` | bank-style SMS with a highlight ring (fake-message stories) |
| `DispenserPanel`, `RangeBar`, `FilterPaper` (kit/Dispenser.tsx) | fuel-pump LCD panel with a row ring, OK-range bar with a marker, filter-paper drop/stain test |
| `BatteryIcon`, `Gauge`, `CellXray`, `Settings`, `HealthScreen` (kit/Battery.tsx) | charge level with heat glow and 20-80 band, stress gauge, Li-ion ion x-ray, phone settings rows with toggles, health % roll-down |
| `XrayPhone` | wireframe glowing device for "phone ke andar" |
| `IndiaMap pings spread arcs` | city cases, "har network", travel |
| `EndCard`, `Poll` | Follow → Following ✓, yes/no comment bait |
| `Studio3D` + `Phone3D`, `QrStand`, `Dispenser3D`, `Table`, `useCanvasTex`, `drawQR` | real 3D product shots (three.js PBR, transparent canvas over Bokeh) |

To add a new 3D object (a petrol dispenser, ATM, SIM card, gas cylinder, electricity meter), build it in `src/three/` from
boxes, RoundedBoxGeometry and cylinders with `meshPhysicalMaterial` (roughness .2-.5, metalness .1-.85, clearcoat on plastics).
Labels and screens are `useCanvasTex` textures. Keep 3D shots to 1-3 per reel: they cost about 3x more render time.

## Gotchas
- HuggingFace is blocked in the cloud sandbox, but GitHub releases work: models come from k2-fsa/sherpa-onnx releases (`tools/get_models.sh`).
  The PyPI and npm registries work too.
- `sherpa-onnx` 2.x can't phonemize Piper Hindi voices. Use the `piper-tts` package (`python -m piper`).
- Headless Chrome has no emoji font. Never put emoji in the picture; use text or SVG icons instead.
- Fonts load through `src/fonts.ts` (delayRender). Canvas textures that draw text need those fonts, so they are only drawn after fonts.ts has run.
- `tools/cues.mjs` bundles story.tsx with esbuild to read the cue frames. Keep story.tsx free of top-level DOM access.
- Captions merge 1-word tails into the previous phrase. Keep `cap` punctuation meaningful, because `.`, `?` and `!` end a phrase.
- Words are timed by syllable weight inside each line. For tighter sync, split long lines into shorter ones (each line is timed exactly).
- SVG masks on a straight line need `maskUnits="userSpaceOnUse"`, otherwise the zero-height bounding box hides them. `Flow` already does this.
- Keep text out of the bottom 22 % and right 12 % (the Reels UI covers them). See `SAFE` in theme.ts.
