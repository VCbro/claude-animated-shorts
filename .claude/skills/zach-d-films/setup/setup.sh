#!/usr/bin/env bash
# One-time setup for this skill. Installs the render packages (and, with --voice, the free voice and the
# word-timing model) into a writable folder, then writes <kit-folder>/env.sh for the skill to source.
#   bash setup.sh <kit-folder> [--voice]
# Only npm, pip and GitHub downloads are used, so it also works in a sandbox that blocks other sites.
# Safe to run again.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_ARG="${1:?usage: setup.sh <kit-folder> [--voice]}"
shift || true
mkdir -p "$KIT_ARG"
KIT="$(cd "$KIT_ARG" && pwd)"
say() { printf '\033[1m%s\033[0m\n' "$*"; }

command -v ffmpeg >/dev/null || { echo "ffmpeg is missing. Mac: brew install ffmpeg"; exit 1; }
command -v npm >/dev/null || { echo "Node.js 18+ is missing. Mac: brew install node"; exit 1; }
PY3=$(command -v python3) || { echo "python3 is missing"; exit 1; }
"$PY3" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' || { echo "python 3.9+ is needed"; exit 1; }

say "installing the render packages into $KIT/node_modules"
cp "$HERE/package.json" "$KIT/package.json"
(cd "$KIT" && npm install --silent --no-audit --no-fund)

# A browser to render with: the Chrome or Chromium already on the machine if there is one, else Playwright's own.
CHROME_BIN=""
for b in google-chrome google-chrome-stable chromium chromium-browser; do
  p=$(command -v "$b" || true)
  if [ -n "$p" ]; then CHROME_BIN="$p"; break; fi
done
if [ -z "$CHROME_BIN" ]; then
  say "installing Playwright's Chromium"
  (cd "$KIT" && npx --yes playwright install chromium >/dev/null)
fi

if [ "${1:-}" = "--voice" ]; then
  if [ ! -x "$KIT/.venv/bin/python" ]; then
    say "making $KIT/.venv"
    "$PY3" -m venv "$KIT/.venv"
  fi
  "$KIT/.venv/bin/python" -m pip install -q --upgrade pip
  "$KIT/.venv/bin/python" -m pip install -q numpy scipy soundfile kokoro-onnx sherpa-onnx
  M="$KIT/models"
  mkdir -p "$M"
  say "downloading the voice and word-timing models (about 1 GB, once)"
  [ -s "$M/kokoro-v1.0.onnx" ] || curl -fL --retry 3 -o "$M/kokoro-v1.0.onnx" https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  [ -s "$M/voices-v1.0.bin" ] || curl -fL --retry 3 -o "$M/voices-v1.0.bin" https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
  if ! ls -d "$M"/sherpa-onnx-nemo-parakeet* >/dev/null 2>&1; then
    curl -fL --retry 3 -o "$M/p.tar.bz2" https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8.tar.bz2
    (cd "$M" && tar xjf p.tar.bz2 && rm p.tar.bz2)
  fi
fi

PYBIN="$PY3"
if [ -x "$KIT/.venv/bin/python" ]; then PYBIN="$KIT/.venv/bin/python"; fi
{
  echo "export KIT=\"$KIT\""
  echo "export NODE_PATH=\"$KIT/node_modules\""
  echo "export PY=\"$PYBIN\""
} > "$KIT/env.sh"
if [ -n "$CHROME_BIN" ]; then echo "export CHROME=\"$CHROME_BIN\"" >> "$KIT/env.sh"; fi
# no GPU on a Linux box or sandbox: use software WebGL (slower, but it works)
if [ "$(uname)" = "Linux" ] && [ ! -e /dev/dri ]; then echo "export GL=swiftshader" >> "$KIT/env.sh"; fi
say "ready: source $KIT/env.sh"
