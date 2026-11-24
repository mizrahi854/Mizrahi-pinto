import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { LogoMark, HeroBackdrop, WaveHeader, useScreenWidth } from '@/components/Brand';
import { colors } from '@/theme/tokens';
import { T } from '@/components/ui';

/** 01 Splash */
export default function Splash() {
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const onboarded = useApp((s) => s.onboarded);
  const w = useScreenWidth();

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      if (!session) router.replace('/welcome');
      else if (!onboarded) router.replace('/onboarding');
      else router.replace('/(tabs)');
    }, 1100);
    return () => clearTimeout(t);
  }, [hydrated, session, onboarded]);

  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w }]}>
        <HeroBackdrop height={620} />
        <View style={styles.center}>
          <Animated.View entering={ZoomIn.duration(600)}>
            <LogoMark size={96} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(350).duration(500)} style={{ alignItems: 'center', marginTop: 18 }}>
            <T.Title style={{ letterSpacing: 4, fontSize: 20 }}>MIZRAHI PINTO</T.Title>
          </Animated.View>
        </View>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 }}>
          <View style={{ marginTop: 96 }}>
            <WaveHeader progress={0.35} />
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
});
