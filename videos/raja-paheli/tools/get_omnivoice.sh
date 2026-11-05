#!/bin/bash
# Installs VoiceStudio's TTS engine (OmniVoice, C++ GGUF runtime) for tools/voice.py --engine omnivoice.
#  1. builds omnivoice.cpp at the commit VoiceStudio pins (CPU, ~3 min)
#  2. downloads the GGUF weights from Hugging Face (needs huggingface.co allowed in the network settings)
set -e
D=${OMNIVOICE_DIR:-/home/user/vcbro/tools/omnivoice.cpp}
if [ ! -x "$D/build/omnivoice-tts" ]; then
  mkdir -p "$(dirname "$D")"
  [ -d "$D" ] || git clone --recurse-submodules https://github.com/ServeurpersoCom/omnivoice.cpp.git "$D"
  (cd "$D" && git checkout -q 886fc079838ca7400cb2b42b36e2a65aa1daabe8 && git submodule update --init --recursive -q \
     && cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release >/dev/null && cmake --build build -j "$(nproc)" >/dev/null)
fi
mkdir -p "$D/models"
for f in omnivoice-base-Q8_0.gguf omnivoice-tokenizer-F32.gguf; do
  [ -s "$D/models/$f" ] && { echo "[OK] $f"; continue; }
  echo "[Download] $f"
  curl -fL --retry 3 -o "$D/models/$f.part" "${HF_ENDPOINT:-https://huggingface.co}/Serveurperso/omnivoice.cpp-GGUF/resolve/main/$f" \
    && mv "$D/models/$f.part" "$D/models/$f" \
    || { echo "Download blocked: allow huggingface.co (+ cas-bridge.xethub.hf.co) in the environment's network settings."; exit 1; }
done
echo "OmniVoice ready: $D"
