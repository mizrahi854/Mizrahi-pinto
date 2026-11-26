import React, { useMemo, useRef, useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, LCard, LIconButton, ls } from '@/components/light';
import { Tap, Sheet, Field, Button, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { RulerPicker } from '@/components/RulerPicker';
import { useLogTarget } from '@/store/selectors';
import { useApp, findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { CATEGORY_ICON, CATEGORY_LABELS } from '@/data/foods';
import { FOOD_PHOTO } from '@/data/media';
import { fmt, isAdult } from '@/lib/nutrition';
import { unitsFor, computeFoodEntry } from '@/lib/engine';
import { dateKey, prettyDate } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { light, fonts, radius, space, colors } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 19 Product details + quantity picker */
export default function FoodDetail() {
  const { id, meal: pMeal, date: pDate } = useLocalSearchParams<{ id: string; meal?: string; date?: string }>();
  const userFoods = useApp((s) => s.foods);
  const food = findFood(id, userFoods);
  const favorites = useApp((s) => s.favorites);
  const toggleFav = useApp((s) => s.toggleFavorite);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const basketAdd = useApp((s) => s.basketAdd);
  const basketCount = useApp((s) => s.basket.length);
  const report = useApp((s) => s.reportFood);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const units = useMemo(() => (food ? unitsFor(food) : []), [food]);
  const [unitIdx, setUnitIdx] = useState(food && food.portions.length ? 1 : 0);
  const unit = units[unitIdx] ?? units[0] ?? { label: 'ג׳', grams: null };
  const [amount, setAmount] = useState(unitIdx === 0 ? 100 : 1);
  const [text, setText] = useState(String(unitIdx === 0 ? 100 : 1));
  const [ruler, setRuler] = useState(false);
  const target = useLogTarget(pMeal, pDate);
  const [meal, setMeal] = useState(target.meal);
  const [reporting, setReporting] = useState(false);
  const [reportText, setReportText] = useState('');
  const busy = useRef(false);
  const date = target.date;

  if (!food) {
    return <LightScreen title="מוצר"><Text style={[ls.body, { textAlign: 'center', marginTop: 30 }]}>המוצר לא נמצא</Text></LightScreen>;
  }
  const baseUnit = food.basis === 'ml' ? 'מ״ל' : 'ג׳';
  const calc = computeFoodEntry(food, amount, unit);
  const n = calc.nutrients;
  const fav = favorites.includes(food.id);
  const photo = FOOD_PHOTO[food.id];
  const perServing = !!food.servingLabel;
  const step = unit.grams == null ? 10 : 0.5;

  const setAmt = (v: number) => {
    const c = Math.max(0, Math.min(unit.grams == null ? 5000 : 50, Math.round(v * 10) / 10));
    setAmount(c);
    setText(String(c));
  };
  const pickUnit = (i: number) => {
    haptic.select();
    setUnitIdx(i);
    setAmt(units[i]!.grams == null ? 100 : 1);
  };

  const add = (keepGoing: boolean) => {
    if (busy.current || amount <= 0) return;
    busy.current = true;
    setTimeout(() => { busy.current = false; }, 700);
    if (keepGoing) {
      basketAdd({ foodId: food.id, name: food.name, brand: food.brand, amount, unitLabel: unit.label, unitGrams: unit.grams, grams: calc.grams, nutrients: n, imageUrl: food.imageUrl });
      haptic.success();
      toast(`${food.name} נוסף לסל הארוחה (${basketCount + 1})`);
      goBack();
      return;
    }
    addFoodToLog(food, amount, unit.label, meal, date, calc.grams);
    haptic.success();
    toast(`${food.name} נוסף ל${meals.find((m) => m.key === meal)?.label ?? 'יומן'}`, { label: 'ליומן', onPress: () => router.push({ pathname: '/(tabs)/diary', params: { date } }) });
    goBack();
  };

  return (
    <LightScreen
      title={food.name}
      subtitle={food.brand ?? CATEGORY_LABELS[food.category]}
      right={<LIconButton icon={fav ? 'starFill' : 'star'} label={fav ? 'הסרה ממועדפים' : 'הוספה למועדפים'} onPress={() => { toggleFav(food.id); haptic.select(); }} active={fav} />}
      heroHeight={170}
      hero={
        <View style={styles.heroImgWrap}>
          {photo ? <Image source={photo} style={styles.heroImg} contentFit="cover" accessibilityLabel={food.name} transition={150} />
            : food.imageUrl ? <Image source={{ uri: food.imageUrl }} style={[styles.heroImg, { backgroundColor: '#fff' }]} contentFit="contain" accessibilityLabel={`אריזה: ${food.name}`} transition={150} cachePolicy="disk" />
            : <View style={[styles.heroImg, styles.heroPh]}><Icon name={CATEGORY_ICON[food.category]} size={58} /></View>}
        </View>
      }
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tap onPress={() => add(true)} label="הוספה לסל והמשך בחירה" style={{ flex: 1 }}>
            <View style={styles.secondary}><Icon name="plus" size={18} color={light.text} /><Text style={styles.secondaryText}>הוסף והמשך</Text></View>
          </Tap>
          <Tap onPress={() => add(false)} label={`הוספה ליומן, ${n.kcal ?? '?'} קלוריות`} style={{ flex: 1.4 }}>
            <View style={styles.primary}><Text style={styles.primaryText}>הוספה ליומן{adult && n.kcal != null ? ` · ${n.kcal}` : ''}</Text></View>
          </Tap>
        </View>
      }
    >
      <View style={styles.badges}>
        <View style={[styles.badge, food.verified ? styles.badgeOk : styles.badgeWarn]}>
          <Icon name={food.verified ? 'check' : 'help'} size={14} color={food.verified ? '#2E7D4F' : '#9A5B00'} />
          <Text style={[styles.badgeText, { color: food.verified ? '#2E7D4F' : '#9A5B00' }]}>{food.verified ? 'מאומת' : food.id.startsWith('off_') ? 'מתווית היצרן · קהילת Open Food Facts' : food.isPrivate ? 'מוצר שהזנת' : 'ערך ייחוס כללי · לא מאומת'}</Text>
        </View>
        {food.state && <View style={[styles.badge, { backgroundColor: light.cardSoft }]}><Text style={styles.badgeText}>{food.state === 'raw' ? 'נא' : food.state === 'cooked' ? 'מבושל' : 'מוכן'}</Text></View>}
      </View>

      {!food.per100 ? (
        <LCard style={{ gap: 8, marginTop: space.md }}>
          <Text style={ls.bodyStrong}>חסרים ערכים תזונתיים</Text>
          <Text style={ls.muted}>אפשר להוסיף ליומן בלי ערכים (הם לא ייספרו כאפס), או להשלים מהתווית.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Tap onPress={() => router.push({ pathname: '/food-new', params: { from: food.id } })} label="השלמה מהתווית" style={{ flex: 1 }}><View style={styles.ghost}><Text style={styles.ghostText}>השלמה מהתווית</Text></View></Tap>
            <Tap onPress={() => router.push('/barcode')} label="סריקת ברקוד" style={{ flex: 1 }}><View style={styles.ghost}><Text style={styles.ghostText}>סריקת ברקוד</Text></View></Tap>
          </View>
        </LCard>
      ) : null}

      {/* quantity */}
      <Text style={[ls.h2, styles.section]}>כמות</Text>
      <View style={styles.units}>
        {units.map((u, i) => (
          <Pressable key={u.label + i} onPress={() => pickUnit(i)} accessibilityRole="radio" accessibilityState={{ selected: i === unitIdx }} accessibilityLabel={u.grams ? `${u.label}, ${u.grams} ${baseUnit}` : u.label} style={[styles.unit, i === unitIdx && styles.unitOn]}>
            <Text style={[styles.unitText, i === unitIdx && { color: '#fff' }]}>{u.label}</Text>
            {u.grams && !/\d/.test(u.label) ? <Text style={[styles.unitSub, i === unitIdx && { color: 'rgba(255,255,255,0.85)' }]}>{u.grams} {baseUnit}</Text> : null}
          </Pressable>
        ))}
      </View>
      <View style={styles.stepper}>
        <Tap onPress={() => setAmt(amount + step)} label="הגדלת כמות"><View style={styles.stepBtn}><Icon name="plus" size={24} color={light.text} /></View></Tap>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <TextInput
            value={text}
            onChangeText={(t) => { const c = t.replace(/[^\d.]/g, ''); setText(c); const v = Number(c); if (isFinite(v)) setAmount(v); }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={styles.amount}
            accessibilityLabel={`כמות ב${unit.label}`}
            selectTextOnFocus
          />
          <Text style={ls.muted}>{unit.label}{unit.grams ? ` · ${calc.grams} ${baseUnit}` : ''}</Text>
        </View>
        <Tap onPress={() => setAmt(amount - step)} label="הקטנת כמות"><View style={styles.stepBtn}><Icon name="minus" size={24} color={light.text} /></View></Tap>
      </View>
      {unit.grams == null && (
        <Tap onPress={() => setRuler(!ruler)} label={ruler ? 'הסתרת סרגל' : 'בחירה בסרגל'}>
          <Text style={[ls.muted, { textAlign: 'center', color: light.accentText, paddingVertical: 10 }]}>{ruler ? 'הסתרת הסרגל' : 'בחירה בסרגל נגלל'}</Text>
        </Tap>
      )}
      {ruler && unit.grams == null && (
        <View style={styles.rulerBox}><RulerPicker min={0} max={1000} step={5} value={amount} onChange={setAmt} unit={baseUnit} label="כמות" /></View>
      )}

      {/* live values */}
      {food.per100 && (
        <LCard style={{ marginTop: space.md }}>
          <View style={styles.rowHead}>
            <Text style={[ls.muted, { flex: 1.4 }]}> </Text>
            <Text style={styles.colHead}>בכמות שנבחרה</Text>
            <Text style={styles.colHead}>{perServing ? 'למנה' : `ל-100 ${baseUnit}`}</Text>
          </View>
          {(['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const).filter((k) => adult || k !== 'kcal').map((k) => (
            <View key={k} style={styles.row}>
              <Text style={[ls.body, { flex: 1.4 }]}>{{ kcal: 'אנרגיה (קק״ל)', protein: 'חלבון (ג׳)', carbs: 'פחמימות (ג׳)', fat: 'שומן (ג׳)', fiber: 'סיבים (ג׳)' }[k]}</Text>
              <Text style={[styles.cell, styles.cellStrong]}>{fmt(n[k] ?? null)}</Text>
              <Text style={styles.cell}>{fmt(food.per100?.[k] ?? null)}</Text>
            </View>
          ))}
        </LCard>
      )}

      {/* meal */}
      <Text style={[ls.h2, styles.section]}>לארוחה · {prettyDate(date)}</Text>
      <View style={styles.units}>
        {meals.map((m) => (
          <Pressable key={m.key} onPress={() => { haptic.select(); setMeal(m.key); }} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.unit, meal === m.key && styles.unitOn]}>
            <Text style={[styles.unitText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <LCard style={{ marginTop: space.lg, gap: 6 }}>
        {food.allergens?.length ? <Text style={ls.muted}>אלרגנים ידועים: {food.allergens.join(', ')}</Text> : null}
        {food.barcode ? <Text style={ls.caption}>ברקוד: {food.barcode}</Text> : null}
        <Text style={ls.caption}>מקור: {food.source}</Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
          <Tap onPress={() => setReporting(true)} label="דיווח על ערך שגוי"><Text style={styles.link}>דיווח על ערך שגוי</Text></Tap>
          {!food.isPrivate && <Tap onPress={() => router.push({ pathname: '/food-new', params: { from: food.id } })} label="עריכת עותק אישי"><Text style={styles.link}>עותק אישי</Text></Tap>}
        </View>
      </LCard>

      <Sheet visible={reporting} onClose={() => setReporting(false)} title="דיווח על ערך שגוי">
        <Field label="מה לא נכון?" value={reportText} onChangeText={setReportText} multiline placeholder="למשל: החלבון בתווית הוא 11 ג׳" />
        <Button title="שליחה" disabled={reportText.trim().length < 3} onPress={() => { report(food.id, reportText.trim()); setReportText(''); setReporting(false); toast('תודה! הדיווח נשמר'); }} />
      </Sheet>
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  heroImgWrap: { alignItems: 'center' },
  heroImg: { width: 190, height: 160, borderRadius: 28 },
  heroPh: { backgroundColor: 'rgba(232,120,42,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  badgeOk: { backgroundColor: '#E5F4EA' },
  badgeWarn: { backgroundColor: '#FFF2DC' },
  badgeText: { fontFamily: fonts.medium, fontSize: 12.5, color: light.text },
  section: { marginTop: space.xl, marginBottom: 10 },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unit: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  unitOn: { backgroundColor: light.accent, borderColor: light.accent },
  unitText: { fontFamily: fonts.semibold, fontSize: 14.5, color: light.text },
  unitSub: { fontFamily: fonts.regular, fontSize: 11.5, color: light.text2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.md, padding: 10, borderRadius: radius.lg, backgroundColor: light.card },
  stepBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: light.cardSoft, alignItems: 'center', justifyContent: 'center' },
  amount: { fontFamily: fonts.bold, fontSize: 40, color: light.text, textAlign: 'center', minWidth: 120, paddingVertical: 0 },
  rulerBox: { backgroundColor: '#1A100A', borderRadius: radius.lg, padding: 12 },
  rowHead: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: light.border },
  colHead: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12.5, color: light.text2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: light.border },
  cell: { flex: 1, textAlign: 'center', fontFamily: fonts.regular, fontSize: 15, color: light.text2, fontVariant: ['tabular-nums'] },
  cellStrong: { fontFamily: fonts.bold, color: light.text },
  link: { fontFamily: fonts.medium, fontSize: 14, color: light.accentText, paddingVertical: 8 },
  ghost: { minHeight: 46, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(242,107,29,0.4)', alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.semibold, fontSize: 14, color: light.accentText },
  secondary: { height: 58, borderRadius: radius.pill, borderWidth: 1.5, borderColor: '#DCD5D0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 16, color: light.text },
  primary: { height: 58, borderRadius: radius.pill, backgroundColor: light.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.bold, fontSize: 17, color: '#fff' },
});
