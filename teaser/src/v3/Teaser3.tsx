import React from 'react';
import {AbsoluteFill, Html5Audio, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {AudioProvider, SONG, Show, barPulse, shake} from './core';
import {Grain, Vignette} from './fx';
import {Call, CHIP_SCREEN_Y} from './scenes/Call';
import {Drop} from './scenes/Drop';
import {F1, F2, F3} from './scenes/Features';
import {Final} from './scenes/Final';
import {Intro} from './scenes/Intro';
import {Launch} from './scenes/Launch';
import {BandSweep, Blinds, CircleReveal, Flash, StripCover} from './transitions';
import {K, TOTAL} from './timeline';

const HITS = [...K.stabsA, ...K.stabsB, K.drop, K.final];

/**
 * V3: a 43 s portrait teaser cut to the song in the project root (127 BPM).
 * Scenes overlap only where a transition needs both; every cut sits on a downbeat.
 */
export const Teaser3: React.FC = () => {
  const f = useCurrentFrame();
  const big = shake(f, HITS, 22, 5);
  const bar = barPulse(f, 5) * 4;
  return (
    <AbsoluteFill style={{background: COLORS.black, overflow: 'hidden'}}>
      <AudioProvider>
        <AbsoluteFill style={{transform: `translate(${big.x}px, ${big.y + bar * 0.5}px) rotate(${big.r}deg) scale(${1.02})`}}>
          <Show from={0} to={K.drop}>
            <Intro />
          </Show>
          <Show from={K.drop} to={K.call + 1}>
            <Drop />
          </Show>
          <Show from={K.call} to={K.f1 + 6}>
            <Call />
          </Show>
          <Show from={K.miniGap + 14} to={K.f2 + 1}>
            <CircleReveal from={K.miniGap + 14} to={K.f1 + 2} x={540} y={CHIP_SCREEN_Y} ring={COLORS.mist}>
              <F1 />
            </CircleReveal>
          </Show>
          <Show from={K.f2} to={K.f3 + 9}>
            <F2 />
          </Show>
          <Show from={K.f3 - 8} to={K.launch + 4}>
            <CircleReveal from={K.f3 - 8} to={K.f3 + 7} x={540} y={960} ring={COLORS.violet}>
              <F3 />
            </CircleReveal>
          </Show>
          <Show from={K.launch - 7} to={K.final}>
            <Blinds from={K.launch - 7} to={K.launch + 3}>
              <Launch />
            </Blinds>
          </Show>
          <Show from={K.final - 0.5} to={TOTAL}>
            <Final />
          </Show>
          <StripCover at={K.call} />
          <BandSweep at={K.f2} fill={COLORS.black} />
        </AbsoluteFill>
        <Flash at={K.drop} />
        <Flash at={K.final} color={COLORS.mist} peak={0.9} life={14} />
      </AudioProvider>
      <Vignette strength={0.45} />
      <Grain />
      <Html5Audio src={SONG} />
    </AbsoluteFill>
  );
};
