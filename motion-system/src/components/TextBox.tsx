// A text box with a fixed size and a line budget. If its content overflows, it is clipped
// and, in debug (QA) renders, outlined in pure magenta so the frame inspector flags the frame.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useStage } from '../lib/theme';

export const OVERFLOW_COLOR = '#FF00FF';

type Props = {
  width: number;
  fontSize: number;
  lines: number;
  lineHeight?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const TextBox: React.FC<Props> = ({ width, fontSize, lines, lineHeight = 1.12, style, children }) => {
  const { debug } = useStage();
  const inner = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const height = Math.ceil(fontSize * lineHeight * lines) + 4;

  // Measure layout size (offset*), which ignores animation transforms: a word mid-rise is not an overflow,
  // but a line too many or a word wider than the box is.
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const o = el.offsetHeight > height + 1 || el.scrollWidth > width + 1;
    if (o !== over) setOver(o);
  });

  return (
    <div
      style={{
        width,
        maxHeight: height,
        overflow: 'hidden',
        fontSize,
        lineHeight,
        overflowWrap: 'break-word',
        textWrap: 'balance',
        outline: debug && over ? `8px solid ${OVERFLOW_COLOR}` : undefined,
        ...style,
      }}
    >
      <div ref={inner}>{children}</div>
    </div>
  );
};

/** Splits a line into words that rise in one after another (mask reveal). */
export const WordRise: React.FC<{ text: string; progress: (i: number) => number }> = ({ text, progress }) => (
  <>
    {text.split(' ').map((w, i) => {
      const p = progress(i);
      return (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
          <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>
            {w}
            {' '}
          </span>
        </span>
      );
    })}
  </>
);
