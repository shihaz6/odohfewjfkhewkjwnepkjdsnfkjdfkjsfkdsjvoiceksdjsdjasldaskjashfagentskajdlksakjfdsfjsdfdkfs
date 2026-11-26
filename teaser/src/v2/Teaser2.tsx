import React from 'react';
import {AbsoluteFill, Html5Audio} from 'remotion';
import {Grain} from '../components/visuals';
import {COLORS} from '../theme';
import {AudioProvider, MUSIC, SceneName, Shot, TL, Tr} from './core';
import {Cta} from './scenes/Cta';
import {Demo} from './scenes/Demo';
import {Features} from './scenes/Features';
import {Intro} from './scenes/Intro';
import {Missed} from './scenes/Missed';
import {Question} from './scenes/Question';
import {Reveal} from './scenes/Reveal';
import {Ring} from './scenes/Ring';

const NONE: Tr = {type: 'cut', len: 0};

// Each scene and the transition into the next one (centred on the cut).
const SCENES: {name: SceneName; C: React.FC<{dur: number}>; next: Tr}[] = [
  {name: 'intro', C: Intro, next: {type: 'zoom', len: 16}},
  {name: 'ring', C: Ring, next: {type: 'rise', len: 14}},
  {name: 'missed', C: Missed, next: {type: 'iris', len: 18}},
  {name: 'question', C: Question, next: NONE},
  {name: 'reveal', C: Reveal, next: {type: 'whip', len: 14}},
  {name: 'demo', C: Demo, next: {type: 'zoom', len: 14}},
  {name: 'features', C: Features, next: {type: 'zoom', len: 16}},
  {name: 'cta', C: Cta, next: NONE},
];

export const Teaser2: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.black}}>
    <AudioProvider>
      {SCENES.map(({name, C, next}, i) => {
        const [start, dur] = TL.scenes[name];
        return (
          <Shot key={name} name={name} start={start} dur={dur} enter={i === 0 ? NONE : SCENES[i - 1].next} exit={next}>
            <C dur={dur} />
          </Shot>
        );
      })}
    </AudioProvider>
    <Grain />
    <Html5Audio src={MUSIC} />
  </AbsoluteFill>
);
