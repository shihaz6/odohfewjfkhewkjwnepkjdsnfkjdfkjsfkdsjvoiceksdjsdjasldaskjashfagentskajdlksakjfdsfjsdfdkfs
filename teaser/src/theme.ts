import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Resonance brand palette.
export const COLORS = {
  violet: '#7C5CFF', // Signal Violet: primary accent (waves, highlights, buttons)
  deepViolet: '#5B3FD9', // Deep Violet: violet text on white
  mist: '#EFEBFF', // Violet Mist: light cards and highlighted boxes
  black: '#1A1A1A', // Charcoal Black: primary dark background
  white: '#FFFFFF', // primary light background
  grey: '#333333', // Dark Grey: secondary surfaces and text
  orange: '#FF8A4C', // Bright Orange: ONLY for the AlchemyX name ("by AlchemyX")
  muted: 'rgba(255,255,255,0.74)', // secondary text on dark
  line: 'rgba(255,255,255,0.10)',
} as const;

// Sora and Inter (SIL Open Font License), bundled as variable fonts in public/fonts so
// renders never depend on the network. Remotion waits for these before capturing frames.
loadFont({family: 'Sora', url: staticFile('fonts/Sora-latin.woff2'), weight: '600 800', format: 'woff2'});
loadFont({family: 'Inter', url: staticFile('fonts/Inter-latin.woff2'), weight: '400 700', format: 'woff2'});

export const DISPLAY = "'Sora', sans-serif";
export const BODY = "'Inter', sans-serif";
