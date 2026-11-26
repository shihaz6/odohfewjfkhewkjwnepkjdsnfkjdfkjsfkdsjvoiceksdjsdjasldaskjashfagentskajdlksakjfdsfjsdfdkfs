import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, progress, useLayout} from '../anim';
import {Background, MaskReveal, MissedIcon, PhoneIcon, Rings} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';

// Local frames. The music script uses the same ring and card times.
export const RING_BURSTS: [number, number][] = [
  [6, 46],
  [58, 98],
];
export const MISSED_START = 104;
export const MISSED_STEP = 10;
const MISSED_TIMES = ['9:42 PM', '11:15 PM', '6:03 AM', '1:27 PM'];

const LINES: {start: number; end?: number; parts: {t: string; accent?: boolean}[]}[] = [
  {start: 6, end: 100, parts: [{t: 'The phone rings.'}]},
  {start: 100, end: 160, parts: [{t: 'No one answers.'}]},
  {start: 160, parts: [{t: 'Your customer calls '}, {t: 'someone else.', accent: true}]},
];

export const Problem: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pick, portrait} = useLayout();

  const ringEnv = RING_BURSTS.reduce(
    (acc, [a, b]) => Math.max(acc, interpolate(frame, [a, a + 4, b - 4, b], [0, 1, 1, 0], clamp)),
    0,
  );
  const shake = Math.sin(frame * 2.3) * 14 * ringEnv;
  const missed = progress(frame, 98, 12);
  const enter = progress(frame, 0, 12);
  // In landscape the phone starts centred, then glides up to make room for the missed-call cards.
  const CARDS_BLOCK = 56 + 4 * 104 + 3 * 18;
  const phoneDrop = portrait ? 0 : (CARDS_BLOCK / 2) * (1 - progress(frame, 94, 26));

  const textBox: React.CSSProperties = portrait
    ? {position: 'absolute', left: 90, right: 90, top: 210, height: 560}
    : {position: 'absolute', left: 150, width: 880, top: 0, bottom: 0};
  const visualBox: React.CSSProperties = portrait
    ? {position: 'absolute', left: 90, right: 90, top: 800, display: 'flex', flexDirection: 'column', alignItems: 'center'}
    : {position: 'absolute', right: 150, width: 620, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'};

  return (
    <AbsoluteFill style={{opacity: enter}}>
      <Background glow={0.55} />

      <div style={textBox}>
        {LINES.map((line, i) => (
          <div key={i} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center'}}>
            <MaskReveal start={line.start} end={line.end}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: pick(108, 100),
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: COLORS.white,
                }}
              >
                {line.parts.map((p, j) => (
                  <span key={j} style={{color: p.accent ? COLORS.violet : COLORS.white}}>
                    {p.t}
                  </span>
                ))}
              </div>
            </MaskReveal>
          </div>
        ))}
      </div>

      <div style={visualBox}>
        <div style={{position: 'relative', width: 200, height: 200, transform: `translateY(${phoneDrop}px)`}}>
          <Rings start={6} period={30} count={3} maxR={190} minR={100} stroke={3} opacity={ringEnv} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              background: COLORS.grey,
              border: `3px solid ${missed > 0.5 ? 'rgba(255,255,255,0.15)' : COLORS.violet}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${shake}deg) scale(${1 + ringEnv * 0.05})`,
              boxShadow: `0 0 ${60 * ringEnv}px rgba(124,92,255,0.5)`,
            }}
          >
            <div style={{opacity: 1 - missed, position: 'absolute'}}>
              <PhoneIcon size={96} color={COLORS.violet} />
            </div>
            <div style={{opacity: missed, position: 'absolute'}}>
              <MissedIcon size={96} color={COLORS.muted} />
            </div>
          </div>
        </div>

        <div style={{marginTop: 56, display: 'flex', flexDirection: 'column', gap: 18}}>
          {MISSED_TIMES.map((time, i) => {
            const s = spring({frame: frame - (MISSED_START + i * MISSED_STEP), fps, config: {damping: 16}});
            return (
              <div
                key={time}
                style={{
                  width: pick(600, 900),
                  height: 104,
                  borderRadius: 26,
                  background: COLORS.grey,
                  border: `1px solid ${COLORS.line}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: '0 32px',
                  boxSizing: 'border-box',
                  opacity: s,
                  transform: `translateX(${(1 - s) * 80}px)`,
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 999,
                    background: 'rgba(124,92,255,0.38)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MissedIcon size={32} color={COLORS.mist} />
                </div>
                <div style={{flex: 1, fontFamily: DISPLAY, fontWeight: 600, fontSize: 36, color: COLORS.white}}>
                  Missed call
                </div>
                <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 30, color: COLORS.muted}}>{time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
