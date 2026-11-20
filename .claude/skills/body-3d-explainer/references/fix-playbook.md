# Stage 3 — fix playbook

Name the failure, apply the fix, rewrite only the affected sections, say what to re-batch. Never re-roll an unchanged prompt.

| Symptom | Cause | Fix |
|---|---|---|
| Random text, labels or arrows appear | Model thinks "medical explainer" = diagram | TEXT LOCK in SHARED LOCKS and POSITIVE LOCKS; remove words like "infographic", "diagram", "explainer" from the prompt |
| Looks cartoon / plastic / toy | Style tail too weak or reference too clean | Add *wet glossy organic surfaces, subsurface scattering, macro DOF, not plastic, not stylized*; regenerate the organ reference with more surface wetness |
| Gory or horror look | "Damage" written emotionally | TONE LOCK; describe damage as colour and coating (*a thin brown film settles*), never as rotting, bleeding, decay |
| Scale jumps feel random | Hard cut between two scale levels | SCALE MAP rule: scale changes only through a continuous push-in; add a hero particle the camera follows |
| Smoke / substance changes colour | No colour rule | COLOUR LOCK naming the right colour and the wrong one |
| Clips don't join | Last and first frames written separately | BRIDGE OUT of clip N pasted verbatim as BRIDGE IN of clip N+1; generate clip N+1 with clip N's last frame as start-frame reference if the tool allows |
| Person changes between clips | Cinematic light in the character sheet, or anchors re-worded | Flat-light sheet, identical anchor line in every clip |
| Interior looks dead / like a render | No rhythmic motion | Breathing expansion, pulse every 0.8 s, cilia beat, flowing particles in every interior segment |
| Anatomy wrong (trachea goes into stomach etc.) | Route not stated | Write the route as a SCALE MAP with named landmarks (larynx → trachea → bronchi → bronchioles → alveoli) |
| Hero particle lost | Too many particles | One named hero curl/molecule, chased by camera; the rest are "soft background haze" |
| Clip got worse after "improvements" | Complexity budget spent | Revert to last clean version, ship it |

Batch 4 per version. One clean in four is normal — keep it and stop.
