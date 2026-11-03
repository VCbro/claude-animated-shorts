"""Neural Hindi voices: Piper VITS models (hi_IN pratham / priyamvada / rohan) run with onnxruntime.
Text -> IPA with the bundled espeak-ng library (same frontend Piper uses), then phoneme ids -> VITS.
synth(text, name, length_scale) -> (float32 mono @22050, phrases[(t_start, t_end, text)])"""
import ctypes as C, json, os, re, unicodedata
import numpy as np
import onnxruntime as ort
import espeak_tts as E  # initialises espeak-ng in retrieval mode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lib = E.lib
lib.espeak_TextToPhonemes.restype = C.c_char_p
lib.espeak_TextToPhonemes.argtypes = [C.POINTER(C.c_void_p), C.c_int, C.c_int]
_models = {}


def _model(name):
    if name not in _models:
        d = f"{ROOT}/models/vits-piper-hi_IN-{name}/hi_IN-{name}"
        so = ort.SessionOptions(); so.intra_op_num_threads = 4
        _models[name] = (ort.InferenceSession(d + ".onnx", so, providers=["CPUExecutionProvider"]),
                         json.load(open(d + ".onnx.json")))
    return _models[name]


def ipa(text):
    lib.espeak_SetVoiceByName(b"hi")
    buf = C.create_string_buffer(text.encode("utf-8"))
    p = C.c_void_p(C.cast(buf, C.c_void_p).value)
    out = []
    while p.value:
        r = lib.espeak_TextToPhonemes(C.byref(p), 1, 0x02)  # UTF8 in, IPA out
        if r:
            out.append(r.decode("utf-8").strip())
    return " ".join(o for o in out if o)


PUNCT = re.compile(r"([,!?।:.])")


def phonemes(text):
    """Split at punctuation so pauses/intonation survive (Piper keeps terminators)."""
    parts = PUNCT.split(text)
    ph = []
    for i in range(0, len(parts), 2):
        chunk = parts[i].strip()
        mark = parts[i + 1] if i + 1 < len(parts) else ""
        mark = {"।": ".", ":": ","}.get(mark, mark)
        if chunk:
            ph.append(ipa(chunk) + mark)
    return unicodedata.normalize("NFD", " ".join(ph))


def synth(text, name, length_scale=1.0, noise=0.62, noise_w=0.75):
    sess, cfg = _model(name)
    m = cfg["phoneme_id_map"]
    ids = list(m["^"]) + list(m["_"])
    for ch in phonemes(text):
        if ch in m:
            ids += list(m[ch]) + list(m["_"])
    ids += list(m["$"])
    x = np.array([ids], np.int64)
    feeds = {"input": x, "input_lengths": np.array([x.shape[1]], np.int64),
             "scales": np.array([noise, length_scale, noise_w], np.float32)}
    names = [i.name for i in sess.get_inputs()]
    if "sid" in names:
        feeds["sid"] = np.array([0], np.int64)
    a = sess.run(None, feeds)[0].squeeze().astype(np.float32)
    return a, cfg["audio"]["sample_rate"]
