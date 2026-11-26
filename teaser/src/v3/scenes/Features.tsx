import React from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeInOut, easeOut} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, beatPulse, hitPulse} from '../core';
import {BeatTicks, Bg, Check, Emblem, Handset, Rise, Shock, Slam, ease} from '../fx';
import {BEAT, K} from '../timeline';

const beat = (start: number, n: number) => start + n * BEAT;

const headStyle = (color: string): CSSProperties => ({fontFamily: DISPLAY, fontWeight: 800, fontSize: 138, lineHeight: 1, letterSpacing: '-0.045em', color});

/** A headline whose words land on three consecutive beats, then a line underneath on beat 5. */
const Headline: React.FC<{start: number; line1: string[]; line2: string[]; color: string; accent: string; sub: string; subColor: string; dark?: boolean}> = ({
  start,
  line1,
  line2,
  color,
  accent,
  sub,
  subColor,
  dark = true,
}) => {
  const f = useCurrentFrame();
  const words = [...line1, ...line2];
  const row = (ws: string[], offset: number) => (
    <div style={{display: 'flex', justifyContent: 'center', gap: 30, height: 140, alignItems: 'center'}}>
      {ws.map((w, i) => {
        const k = offset + i;
        const last = k === words.length - 1;
        return <Slam key={w} text={w} at={beat(start, k)} from={1.9} split={dark ? hitPulse(f, [beat(start, k)], 5) * 0.8 : 0} style={headStyle(last ? accent : color)} />;
      })}
    </div>
  );
  return (
    <>
      <At y={240}>
        {row(line1, 0)}
        {row(line2, line1.length)}
      </At>
      <At y={470}>
        <Rise text={sub} at={beat(start, 4)} stagger={2} style={{fontFamily: BODY, fontWeight: 500, fontSize: 46, color: subColor}} />
      </At>
    </>
  );
};

const Index: React.FC<{n: string; stroke: string; start: number}> = ({n, stroke, start}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        right: -30,
        top: 90,
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: 420,
        lineHeight: 1,
        color: 'transparent',
        WebkitTextStroke: `3px ${stroke}`,
        transform: `translateX(${-(f - start) * 0.8}px)`,
        opacity: ease(f, start, 10),
      }}
    >
      {n}
    </div>
  );
};

// ---------- 01: answers every call (violet) ----------
export const F1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const S = K.f1;
  const p = beatPulse(f, 5);
  const local = Math.max(0, f - S);
  const dial = spring({frame: f - S, fps, config: {damping: 12, mass: 0.7}});
  const sweep = (local / (8 * BEAT)) * 720 - 90;
  const lit = Math.min(60, Math.floor((local / (8 * BEAT)) * 60));
  return (
    <AbsoluteFill>
      <Bg base={COLORS.violet} glows={['rgba(91,63,217,0.95)', 'rgba(239,235,255,0.22)']} pump={p} />
      {/* soft light rays */}
      <AbsoluteFill style={{background: `repeating-conic-gradient(from ${local * 0.4}deg at 50% 33%, rgba(255,255,255,0.07) 0deg 6deg, transparent 6deg 18deg)`, opacity: 0.8}} />
      <Index n="01" stroke="rgba(255,255,255,0.22)" start={S} />
      <Shock at={S + 1} y={-330} maxR={900} width={22} life={26} color="rgba(255,255,255,0.7)" />
      <At y={-330} style={{transform: `translate(-50%, -50%) translateY(-330px) scale(${dial * (1 + p * 0.045)}) rotate(${(1 - dial) * -60}deg)`}}>
        <svg width={700} height={700} style={{overflow: 'visible'}}>
          <circle cx={350} cy={350} r={300} fill="rgba(26,26,26,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
          {Array.from({length: 60}, (_, i) => {
            const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
            const big = i % 5 === 0;
            const r0 = big ? 258 : 270;
            const on = i < lit;
            return (
              <line
                key={i}
                x1={350 + Math.cos(a) * r0}
                y1={350 + Math.sin(a) * r0}
                x2={350 + Math.cos(a) * 288}
                y2={350 + Math.sin(a) * 288}
                stroke={on ? COLORS.white : 'rgba(255,255,255,0.28)'}
                strokeWidth={big ? 7 : 4}
                strokeLinecap="round"
              />
            );
          })}
          <line x1={350} y1={350} x2={350 + Math.cos((sweep * Math.PI) / 180) * 240} y2={350 + Math.sin((sweep * Math.PI) / 180) * 240} stroke={COLORS.mist} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
          <circle cx={350} cy={350} r={318} fill="none" stroke={COLORS.white} strokeWidth={3} opacity={p * 0.7} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 96, height: 96, borderRadius: 99, background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + p * 0.12}) rotate(${Math.sin(f * 1.3) * p * 14}deg)`}}>
            <Handset size={54} color={COLORS.violet} />
          </div>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 1, letterSpacing: '-0.04em', color: COLORS.white, marginTop: 18}}>24/7</div>
        </div>
      </At>
      <Headline start={S} line1={['Answers']} line2={['every', 'call.']} color={COLORS.white} accent={COLORS.white} sub="Day or night, it picks up." subColor={COLORS.mist} />
      <At y={680}>
        <BeatTicks start={S} on={COLORS.white} off="rgba(255,255,255,0.25)" />
      </At>
    </AbsoluteFill>
  );
};

// ---------- 02: knows your business (charcoal) ----------
const FACTS = ['Opening hours', 'Services', 'Prices', 'Location', 'FAQs', 'Policies'];

export const F2: React.FC = () => {
  const f = useCurrentFrame();
  const S = K.f2;
  const p = beatPulse(f, 5);
  const dip = interpolate(f, [K.dip, K.f3], [0, 1], {...clamp, easing: easeInOut});
  const spin = (f - S) * 0.35;
  return (
    <AbsoluteFill style={{transform: `scale(${1 - dip * 0.06})`, filter: dip > 0.01 ? `brightness(${1 - dip * 0.35})` : undefined}}>
      <Bg base={COLORS.black} glows={['rgba(124,92,255,0.32)', 'rgba(91,63,217,0.22)']} dust={COLORS.mist} dustCount={30} pump={p} />
      <Index n="02" stroke="rgba(124,92,255,0.35)" start={S} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {FACTS.map((_, i) => {
          const at = beat(S, i);
          const land = ease(f, at, 9, easeOut);
          if (land <= 0) return null;
          const a = (i / FACTS.length) * Math.PI * 2 + (spin * Math.PI) / 180 - Math.PI / 2;
          const x = 540 + Math.cos(a) * 360;
          const y = 630 + Math.sin(a) * 300;
          const flow = ((f - at) / BEAT) % 1;
          return (
            <g key={i} opacity={land}>
              <line x1={540} y1={630} x2={x} y2={y} stroke={COLORS.violet} strokeWidth={2.5} strokeDasharray="6 10" opacity={0.6} />
              <circle cx={x + (540 - x) * flow} cy={y + (630 - y) * flow} r={7} fill={COLORS.mist} opacity={1 - flow} />
            </g>
          );
        })}
      </svg>
      <At y={-330} style={{transform: `translate(-50%, -50%) translateY(-330px) scale(${ease(f, S, 12) * (1 + p * 0.05)})`}}>
        <Emblem r={105} id="f2-emb" />
      </At>
      {FACTS.map((label, i) => {
        const at = beat(S, i);
        if (f < at - 0.5) return null;
        const land = ease(f, at, 9, easeOut);
        const a = (i / FACTS.length) * Math.PI * 2 + (spin * Math.PI) / 180 - Math.PI / 2;
        const tx = Math.cos(a) * 360;
        const ty = -330 + Math.sin(a) * 300;
        const from = random(`fa${i}`) * Math.PI * 2;
        const x = tx + Math.cos(from) * 1400 * (1 - land);
        const y = ty + Math.sin(from) * 1400 * (1 - land);
        const hit = hitPulse(f, [at + 8], 5);
        return (
          <At key={label} x={x} y={y}>
            <div
              style={{
                padding: '16px 30px',
                borderRadius: 999,
                background: 'rgba(51,51,51,0.95)',
                border: `2px solid ${COLORS.violet}`,
                fontFamily: BODY,
                fontWeight: 600,
                fontSize: 34,
                color: COLORS.white,
                transform: `scale(${1 + hit * 0.15})`,
                boxShadow: `0 0 ${20 + hit * 40}px rgba(124,92,255,${0.35 + hit * 0.4})`,
              }}
            >
              {label}
            </div>
          </At>
        );
      })}
      <Headline start={S} line1={['Knows', 'your']} line2={['business.']} color={COLORS.white} accent={COLORS.violet} sub="Answers from the facts you give it." subColor={COLORS.muted} />
      <At y={680}>
        <BeatTicks start={S} on={COLORS.violet} off="rgba(255,255,255,0.15)" />
      </At>
    </AbsoluteFill>
  );
};

// ---------- 03: captures every lead (mist) ----------
const LEADS = ['Kasun P.', 'Amaya R.', 'Dinesh F.', 'Sara M.', 'Nuwan K.', 'Fathima Z.', 'Ravi S.', 'Ishara D.'];
const ASK = ['Callback request', 'Wants a quote', 'Callback request', 'Wants a demo', 'Callback request', 'Wants a quote', 'Callback request', 'Wants a demo'];

export const F3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const S = K.f3;
  const p = beatPulse(f, 5);
  const n = Math.max(0, Math.min(LEADS.length, Math.floor((f - S) / BEAT + 1e-6) + 1));
  const counter = spring({frame: f - S, fps, config: {damping: 12}});
  return (
    <AbsoluteFill>
      <Bg base={COLORS.mist} glows={['rgba(255,255,255,0.95)', 'rgba(124,92,255,0.18)']} pump={p} />
      <Index n="03" stroke="rgba(91,63,217,0.22)" start={S} />
      {/* counter */}
      <At y={-690} style={{transform: `translate(-50%, -50%) translateY(-690px) scale(${counter})`}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 30px', borderRadius: 999, background: COLORS.deepViolet, boxShadow: '0 16px 40px rgba(91,63,217,0.3)'}}>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 30, color: COLORS.mist, letterSpacing: '0.08em'}}>NEW LEADS</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: COLORS.white, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + p * 0.25})`}}>+{n}</div>
        </div>
      </At>
      {/* stack: the newest card lands on top on every beat */}
      {LEADS.map((name, i) => {
        const at = beat(S, i);
        if (f < at - 0.5) return null;
        // How far this card has been pushed back by the newer ones (smooth, one step per beat).
        let dd = 0;
        for (let j = i + 1; j < LEADS.length; j++) dd += ease(f, beat(S, j), 8, easeOut);
        if (dd > 3.4) return null;
        const s = spring({frame: f - at, fps, config: {damping: 14, mass: 0.6, stiffness: 220}});
        const x = (1 - s) * 1200;
        const y = -380 + dd * 62;
        return (
          <At key={name} x={x} y={y} style={{transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${(1 - s) * 8}deg) scale(${1 - dd * 0.06})`, opacity: 1 - Math.max(0, dd - 2.4)}}>
            <div
              style={{
                width: 840,
                height: 156,
                borderRadius: 40,
                background: COLORS.white,
                boxShadow: '0 22px 50px rgba(91,63,217,0.18), 0 2px 0 rgba(91,63,217,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '0 34px',
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            >
              <div style={{width: 92, height: 92, borderRadius: 99, background: `linear-gradient(145deg, #9D86FF, ${COLORS.deepViolet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 40, color: COLORS.white}}>
                {name[0]}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: COLORS.black}}>{name}</div>
                <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 28, color: COLORS.grey, marginTop: 4}}>{ASK[i]} · just now</div>
              </div>
              <Check size={64} color={COLORS.white} bg={COLORS.deepViolet} />
            </div>
          </At>
        );
      })}
      <Headline start={S} line1={['Captures']} line2={['every', 'lead.']} color={COLORS.black} accent={COLORS.deepViolet} sub="Takes callback requests for your team." subColor={COLORS.grey} dark={false} />
      <At y={680}>
        <BeatTicks start={S} on={COLORS.deepViolet} off="rgba(91,63,217,0.2)" />
      </At>
    </AbsoluteFill>
  );
};
