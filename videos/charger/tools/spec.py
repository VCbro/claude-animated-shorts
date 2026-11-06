SPEC = dict(
  name="mobile-charger-kaise-kaam-karta-hai", comp="ChargerShort", title="मोबाइल चार्जर कैसे काम करता है? (VOLTI_B1)",
  scenes=[10.0, 24.6, 33.9, 41.7], flashes=[10.0, 24.6, 33.9, 41.7],
  tips=[(35.4, 38.2), (38.3, 41.5)],
  poses=[[0, "wave"], [3.0, "think"], [7.5, "point"], [34.0, "thumbs"], [42.0, "hero"]],
  hostOn=[(0, 10.0), (33.9, 99)],
  states='''export const xray = (t: number) => (t >= 10.0 && t < 33.9 ? sstep(10.2, 11.0, t) : 0);
export const acAmt = (t: number) => (t < 10.0 ? 0.6 : t < 24.6 ? 1 : 0);
export const dcAmt = (t: number) => (t >= 13.0 && t < 33.9 ? sstep(13.0, 13.8, t) : 0);
export const focus = (t: number) => (t >= 10.3 && t < 16.6 ? 1 : t >= 16.8 && t < 21.0 ? 2 : t >= 21.2 && t < 24.5 ? 3 : 0);
export const ionAmt = (t: number) => (t >= 28.0 && t < 33.9 ? sstep(28.0, 28.6, t) : 0);
export const battery = (t: number) => Math.round(t < 24.6 ? 18 : t < 33.9 ? lerp(18, 100, sstep(25.0, 33.4, t)) : 100);''',
  imports=["battery", "focus"],
  cams=[
    [(0, "0.5, 2.2, 12.5", "0.0, 1.8, 0", 32, -0.02), (10.0, "0.1, 2.1, 11.8", "0.0, 1.7, 0")],
    [(10.0, "0.3, 2.2, 5.0", "0.3, 2.05, -0.4", 30), (16.6, "0.0, 2.3, 3.4", "-0.15, 2.2, -0.45", 30, 0.03), (17.4, "0.6, 2.1, 3.3", "0.3, 2.05, -0.45", 30), (20.9, "0.6, 2.1, 3.1", "0.3, 2.05, -0.45", 30, -0.03), (21.6, "1.0, 2.2, 3.3", "0.65, 2.1, -0.45", 30), (24.6, "1.0, 2.2, 3.2", "0.65, 2.1, -0.45", 30)],
    [(24.6, "1.6, 2.2, 7.6", "0.8, 1.5, 0.2", 31), (27.8, "1.4, 2.0, 6.8", "0.9, 1.5, 0.4", 31), (28.6, "1.4, 1.65, 3.6", "1.3, 1.6, 0.8", 30, 0.03), (33.9, "1.35, 1.65, 3.3", "1.3, 1.6, 0.8", 30, 0.04)],
    [(33.9, "0.3, 2.2, 12.0", "0.0, 1.7, 0"), (41.7, "0.6, 2.2, 11.6", "0.0, 1.7, 0")],
    [(41.7, "-1.0, 2.3, 12.2", "0.0, 1.8, 0"), (50, "1.4, 2.3, 11.8", "0.0, 1.8, 0")],
  ],
  labels=[
    (3.2, 7.1, "230 वोल्ट AC", "", "0.3, 2.0, -0.95", -1, -200, "HOT"),
    (5.0, 7.1, "सिर्फ 5 वोल्ट DC", "", "1.3, 1.6, 0.85", 1, -220, "COLD"),
    (10.5, 16.4, "डायोड्स", "AC → DC", "-0.22, 2.25, -0.45", -1, -220, '"#ffe066"'),
    (17.0, 20.8, "ट्रांसफॉर्मर", "230V → 5V", "0.3, 2.05, -0.4", 1, -230, "HOT"),
    (21.4, 24.3, "कैपेसिटर", "बिजली स्मूद", "0.65, 2.3, -0.4", -1, -220, "COLD"),
    (25.2, 27.7, "USB केबल", "", "0.7, 1.0, 0.4", -1, -160, "COLD"),
    (28.8, 33.5, "लिथियम आयन", "बैटरी में जमा", "1.3, 1.55, 0.86", 1, -260, '"#ffe066"'),
  ],
  hook=("चार्जर का", "असली कमाल!", "वोल्टी के साथ!", "#29e3ff", ("#29e3ff", "#7b5cff", "#bff7ff")),
  chips=[("S.s2", "S.s3", "1", "चार्जर के अंदर", "#29e3ff"), ("S.s3", "S.s4", "2", "बैटरी चार्जिंग", "#ffe066"), ("S.s4", "S.s5", "!", "ज़रूरी बातें", "#ff5a5a")],
  icons=[
    ("अच्छी क्वालिटी का चार्जर", True, '<g><rect x="-50" y="-70" width="100" height="120" rx="18" fill="#f5f5f5" stroke="#333" strokeWidth="5" /><path d="M-20-70v-30M20-70v-30" stroke="#c9a54a" strokeWidth="10" /><path d="M-6 10l-14 0 20-40-4 30h14l-20 40z" fill="#29e3ff" /></g>'),
    ("फोन तकिये के नीचे नहीं", False, '<g><rect x="-90" y="10" width="180" height="70" rx="30" fill="#e9ecf5" stroke="#333" strokeWidth="5" /><rect x="-30" y="-70" width="60" height="100" rx="10" fill="#222" />{[0, 1, 2].map((k) => <path key={k} d={`M${-40 + k * 40} -80c-8-14 8-22 0-36`} stroke="#ff7a3c" strokeWidth="6" fill="none" />)}</g>'),
  ],
  extra='''const Wave: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 10.4, 24.4, 0.3); if (k <= 0) return null; const f = focus(t);
  const path = (fn: (x: number) => number) => { let d = ""; for (let x = 0; x <= 300; x += 5) d += (x ? "L" : "M") + x + " " + (60 - fn(x)).toFixed(1); return d; };
  const ac = (x: number) => 45 * Math.sin((x + t * 120) * 0.06), dc = (x: number) => (f >= 3 ? 30 : 30 + 12 * Math.abs(Math.sin((x + t * 120) * 0.06)) - 6);
  return (<AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}><div style={{ display: "flex", gap: 20, alignItems: "center", padding: "10px 24px", borderRadius: 24, background: "rgba(8,16,30,0.86)", border: "3px solid #29e3ff" }}>
    <div style={{ textAlign: "center" }}><svg width="300" height="120"><path d={path(ac)} stroke="#ff9a4d" strokeWidth="6" fill="none" /></svg><div style={{ fontFamily: HF, fontWeight: 800, fontSize: 36, color: "#ff9a4d" }}>AC 230V</div></div>
    <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 60, color: "#fff" }}>→</div>
    <div style={{ textAlign: "center", opacity: f >= 1 ? 1 : 0.3 }}><svg width="300" height="120"><path d={path(f >= 2 ? (x) => dc(x) * 0.5 : (x) => Math.abs(ac(x)))} stroke="#29e3ff" strokeWidth="6" fill="none" /></svg><div style={{ fontFamily: HF, fontWeight: 800, fontSize: 36, color: "#29e3ff" }}>{f >= 2 ? "DC 5V" : "DC"}</div></div>
  </div></AbsoluteFill>);
};
const Batt: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 25.0, 33.8, 0.3); if (k <= 0) return null; const b = battery(t);
  return (<AbsoluteFill style={{ alignItems: "flex-end", top: 340, right: 50, opacity: k }}><div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 24px 6px", borderRadius: 20, background: "rgba(8,16,30,0.86)", border: "3px solid #4caf50" }}>
    <div style={{ width: 120, height: 54, border: "5px solid #fff", borderRadius: 10, padding: 4 }}><div style={{ width: `${b}%`, height: "100%", borderRadius: 4, background: b > 80 ? "#4caf50" : "#ffe066" }} /></div>
    <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 56, color: "#fff" }}>{b}%</div></div></AbsoluteFill>);
};
''',
  extraTags="<Wave t={t} /><Batt t={t} />", cta=44.6, fontProbe="चार्जर वोल्टी 0123456789%",
  sfx=["sfx.add(zap(0.2), 3.2); sfx.add(motor(6.0, 50, 0.03), 3.2)", "sfx.add(motor(14.0, 100, 0.035), 10.3); sfx.add(zap(0.15), 13.0)", "sfx.add(shimmer(3.0, 0.04, 90, 104, 14), 21.4)", "sfx.add(airflow(2.0, 0.04, 3000), 25.0); sfx.add(shimmer(5.0, 0.05, 88, 106, 30), 28.2)", "sfx.add(ding(0.14), 33.3)"],
)
