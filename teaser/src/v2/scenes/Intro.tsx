import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, progress, useLayout} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {CUES, hitPulse, useSceneFrame} from '../core';
import {Backdrop, Letters, Shockwave} from '../visuals';

/** 0-4 s: a point of light, four bell notes that tease the ringtone, "AlchemyX Global presents". */
export const Intro: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {pick, diag} = useLayout();
  const bells = CUES.introBells;
  const dot = spring({frame: f - 8, fps, config: {damping: 10, mass: 0.6}});
  const ping = hitPulse(f, bells, 9);
  const streak = interpolate(f, [2, 34], [-0.25, 1.25], clamp);
  const tracking = interpolate(f, [22, 90], [0.75, 0.36], clamp);

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.25 + 0.6 * progress(f, 0, 70)} />
      {bells.map((b, i) => (
        <React.Fragment key={b}>
          <Shockwave at={b} maxR={diag * (0.3 + i * 0.06)} width={4} life={40} />
          <Shockwave at={b + 4} maxR={diag * (0.18 + i * 0.04)} width={2} color={COLORS.mist} life={36} />
        </React.Fragment>
      ))}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: 3,
          marginTop: -1,
          background: `linear-gradient(90deg, transparent ${streak * 100 - 28}%, rgba(194,180,255,0.95) ${streak * 100}%, transparent ${streak * 100 + 28}%)`,
          boxShadow: '0 0 24px rgba(124,92,255,0.8)',
          opacity: 1 - progress(f, 30, 16),
        }}
      />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            background: COLORS.white,
            transform: `scale(${dot * (1 + 0.6 * ping)})`,
            boxShadow: `0 0 ${40 + 70 * ping}px ${14 + 26 * ping}px rgba(124,92,255,0.7), 0 0 0 ${6 + 10 * ping}px rgba(124,92,255,0.35)`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{marginTop: pick(250, 290), textAlign: 'center'}}>
          <Letters
            text="ALCHEMYX GLOBAL"
            start={22}
            stagger={2}
            mode="blur"
            style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: pick(58, 60), color: COLORS.orange, letterSpacing: `${tracking}em`, marginRight: `-${tracking}em`}}
          />
          <div
            style={{
              marginTop: 24,
              fontFamily: BODY,
              fontWeight: 500,
              fontSize: pick(30, 34),
              color: COLORS.muted,
              letterSpacing: '0.5em',
              marginRight: '-0.5em',
              opacity: progress(f, 54, 20),
              filter: `blur(${(1 - progress(f, 54, 20)) * 8}px)`,
            }}
          >
            PRESENTS
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
