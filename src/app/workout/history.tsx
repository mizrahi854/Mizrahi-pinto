import React from 'react';
import { router } from 'expo-router';
import { Screen, Card, Row, T, Section, ListItem, Empty, Stat } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { exerciseById } from '@/data/exercises';
import { personalRecords, weeklyConsistency } from '@/lib/records';
import { sessionVolume } from '@/lib/stats';
import { prettyDate } from '@/lib/dates';
import { space } from '@/theme/tokens';

/** 41 Workout history + PRs + consistency */
export default function History() {
  const sessions = useApp((s) => s.sessions);
  const done = sessions.filter((s) => s.status === 'done').sort((a, b) => b.startedAt - a.startedAt);
  const prs = personalRecords(sessions);
  return (
    <Screen title="היסטוריית אימונים">
      <Card>
        <Row>
          <Stat value={String(done.length)} label="אימונים" icon="dumbbell" />
          <Stat value={String(weeklyConsistency(sessions))} label="שבועות ברצף" icon="calendar" />
          <Stat value={String(prs.length)} label="שיאים" icon="trophy" />
        </Row>
      </Card>
      <Section title="שיאים אישיים">
        {prs.length === 0 ? <T.Muted>שיאים יופיעו אחרי אימונים עם משקל.</T.Muted> : prs.map((p) => (
          <ListItem key={p.exerciseId} icon="trophy" title={exerciseById(p.exerciseId)?.name ?? p.exerciseId} subtitle={prettyDate(p.date)} right={<T.Body>{p.weight} ק״ג × {p.reps}</T.Body>} onPress={() => router.push(`/exercise/${p.exerciseId}`)} />
        ))}
      </Section>
      <Section title="אימונים אחרונים">
        {done.length === 0 ? <Empty icon="dumbbell" title="עוד אין אימונים" action="לתוכניות" onAction={() => router.push('/workouts')} /> : done.map((s) => {
          const v = sessionVolume(s);
          return <ListItem key={s.id} icon="dumbbell" title={s.name} subtitle={`${prettyDate(s.date)} · ${v.minutes} דק׳ · ${v.sets} סטים${s.notes ? ` · ${s.notes}` : ''}`} onPress={() => router.push({ pathname: '/workout/summary', params: { id: s.id } })} />;
        })}
      </Section>
      <T.Caption style={{ marginTop: space.md }}>התמדה נמדדת באימונים שהושלמו – ללא קשר לכמות האוכל.</T.Caption>
    </Screen>
  );
}
