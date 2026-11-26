import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, easeIn, easeInOut, easeOut} from '../anim';
import {COLORS} from '../theme';

/** Vertical strips slam in from alternate sides to cover the cut, then fly on out. Fully covered at `at`. */
export const StripCover: React.FC<{at: number; colors?: string[]; count?: number}> = ({at, colors = [COLORS.violet, COLORS.deepViolet, COLORS.mist], count = 7}) => {
  const f = useCurrentFrame();
  if (f < at - 14 || f > at + 16) return null;
  const w = 1080 / count;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const d = i * 0.75;
        const dir = i % 2 ? -1 : 1;
        const inP = interpolate(f, [at - 12 + d, at - 5 + d], [0, 1], {...clamp, easing: easeOut});
        const outP = interpolate(f, [at + 1 + d, at + 9 + d], [0, 1], {...clamp, easing: easeIn});
        const y = (1 - inP) * 1940 * dir - outP * 1940 * dir;
        return <div key={i} style={{position: 'absolute', top: 0, left: i * w - 1, width: w + 2, height: 1920, background: colors[i % colors.length], transform: `translateY(${y}px)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Diagonal bands sweep across; the last, wide band (the next scene's colour) covers the cut at `at`. */
export const BandSweep: React.FC<{at: number; lead?: string[]; fill: string}> = ({at, lead = [COLORS.mist, COLORS.white], fill}) => {
  const f = useCurrentFrame();
  if (f < at - 11 || f > at + 11) return null;
  const s = interpolate(f, [at - 10, at + 10], [1150, -4150], clamp);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transform: 'rotate(-32deg)'}}>
        <div style={{position: 'absolute', left: -2500, width: 5000, top: s, height: 150, background: lead[0]}} />
        <div style={{position: 'absolute', left: -2500, width: 5000, top: s + 170, height: 80, background: lead[1]}} />
        <div style={{position: 'absolute', left: -2500, width: 5000, top: s + 270, height: 2600, background: fill}} />
      </div>
    </AbsoluteFill>
  );
};

/** Reveals its children through a growing circle. */
export const CircleReveal: React.FC<{from: number; to: number; x: number; y: number; ring?: string; children: React.ReactNode}> = ({from, to, x, y, ring, children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [from, to], [0, 1], {...clamp, easing: easeInOut});
  const r = p * Math.hypot(Math.max(x, 1080 - x), Math.max(y, 1920 - y)) + 0.5;
  const clip = p >= 1 ? undefined : `circle(${r.toFixed(1)}px at ${x}px ${y}px)`;
  return (
    <>
      <AbsoluteFill style={{clipPath: clip, WebkitClipPath: clip}}>{children}</AbsoluteFill>
      {ring && p > 0 && p < 1 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <circle cx={x} cy={y} r={r} fill="none" stroke={ring} strokeWidth={14 * (1 - p) + 3} />
        </svg>
      )}
    </>
  );
};

/** Reveals its children through horizontal blinds that open. */
export const Blinds: React.FC<{from: number; to: number; slat?: number; children: React.ReactNode}> = ({from, to, slat = 160, children}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [from, to], [0, 1], {...clamp, easing: easeOut});
  const open = p * slat;
  const mask = p >= 1 ? undefined : `repeating-linear-gradient(to bottom, #000 0px, #000 ${open.toFixed(1)}px, transparent ${open.toFixed(1)}px, transparent ${slat}px)`;
  return <AbsoluteFill style={{maskImage: mask, WebkitMaskImage: mask}}>{children}</AbsoluteFill>;
};

/** A full-frame flash at a hit. */
export const Flash: React.FC<{at: number; color?: string; peak?: number; life?: number}> = ({at, color = COLORS.white, peak = 0.95, life = 12}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1.5, at, at + life], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};
