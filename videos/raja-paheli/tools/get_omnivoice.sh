#!/bin/bash
# Installs VoiceStudio's TTS engine (OmniVoice, C++ GGUF runtime) for tools/voice.py --engine omnivoice.
#  1. builds omnivoice.cpp at the commit VoiceStudio pins: portable AVX2 build (cloud CPUs change on restart, never
#     -march=native), patched so OMNIVOICE_THREADS sets the thread count. ~3 min
#  2. downloads the GGUF weights from Hugging Face (needs huggingface.co allowed in the network settings)
set -e
D=${OMNIVOICE_DIR:-/home/user/vcbro/tools/omnivoice.cpp}
if [ ! -x "$D/build/omnivoice-tts" ]; then
  mkdir -p "$(dirname "$D")"
  [ -d "$D" ] || git clone --recurse-submodules https://github.com/ServeurpersoCom/omnivoice.cpp.git "$D"
  (cd "$D" && git checkout -q 886fc079838ca7400cb2b42b36e2a65aa1daabe8 && git submodule update --init --recursive -q \
     && { grep -q OMNIVOICE_THREADS src/backend.h || sed -i 's|    int n = (int) std::thread::hardware_concurrency() / 2;|    const char * env = std::getenv("OMNIVOICE_THREADS"); if (env \&\& std::atoi(env) > 0) return std::atoi(env);\n&|' src/backend.h; } \
     && cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=OFF -DGGML_AVX=ON -DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON >/dev/null \
     && cmake --build build -j "$(nproc)" >/dev/null)
fi
mkdir -p "$D/models"
for f in omnivoice-base-Q8_0.gguf omnivoice-tokenizer-F32.gguf; do
  [ -s "$D/models/$f" ] && { echo "[OK] $f"; continue; }
  echo "[Download] $f"
  curl -fL --retry 3 -o "$D/models/$f.part" "${HF_ENDPOINT:-https://huggingface.co}/Serveurperso/OmniVoice-GGUF/resolve/main/$f" \
    && mv "$D/models/$f.part" "$D/models/$f" \
    || { echo "Download blocked: allow huggingface.co (+ cas-bridge.xethub.hf.co) in the environment's network settings."; exit 1; }
done
echo "OmniVoice ready: $D"
