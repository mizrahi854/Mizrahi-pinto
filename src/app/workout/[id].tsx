import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, Tap, Button, Empty, Screen, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { DottedProgress } from '@/components/DottedProgress';
import { useApp } from '@/store/useApp';
import { planById, exerciseById, estimateMinutes, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';
import { sessionVolume } from '@/lib/stats';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

const EQ_ICON: Record<string, IconName> = { barbell: 'dumbbell', dumbbell: 'dumbbell', machine: 'layers', cable: 'repeat', bodyweight: 'body', band: 'repeat', kettlebell: 'weight', none: 'bolt' };

/** Workout details (approved "Push Day" screen) */
export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const custom = useApp((s) => s.customPlans);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const start = useApp((s) => s.startWorkout);
  const deleteCustom = useApp((s) => s.deleteCustomPlan);
  const plan = planById(id ?? '', custom);
  if (!plan) return <Screen title="אימון"><Empty title="האימון לא נמצא" /></Screen>;
  const active = sessions.find((s) => s.id === activeId && s.planId === plan.id && s.status !== 'done');
  const last = [...sessions].reverse().find((s) => s.planId === plan.id && s.status === 'done');
  const lastVol = last ? sessionVolume(last).volume : null;
  const doneEx = active ? active.exercises.filter((e) => e.sets.every((s) => s.done)).length : 0;
  const go = () => {
    if (plan.premium) return router.push('/premium');
    start(plan.id);
    router.push('/workout/active');
  };

  return (
    <HeroScreen back title={plan.name} label={plan.focus} heroHeight={300} progress={plan.exercises.length ? doneEx / plan.exercises.length : 0} tabBar={false}
      above={
        <Row style={{ marginTop: 10 }} gap={8}>
          <Pill icon="dumbbell" v={lastVol != null ? (lastVol >= 1000 ? `${(lastVol / 1000).toFixed(1)}K` : String(lastVol)) : '—'} l="נפח אחרון" />
          <Pill icon="layers" v={String(plan.exercises.length)} l="תרגילים" />
          <Pill icon="timer" v={String(estimateMinutes(plan))} l="דקות" />
        </Row>
      }
      menu={plan.custom ? () => { deleteCustom(plan.id); toast('האימון נמחק'); router.back(); } : undefined}
    >
      <Card style={{ padding: 18 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T.Muted>התקדמות אימון</T.Muted>
          <Tap onPress={go} label={active ? 'המשך אימון' : 'התחלת אימון'}>
            <View style={styles.play}><Icon name={plan.premium ? 'lock' : 'play'} size={22} color="#fff" /></View>
          </Tap>
        </Row>
        <View style={{ marginTop: 8 }}><DottedProgress value={plan.exercises.length ? doneEx / plan.exercises.length : 0} /></View>
        <Text style={[type.label, { color: colors.text2, textAlign: 'center', marginTop: 6 }]}>{String(doneEx).padStart(2, '0')} / {String(plan.exercises.length).padStart(2, '0')} הושלמו</Text>
      </Card>

      {plan.exercises.map((pe, i) => {
        const ex = exerciseById(pe.exerciseId);
        if (!ex) return null;
        const first = i === 0;
        return (
          <Tap key={pe.exerciseId + i} onPress={() => router.push(`/exercise/${ex.id}`)} label={`${ex.name}, ${pe.sets} סטים`}>
            <View style={[styles.ex, first && styles.exFirst]}>
              <Row>
                <View style={[styles.exIcon, first && { width: 64, height: 64 }]}><Icon name={EQ_ICON[ex.equipment] ?? 'dumbbell'} size={first ? 30 : 24} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.bodyMedium, { color: colors.text, fontFamily: fonts.semibold, fontSize: first ? 18 : 15.5 }]}>{ex.name}</Text>
                  <Text style={[type.label, { color: colors.text2 }]}>{ex.nameEn}</Text>
                </View>
                {!first && (
                  <Row gap={10}>
                    <View style={{ alignItems: 'center' }}><Icon name="layers" size={16} /><T.Caption>{pe.sets} סטים</T.Caption></View>
                    <View style={{ alignItems: 'center' }}><T.Body style={{ fontFamily: fonts.medium }}>{pe.seconds ? `${pe.seconds}″` : `${pe.repsMin}-${pe.repsMax}`}</T.Body><T.Caption>{pe.seconds ? 'שניות' : 'חזרות'}</T.Caption></View>
                  </Row>
                )}
                <Icon name="chevron" size={18} color={colors.text2} />
              </Row>
              {first && (
                <Row style={{ justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                  <Mini icon="layers" t={`${pe.sets} סטים`} />
                  <Mini icon="repeat" t={pe.seconds ? `${pe.seconds} שניות` : `${pe.repsMin}-${pe.repsMax} חזרות`} />
                  <Mini icon="weight" t={last?.exercises.find((e) => e.exerciseId === ex.id)?.sets[0]?.weight != null ? `${last!.exercises.find((e) => e.exerciseId === ex.id)!.sets[0]!.weight} ק״ג (קודם)` : EQUIPMENT_LABELS[ex.equipment]} />
                </Row>
              )}
            </View>
          </Tap>
        );
      })}
      <Button title={plan.premium ? 'זמין ב-Premium' : active ? 'המשך אימון' : 'התחלת אימון'} icon={plan.premium ? 'lock' : 'play'} onPress={go} style={{ marginTop: space.md }} />
      <T.Caption style={{ textAlign: 'center', marginTop: 8 }}>שרירים: {[...new Set(plan.exercises.flatMap((e) => exerciseById(e.exerciseId)?.primary ?? []))].map((m) => MUSCLE_LABELS[m]).join(' · ')}</T.Caption>
    </HeroScreen>
  );
}

function Pill({ icon, v, l }: { icon: IconName; v: string; l: string }) {
  return (
    <View style={styles.pill} accessible accessibilityLabel={`${l}: ${v}`}>
      <Row gap={6}><Icon name={icon} size={18} /><Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 18 }}>{v}</Text></Row>
      <Text style={[type.caption, { color: colors.text2 }]}>{l}</Text>
    </View>
  );
}
function Mini({ icon, t }: { icon: IconName; t: string }) {
  return <View style={{ alignItems: 'center', gap: 4 }}><Icon name={icon} size={18} color={colors.text2} /><Text style={[type.label, { color: colors.text, fontFamily: fonts.medium }]}>{t}</Text></View>;
}

const styles = StyleSheet.create({
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.emberMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accentLight },
  ex: { marginTop: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  exFirst: { borderColor: colors.accent, backgroundColor: 'rgba(232,120,42,0.10)', padding: 16 },
  exIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(30,18,11,0.7)', borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', minWidth: 92 },
});
