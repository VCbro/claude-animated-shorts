import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useStage } from '../lib/theme';
import { envelope, rise, seg, easeInOut } from '../lib/motion';
import { Dashboard, dashSpec, buttonCenter } from '../components/Dashboard';
import { Cursor } from '../components/Brand';
import { uiClickFrame } from '../timeline';

export const UIScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { L } = useStage();
  const spec = dashSpec(L.format);
  const clickF = uiClickFrame(fps);

  const env = envelope(f, durationInFrames, 1, 12);
  const enter = rise(f, fps, 0);
  const fit = Math.min((L.w - L.pad * 2) / spec.DW, (L.h - L.pad * 2) / spec.DH);
  // Camera: gentle push-in after the click, eased, no shake.
  const zoom = 0.965 + 0.035 * enter + 0.045 * seg(f, clickF, durationInFrames, easeInOut);

  // Cursor path in dashboard coordinates: enters from bottom right, arcs onto the button.
  const target = buttonCenter(spec);
  const start = { x: spec.DW * 0.78, y: spec.DH * 1.08 };
  const m = seg(f, clickF - 52, clickF - 4, easeInOut);
  const arc = Math.sin(m * Math.PI) * spec.DW * 0.06;
  const leave = seg(f, clickF + 30, clickF + 70, easeInOut);
  const cx = interpolate(m, [0, 1], [start.x, target.x]) + arc - leave * 220;
  const cy = interpolate(m, [0, 1], [start.y, target.y + 6]) + leave * spec.DH * 0.42;
  const press = interpolate(f, [clickF - 2, clickF + 2, clickF + 8], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ripple = seg(f, clickF, clickF + 20);
  const cursorOn = seg(f, clickF - 52, clickF - 40);

  return (
    <AbsoluteFill style={{ opacity: env }}>
      <div
        style={{
          position: 'absolute',
          left: L.w / 2,
          top: L.h / 2,
          width: spec.DW,
          height: spec.DH,
          transform: `translate(-50%, -50%) scale(${fit * zoom}) translateY(${(1 - enter) * 40}px)`,
          opacity: enter,
        }}
      >
        <Dashboard spec={spec} f={f} clickF={clickF} />
        <div style={{ opacity: cursorOn }}>
          <Cursor x={cx} y={cy} size={34} press={press} ripple={ripple} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
