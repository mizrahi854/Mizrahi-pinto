import React, { ReactNode } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, KeyboardAvoidingView } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Tap } from './ui';
import { Icon, IconName } from './Icon';
import { MAX_W, HeroBackdrop, useScreenWidth } from './Brand';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Light surface kit for the approved white screens (workout detail, nutrition, add food). */
export function LightScreen({
  title, subtitle, children, back = true, right, footer, tabBar = false, scroll = true, hero, heroHeight = 0,
}: { title: string; subtitle?: string; children: ReactNode; back?: boolean; right?: ReactNode; footer?: ReactNode; tabBar?: boolean; scroll?: boolean; hero?: ReactNode; heroHeight?: number }) {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const bottomPad = insets.bottom + (footer ? 110 : 0) + (tabBar ? 110 : 30);
  const topH = insets.top + 76 + (subtitle ? 20 : 0) + heroHeight;
  const header = (
    <View style={{ height: topH + 28 }}>
      <HeroBackdrop height={topH + 60} figure={false} />
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.side}>{back ? <LIconButton dark icon="chevronBack" label="חזרה" onPress={() => goBack()} /> : null}</View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.title} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={[s.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      {hero ? <View style={{ paddingHorizontal: space.md }}>{hero}</View> : null}
    </View>
  );
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={[s.inner, { width: w }]}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} stickyHeaderIndices={undefined}>
            {header}
            {/* the light body always reaches the bottom (no dark strip under short screens) */}
            <View style={[s.body, { flexGrow: 1, paddingBottom: bottomPad }]}>{children}</View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            {header}
            <View style={[s.body, { flex: 1 }]}>{children}</View>
          </View>
        )}
        {footer && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.footerWrap, { bottom: tabBar ? 96 : 0 }]} pointerEvents="box-none">
            <View style={[s.footer, { paddingBottom: tabBar ? 10 : insets.bottom + 14 }]}>{footer}</View>
          </KeyboardAvoidingView>
        )}
      </View>
    </View>
  );
}

export function LIconButton({ icon, label, onPress, active, dark = true }: { icon: IconName; label: string; onPress?: () => void; active?: boolean; dark?: boolean }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[s.iconBtn, dark && s.iconBtnDark, active && { backgroundColor: light.accentSoft }]}><Icon name={icon} size={23} color={dark ? '#fff' : active ? light.accent : light.text} strokeWidth={1.9} /></View>
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
              {on && <LinearGradient colors={['#D9601A', '#C2500F']} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />}
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
        <LinearGradient colors={['#D9601A', '#C2500F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
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

const shadow = Platform.OS === 'web' ? ({ boxShadow: '0 6px 20px rgba(19,20,22,0.06)' } as any) : { shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0F10', alignItems: 'center' },
  inner: { flex: 1, maxWidth: MAX_W, backgroundColor: '#131416', overflow: 'hidden' },
  body: { backgroundColor: light.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -28, paddingHorizontal: space.md, paddingTop: space.lg, minHeight: 600 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  iconBtnDark: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: 10 },
  side: { width: 52 },
  title: { textAlign: 'center', fontFamily: fonts.bold, fontSize: 24, color: '#fff' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: light.card, borderRadius: radius.lg, padding: space.md, ...shadow },
  seg: { flexDirection: 'row', backgroundColor: light.cardSoft, borderRadius: radius.pill, padding: 4 },
  segItem: { height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  segOn: {},
  segText: { fontFamily: fonts.medium, fontSize: 16, color: light.text2 },
  primary: { height: 60, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' },
  primaryText: { fontFamily: fonts.bold, fontSize: 19, color: '#fff' },
  footerWrap: { position: 'absolute', left: 0, right: 0 },
  footer: { paddingHorizontal: space.md, paddingTop: 10, backgroundColor: 'rgba(246,245,244,0.94)' },
});
