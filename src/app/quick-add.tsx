import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/Icon';
import { Tap, T , toast } from '@/components/ui';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { MAX_W } from '@/components/Brand';
import { useApp } from '@/store/useApp';
import { isAdult } from '@/lib/nutrition';
import { haptic } from '@/lib/haptics';

/** 15 Plus menu – quick actions bottom sheet */
export default function QuickAdd() {
  const insets = useSafeAreaInsets();
  const adult = useApp((s) => isAdult(s.profile.age));
  const addWater = useApp((s) => s.addWater);
  const activeId = useApp((s) => s.activeSessionId);
  const close = () => router.back();
  const go = (href: string) => { router.back(); setTimeout(() => router.push(href as any), 60); };

  const actions: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'search', label: 'חיפוש מוצר', onPress: () => go('/foods') },
    { icon: 'barcode', label: 'סריקת ברקוד', onPress: () => go('/barcode') },
    { icon: 'camera', label: 'צילום ארוחה', onPress: () => go('/meal-photo') },
    { icon: 'star', label: 'ארוחה שמורה', onPress: () => go('/saved-meals') },
    ...(adult ? [{ icon: 'flame' as IconName, label: 'קלוריות מהירות', onPress: () => go('/quick-calories') }] : []),
    { icon: 'edit', label: 'הזנה ידנית', onPress: () => go('/food-new') },
    { icon: 'dumbbell', label: activeId ? 'המשך אימון' : 'התחלת אימון', onPress: () => go(activeId ? '/workout/active' : '/workouts') },
    { icon: 'drop', label: 'כוס מים', onPress: () => { addWater(250); haptic.success(); toast('נוספו 250 מ״ל מים', { label: 'בטל', onPress: () => addWater(-250) }); close(); } },
    { icon: 'weight', label: 'בניית ארוחה', onPress: () => go('/meal-builder') },
  ];

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.62)' }]} onPress={close} accessibilityLabel="סגור" accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={SlideInDown.springify().damping(19)} style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.grabber} />
        <T.Title style={{ textAlign: 'center', marginBottom: space.lg }}>מה להוסיף?</T.Title>
        <View style={styles.grid}>
          {actions.map((a, i) => (
            <Animated.View key={a.label} entering={FadeIn.delay(60 + i * 30)} style={styles.cell}>
              <Tap onPress={a.onPress} label={a.label}>
                <View style={styles.action}>
                  <View style={styles.iconWrap}><Icon name={a.icon} size={26} /></View>
                  <Text style={styles.label} numberOfLines={1}>{a.label}</Text>
                </View>
              </Tap>
            </Animated.View>
          ))}
        </View>
        <Tap onPress={close} label="סגור">
          <View style={styles.close}><Icon name="close" size={22} color={colors.text} /></View>
        </Tap>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: MAX_W, backgroundColor: '#140C08', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingTop: 10 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '33.333%', padding: 5 },
  action: { alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  label: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  close: { alignSelf: 'center', marginTop: space.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
});
