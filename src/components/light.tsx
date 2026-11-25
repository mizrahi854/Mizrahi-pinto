import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tap } from './ui';
import { Icon, IconName } from './Icon';
import { MAX_W } from './Brand';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Light surface kit for the approved white screens (workout detail, nutrition, add food). */
export function LightScreen({
  title, children, back = true, right, footer, tabBar = false, scroll = true,
}: { title: string; children: ReactNode; back?: boolean; right?: ReactNode; footer?: ReactNode; tabBar?: boolean; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + (footer ? 110 : 0) + (tabBar ? 110 : 30);
  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <View style={s.inner}>
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View style={s.side}>{back ? <LIconButton icon="chevronBack" label="חזרה" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} /> : null}</View>
          <Text style={s.title} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          <View style={[s.side, { alignItems: 'flex-end' }]}>{right}</View>
        </View>
        {scroll ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: bottomPad, paddingTop: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: space.md }}>{children}</View>
        )}
        {footer && <View style={[s.footer, { paddingBottom: insets.bottom + 14, bottom: tabBar ? 96 : 0 }]}>{footer}</View>}
      </View>
    </View>
  );
}

export function LIconButton({ icon, label, onPress, active }: { icon: IconName; label: string; onPress?: () => void; active?: boolean }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[s.iconBtn, active && { backgroundColor: light.accentSoft }]}><Icon name={icon} size={24} color={active ? light.accent : light.text} strokeWidth={1.9} /></View>
    </Tap>
  );
}

export function LCard({ children, style, onPress, label }: { children: ReactNode; style?: any; onPress?: () => void; label?: string }) {
  const body = <View style={[s.card, style]}>{children}</View>;
  return onPress ? <Tap onPress={onPress} label={label}>{body}</Tap> : body;
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => { haptic.select(); onChange(o.key); }} style={{ flex: 1 }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={o.label}>
            <View style={[s.segItem, on && s.segOn]}>
              {on && <LinearGradient colors={['#F7883B', light.accent, light.accentDeep]} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />}
              <Text style={[s.segText, on && { color: '#fff', fontFamily: fonts.semibold }]}>{o.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function LPrimary({ title, icon, onPress }: { title: string; icon?: IconName; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={title}>
      <View style={s.primary}>
        <LinearGradient colors={['#F7883B', light.accent, light.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {icon && <Icon name={icon} size={22} color="#fff" strokeWidth={2.2} />}
        <Text style={s.primaryText}>{title}</Text>
      </View>
    </Tap>
  );
}

/** 3/4 arc gauge with rounded orange progress (nutrition mockup). */
export function ArcGauge({ value, size = 250, stroke = 14, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const v = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const start = 135, sweep = 270;
  const pt = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)] as const;
  const arc = (from: number, to: number) => {
    const [x1, y1] = pt(from); const [x2, y2] = pt(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const end = start + sweep * Math.max(v, 0.001);
  const [kx, ky] = pt(end);
  return (
    <View style={{ width: size, height: size * 0.86, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <Svg width={size} height={size} style={{ position: 'absolute', top: 0, transform: [{ scaleX: -1 }] }}>
        <Path d={arc(start, start + sweep)} stroke={light.track} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        <Path d={arc(start, end)} stroke={light.accent} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {v > 0.01 && <Circle cx={kx} cy={ky} r={stroke / 2 + 3} fill="#fff" stroke={light.accent} strokeWidth={3} />}
      </Svg>
      <View style={{ alignItems: 'center', marginTop: -size * 0.06 }}>{children}</View>
    </View>
  );
}

export function LBar({ value, color }: { value: number; color: string }) {
  const v = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: light.track, overflow: 'hidden', flexDirection: 'row-reverse' }}>
      <View style={{ width: `${v * 100}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export const ls = StyleSheet.create({
  h2: { fontFamily: fonts.bold, fontSize: 21, color: light.text },
  body: { fontFamily: fonts.regular, fontSize: 15, color: light.text },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, color: light.text },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: light.text2 },
  caption: { fontFamily: fonts.regular, fontSize: 11.5, color: light.text3 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: light.cardSoft },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: light.text },
});

const shadow = Platform.OS === 'web' ? ({ boxShadow: '0 6px 20px rgba(30,20,10,0.06)' } as any) : { shadowColor: '#2a1a0a', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E9E6E3', alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: MAX_W, backgroundColor: light.bg, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: 10 },
  side: { width: 52 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.bold, fontSize: 26, color: light.text },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: light.card, borderRadius: radius.lg, padding: space.md, ...shadow },
  seg: { flexDirection: 'row', backgroundColor: light.cardSoft, borderRadius: radius.pill, padding: 4 },
  segItem: { height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  segOn: {},
  segText: { fontFamily: fonts.medium, fontSize: 16, color: light.text2 },
  primary: { height: 60, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  primaryText: { fontFamily: fonts.bold, fontSize: 19, color: '#fff' },
  footer: { position: 'absolute', left: 0, right: 0, paddingHorizontal: space.md, paddingTop: 10, backgroundColor: 'rgba(246,245,244,0.92)' },
});
