import React from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {clamp, easeIn, easeOut} from '../anim';
import {COLORS, DISPLAY} from '../theme';
import {barPulse, beatPulse, inGroove, useAudio} from './core';
import {BEAT, beatF} from './timeline';

// ---------- backgrounds ----------
/** A flat colour with drifting light fields and (optionally) rising dust. */
export const Bg: React.FC<{base: string; glows?: string[]; dust?: string; dustCount?: number; pump?: number}> = ({
  base,
  glows = [],
  dust,
  dustCount = 46,
  pump = 0,
}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = f * 0.004;
  return (
    <AbsoluteFill style={{background: base, overflow: 'hidden'}}>
      {glows.map((g, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${50 + noise2D(`gx${i}`, t, i * 5) * 34}%`,
            top: `${50 + noise2D(`gy${i}`, i * 5, t) * 30}%`,
            width: height * (0.95 + 0.25 * i) * (1 + pump * 0.06),
            height: height * (0.95 + 0.25 * i) * (1 + pump * 0.06),
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${g} 0%, transparent 60%)`,
          }}
        />
      ))}
      {dust &&
        Array.from({length: dustCount}, (_, i) => {
          const depth = 0.3 + random(`dd${i}`) * 0.7;
          const x = random(`dx${i}`) * width + noise2D(`dn${i}`, f * 0.01, 0) * 30;
          const y = (((random(`dy${i}`) * height - f * depth * 1.4) % height) + height) % height;
          const s = 2 + depth * 4;
          return (
            <div
              key={i}
              style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: 9, background: dust, opacity: depth * 0.5 * (0.5 + 0.5 * Math.sin(f / 9 + i))}}
            />
          );
        })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 75% 60% at 50% 50%, transparent 45%, rgba(0,0,0,${strength}) 100%)`}} />
);

/** Film grain: animated fractal noise, blended softly over everything. */
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.075, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%">
        <filter id="v3grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#v3grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** A row of huge outlined words scrolling sideways, seamlessly. */
export const Marquee: React.FC<{text: string; y: number; size: number; speed: number; stroke: string; fill?: string; rotate?: number; opacity?: number}> = ({
  text,
  y,
  size,
  speed,
  stroke,
  fill,
  rotate = 0,
  opacity = 1,
}) => {
  const f = useCurrentFrame();
  const pct = (((f * speed) % 50) + 50) % 50;
  const unit = new Array(6).fill(text).join('');
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 4200,
        overflow: 'hidden',
        opacity,
        transform: `translate(-50%, -50%) translateY(${y}px) rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          whiteSpace: 'pre',
          transform: `translateX(-${pct}%)`,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: fill ?? 'transparent',
          WebkitTextStroke: `3px ${stroke}`,
        }}
      >
        <span>{unit}</span>
        <span>{unit}</span>
      </div>
    </div>
  );
};

// ---------- impacts ----------
const Point: React.FC<{x: number; y: number; children: React.ReactNode}> = ({x, y, children}) => (
  <svg width={1} height={1} style={{position: 'absolute', left: '50%', top: '50%', overflow: 'visible', transform: `translate(${x}px, ${y}px)`}}>
    {children}
  </svg>
);

/** One expanding ring. */
export const Shock: React.FC<{at: number; maxR: number; width?: number; color?: string; life?: number; x?: number; y?: number}> = ({
  at,
  maxR,
  width = 8,
  color = COLORS.violet,
  life = 30,
  x = 0,
  y = 0,
}) => {
  const f = useCurrentFrame();
  const p = (f - at) / life;
  if (p < 0 || p > 1) return null;
  return (
    <Point x={x} y={y}>
      <circle r={maxR * easeOut(p)} fill="none" stroke={color} strokeWidth={Math.max(1, width * (1 - p))} opacity={(1 - p) ** 1.2} />
    </Point>
  );
};

/** Light streaks flying out of a point. */
export const Burst: React.FC<{at: number; dist: number; count?: number; life?: number; x?: number; y?: number; seed?: string; thickness?: number; colors?: string[]}> = ({
  at,
  dist,
  count = 80,
  life = 34,
  x = 0,
  y = 0,
  seed = 'b',
  thickness = 5,
  colors = [COLORS.violet, COLORS.mist, COLORS.white],
}) => {
  const f = useCurrentFrame();
  const p = (f - at) / life;
  if (p < 0 || p > 1) return null;
  return (
    <Point x={x} y={y}>
      {Array.from({length: count}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.25 + 0.75 * random(`${seed}s${i}`);
        const d = dist * sp * easeOut(p);
        const len = (1 - p) * sp * 160 + 6;
        const d0 = Math.max(0, d - len);
        return (
          <line
            key={i}
            x1={Math.cos(a) * d0}
            y1={Math.sin(a) * d0}
            x2={Math.cos(a) * d}
            y2={Math.sin(a) * d}
            stroke={colors[Math.floor(random(`${seed}c${i}`) * colors.length)]}
            strokeWidth={thickness * (1 - p * 0.6)}
            strokeLinecap="round"
            opacity={1 - p}
          />
        );
      })}
    </Point>
  );
};

/** Four-point stars popping out of a point. */
export const Sparkles: React.FC<{at: number; dist?: number; count?: number; color?: string; x?: number; y?: number; size?: number}> = ({
  at,
  dist = 160,
  count = 12,
  color = COLORS.violet,
  x = 0,
  y = 0,
  size = 16,
}) => {
  const f = useCurrentFrame();
  const p = (f - at) / 30;
  if (p < 0 || p > 1) return null;
  return (
    <Point x={x} y={y}>
      {Array.from({length: count}, (_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`spk${i}`) * 0.5;
        const d = dist * (0.55 + 0.45 * random(`spd${i}`)) * easeOut(p);
        const s = size * Math.sin(p * Math.PI) * (0.6 + random(`sps${i}`) * 0.6);
        const cx = Math.cos(a) * d;
        const cy = Math.sin(a) * d * 0.7;
        return (
          <path
            key={i}
            d={`M${cx} ${cy - s} L${cx + s * 0.26} ${cy - s * 0.26} L${cx + s} ${cy} L${cx + s * 0.26} ${cy + s * 0.26} L${cx} ${cy + s} L${cx - s * 0.26} ${cy + s * 0.26} L${cx - s} ${cy} L${cx - s * 0.26} ${cy - s * 0.26} Z`}
            fill={color}
          />
        );
      })}
    </Point>
  );
};

/** Rings rushing in towards the centre, faster and faster (the build-up). */
export const Tunnel: React.FC<{from: number; to: number; color?: string; count?: number}> = ({from, to, color = COLORS.violet, count = 9}) => {
  const f = useCurrentFrame();
  const {height} = useVideoConfig();
  if (f < from || f > to + 2) return null;
  const p = (f - from) / (to - from);
  const travel = p * p * 5.5; // accelerating
  const fade = interpolate(f, [from, from + 10], [0, 1], clamp);
  return (
    <Point x={0} y={0}>
      {Array.from({length: count}, (_, i) => {
        const k = (((i / count - travel) % 1) + 1) % 1; // 1 = outside, 0 = centre
        const r = height * 0.85 * k ** 1.6;
        return <circle key={i} r={r} fill="none" stroke={i % 3 === 0 ? COLORS.mist : color} strokeWidth={2 + 6 * k} opacity={fade * (0.15 + 0.5 * (1 - k)) * Math.min(1, k * 8)} />;
      })}
    </Point>
  );
};

// ---------- typography ----------
type Txt = {style?: CSSProperties; split?: number};

/** A word that slams in from big and blurred, with an optional violet/mist colour split. */
export const Slam: React.FC<Txt & {text: string; at: number; from?: number; out?: number; outDur?: number; display?: CSSProperties['display']}> = ({
  text,
  at,
  from = 2.1,
  out,
  outDur = 8,
  style,
  split = 0,
  display = 'inline-block',
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at - 0.5) return null;
  const s = spring({frame: f - at, fps, config: {damping: 13, mass: 0.5, stiffness: 210}});
  const o = out === undefined ? 0 : interpolate(f, [out, out + outDur], [0, 1], {...clamp, easing: easeIn});
  if (o >= 1) return null;
  const blur = Math.max(0, 1 - s) * 18 + o * 14;
  return (
    <div
      style={{
        position: 'relative',
        display,
        whiteSpace: 'pre',
        transform: `scale(${(from - (from - 1) * s) * (1 - o * 0.25)})`,
        opacity: Math.min(1, s * 2.2) * (1 - o),
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      }}
    >
      {split > 0.03 && (
        <>
          <div style={{...style, position: 'absolute', inset: 0, color: COLORS.violet, WebkitTextStroke: undefined, transform: `translate(${-split * 16}px, ${split * 4}px)`, opacity: split}}>{text}</div>
          <div style={{...style, position: 'absolute', inset: 0, color: COLORS.mist, WebkitTextStroke: undefined, transform: `translate(${split * 16}px, ${-split * 4}px)`, opacity: split * 0.7}}>{text}</div>
        </>
      )}
      <div style={{...style, position: 'relative'}}>{text}</div>
    </div>
  );
};

/** Words that rise in one after another and can blur back out. */
export const Rise: React.FC<{text: string; at: number; stagger?: number; style?: CSSProperties; accent?: (i: number) => CSSProperties | undefined; out?: number}> = ({
  text,
  at,
  stagger = 3,
  style,
  accent,
  out,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const o = out === undefined ? 0 : interpolate(f, [out, out + 9], [0, 1], {...clamp, easing: easeIn});
  if (o >= 1) return null;
  const words = text.split(' ');
  return (
    <div style={style}>
      {words.map((w, i) => {
        const s = spring({frame: f - at - i * stagger, fps, config: {damping: 15, mass: 0.6}});
        const blur = (1 - Math.min(1, s)) * 12 + o * 14;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: Math.min(1, s * 1.4) * (1 - o),
              transform: `translateY(${(1 - s) * 0.6 - o * 0.3}em)`,
              filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
              ...accent?.(i),
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** RESONANCE: each letter slams in from a scattered height; the colours split on every bar. */
export const Wordmark: React.FC<{at: number; size: number; stagger?: number}> = ({at, size, stagger = 1.6}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bp = barPulse(f, 6);
  return (
    <div style={{display: 'flex', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: '0.05em', marginRight: '-0.05em'}}>
      {'RESONANCE'.split('').map((ch, i) => {
        const s = spring({frame: f - at - i * stagger, fps, config: {damping: 12, mass: 0.5, stiffness: 200}});
        const blur = (1 - Math.min(1, s)) * 16;
        const y = (1 - s) * (random(`wm${i}`) - 0.5) * size * 1.6;
        return (
          <span
            key={i}
            style={{
              position: 'relative',
              display: 'inline-block',
              transform: `translateY(${y}px) scale(${2.4 - 1.4 * s})`,
              opacity: Math.min(1, s * 2),
              filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
            }}
          >
            {bp > 0.04 && (
              <>
                <span style={{position: 'absolute', left: 0, top: 0, color: COLORS.violet, transform: `translateX(${-bp * 14}px)`, opacity: bp}}>{ch}</span>
                <span style={{position: 'absolute', left: 0, top: 0, color: COLORS.mist, transform: `translateX(${bp * 14}px)`, opacity: bp * 0.7}}>{ch}</span>
              </>
            )}
            <span style={{position: 'relative', color: COLORS.white, textShadow: '0 0 46px rgba(124,92,255,0.6)'}}>{ch}</span>
          </span>
        );
      })}
    </div>
  );
};

/** A wave that draws itself and moves with the bass. */
export const Wave: React.FC<{at: number; width: number; height: number; color?: string; stroke?: number}> = ({at, width, height, color = COLORS.violet, stroke = 6}) => {
  const f = useCurrentFrame();
  const {bass} = useAudio();
  const draw = interpolate(f, [at, at + 26], [0, 1], {...clamp, easing: easeOut});
  const amp = (0.3 + Math.min(1, bass * 1.3) * 0.7) * (height / 2 - stroke);
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const x = (i / 160) * width;
    const env = Math.sin((i / 160) * Math.PI) ** 1.5;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(height / 2 + Math.sin(i * 0.36 - f * 0.3) * Math.cos(i * 0.09 + f * 0.05) * amp * env).toFixed(1)} `;
  }
  const len = width * 2;
  return (
    <svg width={width} height={height} style={{overflow: 'visible', display: 'block'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </svg>
  );
};

// ---------- the Resonance emblem ----------
/** A glowing core with a live equaliser, wobbling rings and a ripple on every beat. */
export const Emblem: React.FC<{r: number; id: string}> = ({r, id}) => {
  const f = useCurrentFrame();
  const {spectrum, bass} = useAudio();
  const p = beatPulse(f, 6);
  const e = Math.min(1, bass * 1.3);
  const size = r * 4;
  const c = size / 2;
  const ring = (rr: number, lobes: number, amp: number, speed: number, phase: number) => {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const k = rr * (1 + amp * Math.sin(lobes * a + f * speed + phase));
      d += `${i ? 'L' : 'M'}${(c + k * Math.cos(a)).toFixed(1)} ${(c + k * Math.sin(a)).toFixed(1)} `;
    }
    return d + 'Z';
  };
  const now = Math.floor((f - beatF(0)) / BEAT);
  const ripples = [0, 1, 2]
    .map((k) => {
      const at = beatF(now - k);
      const age = (f - at) / (BEAT * 3);
      return inGroove(at) && age >= 0 && age <= 1 ? age : -1;
    })
    .filter((a) => a >= 0);
  const bins = [2, 6, 11, 6, 2];
  const bw = r * 0.13;
  const gap = r * 0.09;
  const total = bins.length * bw + (bins.length - 1) * gap;
  return (
    <svg width={size} height={size} style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <radialGradient id={`${id}-core`} cx="36%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#BDAEFF" />
          <stop offset="48%" stopColor={COLORS.violet} />
          <stop offset="100%" stopColor={COLORS.deepViolet} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="rgba(124,92,255,0.6)" />
          <stop offset="100%" stopColor="rgba(124,92,255,0)" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r * (1.9 + p * 0.25 + e * 0.2)} fill={`url(#${id}-glow)`} />
      {ripples.map((a, i) => (
        <circle key={i} cx={c} cy={c} r={r * (1.08 + a * 0.95)} fill="none" stroke={COLORS.mist} strokeWidth={4 * (1 - a) + 1} opacity={(1 - a) * 0.55} />
      ))}
      <path d={ring(r * 1.45, 6, 0.02 + 0.035 * e, 0.05, 0)} fill="none" stroke={COLORS.violet} strokeWidth={2.5} opacity={0.45} />
      <path d={ring(r * 1.24, 4, 0.025 + 0.045 * e, -0.07, 1.3)} fill="none" stroke={COLORS.mist} strokeWidth={3} opacity={0.55} />
      <circle cx={c} cy={c} r={r * (1 + p * 0.06)} fill={`url(#${id}-core)`} />
      {bins.map((bin, i) => {
        const v = Math.min(1, (spectrum[bin] ?? 0) * 1.2);
        const h = r * (0.22 + v * 0.8) * (1 - Math.abs(i - 2) * 0.16);
        return <rect key={i} x={c - total / 2 + i * (bw + gap)} y={c - h / 2} width={bw} height={h} rx={bw / 2} fill={COLORS.white} />;
      })}
      <ellipse cx={c - r * 0.3} cy={c - r * 0.42} rx={r * 0.3} ry={r * 0.14} fill="rgba(255,255,255,0.28)" />
    </svg>
  );
};

// ---------- small pieces ----------
/** Eight little segments that light up one per beat. */
export const BeatTicks: React.FC<{start: number; on: string; off: string}> = ({start, on, off}) => {
  const f = useCurrentFrame();
  const lit = Math.floor((f - start) / BEAT + 1e-6);
  const p = beatPulse(f, 4);
  return (
    <div style={{display: 'flex', gap: 12}}>
      {Array.from({length: 8}, (_, i) => (
        <div
          key={i}
          style={{
            width: i === lit ? 76 : 40,
            height: 10,
            borderRadius: 9,
            background: i <= lit ? on : off,
            opacity: i === lit ? 0.7 + 0.3 * p : 1,
            transform: i === lit ? `scaleY(${1 + p * 0.8})` : undefined,
          }}
        />
      ))}
    </div>
  );
};

export const Handset: React.FC<{size: number; color: string; style?: CSSProperties}> = ({size, color, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path
      d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"
      fill={color}
    />
  </svg>
);

export const Check: React.FC<{size: number; color: string; bg?: string}> = ({size, color, bg}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {bg && <circle cx="12" cy="12" r="12" fill={bg} />}
    <path d="M6.5 12.5l3.6 3.6 7.4-7.6" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** An arrow bending back: the missed-call symbol. */
export const MissedIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M4 7l7 7 6-6M17 8v4.5M17 8h-4.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 18.5c5.5-3.2 12.5-3.2 18 0" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </svg>
);

/** Brief eased 0→1 helper for overshoot-free entrances. */
export const ease = (f: number, a: number, d: number, fn = easeOut) => interpolate(f, [a, a + d], [0, 1], {...clamp, easing: fn});
