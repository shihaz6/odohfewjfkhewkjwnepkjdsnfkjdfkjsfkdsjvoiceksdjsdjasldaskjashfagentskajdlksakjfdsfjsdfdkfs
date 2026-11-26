import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile} from 'remotion';
import {Grain, Wipe} from './components/visuals';
import {Cta} from './scenes/Cta';
import {Demo} from './scenes/Demo';
import {Features} from './scenes/Features';
import {Intro} from './scenes/Intro';
import {Problem} from './scenes/Problem';
import {Question} from './scenes/Question';
import {Reveal} from './scenes/Reveal';
import {COLORS} from './theme';
import timeline from './timeline.json';

type SceneName = keyof typeof timeline.scenes;

const SCENES: {name: SceneName; Component: React.FC<{dur: number}>}[] = [
  {name: 'intro', Component: Intro},
  {name: 'problem', Component: Problem},
  {name: 'question', Component: Question},
  {name: 'reveal', Component: Reveal},
  {name: 'demo', Component: Demo},
  {name: 'features', Component: Features},
  {name: 'cta', Component: Cta},
];

// Wipes centred on scene cuts: the panel fully covers the frame at the cut.
const WIPES: {at: SceneName; color: string; edge: string; reverse?: boolean}[] = [
  {at: 'question', color: COLORS.violet, edge: COLORS.white},
  {at: 'demo', color: COLORS.violet, edge: COLORS.white, reverse: true},
  {at: 'features', color: COLORS.grey, edge: COLORS.violet},
];

export const Teaser: React.FC = () => (
  <AbsoluteFill style={{background: COLORS.black}}>
    {SCENES.map(({name, Component}) => {
      const [from, dur] = timeline.scenes[name];
      return (
        <Sequence key={name} name={name} from={from} durationInFrames={dur}>
          <Component dur={dur} />
        </Sequence>
      );
    })}
    {WIPES.map(({at, ...props}) => (
      <Sequence key={at} name={`wipe → ${at}`} from={timeline.scenes[at][0] - 12} durationInFrames={24}>
        <Wipe {...props} />
      </Sequence>
    ))}
    <Grain />
    <Html5Audio src={staticFile('teaser-music.wav')} />
  </AbsoluteFill>
);
