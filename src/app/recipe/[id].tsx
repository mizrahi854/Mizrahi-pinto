import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Row, T, Section, Button, Stepper, Chip, toast, Empty, Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { recipeById } from '@/data/recipes';
import { foodById, recipeNutrients, shoppingItemsFor } from '@/lib/recipes';
import { dateKey } from '@/lib/dates';
import { isAdult, fmt } from '@/lib/nutrition';
import { colors, fonts, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 33 Recipe details */
export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = recipeById(id ?? '');
  const addEntry = useApp((s) => s.addEntry);
  const addShopping = useApp((s) => s.addShopping);
  const setPlanned = useApp((s) => s.setPlanned);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<string>(r?.meal ?? 'lunch');
  if (!r) return <Screen title="מתכון"><Empty title="המתכון לא נמצא" /></Screen>;
  const n = recipeNutrients(r);
  const f = servings / r.servings;

  return (
    <Screen title={r.name} footer={<Button title="אכלתי – הוספה ליומן" icon="plus" onPress={() => {
      addEntry({ date: dateKey(), meal, name: r.name, amount: servings, unitLabel: 'מנה', grams: null, nutrients: { kcal: n.partial.kcal ? null : Math.round(n.kcal * f), protein: n.partial.protein ? null : +(n.protein * f).toFixed(1), carbs: n.partial.carbs ? null : +(n.carbs * f).toFixed(1), fat: n.partial.fat ? null : +(n.fat * f).toFixed(1), fiber: n.partial.fiber ? null : +(n.fiber * f).toFixed(1) } });
      haptic.success(); toast('נוסף ליומן'); router.back();
    }} />}>
      <View style={{ height: 160, borderRadius: 28, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bowl" size={64} />
      </View>
      <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
        <Badge text={`${r.minutes} דק׳`} /><Badge text={`${r.servings} מנות`} />{r.tags.map((t) => <Badge key={t} text={t} tone="muted" />)}
      </Row>
      {adult && (
        <Card style={{ marginTop: space.md }}>
          <T.Muted>למנה אחת</T.Muted>
          <Row style={{ justifyContent: 'space-around', marginTop: 6 }}>
            <V l="קק״ל" v={Math.round(n.kcal / r.servings)} /><V l="חלבון" v={+(n.protein / r.servings).toFixed(1)} /><V l="פחמ׳" v={+(n.carbs / r.servings).toFixed(1)} /><V l="שומן" v={+(n.fat / r.servings).toFixed(1)} />
          </Row>
        </Card>
      )}
      <Section title="רכיבים">
        {r.ingredients.map((i) => (
          <Row key={i.foodId} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <T.Body>{foodById(i.foodId)?.name ?? i.foodId}</T.Body>
            <T.Muted>{i.grams} {foodById(i.foodId)?.basis === 'ml' ? 'מ״ל' : 'ג׳'}</T.Muted>
          </Row>
        ))}
        {r.allergens.length > 0 && <T.Caption>אלרגנים: {r.allergens.join(', ')}</T.Caption>}
      </Section>
      <Section title="שלבי הכנה">
        {r.steps.map((s, k) => (
          <Row key={k} style={{ alignItems: 'flex-start', marginBottom: 10 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textOnAccent, fontFamily: fonts.bold }}>{k + 1}</Text></View>
            <T.Body style={{ flex: 1 }}>{s}</T.Body>
          </Row>
        ))}
      </Section>
      <Section title="הוספה">
        <Row style={{ justifyContent: 'space-between' }}><T.Body>מנות שאכלתי</T.Body><Stepper label="מנות" value={servings} step={0.5} min={0.5} max={r.servings * 2} onChange={setServings} /></Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}</View>
        <Row style={{ marginTop: space.md }}>
          <Button style={{ flex: 1 }} title="לרשימת קניות" icon="cart" variant="ghost" onPress={() => { addShopping(shoppingItemsFor(r)); toast('נוסף לרשימת הקניות'); }} />
          <Button style={{ flex: 1 }} title="תכנון להיום" icon="calendar" variant="ghost" onPress={() => { setPlanned(dateKey(), r.meal, r.id); toast('נוסף לתכנון היום'); }} />
        </Row>
      </Section>
    </Screen>
  );
}

function V({ l, v }: { l: string; v: number }) {
  return <View style={{ alignItems: 'center' }}><Text style={[type.value, { color: colors.text, fontSize: 17 }]}>{fmt(v)}</Text><T.Caption>{l}</T.Caption></View>;
}
