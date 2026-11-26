import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, LInput, DatePick, Group, Note } from '@/components/forms';
import { useApp, allFoods, tracksCalories } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { searchLocal } from '@/lib/search';
import { unitsFor, computeFoodEntry, totalsOf } from '@/lib/engine';
import { dateKey, prettyDate } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import type { MealItem } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Plan a meal ahead (or for today): title, day, meal type, optional items from the database or a saved meal. */
export default function PlanMeal() {
  const p = useLocalSearchParams<{ id?: string; date?: string; meal?: string; title?: string }>();
  const existing = useApp((s) => s.plannedMeals.find((m) => m.id === p.id));
  const upsert = useApp((s) => s.upsertPlannedMeal);
  const remove = useApp((s) => s.removePlannedMeal);
  const restore = useApp((s) => s.restorePlannedMeal);
  const eat = useApp((s) => s.eatPlannedMeal);
  const saved = useApp((s) => s.savedMeals);
  const userFoods = useApp((s) => s.foods);
  const calories = useApp((s) => tracksCalories(s.profile));
  const meals = useMeals();
  const [title, setTitle] = useState(existing?.title ?? p.title ?? '');
  const [date, setDate] = useState(existing?.date ?? p.date ?? dateKey());
  const [meal, setMeal] = useState(existing?.meal ?? p.meal ?? 'dinner');
  const [items, setItems] = useState<MealItem[]>(existing?.items ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim().length < 2 ? [] : searchLocal(allFoods(userFoods), q, 6)), [q, userFoods]);
  const tot = totalsOf(items);

  const addFood = (id: string) => {
    const f = allFoods(userFoods).find((x) => x.id === id)!;
    const unit = unitsFor(f).find((u) => u.grams != null) ?? { label: f.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: null };
    const amount = unit.grams == null ? 100 : 1;
    const c = computeFoodEntry(f, amount, unit);
    setItems([...items, { foodId: f.id, name: f.name, amount, unitLabel: unit.label, grams: c.grams, nutrients: c.nutrients }]);
    if (!title) setTitle(f.name);
    setQ('');
    haptic.select();
  };

  const save = () => {
    const t = title.trim() || (items[0]?.name ?? '');
    if (t.length < 2) return toast('תן שם לארוחה, למשל: ארוחת ערב משפחתית');
    upsert({ id: existing?.id, date, meal, title: t, items, note: note.trim() || undefined, source: existing?.source ?? 'manual', eatenAt: existing?.eatenAt });
    haptic.success();
    toast(`נשמר לתכנון של ${prettyDate(date)}`);
    goBack('/(tabs)/plan');
  };

  return (
    <LightScreen title={existing ? 'עריכת ארוחה מתוכננת' : 'תכנון ארוחה'} subtitle={prettyDate(date)} footer={<LPrimary title="שמירה" icon="check" onPress={save} />}>
      <LInput label="שם הארוחה" value={title} onChangeText={setTitle} placeholder="למשל: ארוחת שישי אצל ההורים" />
      <Group>
        <DatePick value={date} onChange={setDate} />
        <Chips label="סוג הארוחה" options={meals.map((m) => ({ key: m.key, label: m.label }))} value={meal} onChange={setMeal} />
      </Group>

      <Group title="מה בתפריט" action={calories && items.length ? <Text style={ls.muted}>{tot.kcal}{tot.partial.kcal ? '*' : ''} קק״ל</Text> : undefined}>
        {items.map((it, i) => (
          <View key={i} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={ls.bodyStrong} numberOfLines={1}>{it.name}</Text>
              <Text style={ls.muted}>{it.amount} {it.unitLabel}{calories && it.nutrients.kcal != null ? ` · ${it.nutrients.kcal} קק״ל` : ''}</Text>
            </View>
            <Tap onPress={() => setItems(items.filter((_, k) => k !== i))} label={`הסרת ${it.name}`}><View style={styles.iconBtn}><Icon name="close" size={18} color={light.text2} /></View></Tap>
          </View>
        ))}
        <LInput value={q} onChangeText={setQ} placeholder="הוספת מאכל מהמאגר (לא חובה)" accessibilityLabel="חיפוש מאכל לתכנון" />
        {results.map((f) => (
          <Pressable key={f.id} onPress={() => addFood(f.id)} accessibilityRole="button" accessibilityLabel={`הוספת ${f.name}`} style={styles.result}>
            <Icon name="plus" size={18} color={light.accentText} /><Text style={[ls.body, { flex: 1 }]} numberOfLines={1}>{f.name}</Text>
          </Pressable>
        ))}
        {saved.length > 0 && (
          <Chips label="או מארוחה שמורה" options={saved.slice(0, 8).map((m) => ({ key: m.id, label: m.name }))} value="" onChange={(id: string) => {
            const m = saved.find((x) => x.id === id)!;
            setItems([...items, ...m.items.map(({ foodId, name, amount, unitLabel, grams, nutrients }) => ({ foodId, name, amount, unitLabel, grams, nutrients }))]);
            if (!title) setTitle(m.name);
          }} />
        )}
        <LInput label="הערה" hint="(לא חובה)" value={note} onChangeText={setNote} placeholder="למשל: להכין מראש ביום חמישי" />
      </Group>
      <View style={{ marginTop: space.md }}><Note text="ארוחה מתוכננת לא נספרת ביומן עד שמסמנים ״נאכל״ – כך התכנון והביצוע נשארים נפרדים." /></View>

      {existing && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: space.lg }}>
          {!existing.eatenAt && existing.date <= dateKey() && (
            <Tap onPress={() => { const n = eat(existing.id); haptic.success(); toast(`${n} פריטים נוספו ליומן`); goBack('/(tabs)/plan'); }} label="סימון כנאכל" style={{ flex: 1 }}>
              <View style={[styles.btn, { backgroundColor: '#1F7A4D', borderColor: '#1F7A4D' }]}><Icon name="check" size={18} color="#fff" /><Text style={[styles.btnText, { color: '#fff' }]}>נאכל – ליומן</Text></View>
            </Tap>
          )}
          <Tap onPress={() => { const m = remove(existing.id); haptic.warn(); if (m) toast(`${m.title} נמחקה מהתכנון`, { label: 'ביטול', onPress: () => restore(m) }); goBack('/(tabs)/plan'); }} label="מחיקה מהתכנון" style={{ flex: 1 }}>
            <View style={styles.btn}><Icon name="trash" size={18} color="#C2361B" /><Text style={[styles.btnText, { color: '#C2361B' }]}>מחיקה</Text></View>
          </Tap>
        </View>
      )}
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: light.card, borderRadius: radius.md, paddingStart: 14, paddingVertical: 4 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: light.cardSoft },
  btn: { minHeight: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: light.border, backgroundColor: light.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnText: { fontFamily: fonts.semibold, fontSize: 15, color: light.text },
});
