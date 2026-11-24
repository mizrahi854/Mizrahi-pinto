import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { exerciseById, MUSCLE_LABELS } from '@/data/exercises';
import { Button, IconButton, Row, T, Tap, Sheet, ListItem, Card, Empty, toast, ProgressBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { DotMatrix } from '@/components/DotMatrix';
import { BodyMap } from '@/components/BodyMap';
import { HeroBackdrop, MAX_W } from '@/components/Brand';
import { fmtDuration } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import type { WorkoutSession } from '@/data/types';

/** 39 Active workout (persists across app restarts) */
export default function ActiveWorkout() {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const activeId = useApp((s) => s.activeSessionId);
  const session = useApp((s) => s.sessions.find((x) => x.id === s.activeSessionId));
  const update = useApp((s) => s.updateSession);
  const pause = useApp((s) => s.pauseWorkout);
  const resume = useApp((s) => s.resumeWorkout);
  const finish = useApp((s) => s.finishWorkout);
  const discard = useApp((s) => s.discardWorkout);
  const [now, setNow] = useState(Date.now());
  const [swap, setSwap] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (!session || !activeId) {
    return (
      <View style={styles.root}><View style={[styles.inner, { paddingTop: insets.top + 40 }]}>
        <Empty icon="dumbbell" title="אין אימון פעיל" action="לאימונים" onAction={() => router.replace('/workouts')} />
      </View></View>
    );
  }

  const paused = session.status === 'paused';
  const elapsed = (paused ? session.pausedAt! : now) - session.startedAt - session.pausedMs;
  const ex = session.exercises[session.current]!;
  const info = exerciseById(ex.exerciseId);
  const resting = session.restUntil && session.restUntil > now && !paused;
  const restLeft = resting ? Math.ceil((session.restUntil! - now) / 1000) : 0;
  const totalSets = session.exercises.reduce((m, e) => m + e.sets.length, 0);
  const doneSets = session.exercises.reduce((m, e) => m + e.sets.filter((s) => s.done).length, 0);

  const mut = (fn: (s: WorkoutSession) => WorkoutSession) => update(session.id, fn);
  const setField = (i: number, patch: Partial<WorkoutSession['exercises'][number]['sets'][number]>) =>
    mut((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k !== s.current ? e : { ...e, sets: e.sets.map((st, j) => (j === i ? { ...st, ...patch } : st)) })) }));

  const toggleSet = (i: number) => {
    const wasDone = ex.sets[i]!.done;
    setField(i, { done: !wasDone });
    if (!wasDone) {
      haptic.success();
      const allDone = ex.sets.every((st, j) => (j === i ? true : st.done));
      mut((s) => ({ ...s, restUntil: Date.now() + ex.target.restSec * 1000 }));
      if (allDone && session.current < session.exercises.length - 1) {
        toast(`${info?.name} הושלם!`);
      }
    }
  };
  const go = (dir: 1 | -1) => mut((s) => ({ ...s, current: Math.max(0, Math.min(s.exercises.length - 1, s.current + dir)), restUntil: undefined }));

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        <HeroBackdrop height={320} figure={false} />
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120, paddingHorizontal: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconButton icon="chevronBack" label="מזעור (האימון ממשיך)" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} size={42} />
            <T.H>{session.name}</T.H>
            <IconButton icon="close" label="סיום אימון" onPress={() => setConfirmEnd(true)} size={42} />
          </Row>

          <View style={{ alignItems: 'center', marginTop: space.lg, gap: 6 }}>
            <DotMatrix text={fmtDuration(elapsed)} dot={7} gap={2.8} accessibilityLabel={`זמן אימון ${fmtDuration(elapsed)}`} />
            <T.Muted>{paused ? 'מושהה' : 'זמן אימון'} · {doneSets}/{totalSets} סטים</T.Muted>
            <ProgressBar value={doneSets / Math.max(1, totalSets)} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          </View>

          {resting ? (
            <Animated.View entering={reduce ? undefined : ZoomIn} style={styles.rest}>
              <T.Muted>מנוחה</T.Muted>
              <DotMatrix text={String(restLeft)} dot={9} gap={3.4} accessibilityLabel={`${restLeft} שניות מנוחה`} />
              <Row>
                <Button title="+15 שנ׳" variant="ghost" onPress={() => mut((s) => ({ ...s, restUntil: (s.restUntil ?? Date.now()) + 15000 }))} />
                <Button title="דילוג על מנוחה" variant="soft" onPress={() => mut((s) => ({ ...s, restUntil: undefined }))} />
              </Row>
            </Animated.View>
          ) : null}

          <Card style={{ marginTop: space.lg }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T.Caption>תרגיל {session.current + 1} מתוך {session.exercises.length}</T.Caption>
                <Text style={[type.title, { color: colors.text }]}>{info?.name}</Text>
                <T.Muted>{info?.nameEn} · {info?.primary.map((m) => MUSCLE_LABELS[m]).join(', ')}</T.Muted>
              </View>
              <IconButton icon="help" label="הנחיות ביצוע" onPress={() => router.push(`/exercise/${ex.exerciseId}`)} size={40} />
            </Row>
            {info && <View style={{ marginTop: space.md }}><BodyMap primary={info.primary} secondary={info.secondary} /></View>}
            <T.Caption style={{ marginTop: 8 }}>יעד: {ex.target.sets} סטים × {ex.target.seconds ? `${ex.target.seconds} שניות` : `${ex.target.repsMin}-${ex.target.repsMax} חזרות`} · מנוחה {ex.target.restSec} שנ׳{ex.sets[0]?.weight != null ? ' · המשקל מהאימון הקודם' : ''}</T.Caption>

            <Row style={{ marginTop: space.md, paddingHorizontal: 4 }}>
              <Text style={[styles.th, { width: 34 }]}>סט</Text>
              <Text style={[styles.th, { flex: 1 }]}>{ex.target.seconds ? 'שניות' : 'חזרות'}</Text>
              <Text style={[styles.th, { flex: 1 }]}>משקל (ק״ג)</Text>
              <Text style={[styles.th, { width: 48 }]}>בוצע</Text>
            </Row>
            {ex.sets.map((st, i) => (
              <Animated.View key={i} entering={reduce ? undefined : FadeIn.delay(i * 40)} style={[styles.setRow, st.done && styles.setDone]}>
                <Text style={[type.bodyMedium, { color: colors.text2, width: 34, textAlign: 'center' }]}>{i + 1}</Text>
                <TextInput style={styles.cell} keyboardType="number-pad" value={String(ex.target.seconds ? st.seconds ?? ex.target.seconds : st.reps)} onChangeText={(t) => { const n = parseInt(t || '0', 10); if (isFinite(n)) setField(i, ex.target.seconds ? { seconds: n } : { reps: n }); }} accessibilityLabel={`חזרות בסט ${i + 1}`} />
                <TextInput style={styles.cell} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={colors.text3} value={st.weight == null ? '' : String(st.weight)} onChangeText={(t) => { const n = Number(t); setField(i, { weight: t === '' ? null : isFinite(n) ? n : st.weight }); }} accessibilityLabel={`משקל בסט ${i + 1} (לא חובה)`} />
                <Tap onPress={() => toggleSet(i)} label={`סט ${i + 1} ${st.done ? 'בוצע' : 'לא בוצע'}`} role="checkbox">
                  <View style={[styles.check, st.done && styles.checkOn]}>{st.done && <Icon name="check" size={18} color={colors.textOnAccent} strokeWidth={2.6} />}</View>
                </Tap>
              </Animated.View>
            ))}
            <Row style={{ marginTop: 10 }}>
              <Button title="סט נוסף" variant="ghost" icon="plus" style={{ flex: 1 }} onPress={() => mut((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k !== s.current ? e : { ...e, sets: [...e.sets, { ...e.sets[e.sets.length - 1]!, done: false }] })) }))} />
              <Button title="החלפה" variant="ghost" icon="swap" style={{ flex: 1 }} onPress={() => setSwap(true)} />
            </Row>
          </Card>

          <Row style={{ marginTop: space.md }}>
            <Button title="הקודם" variant="ghost" icon="chevronBack" style={{ flex: 1 }} disabled={session.current === 0} onPress={() => go(-1)} />
            {session.current < session.exercises.length - 1 ? (
              <Button title="הבא" icon="chevron" style={{ flex: 1 }} onPress={() => go(1)} />
            ) : (
              <Button title="סיום" icon="check" style={{ flex: 1 }} onPress={() => setConfirmEnd(true)} />
            )}
          </Row>
          <Button title="דילוג על התרגיל" variant="soft" icon="skip" style={{ marginTop: 8 }} onPress={() => { mut((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k === s.current ? { ...e, skipped: true } : e)) })); if (session.current < session.exercises.length - 1) go(1); }} />
          <T.Caption style={{ marginTop: space.md, textAlign: 'center' }}>כאב חד או לא רגיל? עצור את התרגיל. אין צורך ״להמשיך בכוח״.</T.Caption>
        </ScrollView>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
          <Button title={paused ? 'המשך' : 'השהיה'} icon={paused ? 'play' : 'pause'} variant={paused ? 'primary' : 'soft'} style={{ flex: 1 }} onPress={() => (paused ? resume(session.id) : pause(session.id))} />
        </View>
      </View>

      <Sheet visible={swap} onClose={() => setSwap(false)} title="החלפת תרגיל">
        {(info?.alternatives ?? []).map((id) => {
          const alt = exerciseById(id);
          return alt ? (
            <ListItem key={id} icon="swap" title={alt.name} subtitle={alt.nameEn} onPress={() => {
              mut((s) => ({ ...s, exercises: s.exercises.map((e, k) => (k === s.current ? { ...e, exerciseId: id, sets: e.sets.map((st) => ({ ...st, done: false, weight: null })) } : e)) }));
              setSwap(false); toast(`הוחלף ל${alt.name}`);
            }} />
          ) : null;
        })}
        {!info?.alternatives.length && <T.Muted>אין חלופות מוגדרות לתרגיל זה.</T.Muted>}
      </Sheet>

      <Sheet visible={confirmEnd} onClose={() => setConfirmEnd(false)} title="לסיים את האימון?">
        <T.Muted style={{ textAlign: 'center', marginBottom: space.md }}>{doneSets} מתוך {totalSets} סטים בוצעו. אימון חלקי נשמר כמו שהוא.</T.Muted>
        <Button title="סיום ושמירה" onPress={() => { const id = session.id; finish(id); setConfirmEnd(false); haptic.success(); router.replace({ pathname: '/workout/summary', params: { id } }); }} />
        <Button title="המשך להתאמן" variant="ghost" style={{ marginTop: 8 }} onPress={() => setConfirmEnd(false)} />
        <Button title="מחיקת האימון" variant="danger" style={{ marginTop: 8 }} onPress={() => { discard(session.id); setConfirmEnd(false); router.replace('/workouts'); }} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: MAX_W, backgroundColor: colors.bg, overflow: 'hidden' },
  rest: { marginTop: space.lg, alignItems: 'center', gap: 10, padding: space.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'rgba(232,120,42,0.08)' },
  th: { ...type.caption, color: colors.text3, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  setDone: { backgroundColor: 'rgba(232,120,42,0.12)', borderColor: colors.borderStrong },
  cell: { flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', color: colors.text, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 17 },
  check: { width: 44, height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accentLight },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', paddingHorizontal: space.md, paddingTop: 12, backgroundColor: 'rgba(11,7,5,0.94)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
