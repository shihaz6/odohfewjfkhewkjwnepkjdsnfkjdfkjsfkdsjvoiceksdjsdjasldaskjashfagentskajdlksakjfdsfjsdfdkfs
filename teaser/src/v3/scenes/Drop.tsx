import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {At, barPulse, beatPulse} from '../core';
import {Bg, Burst, Emblem, Marquee, Rise, Shock, Wave, Wordmark, ease} from '../fx';
import {BEAT, K, barF} from '../timeline';

const D = K.drop;

/** 8.5-16 s, the drop: a burst of light, the emblem, RESONANCE, and what it is. */
export const Drop: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = beatPulse(f, 5);
  const bp = barPulse(f, 8);
  const emb = spring({frame: f - D, fps, config: {damping: 9, mass: 0.6, stiffness: 160}});
  const ring = ease(f, D, 30);
  const sub: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 700, fontSize: 70, lineHeight: 1.1, letterSpacing: '-0.02em', color: COLORS.white};
  return (
    <AbsoluteFill>
      <Bg base={COLORS.black} glows={[`rgba(124,92,255,${0.3 + p * 0.18})`, 'rgba(91,63,217,0.25)']} dust={COLORS.mist} pump={p} />
      <Marquee text="RESONANCE · " y={-790} size={150} speed={0.12} stroke="rgba(124,92,255,0.34)" opacity={ease(f, D + 4, 16)} />
      <Marquee text="RESONANCE · " y={800} size={150} speed={-0.12} stroke="rgba(124,92,255,0.34)" opacity={ease(f, D + 8, 16)} />
      {/* a big dashed ring turning behind the emblem */}
      <At y={-350}>
        <svg width={1000} height={1000} style={{overflow: 'visible', transform: `rotate(${(f - D) * 0.6}deg) scale(${(0.6 + 0.4 * ring) * (1 + bp * 0.05)})`, opacity: ring}}>
          <circle cx={500} cy={500} r={440} fill="none" stroke="rgba(239,235,255,0.22)" strokeWidth={3} strokeDasharray="4 22" strokeLinecap="round" />
          <circle cx={500} cy={500} r={380} fill="none" stroke="rgba(124,92,255,0.35)" strokeWidth={2} strokeDasharray="160 40 20 40" />
        </svg>
      </At>
      {[0, 5, 10].map((d, i) => (
        <Shock key={d} at={D + d} y={-350} maxR={1500 - i * 200} width={34 - i * 8} life={30} color={i === 1 ? COLORS.mist : COLORS.violet} />
      ))}
      <Burst at={D} y={-350} dist={1300} count={110} life={36} seed="drop" thickness={6} />
      {[1, 2, 3].map((n) => (
        <Shock key={n} at={barF(n)} y={-350} maxR={700} width={10} life={26} color="rgba(239,235,255,0.6)" />
      ))}
      <AbsoluteFill style={{transform: `scale(${1 + p * 0.022})`}}>
        <At y={-350} style={{transform: `translate(-50%, -50%) translateY(-350px) scale(${emb})`}}>
          <Emblem r={150} id="drop-emb" />
        </At>
        <At y={30}>
          <Wordmark at={D + 1} size={124} stagger={1.4} />
        </At>
        <At y={150}>
          <Wave at={D + 12} width={760} height={56} />
        </At>
        <At y={300}>
          <Rise text="The AI voice agent" at={barF(1)} stagger={3} style={sub} />
        </At>
        <At y={385}>
          <Rise text="for your business." at={barF(2)} stagger={3} style={{...sub, color: COLORS.violet, textShadow: '0 0 40px rgba(124,92,255,0.5)'}} />
        </At>
        <At y={530}>
          <div style={{opacity: ease(f, D + 2 * BEAT, 12), transform: `translateY(${(1 - ease(f, D + 2 * BEAT, 12)) * 24}px)`, fontFamily: BODY, fontWeight: 500, fontSize: 42, color: COLORS.muted, letterSpacing: '0.04em'}}>
            by <span style={{color: COLORS.orange, fontWeight: 700}}>AlchemyX Global</span>
          </div>
        </At>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
