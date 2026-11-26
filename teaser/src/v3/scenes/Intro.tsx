import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeIn, easeInOut} from '../../anim';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, hitPulse} from '../core';
import {Bg, Handset, MissedIcon, Rise, Shock, Slam, Tunnel, ease} from '../fx';
import {K} from '../timeline';

const [A1] = K.stabsA;
const [B1] = K.stabsB;
const BADGE_Y = 250;

/** 0-8.5 s: a signal, three rings nobody answers, three missed calls, and the question. */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  // The whole frame is sucked into a point just before the drop.
  const suck = interpolate(f, [K.build[4] - 1, K.drop], [0, 1], {...clamp, easing: easeIn});
  return (
    <AbsoluteFill>
      <Bg base={COLORS.black} glows={['rgba(124,92,255,0.20)', 'rgba(91,63,217,0.16)']} dust={COLORS.mist} />
      <Tunnel from={K.build[0] - 8} to={K.drop} />
      <AbsoluteFill
        style={{
          transform: `scale(${1 - suck * 0.97}) rotate(${-suck * 24}deg)`,
          filter: suck > 0.02 ? `blur(${(suck * 12).toFixed(2)}px)` : undefined,
        }}
      >
        {f < A1 + 2 && <Signal />}
        {f >= A1 - 1 && f < 160 && <RingBadge />}
        {f >= A1 - 1 && f < 150 && <RingWords />}
        {f >= B1 - 1 && f < 175 && <MissedCards />}
        {f >= 140 && f < 216 && <Someone />}
        {f >= K.build[0] - 1 && <Question />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A breathing violet point that draws a flat line: nobody on the other end yet. */
const Signal: React.FC = () => {
  const f = useCurrentFrame();
  const line = ease(f, 4, 50, easeInOut);
  const pop = interpolate(f, [A1 - 4, A1], [1, 3], {...clamp, easing: easeIn});
  const r = (7 + Math.sin(f / 6) * 2) * pop;
  return (
    <>
      <At y={BADGE_Y}>
        <svg width={900} height={80} style={{overflow: 'visible'}}>
          <defs>
            <linearGradient id="sigline" x1="0" x2="1">
              <stop offset="0%" stopColor={COLORS.violet} stopOpacity={0} />
              <stop offset="50%" stopColor={COLORS.violet} stopOpacity={1} />
              <stop offset="100%" stopColor={COLORS.violet} stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={450 - 450 * line} y={39} width={900 * line} height={3} fill="url(#sigline)" opacity={1 - ease(f, A1 - 6, 6)} />
          <circle cx={450} cy={40} r={r * 4} fill="rgba(124,92,255,0.25)" />
          <circle cx={450} cy={40} r={r} fill={COLORS.violet} />
        </svg>
      </At>
      <At y={-90}>
        <div style={{opacity: ease(f, 8, 18) * (1 - ease(f, A1 - 12, 10)), filter: `blur(${(1 - ease(f, 8, 18)) * 10 + ease(f, A1 - 12, 10) * 10}px)`}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: COLORS.orange, letterSpacing: '0.01em'}}>AlchemyX Global</div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 32, color: COLORS.muted, letterSpacing: '0.42em', marginTop: 16, marginRight: '-0.42em'}}>PRESENTS</div>
        </div>
      </At>
    </>
  );
};

/** The phone badge: it rings on every stab, then turns grey and hangs up. */
const RingBadge: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - A1, fps, config: {damping: 10, mass: 0.5, stiffness: 220}});
  const kick = hitPulse(f, K.stabsA, 4);
  const jolt = K.stabsA.reduce((acc, h, i) => (f >= h ? acc + Math.sin((f - h) * 1.4) * Math.exp(-(f - h) / 6) * 16 * (i % 2 ? -1 : 1) : acc), 0);
  const dead = ease(f, 96, 14, easeInOut);
  const hang = dead * 135;
  const bg = interpolateColors(dead, [0, 1], [COLORS.violet, COLORS.grey]);
  const leave = ease(f, 142, 14, easeIn);
  const status = f < 100 ? 'Incoming call…' : 'No answer.';
  const statusIn = f < 100 ? ease(f, A1 + 2, 10) : ease(f, 102, 10);
  return (
    <>
      {K.stabsA.map((h) => (
        <Shock key={h} at={h} y={BADGE_Y} maxR={520} width={10} life={24} color={COLORS.violet} />
      ))}
      <At y={BADGE_Y + leave * 500} style={{opacity: 1 - leave}}>
        <div style={{position: 'relative', transform: `scale(${s * (1 + kick * 0.16) * (1 - (f >= B1 ? 0.12 * ease(f, B1, 8) : 0))}) rotate(${jolt}deg)`}}>
          {/* ring arcs */}
          <svg width={520} height={520} style={{position: 'absolute', left: -130, top: -130, overflow: 'visible'}}>
            {[0, 1, 2].map((k) =>
              [-1, 1].map((side) => {
                const r = 175 + k * 42 + kick * 16;
                const a0 = side < 0 ? Math.PI - 0.5 : -0.5;
                const a1 = side < 0 ? Math.PI + 0.5 : 0.5;
                const x0 = 260 + r * Math.cos(a0);
                const y0 = 260 + r * Math.sin(a0);
                const x1 = 260 + r * Math.cos(a1);
                const y1 = 260 + r * Math.sin(a1);
                return (
                  <path
                    key={`${k}${side}`}
                    d={`M${x0} ${y0} A${r} ${r} 0 0 ${side < 0 ? 1 : 1} ${x1} ${y1}`}
                    fill="none"
                    stroke={COLORS.violet}
                    strokeWidth={9 - k * 2}
                    strokeLinecap="round"
                    opacity={kick * (1 - k * 0.25) * (1 - dead)}
                  />
                );
              }),
            )}
          </svg>
          <div
            style={{
              width: 260,
              height: 260,
              borderRadius: 999,
              background: bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 ${80 + kick * 90}px rgba(124,92,255,${0.55 * (1 - dead)}), inset 0 -14px 40px rgba(0,0,0,0.25)`,
            }}
          >
            <Handset size={130} color={COLORS.white} style={{transform: `rotate(${hang}deg)`}} />
          </div>
        </div>
      </At>
      <At y={BADGE_Y + 250 + leave * 500}>
        <div
          key={status}
          style={{
            fontFamily: BODY,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: '0.04em',
            color: f < 100 ? COLORS.mist : COLORS.muted,
            opacity: statusIn * (f < 100 ? 1 - ease(f, 92, 6) : 1) * (1 - leave),
            transform: `translateY(${(1 - statusIn) * 20}px)`,
          }}
        >
          {status}
        </div>
      </At>
    </>
  );
};

/** RING · RING · RING stamped above the badge, one per stab; they fall away when the calls are missed. */
const RingWords: React.FC = () => {
  const f = useCurrentFrame();
  const spots = [
    {x: -110, y: -610, rot: -7},
    {x: 120, y: -400, rot: 5},
    {x: -40, y: -190, rot: -3},
  ];
  return (
    <>
      {K.stabsA.map((h, i) => {
        if (f < h - 0.5) return null;
        const fillOut = ease(f, h + 5, 12);
        const t = Math.max(0, f - B1 + i * 2);
        const fall = t * t * 0.9;
        return (
          <At key={h} x={spots[i].x} y={spots[i].y + fall} style={{transform: `translate(-50%, -50%) translate(${spots[i].x}px, ${spots[i].y + fall}px) rotate(${spots[i].rot + t * (i - 1) * 1.6}deg)`, opacity: 1 - ease(f, B1 + 4, 16)}}>
            <Slam
              text="RING"
              at={h}
              from={2.6}
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 230,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: `rgba(255,255,255,${1 - fillOut})`,
                WebkitTextStroke: `4px ${COLORS.violet}`,
              }}
            />
          </At>
        );
      })}
    </>
  );
};

/** Three missed-call cards slam down, one per stab, then fly off. */
const MissedCards: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slots = [-640, -470, -300];
  return (
    <>
      {K.stabsB.map((h, i) => {
        if (f < h - 0.5) return null;
        const s = spring({frame: f - h, fps, config: {damping: 13, mass: 0.6, stiffness: 230}});
        const out = ease(f, 142 + i * 3, 12, easeIn);
        const y = slots[i] - (1 - s) * 700;
        return (
          <At key={h} x={out * 1300} y={y} style={{transform: `translate(-50%, -50%) translate(${out * 1300}px, ${y}px) rotate(${(1 - s) * -6 + out * 8}deg)`, filter: out > 0.02 ? `blur(${out * 12}px)` : undefined}}>
            <div
              style={{
                width: 880,
                height: 140,
                borderRadius: 36,
                background: 'rgba(51,51,51,0.94)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 34px',
                gap: 28,
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            >
              <div style={{width: 82, height: 82, borderRadius: 999, background: 'rgba(124,92,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <MissedIcon size={48} color={COLORS.violet} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 40, color: COLORS.white}}>Missed call</div>
                <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 28, color: COLORS.muted, marginTop: 4}}>Customer · just now</div>
              </div>
              <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 54, color: COLORS.mist, fontVariantNumeric: 'tabular-nums'}}>{i + 1}</div>
            </div>
          </At>
        );
      })}
    </>
  );
};

const Someone: React.FC = () => {
  const head: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, lineHeight: 1.05, letterSpacing: '-0.035em', color: COLORS.white};
  return (
    <At y={0}>
      <Rise text="Your customer" at={146} stagger={4} style={head} out={205} />
      <Rise text="calls someone else." at={156} stagger={4} style={head} out={205} accent={(i) => (i >= 1 ? {color: COLORS.violet} : undefined)} />
    </At>
  );
};

/** The build: WHAT IF / EVERY / CALL / WAS / ANSWERED? stack up on the accelerating hits. */
const Question: React.FC = () => {
  const f = useCurrentFrame();
  const [w1, w2, w3, w4, w5] = K.build;
  const zoom = interpolate(f, [w1, K.drop], [1, 1.12], {...clamp, easing: easeIn});
  const jit = hitPulse(f, K.build, 4) * 10;
  const base: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 800, lineHeight: 0.9, letterSpacing: '-0.04em', color: COLORS.white};
  const line = (text: string, at: number, size: number, extra?: React.CSSProperties) => (
    <div style={{height: size * 0.9, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <Slam text={text} at={at} from={2.2} split={hitPulse(f, [at], 5) * 0.9} style={{...base, fontSize: size, ...extra}} />
    </div>
  );
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${zoom}) translate(${Math.sin(f * 2.1) * jit}px, ${Math.cos(f * 1.7) * jit}px)`}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        {line('WHAT IF', w1, 170)}
        {line('EVERY', w2, 232)}
        {line('CALL', w3, 330, {color: COLORS.violet, textShadow: '0 0 60px rgba(124,92,255,0.6)'})}
        {line('WAS', w4, 170)}
        {line('ANSWERED?', w5, 150, {color: COLORS.mist})}
      </div>
    </AbsoluteFill>
  );
};
