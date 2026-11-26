import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Panel } from '@/components/Panel';
import { Tap, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useMeals, useLogTarget } from '@/store/selectors';
import { prettyDate, addDays, dateKey } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import { unitsFor, computeFoodEntry } from '@/lib/engine';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** "+ הוסף ארוחה" panel – every way to log food, one tap away. Logs to the chosen meal & date. */
export default function AddMeal() {
  const p = useLocalSearchParams<{ meal?: string; date?: string }>();
  const target = useLogTarget(p.meal, p.date);
  const [meal, setMeal] = React.useState(target.meal);
  const date = target.date;
  const meals = useMeals();
  const setLogCtx = useApp((s) => s.setLogCtx);
  const recentIds = useApp((s) => s.recentFoodIds);
  const userFoods = useApp((s) => s.foods);
  const savedCount = useApp((s) => s.savedMeals.length);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const removeEntry = useApp((s) => s.removeEntry);
  const copyMeal = useApp((s) => s.copyMeal);
  React.useEffect(() => { setLogCtx(date, meal); }, [date, meal, setLogCtx]);
  const recent = useMemo(() => recentIds.map((id) => findFood(id, userFoods)).filter((f): f is NonNullable<typeof f> => !!f).slice(0, 8), [recentIds, userFoods]);
  const go = (href: any) => { goBack(); setTimeout(() => router.push(href), 40); };

  const options: { icon: IconName; label: string; hint?: string; href: any }[] = [
    { icon: 'camera', label: 'צילום ארוחה', href: '/meal-photo' },
    { icon: 'barcode', label: 'סריקת ברקוד', href: '/barcode' },
    { icon: 'search', label: 'חיפוש מוצר', href: '/foods?focus=1' },
    { icon: 'food', label: 'גלריית מזון', href: '/foods' },
    { icon: 'star', label: 'ארוחות שמורות', hint: savedCount ? String(savedCount) : undefined, href: '/saved-meals' },
    { icon: 'edit', label: 'תיאור חופשי', href: '/describe' },
  ];

  const quickAdd = (id: string) => {
    const f = findFood(id, userFoods);
    if (!f) return;
    const unit = unitsFor(f).find((u) => u.grams != null) ?? { label: f.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: null };
    const amount = unit.grams == null ? 100 : 1;
    const calc = computeFoodEntry(f, amount, unit);
    const e = addFoodToLog(f, amount, unit.label, meal, date, calc.grams);
    haptic.success();
    toast(`${f.name} · ${amount} ${unit.label} נוסף`, { label: 'ביטול', onPress: () => removeEntry(e.id) });
  };

  return (
    <Panel title="הוספת ארוחה" subtitle={`${meals.find((m) => m.key === meal)?.label ?? ''} · ${prettyDate(date)}`} scroll>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mealRow} accessibilityRole="radiogroup">
        {meals.map((m) => (
          <Pressable key={m.key} onPress={() => { haptic.select(); setMeal(m.key); }} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.mealChip, meal === m.key && styles.mealChipOn]}>
            <Text style={[styles.mealChipText, meal === m.key && { color: colors.textOnAccent }]}>{m.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {options.map((o) => (
          <Tap key={o.label} onPress={() => go(o.href)} label={o.hint ? `${o.label}, ${o.hint}` : o.label} style={styles.cellWrap}>
            <View style={styles.cell}>
              <View style={styles.cellIcon}><Icon name={o.icon} size={26} color={colors.text} /></View>
              <Text style={styles.cellLabel}>{o.label}</Text>
              {o.hint ? <View style={styles.count}><Text style={styles.countText}>{o.hint}</Text></View> : null}
            </View>
          </Tap>
        ))}
      </View>

      <Text style={styles.section} accessibilityRole="header">מוצרים אחרונים</Text>
      {recent.length ? (
        <View style={{ gap: 6 }}>
          {recent.map((f) => (
            <View key={f.id} style={styles.recent}>
              <Pressable onPress={() => go({ pathname: '/food/[id]', params: { id: f.id, meal, date } })} accessibilityRole="button" accessibilityLabel={`${f.name}. בחירת כמות`} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
                <Text style={styles.recentName} numberOfLines={1}>{f.name}</Text>
                <Text style={styles.recentSub} numberOfLines={1}>{f.brand ?? (f.portions[0] ? `${f.portions[0].label} · ${f.portions[0].grams} ג׳` : '100 ג׳')}</Text>
              </Pressable>
              <Tap onPress={() => quickAdd(f.id)} label={`הוספה מהירה של ${f.name}`}>
                <View style={styles.plus}><Icon name="plus" size={22} color={colors.textOnAccent} strokeWidth={2.4} /></View>
              </Tap>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.recentSub}>מוצרים שתוסיף יופיעו כאן להוספה בלחיצה אחת.</Text>
      )}

      <Tap onPress={() => { const n = copyMeal(addDays(date, -1), meal, date); haptic.success(); toast(n ? `${n} פריטים הועתקו מאתמול` : 'אין פריטים בארוחה הזו אתמול'); if (n) goBack(); }} label="שכפול אותה ארוחה מאתמול">
        <View style={styles.copy}><Icon name="copy" size={20} color={colors.text} /><Text style={styles.copyText}>שכפול {meals.find((m) => m.key === meal)?.label} מאתמול</Text></View>
      </Tap>
      {date !== dateKey() && <Text style={[styles.recentSub, { textAlign: 'center', marginTop: 6 }]}>הרישום יישמר ל{prettyDate(date)}</Text>}
    </Panel>
  );
}

const styles = StyleSheet.create({
  mealRow: { gap: 8, paddingBottom: 12 },
  mealChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  mealChipOn: { backgroundColor: colors.accentLight, borderColor: colors.accentLight },
  mealChipText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cellWrap: { width: '33.333%', padding: 4 },
  cell: { alignItems: 'center', gap: 8, paddingVertical: 14, minHeight: 104, justifyContent: 'center', borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  cellIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emberMid },
  cellLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, textAlign: 'center' },
  count: { position: 'absolute', top: 6, left: 6, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textOnAccent },
  section: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, marginTop: space.lg, marginBottom: 8 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingStart: 14, paddingEnd: 6, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.06)' },
  recentName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  recentSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  copy: { marginTop: space.md, minHeight: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  copyText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
});
