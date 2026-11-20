# Zach-D style video: kaise prompt karein

Aapki demo video ("car start kaise hoti hai") se measure kiya hua formula:

| Cheez | Demo me kya hai |
|---|---|
| Length | 28 sec, 9:16 |
| Script | ~75 words, 4 sentences, har sentence ek "cause → effect" kadi |
| Shuruaat | "When you…" — roz ki ek action se (key ghumana) |
| Beech | Step by step chain: key → battery → starter → fuel → spark → explosion |
| Twist line | "At the same time…" |
| End | Poori cheez wapas dikhti hai, kaam karti hui ("and the car turns on") |
| Look | Neela studio background, jo part abhi kaam kar raha hai wo **green glow / x-ray** me, baaki dark metal |
| Camera | Har shot me camera chalta rehta hai, cut har 2–3 sec |
| Captions | Safed bold, 1–3 words, neeche ke tisre hisse me, voice ke saath |

---

## Tarika 1 — Claude + zach-d-films skill (free, code se banta hai)

Ye wahi tarika hai jisse `videos/car-start/` bana. Claude se bas ye likho:

```
/zach-d-films
Topic: How a <cheez> works   (ya: What happens when you <action>)
Length: 28 seconds, 9:16, English voiceover
Script formula: "When you ..." hook, then a step-by-step cause-and-effect chain,
one "At the same time ..." line, end on the whole object working.
Look: blue studio sky, the part that is working right now glows green (x-ray),
everything else dark metal, camera always moving, cut every 2-3 seconds.
Captions: 1-3 words, white bold.
Shots: one shot per step of the chain, close-ups on the moving parts,
first and last shot show the whole object.
```

Example topics jo is style me best chalte hain:
- How a toilet flush works
- How a fridge keeps food cold
- How a lighter makes fire
- How an AC cools a room
- What happens when you sneeze

Hindi voice chahiye to likho: `Voiceover: Hindi (main khud record karunga)`. Apni recording `audio/vo.wav` me daal do, baaki captions khud ban jayenge.

---

## Tarika 2 — AI video model (Higgsfield / Seedance) — zyada realistic look

Demo jaisa photoreal look AI model se aata hai (credits lagte hain). Har shot ka **alag 3–5 sec clip** banao, phir CapCut me jodo, voice aur captions wahan daalo.

### Har clip ka prompt template

```
[SHOT] <camera type and distance>, <what is on screen in the first frame>.
[ACTION] <one physical action, described mechanically>.
[HIGHLIGHT] The <active part> glows bright emerald green like a semi-transparent
x-ray, every other part stays dark gunmetal.
[CAMERA] Smooth continuous <push-in / orbit / pull-back>, never static.
[LOOK] Clean 3D product-explainer render, soft bright blue studio background
with a gradient, glossy reflections, shallow depth of field, cinematic lighting.
[LOCKS] No text, no labels, no logos, no people, no hands. 9:16 vertical.
```

### Example — explosion wala shot

```
Close-up of one transparent glass engine cylinder with a metal piston near the top,
spark plug above it, dark engine block around it, soft blue studio background.
A tiny blue-white spark flashes at the spark plug tip and the yellow fuel mist inside
the cylinder ignites into an orange fireball that fills the chamber and shoves the
piston down in slow motion. The cylinder glass glows orange during the blast, the
neighbouring cylinders glow emerald green like an x-ray, everything else stays dark
gunmetal. Smooth slow push-in, slight camera shake on the blast. Clean 3D
product-explainer render, glossy reflections, shallow depth of field.
No text, no labels, no logos, no people. 9:16 vertical.
```

### Example — key wala pehla shot

```
Extreme macro of a car ignition lock on a dark leather dashboard, a metal key already
inserted. The key turns clockwise in one smooth motion and a thin emerald green ring
of light glows around the lock. Dark moody interior, soft rim light. Slow push-in.
Clean 3D product-explainer render, shallow depth of field.
No text, no logos, no hands. 9:16 vertical.
```

Har clip ke 4 version banao, sabse saaf wala chuno. Check karo: (1) koi text/logo nahi aaya, (2) sirf sahi part green hai, (3) camera hil raha hai, (4) parts ka shape sahi hai.

---

## Dhyan rakhne wali baatein
- Script me har line sach ho — pehle fact check karo.
- Kisi aur creator ka naam, logo ya watermark apni video me mat daalo. Style follow karna theek hai, branding copy karna nahi.
- Text hamesha editor me lagao, AI model se nahi.
