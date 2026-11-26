import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLG, Stop, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { Tap } from './ui';
import { Icon, IconName } from './Icon';
import { colors, fonts, radius } from '@/theme/tokens';
import { useReduceTransparency } from '@/lib/a11y';

const ACircle = Animated.createAnimatedComponent(Circle);

/**
 * Glass card – the shared surface of the redesign. Real backdrop blur (falls back to solid graphite with
 * Reduce Transparency), a 1px light edge, top highlight. `glow` adds the orange wave edge used only on hero cards.
 */
export function Glass({ children, style, onPress, label, glow, padded = true, intensity = 28 }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string; glow?: boolean; padded?: boolean; intensity?: number }) {
  const solid = useReduceTransparency();
  const body = (
    <View style={[g.card, padded && g.pad, solid && { backgroundColor: colors.surfaceRaised }, style]}>
      {!solid && <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />}
      {!solid && <LinearGradient colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.015)']} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      {glow && <GlowEdge />}
      {children}
    </View>
  );
  return onPress ? <Tap onPress={onPress} label={label}>{body}</Tap> : body;
}

/** Orange wave line along the top edge of a hero card (the "sunken wave" connecting hero and content). */
export function GlowEdge() {
  const [w, setW] = React.useState(0);
  const u = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: 28 }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={28}>
          <Defs>
            <SvgLG id={`ge${u}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0" />
              <Stop offset="0.5" stopColor={colors.accent} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.accent} stopOpacity="0.1" />
            </SvgLG>
          </Defs>
          <Path d={`M ${w * 0.04} 6 C ${w * 0.3} 0, ${w * 0.45} 10, ${w * 0.6} 4 S ${w * 0.9} 2, ${w * 0.98} 8`} stroke={`url(#ge${u})`} strokeWidth={5} strokeOpacity={0.25} fill="none" />
          <Path d={`M ${w * 0.04} 6 C ${w * 0.3} 0, ${w * 0.45} 10, ${w * 0.6} 4 S ${w * 0.9} 2, ${w * 0.98} 8`} stroke={`url(#ge${u})`} strokeWidth={1.6} fill="none" />
        </Svg>
      )}
    </View>
  );
}

/** Round glass icon button (≥ 48pt). */
export function GlassIcon({ icon, label, onPress, dot, size = 52 }: { icon: IconName; label: string; onPress: () => void; dot?: boolean; size?: number }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[g.icon, { width: size, height: size, borderRadius: size * 0.32 }]}>
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        <Icon name={icon} size={24} color={colors.text} strokeWidth={1.8} />
        {dot ? <View style={g.dot} /> : null}
      </View>
    </Tap>
  );
}

/** Animated progress ring with orange gradient stroke. Children are centred inside. */
export function ProgressRing({ value, size = 172, stroke = 12, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const u = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  const p = useSharedValue(reduce ? v : 0);
  useEffect(() => {
    p.set(reduce ? v : withTiming(v, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [v, reduce, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Defs>
          <SvgLG id={`pr${u}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accentLight} />
            <Stop offset="1" stopColor={colors.emberMid} />
          </SvgLG>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.09)" strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={`url(#pr${u})`} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

/** Thin progress bar with orange gradient fill (RTL: fills from the right). */
export function Bar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', flexDirection: 'row-reverse' }}>
      {color ? <View style={{ width: `${v * 100}%`, backgroundColor: color, borderRadius: height }} /> : (
        <LinearGradient colors={[colors.accentLight, colors.emberMid]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={{ width: `${v * 100}%`, borderRadius: height }} />
      )}
    </View>
  );
}

/** Primary orange button (deep-orange gradient behind white text: ≥ 4.5:1). */
export function OrangeButton({ title, icon, onPress, style, small }: { title: string; icon?: IconName; onPress: () => void; style?: StyleProp<ViewStyle>; small?: boolean }) {
  return (
    <Tap onPress={onPress} label={title} style={style}>
      <View style={[g.btn, small && { minHeight: 44, paddingHorizontal: 16 }]}>
        <LinearGradient colors={['#D9601A', colors.accentButton]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={g.btnShine} pointerEvents="none" />
        {icon ? <Icon name={icon} size={small ? 18 : 22} color="#fff" strokeWidth={2.2} /> : null}
        <Text style={[g.btnText, small && { fontSize: 15 }]}>{title}</Text>
      </View>
    </Tap>
  );
}

/** Section header used on dark screens. */
export function DarkHeader({ title, icon, right }: { title: string; icon?: IconName; right?: ReactNode }) {
  return (
    <View style={g.header}>
      {icon ? <Icon name={icon} size={22} color={colors.accent} /> : null}
      <Text style={g.headerText} accessibilityRole="header">{title}</Text>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

export const g = StyleSheet.create({
  card: { borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: Platform.OS === 'web' ? 'rgba(40,42,46,0.55)' : 'rgba(40,42,46,0.35)' },
  pad: { padding: 16 },
  icon: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(48,50,54,0.5)' },
  dot: { position: 'absolute', top: 7, right: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.bg },
  btn: { minHeight: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden', paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,190,150,0.35)' },
  btnShine: { position: 'absolute', top: 1, left: 18, right: 18, height: '45%', borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)' },
  btnText: { fontFamily: fonts.bold, fontSize: 18, color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  headerText: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
});

/** Custom switch (RN-web's Switch renders incorrectly in RTL). 50×30 track, 44pt hit area. */
export function DarkSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label} style={{ minWidth: 56, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 50, height: 30, borderRadius: 15, padding: 3, flexDirection: 'row', justifyContent: value ? 'flex-end' : 'flex-start', backgroundColor: value ? colors.accent : 'rgba(255,255,255,0.16)' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}
