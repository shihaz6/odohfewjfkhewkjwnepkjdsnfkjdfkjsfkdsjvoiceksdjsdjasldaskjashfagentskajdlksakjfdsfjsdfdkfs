import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, fadeUp, progress, useLayout} from '../anim';
import {Background, Rings, Waveform} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';
import {Wordmark} from './Wordmark';

// Local frame. The music script places a bell here.
export const PILL_AT = 46;

/** End card: wordmark, "Launching soon", tagline and where to follow. */
export const Cta: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pick, diag} = useLayout();
  const enter = progress(frame, 0, 14);
  const out = interpolate(frame, [dur - 16, dur], [0, 1], clamp);
  const pill = spring({frame: frame - PILL_AT, fps, config: {damping: 10, mass: 0.7}});

  return (
    <AbsoluteFill style={{opacity: enter}}>
      <Background glow={1} />
      <AbsoluteFill>
        <Rings start={0} period={90} count={4} maxR={diag * 0.5} minR={120} stroke={2} opacity={0.45} />
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', marginTop: pick(-40, -120)}}>
        <div style={{...fadeUp(frame, 2, 20, 20), marginBottom: pick(40, 50)}}>
          <Waveform bars={21} width={pick(300, 320)} height={80} amp={0.55 + 0.25 * Math.sin(frame / 8)} gap={6} />
        </div>
        <Wordmark start={6} stagger={2} fontSize={pick(168, 124)} waveWidth={pick(940, 780)} waveStart={30} />
        <div
          style={{
            ...fadeUp(frame, 26, 20),
            marginTop: 30,
            fontFamily: BODY,
            fontWeight: 500,
            fontSize: pick(40, 42),
            color: COLORS.muted,
            letterSpacing: '0.04em',
          }}
        >
          by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
        </div>
        <div
          style={{
            marginTop: pick(52, 70),
            padding: '20px 46px',
            borderRadius: 999,
            background: COLORS.violet,
            color: COLORS.white,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: pick(36, 40),
            letterSpacing: '0.18em',
            opacity: Math.min(1, pill * 1.4),
            transform: `scale(${0.6 + 0.4 * pill})`,
            boxShadow: '0 0 60px rgba(124,92,255,0.35)',
          }}
        >
          LAUNCHING SOON
        </div>
        <div
          style={{
            ...fadeUp(frame, 62, 22),
            marginTop: pick(40, 56),
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: pick(40, 44),
            color: COLORS.white,
          }}
        >
          Where AI Meets Business
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: pick(80, 250)}}>
        <div style={{...fadeUp(frame, 78, 22, 24), textAlign: 'center'}}>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: pick(26, 30), color: COLORS.muted, letterSpacing: '0.06em'}}>
            Follow AlchemyX Global on
          </div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: pick(32, 34), color: COLORS.white, marginTop: 10}}>
            Facebook · Instagram · TikTok · LinkedIn
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{background: COLORS.black, opacity: out}} />
    </AbsoluteFill>
  );
};
