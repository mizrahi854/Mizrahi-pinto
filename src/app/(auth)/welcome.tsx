import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Button, T, Tap, Badge } from '@/components/ui';
import { LogoMark, HeroBackdrop, useScreenWidth } from '@/components/Brand';
import { continueLocal, supabaseConfigured } from '@/lib/auth';
import { colors, fonts, space } from '@/theme/tokens';

/** 02 Welcome */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <HeroBackdrop height={900} figure={false} />
        <Animated.View entering={reduce ? undefined : FadeInDown.duration(600)} style={styles.brand}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
            <LogoMark size={64} />
            <View>
              <Text style={styles.word}>MIZRAHI</Text>
              <Text style={styles.word}>PINTO</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={reduce ? undefined : FadeInDown.delay(150).duration(600)} style={styles.copy}>
          <Text style={styles.title}>ברוך הבא</Text>
          <Text style={styles.sub}>האפליקציה שלך לכושר, תזונה{'\n'}ושגרה מנצחת</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
          <Button title="בוא נתחיל" icon="chevron" onPress={() => router.push('/sign-up')} />
          <Button title="כבר יש לי חשבון" variant="ghost" onPress={() => router.push('/sign-in')} />
          <Tap onPress={() => { continueLocal(); router.replace('/onboarding'); }} label="המשך בלי חשבון">
            <Text style={styles.link}>המשך בלי חשבון (שמירה במכשיר בלבד)</Text>
          </Tap>
          <Tap onPress={() => router.push('/demo')} label="צפייה בהדגמה">
            <Text style={[styles.link, { color: colors.accentLight }]}>צפייה בהדגמה</Text>
          </Tap>
          {!supabaseConfigured && (
            <View style={{ alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Badge text="מצב מקומי" tone="muted" />
              <T.Caption style={{ textAlign: 'center' }}>השרת עדיין לא חובר. הנתונים נשמרים במכשיר זה בלבד.</T.Caption>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  brand: { alignItems: 'center', marginTop: 20 },
  word: { fontFamily: fonts.semibold, fontSize: 20, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', lineHeight: 23 },
  copy: { alignItems: 'center', marginTop: 70, gap: 14 },
  title: { fontFamily: fonts.bold, fontSize: 46, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.text2, textAlign: 'center', paddingVertical: 10 },
});
