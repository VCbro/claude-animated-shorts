# Pankhe mein 3 hi blade kyun?

A ~50 s Hindi short (1080x1920, 30 fps) for Kaise Chalta Hai 3D, made with the `viral-explainer-short` skill.
Outside shots are Realistic 3D, "andar" shots are X-Ray 3D (`src/three/Fan.tsx`).

Status: picture is built on a draft timeline. The final voice (one mp3 of `SCRIPT.md`) is still to be added.

```bash
npm install
python3 tools/draft_timeline.py                      # estimated timing until the voice arrives
node tools/stills.mjs out/s_ 70,420,760,1190 0.5     # look check
# with the voice: put it at voice/clean.wav, fill "src" per line in script.json, then
VOICE_ENGINE=take bash tools/render.sh               # voice -> cues -> sound -> render -> QA -> out/final.mp4
```
