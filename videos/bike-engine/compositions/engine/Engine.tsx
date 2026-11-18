import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "raea";
import { Bloom, Canvas3D, Entity, Environment, Instances, MotionBlur, ToneMapping } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { StandardMaterial } from "raea/pbr";
import { Mesh3d } from "raea/mesh";
import { Sphere } from "raea/3d";
import { AmbientLight, DirectionalLight, PointLight } from "raea/light";
import { Quat, Transform } from "raea/transform";
import { Camera3d } from "raea/camera";
import { AXIS, CAM, CAST, DIM, DRIVE, PARTS, SEAT } from "./geom";
import {
  BEATS, Beat, LINKS, Lang, PATH_EX, PATH_IN, PITCH, along, camAngle, chainAt, chainTravel, charge, clamp01, crankDeg,
  crankState, driveAngles, hash, lerp, slots, smooth, smoother, span, valveLift, where,
} from "./kin";
import { COPY } from "./copy";

type V3 = [number, number, number];
const rotZ = (a: number) => Quat.fromEuler("XYZ", 0, 0, a);
const at = (p: V3, a = 0) => Transform.fromXyz(p[0], p[1], p[2]).withRotation(rotZ(a));
const addS = (p: V3, d: V3, s: number): V3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
const glow = (hex: string, k: number) => LinearRgba.from(Srgba.hex(hex)).mul(k);

// ---- materials --------------------------------------------------------------------------------------------------
type Mat = { base_color: string; metallic?: number; perceptual_roughness?: number; clearcoat?: number; clearcoat_perceptual_roughness?: number };
const M: Record<string, Mat> = {
  alu: { base_color: "#bfc3c8", metallic: 1, perceptual_roughness: 0.4 },
  aluCast: { base_color: "#a7abb1", metallic: 1, perceptual_roughness: 0.55 },
  aluPolished: { base_color: "#d9dce0", metallic: 1, perceptual_roughness: 0.2 },
  steel: { base_color: "#a2a8ae", metallic: 1, perceptual_roughness: 0.27 },
  polished: { base_color: "#dcdfe3", metallic: 1, perceptual_roughness: 0.14 },
  chrome: { base_color: "#f0f2f4", metallic: 1, perceptual_roughness: 0.05 },
  darkSteel: { base_color: "#3c4047", metallic: 1, perceptual_roughness: 0.33 },
  spring: { base_color: "#30455a", metallic: 0.9, perceptual_roughness: 0.3 },
  ceramic: { base_color: "#f2f0ea", metallic: 0, perceptual_roughness: 0.18, clearcoat: 0.6, clearcoat_perceptual_roughness: 0.1 },
  rubber: { base_color: "#151515", metallic: 0, perceptual_roughness: 0.82 },
  paint: { base_color: "#1b1c20", metallic: 0.3, perceptual_roughness: 0.38, clearcoat: 1, clearcoat_perceptual_roughness: 0.08 },
  section: { base_color: "#a3121c", metallic: 0, perceptual_roughness: 0.7 },
  brass: { base_color: "#c9955f", metallic: 1, perceptual_roughness: 0.3 },
  heat: { base_color: "#c7b49a", metallic: 1, perceptual_roughness: 0.18 },
};
const Mt = ({ m }: { m: Mat }) => <StandardMaterial {...m} />;

// ---- the camera ---------------------------------------------------------------------------------------------------
type Pose = { pos: V3; look: V3; fov: number };
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  pos: [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)],
  look: [lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t)],
  fov: lerp(a.fov, b.fov, t),
});
const P = (pos: V3, look: V3, fov: number): Pose => ({ pos, look, fov });
/** Each beat's camera from its slot fraction u. */
const SHOT: Record<Beat, (u: number) => Pose> = {
  hook: (u) => mixPose(P([2.2, 3.9, 6.8], [0.0, 2.6, 0], 36), P([1.0, 3.4, 5.8], [0.0, 2.5, 0], 34), smooth(u)),
  reveal: (u) => mixPose(P([7.5, 5.2, 14.5], [0.7, 1.7, 0], 40), P([3.0, 3.6, 15.0], [0.5, 1.7, 0], 40), smoother(u)),
  parts: (u) => mixPose(P([1.6, 2.6, 9.4], [0.15, 1.75, 0], 40), P([0.6, 2.3, 8.7], [0.1, 1.8, 0], 40), smooth(u)),
  intake: (u) => mixPose(P([-1.6, 3.2, 9.4], [-0.7, 2.1, 0], 40), P([-1.2, 3.0, 8.8], [-0.6, 2.1, 0], 40), smooth(u)),
  compression: (u) => mixPose(P([0.5, 3.0, 8.6], [0.0, 2.0, 0], 40), P([0.3, 2.8, 7.8], [0.0, 2.1, 0], 40), smooth(u)),
  power: (u) => mixPose(P([0.3, 2.8, 7.8], [0.0, 2.1, 0], 40), P([0.6, 2.4, 9.0], [0.0, 1.7, 0], 40), smooth(span(u, 0.25, 0.9))),
  exhaust: (u) => mixPose(P([2.6, 2.8, 9.8], [1.3, 1.8, 0], 40), P([3.0, 2.3, 10.2], [1.5, 1.4, 0], 40), smooth(u)),
  drive: (u) => {
    const a0 = P([2.6, 0.9, 8.2], [1.6, -0.1, 0.4], 40);
    const a = P([2.3, 0.5, 7.2], [1.7, -0.3, 0.5], 40);
    const c = P([13.0, 0.2, 18.0], [12.4, -0.5, 0.4], 42);
    return u < 0.36 ? mixPose(a0, a, smooth(span(u, 0, 0.36))) : mixPose(a, c, smoother(span(u, 0.36, 0.74)));
  },
  outro: (u) => mixPose(P([6.2, 4.4, 12.4], [0.6, 1.4, 0], 40), P([3.6, 3.8, 11.4], [0.5, 1.5, 0], 38), smooth(u)),
};
const BLEND = 0.9; // seconds of glide from one beat's camera into the next

function cameraAt(lang: Lang, sec: number): Pose {
  const w = where(lang, sec);
  let pose = SHOT[w.beat](w.u);
  const i = BEATS.indexOf(w.beat);
  if (i > 0 && w.t < BLEND && w.beat !== "reveal") {
    const prev = BEATS[i - 1];
    pose = mixPose(SHOT[prev](1), pose, smoother(w.t / BLEND));
  }
  // the bang: a short kick
  if (w.beat === "power") {
    const k = span(w.u, 0.255, 0.42);
    if (k > 0 && k < 1) {
      const amp = 0.07 * (1 - k) * (1 - k);
      pose = { ...pose, pos: [pose.pos[0] + amp * Math.sin(k * 61), pose.pos[1] + amp * Math.sin(k * 47 + 1), pose.pos[2]] };
    }
  }
  return pose;
}

/** Project a world point to page pixels for a camera looking at `look` with a vertical fov (degrees). */
function project(p: V3, pose: Pose, W: number, H: number) {
  const f: V3 = [pose.look[0] - pose.pos[0], pose.look[1] - pose.pos[1], pose.look[2] - pose.pos[2]];
  const fl = Math.hypot(...f); f[0] /= fl; f[1] /= fl; f[2] /= fl;
  let r: V3 = [-f[2], 0, f[0]]; // f x up(0,1,0)
  const rl = Math.hypot(...r); r = [r[0] / rl, r[1] / rl, r[2] / rl];
  const u: V3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const d: V3 = [p[0] - pose.pos[0], p[1] - pose.pos[1], p[2] - pose.pos[2]];
  const z = d[0] * f[0] + d[1] * f[1] + d[2] * f[2];
  const t = Math.tan(((pose.fov * Math.PI) / 180) / 2);
  const x = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / (z * t * (W / H));
  const y = (d[0] * u[0] + d[1] * u[1] + d[2] * u[2]) / (z * t);
  return { x: (x * 0.5 + 0.5) * W, y: (0.5 - y * 0.5) * H, front: z > 0 };
}

// ---- section open/close -------------------------------------------------------------------------------------------
function openness(lang: Lang, sec: number) {
  const w = where(lang, sec);
  if (w.beat === "hook") return 1;
  if (w.beat === "reveal") return 1 - smoother(span(w.u, 0.0, 0.22)) + smoother(span(w.u, 0.6, 0.86));
  return 1;
}

// ---- the film ---------------------------------------------------------------------------------------------------
export function EngineFilm({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const sec = frame / fps;
  const w = where(lang, sec);
  const deg = crankDeg(lang, sec);
  const cs = crankState(deg);
  const ch = charge(deg);
  const dr = driveAngles(deg);
  const pose = cameraAt(lang, sec);
  const open = openness(lang, sec);
  const o = smoother(open);
  const fast = w.beat === "hook" || w.beat === "outro" || (w.beat === "reveal" && w.u < 0.5);

  // when the engine runs fast the fire glows softly: no more than a gentle flicker (WCAG 2.3.1); the slow-motion
  // power stroke keeps its full bang
  const slowMo = ["parts", "intake", "compression", "power", "exhaust"].includes(w.beat) || (w.beat === "reveal" && w.u > 0.5);
  const fk = slowMo ? 1 : 0.12;
  const burnV = ch.burn * fk, sparkV = ch.spark * fk;

  const liftIn = valveLift("in", deg), liftEx = valveLift("ex", deg);
  const valveTf = (k: "in" | "ex", along: number, lift: number) =>
    at(addS(SEAT[k], AXIS[k], along - lift), k === "in" ? DIM.valveTilt : -DIM.valveTilt);

  // gas column: from the crown to the deck, in the back half only
  const crown = cs.crownY + 0.03;
  const colH = Math.max(0.01, DIM.deck - crown);
  const mixCol = "#56c8ff", exCol = "#8c8173", fireCol = "#ff9a3c";
  const unburnt = ch.burnt === 0;
  const gasColor = burnV > 0.02 ? "#ff8a2a" : unburnt ? mixCol : exCol;
  const gasAlpha = burnV > 0.02 ? 0.3 + 0.3 * burnV : unburnt ? 0.08 + 0.22 * ch.fill + 0.18 * ch.squeeze : 0.12 + 0.3 * ch.fill;
  const gasGlow = burnV > 0.02 ? glow(fireCol, 0.4 + 4.5 * burnV) : unburnt ? glow(mixCol, 0.25 + 0.6 * ch.squeeze) : glow("#000000", 0);
  const gasMat = (
    <StandardMaterial base_color={Srgba.hex(gasColor).with_alpha(gasAlpha)} emissive={gasGlow} perceptual_roughness={0.9} metallic={0} alpha_mode="Blend" double_sided />
  );

  // particles: the charge drawn in through the intake, the burnt gas pushed out to the silencer
  const N = 34;
  const flowIn = liftIn / DIM.liftMax, flowEx = liftEx / DIM.liftMax;
  const runRate = fast ? 1.6 : 0.45;
  const puffs = (path: typeof PATH_IN, flow: number, seed: number, rate: number) =>
    Array.from({ length: N }, (_, i) => {
      const u = (i / N + sec * rate + hash(i + seed) * 0.03) % 1;
      const p = along(path, u);
      const jy = (hash(i * 3 + seed) - 0.5) * 0.16, jz = -0.05 - hash(i * 7 + seed) * 0.14;
      const s = flow > 0.04 ? (0.6 + 0.8 * hash(i * 5 + seed)) * Math.min(1, flow * 1.6) : 0.0001;
      return { position: [p[0], p[1] + jy, jz] as V3, scale: [s, s, s] as V3 };
    });

  // drivetrain
  const travel = chainTravel(dr.counter);
  const links = Array.from({ length: LINKS }, (_, i) => {
    const c = chainAt(i * PITCH - travel);
    return { position: [c.x, c.y, DRIVE.front.z] as V3, rotation: [0, 0, c.a] as V3 };
  });

  const front = (y: number) => Transform.fromXyz(0, 4.5 * y, 7.5 * y).withRotation(Quat.fromEuler("XYZ", -0.25 * y, 0, 0));
  const frontTf = front(o);
  const showFront = o < 0.999;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 38%, #2a3140 0%, #161a22 45%, #0b0d12 100%)" }}>
      <Canvas3D layered>
        <Camera3d transform={Transform.fromXyz(...pose.pos).lookingAt(pose.look)} projection={{ Perspective: { fov: (pose.fov * Math.PI) / 180 } }} />
        <Environment src={staticFile("studio.hdr")} intensity={1.15} />
        <AmbientLight brightness={25} />
        <DirectionalLight transform={Transform.fromXyz(5, 9, 7).lookingAt([0, 1.5, 0])} illuminance={4200} shadow_maps_enabled color="#fff4e6" />
        <DirectionalLight transform={Transform.fromXyz(-6, 3, -4).lookingAt([0, 1.5, 0])} illuminance={1600} color="#9cc4ff" />
        <ToneMapping mode="tony" exposure={0.1} />
        <Bloom intensity={0.55} threshold={1.0} />
        {fast ? <MotionBlur shutterAngle={0.45} samples={4} /> : null}

        {/* castings: back half with red section caps; front half slides away */}
        {(["barrel", "head", "camBox", "crankcase", "carb", "header"] as const).map((k) => {
          const m = k === "crankcase" ? M.aluCast : k === "camBox" ? M.aluPolished : k === "header" ? M.chrome : M.alu;
          return [
            <Mesh3d allowOverlap key={`${k}-b`} name={`${k}-back`} shape={CAST[k].back}><Mt m={m} /></Mesh3d>,
            <Mesh3d allowOverlap key={`${k}-c`} name={`${k}-cap`} shape={CAST[k].cap}><Mt m={M.section} /></Mesh3d>,
            showFront ? <Mesh3d allowOverlap key={`${k}-f`} name={`${k}-front`} shape={CAST[k].front} transform={frontTf}><Mt m={m} /></Mesh3d> : null,
          ];
        })}

        {/* crank, rod, piston */}
        <Mesh3d allowOverlap name="crank" shape={PARTS.crank} transform={at([0, 0, 0], cs.crankAngle)}><Mt m={M.steel} /></Mesh3d>
        <Mesh3d allowOverlap name="rod" shape={PARTS.rod} transform={at([0, cs.pinY, 0], cs.rodAngle)}><Mt m={M.polished} /></Mesh3d>
        <Mesh3d allowOverlap name="piston" shape={PARTS.piston} transform={at([0, cs.pinY, 0])}><Mt m={M.aluPolished} /></Mesh3d>
        <Mesh3d allowOverlap name="rings" shape={PARTS.rings} transform={at([0, cs.pinY, 0])}><Mt m={M.darkSteel} /></Mesh3d>
        <Mesh3d allowOverlap name="pin" shape={PARTS.pin} transform={at([0, cs.pinY, 0])}><Mt m={M.chrome} /></Mesh3d>

        {/* valvetrain */}
        {(["in", "ex"] as const).map((k) => {
          const lift = k === "in" ? liftIn : liftEx;
          const tilt = k === "in" ? DIM.valveTilt : -DIM.valveTilt;
          const springLen = 1.17 - lift - 0.66;
          return [
            <Mesh3d allowOverlap key={`v${k}`} name={`valve-${k}`} shape={PARTS.valve} transform={valveTf(k, 0, lift)}><Mt m={k === "ex" ? M.heat : M.steel} /></Mesh3d>,
            <Mesh3d allowOverlap key={`s${k}`} name={`seat-${k}`} shape={PARTS.seat} transform={at(addS(SEAT[k], AXIS[k], -0.02), tilt)}><Mt m={M.brass} /></Mesh3d>,
            <Mesh3d allowOverlap key={`r${k}`} name={`ret-${k}`} shape={PARTS.retainer} transform={valveTf(k, 1.17, lift)}><Mt m={M.steel} /></Mesh3d>,
            <Mesh3d allowOverlap key={`b${k}`} name={`bucket-${k}`} shape={PARTS.bucket} transform={valveTf(k, 1.24, lift)}><Mt m={M.polished} /></Mesh3d>,
            <Mesh3d allowOverlap key={`k${k}`} name={`spring-${k}`} shape={PARTS.spring}
              transform={at(addS(SEAT[k], AXIS[k], 0.66), tilt).withScale([1, springLen, 1])}><Mt m={M.spring} /></Mesh3d>,
            <Mesh3d allowOverlap key={`c${k}`} name={`cam-${k}`} shape={PARTS.camshaft} transform={at(CAM[k], camAngle(k, deg))}><Mt m={M.polished} /></Mesh3d>,
          ];
        })}

        {/* spark plug */}
        <Entity3 y={DIM.domeTop - 0.06}>
          <Mesh3d allowOverlap name="plug" shape={PARTS.plug.metal}><Mt m={M.steel} /></Mesh3d>
          <Mesh3d allowOverlap name="electrode" shape={PARTS.plug.electrode}><Mt m={M.brass} /></Mesh3d>
          <Mesh3d allowOverlap name="insulator" shape={PARTS.insulator}><Mt m={M.ceramic} /></Mesh3d>
          <Mesh3d allowOverlap name="plugcap" shape={PARTS.plugCap}><Mt m={M.rubber} /></Mesh3d>
        </Entity3>
        <Mesh3d allowOverlap name="spark" transform={Transform.fromXyz(0.0, DIM.domeTop - 0.1, 0.02).withScale([0.01 + sparkV * 0.7, 0.01 + sparkV * 0.7, 0.01 + sparkV * 0.7])}>
          <Sphere radius={0.07} />
          <StandardMaterial base_color="#ffffff" emissive={glow("#bfe0ff", 1 + 14 * sparkV)} unlit />
        </Mesh3d>
        <PointLight transform={Transform.fromXyz(0, DIM.domeTop - 0.3, 0.4)} color="#ffa04a" intensity={20 + 260000 * burnV + 80000 * sparkV} range={5} />

        {/* the charge in the cylinder */}
        <Mesh3d allowOverlap name="gas" shape={PARTS.gasColumn} transform={Transform.fromXyz(0, crown, 0).withScale([1, colH, 1])}>{gasMat}</Mesh3d>
        <Mesh3d allowOverlap name="gas-dome" shape={PARTS.gasDome}>{gasMat}</Mesh3d>
        <Instances at={puffs(PATH_IN, flowIn, 11, runRate)}>
          <Sphere radius={0.045} />
          <StandardMaterial base_color={Srgba.hex(mixCol).with_alpha(0.85)} emissive={glow(mixCol, 1.2)} alpha_mode="Blend" />
        </Instances>
        <Instances at={puffs(PATH_EX, flowEx, 29, runRate * 1.3)}>
          <Sphere radius={0.05} />
          <StandardMaterial base_color={Srgba.hex("#a39888").with_alpha(0.8)} emissive={glow("#ff7a2a", 0.15)} alpha_mode="Blend" />
        </Instances>

        {/* primary drive, gearbox, final drive */}
        <Mesh3d allowOverlap name="crank-gear" shape={PARTS.crankGear} transform={at([0, 0, DRIVE.crankGear.z], dr.crank)}><Mt m={M.steel} /></Mesh3d>
        <Mesh3d allowOverlap name="clutch" shape={PARTS.clutch} transform={at([DRIVE.clutch.x, DRIVE.clutch.y, DRIVE.clutch.z], dr.clutch)}><Mt m={M.steel} /></Mesh3d>
        <Mesh3d allowOverlap name="clutch-basket" shape={PARTS.clutchBasket} transform={at([DRIVE.clutch.x, DRIVE.clutch.y, DRIVE.clutch.z], dr.clutch)}><Mt m={M.alu} /></Mesh3d>
        <Mesh3d allowOverlap name="main-gear" shape={PARTS.mainGear} transform={at([DRIVE.main.x, DRIVE.main.y, DRIVE.main.z], dr.clutch)}><Mt m={M.polished} /></Mesh3d>
        <Mesh3d allowOverlap name="counter-gear" shape={PARTS.counterGear} transform={at([DRIVE.counter.x, DRIVE.counter.y, DRIVE.counter.z], dr.counter)}><Mt m={M.polished} /></Mesh3d>
        <Mesh3d allowOverlap name="main-shaft" shape={PARTS.shaft} transform={at([DRIVE.main.x, DRIVE.main.y, 0.0], dr.clutch)}><Mt m={M.steel} /></Mesh3d>
        <Mesh3d allowOverlap name="counter-shaft" shape={PARTS.shaft} transform={at([DRIVE.counter.x, DRIVE.counter.y, 0.55], dr.counter)}><Mt m={M.steel} /></Mesh3d>
        <Mesh3d allowOverlap name="front-sprocket" shape={PARTS.front} transform={at([DRIVE.front.x, DRIVE.front.y, DRIVE.front.z], dr.counter)}><Mt m={M.darkSteel} /></Mesh3d>
        <Mesh3d allowOverlap name="rear-sprocket" shape={PARTS.rear} transform={at([DRIVE.rear.x, DRIVE.rear.y, DRIVE.rear.z], dr.rear)}><Mt m={M.steel} /></Mesh3d>
        <Instances at={links} shape={PARTS.link}><Mt m={M.darkSteel} /></Instances>
        <Mesh3d allowOverlap name="swingarm" shape={PARTS.swingarm}><Mt m={M.paint} /></Mesh3d>
        <Entity3 x={DRIVE.rear.x} y={DRIVE.rear.y} a={dr.rear}>
          <Mesh3d allowOverlap name="tyre" shape={PARTS.wheel.tyre}><Mt m={M.rubber} /></Mesh3d>
          <Mesh3d allowOverlap name="rim" shape={PARTS.wheel.rim}><Mt m={M.alu} /></Mesh3d>
          <Mesh3d allowOverlap name="hub" shape={PARTS.wheel.hub}><Mt m={M.aluCast} /></Mesh3d>
          <Mesh3d allowOverlap name="spokes" shape={PARTS.wheel.spokes}><Mt m={M.chrome} /></Mesh3d>
        </Entity3>
        <Mesh3d allowOverlap name="axle" shape={PARTS.wheel.axle} transform={Transform.fromXyz(DRIVE.rear.x, DRIVE.rear.y, 0)}><Mt m={M.steel} /></Mesh3d>
      </Canvas3D>

      <Overlay lang={lang} sec={sec} pose={pose} W={W} H={H} deg={deg} />
    </AbsoluteFill>
  );
}

function Entity3({ x = 0, y = 0, a = 0, children }: { x?: number; y?: number; a?: number; children: unknown }) {
  return <Entity transform={at([x, y, 0], a)}>{children as never}</Entity>;
}

// ---- 2D: titles, the stroke card, labels ---------------------------------------------------------------------------
const STROKES: Beat[] = ["intake", "compression", "power", "exhaust"];

function Overlay({ lang, sec, pose, W, H, deg }: { lang: Lang; sec: number; pose: Pose; W: number; H: number; deg: number }) {
  const w = where(lang, sec);
  const C = COPY[lang];
  const font = lang === "hi" ? "Noto Sans Devanagari" : "Inter";
  const s = slots(lang);
  const sayU = (b: Beat, f: number) => (s[b].say0 + (s[b].say1 - s[b].say0) * f - s[b].t0) / (s[b].t1 - s[b].t0);

  // title over the hook, and the four words at the end
  const titleIn = w.beat === "hook" ? smooth(span(w.u, 0.02, 0.12)) * (1 - smooth(span(w.u, 0.86, 0.98))) : 0;
  const strokeIdx = STROKES.indexOf(w.beat);
  const cardIn = strokeIdx >= 0 ? smooth(span(w.u, 0.02, 0.1)) * (1 - smooth(span(w.u, 0.93, 1))) : 0;

  // labels
  const cs = crankState(deg);
  const anchors: Record<string, V3> = {
    piston: [0.5, cs.crownY - 0.25, 0.1],
    rod: [0.12, (cs.pinY + 0) / 2 + 0.1, 0.12],
    crank: [0.55, -0.55, 0.24],
    valveIn: [SEAT.in[0] - 0.12, SEAT.in[1] + 0.4, 0.02],
    valveEx: [SEAT.ex[0] + 0.12, SEAT.ex[1] + 0.4, 0.02],
    plug: [0.0, 4.15, 0.12],
    mixture: [-2.6, 3.32, 0.0],
    silencer: [3.0, 0.6, 0.15],
    gearbox: [DRIVE.main.x + 0.2, DRIVE.main.y + 0.3, DRIVE.main.z + 0.12],
    chain: [7.5, -0.45, DRIVE.front.z],
    wheel: [DRIVE.rear.x - 2.6, DRIVE.rear.y + 3.4, 0.3],
  };
  type L = { key: keyof typeof anchors & string; side: "l" | "r"; from: number; to?: number; dy?: number };
  const LABELS: Partial<Record<Beat, L[]>> = {
    parts: [
      { key: "piston", side: "r", from: sayU("parts", 0.02) },
      { key: "rod", side: "l", from: sayU("parts", 0.3), dy: 40 },
      { key: "crank", side: "r", from: sayU("parts", 0.45) },
      { key: "valveIn", side: "l", from: sayU("parts", 0.7), dy: -70 },
      { key: "valveEx", side: "r", from: sayU("parts", 0.74), dy: -70 },
      { key: "plug", side: "l", from: sayU("parts", 0.86), dy: -150 },
    ],
    intake: [{ key: "valveIn", side: "r", from: 0.25, dy: -160 }, { key: "mixture", side: "l", from: 0.5, dy: -140 }],
    exhaust: [{ key: "valveEx", side: "l", from: 0.25, dy: -160 }, { key: "silencer", side: "r", from: 0.55 }],
    drive: [
      { key: "gearbox", side: "r", from: 0.1, to: 0.4, dy: -200 },
      { key: "chain", side: "l", from: 0.46, to: 0.7, dy: -200 },
      { key: "wheel", side: "l", from: 0.72, dy: -220 },
    ],
  };
  const list = LABELS[w.beat] ?? [];
  const topMin = STROKES.includes(w.beat) ? 600 : 330;
  const words: string[] = C.words;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 760, background: "linear-gradient(180deg, rgba(6,8,12,0.82) 0%, rgba(6,8,12,0.55) 45%, rgba(6,8,12,0) 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {list.map((l) => {
          const a = smooth((w.u - l.from) / 0.05) * (l.to !== undefined ? 1 - smooth((w.u - l.to) / 0.04) : 1) * (1 - smooth(span(w.u, 0.95, 1)));
          if (a <= 0.001) return null;
          const p = project(anchors[l.key], pose, W, H);
          if (!p.front) return null;
          const bx = l.side === "l" ? 70 : W - 70;
          const by = Math.min(H - 360, Math.max(topMin, p.y + (l.dy ?? 0)));
          const mx = l.side === "l" ? bx + 330 : bx - 330;
          const ex = lerp(mx, p.x, a), ey = lerp(by, p.y, a);
          return (
            <g key={l.key} opacity={a}>
              <polyline points={`${l.side === "l" ? bx + 10 : bx - 10},${by} ${mx},${by} ${ex},${ey}`} fill="none" stroke="#ffd166" strokeWidth={3} />
              <circle cx={p.x} cy={p.y} r={9 * a} fill="#ffd166" />
              <circle cx={p.x} cy={p.y} r={16 * a} fill="none" stroke="#ffd166" strokeWidth={2} opacity={0.6} />
            </g>
          );
        })}
      </svg>
      {list.map((l) => {
        const a = smooth((w.u - l.from) / 0.05) * (l.to !== undefined ? 1 - smooth((w.u - l.to) / 0.04) : 1) * (1 - smooth(span(w.u, 0.95, 1)));
        if (a <= 0.001) return null;
        const p = project(anchors[l.key], pose, W, H);
        const by = Math.min(H - 360, Math.max(topMin, p.y + (l.dy ?? 0)));
        return (
          <div key={l.key} style={{
            position: "absolute", top: by - 74, [l.side === "l" ? "left" : "right"]: 70, opacity: a,
            fontFamily: font, fontWeight: 700, fontSize: 46, color: "#ffffff", whiteSpace: "nowrap",
            padding: "8px 18px", borderRadius: 14, background: "rgba(10,12,18,0.72)", border: "2px solid rgba(255,209,102,0.85)",
            transform: `translateY(${(1 - a) * 12}px)`,
          }}>{C.labels[l.key]}</div>
        );
      })}

      {titleIn > 0 ? (
        <div style={{ position: "absolute", top: 230, left: 60, right: 60, textAlign: "center", opacity: titleIn, transform: `translateY(${(1 - titleIn) * 30}px)` }}>
          <div style={{ fontFamily: font, fontWeight: 800, fontSize: lang === "hi" ? 92 : 104, lineHeight: 1.12, color: "#ffffff" }}>{C.title}</div>
          <div style={{ marginTop: 18, fontFamily: font, fontWeight: 600, fontSize: 44, color: "#ffd166", letterSpacing: lang === "hi" ? 0 : 3 }}>{C.subtitle}</div>
        </div>
      ) : null}

      {cardIn > 0 ? (
        <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: cardIn, transform: `translateY(${(1 - cardIn) * -24}px)` }}>
          <div style={{ fontFamily: font, fontWeight: 600, fontSize: 40, color: "#ffd166", letterSpacing: lang === "hi" ? 0 : 4 }}>{C.strokeN(strokeIdx + 1)}</div>
          <div style={{ marginTop: 6, fontFamily: font, fontWeight: 800, fontSize: 104, color: "#ffffff", lineHeight: 1.1 }}>{C.strokes[strokeIdx]}</div>
          <div style={{ marginTop: 18, display: "flex", gap: 14 }}>
            {STROKES.map((b, i) => (
              <div key={b} style={{ width: 120, height: 12, borderRadius: 6, background: i < strokeIdx ? "#ffd166" : i === strokeIdx ? "#ffffff" : "rgba(255,255,255,0.22)" }}>
                {i === strokeIdx ? <div style={{ width: `${Math.round(100 * clamp01(span(w.u, 0.12, 0.86)))}%`, height: 12, borderRadius: 6, background: "#ffd166" }} /> : null}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontFamily: font, fontWeight: 700, fontSize: 46, color: "rgba(255,255,255,0.75)" }}>{words[strokeIdx]}</div>
        </div>
      ) : null}

      {w.beat === "outro" ? (
        <div style={{ position: "absolute", top: 240, left: 40, right: 40, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22 }}>
          {words.map((word, i) => {
            const a = smooth(span(w.u, sayU("outro", 0.42 + i * 0.1), sayU("outro", 0.42 + i * 0.1) + 0.05));
            return (
              <div key={word} style={{
                fontFamily: font, fontWeight: 800, fontSize: 84, color: i === 2 ? "#ffb347" : "#ffffff", opacity: a,
                transform: `scale(${0.7 + 0.3 * a})`,
              }}>{word}</div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
