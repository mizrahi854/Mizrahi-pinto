import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, Button, ProgressBar, Badge, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { challengeStats } from '@/lib/challenge';
import { fonts, space } from '@/theme/tokens';

/** 44 Road to Victory – list */
export default function Victory() {
  const challenges = useApp((s) => s.challenges);
  const active = challenges.filter((c) => !c.finished);
  const first = active[0];
  const st = first ? challengeStats(first) : null;
  return (
    <HeroScreen back dotValue={st ? st.left : 0} label={first ? `ימים לניצחון · ${first.name}` : 'ימים לניצחון'} pill="התמדה, לא השוואה" pillIcon="trophy" progress={st?.progress ?? 0} heroHeight={270} tabBar={false}>
      {challenges.length === 0 && <Empty icon="trophy" title="עוד אין אתגר" text="צור אתגר אישי או אתגר משותף עם חבר – לפי התמדה, אימונים והרגלים." />}
      {challenges.map((c) => {
        const s = challengeStats(c);
        return (
          <Card key={c.id} onPress={() => router.push(`/victory/${c.id}`)} label={c.name} style={{ marginBottom: 10, gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row><Icon name="trophy" /><T.Body style={{ fontFamily: fonts.semibold }}>{c.name}</T.Body></Row>
              {c.finished ? <Badge text="הסתיים" tone="muted" /> : <Badge text={`${s.left} ימים`} />}
            </Row>
            {c.partner && <T.Muted>עם {c.partner} · {c.partnerStatus === 'accepted' ? 'השתתפות מאושרת' : 'ממתין להסכמה'}</T.Muted>}
            <ProgressBar value={s.progress} />
            <T.Caption>{s.activeDays} ימים פעילים · רצף {s.streak} · {s.points} נקודות</T.Caption>
          </Card>
        );
      })}
      <Button title="אתגר חדש" icon="plus" onPress={() => router.push('/victory/new')} style={{ marginTop: space.md }} />
      <T.Caption style={{ marginTop: space.md, textAlign: 'center' }}>התחרות מבוססת על התמדה, פעילות והרגלים – לא על משקל, אוכל או השוואת גוף. יום חסר לא נענש.</T.Caption>
      <View style={{ height: space.lg }} />
    </HeroScreen>
  );
}
