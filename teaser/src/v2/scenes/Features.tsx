import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, easeInOut, useLayout} from '../../anim';
import {FeatureIcon} from '../../components/visuals';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {CUES, beatPulse, sceneStart, useAudio, useSceneFrame} from '../core';
import {Backdrop, Shockwave, Words} from '../visuals';

const S = sceneStart('features');
const HITS = CUES.features.map((c) => c - S); // one panel per bar, each landing on the downbeat

type Panel = {
  kind: 'call' | 'knowledge' | 'lead';
  title: string;
  body: string;
  bg: 'dark' | 'violet' | 'mist';
  title_c: string;
  body_c: string;
  badge: string;
  icon: string;
  stroke: string;
  bar: [string, string];
};
const PANELS: Panel[] = [
  {kind: 'call', title: 'Answers every call', body: 'Day or night, it picks up.', bg: 'dark', title_c: COLORS.white, body_c: COLORS.muted, badge: COLORS.violet, icon: COLORS.white, stroke: 'rgba(124,92,255,0.38)', bar: [COLORS.violet, 'rgba(255,255,255,0.2)']},
  {kind: 'knowledge', title: 'Knows your business', body: 'Answers from the facts you give it.', bg: 'violet', title_c: COLORS.white, body_c: 'rgba(255,255,255,0.92)', badge: COLORS.white, icon: COLORS.violet, stroke: 'rgba(255,255,255,0.3)', bar: [COLORS.white, 'rgba(255,255,255,0.35)']},
  {kind: 'lead', title: 'Captures every lead', body: 'Takes callback requests for your team.', bg: 'mist', title_c: COLORS.black, body_c: COLORS.grey, badge: COLORS.deepViolet, icon: COLORS.white, stroke: 'rgba(91,63,217,0.25)', bar: [COLORS.deepViolet, 'rgba(91,63,217,0.25)']},
];

/** 34-40 s: three full-screen beats, one per bar, each slamming in on the downbeat. */
export const Features: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {width: W, height: H} = useLayout();
  return (
    <AbsoluteFill>
      {PANELS.map((p, i) => {
        const start = HITS[i];
        if (i > 0 && f < start - 9) return null;
        // Diagonal slam: the panel sweeps in from the right and covers the frame on the beat.
        const skew = H * 0.27;
        const e = i === 0 ? 0 : interpolate(f, [start - 9, start], [W + skew, 0], {...clamp, easing: easeInOut});
        const clip = i === 0 ? undefined : `polygon(${e}px 0, ${W + skew}px 0, ${W + skew}px ${H}px, ${e - skew}px ${H}px)`;
        return (
          <AbsoluteFill key={p.kind} style={{clipPath: clip, WebkitClipPath: clip}}>
            <PanelView p={p} i={i} start={start} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const PanelView: React.FC<{p: Panel; i: number; start: number}> = ({p, i, start}) => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {abs} = useAudio();
  const {pick, portrait} = useLayout();
  const pulse = beatPulse(abs);
  const badge = spring({frame: f - start - 1, fps, config: {damping: 10, mass: 0.6}});
  const local = f - start;
  return (
    <AbsoluteFill>
      <Backdrop variant={p.bg} intensity={0.9} />
      <div
        style={{
          position: 'absolute',
          right: pick(-40, -60),
          top: pick(-120, 120),
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: pick(560, 520),
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${p.stroke}`,
          transform: `translateX(${-local * 0.9}px)`,
        }}
      >
        0{i + 1}
      </div>
      <Shockwave at={start + 1} maxR={pick(700, 640)} width={18} life={26} color={p.stroke} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 70px'}}>
        <div
          style={{
            width: pick(176, 168),
            height: pick(176, 168),
            borderRadius: 999,
            background: p.badge,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${badge * (1 + pulse * 0.06)}) rotate(${(1 - badge) * -40}deg)`,
            boxShadow: `0 20px 60px rgba(0,0,0,${p.bg === 'mist' ? 0.15 : 0.35})`,
          }}
        >
          <FeatureIcon kind={p.kind} size={pick(100, 96)} color={p.icon} />
        </div>
        <Words
          text={p.title}
          start={start + 4}
          stagger={3}
          breakAfter={portrait ? [p.kind === 'call' ? 0 : 1] : []}
          style={{marginTop: pick(54, 60), fontFamily: DISPLAY, fontWeight: 800, fontSize: pick(132, 112), lineHeight: 1.04, letterSpacing: '-0.035em', color: p.title_c}}
        />
        <Words text={p.body} start={start + 14} stagger={2} style={{marginTop: 28, fontFamily: BODY, fontWeight: 500, fontSize: pick(46, 44), lineHeight: 1.3, color: p.body_c}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', bottom: pick(90, 250), left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{width: k === i ? 90 : 46, height: 8, borderRadius: 9, background: k === i ? p.bar[0] : p.bar[1]}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
