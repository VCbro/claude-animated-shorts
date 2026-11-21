// Product UI template: built from components, driven entirely by campaign data.
// It is laid out in its own coordinate space (DW x DH) and scaled to fit each format.
import React from 'react';
import { interpolate } from 'remotion';
import { useStage } from '../lib/theme';
import { seg, ease } from '../lib/motion';
import { Button } from './Brand';
import { TextBox } from './TextBox';

export type DashSpec = { DW: number; DH: number; sidebar: boolean; kpiCols: number };

export function dashSpec(format: '16x9' | '1x1' | '9x16'): DashSpec {
  if (format === '16x9') return { DW: 1440, DH: 820, sidebar: true, kpiCols: 3 };
  if (format === '1x1') return { DW: 960, DH: 860, sidebar: false, kpiCols: 3 };
  return { DW: 760, DH: 1180, sidebar: false, kpiCols: 1 };
}

const SIDEBAR = 240;
const HEADER = 104;
const GAP = 24;
export const BTN = { w: 250, h: 60 };

/** Button centre in dashboard coordinates (used to aim the cursor). */
export function buttonCenter(spec: DashSpec) {
  return { x: spec.DW - 36 - BTN.w / 2, y: HEADER / 2 };
}

function fmt(v: number, prefix: string, suffix: string, decimals: number) {
  const s = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${prefix}${s}${suffix}`;
}

type Props = { spec: DashSpec; f: number; clickF: number };

export const Dashboard: React.FC<Props> = ({ spec, f, clickF }) => {
  const { theme, campaign } = useStage();
  const ui = campaign.scenes.ui;
  const { DW, DH, sidebar, kpiCols } = spec;
  const left = sidebar ? SIDEBAR : 0;
  const innerW = DW - left - 36 * 2;
  const kpiH = kpiCols === 1 ? 128 : 168;
  const kpiRows = Math.ceil(3 / kpiCols);
  const kpiW = (innerW - GAP * (kpiCols - 1)) / kpiCols;
  const chartTop = HEADER + 28 + kpiRows * kpiH + (kpiRows - 1) * GAP + GAP;
  const chartH = DH - chartTop - 36;

  const press = interpolate(f, [clickF - 2, clickF + 2, clickF + 8], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const after = seg(f, clickF + 6, clickF + 40);
  const toast = seg(f, clickF + 24, clickF + 44);

  // Chart geometry: history + projected forecast (deterministic linear trend).
  const hist = ui.series;
  const n = hist.length;
  const slope = (hist[n - 1] - hist[Math.max(0, n - 5)]) / Math.min(4, n - 1);
  const fc = Array.from({ length: 6 }, (_, i) => hist[n - 1] + slope * (i + 1) * 0.9 + (i % 2 ? -3 : 3));
  const all = [...hist, ...fc];
  const min = Math.min(...all) * 0.97;
  const max = Math.max(...all) * 1.02;
  const cw = innerW - 48;
  const ch = chartH - 110;
  const px = (i: number) => 24 + (i / (all.length - 1)) * cw;
  const py = (v: number) => 80 + ch - ((v - min) / (max - min)) * ch;
  const histPts = hist.map((v, i) => [px(i), py(v)] as const);
  const fcPts = [histPts[n - 1], ...fc.map((v, i) => [px(n + i), py(v)] as const)];
  const toPath = (pts: readonly (readonly [number, number])[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const plen = (pts: readonly (readonly [number, number])[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
  const draw = seg(f, 14, 62);
  const fcDraw = after;
  const hLen = plen(histPts);
  const fLen = plen(fcPts);
  const area = `${toPath(histPts)} L${histPts[n - 1][0]},${80 + ch} L${histPts[0][0]},${80 + ch} Z`;

  const card: React.CSSProperties = { background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 18 };

  return (
    <div style={{ position: 'relative', width: DW, height: DH, ...card, borderRadius: 26, overflow: 'hidden', fontFamily: theme.body, color: theme.ink, boxShadow: '0 30px 80px rgba(20,20,26,0.10), 0 4px 14px rgba(20,20,26,0.06)' }}>
      {sidebar && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDEBAR, borderRight: `1px solid ${theme.line}`, background: theme.background, padding: '34px 22px' }}>
          <div style={{ fontFamily: theme.display, fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em', marginBottom: 40, paddingLeft: 14 }}>{campaign.brand.name}</div>
          {ui.nav.map((item, i) => (
            <div key={item} style={{ fontSize: 22, padding: '13px 14px', borderRadius: 10, marginBottom: 6, color: i === 0 ? theme.ink : theme.muted, background: i === 0 ? theme.surface : 'transparent', fontWeight: i === 0 ? 500 : 400, border: i === 0 ? `1px solid ${theme.line}` : '1px solid transparent' }}>
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'absolute', left: left + 36, right: 36, top: 0, height: HEADER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.line}` }}>
        <TextBox width={innerW - BTN.w - 24} fontSize={34} lines={1} style={{ fontFamily: theme.display, fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          {ui.screenTitle}
        </TextBox>
      </div>
      <div style={{ position: 'absolute', left: DW - 36 - BTN.w, top: (HEADER - BTN.h) / 2, width: BTN.w, height: BTN.h, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Button label={ui.button} fontSize={22} press={press} style={{ width: BTN.w, height: BTN.h, padding: 0, justifyContent: 'center', background: after > 0.5 ? theme.accent : theme.ink }} />
      </div>

      {/* KPIs */}
      {ui.kpis.map((k, i) => {
        const col = i % kpiCols;
        const row = Math.floor(i / kpiCols);
        const p = seg(f, 8 + i * 5, 50 + i * 5);
        const decimals = Number.isInteger(k.value) ? 0 : 1;
        const appear = seg(f, 4 + i * 4, 22 + i * 4);
        return (
          <div key={k.label} style={{ position: 'absolute', left: left + 36 + col * (kpiW + GAP), top: HEADER + 28 + row * (kpiH + GAP), width: kpiW, height: kpiH, ...card, padding: kpiCols === 1 ? '22px 28px' : '26px 28px', opacity: appear, transform: `translateY(${(1 - appear) * 16}px)`, display: 'flex', flexDirection: kpiCols === 1 ? 'row' : 'column', justifyContent: 'space-between', alignItems: kpiCols === 1 ? 'center' : 'stretch' }}>
            <div style={{ fontSize: 22, color: theme.muted }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontFamily: theme.display, fontWeight: 600, fontSize: 48, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(k.value * p, k.prefix, k.suffix, decimals)}</span>
              <span style={{ fontSize: 20, fontWeight: 500, color: k.delta.startsWith('-') ? theme.muted : theme.positive }}>{k.delta}</span>
            </div>
          </div>
        );
      })}

      {/* Chart card */}
      <div style={{ position: 'absolute', left: left + 36, top: chartTop, width: innerW, height: chartH, ...card, opacity: seg(f, 10, 28) }}>
        <div style={{ position: 'absolute', left: 28, top: 24, fontSize: 22, color: theme.muted, display: 'flex', gap: 22, alignItems: 'center' }}>
          <span style={{ color: theme.ink, fontWeight: 500 }}>Cash balance</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: after }}>
            <span style={{ width: 22, borderTop: `3px dashed ${theme.accent}` }} /> Forecast
          </span>
        </div>
        <svg width={innerW} height={chartH} style={{ position: 'absolute', left: 0, top: 0 }}>
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={theme.ink} stopOpacity="0.08" />
              <stop offset="1" stopColor={theme.ink} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((g) => (
            <line key={g} x1={24} x2={24 + cw} y1={80 + (ch / 3) * g} y2={80 + (ch / 3) * g} stroke={theme.line} strokeWidth={1} />
          ))}
          <path d={area} fill="url(#area)" opacity={draw} />
          <path d={toPath(histPts)} fill="none" stroke={theme.ink} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={hLen} strokeDashoffset={hLen * (1 - draw)} />
          <g style={{ clipPath: `inset(0 ${(1 - fcDraw) * 100}% 0 0)` }}>
            <path d={toPath(fcPts)} fill="none" stroke={theme.accent} strokeWidth={3.5} strokeDasharray="10 9" strokeLinecap="round" />
          </g>
          <circle cx={histPts[n - 1][0]} cy={histPts[n - 1][1]} r={7} fill={theme.surface} stroke={theme.ink} strokeWidth={3} opacity={seg(f, 56, 64)} />
          {fcDraw > 0.98 && <circle cx={fcPts[fcPts.length - 1][0]} cy={fcPts[fcPts.length - 1][1]} r={7} fill={theme.accent} />}
        </svg>
      </div>

      {/* Toast */}
      <div style={{ position: 'absolute', right: 36, bottom: 36 + 20, opacity: toast, transform: `translateY(${interpolate(toast, [0, 1], [20, 0], { easing: ease })}px)`, display: 'flex', alignItems: 'center', gap: 14, background: theme.ink, color: theme.background, borderRadius: 14, padding: '16px 22px', fontSize: 22, fontWeight: 500, boxShadow: '0 12px 30px rgba(0,0,0,0.18)' }}>
        <svg width={24} height={24} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={theme.positive} /><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {ui.toast}
      </div>
    </div>
  );
};
