import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useStage } from '../lib/theme';
import { envelope, rise, seg } from '../lib/motion';
import { Logo } from '../components/Brand';
import { TextBox, WordRise } from '../components/TextBox';

export const TitleScene: React.FC<{ headline: string; sub: string }> = ({ headline, sub }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { theme, L } = useStage();
  const env = envelope(f, durationInFrames, 1, 12);
  const width = Math.min(L.w - L.pad * 2, 1500);
  const center = L.portrait;
  const sub_ = seg(f, 22, 44);

  return (
    <AbsoluteFill style={{ opacity: env, transform: `translateY(${(1 - env) * -24}px)` }}>
      <div style={{ position: 'absolute', left: L.pad, top: L.pad * 0.8, opacity: seg(f, 0, 16) }}>
        <Logo size={54} withName />
      </div>
      <div style={{ position: 'absolute', left: L.pad, right: L.pad, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left' }}>
        <div style={{ width: 96 * seg(f, 2, 26), height: 5, borderRadius: 3, background: theme.accent, marginBottom: 44 }} />
        <TextBox width={width} fontSize={L.type.hero} lines={L.portrait ? 4 : 3} lineHeight={1.04} style={{ fontFamily: theme.display, fontWeight: 600, letterSpacing: '-0.035em', color: theme.ink }}>
          <WordRise text={headline} progress={(i) => rise(f, fps, 4 + i * 3)} />
        </TextBox>
        {sub && (
          <TextBox width={Math.min(width, 1100)} fontSize={L.type.body + 4} lines={2} lineHeight={1.3} style={{ marginTop: 34, color: theme.muted, fontFamily: theme.body, opacity: sub_, transform: `translateY(${(1 - sub_) * 14}px)` }}>
            {sub}
          </TextBox>
        )}
      </div>
    </AbsoluteFill>
  );
};
