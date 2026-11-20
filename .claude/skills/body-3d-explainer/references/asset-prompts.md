# Stage 1 — asset image prompts

Plain text, one code block per asset, CAPS section labels, prose underneath:

```
[one declarative opening line]
BACKGROUND LOCK
SUBJECT
[COLOUR LOCK — for substances and particles]
[SCALE NOTE — what size this thing is in the film]
LIGHTING
COMPOSITION
STYLE
NEGATIVE
ASPECT RATIO
```

Recommended image models: Nano Banana Pro / GPT Image / Seedream on Higgsfield. Batch 4 per asset.

## Typical asset list (5–7)

| Handle | Asset | Light |
|---|---|---|
| image_1 | The person — three-view sheet | flat ambient, light grey bg |
| image_2 | The everyday object (cigarette, cola can, phone) on white | flat ambient, white |
| image_3 | Main organ, isolated, photoreal medical 3D | flat ambient, black bg |
| image_4 | Tissue / micro plate (alveoli, villi, blood vessel interior) | the film's interior lighting — this is the "location" |
| image_5 | Hero particle or substance (smoke wisps, tar droplets, sugar crystals) | flat, black bg |
| image_6 | Optional second organ (heart, brain, liver) | flat ambient, black bg |

## Rules

**Person: flat light, short anchors.** Three views: full-body front, full-body side, head-and-shoulders close-up. Four or five anchors only (hair, one garment, skin tone, age band, one accessory). Add a performance lock: *calm, natural, never theatrical*.

**Organs on pure black, not white.** Inside-the-body films are dark; a white-background organ drags white haze into the clip. Use the BACKGROUND LOCK four ways (behind, beneath, edges, what it is not) with black.

**The tissue plate is the location.** It is the one asset lit dramatically: warm subsurface glow, wet specular highlights, soft volumetric haze, deep falloff into darkness. Generate it empty — no particles in it — the particles arrive in the video.

**Healthy and damaged versions share a paragraph verbatim.** If the film shows clean pink alveoli and then tar-coated alveoli, the structure paragraph is copied word for word between the two prompts and only the COLOUR LOCK / surface paragraph changes. Say which paragraph is shared when delivering.

**No labels, arrows, text, UI or watermarks in any asset.** Put it in NEGATIVE every time.

## Blocks to reuse

```
BACKGROUND LOCK
The entire background is seamless pure black: black behind the subject, black beneath it, black to every edge of the frame. No room, no table, no gradient, no fog, no color anywhere in the background — only the subject floating on infinite clean black like a medical museum render.
```

```
STYLE
Hyper-realistic 3D medical visualization, photoreal anatomy, wet glossy organic surfaces, subsurface scattering in the tissue, fine capillary detail, macro photography depth of field, physically accurate materials, 8K detail. Anatomically correct proportions. Not cartoon, not illustration, not stylized, not plastic.
```

```
NEGATIVE
No text, no labels, no arrows, no annotations, no logos, no watermark, no UI. No gore, no open wounds, no surgical tools. No cartoon style, no toy-like plastic look, no extra or missing anatomical parts.
```

## Delivering

Name the model, batch 4, three binary checks (is the background black to every edge, is the anatomy correct, is there zero text). One line of assumptions.
