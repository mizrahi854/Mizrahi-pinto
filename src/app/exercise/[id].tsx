import React from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Row, T, Section, Badge, ListItem, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BodyMap } from '@/components/BodyMap';
import { useApp } from '@/store/useApp';
import { exerciseById, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';
import { prettyDate } from '@/lib/dates';
import { colors, fonts, space } from '@/theme/tokens';

/** 38 Exercise details: muscles map, how-to, common mistakes, alternatives, previous log */
export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = exerciseById(id ?? '');
  const sessions = useApp((s) => s.sessions);
  if (!ex) return <Screen title="תרגיל"><Empty title="התרגיל לא נמצא" /></Screen>;
  const last = [...sessions].reverse().find((s) => s.status === 'done' && s.exercises.some((e) => e.exerciseId === ex.id));
  const lastSets = last?.exercises.find((e) => e.exerciseId === ex.id)?.sets.filter((s) => s.done) ?? [];
  return (
    <Screen title={ex.name} subtitle={ex.nameEn}>
      <Card style={{ paddingVertical: space.lg }}>
        <BodyMap primary={ex.primary} secondary={ex.secondary} />
        <Row style={{ justifyContent: 'center', marginTop: space.md, flexWrap: 'wrap' }}>
          {ex.primary.map((m) => <Badge key={m} text={MUSCLE_LABELS[m]} />)}
          {ex.secondary.map((m) => <Badge key={m} text={MUSCLE_LABELS[m]} tone="muted" />)}
        </Row>
      </Card>
      <Row style={{ marginTop: space.md, justifyContent: 'center' }}>
        <Badge text={EQUIPMENT_LABELS[ex.equipment]} tone="muted" />
        <Badge text={['', 'קל', 'בינוני', 'מאתגר'][ex.difficulty]!} tone="muted" />
      </Row>
      <Section title="איך מבצעים">
        {ex.instructions.map((s, i) => (
          <Row key={i} style={{ alignItems: 'flex-start', marginBottom: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textOnAccent, fontFamily: fonts.bold }}>{i + 1}</Text></View>
            <T.Body style={{ flex: 1 }}>{s}</T.Body>
          </Row>
        ))}
      </Section>
      <Section title="טעויות נפוצות">
        {ex.mistakes.map((m) => <Row key={m} style={{ marginBottom: 6 }}><Icon name="close" size={16} color={colors.danger} /><T.Body style={{ flex: 1 }}>{m}</T.Body></Row>)}
      </Section>
      {lastSets.length > 0 && (
        <Section title={`בפעם הקודמת · ${prettyDate(last!.date)}`}>
          <Card>{lastSets.map((s, i) => <T.Body key={i}>סט {i + 1}: {s.reps} חזרות{s.weight != null ? ` × ${s.weight} ק״ג` : ''}</T.Body>)}</Card>
          <T.Caption style={{ marginTop: 6 }}>מוצג לעיון בלבד – אין חובה להעלות משקל בכל אימון.</T.Caption>
        </Section>
      )}
      {ex.alternatives.length > 0 && (
        <Section title="חלופות">
          {ex.alternatives.map((a) => { const alt = exerciseById(a); return alt ? <ListItem key={a} icon="swap" title={alt.name} subtitle={alt.nameEn} onPress={() => router.push(`/exercise/${a}`)} /> : null; })}
        </Section>
      )}
      <T.Caption style={{ marginTop: space.md }}>ההמחשה היא איור מקורי. הדגמות וידאו/תלת-ממד מורשות יתווספו בהמשך.</T.Caption>
    </Screen>
  );
}
