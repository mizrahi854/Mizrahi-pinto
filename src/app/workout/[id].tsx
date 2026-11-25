import React, { useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { LightScreen, LCard, Segmented, LPrimary, LIconButton, ls } from '@/components/light';
import { Tap, Row, Sheet, ListItem, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { BodyMap } from '@/components/BodyMap';
import { useApp } from '@/store/useApp';
import { planById, exerciseById, estimateMinutes, MUSCLE_LABELS, EQUIPMENT_LABELS } from '@/data/exercises';
import { EXERCISE_ART } from '@/data/media';
import { sessionVolume } from '@/lib/stats';
import { prettyDate, diffDays, dateKey } from '@/lib/dates';
import { light, fonts, radius, space } from '@/theme/tokens';

/** Workout details – approved light "Push Day" screen */
export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const custom = useApp((s) => s.customPlans);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const schedule = useApp((s) => s.schedule);
  const profile = useApp((s) => s.profile);
  const start = useApp((s) => s.startWorkout);
  const deleteCustom = useApp((s) => s.deleteCustomPlan);
  const [tab, setTab] = useState<'ex' | 'sum' | 'hist'>('ex');
  const [menu, setMenu] = useState(false);
  const plan = planById(id ?? '', custom);
  if (!plan) {
    return <LightScreen title="אימון"><Text style={[ls.body, { textAlign: 'center', marginTop: 40 }]}>האימון לא נמצא</Text></LightScreen>;
  }
  const active = sessions.find((s) => s.id === activeId && s.planId === plan.id && s.status !== 'done');
  const history = sessions.filter((s) => s.planId === plan.id && s.status === 'done').sort((a, b) => b.startedAt - a.startedAt);
  const last = history[0];
  const doneToday = last && last.date === dateKey() ? last : undefined;
  const isDone = (exId: string) => {
    const src = active ?? doneToday;
    const e = src?.exercises.find((x) => x.exerciseId === exId);
    return !!e && e.sets.length > 0 && e.sets.every((s) => s.done);
  };
  const weekPlanned = Object.values(schedule).filter((x) => x !== 'rest').length;
  const weekDone = sessions.filter((s) => s.status === 'done' && Date.now() - s.startedAt < 7 * 86400000).length;
  const totalWeeks = Math.round(profile.planDays / 7);
  const weekNo = Math.min(totalWeeks, Math.max(1, Math.floor(diffDays(profile.targetsSince ?? dateKey(), dateKey()) / 7) + 1));
  const totalSets = plan.exercises.reduce((m, e) => m + e.sets, 0);
  const muscles = [...new Set(plan.exercises.flatMap((e) => exerciseById(e.exerciseId)?.primary ?? []))];
  const secondary = [...new Set(plan.exercises.flatMap((e) => exerciseById(e.exerciseId)?.secondary ?? []))].filter((m) => !muscles.includes(m));
  const heading = plan.id === 'cardio' ? 'אימון אירובי' : plan.id === 'mobility' ? 'גמישות' : plan.location === 'home' ? 'אימון בית' : 'אימון כוח';

  const go = () => {
    if (plan.premium) return router.push('/premium');
    start(plan.id);
    router.push('/workout/active');
  };

  return (
    <LightScreen
      title={heading}
      heroHeight={176}
      hero={
        <View style={styles.hero}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.badge}><Icon name="dumbbell" size={14} color={light.accent} /><Text style={styles.badgeText}>תוכנית אימון</Text></View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.focus}>{plan.focus}</Text>
          </View>
          <View style={styles.figure}>
            <BodyMap single primary={muscles} secondary={secondary} size={84} />
          </View>
        </View>
      }
      right={<LIconButton icon="dots" label="אפשרויות" onPress={() => setMenu(true)} />}
      footer={<LPrimary title={plan.premium ? 'זמין ב-Premium' : active ? 'המשך אימון' : 'התחל אימון'} icon={plan.premium ? 'lock' : 'play'} onPress={go} />}
    >
      {/* progress strip */}
      <LCard style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
        <Row style={{ flex: 1 }} gap={12}>
          <MiniRing value={weekDone / Math.max(1, weekPlanned)} />
          <View>
            <Text style={styles.big}>{`⁦${weekDone}/${weekPlanned}⁩`}</Text>
            <Text style={ls.muted}>אימונים הושלמו</Text>
          </View>
        </Row>
        <View style={styles.vDivider} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.big}>שבוע {weekNo}</Text>
          <Text style={ls.muted}>מתוך {totalWeeks}</Text>
        </View>
      </LCard>

      <Row gap={8} style={{ marginTop: space.md, marginBottom: space.lg }}>
        <Stat icon="layers" value={String(totalSets)} label="סטים" />
        <Stat icon="clock" value={`≈ ${estimateMinutes(plan)}`} label="דקות" />
        <Stat icon="dumbbell" value={String(plan.exercises.length)} label="תרגילים" />
      </Row>

      <Segmented value={tab} onChange={setTab} options={[{ key: 'ex', label: 'תרגילים' }, { key: 'sum', label: 'סיכום' }, { key: 'hist', label: 'היסטוריה' }]} />

      {tab === 'ex' && (
        <View style={{ marginTop: space.md, gap: 10 }}>
          {plan.exercises.map((pe, i) => {
            const ex = exerciseById(pe.exerciseId);
            if (!ex) return null;
            const done = isDone(ex.id);
            const art = EXERCISE_ART[ex.id];
            return (
              <Tap key={pe.exerciseId + i} onPress={() => router.push(`/exercise/${ex.id}`)} label={`${ex.name}, ${pe.sets} סטים${done ? ', הושלם' : ''}`}>
                <View style={styles.exRow}>
                  <View style={[styles.check, done && styles.checkOn]}>{done && <Icon name="check" size={18} color="#fff" strokeWidth={2.6} />}</View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                    <Text style={ls.muted}>{ex.primary.map((m) => MUSCLE_LABELS[m]).join(' · ')}</Text>
                    <Row gap={6} style={{ marginTop: 4 }}>
                      <View style={ls.chip}><Text style={ls.chipText}>{pe.sets} סטים</Text></View>
                      <View style={ls.chip}><Text style={ls.chipText}>{pe.seconds ? `${pe.seconds} שנ׳` : `⁦${pe.repsMin} – ${pe.repsMax}⁩ חזרות`}</Text></View>
                    </Row>
                  </View>
                  <View style={styles.exArt}>
                    {art ? <Image source={art} style={{ width: 92, height: 92 }} contentFit="contain" accessibilityLabel={`איור: ${ex.name}`} /> : <Icon name={ex.kind === 'cardio' ? 'bolt' : ex.kind === 'mobility' ? 'body' : 'dumbbell'} size={34} color={light.accent} />}
                  </View>
                  <Icon name="chevron" size={20} color={light.text} />
                </View>
              </Tap>
            );
          })}
          <Text style={[ls.caption, { textAlign: 'center' }]}>איורים: Everkinetic (CC BY-SA 3.0) · כאב חד? עצור והתייעץ עם איש מקצוע.</Text>
        </View>
      )}

      {tab === 'sum' && (
        <View style={{ marginTop: space.md, gap: 10 }}>
          <LCard style={{ gap: 8 }}>
            <Text style={ls.bodyStrong}>שרירים עיקריים</Text>
            <Text style={ls.body}>{muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')}</Text>
            {secondary.length > 0 && <Text style={ls.muted}>משניים: {secondary.map((m) => MUSCLE_LABELS[m]).join(' · ')}</Text>}
          </LCard>
          <LCard style={{ gap: 8 }}>
            <Text style={ls.bodyStrong}>ציוד</Text>
            <Text style={ls.body}>{[...new Set(plan.exercises.map((e) => exerciseById(e.exerciseId)?.equipment).filter(Boolean))].map((e) => EQUIPMENT_LABELS[e!]).join(' · ')}</Text>
          </LCard>
          <LCard style={{ gap: 8 }}>
            <Text style={ls.bodyStrong}>פעם קודמת</Text>
            <Text style={ls.body}>{last ? `${prettyDate(last.date)} · ${sessionVolume(last).minutes} דק׳ · ${sessionVolume(last).sets} סטים · ${sessionVolume(last).volume.toLocaleString()} ק״ג נפח` : 'עוד לא בוצע'}</Text>
          </LCard>
        </View>
      )}

      {tab === 'hist' && (
        <View style={{ marginTop: space.md, gap: 10 }}>
          {history.length === 0 ? <Text style={[ls.muted, { textAlign: 'center', marginTop: 20 }]}>עוד אין אימונים קודמים בתוכנית זו.</Text> : history.map((h) => {
            const v = sessionVolume(h);
            return (
              <LCard key={h.id} onPress={() => router.push({ pathname: '/workout/summary', params: { id: h.id } })} label={prettyDate(h.date)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="calendar" size={22} color={light.accent} />
                <View style={{ flex: 1 }}><Text style={ls.bodyStrong}>{prettyDate(h.date)}</Text><Text style={ls.muted}>{v.minutes} דק׳ · {v.sets} סטים · {v.volume.toLocaleString()} ק״ג</Text></View>
                <Icon name="chevron" size={18} color={light.text2} />
              </LCard>
            );
          })}
        </View>
      )}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={plan.name}>
        <ListItem icon="body" title="מאגר תרגילים" onPress={() => { setMenu(false); router.push('/exercises'); }} />
        <ListItem icon="calendar" title="לוח אימונים שבועי" onPress={() => { setMenu(false); router.push('/workouts'); }} />
        <ListItem icon="edit" title="יצירת אימון מותאם" onPress={() => { setMenu(false); router.push('/workout/builder'); }} />
        {plan.custom && <ListItem icon="trash" danger title="מחיקת האימון" onPress={() => { deleteCustom(plan.id); setMenu(false); toast('האימון נמחק'); goBack(); }} />}
      </Sheet>
    </LightScreen>
  );
}

function MiniRing({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const size = 54, st = 6, r = (size - st) / 2, c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={light.track} strokeWidth={st} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={light.accent} strokeWidth={st} fill="none" strokeDasharray={`${c * v} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={18} color={light.text} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={ls.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  big: { fontFamily: fonts.bold, fontSize: 22, color: light.text },
  vDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: light.border, marginHorizontal: 8 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  focus: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  figure: { width: 100, alignItems: 'center', marginTop: -6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(242,107,29,0.22)' },
  badgeText: { fontFamily: fonts.medium, fontSize: 13, color: '#fff' },
  planName: { fontFamily: fonts.bold, fontSize: 36, lineHeight: 42, color: '#fff' },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 16, backgroundColor: light.cardSoft },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: light.text },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.lg, backgroundColor: light.card },
  check: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#D9D4D0', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: light.accent, borderColor: light.accent },
  exName: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  exArt: { width: 100, height: 100, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
