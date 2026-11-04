// "फ्रिज ठंडा कैसे करता है?" — 1080x1920, 30 fps.
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
import { FPS, FRAMES, DUR, S, FLASHES, TIPS, clamp01, sstep, makeCamera, sceneAt } from "./timeline";
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
const project = (t: number, p: [number, number, number]) => {
  makeCamera(t, W / H, projCam); void _m; const v = new THREE.Vector3(...p).project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
type Lab = { a: number; b: number; text: string; sub?: string; p: [number, number, number]; side: -1 | 1; dy: number; col?: string };
const HOT = "#ff9a4d", COLD = "#8fd6ff";
const LABELS: Lab[] = [
  { a: 1.0, b: 5.8, text: "बर्फ", p: [0.2, 1.5, -0.4], side: 1, dy: 260, col: COLD },
  { a: 10.6, b: 13.5, text: "रेफ्रिजरेंट गैस", p: [0.95, -0.4, -0.72], side: 1, dy: -200, col: "#ffffff" },
  { a: 14.6, b: 16.9, text: "ठंडी पाइपें", sub: "इवेपोरेटर", p: [-0.4, 1.45, -0.45], side: -1, dy: -230, col: COLD },
  { a: 17.8, b: 20.3, text: "कंप्रेसर", sub: "गैस दबाकर गर्म", p: [0.32, -1.88, -1.05], side: -1, dy: -240, col: HOT },
  { a: 21.0, b: 23.5, text: "पीछे की जाली", sub: "कंडेंसर", p: [0.4, 0.5, -1.0], side: 1, dy: -230, col: HOT },
  { a: 24.4, b: 27.4, text: "पतली नली", sub: "कैपिलरी ट्यूब", p: [-0.9, 2.0, -0.8], side: 1, dy: -200, col: COLD },
  { a: 28.2, b: 30.8, text: "गर्म!", p: [0.0, 0.0, -1.0], side: 1, dy: -200, col: HOT },
];
const Label: React.FC<{ L: Lab; t: number }> = ({ L, t }) => {
  const k = fade(t, L.a, L.b, 0.3); if (k <= 0) return null;
  const pt = project(t, L.p);
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
  if (t > 6.2) return null;
  const k = spring({ frame: f - 6, fps: FPS, config: { damping: 11, stiffness: 120 } });
  const out = 1 - sstep(5.4, 6.1, t); const sweep = ((t * 0.55) % 1.6) * 100 - 30;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 200, opacity: out }}>
      <div style={{ transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * -40}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 112, lineHeight: 1.08, backgroundImage: `linear-gradient(100deg, #7fd6ff 0%, #ffffff ${sweep}%, #3aa8ff ${sweep + 18}%, #bfe9ff 100%)`, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 6px 0 #062642) drop-shadow(0 14px 26px rgba(0,0,0,0.7))" }}>फ्रिज ठंडा<br />कैसे करता है?</div>
        <div style={{ marginTop: 16, fontFamily: HF, fontWeight: 800, fontSize: 56, color: "#ffb38a", textShadow: outline(5) }}>पीछे से गर्म क्यों?</div>
      </div>
    </AbsoluteFill>
  );
};

const CHIPS = [
  { a: S.s2 + 0.3, b: S.s3 - 0.3, n: "1", text: "गर्मी अंदर से बाहर", col: "#8fd6ff" },
  { a: S.s3 + 0.3, b: S.s4 - 0.3, n: "2", text: "पीछे से गर्म क्यों?", col: "#ff9a4d" },
  { a: S.s4 + 0.3, b: S.s5 - 0.3, n: "!", text: "ज़रूरी बातें", col: "#ff5a5a" },
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

const X = <g><circle cx="0" cy="0" r="40" fill="#e53935" stroke="#fff" strokeWidth="6" /><path d="M-16-16L16 16M16-16L-16 16" stroke="#fff" strokeWidth="10" strokeLinecap="round" /></g>;
const ICONS: Record<number, { text: string; good: boolean; svg: React.ReactNode }> = {
  1: { text: "दीवार से 10 सेमी दूर", good: true, svg: <g><rect x="-120" y="-90" width="22" height="180" fill="#c9bba8" /><rect x="-50" y="-80" width="90" height="170" rx="10" fill="#dfe3e8" stroke="#333" strokeWidth="5" /><path d="M-92 0h36M-92 0l12-10M-92 0l12 10M-56 0l-12-10M-56 0l-12 10" stroke="#4caf50" strokeWidth="6" fill="none" strokeLinecap="round" />{[0, 1, 2].map((k) => <path key={k} d={`M${60 + k * 18} 40c-10-20 10-30 0-50`} stroke="#ff7a3c" strokeWidth="6" fill="none" strokeLinecap="round" />)}</g> },
  2: { text: "गर्म खाना सीधे नहीं!", good: false, svg: <g><path d="M-80 10a80 60 0 0 0 160 0z" fill="#f2f2f2" stroke="#333" strokeWidth="5" /><ellipse cx="0" cy="10" rx="80" ry="14" fill="#e0802a" />{[-35, 0, 35].map((x, k) => <path key={k} d={`M${x} -10c-14-20 14-30 0-55`} stroke="#ddd" strokeWidth="8" fill="none" strokeLinecap="round" />)}</g> },
  3: { text: "दरवाज़ा बार-बार नहीं", good: false, svg: <g><rect x="-60" y="-90" width="90" height="180" rx="10" fill="#dfe3e8" stroke="#333" strokeWidth="5" /><path d="M30-90l50 25v150l-50 5z" fill="#c9ced6" stroke="#333" strokeWidth="5" />{[0, 1, 2].map((k) => <path key={k} d={`M${40 + k * 22} ${-30 + k * 25}h40`} stroke="#4fc3ff" strokeWidth="7" strokeLinecap="round" />)}</g> },
};
const SafetyCard: React.FC<{ t: number }> = ({ t }) => {
  const tip = TIPS.find((p) => t >= p.a - 0.1 && t < p.b); if (!tip) return null;
  const k = fade(t, tip.a - 0.1, tip.b, 0.2);
  const s = spring({ frame: Math.round((t - tip.a + 0.1) * FPS), fps: FPS, config: { damping: 11, stiffness: 140 } });
  const mark = spring({ frame: Math.round((t - tip.a - 0.45) * FPS), fps: FPS, config: { damping: 8, stiffness: 180 } });
  const ic = ICONS[tip.n];
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 320, opacity: k }}>
      <div style={{ transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 40}px)`, width: 760, padding: "18px 20px 16px", borderRadius: 34, background: "linear-gradient(180deg, rgba(24,28,48,0.92), rgba(10,12,22,0.92))", border: `4px solid ${ic.good ? "#4caf50" : "#e53935"}`, boxShadow: `0 0 40px ${ic.good ? "#4caf5066" : "#e5393566"}, 0 14px 30px rgba(0,0,0,0.5)`, display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="300" height="230" viewBox="-150 -115 300 230">{ic.svg}<g transform={`translate(105 70) scale(${mark})`}>{ic.good ? OK : X}</g></svg>
        <div>
          <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 34, color: ic.good ? "#9df29d" : "#ff9c9c" }}>ज़रूरी बात {tip.n}/3</div>
          <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 58, lineHeight: 1.08, color: "#fff" }}>{ic.text}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const t0 = 43.0; if (t < t0) return null;
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
    Promise.all([document.fonts.load("800 80px 'Baloo 2'", "फ्रिज"), document.fonts.load("700 80px 'Baloo 2'", "फ्रिज"), document.fonts.load("800 80px 'Baloo 2'", "Subscribe 0123456789%°C AC"),
      document.fonts.load("700 50px 'Noto Sans Devanagari'", "फ्रिज"), document.fonts.load("700 50px 'Noto Sans Devanagari'", "Subscribe")]).then(() => continueRender(h), () => continueRender(h));
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
        <SafetyCard t={t} />
        <Subtitles t={t} /><CTA t={t} f={f} />
      </>}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
    </AbsoluteFill>
  );
};
