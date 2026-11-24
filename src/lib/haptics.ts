import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useApp } from '@/store/useApp';

const native = Platform.OS === 'ios' || Platform.OS === 'android';
const on = () => native && useApp.getState().settings?.haptics !== false;
export const haptic = {
  tap: () => on() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => on() && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  select: () => on() && Haptics.selectionAsync().catch(() => {}),
  success: () => on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => on() && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
