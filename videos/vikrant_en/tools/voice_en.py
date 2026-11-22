#!/usr/bin/env python3
"""English narration with Kokoro (offline) -> voice/voice.wav, out/anchors.json, out/captions.json, deliver/film_en.srt.
Each line is synthesised separately and laid end to end, so anchor (line start) times are exact.
Word times inside a line are spread by syllable-ish weight (they only drive the caption highlight)."""
import json, os, re
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda p: os.path.join(ROOT, p)
VOICE, SPEED, SR = os.environ.get("VOICE", "bm_george"), float(os.environ.get("SPEED", "0.95")), 24000

# (anchor or "", gap before in s, text)
L = [
    ("h0", 0.6, "In the middle of the ocean... above the waves... a fighter jet is coming in fast."),
    ("h_speed", 0.5, "Around two hundred and fifty kilometres an hour."),
    ("", 0.3, "Ahead of it, a runway just a few hundred metres long... on a ship that is moving."),
    ("h_stop", 0.6, "And then... in about three seconds... the jet comes to a complete stop."),
    ("h_this", 0.9, "This is INS Vikrant."),
    ("", 0.3, "Designed in India, built in India. India's own aircraft carrier."),
    ("h_city", 0.6, "More than two hundred and sixty metres long, this ship is an entire city floating on the sea."),
    ("h_how", 0.4, "But how do jets take off from such a short runway? And how do they land?"),
    ("h_go", 0.6, "Let's step inside Vikrant."),
    ("c1", 1.4, "A name that came back."),
    ("c1_old", 0.8, "Vikrant is not a new name."),
    ("", 0.3, "India's very first aircraft carrier was also called Vikrant,"),
    ("c1_1971", 0.15, "and it played a key role in the war of nineteen seventy-one."),
    ("c1_retire", 0.6, "After years of service, that old Vikrant was retired."),
    ("c1_2022", 0.7, "In twenty twenty-two, the name returned... but this time, on a new and far bigger ship, built entirely in India."),
    ("c1_cochin", 0.5, "It was built at Cochin Shipyard, and designed by the Indian Navy's own engineers."),
    ("c1_club", 0.5, "With it, India joined a small group of nations that can design and build their own aircraft carrier."),
    ("c2", 1.4, "A city on the sea."),
    ("c2_size", 0.8, "Now, think about its size."),
    ("c2_fields", 0.4, "It is about as long as two football fields."),
    ("c2_weight", 0.3, "It weighs around forty-five thousand tonnes."),
    ("c2_rooms", 0.5, "Inside, there are more than two thousand rooms and compartments. Many decks, long corridors, and a maze of ladders."),
    ("c2_people", 0.5, "Around sixteen hundred people live here."),
    ("c2_kitchen", 0.3, "A huge galley cooks for thousands, day and night."),
    ("c2_hosp", 0.5, "There is even a full hospital on board, with an operating theatre and an ICU."),
    ("c2_power", 0.5, "And its engines generate enough electricity to light up a small town."),
    ("c2_turb", 0.5, "Its power comes from four large gas turbines, which can push this giant ship faster than thirty kilometres an hour."),
    ("c2_steel", 0.5, "Even its special steel was developed in India."),
    ("c3", 1.4, "Take-off from a ski-jump."),
    ("c3_land", 0.8, "Now, the most interesting part. On land, a fighter jet usually needs a long runway to take off."),
    ("c3_space", 0.4, "But a ship doesn't have that much space."),
    ("c3_ramp", 0.5, "So at Vikrant's bow, the runway curves upward, like a ski slope. This is called a ski-jump."),
    ("c3_hold", 0.6, "Before take-off, the jet is held in place on the deck, while its engine spools up to full power."),
    ("c3_go", 0.6, "Then it is released... it races down the deck... and the ski-jump throws it upward into the air."),
    ("c3_lift", 0.5, "That upward throw gives the jet the vital moment it needs, for its wings to grip the air and reach flying speed."),
    ("c4", 1.4, "The three-second miracle."),
    ("c4_hard", 0.8, "Taking off is hard... but landing is even harder."),
    ("c4_hook", 0.5, "Under the tail of the jet is a strong hook, called a tailhook."),
    ("c4_wires", 0.5, "Across the deck lie thick steel cables, called arrestor wires."),
    ("c4_aim", 0.5, "The pilot has to land so that the hook catches one of these wires."),
    ("c4_snag", 0.5, "The hook snags the wire... the wire pulls out... and machines below the deck absorb that pull, little by little."),
    ("c4_stop", 0.6, "And a jet arriving at two hundred and fifty kilometres an hour comes to a stop in about three seconds."),
    ("c4_bolter", 0.8, "And if the hook misses every wire? The pilot instantly pushes the engine back to full power, and the jet takes off again, for another try."),
    ("c5", 1.4, "Guardian of the seas."),
    ("c5_30", 0.8, "Vikrant can carry around thirty aircraft, fighter jets and helicopters together."),
    ("c5_base", 0.5, "Wherever this ship goes, it takes an entire airbase with it."),
    ("c5_eyes", 0.5, "Eyes far across the ocean, and an instant answer when needed."),
    ("n0", 1.2, "So the next time you look at a picture of the sea... remember."),
    ("n_guard", 0.5, "Somewhere among those waves, a floating city built in India stands guard over the nation."),
    ("n_title", 0.9, "INS Vikrant... India on the sea."),
    ("n_cta", 1.0, "What surprised you the most about Vikrant? Tell us in the comments."),
]
SAY = {"INS": "I N S", "ICU": "I C U"}
P_PAUSE = {",": 0.14, ".": 0.32, "?": 0.32, "...": 0.42}


def syl(w):
    return max(1, len(re.findall(r"[aeiouy]+", w.lower())))


k = Kokoro(os.environ.get("MODELS", "/home/user/models") + "/kokoro.onnx", os.environ.get("MODELS", "/home/user/models") + "/voices.bin")
audio, t, anchors, caps = [], 0.0, {}, []
for name, gap, text in L:
    audio.append(np.zeros(int(gap * SR))); t += gap
    if name: anchors[name] = round(t, 2)
    # split into phrases at , . ? ... so pauses are controlled and phrase times are exact
    parts = [p for p in re.findall(r"[^,.?]+(?:\.\.\.|[,.?])?", text) if p.strip()]
    for ph in parts:
        ph = ph.strip(); punct = "..." if ph.endswith("...") else (ph[-1] if ph[-1] in ",.?" else "")
        spoken = " ".join(SAY.get(w.strip(".,?"), w) for w in ph.split())
        y, sr = k.create(spoken, voice=VOICE, speed=SPEED, lang="en-gb" if VOICE.startswith("b") else "en-us")
        nz = np.where(np.abs(y) > 0.01)[0]
        if len(nz): y = y[max(0, nz[0] - 240):nz[-1] + 1200]
        d = len(y) / SR; words = ph.split(); ws = np.cumsum([0] + [syl(w) + 0.5 for w in words]); ws = ws / ws[-1] * d
        caps.append(dict(t0=round(t - 0.05, 2), t1=round(t + d, 2), words=[dict(w=w, t=round(t + ws[i], 2)) for i, w in enumerate(words)]))
        audio.append(y); t += d
        pz = P_PAUSE.get(punct, 0.1); audio.append(np.zeros(int(pz * SR))); t += pz
audio.append(np.zeros(int(2.5 * SR))); t += 2.5
anchors["END"] = round(t, 2)
v = np.concatenate(audio); v = v / np.abs(v).max() * 0.9
sf.write(P("voice/voice.wav"), v, SR)

# merge short phrases into caption lines of <= 6 words (like the Hindi captions)
lines = []
for c in caps:
    for i in range(0, len(c["words"]), 6):
        ws = c["words"][i:i + 6]; nxt = c["words"][i + 6]["t"] if i + 6 < len(c["words"]) else c["t1"]
        lines.append(dict(t0=round(ws[0]["t"] - 0.05, 2), t1=round(nxt, 2), words=ws))
json.dump(anchors, open(P("out/anchors.json"), "w"), indent=1)
json.dump(lines, open(P("out/captions.json"), "w"), ensure_ascii=False)


def ts(x):
    h, m = divmod(int(x), 3600); m, s = divmod(m, 60); return f"{h:02}:{m:02}:{s:02},{int((x % 1) * 1000):03}"
with open(P("deliver/film_en.srt"), "w") as f:
    for i, c in enumerate(lines, 1):
        f.write(f"{i}\n{ts(max(0, c['t0']))} --> {ts(c['t1'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print("END", t, "lines", len(lines))
