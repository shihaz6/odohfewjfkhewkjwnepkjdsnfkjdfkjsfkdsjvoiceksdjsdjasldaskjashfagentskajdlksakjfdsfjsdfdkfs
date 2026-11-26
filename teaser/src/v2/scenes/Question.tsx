import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, spring, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {clamp, easeIn, progress, useLayout} from '../../anim';
import {COLORS, DISPLAY} from '../../theme';
import {CUES, hitPulse, sceneStart, useSceneFrame} from '../core';
import {Backdrop} from '../visuals';

const S = sceneStart('question');
const W = CUES.words.map((c) => c - S); // a word on every beat
const SUCK = CUES.suck - S;

const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 11, mass: 0.55}});
  const blur = (1 - Math.min(1, s)) * 14;
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${1.6 - 0.6 * s})`,
        opacity: Math.min(1, s * 1.5),
        filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** 14-18 s: "What if every call was answered?", one word per beat, then everything collapses into a point. */
export const Question: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {pick} = useLayout();
  const hit = hitPulse(f, W, 4);
  const bar = progress(f, W[3], 12);
  const suck = interpolate(f, [SUCK, SUCK + 11], [0, 1], {...clamp, easing: easeIn});
  const dark = progress(f, SUCK + 2, 8);
  const dot = progress(f, SUCK + 8, 7);

  const line: React.CSSProperties = {
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: pick(156, 112),
    lineHeight: 1.08,
    letterSpacing: '-0.035em',
    color: COLORS.black,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <AbsoluteFill>
      <Backdrop variant="light" />
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `translate(${noise2D('qx', f, 0) * 7 * hit}px, ${noise2D('qy', 0, f) * 7 * hit}px) scale(${(1 + f * 0.0009) * (1 - suck)}) rotate(${-suck * 10}deg)`,
          filter: suck > 0.01 ? `blur(${suck * 20}px)` : undefined,
          opacity: 1 - suck * 0.6,
        }}
      >
        <div style={line}>
          <Pop at={W[0]}>What</Pop> <Pop at={W[1]}>if</Pop>
        </div>
        <div style={{...line, position: 'relative', margin: '0.06em 0 0.1em'}}>
          <span style={{position: 'relative', display: 'inline-block', padding: '0 0.12em'}}>
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '2%',
                bottom: '-10%',
                background: COLORS.violet,
                borderRadius: '0.14em',
                transform: `scaleX(${bar})`,
                transformOrigin: 'left center',
              }}
            />
            <span style={{position: 'relative', color: interpolateColors(bar, [0.3, 0.9], [COLORS.black, COLORS.white])}}>
              <Pop at={W[2]}>every</Pop> <Pop at={W[3]}>call</Pop>
            </span>
          </span>
        </div>
        <div style={line}>
          <Pop at={W[4]}>was</Pop>{' '}
          <Pop at={W[5]} style={{color: COLORS.deepViolet}}>
            answered?
          </Pop>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: COLORS.black, opacity: dark}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 99,
            background: COLORS.white,
            opacity: dot,
            transform: `scale(${dot * (1 + 0.3 * Math.sin(f * 0.8))})`,
            boxShadow: '0 0 50px 18px rgba(124,92,255,0.75)',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
