# How an Electric Hand Blender Works: 3D engineering animation

A 60-second, 16:9 cinematic explainer built entirely from real-time 3D geometry with **Three.js + GSAP**.
It has no images, video clips or slides: every part (housing, motor laminations, windings, commutator, brushes, shaft, bell guard, blades, glass jar, liquid) is modelled in code.

## Run it

```bash
cd videos/hand-blender-3d
npm install
npm run dev          # opens http://localhost:5173
```

Click **Start Animation**. The film plays automatically from there.

Production build: `npm run build`, then `npm run preview` (serves `dist/`).

> It must be served over a local dev server (ES modules). Opening `index.html` from the file system will not work.

### URL options

| Option | Effect |
|---|---|
| `?quality=high` (default) | MSAA, shadows, GTAO ambient occlusion, depth of field, bloom |
| `?quality=medium` | No ambient occlusion |
| `?quality=low` | No AO, no DOF, no shadows, 0.75× resolution (for weak GPUs) |
| `?autostart` | Starts immediately (sound starts on your first click or key press) |
| `?t=31&pause` | Jumps to a time and pauses (handy for stills) |

## Controls

| Control | Key |
|---|---|
| Start / Play / Pause | `Space` |
| Restart | `R` |
| Scene navigation (7 scenes) | `1`–`7` or the scene buttons |
| Progress bar: click or drag to scrub | – |
| Free camera orbit: drag to orbit, scroll to zoom. Press again to give the camera back to the film | `O` |
| Sound on/off (synthesized ambience + motor whine that follows motor speed) | `M` |
| Hide all UI for a clean recording | `H` |
| Fullscreen | `F` |

The controls fade out after 2.6 s without mouse movement.

## Recording in Chrome (1920×1080 @ 60 fps)

1. Run `npm run dev`, open the page in Chrome and press `F` for fullscreen on a 1080p display. The canvas always keeps 16:9 and renders at up to 1920×1080.
2. Press `H` to hide the UI. Narration captions, labels and titles stay visible because they are part of the film.
3. Press `1` to go to the start, then `Space` to play, and record with OBS (or the Chrome tab recorder) at 60 fps. Use the Chrome tab audio if you want the sound.
4. If the frame rate drops on your machine, record with `?quality=medium`.

## Timeline

| # | Time | Scene | What happens |
|---|---|---|---|
| 1 | 0–6 s | Intro | Product turns 360° under studio light, title |
| 2 | 6–14 s | Exploded view | 8 assemblies separate, numbered engineering labels, 360° orbit |
| 3 | 14–24 s | Inside the motor | X-ray housing, quarter cut-away of the stator, current path, magnetic field, rotor spins up |
| 4 | 24–34 s | Shaft & blades | Splined coupling, camera travels down inside the stainless tube, into the bell, then out through a vent window for a 360° macro orbit |
| 5 | 34–46 s | Blending | Jar with layered ingredients; suction, radial outflow, vortex dip, chunks shrink, colour becomes uniform |
| 6 | 46–55 s | Reassembly | Parts fly back together, glint, 360° turn, "MOTOR → ROTATION → BLADES → BLENDING" |
| 7 | 55–60 s | Outro | Closing titles, fade to black |

## Engineering accuracy notes

**Reference design.** This is a *generic* corded immersion blender of the common 600–1000 W class, not a copy of any brand's model. Most such blenders use a **universal motor**: a brushed, series-wound motor that runs directly on AC mains. The model therefore includes:

- **2-pole laminated stator** with two **field coils**. These are electromagnets, not permanent magnets.
- **Wound armature (rotor)**: a 12-slot laminated core, copper windings and a **12-bar commutator**.
- **Two carbon brushes** in spring-loaded brass holders, sitting on the pole axis.
- Shaft on **two bearings**, held by end brackets and tie bolts, plus a **cooling fan** on the shaft.
- **Speed-control board** (push-switches, triac and suppression capacitor) behind the I / II buttons.
- **Detachable stainless blending shaft**: a twist-lock collar and a **splined coupling** drive a slim **inner drive rod** that runs in two bushings. There is **no gearbox**, so the blade turns at motor speed.
- **4-wing S-blade** (two wings bent up, two bent down) inside a **vented bell guard**.

The electrical path shown follows the real series circuit: mains → board → field coil A → brush → commutator/armature → brush → field coil B → board → mains. Because field and armature are in series, each AC reversal flips both together, so the torque keeps the same direction.

Some models (for example some cordless or premium units) use a **permanent-magnet DC or brushless motor** instead. In those motors the field coils are replaced by magnets, and electronics replace the commutator. To show such a model, swap the stator in `src/blender.js`.

**What is real and what is a visual explanation.** Real components use realistic PBR materials and white labels. Everything that is *not* a physical part is drawn in a cyan, magenta or amber glowing "hologram" style, has dashed cyan labels tagged **VISUALIZATION**, and is explained in the on-screen legend. This covers the current path, magnetic field lines, the N/S markers, the rotation arrows, the blade motion trail and the circulation-flow arrows.

**Speeds.** Real blade speed is about 10,000–15,000 RPM (≈170–250 rev/s). That would only show as a blur on screen, so the rotation is drawn at about 5.5 rev/s. The on-screen RPM readout shows the real-world figure it represents, labelled "slowed for display".

**Fluid.** The liquid is a stylised real-time model, not a CFD simulation. It shows the accepted flow pattern of an immersion blender: liquid is pulled up into the open bottom of the bell, thrown out radially through the vents, rises along the jar wall and comes back down near the shaft, with a swirl and a vortex dip at the surface.

## Project structure

```
index.html        page, overlays (titles, captions, legend, start screen, controls)
style.css         cinematic typography + HUD styling (scales with the 16:9 stage)
main.js           renderer, post-processing (GTAO, DOF, bloom), state→scene binding, UI
src/
  materials.js    PBR materials + procedural textures (brushed steel, copper windings, PCB…)
  blender.js      the complete product model, exploded-view offsets, motor cut-away, label anchors
  effects.js      visualisation effects (flow-line shader, glow particles, current flow, arrows, blade trail)
  fluid.js        glass jar, liquid shader (vortex + mixing), ingredient & flow particles
  labels.js       3D-anchored engineering call-outs with leader lines
  timeline.js     the 60 s GSAP master timeline: camera, scene states, captions
  studio.js       dark futuristic studio: environment reflections, lights, floor, backdrop
  audio.js        synthesized ambience and motor sound
```

All animation is driven by one paused GSAP timeline that tweens a plain `state` object. The render loop reads that state every frame, so pausing, scrubbing and scene jumps always stay in sync.
