import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeInOut} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, beatPulse, hitPulse} from '../core';
import {Bg, Burst, Emblem, Marquee, Shock, Wave, Wordmark, ease} from '../fx';
import {K, TOTAL, beatF} from '../timeline';
import {FINAL_Y} from './Launch';

const F = K.final;

const rise = (f: number, at: number): React.CSSProperties => {
  const p = ease(f, at, 14);
  return {opacity: p, transform: `translateY(${(1 - p) * 28}px)`, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined};
};

/** 38.7-43 s: the last hit. The emblem is born from the point, then the end card. */
export const Final: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = beatPulse(f, 6) * 0.6;
  const hit = hitPulse(f, [F], 10);
  const emb = spring({frame: f - F, fps, config: {damping: 9, mass: 0.6, stiffness: 170}});
  const pillAt = beatF(82);
  const pill = spring({frame: f - pillAt, fps, config: {damping: 9, mass: 0.7}});
  const shine = ease(f, pillAt + 16, 22, easeInOut);
  const out = interpolate(f, [TOTAL - 22, TOTAL - 1], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Bg base={COLORS.black} glows={[`rgba(124,92,255,${0.3 + p * 0.2 + hit * 0.3})`, 'rgba(91,63,217,0.22)']} dust={COLORS.mist} pump={p} />
      <Marquee text="RESONANCE · " y={-830} size={130} speed={0.1} stroke="rgba(124,92,255,0.25)" opacity={ease(f, F, 20)} />
      <Marquee text="RESONANCE · " y={840} size={130} speed={-0.1} stroke="rgba(124,92,255,0.25)" opacity={ease(f, F, 20)} />
      {[0, 5, 10, 15].map((d, i) => (
        <Shock key={d} at={F + d} y={FINAL_Y} maxR={2000 - i * 260} width={40 - i * 8} life={34} color={i % 2 ? COLORS.mist : COLORS.violet} />
      ))}
      <Burst at={F} y={FINAL_Y} dist={1500} count={120} life={38} seed="final" thickness={6} />
      <AbsoluteFill style={{transform: `scale(${1 + hit * 0.04 + p * 0.015})`}}>
        <At y={FINAL_Y} style={{transform: `translate(-50%, -50%) translateY(${FINAL_Y}px) scale(${emb * 0.95})`}}>
          <Emblem r={140} id="final-emb" />
        </At>
        <At y={-130}>
          <Wordmark at={F + 1} size={122} stagger={1.2} />
        </At>
        <At y={-20}>
          <Wave at={F + 8} width={700} height={50} />
        </At>
        <At y={85}>
          <div style={{...rise(f, F + 6), fontFamily: BODY, fontWeight: 500, fontSize: 44, color: COLORS.muted, letterSpacing: '0.04em'}}>
            by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
          </div>
        </At>
        <At y={225}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: '24px 56px',
              borderRadius: 999,
              background: COLORS.violet,
              color: COLORS.white,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: '0.18em',
              opacity: f < pillAt ? 0 : Math.min(1, pill * 1.5),
              transform: `scale(${(0.5 + 0.5 * pill) * (1 + p * 0.04)})`,
              boxShadow: `0 0 ${60 + p * 50}px rgba(124,92,255,0.6)`,
            }}
          >
            LAUNCHING SOON
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${-30 + shine * 160}%`,
                width: '22%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                transform: 'skewX(-20deg)',
                opacity: shine > 0 && shine < 1 ? 1 : 0,
              }}
            />
          </div>
        </At>
        <At y={365}>
          <div style={{...rise(f, beatF(83)), fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, letterSpacing: '-0.01em', color: COLORS.white}}>Where AI Meets Business</div>
        </At>
      </AbsoluteFill>
      <At y={560}>
        <div style={rise(f, beatF(84))}>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 30, color: COLORS.muted, letterSpacing: '0.06em'}}>Follow AlchemyX Global on</div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 36, color: COLORS.white, marginTop: 12}}>Facebook · Instagram · TikTok · LinkedIn</div>
        </div>
      </At>
      <AbsoluteFill style={{background: COLORS.black, opacity: out}} />
    </AbsoluteFill>
  );
};
