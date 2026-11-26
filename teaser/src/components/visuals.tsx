import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, easeInOut, easeOut, progress} from '../anim';
import {COLORS} from '../theme';

/** Charcoal (or white) backdrop with a slow violet glow, dot grid and vignette. */
export const Background: React.FC<{light?: boolean; glow?: number}> = ({light = false, glow = 1}) => {
  const frame = useCurrentFrame();
  const gx = 50 + Math.sin(frame / 95) * 14;
  const gy = 42 + Math.cos(frame / 120) * 10;
  const dot = light ? 'rgba(26,26,26,0.07)' : 'rgba(255,255,255,0.055)';
  return (
    <AbsoluteFill style={{background: light ? COLORS.white : COLORS.black}}>
      {!light && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(124,92,255,${0.2 * glow}) 0%, rgba(124,92,255,0) 52%)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${dot} 1.6px, transparent 1.6px)`,
          backgroundSize: '46px 46px',
          backgroundPosition: `${frame * 0.25}px ${frame * 0.15}px`,
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 78%)',
        }}
      />
      {!light && (
        <AbsoluteFill
          style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)'}}
        />
      )}
    </AbsoluteFill>
  );
};

/** Concentric "resonance" rings emitted from the centre of the parent. */
export const Rings: React.FC<{
  start?: number;
  period?: number;
  count?: number;
  maxR: number;
  minR?: number;
  color?: string;
  stroke?: number;
  opacity?: number;
}> = ({start = 0, period = 60, count = 4, maxR, minR = 0, color = COLORS.violet, stroke = 2, opacity = 1}) => {
  const frame = useCurrentFrame();
  const local = frame - start;
  if (local < 0 || opacity <= 0) return null;
  const spacing = period / count;
  const newest = Math.floor(local / spacing);
  const circles: React.ReactNode[] = [];
  for (let j = Math.max(0, newest - count + 1); j <= newest; j++) {
    const t = (local - j * spacing) / period;
    if (t < 0 || t >= 1) continue;
    const r = minR + easeOut(t) * (maxR - minR);
    circles.push(
      <circle
        key={j}
        cx={maxR}
        cy={maxR}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        opacity={Math.pow(1 - t, 1.6) * opacity}
      />,
    );
  }
  return (
    <svg
      width={maxR * 2}
      height={maxR * 2}
      style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible'}}
    >
      {circles}
    </svg>
  );
};

/** Animated voice waveform: rounded bars, tallest in the middle. */
export const Waveform: React.FC<{
  bars: number;
  width: number;
  height: number;
  amp: number;
  color?: string;
  gap?: number;
  speed?: number;
  phase?: number;
  opacity?: number;
}> = ({bars, width, height, amp, color = COLORS.violet, gap = 8, speed = 1, phase = 0, opacity = 1}) => {
  const frame = useCurrentFrame();
  const bw = (width - gap * (bars - 1)) / bars;
  return (
    <div style={{width, height, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity}}>
      {Array.from({length: bars}, (_, i) => {
        const x = bars === 1 ? 0.5 : i / (bars - 1);
        const bell = Math.exp(-Math.pow((x - 0.5) / 0.3, 2));
        const n =
          0.5 +
          0.5 * Math.sin(i * 0.9 + frame * 0.33 * speed + phase) * Math.cos(i * 0.37 - frame * 0.19 * speed + phase);
        const h = Math.max(bw, height * (0.05 + 0.95 * amp * bell * (0.3 + 0.7 * n)));
        return <div key={i} style={{width: bw, height: h, borderRadius: bw / 2, background: color}} />;
      })}
    </div>
  );
};

/** Skewed full-screen panel that sweeps across; fully covers the frame at its midpoint (local frame 12). */
export const Wipe: React.FC<{color?: string; edge?: string; reverse?: boolean}> = ({
  color = COLORS.violet,
  edge = COLORS.white,
  reverse = false,
}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const lean = H * 0.134; // horizontal shift of the top/bottom edges at skewX(-15deg)
  const panelW = W + 2 * lean + 60;
  const cover = -lean - 30;
  const x = interpolate(frame, [0, 10, 14, 24], [-panelW - lean, cover, cover, W + lean], {
    ...clamp,
    easing: easeInOut,
  });
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: reverse ? 'scaleX(-1)' : undefined}}>
      <div style={{position: 'absolute', top: 0, left: x, width: panelW, height: H, background: color, transform: 'skewX(-15deg)'}} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: x + panelW,
          width: 14,
          height: H,
          background: edge,
          opacity: 0.85,
          transform: 'skewX(-15deg)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Subtle film grain over everything. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 60;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.06, mixBlendMode: 'overlay'}}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Text that slides up out of a mask, and optionally back out at `end`. */
export const MaskReveal: React.FC<{
  start: number;
  end?: number;
  dur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({start, end, dur = 22, style, children}) => {
  const frame = useCurrentFrame();
  const pin = progress(frame, start, dur);
  const pout = end === undefined ? 0 : progress(frame, end - 12, 12, easeInOut);
  const y = (1 - pin) * 115 - pout * 115;
  return (
    <div style={{overflow: 'hidden', padding: '0.06em 0 0.1em', ...style}}>
      <div style={{transform: `translateY(${y}%)`}}>{children}</div>
    </div>
  );
};

// Material Design "call" glyph (Apache 2.0).
const PHONE_PATH =
  'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z';

export const PhoneIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d={PHONE_PATH} fill={color} />
  </svg>
);

export const MissedIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={PHONE_PATH} fill={color} stroke="none" transform="translate(-1.5 2.5) scale(0.82)" />
    <path d="M14.5 3.5 L19.5 8.5 M19.5 3.5 L14.5 8.5" />
  </svg>
);

export const CheckIcon: React.FC<{size: number; color: string; draw?: number}> = ({size, color, draw = 1}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12.5 L10 17.5 L19 7"
      stroke={color}
      strokeWidth={2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={24}
      strokeDashoffset={24 * (1 - draw)}
    />
  </svg>
);

/** Feature icons, drawn as simple line art. */
export const FeatureIcon: React.FC<{kind: 'call' | 'knowledge' | 'lead'; size: number; color: string}> = ({kind, size, color}) => {
  const common = {fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'call' && (
        <>
          <path d={PHONE_PATH} fill={color} transform="translate(-1 3) scale(0.78)" />
          <path {...common} d="M14.5 6.5 a4 4 0 0 1 3 3" />
          <path {...common} d="M14.5 2.8 a7.8 7.8 0 0 1 6.7 6.7" />
        </>
      )}
      {kind === 'knowledge' && (
        <>
          <path {...common} d="M4 5.5 C4 4.7 4.7 4 5.5 4 H11 V20 H5.5 C4.7 20 4 19.3 4 18.5 Z" />
          <path {...common} d="M20 5.5 C20 4.7 19.3 4 18.5 4 H13 V20 H18.5 C19.3 20 20 19.3 20 18.5 Z" />
          <path {...common} d="M6.5 8 H8.5 M6.5 11 H8.5 M15.5 8 H17.5 M15.5 11 H17.5" />
        </>
      )}
      {kind === 'lead' && (
        <>
          <rect {...common} x={5} y={4} width={14} height={17} rx={2.5} />
          <path {...common} d="M9 3 H15 V6 H9 Z" />
          <path {...common} d="M8.5 13 L11 15.5 L15.5 10.5" />
        </>
      )}
    </svg>
  );
};
