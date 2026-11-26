import type {CSSProperties} from 'react';
import {Easing, interpolate, useVideoConfig} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** 0 → 1 between `start` and `start + dur`, eased. */
export const progress = (frame: number, start: number, dur: number, easing = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});

export const fadeUp = (frame: number, start: number, dur = 20, dist = 40): CSSProperties => {
  const p = progress(frame, start, dur);
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
};

/** Landscape vs portrait helpers. Both formats are 1080 px on their short side. */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  return {
    portrait,
    width,
    height,
    diag: Math.hypot(width, height),
    pick: <T,>(landscape: T, portraitValue: T): T => (portrait ? portraitValue : landscape),
  };
};
