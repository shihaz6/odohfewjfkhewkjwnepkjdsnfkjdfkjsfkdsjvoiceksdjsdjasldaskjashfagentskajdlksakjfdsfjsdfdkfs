# Resonance teaser video

A 44-second teaser for **Resonance by AlchemyX Global**, built with [Remotion](https://www.remotion.dev/)
in two formats:

| Composition | Size | Use |
|---|---|---|
| `Resonance-Landscape` | 1920 × 1080 | YouTube, LinkedIn, website |
| `Resonance-Portrait` | 1080 × 1920 | Reels, TikTok, Shorts, Stories |

## Version 2 (46 s)

A second, more cinematic cut. Version 1 is unchanged. It lives in `src/v2/` and renders to `out/v2/`.

| Composition | Size |
|---|---|
| `Resonance-V2-Landscape` | 1920 × 1080 |
| `Resonance-V2-Portrait` | 1080 × 1920 |

| Time | Scene | What happens |
|---|---|---|
| 0–4 s | Intro | A point of light, four bell notes that tease the ringtone, "AlchemyX Global presents" |
| 4–10 s | Ring | A 3D phone rings and buzzes on every note of the Resonance ringtone; nobody answers, the music tape-stops, "Missed call" |
| 10–14 s | Missed | Missed-call notifications pile up on the beat, a counter climbs to 7, "Your customer calls someone else." |
| 14–18 s | Question | "What if every call was answered?", one word per beat, then everything collapses into a point and half a second of silence |
| 18–24 s | Reveal | The drop: a burst of light, the resonance orb (it moves with the music), RESONANCE, by AlchemyX Global |
| 24–34 s | Demo | The phone again, now answered by Resonance: live transcript, music-driven waveform, "Callback request saved" |
| 34–40 s | Features | Three full-screen beats (charcoal, violet, mist), each slamming in on the downbeat |
| 40–46 s | End card | "Launching soon", the final hit, "Where AI Meets Business", social channels |

The music (`scripts/make-audio-v2.mjs`) is a 120 BPM track. Its hook is the ringtone from the opening, which comes back as the main melody after the drop. Scene times and every sound cue are in `src/v2/timeline.json`, which both the video and the music script read, so they can't drift apart. The waveforms and the orb read the real soundtrack while rendering.

```powershell
npm run audio:v2      # regenerate public/v2/music.wav
npm run render:v2     # music + both v2 MP4s into out/v2/
```

## Version 3: cut to a song (43 s, portrait)

A portrait-only cut timed to the song in the project root (`FA FA FA … .mp3`, 127 BPM). It lives in `src/v3/` and renders to `out/v3/`. Every scene and graphic is new; it shares only the palette and fonts with versions 1 and 2.

| Composition | Size |
|---|---|
| `Resonance-V3-Portrait` | 1080 × 1920 |

| Time | Music | What happens |
|---|---|---|
| 0–2 s | Quiet intro | A violet signal line, "AlchemyX Global presents" |
| 2–4 s | Vocal stabs 1–3 | The phone rings on each stab: RING, RING, RING. Nobody answers |
| 4–7 s | Vocal stabs 4–6 | Three missed-call cards slam in. "Your customer calls someone else." |
| 7–8.5 s | Build | WHAT IF / EVERY / CALL / WAS / ANSWERED? stack up on the build hits, then everything is sucked into a point |
| 8.5–16 s | Drop | Flash, burst, the emblem, RESONANCE, "The AI voice agent for your business." |
| 16–23.6 s | Chorus | A live call: one chat line per beat, "Callback request saved", then the screen opens out of that chip |
| 23.6–35 s | Chorus | Three features, two bars each, words landing on the beat: 24/7 dial, business facts orbiting, leads stacking up |
| 35–37.7 s | Chorus | LAUNCHING SOON, the colours invert on the beat |
| 37.7–38.7 s | The music stops | Everything collapses into one point |
| 38.7–43 s | Final hit | The emblem bursts out, end card, fade |

The beat grid (`src/v3/timeline.ts`) was measured from the song: the first beat is at 0.4206 s and the drop is beat 17. The emblem, waveforms and call spectrum react to the real audio while rendering.

```powershell
npm run audio:v3      # cut public/v3/song.wav (0-43 s with a 3 s fade) from the mp3; needs ffmpeg
npm run render:v3     # audio + out/v3/resonance-teaser-v3-portrait.mp4
```

The song is a commercial film track. Posting it with the video may get the audio muted or claimed on some platforms. Because the cut starts at 0:00 of the song, you can instead upload it silent and add the same track from Instagram's or TikTok's music library, starting from the beginning. It should stay in sync if the library version is the same edit.

## Storyboard (version 1)

| Time | Scene | What happens |
|---|---|---|
| 0–4 s | Intro | A violet point starts to resonate; "AlchemyX Global presents" |
| 4–12 s | Problem | "The phone rings." "No one answers." "Your customer calls someone else." Missed-call cards stack up |
| 12–16 s | Question | White frame: "What if **every call** was answered?" A charcoal circle closes in |
| 16–23 s | Reveal | Impact, waveform, **RESONANCE**, by AlchemyX Global, "The AI voice agent for your business." |
| 23–33 s | Demo | A live-call card: the caller and Resonance talk, ending with "Callback request saved" |
| 33–39 s | Features | Answers every call · Knows your business · Captures every lead |
| 39–44 s | End card | RESONANCE, "Launching soon", "Where AI Meets Business", social channels |

Every claim matches what the agent does today (see `../knowledge/alchemyx_facts.md`).

## Commands

```powershell
npm install
npm run studio            # preview and tweak in the browser
npm run audio             # regenerate public/teaser-music.wav
npm run render            # music + both MP4s into out/
```

## Files

| Path | What it is |
|---|---|
| `src/timeline.json` | Scene start frames and lengths (30 fps). The music script reads it too |
| `src/theme.ts` | Brand palette and fonts |
| `src/scenes/` | One file per scene |
| `src/components/visuals.tsx` | Rings, waveform, wipes, grain, icons, text reveal |
| `scripts/make-audio.mjs` | Synthesises the original music and sound effects, timed to the scenes |
| `public/fonts/` | Sora and Inter (SIL Open Font License), bundled so renders work offline |

The Resonance colours are in `src/theme.ts`:

| Colour | Hex | Used for |
|---|---|---|
| Signal Violet | `#7C5CFF` | Main accent: waves, rings, wipes, highlights, the agent's chat bubbles, the "Launching soon" pill (white text on it) |
| Deep Violet | `#5B3FD9` | Violet on light surfaces (the feature-card progress bars) |
| Violet Mist | `#EFEBFF` | Feature cards, and small labels on dark grey where Signal Violet would be too dim |
| Charcoal Black | `#1A1A1A` | Main background |
| White | `#FFFFFF` | The question scene's background, and most text |
| Dark Grey | `#333333` | The call card and missed-call cards; body text on the feature cards |
| Bright Orange | `#FF8A4C` | Only "AlchemyX Global" |

## Notes

- To swap in licensed music, replace `public/teaser-music.wav` with a 44-second track. Keep the
  impact at 16 s, where the reveal happens.
- If you retime a scene, update `src/timeline.json`. Also update the cue frames listed at the top
  of `scripts/make-audio.mjs`.
- Remotion is free for individuals and companies of up to three people; larger companies need a
  [company licence](https://www.remotion.pro/license).
