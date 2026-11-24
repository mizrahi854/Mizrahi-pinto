import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, Chip, Tap, Sheet, ListItem, Section, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { PLANS, planById, estimateMinutes } from '@/data/exercises';
import { DAY_LONG, DAY_SHORT, dateKey, weekOf } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

/** 35 Workout plan + 36 weekly schedule */
export default function Workouts() {
  const schedule = useApp((s) => s.schedule);
  const setSchedule = useApp((s) => s.setSchedule);
  const custom = useApp((s) => s.customPlans);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const [filter, setFilter] = useState<'all' | 'gym' | 'home' | 'beginner'>('all');
  const [pickDay, setPickDay] = useState<number | null>(null);
  const week = weekOf(dateKey());
  const done = week.map((d) => sessions.some((s) => s.date === d && s.status === 'done'));
  const planned = Object.values(schedule).filter((x) => x !== 'rest').length;
  const plans = [...custom, ...PLANS].filter((p) => filter === 'all' || (filter === 'beginner' ? p.level === 'beginner' : p.location === filter || p.location === 'any'));

  return (
    <HeroScreen back dotText={`${done.filter(Boolean).length}/${planned}`} label="אימונים השבוע" progress={done.filter(Boolean).length / Math.max(1, planned)} heroHeight={250} tabBar={false}>
      {activeId && (
        <Card highlight onPress={() => router.push('/workout/active')} label="המשך אימון פעיל" style={{ marginBottom: space.md }}>
          <Row><Icon name="play" size={20} /><T.Body style={{ flex: 1, fontFamily: fonts.medium }}>יש אימון פעיל – להמשיך</T.Body><Icon name="chevron" size={18} color={colors.text2} /></Row>
        </Card>
      )}
      <T.H style={{ marginBottom: 8 }}>לוח שבועי</T.H>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {DAY_SHORT.map((d, i) => {
          const p = schedule[i] && schedule[i] !== 'rest' ? planById(schedule[i]!, custom) : undefined;
          return (
            <Tap key={d} onPress={() => setPickDay(i)} label={`יום ${DAY_LONG[i]}: ${p?.name ?? 'מנוחה'}`}>
              <View style={{ width: 46, paddingVertical: 10, borderRadius: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: i === new Date().getDay() ? colors.accent : colors.border, backgroundColor: p ? 'rgba(232,120,42,0.12)' : colors.glass }}>
                <Text style={[type.caption, { color: colors.text2 }]}>{d}</Text>
                <Icon name={done[i] ? 'check' : p ? 'dumbbell' : 'moon'} size={18} color={p || done[i] ? colors.accent : colors.text3} />
                <Text style={{ fontSize: 9, color: colors.text2, fontFamily: fonts.regular }} numberOfLines={1}>{p ? p.name.split(' ')[0] : 'מנוחה'}</Text>
              </View>
            </Tap>
          );
        })}
      </View>

      <Section title="תוכניות">
        <Row style={{ flexWrap: 'wrap', marginBottom: 10 }}>
          {([['all', 'הכל'], ['gym', 'חדר כושר'], ['home', 'בית'], ['beginner', 'מתחילים']] as const).map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
        </Row>
        {plans.map((p) => (
          <Tap key={p.id} onPress={() => router.push(`/workout/${p.id}`)} label={p.name}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}><Icon name={p.location === 'home' ? 'home' : p.id === 'cardio' ? 'bolt' : p.id === 'mobility' ? 'body' : 'dumbbell'} size={24} /></View>
              <View style={{ flex: 1 }}>
                <Row gap={6}><Text style={[type.bodyMedium, { color: colors.text, fontFamily: fonts.semibold }]}>{p.name}</Text>{p.premium && <Badge text="Premium" />}{p.custom && <Badge text="שלי" tone="muted" />}</Row>
                <T.Muted>{p.focus} · {p.exercises.length} תרגילים · ~{estimateMinutes(p)} דק׳</T.Muted>
              </View>
              <Icon name="chevron" size={18} color={colors.text2} />
            </View>
          </Tap>
        ))}
      </Section>
      <Section title="עוד">
        <ListItem icon="body" title="מאגר תרגילים" subtitle="לפי שריר, ציוד וקושי" onPress={() => router.push('/exercises')} />
        <ListItem icon="edit" title="יצירת אימון מותאם" onPress={() => router.push('/workout/builder')} />
        <ListItem icon="clock" title="היסטוריית אימונים ושיאים" onPress={() => router.push('/workout/history')} />
        <ListItem icon="alarm" title="תזכורות אימון" onPress={() => router.push('/alarm')} />
      </Section>
      <T.Caption style={{ marginTop: space.md }}>במקרה של כאב או פציעה – עצור. התוכנית אינה תחליף לאיש מקצוע.</T.Caption>

      <Sheet visible={pickDay != null} onClose={() => setPickDay(null)} title={pickDay != null ? `יום ${DAY_LONG[pickDay]}` : ''}>
        <ListItem icon="moon" title="יום מנוחה" onPress={() => { setSchedule(pickDay!, 'rest'); setPickDay(null); }} right={schedule[pickDay ?? -1] === 'rest' ? <Icon name="check" /> : undefined} />
        {[...custom, ...PLANS.filter((p) => !p.premium)].map((p) => (
          <ListItem key={p.id} icon="dumbbell" title={p.name} subtitle={p.focus} onPress={() => { setSchedule(pickDay!, p.id); setPickDay(null); }} right={schedule[pickDay ?? -1] === p.id ? <Icon name="check" /> : undefined} />
        ))}
      </Sheet>
    </HeroScreen>
  );
}
