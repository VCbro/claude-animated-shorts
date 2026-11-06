// ─────────────────────────────────────────────────────────────────────────────
//  "Railway track pe pathar kyun?" – lean 2D flat reel (facts + sources in SCRIPT.md). No subtitles. Voice: OmniVoice A.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "./kit/theme";
import { io, lerp } from "./kit/anim";
import { at, hit, LINES, TOTAL } from "./kit/timeline";
import { Hud, Vignette } from "./kit/Frame";
import { Chip, Pill, Stamp } from "./kit/Marks";
import { EndCard } from "./kit/EndCard";
import { Pan, SkyBG } from "./kit/Flat2D";
import { Section, StoneShapes, TrackSide } from "./scenes/Rail";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id); // creator: no subtitles
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const Board: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: "linear-gradient(#cfe6f2, #f3e4c6)" }}>{children}</AbsoluteFill>;

// 1 ── HOOK: why these stones? (train rolls past, push in on the stones)
const S1: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill><SkyBG />
      <Pan d={d} from={[540, 1100, 1]} to={[540, 1250, 1.3]}><TrackSide trainX={lerp(f, [0, d], [-100, 1900])} /></Pan>
      <Pill at={G(o, hit("L1", "pathar"))} x={110} y={420} text="YE PATHAR KYUN?" size={84} />
      <Hud left="Railway track" right="roz dekhte ho" clock="?" />
    </AbsoluteFill>
  );
};
// 2 ── not decoration: without them the track can't hold (stones vanish, rails sink & wobble)
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const b = G(o, hit("L2", "bina"));
  return (
    <AbsoluteFill><SkyBG warm={1} />
      <Pan d={d} from={[540, 1250, 1.15]} to={[540, 1250, 1.22]}><TrackSide ballast={1 - io(f, b, 8)} sink={io(f, b + 6, 14)} /></Pan>
      <Chip at={2} x={110} y={420} lines={["SAJAAWAT? NAHI"]} size={58} />
      <Stamp at={G(o, hit("L2", "tik"))} x={540} y={760} text="PATRI NAHI TIKEGI" size={80} rot={-4} />
      <Hud left="Bina pathar" right="khatra" clock="!" dot={C.red} />
    </AbsoluteFill>
  );
};
// 3 ── job 1: spread the weight (cross-section, arrows fan out)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Board>
      <Pan d={d} from={[540, 1000, 1.05]} to={[540, 1040, 0.98]}><Section load={lerp(f, [G(o, hit("L3", "wazan")), d - 10], [0, 1])} /></Pan>
      <Pill at={2} x={110} y={360} text="1. WAZAN FAILAANA" size={70} />
      <Chip at={G(o, hit("L3", "sleeper"))} x={560} y={600} lines={["SLEEPER"]} size={48} mono />
      <Hud left="Kaam #1" right="wazan" clock="1/4" />
    </Board>
  );
};
// 4 ── job 2: rain drains through (soil would turn to mud otherwise)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const w = G(o, hit("L6", "Warna"));
  return (
    <Board>
      <Pan d={d} from={[540, 1050, 1]} to={[540, 1050, 1.05]}><Section rain={1} mud={f >= w ? 1 : 0} /></Pan>
      <Pill at={2} x={110} y={360} text="2. PAANI NIKAALNA" size={70} />
      {f >= w && <Stamp at={w} x={540} y={1650} text="WARNA KEECHAD" size={78} rot={-4} />}
      <Hud left="Kaam #2" right="baarish" clock="2/4" />
    </Board>
  );
};
// 5 ── job 3: grip the sleeper so the track doesn't slide
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Board>
      <Pan d={d} from={[540, 900, 1.25]} to={[540, 900, 1.35]}><Section hold={io(f, G(o, hit("L7", "jakad")), 8)} /></Pan>
      <Pill at={2} x={110} y={360} text="3. JAKADNA" size={70} />
      <Chip at={G(o, hit("L7", "khiske"))} x={110} y={1500} lines={["PATRI NAHI KHISAKTI"]} size={52} mono />
      <Hud left="Kaam #3" right="pakad" clock="3/4" />
    </Board>
  );
};
// 6 ── bonus: grass can't grow easily
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Board>
      <Pan d={d} from={[540, 950, 1.3]} to={[540, 950, 1.38]}><Section grass={lerp(f, [4, d], [0.2, 1])} /></Pan>
      <Pill at={2} x={110} y={360} text="4. GHAAS NAHI" size={70} />
      <Stamp at={G(o, hit("L8", "ugti"))} x={540} y={1500} text="✕ GHAAS" size={90} rot={-6} />
      <Hud left="Bonus" right="safai" clock="4/4" />
    </Board>
  );
};
// 7 ── angular stones lock together, round ones would roll
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#2a2118" }}>
      <Pan d={d} from={[540, 1000, 1]} to={[540, 1000, 1.04]}><StoneShapes t={io(f, G(o, hit("L10", "ludhak")) - 4, 16)} /></Pan>
      <Chip at={G(o, hit("L9", "phans"))} x={110} y={1460} lines={["AAPAS MEIN PHANSE"]} size={52} mono />
      <Hud left="Shape ka raaz" right="nukeele" clock="★" />
    </AbsoluteFill>
  );
};
// 8 ── end card
const S8: React.FC<SceneP> = ({ o }) => (
  <AbsoluteFill><SkyBG warm={1} />
    <AbsoluteFill style={{ background: "rgba(10,13,12,.55)" }} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L11", "Follow"))} logo="3D" />
    <Vignette />
  </AbsoluteFill>
);

const Pp = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  Pp(0, S1), Pp(at("L2"), S2), Pp(at("L3"), S3), Pp(at("L5"), S4), Pp(at("L7"), S5), Pp(at("L8"), S6), Pp(at("L9"), S7), Pp(at("L11"), S8),
];
export const IMPACTS = [hit("L2", "tik")];
export const POPS = [hit("L1", "pathar"), hit("L3", "Pehla"), hit("L5", "Doosra"), hit("L6", "Warna"), hit("L7", "Teesra"), hit("L8", "ugti"), hit("L9", "phans"), hit("L10", "ludhak"), hit("L11", "Follow")];
export const RISERS = [at("L9")];
export const DURATION = TOTAL;
