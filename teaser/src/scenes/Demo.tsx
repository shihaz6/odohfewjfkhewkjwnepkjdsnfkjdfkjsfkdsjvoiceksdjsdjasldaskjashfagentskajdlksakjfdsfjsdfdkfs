import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, fadeUp, progress, useLayout} from '../anim';
import {Background, CheckIcon, MaskReveal, Rings, Waveform} from '../components/visuals';
import {BODY, COLORS, DISPLAY} from '../theme';

type Who = 'caller' | 'agent';

// Local frames. The music script places a soft blip at each `start`.
export const TURNS: {who: Who; text: string; start: number; end: number}[] = [
  {who: 'caller', text: 'Hi, are you open right now?', start: 30, end: 70},
  {who: 'agent', text: "Yes, we're open twenty four hours. How can I help?", start: 75, end: 130},
  {who: 'caller', text: 'Can someone call me back about a quote?', start: 135, end: 175},
  {who: 'agent', text: 'Of course! May I have your name and business?', start: 180, end: 230},
];
export const SAVED_AT = 238;

const talk = (frame: number, who: Who) =>
  TURNS.filter((t) => t.who === who).reduce(
    (acc, t) => Math.max(acc, interpolate(frame, [t.start, t.start + 5, t.end - 5, t.end], [0, 1, 1, 0], clamp)),
    0,
  );

const Bubble: React.FC<{who: Who; text: string; start: number; end: number; fontSize: number}> = ({
  who,
  text,
  start,
  end,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 15, mass: 0.7}});
  const typed = Math.round(interpolate(frame, [start + 2, end - 6], [0, text.length], clamp));
  const agent = who === 'agent';
  return (
    <div
      style={{
        alignSelf: agent ? 'flex-end' : 'flex-start',
        maxWidth: '84%',
        opacity: s,
        transform: `translateY(${(1 - s) * 30}px) scale(${0.92 + 0.08 * s})`,
        transformOrigin: agent ? 'right bottom' : 'left bottom',
        display: 'flex',
        flexDirection: 'column',
        alignItems: agent ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: '0.16em',
          color: agent ? COLORS.mist : COLORS.muted,
          marginBottom: 8,
        }}
      >
        {agent ? 'RESONANCE' : 'CALLER'}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: agent ? 600 : 500,
          fontSize,
          lineHeight: 1.32,
          padding: '18px 26px',
          borderRadius: 28,
          borderBottomRightRadius: agent ? 8 : 28,
          borderBottomLeftRadius: agent ? 28 : 8,
          background: agent ? COLORS.violet : COLORS.black,
          color: COLORS.white,
        }}
      >
        {text.slice(0, typed)}
        {/* The rest is laid out but invisible, so the bubble doesn't grow while typing. */}
        <span style={{color: 'transparent'}}>{text.slice(typed)}</span>
      </div>
    </div>
  );
};

export const Demo: React.FC<{dur: number}> = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pick, portrait} = useLayout();

  const card = spring({frame: frame - 4, fps, config: {damping: 18}});
  const agentTalk = talk(frame, 'agent');
  const callerTalk = talk(frame, 'caller');
  const saved = spring({frame: frame - SAVED_AT, fps, config: {damping: 12}});
  const secs = Math.floor(frame / fps);
  const status = agentTalk > 0.5 ? 'Resonance is speaking' : callerTalk > 0.5 ? 'Caller is speaking' : 'Listening';

  const head = (
    <div style={portrait ? {textAlign: 'center'} : {}}>
      <div
        style={{
          ...fadeUp(frame, 4, 18, 20),
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: pick(26, 28),
          letterSpacing: '0.22em',
          color: COLORS.violet,
          marginBottom: 22,
        }}
      >
        MEET YOUR NEW FRONT DESK
      </div>
      {['It picks up.', 'It listens.', 'It helps.'].map((t, i) => (
        <MaskReveal key={t} start={10 + i * 8}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: pick(92, 80),
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: i === 2 ? COLORS.violet : COLORS.white,
            }}
          >
            {t}
          </div>
        </MaskReveal>
      ))}
      {!portrait && (
        <div
          style={{
            ...fadeUp(frame, 44, 22),
            marginTop: 36,
            maxWidth: 620,
            fontFamily: BODY,
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.4,
            color: COLORS.muted,
          }}
        >
          A natural voice that answers your callers, any hour of the day.
        </div>
      )}
    </div>
  );

  const cardBox: React.CSSProperties = portrait
    ? {position: 'absolute', left: 70, right: 70, top: 560, height: 1080}
    : {position: 'absolute', right: 120, width: 820, top: 110, bottom: 110};

  return (
    <AbsoluteFill>
      <Background glow={0.7} />
      <div
        style={
          portrait
            ? {position: 'absolute', left: 80, right: 80, top: 150}
            : {position: 'absolute', left: 150, width: 760, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}
        }
      >
        {head}
      </div>

      <div
        style={{
          ...cardBox,
          borderRadius: 44,
          background: COLORS.grey,
          border: `1px solid ${COLORS.line}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
          padding: pick(40, 44),
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          opacity: card,
          transform: `translateY(${(1 - card) * 90}px)`,
        }}
      >
        {/* Header */}
        <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <div style={{position: 'relative', width: 92, height: 92, flexShrink: 0}}>
            <Rings start={0} period={40} count={2} maxR={66} minR={46} stroke={2} opacity={0.3 + agentTalk * 0.7} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 999,
                background: COLORS.violet,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Waveform bars={5} width={46} height={40} amp={0.35 + agentTalk * 0.65} color={COLORS.white} gap={4} speed={1.4} />
            </div>
          </div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: COLORS.white}}>Resonance</div>
            <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 25, color: COLORS.muted, marginTop: 4}}>
              AI receptionist · Your Business
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: COLORS.violet,
                  opacity: 0.45 + 0.55 * Math.abs(Math.sin(frame / 9)),
                }}
              />
              <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 22, letterSpacing: '0.16em', color: COLORS.mist}}>
                LIVE
              </div>
            </div>
            <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 28, color: COLORS.white, fontVariantNumeric: 'tabular-nums'}}>
              00:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Voice activity */}
        <div
          style={{
            marginTop: 30,
            height: 130,
            borderRadius: 26,
            background: COLORS.black,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{position: 'absolute'}}>
            <Waveform bars={36} width={pick(640, 760)} height={86} amp={0.06 + callerTalk * 0.9} color={COLORS.white} gap={7} phase={2} opacity={0.25 + callerTalk * 0.75} />
          </div>
          <div style={{position: 'absolute'}}>
            <Waveform bars={36} width={pick(640, 760)} height={86} amp={agentTalk * 0.95} color={COLORS.violet} gap={7} speed={1.2} opacity={agentTalk} />
          </div>
        </div>
        <div style={{marginTop: 14, fontFamily: BODY, fontWeight: 500, fontSize: 22, color: COLORS.muted, textAlign: 'center'}}>
          {status}
        </div>

        {/* Transcript */}
        <div
          style={{
            flex: 1,
            marginTop: 18,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 22,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, transparent 40px, black 170px)',
            maskImage: 'linear-gradient(to bottom, transparent 0, transparent 40px, black 170px)',
          }}
        >
          {TURNS.filter((t) => frame >= t.start).map((t) => (
            <Bubble key={t.start} {...t} fontSize={pick(30, 34)} />
          ))}
          {frame >= SAVED_AT && (
            <div
              style={{
                alignSelf: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 30px 14px 22px',
                borderRadius: 999,
                background: COLORS.violet,
                boxShadow: '0 0 40px rgba(124,92,255,0.45)',
                opacity: Math.min(1, saved * 1.5),
                transform: `scale(${0.7 + 0.3 * saved})`,
              }}
            >
              <CheckIcon size={34} color={COLORS.white} draw={progress(frame, SAVED_AT + 4, 14)} />
              <div style={{fontFamily: DISPLAY, fontWeight: 600, fontSize: pick(28, 30), color: COLORS.white}}>
                Callback request saved
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
