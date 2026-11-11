# Charger garam kyun hota hai?

A ~44 s Hindi short (1080x1920, 30 fps) for Kaise Chalta Hai 3D, made with the `viral-explainer-short` skill.
Outside shots are a realistic wall socket; inside shots show the real parts of a charger under a glass shell
(`src/three/Charger.tsx`).

```bash
npm install
# voice: put the creator's take at voice/clean.wav (script.json already holds each line's cut points)
python3 tools/voice.py && node tools/cues.mjs && python3 tools/audio.py
npx remotion render src/index.ts Short out/final.mp4 --gl swangle --concurrency 4
ffmpeg -i out/final.mp4 -c:v copy -af volume=-4dB out/charger-garam.mp4   # lands at -14 LUFS
```
