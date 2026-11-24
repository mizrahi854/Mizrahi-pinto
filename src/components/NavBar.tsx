import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, useReducedMotion, withRepeat, Easing } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { colors, fonts } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { MAX_W } from './Brand';

const ITEMS: { route: string; label: string; icon: IconName }[] = [
  { route: 'index', label: 'בית', icon: 'home' },
  { route: 'stats', label: 'סטטיסטיקה', icon: 'chart' },
  { route: '+', label: 'הוספה', icon: 'plus' },
  { route: 'nutrition', label: 'תזונה', icon: 'food' },
  { route: 'profile', label: 'פרופיל', icon: 'user' },
];

/** Floating Liquid-Glass tab bar (PRD 2.6 / prompt §5). */
export function NavBar({ state, navigation }: { state: { index: number; routes: { name: string; key: string }[] }; navigation: any }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 10) }]}>
      <View style={styles.shadow}>
        <View style={styles.bar}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.0)', 'rgba(232,120,42,0.08)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.reflection} pointerEvents="none" />
          {ITEMS.map((it) =>
            it.route === '+' ? (
              <PlusButton key="plus" />
            ) : (
              <Tab
                key={it.route}
                item={it}
                active={activeName === it.route}
                onPress={() => {
                  const route = state.routes.find((r) => r.name === it.route);
                  if (!route) return;
                  haptic.select();
                  const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (activeName !== it.route && !ev.defaultPrevented) navigation.navigate(it.route);
                }}
              />
            ),
          )}
        </View>
      </View>
    </View>
  );
}

function Tab({ item, active, onPress }: { item: (typeof ITEMS)[number]; active: boolean; onPress: () => void }) {
  const v = useSharedValue(active ? 1 : 0);
  const reduce = useReducedMotion();
  useEffect(() => {
    v.value = reduce ? (active ? 1 : 0) : withSpring(active ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [active, reduce, v]);
  const bg = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.7 + 0.3 * v.value }] }));
  const ic = useAnimatedStyle(() => ({ transform: [{ translateY: -1.5 * v.value }, { scale: 1 + 0.06 * v.value }] }));
  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: active }}>
      <Animated.View style={[styles.activeBg, bg]}>
        <LinearGradient colors={['rgba(232,120,42,0.38)', 'rgba(168,60,0,0.22)']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={ic}>
        <Icon name={item.icon} size={23} color={active ? colors.text : 'rgba(255,255,255,0.72)'} strokeWidth={active ? 2 : 1.6} />
      </Animated.View>
      <Text style={[styles.label, active && { color: colors.text, fontFamily: fonts.semibold }]} numberOfLines={1}>{item.label}</Text>
    </Pressable>
  );
}

function PlusButton() {
  const reduce = useReducedMotion();
  const glow = useSharedValue(0.6);
  const press = useSharedValue(1);
  useEffect(() => {
    if (!reduce) glow.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, glow]);
  const g = useAnimatedStyle(() => ({ opacity: 0.35 + 0.35 * glow.value, transform: [{ scale: 0.95 + 0.1 * glow.value }] }));
  const p = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  return (
    <Pressable
      onPress={() => { haptic.medium(); router.push('/quick-add'); }}
      onPressIn={() => { press.set(withSpring(0.92)); }}
      onPressOut={() => { press.set(withSpring(1)); }}
      style={styles.plusSlot}
      accessibilityRole="button"
      accessibilityLabel="פעולות מהירות"
    >
      <Animated.View style={[styles.plusGlow, g]} />
      <Animated.View style={[styles.plus, p]}>
        <LinearGradient colors={[colors.accentLight, colors.accent, colors.emberMid]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.plusShine} />
        <Icon name="plus" size={28} color="#fff" strokeWidth={2.4} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 14 },
  shadow: { width: '100%', maxWidth: MAX_W - 28, borderRadius: 34, ...(Platform.OS === 'web' ? ({ boxShadow: '0 14px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,150,80,0.10)' } as any) : { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 }) },
  bar: { flexDirection: 'row', alignItems: 'center', height: 74, borderRadius: 34, overflow: 'hidden', backgroundColor: 'rgba(24,14,9,0.72)', borderWidth: 1, borderColor: 'rgba(255,170,110,0.18)', paddingHorizontal: 6 },
  reflection: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  tab: { flex: 1, height: 62, alignItems: 'center', justifyContent: 'center', gap: 3 },
  activeBg: { position: 'absolute', top: 2, bottom: 2, left: 2, right: 2, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,170,110,0.28)' },
  label: { fontFamily: fonts.regular, fontSize: 10.5, color: 'rgba(255,255,255,0.62)' },
  plusSlot: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  plusGlow: { position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: colors.accent, ...(Platform.OS === 'web' ? ({ filter: 'blur(12px)' } as any) : {}) },
  plus: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,210,170,0.6)' },
  plusShine: { position: 'absolute', top: 3, left: 10, right: 10, height: 18, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)' },
});
