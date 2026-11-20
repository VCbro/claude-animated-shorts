---
name: body-3d-explainer
description: Write the image prompts and multi-clip video prompts for a hyper-realistic 3D "what happens inside your body when…" short (smoking, drinking cola, skipping sleep, eating sugar, a mosquito bite, cracking knuckles) for reference-driven video models such as Seedance 2.x on Higgsfield, Kling, Veo or Sora. Adapted from the commercial-pipeline method — identity lives in reference images, behaviour and timing live in a locked, segment-timed video prompt. Use whenever the user wants a realistic 3D medical / inside-the-body / science explainer reel, asks "X karne se body me kya hota hai" style videos, or gives any everyday topic and wants the best prompt for it.
---

# Body 3D explainer

Vertical 9:16 reels, 30–60 s, that go from a real person doing an everyday thing straight into a photoreal 3D journey through the body, beat by beat, with a timestamp or caption per beat.

```
STAGE 0  STORY      topic → 4–6 medically true beats + voiceover script
STAGE 1  ASSETS     image prompts → reference images (person, organs, hero particle)
STAGE 2  CLIPS      one locked video prompt per 10–15 s clip
STAGE 3  FIXES      diagnose a bad generation, rewrite only what broke
STAGE 4  FINISH     voiceover, captions, music in the editor (never in the model)
```

Video models cap a single generation at roughly 10–15 s, so a 45 s reel is three or four clips. Every clip prompt carries the same SHARED LOCKS block verbatim so the clips cut together.

## Reading order

| File | Read when |
|---|---|
| `references/story-and-science.md` | Stage 0 — turning a topic into beats, fact rules, VO script |
| `references/asset-prompts.md` | Stage 1 — any image prompt |
| `references/clip-prompt.md` | Stage 2 — writing a clip prompt |
| `references/example-smoking.md` | Before writing clips from scratch, for density and tone |
| `references/fix-playbook.md` | The user reports a problem with a generation |

## How to behave

- **Produce first, ask second.** A topic alone is enough. Assume 9:16, ~45 s, Seedance 2.x on Higgsfield, Hindi voiceover, and state the assumptions in one line at the end.
- **Science is a lock, not decoration.** Every beat must be medically true and stated without exaggeration. No invented numbers. If a timing is commonly cited (nicotine reaches the brain in about 10 seconds) use it; if it is not, describe the effect without a number. Health topics end on a neutral or positive note (what recovers when you stop), never on fear alone.
- **Every prompt in its own plain-text code block**, no markdown inside. Prompts stay in English; talk to the user in their language (Hindi/Hinglish if they write that way).
- **Never ask the model for on-screen text.** Timestamps, captions, labels and the title are added in the editor. Video models mangle text.
- **Always name the model and say batch 4**, and give three or four binary checks to judge the batch on.
- **Assign reference handles yourself.** The user never works out which image goes in which clip.
- **One stage per turn when iterating**; when the user asks for "the whole thing" for a new topic, deliver Stage 0 + 1 + 2 together, like the smoking example.

## The rules that matter most

1. **References carry identity, prompts carry behaviour.** The person, the organ, the hero particle (smoke, sugar crystal, caffeine molecule) each get a reference image on flat light.
2. **One visual language for the whole body.** Declare it once in SHARED LOCKS: wet glossy tissue, subsurface scattering, warm pink-red palette, macro depth of field, floating particles, volumetric light from an invisible source. Repeat it in every clip.
3. **Scale is stated, not implied.** Each clip names its SCALE LEVEL (BODY → ORGAN → TISSUE → CELL → MOLECULE). Every scale change happens through a visible push-in, never a jump.
4. **The hero particle has a COLOUR LOCK.** Smoke is always grey-blue, tar is always brown-black, nicotine is always amber. A substance that changes colour between clips reads as a different substance.
5. **Clip boundaries are bridges.** Each clip ends on the frame the next clip starts on (BRIDGE OUT / BRIDGE IN), so a hard cut between clips feels continuous.
6. **If something keeps breaking between cuts, give it its own lock** instead of describing it better inside every shot.
7. **Complexity budget.** One clip = one idea, four to six segments. Ten generations per reel is normal; when a clip is clean, stop.
