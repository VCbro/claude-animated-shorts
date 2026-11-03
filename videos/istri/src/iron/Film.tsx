// "प्रेस कैसे काम करती है? + सावधानियाँ" — 1080x1920, 30 fps.
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
import { FPS, FRAMES, DUR, S, FLASHES, TIPS, clamp01, sstep, makeCamera, ironMatrix, heat, powerOn, sceneAt } from "./timeline";
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
const project = (t: number, p: [number, number, number], local = true) => {
  makeCamera(t, W / H, projCam);
  const v = new THREE.Vector3(...p); if (local) v.applyMatrix4(ironMatrix(t, _m)); v.project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};
type Lab = { a: number; b: number; text: string; sub?: string; p: [number, number, number]; side: -1 | 1; dy: number; col?: string; local?: boolean };
const LABELS: Lab[] = [
  { a: 8.0, b: 16.0, text: "हीटिंग एलिमेंट", sub: "निक्रोम का तार", p: [0.5, 0.17, 0.6], side: 1, dy: -230, col: "#ff9a4d" },
  { a: 10.4, b: 13.2, text: "बिजली", p: [-1.75, 0.5, 0.1], side: -1, dy: -190, col: "#ffe066" },
  { a: 17.0, b: 20.0, text: "सोलप्लेट", sub: "गर्म धातु की प्लेट", p: [0.6, 0.05, 0.85], side: 1, dy: 190, col: "#ff9a4d" },
  { a: 28.0, b: 31.3, text: "थर्मोस्टैट", p: [-0.75, 0.48, 0.08], side: -1, dy: -250 },
  { a: 29.4, b: 36.2, text: "बाईमेटल पट्टी", sub: "पीतल + स्टील", p: [-0.35, 0.42, 0.08], side: 1, dy: 230 },
  { a: 36.6, b: 39.2, text: "इंडिकेटर लाइट", p: [0.3, 0.8, 0.3], side: 1, dy: -190, col: "#ff9a4d" },
  { a: 39.7, b: 42.2, text: "पानी की टंकी", p: [0.85, 0.62, 0.3], side: 1, dy: -200, col: "#8fe3ff" },
  { a: 42.0, b: 45.0, text: "भाप", p: [-0.2, -0.05, 1.25], side: -1, dy: -170, col: "#ffffff" },
];
const Label: React.FC<{ L: Lab; t: number }> = ({ L, t }) => {
  const k = fade(t, L.a, L.b, 0.3); if (k <= 0) return null;
  const pt = project(t, L.p, L.local ?? true);
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
  if (t > 6.0) return null;
  const k = spring({ frame: f - 6, fps: FPS, config: { damping: 11, stiffness: 120 } });
  const out = 1 - sstep(5.0, 5.9, t); const sweep = ((t * 0.55) % 1.6) * 100 - 30;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 200, opacity: out }}>
      <div style={{ transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * -40}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 112, lineHeight: 1.08, backgroundImage: `linear-gradient(100deg, #ffb347 0%, #fff1cf ${sweep}%, #ff7b1c ${sweep + 18}%, #ffd27a 100%)`, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 6px 0 #3a1a08) drop-shadow(0 14px 26px rgba(0,0,0,0.7))" }}>प्रेस इतनी गर्म<br />कैसे होती है?</div>
        <div style={{ marginTop: 16, fontFamily: HF, fontWeight: 700, fontSize: 50, color: "#e8eefc", textShadow: outline(4) }}>+ ज़रूरी सावधानियाँ</div>
      </div>
    </AbsoluteFill>
  );
};

const CHIPS = [
  { a: S.s2 + 0.3, b: S.s3 - 0.3, n: "1", text: "हीटिंग एलिमेंट", col: "#ff9a4d" },
  { a: S.s3 + 0.3, b: S.s4 - 0.3, n: "2", text: "सोलप्लेट", col: "#ffd27a" },
  { a: S.s4 + 0.3, b: S.s5 - 0.3, n: "3", text: "थर्मोस्टैट", col: "#ffd27a" },
  { a: S.s5 + 0.3, b: S.s6 - 0.3, n: "4", text: "स्टीम", col: "#8fe3ff" },
  { a: S.s6 + 0.3, b: S.s7 - 0.2, n: "!", text: "सावधानियाँ", col: "#ff5a5a" },
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

// S2: electricity -> resistance -> heat
const FlowChips: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 10.3, 15.9, 0.3); if (k <= 0) return null;
  const items = [{ a: 10.35, text: "बिजली", col: "#ffe066", icon: "M13 2L4 14h7l-1 8 9-12h-7z" }, { a: 12.0, text: "विरोध", col: "#ff9a4d", icon: "M2 12h4l2-6 4 12 4-12 2 6h4" }, { a: 13.8, text: "गर्मी", col: "#ff5a3c", icon: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 1 3 3 4 0-4-1-6 0-9z" }];
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {items.map((it, i) => {
          const s = spring({ frame: Math.round((t - it.a) * FPS), fps: FPS, config: { damping: 12, stiffness: 150 } });
          return (
            <React.Fragment key={i}>
              {i > 0 && <svg width="56" height="40" viewBox="0 0 56 40" style={{ opacity: s }}><path d="M4 20h40M34 8l14 12-14 12" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              <div style={{ transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 10, padding: "10px 24px 4px 16px", borderRadius: 22, background: "rgba(10,12,22,0.82)", border: `3px solid ${it.col}`, boxShadow: `0 0 26px ${it.col}66` }}>
                <svg width="46" height="46" viewBox="0 0 24 24"><path d={it.icon} fill={i === 1 ? "none" : it.col} stroke={it.col} strokeWidth={i === 1 ? 2.6 : 1} strokeLinejoin="round" /></svg>
                <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 50, color: "#fff" }}>{it.text}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// S3: fibres straighten under heat + pressure
const Fibers: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 20.3, 24.4, 0.3); if (k <= 0) return null;
  const s = 1 - sstep(21.4, 23.3, t);
  const paths = [0, 1, 2, 3, 4, 5].map((r) => { let d = ""; for (let x = 0; x <= 520; x += 8) { const y = 40 + r * 26 + s * (14 * Math.sin(x * 0.045 + r * 1.7) + 8 * Math.sin(x * 0.11 + r)); d += (x ? "L" : "M") + x + " " + y.toFixed(1); } return d; });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}>
      <div style={{ padding: "14px 26px 10px", borderRadius: 26, background: "rgba(10,12,22,0.82)", border: "3px solid #ffd27a", boxShadow: "0 0 30px #ffd27a44", textAlign: "center" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 44, color: s > 0.5 ? "#ffb4a2" : "#9df29d" }}>{s > 0.5 ? "उलझे रेशे" : "सीधे रेशे ✓"}</div>
        <svg width="520" height="210" viewBox="0 0 520 210">{paths.map((d, i) => <path key={i} d={d} stroke={i % 2 ? "#9cc2ff" : "#e9f0ff"} strokeWidth="7" fill="none" strokeLinecap="round" />)}</svg>
      </div>
    </AbsoluteFill>
  );
};

// S4: thermometer + power state
const Thermo: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 25.2, 39.2, 0.3); if (k <= 0) return null;
  const h = clamp01(heat(t)); const temp = Math.round(60 + 140 * h); const on = powerOn(t) > 0.5;
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <div style={{ position: "absolute", left: 50, top: 340, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 54, height: 330, borderRadius: 30, border: "5px solid #fff", background: "rgba(10,12,22,0.7)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${20 + 80 * h}%`, background: "linear-gradient(0deg, #ff3b1f, #ffb347)", boxShadow: "0 0 20px #ff5a1f" }} />
        </div>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 52, color: "#fff", textShadow: outline(4) }}>{temp}°C</div>
      </div>
      <div style={{ position: "absolute", right: 50, top: 340, padding: "10px 26px 4px", borderRadius: 18, background: on ? "rgba(30,160,70,0.9)" : "rgba(200,30,40,0.9)", fontFamily: HF, fontWeight: 800, fontSize: 44, color: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.45)" }}>{on ? "बिजली चालू" : "बिजली बंद"}</div>
    </AbsoluteFill>
  );
};

// S6: safety cards
const X = <g><circle cx="0" cy="0" r="40" fill="#e53935" stroke="#fff" strokeWidth="6" /><path d="M-16-16L16 16M16-16L-16 16" stroke="#fff" strokeWidth="10" strokeLinecap="round" /></g>;
const OK = <g><circle cx="0" cy="0" r="40" fill="#2e9d4a" stroke="#fff" strokeWidth="6" /><path d="M-18 0l12 12 22-24" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>;
const ICONS: Record<number, { text: string; good: boolean; svg: React.ReactNode }> = {
  1: { text: "गीले हाथ नहीं!", good: false, svg: <g><path d="M-60 60c-10-30-6-70 4-90 4-8 14-6 14 4v40-70c0-10 14-10 14 0v66-80c0-10 14-10 14 0v80-66c0-10 14-10 14 0v76c6-10 14-22 22-20 8 2 6 12 2 20-14 26-26 50-50 64z" fill="#ffd2b0" stroke="#3a2416" strokeWidth="5" />{[[-80, -40], [70, -60], [60, 20], [-70, 30]].map(([x, y], i) => <path key={i} d={`M${x} ${y}c-8 12-10 18-10 22a10 10 0 0 0 20 0c0-4-2-10-10-22z`} fill="#4fc3ff" stroke="#fff" strokeWidth="3" />)}</g> },
  2: { text: "कटा तार = खतरा!", good: false, svg: <g><path d="M-110 30c40 0 50-40 90-40" stroke="#eee" strokeWidth="20" fill="none" strokeLinecap="round" /><path d="M20-10c40 0 50 40 90 40" stroke="#eee" strokeWidth="20" fill="none" strokeLinecap="round" /><path d="M-20-10l14 2 6-8M20-10l-14 4-4 8" stroke="#e8792a" strokeWidth="5" fill="none" /><path d="M8-70l-26 40h22l-14 36 34-48h-22z" fill="#ffd23a" stroke="#3a2416" strokeWidth="4" /></g> },
  3: { text: "पहले प्लग निकालें", good: true, svg: <g><rect x="-110" y="-40" width="70" height="80" rx="10" fill="#f5f5f0" stroke="#333" strokeWidth="5" /><circle cx="-85" cy="-10" r="6" fill="#333" /><circle cx="-65" cy="-10" r="6" fill="#333" /><rect x="10" y="-30" width="60" height="50" rx="10" fill="#f5f5f0" stroke="#333" strokeWidth="5" /><path d="M10-15h-20M10 5h-20" stroke="#d6b25e" strokeWidth="6" /><path d="M75-5h40M100-20l16 15-16 15" stroke="#4caf50" strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M40 40c-8 12-10 18-10 22a10 10 0 0 0 20 0c0-4-2-10-10-22z" fill="#4fc3ff" stroke="#fff" strokeWidth="3" /></g> },
  4: { text: "प्रेस खड़ी रखें", good: true, svg: <g><path d="M-30 70V-60c0-20 30-30 50-10l20 20v120z" fill="#1fa3b8" stroke="#fff" strokeWidth="5" /><rect x="-50" y="70" width="110" height="10" rx="5" fill="#ccc" /><path d="M-30-40c-30 0-40 30-40 60s10 50 40 50" stroke="#1fa3b8" strokeWidth="14" fill="none" /></g> },
  5: { text: "बच्चों से दूर रखें", good: false, svg: <g><circle cx="-40" cy="-40" r="28" fill="#ffd2b0" stroke="#3a2416" strokeWidth="5" /><path d="M-72 60c0-40 10-60 32-60s32 20 32 60" fill="#7cc4ff" stroke="#3a2416" strokeWidth="5" /><path d="M60-60c6 20 26 30 26 54a26 26 0 0 1-52 0c0-14 8-22 14-30 4 10 6 14 12 18 2-16-6-26 0-42z" fill="#ff5a3c" stroke="#fff" strokeWidth="4" /></g> },
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
          <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 34, color: ic.good ? "#9df29d" : "#ff9c9c" }}>सावधानी {tip.n}/5</div>
          <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 58, lineHeight: 1.08, color: "#fff" }}>{ic.text}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndBadge: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 60.8, 64.5, 0.3); if (k <= 0) return null;
  const s = spring({ frame: Math.round((t - 60.8) * FPS), fps: FPS, config: { damping: 10, stiffness: 140 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 250, opacity: k }}>
      <div style={{ transform: `scale(${s})`, display: "flex", alignItems: "center", gap: 18, padding: "14px 40px 8px 18px", borderRadius: 999, background: "rgba(20,120,50,0.92)", border: "4px solid #fff", boxShadow: "0 0 40px #4caf5088" }}>
        <svg width="80" height="80" viewBox="-45 -45 90 90">{OK}</svg>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 66, color: "#fff" }}>सुरक्षित रहें!</div>
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const t0 = 64.0; if (t < t0) return null;
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
    Promise.all([document.fonts.load("800 80px 'Baloo 2'", "प्रेस"), document.fonts.load("700 80px 'Baloo 2'", "प्रेस"), document.fonts.load("800 80px 'Baloo 2'", "Subscribe 0123°C"),
      document.fonts.load("700 50px 'Noto Sans Devanagari'", "प्रेस"), document.fonts.load("700 50px 'Noto Sans Devanagari'", "Subscribe")]).then(() => continueRender(h), () => continueRender(h));
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
        <FlowChips t={t} /><Fibers t={t} /><Thermo t={t} /><SafetyCard t={t} /><EndBadge t={t} />
        <Subtitles t={t} /><CTA t={t} f={f} />
      </>}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
    </AbsoluteFill>
  );
};
