SPEC = dict(
  name="pankha-kaise-chalta-hai", comp="FanShort", title="पंखा कैसे चलता है? (ROBO_B1)",
  scenes=[7.1, 16.7, 26.9, 34.5, 42.2], flashes=[7.1, 16.7, 26.9, 34.5, 42.2],
  tips=[(36.1, 38.2), (38.4, 42.0)],
  poses=[[0, "wave"], [3.7, "think"], [7.4, "point"], [16.6, "idle"], [27.2, "hero"], [34.6, "thumbs"], [42.4, "hero"]],
  hostOn=[(0, 7.1), (26.9, 99)],
  states='''export const xray = (t: number) => (t >= 7.3 && t < 26.9 ? sstep(7.3, 8.2, t) : 0);
const rate = (t: number) => (t < 10.5 ? (t < 7.1 ? 1.3 : 0) : t < 16.7 ? lerp(0, 0.5, sstep(10.5, 14.0, t)) : t < 38.4 ? lerp(0.5, 1.3, sstep(16.7, 19.0, t)) : lerp(1.3, 0, sstep(39.0, 41.5, t)));
const DT = 1 / 240; const tab: number[] = [0];
for (let i = 1; i <= 60 / DT; i++) tab.push(tab[i - 1] + rate((i - 0.5) * DT) * DT * Math.PI * 2);
export const fanAngle = (t: number) => { const x = Math.max(0, t) / DT, i = Math.floor(x); return lerp(tab[i], tab[i + 1] ?? tab[i], x - i); };
export const fieldAmt = (t: number) => (t >= 9.8 && t < 16.7 ? sstep(9.8, 10.5, t) : 0);
export const capGlow = (t: number) => (t >= 12.5 && t < 16.3 ? sstep(12.5, 13.0, t) : 0);
export const airAmt = (t: number) => (t < 7.1 ? 0.7 : t >= 22.8 && t < 38.6 ? sstep(22.8, 23.6, t) : t >= 38.6 && t < 41.5 ? 1 - sstep(39.0, 41.0, t) : t >= 42.2 ? 0 : 0);
export const dusty = (t: number) => (t >= 36.0 && t < 38.3 ? 1 - sstep(37.0, 38.0, t) : 0);''',
  imports=[],
  cams=[
    [(0, "0.4, 1.4, 11.5", "-0.3, 2.6, 0", 34, -0.02), (7.1, "-0.1, 1.5, 10.8", "-0.3, 2.6, 0", 34)],
    [(7.1, "1.4, 2.4, 5.4", "0.3, 3.75, 0", 31), (9.6, "1.2, 2.6, 4.6", "0.3, 3.8, 0", 31), (10.4, "0.9, 3.1, 2.6", "0.3, 3.8, 0", 30, 0.03), (16.7, "0.8, 3.2, 2.4", "0.3, 3.8, 0", 30, 0.04)],
    [(16.7, "2.0, 2.2, 6.2", "0.3, 3.6, 0", 32), (22.4, "1.6, 2.4, 5.6", "0.3, 3.7, 0", 32), (23.2, "2.6, 1.6, 8.6", "0.3, 2.6, 0", 33), (26.9, "2.2, 1.6, 8.0", "0.3, 2.6, 0", 33)],
    [(26.9, "-0.2, 1.6, 10.6", "-0.4, 2.4, 0", 34), (34.5, "0.3, 1.6, 10.2", "-0.4, 2.4, 0", 34)],
    [(34.5, "0.0, 1.5, 11.0", "-0.4, 2.6, 0", 34), (38.2, "0.3, 1.5, 10.6", "-0.4, 2.6, 0", 34), (38.6, "-0.6, 1.5, 11.0", "-0.4, 2.6, 0", 34), (42.2, "-0.4, 1.5, 10.8", "-0.4, 2.6, 0", 34)],
    [(42.2, "-1.6, 1.5, 11.4", "-0.3, 2.6, 0", 34), (48, "1.0, 1.5, 11.0", "-0.3, 2.6, 0", 34)],
  ],
  labels=[
    (7.6, 9.6, "तांबे की कॉइल्स", "स्टेटर", "0.3, 3.8, 0.42", -1, 220, "HOT"),
    (10.4, 12.4, "घूमता चुंबकीय क्षेत्र", "", "0.75, 3.8, 0.3", 1, 230, '"#c58bff"'),
    (12.6, 16.3, "कैपेसिटर", "शुरुआती धक्का", "0.3, 4.15, 0.0", -1, 230, 'COLD'),
    (17.2, 22.2, "रोटर + ब्लेड", "बाहर का हिस्सा घूमता है", "1.2, 3.75, 0.3", 1, 230, '"#ffffff"'),
    (22.9, 26.4, "तिरछे ब्लेड", "हवा नीचे", "1.0, 3.7, 0.6", -1, 220, "COLD"),
  ],
  hook=("पंखा हवा ठंडी", "नहीं करता!", "रोबो के साथ!", "#3aa8ff", ("#3aa8ff", "#7fd6ff", "#e0f6ff")),
  chips=[("S.s2", "S.s3", "1", "मोटर का जादू", "#c58bff"), ("S.s3", "S.s4", "2", "ब्लेड + हवा", "#8fd6ff"), ("S.s4", "S.s5", "?", "ठंडक कैसे लगती है?", "#ffd27a"), ("S.s5", "S.s6", "!", "ज़रूरी बातें", "#ff5a5a")],
  icons=[
    ("हर महीने ब्लेड साफ", True, '<g><rect x="-100" y="-20" width="200" height="40" rx="20" fill="#f0f0f0" stroke="#333" strokeWidth="5" />{[-60, -20, 20, 60].map((x, k) => <circle key={k} cx={x} cy={-4 + (k % 2) * 8} r="7" fill="#9a8a7a" />)}<path d="M-30-80h60l-10 40h-40z" fill="#4fc3ff" stroke="#333" strokeWidth="4" /></g>'),
    ("जाते समय पंखा बंद", True, '<g><rect x="-60" y="-80" width="120" height="160" rx="16" fill="#f5f5f0" stroke="#333" strokeWidth="5" /><rect x="-22" y="-45" width="44" height="90" rx="10" fill="#d32f2f" /><text x="0" y="8" fontSize="26" fontWeight="800" textAnchor="middle" fill="#fff">OFF</text><path d="M80-30l20-20M80 0h28M80 30l20 20" stroke="#ffe066" strokeWidth="7" strokeLinecap="round" /></g>'),
  ],
  extra='''const Sweat: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 27.3, 34.2, 0.3); if (k <= 0) return null; const u = clamp01((t - 28.5) / 4.5);
  return (<AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}><div style={{ display: "flex", gap: 18, alignItems: "center", padding: "12px 26px", borderRadius: 26, background: "rgba(8,16,30,0.86)", border: "3px solid #ffd27a" }}>
    <svg width="320" height="200" viewBox="0 0 320 200">
      <path d="M0 150c80-20 240-20 320 0v50H0z" fill="#e0a57a" />
      {[50, 120, 190, 260].map((x, i) => { const s = Math.max(0, 1 - u * 1.4 + i * 0.1); return <g key={i}><ellipse cx={x} cy={140} rx={14 * s} ry={18 * s} fill="#8fd6ff" />
        <path d={`M${x} ${120 - u * 90}c-10-12 10-20 0-32`} stroke="#ffffff" strokeWidth="5" fill="none" opacity={u * (1 - u * 0.5)} /><path d={`M${x + 14} ${110 - u * 80}l0-26m0 0l-8 10m8-10l8 10`} stroke="#ff7a3c" strokeWidth="5" fill="none" opacity={u} /></g>; })}
      {[0, 1, 2].map((k) => <path key={k} d={`M${(t * 160 + k * 110) % 340 - 20} ${40 + k * 22}h60`} stroke="#8fd6ff" strokeWidth="6" strokeLinecap="round" />)}
    </svg>
    <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 46, color: "#fff", lineHeight: 1.15 }}>हवा → पसीना सूखा<br /><span style={{ color: "#ff9a4d" }}>गर्मी बाहर</span> → <span style={{ color: "#8fd6ff" }}>ठंडक!</span></div>
  </div></AbsoluteFill>);
};
''',
  extraTags="<Sweat t={t} />", cta=42.6, fontProbe="पंखा रोबो",
  sfx=["sfx.add(airflow(7.0, 0.06, 1500), 0.0)", "sfx.add(zap(0.15), 9.9); sfx.add(shimmer(5.0, 0.04, 80, 96, 20), 10.0); sfx.add(motor(6.0, 50, 0.04), 10.5); sfx.add(pop(0.3, 300, 900), 12.6)", "sfx.add(motor(22.0, 50, 0.035), 16.7); sfx.add(airflow(16.0, 0.08, 1800), 22.8)", "sfx.add(shimmer(3.0, 0.05, 88, 104, 18), 29.0)", "sfx.add(tick(0.6, 2000, 0.004, 700), 38.8)"],
)
