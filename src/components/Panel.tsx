import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, Text, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { Icon } from './Icon';
import { Tap, useDragToClose } from './ui';
import { MAX_W } from './Brand';
import { colors, space, type } from '@/theme/tokens';
import { goBack } from '@/lib/nav';
import { useReduceTransparency } from '@/lib/a11y';

/** Bottom-sheet route (transparent modal): backdrop tap, swipe down, close button and Escape all dismiss. */
export function Panel({ title, subtitle, children, onClose = () => goBack(), scroll, footer }: { title: string; subtitle?: string; children: ReactNode; onClose?: () => void; scroll?: boolean; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const solid = useReduceTransparency();
  const drag = useDragToClose(onClose);
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [onClose]);
  const body = (
    <>
      {children}
      {footer}
    </>
  );
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} onPress={onClose} accessibilityLabel="סגירה" accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={reduce ? undefined : SlideInDown.springify().damping(22).stiffness(220)} style={[styles.wrap, drag.style]} accessibilityViewIsModal>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, solid && { backgroundColor: colors.surfaceRaised }]}>
          {!solid && <BlurView intensity={Platform.OS === 'ios' ? 50 : 30} tint="dark" style={StyleSheet.absoluteFill} />}
          {!solid && <View style={styles.tint} pointerEvents="none" />}
          <View {...drag.handlers} style={styles.head}>
            <View style={styles.grabber} accessibilityLabel="גרירה למטה לסגירה" />
            <View style={styles.titleRow}>
              <View style={{ width: 44 }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.title} accessibilityRole="header">{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Tap onPress={onClose} label="סגירה"><View style={styles.close}><Icon name="close" size={20} color={colors.text} /></View></Tap>
            </View>
          </View>
          {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>{body}</ScrollView> : body}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  wrap: { width: '100%', maxWidth: MAX_W, maxHeight: '92%' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,190,140,0.18)', paddingHorizontal: space.md },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,12,8,0.82)' },
  head: { paddingTop: 10, paddingBottom: 8 },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { ...type.title, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.label, color: colors.text2, marginTop: 2 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
});
