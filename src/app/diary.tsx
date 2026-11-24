import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Row, T, Tap, IconButton, Sheet, Button, Chip, Stepper, toast, Badge, Field } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useDay, useMeals } from '@/store/selectors';
import { addDays, dateKey, prettyDate, weekOf, DAY_SHORT, parseKey } from '@/lib/dates';
import { fmt, nutrientsFor, sumNutrients } from '@/lib/nutrition';
import type { FoodEntry } from '@/data/types';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 16 Daily nutrition diary */
export default function Diary() {
  const params = useLocalSearchParams<{ date?: string; meal?: string }>();
  const [date, setDate] = useState(params.date ?? dateKey());
  const day = useDay(date);
  const meals = useMeals();
  const removeEntry = useApp((s) => s.removeEntry);
  const restoreEntry = useApp((s) => s.restoreEntry);
  const addCustomMeal = useApp((s) => s.addCustomMeal);
  const saveMeal = useApp((s) => s.saveMeal);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [newMeal, setNewMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [query, setQuery] = useState('');
  const allEntries = useApp((s) => s.entries);

  const history = useMemo(() => (query.trim().length < 2 ? [] : allEntries.filter((e) => e.name.includes(query.trim())).slice(-20).reverse()), [query, allEntries]);
  const t = day.totals;
  const week = weekOf(date);

  const del = (e: FoodEntry) => {
    removeEntry(e.id);
    haptic.warn();
    toast(`${e.name} נמחק`, { label: 'בטל', onPress: () => restoreEntry(e) });
  };

  return (
    <Screen title="יומן תזונה" subtitle={prettyDate(date)} right={<IconButton icon="calendar" label="חזרה להיום" onPress={() => setDate(dateKey())} size={40} />}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
        <IconButton icon="chevronBack" label="יום קודם" onPress={() => setDate(addDays(date, -1))} size={40} />
        <View style={styles.week}>
          {week.map((d, i) => (
            <Tap key={d} onPress={() => setDate(d)} label={prettyDate(d)} role="tab">
              <View style={[styles.wd, d === date && styles.wdOn]}>
                <Text style={[type.caption, { color: d === date ? colors.textOnAccent : colors.text2 }]}>{DAY_SHORT[i]}</Text>
                <Text style={[type.bodyMedium, { color: d === date ? colors.textOnAccent : colors.text }]}>{parseKey(d).getDate()}</Text>
              </View>
            </Tap>
          ))}
        </View>
        <IconButton icon="chevron" label="יום הבא" onPress={() => setDate(addDays(date, 1))} size={40} />
      </Row>

      <Card style={{ marginBottom: space.md }}>
        <Row style={{ justifyContent: 'space-around' }}>
          {day.adult && <Sum label="אנרגיה" v={`${t.kcal}`} unit="קק״ל" partial={t.partial.kcal} target={day.target.calorieTarget} />}
          <Sum label="חלבון" v={fmt(t.protein)} unit="ג׳" partial={t.partial.protein} />
          <Sum label="פחמימות" v={fmt(t.carbs)} unit="ג׳" partial={t.partial.carbs} />
          <Sum label="שומן" v={fmt(t.fat)} unit="ג׳" partial={t.partial.fat} />
          <Sum label="סיבים" v={fmt(t.fiber)} unit="ג׳" partial={t.partial.fiber} />
        </Row>
        {(t.partial.kcal || t.partial.protein) && <T.Caption style={{ textAlign: 'center', marginTop: 8 }}>* חלק מהפריטים ללא ערך ידוע – לא נספרו כאפס</T.Caption>}
      </Card>

      {meals.map((m) => {
        const list = day.list.filter((e) => e.meal === m.key);
        const sum = sumNutrients(list.map((e) => e.nutrients));
        return (
          <View key={m.key} style={[styles.meal, params.meal === m.key && { borderColor: colors.borderStrong }]}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row gap={8}><Icon name={m.icon} size={22} /><T.H>{m.label}</T.H>{list.length > 0 && day.adult && <T.Muted>{sum.kcal} קק״ל</T.Muted>}</Row>
              <Row gap={6}>
                {list.length > 0 && <IconButton icon="star" label={`שמור את ${m.label} כארוחה`} size={36} onPress={() => { saveMeal(`${m.label} – ${prettyDate(date)}`, list.map((e) => e.id)); toast('נשמר בארוחות שמורות'); }} />}
                <IconButton icon="plus" label={`הוסף ל${m.label}`} size={36} active onPress={() => router.push({ pathname: '/foods', params: { meal: m.key, date } })} />
              </Row>
            </Row>
            {list.length === 0 ? (
              <T.Muted style={{ marginTop: 8 }}>טרם תועד</T.Muted>
            ) : (
              list.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <Tap style={{ flex: 1 }} onPress={() => setEditing(e)} label={`${e.name}, ${e.amount} ${e.unitLabel}. לעריכה`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.thumb}><Icon name="bowl" size={18} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>{e.name}</Text>
                      <Text style={[type.caption, { color: colors.text2 }]}>{e.grams != null ? `${e.amount} ${e.unitLabel}` : 'ללא כמות'} · {e.time}</Text>
                    </View>
                    <Text style={[type.bodyMedium, { color: e.nutrients.kcal == null ? colors.text3 : colors.text }]}>{day.adult ? (e.nutrients.kcal == null ? 'לא ידוע' : `${e.nutrients.kcal}`) : `${fmt(e.nutrients.protein)} ח׳`}</Text>
                  </View>
                  </Tap>
                  <IconButton icon="trash" label={`מחק ${e.name}`} size={34} color={colors.text2} onPress={() => del(e)} />
                </View>
              ))
            )}
          </View>
        );
      })}

      <Button title="ארוחה בשם מותאם" icon="plus" variant="ghost" onPress={() => setNewMeal(true)} style={{ marginTop: space.sm }} />

      <View style={{ marginTop: space.xl }}>
        <T.H style={{ marginBottom: 8 }}>חיפוש בהיסטוריה</T.H>
        <Field label="שם מזון שתועד בעבר" value={query} onChangeText={setQuery} placeholder="למשל: קוטג׳" />
        {history.map((e) => (
          <Tap key={e.id} onPress={() => setDate(e.date)} label={`${e.name} ב${prettyDate(e.date)}`}>
            <View style={styles.entry}><Icon name="clock" size={18} /><Text style={[type.body, { color: colors.text, flex: 1 }]}>{e.name}</Text><T.Muted>{prettyDate(e.date)}</T.Muted></View>
          </Tap>
        ))}
      </View>

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} adult={day.adult} />
      <Sheet visible={newMeal} onClose={() => setNewMeal(false)} title="ארוחה חדשה">
        <Field label="שם הארוחה" value={mealName} onChangeText={setMealName} placeholder="למשל: לפני אימון" />
        <Button title="הוספה" disabled={mealName.trim().length < 2} onPress={() => { addCustomMeal(mealName.trim()); setMealName(''); setNewMeal(false); }} />
      </Sheet>
    </Screen>
  );
}

function Sum({ label, v, unit, partial, target }: { label: string; v: string; unit: string; partial?: boolean; target?: number | null }) {
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${label} ${v} ${unit}${partial ? ', חלקי' : ''}`}>
      <Text style={[type.value, { color: colors.text, fontSize: 17 }]}>{v}{partial ? '*' : ''}</Text>
      <T.Caption>{label}{target ? ` / ${target}` : ''}</T.Caption>
    </View>
  );
}

export function EditEntrySheet({ entry, onClose, adult }: { entry: FoodEntry | null; onClose: () => void; adult: boolean }) {
  const meals = useMeals();
  const update = useApp((s) => s.updateEntry);
  const dup = useApp((s) => s.duplicateEntries);
  const userFoods = useApp((s) => s.foods);
  const [amount, setAmount] = useState(entry?.amount ?? 0);
  const [meal, setMeal] = useState(entry?.meal ?? 'breakfast');
  const [time, setTime] = useState(entry?.time ?? '');
  React.useEffect(() => { if (entry) { setAmount(entry.amount); setMeal(entry.meal); setTime(entry.time); } }, [entry]);
  if (!entry) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const food = findFood(entry.foodId, userFoods);
  const portion = food?.portions.find((p) => p.label === entry.unitLabel);
  const grams = portion ? amount * portion.grams : amount;
  const preview = food ? nutrientsFor(food, grams) : entry.nutrients;

  return (
    <Sheet visible onClose={onClose} title={entry.name}>
      {entry.grams != null && (
        <>
          <Stepper label="כמות" value={amount} onChange={setAmount} step={portion ? 0.5 : 10} unit={entry.unitLabel} />
          {adult && <T.Muted style={{ textAlign: 'center', marginTop: 8 }}>{preview.kcal == null ? 'ערך אנרגיה לא ידוע' : `${preview.kcal} קק״ל`} · חלבון {fmt(preview.protein, 'ג׳')}</T.Muted>}
        </>
      )}
      <T.Muted style={{ marginTop: space.md, marginBottom: 6 }}>העבר לארוחה</T.Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}
      </View>
      <Row style={{ marginTop: space.md }}>
        <T.Muted>שעה</T.Muted>
        <TextInput value={time} onChangeText={setTime} style={styles.time} accessibilityLabel="שעה" maxLength={5} />
      </Row>
      <Row style={{ marginTop: space.lg, gap: 8 }}>
        <Button style={{ flex: 1 }} title="שמירה" onPress={() => {
          update(entry.id, { amount, meal, time: /^\d{1,2}:\d{2}$/.test(time) ? time : entry.time, grams: entry.grams == null ? null : grams, nutrients: food ? preview : entry.nutrients });
          haptic.success(); onClose();
        }} />
        <Button style={{ flex: 1 }} title="שכפל למחר" variant="soft" icon="copy" onPress={() => { dup([entry.id], addDays(entry.date, 1)); toast('שוכפל למחר'); onClose(); }} />
      </Row>
      {!food?.verified && <View style={{ marginTop: space.md, alignItems: 'center' }}><Badge text="ערכים לא מאומתים מול יצרן" tone="muted" /></View>}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', gap: 4, flex: 1, justifyContent: 'center' },
  wd: { width: 40, paddingVertical: 6, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
  wdOn: { backgroundColor: colors.accent, borderColor: colors.accentLight },
  meal: { padding: space.md, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: space.sm },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 6, minHeight: 52 },
  thumb: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  time: { minWidth: 70, color: colors.text, fontFamily: fonts.semibold, fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, textAlign: 'center', paddingVertical: 4 },
});
