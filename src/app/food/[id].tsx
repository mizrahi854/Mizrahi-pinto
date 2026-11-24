import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Screen, Card, Row, T, Chip, Stepper, Button, IconButton, Badge, Sheet, Field, toast, Empty, Divider } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { DotNumber } from '@/components/DotMatrix';
import { useApp, findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { CATEGORY_ICON, CATEGORY_LABELS } from '@/data/foods';
import { fmt, nutrientsFor, isAdult } from '@/lib/nutrition';
import { dateKey, prettyDate } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { colors, fonts, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 19 Product details + quantity picker */
export default function FoodDetail() {
  const { id, meal: pMeal, date: pDate } = useLocalSearchParams<{ id: string; meal?: string; date?: string }>();
  const userFoods = useApp((s) => s.foods);
  const food = findFood(id, userFoods);
  const favorites = useApp((s) => s.favorites);
  const toggleFav = useApp((s) => s.toggleFavorite);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const report = useApp((s) => s.reportFood);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const baseUnit = food?.basis === 'ml' ? 'מ״ל' : 'ג׳';
  const [unit, setUnit] = useState<string>(baseUnit);
  const [amount, setAmount] = useState(100);
  const [meal, setMeal] = useState(pMeal || defaultMeal());
  const [reporting, setReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const date = pDate || dateKey();

  const portion = food?.portions.find((p) => p.label === unit);
  const base = portion ? amount * portion.grams : amount;
  const n = useMemo(() => (food ? nutrientsFor(food, base) : null), [food, base]);

  if (!food) return <Screen title="מוצר"><Empty title="המוצר לא נמצא" action="לגלריה" onAction={() => router.replace('/foods')} /></Screen>;
  const fav = favorites.includes(food.id);

  const add = () => {
    addFoodToLog(food, amount, unit, meal, date, base);
    haptic.success();
    toast(`${food.name} נוסף ל${meals.find((m) => m.key === meal)?.label ?? 'יומן'}`, { label: 'ליומן', onPress: () => router.push({ pathname: '/diary', params: { date } }) });
    router.back();
  };

  return (
    <Screen
      title={food.name}
      subtitle={food.brand}
      right={<IconButton icon={fav ? 'starFill' : 'star'} label={fav ? 'הסר ממועדפים' : 'הוסף למועדפים'} onPress={() => { toggleFav(food.id); haptic.select(); }} size={40} active={fav} />}
      footer={<Button title={`הוספה · ${prettyDate(date)}`} icon="plus" onPress={add} />}
    >
      <View style={{ alignItems: 'center', marginTop: space.sm }}>
        {food.imageUrl ? (
          <Image source={{ uri: food.imageUrl }} style={styles.img} contentFit="contain" accessibilityLabel={`תמונת אריזה של ${food.name}`} />
        ) : (
          <View style={[styles.img, styles.ph]}><Icon name={CATEGORY_ICON[food.category]} size={56} /></View>
        )}
        <Row style={{ marginTop: space.sm }}>
          <Badge text={CATEGORY_LABELS[food.category]} tone="muted" />
          {food.state && <Badge text={food.state === 'raw' ? 'נא' : food.state === 'cooked' ? 'מבושל' : 'מוכן'} tone="muted" />}
          <Badge text={food.verified ? 'מאומת' : 'לא מאומת מול יצרן'} tone={food.verified ? 'accent' : 'warn'} />
        </Row>
      </View>

      {!food.per100 ? (
        <Card style={{ marginTop: space.lg, gap: 8 }}>
          <T.H>חסרים ערכים תזונתיים</T.H>
          <T.Muted>{food.source}. אפשר להוסיף ליומן ללא ערכים (הם לא ייספרו כאפס), או להשלים מהתווית.</T.Muted>
          <Row>
            <Button title="השלמה מהתווית" variant="soft" icon="edit" onPress={() => router.push({ pathname: '/food-new', params: { from: food.id } })} style={{ flex: 1 }} />
            <Button title="סריקת ברקוד" variant="ghost" icon="barcode" onPress={() => router.push('/barcode')} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Card style={{ marginTop: space.lg, alignItems: 'center', gap: 6 }}>
          {adult && n?.kcal != null && <DotNumber value={n.kcal} dot={6} gap={2.4} label={`${n.kcal} קלוריות`} />}
          {adult && <T.Muted>קלוריות בכמות שנבחרה</T.Muted>}
          <Row style={{ justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 10 }}>
            <Macro l="חלבון" v={n?.protein} /><Macro l="פחמימות" v={n?.carbs} /><Macro l="שומן" v={n?.fat} /><Macro l="סיבים" v={n?.fiber} />
          </Row>
        </Card>
      )}

      <T.H style={{ marginTop: space.xl, marginBottom: 8 }}>כמות</T.H>
      <View style={styles.wrap}>
        <Chip label={baseUnit} active={unit === baseUnit} onPress={() => { setUnit(baseUnit); setAmount(100); }} />
        {food.portions.map((p) => <Chip key={p.label} label={`${p.label} (${p.grams} ${baseUnit})`} active={unit === p.label} onPress={() => { setUnit(p.label); setAmount(1); }} />)}
      </View>
      <View style={{ marginTop: space.md }}>
        <Stepper label="כמות" value={amount} onChange={setAmount} step={portion ? 0.5 : 10} unit={portion ? 'יח׳' : baseUnit} max={5000} />
      </View>
      {portion && <T.Caption style={{ textAlign: 'center', marginTop: 6 }}>= {base} {baseUnit}</T.Caption>}

      <T.H style={{ marginTop: space.xl, marginBottom: 8 }}>לארוחה</T.H>
      <View style={styles.wrap}>{meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}</View>

      <Card style={{ marginTop: space.xl, gap: 6 }}>
        <T.H>ערכים ל-100 {baseUnit}</T.H>
        <Divider />
        {(['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const).map((k) => (
          <Row key={k} style={{ justifyContent: 'space-between' }}>
            <T.Body>{{ kcal: 'אנרגיה (קק״ל)', protein: 'חלבון (ג׳)', carbs: 'פחמימות (ג׳)', fat: 'שומן (ג׳)', fiber: 'סיבים (ג׳)' }[k]}</T.Body>
            <T.Body style={{ fontFamily: fonts.medium }}>{fmt(food.per100?.[k] ?? null)}</T.Body>
          </Row>
        ))}
        {food.allergens?.length ? <T.Muted style={{ marginTop: 6 }}>אלרגנים ידועים: {food.allergens.join(', ')}</T.Muted> : null}
        {food.barcode ? <T.Caption>ברקוד: {food.barcode}</T.Caption> : null}
        <T.Caption>מקור: {food.source}</T.Caption>
      </Card>

      <Row style={{ marginTop: space.md }}>
        <Button title="השוואה" variant="ghost" icon="list" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/compare', params: { a: food.id } })} />
        <Button title="דיווח על ערך שגוי" variant="ghost" icon="flag" style={{ flex: 1 }} onPress={() => setReporting(true)} />
      </Row>

      <Sheet visible={reporting} onClose={() => setReporting(false)} title="דיווח על ערך שגוי">
        <Field label="מה לא נכון?" value={reportText} onChangeText={setReportText} multiline placeholder="למשל: החלבון בתווית הוא 11 ג׳" />
        <T.Caption style={{ marginBottom: space.md }}>הדיווח נשמר ויבדק לפני כל שינוי ציבורי במאגר.</T.Caption>
        <Button title="שליחה" disabled={reportText.trim().length < 3} onPress={() => { report(food.id, reportText.trim()); setReportText(''); setReporting(false); toast('תודה! הדיווח נשמר'); }} />
      </Sheet>
    </Screen>
  );
}

function Macro({ l, v }: { l: string; v: number | null | undefined }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[type.value, { color: colors.text, fontSize: 18 }]}>{fmt(v ?? null)}</Text>
      <T.Caption>{l} (ג׳)</T.Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { width: 150, height: 150, borderRadius: 40 },
  ph: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
