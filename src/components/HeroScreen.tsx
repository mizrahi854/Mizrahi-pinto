import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { HeroBackdrop, Logo, SideRulers, WaveHeader, useScreenWidth } from './Brand';
import { DotMatrix, DotNumber } from './DotMatrix';
import { IconButton, Tap } from './ui';
import { Icon, IconName } from './Icon';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

/**
 * Shared composition from the approved references: dark ember backdrop, blurred figure,
 * side rulers, dot-matrix headline, glass pill, sunken U-wave and a panel below.
 */
export function HeroScreen({
  title, dotValue, dotText, dotSize = 7.6, dotSuffix, label, pill, pillIcon = 'flame', onPill, progress = 0.5, children, heroHeight = 300, back = false, menu, tabBar = true, above,
}: {
  title?: string; dotValue?: number; dotText?: string; dotSize?: number; dotSuffix?: string; label?: string; pill?: string; pillIcon?: IconName; onPill?: () => void; progress?: number;
  children: ReactNode; heroHeight?: number; back?: boolean; menu?: () => void; tabBar?: boolean; above?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + (tabBar ? 120 : 40) }} keyboardShouldPersistTaps="handled">
          <View style={{ height: heroHeight + insets.top }}>
            <HeroBackdrop height={heroHeight + insets.top + 60} />
            <SideRulers top={insets.top + 80} height={heroHeight - 120} />
            <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
              {back ? <IconButton icon="chevronBack" label="חזרה" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} size={44} /> : <Logo />}
              {menu ? <IconButton icon="dots" label="אפשרויות" onPress={menu} size={48} /> : <View style={{ width: 48 }} />}
            </View>
            <Animated.View entering={reduce ? undefined : FadeInDown.duration(450)} style={styles.center}>
              {dotValue != null && <DotNumber value={dotValue} suffix={dotSuffix} dot={7.6} gap={3.2} />}
              {dotText != null && <DotMatrix text={dotText} dot={dotSize} gap={dotSize * 0.42} />}
              {title && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
              {label && <Text style={styles.label}>{label}</Text>}
              {pill && (
                <Tap onPress={onPill} disabled={!onPill} label={pill} haptics={!!onPill}>
                  <View style={styles.pill}>
                    <Icon name={pillIcon} size={14} color={colors.accentLight} />
                    <Text style={styles.pillText}>{pill}</Text>
                  </View>
                </Tap>
              )}
              {above}
            </Animated.View>
          </View>
          <WaveHeader progress={progress} height={96} />
          <View style={styles.panel}>{children}</View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  center: { alignItems: 'center', marginTop: 22, gap: 8, paddingHorizontal: space.lg },
  title: { fontFamily: fonts.semibold, fontSize: 34, lineHeight: 42, color: colors.text, textAlign: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 18, color: colors.text, textAlign: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.22)' },
  pillText: { ...type.label, color: colors.text, fontFamily: fonts.medium },
  panel: { backgroundColor: colors.surface, paddingHorizontal: space.md, marginTop: -2 },
});
