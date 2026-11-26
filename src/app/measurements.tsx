import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LightScreen, LPrimary, Segmented, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { LineChart } from '@/components/Charts';
import { DatePick, Group, LInput, Note } from '@/components/forms';
import { useApp } from '@/store/useApp';
import type { Measurement } from '@/store/useApp';
import { dateKey, parseKey, prettyDate, addDays } from '@/lib/dates';
import { isAdult } from '@/lib/nutrition';
import { light, space, radius, colors } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

type Metric = 'weightKg' | 'waistCm' | 'heightCm';
const LABEL: Record<Metric, { title: string; unit: string }> = { weightKg: { title: 'משקל', unit: 'ק״ג' }, waistCm: { title: 'היקף מותניים', unit: 'ס״מ' }, heightCm: { title: 'גובה', unit: 'ס״מ' } };

/** Personal measurement log: weight, waist, height – history list and charts over time. */
export default function Measurements() {
  const list = useApp((s) => s.measurements);
  const upsert = useApp((s) => s.upsertMeasurement);
  const remove = useApp((s) => s.removeMeasurement);
  const age = useApp((s) => s.profile.age);
  const [date, setDate] = useState(dateKey());
  const cur = list.find((m) => m.date === date);
  const [vals, setVals] = useState({ weightKg: '', waistCm: '', heightCm: '' });
  React.useEffect(() => { setVals({ weightKg: cur?.weightKg?.toString() ?? '', waistCm: cur?.waistCm?.toString() ?? '', heightCm: cur?.heightCm?.toString() ?? '' }); }, [cur, date]);
  const [metric, setMetric] = useState<Metric>('weightKg');
  const [range, setRange] = useState<'30' | '90' | 'all'>('90');

  const save = () => {
    const num = (v: string, min: number, max: number) => { const n = Number(v); return v && isFinite(n) && n >= min && n <= max ? n : undefined; };
    const m: Measurement = { date, weightKg: num(vals.weightKg, 20, 300), waistCm: num(vals.waistCm, 40, 200), heightCm: num(vals.heightCm, 80, 230) };
    if (m.weightKg == null && m.waistCm == null && m.heightCm == null) return toast('הזן לפחות מדידה אחת בטווח סביר');
    upsert(m);
    haptic.success();
    toast(`נשמר ל${prettyDate(date)}`);
  };

  const from = range === 'all' ? '0000' : addDays(dateKey(), -Number(range));
  const series = list.filter((m) => m.date >= from && m[metric] != null).map((m) => ({ label: `${parseKey(m.date).getDate()}/${parseKey(m.date).getMonth() + 1}`, value: m[metric]! }));

  return (
    <LightScreen title="יומן מדידות" footer={<LPrimary title="שמירת מדידה" icon="check" onPress={save} />}>
      <DatePick value={date} onChange={setDate} from={addDays(dateKey(), -13)} days={14} />
      <Group>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(Object.keys(LABEL) as Metric[]).map((k) => (
            <View key={k} style={{ flex: 1 }}><LInput label={`${LABEL[k].title} (${LABEL[k].unit})`} value={vals[k]} onChangeText={(t) => setVals({ ...vals, [k]: t.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" placeholder="—" style={{ textAlign: 'center' }} /></View>
          ))}
        </View>
      </Group>
      {!isAdult(age) && <View style={{ marginTop: space.md }}><Note text="בגיל ההתבגרות שינויים במשקל ובגובה הם חלק מגדילה תקינה. מעקב גדילה נעשה לפי עקומות גדילה ובליווי איש מקצוע." /></View>}

      <Group title="גרף לאורך זמן">
        <Segmented value={metric} onChange={setMetric} options={(Object.keys(LABEL) as Metric[]).map((k) => ({ key: k, label: LABEL[k].title }))} />
        <Segmented value={range} onChange={setRange} options={[{ key: '30', label: '30 יום' }, { key: '90', label: '90 יום' }, { key: 'all', label: 'הכל' }]} />
        {/* the chart is drawn for dark surfaces – keep it on one for legible axis labels */}
        <View style={styles.chart}>{series.length >= 2 ? <LineChart data={series} unit={LABEL[metric].unit} /> : <Text style={[ls.muted, { textAlign: 'center', padding: space.lg, color: '#D8CFCA' }]}>צריך לפחות שתי מדידות כדי להציג גרף</Text>}</View>
      </Group>

      <Group title="היסטוריה">
        {list.length ? [...list].reverse().slice(0, 30).map((m) => (
          <View key={m.date} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={ls.bodyStrong}>{prettyDate(m.date)}</Text>
              <Text style={ls.muted}>{[m.weightKg != null ? `${m.weightKg} ק״ג` : null, m.waistCm != null ? `מותניים ${m.waistCm} ס״מ` : null, m.heightCm != null ? `גובה ${m.heightCm} ס״מ` : null].filter(Boolean).join(' · ')}</Text>
            </View>
            <Tap onPress={() => { const r = remove(m.date); if (r) toast('המדידה נמחקה', { label: 'ביטול', onPress: () => upsert(r) }); }} label={`מחיקת המדידה של ${prettyDate(m.date)}`}><View style={styles.del}><Icon name="trash" size={19} color={light.text2} /></View></Tap>
          </View>
        )) : <Text style={ls.muted}>עוד אין מדידות.</Text>}
      </Group>
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  chart: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: light.card, borderRadius: radius.md, paddingStart: 14, minHeight: 56 },
  del: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
