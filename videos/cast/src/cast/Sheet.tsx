// Cast showcase stills: PROPS {"who":"ALL"} lineup, or {"who":"GEARO"} -> both bundles side by side.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BloomEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import "@fontsource/baloo-2/devanagari-800.css";
import "@fontsource/baloo-2/latin-800.css";
import { HEROES, makeHero, pose, HeroName, PoseName } from "./cast";

const W = 1080, H = 1920;
const NAMES = Object.keys(HEROES) as HeroName[];
const LINEUP_POSES: PoseName[] = ["hero", "wave", "thumbs", "point", "think", "idle"];
const props = () => getInputProps() as { who?: string; pose?: PoseName };

const Scene: React.FC = () => {
  const t = useCurrentFrame() / 30; const { scene, gl, camera } = useThree(); const who = props().who ?? "ALL";
  const env = useMemo(() => { const pm = new THREE.PMREMGenerator(gl); const e = pm.fromScene(new RoomEnvironment(), 0.03).texture; pm.dispose(); return e; }, [gl]);
  scene.environment = env; scene.environmentIntensity = 0.35;
  const root = useMemo(() => {
    const r = new THREE.Group();
    const k = new THREE.DirectionalLight(0xfff1df, 2.8); k.position.set(-4, 7, 8); const rim = new THREE.DirectionalLight(0x9fd0ff, 3); rim.position.set(5, 4, -6); r.add(k, rim, new THREE.AmbientLight(0x506080, 0.7));
    const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshPhysicalMaterial({ color: 0x141b2e, roughness: 0.3, clearcoat: 0.6 })); floor.rotation.x = -Math.PI / 2; r.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.75, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, 0.3), toneMapped: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; r.add(ring);
    const list: { n: HeroName; b: "B1" | "B2"; p: PoseName; x: number; z: number; ry: number }[] = who === "ALL"
      ? NAMES.map((n, i) => ({ n, b: "B1", p: LINEUP_POSES[i], x: (i % 3 - 1) * 1.75 + (i < 3 ? 0 : 0), z: i < 3 ? -1.7 : 1.1, ry: (1 - (i % 3)) * 0.22 }))
      : [{ n: who as HeroName, b: "B1", p: props().pose ?? "hero", x: -0.95, z: 0, ry: 0.3 }, { n: who as HeroName, b: "B2", p: "thumbs", x: 0.95, z: 0, ry: -0.3 }];
    const heroes = list.map((c) => { const h = makeHero(c.n, c.b); h.position.set(c.x, 0, c.z); h.rotation.y = c.ry; r.add(h); return { h, c }; });
    r.userData.heroes = heroes; return r;
  }, [who]);
  (root.userData.heroes as { h: ReturnType<typeof makeHero>; c: { p: PoseName } }[]).forEach(({ h, c }, i) => pose(h, c.p, t + i * 0.7));
  const cam = camera as THREE.PerspectiveCamera; cam.fov = 30; cam.aspect = W / H;
  if (who === "ALL") { cam.position.set(0, 4.6, 16.5); cam.lookAt(0, 1.3, 0); } else { cam.position.set(0, 2.0, 10.5); cam.lookAt(0, 1.45, 0); }
  cam.updateProjectionMatrix();
  const fx = useMemo(() => ({ bloom: new BloomEffect({ intensity: 0.6, luminanceThreshold: 1.0, mipmapBlur: true }), tone: new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), vig: new VignetteEffect({ offset: 0.3, darkness: 0.55 }) }), []);
  return (<><color attach="background" args={["#0a1022"]} /><primitive object={root} dispose={null} />
    <EffectComposer multisampling={4}><primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.vig} dispose={null} /></EffectComposer></>);
};

const HF = "'Baloo 2', sans-serif";
const pill = (txt: string, sub: string, col: string): React.ReactNode => (
  <div style={{ textAlign: "center", padding: "8px 22px 4px", borderRadius: 20, background: "rgba(8,12,24,0.8)", border: `3px solid ${col}`, fontFamily: HF, fontWeight: 800, color: "#fff" }}>
    <div style={{ fontSize: 40, lineHeight: 1.05 }}>{txt}</div><div style={{ fontSize: 24, color: col }}>{sub}</div></div>);

export const Sheet: React.FC = () => {
  const who = props().who ?? "ALL";
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => { document.fonts.load("800 60px 'Baloo 2'", "गियरो GEARO").then(() => continueRender(h), () => continueRender(h)); }, [h]);
  const col = (n: HeroName) => "#" + (n === "ROBO" ? 0x3aa8ff : HEROES[n].bundles.B1.visor).toString(16).padStart(6, "0");
  return (
    <AbsoluteFill style={{ background: "#0a1022" }}>
      <ThreeCanvas width={W} height={H} gl={{ antialias: false }} camera={{ fov: 30 }}><Scene /></ThreeCanvas>
      <AbsoluteFill style={{ alignItems: "center", top: 120 }}>
        <div style={{ fontFamily: HF, fontWeight: 800, fontSize: who === "ALL" ? 92 : 110, color: "#ffc94d", textShadow: "0 6px 0 #2a1804, 0 12px 30px rgba(0,0,0,0.6)", textAlign: "center", lineHeight: 1.05 }}>
          {who === "ALL" ? <>कैसे चलता है?<br /><span style={{ fontSize: 60, color: "#fff" }}>हीरो टीम</span></> : <>{HEROES[who as HeroName].hindi}<br /><span style={{ fontSize: 56, color: "#fff" }}>{who} · {HEROES[who as HeroName].role}</span></>}
        </div>
      </AbsoluteFill>
      {who === "ALL" ? <AbsoluteFill style={{ top: 1520, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, padding: "0 40px", height: 300 }}>
        {NAMES.map((n) => <div key={n}>{pill(HEROES[n].hindi, n, col(n))}</div>)}
      </AbsoluteFill> : <AbsoluteFill style={{ top: 1500, display: "flex", justifyContent: "space-around", padding: "0 60px", height: 200 }}>
        {(["B1", "B2"] as const).map((b) => <div key={b}>{pill(`${who}_${b}`, HEROES[who as HeroName].bundles[b].name, col(who as HeroName))}</div>)}
      </AbsoluteFill>}
    </AbsoluteFill>
  );
};
