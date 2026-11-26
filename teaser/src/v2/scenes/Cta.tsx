import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, easeInOut, progress, useLayout} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, CUES, beatPulse, hitPulse, sceneStart, useAudio, useSceneFrame} from '../core';
import {Backdrop, Burst, Orb, Shockwave, Wordmark2} from '../visuals';

const S = sceneStart('cta');
const PILL = CUES.pill - S;
const FINAL = CUES.final - S;

const rise = (f: number, at: number): React.CSSProperties => {
  const p = progress(f, at, 20);
  return {opacity: p, transform: `translateY(${(1 - p) * 26}px)`, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined};
};

/** 40-46 s: end card. Launching soon, the final hit, fade out. */
export const Cta: React.FC<{dur: number}> = ({dur}) => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {abs} = useAudio();
  const {pick, diag} = useLayout();
  const pulse = beatPulse(abs);
  const pill = spring({frame: f - PILL, fps, config: {damping: 9, mass: 0.7}});
  const final = hitPulse(f, [FINAL], 10);
  const out = interpolate(f, [dur - 22, dur], [0, 1], clamp);
  const pillShine = progress(f, PILL + 22, 24, easeInOut);
  const orbY = pick(-330, -460);

  return (
    <AbsoluteFill>
      <Backdrop intensity={1} />
      {[0, 6, 12].map((d) => (
        <Shockwave key={d} at={FINAL + d} y={orbY} maxR={diag * (0.6 - d * 0.012)} width={30 - d * 1.5} life={34} color={d === 0 ? COLORS.mist : COLORS.violet} />
      ))}
      <Burst at={FINAL} y={orbY} dist={diag * 0.5} count={50} life={30} seed="cta" thickness={3} />
      <AbsoluteFill style={{transform: `scale(${1 + final * 0.035})`}}>
        <At style={{transform: `translate(-50%, -50%) translate(0px, ${orbY}px) scale(${pick(0.48, 0.58) * spring({frame: f, fps, config: {damping: 12}}) * (1 + pulse * 0.05 + final * 0.15)})`}}>
          <Orb r={150} id="orb-cta" />
        </At>
        <At y={pick(-125, -190)}>
          <Wordmark2 start={4} stagger={2} fontSize={pick(168, 124)} waveWidth={pick(940, 780)} shineAt={[64, 112]} pulse={pulse} />
        </At>
        <At y={pick(45, -15)}>
          <div style={{...rise(f, 22), fontFamily: BODY, fontWeight: 500, fontSize: pick(42, 42), color: COLORS.muted, letterSpacing: '0.04em'}}>
            by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
          </div>
        </At>
        <At y={pick(150, 120)}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '22px 52px',
              borderRadius: 999,
              background: COLORS.violet,
              color: COLORS.white,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: pick(38, 42),
              letterSpacing: '0.18em',
              opacity: Math.min(1, pill * 1.4),
              transform: `scale(${(0.55 + 0.45 * pill) * (1 + final * 0.06)})`,
              boxShadow: `0 0 ${50 + final * 60}px rgba(124,92,255,${0.45 + final * 0.4})`,
            }}
          >
            LAUNCHING SOON
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${-30 + pillShine * 160}%`,
                width: '22%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                transform: 'skewX(-20deg)',
                opacity: pillShine > 0 && pillShine < 1 ? 1 : 0,
              }}
            />
          </div>
        </At>
        <At y={pick(258, 245)}>
          <div style={{...rise(f, 60), fontFamily: DISPLAY, fontWeight: 600, fontSize: pick(44, 46), color: COLORS.white}}>Where AI Meets Business</div>
        </At>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: pick(70, 250), textAlign: 'center', ...rise(f, 74)}}>
        <div style={{fontFamily: BODY, fontWeight: 500, fontSize: pick(26, 30), color: COLORS.muted, letterSpacing: '0.06em'}}>Follow AlchemyX Global on</div>
        <div style={{fontFamily: BODY, fontWeight: 600, fontSize: pick(32, 34), color: COLORS.white, marginTop: 10}}>Facebook · Instagram · TikTok · LinkedIn</div>
      </div>
      <AbsoluteFill style={{background: COLORS.white, opacity: final * 0.28}} />
      <AbsoluteFill style={{background: COLORS.black, opacity: out}} />
    </AbsoluteFill>
  );
};
