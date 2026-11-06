// ─────────────────────────────────────────────────────────────────────────────
//  "Kile ke darwaze pe keelein kyun?" – our own 2D flat-illustration reel (facts + sources in SCRIPT.md).
//  Lean 2D style: SkyBG + flat SVG props (scenes/Fort.tsx) + Pan camera + kit chips. Voice: OmniVoice A.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Stamp } from "./kit/Marks";
import { EndCard } from "./kit/EndCard";
import { Pan, SkyBG, P as PAL } from "./kit/Flat2D";
import { Elephant, Gate, HillFort, PathMap, WallLoopholes } from "./scenes/Fort";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = [];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const Shade: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 70%, rgba(0,0,0,.35) 100%)" }} />;

// 1 ── HOOK: spikes on a fort gate – why? (push into the spikes)
const S1: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><SkyBG />
    <Pan d={d} from={[540, 1000, 0.9]} to={[540, 900, 1.35]}><Gate spikes={1} /></Pan>
    <Shade />
    <Pill at={G(o, hit("L1", "keelein"))} x={110} y={1380} text="YE KEELEIN?" size={86} />
    <Hud left="Rajasthan · kila" right="raaz" clock="?" />
  </AbsoluteFill>
);
// 2 ── for the elephant (elephant walks in)
const S2: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill><SkyBG />
      <Pan d={d} from={[540, 1100, 1]} to={[540, 1100, 1.08]}>
        <Gate x={860} s={0.7} spikes={1} />
        <Elephant x={lerp(f, [0, d], [-120, 300])} y={1560} s={1.05} />
      </Pan>
      <Shade />
      <Stamp at={4} x={360} y={700} text="HAATHI!" size={110} rot={-6} color={C.lime} fill={false} />
      <Hud left="Asli wajah" right="haathi" clock="01" />
    </AbsoluteFill>
  );
};
// 3 ── old days: the enemy rammed the gate with elephants (no spikes → crack)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const hitF = G(o, hit("L3", "todta"));
  const ex = f < hitF ? lerp(f, [0, hitF], [-200, 420]) : 420 - Math.sin(Math.min(1, (f - hitF) / 6) * Math.PI) * 30;
  return (
    <AbsoluteFill><SkyBG warm={1} />
      <Pan d={d} from={[540, 1050, 1]} to={[600, 1050, 1.06]}>
        <Gate x={860} s={0.7} shake={f >= hitF && f < hitF + 10 ? 14 : 0} crack={lerp(f, [hitF, hitF + 8], [0, 1])} />
        <Elephant x={ex} y={1560} s={1.05} walk={f < hitF} />
      </Pan>
      <Shade />
      <Chip at={4} x={110} y={1380} lines={["PURAANA ZAMAANA"]} size={50} mono />
      {f >= hitF && <Stamp at={hitF} x={700} y={760} text="DHAD!" size={110} rot={8} />}
      <Hud left="Hamla" right="haathi vs darwaza" clock="02" dot={C.red} />
    </AbsoluteFill>
  );
};
// 4 ── iron spikes at elephant-head height (spikes slide out, elephant recoils)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const sp = G(o, hit("L4", "keelein"));
  const hgt = G(o, hit("L4", "unchai"));
  return (
    <AbsoluteFill><SkyBG />
      <Pan d={d} from={[640, 1000, 0.95]} to={[700, 960, 1.05]}>
        <Gate x={860} s={0.7} spikes={lerp(f, [sp - 10, sp + 6], [0, 1])} />
        <Elephant x={lerp(f, [sp + 6, sp + 20], [400, 300])} y={1560} s={1.05} walk={false} hurt={io(f, sp + 6, 6)} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: io(f, hgt, 6) }}>
          <line x1={120} x2={1040} y1={1030} y2={1030} stroke={PAL.lime} strokeWidth={8} strokeDasharray="30 18" />
        </svg>
      </Pan>
      <Shade />
      <Chip at={hgt} x={110} y={1300} lines={["HAATHI KE SIR KI UNCHAI"]} size={46} mono />
      <Pill at={sp} x={110} y={1410} text="LOHE KI KEELEIN" size={76} />
      <Hud left="Jawab #1" right="keelein" clock="03" />
    </AbsoluteFill>
  );
};
// 5 ── the path: not straight, but zig-zag (map draws)
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const z = G(o, hit("L5", "ghumaavdaar"));
  return (
    <AbsoluteFill style={{ background: "#2a2118" }}>
      <Pan d={d} from={[540, 1100, 0.96]} to={[540, 1100, 1.02]}><PathMap straight={io(f, G(o, hit("L5", "seedha")), 10)} zig={lerp(f, [z - 4, d], [0, 1])} /></Pan>
      <Chip at={G(o, hit("L5", "seedha"))} x={110} y={1440} lines={["SEEDHA ✕"]} size={52} color={C.red} />
      <Chip at={z} x={560} y={1440} lines={["GHUMAAVDAAR ✓"]} size={52} />
      <Hud left="Raasta" right="upar se" clock="04" />
    </AbsoluteFill>
  );
};
// 6 ── so the elephant can't build up speed (two dots race)
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const t = lerp(f, [4, d], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#2a2118" }}>
      <PathMap straight={1} zig={1} dotS={Math.min(1, t * 1.6)} dotZ={t * 0.45} />
      <Chip at={2} x={110} y={1440} lines={["SEEDHA = TEZ"]} size={50} color={C.red} mono />
      <Chip at={8} x={560} y={1440} lines={["GHUMAAV = DHEEMA"]} size={46} mono />
      <Stamp at={G(o, hit("L6", "speed"))} x={540} y={1610} text="SPEED NAHI" size={80} rot={-4} color={C.lime} fill={false} />
      <Hud left="Haathi ki speed" right="khatam" clock="05" />
    </AbsoluteFill>
  );
};
// 7 ── the fort sits on a hill (wide, enemies climbing)
const S7: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><SkyBG />
    <Pan d={d} from={[540, 1160, 1.15]} to={[540, 1100, 0.98]}><HillFort climbers={1} /></Pan>
    <Shade />
    <Chip at={G(o, hit("L7", "pahaadi"))} x={110} y={1440} lines={["PAHAADI PE KILA"]} size={56} />
    <Hud left="Jawab #2" right="unchai" clock="06" />
  </AbsoluteFill>
);
// 8 ── holes in the walls to strike from above (arrows fly)
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill><SkyBG />
      <Pan d={d} from={[540, 1000, 1.05]} to={[540, 1060, 1.12]}><WallLoopholes shoot={io(f, G(o, hit("L8", "vaar")) - 8, 6)} /></Pan>
      <Shade />
      <Pill at={G(o, hit("L8", "chhed"))} x={110} y={1600} text="DEEWAR MEIN CHHED" size={70} />
      <Hud left="Jawab #3" right="upar se vaar" clock="07" />
    </AbsoluteFill>
  );
};
// 9 ── Mehrangarh, Jodhpur: seven gates (gates pop along the road)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const g = lerp(f, [G(o, hit("L9", "saat")) - 14, d - 4], [0, 7.01]);
  return (
    <AbsoluteFill><SkyBG warm={1} />
      <Pan d={d} from={[540, 1150, 1.0]} to={[540, 1150, 1.04]}><HillFort gates={g} arrows /></Pan>
      <Shade />
      <Chip at={G(o, hit("L9", "Mehrangarh"))} x={110} y={1440} lines={["MEHRANGARH · JODHPUR"]} size={50} mono />
      <div style={{ position: "absolute", left: 110, top: 1250, fontFamily: F.sans, fontWeight: 900, fontSize: 120, color: C.lime, opacity: io(f, G(o, hit("L9", "saat")), 6), textShadow: "0 4px 30px rgba(0,0,0,.5)" }}>{Math.max(1, Math.floor(g))} / 7</div>
      <Hud left="Asli kila" right="7 darwaze" clock="08" />
    </AbsoluteFill>
  );
};
// 10 ── one gate, Loha Pol, still full of spikes
const S10: React.FC<SceneP> = ({ o, d }) => (
  <AbsoluteFill><SkyBG warm={1} />
    <Pan d={d} from={[540, 1000, 1.0]} to={[540, 900, 1.25]}><Gate spikes={1} label="LOHA POL" /></Pan>
    <Shade />
    <Pill at={G(o, hit("L10", "keelon"))} x={110} y={1400} text="AAJ BHI KEELEIN" size={76} />
    <Hud left="Loha Pol" right="Mehrangarh" clock="09" />
  </AbsoluteFill>
);
// 11 ── end card
const S11: React.FC<SceneP> = ({ o }) => (
  <AbsoluteFill><SkyBG warm={1} />
    <AbsoluteFill style={{ background: "rgba(10,13,12,.55)" }} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "Follow"))} logo="3D" />
    <Vignette />
  </AbsoluteFill>
);

const Pp = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  Pp(0, S1), Pp(at("L2"), S2), Pp(at("L3"), S3), Pp(at("L4"), S4), Pp(at("L5"), S5), Pp(at("L6"), S6), Pp(at("L7"), S7),
  Pp(at("L8"), S8), Pp(at("L9"), S9), Pp(at("L10"), S10), Pp(at("L11"), S11),
];
export const IMPACTS = [hit("L3", "todta")];
export const POPS = [hit("L1", "keelein"), hit("L2", "Haathi"), hit("L4", "keelein"), hit("L5", "ghumaavdaar"), hit("L6", "speed"), hit("L7", "pahaadi"), hit("L8", "chhed"), hit("L9", "saat"), hit("L10", "keelon"), hit("L11", "Follow")];
export const RISERS = [at("L9")];
export const DURATION = TOTAL;
