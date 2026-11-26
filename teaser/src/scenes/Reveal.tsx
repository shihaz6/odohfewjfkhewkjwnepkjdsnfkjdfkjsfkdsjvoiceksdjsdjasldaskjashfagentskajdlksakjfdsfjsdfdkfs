import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, fadeUp, progress, useLayout} from '../anim';
import {Background, Rings, Waveform} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';
import {Wordmark} from './Wordmark';

/** The product reveal: burst, waveform, RESONANCE, by AlchemyX Global, tagline. */
export const Reveal: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const {pick, portrait, diag} = useLayout();
  const flash = interpolate(frame, [0, 2, 12], [0, 0.32, 0], clamp);
  const amp = progress(frame, 2, 30) * (0.75 + 0.15 * Math.sin(frame / 9));

  return (
    <AbsoluteFill>
      <Background glow={1.2} />
      <AbsoluteFill>
        <Rings
          start={0}
          period={48}
          count={3}
          maxR={diag * 0.5}
          minR={60}
          stroke={3}
          opacity={interpolate(frame, [0, 60, 150], [1, 0.55, 0.3], clamp)}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Waveform bars={pick(64, 40)} width={pick(1560, 960)} height={pick(300, 360)} amp={amp} gap={pick(10, 9)} opacity={0.13} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + frame * 0.00025})`}}
      >
        <Wordmark start={14} fontSize={pick(212, 124)} waveWidth={pick(1200, 780)} waveStart={46} />
        <div
          style={{
            ...fadeUp(frame, 60, 22),
            marginTop: pick(34, 40),
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: pick(44, 42),
            color: COLORS.muted,
            letterSpacing: '0.04em',
          }}
        >
          by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
        </div>
        <div
          style={{
            ...fadeUp(frame, 92, 24),
            marginTop: pick(64, 90),
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: pick(58, 60),
            lineHeight: 1.2,
            color: COLORS.white,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          The AI <span style={{color: COLORS.violet}}>voice agent</span>
          {portrait ? <br /> : ' '}for your business.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: COLORS.white, opacity: flash}} />
    </AbsoluteFill>
  );
};
