import React from 'react';
import {Composition} from 'remotion';
import {Teaser} from './Teaser';
import timeline from './timeline.json';
import {Teaser2} from './v2/Teaser2';
import timeline2 from './v2/timeline.json';
import {Teaser3} from './v3/Teaser3';
import {FPS as FPS3, TOTAL as TOTAL3} from './v3/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Resonance-Landscape"
      component={Teaser}
      durationInFrames={timeline.total}
      fps={timeline.fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="Resonance-Portrait"
      component={Teaser}
      durationInFrames={timeline.total}
      fps={timeline.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id="Resonance-V2-Landscape"
      component={Teaser2}
      durationInFrames={timeline2.total}
      fps={timeline2.fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="Resonance-V2-Portrait"
      component={Teaser2}
      durationInFrames={timeline2.total}
      fps={timeline2.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id="Resonance-V3-Portrait"
      component={Teaser3}
      durationInFrames={TOTAL3}
      fps={FPS3}
      width={1080}
      height={1920}
    />
  </>
);
