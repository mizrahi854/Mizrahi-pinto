import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, T, Section, ProgressBar, ListItem, Empty } from '@/components/ui';
import { DotNumber } from '@/components/DotMatrix';
import { BarChart } from '@/components/Charts';
import { useApp } from '@/store/useApp';
import { useDay, rangeDays } from '@/store/selectors';
import { dateKey, DAY_SHORT, parseKey } from '@/lib/dates';
import { sumNutrients, fmt } from '@/lib/nutrition';
import { space } from '@/theme/tokens';

const META = {
  protein: { title: 'חלבון', key: 'proteinTarget' as const, tip: 'מקורות נפוצים: עוף, דגים, ביצים, מוצרי חלב, קטניות וטופו.' },
  carbs: { title: 'פחמימות', key: 'carbsTarget' as const, tip: 'מקור אנרגיה מרכזי לאימונים: דגנים, פירות, תפוחי אדמה וקטניות.' },
  fat: { title: 'שומנים', key: 'fatTarget' as const, tip: 'חלק חשוב בתזונה: שמן זית, אגוזים, טחינה, אבוקדו ודגים.' },
};

/** 28/29/30 Macro breakdown */
export default function MacroDetail() {
  const { type: tp } = useLocalSearchParams<{ type: 'protein' | 'carbs' | 'fat' }>();
  const m = META[tp ?? 'protein'] ?? META.protein;
  const k = (tp ?? 'protein') as 'protein' | 'carbs' | 'fat';
  const day = useDay(dateKey());
  const entries = useApp((s) => s.entries);
  const target = day.target[m.key];
  const value = day.totals[k];
  const days = rangeDays(7);
  const series = days.map((d) => {
    const l = entries.filter((e) => e.date === d);
    return { label: DAY_SHORT[parseKey(d).getDay()]!, value: l.length ? sumNutrients(l.map((e) => e.nutrients))[k] : null };
  });
  const top = [...day.list].filter((e) => e.nutrients[k] != null).sort((a, b) => (b.nutrients[k] ?? 0) - (a.nutrients[k] ?? 0));

  return (
    <Screen title={m.title}>
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <DotNumber value={Math.round(value)} dot={7} gap={2.8} label={`${Math.round(value)} גרם ${m.title}`} />
        <T.Muted>גרם היום{target ? ` מתוך ${target}` : ''}</T.Muted>
        {target ? <ProgressBar value={value / target} style={{ alignSelf: 'stretch', marginTop: 6 }} /> : null}
        {day.totals.partial[k] && <T.Caption>חלק מהפריטים ללא ערך ידוע</T.Caption>}
      </Card>
      <Section title="7 הימים האחרונים">
        <Card><BarChart data={series} unit="ג׳" target={target ?? undefined} /></Card>
      </Section>
      <Section title="מקורות היום">
        {top.length === 0 ? <Empty icon="bowl" title="עוד לא תועד" action="הוספת מזון" onAction={() => router.push('/foods')} /> : top.map((e) => (
          <ListItem key={e.id} icon="bowl" title={e.name} subtitle={`${e.amount} ${e.unitLabel}`} right={<T.Body>{fmt(e.nutrients[k], ' ג׳')}</T.Body>} />
        ))}
      </Section>
      <T.Caption style={{ marginTop: space.md }}>{m.tip}</T.Caption>
    </Screen>
  );
}
