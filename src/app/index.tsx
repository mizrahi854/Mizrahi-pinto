import React, { useEffect } from 'react';
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { LogoMark, SplashArt, useScreenWidth } from '@/components/Brand';
import { colors, fonts } from '@/theme/tokens';

/** 01 Splash – brand frame: ember field, blurred figure, white mark */
export default function Splash() {
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const onboarded = useApp((s) => s.onboarded);
  const w = useScreenWidth();
  const { height } = useWindowDimensions();

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (!session) router.replace('/welcome');
      else if (!onboarded) router.replace('/onboarding');
      else router.replace('/(tabs)');
    }, 1300);
    return () => clearTimeout(t);
  }, [hydrated, session, onboarded]);

  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w }]}>
        <SplashArt width={w} height={height} />
        <View style={styles.center} accessible accessibilityLabel="MIZRAHI PINTO">
          <Animated.View entering={ZoomIn.duration(650)}>
            <LogoMark size={120} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(380).duration(500)} style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={styles.word}>MIZRAHI</Text>
            <Text style={styles.word}>PINTO</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, overflow: 'hidden', backgroundColor: '#8A2B03' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word: { fontFamily: fonts.bold, fontSize: 34, letterSpacing: 2, color: '#fff', lineHeight: 38 },
});
