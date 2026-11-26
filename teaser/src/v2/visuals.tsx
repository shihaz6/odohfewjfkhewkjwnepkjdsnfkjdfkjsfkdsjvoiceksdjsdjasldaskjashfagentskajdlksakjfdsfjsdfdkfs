import React from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, interpolate, random, spring, useVideoConfig} from 'remotion';
import {noise2D, noise3D} from '@remotion/noise';
import {clamp, easeIn, easeInOut, easeOut, progress} from '../anim';
import {COLORS, DISPLAY} from '../theme';
import {useAudio, useSceneFrame} from './core';

// ---------- backdrop ----------
type Variant = 'dark' | 'light' | 'violet' | 'mist';
const BASE: Record<Variant, string> = {dark: COLORS.black, light: COLORS.white, violet: COLORS.violet, mist: COLORS.mist};
const BLOBS: Record<Variant, [string, string, string]> = {
  dark: ['rgba(124,92,255,0.34)', 'rgba(91,63,217,0.30)', 'rgba(124,92,255,0.18)'],
  light: ['rgba(124,92,255,0.10)', 'rgba(91,63,217,0.07)', 'rgba(239,235,255,0.9)'],
  violet: ['rgba(91,63,217,0.9)', 'rgba(239,235,255,0.20)', 'rgba(91,63,217,0.6)'],
  mist: ['rgba(124,92,255,0.18)', 'rgba(91,63,217,0.10)', 'rgba(255,255,255,0.8)'],
};

/** Living background: drifting colour fields, a parallax star field and a vignette. */
export const Backdrop: React.FC<{variant?: Variant; intensity?: number; stars?: boolean}> = ({variant = 'dark', intensity = 1, stars = true}) => {
  const {abs} = useAudio();
  const {width, height} = useVideoConfig();
  const t = abs * 0.0035;
  const s = Math.max(width, height);
  const dark = variant === 'dark' || variant === 'violet';
  return (
    <AbsoluteFill style={{background: BASE[variant], overflow: 'hidden'}}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${50 + noise2D(`bx${i}`, t, i * 7) * 40}%`,
            top: `${50 + noise2D(`by${i}`, i * 7, t) * 36}%`,
            width: s * (0.7 + 0.22 * i),
            height: s * (0.7 + 0.22 * i),
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${BLOBS[variant][i]} 0%, transparent 62%)`,
            opacity: intensity,
          }}
        />
      ))}
      {stars &&
        dark &&
        Array.from({length: 70}, (_, i) => {
          const depth = 0.3 + random(`d${i}`) * 0.7;
          const x = random(`x${i}`) * width;
          const y = (((random(`y${i}`) * height - abs * depth * 0.6) % height) + height) % height;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(abs / (14 + random(`t${i}`) * 30) + i));
          return (
            <div
              key={`s${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 1.5 + depth * 2.5,
                height: 1.5 + depth * 2.5,
                borderRadius: 9,
                background: i % 5 === 0 ? COLORS.mist : COLORS.white,
                opacity: tw * depth * 0.55 * intensity,
              }}
            />
          );
        })}
      {dark && <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)'}} />}
    </AbsoluteFill>
  );
};

// ---------- the resonance orb ----------
const blobPath = (c: number, r: number, amp: number, seed: string, t: number) => {
  let d = '';
  const n = 96;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = noise3D(seed, Math.cos(a) * 0.9, Math.sin(a) * 0.9, t);
    const rr = r * (1 + amp * k);
    d += `${i === 0 ? 'M' : 'L'}${(c + rr * Math.cos(a)).toFixed(1)} ${(c + rr * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
};

/** A breathing violet orb that deforms with the music, ringed by a radial spectrum. */
export const Orb: React.FC<{r: number; id: string; ring?: boolean; energy?: number}> = ({r, id, ring = true, energy}) => {
  const {abs, spectrum, bass} = useAudio();
  const e = energy ?? 0.2 + bass * 1.4;
  const size = r * 4.2;
  const c = size / 2;
  const t = abs * 0.02;
  const bars = 72;
  return (
    <svg width={size} height={size} style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <radialGradient id={`${id}-fill`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#C2B4FF" />
          <stop offset="45%" stopColor={COLORS.violet} />
          <stop offset="100%" stopColor={COLORS.deepViolet} />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="rgba(124,92,255,0.55)" />
          <stop offset="100%" stopColor="rgba(124,92,255,0)" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r * 0.12} />
        </filter>
      </defs>
      <circle cx={c} cy={c} r={r * (1.9 + e * 0.4)} fill={`url(#${id}-glow)`} />
      {ring &&
        Array.from({length: bars}, (_, i) => {
          const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const half = i < bars / 2 ? i : bars - 1 - i;
          const v = spectrum[Math.min(63, Math.floor(half * 1.1))] ?? 0;
          const r0 = r * 1.52;
          const r1 = r0 + r * (0.06 + v * 0.55);
          return (
            <line
              key={i}
              x1={c + Math.cos(a) * r0}
              y1={c + Math.sin(a) * r0}
              x2={c + Math.cos(a) * r1}
              y2={c + Math.sin(a) * r1}
              stroke={i % 3 === 0 ? COLORS.mist : COLORS.violet}
              strokeWidth={Math.max(2, r * 0.035)}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
      <path d={blobPath(c, r * 1.36, 0.08 + 0.1 * e, `${id}c`, t * 0.8 + 9)} fill="none" stroke={COLORS.violet} strokeWidth={2} opacity={0.22} />
      <path d={blobPath(c, r * 1.18, 0.08 + 0.1 * e, `${id}b`, t * 0.9 + 4)} fill="none" stroke={COLORS.violet} strokeWidth={2.5} opacity={0.4} />
      <path d={blobPath(c, r, 0.05 + 0.12 * e, `${id}a`, t)} fill={`url(#${id}-fill)`} />
      <ellipse cx={c - r * 0.28} cy={c - r * 0.34} rx={r * 0.34} ry={r * 0.2} fill="rgba(255,255,255,0.35)" filter={`url(#${id}-soft)`} />
    </svg>
  );
};

// ---------- impacts ----------
/** One expanding ring, centred at (x, y) from the frame centre. */
export const Shockwave: React.FC<{at: number; maxR: number; width?: number; color?: string; life?: number; x?: number; y?: number}> = ({
  at,
  maxR,
  width = 6,
  color = COLORS.violet,
  life = 32,
  x = 0,
  y = 0,
}) => {
  const f = useSceneFrame();
  const p = (f - at) / life;
  if (p < 0 || p > 1) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: '50%', top: '50%', overflow: 'visible', transform: `translate(${x}px, ${y}px)`}}>
      <circle r={maxR * easeOut(p)} fill="none" stroke={color} strokeWidth={Math.max(1, width * (1 - p))} opacity={(1 - p) ** 1.3} />
    </svg>
  );
};

/** Light streaks flying outward from a point. */
export const Burst: React.FC<{at: number; dist: number; count?: number; life?: number; x?: number; y?: number; seed?: string; thickness?: number}> = ({
  at,
  dist,
  count = 90,
  life = 40,
  x = 0,
  y = 0,
  seed = 'b',
  thickness = 4,
}) => {
  const f = useSceneFrame();
  const p = (f - at) / life;
  if (p < 0 || p > 1) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: '50%', top: '50%', overflow: 'visible', transform: `translate(${x}px, ${y}px)`}}>
      {Array.from({length: count}, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const sp = 0.3 + 0.7 * random(`${seed}s${i}`);
        const d = dist * sp * easeOut(p);
        const len = (1 - p) * sp * 110 + 4;
        const d0 = Math.max(0, d - len);
        return (
          <line
            key={i}
            x1={Math.cos(a) * d0}
            y1={Math.sin(a) * d0}
            x2={Math.cos(a) * d}
            y2={Math.sin(a) * d}
            stroke={random(`${seed}c${i}`) > 0.65 ? COLORS.mist : COLORS.violet}
            strokeWidth={thickness * (1 - p * 0.6)}
            strokeLinecap="round"
            opacity={1 - p}
          />
        );
      })}
    </svg>
  );
};

/** Little four-point stars popping out of a point. */
export const Sparkles: React.FC<{at: number; dist?: number; count?: number; color?: string; x?: number; y?: number}> = ({
  at,
  dist = 120,
  count = 10,
  color = COLORS.mist,
  x = 0,
  y = 0,
}) => {
  const f = useSceneFrame();
  const p = (f - at) / 28;
  if (p < 0 || p > 1) return null;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: '50%', top: '50%', overflow: 'visible', transform: `translate(${x}px, ${y}px)`}}>
      {Array.from({length: count}, (_, i) => {
        const a = (i / count) * Math.PI * 2 + random(`sp${i}`) * 0.5;
        const d = dist * (0.6 + 0.4 * random(`sd${i}`)) * easeOut(p);
        const s = 10 * Math.sin(p * Math.PI) * (0.6 + random(`ss${i}`) * 0.6);
        const cx = Math.cos(a) * d;
        const cy = Math.sin(a) * d;
        return <path key={i} d={`M${cx} ${cy - s} L${cx + s * 0.28} ${cy} L${cx} ${cy + s} L${cx - s * 0.28} ${cy} Z M${cx - s} ${cy} L${cx} ${cy + s * 0.28} L${cx + s} ${cy} L${cx} ${cy - s * 0.28} Z`} fill={color} />;
      })}
    </svg>
  );
};

// ---------- typography ----------
/** Words that rise (or punch) in one after another, softly blurred, and can blur back out. */
export const Words: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  style?: CSSProperties;
  accent?: (i: number) => CSSProperties | undefined;
  breakAfter?: number[];
  out?: number;
  mode?: 'rise' | 'punch';
}> = ({text, start, stagger = 4, style, accent, breakAfter = [], out, mode = 'rise'}) => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const words = text.split(' ');
  const o = out === undefined ? 0 : interpolate(f, [out, out + 10], [0, 1], {...clamp, easing: easeIn});
  if (o >= 1) return null;
  return (
    <div style={style}>
      {words.map((w, i) => {
        const s = spring({frame: f - start - i * stagger, fps, config: mode === 'punch' ? {damping: 11, mass: 0.6} : {damping: 16, mass: 0.7}});
        const blur = (1 - Math.min(1, s)) * 12 + o * 16;
        const move = mode === 'punch' ? `scale(${1.5 - 0.5 * s})` : `translateY(${(1 - s) * 0.55}em)`;
        const last = i === words.length - 1;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                opacity: Math.min(1, s * 1.3) * (1 - o),
                filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
                transform: `${move} translateY(${-o * 0.4}em)`,
                ...accent?.(i),
              }}
            >
              {w}
              {!last && !breakAfter.includes(i) ? ' ' : ''}
            </span>
            {breakAfter.includes(i) && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Letters that flip up (3D) or blur in, one by one. */
export const Letters: React.FC<{text: string; start: number; stagger?: number; style?: CSSProperties; mode?: 'flip' | 'blur'}> = ({
  text,
  start,
  stagger = 2,
  style,
  mode = 'flip',
}) => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', justifyContent: 'center', perspective: 900, ...style}}>
      {text.split('').map((ch, i) => {
        const s = spring({frame: f - start - i * stagger, fps, config: {damping: 14, mass: 0.7}});
        const blur = (1 - Math.min(1, s)) * 14;
        const tr = mode === 'flip' ? `translateY(${(1 - s) * 0.35}em) rotateX(${(1 - s) * -95}deg)` : `scale(${1.6 - 0.6 * s})`;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              transformOrigin: '50% 100%',
              transform: tr,
              opacity: Math.min(1, s * 1.4),
              filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** RESONANCE: letters flip up while the tracking tightens, a violet glint sweeps across, a wave draws below. */
export const Wordmark2: React.FC<{start: number; fontSize: number; stagger?: number; waveWidth: number; shineAt?: number[]; pulse?: number}> = ({
  start,
  fontSize,
  stagger = 3,
  waveWidth,
  shineAt = [],
  pulse = 0,
}) => {
  const f = useSceneFrame();
  const {bass} = useAudio();
  const tracking = interpolate(f, [start, start + 40], [0.3, 0.1], {...clamp, easing: easeOut});
  const text: CSSProperties = {
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    marginRight: `-${tracking}em`,
    whiteSpace: 'pre',
  };
  const shine = shineAt.map((a) => progress(f, a, 28, easeInOut)).find((p) => p > 0 && p < 1);
  const draw = progress(f, start + 24, 34);
  const h = fontSize * 0.24;
  const amp = (0.35 + Math.min(1, bass * 1.2) * 0.65) * (h / 2 - 3);
  let d = '';
  for (let i = 0; i <= 140; i++) {
    const x = (i / 140) * waveWidth;
    const env = Math.sin((i / 140) * Math.PI);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(h / 2 + Math.sin(i * 0.38 - f * 0.24) * amp * env).toFixed(1)} `;
  }
  const len = waveWidth * 1.7;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${1 + pulse * 0.018})`}}>
      <div style={{position: 'relative'}}>
        <Letters text="RESONANCE" start={start} stagger={stagger} style={{...text, color: COLORS.white, textShadow: '0 0 50px rgba(124,92,255,0.45)'}} />
        {shine !== undefined && (
          <div
            style={{
              ...text,
              position: 'absolute',
              inset: 0,
              textAlign: 'center',
              color: 'transparent',
              backgroundImage: `linear-gradient(105deg, transparent ${shine * 140 - 32}%, rgba(150,125,255,0.95) ${shine * 140 - 20}%, transparent ${shine * 140 - 8}%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            RESONANCE
          </div>
        )}
      </div>
      <svg width={waveWidth} height={h} style={{marginTop: fontSize * 0.14, overflow: 'visible'}}>
        <path d={d} fill="none" stroke={COLORS.violet} strokeWidth={Math.max(4, fontSize * 0.03)} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      </svg>
    </div>
  );
};

// ---------- small pieces ----------
/** Spectrum bars, tallest (bass) in the middle. */
export const Bars: React.FC<{count: number; width: number; height: number; color: string; gain?: number; gap?: number}> = ({
  count,
  width,
  height,
  color,
  gain = 1,
  gap = 6,
}) => {
  const {spectrum} = useAudio();
  const bw = (width - gap * (count - 1)) / count;
  const mid = (count - 1) / 2;
  return (
    <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      {Array.from({length: count}, (_, i) => {
        const idx = Math.floor((Math.abs(i - mid) / mid) * 30);
        const v = Math.min(1, (spectrum[idx] ?? 0) * gain);
        return <div key={i} style={{width: bw, height: Math.max(bw, height * v), borderRadius: bw / 2, background: color}} />;
      })}
    </div>
  );
};

export const PersonIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="8.5" r="4" fill={color} />
    <path d="M4.5 20.5 C5.5 15.8 8.4 13.8 12 13.8 C15.6 13.8 18.5 15.8 19.5 20.5 Z" fill={color} />
  </svg>
);
