// ─────────────────────────────────────────────────────────────────────────────
//  STORY = the only file that changes per video (plus script.json).
//  Each scene: id, start frame (tied to a voice word), component. A scene ends where the next begins.
//  Rules: cut every 1.5-3 s · every hit lands 0-3 f before its word · every hold creeps (Cam) ·
//  one idea per shot · HUD on most shots · red only for loss/danger ·
//  the main subject is on screen from frame 2 of its shot (no empty frame waiting for a word).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, TOTAL, LINES } from "./kit/timeline";
import { Bokeh, Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Counter, Flow, Pill, Rings, Stamp } from "./kit/Marks";
import { Bubble, ChatHead, Dialer, Phone, PinPad, QR, StatusBar, Toast } from "./kit/Phone";
import { IndiaMap } from "./kit/Map";
import { EndCard } from "./kit/EndCard";
import { Phone3D, Studio3D, drawQR } from "./three/Studio";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
// Caption placement overrides / lines whose words are shown as graphics instead.
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE: string[] = LINES.map((l) => l.id); // creator: no subtitles
export const CAPTION_MODE: import("./kit/Caption").CaptionMode = "karaoke";

type SceneP = { o: number; d: number }; // o = scene start (global frame), d = duration
const G = (o: number, g: number) => g - o; // global → local frame

// 1 ── HOOK: the deal in chat (warm bazaar bokeh)
const S1: React.FC<SceneP> = ({ o, d }) => (
  <Ground tone="warm"><Bokeh n={30} seed={3} />
    <Cam dur={d} s0={1} s1={1.08} dy={-20}>
      <Phone y={1160} scale={1.02} rx={[10, 6]} ry={[-18, -10]} rz={[4, 2]} dur={d} enter={0}>
        <StatusBar time="18:40" /><ChatHead name="Rahul (OLX)" sub="online" />
        <Bubble at={2} y={260} me>Sofa ₹8,000 final.</Bubble>
        <Bubble at={G(o, hit("L1", "Buyer"))} y={380}>Done bhai, le lunga</Bubble>
        <Bubble at={G(o, hit("L1", "paise"))} y={490}>Paise bhej raha hoon. Ruko.</Bubble>
      </Phone>
    </Cam>
    <Hud left="OLX deal · shaam 6:40" right="scam se pehle" clock="00:00" />
    <Vignette />
  </Ground>
);

// 2 ── the QR arrives (real 3D phone, dolly in)
const S2: React.FC<SceneP> = ({ d }) => {
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = "#07090A"; g.fillRect(0, 0, 540, 1170);
    g.fillStyle = "#1A201E"; g.beginPath(); g.roundRect(30, 250, 420, 560, 30); g.fill();
    g.fillStyle = "#F3F5EF"; g.beginPath(); g.roundRect(60, 280, 360, 360, 16); g.fill(); drawQR(g, 80, 300, 320, 21);
    g.fillStyle = "#C4F23C"; g.font = "800 34px Inter, sans-serif"; g.fillText("Scan karo,", 60, 700); g.fillText("₹8,000 receive", 60, 745);
    g.fillStyle = "#8C948F"; g.font = "500 24px 'JetBrains Mono', monospace"; g.fillText("Rahul (OLX)", 40, 200);
  };
  return (
    <Ground tone="warm"><Bokeh n={26} seed={9} drift={60} />
      <Studio3D dur={d} from={[0.25, 0.05, 1.35]} to={[0.08, 0.0, 1.02]} look={[0, 0.07, 0]} fov={30}>
        <Phone3D draw={draw} rotation={[-0.12, -0.35, 0.06]} />
      </Studio3D>
      <Hud left="OLX deal · shaam 6:41" right="scam se pehle" clock="00:01" />
      <Vignette />
    </Ground>
  );
};

// 3 ── scan, then PIN
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const pin = G(o, hit("L3", "PIN"));
  const scanY = lerp(f, [0, pin], [0, 1]);
  return (
    <Ground><Bokeh n={14} seed={5} opacity={0.5} />
      <Cam dur={d} s0={1.02} s1={1.1}>
        <Phone y={1100} scale={0.88} rx={[4, 2]} ry={[10, 4]} rz={[-2, -1]} dur={d}>
          <StatusBar />
          {f < pin ? <>
            <div style={{ position: "absolute", left: 82, top: 330, width: 400, height: 400 }}><QR size={400} seed={21} /></div>
            <div style={{ position: "absolute", left: 60, top: 310 + scanY * 420, width: 444, height: 6, background: C.lime, boxShadow: `0 0 24px ${C.lime}` }} />
            {[[60, 310], [444, 310], [60, 694], [444, 694]].map(([x, y], i) => <div key={i} style={{ position: "absolute", left: x, top: y, width: 60, height: 60, border: `6px solid ${C.lime}`, clipPath: i === 0 ? "inset(0 50% 50% 0)" : i === 1 ? "inset(0 0 50% 50%)" : i === 2 ? "inset(50% 50% 0 0)" : "inset(50% 0 0 50%)" }} />)}
            <div style={{ position: "absolute", top: 800, width: "100%", textAlign: "center", fontFamily: F.mono, color: C.lime, fontSize: 26, letterSpacing: 3 }}>SCANNING…</div>
          </> : <PinPad at={2} step={5} />}
        </Phone>
      </Cam>
      <Hud left="UPI app" right="scam se pehle" clock="00:02" />
      <Vignette />
    </Ground>
  );
};

// 4 ── money gone (red, impact)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const gaye = G(o, hit("L4", "Gaye"));
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.07} kick={[gaye]}>
        <Phone y={1120} scale={0.8} rx={[6, 4]} ry={[-6, -2]} rz={[1, 0]} dur={d} glow={C.red}>
          <StatusBar />
          <Toast at={G(o, hit("L4", "nahi"))} title="Bank alert" body="₹8,000 debited. UPI ref 4417…" />
          <div style={{ position: "absolute", top: 420, width: "100%", textAlign: "center", fontFamily: F.mono, color: C.grey, fontSize: 24, letterSpacing: 3 }}>BALANCE</div>
          <Counter at={G(o, hit("L4", "nahi"))} dur={20} from={12450} to={4450} x={282} y={470} prefix="₹" size={96} color={C.red} />
        </Phone>
        <Stamp at={gaye} x={540} y={1500} text="GAYE." size={120} rot={-7} />
      </Cam>
      <Hud left="Tumhara account" right="scam ke baad" clock="−₹8,000" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 5 ── the rule: QR only sends
const S5: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const send = G(o, hit("L5", "bhejna"));
  return (
    <Ground><GridFloor />
      <Cam dur={d} s0={1} s1={1.06} dy={-10}>
        <div style={{ position: "absolute", left: 340, top: 760, transform: `scale(${pop(f, G(o, hit("L5", "QR")))}) rotate(-4deg)`, boxShadow: `0 0 80px ${C.lime}33` }}><QR size={400} seed={21} /></div>
        <Flow d="M 160 1500 C 260 1300, 380 1250, 540 1180 S 860 900, 930 640" at={send - 6} dur={18} />
        <Chip at={G(o, hit("L5", "QR")) + 4} x={120} y={1260} lines={["QR = PAY"]} size={70} />
        <div style={{ position: "absolute", left: 90, top: 1520, fontFamily: F.mono, color: C.white, fontSize: 30, letterSpacing: 3, opacity: io(f, send - 6, 6) }}>TUM</div>
        <div style={{ position: "absolute", left: 860, top: 560, fontFamily: F.mono, color: C.red, fontSize: 30, letterSpacing: 3, opacity: io(f, send + 8, 6) }}>CHOR</div>
        <Rings at={send + 10} x={930} y={640} color={C.red} max={240} />
      </Cam>
      <Hud left="QR ka sach" clock="01" right="rule" />
      <Vignette />
    </Ground>
  );
};

// 6 ── PIN = money leaving your account
const S6: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const pin = G(o, hit("L6", "PIN")), go = G(o, hit("L6", "jaata"));
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1.04} s1={1.1} roll={-1.5}>
        <div style={{ position: "absolute", left: 140, top: 800, width: 800, height: 300, borderRadius: 40, border: `4px solid ${C.line}`, background: C.panel, transform: `scale(${pop(f, pin)})` }}>
          <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", fontFamily: F.mono, color: C.grey, fontSize: 26, letterSpacing: 4 }}>UPI PIN</div>
          <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center", gap: 60 }}>
            {[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 70, height: 70, borderRadius: 35, background: f > pin + 4 + i * 4 ? C.lime : "transparent", border: `5px solid ${C.lime}`, boxShadow: f > pin + 4 + i * 4 ? `0 0 30px ${C.lime}` : "none" }} />)}
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => { const k = lerp(f, [go - 4 + i * 3, go + 22 + i * 3], [0, 1]); return k > 0 && k < 1 ? <div key={i} style={{ position: "absolute", left: 540 + k * 560 - 40, top: 1240 - Math.sin(k * 3.1) * 160 + i * 14, fontFamily: F.mono, fontWeight: 800, fontSize: 64, color: C.red, opacity: 1 - k * 0.6 }}>₹</div> : null; })}
        <Chip at={go} x={90} y={1380} lines={["PIN = PAISA", "BAHAR"]} color={C.red} size={72} />
      </Cam>
      <Hud left="PIN ka sach" clock="02" right="rule" />
      <Vignette />
    </Ground>
  );
};

// 7 ── receiving needs nothing
const S7: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const x1 = G(o, hit("L7", "scan")), x2 = G(o, hit("L7", "PIN"));
  const Card = ({ x, label, cross }: { x: number; label: string; cross: number }) => (
    <div style={{ position: "absolute", left: x, top: 900, width: 380, height: 380, borderRadius: 40, background: C.panel, border: `4px solid ${C.line}`, transform: `scale(${pop(f, x === 110 ? 2 : 6)})` }}>
      <div style={{ position: "absolute", width: "100%", top: 140, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 84, color: C.white }}>{label}</div>
      <svg width={380} height={380} style={{ position: "absolute", inset: 0 }}><path d="M70 70 L310 310 M310 70 L70 310" stroke={C.red} strokeWidth={26} strokeLinecap="round" strokeDasharray={700} strokeDashoffset={700 * (1 - io(f, cross, 6))} /></svg>
    </div>
  );
  return (
    <Ground><Bokeh n={10} hue="lime" opacity={0.25} seed={12} />
      <Cam dur={d} s0={1} s1={1.05}>
        <Chip at={2} x={120} y={700} lines={["PAISE LENE KE LIYE"]} size={56} mono />
        <Card x={110} label="SCAN" cross={x1} /><Card x={590} label="PIN" cross={x2} />
      </Cam>
      <Hud left="Paise lene ke liye" clock="03" right="rule" />
      <Vignette />
    </Ground>
  );
};

// 8 ── the mantra (captions hidden; the pills are the caption)
const S8: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.08} oy={45}>
      <Chip at={2} x={120} y={560} lines={["YAAD RAKHO"]} size={46} mono color={C.grey} />
      <Pill at={G(o, hit("L8", "Paise"))} x={110} y={700} text="PAISE LENE HAIN?" size={86} bg={C.white} />
      <Pill at={G(o, hit("L8", "PIN"))} x={110} y={860} text="TOH PIN NAHI." size={112} />
    </Cam>
    <Hud left="Ek line" clock="★" right="yaad rakho" />
    <Vignette />
  </Ground>
);

// 9 ── what to do: 1930
const S9: React.FC<SceneP> = ({ o, d }) => (
  <Ground>
    <IndiaMap at={0} y={1000} w={1040} color="#3B4541" spread={{ from: "Delhi", at: 6, color: "#6E9A2A", dur: 60 }} pings={[{ city: "Delhi", at: 8 }, { city: "Mumbai", at: 16 }, { city: "Kolkata", at: 22 }, { city: "Bengaluru", at: 28 }]} />
    <Cam dur={d} s0={1} s1={1.06}>
      <Phone y={1230} scale={0.74} rx={[6, 3]} ry={[14, 6]} rz={[-2, 0]} dur={d} enter={0}>
        <StatusBar /><Dialer at={G(o, hit("L9", "1930"))} number="1930" step={4} label="CYBER CRIME HELPLINE" />
      </Phone>
    </Cam>
    <Hud left="Fraud ke baad" right="pehle 1 ghanta" clock="1930" />
    <Vignette />
  </Ground>
);

// 10 ── CTA end card
const S10: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L10", "Save")) + 6} logo="3D" />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5),
  P(at("L6"), S6), P(at("L7"), S7), P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10),
];
// Sound cues: tools/cues.mjs exports cuts (scene starts) + IMPACTS + POPS to out/cues.json for tools/audio.py
export const IMPACTS = [hit("L4", "Gaye"), hit("L8", "PIN")];
// UI blips (bubbles, chips, pills, stamps, dial digits) – soft clicks
export const POPS = [hit("L1", "Buyer"), hit("L1", "paise"), hit("L3", "PIN"), hit("L4", "nahi"), hit("L5", "QR"), hit("L6", "PIN"), hit("L6", "jaata"), hit("L7", "scan"), hit("L7", "PIN"), hit("L8", "Paise"), hit("L9", "1930"), hit("L10", "Save") + 6];
// Risers end on these frames (the reveal beats)
export const RISERS = [hit("L4", "Gaye"), at("L8")];
export const DURATION = TOTAL;
