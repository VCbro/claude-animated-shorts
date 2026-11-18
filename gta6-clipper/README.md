# GTA 6 Viral Clip Cutter

Long GTA 6 video (YouTube link ya apni file) se 9:16 vertical shorts banata hai:
hook title upar, word-by-word captions (active word yellow), progress bar, aur
-14 LUFS loud audio (Shorts/Reels/TikTok standard).

## Install (ek baar)

```bash
bash install.sh          # ffmpeg, yt-dlp, faster-whisper, sherpa-onnx, OpenCV + speech model
```

## Best quality flow (Claude ke saath, Opus Clip jaisa)

```bash
python3 clipper.py fetch "https://youtu.be/XXXX" -o work/vid1     # ya: fetch my_video.mp4 -o work/vid1
python3 clipper.py analyze work/vid1 -n 10 --min-len 20 --max-len 45
#   -> work/vid1/candidates.md  (best moments + transcript)
#   -> work/vid1/thumbs/*.jpg   (har moment ke 4 frames)
# Claude candidates padhkar aur frames dekhkar clips.json likhta hai (hook, title, hashtags)
python3 clipper.py render work/vid1 --plan work/vid1/clips.json
#   -> work/vid1/clips/*.mp4 + metadata.csv + post_kit.md
```

## Fast flow (sab automatic)

```bash
python3 clipper.py auto my_video.mp4 -o work/vid1 -n 5
```

## clips.json format

```json
[{"start": 95.0, "end": 121.5, "mode": "blur",
  "hook": "GTA 6 MEIN YE DEKHA?",
  "title": "GTA 6 police chase is insane",
  "description": "Ye physics dekh ke dimaag hil gaya 🤯 comment karo",
  "hashtags": "#gta6 #gtavi #rockstargames #shorts"}]
```

## Style options

| Option | Default | Kya karta hai |
|---|---|---|
| `--mode blur` | blur | Pura frame beech mein, upar/neeche blur (HUD + minimap dikhte hain). Gameplay ke liye best |
| `--mode track` | | Full-height 9:16 crop jo action ko follow karta hai. Trailer/cinematic ke liye |
| `--mode fill` | | Static centre crop |
| `--zoom 0.86` | 0.86 | blur mode mein width ka kitna hissa rakhna hai |
| `--highlight "#FFE600"` | yellow | active word + progress bar ka colour |
| `--hook-box "#E6007E"` | Vice City pink | hook box colour |
| `--hook-secs 4` | 0 (poora clip) | hook kitne second dikhe |
| `--lang hi` / `--model small` | auto / base | Hindi commentary ke liye better transcription |
| `--no-captions`, `--no-bar` | | captions / progress bar band |

## Kaise best moments chunta hai

Har second ka score: audio loudness (gunshots, explosions, music drop), motion
(chase, crash), scene cuts, speech density aur hype words (insane, leak, Lucia,
Vice City, bhai, pagal...). "Subscribe / sponsor" wale parts ko minus. Phir
20-45s ke windows mein se top non-overlapping chunta hai, pehle 3 second (hook)
ko extra weight deta hai, aur start/end ko sentence boundary par snap karta hai.

## Notes

- Transcription: pehle faster-whisper (word timestamps, huggingface se model),
  agar blocked ho to offline sherpa-onnx Whisper (GitHub se model) fallback.
- YouTube "Sign in to confirm you're not a bot" aaye to `--cookies cookies.txt`.
- Copyright: dusron ke YouTube videos ke clips par Content ID claim aa sakta hai.
  Apni gameplay/commentary ya official trailers par apna reaction/commentary add
  karna safer hai.
- Fonts: Anton (SIL Open Font License, `fonts/OFL.txt`).
