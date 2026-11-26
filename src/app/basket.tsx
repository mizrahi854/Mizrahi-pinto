import React, { useRef, useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { computeFoodEntry, rescale, totalsOf } from '@/lib/engine';
import { fmt, isAdult } from '@/lib/nutrition';
import { dateKey, addDays, prettyDate } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { FOOD_PHOTO } from '@/data/media';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import type { BasketItem } from '@/data/types';

/** 25 Multi-product meal ("basket"): edit amounts, remove, live totals, log / save as one meal / save as template */
export default function Basket() {
  const basket = useApp((s) => s.basket);
  const userFoods = useApp((s) => s.foods);
  const update = useApp((s) => s.basketUpdate);
  const remove = useApp((s) => s.basketRemove);
  const clear = useApp((s) => s.basketClear);
  const logBasket = useApp((s) => s.logBasket);
  const saveAsMeal = useApp((s) => s.saveBasketAsMeal);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const [meal, setMeal] = useState(defaultMeal());
  const [date, setDate] = useState(dateKey());
  const [name, setName] = useState('');
  const [asOne, setAsOne] = useState(false);
  const busy = useRef(false);
  const t = totalsOf(basket);

  const setAmount = (b: BasketItem, amount: number) => {
    const a = Math.max(0, Math.round(amount * 10) / 10);
    const food = findFood(b.foodId, userFoods);
    if (food) {
      const c = computeFoodEntry(food, a, { label: b.unitLabel, grams: b.unitGrams });
      update(b.key, { amount: a, grams: c.grams, nutrients: c.nutrients });
    } else if (b.amount > 0) {
      update(b.key, { amount: a, grams: b.grams == null ? null : Math.round((b.grams * a) / b.amount), nutrients: rescale(b.nutrients, a / b.amount) });
    }
  };

  const log = () => {
    if (busy.current || !basket.length) return;
    if (asOne && name.trim().length < 2) return toast('תן שם לארוחה כדי לשמור אותה כפריט אחד');
    busy.current = true;
    const n = logBasket({ meal, date, asOne: asOne ? name.trim() : undefined });
    haptic.success();
    toast(asOne ? `"${name.trim()}" נוספה ליומן` : `${n} פריטים נוספו ליומן`, { label: 'ליומן', onPress: () => router.push({ pathname: '/diary', params: { date } }) });
    setTimeout(() => { busy.current = false; }, 700);
    goBack();
  };

  const saveTemplate = () => {
    if (!basket.length) return;
    const nm = name.trim() || `ארוחה ${new Date().toLocaleDateString('he-IL')}`;
    saveAsMeal(nm);
    haptic.success();
    toast(`"${nm}" נשמרה בארוחות הקבועות`);
  };

  return (
    <LightScreen
      title="סל הארוחה"
      subtitle={`${basket.length} פריטים${adult ? ` · ${t.kcal}${t.partial.kcal ? '*' : ''} קק״ל` : ''}`}
      footer={basket.length ? <LPrimary title={`הוספה ליומן · ${meals.find((m) => m.key === meal)?.label ?? ''}`} icon="check" onPress={log} /> : undefined}
    >
      {basket.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 50, gap: 10 }}>
          <Icon name="cart" size={40} color={light.accent} />
          <Text style={ls.h2}>הסל ריק</Text>
          <Text style={[ls.muted, { textAlign: 'center' }]}>בחר מוצרים בחיפוש ולחץ ״הוסף והמשך״ – כולם יופיעו כאן כארוחה אחת.</Text>
          <Tap onPress={() => router.replace('/foods?focus=1')} label="לחיפוש מוצרים"><View style={styles.ghost}><Text style={styles.ghostText}>לחיפוש מוצרים</Text></View></Tap>
        </View>
      ) : (
        <>
          {/* live totals */}
          <LCard style={styles.totals}>
            {adult && <Total label="קלוריות" v={`${t.kcal}${t.partial.kcal ? '*' : ''}`} />}
            <Total label="חלבון" v={`${fmt(t.protein)}${t.partial.protein ? '*' : ''}`} />
            <Total label="פחמימות" v={`${fmt(t.carbs)}${t.partial.carbs ? '*' : ''}`} />
            <Total label="שומן" v={`${fmt(t.fat)}${t.partial.fat ? '*' : ''}`} />
          </LCard>
          {(t.partial.kcal || t.partial.protein) && <Text style={[ls.caption, { textAlign: 'center', marginTop: 6 }]}>* לחלק מהפריטים אין ערכים ידועים – הסכום חלקי</Text>}

          <View style={{ gap: 10, marginTop: space.md }}>
            {basket.map((b) => {
              const photo = b.foodId ? FOOD_PHOTO[b.foodId] : undefined;
              const step = b.unitGrams == null ? 10 : 0.5;
              return (
                <View key={b.key} style={styles.item}>
                  {photo ? <Image source={photo} style={styles.thumb} contentFit="cover" /> : b.imageUrl ? <Image source={{ uri: b.imageUrl }} style={[styles.thumb, { backgroundColor: '#fff' }]} contentFit="contain" /> : <View style={[styles.thumb, styles.thumbPh]}><Icon name="bowl" size={22} color={light.accent} /></View>}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={ls.bodyStrong} numberOfLines={1}>{b.name}</Text>
                    <Text style={ls.muted}>{adult ? (b.nutrients.kcal == null ? 'ערך לא ידוע' : `${b.nutrients.kcal} קק״ל`) : ''}{b.grams != null && b.unitGrams != null ? ` · ${b.grams} ג׳` : ''}</Text>
                    <View style={styles.qty}>
                      <Tap onPress={() => setAmount(b, b.amount + step)} label={`הגדלת ${b.name}`}><View style={styles.qBtn}><Icon name="plus" size={18} color={light.text} /></View></Tap>
                      <Text style={styles.qText}>{b.amount} {b.unitLabel}</Text>
                      <Tap onPress={() => setAmount(b, b.amount - step)} label={`הקטנת ${b.name}`}><View style={styles.qBtn}><Icon name="minus" size={18} color={light.text} /></View></Tap>
                    </View>
                  </View>
                  <Tap onPress={() => { remove(b.key); haptic.warn(); }} label={`הסרת ${b.name}`}><View style={styles.trash}><Icon name="trash" size={20} color={light.text2} /></View></Tap>
                </View>
              );
            })}
          </View>

          <Tap onPress={() => router.push('/foods?focus=1')} label="הוספת מוצר נוסף לסל">
            <View style={[styles.ghost, { marginTop: space.md }]}><Icon name="plus" size={18} color={light.accent} /><Text style={styles.ghostText}>הוספת מוצר נוסף</Text></View>
          </Tap>

          <Text style={[ls.h2, styles.section]}>לאן להוסיף</Text>
          <View style={styles.chips}>
            {meals.map((m) => (
              <Pressable key={m.key} onPress={() => setMeal(m.key)} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.chip, meal === m.key && styles.chipOn]}>
                <Text style={[styles.chipText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.chips, { marginTop: 8 }]}>
            {[0, -1, 1].map((d) => {
              const k = addDays(dateKey(), d);
              return (
                <Pressable key={k} onPress={() => setDate(k)} accessibilityRole="radio" accessibilityState={{ selected: date === k }} accessibilityLabel={prettyDate(k)} style={[styles.chip, date === k && styles.chipOn]}>
                  <Text style={[styles.chipText, date === k && { color: '#fff' }]}>{prettyDate(k)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[ls.h2, styles.section]}>שם לארוחה</Text>
          <TextInput value={name} onChangeText={setName} placeholder="למשל: ארוחת בוקר קבועה" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="שם לארוחה" />
          <Pressable onPress={() => setAsOne(!asOne)} accessibilityRole="checkbox" accessibilityState={{ checked: asOne }} accessibilityLabel="לשמור ביומן כפריט אחד בשם הזה" style={styles.checkRow}>
            <View style={[styles.box, asOne && styles.boxOn]}>{asOne && <Icon name="check" size={14} color="#fff" strokeWidth={2.6} />}</View>
            <Text style={ls.body}>להוסיף ליומן כארוחה אחת בשם הזה</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: space.md }}>
            <Tap onPress={saveTemplate} label="שמירה כארוחה קבועה" style={{ flex: 1 }}><View style={styles.ghost}><Icon name="star" size={18} color={light.accent} /><Text style={styles.ghostText}>שמירה כארוחה קבועה</Text></View></Tap>
            <Tap onPress={() => { clear(); toast('הסל נוקה'); }} label="ניקוי הסל" style={{ flex: 1 }}><View style={[styles.ghost, { borderColor: '#DCD5D0' }]}><Text style={[styles.ghostText, { color: light.text2 }]}>ניקוי הסל</Text></View></Tap>
          </View>
        </>
      )}
    </LightScreen>
  );
}

function Total({ label, v }: { label: string; v: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${label}: ${v}`}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: light.text, fontVariant: ['tabular-nums'] }}>{v}</Text>
      <Text style={ls.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  totals: { flexDirection: 'row', paddingVertical: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.lg, backgroundColor: light.card },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  thumbPh: { backgroundColor: light.accentSoft, alignItems: 'center', justifyContent: 'center' },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  qBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: light.cardSoft, alignItems: 'center', justifyContent: 'center' },
  qText: { fontFamily: fonts.semibold, fontSize: 15, color: light.text, minWidth: 70, textAlign: 'center' },
  trash: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: space.xl, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: light.accent, borderColor: light.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: light.text },
  input: { minHeight: 50, borderRadius: radius.md, backgroundColor: light.cardSoft, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: light.text },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.md, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: '#CFC8C3', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: light.accent, borderColor: light.accent },
  ghost: { minHeight: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(242,107,29,0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 },
  ghostText: { fontFamily: fonts.semibold, fontSize: 14.5, color: light.accentText },
});
