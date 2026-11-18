#!/usr/bin/env bash
# Installs everything the GTA 6 clip cutter needs (Linux / macOS / WSL / cloud box).
# Usage: bash install.sh [whisper_size]   (tiny | base | small; default base)
set -euo pipefail
SIZE="${1:-base}"
CACHE="${GTA6CLIPPER_CACHE:-$HOME/.cache/gta6clipper}"
mkdir -p "$CACHE"

if ! command -v ffmpeg >/dev/null; then
  if command -v apt-get >/dev/null; then sudo apt-get update -y && sudo apt-get install -y ffmpeg
  elif command -v brew >/dev/null; then brew install ffmpeg
  else echo "Please install ffmpeg first (https://ffmpeg.org/download.html)"; exit 1; fi
fi

python3 -m pip install -q --upgrade yt-dlp faster-whisper sherpa-onnx opencv-python-headless numpy

# Offline speech model (works even where huggingface.co is blocked; served from GitHub releases)
REL=https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models
[ -f "$CACHE/silero_vad.onnx" ] || curl -fsSL -o "$CACHE/silero_vad.onnx" "$REL/silero_vad.onnx"
if [ ! -d "$CACHE/sherpa-onnx-whisper-$SIZE" ]; then
  curl -fsSL -o "$CACHE/w.tar.bz2" "$REL/sherpa-onnx-whisper-$SIZE.tar.bz2"
  tar xjf "$CACHE/w.tar.bz2" -C "$CACHE" && rm "$CACHE/w.tar.bz2"
fi
echo "OK: ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3), yt-dlp $(yt-dlp --version), models in $CACHE"
