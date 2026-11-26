import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeIn, easeInOut} from '../../anim';
import {COLORS, DISPLAY} from '../../theme';
import {At, beatPulse, hitPulse} from '../core';
import {Marquee, Slam, ease} from '../fx';
import {K, beatF} from '../timeline';

const L = K.launch; // beat 73
export const FINAL_Y = -430; // where the emblem sits on the end card

/** 34.9-38.7 s: LAUNCHING SOON on the beat, then the music stops and everything collapses into one point. */
export const Launch: React.FC = () => {
  const f = useCurrentFrame();
  const p = beatPulse(f, 5);
  const inv = (f >= beatF(75) && f < beatF(76)) || (f >= beatF(77) && f < beatF(78));
  const bg = inv ? COLORS.white : COLORS.violet;
  const ink = inv ? COLORS.violet : COLORS.white;
  const ghost = inv ? 'rgba(124,92,255,0.25)' : 'rgba(255,255,255,0.22)';
  const collapse = interpolate(f, [K.gap, K.gap + 11], [0, 1], {...clamp, easing: easeIn});
  const lean = interpolate(f, [beatF(78), K.gap], [0, 1], {...clamp, easing: easeIn});
  const big: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.05em', color: ink};
  return (
    <AbsoluteFill style={{background: COLORS.black}}>
      {collapse < 1 && (
        <AbsoluteFill
          style={{
            background: bg,
            overflow: 'hidden',
            transform: `scale(${(1 - collapse) * (1 + p * 0.03 + lean * 0.06)}) rotate(${collapse * 40 + lean * 3}deg)`,
            borderRadius: collapse * 400,
            filter: collapse > 0.02 ? `blur(${collapse * 8}px)` : undefined,
          }}
        >
          {[-720, -430, -140, 150, 440, 730].map((y, i) => (
            <Marquee key={y} text="RESONANCE · LAUNCHING SOON · " y={y} size={130} speed={i % 2 ? 0.16 : -0.16} stroke={ghost} rotate={-12} />
          ))}
          <At y={-170}>
            <Slam text="LAUNCHING" at={L} from={2.4} style={{...big, fontSize: 140}} />
          </At>
          <At y={110}>
            <Slam text="SOON" at={beatF(74)} from={2.6} style={{...big, fontSize: 300}} />
          </At>
          <At y={360}>
            <div style={{display: 'flex', gap: 18, opacity: ease(f, beatF(75), 6)}}>
              {[75, 76, 77, 78].map((b) => (
                <div key={b} style={{width: 22, height: 22, borderRadius: 99, background: f >= beatF(b) ? ink : ghost, transform: `scale(${1 + hitPulse(f, [beatF(b)], 4) * 0.8})`}} />
              ))}
            </div>
          </At>
        </AbsoluteFill>
      )}
      <Point />
    </AbsoluteFill>
  );
};

/** The silence: one violet point drifts up to where the emblem will be born, while rings close in on it. */
const Point: React.FC = () => {
  const f = useCurrentFrame();
  if (f < K.gap + 6) return null;
  const rise = interpolate(f, [K.gap + 10, K.final - 3], [0, 1], {...clamp, easing: easeInOut});
  const y = rise * FINAL_Y;
  const r = 9 + Math.sin(f / 4) * 2 + ease(f, K.final - 4, 4, easeIn) * 14;
  const rings = interpolate(f, [K.gap + 14, K.final], [0, 1], clamp);
  return (
    <At y={y}>
      <svg width={1} height={1} style={{overflow: 'visible'}}>
        {[0, 1, 2].map((k) => {
          const t = (rings * 1.6 + k / 3) % 1;
          return rings > 0 && <circle key={k} r={(1 - t) * 420 + 12} fill="none" stroke={COLORS.violet} strokeWidth={2 + t * 3} opacity={t * 0.6 * rings} />;
        })}
        <circle r={r * 5} fill="rgba(124,92,255,0.22)" />
        <circle r={r} fill={COLORS.violet} />
      </svg>
    </At>
  );
};
