SPEC = dict(
  name="mixer-kaise-kaam-karta-hai", comp="MixerShort", title="मिक्सर कैसे काम करता है? (GEARO_B2)",
  scenes=[6.6, 12.8, 22.9, 27.7, 35.0], flashes=[6.6, 12.8, 27.7, 35.0],
  tips=[(29.2, 32.3), (32.5, 34.8)],
  poses=[[0, "wave"], [3.2, "think"], [6.8, "point"], [12.6, "idle"], [27.8, "thumbs"], [35.3, "hero"]],
  hostOn=[(0, 12.8), (27.7, 99)],
  states='''export const xray = (t: number) => (t >= 6.9 && t < 12.8 ? sstep(6.9, 7.7, t) : t >= 13.0 && t < 16.6 ? 1 : t >= 22.9 && t < 27.7 ? 1 : 0);
const rate = (t: number) => (t < 7.4 ? 0 : t < 27.0 ? (t >= 25.0 ? lerp(4, 0, sstep(25.0, 26.2, t)) : 4) : 0);
const DT = 1 / 240; const tab: number[] = [0];
for (let i = 1; i <= 60 / DT; i++) tab.push(tab[i - 1] + rate((i - 0.5) * DT) * DT * Math.PI * 2);
export const spin = (t: number) => { const x = Math.max(0, t) / DT, i = Math.floor(x); return lerp(tab[i], tab[i + 1] ?? tab[i], x - i); };
export const running = (t: number) => (rate(t) > 0 ? 1 : 0);
export const rpm = (t: number) => Math.round(20000 * sstep(7.4, 9.6, t) * (1 - sstep(25.0, 26.2, t)) * (t < 27 ? 1 : 0));
export const blend = (t: number) => sstep(17.0, 22.6, t);
export const overheat = (t: number) => (t >= 23.3 && t < 27.6 ? sstep(23.3, 24.3, t) : 0);
export const lidPress = (t: number) => (t >= 32.6 && t < 34.9 ? sstep(32.6, 33.2, t) : 0);''',
  imports=["rpm"],
  cams=[
    [(0, "0.2, 2.6, 11.8", "-0.5, 1.9, 0", 32, -0.02), (6.6, "-0.1, 2.5, 11.0", "-0.5, 1.9, 0")],
    [(6.6, "1.4, 2.0, 6.4", "0.4, 1.6, 0", 31), (12.8, "1.2, 1.9, 5.8", "0.4, 1.6, 0", 31)],
    [(12.8, "0.8, 2.1, 4.8", "0.4, 1.95, 0", 30, 0.03), (16.4, "0.7, 2.1, 4.5", "0.4, 1.95, 0", 30, 0.04), (17.2, "0.5, 2.9, 4.0", "0.4, 2.45, 0", 30), (22.9, "0.4, 2.9, 3.7", "0.4, 2.45, 0", 30, -0.03)],
    [(22.9, "1.8, 1.6, 5.2", "0.6, 1.3, 0", 31), (27.7, "1.6, 1.6, 4.9", "0.6, 1.3, 0", 31)],
    [(27.7, "0.0, 2.5, 11.2", "-0.5, 1.9, 0"), (35.0, "0.3, 2.5, 10.8", "-0.5, 1.9, 0")],
    [(35.0, "-1.6, 2.6, 11.6", "-0.5, 2.0, 0"), (43, "0.9, 2.6, 11.2", "-0.5, 2.0, 0")],
  ],
  labels=[
    (7.2, 12.4, "मोटर", "20,000 चक्कर/मिनट", "0.4, 1.35, 0.3", 1, -230, "HOT"),
    (13.3, 16.3, "कपलर", "मोटर → ब्लेड", "0.4, 2.08, 0.25", -1, -200, '"#ffd27a"'),
    (14.6, 16.3, "ब्लेड", "", "0.4, 2.25, 0.3", 1, -220, '"#ffffff"'),
    (19.0, 22.6, "जार की धारियाँ", "खाना वापस ब्लेड तक", "0.85, 2.6, 0.2", 1, -200, "COLD"),
    (23.4, 27.4, "ओवरलोड बटन", "गर्म हो तो बिजली बंद", "1.05, 1.2, 0.0", -1, -220, '"#ff5a5a"'),
  ],
  hook=("मिक्सर का", "तूफ़ानी राज़!", "गियरो के साथ!", "#ffc94d", ("#ffc94d", "#e09a1f", "#fff1c2")),
  chips=[("S.s2", "S.s3", "1", "तेज़ मोटर", "#ffb347"), ("S.s3", "S.s4", "2", "ब्लेड + जार", "#8fd6ff"), ("S.s4", "S.s5", "3", "ओवरलोड सुरक्षा", "#ff5a5a"), ("S.s5", "S.s6", "!", "ज़रूरी बातें", "#ff5a5a")],
  icons=[
    ("1 मिनट से ज़्यादा लगातार नहीं", False, '<g><circle cx="0" cy="0" r="70" fill="#fff" stroke="#333" strokeWidth="6" /><path d="M0-50V0l34 24" stroke="#333" strokeWidth="9" fill="none" strokeLinecap="round" /><path d="M-90-60c-10 16-10 24 0 34M90-60c10 16 10 24 0 34" stroke="#ff7a3c" strokeWidth="7" fill="none" /></g>'),
    ("ढक्कन दबाकर रखें", True, '<g><path d="M-45-40h90l-10 120h-70z" fill="rgba(170,220,255,0.4)" stroke="#333" strokeWidth="5" /><rect x="-55" y="-58" width="110" height="20" rx="8" fill="#222" /><path d="M-20-110c0-14 20-14 20 0v26h8c10 0 14 8 14 16v14h-56v-14c0-8 6-14 14-14z" fill="#ffd2b0" stroke="#3a2416" strokeWidth="4" /></g>'),
  ],
  extra='''const RPMc: React.FC<{ t: number }> = ({ t }) => {
  const k = fade(t, 7.3, 12.6, 0.3); if (k <= 0) return null; const r = rpm(t);
  return (<AbsoluteFill style={{ alignItems: "center", top: 330, opacity: k }}><div style={{ textAlign: "center", padding: "8px 36px 10px", borderRadius: 26, background: "rgba(8,16,30,0.85)", border: "3px solid #ffb347", boxShadow: r >= 20000 ? "0 0 40px #ffb347" : "none" }}>
    <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 110, lineHeight: 1, color: "#fff" }}>{r.toLocaleString("en-US")}</div>
    <div style={{ fontFamily: HF, fontWeight: 800, fontSize: 40, color: "#ffb347" }}>चक्कर / मिनट (RPM)</div></div></AbsoluteFill>);
};
''',
  extraTags="<RPMc t={t} />", cta=37.9, fontProbe="मिक्सर गियरो 0123456789,",
  sfx=["whr = motor(19.0, 140, 0.07); sfx.add(whr * np.clip(np.arange(len(whr)) / (1.5 * SR), 0, 1), 7.4); sfx.add(riser(1.8, 0.14, 300, 5000), 7.2)", "sfx.add(airflow(9.0, 0.05, 4000), 13.0); sfx.add(shimmer(2.5, 0.04, 90, 104, 14), 19.2)", "sfx.add(buzz(0.14), 24.0); sfx.add(tick(0.6, 2000, 0.004, 700), 25.0); sfx.add(riser(1.2, 0.1, 3000, 300), 25.0)", "sfx.add(clink(84, 0.12), 33.0)"],
)
