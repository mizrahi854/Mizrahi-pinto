import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Screen, ListItem, Empty, T, Section } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { useInbox } from '@/lib/inbox';

/** Notification center – generated from real app state (no fake messages). */
export default function Notifications() {
  const items = useInbox();
  const markSeen = useApp((s) => s.markNotificationsSeen);
  useEffect(() => { markSeen(); }, [markSeen]);
  return (
    <Screen title="מרכז התראות">
      {items.length === 0 ? <Empty icon="bell" title="הכל מעודכן" text="אין כרגע משהו שדורש תשומת לב." /> : (
        <Section title="עכשיו" style={{ marginTop: 0 }}>
          {items.map((i) => <ListItem key={i.id} icon={i.icon} title={i.title} subtitle={i.sub} onPress={() => router.push(i.href)} />)}
        </Section>
      )}
      <ListItem icon="settings" title="ניהול תזכורות והתראות" onPress={() => router.push('/alarm')} />
      <T.Caption style={{ textAlign: 'center', marginTop: 12 }}>ההודעות כאן מבוססות על הנתונים שלך בלבד.</T.Caption>
    </Screen>
  );
}
