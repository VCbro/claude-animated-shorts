import gsap from 'gsap';
import { JAR } from './fluid.js';

const TAU = Math.PI * 2;

export const SCENES = [
  { t: 0, id: 'intro', name: 'Intro' },
  { t: 6, id: 'exploded', name: 'Exploded view' },
  { t: 14, id: 'motor', name: 'Inside the motor' },
  { t: 24, id: 'blades', name: 'Shaft & blades' },
  { t: 34, id: 'blending', name: 'Blending' },
  { t: 46, id: 'reassembly', name: 'Reassembly' },
  { t: 55, id: 'outro', name: 'Outro' },
];
export const DURATION = 60;

// Lower-third narration captions [start, end, html]
export const CAPTIONS = [
  [6.4, 8.6, 'Exploded view: the <b>eight main assemblies</b> of a typical corded stick blender.'],
  [14.6, 17.4, 'Inside is a <b>universal motor</b>: a brushed, series-wound motor that runs directly on household AC.'],
  [17.4, 19.5, 'Current from the speed-control board flows through the <b>field coils</b>, turning the stator poles into electromagnets (N / S).'],
  [19.5, 21.6, 'Spring-loaded <b>carbon brushes</b> rub on the <b>commutator</b>, feeding that current into the armature windings.'],
  [21.6, 23.9, 'The commutator switches the armature current every half-turn, so the magnetic pull keeps pushing one way. Field and armature are in series, so each AC reversal flips <b>both</b> and the torque stays in one direction.'],
  [24.4, 26.2, 'The motor shaft drives the detachable blending shaft through a <b>splined coupling</b>.'],
  [26.5, 28.9, 'Inside the stainless tube a slim <b>drive rod</b> spins in bushings. There is no gearbox: the blade turns at motor speed.'],
  [29.2, 31.4, 'At the bottom the rod carries a <b>4-wing S-blade</b>, with two wings bent up and two bent down.'],
  [31.6, 33.8, 'Typical speed: about <b>10,000 to 15,000 RPM</b>. The rotation here is slowed down so you can see it.'],
  [34.6, 36.7, 'In the jar, the <b>bell guard</b> keeps the spinning blades away from the jar walls and your hands.'],
  [36.8, 41.2, 'The blades pull liquid <b>up into the bell</b> and throw it <b>out through the vents</b>, setting up a circulating vortex.'],
  [41.2, 44.4, 'Every pass through the blades cuts the pieces smaller, until the mixture is <b>uniform</b>.'],
  [44.4, 45.8, 'Smooth, evenly blended.'],
  [46.6, 50.0, 'Reassembly: every part goes back into place.'],
];

export function createState() {
  return {
    cam: { az: 0.9, el: 0.1, dist: 58, tx: 0, ty: 11, tz: 0, fov: 32 },
    aperture: 0.0006,
    explode: 0, blenderY: 0, spin: 0, housing: 1,
    speed: 0, cut: 0, energy: 0, field: 0, torque: 0, trail: 0, rpm: 0,
    jar: 0, mix: 0, flowArrows: 0, flowEngage: 0,
    camLight: 0, fade: 1, glow: 0, macroDamp: 0,
    lab: { explode: 0, motorA: 0, motorB: 0, visMotor: 0, coupling: 0, tube: 0, macro: 0, fluid: 0 },
  };
}

export function buildTimeline(S) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  const C = S.cam;
  const cam = (t, d, v, ease) => tl.to(C, { ...v, duration: d, ease: ease || 'power2.inOut' }, t);
  const to = (target, t, d, v, ease) => tl.to(target, { ...v, duration: d, ease: ease || 'power2.inOut' }, t);
  const set = (target, t, v) => tl.set(target, v, t);
  const text = (sel, t, d, out) => {
    tl.fromTo(sel, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: d, ease: 'power3.out' }, t);
    if (out != null) tl.to(sel, { opacity: 0, y: -16, filter: 'blur(6px)', duration: 0.6, ease: 'power2.in' }, out);
  };

  // ---------------- SCENE 1  INTRO (0-6) ----------------
  to(S, 0, 0.9, { fade: 0 }, 'power1.out');
  to(S, 0, 6, { spin: TAU }, 'power1.inOut');
  cam(0, 6, { az: -0.3, el: 0.16, dist: 92, ty: 0.5 }, 'power2.inOut');
  to(S, 0, 6, { aperture: 0.00025 }, 'none');
  text('#title', 0.7, 1.4, 5.2);
  text('#titleSub', 1.3, 1.2, 5.2);

  // ---------------- SCENE 2  EXPLODED VIEW (6-14) ----------------
  to(S, 6.2, 2.6, { explode: 1, blenderY: 3 }, 'power3.inOut');
  cam(6, 8, { az: -0.3 + TAU, el: 0.14, dist: 128, ty: 1 }, 'sine.inOut');
  to(S.lab, 8.4, 0.6, { explode: 1 });
  to(S.lab, 13.3, 0.5, { explode: 0 });
  to(S, 6, 2, { aperture: 0.0001 }, 'none');

  // ---------------- SCENE 3  INSIDE THE MOTOR (14-24) ----------------
  to(S, 14.0, 1.9, { explode: 0, blenderY: 0 }, 'power3.inOut');
  to(S, 14.4, 1.3, { housing: 0.1 });
  cam(14.0, 2.2, { az: TAU + Math.PI / 4, el: 0.2, dist: 16, ty: 8.6 }, 'power3.inOut');
  to(S, 14.0, 2.2, { aperture: 0.0016 }, 'none');
  to(S, 16.0, 1.1, { cut: 1 });
  to(S.lab, 16.6, 0.5, { motorA: 1 });
  to(S.lab, 19.3, 0.4, { motorA: 0 });
  to(S, 17.3, 0.8, { energy: 1 });
  to(S, 18.1, 0.7, { field: 1 });
  to(S.lab, 17.9, 0.5, { visMotor: 1 });
  to(S, 18.8, 2.4, { speed: 0.32 }, 'power1.in');
  to(S, 19.2, 0.6, { torque: 1 });
  to(S.lab, 19.7, 0.5, { motorB: 1 });
  cam(19.4, 4.4, { az: TAU + Math.PI / 4 + 1.1, el: 0.62, dist: 13.5, ty: 9.6 }, 'sine.inOut');
  to(S, 21.2, 2.6, { speed: 0.55 }, 'power1.inOut');
  to(S.lab, 23.3, 0.4, { motorB: 0, visMotor: 0 });
  to(S, 23.3, 0.6, { energy: 0, field: 0, torque: 0 });
  to(S, 23.5, 0.7, { cut: 0 });

  // ---------------- SCENE 4  SHAFT & BLADES (24-34) ----------------
  cam(23.8, 1.3, { az: TAU + 2.6, el: 0.08, dist: 9.5, ty: 1.4 }, 'power3.inOut');
  to(S, 23.8, 1.3, { speed: 0.12, aperture: 0.003 });
  cam(25.1, 1.4, { az: TAU + 3.0, dist: 8.5 }, 'sine.inOut');
  to(S.lab, 25.0, 0.4, { coupling: 1 });
  to(S.lab, 26.0, 0.3, { coupling: 0 });
  // dip to black, then travel down inside the stainless tube
  to(S, 26.15, 0.3, { fade: 1 }, 'power2.in');
  set(C, 26.45, { az: 0, el: 1.35, dist: 2.8, tx: 0, ty: -2.4, tz: 0, fov: 62 });
  set(S, 26.45, { camLight: 1, aperture: 0.0004 });
  to(S, 26.45, 0.35, { fade: 0 }, 'power2.out');
  cam(26.45, 2.4, { ty: -10.6, az: 1.4 }, 'power1.inOut');
  to(S.lab, 27.0, 0.4, { tube: 1 });
  to(S.lab, 28.4, 0.3, { tube: 0 });
  to(S, 28.62, 0.3, { fade: 1 }, 'power2.in');
  // inside the bell, looking down at the blade
  set(C, 28.95, { az: 0.9, el: 0.95, dist: 2.6, ty: -17.6, fov: 55 });
  to(S, 28.95, 0.35, { fade: 0 }, 'power2.out');
  set(S, 28.95, { macroDamp: 1 });
  to(S, 29.3, 1.6, { speed: 1 }, 'power2.in');
  to(S, 29.6, 0.8, { trail: 1 });
  cam(30.0, 0.9, { az: 0.31, el: 0.16, dist: 1.9, ty: -17.35 }, 'power2.inOut');
  // dolly out through a vent window
  cam(30.9, 1.4, { dist: 12, fov: 40 }, 'power2.inOut');
  cam(31.5, 1.2, { el: -0.32, ty: -17.2 }, 'power1.inOut');
  cam(31.6, 2.4, { az: 0.31 + TAU }, 'power1.inOut');
  to(S, 31.4, 0.6, { rpm: 1 });
  to(S, 30.9, 1.4, { camLight: 0, aperture: 0.0011 });
  to(S.lab, 31.7, 0.4, { macro: 1 });
  to(S.lab, 33.4, 0.3, { macro: 0 });
  to(S, 33.4, 0.4, { rpm: 0 });
  set(S, 34.0, { macroDamp: 0 });

  // ---------------- SCENE 5  BLENDING (34-46) ----------------
  to(S, 33.6, 0.4, { fade: 1 }, 'power2.in');
  set(S, 34.0, { blenderY: JAR.blenderY, speed: 0, trail: 0, jar: 1, mix: 0, flowEngage: 0, housing: 1, aperture: 0.0006 });
  set(C, 34.0, { az: 0.35, el: 0.13, dist: 50, ty: -19, fov: 32 });
  to(S, 34.0, 0.6, { fade: 0 }, 'power2.out');
  cam(34.4, 4.0, { dist: 27, ty: -23, el: 0.05, az: -0.2 }, 'power2.inOut');
  to(S, 35.0, 1.4, { speed: 0.9 }, 'power2.in');
  to(S, 35.2, 1.6, { flowEngage: 1 }, 'power1.inOut');
  to(S, 36.4, 0.6, { trail: 0.5 });
  to(S, 36.8, 0.6, { flowArrows: 1 });
  to(S.lab, 37.0, 0.5, { fluid: 1 });
  to(S, 37.0, 7.0, { mix: 1 }, 'sine.inOut');
  cam(38.4, 3.4, { dist: 17, ty: -26.5, el: -0.06, az: -0.85 }, 'sine.inOut');
  to(S, 38.4, 3.4, { aperture: 0.0016 }, 'none');
  to(S, 41.0, 0.6, { flowArrows: 0 });
  to(S.lab, 41.0, 0.4, { fluid: 0 });
  cam(41.8, 4.2, { dist: 44, ty: -19, el: 0.2, az: 0.55 }, 'sine.inOut');
  to(S, 41.8, 2.0, { aperture: 0.0005 }, 'none');
  to(S, 44.3, 1.3, { speed: 0, trail: 0 }, 'power2.out');
  to(S, 45.6, 0.4, { fade: 1 }, 'power2.in');

  // ---------------- SCENE 6  REASSEMBLY (46-55) ----------------
  set(S, 46.0, { jar: 0, explode: 1, blenderY: 3, housing: 1, aperture: 0.0001 });
  set(C, 46.0, { az: 0.6, el: 0.15, dist: 128, ty: 3, fov: 32 });
  to(S, 46.0, 0.6, { fade: 0 }, 'power2.out');
  to(S, 46.7, 2.9, { explode: 0, blenderY: 0 }, 'power3.inOut');
  cam(46.3, 3.8, { dist: 92, ty: 1.5, az: 0.2 }, 'power2.inOut');
  to(S, 49.5, 0.25, { glow: 1 }, 'power2.out');
  to(S, 49.75, 1.4, { glow: 0 }, 'power2.out');
  to(S, 49.0, 6.0, { spin: TAU * 2 }, 'sine.inOut');
  cam(50.1, 2.6, { el: 0.55, dist: 88 }, 'sine.inOut');      // high angle / top-ish view
  cam(52.7, 2.3, { el: 0.08, dist: 94, az: -0.35 }, 'sine.inOut');
  to(S, 50.0, 2, { aperture: 0.00022 }, 'none');
  tl.fromTo('#shade', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 50.3);
  tl.fromTo('#chain', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 50.4);
  ['#c1', '#a1', '#c2', '#a2', '#c3', '#a3', '#c4'].forEach((sel, i) => {
    tl.fromTo(sel, { opacity: 0, y: 18, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }, 50.6 + i * 0.36);
  });
  tl.to('#chain', { opacity: 0, duration: 0.5 }, 54.4);

  // ---------------- SCENE 7  OUTRO (55-60) ----------------
  cam(55.0, 5.0, { dist: 84, ty: 2, az: 0.25, el: 0.12 }, 'sine.out');
  text('#outro1', 55.3, 1.2, null);
  text('#outro2', 56.5, 1.2, null);
  tl.to(['#outro1', '#outro2', '#shade'], { opacity: 0, duration: 0.9, ease: 'power2.in' }, 58.9);
  to(S, 58.8, 1.2, { fade: 1 }, 'power2.in');
  tl.set({}, {}, DURATION);
  return tl;
}
