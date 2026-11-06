// ─────────────────────────────────────────────────────────────────────────────
//  "Rani ki Vav" – our own build-up explainer of Patan's stepwell (facts + sources in SCRIPT.md).
//  Voice: OmniVoice (VoiceStudio engine), designed voice A. Own three.js cut-away diorama (three/Vav.tsx).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Cam, Hud, Vignette } from "./kit/Frame";
import { Chip, Counter, Pill, Stamp } from "./kit/Marks";
import { EndCard } from "./kit/EndCard";
import { Studio3D } from "./three/Studio";
import { CarvedWall, Vav3D } from "./three/Vav";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = [];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
type V3 = [number, number, number];
const G = (o: number, g: number) => g - o;

const Sky: React.FC<{ dusk?: number; storm?: number }> = ({ dusk = 0, storm = 0 }) => (
  <AbsoluteFill style={{ background: storm ? "linear-gradient(#3d4a5c 0%, #7d8794 50%, #a99a82 100%)" : dusk ? "linear-gradient(#f2a45c 0%, #f6d3a0 45%, #e8cfa4 100%)" : "linear-gradient(#6fa8e0 0%, #bcd8f0 45%, #ecdcbc 100%)" }} />
);
/** 3D shot helper: sky + diorama + camera move. */
const Shot: React.FC<{ d: number; from: V3; to: V3; look: V3; lookTo?: V3; fov?: number; vav: React.ComponentProps<typeof Vav3D>; sky?: React.ReactNode; children?: React.ReactNode }> = ({ d, from, to, look, lookTo, fov = 40, vav, sky, children }) => (
  <AbsoluteFill>{sky ?? <Sky />}
    <Studio3D dur={d + 8} from={from} to={to} look={look} lookTo={lookTo} fov={fov}><Vav3D {...vav} /></Studio3D>
    {children}
    <Vignette amt={0.4} />
  </AbsoluteFill>
);
const FULL = { well: 1, steps: 1, walls: 1, pav: 7, carve: true, water: 1, workers: false };

// 1 ── HOOK: a temple that goes DOWN (finished vav, diving camera)
const S1: React.FC<SceneP> = ({ o, d }) => (
  <Shot d={d} from={[-13, 13, 26]} to={[-7, 5.5, 16.5]} look={[0.5, -2, 0]} lookTo={[0.5, -2.8, 0]} fov={36} vav={FULL}>
    <Chip at={G(o, hit("L1", "neeche"))} x={110} y={1360} lines={["UPAR NAHI. NEECHE."]} size={58} mono />
    <Hud left="Patan · Gujarat" right="zameen ke andar" clock="00:00" />
  </Shot>
);
// 2 ── title: Rani ki Vav (looking down the steps)
const S2: React.FC<SceneP> = ({ d }) => (
  <Shot d={d} from={[-9, 3, 10]} to={[-8, 2.2, 8.6]} look={[-1, -2.2, 0]} fov={38} vav={FULL}>
    <Pill at={2} x={110} y={1240} text="RANI KI VAV" size={110} />
    <Chip at={8} x={110} y={1420} lines={["PATAN, GUJARAT"]} size={52} mono />
    <Hud left="Rani ki Vav" right="Patan" clock="00:04" />
  </Shot>
);
// 3 ── the question: summer, where does the water come from? (empty desert)
const S3: React.FC<SceneP> = ({ o, d }) => (
  <Shot d={d} from={[3, 2.2, 14]} to={[2.4, 1.9, 12.5]} look={[0, 0.2, -4]} fov={40} vav={{ well: 0, steps: 0, water: 0 }} sky={<Sky dusk={1} />}>
    <Chip at={G(o, hit("L3", "paani"))} x={110} y={1360} lines={["GARMI MEIN PAANI?"]} size={62} color={C.amber} />
    <Hud left="Registaan · garmi" right="sawaal" clock="?" />
  </Shot>
);
// 4 ── dig a well – but the water keeps sinking
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const n = G(o, hit("L4", "neeche"));
  return (
    <Shot d={d} from={[9.5, 1.5, 11]} to={[8.5, 0.6, 9.5]} look={[5.4, -2.6, 0]} fov={36} vav={{ well: 1, steps: 0, water: lerp(f, [n - 6, n + 14], [1, 0.25]) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: io(f, n - 4, 6) }}>
        <path d="M 860 900 L 860 1180" stroke={C.red} strokeWidth={14} /><path d="M 820 1170 L 860 1240 L 900 1170 Z" fill={C.red} />
      </svg>
      <Chip at={G(o, hit("L4", "Kuan"))} x={110} y={1360} lines={["KUAN"]} size={64} />
      <Chip at={n} x={110} y={1460} lines={["PAANI AUR NEECHE"]} size={50} color={C.red} mono />
      <Hud left="Kuan" right="garmi" clock="01" dot={C.red} />
    </Shot>
  );
};
// 5 ── cut steps all the way down: a vav (baoli)
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Shot d={d} from={[-9, 7, 19]} to={[-7, 5.5, 16.5]} look={[0.5, -2.8, 0]} fov={36} vav={{ well: 1, steps: lerp(f, [4, G(o, hit("L5", "paani")) + 10], [0, 1]), water: 1 }}>
      <Pill at={G(o, hit("L5", "vav"))} x={110} y={1360} text="VAV = BAOLI" size={84} />
      <Hud left="Seedhiyan" right="paani tak" clock="02" />
    </Shot>
  );
};
// 6 ── the queen builds it in memory of King Bhimdev I (stone walls rise)
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Shot d={d} from={[-3.4, 0.9, 2.6]} to={[-2.8, 0.7, 2.0]} look={[-1.2, 0.2, -2]} fov={42} vav={{ well: 1, steps: 1, walls: lerp(f, [6, d - 6], [0, 1]), water: 1, queen: true, workers: false }}>
      <Chip at={G(o, hit("L6", "Udayamati"))} x={110} y={1300} lines={["RANI UDAYAMATI"]} size={60} color={C.amber} />
      <Chip at={G(o, hit("L6", "Bhimdev"))} x={110} y={1420} lines={["RAJA BHIMDEV I KI YAAD MEIN"]} size={42} mono />
      <Hud left="11vi sadi" right="Solanki raaj" clock="03" />
    </Shot>
  );
};
// 7 ── seven storeys underground (pavilions rise level by level)
const S7: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  const p = lerp(f, [2, d - 4], [0, 7]);
  return (
    <Shot d={d} from={[-9, 7, 19]} to={[-7, 5.5, 16.5]} look={[0.5, -2.8, 0]} fov={36} vav={{ well: 1, steps: 1, walls: 1, pav: p, water: 1, workers: false }}>
      <div style={{ position: "absolute", left: 110, top: 1300, fontFamily: F.mono, fontWeight: 800, fontSize: 140, color: C.lime, textShadow: "0 4px 30px rgba(0,0,0,.6)" }}>{Math.max(1, Math.ceil(p))}/7</div>
      <Chip at={4} x={110} y={1470} lines={["MANZIL · ZAMEEN KE ANDAR"]} size={44} mono />
      <Hud left="Saat manzilein" right="neeche" clock="04" />
    </Shot>
  );
};
// 8 ── carvings: 500+ big sculptures, 1000+ small (close on a carved wall)
const Wall: React.FC<{ d: number; from: V3; to: V3; look: V3; dust?: number; children?: React.ReactNode }> = ({ d, from, to, look, dust = 0, children }) => (
  <AbsoluteFill style={{ background: "#2a2118" }}>
    <Studio3D dur={d + 8} from={from} to={to} look={look} fov={40}><CarvedWall dust={dust} /></Studio3D>
    {children}
    <Vignette amt={0.5} />
  </AbsoluteFill>
);
const S8: React.FC<SceneP> = ({ o, d }) => (
  <Wall d={d} from={[-2.2, 0.8, 11.5]} to={[0.4, 0.2, 9.8]} look={[-0.2, 0.2, 0]}>
    <Counter at={G(o, hit("L8", "500"))} dur={18} from={0} to={500} x={110} y={1230} size={120} suffix="+" color={C.lime} align="left" />
    <Chip at={G(o, hit("L8", "500")) + 6} x={110} y={1380} lines={["BADI MOORTIYAN"]} size={44} mono />
    <Counter at={G(o, hit("L8", "1000"))} dur={18} from={0} to={1000} x={580} y={1250} size={90} suffix="+" color={C.white} align="left" />
    <Hud left="Nakkashi" right="har deewar" clock="05" />
  </Wall>
);
// 9 ── water was sacred: an upside-down temple (temple icon flips)
const S9: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const fl = G(o, hit("L9", "ulta"));
  const r = lerp(f, [fl - 4, fl + 12], [0, 180]);
  return (
    <Shot d={d} from={[9, 6, 16]} to={[7.5, 4.8, 14]} look={[0, -2.8, 0]} fov={36} vav={FULL}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(800,1290) rotate(${r})`} opacity={io(f, 2, 8)}>
          <path d="M -90 60 L 90 60 L 90 0 L 60 0 L 60 -40 L 30 -40 L 30 -80 L 0 -120 L -30 -80 L -30 -40 L -60 -40 L -60 0 L -90 0 Z" fill="none" stroke={C.lime} strokeWidth={10} strokeLinejoin="round" />
        </g>
      </svg>
      <Pill at={G(o, hit("L9", "pavitra"))} x={110} y={1220} text="PAANI = PAVITRA" size={64} bg={C.white} />
      <Pill at={fl} x={110} y={1360} text="ULTA MANDIR" size={84} />
      <Hud left="Neeche se upar" right="mandir" clock="06" />
    </Shot>
  );
};
// 10 ── the Saraswati floods: mud fills the whole vav
const S10: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const b = G(o, hit("L10", "baadh"));
  return (
    <AbsoluteFill>
      <Cam dur={d} s0={1} s1={1.03} kick={[b]}>
        <Shot d={d} from={[-9, 7, 19]} to={[-7, 5.5, 16.5]} look={[0.5, -2.8, 0]} fov={36} vav={{ ...FULL, silt: lerp(f, [b, d - 4], [0, 1]) }} sky={<Sky storm={1} />} />
      </Cam>
      <Chip at={G(o, hit("L10", "Saraswati"))} x={110} y={1300} lines={["SARASWATI NADI"]} size={56} />
      <Stamp at={b} x={540} y={1460} text="BAADH" size={110} rot={-5} />
      <Hud left="Baadh" right="mitti" clock="07" dot={C.red} />
    </AbsoluteFill>
  );
};
// 11 ── for centuries nobody knew (flat desert; the cut face shows the buried vav)
const S11: React.FC<SceneP> = ({ o, d }) => (
  <Shot d={d} from={[-7, 6, 17]} to={[-6, 5, 15.5]} look={[0.5, -2.8, 0]} fov={36} vav={{ ...FULL, silt: 1, workers: false }} sky={<Sky dusk={1} />}>
    <Pill at={G(o, hit("L11", "Sadiyon"))} x={110} y={1330} text="SADIYON TAK DABI" size={72} bg={C.white} />
    <Hud left="Mitti ke neeche" right="gum" clock="?" />
  </Shot>
);
// 12 ── found in the 1940s, cleaned in the 1980s (silt goes down)
const S12: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Shot d={d} from={[-9, 7, 19]} to={[-7, 5.5, 16.5]} look={[0.5, -2.8, 0]} fov={36} vav={{ ...FULL, silt: lerp(f, [G(o, hit("L12", "1980s")) - 6, d - 2], [1, 0]), workers: true }}>
      <Chip at={G(o, hit("L12", "1940s"))} x={110} y={1300} lines={["1940s · DHOONDHA"]} size={56} mono />
      <Chip at={G(o, hit("L12", "1980s"))} x={110} y={1410} lines={["1980s · SAAF KIYA (ASI)"]} size={50} mono color={C.white} />
      <Hud left="Khudai" right="ASI" clock="08" />
    </Shot>
  );
};
// 13 ── the mud preserved the carvings (wall comes out of the silt colour)
const S13: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  return (
    <Wall d={d} from={[1.8, -0.6, 10.5]} to={[0.2, 0.0, 8.6]} look={[0.2, 0.2, 0]} dust={f < 10 ? 1 : 0}>
      <Pill at={G(o, hit("L13", "bacha"))} x={110} y={1340} text="MITTI NE BACHAYA" size={74} />
      <Hud left="Nakkashi" right="aaj bhi" clock="09" />
    </Wall>
  );
};
// 14 ── today: UNESCO World Heritage, and on the ₹100 note (no note artwork, just the fact)
const S14: React.FC<SceneP> = ({ o, d }) => (
  <Shot d={d} from={[-7, 6, 17]} to={[-11, 11, 24]} look={[0.5, -2.8, 0]} fov={36} vav={FULL} sky={<Sky dusk={1} />}>
    <Chip at={G(o, hit("L14", "UNESCO"))} x={110} y={1260} lines={["UNESCO WORLD HERITAGE · 2014"]} size={44} mono />
    <Pill at={G(o, hit("L14", "₹100"))} x={110} y={1380} text="₹100 KE NOTE PE" size={70} />
    <Hud left="Aaj" right="Patan" clock="10" />
  </Shot>
);
// 15 ── end card
const S15: React.FC<SceneP> = ({ o }) => (
  <AbsoluteFill><Sky dusk={1} />
    <AbsoluteFill style={{ background: "rgba(10,13,12,.55)" }} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L15", "Follow"))} logo="3D" />
    <Vignette />
  </AbsoluteFill>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7), P(at("L8"), S8),
  P(at("L9"), S9), P(at("L10"), S10), P(at("L11"), S11), P(at("L12"), S12), P(at("L13"), S13), P(at("L14"), S14), P(at("L15"), S15),
];
export const IMPACTS = [hit("L10", "baadh")];
export const POPS = [hit("L2", "Rani"), hit("L5", "vav"), hit("L6", "Udayamati"), hit("L8", "500"), hit("L8", "1000"), hit("L9", "ulta"), hit("L11", "Sadiyon"), hit("L12", "1940s"), hit("L12", "1980s"), hit("L13", "bacha"), hit("L14", "UNESCO"), hit("L14", "₹100"), hit("L15", "Follow")];
export const RISERS = [hit("L10", "baadh"), at("L14")];
export const DURATION = TOTAL;
