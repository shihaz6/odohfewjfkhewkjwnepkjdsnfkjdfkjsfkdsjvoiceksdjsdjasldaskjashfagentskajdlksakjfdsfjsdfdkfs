import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeOut, progress} from '../anim';
import {COLORS, DISPLAY} from '../theme';

const WORD = 'RESONANCE';

/** "RESONANCE": letters rise one by one while the tracking tightens, then a wave draws underneath. */
export const Wordmark: React.FC<{
  start: number;
  fontSize: number;
  stagger?: number;
  waveWidth: number;
  waveStart: number;
}> = ({start, fontSize, stagger = 3, waveWidth, waveStart}) => {
  const frame = useCurrentFrame();
  const tracking = interpolate(frame, [start, start + 80], [0.32, 0.1], {...clamp, easing: easeOut});
  const draw = progress(frame, waveStart, 34);

  // A sine wave whose amplitude swells in the middle, drifting sideways over time.
  const h = fontSize * 0.22;
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * waveWidth;
    const env = Math.sin((i / 120) * Math.PI);
    const y = h / 2 + Math.sin(i * 0.42 - frame * 0.22) * (h / 2 - 3) * env;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const len = waveWidth * 1.6;

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize,
          lineHeight: 1,
          color: COLORS.white,
          letterSpacing: `${tracking}em`,
          marginRight: `-${tracking}em`,
        }}
      >
        {WORD.split('').map((ch, i) => {
          const p = progress(frame, start + i * stagger, 22);
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', padding: '0.04em 0 0.06em'}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)`, opacity: Math.min(1, p * 1.6)}}>
                {ch}
              </span>
            </span>
          );
        })}
      </div>
      <svg width={waveWidth} height={h} style={{marginTop: fontSize * 0.14, overflow: 'visible'}}>
        <path
          d={pts.join(' ')}
          fill="none"
          stroke={COLORS.violet}
          strokeWidth={Math.max(4, fontSize * 0.028)}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - draw)}
        />
      </svg>
    </div>
  );
};
