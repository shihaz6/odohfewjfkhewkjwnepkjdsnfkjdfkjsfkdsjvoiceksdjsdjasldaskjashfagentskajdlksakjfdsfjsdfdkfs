import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {clamp, progress, useLayout} from '../../anim';
import {MissedIcon, PhoneIcon} from '../../components/visuals';
import {BODY, COLORS, DISPLAY} from '../../theme';
import {CUES, hitPulse, sceneStart, useSceneFrame} from '../core';
import {Phone} from '../Phone';
import {Backdrop, PersonIcon, Shockwave, Words} from '../visuals';

const STOP = CUES.ringStop - sceneStart('ring');
// The ringtone's notes (same rhythm as the music script), so the phone buzzes on every note.
const NOTES = [0, 60, 120].flatMap((b) => [0, 7.5, 15, 22.5, 37.5, 45, 52.5].map((o) => b + o)).filter((n) => n < STOP);
const DOWNBEATS = NOTES.filter((n) => n % 60 === 0 || n % 60 === 37.5);

/** 4-10 s: the phone rings to the Resonance ringtone, nobody picks up, the tape stops. */
export const Ring: React.FC<{dur: number}> = () => {
  const f = useSceneFrame();
  const {fps} = useVideoConfig();
  const {pick, portrait} = useLayout();

  const enter = spring({frame: f + 6, fps, config: {damping: 15, mass: 0.9}});
  const ringing = f < STOP ? 1 : 0;
  const vib = hitPulse(f, NOTES, 5) * ringing;
  const missed = progress(f, STOP, 12);
  const sink = progress(f, STOP, 30);

  const px = pick(440, 0);
  const py = pick(0, 190) + (1 - enter) * 900 + sink * 30;
  const ry = pick(-22, -10) + Math.sin(f / 38) * 6 + (1 - enter) * -30;
  const rx = 6 + Math.cos(f / 50) * 3 + (1 - enter) * 40 + sink * 14;
  const shake = Math.sin(f * 3.1) * 8 * vib;
  const rz = Math.sin(f * 2.3) * 2.4 * vib;

  const text = {fontFamily: DISPLAY, fontWeight: 800, fontSize: pick(124, 104), lineHeight: 1.04, letterSpacing: '-0.03em', color: COLORS.white};
  const textBox: React.CSSProperties = portrait
    ? {position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center'}
    : {position: 'absolute', left: 150, top: '50%', transform: 'translateY(-50%)', width: 900};

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.8 - missed * 0.4} />
      {DOWNBEATS.map((n) => (
        <Shockwave key={n} at={n} x={px} y={py} maxR={pick(520, 560)} width={5} life={34} />
      ))}
      <AbsoluteFill style={{filter: `saturate(${1 - 0.75 * missed}) brightness(${1 - 0.2 * missed})`}}>
        <Phone
          w={400}
          h={820}
          rx={rx}
          ry={ry}
          rz={rz}
          glow={0.25 + vib * 0.6}
          screen={{background: 'linear-gradient(180deg, #2B2347 0%, #1A1A1A 62%)'}}
          style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${px + shake}px, ${py}px) scale(${1 - 0.04 * sink})`}}
        >
          <IncomingCall f={f} vib={vib} missed={missed} />
        </Phone>
      </AbsoluteFill>
      <div style={textBox}>
        <Words text="Your phone rings." start={4} stagger={5} breakAfter={[1]} out={STOP - 8} style={text} />
      </div>
      <div style={textBox}>
        <Words
          text="No one answers."
          start={STOP + 6}
          stagger={6}
          breakAfter={[1]}
          style={text}
          accent={(i) => (i === 2 ? {color: COLORS.violet} : undefined)}
        />
      </div>
    </AbsoluteFill>
  );
};

const IncomingCall: React.FC<{f: number; vib: number; missed: number}> = ({f, vib, missed}) => {
  const ringPulse = (k: number) => ((f * 0.9 + k * 18) % 36) / 36;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 96, width: '100%', textAlign: 'center', fontFamily: BODY, fontWeight: 600, fontSize: 20, letterSpacing: '0.18em', color: COLORS.muted, opacity: 1 - missed}}>
        INCOMING CALL
      </div>
      <div style={{position: 'absolute', top: 170, left: '50%', width: 150, height: 150, opacity: 1 - missed, transform: `translateX(-50%) scale(${1 + vib * 0.06})`}}>
        {[0, 1].map((k) => (
          <div
            key={k}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              border: `3px solid ${COLORS.violet}`,
              transform: `scale(${1 + ringPulse(k) * 0.8})`,
              opacity: (1 - ringPulse(k)) * (1 - missed) * 0.8,
            }}
          />
        ))}
        <div style={{position: 'absolute', inset: 0, borderRadius: 999, background: `linear-gradient(145deg, #9D86FF, ${COLORS.deepViolet})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <PersonIcon size={86} color={COLORS.white} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', opacity: 1 - missed}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: COLORS.white}}>New customer</div>
        <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 22, color: COLORS.muted, marginTop: 8}}>Mobile</div>
      </div>
      <div style={{position: 'absolute', bottom: 92, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', opacity: 1 - missed}}>
        {[
          {label: 'Decline', bg: COLORS.grey, rot: 135},
          {label: 'Accept', bg: COLORS.violet, rot: 0},
        ].map((b, i) => (
          <div key={b.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 999,
                background: b.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${i === 1 ? 1 + vib * 0.12 : 1}) rotate(${b.rot}deg)`,
                boxShadow: i === 1 ? `0 0 ${30 + vib * 40}px rgba(124,92,255,0.7)` : undefined,
              }}
            >
              <PhoneIcon size={44} color={COLORS.white} />
            </div>
            <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 19, color: COLORS.muted}}>{b.label}</div>
          </div>
        ))}
      </div>
      <AbsoluteFill style={{background: `rgba(20,20,20,${0.72 * missed})`, justifyContent: 'center', alignItems: 'center'}}>
        <div style={{opacity: missed, transform: `translateY(${(1 - missed) * 30}px)`, textAlign: 'center'}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div style={{width: 120, height: 120, borderRadius: 999, background: 'rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <MissedIcon size={66} color={COLORS.mist} />
            </div>
          </div>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, color: COLORS.white, marginTop: 24}}>Missed call</div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 22, color: COLORS.muted, marginTop: 8}}>New customer</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: COLORS.white, opacity: interpolate(f, [STOP, STOP + 2, STOP + 8], [0, 0.35, 0], clamp)}} />
    </AbsoluteFill>
  );
};
