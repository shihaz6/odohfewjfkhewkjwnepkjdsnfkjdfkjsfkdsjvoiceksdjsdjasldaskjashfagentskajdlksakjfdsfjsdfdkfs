import React from 'react';
import {AbsoluteFill, spring, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {useLayout} from '../../anim';
import {MissedIcon} from '../../components/visuals';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {CUES, hitPulse, sceneStart, useSceneFrame} from '../core';
import {Backdrop, Words} from '../visuals';

const S = sceneStart('missed');
const NOTIFY = CUES.notify.map((c) => c - S);
const HEART = CUES.heart.map((c) => c - S);
const TIMES = ['9:42 PM', '11:15 PM', '6:03 AM', '8:27 AM', '1:10 PM', '3:52 PM', '7:31 PM'];

/** 10-14 s: missed-call notifications pile up on the beat while a counter climbs. */
export const Missed: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {pick, portrait} = useLayout();
  const count = NOTIFY.filter((n) => f >= n).length;
  const hit = hitPulse(f, NOTIFY, 5);
  const heart = hitPulse(f, HEART, 9);
  const shakeX = noise2D('mx', f * 0.6, 0) * 5 * hit;
  const shakeY = noise2D('my', 0, f * 0.6) * 5 * hit;

  const cardW = pick(660, 900);
  const cardH = pick(116, 128);
  const gap = 16;

  const counter = (
    <div style={{textAlign: portrait ? 'center' : 'left'}}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: pick(250, 230),
          lineHeight: 0.9,
          color: COLORS.white,
          fontVariantNumeric: 'tabular-nums',
          transform: `scale(${1 + hit * 0.1})`,
          transformOrigin: portrait ? '50% 60%' : '20% 60%',
          textShadow: `0 0 ${30 + hit * 60}px rgba(124,92,255,${0.4 + hit * 0.5})`,
        }}
      >
        {count}
      </div>
      <div style={{fontFamily: BODY, fontWeight: 600, fontSize: pick(46, 46), color: COLORS.muted, marginTop: 10}}>
        missed call{count === 1 ? '' : 's'}
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.55 + heart * 0.45} />
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px)`}}>
        {portrait ? (
          <div style={{position: 'absolute', top: 170, left: 0, right: 0}}>{counter}</div>
        ) : (
          <div style={{position: 'absolute', left: 150, top: 200}}>{counter}</div>
        )}

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: pick('50%', '33%'),
            width: cardW,
            height: 1,
            transform: `translate(-50%, 0) translate(${pick(430, 0)}px, ${pick(-cardH * 2.2, 0)}px)`,
            perspective: 1600,
          }}
        >
          <div style={{transformStyle: 'preserve-3d', transform: `rotateX(${pick(10, 14)}deg) rotateY(${pick(-16, 0)}deg)`}}>
            {NOTIFY.map((n, i) => {
              const s = spring({frame: f - n, fps, config: {damping: 15, mass: 0.7}});
              if (s <= 0.001) return null;
              const k = NOTIFY.slice(i + 1).reduce((acc, m) => acc + spring({frame: f - m, fps, config: {damping: 15, mass: 0.7}}), 0);
              const y = k * (cardH + gap) - (1 - s) * 170;
              const blur = (1 - Math.min(1, s)) * 10 + Math.max(0, k - 2.5) * 2.2;
              return (
                <div
                  key={n}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: cardW,
                    height: cardH,
                    transform: `translateY(${y}px) translateZ(${-k * 40}px) scale(${(1.08 - 0.08 * s) * (1 - k * 0.03)})`,
                    opacity: Math.min(1, s * 1.4) * Math.max(0, 1 - Math.max(0, k - 2.6) * 0.8),
                    filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
                    borderRadius: 30,
                    background: 'rgba(51,51,51,0.94)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    padding: '0 30px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{width: 64, height: 64, flexShrink: 0, borderRadius: 999, background: 'rgba(124,92,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <MissedIcon size={34} color={COLORS.mist} />
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: pick(34, 36), color: COLORS.white}}>Missed call</div>
                    <div style={{fontFamily: BODY, fontWeight: 500, fontSize: pick(24, 26), color: COLORS.muted, marginTop: 4}}>New customer · {TIMES[i]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={
            portrait
              ? {position: 'absolute', bottom: 260, left: 60, right: 60, textAlign: 'center'}
              : {position: 'absolute', left: 150, bottom: 200, width: 760}
          }
        >
          <Words
            text="Your customer calls someone else."
            start={50}
            stagger={4}
            breakAfter={[2]}
            accent={(i) => (i >= 3 ? {color: COLORS.violet} : undefined)}
            style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: pick(70, 72), lineHeight: 1.1, letterSpacing: '-0.02em', color: COLORS.white}}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
