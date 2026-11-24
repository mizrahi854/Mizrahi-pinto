import React, { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { Screen, ListItem, Empty, T, Section } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { useDay } from '@/store/selectors';
import { dateKey } from '@/lib/dates';

/** 43 Notification center – generated from real app state (no fake messages) */
export default function Notifications() {
  const day = useDay(dateKey());
  const reminders = useApp((s) => s.reminders);
  const schedule = useApp((s) => s.schedule);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const challenges = useApp((s) => s.challenges);
  const water = useApp((s) => s.water[dateKey()] ?? 0);
  const waterTarget = useApp((s) => s.profile.waterTargetMl);
  const markSeen = useApp((s) => s.markNotificationsSeen);
  useEffect(() => { markSeen(); }, [markSeen]);

  const items = useMemo(() => {
    const out: { icon: any; title: string; sub: string; href: string }[] = [];
    if (activeId) out.push({ icon: 'play', title: 'יש אימון פעיל', sub: 'אפשר להמשיך מאותה נקודה', href: '/workout/active' });
    const today = schedule[new Date().getDay()];
    const doneToday = sessions.some((s) => s.date === dateKey() && s.status === 'done');
    if (today && today !== 'rest' && !doneToday && !activeId) out.push({ icon: 'dumbbell', title: 'אימון מתוכנן היום', sub: 'אפשר להתחיל, לדחות או לשנות יום', href: '/workouts' });
    if (day.list.length === 0) out.push({ icon: 'bowl', title: 'עוד לא תועדו ארוחות היום', sub: 'תזכורת עדינה – רק אם מתאים לך', href: '/foods' });
    if (water < waterTarget / 2 && new Date().getHours() >= 14) out.push({ icon: 'drop', title: 'שתייה', sub: `${(water / 1000).toFixed(1)} מתוך ${(waterTarget / 1000).toFixed(1)} ליטר`, href: '/(tabs)' });
    challenges.filter((c) => !c.finished).forEach((c) => {
      const done = c.log[dateKey()]?.length ?? 0;
      if (done < c.tasks.length) out.push({ icon: 'trophy', title: c.name, sub: `${done}/${c.tasks.length} משימות היום`, href: `/victory/${c.id}` });
    });
    if (!reminders.length) out.push({ icon: 'alarm', title: 'אין תזכורות', sub: 'אפשר להגדיר תזכורת לאימון או השכמה', href: '/alarm' });
    return out;
  }, [day.list.length, reminders.length, schedule, sessions, activeId, challenges, water, waterTarget]);

  return (
    <Screen title="מרכז התראות">
      {items.length === 0 ? <Empty icon="bell" title="הכל מעודכן" /> : (
        <Section title="היום" style={{ marginTop: 0 }}>
          {items.map((i) => <ListItem key={i.title} icon={i.icon} title={i.title} subtitle={i.sub} onPress={() => router.push(i.href as any)} />)}
        </Section>
      )}
      <ListItem icon="settings" title="ניהול תזכורות" onPress={() => router.push('/alarm')} />
      <T.Caption style={{ textAlign: 'center', marginTop: 12 }}>ההודעות כאן מבוססות על הנתונים שלך בלבד.</T.Caption>
    </Screen>
  );
}
