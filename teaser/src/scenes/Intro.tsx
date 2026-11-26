import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn, easeOut, progress, useLayout} from '../anim';
import {Background, Rings} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';

/** A single violet point starts to resonate; "AlchemyX Global presents". */
export const Intro: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pick, diag} = useLayout();

  const dot = spring({frame: frame - 4, fps, config: {damping: 11, mass: 0.6}});
  const pulse = 1 + 0.12 * Math.max(0, Math.sin(((frame - 8) / 35) * Math.PI));
  const exit = interpolate(frame, [dur - 18, dur], [0, 1], {...clamp, easing: easeIn});
  const tracking = interpolate(frame, [26, 100], [0.7, 0.34], {...clamp, easing: easeOut});

  return (
    <AbsoluteFill>
      <Background glow={0.4 + dot * 0.6} />
      <AbsoluteFill style={{transform: `scale(${1 + exit * 0.5})`, opacity: 1 - exit}}>
        <AbsoluteFill>
          <Rings start={8} period={70} count={4} maxR={diag * 0.42} minR={20} stroke={2} opacity={0.9} />
        </AbsoluteFill>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: COLORS.violet,
              transform: `scale(${dot * pulse})`,
              boxShadow: '0 0 70px 24px rgba(124,92,255,0.45)',
            }}
          />
        </AbsoluteFill>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{marginTop: pick(250, 300), textAlign: 'center'}}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: pick(54, 58),
                color: COLORS.orange,
                letterSpacing: `${tracking}em`,
                marginRight: `-${tracking}em`,
                opacity: progress(frame, 26, 24),
              }}
            >
              ALCHEMYX GLOBAL
            </div>
            <div
              style={{
                fontFamily: BODY,
                fontWeight: 500,
                fontSize: pick(30, 34),
                color: COLORS.muted,
                letterSpacing: '0.42em',
                marginRight: '-0.42em',
                marginTop: 22,
                opacity: progress(frame, 52, 24),
              }}
            >
              PRESENTS
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
