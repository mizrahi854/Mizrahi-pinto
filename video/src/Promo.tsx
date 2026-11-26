import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';

/**
 * MIZRAHI PINTO PREMIUM – 33 s, 1080×1920, 30 fps. Built only from real app screenshots and brand assets.
 * No music, no stock footage. Features that are not connected (AI recognition, purchase) are never claimed.
 */
const ORANGE = '#F57925';
const INK = '#131416';
const SILVER = '#B9BABD';
const WHITE = '#F5F5F5';

const fontFace = `
@font-face { font-family: 'Heebo'; font-weight: 700; src: url('${staticFile('Heebo_700Bold.ttf')}') format('truetype'); }
@font-face { font-family: 'Heebo'; font-weight: 400; src: url('${staticFile('Heebo_400Regular.ttf')}') format('truetype'); }
`;

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const fade = (f: number, a: number, b: number, c: number, d: number) => interpolate(f, [a, b, c, d], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });

function Backdrop({ glow = 1 }: { glow?: number }) {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 60) * 30;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at ${30 + drift / 10}% 25%, rgba(245,121,37,${0.32 * glow}), rgba(19,20,22,0) 60%), radial-gradient(900px 700px at 90% 85%, rgba(90,110,140,0.22), rgba(19,20,22,0) 60%), ${INK}` }}>
      <Img src={staticFile('figure-blur.png')} style={{ position: 'absolute', left: -120 + drift, top: 60, width: 900, opacity: 0.55 * glow, filter: 'blur(6px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)' }} />
    </AbsoluteFill>
  );
}

function Logo({ size = 200, color = WHITE }: { size?: number; color?: string }) {
  const h = (size * 40) / 56;
  return (
    <svg width={size} height={h} viewBox="0 0 56 40">
      <path fill={color} d="M0 40 L29 19.29 L29 40 Z" />
      <path fill={color} d="M33.5 16.07 L42 10 L42 40 L33.5 40 Z" />
      <path fill={color} d="M46.5 6.79 L56 0 L56 40 L46.5 40 Z" />
    </svg>
  );
}

/** Phone with a real screenshot; gentle 3D camera move + zoom. */
function Phone({ src, from = 0, dur = 150, x = 0, y = 0, scale = 1, tilt = 6, zoomTo = 1.06, glow = true }: { src: string; from?: number; dur?: number; x?: number; y?: number; scale?: number; tilt?: number; zoomTo?: number; glow?: boolean }) {
  const f = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 18, mass: 0.9 } });
  const p = interpolate(f, [0, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const z = interpolate(p, [0, 1], [1, zoomTo]);
  const ry = interpolate(p, [0, 1], [tilt, -tilt]);
  const W = 640 * scale;
  const H = W * 2.164;
  return (
    <div style={{ position: 'absolute', left: 540 - W / 2 + x, top: 960 - H / 2 + y + (1 - enter) * 260, width: W, height: H, opacity: enter, transform: `perspective(2200px) rotateY(${ry}deg) scale(${z})`, borderRadius: 86 * scale, padding: 14 * scale, background: 'linear-gradient(160deg,#3a3c41,#16171a)', boxShadow: `0 60px 140px rgba(0,0,0,0.65)${glow ? ', 0 0 120px rgba(245,121,37,0.22)' : ''}` }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 74 * scale, overflow: 'hidden', background: INK }}>
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
    </div>
  );
}

/** Glass caption that slides in word by word. */
function Caption({ title, sub, from = 0, top = 210 }: { title: string; sub?: string; from?: number; top?: number }) {
  const f = useCurrentFrame() - from;
  const words = title.split(' ');
  return (
    <div style={{ position: 'absolute', top, left: 70, right: 70, direction: 'rtl', textAlign: 'center', fontFamily: 'Heebo' }}>
      <div style={{ fontSize: 84, fontWeight: 700, color: WHITE, lineHeight: 1.12 }}>
        {words.map((w, i) => {
          const o = interpolate(f, [i * 4, i * 4 + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
          return <span key={i} style={{ display: 'inline-block', opacity: o, transform: `translateY(${(1 - o) * 34}px)`, marginLeft: 22 }}>{w}</span>;
        })}
      </div>
      {sub ? <div style={{ marginTop: 18, fontSize: 40, color: SILVER, opacity: interpolate(f, [14, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{sub}</div> : null}
    </div>
  );
}

function Pill({ text, from, x, y }: { text: string; from: number; x: number; y: number }) {
  const f = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${s})`, opacity: s, padding: '22px 34px', borderRadius: 999, background: 'rgba(48,50,54,0.55)', border: '2px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(18px)', color: WHITE, fontFamily: 'Heebo', fontWeight: 700, fontSize: 38, direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
      <span style={{ color: ORANGE, marginLeft: 12 }}>●</span>{text}
    </div>
  );
}

/** Dot-matrix counter (FORM style) drawn with dots. */
function DotCounter({ value, from, x, y }: { value: number; from: number; x: number; y: number }) {
  const f = useCurrentFrame() - from;
  const v = Math.round(interpolate(f, [0, 40], [0, value], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }));
  const G: Record<string, string[]> = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  };
  const digits = String(v).split('');
  return (
    <div style={{ position: 'absolute', left: x, top: y, display: 'flex', gap: 26, opacity: interpolate(f, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      {digits.map((d, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 18px)', gap: 7 }}>
          {(G[d] ?? G['0']!).join('').split('').map((c, k) => <div key={k} style={{ width: 18, height: 18, borderRadius: 9, background: c === '1' ? WHITE : 'rgba(255,255,255,0.06)', boxShadow: c === '1' ? '0 0 10px rgba(245,121,37,0.6)' : 'none' }} />)}
        </div>
      ))}
    </div>
  );
}

function Scene({ from, dur, children }: { from: number; dur: number; children: React.ReactNode }) {
  const f = useCurrentFrame();
  return (
    <Sequence from={from} durationInFrames={dur}>
      <AbsoluteFill style={{ opacity: fade(f, from, from + 10, from + dur - 10, from + dur) }}>{children}</AbsoluteFill>
    </Sequence>
  );
}

export const Promo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: INK }}>
      <style>{fontFace}</style>

      {/* 0–4 s: logo on orange & black with the blurred figure */}
      <Scene from={0} dur={124}>
        <AbsoluteFill style={{ background: `radial-gradient(1100px 1100px at 30% 30%, ${ORANGE}, #B84A0C 40%, ${INK} 78%)` }} />
        <Img src={staticFile('figure-blur.png')} style={{ position: 'absolute', left: -80, top: 160, width: 1000, opacity: 0.6, transform: `scale(${interpolate(f, [0, 124], [1.08, 1])})`, WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)', maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)' }} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 40, transform: `scale(${spring({ frame: f - 8, fps, config: { damping: 16 } })})` }}>
          <Logo size={300} />
          <div style={{ fontFamily: 'Heebo', fontWeight: 700, fontSize: 92, letterSpacing: 12, color: WHITE, textAlign: 'center', lineHeight: 1.05 }}>MIZRAHI<br />PINTO</div>
          <div style={{ fontFamily: 'Heebo', fontSize: 44, color: 'rgba(245,245,245,0.85)', direction: 'rtl', opacity: interpolate(f, [40, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>כושר · תזונה · שגרה</div>
        </AbsoluteFill>
      </Scene>

      {/* 4–8 s: home with the dot-matrix metric and the wave */}
      <Scene from={120} dur={124}>
        <Backdrop />
        <Caption title="כל היום שלך במבט אחד" sub="מד יומי, האימון הבא והארוחות שלך" from={0} top={150} />
        <Phone src="home.png" from={8} dur={116} y={250} scale={0.82} />
        <DotCounter value={625} from={30} x={337} y={420} />
      </Scene>

      {/* 8–13 s: photograph a meal → add sheet → diary */}
      <Scene from={240} dur={154}>
        <Backdrop glow={0.8} />
        <Caption title="תיעוד ארוחה בשניות" sub="צילום לארוחה, ברקוד, חיפוש או תיאור במילים" from={0} />
        <Sequence from={0} durationInFrames={56}><Phone src="mealphoto.png" from={8} dur={50} y={170} scale={0.9} /></Sequence>
        <Sequence from={50} durationInFrames={56}><Phone src="add.png" from={0} dur={50} y={170} scale={0.9} tilt={-4} /></Sequence>
        <Sequence from={100} durationInFrames={60}><Phone src="diary.png" from={0} dur={54} y={170} scale={0.9} /></Sequence>
        <Pill text="הוסף קלוריות מהיר" from={60} x={90} y={1640} />
      </Scene>

      {/* 13–18 s: next workout with the 3D anatomy + weekly plan */}
      <Scene from={390} dur={154}>
        <Backdrop glow={1.1} />
        <Caption title="האימון הבא, השבוע שלך" sub="קבוצות שרירים, יום ושעה, סימון השלמה" from={0} />
        <Phone src="plan.png" from={8} dur={146} y={170} scale={0.92} zoomTo={1.1} />
        <Pill text="חזה ויד קדמית · 05:00" from={50} x={470} y={1660} />
      </Scene>

      {/* 18–23 s: restaurant mode + Friday & Shabbat */}
      <Scene from={540} dur={154}>
        <Backdrop glow={0.9} />
        <Caption title="מסעדה ושישי־שבת" sub="תכנון מראש – בלי פיצוי ובלי ענישה" from={0} />
        <Phone src="restaurant.png" from={8} dur={146} x={-200} y={210} scale={0.66} tilt={10} />
        <Phone src="shabbat.png" from={26} dur={128} x={200} y={260} scale={0.66} tilt={-10} />
      </Scene>

      {/* 23–28 s: charts, consistency, challenge */}
      <Scene from={690} dur={154}>
        <Backdrop glow={0.9} />
        <Caption title="התקדמות והתמדה" sub="גרפים, רצפים ו״ימים לניצחון על אליאן״" from={0} />
        <Phone src="reports.png" from={8} dur={146} x={-200} y={210} scale={0.66} tilt={8} />
        <Phone src="victory.png" from={26} dur={128} x={200} y={260} scale={0.66} tilt={-8} />
      </Scene>

      {/* 28–33 s: logo, brand, MIZRAHI PINTO PREMIUM */}
      <Scene from={840} dur={150}>
        <AbsoluteFill style={{ background: `radial-gradient(1000px 900px at 50% 40%, rgba(245,121,37,0.45), ${INK} 70%)` }} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 36 }}>
          <div style={{ transform: `scale(${spring({ frame: f - 850, fps, config: { damping: 15 } })})` }}><Logo size={240} /></div>
          <div style={{ fontFamily: 'Heebo', fontWeight: 700, fontSize: 84, letterSpacing: 10, color: WHITE, textAlign: 'center', lineHeight: 1.05 }}>MIZRAHI PINTO</div>
          <div style={{ fontFamily: 'Heebo', fontWeight: 700, fontSize: 64, letterSpacing: 18, color: ORANGE, opacity: interpolate(f, [880, 905], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>PREMIUM</div>
          <div style={{ marginTop: 30, padding: '22px 52px', borderRadius: 999, border: '2px solid rgba(255,255,255,0.25)', background: 'rgba(48,50,54,0.5)', fontFamily: 'Heebo', fontSize: 40, color: WHITE, direction: 'rtl', opacity: interpolate(f, [905, 930], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>בקרוב · כל כלי הבסיס נשארים בחינם</div>
        </AbsoluteFill>
      </Scene>
    </AbsoluteFill>
  );
};
