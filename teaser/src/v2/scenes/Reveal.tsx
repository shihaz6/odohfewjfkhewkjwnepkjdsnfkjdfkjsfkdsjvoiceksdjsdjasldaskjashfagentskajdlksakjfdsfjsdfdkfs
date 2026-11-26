import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, easeInOut, progress, useLayout} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, beatPulse, useAudio, useSceneFrame} from '../core';
import {Backdrop, Burst, Orb, Shockwave, Wordmark2, Words} from '../visuals';

/** 18-24 s, the drop: a burst of light, the orb, RESONANCE, by AlchemyX Global. */
export const Reveal: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {abs} = useAudio();
  const {pick, portrait, diag} = useLayout();
  const pulse = beatPulse(abs);

  const grow = spring({frame: f, fps, config: {damping: 9, mass: 0.7}});
  const move = progress(f, 30, 26, easeInOut);
  const orbY = interpolate(move, [0, 1], [0, pick(-300, -400)]);
  const orbScale = grow * interpolate(move, [0, 1], [1, pick(0.5, 0.6)]) * (1 + pulse * 0.05);
  const flash = interpolate(f, [0, 2, 16], [1, 0.75, 0], clamp);

  return (
    <AbsoluteFill>
      <Backdrop intensity={1} />
      <Shockwave at={0} maxR={diag * 0.62} width={46} life={30} color={COLORS.mist} />
      <Shockwave at={4} maxR={diag * 0.5} width={24} life={32} />
      <Shockwave at={9} maxR={diag * 0.4} width={10} life={34} />
      <Burst at={0} dist={diag * 0.55} count={110} life={44} seed="rv" />
      {[15, 45, 75, 105, 135, 165].map((b) => (
        <Shockwave key={b} at={b} y={orbY} maxR={pick(420, 460)} width={3} life={30} color="rgba(124,92,255,0.6)" />
      ))}

      <AbsoluteFill style={{transform: `scale(${1 + f * 0.00028})`}}>
        <At y={orbY} style={{transform: `translate(-50%, -50%) translate(0px, ${orbY}px) scale(${orbScale})`}}>
          <Orb r={150} id="orb-reveal" />
        </At>
        <At y={pick(-10, -40)}>
          <Wordmark2 start={40} fontSize={pick(190, 124)} waveWidth={pick(1180, 780)} shineAt={[100, 150]} pulse={pulse} />
        </At>
        <At y={pick(160, 110)}>
          <div
            style={{
              fontFamily: BODY,
              fontWeight: 500,
              fontSize: pick(44, 42),
              color: COLORS.muted,
              letterSpacing: '0.04em',
              opacity: progress(f, 72, 18),
              transform: `translateY(${(1 - progress(f, 72, 18)) * 24}px)`,
              filter: `blur(${(1 - progress(f, 72, 18)) * 8}px)`,
            }}
          >
            by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
          </div>
        </At>
        <At y={pick(275, 270)}>
          <Words
            text="The AI voice agent for your business."
            start={96}
            stagger={4}
            breakAfter={portrait ? [3] : []}
            accent={(i) => (i === 2 || i === 3 ? {color: COLORS.violet} : undefined)}
            style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: pick(58, 58), lineHeight: 1.2, letterSpacing: '-0.01em', color: COLORS.white}}
          />
        </At>
      </AbsoluteFill>
      <AbsoluteFill style={{background: COLORS.white, opacity: flash}} />
    </AbsoluteFill>
  );
};
