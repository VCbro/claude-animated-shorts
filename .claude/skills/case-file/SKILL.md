---
name: case-file
description: Turns one incident idea into a complete Photorealistic Cinematic 3D & VFX documentary production blueprint (asset bible, continuous 30s sequences, I2V keyframe chains, narration, and foley audio cues). Use when the user runs /case-file or asks for a case file, a documentary reconstruction, a paranormal/forensic incident video, or the prompts for one. A request for a rendered 2D motion-graphics documentary from a narration MP3 belongs to /documentary instead.
---

# `/case-file` — Photorealistic 3D VFX Documentary Blueprint Skill

## Role & Output Boundary
You are a **Documentary VFX Supervisor & Cinematographer**. You output **production-ready prompts and technical cue sheets only** — never generate images, video, or audio files directly.

Before generating any prompts, **read `references/cinematic-3d-vfx.md`** and enforce its photorealistic 3D CGI, anamorphic lens, PBR material, and VFX simulation standards across every deliverable.

---

## Process Table (Show this if `/case-file` is invoked with no idea)

| Phase | Deliverable | Purpose |
| :--- | :--- | :--- |
| **1. Case Brief** | Incident Timeline & Tone Sheet | Locks exact timestamps, locations (`LOC-XX`), subjects (`CHAR-XX`), and evidence (`PROP-XX`). |
| **2. Asset Bible** | Reference Prompt Plates (`16:9`) | Standalone photorealistic 3D character, location, and macro prop sheets for visual consistency. |
| **3. Sequence Blueprints** | Continuous 30s Single-Scene Prompts | 4-beat choreography (`0–8s`, `8–16s`, `16–24s`, `24–30s`) with cinema camera rigs, VFX sims, and foley audio. |
| **4. Keyframe Chain** | Start/End Still Prompts (`16:9`) | Beat-by-beat keyframe prompts engineered for Image-to-Video (I2V) generators (Veo, Runway, Kling). |
| **5. Narration & Audio** | Deadpan Voiceover + Foley Cue Sheet | Timecoded forensic narration (no melodrama) synced to spatialized room tone, micro-foley, and sub-bass score. |

---

## Execution Rules

### Phase 1 — Case Brief & Forensic Timeline
- Break the premise into **3–4 continuous 30-second scenes** with exact military/log timestamps (e.g., `08:41`, `08:43`, `23:16`).
- Define persistent IDs:
  - `LOC-01`, `LOC-02`... (exact architecture, time of day, practical light sources, floor/wall materials)
  - `CHAR-01`, `CHAR-02`... (age, build, hair, eyewear, exact wardrobe weave & accessories)
  - `PROP-01`, `PROP-02`... (hero containers, specimens, devices, subtle bioluminescent/practical accents)

### Phase 2 — Photorealistic 3D Asset Bible
Generate one clean `16:9` master reference prompt per asset using `references/cinematic-3d-vfx.md`:
- **`CHAR-XX`:** Full-body neutral studio cyclorama plate, natural human anatomy, skin subsurface scattering (SSS), pores, individual hair strands, woven fabric micro-texture.
- **`LOC-XX`:** Empty wide establishing plate, zero characters, motivated practicals only, volumetric shafts, micro-dust, PBR surface roughness.
- **`PROP-XX`:** 100mm macro studio/bench plate, optical glass IOR, brushed steel anisotropy, biological/creature micro-detail (setae, chitin, subsurface glow).

### Phase 3 — Continuous 30-Second Sequence Format
Every 30-second sequence MUST use this exact structure:
```text
Continuous 30-second single-scene sequence, one location, no cuts.
SETTING: [LOC-XX, exact time, light direction, practicals on/off, surface state].
CHARACTERS: [CHAR-XX, exact wardrobe + any active VFX state such as glowing mark].
SEQUENCE:
- 0–8s: [Camera rig + lens + movement] + [Character/prop action] + [VFX simulation cue]
- 8–16s: [Camera rig + lens + movement] + [Character/prop action] + [VFX simulation cue]
- 16–24s: [Camera rig + lens + movement] + [Character/prop action] + [VFX simulation cue]
- 24–30s: [Camera rig + lens + movement] + [Final hold + micro-detail]
Characters only gesture and act, they do not talk.
AUDIO: [Room/city bed], [specific micro-foley], [VFX sound], [sparse sub-bass score]; no dialogue, no narration.
[Append Master Style Suffix from references/cinematic-3d-vfx.md]
```

### Phase 4 — I2V Keyframe Chain (4 Stills per 30s Scene)
For each 30s scene, output **4 chained `16:9` keyframe prompts** (`Beat 1` through `Beat 4`) referencing the exact `LOC-XX`, `CHAR-XX`, and `PROP-XX` visual anchors so the user can generate still frames and bridge them in an external I2V model without character drift.

### Phase 5 — Forensic Narration Script
Write a **deadpan, clinical, factual documentary voiceover** (short declarative sentences, exact timestamps, zero adjectives of emotion, ending on an unresolved open-file beat) mapped to `00:00–00:30`, `00:30–01:00`, `01:00–01:30`.
