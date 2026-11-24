import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Screen, Card, Row, T, Button, Field, Stat, Empty, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { DotMatrix } from '@/components/DotMatrix';
import { useApp } from '@/store/useApp';
import { exerciseById } from '@/data/exercises';
import { sessionVolume } from '@/lib/stats';
import { fmtDuration } from '@/lib/dates';
import { personalRecords } from '@/lib/records';
import { colors, space } from '@/theme/tokens';

/** 40 Workout summary */
export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reduce = useReducedMotion();
  const sessions = useApp((s) => s.sessions);
  const update = useApp((s) => s.updateSession);
  const s = sessions.find((x) => x.id === id);
  const [notes, setNotes] = useState(s?.notes ?? '');
  if (!s) return <Screen title="סיכום"><Empty title="האימון לא נמצא" /></Screen>;
  const v = sessionVolume(s);
  const prs = personalRecords(sessions).filter((p) => p.sessionId === s.id);

  return (
    <Screen title="סיכום אימון" back={false} footer={<Button title="סיום" onPress={() => { update(s.id, (x) => ({ ...x, notes })); router.replace('/(tabs)'); }} />}>
      <Animated.View entering={reduce ? undefined : ZoomIn.springify()} style={{ alignItems: 'center', marginTop: space.lg, gap: 10 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={44} color={colors.textOnAccent} strokeWidth={2.6} /></View>
        <T.Title>כל הכבוד!</T.Title>
        <T.Muted>{s.name}</T.Muted>
        <DotMatrix text={fmtDuration(s.endedAt ? s.endedAt - s.startedAt - s.pausedMs : 0)} dot={6} gap={2.4} />
        <T.Caption>משך בפועל</T.Caption>
      </Animated.View>
      <Animated.View entering={reduce ? undefined : FadeInDown.delay(200)}>
        <Card style={{ marginTop: space.lg }}>
          <Row><Stat value={String(v.sets)} label="סטים" icon="layers" /><Stat value={String(v.reps)} label="חזרות" icon="repeat" /><Stat value={v.volume.toLocaleString()} label="נפח (ק״ג)" icon="weight" /></Row>
        </Card>
        {prs.length > 0 && (
          <Card style={{ marginTop: space.md, gap: 6 }}>
            <Row><Icon name="trophy" /><T.H>שיאים אישיים חדשים</T.H></Row>
            {prs.map((p) => <T.Body key={p.exerciseId}>{exerciseById(p.exerciseId)?.name}: {p.weight} ק״ג × {p.reps}</T.Body>)}
          </Card>
        )}
        <Card style={{ marginTop: space.md, gap: 6 }}>
          {s.exercises.map((e) => (
            <Row key={e.exerciseId} style={{ justifyContent: 'space-between' }}>
              <T.Body>{exerciseById(e.exerciseId)?.name}</T.Body>
              {e.skipped ? <Badge text="דולג" tone="muted" /> : <T.Muted>{e.sets.filter((x) => x.done).length}/{e.sets.length} סטים</T.Muted>}
            </Row>
          ))}
        </Card>
        <View style={{ marginTop: space.md }}>
          <Field label="הערות (לא חובה)" value={notes} onChangeText={setNotes} multiline placeholder="איך הרגיש האימון?" />
        </View>
      </Animated.View>
    </Screen>
  );
}
