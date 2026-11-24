import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen, Chip, ListItem, T, Badge, Row } from '@/components/ui';
import { EXERCISES, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';
import type { Exercise, Muscle } from '@/data/types';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** 37 Exercise library – filter by muscle, equipment, difficulty, type */
export default function Exercises() {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const [eq, setEq] = useState<Exercise['equipment'] | 'all'>('all');
  const [lvl, setLvl] = useState<0 | 1 | 2 | 3>(0);
  const [kind, setKind] = useState<Exercise['kind'] | 'all'>('all');
  const list = EXERCISES.filter((e) =>
    (muscle === 'all' || e.primary.includes(muscle) || e.secondary.includes(muscle)) && (eq === 'all' || e.equipment === eq) && (!lvl || e.difficulty === lvl) && (kind === 'all' || e.kind === kind) &&
    (!q || e.name.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase())));
  return (
    <Screen title="מאגר תרגילים" subtitle={`${list.length} תרגילים`}>
      <TextInput value={q} onChangeText={setQ} placeholder="חיפוש תרגיל" placeholderTextColor={colors.text3} accessibilityLabel="חיפוש תרגיל" style={{ minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 16, color: colors.text, fontFamily: fonts.regular, fontSize: 16, marginBottom: space.sm }} />
      <Row style={{ flexWrap: 'wrap', marginBottom: 6 }}>
        {(['all', 'strength', 'cardio', 'mobility'] as const).map((k) => <Chip key={k} label={{ all: 'הכל', strength: 'כוח', cardio: 'אירובי', mobility: 'גמישות' }[k]} active={kind === k} onPress={() => setKind(k)} />)}
        {([0, 1, 2, 3] as const).map((l) => <Chip key={l} label={['כל הרמות', 'קל', 'בינוני', 'מאתגר'][l]!} active={lvl === l} onPress={() => setLvl(l)} />)}
      </Row>
      <Row style={{ flexWrap: 'wrap', marginBottom: 6 }}>
        <Chip label="כל השרירים" active={muscle === 'all'} onPress={() => setMuscle('all')} />
        {(Object.keys(MUSCLE_LABELS) as Muscle[]).map((m) => <Chip key={m} label={MUSCLE_LABELS[m]} active={muscle === m} onPress={() => setMuscle(m)} />)}
      </Row>
      <Row style={{ flexWrap: 'wrap', marginBottom: space.md }}>
        <Chip label="כל הציוד" active={eq === 'all'} onPress={() => setEq('all')} />
        {(Object.keys(EQUIPMENT_LABELS) as Exercise['equipment'][]).map((k) => <Chip key={k} label={EQUIPMENT_LABELS[k]} active={eq === k} onPress={() => setEq(k)} />)}
      </Row>
      {list.map((e) => (
        <ListItem key={e.id} icon={e.kind === 'cardio' ? 'bolt' : e.kind === 'mobility' ? 'body' : 'dumbbell'} title={e.name} subtitle={`${e.nameEn} · ${e.primary.map((m) => MUSCLE_LABELS[m]).join(', ')} · ${EQUIPMENT_LABELS[e.equipment]}`} right={<Badge text={['', 'קל', 'בינוני', 'מאתגר'][e.difficulty]!} tone="muted" />} onPress={() => router.push(`/exercise/${e.id}`)} />
      ))}
      {list.length === 0 && <T.Muted style={{ textAlign: 'center', marginTop: space.lg }}>אין תרגילים לסינון הזה.</T.Muted>}
    </Screen>
  );
}
