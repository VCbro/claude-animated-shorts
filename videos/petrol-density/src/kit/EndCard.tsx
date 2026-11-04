import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "./theme";
import { io, pop } from "./anim";
import { Phone, StatusBar } from "./Phone";

/** Final CTA: a phone showing YOUR profile, Follow → Following ✓ flip, plus Save + Share hints. */
export const EndCard: React.FC<{ channel: string; handle: string; tagline?: string; flipAt?: number; logo?: string }> = ({ channel, handle, tagline = "Roz ek kaam ki baat", flipAt = 20, logo = "◎" }) => {
  const f = useCurrentFrame();
  const on = f >= flipAt;
  return (
    <Phone y={1000} scale={0.95} rx={[6, 3]} ry={[-8, 6]} rz={[1, -1]} dur={90} glow={C.lime} enter={0}>
      <StatusBar time="19:30" />
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: F.sans }}>
        <div style={{ margin: "0 auto", width: 190, height: 190, borderRadius: 95, background: C.lime, color: "#0A0D0C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, fontWeight: 900, boxShadow: `0 0 60px ${C.lime}66` }}>{logo}</div>
        <div style={{ marginTop: 40, color: C.white, fontWeight: 800, fontSize: 44 }}>{channel}</div>
        <div style={{ marginTop: 8, color: C.grey, fontSize: 26, fontFamily: F.mono }}>{handle}</div>
        <div style={{ marginTop: 14, color: C.grey, fontSize: 26 }}>{tagline}</div>
        <div style={{ margin: "50px auto 0", width: 380, height: 86, borderRadius: 43, background: on ? "transparent" : C.lime, border: `4px solid ${C.lime}`, color: on ? C.lime : "#0A0D0C",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, transform: `scale(${on ? 0.8 + 0.2 * pop(f, flipAt, 9) : 1})` }}>{on ? "Following ✓" : "Follow"}</div>
        <div style={{ marginTop: 60, display: "flex", justifyContent: "center", gap: 18, color: C.white, fontSize: 24, opacity: io(f, flipAt + 10, 8) }}>
          {["Save", "Share", "Comment"].map((t) => <div key={t} style={{ border: `2px solid ${C.line}`, borderRadius: 16, padding: "14px 20px", fontWeight: 700 }}>{t}</div>)}
        </div>
      </div>
    </Phone>
  );
};

/** Comment-bait poll ("Kabhi tumhare saath hua?" → Haan / Nahi). Choice `pick` lights up at `pickAt`. */
export const Poll: React.FC<{ q: string; a: string; b: string; pickAt?: number; pick?: 0 | 1 }> = ({ q, a, b, pickAt = 30, pick = 0 }) => {
  const f = useCurrentFrame();
  return (
    <Phone y={1020} scale={0.92} rx={[6, 3]} ry={[-12, -4]} dur={90} enter={0}>
      <StatusBar time="19:31" />
      <div style={{ position: "absolute", top: 420, left: 50, right: 50, fontFamily: F.sans, color: C.white, textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1 }}>{q}</div>
        {[a, b].map((t, i) => {
          const lit = f >= pickAt && pick === i;
          return <div key={t} style={{ marginTop: i ? 24 : 70, height: 96, borderRadius: 20, border: `4px solid ${C.lime}`, background: lit || i === 0 ? C.lime : "transparent", color: lit || i === 0 ? "#0A0D0C" : C.lime,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800, transform: `scale(${lit ? pop(f, pickAt, 9) : 1})` }}>{t}</div>;
        })}
      </div>
    </Phone>
  );
};
