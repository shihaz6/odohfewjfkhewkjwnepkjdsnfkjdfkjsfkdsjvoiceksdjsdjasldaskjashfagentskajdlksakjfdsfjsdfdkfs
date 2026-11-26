import React from 'react';
import type {CSSProperties} from 'react';

/** A 3D smartphone: layered edges give it thickness, with a glossy screen and a camera island. */
export const Phone: React.FC<{
  w: number;
  h: number;
  rx?: number;
  ry?: number;
  rz?: number;
  glow?: number;
  screen?: CSSProperties;
  style?: CSSProperties;
  children: React.ReactNode;
}> = ({w, h, rx = 0, ry = 0, rz = 0, glow = 0, screen, style, children}) => {
  const R = w * 0.16;
  const bezel = Math.round(w * 0.032);
  return (
    <div style={{perspective: 2400, ...style}}>
      <div style={{position: 'relative', width: w, height: h, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`}}>
        {Array.from({length: 9}, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: R,
              background: i === 8 ? '#0c0c0c' : 'linear-gradient(135deg, #6a6a6a 0%, #2d2d2d 35%, #555 65%, #232323 100%)',
              transform: `translateZ(${-(i + 1) * 2.4}px)`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R,
            background: '#0b0b0b',
            padding: bezel,
            boxSizing: 'border-box',
            boxShadow: `inset 0 0 0 2px #5c5c5c, inset 0 0 0 5px #111, 0 0 ${90 * glow}px ${20 * glow}px rgba(124,92,255,${0.55 * glow})`,
          }}
        >
          <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: R - bezel, overflow: 'hidden', ...screen}}>
            {children}
            <div
              style={{
                position: 'absolute',
                top: h * 0.018,
                left: '50%',
                width: w * 0.3,
                height: h * 0.038,
                transform: 'translateX(-50%)',
                borderRadius: 99,
                background: '#000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(${115 + ry * 0.8}deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 32%, transparent 46%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
