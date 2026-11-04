// ─────────────────────────────────────────────────────────────────────────────
//  "Phone 100% charge mat karo" – battery 20-80 (facts + sources in SCRIPT.md). Voice: the creator's own recording.
//  Rules: cut every 1.5-3 s · hits land 0-3 f before the word · every hold creeps (Cam) · subject on screen by frame 2.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { C, F } from "./kit/theme";
import { io, lerp } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Bokeh, Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Counter, Pill, Rings, Stamp, StepDot } from "./kit/Marks";
import { Phone, StatusBar } from "./kit/Phone";
import { EndCard, Poll } from "./kit/EndCard";
import { BatteryIcon, CellXray, Gauge, HealthScreen, Settings, levelColor } from "./kit/Battery";
import { Phone3D, Studio3D, Table } from "./three/Studio";
import type { CaptionMode } from "./kit/Caption";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE = ["L13"];
export const CAPTION_MODE: CaptionMode = "karaoke";

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;

// 1 ── HOOK: phone on the bedside table at night, charging, hits 100% (real 3D)
const lockScreen = (pct: string, hot: boolean) => (g: CanvasRenderingContext2D) => {
  const bg = g.createLinearGradient(0, 0, 0, 1170); bg.addColorStop(0, "#0b0f0e"); bg.addColorStop(1, hot ? "#3a0f0a" : "#101614");
  g.fillStyle = bg; g.fillRect(0, 0, 540, 1170);
  g.fillStyle = "#F3F5EF"; g.textAlign = "center"; g.font = "800 150px Inter, sans-serif"; g.fillText("2:14", 270, 330);
  g.font = "500 34px Inter, sans-serif"; g.fillStyle = "#9AA39E"; g.fillText("Raat · charging", 270, 400);
  const col = hot ? "#E8573F" : "#C4F23C";
  g.strokeStyle = col; g.lineWidth = 10; g.beginPath(); g.roundRect(170, 560, 200, 340, 30); g.stroke();
  g.fillStyle = col; g.fillRect(160 + 70, 530, 80, 30);
  g.fillRect(190, 580, 160, 300);
  g.fillStyle = col; g.font = "900 96px 'JetBrains Mono', monospace"; g.fillText(pct, 270, 1030);
};
const Cable: React.FC = () => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.012, -0.4), new THREE.Vector3(0.05, 0.012, -0.62), new THREE.Vector3(0.35, 0.012, -0.8), new THREE.Vector3(0.9, 0.012, -0.9), new THREE.Vector3(1.6, 0.012, -1.3)]), 60, 0.012, 8), []);
  return <mesh geometry={geo}><meshStandardMaterial color="#e9ebe4" roughness={0.45} /></mesh>;
};
const S1: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const full = G(o, hit("L1", "100"));
  const pct = f >= full ? "100%" : `${Math.round(lerp(f, [0, full], [96, 99]))}%`;
  return (
    <Ground tone="warm"><Bokeh n={26} seed={21} opacity={0.8} />
      <Studio3D dur={d + 40} from={[0.62, 1.6, 1.25]} to={[0.4, 1.22, 0.9]} look={[0, 0, -0.05]} fov={34}>
        <Table y={0} color="#1a1512" size={6} />
        <Phone3D position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.18]} draw={lockScreen(pct, f >= full)} drawKey={pct} glow={f >= full ? "#E8573F" : undefined} />
        <Cable />
      </Studio3D>
      {f >= full && <Rings at={full} x={540} y={1150} color={C.red} n={2} max={360} />}
      <Hud left="Bedroom · raat 2:14" right="charger pe" clock="00:00" dot={f >= full ? C.red : C.lime} />
      <Vignette />
    </Ground>
  );
};

// 2 ── battery likes 80, not 100
const S2: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const e = G(o, hit("L2", "80"));
  const lv = f < e ? 100 : lerp(f, [e, e + 12], [100, 80]);
  return (
    <Ground><GridFloor />
      <Cam dur={d} s0={1} s1={1.06}>
        <BatteryIcon x={540} y={1020} w={360} level={lv} hot={f < e ? 0.6 : 0} />
        {f >= e && <Stamp at={e + 4} x={790} y={760} text="80 ✓" size={90} rot={8} color={C.lime} fill={false} />}
        {f < e && <Stamp at={G(o, hit("L2", "100"))} x={800} y={760} text="100 ✕" size={90} rot={8} />}
      </Cam>
      <Hud left="Battery ki pasand" right="andar ki baat" clock="01" />
      <Vignette />
    </Ground>
  );
};

// 3 ── at 100% the battery is under max stress (gauge to red)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const s = G(o, hit("L3", "stress"));
  return (
    <Ground tone={f >= s ? "red" : "dark"}>
      <Cam dur={d} s0={1} s1={1.07} kick={[s]}>
        <Chip at={2} x={90} y={620} lines={["100% = FULL"]} size={60} color={C.red} />
        <Gauge x={540} y={1260} r={330} v={lerp(f, [4, s], [0.15, 0.93])} label="STRESS" />
      </Cam>
      <Hud left="Battery ke andar" right="stress meter" clock="02" dot={f >= s ? C.red : C.lime} />
      <Vignette />
    </Ground>
  );
};

// 4 ── high voltage stress (voltage curve climbing into the red zone)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const k = lerp(f, [2, d - 6], [0, 1]);
  const pts = Array.from({ length: 60 }, (_, i) => { const t = i / 59; return [120 + t * 840, 1420 - (Math.pow(t, 0.55) * 420 + (t > 0.85 ? (t - 0.85) * 900 : 0))]; });
  const show = pts.slice(0, Math.max(2, Math.round(k * 60)));
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1} s1={1.05}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <rect x={120} y={860} width={840} height={150} fill={`${C.red}22`} />
          <text x={140} y={910} fill={C.red} fontFamily={F.mono} fontSize={30} letterSpacing={4}>DANGER ZONE</text>
          <line x1={120} y1={1440} x2={960} y2={1440} stroke={C.line} strokeWidth={4} />
          <text x={120} y={1500} fill={C.grey} fontFamily={F.mono} fontSize={30}>0%</text>
          <text x={960} y={1500} fill={C.grey} fontFamily={F.mono} fontSize={30} textAnchor="end">100%</text>
          <polyline points={show.map((p) => p.join(",")).join(" ")} fill="none" stroke={k > 0.85 ? C.red : C.lime} strokeWidth={10} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px ${k > 0.85 ? C.red : C.lime})` }} />
        </svg>
        <Pill at={G(o, hit("L4", "high"))} x={110} y={640} text="HIGH VOLTAGE" size={84} bg={C.white} />
        <Chip at={G(o, hit("L4", "stress"))} x={110} y={1560} lines={["VOLTAGE ↑  =  STRESS ↑"]} size={52} color={C.red} mono />
      </Cam>
      <Hud left="Charge vs voltage" right="andar ki baat" clock="03" />
      <Vignette />
    </Ground>
  );
};

// 5a ── inside the lithium cell (x-ray)
const S5a: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  return (
    <Ground><GridFloor />
      <Cam dur={d} s0={1.02} s1={1.08}>
        <Chip at={2} x={90} y={620} lines={["LITHIUM-ION CELL"]} size={58} mono />
        <CellXray y={1120} level={lerp(f, [0, d], [30, 60])} />
      </Cam>
      <Hud left="Phone ke andar" right="x-ray" clock="04" />
      <Vignette />
    </Ground>
  );
};
// 5b ── fuller = more pressure
const S5b: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const p = G(o, hit("L5", "dabaav"));
  return (
    <Ground tone={f >= p ? "red" : "dark"}><GridFloor />
      <Cam dur={d} s0={1.06} s1={1.12} kick={[p]}>
        <CellXray y={1120} level={lerp(f, [0, p], [60, 100])} press={lerp(f, [p - 8, p + 4], [0, 1])} />
        <Counter at={2} dur={Math.max(6, p - 2)} from={60} to={100} x={540} y={1520} suffix="%" size={120} color={f >= p ? C.red : C.lime} align="center" />
      </Cam>
      <Hud left="Jitni full" right="utna dabaav" clock="04" dot={f >= p ? C.red : C.lime} />
      <Vignette />
    </Ground>
  );
};

// 6a ── all night on the charger, stuck at 100 (clock spins 11 pm → 7 am)
const S6a: React.FC<SceneP> = ({ d }) => {
  const f = useCurrentFrame();
  const mins = Math.round(lerp(f, [0, d], [23 * 60, 31 * 60]));
  const hh = Math.floor(mins / 60) % 24, mm = mins % 60;
  return (
    <Ground tone="warm"><Bokeh n={16} seed={9} opacity={0.5} hue="cool" />
      <Cam dur={d} s0={1} s1={1.06}>
        <div style={{ position: "absolute", top: 600, width: "100%", textAlign: "center", fontFamily: F.mono, fontWeight: 800, fontSize: 170, color: C.white, letterSpacing: -6 }}>
          {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}
        </div>
        <BatteryIcon x={540} y={1180} w={250} level={100} hot={0.5} />
        <Chip at={G(0, 6)} x={110} y={1620} lines={["GHANTON 100% PE"]} size={56} color={C.red} />
      </Cam>
      <Hud left="Poori raat" right="charger pe" clock="8 GHANTE" dot={C.red} />
      <Vignette />
    </Ground>
  );
};
// 6b ── plus heat
const S6b: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const g = G(o, hit("L6", "garmi"));
  const temp = lerp(f, [0, g + 6], [30, 44]);
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1.04} s1={1.1} kick={[g]}>
        <BatteryIcon x={540} y={1060} w={300} level={100} hot={1} />
        <div style={{ position: "absolute", top: 600, left: 110, fontFamily: F.mono, fontWeight: 800, fontSize: 110, color: C.red, textShadow: `0 0 30px ${C.red}` }}>{Math.round(temp)}°C</div>
        <Stamp at={g} x={540} y={1650} text="GARMI" size={110} rot={-6} />
      </Cam>
      <Hud left="Upar se" right="garmi" clock="05" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 7 ── 365 nights a year (dot calendar fills red)
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const s0 = G(o, hit("L7", "365"));
  const n = Math.round(lerp(f, [s0 - 6, d - 10], [0, 365]));
  return (
    <Ground><GridFloor opacity={0.06} />
      <Cam dur={d} s0={1} s1={1.06}>
        <Counter at={s0 - 6} dur={Math.max(8, d - s0 - 4)} from={0} to={365} x={540} y={600} size={170} color={C.lime} align="center" />
        <Chip at={s0} x={330} y={800} lines={["RAATEIN / SAAL"]} size={50} mono color={C.grey} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 365 }).map((_, i) => {
            const cx = 120 + (i % 19) * 44, cy = 960 + Math.floor(i / 19) * 36;
            return <circle key={i} cx={cx} cy={cy} r={12} fill={i < n ? C.red : "#242a28"} opacity={i < n ? 0.95 : 1} />;
          })}
        </svg>
      </Cam>
      <Hud left="Socho" right="har raat" clock="365" />
      <Vignette />
    </Ground>
  );
};

// 8 ── 1-2 years later: battery health drops
const S8: React.FC<SceneP> = ({ o, d }) => (
  <Ground><Bokeh n={12} seed={4} hue="cool" opacity={0.35} />
    <Cam dur={d} s0={1} s1={1.06}>
      <Phone y={1080} scale={0.78} rx={[6, 3]} ry={[-12, -5]} rz={[2, 0]} dur={d} enter={0}>
        <StatusBar time="09:41" />
        <HealthScreen from={100} to={86} at={G(o, hit("L8", "girne")) - 6} dur={26} />
      </Phone>
      <Chip at={G(o, hit("L8", "saal"))} x={90} y={560} lines={["1-2 SAAL BAAD"]} size={56} mono color={C.grey} />
    </Cam>
    <Hud left="Battery health" right="nuksaan" clock="06" dot={C.red} />
    <Vignette />
  </Ground>
);

// 9a ── the makers built a fix: two phones (no logos, just names)
const S9a: React.FC<SceneP> = ({ o, d }) => (
  <Ground><Bokeh n={14} seed={12} hue="lime" opacity={0.2} />
    <Cam dur={d} s0={1} s1={1.05}>
      <Phone x={330} y={1150} scale={0.55} rx={[6, 3]} ry={[16, 8]} rz={[-3, -1]} dur={d} enter={2}>
        <StatusBar /><Settings title="Battery Health & Charging" rows={[{ t: "Optimized Charging", on: G(o, hit("L9", "option")) }, { t: "80% Limit" }]} />
      </Phone>
      <Phone x={760} y={1180} scale={0.55} rx={[6, 3]} ry={[-16, -8]} rz={[3, 1]} dur={d} enter={6}>
        <StatusBar /><Settings title="Battery protection" rows={[{ t: "Protect battery", on: G(o, hit("L9", "option")) + 6 }, { t: "Maximum 80%" }]} />
      </Phone>
      <Chip at={G(o, hit("L9", "Apple"))} x={130} y={560} lines={["iPHONE"]} size={56} />
      <Chip at={G(o, hit("L9", "Samsung"))} x={600} y={560} lines={["SAMSUNG"]} size={56} />
    </Cam>
    <Hud left="Company ka jawab" right="khud diya" clock="07" />
    <Vignette />
  </Ground>
);
// 9b ── "80% tak wala"
const S9b: React.FC<SceneP> = ({ d }) => (
  <Ground><GridFloor />
    <Cam dur={d} s0={1.02} s1={1.08}>
      <BatteryIcon x={540} y={1100} w={300} level={80} />
      <Pill at={2} x={150} y={600} text="80% TAK" size={110} />
    </Cam>
    <Hud left="Charge limit" right="built-in" clock="80%" />
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
    <Hud left="Battery bachao" right="yaad rakho" clock="1-2-3" />
    <Vignette />
  </Ground>
);

// 11a ── step 1: iPhone settings path, 80% Limit ring + toggle
const S11a: React.FC<SceneP> = ({ o, d }) => {
  const lim = G(o, hit("L11", "Limit"));
  return (
    <Ground><Bokeh n={10} seed={5} hue="lime" opacity={0.18} />
      <Cam dur={d} s0={1} s1={1.05}>
        <StepDot at={2} x={150} y={680} n={1} size={120} />
        <Chip at={2} x={240} y={650} lines={["SETTINGS › BATTERY"]} size={50} mono />
        <Phone y={1290} scale={0.7} rx={[5, 2]} ry={[-10, -4]} rz={[1, 0]} dur={d} enter={0}>
          <StatusBar />
          <Settings crumb="Battery" title="Charging" rows={[{ t: "Optimized Charging", sub: "80% tak, baaki subah", on: G(o, hit("L11", "Optimized")), ring: G(o, hit("L11", "Optimized")) }, { t: "80% Limit", sub: "iPhone 15 aur naye", on: lim, ring: lim }, { t: "100%" }]} />
        </Phone>
      </Cam>
      <Hud left="Step 1" right="iPhone" clock="01/03" />
      <Vignette />
    </Ground>
  );
};
// 11b ── Samsung: Protect battery
const S11b: React.FC<SceneP> = ({ o, d }) => {
  const p = G(o, hit("L11", "Protect"));
  return (
    <Ground><Bokeh n={10} seed={8} hue="lime" opacity={0.18} />
      <Cam dur={d} s0={1.02} s1={1.07}>
        <StepDot at={0} x={150} y={680} n={1} size={120} />
        <Chip at={0} x={240} y={650} lines={["SAMSUNG"]} size={58} />
        <Phone y={1290} scale={0.7} rx={[5, 2]} ry={[10, 4]} rz={[-1, 0]} dur={d} enter={0}>
          <StatusBar />
          <Settings crumb="Battery" title="Battery protection" rows={[{ t: "Protect battery", sub: "Charging 80-85% pe rukegi", on: p, ring: p }, { t: "Fast charging" }]} />
        </Phone>
      </Cam>
      <Hud left="Step 1" right="Samsung" clock="01/03" />
      <Vignette />
    </Ground>
  );
};

// 12a ── step 2: don't let it heat up while charging (thermometer)
const S12a: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const g = G(o, hit("L12", "garam"));
  const lv = lerp(f, [0, g + 10], [0.3, 0.85]);
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1} s1={1.06}>
        <StepDot at={2} x={150} y={680} n={2} size={120} />
        <Chip at={2} x={240} y={650} lines={["GARAM MAT HONE DO"]} size={54} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <rect x={490} y={820} width={100} height={620} rx={50} fill="#151a19" stroke={C.line} strokeWidth={6} />
          <rect x={510} y={840 + 580 * (1 - lv)} width={60} height={580 * lv} rx={30} fill={lv > 0.6 ? C.red : C.lime} />
          <circle cx={540} cy={1500} r={100} fill={lv > 0.6 ? C.red : C.lime} style={{ filter: `drop-shadow(0 0 30px ${lv > 0.6 ? C.red : C.lime})` }} />
        </svg>
        <BatteryIcon x={830} y={1130} w={150} level={70} label={false} />
      </Cam>
      <Hud left="Step 2" right="thanda rakho" clock="02/03" />
      <Vignette />
    </Ground>
  );
};
// 12b ── not under the pillow, no gaming while charging
const S12b: React.FC<SceneP> = ({ o, d }) => {
  const t = G(o, hit("L12", "Takiye")), gm = G(o, hit("L12", "game"));
  const Item: React.FC<{ x: number; at: number; label: string; children: React.ReactNode }> = ({ x, at: a, label, children }) => {
    const f = useCurrentFrame(); const k = io(f, a, 8);
    return <div style={{ position: "absolute", left: x - 200, top: 900, width: 400, height: 520, opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
      <svg width={400} height={400} style={{ position: "absolute", top: 0 }}>{children}
        <g opacity={io(f, a + 8, 6)} stroke={C.red} strokeWidth={22} strokeLinecap="round"><line x1={60} y1={60} x2={340} y2={340} /><line x1={340} y1={60} x2={60} y2={340} /></g>
      </svg>
      <div style={{ position: "absolute", top: 430, width: "100%", textAlign: "center", fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: C.white }}>{label}</div>
    </div>;
  };
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.05}>
        <StepDot at={0} x={150} y={680} n={2} size={120} />
        <Item x={300} at={Math.max(2, t)} label="TAKIYA">
          <rect x={40} y={130} width={320} height={170} rx={80} fill="#d9d6cc" />
          <rect x={150} y={250} width={90} height={150} rx={14} fill="#1a1d1c" stroke={C.red} strokeWidth={5} />
        </Item>
        <Item x={780} at={gm} label="GAME">
          <path d="M80 160 Q 200 110 320 160 Q 380 300 320 320 Q 270 330 240 270 L 160 270 Q 130 330 80 320 Q 20 300 80 160 Z" fill="#2b3130" stroke={C.grey} strokeWidth={6} />
          <circle cx={130} cy={210} r={18} fill={C.grey} /><circle cx={280} cy={200} r={14} fill={C.lime} /><circle cx={300} cy={235} r={14} fill={C.red} />
        </Item>
      </Cam>
      <Hud left="Step 2" right="charging pe nahi" clock="02/03" dot={C.red} />
      <Vignette />
    </Ground>
  );
};

// 13 ── step 3 + mantra: 20 se 80 (captions hidden; the band is the message)
const S13: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const a = G(o, hit("L13", "20")), b = G(o, hit("L13", "80"));
  const lv = f < a ? 50 : f < b ? lerp(f, [a, a + 8], [50, 20]) : lerp(f, [b, b + 12], [20, 80]);
  return (
    <Ground><GridFloor y={1400} />
      <Cam dur={d} s0={1} s1={1.07} oy={40}>
        <StepDot at={2} x={150} y={560} n={3} size={110} />
        <Chip at={2} x={240} y={532} lines={["YAAD RAKHO"]} size={46} mono color={C.grey} />
        <Pill at={a} x={110} y={700} text="20 SE" size={120} bg={C.white} />
        <Pill at={b} x={560} y={690} text="80." size={140} />
        <BatteryIcon x={470} y={1230} w={240} level={lv} band={io(f, 4, 10)} color={levelColor(Math.max(21, Math.min(79, lv)))} />
      </Cam>
      <Hud left="Ek line" right="yaad rakho" clock="★" />
      <Vignette />
    </Ground>
  );
};

// 14 ── CTA end card
const S14: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L14", "Follow"))} logo="3D" />
    <Vignette />
  </Ground>
);

// 15 ── poll
const S15: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={14} hue="lime" opacity={0.18} seed={6} />
    <Poll q="Raat bhar charge lagate ho?" a="Haan, roz" b="Nahi" pickAt={G(o, hit("L15", "Haan"))} pick={0} />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5a), P(hit("L5", "Jitni"), S5b),
  P(at("L6"), S6a), P(hit("L6", "Upar"), S6b), P(at("L7"), S7), P(at("L8"), S8), P(at("L9"), S9a), P(hit("L9", "80%"), S9b),
  P(at("L10"), S10), P(at("L11"), S11a), P(hit("L11", "Samsung"), S11b), P(at("L12"), S12a), P(hit("L12", "Takiye"), S12b),
  P(at("L13"), S13), P(at("L14"), S14), P(at("L15"), S15),
];
export const IMPACTS = [hit("L1", "100"), hit("L3", "stress"), hit("L5", "dabaav"), hit("L6", "garmi")];
export const POPS = [hit("L2", "80"), hit("L4", "high"), hit("L7", "365"), hit("L8", "girne"), hit("L9", "Apple"), hit("L9", "Samsung"), hit("L9", "80%"), hit("L11", "Optimized"), hit("L11", "Limit"), hit("L11", "Protect"), hit("L12", "garam"), hit("L12", "Takiye"), hit("L12", "game"), hit("L13", "20"), hit("L13", "80"), hit("L14", "Follow"), hit("L15", "Haan")];
export const RISERS = [hit("L5", "dabaav"), at("L13")];
export const DURATION = TOTAL;
