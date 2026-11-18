#!/usr/bin/env python3
"""GTA 6 viral clip cutter.

Turns a long GTA 6 video (YouTube link or local file) into vertical 9:16
shorts with a hook title, word-by-word captions, a progress bar and
loudness-normalised audio.

Commands
  fetch   SOURCE  -o WORK            download / copy the source video
  analyze WORK    [-n 12]            transcript + action signals + ranked candidates
  render  WORK    --plan clips.json  render the clips listed in a plan
  auto    SOURCE  -o WORK [-n 5]     fetch + analyze + render with automatic picks

The "best" results come from: fetch -> analyze -> (Claude reads candidates.md,
looks at the contact sheets, writes clips.json with hooks) -> render.
"""
import argparse
import csv
import json
import math
import os
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
FONTS_DIR = HERE / "fonts"
CACHE = Path(os.environ.get("GTA6CLIPPER_CACHE", Path.home() / ".cache" / "gta6clipper"))
W, H = 1080, 1920
FPS = 30

# Words that usually mean "something exciting is happening" in GTA content.
HYPE_WORDS = {
    # en
    "insane", "crazy", "wow", "omg", "whoa", "wait", "look", "leak", "leaked", "leaks",
    "secret", "hidden", "easter", "egg", "trailer", "vice", "city", "lucia", "jason",
    "cops", "police", "chase", "heist", "robbery", "explosion", "crash", "gun", "shootout",
    "map", "biggest", "never", "first", "new", "release", "date", "rockstar", "real",
    "realistic", "graphics", "detail", "details", "physics", "unbelievable", "huge",
    "confirmed", "breaking", "finally", "massive", "best", "worst", "fail", "funny",
    # hinglish / hindi (roman)
    "bhai", "pagal", "kya", "dekho", "dekh", "mast", "khatarnak", "zabardast", "bawal",
    "gajab", "kamaal", "sach", "pakka", "naya", "pehli", "baar",
}
OUTRO_WORDS = {"subscribe", "sponsor", "sponsored", "patreon", "merch", "notification", "bell"}

AUTO_HOOKS = [
    "GTA 6 MEIN YE DEKHA?",
    "WAIT FOR THE END...",
    "YE DETAIL KISI NE NOTICE NAHI KI",
    "GTA 6 IS ON ANOTHER LEVEL",
    "ROCKSTAR NE YE KAISE KIYA?!",
    "SABSE PAGAL GTA 6 MOMENT",
    "THIS IS WHY GTA 6 WILL BREAK RECORDS",
    "BHAI YE GAME NAHI REALITY HAI",
]


# ----------------------------------------------------------------- helpers
def log(*a):
    print("[clipper]", *a, file=sys.stderr, flush=True)


def run(cmd, **kw):
    log(" ".join(str(c) for c in cmd)[:300])
    return subprocess.run(cmd, check=True, **kw)


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        check=True, capture_output=True, text=True).stdout
    j = json.loads(out)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in j["streams"] if s["codec_type"] == "audio"), None)
    return {
        "duration": float(j["format"]["duration"]),
        "width": int(v["width"]) if v else 0,
        "height": int(v["height"]) if v else 0,
        "has_audio": a is not None,
    }


def is_url(s):
    return bool(re.match(r"^https?://", s))


def zscore(x):
    x = np.asarray(x, dtype=float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 1e-9 else np.zeros_like(x)


def smooth(x, k):
    if k <= 1:
        return np.asarray(x, dtype=float)
    ker = np.ones(k) / k
    return np.convolve(np.pad(x, (k // 2, k - 1 - k // 2), mode="edge"), ker, mode="valid")


def fmt_ts(t):
    m, s = divmod(max(t, 0), 60)
    return f"{int(m):02d}:{s:05.2f}"


# ------------------------------------------------------------------- fetch
def cmd_fetch(args):
    work = Path(args.out)
    work.mkdir(parents=True, exist_ok=True)
    dst = work / "source.mp4"
    if is_url(args.source):
        tmpl = str(work / "dl.%(ext)s")
        cmd = ["yt-dlp", "-f", f"bv*[height<={args.max_height}]+ba/b[height<={args.max_height}]/b",
               "--merge-output-format", "mp4", "--no-playlist", "-o", tmpl,
               "--write-info-json", args.source]
        if args.cookies:
            cmd[1:1] = ["--cookies", args.cookies]
        run(cmd)
        got = next(p for p in work.glob("dl.*") if p.suffix in (".mp4", ".mkv", ".webm"))
        info = next(work.glob("dl.info.json"), None)
        if info:
            j = json.loads(info.read_text())
            meta = {k: j.get(k) for k in ("title", "uploader", "channel", "webpage_url", "duration", "upload_date")}
            (work / "source_info.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))
            info.unlink()
        src = got
    else:
        src = Path(args.source)
        if not src.exists():
            sys.exit(f"File not found: {src}")
        (work / "source_info.json").write_text(json.dumps({"title": src.stem, "file": str(src)}, indent=2))
    # Normalise container to mp4 (copy streams when possible, re-encode otherwise).
    try:
        run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-map", "0:v:0", "-map", "0:a:0?",
             "-c", "copy", "-movflags", "+faststart", str(dst)])
    except subprocess.CalledProcessError:
        run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-map", "0:v:0", "-map", "0:a:0?",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", str(dst)])
    if src.parent == work and src != dst:
        src.unlink(missing_ok=True)
    p = probe(dst)
    log(f"source ready: {dst} {p['width']}x{p['height']} {p['duration']:.1f}s")
    return dst


# ----------------------------------------------------------- transcription
def extract_wav(src, dst, sr=16000):
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", str(sr),
         "-c:a", "pcm_s16le", str(dst)])


def load_wav(path):
    with wave.open(str(path)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
        return a, w.getframerate()


def transcribe_faster_whisper(wav, lang, model):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(str(wav), language=None if lang == "auto" else lang,
                              word_timestamps=True, vad_filter=True, beam_size=5)
    words, segments = [], []
    for s in segs:
        segments.append({"start": s.start, "end": s.end, "text": s.text.strip()})
        for w in (s.words or []):
            if w.word.strip():
                words.append({"start": w.start, "end": w.end, "word": w.word.strip()})
    return {"engine": f"faster-whisper:{model}", "language": info.language,
            "segments": segments, "words": words}


def transcribe_sherpa(wav, lang, model):
    """Offline fallback: Silero VAD + Whisper (onnx) from GitHub releases.
    Word times are spread across each short VAD chunk by character length."""
    import sherpa_onnx
    mdir = CACHE / f"sherpa-onnx-whisper-{model}"
    vad_path = CACHE / "silero_vad.onnx"
    if not mdir.exists() or not vad_path.exists():
        raise RuntimeError(f"sherpa model missing in {CACHE}; run install.sh")
    q = "int8." if (mdir / f"{model}-encoder.int8.onnx").exists() else ""
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(mdir / f"{model}-encoder.{q}onnx"), decoder=str(mdir / f"{model}-decoder.{q}onnx"),
        tokens=str(mdir / f"{model}-tokens.txt"), language="" if lang == "auto" else lang,
        task="transcribe", num_threads=os.cpu_count() or 4)
    cfg = sherpa_onnx.VadModelConfig()
    cfg.silero_vad.model = str(vad_path)
    cfg.silero_vad.min_silence_duration = 0.25
    cfg.silero_vad.min_speech_duration = 0.25
    cfg.silero_vad.max_speech_duration = 6.0
    cfg.sample_rate = 16000
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=60)
    audio, sr = load_wav(wav)
    chunks = []

    def drain():
        while not vad.empty():
            chunks.append((vad.front.start / sr, np.array(vad.front.samples, dtype=np.float32)))
            vad.pop()

    win = cfg.silero_vad.window_size
    for i in range(0, len(audio), win):
        vad.accept_waveform(audio[i:i + win])
        drain()
    vad.flush()
    drain()
    words, segments = [], []
    for k, (t0, samples) in enumerate(chunks):
        st = rec.create_stream()
        st.accept_waveform(sr, samples)
        rec.decode_stream(st)
        text = st.result.text.strip()
        if not text:
            continue
        t1 = t0 + len(samples) / sr
        segments.append({"start": t0, "end": t1, "text": text})
        toks = text.split()
        total = sum(len(w) + 1 for w in toks)
        t = t0
        for w in toks:
            d = (t1 - t0) * (len(w) + 1) / total
            words.append({"start": round(t, 3), "end": round(t + d, 3), "word": w})
            t += d
        if k % 20 == 0:
            log(f"  transcribed {t1:.0f}s / {len(audio) / sr:.0f}s")
    return {"engine": f"sherpa-whisper:{model}", "language": lang, "segments": segments, "words": words}


def transcribe(wav, lang, model, engine):
    errs = []
    order = {"auto": ["faster-whisper", "sherpa"], "faster-whisper": ["faster-whisper"],
             "sherpa": ["sherpa"], "none": []}[engine]
    for e in order:
        try:
            log(f"transcribing with {e} ({model}) ...")
            if e == "faster-whisper":
                return transcribe_faster_whisper(wav, lang, model)
            return transcribe_sherpa(wav, lang, model)
        except Exception as ex:  # model download blocked, missing package, etc.
            errs.append(f"{e}: {ex}")
            log(f"  {e} unavailable: {str(ex)[:200]}")
    log("no transcript (captions will be skipped)")
    return {"engine": "none", "language": lang, "segments": [], "words": [], "errors": errs}


# ------------------------------------------------------------------ signals
def audio_loudness(wav, dur):
    a, sr = load_wav(wav)
    n = int(math.ceil(dur))
    out = np.full(n, -60.0)
    for i in range(n):
        seg = a[i * sr:(i + 1) * sr]
        if len(seg):
            out[i] = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-6)
    return out


def video_motion(src, dur, fps=4):
    """Mean abs frame difference (motion) and hard cuts per second, at low res."""
    w, h = 160, 90
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"fps={fps},scale={w}:{h},format=gray",
                          "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    n = int(math.ceil(dur))
    motion, cuts = np.zeros(n), np.zeros(n)
    cnt = np.zeros(n)
    prev, i = None, 0
    while True:
        buf = p.stdout.read(w * h)
        if len(buf) < w * h:
            break
        f = np.frombuffer(buf, dtype=np.uint8).astype(np.int16)
        if prev is not None:
            d = np.abs(f - prev).mean() / 255.0
            s = min(int(i / fps), n - 1)
            motion[s] += d
            cnt[s] += 1
            if d > 0.18:
                cuts[s] += 1
        prev, i = f, i + 1
    p.wait()
    motion = np.where(cnt > 0, motion / np.maximum(cnt, 1), 0)
    return motion, cuts


def word_signals(words, dur):
    n = int(math.ceil(dur))
    speech, hype, outro = np.zeros(n), np.zeros(n), np.zeros(n)
    for w in words:
        s = min(int(w["start"]), n - 1)
        token = re.sub(r"[^\w]", "", w["word"].lower())
        speech[s] += 1
        if token in HYPE_WORDS or w["word"].endswith("!"):
            hype[s] += 1
        if token in OUTRO_WORDS:
            outro[s] += 1
    return speech, hype, outro


# ---------------------------------------------------------------- selection
def score_windows(sig, dur, min_len, max_len, words):
    loud, motion, cuts, speech, hype, outro = (np.asarray(sig[k]) for k in
                                               ("loudness", "motion", "cuts", "speech", "hype", "outro"))
    has_speech = speech.sum() > 5
    interest = (0.35 * zscore(smooth(loud, 3)) + 0.30 * zscore(smooth(motion, 3))
                + 0.15 * np.minimum(cuts, 3) + (0.20 * zscore(smooth(speech, 3)) if has_speech else 0)
                + 0.6 * np.minimum(hype, 2) - 2.0 * outro)
    n = len(interest)
    lens = sorted({int(min_len), int((min_len + max_len) / 2), int(max_len)})
    cands = []
    for L in lens:
        if L >= n:
            continue
        for s in range(0, n - L, 1):
            win = interest[s:s + L]
            hook = interest[s:s + 3].mean()
            sc = win.mean() + 0.5 * hook + 0.15 * np.percentile(win, 90) + 0.02 * math.log(L)
            cands.append((sc, s, s + L))
    cands.sort(reverse=True)
    return cands, interest


def snap(start, end, words, cuts, dur):
    """Move start/end so we do not cut in the middle of a sentence / word."""
    if words:
        starts = [w["start"] for w in words]
        # start: prefer a word that follows a pause (sentence start) within -2..+1.5s
        best = None
        for i, w in enumerate(words):
            if start - 2 <= w["start"] <= start + 1.5:
                gap = w["start"] - (words[i - 1]["end"] if i else 0)
                if gap >= 0.35 and (best is None or abs(w["start"] - start) < abs(best - start)):
                    best = w["start"]
        if best is not None:
            start = max(0, best - 0.15)
        # end: finish just after a word that precedes a pause within -2..+3s
        best = None
        for i, w in enumerate(words):
            if end - 2 <= w["end"] <= end + 3:
                nxt = starts[i + 1] if i + 1 < len(starts) else dur
                if nxt - w["end"] >= 0.35 or w["word"][-1:] in ".!?":
                    if best is None or abs(w["end"] - end) < abs(best - end):
                        best = w["end"]
        if best is not None:
            end = min(dur, best + 0.35)
    else:
        # no speech: start right on a scene cut if one is close
        for d in (0, -1, 1, -2, 2):
            k = int(start) + d
            if 0 <= k < len(cuts) and cuts[k] > 0:
                start = float(k)
                break
    return round(start, 2), round(end, 2)


def pick(cands, count, words, cuts, dur, gap=5):
    chosen = []
    for sc, s, e in cands:
        if all(e + gap <= c["start"] or s >= c["end"] + gap for c in chosen):
            s2, e2 = snap(s, e, words, cuts, dur)
            chosen.append({"start": s2, "end": e2, "score": round(float(sc), 3)})
        if len(chosen) >= count:
            break
    return chosen


def text_between(words, s, e):
    return " ".join(w["word"] for w in words if s <= w["start"] < e)


def contact_sheet(src, s, e, out):
    """4 frames across the clip, side by side, for a quick visual check."""
    import cv2
    frames = []
    for t in np.linspace(s + 0.5, e - 0.5, 4):
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", str(src), "-frames:v", "1",
                            "-vf", "scale=400:-2", "-f", "image2pipe", "-vcodec", "png", "-"],
                           capture_output=True)
        img = cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            cv2.putText(img, fmt_ts(t), (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            frames.append(img)
    if frames:
        hmin = min(f.shape[0] for f in frames)
        cv2.imwrite(str(out), cv2.hconcat([f[:hmin] for f in frames]))


def cmd_analyze(args):
    work = Path(args.work)
    src = work / "source.mp4"
    p = probe(src)
    dur = p["duration"]
    wav = work / "audio16k.wav"
    if p["has_audio"]:
        extract_wav(src, wav)
    tr_path = work / "transcript.json"
    if tr_path.exists() and not args.retranscribe:
        tr = json.loads(tr_path.read_text())
        log(f"using cached transcript ({tr['engine']})")
    else:
        tr = transcribe(wav, args.lang, args.model, args.engine) if p["has_audio"] else \
            {"engine": "none", "segments": [], "words": []}
        tr_path.write_text(json.dumps(tr, ensure_ascii=False, indent=1))
    words = tr["words"]
    log("measuring loudness and motion ...")
    loud = audio_loudness(wav, dur) if p["has_audio"] else np.zeros(int(math.ceil(dur)))
    motion, cuts = video_motion(src, dur)
    speech, hype, outro = word_signals(words, dur)
    sig = {"loudness": loud.tolist(), "motion": motion.tolist(), "cuts": cuts.tolist(),
           "speech": speech.tolist(), "hype": hype.tolist(), "outro": outro.tolist()}
    (work / "signals.json").write_text(json.dumps(sig))
    min_len = min(args.min_len, max(5, dur * 0.5))
    max_len = min(args.max_len, max(min_len + 1, dur - 1))
    cands, interest = score_windows(sig, dur, min_len, max_len, words)
    picked = pick(cands, args.n, words, cuts, dur)
    thumbs = work / "thumbs"
    thumbs.mkdir(exist_ok=True)
    for i, c in enumerate(picked, 1):
        c["id"] = i
        c["text"] = text_between(words, c["start"], c["end"])
        c["peak_loud_db"] = round(float(max(loud[int(c["start"]):int(c["end"]) + 1])), 1)
        c["sheet"] = str(thumbs / f"cand_{i:02d}.jpg")
        contact_sheet(src, c["start"], c["end"], c["sheet"])
    (work / "candidates.json").write_text(json.dumps(picked, indent=1, ensure_ascii=False))
    info = json.loads((work / "source_info.json").read_text()) if (work / "source_info.json").exists() else {}
    md = [f"# Candidates for: {info.get('title', src.name)}",
          f"Duration {fmt_ts(dur)} | transcript: {tr['engine']} | {len(words)} words", ""]
    for c in picked:
        md += [f"## #{c['id']}  {fmt_ts(c['start'])} - {fmt_ts(c['end'])}  ({c['end'] - c['start']:.0f}s)  "
               f"score {c['score']}  peak {c['peak_loud_db']} dB",
               f"sheet: {c['sheet']}", "", f"> {c['text'] or '(no speech: action / music)'}", ""]
    (work / "candidates.md").write_text("\n".join(md))
    log(f"{len(picked)} candidates -> {work / 'candidates.md'}")
    return picked


# ------------------------------------------------------------------ render
def ass_escape(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")").replace("\n", " ")


def ass_time(t):
    t = max(0.0, t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def chunk_words(words, max_words=3, max_chars=16, pause=0.45):
    chunks, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or sum(len(x["word"]) + 1 for x in cur) + len(w["word"]) > max_chars
                    or w["start"] - cur[-1]["end"] > pause or cur[-1]["word"][-1:] in ".!?,"):
            chunks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    return chunks


def build_ass(words, clip_s, clip_e, hook, opts):
    dur = clip_e - clip_s
    font = opts["font"]
    hi = opts["highlight"]  # ASS colour &HBBGGRR&
    hook_secs = dur if opts["hook_secs"] <= 0 else min(opts["hook_secs"], dur)
    cap_y = opts["cap_y"]
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
        "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Cap,{font},{opts['cap_size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,2,0,1,"
        f"9,4,5,60,60,0,1",
        f"Style: Hook,{font},{opts['hook_size']},&H00FFFFFF,&H00FFFFFF,{opts['hook_box']},&H00000000,0,0,0,0,"
        f"100,100,1,0,3,22,0,5,70,70,0,1",
        "",
        "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    if hook:
        txt = ass_escape(hook.upper())
        lines.append(f"Dialogue: 2,{ass_time(0)},{ass_time(hook_secs)},Hook,,0,0,0,,"
                     f"{{\\pos({W // 2},{opts['hook_y']})\\fscx60\\fscy60\\t(0,180,\\fscx108\\fscy108)"
                     f"\\t(180,300,\\fscx100\\fscy100)}}{txt}")
    if opts["captions"]:
        ws = [dict(w, start=w["start"] - clip_s, end=w["end"] - clip_s) for w in words
              if clip_s <= w["start"] < clip_e]
        for ch in chunk_words(ws):
            for j, w in enumerate(ch):
                t0 = w["start"]
                t1 = ch[j + 1]["start"] if j + 1 < len(ch) else max(w["end"], t0 + 0.25)
                parts = []
                for k, x in enumerate(ch):
                    t = ass_escape(x["word"].upper())
                    if k == j:
                        parts.append(f"{{\\c{hi}\\fscx112\\fscy112}}{t}{{\\c&H00FFFFFF&\\fscx100\\fscy100}}")
                    else:
                        parts.append(t)
                pop = "\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)" if j == 0 else ""
                lines.append(f"Dialogue: 1,{ass_time(t0)},{ass_time(min(t1, dur))},Cap,,0,0,0,,"
                             f"{{\\pos({W // 2},{cap_y}){pop}}}" + " ".join(parts))
    return "\n".join(lines) + "\n"


def track_centers(src, s, e, src_w, src_h, crop_w, fps=6):
    """Follow the action: centroid of frame-difference energy, heavily smoothed."""
    sw = 320
    sh = int(round(src_h * sw / src_w / 2) * 2)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{s:.3f}", "-t", f"{e - s:.3f}", "-i", str(src),
                          "-vf", f"fps={fps},scale={sw}:{sh},format=gray", "-f", "rawvideo", "-"],
                         stdout=subprocess.PIPE)
    xs, prev = [], None
    cols = np.arange(sw)
    while True:
        buf = p.stdout.read(sw * sh)
        if len(buf) < sw * sh:
            break
        f = np.frombuffer(buf, np.uint8).reshape(sh, sw).astype(np.int16)
        if prev is None:
            xs.append(sw / 2)
        else:
            d = np.abs(f - prev).sum(axis=0).astype(float)
            d -= np.median(d)
            d = np.clip(d, 0, None)
            xs.append((cols * d).sum() / d.sum() if d.sum() > sw * 2 else xs[-1])
        prev = f
    p.wait()
    xs = np.array(xs or [sw / 2]) * src_w / sw
    xs = smooth(xs, max(3, int(fps * 2.5)))   # ~2.5 s moving average
    xs = smooth(xs, max(3, int(fps * 1.5)))
    half = crop_w / 2
    xs = np.clip(xs - half, 0, src_w - crop_w)
    return [(i / fps, float(x)) for i, x in enumerate(xs)]


def render_clip(src, info, clip, words, out_mp4, opts, workdir):
    s, e = float(clip["start"]), float(clip["end"])
    dur = e - s
    mode = clip.get("mode", opts["mode"])
    sw, sh = info["width"], info["height"]
    ass = workdir / (out_mp4.stem + ".ass")
    ass.write_text(build_ass(words, s, e, clip.get("hook", ""), dict(
        opts, cap_y=opts["cap_y"] if opts["cap_y"] else (1480 if mode == "blur" else 1340))), encoding="utf-8")
    vin = "[0:v]"
    pre = f"{vin}fps={FPS},setsar=1"
    if mode == "blur":
        keep = float(clip.get("zoom", opts["zoom"]))  # fraction of width kept in the sharp middle band
        fg_w = int(sw * keep) // 2 * 2
        vf = (f"{pre},split[a][b];"
              f"[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,gblur=sigma=12,"
              f"scale={W}:{H},eq=brightness=-0.12:saturation=1.3[bg];"
              f"[b]crop={fg_w}:{sh}:{(sw - fg_w) // 2}:0,scale={W}:-2[fg];"
              f"[bg][fg]overlay=(W-w)/2:(H-h)/2-60[v0]")
    else:
        crop_w = int(sh * 9 / 16) // 2 * 2
        if crop_w > sw:  # already vertical / narrow source
            vf = f"{pre},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}[v0]"
        elif mode == "track":
            cmds = workdir / (out_mp4.stem + ".cmd")
            cmds.write_text("".join(f"{t:.3f} crop x {int(x)};\n" for t, x in
                                    track_centers(src, s, e, sw, sh, crop_w)))
            cpath = str(cmds).replace("\\", "/").replace(":", "\\:")
            vf = (f"{pre},sendcmd=f='{cpath}',crop={crop_w}:{sh}:{(sw - crop_w) // 2}:0,"
                  f"scale={W}:{H}[v0]")
        else:  # fill: static centre crop
            vf = f"{pre},crop={crop_w}:{sh}:{(sw - crop_w) // 2}:0,scale={W}:{H}[v0]"
    apath = str(ass).replace("\\", "/").replace(":", "\\:")
    fdir = str(FONTS_DIR).replace("\\", "/").replace(":", "\\:")
    vf += f";[v0]ass='{apath}':fontsdir='{fdir}'[v1]"
    if opts["progress_bar"]:
        vf += (f";color=c={opts['bar_color']}:s={W}x14:r={FPS}:d={dur:.3f}[bar];"
               f"[v1][bar]overlay=x='-w+w*t/{dur:.3f}':y=H-14:shortest=1[v]")
    else:
        vf += ";[v1]null[v]"
    cmd = ["ffmpeg", "-y", "-v", "error", "-stats", "-ss", f"{s:.3f}", "-t", f"{dur:.3f}", "-i", str(src),
           "-filter_complex", vf, "-map", "[v]"]
    if info["has_audio"]:
        cmd += ["-map", "0:a:0", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000",
                "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-c:v", "libx264", "-preset", opts["preset"], "-crf", str(opts["crf"]), "-maxrate", "14M", "-bufsize", "28M", "-pix_fmt", "yuv420p",
            "-profile:v", "high", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(out_mp4)]
    run(cmd)
    # Preview frame for QA
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{min(1.5, dur / 2):.2f}", "-i", str(out_mp4),
                    "-frames:v", "1", "-vf", "scale=540:-2", str(out_mp4.with_suffix(".jpg"))])


def hex_to_ass(hx):
    hx = hx.lstrip("#")
    r, g, b = hx[0:2], hx[2:4], hx[4:6]
    return f"&H00{b}{g}{r}&".upper()


def render_opts(args):
    return {
        "mode": args.mode, "zoom": args.zoom, "font": args.font, "cap_size": args.cap_size,
        "hook_size": args.hook_size, "hook_y": args.hook_y, "cap_y": args.cap_y,
        "highlight": hex_to_ass(args.highlight), "hook_box": hex_to_ass(args.hook_box).replace("&H00", "&H00"),
        "hook_secs": args.hook_secs, "captions": not args.no_captions, "progress_bar": not args.no_bar,
        "bar_color": "0x" + args.highlight.lstrip("#"), "preset": args.preset, "crf": args.crf,
    }


def cmd_render(args, plan=None):
    work = Path(args.work)
    src = work / "source.mp4"
    info = probe(src)
    tr = json.loads((work / "transcript.json").read_text()) if (work / "transcript.json").exists() else {"words": []}
    words = tr["words"]
    if plan is None:
        plan = json.loads(Path(args.plan).read_text())
    outdir = work / "clips"
    outdir.mkdir(exist_ok=True)
    tmp = work / "tmp"
    tmp.mkdir(exist_ok=True)
    opts = render_opts(args)
    rows = []
    for i, c in enumerate(plan, 1):
        slug = re.sub(r"[^a-z0-9]+", "-", (c.get("title") or c.get("hook") or f"clip{i}").lower()).strip("-")[:40]
        out = outdir / f"{i:02d}_{slug or 'clip'}.mp4"
        log(f"render {i}/{len(plan)}: {fmt_ts(c['start'])}-{fmt_ts(c['end'])} -> {out.name}")
        render_clip(src, info, c, words, out, opts, tmp)
        rows.append({"file": str(out), "start": c["start"], "end": c["end"],
                     "duration": round(float(c["end"]) - float(c["start"]), 1),
                     "hook": c.get("hook", ""), "title": c.get("title", ""),
                     "description": c.get("description", ""), "hashtags": c.get("hashtags", ""),
                     "score": c.get("score", "")})
    with open(outdir / "metadata.csv", "w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    kit = ["# Post kit", ""]
    for r in rows:
        kit += [f"## {Path(r['file']).name}  ({r['duration']}s)", f"**Title:** {r['title']}",
                f"**Caption:** {r['description']}", f"**Hashtags:** {r['hashtags']}", ""]
    (outdir / "post_kit.md").write_text("\n".join(kit), encoding="utf-8")
    shutil.rmtree(tmp, ignore_errors=True)
    log(f"done: {len(rows)} clips in {outdir}")
    return rows


def cmd_auto(args):
    args.out = args.out
    cmd_fetch(args)
    args.work = args.out
    picked = cmd_analyze(args)
    plan = []
    for i, c in enumerate(picked):
        plan.append(dict(c, hook=AUTO_HOOKS[i % len(AUTO_HOOKS)],
                         title=f"GTA 6 clip #{i + 1}",
                         description="GTA 6 ka ye moment dekh ke dimaag hil gaya! Comment karo tumhe kya laga 👇",
                         hashtags="#gta6 #gtavi #gta #rockstargames #vicecity #gaming #shorts #viral"))
    (Path(args.out) / "clips.json").write_text(json.dumps(plan, indent=1, ensure_ascii=False))
    return cmd_render(args, plan)


def add_render_args(p):
    g = p.add_argument_group("render style")
    g.add_argument("--mode", default="blur", choices=["blur", "track", "fill"],
                   help="blur: full frame on blurred bg (keeps HUD). track: 9:16 crop that follows action. "
                        "fill: static centre crop")
    g.add_argument("--zoom", type=float, default=0.86, help="blur mode: fraction of width kept (0.6-1.0)")
    g.add_argument("--font", default="Anton")
    g.add_argument("--cap-size", type=int, default=118)
    g.add_argument("--hook-size", type=int, default=86)
    g.add_argument("--hook-y", type=int, default=380)
    g.add_argument("--cap-y", type=int, default=0, help="caption centre y (0 = auto)")
    g.add_argument("--highlight", default="#FFE600", help="active word + progress bar colour")
    g.add_argument("--hook-box", default="#E6007E", help="hook box colour (Vice City pink)")
    g.add_argument("--hook-secs", type=float, default=0, help="show hook for N s (0 = whole clip)")
    g.add_argument("--no-captions", action="store_true")
    g.add_argument("--no-bar", action="store_true")
    g.add_argument("--preset", default="medium")
    g.add_argument("--crf", type=int, default=19)


def add_analyze_args(p):
    p.add_argument("-n", type=int, default=8, help="number of candidate clips")
    p.add_argument("--min-len", type=float, default=20)
    p.add_argument("--max-len", type=float, default=45)
    p.add_argument("--lang", default="auto", help="auto | en | hi ...")
    p.add_argument("--model", default="base", help="whisper size: tiny | base | small | medium")
    p.add_argument("--engine", default="auto", choices=["auto", "faster-whisper", "sherpa", "none"])
    p.add_argument("--retranscribe", action="store_true")


def add_fetch_args(p):
    p.add_argument("source", help="YouTube URL or local video file")
    p.add_argument("-o", "--out", required=True, help="work folder")
    p.add_argument("--max-height", type=int, default=1080)
    p.add_argument("--cookies", help="cookies.txt for yt-dlp (age-gated / bot-check videos)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("fetch")
    add_fetch_args(p)
    p = sub.add_parser("analyze")
    p.add_argument("work")
    add_analyze_args(p)
    p = sub.add_parser("render")
    p.add_argument("work")
    p.add_argument("--plan", required=True)
    add_render_args(p)
    p = sub.add_parser("auto")
    add_fetch_args(p)
    add_analyze_args(p)
    add_render_args(p)
    a = ap.parse_args()
    {"fetch": cmd_fetch, "analyze": cmd_analyze, "render": cmd_render, "auto": cmd_auto}[a.cmd](a)


if __name__ == "__main__":
    main()
