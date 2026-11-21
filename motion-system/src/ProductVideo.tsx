import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import type { VideoProps } from './schema';
import { timeline } from './timeline';
import { layoutFor } from './lib/layout';
import { FONT, ThemeProvider } from './lib/theme';
import { loadFonts } from './lib/fonts';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';
import { DataScene } from './scenes/DataScene';
import { CTAScene } from './scenes/CTAScene';

loadFonts();

export const ProductVideo: React.FC<VideoProps> = ({ campaign, format, hookId, ctaId, debug, audio }) => {
  const L = layoutFor(format);
  const theme = { ...campaign.brand.colors, ...FONT };
  const hook = campaign.hooks.find((h) => h.id === hookId) ?? campaign.hooks[0];
  const cta = campaign.ctas.find((c) => c.id === ctaId) ?? campaign.ctas[0];
  const { spans } = timeline(campaign);
  const scene = { title: <TitleScene headline={hook.headline} sub={hook.sub} />, ui: <UIScene />, data: <DataScene />, cta: <CTAScene line={cta.line} button={cta.button} /> };

  return (
    <ThemeProvider theme={theme} L={L} campaign={campaign} debug={debug}>
      <AbsoluteFill style={{ background: theme.background, fontFamily: theme.body, WebkitFontSmoothing: 'antialiased' }}>
        {spans.map((s) => (
          <Sequence key={s.name} from={s.from} durationInFrames={s.duration} name={s.name}>
            {scene[s.name]}
          </Sequence>
        ))}
        {audio && <Audio src={staticFile(audio)} />}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
