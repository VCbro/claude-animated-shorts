import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useStage } from '../lib/theme';
import { rise, seg } from '../lib/motion';
import { Button, Logo } from '../components/Brand';
import { TextBox, WordRise } from '../components/TextBox';

export const CTAScene: React.FC<{ line: string; button: string }> = ({ line, button }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { theme, L, campaign } = useStage();
  const logo = rise(f, fps, 0, 'soft');
  const btn = rise(f, fps, 22, 'soft');
  const width = Math.min(L.w - L.pad * 2, 1300);
  const enter = seg(f, 0, 10);

  return (
    <AbsoluteFill style={{ opacity: enter, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ transform: `scale(${0.85 + 0.15 * logo})`, opacity: logo, marginBottom: 56 }}>
        <Logo size={96} withName nameSize={64} />
      </div>
      <TextBox width={width} fontSize={L.type.hero * 0.82} lines={L.portrait ? 3 : 2} lineHeight={1.06} style={{ fontFamily: theme.display, fontWeight: 600, letterSpacing: '-0.03em', color: theme.ink }}>
        <WordRise text={line} progress={(i) => rise(f, fps, 8 + i * 3)} />
      </TextBox>
      <div style={{ marginTop: 60, opacity: btn, transform: `translateY(${(1 - btn) * 18}px)` }}>
        <Button label={button} fontSize={36} />
      </div>
      <div style={{ marginTop: 34, fontFamily: theme.mono, fontSize: 28, color: theme.muted, opacity: seg(f, 34, 52) }}>{campaign.url}</div>
    </AbsoluteFill>
  );
};
