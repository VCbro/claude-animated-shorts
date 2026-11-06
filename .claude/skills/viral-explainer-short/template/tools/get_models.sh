#!/bin/bash
# Offline models (GitHub releases; huggingface is blocked in the cloud sandbox).
#  - Hindi neural voice (piper): rohan (male, clearest), pratham (male), priyamvada (female)
#  - Whisper small (sherpa-onnx) for checking the voice / transcribing reference videos
set -e; cd "$(dirname "$0")/.."; mkdir -p models; cd models
B=https://github.com/k2-fsa/sherpa-onnx/releases/download
for v in ${VOICES:-rohan}; do
  [ -f hi_IN-$v-medium.onnx ] && continue
  curl -sL $B/tts-models/vits-piper-hi_IN-$v-medium.tar.bz2 | tar xj
  mv vits-piper-hi_IN-$v-medium/hi_IN-$v-medium.onnx* . && rm -rf vits-piper-hi_IN-$v-medium
done
# Kokoro-82M (default voice engine, most natural offline Hindi: hm_psi / hm_omega / hf_alpha / hf_beta)
K=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f $f ] || curl -sL -o $f $K/$f; done
if [ -n "$WHISPER" ] && [ ! -d sherpa-onnx-whisper-small ]; then curl -sL $B/asr-models/sherpa-onnx-whisper-small.tar.bz2 | tar xj; fi
pip install -q kokoro-onnx piper-tts soundfile scipy numpy sherpa-onnx 2>/dev/null || true
ls -la
