# Advanced Photorealistic Cinematic 3D & VFX Specification

Mandatory visual, optical, shader, simulation, and audio engineering layer for `/case-file`.

---

## 1. Master Render & Color Pipeline (Append to Every Visual Prompt)

> `Photorealistic cinematic 3D VFX film render, Unreal Engine 5.4 path-traced / Octane CGI quality, Houdini Solaris lookdev; ACEScg filmic color pipeline; physically based rendering (PBR) with realistic skin subsurface scattering, visible pores, individual hair strands, woven fabric micro-texture, brushed stainless-steel anisotropy, optical glass refraction (IOR 1.52), and calibrated surface roughness maps; 35mm anamorphic cinema lens with shallow depth of field, subtle oval bokeh, micro-chromatic aberration, and natural halation; motivated volumetric light shafts with Mie-scattered micro-dust motes and atmospheric haze; muted desaturated thriller documentary color grade with a single controlled practical/bioluminescent accent color; 16:9; no text, no HUD, no timestamp, no watermark.`

---

## 2. PBR Material & Shader Library (Use Exact Descriptors)

| Surface / Subject | Required Micro-Detail Keywords |
| :--- | :--- |
| **Human Skin & Eyes** | `natural dermal subsurface scattering (SSS), fine knuckle creases, subtle skin pores, natural corneal moisture and catchlights, zero plastic sheen` |
| **Hair & Eyewear** | `groomed individual hair strands with soft rim translucency, ultra-thin titanium/wire-rim frames with subtle anti-reflective lens glint` |
| **Lab Coat & Clothing** | `heavyweight woven cotton-poly twill with visible thread weave, seam stitching, natural lapel fold gravity, soft cloth micro-shadowing` |
| **Lab Architecture** | `micro-scratched sealed epoxy concrete floor, brushed 304 stainless steel benches, dust-settled aluminum venetian blinds, turned-off recessed fluorescent diffusers` |
| **Urban Night Alley** | `weathered red-brick masonry with recessed mortar depth, damp efflorescence, rain-slicked asphalt with variable puddle roughness maps and specular streetlamp reflections` |
| **Glass & Metal Props** | `beveled optical borosilicate glass with edge green-tint refraction, CNC-machined steel hinges and Phillips fasteners, realistic internal glare` |
| **Biological / Specimen** | `microscopic sensory setae hairs, matte-graphite chitinous exoskeleton with specular edge highlights, subtle internal bioluminescent cyan subsurface veins` |

---

## 3. Cinema Camera & Lens Physics Matrix

Never write generic camera moves ("camera moves closer"). Specify **rig, focal length, aperture, and optical behavior**:

- **Surveillance / Establishing (`0–8s`):** `Locked-off high-corner 24mm wide-angle prime, subtle optical barrel distortion, deep focus (f/8), faint 35mm sensor grain, clean frame with zero digital HUD or timestamps.`
- **Lateral Tracking (`8–16s`):** `Eye-level 35mm anamorphic Steadicam / Technocrane lateral dolly at f/2.8, smooth foreground/background parallax, gentle motion blur on stride.`
- **Over-the-Shoulder Tension (`16–24s`):** `50mm anamorphic motorized push-in at f/2.0, subtle rack focus from character ear/glasses frame onto the hero prop.`
- **Macro / Creature (`8–24s`):** `100mm Laowa-style macro probe lens at surface height, razor-thin focal plane (f/2.0), creamy anamorphic bokeh melting the room behind.`
- **Vertical Reveal / Aerial (`16–30s`):** `Smooth motorized vertical crane tilt rising seamlessly into a wide 24mm high-altitude drone hold above the roofline with atmospheric fog falloff.`

---

## 4. Houdini / VFX Simulation Cues (Embed in Action Beats)

Include at least **one physical simulation cue** per beat so video generators render believable physics:
- **Atmospheric:** `slowly drifting airborne dust motes illuminated inside cold morning volumetric light shafts`
- **Cloth & Gravity:** `natural lab coat hem sway during stride; coat tails hanging downward under gravity during vertical climb`
- **Optics & Glow:** `cyan point-source light bouncing off beveled glass edges, steel clasp, and corneal/eyeglass reflections`
- **Tension & Micro-Physics:** `razor-thin silk thread catching rim light with subtle tensile micro-vibration; realistic finger-pad compression against glass rim or damp brick`

---

## 5. I2V Keyframe Chaining Rules (For Veo / Runway / Kling)
1. **End-State Matching:** The final pose, hand position, and lighting state of Beat `N` must match the opening composition of Beat `N+1` (e.g., if Beat 4 ends with the lid cracked 3 cm, Sequence 2 Beat 1 starts with the lid cracked 3 cm).
2. **Single Accent Discipline:** Keep 95% of the frame in a cold, desaturated slate/graphite/concrete palette so the single cyan accent reads immediately as the forensic focal point.
3. **Zero Morphing Triggers:** Always restate the character's exact wardrobe (`pale-blue woven lab coat, grey button-down shirt, dark trousers, wire-rim glasses`) in every beat prompt.

---

## 6. Hard Negative Constraints (Mandatory)
Always exclude:
`low-poly, faceted geometry, stylized 3D, cartoon, anime, claymation, plastic skin, mannequin face, flat lighting, oversaturated colors, neon cyberpunk, digital HUD, CCTV timestamp, UI overlay, text, subtitles, watermark`
