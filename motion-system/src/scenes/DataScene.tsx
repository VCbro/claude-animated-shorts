import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useStage } from '../lib/theme';
import { envelope, rise, seg } from '../lib/motion';
import { TextBox, WordRise } from '../components/TextBox';

export const DataScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { theme, L, campaign } = useStage();
  const d = campaign.scenes.data;
  const claim = campaign.approvedClaims.find((c) => c.id === d.claimId)!;
  const env = envelope(f, durationInFrames, 1, 12);

  const width = L.w - L.pad * 2;
  const headSize = L.format === '16x9' ? 80 : L.portrait ? 88 : 76;
  const headLines = L.portrait ? 3 : 2;
  const headH = headSize * 1.06 * headLines;
  const chartTop = L.pad + headH + (L.portrait ? 140 : 70);
  const chartBottom = L.h - L.pad - 70;
  const chartH = chartBottom - chartTop;
  const n = d.values.length;
  const gap = width * (L.portrait ? 0.05 : 0.035);
  const bw = (width - gap * (n - 1)) / n;
  const max = Math.max(...d.values) * 1.08;
  const labelSize = L.format === '16x9' ? 26 : 30;

  return (
    <AbsoluteFill style={{ opacity: env }}>
      <div style={{ position: 'absolute', left: L.pad, top: L.pad }}>
        <TextBox width={width} fontSize={headSize} lines={headLines} lineHeight={1.06} style={{ fontFamily: theme.display, fontWeight: 600, letterSpacing: '-0.03em', color: theme.ink }}>
          <WordRise text={claim.text} progress={(i) => rise(f, fps, 2 + i * 3)} />
        </TextBox>
      </div>

      {/* Baseline */}
      <div style={{ position: 'absolute', left: L.pad, top: chartBottom, width: width * seg(f, 4, 30), height: 2, background: theme.ink, opacity: 0.85 }} />

      {d.values.map((v, i) => {
        const p = rise(f, fps, 14 + i * 4);
        const h = (v / max) * chartH * p;
        const last = i === n - 1;
        const x = L.pad + i * (bw + gap);
        return (
          <React.Fragment key={i}>
            <div style={{ position: 'absolute', left: x, top: chartBottom - h, width: bw, height: h, background: last ? theme.accent : theme.ink, opacity: last ? 1 : 0.14 + (i / n) * 0.2, borderRadius: `${Math.min(10, bw * 0.12)}px ${Math.min(10, bw * 0.12)}px 0 0` }} />
            <div style={{ position: 'absolute', left: x, width: bw, top: chartBottom - h - labelSize * 1.6, textAlign: 'center', fontFamily: theme.mono, fontSize: labelSize, color: last ? theme.accent : theme.muted, opacity: seg(f, 30 + i * 4, 44 + i * 4), fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(v * p)}
              {d.unit}
            </div>
            <div style={{ position: 'absolute', left: x, width: bw, top: chartBottom + 16, textAlign: 'center', fontFamily: theme.body, fontSize: labelSize, color: theme.muted, opacity: seg(f, 10, 30) }}>{d.labels[i]}</div>
          </React.Fragment>
        );
      })}

      <div style={{ position: 'absolute', left: L.pad, bottom: L.pad * 0.5, fontFamily: theme.body, fontSize: L.type.small, color: theme.muted, opacity: seg(f, 40, 60) * 0.9 }}>{d.caption}</div>
    </AbsoluteFill>
  );
};
