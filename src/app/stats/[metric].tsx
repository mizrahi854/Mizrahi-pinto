import React, { useState } from 'react';
import { Platform, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, Chip, Row, T, Section, Button, toast } from '@/components/ui';
import { BarChart, LineChart } from '@/components/Charts';
import { useApp } from '@/store/useApp';
import { daysFor, metricSeries, aggregate, bucket, METRICS } from '@/lib/stats';
import { prettyDate } from '@/lib/dates';
import { space } from '@/theme/tokens';

/** 48 Chart detail + CSV export */
export default function MetricDetail() {
  const { metric } = useLocalSearchParams<{ metric: string }>();
  const meta = METRICS[metric ?? 'kcal'] ?? METRICS.kcal!;
  const st = useApp();
  const [n, setN] = useState(7);
  const days = daysFor(n);
  const series = metricSeries(metric ?? 'kcal', days, st.entries, st.sessions, st.water, st.sleep, st.measurements);
  const prev = metricSeries(metric ?? 'kcal', daysFor(n, days[0] ? daysFor(2, days[0])[0] : undefined), st.entries, st.sessions, st.water, st.sleep, st.measurements);
  const a = aggregate(series), b = aggregate(prev);
  const target = metric === 'kcal' ? st.profile.calorieTarget : metric === 'protein' ? st.profile.proteinTarget : metric === 'water' ? st.profile.waterTargetMl / 1000 : undefined;

  const exportCsv = async () => {
    const csv = ['date,value,unit', ...series.map((x) => `${x.date},${x.value ?? ''},${meta.unit}`)].join('\n');
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${metric}.csv`; link.click();
    } else {
      await Share.share({ message: csv, title: `${meta.title}.csv` }).catch(() => toast('הייצוא בוטל'));
    }
  };

  return (
    <Screen title={meta.title}>
      <Row style={{ marginBottom: space.md }}>
        {[7, 30, 90].map((d) => <Chip key={d} label={`${d} ימים`} active={n === d} onPress={() => setN(d)} />)}
      </Row>
      <Card>
        {meta.line ? <LineChart data={series.filter((x) => x.value != null)} unit={meta.unit} /> : <BarChart data={bucket(series, 7, metric === 'water' || metric === 'sleep' ? 'avg' : 'sum')} unit={meta.unit} target={target ?? undefined} />}
      </Card>
      <Section title="סיכום">
        <Card style={{ gap: 6 }}>
          <T.Body>ממוצע לימים עם נתונים: {a.avg != null ? `${a.avg.toFixed(1)} ${meta.unit}` : '—'}</T.Body>
          <T.Body>סה״כ: {a.sum.toFixed(meta.line ? 1 : 0)} {meta.unit}</T.Body>
          <T.Muted>ימים עם נתונים: {a.count} מתוך {n}</T.Muted>
          <T.Muted>תקופה קודמת ({n} ימים): ממוצע {b.avg != null ? `${b.avg.toFixed(1)} ${meta.unit}` : '—'}</T.Muted>
        </Card>
      </Section>
      <Section title="פירוט">
        {[...series].reverse().slice(0, 14).map((x) => (
          <Row key={x.date} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <T.Body>{prettyDate(x.date)}</T.Body>
            <T.Muted>{x.value == null ? 'לא תועד' : `${Math.round(x.value * 10) / 10} ${meta.unit}`}</T.Muted>
          </Row>
        ))}
      </Section>
      <Button title="ייצוא CSV" icon="download" variant="ghost" onPress={exportCsv} style={{ marginTop: space.lg }} />
    </Screen>
  );
}
