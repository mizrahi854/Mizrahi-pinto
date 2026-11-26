import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { Chips, LInput, TimeField, ToggleRow, DatePick, Group, Note } from '@/components/forms';
import { useApp } from '@/store/useApp';
import { MUSCLE_LABELS, WORKOUT_PRESETS, whenLabel } from '@/lib/workouts';
import { addDays, dateKey, prettyDate } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import type { MuscleGroup } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const DURATIONS = [30, 45, 60, 75, 90];

/** Add / edit one workout: name, muscle groups, day, time, optional duration & notes, status. */
export default function WorkoutEdit() {
  const p = useLocalSearchParams<{ id?: string; date?: string }>();
  const existing = useApp((s) => s.workouts.find((w) => w.id === p.id));
  const upsert = useApp((s) => s.upsertWorkout);
  const remove = useApp((s) => s.removeWorkout);
  const restore = useApp((s) => s.restoreWorkout);
  const duplicate = useApp((s) => s.duplicateWorkout);
  const complete = useApp((s) => s.completeWorkout);
  const skip = useApp((s) => s.skipWorkout);
  const reopen = useApp((s) => s.reopenWorkout);
  const defTime = useApp((s) => s.profile.trainingTime);
  const [name, setName] = useState(existing?.name ?? '');
  const [muscles, setMuscles] = useState<MuscleGroup[]>(existing?.muscles ?? []);
  const [rest, setRest] = useState(!!existing?.rest);
  const [date, setDate] = useState(existing?.date ?? p.date ?? dateKey());
  const [time, setTime] = useState<string | null>(existing ? existing.time : defTime || null);
  const [duration, setDuration] = useState<number | null>(existing?.durationMin ?? null);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [reminder, setReminder] = useState(existing?.reminder ?? true);
  const [err, setErr] = useState<string | null>(null);

  const preset = (k: string) => {
    const pr = WORKOUT_PRESETS.find((x) => x.key === k)!;
    setRest(!!pr.rest);
    if (pr.key !== 'custom') { setName(pr.name); setMuscles(pr.muscles); }
    else { setName(''); setMuscles([]); }
  };
  const save = () => {
    if (!rest && name.trim().length < 2) return setErr('תן שם לאימון או בחר מהרשימה');
    upsert({ id: existing?.id, date, time: rest ? null : time, name: rest ? 'יום מנוחה' : name.trim(), muscles: rest ? [] : muscles, rest, durationMin: rest ? null : duration, notes: notes.trim() || undefined, reminder: rest ? false : reminder });
    haptic.success();
    toast(existing ? 'האימון עודכן' : `נוסף ל${prettyDate(date)}`);
    goBack('/(tabs)/plan');
  };

  return (
    <LightScreen title={existing ? (existing.rest ? 'יום מנוחה' : 'עריכת אימון') : 'אימון חדש'} subtitle={existing ? whenLabel(existing) : undefined}
      footer={<LPrimary title="שמירה" icon="check" onPress={save} />}>
      {existing && !existing.rest && (
        <LCard style={{ gap: 10, marginBottom: space.md }}>
          <Text style={ls.bodyStrong}>סטטוס: {existing.status === 'done' ? 'הושלם ✓' : existing.status === 'skipped' ? 'בוטל' : 'מתוכנן'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {existing.status !== 'done' && <Act icon="check" label="סימון כהושלם" primary onPress={() => { complete(existing.id); haptic.success(); toast('כל הכבוד! האימון סומן כהושלם'); goBack('/(tabs)/plan'); }} />}
            {existing.status === 'planned' && <Act icon="skip" label="ביטול" onPress={() => { skip(existing.id); toast('האימון בוטל', { label: 'ביטול', onPress: () => reopen(existing.id) }); goBack('/(tabs)/plan'); }} />}
            {existing.status !== 'planned' && <Act icon="repeat" label="החזרה לתכנון" onPress={() => { reopen(existing.id); toast('חזר לתכנון'); }} />}
          </View>
        </LCard>
      )}

      <Chips label="סוג האימון" options={WORKOUT_PRESETS.map((x) => ({ key: x.key, label: x.name }))}
        value={rest ? 'rest' : WORKOUT_PRESETS.find((x) => x.name === name)?.key ?? (name ? 'custom' : '')} onChange={preset} />

      {!rest && (
        <Group>
          <LInput label="שם האימון" value={name} onChangeText={(t) => { setName(t); setErr(null); }} placeholder="למשל: חזה ויד קדמית" />
          <Chips label="קבוצות שרירים" multi options={(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((k) => ({ key: k, label: MUSCLE_LABELS[k] }))} value={muscles} onChange={setMuscles} />
        </Group>
      )}

      <Group>
        <DatePick value={date} onChange={setDate} />
        {!rest && <TimeField value={time} onChange={setTime} optional />}
        {!rest && <Chips label="משך משוער (לא חובה)" options={[...DURATIONS.map((d) => ({ key: d, label: `${d} דק׳` })), { key: 0, label: 'ללא' }]} value={duration ?? 0} onChange={(v: number) => setDuration(v || null)} />}
        <LInput label="הערות" hint="(לא חובה)" value={notes} onChangeText={setNotes} placeholder="למשל: עם שותף, להביא מגבת" multiline />
        {!rest && <ToggleRow icon="bell" title="תזכורת לפני האימון" subtitle="באפליקציה המותקנת; באתר – תזכורת בתוך האפליקציה" value={reminder} onChange={setReminder} />}
      </Group>
      {err && <View style={{ marginTop: space.md }}><Note tone="warn" text={err} /></View>}

      {existing && (
        <Group title="עוד פעולות">
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Act icon="copy" label="שכפול לשבוע הבא" onPress={() => { duplicate(existing.id, addDays(existing.date, 7)); haptic.success(); toast(`שוכפל ל${prettyDate(addDays(existing.date, 7))}`); }} />
            <Act icon="copy" label="שכפול למחר" onPress={() => { duplicate(existing.id, addDays(existing.date, 1)); haptic.success(); toast('שוכפל למחר'); }} />
            <Act icon="trash" label="מחיקה" danger onPress={() => { const w = remove(existing.id); haptic.warn(); if (w) toast(`${w.name} נמחק`, { label: 'ביטול', onPress: () => restore(w) }); goBack('/(tabs)/plan'); }} />
          </View>
        </Group>
      )}
      <Tap onPress={() => router.push('/(tabs)/plan')} label="לתוכנית השבועית"><Text style={styles.link}>לתוכנית השבועית</Text></Tap>
    </LightScreen>
  );
}

function Act({ icon, label, onPress, primary, danger }: { icon: IconName; label: string; onPress: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <Tap onPress={onPress} label={label} style={{ flexGrow: 1 }}>
      <View style={[styles.act, primary && { backgroundColor: '#1F7A4D', borderColor: '#1F7A4D' }]}>
        <Icon name={icon} size={18} color={primary ? '#fff' : danger ? '#C2361B' : light.accentText} />
        <Text style={[styles.actText, primary && { color: '#fff' }, danger && { color: '#C2361B' }]}>{label}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  act: { minHeight: 48, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, borderColor: light.border, backgroundColor: light.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actText: { fontFamily: fonts.semibold, fontSize: 14.5, color: light.text },
  link: { textAlign: 'center', fontFamily: fonts.semibold, fontSize: 15, color: light.accentText, padding: 14, marginTop: space.md },
});
