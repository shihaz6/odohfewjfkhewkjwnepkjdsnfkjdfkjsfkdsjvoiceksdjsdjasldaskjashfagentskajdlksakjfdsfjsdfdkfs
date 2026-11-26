import React, {createContext, useContext, useId} from 'react';
import type {CSSProperties} from 'react';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {clamp, easeIn, easeInOut, easeOut} from '../anim';
import timeline from './timeline.json';

export const TL = timeline;
export const CUES = timeline.cues;
export const MUSIC = staticFile('v2/music.wav');
export type SceneName = keyof typeof timeline.scenes;
export const sceneStart = (s: SceneName) => timeline.scenes[s][0];

// ---------- the music, as data ----------
const EMPTY: number[] = new Array(64).fill(0);
type AudioState = {abs: number; spectrum: number[]; bass: number; mid: number};
const AudioCtx = createContext<AudioState>({abs: 0, spectrum: EMPTY, bass: 0, mid: 0});

/** Analyses the soundtrack once per frame so every visual can react to the real music. */
export const AudioProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = useAudioData(MUSIC);
  const raw = data ? visualizeAudio({fps, frame, audioData: data, numberOfSamples: 64, smoothing: true}) : EMPTY;
  const spectrum = raw.map((v) => Math.min(1, Math.sqrt(v) * 1.6));
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  return (
    <AudioCtx.Provider value={{abs: frame, spectrum, bass: avg(spectrum.slice(0, 3)), mid: avg(spectrum.slice(3, 20))}}>
      {children}
    </AudioCtx.Provider>
  );
};
export const useAudio = () => useContext(AudioCtx);

/** 1 on every beat of the groove (drop to final hit), decaying in between. */
export const beatPulse = (abs: number, decay = 5) =>
  abs < CUES.drop || abs > CUES.final ? 0 : Math.exp(-((abs - CUES.drop) % 15) / decay);

/** 1 at each hit, decaying afterwards. */
export const hitPulse = (f: number, hits: number[], decay = 6) => {
  let m = 0;
  for (const h of hits) if (f >= h) m = Math.max(m, Math.exp(-(f - h) / decay));
  return m;
};

// ---------- shots and transitions ----------
export type Tr = {type: 'cut' | 'zoom' | 'whip' | 'rise' | 'iris'; len: number};
const OffsetCtx = createContext(0);

/** Frame within the current scene: 0 at the cut, negative during the incoming transition. */
export const useSceneFrame = () => useCurrentFrame() - useContext(OffsetCtx);

/** A scene that overlaps its neighbours by half of each transition. */
export const Shot: React.FC<{name: string; start: number; dur: number; enter: Tr; exit: Tr; children: React.ReactNode}> = ({
  name,
  start,
  dur,
  enter,
  exit,
  children,
}) => {
  const pre = Math.floor(enter.len / 2);
  const post = Math.ceil(exit.len / 2);
  return (
    <Sequence name={name} from={start - pre} durationInFrames={dur + pre + post}>
      <OffsetCtx.Provider value={pre}>
        <TransitionLayer dur={dur} enter={enter} exit={exit}>
          {children}
        </TransitionLayer>
      </OffsetCtx.Provider>
    </Sequence>
  );
};

const TransitionLayer: React.FC<{dur: number; enter: Tr; exit: Tr; children: React.ReactNode}> = ({dur, enter, exit, children}) => {
  const f = useSceneFrame();
  const {width: W, height: H} = useVideoConfig();
  const id = 'mb' + useId().replace(/[^a-zA-Z0-9]/g, '');
  let tx = 0;
  let ty = 0;
  let scale = 1;
  let blur = 0;
  let bx = 0;
  let by = 0;
  let opacity = 1;
  let clip: string | undefined;

  if (enter.len > 0 && f < enter.len / 2) {
    const p = interpolate(f, [-enter.len / 2, enter.len / 2], [0, 1], clamp);
    const e = easeInOut(p);
    if (enter.type === 'zoom') {
      const q = easeOut(interpolate(p, [0.3, 1], [0, 1], clamp));
      scale = 0.7 + 0.3 * q;
      blur = (1 - q) * 18;
      opacity = q;
    } else if (enter.type === 'whip') {
      tx = (1 - e) * W * 1.05;
      bx = Math.sin(p * Math.PI) * 60;
    } else if (enter.type === 'rise') {
      ty = (1 - e) * H * 1.05;
      by = Math.sin(p * Math.PI) * 50;
    } else if (enter.type === 'iris') {
      clip = `circle(${(e * Math.hypot(W, H)) / 2 + 1}px at 50% 50%)`;
    }
  }
  if (exit.len > 0 && f > dur - exit.len / 2) {
    const p = interpolate(f, [dur - exit.len / 2, dur + exit.len / 2], [0, 1], clamp);
    const e = easeInOut(p);
    if (exit.type === 'zoom') {
      const q = easeIn(interpolate(p, [0, 0.7], [0, 1], clamp));
      scale = 1 + 1.5 * q;
      blur = q * 22;
      opacity = 1 - interpolate(p, [0.35, 0.7], [0, 1], clamp);
    } else if (exit.type === 'whip') {
      tx = -e * W * 1.05;
      bx = Math.sin(p * Math.PI) * 60;
    } else if (exit.type === 'rise') {
      ty = -e * H * 1.05;
      by = Math.sin(p * Math.PI) * 50;
    } else if (exit.type === 'iris') {
      scale = 1 - 0.06 * e;
    }
  }
  const directional = bx > 0.3 || by > 0.3;
  const filter = [blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : '', directional ? `url(#${id})` : ''].join(' ').trim();
  const style: CSSProperties = {
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
    filter: filter || undefined,
    opacity,
    clipPath: clip,
    WebkitClipPath: clip,
  };
  return (
    <AbsoluteFill style={style}>
      {directional && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
};

/** Place children with their centre at (x, y) px from the frame centre. */
export const At: React.FC<{x?: number; y?: number; style?: CSSProperties; children: React.ReactNode}> = ({x = 0, y = 0, style, children}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 'max-content',
      textAlign: 'center',
      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      ...style,
    }}
  >
    {children}
  </div>
);
