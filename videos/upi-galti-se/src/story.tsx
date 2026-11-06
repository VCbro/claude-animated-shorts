// ─────────────────────────────────────────────────────────────────────────────
//  "Galti se paise bhej diye? Ruko." – UPI fake-credit SMS scam (facts + sources in SCRIPT.md)
//  Rules: cut every 1.5-3 s · every hit lands 0-3 f before its word · every hold creeps (Cam) ·
//  one idea per shot · HUD on most shots · red only for loss/danger ·
//  the main subject is on screen from frame 2 of its shot (no empty frame waiting for a word).
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { io, lerp, pop } from "./kit/anim";
import { at, hit, TOTAL } from "./kit/timeline";
import { Bokeh, Cam, GridFloor, Ground, Hud, Vignette } from "./kit/Frame";
import { Chip, Counter, Flow, Pill, Rings, Stamp, StepDot } from "./kit/Marks";
import { BalanceScreen, Dialer, IncomingCall, Phone, PinPad, SmsCard, StatusBar, Toast } from "./kit/Phone";
import { IndiaMap } from "./kit/Map";
import { EndCard, Poll } from "./kit/EndCard";
import { Phone3D, Studio3D } from "./three/Studio";

export const CHANNEL = { name: "Kaise Chalta Hai 3D", handle: "@KaiseChaltaHai3D", tagline: "Har cheez ka sach, 3D mein" };
export const CAPTION_PLACE: Record<string, "top" | "center" | "low"> = {};
export const CAPTION_HIDE = ["L13"];

type SceneP = { o: number; d: number };
const G = (o: number, g: number) => g - o;
const FAKE_SMS = "Rs 5,000.00 credited to your A/c XX4821 via UPI. Avl bal: Rs 5,312.40";

// 1 ── HOOK: a "credited" SMS lands, then the phone rings
const S1: React.FC<SceneP> = ({ o, d }) => {
  const call = G(o, hit("L1", "call"));
  return (
    <Ground tone="warm"><Bokeh n={30} seed={21} />
      <Cam dur={d} s0={1} s1={1.08} dy={-16}>
        <Phone y={1150} scale={1.0} rx={[10, 6]} ry={[-16, -9]} rz={[3, 1]} dur={d} enter={0}>
          <StatusBar time="18:42" />
          <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", fontFamily: F.sans, fontWeight: 300, fontSize: 150, color: C.white }}>18:42</div>
          <Toast at={3} title="VM-BANKXX · now" body="₹5,000 credited to A/c XX4821" color={C.lime} y={520} />
          <IncomingCall at={call} name="Unknown" number="+91 98•••• ••417" />
        </Phone>
      </Cam>
      <Hud left="Ghar · shaam 6:42" right="scam se pehle" clock="00:00" />
      <Vignette />
    </Ground>
  );
};

// 2 ── the caller (3D phone, dolly in)
const S2: React.FC<SceneP> = ({ d }) => {
  const draw = (g: CanvasRenderingContext2D) => {
    const gr = g.createLinearGradient(0, 0, 0, 1170); gr.addColorStop(0, "#1b2420"); gr.addColorStop(0.7, "#07090A"); g.fillStyle = gr; g.fillRect(0, 0, 540, 1170);
    g.textAlign = "center"; g.fillStyle = "#E8573F"; g.font = "500 24px 'JetBrains Mono', monospace"; g.fillText("ON CALL · 00:41", 270, 200);
    g.fillStyle = "#F3F5EF"; g.font = "800 58px Inter, sans-serif"; g.fillText("Unknown", 270, 280);
    g.fillStyle = "#8C948F"; g.font = "500 28px 'JetBrains Mono', monospace"; g.fillText("+91 98•••• ••417", 270, 330);
    g.fillStyle = "#1A201E"; g.beginPath(); g.roundRect(50, 420, 440, 170, 26); g.fill();
    g.fillStyle = "#F3F5EF"; g.font = "700 32px Inter, sans-serif"; g.fillText("\"Bhai galti se", 270, 490); g.fillText("bhej diye…\"", 270, 540);
    g.fillStyle = "#E5484D"; g.beginPath(); g.arc(270, 980, 62, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "800 26px Inter"; g.fillText("END", 270, 990);
  };
  return (
    <Ground tone="warm"><Bokeh n={26} seed={8} drift={60} />
      <Studio3D dur={d} from={[-0.28, 0.06, 1.4]} to={[-0.06, 0.02, 1.0]} look={[0, 0.07, 0]} fov={30}>
        <Phone3D draw={draw} rotation={[-0.1, 0.32, -0.05]} />
      </Studio3D>
      <Hud left="Ghar · shaam 6:43" right="scam se pehle" clock="00:01" />
      <Vignette />
    </Ground>
  );
};

// 3 ── you send it back (amount, then PIN)
const S3: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const pin = G(o, hit("L3", "bhej")) - 14;
  return (
    <Ground><Bokeh n={12} seed={5} opacity={0.45} />
      <Cam dur={d} s0={1.02} s1={1.1}>
        <Phone y={1120} scale={0.9} rx={[4, 2]} ry={[12, 5]} rz={[-2, -1]} dur={d}>
          <StatusBar time="18:44" />
          {f < pin ? <div style={{ position: "absolute", inset: 0, fontFamily: F.sans, color: C.white, textAlign: "center" }}>
            <div style={{ marginTop: 200, fontFamily: F.mono, fontSize: 24, color: C.grey, letterSpacing: 3 }}>PAYING</div>
            <div style={{ marginTop: 14, fontSize: 40, fontWeight: 700 }}>98•••••417@upi</div>
            <div style={{ marginTop: 90, fontSize: 130, fontWeight: 800, letterSpacing: -4 }}>₹5,000</div>
            <div style={{ margin: "120px auto 0", width: 420, height: 100, borderRadius: 50, background: C.lime, color: "#0A0D0C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, transform: `scale(${1 + 0.05 * Math.sin(f / 4)})` }}>PAY</div>
          </div> : <PinPad at={2} step={4} />}
        </Phone>
      </Cam>
      <Hud left="UPI app" right="scam se pehle" clock="00:03" />
      <Vignette />
    </Ground>
  );
};

// 4 ── they never came (red, impact)
const S4: React.FC<SceneP> = ({ o, d }) => {
  const nahi = G(o, hit("L4", "nahi"));
  return (
    <Ground tone="red">
      <Cam dur={d} s0={1} s1={1.07} kick={[nahi]}>
        <Phone y={1100} scale={0.84} rx={[6, 4]} ry={[-8, -3]} rz={[1, 0]} dur={d} glow={C.red}>
          <StatusBar time="18:45" />
          <BalanceScreen from={5312.4} to={312.4} rollAt={6} color={C.red} note="₹5,000 sent · ₹0 received" noteColor={C.red} />
        </Phone>
        <Stamp at={nahi} x={540} y={1560} text="AAYE HI NAHI" size={92} rot={-6} />
      </Cam>
      <Hud left="Tumhara account" right="scam ke baad" clock="−₹5,000" dot={C.red} />
      <Vignette amt={0.6} />
    </Ground>
  );
};

// 5 ── it was only a message: FAKE
const S5: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor />
    <Cam dur={d} s0={1} s1={1.06}>
      <SmsCard x={130} y={760} sender="VM-BANKXX" body={FAKE_SMS} at={2} />
      <Stamp at={G(o, hit("L5", "Fake"))} x={720} y={1180} text="FAKE" size={130} rot={-10} />
    </Cam>
    <Hud left="Message ka sach" right="andar ki baat" clock="01" />
    <Vignette />
  </Ground>
);

// 6 ── looks exactly like a bank
const S6: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor opacity={0.08} />
    <Cam dur={d} s0={1.05} s1={1.12} oy={48}>
      <SmsCard x={130} y={760} sender="VM-BANKXX" body={FAKE_SMS} at={-30} ring={useCurrentFrame() < G(o, hit("L6", "line")) ? "sender" : "body"} ringAt={G(o, hit("L6", "naam"))} />
      <Chip at={G(o, hit("L6", "naam"))} x={130} y={620} lines={["NAAM = SIRF LABEL"]} size={48} mono />
    </Cam>
    <Hud left="Message ka sach" right="andar ki baat" clock="02" />
    <Vignette />
  </Ground>
);

// 7 ── but no money: the balance never moved
const S7: React.FC<SceneP> = ({ o, d }) => (
  <Ground>
    <Cam dur={d} s0={1} s1={1.07}>
      <Chip at={2} x={120} y={560} lines={["ASLI CREDIT"]} size={50} mono color={C.grey} />
      <Counter at={2} dur={1} from={0} to={0} x={540} y={760} prefix="₹" size={300} color={C.red} />
      <Rings at={G(o, hit("L7", "nahi"))} x={540} y={940} color={C.red} max={700} n={2} period={30} />
      <div style={{ position: "absolute", top: 1160, width: "100%", textAlign: "center", fontFamily: F.mono, color: C.grey, fontSize: 30, letterSpacing: 3, opacity: io(useCurrentFrame(), G(o, hit("L7", "paisa")), 6) }}>BALANCE WAHI KA WAHI</div>
    </Cam>
    <Hud left="Bank ka record" right="andar ki baat" clock="03" />
    <Vignette />
  </Ground>
);

// 8 ── the scale: one call, five minutes, ₹5,000
const S8: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const gaye = G(o, hit("L8", "gaye"));
  const mins = Math.floor(lerp(f, [0, gaye], [0, 300]));
  return (
    <Ground tone={f >= gaye ? "red" : "dark"}>
      <Cam dur={d} s0={1} s1={1.06} kick={[gaye]}>
        <Pill at={G(o, hit("L8", "call"))} x={120} y={640} text="1 CALL" size={80} bg={C.white} />
        <div style={{ position: "absolute", left: 120, top: 800, fontFamily: F.mono, fontWeight: 700, fontSize: 170, color: C.lime, opacity: io(f, G(o, hit("L8", "paanch")) - 2, 4), textShadow: `0 0 40px ${C.lime}55` }}>{String(Math.floor(mins / 60)).padStart(2, "0")}:{String(mins % 60).padStart(2, "0")}</div>
        <Counter at={gaye - 2} dur={10} from={0} to={5000} x={120} y={1040} prefix="−₹" size={170} color={C.red} align="left" />
      </Cam>
      <Hud left="Poora scam" right="kitna time" clock={`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`} dot={f >= gaye ? C.red : C.lime} />
      <Vignette />
    </Ground>
  );
};

// 9 ── "3 cheezein yaad rakho"
const S9: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.07}>
      <Pill at={2} x={120} y={680} text="3 CHEEZEIN" size={110} />
      {[1, 2, 3].map((n, i) => <StepDot key={n} at={6 + i * 6} x={200 + i * 230} y={1060} n={n} size={150} />)}
    </Cam>
    <Hud left="Bachne ka tareeka" right="yaad rakho" clock="1-2-3" />
    <Vignette />
  </Ground>
);

// 10 ── step 1: open the bank app, check the balance
const S10: React.FC<SceneP> = ({ o, d }) => (
  <Ground>
    <Cam dur={d} s0={1} s1={1.06}>
      <Phone y={1150} scale={0.86} rx={[6, 3]} ry={[-12, -5]} rz={[2, 0]} dur={d} glow={C.lime}>
        <StatusBar time="18:42" />
        <BalanceScreen from={312.4} to={312.4} note={"Credit dikh raha? Nahi → fake"} />
      </Phone>
      <StepDot at={2} x={150} y={600} n={1} size={120} />
      <Chip at={G(o, hit("L10", "balance"))} x={240} y={570} lines={["BALANCE DEKHO"]} size={58} />
    </Cam>
    <Hud left="Step 1" right="bank app" clock="01/03" />
    <Vignette />
  </Ground>
);

// 11a ── step 2: never send it back yourself
const S11a: React.FC<SceneP> = ({ o, d }) => {
  const f = useCurrentFrame();
  const mat = G(o, hit("L11", "mat"));
  return (
    <Ground><GridFloor opacity={0.08} />
      <Cam dur={d} s0={1} s1={1.06}>
        <StepDot at={2} x={150} y={600} n={2} size={120} />
        <Chip at={2} x={240} y={570} lines={["SACH MEIN AAYE?"]} size={58} />
        <div style={{ position: "absolute", left: 110, top: 1000, fontFamily: F.mono, fontSize: 40, color: C.white, letterSpacing: 3 }}>TUM</div>
        <div style={{ position: "absolute", left: 760, top: 1000, fontFamily: F.mono, fontSize: 40, color: C.red, letterSpacing: 3 }}>CALLER</div>
        <Flow d="M 260 1030 L 720 1030" at={4} dur={14} color={C.red} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}><path d="M 420 940 L 580 1120 M 580 940 L 420 1120" stroke={C.red} strokeWidth={26} strokeLinecap="round" strokeDasharray={600} strokeDashoffset={600 * (1 - io(f, mat, 6))} /></svg>
        <Stamp at={mat} x={540} y={1320} text="KHUD MAT BHEJO" size={78} rot={-4} />
      </Cam>
      <Hud left="Step 2" right="wapas kaise" clock="02/03" />
      <Vignette />
    </Ground>
  );
};

// 11b ── step 2: the bank reverses it
const S11b: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor opacity={0.1} />
    <Cam dur={d} s0={1} s1={1.07}>
      <StepDot at={-20} x={150} y={600} n={2} size={120} />
      <div style={{ position: "absolute", left: 110, top: 860, fontFamily: F.mono, fontSize: 40, color: C.white, letterSpacing: 3 }}>CALLER</div>
      <div style={{ position: "absolute", left: 380, top: 1100, width: 320, height: 150, borderRadius: 26, border: `4px solid ${C.lime}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 60, color: C.lime, boxShadow: `0 0 40px ${C.lime}44`, transform: `scale(${pop(useCurrentFrame(), 2)})` }}>BANK</div>
      <Flow d="M 200 920 C 260 1100, 330 1170, 380 1175" at={G(o, hit("L11", "bank"))} dur={14} />
      <Flow d="M 700 1175 C 800 1170, 880 1050, 900 900" at={G(o, hit("L11", "reversal"))} dur={14} />
      <div style={{ position: "absolute", left: 830, top: 820, fontFamily: F.mono, fontSize: 40, color: C.white, letterSpacing: 3, opacity: io(useCurrentFrame(), G(o, hit("L11", "reversal")) + 8, 6) }}>TUM</div>
      <Chip at={G(o, hit("L11", "reversal"))} x={120} y={1380} lines={["REVERSAL", "SIRF BANK SE"]} size={66} />
    </Cam>
    <Hud left="Step 2" right="wapas kaise" clock="02/03" />
    <Vignette />
  </Ground>
);

// 12 ── step 3: report on 1930
const S12: React.FC<SceneP> = ({ o, d }) => (
  <Ground>
    <IndiaMap at={0} y={1000} w={1040} color="#3B4541" spread={{ from: "Delhi", at: 6, color: "#6E9A2A", dur: 60 }} pings={[{ city: "Delhi", at: 8 }, { city: "Mumbai", at: 16 }, { city: "Kolkata", at: 22 }, { city: "Chennai", at: 28 }]} />
    <Cam dur={d} s0={1} s1={1.06}>
      <Phone y={1240} scale={0.72} rx={[6, 3]} ry={[14, 6]} rz={[-2, 0]} dur={d} enter={0}>
        <StatusBar /><Dialer at={G(o, hit("L12", "1930"))} number="1930" step={4} label="CYBER CRIME HELPLINE" />
      </Phone>
    </Cam>
    <Hud left="Step 3" right="report karo" clock="03/03" />
    <Vignette />
  </Ground>
);

// 13 ── mantra (captions hidden; pills are the caption)
const S13: React.FC<SceneP> = ({ o, d }) => (
  <Ground><GridFloor y={1300} />
    <Cam dur={d} s0={1} s1={1.08} oy={45}>
      <Chip at={2} x={120} y={560} lines={["YAAD RAKHO"]} size={46} mono color={C.grey} />
      <Pill at={G(o, hit("L13", "Message"))} x={110} y={700} text="MESSAGE NAHI." size={100} bg={C.white} />
      <Pill at={G(o, hit("L13", "balance"))} x={110} y={870} text="BALANCE." size={150} />
    </Cam>
    <Hud left="Ek line" clock="★" right="yaad rakho" />
    <Vignette />
  </Ground>
);

// 14 ── CTA: send it to whoever uses UPI at home
const S14: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={16} hue="lime" opacity={0.2} seed={2} />
    <EndCard channel={CHANNEL.name} handle={CHANNEL.handle} tagline={CHANNEL.tagline} flipAt={G(o, hit("L14", "Follow"))} logo="3D" />
    <Vignette />
  </Ground>
);

// 15 ── comment bait poll
const S15: React.FC<SceneP> = ({ o }) => (
  <Ground><Bokeh n={14} hue="lime" opacity={0.18} seed={6} />
    <Poll q="Kabhi aisa call aaya?" a="Haan, aaya" b="Nahi" pickAt={G(o, hit("L15", "Haan"))} pick={0} />
    <Vignette />
  </Ground>
);

const P = (from: number, C_: React.FC<SceneP>) => ({ from, C: C_ });
export const SCENES = [
  P(0, S1), P(at("L2"), S2), P(at("L3"), S3), P(at("L4"), S4), P(at("L5"), S5), P(at("L6"), S6), P(at("L7"), S7),
  P(at("L8"), S8), P(at("L9"), S9), P(at("L10"), S10), P(at("L11"), S11a), P(hit("L11", "Bolo"), S11b),
  P(at("L12"), S12), P(at("L13"), S13), P(at("L14"), S14), P(at("L15"), S15),
];
// Sound cues: tools/cues.mjs exports cuts (scene starts) + IMPACTS + POPS + RISERS to out/cues.json for tools/audio.py
export const IMPACTS = [hit("L4", "nahi"), hit("L8", "gaye")];
export const POPS = [3, hit("L1", "call"), hit("L5", "Fake"), hit("L6", "naam"), hit("L6", "line"), hit("L8", "call"), hit("L9", "yaad"), hit("L10", "balance"), hit("L11", "mat"), hit("L11", "bank"), hit("L11", "reversal"), hit("L12", "1930"), hit("L13", "Message"), hit("L13", "balance"), hit("L14", "Follow"), hit("L15", "Haan")];
export const RISERS = [hit("L4", "nahi"), at("L13")];
export const DURATION = TOTAL;
