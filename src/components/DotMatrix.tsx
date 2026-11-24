import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/tokens';

/** 5x7 dot glyphs. '#' = lit dot. Original glyph set built for the brand. */
const GLYPHS: Record<string, string[]> = {
  '0': [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '# #  ', '  #  ', '  #  ', '  #  ', '#####'],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#### ', '    #', '    #', ' ### ', '    #', '    #', '#### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': [' ### ', '#    ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '    #', ' ### '],
  ',': ['  ', '  ', '  ', '  ', '  ', ' #', ' #', '# '],
  '.': [' ', ' ', ' ', ' ', ' ', ' ', '#'],
  ':': [' ', ' ', '#', ' ', '#', ' ', ' '],
  '/': ['    #', '    #', '   # ', '  #  ', ' #   ', '#    ', '#    '],
  '-': ['   ', '   ', '   ', '###', '   ', '   ', '   '],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  ', '     '],
  '%': ['##  #', '##  #', '   # ', '  #  ', ' #   ', '#  ##', '#  ##'],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  ' ': ['  ', '  ', '  ', '  ', '  ', '  ', '  '],
};

type Props = {
  text: string;
  dot?: number; // dot diameter in px
  gap?: number; // spacing between dot centers minus diameter
  color?: string;
  dimColor?: string; // faint unlit dots (FORM-style grid), undefined = hidden
  accessibilityLabel?: string;
};

export function DotMatrix({ text, dot = 8, gap = 3.2, color = colors.text, dimColor, accessibilityLabel }: Props) {
  const pitch = dot + gap;
  const layout = useMemo(() => {
    const cells: { x: number; y: number; on: boolean }[] = [];
    let cursor = 0;
    for (const ch of text) {
      const g = GLYPHS[ch] ?? GLYPHS[' ']!;
      const w = g[0]!.length;
      g.forEach((row, r) => {
        for (let c = 0; c < w; c++) {
          cells.push({ x: cursor + c * pitch + dot / 2, y: r * pitch + dot / 2, on: row[c] === '#' });
        }
      });
      cursor += w * pitch + pitch * 0.9;
    }
    const rows = Math.max(7, ...[...text].map((ch) => (GLYPHS[ch] ?? GLYPHS[' ']!).length));
    return { cells, width: Math.max(0, cursor - pitch * 0.9), height: rows * pitch - gap };
  }, [text, pitch, dot, gap]);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? text}
      style={{ width: layout.width, height: layout.height }}
    >
      <Svg width={layout.width} height={layout.height}>
        {layout.cells.map((c, i) =>
          c.on ? (
            <Circle key={i} cx={c.x} cy={c.y} r={dot / 2} fill={color} />
          ) : dimColor ? (
            <Circle key={i} cx={c.x} cy={c.y} r={dot / 2.6} fill={dimColor} />
          ) : null,
        )}
      </Svg>
    </View>
  );
}

export const formatNumber = (n: number) => Math.round(n).toLocaleString('en-US');

/** Animated count between values (respects Reduce Motion). */
export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const reduce = useReducedMotionPref();
  useEffect(() => {
    if (reduce) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    if (from === target) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration, reduce]);
  return value;
}

export function useReducedMotionPref() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/** Dot number that animates when value changes. */
export function DotNumber({ value, dot, gap, suffix = '', label }: { value: number; dot?: number; gap?: number; suffix?: string; label?: string }) {
  const v = useCountUp(value);
  const text = formatNumber(v) + suffix;
  return <DotMatrix text={text} dot={dot} gap={gap} accessibilityLabel={label ?? `${formatNumber(value)}${suffix}`} />;
}
