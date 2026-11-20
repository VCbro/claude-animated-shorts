# Worked example — "Ek cigarette pine se body me kya hota hai"

9:16, about 46 s, four clips, Seedance 2.x on Higgsfield, Hindi voiceover added in the editor. Read for density and tone; do not copy the specific locks into an unrelated topic.

## Stage 0 — beats

| Time | Clip | Scale | What is seen | Fact basis |
|---|---|---|---|---|
| 0–3 s | 1 | BODY | Lighter flame touches cigarette, first drag | — |
| 3–12 s | 1 | BODY→ORGAN | Camera follows smoke into the mouth, down the trachea | Route: mouth → larynx → trachea |
| 12–18 s | 2 | TISSUE | Cilia on the airway wall beating, smoke slows them | Smoke slows/paralyses cilia (NHS, CDC) |
| 18–24 s | 2 | CELL | Pink alveoli, a thin brown tar film settles on them | Tar deposits in the lungs (CDC) |
| 24–30 s | 3 | CELL | Red blood cells: CO takes oxygen's seat on haemoglobin | CO binds haemoglobin far more strongly than oxygen (WHO) |
| 30–36 s | 3 | ORGAN | Amber nicotine reaches the brain, neurons light up; heart beats faster | Nicotine reaches the brain in ~10 s; heart rate and BP rise (NIDA, CDC) |
| 36–46 s | 4 | ORGAN→BODY | Lungs darken over "years", then pull out; warmth returns as recovery | 20 min heart rate drops, 12 h CO normal, 1–9 months cilia recover (WHO) |

Editor timestamps: `0 sec` · `10 sec` · `20 min` · `Saalon baad` · `Chhodne ke baad`.

## Voiceover (Hindi, ~110 words)

```
Ek kash. Bas ek.
Lekin is dhuen ke saath 7,000 se zyada chemicals aapke andar ja rahe hain.
Saans ki nali me chhote-chhote baal hote hain, cilia — jo gandagi bahar nikaalte hain. Dhuan unhe dheema kar deta hai.
Lungs ki in nanhi thailiyon par tar ki bhoori parat jamne lagti hai.
Khoon me carbon monoxide, oxygen ki jagah chheen leti hai.
Aur sirf das second me nicotine dimaag tak pahunch jaati hai — dil tez dhadakne lagta hai.
Saalon tak roz yahi hota hai.
Lekin achhi khabar — chhodne ke bees minute me dil shaant hone lagta hai, aur kuch mahino me lungs khud ko saaf karne lagte hain.
Faisla aapka.
```

("7,000 chemicals" — CDC: tobacco smoke contains more than 7,000 chemicals.)

## Stage 1 — assets

Model: Nano Banana Pro (or GPT Image / Seedream) on Higgsfield. Batch 4 each.

### image_1 — person sheet

```
A character reference sheet of one man shown three ways on one canvas: full-body front view, full-body side view, and a head-and-shoulders close-up.
BACKGROUND LOCK
The entire background is seamless plain light grey: grey behind him, grey beneath him, grey to every edge of the frame. No room, no props, no texture, no gradient.
SUBJECT
Indian man around 30, medium brown skin, short black hair neatly styled, light stubble, plain charcoal grey crew-neck t-shirt, dark blue jeans, a thin black wristwatch on the left wrist. Average build. Identical clothing, proportions and face in all three views.
PERFORMANCE
Calm, neutral, natural expression. Never theatrical.
LIGHTING
This is not a studio photoshoot. No studio lights, no softboxes, no hard key, no dramatic highlights. Plain soft ambient light wrapping him evenly from all sides, no visible light direction, no deep shadows. Only a faint soft contact shadow under the feet.
COMPOSITION
Three views side by side, evenly spaced, full figures uncropped, close-up at the right.
STYLE
Photorealistic, natural skin texture, real fabric, sharp focus.
NEGATIVE
No text, no labels, no logos on clothing, no cigarette, no props, no watermark.
ASPECT RATIO
16:9
```

### image_2 — cigarette

```
A single unbranded cigarette on pure white, catalog cutout.
BACKGROUND LOCK
The entire background is seamless pure white: white behind it, white surface beneath it, white to every edge of the frame. No table, no props, no texture, no gradient, no color anywhere in the background.
SUBJECT
One standard cigarette lying flat at a slight diagonal: plain white paper body, plain orange-tan cork-pattern filter, the tip unlit and clean. No brand print, no text, no logo.
LIGHTING
Plain soft ambient light from all sides, no hard key, no hotspots. Only a faint soft contact shadow directly beneath it.
COMPOSITION
Centered, whole cigarette in frame, generous white margin.
STYLE
Photoreal product cutout, sharp macro detail of paper texture.
NEGATIVE
No smoke, no ash, no lighter, no text, no logo, no hands.
ASPECT RATIO
1:1
```

### image_3 — lungs

```
A photoreal 3D medical visualization of healthy human lungs with trachea and bronchi, floating isolated on black.
BACKGROUND LOCK
The entire background is seamless pure black: black behind the subject, black beneath it, black to every edge of the frame. No room, no gradient, no fog, no color anywhere — only the lungs on infinite clean black like a medical museum render.
SUBJECT
Anatomically correct pair of healthy adult lungs, front view, the trachea rising from the top and splitting into the two main bronchi. Soft healthy pink tissue with fine lobular texture, delicate capillary veining, a slightly translucent wet surface. Correct lobe count: three on the right, two on the left.
LIGHTING
Soft even ambient light from all sides, gentle subsurface glow in the tissue, no dramatic key.
COMPOSITION
Lungs centered, entire organ and trachea in frame, nothing cropped.
STYLE
Hyper-realistic 3D medical visualization, wet glossy organic surfaces, subsurface scattering, fine capillary detail, physically accurate materials. Not cartoon, not plastic, not illustration.
NEGATIVE
No text, no labels, no arrows, no annotations, no watermark. No heart, no ribs, no gore, no damage, no dark spots.
ASPECT RATIO
9:16
```

### image_4 — alveoli plate (the "location")

```
An interior macro environment inside a human lung: a cluster of alveoli seen from within the airway, empty, lit like a cinematic film set.
SUBJECT
STRUCTURE (shared paragraph — keep word for word in any damaged version): a dense cluster of rounded grape-like alveolar sacs branching from a fine bronchiole, each sac a thin translucent membrane wrapped in a delicate mesh of red capillaries, the cluster receding in depth into darkness.
SURFACE
Healthy soft pink membranes, moist and glossy, clean, no deposits.
LIGHTING
A warm invisible light source glows from behind the sacs and shines through the thin membranes in soft pink-orange subsurface glow. Wet specular highlights on the curved surfaces. Soft volumetric haze in the air, deep falloff into dark red-black at the edges.
COMPOSITION
Camera inside the bronchiole looking forward into the cluster, foreground sac soft out of focus, middle sacs sharp, depth fading into darkness. Clear empty air in the middle of the frame for particles to travel through later.
STYLE
Hyper-realistic 3D medical visualization, macro photography depth of field, subsurface scattering, wet organic materials, 8K detail. Not cartoon, not plastic.
NEGATIVE
No smoke, no particles, no text, no labels, no arrows, no cells floating, no gore.
ASPECT RATIO
9:16
```

### image_5 — smoke and tar particle reference

```
A reference of cigarette smoke and tar particles floating on pure black.
BACKGROUND LOCK
The entire background is seamless pure black, black to every edge of the frame, no gradient, no color.
SUBJECT
Left half: soft curling sheets of thin grey-blue cigarette smoke, translucent, layered wisps. Right half: tiny suspended droplets of sticky brown-black tar, glossy, a few millimetres apart, some trailing thin threads.
COLOUR LOCK
Smoke is grey-blue only. Tar is brown-black only. Nothing else in any other color.
LIGHTING
Soft even light, the smoke lit gently from the side so its wisps read clearly.
STYLE
Photoreal macro, physically accurate smoke and viscous fluid.
NEGATIVE
No cigarette, no text, no labels, no glow, no fire.
ASPECT RATIO
1:1
```

### image_6 — brain and heart (optional)

```
A photoreal 3D medical visualization of a human brain and a human heart floating side by side on black.
BACKGROUND LOCK
The entire background is seamless pure black, black behind, beneath and to every edge, no gradient, no color.
SUBJECT
Left: anatomically correct human brain, side view, soft pale pink-grey cortex with clear folds. Right: anatomically correct human heart, front view, deep red muscle with branching coronary vessels.
LIGHTING
Soft even ambient light, gentle subsurface glow, no dramatic key.
STYLE
Hyper-realistic 3D medical visualization, wet glossy surfaces, subsurface scattering. Not cartoon, not plastic.
NEGATIVE
No text, no labels, no arrows, no skull, no gore.
ASPECT RATIO
16:9
```

Judge the batches on: background clean to every edge · anatomy correct · zero text anywhere · person's face clear in the close-up.

## Stage 2 — clips

Model: Seedance 2.x on Higgsfield, 9:16, 12 s per clip (10 s for clip 4), batch 4. Attach the images listed under each clip in that order.

### SHARED LOCKS (pasted into every clip)

```
SHARED LOCKS
VISUAL LANGUAGE: every interior shot is hyper-realistic 3D medical visualization — wet glossy organic tissue, subsurface scattering, warm pink-red palette, macro depth of field, fine floating micro-particles in the air, soft volumetric light from an invisible source. Every interior shot breathes or pulses: walls expand and contract with a slow breath every 4 seconds, capillaries pulse every 0.8 seconds.
COLOUR LOCK: cigarette smoke is ALWAYS grey-blue. Tar is ALWAYS brown-black. Nicotine is ALWAYS a faint amber glow carried in the blood. Carbon monoxide is ALWAYS tiny dark grey specks. Oxygen is ALWAYS tiny bright cyan-white specks. No substance ever changes colour.
PERSON LOCK: the man is always the same person from the reference — short black hair, light stubble, charcoal grey t-shirt, black wristwatch on the left wrist — in the same dim apartment balcony at dusk.
TEXT LOCK: there is no text, no numbers, no labels, no arrows, no captions, no UI anywhere in any frame.
TONE LOCK: clinical and beautiful, like a museum medical film. Never gore, never horror, never blood spilling.
```

### Clip 1 — hook and dive (0–12 s)

Attach: image_1, image_2, image_3, image_5

```
CLIP CONTEXT
First clip of a vertical health reel. A man takes one drag of a cigarette on a balcony at dusk, and the camera follows the smoke into his mouth and down his windpipe toward the lungs.

ACTIVE REFERENCES
<<<image_1>>>: Indian man around 30, medium brown skin, short black hair, light stubble, charcoal grey crew-neck t-shirt, thin black wristwatch on the left wrist. Calm, never theatrical. 100% matches the reference.
<<<image_2>>>: plain unbranded white cigarette with an orange-tan filter. 100% matches the reference.
<<<image_3>>>: healthy pink human lungs with trachea and bronchi. 100% matches the reference.
<<<image_5>>>: grey-blue smoke wisps and brown-black tar droplets. 100% matches the reference.

[PASTE SHARED LOCKS]

SCALE MAP
S1 BODY · S2 BODY to ORGAN · S3 ORGAN. Scale only ever changes through a continuous on-screen push-in, never a jump cut between two scales.

BRIDGE IN
The first visible frame is an extreme close-up: a lighter flame already touching the tip of <<<image_2>>> held between <<<image_1>>>'s lips, the tip igniting orange. No empty establishing frame.

FORMAT MODE
Three scripted segments across 12.0 seconds, one HARD CUT then one continuous push. No fades, no dissolves, no unscripted cuts.

OPTICS
LENS LOCK S1 = 29° short telephoto close-up on the face and cigarette, background balcony lights in soft bokeh.
LENS LOCK S2 = 47° standard normal, starting on the face and pushing continuously into the mouth.
LENS LOCK S3 = 84° wide interior flythrough, near-field smoke wisps passing the lens.
No lens drift mid-segment.

LIGHTING PROGRESSION
LIGHT STATE A — EXTERIOR, S1 and the start of S2. Cool blue dusk sky behind, a warm orange balcony bulb as the key on his face, the cigarette tip glowing.
LIGHT STATE B — INTERIOR HEALTHY, from the moment the lips fill the frame in S2 through S3. Warm pink-red subsurface glow through the tissue walls, wet specular highlights. LIGHT STATE A becomes LIGHT STATE B as the camera passes the lips, not after.

CAMERA
Every shot moves from its first frame. After S1 the camera behaves like a slow drone that has entered the body: smooth, continuous, always moving forward along the path of the smoke. SPEED LOCK: the camera never rushes, never whips, never jumps.

ACTION TIMING
0.0s–3.0s — S1, close-up. The flame lights the cigarette, he draws in once slowly, the tip glows bright orange, his eyes half close. Grey-blue smoke begins curling at the corner of his lips. Slow push-in. SCALE BODY. LIGHT STATE A.
3.0s HARD CUT.
3.0s–7.0s — S2, the dive. Profile close-up of his mouth as he inhales: a ribbon of grey-blue smoke is drawn between his lips, and the camera follows that one ribbon in one continuous push straight into the mouth, past the tongue and down into the throat, the walls turning from skin to glossy pink tissue. SCALE BODY to ORGAN. LIGHT STATE A becomes LIGHT STATE B as the lips pass the lens.
7.0s–12.0s — S3, the trachea. Continuous with S2, no cut. The camera glides down the inside of the windpipe: ribbed rings of cartilage under wet pink lining pass the lens rhythmically, the grey-blue smoke rolling ahead of the camera in slow curling sheets. Ahead, the tunnel splits into two dark openings — the two main bronchi — and the smoke divides between them. The walls expand gently with the breath. SCALE ORGAN. LIGHT STATE B.

PHYSICS
Smoke behaves like real smoke: light, slow, curling, thinning at its edges, drawn by the airflow of the inhale. The airway lining is wet and reflective. The cartilage rings are firm, evenly spaced, and do not deform.

AUDIO
The click and hiss of the lighter, the soft crackle of burning paper on the drag, a long inhale. As the camera enters the mouth, outside sound muffles to a deep internal heartbeat and a low rushing airflow. SFX only — no speech, no music.

BRIDGE OUT
The final frame: inside the trachea looking down at the fork into the two main bronchi, grey-blue smoke splitting between the two dark openings, warm pink walls.

POSITIVE LOCKS
The cigarette has no brand and no text. The smoke is grey-blue in every frame. The camera travels in one continuous push from mouth to trachea — no cut inside S2–S3. The anatomy is correct: mouth, throat, trachea with cartilage rings, fork into two bronchi. No text anywhere. No gore.

Vertical 9:16, photoreal exterior and hyper-realistic 3D medical visualization interior, light film grain, creamy macro bokeh, every frame composed for a phone screen with the subject in the centre third. NO TEXT. NO GORE. ANATOMICALLY ACCURATE.
```

### Clip 2 — cilia and alveoli (12–24 s)

Attach: image_4, image_5, image_3

```
CLIP CONTEXT
Second clip. The smoke reaches the airway wall, where tiny hair-like cilia normally sweep dirt away; the smoke slows them. Then it reaches the alveoli, and a thin brown film of tar settles over them.

ACTIVE REFERENCES
<<<image_4>>>: interior alveoli cluster, translucent pink sacs wrapped in red capillaries, receding into darkness. 100% matches the reference.
<<<image_5>>>: grey-blue smoke wisps and brown-black tar droplets. 100% matches the reference.
<<<image_3>>>: healthy pink human lungs with trachea and bronchi. 100% matches the reference.

[PASTE SHARED LOCKS]

SCALE MAP
S1 TISSUE · S2 TISSUE to CELL · S3 CELL. Scale only ever changes through a continuous on-screen push-in, never a jump cut between two scales.

BRIDGE IN
The first visible frame: inside the trachea looking down at the fork into the two main bronchi, grey-blue smoke splitting between the two dark openings, warm pink walls. No empty establishing frame.

ALVEOLI ANCHOR
There is one alveoli cluster in this clip and it is <<<image_4>>>. The camera arrives at it in S2 and stays with the same cluster through S3. The same sacs, the same arrangement, the same depth. The cluster does not rearrange, multiply or move between segments. What changes is only the surface: clean pink before, a thin brown film after. The structure changes nothing; the surface changes.

FORMAT MODE
Three scripted segments across 12.0 seconds, one HARD CUT and one continuous push. No fades, no dissolves, no unscripted cuts.

OPTICS
LENS LOCK S1 = 18° macro along the airway wall, camera 2 cm from the surface, razor-thin focus on the cilia tips.
LENS LOCK S2 = 84° wide interior flythrough down a narrowing bronchiole.
LENS LOCK S3 = 29° close on the alveoli cluster, slow orbit.
No lens drift mid-segment.

LIGHTING PROGRESSION
LIGHT STATE B — INTERIOR HEALTHY, S1 and S2. Warm pink-red subsurface glow, wet specular highlights.
LIGHT STATE C — INVADED, S3. As the tar film settles, the glow through the membranes dims and cools, the pink turning dull and greyer, highlights becoming matte. LIGHT STATE B drops to LIGHT STATE C as the first tar droplet touches a sac, not after.

CAMERA
Slow drone through the body, smooth and continuous, always moving forward along the path of the smoke. SPEED LOCK: never rushes, never whips.

ACTION TIMING
0.0s–4.0s — S1, the cilia. Macro skimming along the airway wall: a dense carpet of tiny hair-like cilia waving together in a fast, even, wave-like rhythm, sweeping a thin layer of glistening mucus upward. Grey-blue smoke drifts down over them; where it touches, the waves slow, the hairs move stiffly and out of time, and the mucus stops flowing. SCALE TISSUE. LIGHT STATE B.
4.0s HARD CUT.
4.0s–7.5s — S2, down the bronchiole. The camera follows one curl of grey-blue smoke down a branching, narrowing tube until it opens into the ALVEOLI ANCHOR — the grape-like cluster of <<<image_4>>>, translucent sacs glowing pink, breathing gently. SCALE TISSUE to CELL. LIGHT STATE B.
7.5s–12.0s — S3, the tar. Continuous with S2, no cut. Slow orbit around the same cluster. Tiny brown-black tar droplets drift out of the smoke and settle on the sacs one by one, spreading into a thin sticky brown film over the membranes. The sacs keep breathing but more stiffly. The capillary glow beneath dims. SCALE CELL. LIGHT STATE B drops to LIGHT STATE C as the first droplet touches.

PHYSICS
Cilia move like a field of wheat in wind, in coordinated waves. Mucus is a clear viscous gel. Tar droplets are sticky and heavy, drift slowly, and spread on contact like oil on a film; they never bounce. Alveoli expand and contract slightly with each breath.

AUDIO
Deep internal heartbeat, soft rushing airflow, a faint wet rhythmic sound of the cilia. As the tar settles, the breath sound becomes slightly heavier. SFX only — no speech, no music.

BRIDGE OUT
The final frame: the alveoli cluster coated in a thin brown film, dimmed glow, a single red capillary in the foreground with dark red blood cells flowing through it.

POSITIVE LOCKS
Smoke is grey-blue, tar is brown-black, in every frame. The alveoli cluster is one cluster that never rearranges. Damage is shown only as a thin brown film and dimmer light — never rotting, never bleeding, never holes. No text anywhere. No gore.

Vertical 9:16, hyper-realistic 3D medical visualization, light film grain, creamy macro bokeh, subject in the centre third. NO TEXT. NO GORE. ANATOMICALLY ACCURATE.
```

### Clip 3 — blood, brain, heart (24–36 s)

Attach: image_4, image_6, image_5

```
CLIP CONTEXT
Third clip. Inside a lung capillary, carbon monoxide takes oxygen's place on red blood cells. The blood carries amber nicotine up to the brain, where neurons flare, and the heart begins beating faster.

ACTIVE REFERENCES
<<<image_4>>>: interior alveoli cluster with red capillaries. 100% matches the reference.
<<<image_6>>>: human brain, pale pink-grey cortex, and human heart, deep red muscle with coronary vessels. 100% matches the reference.
<<<image_5>>>: grey-blue smoke wisps and brown-black tar droplets. 100% matches the reference.

[PASTE SHARED LOCKS]

SCALE MAP
S1 CELL · S2 CELL to ORGAN · S3 ORGAN. Scale only ever changes through a continuous on-screen push-in or pull-out, never a jump cut between two scales.

BRIDGE IN
The first visible frame: the alveoli cluster coated in a thin brown film, dimmed glow, a single red capillary in the foreground with dark red blood cells flowing through it. No empty establishing frame.

FORMAT MODE
Three scripted segments across 12.0 seconds, two HARD CUTS. No fades, no dissolves, no unscripted cuts.

OPTICS
LENS LOCK S1 = 18° macro inside the capillary, red blood cells passing the lens, focus a few millimetres deep.
LENS LOCK S2 = 84° wide travelling with the bloodstream, then pulling out to 47° on the brain.
LENS LOCK S3 = 47° on the heart, slow push-in.
No lens drift mid-segment.

LIGHTING PROGRESSION
LIGHT STATE C — INVADED, S1. Dim, cooler red.
LIGHT STATE E — NICOTINE, S2 and S3. A faint amber glow travels with the blood and becomes the dominant moving light: amber flickers spreading across the brain surface, amber pulses across the heart muscle on each beat. Realistic light only — no glow filter, no magic sparkles.

CAMERA
Slow drone travelling with the flow of the blood, smooth and continuous. SPEED LOCK: the camera never rushes; only the heartbeat speeds up.

ACTION TIMING
0.0s–4.0s — S1, the swap. Inside the capillary: soft red disc-shaped blood cells tumble slowly past the lens. Tiny bright cyan-white oxygen specks are attached to them — then tiny dark grey carbon monoxide specks drift in and lock onto the cells in their place, the cyan-white specks drifting away unattached. The cells look a little duller. SCALE CELL. LIGHT STATE C.
4.0s HARD CUT.
4.0s–8.0s — S2, to the brain. Travelling with a stream of blood carrying a faint amber glow up a vessel, the camera pulls out through the vessel wall to reveal the brain of <<<image_6>>> floating in darkness; the amber spreads along its blood vessels and fine bright flickers of activity ripple across the cortex folds. SCALE CELL to ORGAN. LIGHT STATE E.
8.0s HARD CUT.
8.0s–12.0s — S3, the heart. The heart of <<<image_6>>> beating in darkness: at first a steady beat every 0.8 seconds, then quickening to a beat every 0.6 seconds, an amber pulse rippling over the muscle on each contraction, the coronary vessels tightening slightly. Slow push-in. SCALE ORGAN. LIGHT STATE E.

PHYSICS
Blood cells are soft, flexible discs that tumble and fold slightly in the flow, never hard balls. The heart contracts and relaxes with real muscular twist and weight. The brain does not move; only light activity ripples across it.

AUDIO
Muffled whooshing blood flow, a deep heartbeat that gets faster through S3. Faint electrical crackle in S2. SFX only — no speech, no music.

BRIDGE OUT
The final frame: the heart beating fast in darkness, amber pulses on each beat.

POSITIVE LOCKS
Oxygen is cyan-white specks, carbon monoxide is dark grey specks, nicotine is a faint amber glow in every frame. The heart speeds up; the camera does not. No text anywhere. No gore, no spilling blood.

Vertical 9:16, hyper-realistic 3D medical visualization, light film grain, creamy macro bokeh, subject in the centre third. NO TEXT. NO GORE. ANATOMICALLY ACCURATE.
```

### Clip 4 — years later, and recovery (36–46 s)

Attach: image_3, image_1, image_5

```
CLIP CONTEXT
Final clip. The lungs shown as an organ darken over years of smoking. Then the man stubs out the cigarette, and the lungs' warmth slowly returns — what recovers when you stop.

ACTIVE REFERENCES
<<<image_3>>>: healthy pink human lungs with trachea and bronchi. In this clip the same lungs gradually darken with grey-brown speckling, then partly regain their pink. 100% matches the reference.
<<<image_1>>>: Indian man around 30, medium brown skin, short black hair, light stubble, charcoal grey crew-neck t-shirt, thin black wristwatch on the left wrist. Calm, never theatrical. 100% matches the reference.
<<<image_5>>>: grey-blue smoke wisps and brown-black tar droplets. 100% matches the reference.

[PASTE SHARED LOCKS]

LUNGS ANCHOR
There is only ONE pair of lungs, floating centred in darkness, front view. They never move, rotate or duplicate. Only their colour changes. The change happens on screen, continuously — never a cut between a clean pair and a dark pair.

SCALE MAP
S1 ORGAN · S2 BODY · S3 ORGAN.

BRIDGE IN
The first visible frame: the heart beating fast in darkness, amber pulses on each beat, the camera already pulling back to reveal the lungs around it.

FORMAT MODE
Three scripted segments across 10.0 seconds, two HARD CUTS. No fades, no dissolves, no unscripted cuts.

OPTICS
LENS LOCK S1 = 47° on the lungs, very slow push-in.
LENS LOCK S2 = 29° close-up on the hand and the ashtray.
LENS LOCK S3 = 47° on the lungs, slow pull-out.
No lens drift mid-segment.

LIGHTING PROGRESSION
LIGHT STATE C — INVADED, S1. Cold, dim, the subsurface glow fading.
LIGHT STATE A — EXTERIOR, S2. Blue dusk, warm balcony bulb.
LIGHT STATE D — RECOVERY, S3. The warm pink subsurface glow returns slowly from the centre outward, like morning light.

CAMERA
Slow, smooth, continuous. SPEED LOCK: no fast moves.

ACTION TIMING
0.0s–4.0s — S1, the years. The camera eases back from the beating heart to the lungs of <<<image_3>>> at the LUNGS ANCHOR. With every slow breath, grey-brown speckles spread across the pink surface, the tissue dulling and darkening as if years are passing in seconds, the breathing becoming shallower. SCALE ORGAN. LIGHT STATE C.
4.0s HARD CUT.
4.0s–6.5s — S2, the choice. Close-up on <<<image_1>>>'s hand with the black wristwatch pressing the half-smoked cigarette out in a plain glass ashtray, one firm twist, the last thread of grey-blue smoke rising and fading. SCALE BODY. LIGHT STATE A.
6.5s HARD CUT.
6.5s–10.0s — S3, recovery. The same darkened lungs at the LUNGS ANCHOR. With each deeper breath, the warm pink glow slowly returns from the centre outward and some of the grey-brown speckling lightens; the breathing becomes deeper and calmer. The camera pulls back slowly, the lungs small and glowing in the dark. SCALE ORGAN. LIGHT STATE D.

PHYSICS
Lungs inflate and deflate with real breathing rhythm. The colour change spreads gradually across the surface, never a flash or wipe. Smoke from the stubbed cigarette thins and disappears naturally.

AUDIO
Heavy, shallow breathing in S1; the soft crush of the cigarette in S2; one long, deep, clear breath in S3 with a calm slow heartbeat. SFX only — no speech, no music.

BRIDGE OUT
The final frame: the healthy-glowing lungs small in the centre of a dark frame, breathing calmly. Hold for the end card.

POSITIVE LOCKS
One pair of lungs that never moves or duplicates. Colour change is gradual and on screen. The cigarette has no brand. No text anywhere. No gore.

Vertical 9:16, hyper-realistic 3D medical visualization, light film grain, creamy macro bokeh, subject in the centre third. NO TEXT. NO GORE. ANATOMICALLY ACCURATE.
```

Judge each clip batch on: (1) zero text in any frame, (2) smoke/tar colours correct, (3) the clip's first and last frames match the bridges, (4) no gore or cartoon look.

## Stage 4 — finish (CapCut / Premiere)

Order clips 1→4, trim the first and last 3–5 frames of each to hide join wobble, add the Hindi voiceover (record or ElevenLabs), timestamp captions at the beat changes, a low ambient pad under the SFX, and a 1.5 s end card.
