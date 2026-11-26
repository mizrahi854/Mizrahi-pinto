import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, LCard, Segmented, LPrimary, LIconButton, ArcGauge, LBar, ls } from '@/components/light';
import { Tap, Row, Sheet, ListItem } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, targetFor , findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { dateKey, weekOf, addDays } from '@/lib/dates';
import { sumNutrients, isAdult, fmt } from '@/lib/nutrition';
import { periodSummary } from '@/lib/engine';
import { MEAL_PHOTO } from '@/data/media';
import { light, fonts, radius, space } from '@/theme/tokens';

type Period = 'day' | 'week' | 'month';

/** Nutrition tab – approved light screen: period tabs, calorie arc, macro cards, today's meals */
export default function Nutrition() {
  const entries = useApp((s) => s.entries);
  const profile = useApp((s) => s.profile);
  const hist = useApp((s) => s.targetHistory);
  const meals = useMeals();
  const [period, setPeriod] = useState<Period>('day');
  const [tools, setTools] = useState(false);
  const adult = isAdult(profile.age);
  const today = dateKey();
  const t = targetFor(today, profile, hist);
  const hasTarget = adult && profile.targetMode !== 'none' && t.calorieTarget != null;

  const days = useMemo(() => (period === 'day' ? [today] : period === 'week' ? weekOf(today).filter((d) => d <= today) : Array.from({ length: 30 }, (_, i) => addDays(today, -29 + i))), [period, today]);
  // single source of truth: the central engine (same numbers as home, diary and stats)
  const view = useMemo(() => {
    const p = periodSummary(entries, days);
    const v = period === 'day' ? p.total : p.avg;
    return { kcal: Math.round(v.kcal), protein: v.protein, carbs: v.carbs, fat: v.fat, logged: p.loggedDays, partial: p.total.partial };
  }, [days, entries, period]);
  const todayList = entries.filter((e) => e.date === today);
  const remaining = hasTarget ? t.calorieTarget! - view.kcal : null;

  return (
    <LightScreen
      title="תזונה"
      back={false}
      tabBar
      right={<LIconButton icon="calendar" label="יומן מלא" onPress={() => router.push('/diary')} />}
      footer={<LPrimary title="הוסף ארוחה" icon="plus" onPress={() => router.push('/foods')} />}
    >
      <Segmented value={period} onChange={setPeriod} options={[{ key: 'day', label: 'היום' }, { key: 'week', label: 'שבוע' }, { key: 'month', label: 'חודש' }]} />

      <View style={{ alignItems: 'center', marginTop: space.lg }}>
        <ArcGauge value={hasTarget ? view.kcal / t.calorieTarget! : Math.min(1, view.logged / days.length)} size={250}>
          <Text style={styles.gaugeNum}>{hasTarget ? Math.abs(remaining!).toLocaleString() : adult ? view.kcal.toLocaleString() : String(todayList.length)}</Text>
          <Text style={styles.gaugeLabel}>
            {hasTarget ? (remaining! < 0 ? 'מעל היעד' : period === 'day' ? 'קלוריות נותרו' : 'נותרו בממוצע ליום') : adult ? (period === 'day' ? 'קלוריות שתועדו' : 'ממוצע ליום מתועד') : 'פריטים שתועדו היום'}
          </Text>
          {hasTarget && <Text style={styles.gaugeOf}>מתוך {t.calorieTarget!.toLocaleString()}</Text>}
        </ArcGauge>
        {period !== 'day' && <Text style={ls.caption}>{view.logged} ימים תועדו מתוך {days.length} · ימים חסרים לא נספרים</Text>}
      </View>

      <Row gap={10} style={{ marginTop: space.md }}>
        <Macro icon="fat" title="שומנים" value={view.fat} target={t.fatTarget} color={light.fat} onPress={() => router.push('/macro/fat')} partial={view.partial.fat} />
        <Macro icon="wheat" title="פחמימות" value={view.carbs} target={t.carbsTarget} color={light.carbs} onPress={() => router.push('/macro/carbs')} partial={view.partial.carbs} />
        <Macro icon="protein" title="חלבון" value={view.protein} target={t.proteinTarget} color={light.protein} onPress={() => router.push('/macro/protein')} partial={view.partial.protein} />
      </Row>

      {!adult && <Variety list={todayList} />}

      <Row style={{ justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm }}>
        <Text style={ls.h2}>הארוחות של היום</Text>
        <Tap onPress={() => setTools(true)} label="כלי תזונה"><View style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={[ls.muted, { color: light.accentText }]}>כלים</Text></View></Tap>
      </Row>
      <View style={{ gap: 10 }}>
        {meals.map((m) => {
          const list = todayList.filter((e) => e.meal === m.key);
          const tot = sumNutrients(list.map((e) => e.nutrients));
          const photo = MEAL_PHOTO[m.key];
          return (
            <Tap key={m.key} onPress={() => router.push({ pathname: '/diary', params: { meal: m.key } })} label={`${m.label}: ${list.length ? `${tot.kcal} קלוריות` : 'טרם תועד'}`}>
              <View style={styles.meal}>
                <Icon name="chevron" size={18} color={light.text2} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.mealName}>{m.label}</Text>
                  <Text style={ls.muted}>{list.length ? (adult ? `${tot.kcal} קק״ל · ${fmt(tot.protein)} ג׳ חלבון` : `${list.length} פריטים`) : 'טרם תועד · הקש להוספה'}</Text>
                </View>
                {photo ? <Image source={photo} style={styles.mealImg} contentFit="cover" accessibilityLabel={m.label} /> : <View style={[styles.mealImg, styles.mealPh]}><Icon name={m.icon} size={26} color={light.accent} /></View>}
              </View>
            </Tap>
          );
        })}
      </View>

      <Sheet visible={tools} onClose={() => setTools(false)} title="כלי תזונה">
        {([
          ['list', 'יומן מלא', '/diary'], ['calendar', 'תכנון שבועי', '/plan'], ['bowl', 'מתכונים והמלצות', '/recipes'], ['cart', 'רשימת קניות', '/shopping'],
          ['star', 'שמורים ומועדפים', '/saved-meals'], ['weight', 'בניית ארוחה', '/meal-builder'], ['calc', 'מחשבון', '/calculator'], ['layers', 'השוואת מוצרים', '/compare'],
        ] as [IconName, string, string][]).filter(([, , h]) => adult || h !== '/calculator').map(([ic, l, h]) => (
          <ListItem key={h} icon={ic} title={l} onPress={() => { setTools(false); router.push(h as any); }} />
        ))}
      </Sheet>
    </LightScreen>
  );
}

const GROUPS: { key: string; label: string; icon: IconName; cats: string[] }[] = [
  { key: 'protein', label: 'חלבון', icon: 'protein', cats: ['meat', 'eggs', 'protein'] },
  { key: 'dairy', label: 'חלב', icon: 'drop', cats: ['dairy'] },
  { key: 'grains', label: 'דגנים', icon: 'wheat', cats: ['carbs', 'bread'] },
  { key: 'produce', label: 'פירות וירקות', icon: 'sparkle', cats: ['produce'] },
  { key: 'fats', label: 'שומנים טובים', icon: 'fat', cats: ['fats'] },
];

/** Under-18 view: variety and regular meals – no calorie budget. */
function Variety({ list }: { list: { foodId?: string; meal: string }[] }) {
  const userFoods = useApp((s) => s.foods);
  const cats = new Set(list.map((e) => findFood(e.foodId, userFoods)?.category).filter(Boolean) as string[]);
  const meals = new Set(list.map((e) => e.meal)).size;
  return (
    <LCard style={{ marginTop: space.md, gap: 10 }}>
      <Text style={ls.bodyStrong}>גיוון תזונתי היום</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GROUPS.map((g) => {
          const on = g.cats.some((c) => cats.has(c));
          return (
            <View key={g.key} style={[styles.group, on && styles.groupOn]} accessible accessibilityLabel={`${g.label}: ${on ? 'נאכל היום' : 'עוד לא'}`}>
              <Icon name={on ? 'check' : g.icon} size={16} color={on ? '#fff' : light.text2} />
              <Text style={[ls.muted, on && { color: '#fff' }]}>{g.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={ls.muted}>{meals} ארוחות תועדו היום · ארוחות סדירות נותנות אנרגיה לאימונים, ללימודים ולהתאוששות.</Text>
    </LCard>
  );
}

function Macro({ icon, title, value, target, color, onPress, partial }: { icon: IconName; title: string; value: number; target: number | null; color: string; onPress: () => void; partial: boolean }) {
  return (
    <Tap onPress={onPress} label={`${title}: ${Math.round(value)} גרם`} style={{ flex: 1 }}>
      <LCard style={{ alignItems: 'center', gap: 6, paddingHorizontal: 10 }}>
        <Icon name={icon} size={26} color={color} />
        <Text style={styles.macroTitle}>{title}</Text>
        <Text style={styles.macroValue}>{Math.round(value)} ג׳{partial ? '*' : ''}</Text>
        <View style={{ alignSelf: 'stretch' }}><LBar value={target ? value / target : 0} color={color} /></View>
      </LCard>
    </Tap>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 18, backgroundColor: light.cardSoft },
  groupOn: { backgroundColor: light.protein },
  gaugeNum: { fontFamily: fonts.bold, fontSize: 56, lineHeight: 62, color: light.text, fontVariant: ['tabular-nums'] },
  gaugeLabel: { fontFamily: fonts.medium, fontSize: 17, color: light.text },
  gaugeOf: { fontFamily: fonts.regular, fontSize: 16, color: light.text2, marginTop: 30 },
  macroTitle: { fontFamily: fonts.medium, fontSize: 15, color: light.text },
  macroValue: { fontFamily: fonts.bold, fontSize: 18, color: light.text },
  meal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, backgroundColor: light.card },
  mealName: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  mealImg: { width: 86, height: 62, borderRadius: 14 },
  mealPh: { backgroundColor: light.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
