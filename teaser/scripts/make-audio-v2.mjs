// Synthesises the v2 soundtrack: a 120 BPM track whose hook is the "Resonance ringtone".
// Every cue comes from src/v2/timeline.json, so music and picture stay in sync.
// Output: public/v2/music.wav (44.1 kHz, 16-bit stereo).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tl = JSON.parse(fs.readFileSync(path.join(root, 'src/v2/timeline.json'), 'utf8'));
const OUT = path.join(root, 'public/v2/music.wav');

const SR = 44100;
const FPS = tl.fps;
const BEAT = 60 / tl.bpm; // 0.5 s
const BAR = 4 * BEAT; // 2 s = 60 frames
const DUR = tl.total / FPS;
const N = Math.round(DUR * SR);
const TAU = Math.PI * 2;
const cue = tl.cues;
const f2s = (f) => f / FPS;
const barT = (b) => b * BAR;

// ---------- utilities ----------
let seed = 20261117;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;
const SEMI = {C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11};
const hz = (n) => {
  const m = /^([A-G]#?)(-?\d)$/.exec(n);
  return 440 * 2 ** ((12 * (+m[2] + 1) + SEMI[m[1]] - 69) / 12);
};
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Zavalishin TPT state-variable filter: stable under fast modulation.
class SVF {
  constructor() {
    this.s1 = 0;
    this.s2 = 0;
    this.l = 0;
    this.b = 0;
    this.h = 0;
  }
  run(x, fc, q = 0.707) {
    const g = Math.tan((Math.PI * Math.min(Math.max(fc, 20), 18000)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - this.s2;
    const v1 = a1 * this.s1 + a2 * v3;
    const v2 = this.s2 + a2 * this.s1 + a3 * v3;
    this.s1 = 2 * v1 - this.s1;
    this.s2 = 2 * v2 - this.s2;
    this.l = v2;
    this.b = v1;
    this.h = x - k * v1 - v2;
    return this;
  }
}

// Band-limited sawtooth (polyBLEP).
const saw = (ph, dt) => {
  let v = 2 * ph - 1;
  if (ph < dt) {
    const t = ph / dt;
    v -= t + t - t * t - 1;
  } else if (ph > 1 - dt) {
    const t = (ph - 1) / dt;
    v -= t * t + t + t + 1;
  }
  return v;
};

// ---------- buses ----------
const bus = () => [new Float32Array(N), new Float32Array(N)];
const B = {
  drums: bus(),
  music: bus(), // sidechained to the kick
  lead: bus(),
  fx: bus(),
  ring: bus(), // the phone ringing section; gets a tape-stop
  padMain: bus(), // raw supersaw, filtered later
  padRing: bus(),
};
const REV = new Float32Array(N);
const DLY = bus();
const kicks = [];

/** Render fn(t) for `dur` seconds from t0 into a bus, with pan and effect sends. */
function voice(t0, dur, fn, o = {}) {
  const target = o.bus ?? B.music;
  const pan = o.pan ?? 0;
  const gain = o.gain ?? 1;
  const gl = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
  const gr = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
  const rs = (o.rev ?? 0) * gain;
  const ds = (o.dly ?? 0) * gain;
  const i0 = Math.round(t0 * SR);
  const n = Math.round(dur * SR);
  for (let k = 0; k < n; k++) {
    const i = i0 + k;
    if (i < 0) continue;
    if (i >= N) break;
    const v = fn(k / SR);
    target[0][i] += v * gl;
    target[1][i] += v * gr;
    if (rs) REV[i] += v * rs;
    if (ds) {
      DLY[0][i] += v * ds * gl;
      DLY[1][i] += v * ds * gr;
    }
  }
}

// ---------- instruments ----------
/** Marimba: inharmonic partials (1, 3.93, 9.23) with a mallet click. The ringtone voice. */
function marimba(t0, f, vel = 1, o = {}) {
  voice(
    t0,
    1.8,
    (t) => {
      const a = t < 0.0015 ? t / 0.0015 : 1;
      const v =
        Math.sin(TAU * f * t) * Math.exp(-t * 3.2) +
        0.3 * Math.sin(TAU * f * 3.93 * t) * Math.exp(-t * 13) +
        0.1 * Math.sin(TAU * f * 9.23 * t) * Math.exp(-t * 38) +
        0.1 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 7);
      const click = t < 0.003 ? noise() * (1 - t / 0.003) * 0.22 : 0;
      return (a * v + click) * vel * 0.42;
    },
    o,
  );
}

/** FM bell with a long shimmer. */
function bell(t0, f, vel = 1, o = {}) {
  voice(
    t0,
    3.5,
    (t) => {
      const idx = 2.2 * Math.exp(-t * 2.5);
      const v =
        Math.sin(TAU * f * t + Math.sin(TAU * f * 3.5 * t) * idx) * Math.exp(-t * 1.5) +
        0.25 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 3);
      return v * (t < 0.003 ? t / 0.003 : 1) * vel * 0.2;
    },
    o,
  );
}

/** Soft sine sparkle, an octave above the hook. */
function glass(t0, f, vel = 1, o = {}) {
  voice(t0, 1.2, (t) => Math.sin(TAU * f * t) * Math.exp(-t * 4.5) * (t < 0.004 ? t / 0.004 : 1) * vel * 0.12, o);
}

/** Filtered saw pluck for arpeggios. */
function pluck(t0, f, vel = 1, o = {}) {
  const flt = new SVF();
  let ph = rnd();
  const dt = f / SR;
  voice(
    t0,
    0.45,
    (t) => {
      ph += dt;
      if (ph >= 1) ph -= 1;
      const fc = 350 + (o.bright ?? 3500) * Math.exp(-t * 16);
      const env = (t < 0.002 ? t / 0.002 : 1) * Math.exp(-t * 9);
      return flt.run(saw(ph, dt), fc, 0.9).l * env * vel * 0.32;
    },
    o,
  );
}

/** Supersaw chord (7 detuned voices per note) into a raw pad bus, filtered as a whole later. */
const DETUNE = [-0.22, -0.13, -0.06, 0, 0.06, 0.13, 0.22];
function pad(t0, dur, notes, o = {}) {
  const target = o.ring ? B.padRing : B.padMain;
  const att = o.att ?? 0.05;
  const rel = o.rel ?? 0.3;
  const gain = o.gain ?? 1;
  for (const n of notes) {
    const f0 = hz(n);
    DETUNE.forEach((d, j) => {
      const f = f0 * 2 ** (d / 12);
      const dt = f / SR;
      let ph = rnd();
      voice(
        t0,
        dur + rel,
        (t) => {
          ph += dt;
          if (ph >= 1) ph -= 1;
          const env = Math.min(1, t / att) * (t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1);
          return saw(ph, dt) * env * 0.045 * gain;
        },
        {bus: target, pan: (j / (DETUNE.length - 1)) * 1.6 - 0.8},
      );
    });
  }
}

/** Plucky bass: sine body plus a filtered saw. */
function bass(t0, dur, f, vel = 1) {
  const flt = new SVF();
  let ph = 0;
  let ps = 0;
  const dt = f / SR;
  voice(
    t0,
    dur + 0.04,
    (t) => {
      ph += dt;
      if (ph >= 1) ph -= 1;
      ps += (TAU * f) / SR;
      const env = (t < 0.004 ? t / 0.004 : 1) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.04) : 1) * (0.65 + 0.35 * Math.exp(-t * 9));
      const s = flt.run(saw(ph, dt), 260 + 1100 * Math.exp(-t * 20), 1.1).l;
      return Math.tanh((Math.sin(ps) * 0.6 + s * 0.5) * 1.4) * env * vel * 0.42;
    },
    {bus: B.music},
  );
}

/** Long sub sine. */
function sub(t0, dur, f, vel = 1, o = {}) {
  let ps = 0;
  voice(
    t0,
    dur,
    (t) => {
      ps += (TAU * f) / SR;
      const env = smooth(t / Math.min(0.6, dur / 3)) * smooth((dur - t) / Math.min(0.6, dur / 3));
      return Math.sin(ps) * env * vel * 0.3;
    },
    {bus: B.music, ...o},
  );
}

function kick(t0, vel = 1, o = {}) {
  let ph = 0;
  voice(
    t0,
    0.55,
    (t) => {
      const f = 45 + 125 * Math.exp(-t * 30) + 40 * Math.exp(-t * 140);
      ph += (TAU * f) / SR;
      const env = Math.exp(-t * 7) * (t < 0.002 ? t / 0.002 : 1);
      const click = t < 0.005 ? noise() * Math.exp(-t * 900) * 0.35 : 0;
      return (Math.tanh(1.8 * Math.sin(ph) * env) + click) * vel * 0.85;
    },
    {bus: B.drums, ...o},
  );
  if (!o.noDuck) kicks.push(t0);
}

function clap(t0, vel = 1, o = {}) {
  const flt = new SVF();
  voice(
    t0,
    0.45,
    (t) => {
      let env = 0;
      for (const b of [0, 0.011, 0.022]) if (t >= b) env += Math.exp(-(t - b) * 260);
      if (t >= 0.03) env += 0.75 * Math.exp(-(t - 0.03) * 15);
      return flt.run(noise(), 1350, 1.4).b * env * vel * 0.9;
    },
    {bus: B.drums, rev: 0.22, pan: 0.05, ...o},
  );
}

function hat(t0, vel = 1, open = false, o = {}) {
  const flt = new SVF();
  voice(
    t0,
    open ? 0.35 : 0.06,
    (t) => flt.run(noise(), 8500, 0.9).h * Math.exp(-t * (open ? 10 : 70)) * vel * 0.32,
    {bus: B.drums, pan: o.pan ?? 0.25, ...o},
  );
}

function snare(t0, vel = 1, tone = 190, o = {}) {
  const flt = new SVF();
  voice(
    t0,
    0.25,
    (t) => {
      const body = Math.sin(TAU * tone * t) * Math.exp(-t * 32) * 0.55;
      const nz = flt.run(noise(), 2600, 0.8).b * Math.exp(-t * 20) * 1.1;
      return (body + nz) * vel * 0.55;
    },
    {bus: B.drums, rev: 0.18, ...o},
  );
}

/** Swept noise plus a rising saw. */
function riser(t0, t1, vel = 1) {
  const d = t1 - t0;
  for (const pan of [-0.7, 0.7]) {
    const flt = new SVF();
    voice(
      t0,
      d,
      (t) => {
        const p = t / d;
        return flt.run(noise(), 350 * (7000 / 350) ** p, 2.2).b * p * p * vel * 0.55;
      },
      {bus: B.fx, pan, rev: 0.25},
    );
  }
  const flt = new SVF();
  let ph = 0;
  voice(
    t0,
    d,
    (t) => {
      const p = t / d;
      const f = hz('A2') * 2 ** (p * 2);
      ph += f / SR;
      if (ph >= 1) ph -= 1;
      return flt.run(saw(ph, f / SR), 400 + 3500 * p, 1.2).l * p * p * vel * 0.25;
    },
    {bus: B.fx, rev: 0.2},
  );
}

/** Reverse cymbal swell that ends exactly at t1. */
function reverseCymbal(t0, t1, vel = 1) {
  const d = t1 - t0;
  for (const pan of [-0.5, 0.5]) {
    const flt = new SVF();
    voice(t0, d, (t) => flt.run(noise(), 6000, 0.7).h * (t / d) ** 3 * vel * 0.5, {bus: B.fx, pan});
  }
}

/** Sub boom plus a noise crash. */
function impact(t0, vel = 1, o = {}) {
  let ph = 0;
  voice(
    t0,
    2.0,
    (t) => {
      const f = 34 + 40 * Math.exp(-t * 6);
      ph += (TAU * f) / SR;
      return Math.tanh(2 * Math.sin(ph) * Math.exp(-t * 2.2)) * vel * 0.75;
    },
    {bus: B.fx},
  );
  for (const pan of [-0.6, 0.6]) {
    const flt = new SVF();
    voice(t0, 2.2, (t) => flt.run(noise(), 3200, 0.7).h * Math.exp(-t * (o.short ? 4 : 2.3)) * vel * 0.38, {bus: B.fx, pan, rev: 0.45});
  }
}

/** Fast filtered-noise whoosh that pans across. Centred on `tc`. */
function whoosh(tc, vel = 1, len = 0.45) {
  const flt = new SVF();
  const t0 = tc - len * 0.6;
  const i0 = Math.round(t0 * SR);
  const n = Math.round(len * SR);
  for (let k = 0; k < n; k++) {
    const i = i0 + k;
    if (i < 0 || i >= N) continue;
    const p = k / n;
    const v = flt.run(noise(), 500 + 4500 * Math.sin(p * Math.PI), 1.6).b * Math.sin(p * Math.PI) ** 2 * vel * 0.7;
    const pan = -0.85 + 1.7 * p;
    B.fx[0][i] += v * Math.cos(((pan + 1) * Math.PI) / 4);
    B.fx[1][i] += v * Math.sin(((pan + 1) * Math.PI) / 4);
    REV[i] += v * 0.2;
  }
}

/** Glassy two-note notification ping. */
function ping(t0, vel = 1, pan = 0) {
  for (const [dt, n] of [
    [0, 'B5'],
    [0.085, 'E5'],
  ]) {
    const f = hz(n);
    voice(
      t0 + dt,
      0.7,
      (t) => Math.sin(TAU * f * t + Math.sin(TAU * f * 2 * t) * 1.1 * Math.exp(-t * 10)) * Math.exp(-t * 8) * (t < 0.003 ? t / 0.003 : 1) * vel * 0.2,
      {bus: B.fx, pan, rev: 0.3, dly: 0.15},
    );
  }
}

/** Soft UI blip: a short upward glide. */
function blip(t0, f0, f1, vel = 1) {
  let ph = 0;
  voice(
    t0,
    0.16,
    (t) => {
      ph += (TAU * (f0 + (f1 - f0) * Math.min(1, t / 0.06))) / SR;
      return Math.sin(ph) * Math.exp(-t * 26) * (t < 0.003 ? t / 0.003 : 1) * vel * 0.22;
    },
    {bus: B.fx, rev: 0.15, dly: 0.1},
  );
}

/** Heartbeat: lub-dub on a low, muffled kick. */
function heartbeat(t0, vel = 1) {
  for (const [dt, v] of [
    [0, 1],
    [0.17, 0.6],
  ]) {
    let ph = 0;
    const flt = new SVF();
    voice(
      t0 + dt,
      0.35,
      (t) => {
        ph += (TAU * (42 + 60 * Math.exp(-t * 25))) / SR;
        return flt.run(Math.sin(ph) * Math.exp(-t * 11), 180).l * v * vel * 1.4;
      },
      {bus: B.drums},
    );
  }
}

// ---------- harmony ----------
const CH = {
  Am: {pad: ['A3', 'C4', 'E4', 'B4'], root: 'A1'},
  F: {pad: ['F3', 'A3', 'C4', 'E4'], root: 'F1'},
  C: {pad: ['G3', 'C4', 'E4', 'G4'], root: 'C2'},
  G: {pad: ['G3', 'B3', 'D4', 'E4'], root: 'G1'},
};
const PROG = ['Am', 'F', 'C', 'G'];
const up = (n, oct) => n.replace(/-?\d$/, (d) => String(+d + oct));

// The "Resonance ringtone": [beat, note, length in beats]. It becomes the hook after the drop.
const MOTIF = {
  A: [[0, 'E5'], [0.5, 'A5'], [1, 'C6'], [1.5, 'E6'], [2.5, 'D6'], [3, 'C6'], [3.5, 'A5']],
  B: [[0, 'E5'], [0.5, 'G5'], [1, 'C6'], [1.5, 'E6'], [2.5, 'D6'], [3, 'B5'], [3.5, 'G5']],
  B2: [[0, 'D5'], [0.5, 'G5'], [1, 'B5'], [1.5, 'D6'], [2.5, 'C6'], [3, 'B5'], [3.5, 'G5']],
};
const HOOK_FOR = {Am: 'A', F: 'A', C: 'B', G: 'B2'};

function hookBar(bar, which, vel = 1, o = {}) {
  for (const [beat, n] of MOTIF[which]) {
    const t = barT(bar) + beat * BEAT;
    if (o.until !== undefined && t >= o.until - 1e-6) continue;
    marimba(t, hz(n), vel, {bus: o.bus ?? B.lead, pan: 0.05, rev: o.rev ?? 0.18, dly: o.dly ?? 0.12});
    glass(t, hz(up(n, 1)), vel * 0.8, {bus: o.bus ?? B.lead, pan: -0.1, rev: 0.25});
  }
}

// ---------- arrangement ----------
const stopT = f2s(cue.ringStop); // 8.5 s
const drop = f2s(cue.drop); // 18 s
const finalT = f2s(cue.final); // 43 s

// INTRO (0-4 s): a pad opens up; four bells tease the ringtone.
pad(0, 4.0, CH.Am.pad, {att: 1.6, rel: 0.6, gain: 0.85});
sub(0, 4.2, hz('A1'), 0.4);
['E5', 'A5', 'C6', 'E6'].forEach((n, i) => bell(f2s(cue.introBells[i]), hz(n), 0.9, {bus: B.fx, rev: 0.55, dly: 0.35, pan: [-0.35, 0.35, -0.2, 0.2][i]}));
reverseCymbal(3.0, 4.0, 0.7);
whoosh(4.0, 0.8);

// RING (4-8.5 s): the ringtone, a soft groove under it, then a tape-stop.
for (let bar = 2; bar <= 4; bar++) hookBar(bar, 'A', 1, {bus: B.ring, until: stopT, rev: 0.16, dly: 0.05});
pad(4.0, stopT - 4.0, CH.Am.pad, {ring: true, att: 0.4, rel: 0.05, gain: 0.6});
for (let t = barT(3); t < stopT - 1e-6; t += BEAT / 2) {
  const onBeat = Math.abs((t / BEAT) % 1) < 1e-6;
  hat(t, onBeat ? 0.35 : 0.6, false, {bus: B.ring, pan: onBeat ? -0.2 : 0.25});
  if (onBeat && Math.round(t / BEAT) % 2 === 0) kick(t, 0.55, {bus: B.ring, noDuck: true});
}
sub(stopT + 0.15, 10 - stopT - 0.1, hz('A1'), 0.55);

// MISSED (10-14 s): heartbeat, notification pings, dark pad.
pad(9.6, 14.0 - 9.6, CH.Am.pad, {att: 0.8, rel: 0.1, gain: 0.7});
cue.heart.forEach((f) => heartbeat(f2s(f), 0.9));
cue.notify.forEach((f, i) => ping(f2s(f), 0.75 + i * 0.03, i % 2 ? 0.35 : -0.35));
for (let t = 10; t < 14 - 1e-6; t += BEAT / 4) hat(t, Math.abs((t / BEAT) % 1) < 1e-6 ? 0.28 : 0.14, false, {pan: 0.3});
sub(10, 4.0, hz('A1'), 0.7);

// QUESTION (14-18 s): a hit on every word, a snare roll and riser, half a second of silence, then the drop.
cue.words.forEach((f, i) => {
  kick(f2s(f), 0.9, {noDuck: true});
  clap(f2s(f), 0.35 + i * 0.05);
});
pad(14, 2, CH.F.pad, {att: 0.1, rel: 0.05, gain: 0.8});
pad(16, 1.5, CH.G.pad, {att: 0.05, rel: 0.04, gain: 0.9});
sub(14, 3.5, hz('F1'), 0.6);
{
  const roll = [
    [15, 16, BEAT / 2],
    [16, 17, BEAT / 4],
    [17, 17.5, BEAT / 8],
  ];
  for (const [a, b, step] of roll)
    for (let t = a; t < b - 1e-6; t += step) {
      const p = (t - 15) / 2.5;
      snare(t, 0.25 + 0.65 * p, 180 + 140 * p);
    }
}
riser(14.5, 17.5, 1);
reverseCymbal(16.8, drop, 1);

// DROP + DEMO + FEATURES (18-40 s, bars 9-19): four-on-the-floor groove, Am-F-C-G.
impact(drop, 1.1);
for (let bar = 9; bar <= 19; bar++) {
  const name = PROG[(bar - 9) % 4];
  const ch = CH[name];
  const t0 = barT(bar);
  const demo = bar >= 12 && bar <= 16;
  pad(t0, BAR, ch.pad, {att: 0.02, rel: 0.25, gain: demo ? 0.8 : 1});
  sub(t0, BAR, hz(ch.root), 0.5);
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * BEAT;
    const fill = bar === 16 && b >= 2;
    if (!fill) kick(tb, 1);
    if (b % 2 === 1 && !fill) clap(tb, 0.9);
    hat(tb + BEAT / 2, demo ? 0.55 : 0.7, b === 3 && !demo, {pan: 0.25});
    for (let s = 0; s < 4; s++) if (s !== 2) hat(tb + (s * BEAT) / 4, 0.18, false, {pan: -0.3});
    bass(tb + BEAT / 2, BEAT * 0.42, hz(up(ch.root, 1)), 1);
  }
  if (!demo || bar === 12) hookBar(bar, HOOK_FOR[name], bar === 12 ? 0.6 : 1);
  if (demo) {
    // 16th arpeggio of the chord tones, with ping-pong delay.
    const tones = [...ch.pad.map((n) => up(n, 1)), up(ch.pad[1], 2)];
    for (let s = 0; s < 16; s++) pluck(t0 + (s * BEAT) / 4, hz(tones[s % tones.length]), s % 4 === 0 ? 0.8 : 0.55, {pan: s % 2 ? 0.45 : -0.45, dly: 0.3, rev: 0.1});
  }
}
// Fill into the features.
for (let t = 33; t < 34 - 1e-6; t += BEAT / 4) snare(t, 0.35 + 0.55 * (t - 33), 200 + 120 * (t - 33));
riser(32.5, 34, 0.7);

// Demo cues: blips on each line, a chime when the callback is saved.
cue.turns.forEach((f, i) => (i % 2 ? blip(f2s(f), 1300, 1850, 0.9) : blip(f2s(f), 800, 1150, 0.9)));
['C6', 'E6', 'G6', 'C7'].forEach((n, i) => marimba(f2s(cue.saved) + i * 0.06, hz(n), 0.75, {bus: B.fx, rev: 0.3, dly: 0.2, pan: -0.3 + i * 0.2}));
glass(f2s(cue.saved) + 0.18, hz('G7'), 1, {bus: B.fx, rev: 0.4});

// Transitions.
whoosh(f2s(tl.scenes.ring[0] + tl.scenes.ring[1]), 0.7); // ring -> missed
whoosh(f2s(tl.scenes.missed[0] + tl.scenes.missed[1]), 0.6); // missed -> question
whoosh(f2s(tl.scenes.demo[0]), 0.8); // reveal -> demo
cue.features.forEach((f) => {
  whoosh(f2s(f), 0.75, 0.35);
  impact(f2s(f), 0.55, {short: true});
});

// CTA (40-46 s): G, a lift, the final C chord, then the ringtone one last time on bells.
pad(40, 2, CH.G.pad, {att: 0.02, rel: 0.2});
sub(40, 2, hz('G1'), 0.5);
hookBar(20, 'B2', 1);
for (let b = 0; b < 4; b++) {
  kick(40 + b * BEAT, 1);
  if (b % 2) clap(40 + b * BEAT, 0.9);
  hat(40 + b * BEAT + BEAT / 2, 0.7, b === 3, {pan: 0.25});
  bass(40 + b * BEAT + BEAT / 2, BEAT * 0.42, hz('G2'), 1);
}
pad(42, 1, CH.F.pad, {att: 0.02, rel: 0.1});
for (let t = 42; t < finalT - 1e-6; t += BEAT / 4) snare(t, 0.3 + 0.6 * (t - 42), 200 + 150 * (t - 42));
riser(41.8, finalT, 0.8);
marimba(42.5, hz('E5'), 0.9, {bus: B.lead, rev: 0.2});
marimba(42.75, hz('G5'), 0.9, {bus: B.lead, rev: 0.2});
bell(f2s(cue.pill), hz('E6'), 0.9, {bus: B.fx, rev: 0.4, dly: 0.25});
whoosh(f2s(tl.scenes.cta[0]), 0.6);
impact(finalT, 1.2);
kick(finalT, 1.1, {noDuck: true});
pad(finalT, DUR - finalT - 0.6, ['C3', 'G3', 'C4', 'E4', 'G4', 'D5'], {att: 0.02, rel: 0.6, gain: 1});
sub(finalT, DUR - finalT, hz('C2'), 0.8);
[['C6', 0], ['E6', 0.5], ['G6', 1.0], ['E6', 1.5], ['C7', 2.0]].forEach(([n, dt]) => {
  bell(finalT + dt, hz(n), 0.85, {bus: B.fx, rev: 0.5, dly: 0.3, pan: dt % 1 ? 0.3 : -0.3});
  marimba(finalT + dt, hz(n), 0.6, {bus: B.lead, rev: 0.3});
});

// ---------- processing ----------
// Pad filters: the main pad opens and closes with the story; the ring pad stays mellow.
const padCut = (t) => {
  if (t < 4) return 300 * (1700 / 300) ** (t / 4);
  if (t < 10) return 450;
  if (t < 14) return 500 + 500 * ((t - 10) / 4);
  if (t < 17.5) return 900 * (6000 / 900) ** ((t - 14) / 3.5);
  if (t < 24) return 6500;
  if (t < 34) return 3400;
  if (t < 43) return 6500;
  return Math.max(900, 6500 * Math.exp(-(t - 43) * 0.9));
};
for (const [src, dst, cut] of [
  [B.padMain, B.music, padCut],
  [B.padRing, B.ring, () => 1500],
]) {
  for (let c = 0; c < 2; c++) {
    const flt = new SVF();
    for (let i = 0; i < N; i++) dst[c][i] += flt.run(src[c][i], cut(i / SR), 0.9).l;
  }
}

// Tape-stop on the ringing section: playback slows to a halt over 0.5 s.
{
  const i0 = Math.round(stopT * SR);
  const len = 0.5;
  for (const ch of B.ring) {
    const src = ch.slice();
    let pos = i0;
    for (let i = i0; i < N; i++) {
      const rate = Math.max(0, 1 - (i - i0) / SR / len);
      if (rate <= 0) {
        ch[i] = 0;
        continue;
      }
      pos += rate;
      const k = Math.floor(pos);
      const fr = pos - k;
      ch[i] = ((src[k] ?? 0) * (1 - fr) + (src[k + 1] ?? 0) * fr) * Math.min(1, rate * 2.5);
    }
  }
}

// Sidechain: the music bus ducks under each kick and swells back.
const sc = new Float32Array(N).fill(1);
for (const tk of kicks) {
  const ik = Math.round(tk * SR);
  for (let k = 0; k < 0.3 * SR; k++) {
    const i = ik + k;
    if (i >= N) break;
    const g = 1 - 0.6 * (1 - smooth(k / SR / 0.24));
    if (g < sc[i]) sc[i] = g;
  }
}

// Ping-pong delay (dotted eighth) with a darkening feedback path.
const dWet = bus();
{
  const D = Math.round(BEAT * 0.75 * SR);
  const fb = 0.38;
  const lpL = new SVF();
  const lpR = new SVF();
  for (let i = 0; i < N; i++) {
    const inp = i >= D ? (DLY[0][i - D] + DLY[1][i - D]) * 0.5 : 0;
    const fromR = i >= D ? dWet[1][i - D] : 0;
    const fromL = i >= D ? dWet[0][i - D] : 0;
    dWet[0][i] = inp + lpL.run(fromR * fb, 4500).l;
    dWet[1][i] = lpR.run(fromL * fb, 4500).l;
  }
}

// Freeverb-style reverb (8 combs + 4 allpasses per side), with pre-delay and a low cut.
const revWet = bus();
{
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const mk = (spread) => ({
    combs: combT.map((n) => ({b: new Float32Array(n + spread), i: 0, f: 0})),
    aps: apT.map((n) => ({b: new Float32Array(n + spread), i: 0})),
  });
  const sides = [mk(0), mk(23)];
  const fb = 0.86;
  const damp = 0.35;
  const pre = Math.round(0.02 * SR);
  const hp = new SVF();
  for (let i = 0; i < N; i++) {
    const x = hp.run(i >= pre ? REV[i - pre] : 0, 220).h * 0.015;
    for (let s = 0; s < 2; s++) {
      let out = 0;
      for (const c of sides[s].combs) {
        const y = c.b[c.i];
        c.f = y * (1 - damp) + c.f * damp;
        c.b[c.i] = x + c.f * fb;
        if (++c.i >= c.b.length) c.i = 0;
        out += y;
      }
      for (const a of sides[s].aps) {
        const bo = a.b[a.i];
        a.b[a.i] = out + bo * 0.5;
        out = bo - out;
        if (++a.i >= a.b.length) a.i = 0;
      }
      revWet[s][i] = out * 3;
    }
  }
}

// Mix.
const L = new Float32Array(N);
const R = new Float32Array(N);
const LEVEL = {drums: 1.0, music: 0.85, lead: 0.9, fx: 0.9, ring: 1.0, rev: 0.55, dly: 0.45};
for (let i = 0; i < N; i++) {
  L[i] = B.drums[0][i] * LEVEL.drums + B.music[0][i] * sc[i] * LEVEL.music + B.lead[0][i] * LEVEL.lead + B.fx[0][i] * LEVEL.fx + B.ring[0][i] * LEVEL.ring + revWet[0][i] * LEVEL.rev + dWet[0][i] * LEVEL.dly;
  R[i] = B.drums[1][i] * LEVEL.drums + B.music[1][i] * sc[i] * LEVEL.music + B.lead[1][i] * LEVEL.lead + B.fx[1][i] * LEVEL.fx + B.ring[1][i] * LEVEL.ring + revWet[1][i] * LEVEL.rev + dWet[1][i] * LEVEL.dly;
}

// Dynamics of the story: the build-up sits lower so the drop at 18 s lands hard.
const arc = (t) => {
  if (t < 4) return 0.5;
  if (t < 8.5) return 0.62;
  if (t < 14) return 0.58;
  if (t < 17.5) return 0.6 + 0.3 * ((t - 14) / 3.5);
  if (t < drop) return 0.95;
  return 1;
};
for (let i = 0; i < N; i++) {
  const g = arc(i / SR);
  L[i] *= g;
  R[i] *= g;
}

// Master: low cut, normalise, glue compressor, soft clip, final normalise to -1 dBFS, fades.
{
  const hl = new SVF();
  const hr = new SVF();
  for (let i = 0; i < N; i++) {
    L[i] = hl.run(L[i], 28).h;
    R[i] = hr.run(R[i], 28).h;
  }
  const norm = (target) => {
    let pk = 0;
    for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
    const g = target / pk;
    for (let i = 0; i < N; i++) {
      L[i] *= g;
      R[i] *= g;
    }
  };
  norm(1);
  let env = 0;
  const atk = Math.exp(-1 / (0.006 * SR));
  const rel = Math.exp(-1 / (0.16 * SR));
  const thr = 10 ** (-16 / 20);
  const ratio = 3;
  for (let i = 0; i < N; i++) {
    const lvl = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    env = lvl > env ? atk * env + (1 - atk) * lvl : rel * env + (1 - rel) * lvl;
    const g = env > thr ? (thr * (env / thr) ** (1 / ratio)) / env : 1;
    L[i] *= g;
    R[i] *= g;
  }
  norm(1);
  const drive = 1.6;
  const k = Math.tanh(drive);
  for (let i = 0; i < N; i++) {
    L[i] = Math.tanh(L[i] * drive) / k;
    R[i] = Math.tanh(R[i] * drive) / k;
  }
  norm(0.89);
  const fadeIn = Math.round(0.01 * SR);
  const fadeOut = Math.round(1.6 * SR);
  for (let i = 0; i < fadeIn; i++) {
    L[i] *= i / fadeIn;
    R[i] *= i / fadeIn;
  }
  for (let k2 = 0; k2 < fadeOut; k2++) {
    const i = N - fadeOut + k2;
    const g = Math.cos(((k2 / fadeOut) * Math.PI) / 2);
    L[i] *= g;
    R[i] *= g;
  }
}

// ---------- write ----------
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2);
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

const rms = (a, b) => {
  let s = 0;
  const i0 = Math.round(a * SR);
  const i1 = Math.round(b * SR);
  for (let i = i0; i < i1; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2;
  return (10 * Math.log10(s / (i1 - i0) + 1e-12)).toFixed(1);
};
console.log(`wrote ${path.relative(root, OUT)} (${DUR.toFixed(1)} s)`);
for (const [name, [s, d]] of Object.entries(tl.scenes)) console.log(`  ${name.padEnd(9)} ${rms(f2s(s), f2s(s + d))} dBFS RMS`);
