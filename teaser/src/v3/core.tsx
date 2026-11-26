import React, {createContext, useContext} from 'react';
import type {CSSProperties} from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {noise2D} from '@remotion/noise';
import {BEAT, K, beatF} from './timeline';

export const SONG = staticFile('v3/song.wav');

// ---------- the song, as data ----------
const EMPTY: number[] = new Array(64).fill(0);
type AudioState = {spectrum: number[]; bass: number; mid: number};
const AudioCtx = createContext<AudioState>({spectrum: EMPTY, bass: 0, mid: 0});

/** Analyses the soundtrack once per frame so visuals can react to the real music. */
export const AudioProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = useAudioData(SONG);
  const raw = data ? visualizeAudio({fps, frame, audioData: data, numberOfSamples: 64, smoothing: true}) : EMPTY;
  const spectrum = raw.map((v) => Math.min(1, Math.sqrt(v) * 1.5));
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  return <AudioCtx.Provider value={{spectrum, bass: avg(spectrum.slice(0, 3)), mid: avg(spectrum.slice(3, 20))}}>{children}</AudioCtx.Provider>;
};
export const useAudio = () => useContext(AudioCtx);

// ---------- beat pulses ----------
/** True while the groove is playing (drop to the gap, and after the final hit). */
export const inGroove = (f: number) => (f >= K.drop - 0.5 && f < K.gap) || f >= K.final - 0.5;

/** 1 on every beat of the groove, decaying until the next one. */
export const beatPulse = (f: number, decay = 5) => {
  if (!inGroove(f)) return 0;
  const b = Math.floor((f - beatF(0)) / BEAT + 1e-6);
  return Math.exp(-(f - beatF(b)) / decay);
};

/** 1 on every downbeat (bar line) of the groove. */
export const barPulse = (f: number, decay = 7) => {
  if (!inGroove(f)) return 0;
  const n = Math.floor((f - beatF(1)) / (4 * BEAT) + 1e-6);
  return Math.exp(-(f - beatF(1 + 4 * n)) / decay);
};

/** 1 at each hit, decaying afterwards. */
export const hitPulse = (f: number, hits: readonly number[], decay = 6) => {
  let m = 0;
  for (const h of hits) if (f >= h - 0.5) m = Math.max(m, Math.exp(-Math.max(0, f - h) / decay));
  return m;
};

/** Camera shake that kicks on the given hits. */
export const shake = (f: number, hits: readonly number[], amp: number, decay = 5) => {
  const m = hitPulse(f, hits, decay) * amp;
  return {x: noise2D('shx', f * 0.7, 0) * m, y: noise2D('shy', 0, f * 0.7) * m, r: noise2D('shr', f * 0.5, 3) * m * 0.04};
};

// ---------- layout ----------
/** Renders children only for frames in [from, to). */
export const Show: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const f = useCurrentFrame();
  return f >= from && f < to ? <>{children}</> : null;
};

/** Places children with their centre at (x, y) px from the frame centre. */
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
