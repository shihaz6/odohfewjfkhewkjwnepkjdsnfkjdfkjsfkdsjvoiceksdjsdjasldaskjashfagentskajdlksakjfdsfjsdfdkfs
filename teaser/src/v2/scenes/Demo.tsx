import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, progress, useLayout} from '../../anim';
import {CheckIcon} from '../../components/visuals';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {CUES, beatPulse, hitPulse, sceneStart, useAudio, useSceneFrame} from '../core';
import {Phone} from '../Phone';
import {Backdrop, Bars, Sparkles, Words} from '../visuals';

const S = sceneStart('demo');
type Who = 'caller' | 'agent';
const LINES: {who: Who; text: string}[] = [
  {who: 'caller', text: 'Hi, are you open right now?'},
  {who: 'agent', text: "Yes, we're open twenty four hours. How can I help?"},
  {who: 'caller', text: 'Can someone call me back about a quote?'},
  {who: 'agent', text: 'Of course! May I have your name and business?'},
];
const TURNS = LINES.map((l, i) => {
  const start = CUES.turns[i] - S;
  return {...l, start, end: start + Math.min(52, 14 + l.text.length * 0.8)};
});
const SAVED = CUES.saved - S;

const talking = (f: number, who: Who) =>
  TURNS.filter((t) => t.who === who).reduce((m, t) => Math.max(m, interpolate(f, [t.start, t.start + 4, t.end, t.end + 6], [0, 1, 1, 0], clamp)), 0);

/** 24-34 s: the same kind of call, answered. A 3D phone with a live transcript. */
export const Demo: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {abs} = useAudio();
  const {pick, portrait} = useLayout();
  const enter = spring({frame: f, fps, config: {damping: 16, mass: 0.9}});
  const savedGlow = hitPulse(f, [SAVED], 14);
  const pulse = beatPulse(abs);

  const head: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 800, fontSize: pick(98, 84), lineHeight: 1.06, letterSpacing: '-0.035em', color: COLORS.white};
  const scale = pick(1.06, 1.0);
  const phoneY = pick(0, 235);

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.85} />
      <div style={portrait ? {position: 'absolute', top: 150, left: 60, right: 60, textAlign: 'center'} : {position: 'absolute', left: 150, top: '50%', transform: 'translateY(-50%)', width: 780}}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: pick(26, 28),
            letterSpacing: '0.22em',
            color: COLORS.violet,
            marginBottom: 24,
            opacity: progress(f, 4, 16),
            filter: `blur(${(1 - progress(f, 4, 16)) * 6}px)`,
          }}
        >
          MEET YOUR NEW FRONT DESK
        </div>
        <Words text="It picks up." start={10} stagger={3} style={head} />
        <Words text="It listens." start={TURNS[0].start + 2} stagger={3} style={head} />
        <Words
          text="It helps."
          start={TURNS[1].start + 2}
          stagger={3}
          style={{...head, color: COLORS.violet, textShadow: `0 0 ${20 + pulse * 30}px rgba(124,92,255,0.5)`}}
        />
        {!portrait && (
          <div style={{marginTop: 40, maxWidth: 640, fontFamily: BODY, fontSize: 34, lineHeight: 1.4, color: COLORS.muted, opacity: progress(f, 120, 20), transform: `translateY(${(1 - progress(f, 120, 20)) * 20}px)`}}>
            A natural voice that answers your callers, any hour of the day.
          </div>
        )}
      </div>

      <Phone
        w={440}
        h={900}
        rx={4 + Math.cos(f / 60) * 2 + (1 - enter) * 20}
        ry={pick(-16, -6) + Math.sin(f / 45) * 4 + (1 - enter) * -50}
        glow={0.3 + savedGlow * 0.9}
        screen={{background: 'linear-gradient(180deg, #241E3A 0%, #1A1A1A 46%)'}}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${pick(450, 0) + (1 - enter) * 300}px, ${phoneY}px) scale(${scale})`,
        }}
      >
        <CallScreen f={f} />
      </Phone>
      <Sparkles at={SAVED} x={pick(450, 0)} y={phoneY + 390 * scale} dist={200} count={12} />
    </AbsoluteFill>
  );
};

const CallScreen: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const agent = talking(f, 'agent');
  const caller = talking(f, 'caller');
  const saved = spring({frame: f - SAVED, fps, config: {damping: 11}});
  const status = agent > 0.5 ? 'Resonance is speaking' : caller > 0.5 ? 'Caller is speaking' : 'Listening';
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 76, left: 26, right: 26, display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 66, height: 66, borderRadius: 999, background: `linear-gradient(145deg, #9D86FF, ${COLORS.deepViolet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${10 + agent * 30}px rgba(124,92,255,0.8)`}}>
          <Bars count={5} width={36} height={30} color={COLORS.white} gain={0.4 + agent * 1.4} gap={3} />
        </div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, color: COLORS.white}}>Resonance</div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 19, color: COLORS.muted, marginTop: 2}}>AI receptionist</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end'}}>
            <div style={{width: 11, height: 11, borderRadius: 99, background: COLORS.violet, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 9))}} />
            <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 16, letterSpacing: '0.16em', color: COLORS.mist}}>LIVE</div>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 22, color: COLORS.white, fontVariantNumeric: 'tabular-nums', marginTop: 4}}>00:{String(Math.floor(Math.max(0, f) / fps)).padStart(2, '0')}</div>
        </div>
      </div>

      <div style={{position: 'absolute', top: 170, left: 22, right: 22, height: 118, borderRadius: 24, background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Bars count={30} width={340} height={84} color={agent >= caller ? COLORS.violet : COLORS.white} gain={0.25 + Math.max(agent, caller) * 1.3} gap={5} />
      </div>
      <div style={{position: 'absolute', top: 298, width: '100%', textAlign: 'center', fontFamily: BODY, fontWeight: 500, fontSize: 18, color: COLORS.muted}}>{status}</div>

      <div
        style={{
          position: 'absolute',
          top: 334,
          bottom: 30,
          left: 22,
          right: 22,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 14,
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 90px)',
          maskImage: 'linear-gradient(to bottom, transparent 0, black 90px)',
        }}
      >
        {TURNS.filter((t) => f >= t.start).map((t) => (
          <Bubble key={t.start} {...t} f={f} />
        ))}
        {f >= SAVED && (
          <div
            style={{
              alignSelf: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px 12px 16px',
              borderRadius: 999,
              background: COLORS.violet,
              boxShadow: '0 0 30px rgba(124,92,255,0.6)',
              opacity: Math.min(1, saved * 1.5),
              transform: `scale(${0.6 + 0.4 * saved})`,
            }}
          >
            <CheckIcon size={28} color={COLORS.white} draw={progress(f, SAVED + 3, 12)} />
            <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, color: COLORS.white}}>Callback request saved</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{who: Who; text: string; start: number; end: number; f: number}> = ({who, text, start, end, f}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: f - start, fps, config: {damping: 14, mass: 0.6}});
  const typed = Math.round(interpolate(f, [start + 2, end - 4], [0, text.length], clamp));
  const agent = who === 'agent';
  return (
    <div style={{alignSelf: agent ? 'flex-end' : 'flex-start', maxWidth: '86%', opacity: s, transform: `translateY(${(1 - s) * 26}px) scale(${0.9 + 0.1 * s})`, transformOrigin: agent ? 'right bottom' : 'left bottom'}}>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 14, letterSpacing: '0.16em', color: agent ? COLORS.mist : COLORS.muted, marginBottom: 6, textAlign: agent ? 'right' : 'left'}}>
        {agent ? 'RESONANCE' : 'CALLER'}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: agent ? 600 : 500,
          fontSize: 23,
          lineHeight: 1.32,
          padding: '13px 18px',
          borderRadius: 22,
          borderBottomRightRadius: agent ? 6 : 22,
          borderBottomLeftRadius: agent ? 22 : 6,
          background: agent ? COLORS.violet : '#333333',
          color: COLORS.white,
        }}
      >
        {text.slice(0, typed)}
        <span style={{color: 'transparent'}}>{text.slice(typed)}</span>
      </div>
    </div>
  );
};
