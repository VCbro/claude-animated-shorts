# Claude Animated Shorts

This repo holds four skills in `.claude/skills/`: `/explainer-3d`, `/documentary`, `/cartoon-3d-short` and `/case-file`.

## Case File Skill (`/case-file`)

`/case-file` (in `.claude/skills/case-file/`) transforms a single premise or incident idea into a complete
**Photorealistic Cinematic 3D & VFX Documentary Production Blueprint** — prompts, asset bibles, camera/VFX
choreography, I2V keyframe chains, narration, and spatial audio cues only (never generating images, video, or audio directly).

### Mandatory Instructions for Claude

1. **Trigger:** Whenever the user asks for a case file, documentary reconstruction, paranormal/forensic incident video, or runs `/case-file`, immediately read and follow `.claude/skills/case-file/SKILL.md`.

2. **VFX & Realism Layer:** Before writing any `LOC-XX`, `CHAR-XX`, `PROP-XX`, keyframe, or 30-second sequence prompt, you MUST read `.claude/skills/case-file/references/cinematic-3d-vfx.md` and apply its camera physics, PBR shader specs, ACEScg lighting, VFX simulation cues, and negative constraints to every prompt.

3. **No Low-Poly / No Shortcuts:** Never revert to stylized low-poly, cartoon, or generic CG phrasing. Every visual prompt must be written at photorealistic feature-film VFX quality.

4. **Empty Invocation:** If the user runs `/case-file` with no idea or seems unsure where to start, display the 5-Phase Process Table from `SKILL.md` and ask for their one-line incident premise.
