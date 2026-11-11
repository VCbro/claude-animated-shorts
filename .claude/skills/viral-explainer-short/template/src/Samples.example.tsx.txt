// Style samples for realistic 3D (one frame each): frame 0..5 of composition "Samples".
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, F } from "./kit/theme";
import { Ground, Vignette } from "./kit/Frame";
import { AT, Charger, CStage, WallSetup } from "./three/Charger";

const NAMES = ["7 · Exploded View", "8 · Cutaway (aadha kata)", "9 · Labelled Parts", "10 · Macro Close-up", "11 · Glass Shell + Current", "12 · Real Room"];
const Dark: React.FC<{ children: React.ReactNode }> = ({ children }) => <Ground><AbsoluteFill style={{ background: "radial-gradient(110% 70% at 50% 45%, #1A2A38 0%, #070B10 78%)" }} />{children}<Vignette /></Ground>;
const Title: React.FC<{ dark?: boolean }> = ({ dark = true }) => <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 76, lineHeight: 1.05, letterSpacing: -2, color: dark ? C.white : "#1B1620" }}>Charger <span style={{ color: C.red }}>GARAM</span><br />kyun hota hai?</div>;
const Tag: React.FC<{ i: number }> = ({ i }) => <div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", background: C.lime, color: "#0A0D0C", fontFamily: F.sans, fontWeight: 800, fontSize: 40, padding: "12px 34px", borderRadius: 50, whiteSpace: "nowrap" }}>Sample {NAMES[i]}</div>;
const PX = (x: number) => 540 + x * 560, PY = (y: number) => 960 - y * 560;
const LABELS: [string, readonly number[], number, number][] = [["PINS 230V", [0.2, 0.95], 800, 400], ["FUSE", AT.fuse, 40, 600], ["BRIDGE", AT.bridge, 830, 620], ["CAPACITOR", AT.cap, 20, 790], ["SWITCH", AT.fet, 850, 900], ["TRANSFORMER", AT.trafo, 20, 1010], ["DIODE", AT.diode, 40, 1290], ["USB 5V", AT.usb, 800, 1380]];

export const Samples: React.FC = () => {
  const i = useCurrentFrame();
  return <AbsoluteFill>
    {i === 0 && <Dark><CStage dur={1} mode="studio" from={[-3.4, 2.0, 6.0]} to={[-3.4, 2.0, 6.0]} lookAt={[0.5, 0.1, 0.5]} fov={33}><Charger explode={1} /></CStage><Title /></Dark>}
    {i === 1 && <Dark><CStage dur={1} mode="studio" from={[2.2, 0.9, 5.2]} to={[2.2, 0.9, 5.2]} lookAt={[0, 0.1, 0]}><Charger cut={0.02} flow={0.5} /></CStage><Title /></Dark>}
    {i === 2 && <Dark><CStage dur={1} mode="studio" from={[0, 0, 6.4]} to={[0, 0, 6.4]} lookAt={[0, 0, 0]}><Charger open={1} /></CStage>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>{LABELS.map(([t, p, x, y]) => <g key={t}><path d={`M ${PX(p[0])} ${PY(p[1])} L ${x < 540 ? x + 200 : x} ${y + 28}`} stroke={C.lime} strokeWidth={4} /><circle cx={PX(p[0])} cy={PY(p[1])} r={10} fill={C.lime} /></g>)}</svg>
      {LABELS.map(([t, , x, y]) => <div key={t} style={{ position: "absolute", left: x, top: y, fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: "#0A0D0C", background: C.lime, padding: "6px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>{t}</div>)}
      <Title /></Dark>}
    {i === 3 && <Dark><CStage dur={1} mode="studio" from={[-1.5, -1.1, 1.5]} to={[-1.5, -1.1, 1.5]} lookAt={[0.0, 0.05, -0.05]} fov={40}><Charger open={1} flow={0.7} sw={1} heat={0.25} /></CStage><Title /></Dark>}
    {i === 4 && <Dark><CStage dur={1} mode="studio" from={[1.6, 0.5, 5.6]} to={[1.6, 0.5, 5.6]} lookAt={[0, 0.1, 0]}><Charger open={0.75} flow={1} charge={0.6} heat={0.4} /></CStage><Title /></Dark>}
    {i === 5 && <AbsoluteFill style={{ background: "#C9BEA6" }}><CStage dur={1} mode="wall" from={[2.8, 0.7, 6.6]} to={[2.8, 0.7, 6.6]} lookAt={[0.3, -0.2, 0.8]} fov={38}><WallSetup shellHeat={0.5} /></CStage><Title dark={false} /><Vignette amt={0.3} /></AbsoluteFill>}
    <Tag i={Math.min(5, i)} />
  </AbsoluteFill>;
};
