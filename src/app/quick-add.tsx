import React, { useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/Icon';
import { Tap, toast, useDragToClose } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { MAX_W } from '@/components/Brand';
import { useApp } from '@/store/useApp';
import { isAdult } from '@/lib/nutrition';
import { dateKey } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

type Action = { icon: IconName; label: string; hint?: string; onPress: () => void };

/** 15 Plus menu – the fastest path to every logging action (most used first) */
export default function QuickAdd() {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const profile = useApp((s) => s.profile);
  const canKcal = isAdult(profile.age) && profile.targetMode !== 'none';
  const adult = isAdult(profile.age);
  const addWater = useApp((s) => s.addWater);
  const water = useApp((s) => s.water[dateKey()] ?? 0);
  const activeId = useApp((s) => s.activeSessionId);
  const savedCount = useApp((s) => s.savedMeals.length);
  const [waterOpen, setWaterOpen] = useState(false);
  const close = () => goBack();
  const drag = useDragToClose(close);
  const go = (href: string) => { goBack(); setTimeout(() => router.push(href as any), 40); };

  const primary: Action[] = [
    { icon: 'search', label: 'חיפוש מוצר', onPress: () => go('/foods?focus=1') },
    ...(adult ? [{ icon: 'flame' as IconName, label: 'קלוריות מהירות', hint: canKcal ? undefined : 'ללא יעד', onPress: () => go('/quick-calories') }] : []),
    { icon: 'drop', label: 'שתייה', hint: `${(water / 1000).toFixed(1)} ל׳ היום`, onPress: () => setWaterOpen((v) => !v) },
  ];
  const more: Action[] = [
    { icon: 'barcode', label: 'סריקת ברקוד', onPress: () => go('/barcode') },
    { icon: 'star', label: 'ארוחה שמורה', hint: savedCount ? `${savedCount}` : undefined, onPress: () => go('/saved-meals') },
    { icon: 'dumbbell', label: activeId ? 'המשך אימון' : 'תיעוד אימון', onPress: () => go(activeId ? '/workout/active' : '/workouts') },
    { icon: 'food', label: 'גלריית מוצרים', onPress: () => go('/foods') },
    { icon: 'camera', label: 'צילום ארוחה', onPress: () => go('/meal-photo') },
    { icon: 'edit', label: 'מוצר / מנה חדשה', onPress: () => go('/food-new') },
  ];

  const logWater = (ml: number) => {
    addWater(ml);
    haptic.success();
    toast(`נוספו ${ml} מ״ל מים`, { label: 'ביטול', onPress: () => addWater(-ml) });
    close();
  };

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={close} accessibilityLabel="סגירה" accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={reduce ? undefined : SlideInDown.springify().damping(22).stiffness(220)} style={[styles.sheetWrap, drag.style]} accessibilityViewIsModal>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
          <BlurView intensity={Platform.OS === 'ios' ? 50 : 30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.tint} pointerEvents="none" />
          <View {...drag.handlers} style={{ paddingTop: 10, paddingBottom: 6 }}>
            <View style={styles.grabber} accessibilityLabel="גרירה למטה לסגירה" />
            <Text style={styles.title} accessibilityRole="header">מה להוסיף?</Text>
          </View>

          <View style={styles.primaryRow}>
            {primary.map((a) => (
              <Tap key={a.label} onPress={a.onPress} label={a.hint ? `${a.label}, ${a.hint}` : a.label} style={{ flex: 1 }}>
                <View style={[styles.primary, a.icon === 'drop' && waterOpen && styles.primaryOn]}>
                  <View style={styles.primaryIcon}><Icon name={a.icon} size={28} color={colors.text} /></View>
                  <Text style={styles.primaryLabel} numberOfLines={1}>{a.label}</Text>
                  {a.hint ? <Text style={styles.hint} numberOfLines={1}>{a.hint}</Text> : null}
                </View>
              </Tap>
            ))}
          </View>

          {waterOpen && (
            <Animated.View entering={reduce ? undefined : FadeIn.duration(160)} style={styles.waterRow}>
              {[150, 250, 330, 500].map((ml) => (
                <Tap key={ml} onPress={() => logWater(ml)} label={`הוספת ${ml} מ״ל מים`} style={{ flex: 1 }}>
                  <View style={styles.waterBtn}><Text style={styles.waterNum}>{ml}</Text><Text style={styles.hint}>מ״ל</Text></View>
                </Tap>
              ))}
            </Animated.View>
          )}

          <View style={styles.list}>
            {more.map((a) => (
              <Tap key={a.label} onPress={a.onPress} label={a.label} style={styles.cellWrap}>
                <View style={styles.cell}>
                  <Icon name={a.icon} size={24} />
                  <Text style={styles.cellLabel} numberOfLines={2}>{a.label}</Text>
                  {a.hint ? <View style={styles.count}><Text style={styles.countText}>{a.hint}</Text></View> : null}
                </View>
              </Tap>
            ))}
          </View>

          <Tap onPress={close} label="סגירה">
            <View style={styles.close}><Icon name="close" size={22} color={colors.text} /></View>
          </Tap>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheetWrap: { width: '100%', maxWidth: MAX_W },
  sheet: { borderTopLeftRadius: 34, borderTopRightRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,190,140,0.18)', paddingHorizontal: space.md },
  tint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20,12,8,0.78)' } as any,
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 12 },
  title: { ...type.title, color: colors.text, textAlign: 'center', marginBottom: space.md },
  primaryRow: { flexDirection: 'row', gap: 10 },
  primary: { alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: radius.lg, backgroundColor: 'rgba(232,120,42,0.18)', borderWidth: 1, borderColor: 'rgba(255,170,110,0.35)' },
  primaryOn: { backgroundColor: 'rgba(232,120,42,0.32)' },
  primaryIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emberMid },
  primaryLabel: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text },
  hint: { ...type.caption, color: colors.text2 },
  waterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  waterBtn: { alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, minHeight: 56, justifyContent: 'center' },
  waterNum: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  list: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: space.md },
  cellWrap: { width: '33.333%', padding: 4 },
  cell: { alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 4, minHeight: 88, justifyContent: 'center', borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  cellLabel: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text, textAlign: 'center' },
  count: { position: 'absolute', top: 6, left: 6, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.bold, fontSize: 11, color: colors.textOnAccent },
  close: { alignSelf: 'center', marginTop: space.md, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
});
