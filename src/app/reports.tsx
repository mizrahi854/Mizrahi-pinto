import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { HeroScreen } from '@/components/HeroScreen';
import { BarChart, LineChart } from '@/components/Charts';
import { DotMatrix } from '@/components/DotMatrix';
import { Chip, Row, T, Section, Sheet, Stepper, Button, Tap, toast, Badge } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, tracksCalories } from '@/store/useApp';
import { daysFor, metricSeries, aggregate, bucket, RANGE_DAYS, Range } from '@/lib/stats';
import { dateKey, addDays } from '@/lib/dates';
import { colors, fonts, radius, space } from '@/theme/tokens';

/** Reports & statistics (moved from the tab bar to Profile) – approved structure: dot headline, glass tiles, weekly calories bars, weight trend */
export default function Stats() {
  const entries = useApp((s) => s.entries);
  const workoutsList = useApp((s) => s.workouts);
  const water = useApp((s) => s.water);
  const sleep = useApp((s) => s.sleep);
  const weights = useApp((s) => s.measurements);
  const profile = useApp((s) => s.profile);
  const addMeasurement = useApp((s) => s.addMeasurement);
  const adult = tracksCalories(profile);
  const [range, setRange] = useState<Range>('week');
  const [customDays, setCustomDays] = useState(14);
  const [weighSheet, setWeighSheet] = useState(false);
  const [kg, setKg] = useState(profile.weightKg ?? 70);

  const n = range === 'custom' ? customDays : RANGE_DAYS[range];
  const days = useMemo(() => daysFor(n), [n]);
  const prevDays = useMemo(() => daysFor(n, addDays(days[0] ?? dateKey(), -1)), [n, days]);
  const s = (m: string, d = days) => metricSeries(m, d, entries, workoutsList, water, sleep, weights);
  const kcal = s('kcal');
  const kcalAgg = aggregate(kcal);
  const prevKcal = aggregate(s('kcal', prevDays));
  const workouts = aggregate(s('workouts'));
  const waterToday = (water[dateKey()] ?? 0) / 1000;
  const planned = workoutsList.filter((w) => !w.rest && w.status !== 'skipped' && days.includes(w.date)).length;
  const weightDays = daysFor(Math.max(n, 7));
  const weightSeries = metricSeries('weight', weightDays, entries, workoutsList, water, sleep, weights).filter((x) => x.value != null);
  const withW = weights.filter((w) => w.weightKg != null) as { date: string; weightKg: number }[];
  const lastW = withW[withW.length - 1];
  const firstW = withW.find((w) => w.date >= weightDays[0]!);
  const delta = lastW && firstW && firstW !== lastW ? +(lastW.weightKg - firstW.weightKg).toFixed(1) : null;
  const dk = prevKcal.avg ? Math.round((((kcalAgg.avg ?? 0) - prevKcal.avg) / prevKcal.avg) * 100) : null;
  const periodWord = n === 1 ? 'היום' : n === 7 ? 'השבוע' : `${n} ימים`;

  return (
    <HeroScreen back tabBar={false} dotText="דוחות" dotSize={4.3} label="התקדמות, מגמות והישגים" progress={Math.min(1, workouts.sum / Math.max(1, planned))} heroHeight={250}>
      <View style={styles.panelBox}>
        <Row gap={8}>
          {adult && <StatTile icon="flame" title={n === 7 ? 'קלוריות שבועיות' : `קלוריות · ${periodWord}`} dot={kcalAgg.sum ? kcalAgg.sum.toLocaleString('en-US') : '0'} onPress={() => router.push('/stats/kcal')} />}
          <StatTile icon="drop" title="שתיית מים (ליטר)" value={waterToday.toFixed(1)} target={(profile.waterTargetMl / 1000).toFixed(1)} onPress={() => router.push('/stats/water')} />
        </Row>
        <Row gap={8}>
          {adult && <StatTile icon="weight" title="משקל" dot={lastW ? lastW.weightKg.toFixed(1) : '-'} unit="ק״ג" onPress={() => setWeighSheet(true)} />}
          <StatTile icon="dumbbell" title="אימונים שהושלמו" value={String(workouts.sum)} target={String(planned)} onPress={() => router.push('/stats/workouts')} />
        </Row>
      </View>

      {adult && (
        <GlowCard onPress={() => router.push('/stats/kcal')} label="גרף קלוריות">
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <Text style={styles.cardTitle}>{n === 7 ? 'קלוריות שבועיות' : `קלוריות · ${periodWord}`}</Text>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <DotMatrix text={kcalAgg.sum.toLocaleString('en-US')} dot={3.6} gap={1.6} />
              <T.Caption style={{ color: colors.text2 }}>סה״כ {periodWord}{kcalAgg.count < n ? ` · ${kcalAgg.count} ימים תועדו` : ''}</T.Caption>
            </View>
          </Row>
          <BarChart data={bucket(kcal, 7)} unit="קק״ל" target={profile.calorieTarget ?? undefined} />
          {dk != null && <T.Caption style={{ marginTop: 6, color: colors.text2 }}>לעומת התקופה הקודמת: {dk > 0 ? '+' : ''}{dk}% בממוצע יומי · ימים חסרים לא נספרים</T.Caption>}
        </GlowCard>
      )}

      {adult && (
        <GlowCard onPress={() => setWeighSheet(true)} label="מגמת משקל – הוספת מדידה">
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <Text style={styles.cardTitle}>מגמת משקל</Text>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Row gap={6}>
                <Text style={styles.unit}>ק״ג</Text>
                <DotMatrix text={lastW ? lastW.weightKg.toFixed(1) : '-'} dot={3.6} gap={1.6} />
              </Row>
              {delta != null && <T.Caption style={{ color: colors.text2 }}>{`⁦${delta > 0 ? '+' : ''}${delta}⁩`} ק״ג ({weightDays.length} ימים)</T.Caption>}
            </View>
          </Row>
          <LineChart data={weightSeries} unit="ק״ג" />
          <T.Caption style={{ marginTop: 6, color: colors.text3 }}>לחיצה להוספת מדידה · מדידות אופציונליות ופרטיות</T.Caption>
        </GlowCard>
      )}

      <Row style={{ marginTop: space.lg, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Chip label="יומי" active={range === 'day'} onPress={() => setRange('day')} />
        <Chip label="שבועי" active={range === 'week'} onPress={() => setRange('week')} />
        <Chip label="חודשי" active={range === 'month'} onPress={() => setRange('month')} />
        <Chip label={range === 'custom' ? `${customDays} ימים` : 'טווח מותאם'} active={range === 'custom'} onPress={() => setRange('custom')} />
      </Row>
      {range === 'custom' && <Row style={{ justifyContent: 'center', marginTop: 10 }}><Stepper label="ימים" value={customDays} min={2} max={365} step={7} onChange={(v) => setCustomDays(Math.max(2, v))} /></Row>}

      <Section title="עוד מדדים">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[['volume', 'נפח אימונים'], ['sets', 'סטים'], ['minutes', 'זמן פעילות'], ['protein', 'חלבון'], ['carbs', 'פחמימות'], ['fat', 'שומנים'], ['sleep', 'שינה']].map(([k, l]) => (
            <Chip key={k} label={l!} onPress={() => router.push(`/stats/${k}`)} />
          ))}
        </View>
      </Section>
      <Tap onPress={() => router.push('/report')} label="דוח שבועי">
        <View style={[styles.tile, { marginTop: space.lg, minHeight: 64 }]}>
          <Row><Icon name="list" size={22} /><View style={{ flex: 1 }}><Text style={styles.tileTitle}>דוח שבועי</Text><T.Caption style={{ color: colors.text2 }}>סיכום · ניתוח מתקדם ב-Premium</T.Caption></View><Badge text="Premium" /></Row>
        </View>
      </Tap>

      <Sheet visible={weighSheet} onClose={() => setWeighSheet(false)} title="מדידת משקל">
        <Stepper label="משקל" value={kg} step={0.1} onChange={(v) => setKg(+v.toFixed(1))} unit="ק״ג" min={30} max={300} />
        <Button title="שמירה להיום" style={{ marginTop: space.lg }} onPress={() => { addMeasurement(kg); setWeighSheet(false); toast('המדידה נשמרה'); }} />
      </Sheet>
    </HeroScreen>
  );
}

function StatTile({ icon, title, value, dot, target, unit, onPress }: { icon: IconName; title: string; value?: string; dot?: string; target?: string; unit?: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={`${title}: ${dot ?? value}${target ? ` מתוך ${target}` : ''} ${unit ?? ''}`} style={{ flex: 1 }}>
      <View style={styles.tile}>
        <LinearGradient colors={['rgba(245,121,37,0.14)', 'rgba(245,121,37,0.02)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <Row style={{ justifyContent: 'space-between' }}>
          <Icon name="chevron" size={14} color={colors.text2} />
          <View style={{ flex: 1, alignItems: 'flex-start', paddingHorizontal: 6, gap: 6, minWidth: 0 }}>
            <Text style={styles.tileTitle} numberOfLines={2}>{title}</Text>
            {dot != null ? (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 6, alignSelf: 'flex-start' }}>
                {unit ? <Text style={styles.unit}>{unit}</Text> : null}
                <DotMatrix text={dot} dot={2.7} gap={1.25} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', gap: 4, alignSelf: 'flex-start' }}>
                <Text style={styles.value}>{value}</Text>
                {target ? <Text style={styles.unit}>/ {target}</Text> : null}
                {unit ? <Text style={styles.unit}>{unit}</Text> : null}
              </View>
            )}
          </View>
          <Icon name={icon} size={24} color={colors.accentLight} />
        </Row>
      </View>
    </Tap>
  );
}

function GlowCard({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={styles.glow}>
        <LinearGradient colors={['rgba(245,121,37,0.18)', 'rgba(28,29,32,0.0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {children}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  panelBox: { gap: 8, padding: 8, borderRadius: radius.xl, backgroundColor: 'rgba(40,22,12,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  tile: { minHeight: 82, paddingVertical: 12, paddingHorizontal: 9, borderRadius: radius.md, backgroundColor: 'rgba(30,17,10,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', overflow: 'hidden', justifyContent: 'center' },
  tileTitle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.text },
  value: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.text2 },
  glow: { marginTop: space.md, padding: 16, borderRadius: radius.xl, backgroundColor: 'rgba(26,15,9,0.95)', borderWidth: 1, borderColor: 'rgba(245,121,37,0.4)', overflow: 'hidden' },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
});
