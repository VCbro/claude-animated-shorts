// "AC ठंडा कैसे करता है? / कूलर का पानी कहाँ जाता है?" — 1080x1920, 30 fps.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, interpolate, Easing, spring, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import "@fontsource/baloo-2/devanagari-700.css";
import "@fontsource/baloo-2/latin-700.css";
import "@fontsource/baloo-2/devanagari-800.css";
import "@fontsource/baloo-2/latin-800.css";
import "@fontsource/noto-sans-devanagari/devanagari-700.css";
import "@fontsource/noto-sans-devanagari/latin-700.css";
import { World } from "./world";
import { FPS, FRAMES, DUR, S, FLASHES, clamp01, sstep, makeCamera, endPose, humidity, sceneAt, IN } from "./timeline";
import { LINES } from "../lines";

export const FILM_FRAMES = FRAMES;
const W = 1080, H = 1920;

const Inner: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS;
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(), []);
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose(); return e; }, [gl]);
  const envI = (getInputProps() as { envI?: number }).envI ?? 0.2;
  scene.environment = env; scene.environmentIntensity = envI;
  const fx = useMemo(() => ({
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.6, luminanceThreshold: 1.0, luminanceSmoothing: 0.15, mipmapBlur: true, levels: 5, radius: 0.5 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
    vig: new VignetteEffect({ offset: 0.32, darkness: 0.5 }),
  }), []);
  const cam = camera as THREE.PerspectiveCamera;
  makeCamera(t, W / H, cam);
  world.update(t, cam);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.vig} dispose={null} />
      </EffectComposer>
    </>
  );
};

// ---------------- overlays ----------------
const HF = "'Baloo 2', 'Noto Sans Devanagari', sans-serif";
const SF = "'Noto Sans Devanagari', 'Baloo 2', sans-serif";
const outline = (px: number, c = "#05070d") => { const s: string[] = []; for (let a = 0; a < 16; a++) s.push(`${(Math.cos((a / 16) * Math.PI * 2) * px).toFixed(1)}px ${(Math.sin((a / 16) * Math.PI * 2) * px).toFixed(1)}px 0 ${c}`); return s.join(","); };
const fade = (t: number, a: number, b: number, d = 0.25) => clamp01((t - a) / d) * clamp01((b - t) / d);

const projCam = new THREE.PerspectiveCamera(); const _m = new THREE.Matrix4();
const project = (t: number, p: [number, number, number], which: "w" | "ac" | "cooler" = "w") => {
  makeCamera(t, W / H, projCam); void _m;
  const v = new THREE.Vector3(...p);
  if (which !== "w") { const e = endPose(t); if (which === "ac") v.multiplyScalar(e.ac.s).add(new THREE.Vector3(e.ac.pos[0], e.ac.pos[1] - IN.pos[1] * e.ac.s, 0)); else v.multiplyScalar(e.cooler.s).add(new THREE.Vector3(...e.cooler.pos)); }
  v.project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
type Lab = { a: number; b: number; text: string; sub?: string; p: [number, number, number]; side: -1 | 1; dy: number; col?: string; which?: "w" | "ac" | "cooler" };
const HOT = "#ff9a4d", COLD = "#8fd6ff";
const LABELS: Lab[] = [
  { a: 2.0, b: 6.6, text: "पानी टप-टप", p: [2.75, -0.85, 0.6], side: -1, dy: -120, col: COLD },
  { a: 12.3, b: 15.3, text: "रेफ्रिजरेंट गैस", sub: "पाइपों में घूमती है", p: [2.15, 1.1, 0.05], side: -1, dy: -170, col: "#ffffff" },
  { a: 15.6, b: 18.5, text: "ठंडी कॉइल", sub: "इवेपोरेटर", p: [-0.9, 2.45, 0.25], side: -1, dy: -230, col: COLD },
  { a: 16.4, b: 18.5, text: "ठंडी हवा", p: [0.6, 1.2, 1.6], side: 1, dy: 160, col: COLD },
  { a: 19.6, b: 23.9, text: "कंप्रेसर", sub: "गैस को दबाकर गर्म करता है", p: [0.98, -2.6, 0.2], side: 1, dy: -250, col: HOT },
  { a: 21.4, b: 23.9, text: "पंखा", sub: "गर्मी बाहर", p: [-0.45, -2.35, 0.55], side: -1, dy: 260, col: HOT },
  { a: 24.6, b: 28.3, text: "एक्सपैंशन वाल्व", sub: "गैस फैलकर ठंडी", p: [1.3, -3.2, 0.35], side: -1, dy: 150, col: COLD },
  { a: 30.6, b: 33.2, text: "हवा की नमी", p: [0.9, 2.5, 0.9], side: 1, dy: -230, col: "#ffffff" },
  { a: 33.4, b: 37.0, text: "पानी की बूँदें", p: [0.25, 2.2, 0.26], side: -1, dy: 230, col: COLD },
  { a: 38.1, b: 40.3, text: "ड्रेन पाइप", sub: "पानी बाहर", p: [2.6, -0.3, 0.4], side: -1, dy: -160, col: COLD },
  { a: 41.0, b: 43.3, text: "पानी की टंकी", p: [-0.6, -1.25, 0.9], side: -1, dy: 170, col: COLD },
  { a: 41.9, b: 44.2, text: "पंप", p: [0.75, -1.4, -0.4], side: 1, dy: 200, col: "#ffffff" },
  { a: 43.6, b: 46.2, text: "घास के पैड", sub: "हमेशा गीले", p: [1.1, 0.7, 0.3], side: 1, dy: -200, col: "#ffd27a" },
  { a: 45.7, b: 48.4, text: "गर्म हवा अंदर", p: [-2.2, 0.8, 0.0], side: -1, dy: -170, col: HOT },
  { a: 47.0, b: 48.4, text: "पंखा", p: [0, 0.3, 0.9], side: 1, dy: -230, col: "#ffffff" },
  { a: 50.4, b: 53.8, text: "ठंडी हवा बाहर", p: [0.3, 0.2, 3.2], side: 1, dy: 170, col: COLD },
  { a: 55.0, b: 58.5, text: "पानी → भाप", sub: "हवा में मिल गया", p: [0.5, 2.0, 3.6], side: 1, dy: -150, col: "#ffffff" },
  { a: 62.4, b: DUR, text: "AC: हवा से पानी बाहर", p: [1.75, 0.3, 0.2], side: 1, dy: -330, col: COLD, which: "ac" },
  { a: 63.8, b: DUR, text: "कूलर: पानी हवा में", p: [1.1, 1.0, 0.3], side: 1, dy: -230, col: "#ffd27a", which: "cooler" },
];
const Label: React.FC<{ L: Lab; t: number }> = ({ L, t }) => {
  const k = fade(t, L.a, L.b, 0.3); if (k <= 0) return null;
  const pt = project(t, L.p, L.which ?? "w");
  const grow = Easing.out(Easing.cubic)(clamp01((t - L.a) / 0.45));
  const estW = Math.max(L.text.length * 30, (L.sub?.length ?? 0) * 19) + 70;
  const lx0 = pt.x + L.side * 170;
  const lx = L.side > 0 ? Math.min(W - 40 - estW * 0.88, Math.max(40 + estW * 0.12, lx0)) : Math.max(40 + estW * 0.88, Math.min(W - 40 - estW * 0.12, lx0));
  const ly = pt.y + L.dy; const col = L.col ?? "#ffd27a";
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <line x1={pt.x} y1={pt.y} x2={pt.x + (lx - pt.x) * grow} y2={pt.y + (ly - pt.y) * grow} stroke={col} strokeWidth={4} />
        <circle cx={pt.x} cy={pt.y} r={11} fill="none" stroke={col} strokeWidth={4} /><circle cx={pt.x} cy={pt.y} r={4.5} fill={col} />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly, transform: `translate(${L.side < 0 ? -88 : -12}%, -50%) scale(${0.6 + 0.4 * grow})`, transformOrigin: L.side < 0 ? "right center" : "left center" }}>
        <div style={{ whiteSpace: "nowrap", fontFamily: HF, fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: "#fff", padding: "10px 30px 4px", borderRadius: 999, background: "rgba(8,12,24,0.75)", border: `3px solid ${col}`, boxShadow: `0 0 28px ${col}55, 0 8px 22px rgba(0,0,0,0.45)` }}>
          {L.text}{L.sub ? <div style={{ fontSize: 34, fontWeight: 700, color: col, marginTop: -4, paddingBottom: 6 }}>{L.sub}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Subtitles: React.FC<{ t: number }> = ({ t }) => {
  let cur: { text: string; t0: number; t1: number } | null = null;
  for (const L of LINES) for (const s of L.subs) if (t >= s.t0 - 0.05 && t < s.t1 + 0.12) cur = s;
  if (!cur) return null;
  const pop = Easing.out(Easing.back(2.2))(clamp01((t - cur.t0 + 0.05) / 0.22));
  const words = cur.text.split(" "); const u = clamp01((t - cur.t0) / Math.max(0.2, cur.t1 - cur.t0)); const lit = Math.ceil(u * words.length + 0.01);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: 1335 }}>
      <div style={{ maxWidth: 960, textAlign: "center", transform: `scale(${0.82 + 0.18 * pop})`, fontFamily: SF, fontWeight: 700, fontSize: 66, lineHeight: 1.32 }}>
        {words.map((w, i) => <span key={i} style={{ color: i < lit ? (w.startsWith("Subscribe") ? "#ff5a5a" : "#ffe27a") : "#ffffff", textShadow: outline(5) + ", 0 6px 18px rgba(0,0,0,0.7)" }}>{w}{i < words.length - 1 ? " " : ""}</span>)}
      </div>
    </AbsoluteFill>
  );
};

const HookTitle: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  if (t > 7.0) return null;
  const k = spring({ frame: f - 6, fps: FPS, config: { damping: 11, stiffness: 120 } });
  const out = 1 - sstep(6.2, 7.0, t); const sweep = ((t * 0.55) % 1.6) * 100 - 30;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 200, opacity: out }}>
      <div style={{ transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * -40}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 112, lineHeight: 1.08, backgroundImage: `linear-gradient(100deg, #7fd6ff 0%, #ffffff ${sweep}%, #3aa8ff ${sweep + 18}%, #bfe9ff 100%)`, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 6px 0 #062642) drop-shadow(0 14px 26px rgba(0,0,0,0.7))" }}>AC से पानी<br />क्यों टपकता है?</div>
        <div style={{ marginTop: 16, fontFamily: HF, fontWeight: 800, fontSize: 56, color: "#9fe0ff", textShadow: outline(5) }}>कूलर का पानी कहाँ जाता है?</div>
      </div>
    </AbsoluteFill>
  );
};

const CHIPS = [
  { a: S.s2 + 0.3, b: S.s3 - 0.3, n: "1", text: "AC का चक्र", col: "#8fd6ff" },
  { a: S.s3 + 0.3, b: S.s4 - 0.3, n: "2", text: "AC का पानी", col: "#8fd6ff" },
  { a: S.s4 + 0.3, b: S.s5 - 0.3, n: "3", text: "कूलर", col: "#ffd27a" },
  { a: S.s5 + 0.3, b: S.s6 - 0.3, n: "4", text: "कूलर का पानी कहाँ गया?", col: "#ffd27a" },
];
const Chip: React.FC<{ t: number }> = ({ t }) => {
  const c = CHIPS.find((c) => t >= c.a - 0.05 && t < c.b + 0.3); if (!c) return null;
  const k = fade(t, c.a, c.b, 0.3); const slide = Easing.out(Easing.cubic)(clamp01((t - c.a) / 0.4));
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 200, opacity: k }}>
      <div style={{ transform: `translateY(${(1 - slide) * -50}px)`, display: "flex", alignItems: "center", gap: 18, padding: "12px 36px 8px 14px", borderRadius: 999, background: "linear-gradient(180deg, rgba(20,26,48,0.88), rgba(8,10,20,0.88))", border: `3px solid ${c.col}`, boxShadow: `0 0 34px ${c.col}44` }}>
        <div style={{ width: 72, height: 72, borderRadius: 99, background: c.col, color: "#101425", fontFamily: HF, fontWeight: 800, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 6 }}>{c.n}</div>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 58, color: "#fff", whiteSpace: "nowrap" }}>{c.text}</div>
      </div>
    </AbsoluteFill>
  );
};







const OK = <g><circle cx="0" cy="0" r="40" fill="#2e9d4a" stroke="#fff" strokeWidth="6" /><path d="M-18 0l12 12 22-24" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>;
const Zones: React.FC<{ t: number }> = ({ t }) => {
  const k = Math.max(fade(t, 7.6, 15.4, 0.3), fade(t, 24.9, 28.3, 0.3)); if (k <= 0) return null;
  const a = project(t, [-1.85, 3.3, 0]), b = project(t, [-1.55, -0.85, 0]), w = project(t, [-3.0, 0.05, 0.8]);
  const tag = (x: number, y: number, txt: string, col: string) => <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", padding: "6px 22px 2px", borderRadius: 14, background: col, fontFamily: HF, fontWeight: 800, fontSize: 42, color: "#fff", boxShadow: "0 6px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{txt}</div>;
  return <AbsoluteFill style={{ opacity: k }}>{tag(a.x, a.y, "कमरा (अंदर)", "rgba(40,110,200,0.9)")}{tag(b.x, b.y, "बाहर", "rgba(210,90,30,0.9)")}{tag(w.x, w.y, "दीवार", "rgba(90,50,35,0.9)")}</AbsoluteFill>;
};
const HeatArrow: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 7.7, 11.4, 0.3); if (k <= 0) return null;
  const p0 = project(t, [-0.6, 2.0, 1.2]), p1 = project(t, [-0.6, -1.4, 1.2]);
  const u = ((t - 7.7) * 0.8) % 1;
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb347" /><stop offset="1" stopColor="#ff3b1f" /></linearGradient></defs>
        <path d={`M${p0.x} ${p0.y} L${p1.x} ${p1.y - 60}`} stroke="url(#hg)" strokeWidth="34" strokeLinecap="round" opacity="0.9" />
        <path d={`M${p1.x - 60} ${p1.y - 80} L${p1.x} ${p1.y} L${p1.x + 60} ${p1.y - 80}`} stroke="#ff3b1f" strokeWidth="30" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={p0.x + (p1.x - p0.x) * u} cy={p0.y + (p1.y - p0.y) * u} r="22" fill="#fff3c0" opacity={Math.sin(Math.PI * u)} />
      </svg>
      <div style={{ position: "absolute", left: p0.x + 70, top: (p0.y + p1.y) / 2, transform: "translateY(-50%)", padding: "8px 26px 2px", borderRadius: 18, background: "rgba(20,10,6,0.85)", border: "3px solid #ff9a4d", fontFamily: HF, fontWeight: 800, fontSize: 50, color: "#fff", whiteSpace: "nowrap" }}>गर्मी बाहर!</div>
    </AbsoluteFill>
  );
};
const Glass: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 35.9, 38.0, 0.25); if (k <= 0) return null;
  const s = spring({ frame: Math.round((t - 35.9) * FPS), fps: FPS, config: { damping: 11, stiffness: 140 } });
  const g = clamp01((t - 36.1) / 1.2);
  const drops = [[-40, -50], [30, -20], [-20, 20], [45, 40], [-45, 60], [10, 75], [35, -70], [-10, -85]];
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}>
      <div style={{ transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 20, padding: "16px 34px 12px", borderRadius: 30, background: "rgba(8,16,30,0.86)", border: "3px solid #8fd6ff", boxShadow: "0 0 30px #8fd6ff44" }}>
        <svg width="200" height="240" viewBox="-100 -120 200 240">
          <path d="M-60-100h120l-14 200h-92z" fill="rgba(170,220,255,0.25)" stroke="#dff3ff" strokeWidth="6" />
          <path d="M-56-40h112l-10 136h-92z" fill="rgba(90,180,255,0.5)" />
          {[[-30, -20], [10, 30], [25, -10]].map(([x, y], i) => <rect key={i} x={x} y={y} width="26" height="26" rx="5" fill="rgba(230,250,255,0.85)" transform={`rotate(${i * 20} ${x} ${y})`} />)}
          {drops.map(([x, y], i) => <ellipse key={i} cx={x * 1.25} cy={y + g * 10 * (i % 3)} rx={5 * g + 1} ry={7 * g + 1} fill="#ffffff" opacity={g} />)}
        </svg>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 52, color: "#fff", lineHeight: 1.15 }}>ठंडा गिलास<br /><span style={{ color: "#8fd6ff", fontSize: 40 }}>हवा की नमी → बूँदें</span></div>
      </div>
    </AbsoluteFill>
  );
};
const Humidity: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 54.6, 61.7, 0.3); if (k <= 0) return null;
  const h = humidity(t);
  const win = fade(t, 58.7, 61.7, 0.3); const ws = spring({ frame: Math.round((t - 58.7) * FPS), fps: FPS, config: { damping: 10, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <div style={{ position: "absolute", left: 50, top: 330, padding: "12px 26px 8px", borderRadius: 22, background: "rgba(8,16,30,0.86)", border: "3px solid #ffffff", fontFamily: HF, fontWeight: 800, color: "#fff" }}>
        <div style={{ fontSize: 36, color: "#cfe9ff" }}>कमरे में नमी</div>
        <div style={{ fontSize: 76, lineHeight: 1 }}>{h}%</div>
        <div style={{ width: 300, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.2)", marginTop: 6, overflow: "hidden" }}><div style={{ width: `${h}%`, height: "100%", background: "linear-gradient(90deg,#8fd6ff,#3a8bff)" }} /></div>
      </div>
      {win > 0 && <div style={{ position: "absolute", right: 50, top: 330, opacity: win, transform: `scale(${ws})`, display: "flex", alignItems: "center", gap: 12, padding: "12px 24px 8px 14px", borderRadius: 22, background: "rgba(20,110,50,0.9)", border: "3px solid #fff" }}>
        <svg width="76" height="76" viewBox="-45 -45 90 90">{OK}</svg>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 44, color: "#fff", lineHeight: 1.1 }}>खिड़की<br />खुली रखें</div>
      </div>}
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const t0 = 66.8; if (t < t0) return null;
  const k = spring({ frame: f - Math.round(t0 * FPS), fps: FPS, config: { damping: 10, stiffness: 140 } });
  const tp = t0 + 2.6; const press = t > tp - 0.2 && t < tp + 0.2 ? 0.92 : 1; const pressed = t > tp;
  const ring = t > tp + 0.2 ? Math.sin((t - tp - 0.2) * 22) * 18 * Math.max(0, 1 - (t - tp - 0.2) / 1.2) : 0;
  const hx = interpolate(t, [t0 + 1.3, tp - 0.1], [380, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ha = clamp01((t - t0 - 1.2) / 0.3) * (1 - clamp01((t - tp - 0.8) / 0.4));
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 1580 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `scale(${k})` }}>
        <div style={{ transform: `scale(${press})`, display: "flex", alignItems: "center", gap: 16, background: pressed ? "linear-gradient(#5b5f6b,#3b3e47)" : "linear-gradient(#ff2d2d,#cc0f0f)", color: "#fff", fontFamily: HF, fontWeight: 800, fontSize: 58, padding: "14px 46px 8px", borderRadius: 70, border: "5px solid #fff", boxShadow: pressed ? "0 6px 16px rgba(0,0,0,0.4)" : "0 0 40px rgba(255,40,40,0.6), 0 10px 26px rgba(0,0,0,0.45)" }}>
          <svg width="56" height="40" viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#fff" /><path d="M11 5l8 5-8 5z" fill={pressed ? "#4a4d56" : "#e01414"} /></svg>
          {pressed ? "Subscribed ✓" : "Subscribe"}
        </div>
        <svg width="96" height="96" viewBox="0 0 64 64" style={{ transform: `rotate(${ring}deg)` }}>
          <path d="M32 6c-2 0-4 2-4 4v2C19 14 14 22 14 31v12l-5 6v3h46v-3l-5-6V31c0-9-5-17-14-19v-2c0-2-2-4-4-4z" fill="#ffd23a" stroke="#1d1030" strokeWidth="3" /><circle cx="32" cy="57" r="5" fill="#ffd23a" stroke="#1d1030" strokeWidth="3" />
        </svg>
      </div>
      <svg width="120" height="140" viewBox="0 0 60 70" style={{ position: "absolute", top: 70, left: 520 + hx, opacity: ha }}>
        <path d="M22 4c3 0 5 2 5 5v20l3-1c3-1 6 1 6 4l2-1c3 0 5 2 5 4l2-1c3 0 5 2 5 5v14c0 9-7 16-16 16h-4c-6 0-11-3-14-8L4 46c-2-3 0-7 4-7 2 0 3 1 5 3l4 4V9c0-3 2-5 5-5z" fill="#fff" stroke="#1d1030" strokeWidth="3" />
      </svg>
    </AbsoluteFill>
  );
};

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([document.fonts.load("800 80px 'Baloo 2'", "कूलर AC"), document.fonts.load("700 80px 'Baloo 2'", "कूलर"), document.fonts.load("800 80px 'Baloo 2'", "Subscribe 0123456789%°C AC"),
      document.fonts.load("700 50px 'Noto Sans Devanagari'", "कूलर AC"), document.fonts.load("700 50px 'Noto Sans Devanagari'", "Subscribe")]).then(() => continueRender(h), () => continueRender(h));
  }, [h]);
};

export const Film: React.FC = () => {
  const f = useCurrentFrame(); const t = f / FPS; useFonts();
  const ov = (getInputProps() as { overlay?: boolean }).overlay ?? true;
  const flash = FLASHES.reduce((m, c) => Math.max(m, Math.exp(-(((t - c) / 0.13) ** 2))), 0);
  const black = 1 - clamp01(t / 0.5);
  void sceneAt; void DUR;
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <ThreeCanvas width={W} height={H} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 30, near: 0.05, far: 400 }}><Inner /></ThreeCanvas>
      {flash > 0.01 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #ffffff 0%, #fff1d0 40%, rgba(255,220,160,0.6) 100%)", opacity: flash * 0.95 }} />}
      {ov && <>
        <HookTitle t={t} f={f} /><Chip t={t} />
        {LABELS.map((L, i) => <Label key={i} L={L} t={t} />)}
        <Zones t={t} /><HeatArrow t={t} /><Glass t={t} /><Humidity t={t} />
        <Subtitles t={t} /><CTA t={t} f={f} />
      </>}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
    </AbsoluteFill>
  );
};
