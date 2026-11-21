import React from 'react';
import { Img, staticFile } from 'remotion';
import { useStage } from '../lib/theme';

export const Logo: React.FC<{ size: number; withName?: boolean; nameSize?: number }> = ({ size, withName, nameSize }) => {
  const { campaign, theme } = useStage();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.32 }}>
      <Img src={staticFile(campaign.brand.logo)} style={{ width: size, height: size }} />
      {withName && (
        <span style={{ fontFamily: theme.display, fontWeight: 600, fontSize: nameSize ?? size * 0.62, color: theme.ink, letterSpacing: '-0.02em' }}>
          {campaign.brand.name}
        </span>
      )}
    </div>
  );
};

export const Button: React.FC<{ label: string; fontSize: number; press?: number; style?: React.CSSProperties }> = ({ label, fontSize, press = 0, style }) => {
  const { theme } = useStage();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: fontSize * 0.5,
        padding: `${fontSize * 0.62}px ${fontSize * 1.1}px`,
        borderRadius: fontSize * 0.5,
        background: theme.ink,
        color: theme.background,
        fontFamily: theme.body,
        fontWeight: 500,
        fontSize,
        whiteSpace: 'nowrap',
        transform: `scale(${1 - press * 0.05})`,
        boxShadow: `0 ${fontSize * 0.2}px ${fontSize * 0.6}px rgba(0,0,0,${0.12 - press * 0.08})`,
        ...style,
      }}
    >
      {label}
      <svg width={fontSize * 0.7} height={fontSize * 0.7} viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** Plain arrow cursor drawn in SVG; `press` 0..1 squashes it during a click. */
export const Cursor: React.FC<{ x: number; y: number; size: number; press?: number; ripple?: number }> = ({ x, y, size, press = 0, ripple = 0 }) => {
  const { theme } = useStage();
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {ripple > 0 && ripple < 1 && (
        <div
          style={{
            position: 'absolute',
            left: -size * 1.2 * ripple,
            top: -size * 1.2 * ripple,
            width: size * 2.4 * ripple,
            height: size * 2.4 * ripple,
            borderRadius: '50%',
            border: `${Math.max(1, size * 0.06)}px solid ${theme.accent}`,
            opacity: 1 - ripple,
          }}
        />
      )}
      <svg width={size} height={size * 1.3} viewBox="0 0 20 26" style={{ transform: `scale(${1 - press * 0.12})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}>
        <path d="M1 1 L1 20 L6 15.5 L9.5 24 L13 22.5 L9.6 14.2 L16.5 14.2 Z" fill={theme.ink} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
