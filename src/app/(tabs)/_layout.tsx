import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { Redirect } from 'expo-router';
import { NavBar } from '@/components/NavBar';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  if (hydrated && !onboarded) return <Redirect href="/" />;
  return (
    <Tabs
      tabBar={(props: any) => <NavBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bgDeep }, animation: 'fade' } as any}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
