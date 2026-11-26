import React, { useEffect } from 'react';
import { View, StyleSheet, I18nManager, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold } from '@expo-google-fonts/heebo';
import { colors } from '@/theme/tokens';
import { ToastHost } from '@/components/ui';
import { initNotifications } from '@/lib/notifications';
import { useAuthListener } from '@/lib/auth';
import { startSync, pullOnLogin } from '@/lib/sync';
import { useApp } from '@/store/useApp';

if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} else if (typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'he';
  document.body.style.backgroundColor = '#070403';
}

export default function RootLayout() {
  const [loaded] = useFonts({ Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold });
  useAuthListener();
  const sessionMode = useApp((s) => s.session?.mode);
  const hydrated = useApp((s) => s.hydrated);
  useEffect(() => {
    initNotifications();
    return startSync();
  }, []);
  // fill this week and next week from the recurring workout template / Shabbat plan (idempotent)
  useEffect(() => {
    if (hydrated) useApp.getState().ensureWeeks();
  }, [hydrated]);
  useEffect(() => {
    if (sessionMode === 'supabase') pullOnLogin().catch(() => {});
  }, [sessionMode]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {loaded ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bgDeep },
              animation: 'fade_from_bottom',
              animationDuration: 260,
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="quick-add" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="add-meal" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="add-calories" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </Stack>
        ) : (
          <View style={styles.root} />
        )}
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bgDeep } });
