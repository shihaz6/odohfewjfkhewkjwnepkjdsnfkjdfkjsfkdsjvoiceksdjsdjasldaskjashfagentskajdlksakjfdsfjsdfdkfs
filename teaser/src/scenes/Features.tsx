import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, fadeUp, progress, useLayout} from '../anim';
import {Background, FeatureIcon, MaskReveal} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';

// Local frames. The music script places a ping at each card's entrance.
export const CARD_START = 22;
export const CARD_STEP = 13;

const FEATURES = [
  {kind: 'call' as const, title: 'Answers every call', body: 'Day or night, it picks up.'},
  {kind: 'knowledge' as const, title: 'Knows your business', body: 'Answers from the facts you give it.'},
  {kind: 'lead' as const, title: 'Captures every lead', body: 'Takes callback requests for your team.'},
];

export const Features: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pick, portrait} = useLayout();
  const exit = interpolate(frame, [dur - 14, dur], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <Background glow={0.6} />
      <AbsoluteFill
        style={{
          opacity: exit,
          alignItems: 'center',
          justifyContent: portrait ? 'flex-start' : 'center',
          paddingTop: portrait ? 300 : 0,
        }}
      >
        <div style={{textAlign: 'center', padding: '0 80px'}}>
          <div
            style={{
              ...fadeUp(frame, 2, 18, 20),
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: pick(26, 28),
              letterSpacing: '0.22em',
              color: COLORS.violet,
              marginBottom: 22,
            }}
          >
            WHAT RESONANCE DOES
          </div>
          <MaskReveal start={6}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: pick(80, 84),
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: COLORS.white,
              }}
            >
              Built for the calls
              {portrait ? <br /> : ' '}
              you <span style={{color: COLORS.violet}}>can't take.</span>
            </div>
          </MaskReveal>
        </div>

        <div
          style={{
            marginTop: pick(80, 110),
            display: 'flex',
            flexDirection: portrait ? 'column' : 'row',
            gap: pick(40, 36),
          }}
        >
          {FEATURES.map((f, i) => {
            const start = CARD_START + i * CARD_STEP;
            const s = spring({frame: frame - start, fps, config: {damping: 16, mass: 0.8}});
            const bar = progress(frame, start + 6, 22);
            return (
              <div
                key={f.kind}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: pick(520, 920),
                  height: pick(470, 250),
                  borderRadius: 36,
                  background: COLORS.mist,
                  boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
                  boxSizing: 'border-box',
                  padding: pick('48px 44px', '0 48px'),
                  display: 'flex',
                  flexDirection: portrait ? 'row' : 'column',
                  alignItems: portrait ? 'center' : 'flex-start',
                  gap: pick(0, 40),
                  opacity: s,
                  transform: `translateY(${(1 - s) * 90}px)`,
                }}
              >
                <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${bar * 100}%`, background: COLORS.deepViolet}} />
                <div
                  style={{
                    position: 'absolute',
                    right: 36,
                    top: 30,
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: 26,
                    color: 'rgba(91,63,217,0.45)',
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    width: 112,
                    height: 112,
                    flexShrink: 0,
                    borderRadius: 30,
                    background: COLORS.violet,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FeatureIcon kind={f.kind} size={64} color={COLORS.white} />
                </div>
                <div style={{marginTop: pick(56, 0)}}>
                  <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: pick(42, 46), color: COLORS.black, letterSpacing: '-0.015em'}}>
                    {f.title}
                  </div>
                  <div style={{fontFamily: BODY, fontWeight: 500, fontSize: pick(30, 32), lineHeight: 1.35, color: COLORS.grey, marginTop: 12}}>
                    {f.body}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
