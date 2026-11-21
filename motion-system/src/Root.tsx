import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { ProductVideo } from './ProductVideo';
import { videoPropsSchema, FORMATS, type VideoProps } from './schema';
import { FORMAT_SIZE, timeline } from './timeline';
import demo from '../campaigns/tally-launch.json';

const calc: CalculateMetadataFunction<VideoProps> = ({ props }) => ({
  ...FORMAT_SIZE[props.format],
  fps: props.campaign.fps,
  durationInFrames: timeline(props.campaign).total,
});

export const Root: React.FC = () => (
  <>
    {/* The render scripts drive "ProductVideo" with inputProps; the per-format ones are for Studio preview. */}
    <Composition id="ProductVideo" component={ProductVideo} schema={videoPropsSchema} calculateMetadata={calc}
      width={1920} height={1080} fps={30} durationInFrames={750}
      defaultProps={{ campaign: demo as VideoProps['campaign'], format: '16x9', hookId: 'a', ctaId: 'trial', debug: false }} />
    {FORMATS.map((format) => (
      <Composition key={format} id={`Demo-${format}`} component={ProductVideo} schema={videoPropsSchema} calculateMetadata={calc}
        width={1920} height={1080} fps={30} durationInFrames={750}
        defaultProps={{ campaign: demo as VideoProps['campaign'], format, hookId: 'a', ctaId: 'trial', debug: true }} />
    ))}
  </>
);
