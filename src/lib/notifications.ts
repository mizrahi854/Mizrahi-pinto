import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Reminder } from '@/data/types';

/**
 * Local notifications only. iOS does not let a regular app act as a true system alarm
 * (ringing through Silent/Focus while closed requires the AlarmKit / critical-alert entitlement,
 * which Expo Notifications does not provide). The alarm screen states this limitation.
 */
export const notificationsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export type PermState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<PermState> {
  if (!notificationsSupported) return 'unsupported';
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export async function requestPermission(): Promise<PermState> {
  if (!notificationsSupported) return 'unsupported';
  try {
    const p = await Notifications.requestPermissionsAsync();
    return p.granted ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

export function initNotifications() {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

const BODY: Record<Reminder['type'], string> = {
  alarm: 'בוקר טוב! הגיע הזמן לקום.',
  workout: 'האימון שתכננת מחכה לך. אפשר גם לדחות או לשנות יום.',
  meal: 'תזכורת עדינה לתעד את הארוחה.',
  water: 'כוס מים?',
  sleep: 'הזמן להתחיל להירגע לקראת שינה.',
  recovery: 'זמן קצר למתיחות והתאוששות.',
};

/** (Re)schedule one reminder; returns the scheduled ids. Weekday mapping: 0=Sunday → 1. */
export async function scheduleReminder(r: Reminder): Promise<string[]> {
  if (!notificationsSupported) return [];
  await cancelReminder(r);
  if (!r.enabled) return [];
  const [h, m] = r.time.split(':').map(Number);
  const ids: string[] = [];
  for (const d of r.days) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: BODY[r.type], sound: r.sound === 'none' ? undefined : 'default', data: { reminderId: r.id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: d + 1, hour: h ?? 7, minute: m ?? 0 },
      }),
    );
  }
  return ids;
}

export async function cancelReminder(r: Reminder) {
  if (!notificationsSupported) return;
  for (const id of r.notificationIds ?? []) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}
