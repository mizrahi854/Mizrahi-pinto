import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Defs, LinearGradient, Stop, Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '@/theme/tokens';
import { useReducedMotionPref } from './DotMatrix';

function useGrow(dep: unknown) {
  const reduce = useReducedMotionPref();
  const [p, setP] = useState(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return setP(1);
    setP(0);
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / 700);
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dep), reduce]);
  return p;
}

const niceMax = (v: number) => {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
};

type Datum = { label: string; value: number | null };

/** Glowing orange bars. `null` = day not logged → dashed placeholder, never zero. */
export function BarChart({ data, height = 190, unit = '', target }: { data: Datum[]; height?: number; unit?: string; target?: number }) {
  const u = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [w, setW] = useState(300);
  const p = useGrow(data);
  const max = niceMax(Math.max(target ?? 0, ...data.map((d) => d.value ?? 0)) * 1.05);
  const left = 40, bottom = 24, top = 8;
  const ch = height - bottom - top;
  const slot = (w - left) / data.length;
  const bw = Math.min(34, slot * 0.58);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const label = data.map((d) => `${d.label}: ${d.value == null ? 'לא תועד' : `${Math.round(d.value)} ${unit}`}`).join(', ');
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={`גרף עמודות. ${label}`}>
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id={`bar${u}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accentLight} />
            <Stop offset="0.5" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.emberDeep} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        {ticks.map((t) => {
          const y = top + ch - (t / max) * ch;
          return (
            <React.Fragment key={t}>
              <Line x1={left} x2={w} y1={y} y2={y} stroke="#fff" strokeOpacity={0.08} strokeDasharray="2 4" />
              <SvgText x={left - 6} y={y + 4} fontSize={10} fill={colors.text2} textAnchor="end" fontFamily={fonts.regular}>{Math.round(t).toLocaleString()}</SvgText>
            </React.Fragment>
          );
        })}
        {target ? <Line x1={left} x2={w} y1={top + ch - (target / max) * ch} y2={top + ch - (target / max) * ch} stroke={colors.accentLight} strokeOpacity={0.6} strokeDasharray="5 4" /> : null}
        {data.map((d, i) => {
          const x = left + i * slot + (slot - bw) / 2;
          const hgt = d.value == null ? 0 : ((d.value / max) * ch) * p;
          return (
            <React.Fragment key={i}>
              {d.value == null ? (
                <Rect x={x} y={top + ch - 18} width={bw} height={18} rx={6} fill="none" stroke="#fff" strokeOpacity={0.2} strokeDasharray="3 3" />
              ) : (
                <>
                  <Rect x={x - 3} y={top + ch - hgt - 3} width={bw + 6} height={hgt + 3} rx={9} fill={colors.accent} opacity={0.18} />
                  <Rect x={x} y={top + ch - hgt} width={bw} height={Math.max(hgt, 1)} rx={7} fill={`url(#bar${u})`} />
                  <Rect x={x + 3} y={top + ch - hgt + 2} width={bw - 6} height={Math.min(6, hgt)} rx={3} fill="#fff" opacity={0.25} />
                </>
              )}
              <SvgText x={x + bw / 2} y={height - 6} fontSize={11} fill={colors.text2} textAnchor="middle" fontFamily={fonts.regular}>{d.label}</SvgText>
            </React.Fragment>
          );
        })}
        <Line x1={left} x2={w} y1={top + ch} y2={top + ch} stroke="#fff" strokeOpacity={0.15} />
      </Svg>
    </View>
  );
}

/** Smooth trend line with glow and highlighted last point. */
export function LineChart({ data, height = 170, unit = '', decimals = 1 }: { data: Datum[]; height?: number; unit?: string; decimals?: number }) {
  const u = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [w, setW] = useState(300);
  const p = useGrow(data);
  const vals = data.map((d) => d.value).filter((v): v is number => v != null);
  if (vals.length === 0) return <View style={{ height, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.text3, fontFamily: fonts.regular }}>אין עדיין נתונים</Text></View>;
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const pad = Math.max(0.5, (maxV - minV) * 0.25);
  const lo = minV - pad, hi = maxV + pad;
  const left = 40, bottom = 24, top = 10;
  const ch = height - bottom - top;
  const slot = (w - left - 16) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => (d.value == null ? null : { x: left + 8 + i * slot, y: top + ch - ((d.value - lo) / (hi - lo)) * ch * p - (1 - p) * 0 }));
  const valid = pts.filter((x): x is { x: number; y: number } => !!x);
  let path = '';
  valid.forEach((pt, i) => {
    if (i === 0) path = `M ${pt.x} ${pt.y}`;
    else {
      const prev = valid[i - 1]!;
      const cx = (prev.x + pt.x) / 2;
      path += ` C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }
  });
  const area = valid.length ? `${path} L ${valid[valid.length - 1]!.x} ${top + ch} L ${valid[0]!.x} ${top + ch} Z` : '';
  const ticks = [0, 0.33, 0.66, 1].map((f) => lo + f * (hi - lo));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={`גרף מגמה. ${data.map((d) => `${d.label}: ${d.value ?? 'אין'} ${unit}`).join(', ')}`}>
      <Svg width={w} height={height}>
        <Defs>
          <LinearGradient id={`area${u}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.35" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {ticks.map((t) => {
          const y = top + ch - ((t - lo) / (hi - lo)) * ch;
          return (
            <React.Fragment key={t}>
              <Line x1={left} x2={w} y1={y} y2={y} stroke="#fff" strokeOpacity={0.08} strokeDasharray="2 4" />
              <SvgText x={left - 6} y={y + 4} fontSize={10} fill={colors.text2} textAnchor="end">{t.toFixed(decimals)}</SvgText>
            </React.Fragment>
          );
        })}
        <Path d={area} fill={`url(#area${u})`} />
        <Path d={path} stroke={colors.accent} strokeWidth={7} strokeOpacity={0.2} fill="none" />
        <Path d={path} stroke={colors.accentLight} strokeWidth={2.2} fill="none" />
        {pts.map((pt, i) => pt && (
          <Circle key={i} cx={pt.x} cy={pt.y} r={i === pts.length - 1 ? 7 : 4} fill={i === pts.length - 1 ? '#fff' : colors.accentLight} stroke={colors.accent} strokeWidth={i === pts.length - 1 ? 3 : 1.5} />
        ))}
        {data.map((d, i) => <SvgText key={i} x={left + 8 + i * slot} y={height - 6} fontSize={11} fill={colors.text2} textAnchor="middle">{d.label}</SvgText>)}
      </Svg>
    </View>
  );
}

export const chartStyles = StyleSheet.create({});
