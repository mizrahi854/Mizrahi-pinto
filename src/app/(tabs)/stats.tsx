import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { BentoTile } from '@/components/MacroCard';
import { BarChart, LineChart } from '@/components/Charts';
import { Card, Chip, Row, T, Section, Sheet, Stepper, Button, toast, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { isAdult } from '@/lib/nutrition';
import { daysFor, metricSeries, aggregate, bucket, RANGE_DAYS, Range, sessionVolume } from '@/lib/stats';
import { dateKey, addDays } from '@/lib/dates';
import { colors, fonts, space, type } from '@/theme/tokens';

/** 47 Statistics */
export default function Stats() {
  const entries = useApp((s) => s.entries);
  const sessions = useApp((s) => s.sessions);
  const water = useApp((s) => s.water);
  const sleep = useApp((s) => s.sleep);
  const weights = useApp((s) => s.measurements);
  const profile = useApp((s) => s.profile);
  const addMeasurement = useApp((s) => s.addMeasurement);
  const adult = isAdult(profile.age);
  const [range, setRange] = useState<Range>('week');
  const [customDays, setCustomDays] = useState(14);
  const [weighSheet, setWeighSheet] = useState(false);
  const [kg, setKg] = useState(profile.weightKg ?? 70);

  const n = range === 'custom' ? customDays : RANGE_DAYS[range];
  const days = useMemo(() => daysFor(n), [n]);
  const prevDays = useMemo(() => daysFor(n, addDays(days[0] ?? dateKey(), -1)), [n, days]);
  const s = (m: string, d = days) => metricSeries(m, d, entries, sessions, water, sleep, weights);
  const kcal = s('kcal');
  const kcalAgg = aggregate(kcal);
  const prevKcal = aggregate(s('kcal', prevDays));
  const workouts = aggregate(s('workouts'));
  const prevWorkouts = aggregate(s('workouts', prevDays));
  const vol = aggregate(s('volume'));
  const waterAgg = aggregate(s('water'));
  const weightSeries = metricSeries('weight', daysFor(Math.max(n, 7)), entries, sessions, water, sleep, weights).filter((x) => x.value != null);
  const lastW = weights[weights.length - 1];
  const firstW = weights.find((w) => w.date >= daysFor(Math.max(n, 7))[0]!);
  const doneAll = sessions.filter((x) => x.status === 'done');
  const streak = useMemo(() => {
    let c = 0;
    for (let i = 0; i < 365; i++) {
      const d = addDays(dateKey(), -i);
      const any = entries.some((e) => e.date === d) || doneAll.some((x) => x.date === d);
      if (any) c++; else if (i > 0) break;
    }
    return c;
  }, [entries, doneAll]);

  const delta = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100));
  const dk = delta(kcalAgg.avg ?? 0, prevKcal.avg ?? 0);

  return (
    <HeroScreen title="סטטיסטיקה" label="התקדמות, מגמות והישגים" progress={Math.min(1, workouts.sum / Math.max(1, profile.workoutsPerWeek * (n / 7)))} heroHeight={250}>
      <Row style={{ marginBottom: space.md, flexWrap: 'wrap' }}>
        <Chip label="יומי" active={range === 'day'} onPress={() => setRange('day')} />
        <Chip label="שבועי" active={range === 'week'} onPress={() => setRange('week')} />
        <Chip label="חודשי" active={range === 'month'} onPress={() => setRange('month')} />
        <Chip label={range === 'custom' ? `${customDays} ימים` : 'טווח מותאם'} active={range === 'custom'} onPress={() => setRange('custom')} />
      </Row>
      {range === 'custom' && <Card style={{ marginBottom: space.md }}><Row style={{ justifyContent: 'space-between' }}><T.Body>מספר ימים</T.Body><Stepper label="ימים" value={customDays} min={2} max={365} step={7} onChange={(v) => setCustomDays(Math.max(2, v))} /></Row></Card>}

      <View style={{ gap: 10 }}>
        <Row gap={10}>
          {adult && <BentoTile icon="flame" title={n === 1 ? 'קלוריות היום' : 'ממוצע יומי'} value={kcalAgg.avg != null ? Math.round(kcalAgg.avg).toLocaleString() : '—'} unit="קק״ל" ring={false} onPress={() => router.push('/stats/kcal')} />}
          <BentoTile icon="dumbbell" title="אימונים שהושלמו" value={String(workouts.sum)} ring={false} onPress={() => router.push('/stats/workouts')} />
        </Row>
        <Row gap={10}>
          {adult && <BentoTile icon="weight" title="משקל" value={lastW ? lastW.weightKg.toFixed(1) : '—'} unit="ק״ג" ring={false} onPress={() => setWeighSheet(true)} accessibilityHint="הוספת מדידה" />}
          <BentoTile icon="drop" title="שתייה ממוצעת" value={waterAgg.avg != null ? waterAgg.avg.toFixed(1) : '—'} unit="ליטר" ring={false} onPress={() => router.push('/stats/water')} />
        </Row>
        <BentoTile wide icon="bolt" title="רצף ימים פעילים" value={`${streak} ימים`} ring={false} onPress={() => router.push('/stats/sets')} />
      </View>

      {adult && (
        <Card style={{ marginTop: space.md }} onPress={() => router.push('/stats/kcal')} label="גרף קלוריות">
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <View><T.H>קלוריות</T.H><T.Muted>{kcalAgg.count} ימים תועדו · חסרים לא נספרים</T.Muted></View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[type.title, { color: colors.text, fontVariant: ['tabular-nums'] }]}>{kcalAgg.sum.toLocaleString()}</Text>
              <T.Caption>סה״כ בתקופה</T.Caption>
            </View>
          </Row>
          <BarChart data={bucket(kcal, 7)} unit="קק״ל" target={profile.calorieTarget ?? undefined} />
          {dk != null && <T.Caption style={{ marginTop: 6 }}>לעומת התקופה הקודמת: {dk > 0 ? '+' : ''}{dk}% בממוצע יומי</T.Caption>}
        </Card>
      )}

      {adult && (
        <Card style={{ marginTop: space.md }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <T.H>מגמת משקל</T.H>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[type.title, { color: colors.text }]}>{lastW ? `${lastW.weightKg.toFixed(1)} ק״ג` : '—'}</Text>
              {lastW && firstW && firstW !== lastW && <T.Caption>{(lastW.weightKg - firstW.weightKg > 0 ? '+' : '') + (lastW.weightKg - firstW.weightKg).toFixed(1)} ק״ג בתקופה</T.Caption>}
            </View>
          </Row>
          <LineChart data={weightSeries} unit="ק״ג" />
          <Button title="הוספת מדידה" variant="soft" icon="plus" onPress={() => setWeighSheet(true)} style={{ marginTop: 8 }} />
          <T.Caption style={{ marginTop: 6 }}>מדידות אופציונליות ופרטיות. ללא ציון גוף או הבטחה לתוצאה.</T.Caption>
        </Card>
      )}

      <Card style={{ marginTop: space.md }} onPress={() => router.push('/stats/volume')} label="נפח אימונים">
        <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <T.H>נפח אימונים</T.H>
          <T.Muted>{Math.round(vol.sum).toLocaleString()} ק״ג · {workouts.sum} אימונים {prevWorkouts.sum ? `(קודם: ${prevWorkouts.sum})` : ''}</T.Muted>
        </Row>
        <BarChart data={bucket(s('volume'), 7)} unit="ק״ג" height={150} />
      </Card>

      <Section title="עוד מדדים">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[['sets', 'סטים'], ['minutes', 'זמן פעילות'], ['protein', 'חלבון'], ['carbs', 'פחמימות'], ['fat', 'שומנים'], ['water', 'שתייה'], ['sleep', 'שינה']].map(([k, l]) => (
            <Chip key={k} label={l!} onPress={() => router.push(`/stats/${k}`)} />
          ))}
        </View>
      </Section>

      <Card style={{ marginTop: space.lg }} onPress={() => router.push('/report')} label="דוח שבועי">
        <Row><Icon name="list" size={24} /><View style={{ flex: 1 }}><T.Body style={{ fontFamily: fonts.medium }}>דוח שבועי</T.Body><T.Muted>סיכום השבוע · ניתוח מתקדם ב-Premium</T.Muted></View><Badge text="Premium" /></Row>
      </Card>
      <T.Caption style={{ marginTop: space.md, textAlign: 'center' }}>{doneAll.length} אימונים בסך הכל · {doneAll.reduce((m, x) => m + sessionVolume(x).sets, 0)} סטים</T.Caption>

      <Sheet visible={weighSheet} onClose={() => setWeighSheet(false)} title="מדידת משקל">
        <Stepper label="משקל" value={kg} step={0.1} onChange={(v) => setKg(+v.toFixed(1))} unit="ק״ג" min={30} max={300} />
        <Button title="שמירה להיום" style={{ marginTop: space.lg }} onPress={() => { addMeasurement(kg); setWeighSheet(false); toast('המדידה נשמרה'); }} />
      </Sheet>
    </HeroScreen>
  );
}
