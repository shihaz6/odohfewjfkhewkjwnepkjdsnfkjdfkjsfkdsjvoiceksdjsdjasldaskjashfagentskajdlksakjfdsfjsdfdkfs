// Synthesises the teaser's original music and sound design to public/teaser-music.wav.
// Scene starts come from src/timeline.json; the local cue frames below mirror the
// constants in src/scenes (Problem RING_BURSTS/MISSED_*, Demo TURNS/SAVED_AT,
// Features CARD_*, Cta PILL_AT). Keep them in sync if you retime a scene.
// Run: npm run audio

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const timeline = JSON.parse(fs.readFileSync(path.join(here, '../src/timeline.json'), 'utf8'));
const OUT = path.join(here, '../public/teaser-music.wav');

const SR = 44100;
const FPS = timeline.fps;
const DUR = timeline.total / FPS;
const N = Math.ceil(DUR * SR);
const TAU = Math.PI * 2;

const dryL = new Float32Array(N);
const dryR = new Float32Array(N);
const sendL = new Float32Array(N);
const sendR = new Float32Array(N);

/** Absolute time in seconds of a scene's local frame. */
const at = (scene, local = 0) => (timeline.scenes[scene][0] + local) / FPS;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Deterministic noise so every render sounds the same.
let seed = 1234567;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;

/** Render a voice: gen(t, dur) is called once per sample, in order, so it may keep state. */
function add(t0, dur, gen, {gain = 1, pan = 0, send = 0.25} = {}) {
  const s0 = Math.max(0, Math.floor(t0 * SR));
  const s1 = Math.min(N, Math.floor((t0 + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = s0; i < s1; i++) {
    const v = gen((i - s0) / SR, dur);
    dryL[i] += v * gl;
    dryR[i] += v * gr;
    sendL[i] += v * gl * send;
    sendR[i] += v * gr * send;
  }
}

const env = (t, dur, a, r) => Math.max(0, Math.min(1, t / a, (dur - t) / r));

// ---------------------------------------------------------------- instruments

/** Warm pad note: detuned sines with a soft second harmonic and slow shimmer. */
function padNote(t0, dur, m, gain, {attack = 1.2, release = 1.2, pan = 0, bright = 0.25} = {}) {
  const f = midi(m);
  for (const [detune, p] of [[-0.0025, pan - 0.45], [0.0025, pan + 0.45]]) {
    const ff = f * (1 + detune);
    const ph = rnd() * TAU;
    add(
      t0,
      dur,
      (t, d) =>
        env(t, d, attack, release) *
        (1 + 0.08 * Math.sin(TAU * 0.25 * t + ph)) *
        (Math.sin(TAU * ff * t + ph) + bright * Math.sin(TAU * 2 * ff * t) + 0.08 * Math.sin(TAU * 3 * ff * t)),
      {gain, pan: p, send: 0.45},
    );
  }
}

const chord = (t0, dur, notes, gain, opts) => notes.forEach((m) => padNote(t0, dur, m, gain, opts));

/** Soft bell / sonar ping with an inharmonic partial. */
function bell(t0, f, gain, {decay = 2.2, pan = 0} = {}) {
  add(
    t0,
    decay * 2,
    (t) =>
      Math.min(1, t / 0.004) *
      (Math.exp(-t * (3 / decay)) * Math.sin(TAU * f * t) + 0.3 * Math.exp(-t * (7 / decay)) * Math.sin(TAU * f * 2.76 * t)),
    {gain, pan, send: 0.7},
  );
}

function kick(t0, gain) {
  let ph = 0;
  add(
    t0,
    0.5,
    (t) => {
      ph += (TAU * (45 + 105 * Math.exp(-t * 28))) / SR;
      return Math.exp(-t * 8) * Math.sin(ph) + 0.15 * Math.exp(-t * 200) * noise();
    },
    {gain, send: 0.05},
  );
}

function hat(t0, gain, pan = 0.25) {
  let lp = 0;
  add(
    t0,
    0.08,
    (t) => {
      const n = noise();
      lp += 0.35 * (n - lp);
      return Math.exp(-t * 70) * (n - lp);
    },
    {gain, pan, send: 0.1},
  );
}

/** Plucked bass note on a beat. */
function bass(t0, m, gain) {
  const f = midi(m);
  add(t0, 0.55, (t) => Math.min(1, t / 0.006) * Math.exp(-t * 5) * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)), {
    gain,
    send: 0.08,
  });
}

/** State-variable band-pass over noise; cutoff follows fc(t). */
function filteredNoise(t0, dur, fc, ampFn, {gain = 1, q = 0.7, pan = 0, send = 0.4} = {}) {
  let low = 0;
  let band = 0;
  add(
    t0,
    dur,
    (t, d) => {
      const f = 2 * Math.sin((Math.PI * Math.min(fc(t, d), SR / 6)) / SR);
      low += f * band;
      const high = noise() - low - q * band;
      band += f * high;
      return band * ampFn(t, d);
    },
    {gain, pan, send},
  );
}

/** Whoosh centred on `tc` (the cut under a wipe). */
function whoosh(tc, gain, dur = 0.9) {
  const t0 = tc - dur * 0.55;
  filteredNoise(
    t0,
    dur,
    (t, d) => 300 + 5200 * Math.sin((Math.PI * t) / d),
    (t, d) => Math.pow(Math.sin((Math.PI * t) / d), 2),
    {gain, q: 0.5, send: 0.35},
  );
}

/** Riser that peaks exactly at `tEnd`. */
function riser(tEnd, dur, gain) {
  const t0 = tEnd - dur;
  filteredNoise(t0, dur, (t, d) => 200 * Math.pow(40, t / d), (t, d) => Math.pow(t / d, 2.2), {gain, q: 0.4, send: 0.5});
  let ph = 0;
  add(
    t0,
    dur,
    (t, d) => {
      ph += (TAU * (180 * Math.pow(4, t / d))) / SR;
      return Math.pow(t / d, 3) * Math.sin(ph) * 0.5;
    },
    {gain, send: 0.5},
  );
}

/** Sub boom and noise burst for the reveal. */
function impact(t0, gain) {
  let ph = 0;
  add(
    t0,
    2.5,
    (t) => {
      ph += (TAU * (32 + 70 * Math.exp(-t * 7))) / SR;
      return Math.exp(-t * 1.6) * Math.tanh(1.8 * Math.sin(ph));
    },
    {gain, send: 0.2},
  );
  filteredNoise(t0, 1.6, (t) => 6000 * Math.exp(-t * 3) + 200, (t) => Math.exp(-t * 4), {gain: gain * 0.9, q: 0.6, send: 0.8});
}

/** Classic telephone ring: 440 + 480 Hz with a fast bell trill. */
function phoneRing(t0, dur, gain) {
  add(
    t0,
    dur,
    (t, d) =>
      env(t, d, 0.02, 0.05) * (0.55 + 0.45 * Math.sign(Math.sin(TAU * 20 * t))) * 0.5 * (Math.sin(TAU * 440 * t) + Math.sin(TAU * 480 * t)),
    {gain, pan: 0.15, send: 0.3},
  );
}

function blip(t0, f1, f2, gain, pan = 0) {
  let ph = 0;
  add(
    t0,
    0.14,
    (t) => {
      ph += (TAU * (f1 + (f2 - f1) * Math.min(1, t / 0.06))) / SR;
      return Math.min(1, t / 0.003) * Math.exp(-t * 32) * Math.sin(ph);
    },
    {gain, pan, send: 0.35},
  );
}

// ---------------------------------------------------------------- score

const tProblem = at('problem');
const tQuestion = at('question');
const tReveal = at('reveal');
const tDemo = at('demo');
const tFeatures = at('features');
const tCta = at('cta');

// Intro + problem: dark A minor drone with a heartbeat pulse.
chord(0, tQuestion + 0.4, [33, 40, 45, 48, 59], 0.05, {attack: 2.5, release: 1.0, bright: 0.15});
bell(at('intro', 8), midi(81), 0.12, {decay: 2.6});
bell(at('intro', 78), midi(88), 0.07, {decay: 2.6, pan: 0.3});
for (let t = tProblem + 0.1; t < tQuestion - 0.4; t += 0.75) {
  kick(t, 0.32);
  kick(t + 0.22, 0.16);
}

// Phone rings (Problem RING_BURSTS), then missed-call cards (MISSED_START/STEP).
phoneRing(at('problem', 6), 40 / FPS, 0.09);
phoneRing(at('problem', 58), 40 / FPS, 0.09);
for (let i = 0; i < 4; i++) blip(at('problem', 104 + i * 10), 700, 470, 0.14, -0.2 + i * 0.13);
bell(at('problem', 160), midi(57), 0.12, {decay: 3});

// Wipe into the question, near silence, then a riser into the reveal.
whoosh(tQuestion, 0.5);
bell(tQuestion + 0.05, midi(76), 0.08, {decay: 3});
chord(tQuestion, tReveal - tQuestion, [64, 71], 0.025, {attack: 0.8, release: 0.4, bright: 0.1});
riser(tReveal, 2.6, 0.5);

// Reveal: impact and a bright Cmaj9 swell.
impact(tReveal, 0.9);
chord(tReveal, tDemo - tReveal + 0.8, [36, 43, 52, 59, 62, 67], 0.055, {attack: 0.08, release: 1.4, bright: 0.3});
bell(tReveal + 0.02, midi(84), 0.11, {decay: 3.5});
bell(at('reveal', 46), midi(91), 0.06, {decay: 3, pan: -0.3});

// Demo + features: 100 BPM groove over Am7 - Fmaj7 - C - G.
whoosh(tDemo, 0.45);
whoosh(tFeatures, 0.4);
const BEAT = 60 / 100;
const PROG = [
  {root: 33, notes: [45, 52, 55, 60]},
  {root: 29, notes: [41, 48, 52, 57]},
  {root: 36, notes: [48, 55, 60, 64]},
  {root: 31, notes: [43, 50, 55, 59]},
];
let bar = 0;
for (let t = tDemo; t < tCta - 0.05; t += 4 * BEAT, bar++) {
  const {root, notes} = PROG[bar % PROG.length];
  const len = Math.min(4 * BEAT, tCta - t);
  chord(t, len + 0.5, notes, 0.03, {attack: 0.25, release: 0.5, bright: 0.2});
  for (let b = 0; b < 4 && t + b * BEAT < tCta - 0.05; b++) {
    const tb = t + b * BEAT;
    kick(tb, b % 2 === 0 ? 0.42 : 0.26);
    hat(tb + BEAT / 2, 0.06);
    bass(tb, root + 12, 0.16);
  }
}

// Demo transcript bubbles (TURNS starts) and the saved chime (SAVED_AT).
[30, 75, 135, 180].forEach((f, i) => blip(at('demo', f), i % 2 ? 1250 : 950, i % 2 ? 1550 : 1150, 0.08, i % 2 ? 0.3 : -0.3));
bell(at('demo', 238), midi(76), 0.1, {decay: 1.8});
bell(at('demo', 238) + 0.12, midi(83), 0.1, {decay: 2.2});

// Feature cards (CARD_START, CARD_STEP).
[0, 1, 2].forEach((i) => bell(at('features', 22 + i * 13), midi([72, 76, 79][i]), 0.08, {decay: 1.6, pan: -0.3 + i * 0.3}));

// End card: resolve to a wide C chord; bell on "Launching soon" (PILL_AT).
chord(tCta, DUR - tCta, [24, 36, 43, 52, 59, 62, 67], 0.05, {attack: 0.3, release: 3.2, bright: 0.25});
kick(tCta, 0.5);
bell(tCta + 0.02, midi(79), 0.1, {decay: 3});
bell(at('cta', 46), midi(84), 0.12, {decay: 3.5});
bell(at('cta', 46) + 0.18, midi(91), 0.06, {decay: 3.5, pan: 0.35});

// ---------------------------------------------------------------- mix

/** Schroeder reverb: four damped combs and two all-passes per channel. */
function reverb(input, offset) {
  const out = new Float32Array(N);
  for (const d of [1557, 1617, 1491, 1422].map((x) => x + offset)) {
    const buf = new Float32Array(d);
    let idx = 0;
    let lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[idx];
      lp = y * 0.6 + lp * 0.4;
      buf[idx] = input[i] + lp * 0.82;
      out[i] += y * 0.25;
      idx = (idx + 1) % d;
    }
  }
  for (const d of [225 + offset, 556 + offset]) {
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < N; i++) {
      const b = buf[idx];
      const x = out[i];
      buf[idx] = x + b * 0.5;
      out[i] = b - x * 0.5;
      idx = (idx + 1) % d;
    }
  }
  return out;
}

const wetL = reverb(sendL, 0);
const wetR = reverb(sendR, 23);

const mixL = new Float32Array(N);
const mixR = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.3, (DUR - t) / 1.2);
  mixL[i] = Math.tanh((dryL[i] + wetL[i] * 0.5) * 1.3) * fade;
  mixR[i] = Math.tanh((dryR[i] + wetR[i] * 0.5) * 1.3) * fade;
  peak = Math.max(peak, Math.abs(mixL[i]), Math.abs(mixR[i]));
}
const norm = 0.89 / peak; // about -1 dBFS

// 16-bit stereo WAV.
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixL[i] * norm)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixR[i] * norm)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(OUT, Buffer.concat([header, data]));

// Loudness per section, to sanity-check the mix without listening.
const rms = (a, b) => {
  let s = 0;
  const i0 = Math.floor(a * SR);
  const i1 = Math.floor(b * SR);
  for (let i = i0; i < i1; i++) s += (mixL[i] * norm) ** 2;
  return (10 * Math.log10(s / (i1 - i0) + 1e-12)).toFixed(1);
};
const marks = Object.entries(timeline.scenes).map(([k, [f, d]]) => [k, f / FPS, (f + d) / FPS]);
console.log(`wrote ${OUT} (${DUR.toFixed(1)} s)`);
for (const [k, a, b] of marks) console.log(`  ${k.padEnd(9)} ${a.toFixed(1)}-${b.toFixed(1)} s  RMS ${rms(a, b)} dBFS`);
