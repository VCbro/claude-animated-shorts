// "घड़ी कैसे काम करती है?" — 1080x1920, 30 fps, 75 s.
// One three.js world posed per frame + bloom + tone map; DOM overlays: hook title, chapter chips, part labels with
// leader lines (projected from the same pure camera/pose functions), Hindi subtitles, counters, badges, CTA.
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
import { FPS, FRAMES, S, FLASHES, clamp01, sstep, makeCamera, mechPose, quartzPose, poseMatrix, EXPLODE, explodeAt, windAt, handAngles, mechClock, timeLapse, quartzClock, quartzCount, quartzPose as qPose, sceneAt } from "./timeline";
import { LINES } from "../lines";

export const FILM_FRAMES = FRAMES;
const W = 1080, H = 1920;

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(), []);
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose(); return e; }, [gl]);
  // set synchronously so the very first rendered frame (stills) already has the environment
  const envI = (getInputProps() as { envI?: number }).envI ?? 0.15;
  scene.environment = env; scene.environmentIntensity = envI;
  const fx = useMemo(() => ({
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.05, luminanceSmoothing: 0.15, mipmapBlur: true, levels: 5, radius: 0.45 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
    vig: new VignetteEffect({ offset: 0.32, darkness: 0.55 }),
  }), []);
  const cam = camera as THREE.PerspectiveCamera;
  makeCamera(t, W / H, cam);
  world.update(t, cam);
  const dbg = (getInputProps() as { dbg?: string }).dbg ?? "";
  if (dbg.includes("nobokeh")) world.bokeh.visible = false;
  if (dbg.includes("nobg")) world.bg.visible = false;
  if (dbg.includes("nomech")) world.mech.visible = false;
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

// project a watch-local point to screen pixels
const projCam = new THREE.PerspectiveCamera();
const _m = new THREE.Matrix4();
const project = (t: number, which: "mech" | "quartz", p: [number, number, number]) => {
  makeCamera(t, W / H, projCam);
  poseMatrix(which === "mech" ? mechPose(t) : quartzPose(t), _m);
  const v = new THREE.Vector3(...p).applyMatrix4(_m).project(projCam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ok: v.z < 1 };
};

type Lab = { a: number; b: number; text: string; sub?: string; which: "mech" | "quartz"; p: (t: number) => [number, number, number]; side: -1 | 1; dy?: number; col?: string };
const handPt = (kind: "min" | "hour", len: number) => (t: number): [number, number, number] => { const a = handAngles(mechClock(t))[kind]; return [-Math.sin(a) * len, Math.cos(a) * len, 0.45]; };
const LABELS: Lab[] = [
  { a: 9.3, b: 13.7, text: "डायल", which: "mech", p: (t) => [-1.45, 0.9, 0.3 + EXPLODE.dial * explodeAt(t)], side: -1, dy: -40 },
  { a: 9.8, b: 13.7, text: "सुइयाँ", which: "mech", p: (t) => [0.75, 0.55, 0.42 + EXPLODE.min * explodeAt(t)], side: 1, dy: -60 },
  { a: 10.4, b: 13.7, text: "क्राउन", sub: "चाबी + समय सेट", which: "mech", p: (t) => [2.4 + EXPLODE.crownX * explodeAt(t), 0, 0.04], side: 1, dy: 70 },
  { a: 11.2, b: 13.7, text: "गियर्स", sub: "मूवमेंट", which: "mech", p: () => [-0.55, 0.75, 0.1], side: -1, dy: 90 },
  { a: 17.4, b: 23.0, text: "मेनस्प्रिंग", sub: "ऊर्जा का भंडार", which: "mech", p: () => [-0.52 + 0.45, 0.73 + 0.2, 0.0], side: 1, dy: -150 },
  { a: 24.2, b: 27.6, text: "गियर ट्रेन", which: "mech", p: () => [0.19 + 0.3, -0.59 + 0.2, 0.06], side: 1, dy: -120 },
  { a: 28.7, b: 32.9, text: "बैलेंस व्हील", which: "mech", p: () => [1.10 - 0.36, -0.55 + 0.2, 0.24], side: -1, dy: -170 },
  { a: 30.0, b: 32.9, text: "हेयरस्प्रिंग", which: "mech", p: () => [1.10 + 0.12, -0.55 + 0.1, 0.27], side: 1, dy: 220 },
  { a: 33.9, b: 39.7, text: "एस्केपमेंट व्हील", which: "mech", p: () => [0.42 - 0.12, -1.23 - 0.16, 0.12], side: -1, dy: 170 },
  { a: 35.0, b: 39.7, text: "पैलेट फ़ोर्क", which: "mech", p: () => [0.70 + 0.08, -0.95 + 0.08, 0.12], side: 1, dy: -190 },
  { a: 43.9, b: 45.3, text: "सेकंड की सुई", sub: "60 सेकंड = 1 चक्कर", which: "mech", p: () => [0.12, -0.95, 0.4], side: 1, dy: -200 },
  { a: 46.0, b: 47.5, text: "मिनट की सुई", sub: "60 मिनट = 1 चक्कर", which: "mech", p: handPt("min", 1.0), side: -1, dy: -210 },
  { a: 48.3, b: 50.8, text: "घंटे की सुई", sub: "12 घंटे = 1 चक्कर", which: "mech", p: handPt("hour", 0.7), side: 1, dy: 260 },
  { a: 53.9, b: 56.1, text: "बैटरी", which: "quartz", p: () => [0.55, 0.45, -0.46], side: 1, dy: -170 },
  { a: 54.7, b: 56.1, text: "सर्किट (चिप)", which: "quartz", p: () => [-0.42, 0.42, -0.4], side: -1, dy: -230 },
  { a: 57.3, b: 61.4, text: "क्वार्ट्ज़ क्रिस्टल", which: "quartz", p: () => [-0.6, -0.55, -0.45], side: -1, dy: -330, col: "#8fe3ff" },
  { a: 61.7, b: 62.8, text: "मोटर कॉइल", which: "quartz", p: () => [0.45, -0.75, -0.5], side: 1, dy: -200 },
  { a: 65.8, b: 75, text: "मैकेनिकल", sub: "स्प्रिंग + गियर्स", which: "mech", p: () => [0, 3.3, 0.3], side: 1, dy: 0, col: "#ffd27a" },
  { a: 66.3, b: 75, text: "क्वार्ट्ज़", sub: "बैटरी + क्रिस्टल", which: "quartz", p: () => [0, 3.3, 0.3], side: -1, dy: 0, col: "#8fe3ff" },
];

const Label: React.FC<{ L: Lab; t: number }> = ({ L, t }) => {
  const k = fade(t, L.a, L.b, 0.3);
  if (k <= 0) return null;
  const pt = project(t, L.which, L.p(t));
  const grow = Easing.out(Easing.cubic)(clamp01((t - L.a) / 0.45));
  const isEnd = L.a > 65;
  const estW = Math.max(L.text.length * 30, (L.sub?.length ?? 0) * 19) + 70;
  const lx0 = pt.x + L.side * 170;
  const lx = isEnd ? pt.x : L.side > 0 ? Math.min(W - 40 - estW * 0.88, Math.max(40 + estW * 0.12, lx0)) : Math.max(40 + estW * 0.88, Math.min(W - 40 - estW * 0.12, lx0));
  const ly = isEnd ? pt.y + 40 : pt.y + (L.dy ?? -120);
  const col = L.col ?? "#ffd27a";
  return (
    <AbsoluteFill style={{ opacity: k }}>
      {!isEnd && (
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <line x1={pt.x} y1={pt.y} x2={pt.x + (lx - pt.x) * grow} y2={pt.y + (ly - pt.y) * grow} stroke={col} strokeWidth={4} />
          <circle cx={pt.x} cy={pt.y} r={11} fill="none" stroke={col} strokeWidth={4} />
          <circle cx={pt.x} cy={pt.y} r={4.5} fill={col} />
        </svg>
      )}
      <div style={{ position: "absolute", left: lx, top: ly, transform: `translate(${isEnd ? -50 : L.side < 0 ? -88 : -12}%, -50%) scale(${0.6 + 0.4 * grow})`, transformOrigin: L.side < 0 ? "right center" : "left center" }}>
        <div style={{ whiteSpace: "nowrap", fontFamily: HF, fontWeight: 800, fontSize: isEnd ? 66 : 56, lineHeight: 1.1, color: "#fff", padding: "10px 30px 4px", borderRadius: 999, background: "rgba(8,12,24,0.72)", border: `3px solid ${col}`, boxShadow: `0 0 28px ${col}55, 0 8px 22px rgba(0,0,0,0.45)` }}>
          {L.text}
          {L.sub ? <div style={{ fontSize: 34, fontWeight: 700, color: col, marginTop: -4, paddingBottom: 6 }}>{L.sub}</div> : null}
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
  const words = cur.text.split(" ");
  const u = clamp01((t - cur.t0) / Math.max(0.2, cur.t1 - cur.t0));
  const lit = Math.ceil(u * words.length + 0.01);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", top: 1335 }}>
      <div style={{ maxWidth: 960, textAlign: "center", transform: `scale(${0.82 + 0.18 * pop})`, fontFamily: SF, fontWeight: 700, fontSize: 66, lineHeight: 1.32 }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: i < lit ? (/\d/.test(w) || w.startsWith("Subscribe") ? "#ff5a5a" : "#ffe27a") : "#ffffff", textShadow: outline(5) + ", 0 6px 18px rgba(0,0,0,0.7)" }}>{w}{i < words.length - 1 ? " " : ""}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const HookTitle: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  if (t > 5.4) return null;
  const k = spring({ frame: f - 6, fps: FPS, config: { damping: 11, stiffness: 120 } });
  const out = 1 - sstep(4.3, 5.1, t);
  const sweep = ((t * 0.55) % 1.6) * 100 - 30;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 210, opacity: out }}>
      <div style={{ transform: `scale(${0.5 + 0.5 * k}) translateY(${(1 - k) * -40}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 118, lineHeight: 1.08, backgroundImage: `linear-gradient(100deg, #f7c56a 0%, #fff3cf ${sweep}%, #e7a43c ${sweep + 18}%, #ffd98a 100%)`, WebkitBackgroundClip: "text", color: "transparent", filter: "drop-shadow(0 6px 0 #3a2208) drop-shadow(0 14px 26px rgba(0,0,0,0.7))" }}>घड़ी कैसे<br />चलती है?</div>
        <div style={{ marginTop: 18, fontFamily: HF, fontWeight: 700, fontSize: 50, color: "#e8eefc", textShadow: outline(4) }}>अंदर की अद्भुत मशीन</div>
      </div>
    </AbsoluteFill>
  );
};

const CHIPS: { a: number; b: number; n: string; text: string; col: string }[] = [
  { a: S.s2 + 0.3, b: S.s3 - 0.3, n: "", text: "घड़ी के अंदर क्या है?", col: "#ffd27a" },
  { a: S.s3 + 0.3, b: S.s4 - 0.3, n: "1", text: "मेनस्प्रिंग = ऊर्जा", col: "#ffb347" },
  { a: S.s4 + 0.3, b: S.s5 - 0.3, n: "2", text: "बैलेंस व्हील = समय की लय", col: "#ffd27a" },
  { a: S.s5 + 0.3, b: S.s6 - 0.3, n: "3", text: "गियर्स से सुइयाँ", col: "#ffd27a" },
  { a: S.s6 + 0.3, b: S.s7 - 0.3, n: "4", text: "क्वार्ट्ज़ घड़ी", col: "#8fe3ff" },
  { a: S.s7 + 0.4, b: 70.0, n: "", text: "मैकेनिकल vs क्वार्ट्ज़", col: "#ffffff" },
];
const Chip: React.FC<{ t: number }> = ({ t }) => {
  const c = CHIPS.find((c) => t >= c.a - 0.05 && t < c.b + 0.3);
  if (!c) return null;
  const k = fade(t, c.a, c.b, 0.3);
  const slide = Easing.out(Easing.cubic)(clamp01((t - c.a) / 0.4));
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 200, opacity: k }}>
      <div style={{ transform: `translateY(${(1 - slide) * -50}px)`, display: "flex", alignItems: "center", gap: 18, padding: "12px 36px 8px 14px", borderRadius: 999, background: "linear-gradient(180deg, rgba(20,26,48,0.88), rgba(8,10,20,0.88))", border: `3px solid ${c.col}`, boxShadow: `0 0 34px ${c.col}44` }}>
        {c.n ? <div style={{ width: 72, height: 72, borderRadius: 99, background: c.col, color: "#101425", fontFamily: HF, fontWeight: 800, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 6 }}>{c.n}</div> : <div style={{ width: 8 }} />}
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 58, color: "#fff", whiteSpace: "nowrap" }}>{c.text}</div>
      </div>
    </AbsoluteFill>
  );
};

const Badge: React.FC<{ t: number }> = ({ t }) => {
  let text = "", k = 0;
  if (t > 28.5 && t < 40.0) { text = "5x स्लो मोशन"; k = fade(t, 28.6, 39.8, 0.3); }
  else if (t > 43.3 && t < 51.6) { text = `टाइम-लैप्स ×${Math.round(timeLapse(t))}`; k = fade(t, 43.4, 51.4, 0.3); }
  if (k <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "flex-end", top: 330, right: 50, opacity: k }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 24px 4px", borderRadius: 16, background: "rgba(200,30,40,0.85)", fontFamily: HF, fontWeight: 800, fontSize: 40, color: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}>
        <svg width="34" height="34" viewBox="0 0 24 24"><path d={t < 41 ? "M7 4h3v16H7zM14 4h3v16h-3z" : "M3 5l9 7-9 7zM12 5l9 7-9 7z"} fill="#fff" /></svg>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const EnergyMeter: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 20.2, 27.8, 0.3);
  if (k <= 0) return null;
  const w = clamp01((windAt(t) - 0.2) / 0.8);
  return (
    <AbsoluteFill style={{ alignItems: "flex-start", top: 340, left: 60, opacity: k }}>
      <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 42, color: "#ffcf6a", textShadow: outline(3) }}>⚡ ऊर्जा</div>
      <div style={{ width: 330, height: 40, borderRadius: 12, border: "4px solid #ffcf6a", background: "rgba(10,10,20,0.6)", overflow: "hidden", marginTop: 4 }}>
        <div style={{ width: `${w * 100}%`, height: "100%", background: "linear-gradient(90deg, #ff7a00, #ffd34d)", boxShadow: "0 0 18px #ffb000" }} />
      </div>
    </AbsoluteFill>
  );
};

const Counter: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 57.4, 61.5, 0.3);
  if (k <= 0) return null;
  const n = quartzCount(t);
  const done = n >= 32768;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 300, opacity: k }}>
      <div style={{ textAlign: "center", padding: "10px 40px 14px", borderRadius: 28, background: "rgba(4,18,30,0.75)", border: "3px solid #8fe3ff", boxShadow: done ? "0 0 50px #4fd3ff" : "0 0 20px #4fd3ff55" }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 124, lineHeight: 1.0, color: done ? "#bff2ff" : "#ffffff", textShadow: "0 0 24px #39c6ff" }}>{n.toLocaleString("en-US")}</div>
        <div style={{ fontFamily: HF, fontWeight: 700, fontSize: 44, color: "#8fe3ff" }}>कंपन हर सेकंड</div>
      </div>
    </AbsoluteFill>
  );
};

const TickBadge: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 63.9, 64.95, 0.15);
  if (k <= 0) return null;
  const fr = quartzClock(t) % 1;
  const pop = 1 + 0.25 * Math.exp(-fr * 8);
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 430, left: 330, opacity: k }}>
      <div style={{ transform: `scale(${pop})`, fontFamily: HF, fontWeight: 800, fontSize: 80, color: "#ff5a5a", textShadow: outline(5) }}>टिक!</div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  if (t < 70.0) return null;
  const k = spring({ frame: f - Math.round(70.1 * FPS), fps: FPS, config: { damping: 10, stiffness: 140 } });
  const press = t > 72.6 && t < 73.0 ? 0.92 : 1;
  const pressed = t > 72.8;
  const ring = t > 73.0 ? Math.sin((t - 73) * 22) * 18 * Math.max(0, 1 - (t - 73) / 1.2) : 0;
  // hand pointer
  const hx = interpolate(t, [71.4, 72.6], [380, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const ha = clamp01((t - 71.3) / 0.3) * (1 - clamp01((t - 73.6) / 0.4));
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 1580 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, transform: `scale(${k})` }}>
        <div style={{ transform: `scale(${press})`, display: "flex", alignItems: "center", gap: 16, background: pressed ? "linear-gradient(#5b5f6b,#3b3e47)" : "linear-gradient(#ff2d2d,#cc0f0f)", color: "#fff", fontFamily: HF, fontWeight: 800, fontSize: 58, padding: "14px 46px 8px", borderRadius: 70, border: "5px solid #fff", boxShadow: pressed ? "0 6px 16px rgba(0,0,0,0.4)" : "0 0 40px rgba(255,40,40,0.6), 0 10px 26px rgba(0,0,0,0.45)" }}>
          <svg width="56" height="40" viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#fff" /><path d="M11 5l8 5-8 5z" fill={pressed ? "#4a4d56" : "#e01414"} /></svg>
          {pressed ? "Subscribed ✓" : "Subscribe"}
        </div>
        <svg width="96" height="96" viewBox="0 0 64 64" style={{ transform: `rotate(${ring}deg)`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>
          <path d="M32 6c-2 0-4 2-4 4v2C19 14 14 22 14 31v12l-5 6v3h46v-3l-5-6V31c0-9-5-17-14-19v-2c0-2-2-4-4-4z" fill="#ffd23a" stroke="#1d1030" strokeWidth="3" />
          <circle cx="32" cy="57" r="5" fill="#ffd23a" stroke="#1d1030" strokeWidth="3" />
        </svg>
      </div>
      <svg width="120" height="140" viewBox="0 0 60 70" style={{ position: "absolute", top: 70, left: 520 + hx, opacity: ha, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))" }}>
        <path d="M22 4c3 0 5 2 5 5v20l3-1c3-1 6 1 6 4l2-1c3 0 5 2 5 4l2-1c3 0 5 2 5 5v14c0 9-7 16-16 16h-4c-6 0-11-3-14-8L4 46c-2-3 0-7 4-7 2 0 3 1 5 3l4 4V9c0-3 2-5 5-5z" fill="#fff" stroke="#1d1030" strokeWidth="3" />
      </svg>
    </AbsoluteFill>
  );
};

const Sparkles: React.FC<{ t: number }> = ({ t }) => {
  if (t < 65.2) return null;
  const pts = [[230, 820], [420, 760], [300, 1050], [700, 780], [880, 990], [760, 1110], [560, 900], [150, 980]];
  return (
    <AbsoluteFill>
      {pts.map(([x, y], i) => {
        const ph = (t * 0.8 + i * 0.37) % 1;
        const s = Math.sin(Math.PI * ph) ** 3;
        return <svg key={i} width="80" height="80" viewBox="-40 -40 80 80" style={{ position: "absolute", left: x - 40, top: y - 40, opacity: s, transform: `scale(${0.4 + s}) rotate(${t * 40 + i * 30}deg)` }}><path d="M0-36L6-6 36 0 6 6 0 36-6 6-36 0-6-6z" fill="#fff6d8" /><circle r="5" fill="#fff" /></svg>;
      })}
    </AbsoluteFill>
  );
};

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load("800 80px 'Baloo 2'", "घड़ी"), document.fonts.load("700 80px 'Baloo 2'", "घड़ी"), document.fonts.load("800 80px 'Baloo 2'", "Subscribe 32,768"),
      document.fonts.load("700 50px 'Noto Sans Devanagari'", "घड़ी"), document.fonts.load("700 50px 'Noto Sans Devanagari'", "Subscribe"),
    ]).then(() => continueRender(h), () => continueRender(h));
  }, [h]);
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  useFonts();
  const ov = (getInputProps() as { overlay?: boolean }).overlay ?? true;
  const flash = FLASHES.reduce((m, c) => Math.max(m, Math.exp(-(((t - c) / 0.13) ** 2))), 0);
  const black = 1 - clamp01(t / 0.5);
  const endFade = sstep(74.4, 75, t);
  void sceneAt; void qPose; void FILM_FRAMES;
  return (
    <AbsoluteFill style={{ background: "#05060a" }}>
      <ThreeCanvas width={W} height={H} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 30, near: 0.05, far: 400 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0.01 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #ffffff 0%, #fff1d0 40%, rgba(255,220,160,0.6) 100%)", opacity: flash * 0.95 }} />}
      {ov && <>
        <HookTitle t={t} f={f} />
        <Chip t={t} />
        {LABELS.map((L, i) => <Label key={i} L={L} t={t} />)}
        <Badge t={t} />
        <EnergyMeter t={t} />
        <Counter t={t} />
        <TickBadge t={t} />
        <Sparkles t={t} />
        <Subtitles t={t} />
        <CTA t={t} f={f} />
      </>}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
      {endFade > 0 && <AbsoluteFill style={{ background: "#000", opacity: endFade * 0.0 }} />}
    </AbsoluteFill>
  );
};
