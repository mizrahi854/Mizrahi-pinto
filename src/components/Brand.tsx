import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, RadialGradient, LinearGradient, Stop, Rect, Line, Ellipse, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { colors, fonts } from '@/theme/tokens';

const APath = Animated.createAnimatedComponent(Path);

export const MAX_W = 440;
export function useScreenWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_W);
}

/** Geometric brand mark (wedge + two rising bars), drawn as an original vector. */
export function LogoMark({ size = 34, color = colors.text }: { size?: number; color?: string }) {
  const h = (size * 40) / 56;
  return (
    <Svg width={size} height={h} viewBox="0 0 56 40" accessibilityLabel="MIZRAHI PINTO">
      {/* single diagonal (y = 40 − 40x/56) cut into a ramp and two rising bars */}
      <Path fill={color} d="M0 40 L29 19.29 L29 40 Z" />
      <Path fill={color} d="M33.5 16.07 L42 10 L42 40 L33.5 40 Z" />
      <Path fill={color} d="M46.5 6.79 L56 0 L56 40 L46.5 40 Z" />
    </Svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <View style={styles.logoRow} accessible accessibilityRole="header" accessibilityLabel="MIZRAHI PINTO">
      <LogoMark size={compact ? 28 : 34} />
      {!compact && (
        <View>
          <Text style={styles.logoText}>MIZRAHI</Text>
          <Text style={styles.logoText}>PINTO</Text>
          <View style={styles.logoUnderline} />
        </View>
      )}
    </View>
  );
}

/** Dark warm backdrop with ember light entering from the top corner + blurred figure. */
export function HeroBackdrop({ height, figure = true }: { height: number; figure?: boolean }) {
  const w = useScreenWidth();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height, overflow: 'hidden' }]}>
      <Svg width={w} height={height}>
        <Defs>
          <RadialGradient id="corner" cx={w * 1.05} cy={-height * 0.05} r={w * 1.1} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.emberMid} stopOpacity="0.95" />
            <Stop offset="0.35" stopColor={colors.emberDeep} stopOpacity="0.55" />
            <Stop offset="0.75" stopColor="#3A1505" stopOpacity="0.2" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="center" cx={w / 2} cy={height * 0.82} r={w * 0.7} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.emberDeep} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="streak" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accentLight} stopOpacity="0" />
            <Stop offset="0.55" stopColor={colors.accent} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colors.emberDeep} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="fig" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={w} height={height} fill={colors.bg} />
        <Rect x="0" y="0" width={w} height={height} fill="url(#corner)" />
        <Rect x="0" y="0" width={w} height={height} fill="url(#center)" />
        {/* light streaks sweeping from the top corner */}
        <Path d={`M ${w * 0.55} ${-10} C ${w * 0.85} ${height * 0.2}, ${w * 0.95} ${height * 0.45}, ${w * 0.78} ${height * 0.75}`} stroke="url(#streak)" strokeWidth={26} fill="none" opacity={0.35} />
        <Path d={`M ${w * 0.7} ${-10} C ${w * 0.98} ${height * 0.18}, ${w * 1.05} ${height * 0.4}, ${w * 0.92} ${height * 0.62}`} stroke="url(#streak)" strokeWidth={6} fill="none" opacity={0.6} />
        <Path d={`M ${w * 0.62} ${-10} C ${w * 0.9} ${height * 0.22}, ${w * 1.0} ${height * 0.5}, ${w * 0.84} ${height * 0.7}`} stroke={colors.accentLight} strokeWidth={1.2} fill="none" opacity={0.35} />
        {figure && (
          <G opacity={0.5}>
            {/* soft, out-of-focus silhouette built from layered translucent shapes */}
            {[0, 1, 2].map((i) => (
              <G key={i} opacity={0.35 - i * 0.08}>
                <Ellipse cx={w * 0.5} cy={height * 0.17} rx={22 + i * 6} ry={26 + i * 6} fill="url(#fig)" />
                <Path
                  d={`M ${w * 0.5 - 40 - i * 6} ${height * 0.62} C ${w * 0.5 - 48 - i * 6} ${height * 0.42}, ${w * 0.5 - 30} ${height * 0.27}, ${w * 0.5} ${height * 0.26} C ${w * 0.5 + 30} ${height * 0.27}, ${w * 0.5 + 48 + i * 6} ${height * 0.42}, ${w * 0.5 + 40 + i * 6} ${height * 0.62} Z`}
                  fill="url(#fig)"
                />
              </G>
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
}

/** Thin vertical measurement rulers on both screen edges. */
export function SideRulers({ top, height }: { top: number; height: number }) {
  const w = useScreenWidth();
  const count = Math.floor(height / 7);
  const ticks = Array.from({ length: count }, (_, i) => i);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, left: 0, width: w, height }}>
      <Svg width={w} height={height}>
        {ticks.map((i) => {
          const major = i % 5 === 0;
          const len = major ? 11 : 6;
          const y = i * 7 + 2;
          const op = 0.12 + 0.28 * Math.sin((i / count) * Math.PI);
          return (
            <G key={i}>
              <Line x1={8} y1={y} x2={8 + len} y2={y} stroke="#fff" strokeOpacity={op} strokeWidth={1} />
              <Line x1={w - 8} y1={y} x2={w - 8 - len} y2={y} stroke="#fff" strokeOpacity={op} strokeWidth={1} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

/**
 * Sunken U-wave that crowns the content panel. A tick arc follows the curve;
 * `progress` (0..1) lights ticks from the outside in, like a gauge.
 */
export function WaveHeader({ progress = 0, height = 96 }: { progress?: number; height?: number }) {
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0.75);
  useEffect(() => {
    if (reduce) return;
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, pulse]);
  const glowProps = useAnimatedProps(() => ({ strokeOpacity: 0.22 * pulse.value }));
  const coreProps = useAnimatedProps(() => ({ strokeOpacity: 0.55 + 0.45 * pulse.value }));

  const edgeY = 34; // shoulders
  const dipY = height - 8; // bottom of U
  const r = 30;
  // panel outline: rounded shoulders → smooth U dip → shoulders
  const curve = `M 0 ${edgeY + r} Q 0 ${edgeY} ${r} ${edgeY} C ${w * 0.3} ${edgeY}, ${w * 0.33} ${dipY}, ${w / 2} ${dipY} C ${w * 0.67} ${dipY}, ${w * 0.7} ${edgeY}, ${w - r} ${edgeY} Q ${w} ${edgeY} ${w} ${edgeY + r}`;
  const fill = `${curve} L ${w} ${height + 2} L 0 ${height + 2} Z`;

  // tick arc sampled along the wave curve, offset upwards
  const N = 120;
  const pts: { x: number; y: number; nx: number; ny: number }[] = [];
  const bez = (t: number, p0: number, p1: number, p2: number, p3: number) =>
    (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    let x: number, y: number;
    if (s <= 0.5) {
      const t = s * 2;
      x = bez(t, r, w * 0.3, w * 0.33, w / 2);
      y = bez(t, edgeY, edgeY, dipY, dipY);
    } else {
      const t = (s - 0.5) * 2;
      x = bez(t, w / 2, w * 0.67, w * 0.7, w - r);
      y = bez(t, dipY, dipY, edgeY, edgeY);
    }
    pts.push({ x, y, nx: 0, ny: -1 });
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    pts[i]!.nx = dy / l;
    pts[i]!.ny = -dx / l;
  }
  const lit = Math.max(0, Math.min(1, progress));

  return (
    <View pointerEvents="none" style={{ width: w, height, marginTop: -height + 26 }}>
      <Svg width={w} height={height + 2}>
        <Defs>
          <LinearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0" />
            <Stop offset="0.2" stopColor={colors.accent} stopOpacity="0.9" />
            <Stop offset="0.5" stopColor={colors.accentLight} stopOpacity="1" />
            <Stop offset="0.8" stopColor={colors.accent} stopOpacity="0.9" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#24140B" stopOpacity="1" />
            <Stop offset="1" stopColor={colors.surface} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {pts.map((p, i) => {
          if (i % 1 !== 0) return null;
          const major = i % 10 === 0;
          const len = major ? 11 : i % 5 === 0 ? 8 : 5;
          const off = 12;
          const x1 = p.x + p.nx * off, y1 = p.y + p.ny * off;
          const x2 = p.x + p.nx * (off + len), y2 = p.y + p.ny * (off + len);
          const fromEdge = Math.min(i, N - i) / (N / 2); // 0 at shoulders → 1 at center
          const on = fromEdge <= lit && lit > 0;
          return (
            <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? colors.accentLight : '#fff'} strokeOpacity={on ? 0.9 : 0.16 + 0.12 * fromEdge} strokeWidth={major ? 1.2 : 0.9} />
          );
        })}
        <Path d={fill} fill="url(#panel)" />
        <APath d={curve} stroke={colors.accent} strokeWidth={14} fill="none" animatedProps={glowProps} strokeLinecap="round" />
        <APath d={curve} stroke={colors.accent} strokeWidth={6} fill="none" strokeOpacity={0.3} strokeLinecap="round" />
        <APath d={curve} stroke="url(#edge)" strokeWidth={1.6} fill="none" animatedProps={coreProps} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }, // row-reverse inside RTL = physical left→right
  logoText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13.5, letterSpacing: 1.6, lineHeight: 15 },
  logoUnderline: { width: 22, height: 2, backgroundColor: colors.accent, marginTop: 4, borderRadius: 2 },
});
