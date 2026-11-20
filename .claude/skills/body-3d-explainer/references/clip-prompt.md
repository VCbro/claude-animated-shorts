# Stage 2 — clip prompt architecture

One prompt per 10–15 s clip. Same section order every time:

```
CLIP CONTEXT
ACTIVE REFERENCES
SHARED LOCKS            (identical text in every clip of the reel)
SCALE MAP
BRIDGE IN
FORMAT MODE
OPTICS
LIGHTING PROGRESSION
CAMERA
ACTION TIMING
PHYSICS
AUDIO
BRIDGE OUT
POSITIVE LOCKS
[global style tail]
```

## Handles

`<<<image_1>>>` … in attach order. One line each: identity anchors, then `100% matches the reference.` If the tool uses `@image1` / `@Image1` instead, swap the syntax but keep the lines. Describe what actually generated, not what was planned.

## Sections

**CLIP CONTEXT** — one paragraph: where this clip sits in the reel and the one idea it shows.

**SHARED LOCKS** — written once for the reel, pasted verbatim into every clip:
- VISUAL LANGUAGE: the interior style (wet glossy tissue, subsurface scattering, warm pink-red palette, floating micro-particles, volumetric light from an invisible source, macro depth of field).
- COLOUR LOCK: every substance and its one colour.
- PERSON LOCK: anchors of the person, same clothes, same location, in every exterior shot.
- TEXT LOCK: *no text, numbers, labels, arrows or UI anywhere in the frame.*
- TONE LOCK: *clinical and beautiful, never gore, never horror.*

**SCALE MAP** — the scale level of each segment (BODY / ORGAN / TISSUE / CELL / MOLECULE) and the rule: *scale only ever changes through a continuous on-screen push-in or pull-out, never a jump cut between two scales.*

**BRIDGE IN / BRIDGE OUT** — the exact first frame and last frame of the clip as an image. Clip N's BRIDGE OUT equals clip N+1's BRIDGE IN word for word. Also: *No empty establishing frame.*

**FORMAT MODE** — segment count, runtime, cut types, ban on everything else. Inside-body clips work best as one or two long continuous camera moves with one or two HARD CUTS, not ten quick cuts.

**OPTICS** — one LENS LOCK per segment in degrees of diagonal field of view (8° tele · 18° macro insert · 29° short tele · 47° normal · 84° wide · 107° wide rectilinear). Interior flythroughs: 84° with near-field particles passing the lens. Molecule close-ups: 18° with a focus plane millimetres deep. Close with *No lens drift mid-segment.*

**LIGHTING PROGRESSION** — named states by dominant source, tagged per segment. Typical: STATE A EXTERIOR (real room light), STATE B INTERIOR HEALTHY (warm pink subsurface glow), STATE C INTERIOR INVADED (the glow dims and cools as the substance spreads), STATE D RECOVERY (warmth returns). Bind transitions to an event: *STATE B drops to STATE C as the first smoke reaches the alveoli, not after.*

**CAMERA** — one law: *the camera travels like a slow drone through the body, smooth and continuous, always moving forward along the route of the substance.* State a SPEED LOCK for it.

**ACTION TIMING** — every segment: range to one decimal, ID, scale level, lighting tag, cut marker between segments. Describe the substance's motion physically (*grey-blue smoke rolls down the trachea in slow curling sheets*), never as intent.

**PHYSICS** — fluid behaviour of smoke / blood / liquid, cilia beat, how particles stick, mucus viscosity, heartbeat rhythm (pulse every 0.8 s), breathing expansion.

**AUDIO** — sound-design pass in order: muffled internal heartbeat, airflow whoosh, wet tissue sounds. SFX only — voiceover and music are added in the editor. *No speech, no music.*

**POSITIVE LOCKS** — every non-negotiable restated as a plain hard rule.

**Global style tail** — format 9:16 vertical, photoreal 3D medical visualization, film grain light, end on *NO TEXT. NO GORE. ANATOMICALLY ACCURATE.*

## Patterns

- **Start on the action.** The hook is the lighter flame already touching the cigarette, not someone reaching for the pack.
- **Enter through a real door.** Mouth, nostril, pore, pupil — the camera pushes in until the door fills the frame, then the interior begins. That push is the most shareable shot of the reel; give it 3–4 s.
- **Follow one particle.** A single hero smoke curl, sugar crystal or molecule that the camera chases through the route gives the eye something to track and hides scale changes.
- **Healthy then invaded at the same anchor.** Show the clean tissue first, then the same place being covered — the before/after inherits the anchor, like the commercial's box swap.
- **Breathing, pulse and flow everywhere.** A still interior reads as a render. Every interior segment has at least one rhythmic motion.
