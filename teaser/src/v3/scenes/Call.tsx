import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, beatPulse, hitPulse, useAudio} from '../core';
import {Bg, Check, Slam, Sparkles} from '../fx';
import {BEAT, K, barF, beatF} from '../timeline';

const C = K.call;
// Phone geometry (screen px). The saved chip's centre is where the next scene opens from.
export const PHONE = {w: 800, h: 1180, cy: 180};
const PHONE_TOP = 960 + PHONE.cy - PHONE.h / 2; // 550
const CHIP_TOP = 990;
const CHIP_H = 92;
export const CHIP_SCREEN_Y = PHONE_TOP + CHIP_TOP + CHIP_H / 2; // 1526

type Who = 'caller' | 'agent';
const LINES: {who: Who; text: string; at: number}[] = [
  {who: 'caller', text: 'Hi! Are you open right now?', at: beatF(35)},
  {who: 'agent', text: "Yes, we're open 24 hours. How can I help?", at: barF(5)},
  {who: 'caller', text: 'Can someone call me back about a quote?', at: barF(6)},
  {who: 'agent', text: "Sure! What's your name?", at: beatF(43)},
];
const SAVED = barF(7);

/** 16-23.6 s: a live call, answered by Resonance, one line per beat. */
export const Call: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = beatPulse(f, 5);
  const enter = spring({frame: f - C, fps, config: {damping: 14, mass: 0.8, stiffness: 120}});
  // The short dip in the music: push in towards the saved chip.
  const push = interpolate(f, [K.miniGap, K.f1 + 4], [0, 1], {...clamp, easing: easeIn});
  const kick = hitPulse(f, LINES.map((l) => l.at).concat([SAVED]), 5);
  const head: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, lineHeight: 1, letterSpacing: '-0.035em'};
  return (
    <AbsoluteFill>
      <Bg base={COLORS.black} glows={['rgba(124,92,255,0.30)', 'rgba(91,63,217,0.22)']} dust={COLORS.mist} dustCount={30} pump={p} />
      <AbsoluteFill style={{transformOrigin: `540px ${CHIP_SCREEN_Y}px`, transform: `scale(${1 + push * 0.9})`}}>
        <At y={-780} style={{opacity: 1 - push}}>
          <Slam text="Meet your" at={C + 2} from={1.7} style={{...head, color: COLORS.white}} display="block" />
        </At>
        <At y={-680} style={{opacity: 1 - push}}>
          <Slam text="AI receptionist." at={C + BEAT} from={1.7} split={hitPulse(f, [C + BEAT], 6) * 0.8} style={{...head, color: COLORS.violet, textShadow: '0 0 40px rgba(124,92,255,0.5)'}} display="block" />
        </At>
        <div
          style={{
            position: 'absolute',
            left: (1080 - PHONE.w) / 2,
            top: PHONE_TOP,
            width: PHONE.w,
            height: PHONE.h,
            perspective: 2000,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transformOrigin: '50% 100%',
              transform: `translateY(${(1 - enter) * 1300 + kick * 6}px) rotateX(${(1 - enter) * 28}deg)`,
            }}
          >
            <Screen />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Screen: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {spectrum} = useAudio();
  const p = beatPulse(f, 5);
  const secs = Math.max(0, Math.floor((f - C) / fps));
  const chip = spring({frame: f - SAVED, fps, config: {damping: 10, mass: 0.6, stiffness: 200}});
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 84,
        background: 'linear-gradient(180deg, #221C38 0%, #141414 38%, #121212 100%)',
        border: '2px solid rgba(255,255,255,0.10)',
        boxShadow: `0 0 0 10px #0a0a0a, 0 0 0 12px rgba(255,255,255,0.08), 0 40px 120px rgba(0,0,0,0.6), 0 0 ${120 + p * 60}px rgba(124,92,255,${0.35 + p * 0.15})`,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* header */}
      <div style={{position: 'absolute', top: 56, left: 44, right: 44, display: 'flex', alignItems: 'center', gap: 24}}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 999,
            background: `radial-gradient(circle at 35% 30%, #BDAEFF, ${COLORS.violet} 50%, ${COLORS.deepViolet})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: `0 0 ${20 + p * 30}px rgba(124,92,255,0.8)`,
          }}
        >
          {[2, 6, 11, 6, 2].map((b, i) => (
            <div key={i} style={{width: 9, height: 14 + Math.min(1, (spectrum[b] ?? 0) * 1.2) * 40 * (1 - Math.abs(i - 2) * 0.18), borderRadius: 9, background: COLORS.white}} />
          ))}
        </div>
        <div style={{flex: 1, textAlign: 'left'}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: COLORS.white}}>Resonance</div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 28, color: COLORS.muted, marginTop: 2}}>AI receptionist</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 99, background: 'rgba(124,92,255,0.18)'}}>
            <div style={{width: 14, height: 14, borderRadius: 99, background: COLORS.violet, boxShadow: `0 0 ${6 + p * 14}px ${COLORS.violet}`, opacity: 0.6 + 0.4 * p}} />
            <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 22, letterSpacing: '0.16em', color: COLORS.mist}}>LIVE</div>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 28, color: COLORS.white, fontVariantNumeric: 'tabular-nums', marginTop: 10}}>00:{String(secs).padStart(2, '0')}</div>
        </div>
      </div>
      {/* live spectrum */}
      <div style={{position: 'absolute', top: 196, left: 40, right: 40, height: 150, borderRadius: 32, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7}}>
        {Array.from({length: 34}, (_, i) => {
          const mid = 16.5;
          const idx = Math.floor((Math.abs(i - mid) / mid) * 28);
          const v = Math.min(1, (spectrum[idx] ?? 0) * 1.25);
          return <div key={i} style={{width: 12, height: Math.max(12, 116 * v), borderRadius: 9, background: i % 4 === 0 ? COLORS.mist : COLORS.violet}} />;
        })}
      </div>
      {/* transcript */}
      <div style={{position: 'absolute', top: 384, left: 40, right: 40, display: 'flex', flexDirection: 'column', gap: 22}}>
        {LINES.map((l, i) => (
          <Bubble key={i} who={l.who} text={l.text} at={l.at} />
        ))}
      </div>
      {/* saved */}
      {f >= SAVED - 0.5 && (
        <div style={{position: 'absolute', top: CHIP_TOP, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              height: CHIP_H,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '0 40px 0 22px',
              borderRadius: 999,
              background: COLORS.mist,
              transform: `scale(${0.3 + 0.7 * chip})`,
              opacity: Math.min(1, chip * 2),
              boxShadow: `0 0 ${50 + p * 40}px rgba(124,92,255,0.55)`,
            }}
          >
            <Check size={56} color={COLORS.white} bg={COLORS.violet} />
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, color: COLORS.deepViolet}}>Callback request saved</div>
          </div>
        </div>
      )}
      <div style={{position: 'absolute', top: CHIP_TOP + CHIP_H / 2, left: 0, right: 0, height: 0}}>
        <Sparkles at={SAVED + 2} dist={380} count={14} color={COLORS.mist} />
      </div>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(125deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 30%, transparent 45%)'}} />
      <div style={{position: 'absolute', top: 18, left: '50%', width: 220, height: 34, transform: 'translateX(-50%)', borderRadius: 99, background: '#000'}} />
    </div>
  );
};

const Bubble: React.FC<{who: Who; text: string; at: number}> = ({who, text, at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at - 0.5) return null;
  const s = spring({frame: f - at, fps, config: {damping: 12, mass: 0.55, stiffness: 220}});
  const agent = who === 'agent';
  return (
    <div style={{display: 'flex', justifyContent: agent ? 'flex-end' : 'flex-start'}}>
      <div
        style={{
          maxWidth: 560,
          padding: '22px 30px',
          borderRadius: 36,
          borderTopLeftRadius: agent ? 36 : 10,
          borderTopRightRadius: agent ? 10 : 36,
          background: agent ? COLORS.violet : COLORS.grey,
          color: COLORS.white,
          fontFamily: BODY,
          fontWeight: 500,
          fontSize: 35,
          lineHeight: 1.3,
          textAlign: 'left',
          transformOrigin: agent ? '100% 0%' : '0% 0%',
          transform: `scale(${0.4 + 0.6 * s}) translateY(${(1 - s) * 30}px)`,
          opacity: Math.min(1, s * 2),
          boxShadow: agent ? '0 10px 40px rgba(124,92,255,0.35)' : '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
