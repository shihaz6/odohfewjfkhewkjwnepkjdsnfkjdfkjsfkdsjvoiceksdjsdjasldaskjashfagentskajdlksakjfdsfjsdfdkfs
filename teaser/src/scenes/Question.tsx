import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {clamp, easeIn, progress, useLayout} from '../anim';
import {Background, MaskReveal} from '../components/visuals';
import {COLORS, DISPLAY} from '../theme';

/** White beat: "What if every call was answered?" then a charcoal circle closes in. */
export const Question: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {pick, diag} = useLayout();
  const highlight = progress(frame, 28, 18);
  const close = interpolate(frame, [dur - 26, dur], [0, 1], {...clamp, easing: easeIn});

  const lineStyle: React.CSSProperties = {
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: pick(150, 116),
    lineHeight: 1.05,
    letterSpacing: '-0.035em',
    color: COLORS.black,
    textAlign: 'center',
  };

  return (
    <AbsoluteFill>
      <Background light />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + frame * 0.0006})`}}>
        <MaskReveal start={4}>
          <div style={lineStyle}>What if</div>
        </MaskReveal>
        <MaskReveal start={13} style={{paddingBottom: '0.26em', marginBottom: '-0.16em'}}>
          <div style={lineStyle}>
            <span style={{position: 'relative', display: 'inline-block', isolation: 'isolate', padding: '0 0.1em'}}>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '1%',
                  bottom: '-12%',
                  background: COLORS.violet,
                  borderRadius: '0.12em',
                  transform: `scaleX(${highlight})`,
                  transformOrigin: 'left center',
                  zIndex: -1,
                }}
              />
              <span style={{color: interpolateColors(highlight, [0.35, 0.85], [COLORS.black, COLORS.white])}}>every call</span>
            </span>
          </div>
        </MaskReveal>
        <MaskReveal start={22}>
          <div style={lineStyle}>was answered?</div>
        </MaskReveal>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            width: diag,
            height: diag,
            flexShrink: 0,
            borderRadius: 999,
            background: COLORS.black,
            transform: `scale(${close})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
