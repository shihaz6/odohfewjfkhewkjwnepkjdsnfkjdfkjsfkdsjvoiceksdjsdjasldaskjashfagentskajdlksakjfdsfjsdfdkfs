// Beat grid for the V3 teaser, measured from public/v3/song.wav (127 BPM).
// Every animation in src/v3 is keyed to these frames, so cuts land on the music.

export const FPS = 30;
export const BPM = 127;
export const TOTAL = 1290; // 43 s
export const FIRST_BEAT_S = 0.4206; // first beat of the grid, in seconds

/** Frames per beat (about 14.17). */
export const BEAT = (60 / BPM) * FPS;
/** Frame of beat `b` (fractional frames are fine). Downbeats are b = 1, 5, 9, ... */
export const beatF = (b: number) => FIRST_BEAT_S * FPS + b * BEAT;
export const DROP_BEAT = 17;
/** Frame of bar `n`, counted from the drop (bar 0). */
export const barF = (n: number) => beatF(DROP_BEAT + 4 * n);

export const K = {
  // Intro: two sets of three vocal stabs, then the build.
  stabsA: [62, 70, 76],
  stabsB: [118, 127, 133],
  build: [213, 221, 234, 240, 249],
  drop: barF(0), // 8.45 s
  call: barF(4), // 16.0 s
  miniGap: beatF(47), // short dip in the chorus, 22.6 s
  f1: barF(8), // 23.6 s
  f2: barF(10), // 27.4 s
  dip: beatF(63), // 30.2 s
  f3: barF(12), // 31.1 s
  launch: barF(14), // 34.9 s
  gap: beatF(79), // the music stops, 37.7 s
  final: barF(16), // the last hit, 38.7 s
} as const;
