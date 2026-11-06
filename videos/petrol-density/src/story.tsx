// ─────────────────────────────────────────────────────────────────────────────
//  "Meter zero tha. Par density?" – petrol quality check at the pump (facts + sources in SCRIPT.md)
//  Rules: cut every 1.5-3 s · every hit lands 0-3 f before its word · every hold creeps (Cam) ·
//  one idea per shot · HUD on most shots · red only for loss/danger ·
//  the main subject is on screen from frame 2 of its shot (no empty frame waiting for a word).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { lerp } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Bokeh, Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Flow, Pill, Rings, Stamp, StepDot } from "./kit/Marks";
import { Dialer, Phone, StatusBar } from "./kit/Phone";
import { IndiaMap } from "./kit/Map";
import { EndCard, Poll } from "./kit/EndCard";
import { DispenserPanel, FilterPaper, RangeBar } from "./kit/Dispenser";
import { Dispenser3D, Studio3D, Table } from "./three/Studio";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE = ["L14"];

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const n2 = (v: number) => v.toFixed(2);

// 1 ── HOOK: the pump at night, meter at zero (real 3D)
const S1: React.FC<SceneP> = ({ d }) => {
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = "#0d100f"; g.fillRect(0, 0, 512, 640);
    const row = (y: number, h: number, label: string, v: string, size: number) => {
      g.fillStyle = "#E8EADF"; g.beginPath(); g.roundRect(24, y, 464, h, 12); g.fill();
      g.fillStyle = "#5a5f55"; g.font = "500 22px 'JetBrains Mono', monospace"; g.textAlign = "left"; g.fillText(label, 40, y + 30);
      g.fillStyle = "#1C1F1B"; g.font = `italic 700 ${size}px 'JetBrains Mono', monospace`; g.textAlign = "right"; g.fillText(v, 470, y + h - 18);
    };
    row(24, 200, "AMOUNT ₹", "0.00", 120); row(244, 170, "LITRE", "0.00", 96); row(434, 170, "DENSITY", "---.-", 80);
  };
  return (
    <Ground tone="warm"><Bokeh n={30} seed={14} />
      <Studio3D dur={d + 60} from={[1.7, 1.2, 4.6]} to={[1.1, 1.15, 3.8]} look={[0, 1.25, 0]} fov={34}>
        <Table y={0} color="#141817" size={10} />
        <Dispenser3D draw={draw} rotY={-0.3} />
      </Studio3D>
      <Hud left="Petrol pump · raat 8:10" right="bharwane se pehle" clock="00:00" />
      <Vignette />
    </Ground>
  );
};

// 2 ── nobody looked at the density row
const S2: React.FC<SceneP> = ({ o, d }) => (
  <Ground tone="warm"><Bokeh n={18} seed={3} opacity={0.6} />
    <Cam dur={d} s0={1} s1={1.07}>
      <DispenserPanel y={1080} scale={1} amount="0.00" litre="0.00" density="---.-" ring="density" ringAt={G(o, hit("L2", "density"))} dur={d} />
    </Cam>
    <Hud left="Petrol pump · raat 8:10" right="bharwane se pehle" clock="00:01" />
    <Vignette />
  </Ground>
);

// 3 ── zero only counts quantity (numbers roll)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const L = lerp(f, [4, d], [0, 4.83]);
  return (
    <Ground>
      <Cam dur={d} s0={1.04} s1={1.1} roll={1}>
        <DispenserPanel y={1080} scale={1.02} amount={n2(L * 103.44)} litre={n2(L)} density="---.-" ring="litre" ringAt={G(o, hit("L3", "kitna"))} tilt={[6, 2]} dur={d} />
        <Chip at={G(o, hit("L3", "kitna"))} x={110} y={1560} lines={["QUANTITY"]} size={66} />
      </Cam>
      <Hud left="Meter ka kaam" right="sirf ginti" clock="00:02" />
      <Vignette />
    </Ground>
  );
};

// 4 ── but not the quality (x-ray: fuel flows into the tank, "?" on quality)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const q = G(o, hit("L4", "kaisa"));
  return (
    <Ground><GridFloor />
      <Cam dur={d} s0={1} s1={1.06}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 12px ${C.lime})` }}>
          <rect x={300} y={1050} width={480} height={300} rx={60} fill="none" stroke={C.lime} strokeWidth={5} />
          <rect x={300} y={1050 + 300 * (1 - lerp(f, [0, d], [0.15, 0.6]))} width={480} height={300 * lerp(f, [0, d], [0.15, 0.6])} rx={20} fill={`${C.amber}44`} />
          <text x={540} y={1410} textAnchor="middle" fill={C.grey} fontFamily="JetBrains Mono" fontSize={30} letterSpacing={4}>TANK</text>
        </svg>
        <Flow d="M 540 560 C 540 700, 560 860, 540 1050" at={2} dur={12} color={C.amber} />
        <Chip at={2} x={110} y={600} lines={["QUANTITY  ✓"]} size={58} />
        <Chip at={q} x={560} y={760} lines={["QUALITY  ?"]} size={58} color={C.red} />
        <Rings at={q} x={760} y={800} color={C.red} max={260} n={2} />
      </Cam>
      <Hud left="Tank ke andar" right="andar ki baat" clock="01" />
      <Vignette />
    </Ground>
  );
};

// 5 ── the other number: DENSITY lights up
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const den = G(o, hit("L5", "Density"));
  return (
    <Ground>
      <Cam dur={d} s0={1} s1={1.08} oy={60}>
        <DispenserPanel y={1080} amount="0.00" litre="0.00" density={f >= den ? "748.6" : "---.-"} ring="density" ringAt={den} tilt={[-10, -4]} dur={d} />
      </Cam>
      <Hud left="Machine pe" right="andar ki baat" clock="02" />
      <Vignette />
    </Ground>
  );
};

// 6 ── the OK range 720-775
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const v = lerp(f, [G(o, hit("L6", "720")), G(o, hit("L6", "beech"))], [705, 748]);
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1} s1={1.05}>
        <Chip at={2} x={90} y={680} lines={["PETROL DENSITY", "kg/m³ @ 15°C"]} size={56} mono />
        <RangeBar x={90} y={1080} w={900} min={690} max={800} lo={720} hi={775} value={v} at={2} />
        <Pill at={G(o, hit("L6", "beech"))} x={300} y={1300} text="YAHI SAHI HAI" size={62} />
      </Cam>
      <Hud left="Sahi range" right="andar ki baat" clock="03" />
      <Vignette />
    </Ground>
  );
};

// 7 ── out of range or zero → ask
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const z = G(o, hit("L7", "zero"));
  const v = lerp(f, [0, z], [748, 792]);
  return (
    <Ground tone={f >= z ? "red" : "dark"}>
      <Cam dur={d} s0={1} s1={1.06}>
        {f < z ? <RangeBar x={90} y={1080} w={900} min={690} max={800} lo={720} hi={775} value={v} at={-20} />
          : <DispenserPanel y={1060} scale={0.92} amount="0.00" litre="0.00" density="000.0" densityColor={C.red} ring="density" ringAt={z} ringColor={C.red} dur={d} />}
        <Pill at={G(o, hit("L7", "sawaal"))} x={110} y={1540} text="SAWAAL POOCHHO" size={70} bg={C.white} />
      </Cam>
      <Hud left="Gadbad ka signal" right="andar ki baat" clock="04" dot={f >= z ? C.red : C.lime} />
      <Vignette />
    </Ground>
  );
};

// 8 ── adulterated fuel hurts the engine (piston x-ray, red particles)
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const bad = G(o, hit("L8", "kharab"));
  const py = 1080 + Math.sin(f / 3) * 90;
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.07} kick={[bad]}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g style={{ filter: `drop-shadow(0 0 10px ${C.red})` }} stroke={C.red} fill="none" strokeWidth={6}>
            <rect x={360} y={760} width={360} height={620} rx={20} />
            <rect x={380} y={py - 90} width={320} height={130} rx={14} fill="#2a0f0c" />
            <line x1={540} y1={py + 40} x2={540 + Math.cos(f / 3) * 110} y2={1500} />
            <circle cx={540} cy={1560} r={110} />
          </g>
          {Array.from({ length: 18 }).map((_, i) => { const k = ((f * 0.03 + i / 18) % 1); return <circle key={i} cx={390 + ((i * 97) % 300)} cy={780 + k * (py - 880)} r={8} fill={C.amber} opacity={0.8} />; })}
        </svg>
        <Chip at={G(o, hit("L8", "milawat"))} x={90} y={600} lines={["MILAWAT"]} size={72} color={C.red} />
        <Stamp at={bad} x={540} y={1760} text="ENGINE DAMAGE" size={74} rot={-4} />
      </Cam>
      <Hud left="Engine ke andar" right="nuksaan" clock="05" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 9 ── your right, free
const S9: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.07}>
      <Chip at={2} x={110} y={620} lines={["DENSITY + FILTER TEST"]} size={50} mono color={C.grey} />
      <Pill at={4} x={110} y={760} text="TUMHARA HAQ" size={110} />
      <Stamp at={G(o, hit("L9", "free"))} x={680} y={1150} text="FREE" size={140} rot={-9} color={C.lime} fill={false} />
    </Cam>
    <Hud left="Consumer rights" right="kanoon" clock="06" />
    <Vignette />
  </Ground>
);

// 10 ── 3 cheezein
const S10: React.FC<SceneP> = ({ d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.07}>
      <Pill at={2} x={120} y={680} text="3 CHEEZEIN" size={110} />
      {[1, 2, 3].map((n, i) => <StepDot key={n} at={6 + i * 6} x={200 + i * 230} y={1060} n={n} size={150} />)}
    </Cam>
    <Hud left="Bachne ka tareeka" right="yaad rakho" clock="1-2-3" />
    <Vignette />
  </Ground>
);

// 11 ── step 1: look at the density before filling
const S11: React.FC<SceneP> = ({ o, d }) => (
  <Ground tone="warm"><Bokeh n={14} seed={7} opacity={0.5} />
    <Cam dur={d} s0={1} s1={1.06}>
      <StepDot at={2} x={150} y={600} n={1} size={120} />
      <Chip at={2} x={240} y={570} lines={["PEHLE DENSITY"]} size={58} />
      <DispenserPanel y={1130} scale={0.88} amount="0.00" litre="0.00" density="748.6" ring="density" ringAt={G(o, hit("L11", "density"))} dur={d} />
    </Cam>
    <Hud left="Step 1" right="machine pe" clock="01/03" />
    <Vignette />
  </Ground>
);

// 12 ── step 2: filter paper test
const S12: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor opacity={0.08} />
    <Cam dur={d} s0={1} s1={1.07}>
      <StepDot at={2} x={150} y={600} n={2} size={120} />
      <Chip at={2} x={240} y={570} lines={["FILTER PAPER TEST"]} size={58} />
      <FilterPaper x={540} y={1150} size={600} drop={G(o, hit("L12", "boond"))} stainAt={G(o, hit("L12", "daag"))} />
      <Chip at={G(o, hit("L12", "daag"))} x={110} y={1500} lines={["DAAG = GADBAD"]} size={64} color={C.red} />
    </Cam>
    <Hud left="Step 2" right="2 boond" clock="02/03" />
    <Vignette />
  </Ground>
);

// 13 ── step 3: complain (board helpline or 1915)
const S13: React.FC<SceneP> = ({ o, d }) => (
  <Ground>
    <IndiaMap at={0} y={1000} w={1040} color="#3B4541" spread={{ from: "Delhi", at: 6, color: "#6E9A2A", dur: 60 }} pings={[{ city: "Delhi", at: 8 }, { city: "Mumbai", at: 16 }, { city: "Kolkata", at: 22 }, { city: "Bengaluru", at: 28 }]} />
    <Cam dur={d} s0={1} s1={1.06}>
      <StepDot at={2} x={150} y={600} n={3} size={120} />
      <Chip at={G(o, hit("L13", "board"))} x={240} y={570} lines={["BOARD PE HELPLINE"]} size={58} />
      <Phone y={1260} scale={0.7} rx={[6, 3]} ry={[14, 6]} rz={[-2, 0]} dur={d} enter={0}>
        <StatusBar /><Dialer at={G(o, hit("L13", "1915"))} number="1915" step={4} label="NATIONAL CONSUMER HELPLINE" />
      </Phone>
    </Cam>
    <Hud left="Step 3" right="shikayat" clock="03/03" />
    <Vignette />
  </Ground>
);

// 14 ── mantra (captions hidden)
const S14: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.08} oy={45}>
      <Chip at={2} x={120} y={560} lines={["YAAD RAKHO"]} size={46} mono color={C.grey} />
      <Pill at={G(o, hit("L14", "Zero"))} x={110} y={700} text="ZERO BHI." size={110} bg={C.white} />
      <Pill at={G(o, hit("L14", "density"))} x={110} y={880} text="DENSITY BHI." size={130} />
    </Cam>
    <Hud left="Ek line" clock="★" right="yaad rakho" />
    <Vignette />
  </Ground>
);

// 15 ── CTA end card
const S15: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L15", "Follow"))} logo="3D" />
    <Vignette />
  </Ground>
);

// 16 ── poll
const S16: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={14} hue="lime" opacity={0.18} seed={6} />
    <Poll q="Kabhi density dekhi hai?" a="Haan, dekhi" b="Nahi, kabhi nahi" pickAt={G(o, hit("L16", "Haan"))} pick={0} />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7),
  P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10), P(at("L11"), S11), P(at("L12"), S12), P(at("L13"), S13),
  P(at("L14"), S14), P(at("L15"), S15), P(at("L16"), S16),
];
export const IMPACTS = [hit("L7", "zero"), hit("L8", "kharab")];
export const POPS = [hit("L2", "density"), hit("L3", "kitna"), hit("L4", "kaisa"), hit("L5", "Density"), hit("L6", "beech"), hit("L7", "sawaal"), hit("L8", "milawat"), hit("L9", "haq"), hit("L9", "free"), hit("L11", "density"), hit("L12", "boond"), hit("L12", "daag"), hit("L13", "1915"), hit("L14", "Zero"), hit("L14", "density"), hit("L15", "Follow"), hit("L16", "Haan")];
export const RISERS = [hit("L8", "kharab"), at("L14")];
export const DURATION = TOTAL;
