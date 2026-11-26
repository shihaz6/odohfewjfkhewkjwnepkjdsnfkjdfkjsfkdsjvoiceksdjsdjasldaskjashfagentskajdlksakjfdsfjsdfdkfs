// Cuts the soundtrack for the V3 teaser from the song in the project root.
// 0-43 s of the track: the vocal-stab intro, the drop at 8.46 s, 16 bars of chorus,
// the silent gap at 37.7 s and the final hit at 38.69 s, then a 3 s fade.
// The beat grid in src/v3/timeline.ts was measured from this exact cut (127 BPM).
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'FA FA FA Lyrical OM Dhanush Mammootty Sai Pallavi Sreeleela Rajkumar Sai Abhyankkar.mp3');
const out = join(here, '..', 'public', 'v3', 'song.wav');
if (!existsSync(src)) throw new Error(`Song not found: ${src}`);
mkdirSync(dirname(out), {recursive: true});

const r = spawnSync(
  'ffmpeg',
  ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-t', '43', '-af', 'afade=t=in:d=0.05,afade=t=out:st=40:d=3', '-ar', '48000', '-ac', '2', out],
  {stdio: 'inherit'},
);
if (r.status !== 0) throw new Error('ffmpeg failed (is it installed and on PATH?)');
console.log(`Wrote ${out}`);
