import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Field, Button, Card, Row, T, IconButton, Stepper, Chip, toast } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { EXERCISES, exerciseById, MUSCLE_LABELS } from '@/data/exercises';
import type { PlanExercise, Muscle } from '@/data/types';
import { uid } from '@/lib/dates';
import { fonts, space } from '@/theme/tokens';

/** Custom workout builder: add exercises, reorder, sets/reps/rest (9.8) */
export default function Builder() {
  const save = useApp((s) => s.saveCustomPlan);
  const [name, setName] = useState('');
  const [items, setItems] = useState<PlanExercise[]>([]);
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all');
  const pool = EXERCISES.filter((e) => muscle === 'all' || e.primary.includes(muscle));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = [...items];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setItems(n);
  };
  const patch = (i: number, p: Partial<PlanExercise>) => setItems(items.map((x, k) => (k === i ? { ...x, ...p } : x)));

  return (
    <Screen title="אימון מותאם" footer={<Button title="שמירת האימון" disabled={!name.trim() || !items.length} onPress={() => {
      const id = `c_${uid()}`;
      const muscles = [...new Set(items.flatMap((e) => exerciseById(e.exerciseId)?.primary ?? []))].slice(0, 3).map((m) => MUSCLE_LABELS[m]);
      save({ id, name: name.trim(), nameEn: name.trim(), focus: muscles.join(' • '), location: 'any', level: 'intermediate', exercises: items, custom: true });
      toast('האימון נשמר'); router.replace(`/workout/${id}`);
    }} />}>
      <Field label="שם האימון" value={name} onChangeText={setName} placeholder="למשל: גב וידיים" />
      {items.map((it, i) => {
        const ex = exerciseById(it.exerciseId)!;
        return (
          <Card key={i} style={{ marginBottom: 8, gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T.Body style={{ fontFamily: fonts.semibold, flex: 1 }}>{i + 1}. {ex.name}</T.Body>
              <IconButton icon="chevronBack" label="הזז למעלה" size={34} onPress={() => move(i, -1)} />
              <IconButton icon="chevron" label="הזז למטה" size={34} onPress={() => move(i, 1)} />
              <IconButton icon="trash" label="הסר" size={34} onPress={() => setItems(items.filter((_, k) => k !== i))} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}><T.Muted>סטים</T.Muted><Stepper label="סטים" value={it.sets} min={1} max={10} onChange={(v) => patch(i, { sets: Math.max(1, v) })} /></Row>
            <Row style={{ justifyContent: 'space-between' }}><T.Muted>חזרות</T.Muted><Stepper label="חזרות" value={it.repsMax} min={1} max={50} onChange={(v) => patch(i, { repsMax: v, repsMin: Math.min(it.repsMin, v) })} /></Row>
            <Row style={{ justifyContent: 'space-between' }}><T.Muted>מנוחה (שנ׳)</T.Muted><Stepper label="מנוחה" value={it.restSec} step={15} min={0} max={300} onChange={(v) => patch(i, { restSec: v })} /></Row>
          </Card>
        );
      })}
      <T.H style={{ marginTop: space.md, marginBottom: 8 }}>הוספת תרגילים</T.H>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {(['all', 'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core', 'cardio'] as const).map((m) => <Chip key={m} label={m === 'all' ? 'הכל' : MUSCLE_LABELS[m]} active={muscle === m} onPress={() => setMuscle(m)} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {pool.map((e) => <Chip key={e.id} label={`+ ${e.name}`} onPress={() => setItems([...items, { exerciseId: e.id, sets: 3, repsMin: 8, repsMax: 12, restSec: 90 }])} />)}
      </View>
    </Screen>
  );
}
