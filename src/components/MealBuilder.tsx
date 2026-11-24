import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Screen, Field, Button, Chip, Row, T, Card, IconButton, Stepper, toast, Tap, Divider } from './ui';
import { Icon } from './Icon';
import { useApp, allFoods } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { searchLocal, defaultMeal } from '@/lib/search';
import { nutrientsFor, sumNutrients, fmt, isAdult } from '@/lib/nutrition';
import { dateKey, nowTime, uid } from '@/lib/dates';
import type { Food } from '@/data/types';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

type Item = { food: Food; grams: number };

/** 24/25 Multi-ingredient meal / recipe builder with servings split. */
export function MealBuilder({ title, photo }: { title: string; photo?: string }) {
  const userFoods = useApp((s) => s.foods);
  const addEntry = useApp((s) => s.addEntry);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [servings, setServings] = useState(1);
  const [eaten, setEaten] = useState(1);
  const [meal, setMeal] = useState(defaultMeal());
  const [saveTemplate, setSaveTemplate] = useState(false);

  const results = useMemo(() => (q.trim().length < 1 ? [] : searchLocal(allFoods(userFoods), q).slice(0, 6)), [q, userFoods]);
  const totals = sumNutrients(items.map((i) => nutrientsFor(i.food, i.grams)));
  const factor = eaten / servings;
  const portion = {
    kcal: totals.partial.kcal && totals.kcal === 0 ? null : Math.round(totals.kcal * factor),
    protein: +(totals.protein * factor).toFixed(1), carbs: +(totals.carbs * factor).toFixed(1), fat: +(totals.fat * factor).toFixed(1), fiber: +(totals.fiber * factor).toFixed(1),
  };

  const save = () => {
    if (!items.length) return toast('הוסף לפחות רכיב אחד');
    const mealName = name.trim() || items.map((i) => i.food.name).slice(0, 2).join(' + ');
    addEntry({
      date: dateKey(), meal, name: mealName, amount: eaten, unitLabel: servings > 1 ? `מנות מתוך ${servings}` : 'מנה',
      grams: Math.round(items.reduce((m, i) => m + i.grams, 0) * factor), time: nowTime(), photoUri: photo,
      nutrients: {
        kcal: totals.partial.kcal ? (portion.kcal ?? null) : portion.kcal, protein: totals.partial.protein ? null : portion.protein,
        carbs: totals.partial.carbs ? null : portion.carbs, fat: totals.partial.fat ? null : portion.fat, fiber: totals.partial.fiber ? null : portion.fiber,
      },
    });
    if (saveTemplate) {
      useApp.setState((s) => ({
        savedMeals: [...s.savedMeals, { id: uid(), name: mealName, items: items.map((i) => ({ foodId: i.food.id, name: i.food.name, amount: i.grams, unitLabel: i.food.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: i.grams, nutrients: nutrientsFor(i.food, i.grams) })) }],
      }));
    }
    haptic.success();
    toast('הארוחה נוספה ליומן');
    router.back();
  };

  return (
    <Screen title={title} footer={<Button title="אישור והוספה ליומן" onPress={save} disabled={!items.length} />}>
      {photo && <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />}
      <Field label="שם הארוחה (לא חובה)" value={name} onChangeText={setName} />
      <View style={styles.search}>
        <Icon name="search" size={18} color={colors.text2} />
        <TextInput value={q} onChangeText={setQ} placeholder="הוסף רכיב מהמאגר" placeholderTextColor={colors.text3} style={styles.input} accessibilityLabel="חיפוש רכיב" />
      </View>
      {results.map((f) => (
        <Tap key={f.id} onPress={() => { setItems([...items, { food: f, grams: f.portions[0]?.grams ?? 100 }]); setQ(''); haptic.select(); }} label={`הוסף ${f.name}`}>
          <View style={styles.result}><Icon name="plus" size={18} /><Text style={[type.body, { color: colors.text, flex: 1 }]}>{f.name}</Text>{!f.per100 && <T.Caption>ללא ערכים</T.Caption>}</View>
        </Tap>
      ))}
      {items.map((it, idx) => {
        const n = nutrientsFor(it.food, it.grams);
        return (
          <Card key={idx} style={{ marginTop: 8, gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T.Body style={{ fontFamily: fonts.medium, flex: 1 }}>{it.food.name}</T.Body>
              <T.Muted>{adult ? (n.kcal == null ? 'לא ידוע' : `${n.kcal} קק״ל`) : ''}</T.Muted>
              <IconButton icon="trash" label={`הסר ${it.food.name}`} size={34} onPress={() => setItems(items.filter((_, k) => k !== idx))} />
            </Row>
            <Stepper label={`כמות ${it.food.name}`} value={it.grams} step={10} unit={it.food.basis === 'ml' ? 'מ״ל' : 'ג׳'} onChange={(g) => setItems(items.map((x, k) => (k === idx ? { ...x, grams: g } : x)))} />
          </Card>
        );
      })}
      {items.length > 0 && (
        <Card style={{ marginTop: space.lg, gap: 10 }}>
          <T.H>חלוקה למנות</T.H>
          <Row style={{ justifyContent: 'space-between' }}><T.Muted>המתכון מספיק ל-</T.Muted><Stepper label="מספר מנות" value={servings} min={1} max={20} onChange={(v) => { setServings(Math.max(1, v)); setEaten(Math.min(eaten, Math.max(1, v))); }} /></Row>
          <Row style={{ justifyContent: 'space-between' }}><T.Muted>אכלתי</T.Muted><Stepper label="מנות שנאכלו" value={eaten} step={0.5} min={0.5} max={servings} onChange={setEaten} /></Row>
          <Divider />
          <Row style={{ justifyContent: 'space-around' }}>
            {adult && <MiniV l="קק״ל" v={portion.kcal} partial={totals.partial.kcal} />}
            <MiniV l="חלבון" v={portion.protein} partial={totals.partial.protein} />
            <MiniV l="פחמ׳" v={portion.carbs} partial={totals.partial.carbs} />
            <MiniV l="שומן" v={portion.fat} partial={totals.partial.fat} />
          </Row>
          {(totals.partial.kcal || totals.partial.protein) && <T.Caption>* לחלק מהרכיבים אין ערכים ידועים – הסכום חלקי.</T.Caption>}
        </Card>
      )}
      <T.Muted style={{ marginTop: space.lg, marginBottom: 6 }}>לארוחה</T.Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}</View>
      <View style={{ marginTop: space.md }}><Chip label="שמור גם כתבנית" icon="star" active={saveTemplate} onPress={() => setSaveTemplate(!saveTemplate)} /></View>
    </Screen>
  );
}

function MiniV({ l, v, partial }: { l: string; v: number | null; partial?: boolean }) {
  return <View style={{ alignItems: 'center' }}><Text style={[type.value, { color: colors.text, fontSize: 17 }]}>{fmt(v)}{partial ? '*' : ''}</Text><T.Caption>{l}</T.Caption></View>;
}

const styles = StyleSheet.create({
  photo: { height: 180, borderRadius: radius.lg, marginBottom: space.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 50, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, minHeight: 46 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
