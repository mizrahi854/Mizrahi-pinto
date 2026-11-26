import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown, useReducedMotion } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { Tap, toast, useDragToClose } from './ui';
import { MAX_W } from './Brand';
import { useApp, findFood, tracksCalories } from '@/store/useApp';
import { useMeals, useLogTarget } from '@/store/selectors';
import { prettyDate, addDays, nowTime } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import { unitsFor, computeFoodEntry } from '@/lib/engine';
import { useReduceTransparency } from '@/lib/a11y';
import { colors, fonts } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const INK = '#131416';
const MUTED = '#55575C';

/**
 * "הוסף ליומן" – the Log-Food sheet. The screen behind blurs, a light glass sheet rises:
 * meal / calories toggle, six glass tiles, recent foods, quick calories (adults who track calories),
 * and (from the central +) planning shortcuts.
 */
export function AddSheet({ planning, pMeal, pDate }: { planning?: boolean; pMeal?: string; pDate?: string }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const solid = useReduceTransparency();
  const target = useLogTarget(pMeal, pDate);
  const [meal, setMeal] = useState(target.meal);
  const date = target.date;
  const meals = useMeals();
  const calories = useApp((s) => tracksCalories(s.profile));
  const setLogCtx = useApp((s) => s.setLogCtx);
  const recentIds = useApp((s) => s.recentFoodIds);
  const userFoods = useApp((s) => s.foods);
  const savedCount = useApp((s) => s.savedMeals.length);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const addEntry = useApp((s) => s.addEntry);
  const removeEntry = useApp((s) => s.removeEntry);
  const copyMeal = useApp((s) => s.copyMeal);
  const [view, setView] = useState<'grid' | 'recent'>('grid');
  const [kcal, setKcal] = useState('');
  React.useEffect(() => { setLogCtx(date, meal); }, [date, meal, setLogCtx]);
  const recent = useMemo(() => recentIds.map((id) => findFood(id, userFoods)).filter((f): f is NonNullable<typeof f> => !!f).slice(0, 8), [recentIds, userFoods]);
  const close = () => goBack();
  const drag = useDragToClose(close);
  const go = (href: any) => { goBack(); setTimeout(() => router.push(href), 40); };
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  const tiles: { icon: IconName; title: string; sub: string; onPress: () => void; accent?: boolean }[] = [
    { icon: 'barcode', title: 'סרוק ברקוד', sub: 'הוסף מוצר בשנייה', onPress: () => go('/barcode'), accent: true },
    { icon: 'camera', title: 'צלם ארוחה', sub: 'תמונה לארוחה', onPress: () => go('/meal-photo') },
    { icon: 'search', title: 'חפש מזון', sub: 'מאגר מזונות מהיר', onPress: () => go('/foods?focus=1') },
    { icon: 'edit', title: 'תאר את המזון', sub: 'במילים חופשיות', onPress: () => go('/describe') },
    { icon: 'clock', title: 'מזונות אחרונים', sub: recent.length ? `${recent.length} להוספה מהירה` : 'יופיעו אחרי שימוש', onPress: () => setView('recent') },
    { icon: 'layers', title: 'ארוחות שמורות', sub: savedCount ? `${savedCount} ארוחות` : 'הארוחות שלך', onPress: () => go('/saved-meals') },
  ];

  const quickAdd = (id: string) => {
    const f = findFood(id, userFoods);
    if (!f) return;
    const unit = unitsFor(f).find((u) => u.grams != null) ?? { label: f.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: null };
    const amount = unit.grams == null ? 100 : 1;
    const e = addFoodToLog(f, amount, unit.label, meal, date, computeFoodEntry(f, amount, unit).grams);
    haptic.success();
    toast(`${f.name} נוסף`, { label: 'ביטול', onPress: () => removeEntry(e.id) });
  };
  const saveKcal = () => {
    const v = Number(kcal);
    if (!kcal || !isFinite(v) || v <= 0 || v > 9999) return toast('הזן מספר קלוריות');
    const e = addEntry({ date, meal, time: nowTime(), name: 'קלוריות', amount: 1, unitLabel: 'מנה', grams: null, nutrients: { kcal: Math.round(v), protein: null, carbs: null, fat: null } });
    haptic.success();
    setKcal('');
    toast(`נשמר · ${Math.round(v)} קק״ל ל${meals.find((m) => m.key === meal)?.label}`, { label: 'ביטול', onPress: () => removeEntry(e.id) });
    close();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.root}>
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        {!solid && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,9,10,0.45)' }]} onPress={close} accessibilityLabel="סגירה" accessibilityRole="button" />
      </Animated.View>
      <Animated.View entering={reduce ? undefined : SlideInDown.springify().damping(22).stiffness(230)} style={[st.wrap, drag.style]} accessibilityViewIsModal>
        <View style={[st.sheet, { paddingBottom: insets.bottom + 14 }, solid && { backgroundColor: '#ECECEF' }]}>
          {!solid && <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />}
          {!solid && <LinearGradient colors={['rgba(246,246,248,0.80)', 'rgba(232,233,236,0.90)']} style={StyleSheet.absoluteFill} pointerEvents="none" />}
          <View style={st.warm} pointerEvents="none" />
          <View {...drag.handlers} style={{ paddingTop: 10 }}>
            <View style={st.grabber} accessibilityLabel="גרירה למטה לסגירה" />
            <View style={st.titleRow}>
              <Icon name="calendar" size={30} color={INK} strokeWidth={1.8} />
              <Text style={st.title} accessibilityRole="header">הוסף ליומן</Text>
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 600 }}>
            {/* meal / calories toggle */}
            <View style={st.seg} accessibilityRole="tablist">
              <Pressable onPress={() => setView('grid')} accessibilityRole="tab" accessibilityState={{ selected: true }} accessibilityLabel="הוסף ארוחה" style={[st.segItem, st.segOn]}>
                <LinearGradient colors={['#E8691F', colors.accentButton]} style={StyleSheet.absoluteFill} />
                <Icon name="food" size={20} color="#fff" /><Text style={[st.segText, { color: '#fff' }]}>הוסף ארוחה</Text>
              </Pressable>
              <Pressable onPress={() => go({ pathname: '/add-calories', params: { meal, date } })} accessibilityRole="tab" accessibilityState={{ selected: false }} accessibilityLabel={calories ? 'הוסף קלוריות' : 'הזנה ידנית'} style={st.segItem}>
                <Icon name={calories ? 'flame' : 'edit'} size={20} color={INK} /><Text style={st.segText}>{calories ? 'הוסף קלוריות' : 'הזנה ידנית'}</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.meals} accessibilityRole="radiogroup">
              {meals.map((m) => (
                <Pressable key={m.key} onPress={() => { haptic.select(); setMeal(m.key); }} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[st.mealChip, meal === m.key && st.mealOn]}>
                  <Text style={[st.mealText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
                </Pressable>
              ))}
              <Text style={st.when}>{prettyDate(date)}</Text>
            </ScrollView>

            {view === 'grid' ? (
              <View style={st.grid}>
                {tiles.map((t) => (
                  <Tap key={t.title} onPress={t.onPress} label={`${t.title}. ${t.sub}`} style={st.tileWrap}>
                    <View style={st.tile}>
                      <Icon name={t.icon} size={34} color={t.accent ? colors.accentButton : INK} strokeWidth={1.7} />
                      <Text style={st.tileTitle}>{t.title}</Text>
                      <Text style={st.tileSub} numberOfLines={1}>{t.sub}</Text>
                    </View>
                  </Tap>
                ))}
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 4 }}>
                <Tap onPress={() => setView('grid')} label="חזרה לאפשרויות"><View style={st.back}><Icon name="chevron" size={18} color={INK} /><Text style={st.tileTitle}>מזונות אחרונים</Text></View></Tap>
                {recent.length ? recent.map((f) => (
                  <View key={f.id} style={st.recent}>
                    <Pressable onPress={() => go({ pathname: '/food/[id]', params: { id: f.id, meal, date } })} accessibilityRole="button" accessibilityLabel={`${f.name}. בחירת כמות`} style={{ flex: 1, minHeight: 50, justifyContent: 'center' }}>
                      <Text style={st.recentName} numberOfLines={1}>{f.name}</Text>
                      <Text style={st.tileSub} numberOfLines={1}>{f.portions[0] ? `${f.portions[0].label} · ${f.portions[0].grams} ג׳` : '100 ג׳'}</Text>
                    </Pressable>
                    <Tap onPress={() => quickAdd(f.id)} label={`הוספה מהירה של ${f.name}`}><View style={st.plus}><Icon name="plus" size={22} color="#fff" strokeWidth={2.4} /></View></Tap>
                  </View>
                )) : <Text style={[st.tileSub, { textAlign: 'center', padding: 16 }]}>מוצרים שתוסיף יופיעו כאן להוספה בלחיצה אחת.</Text>}
                <Tap onPress={() => { const n = copyMeal(addDays(date, -1), meal, date); haptic.success(); toast(n ? `${n} פריטים הועתקו מאתמול` : 'אין פריטים בארוחה הזו אתמול'); if (n) close(); }} label="שכפול אותה ארוחה מאתמול">
                  <View style={st.back}><Icon name="copy" size={18} color={INK} /><Text style={st.tileSub}>שכפול {meals.find((m) => m.key === meal)?.label} מאתמול</Text></View>
                </Tap>
              </View>
            )}

            {calories && (
              <>
                <View style={st.hr} />
                <View style={st.quick}>
                  <Icon name="flame" size={26} color={colors.accentButton} />
                  <Text style={st.quickLabel}>הוסף קלוריות{'\n'}מהיר</Text>
                  <View style={st.quickField}>
                    <TextInput value={kcal} onChangeText={(t) => setKcal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" inputMode="numeric" placeholder="0" placeholderTextColor="#9A9CA0" style={st.quickInput} accessibilityLabel="מספר קלוריות להזנה מהירה" returnKeyType="done" onSubmitEditing={saveKcal} />
                    <Text style={st.unit}>קק״ל</Text>
                  </View>
                  <Tap onPress={saveKcal} label="שמירת הקלוריות">
                    <View style={st.save}><LinearGradient colors={['#E8691F', colors.accentButton]} style={StyleSheet.absoluteFill} /><Icon name="check" size={20} color="#fff" strokeWidth={2.4} /><Text style={st.saveText}>שמור</Text></View>
                  </Tap>
                </View>
              </>
            )}

            {planning && (
              <>
                <View style={st.hr} />
                <View style={st.planRow}>
                  {([['dumbbell', 'תכנן אימון', '/workout'], ['cloche', 'תכנן מסעדה', { pathname: '/event', params: { type: 'restaurant' } }], ['alarm', 'הוסף תזכורת', { pathname: '/alarm', params: { new: '1' } }]] as [IconName, string, any][]).map(([ic, l, href]) => (
                    <Tap key={l} onPress={() => go(href)} label={l} style={{ flex: 1 }}>
                      <View style={st.planBtn}><Icon name={ic} size={20} color={INK} /><Text style={st.planText}>{l}</Text></View>
                    </Tap>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const glassTile = Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(20,22,30,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' } as any) : { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } };

const st = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  wrap: { width: '100%', maxWidth: MAX_W },
  sheet: { borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 18 },
  warm: { position: 'absolute', top: -120, left: -80, width: 260, height: 200, borderRadius: 130, backgroundColor: 'rgba(245,121,37,0.06)' },
  grabber: { width: 48, height: 5, borderRadius: 3, backgroundColor: 'rgba(19,20,22,0.22)', alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: INK },
  seg: { flexDirection: 'row', padding: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', gap: 4 },
  segItem: { flex: 1, minHeight: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  segOn: {},
  segText: { fontFamily: fonts.bold, fontSize: 17, color: INK },
  meals: { gap: 8, paddingVertical: 12, alignItems: 'center' },
  mealChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(19,20,22,0.08)', justifyContent: 'center' },
  mealOn: { backgroundColor: INK, borderColor: INK },
  mealText: { fontFamily: fonts.semibold, fontSize: 14.5, color: INK },
  when: { fontFamily: fonts.regular, fontSize: 13, color: MUTED, paddingHorizontal: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  tileWrap: { width: '33.333%', padding: 5 },
  tile: { minHeight: 132, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', ...glassTile },
  tileTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: INK, textAlign: 'center' },
  tileSub: { fontFamily: fonts.regular, fontSize: 12.5, color: MUTED, textAlign: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 6 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingStart: 14, paddingEnd: 6, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)' },
  recentName: { fontFamily: fonts.semibold, fontSize: 15, color: INK },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentButton, alignItems: 'center', justifyContent: 'center' },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(19,20,22,0.15)', marginVertical: 14 },
  quick: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingStart: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', ...glassTile },
  quickLabel: { fontFamily: fonts.semibold, fontSize: 13.5, lineHeight: 17, color: INK },
  quickField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 50, borderRadius: 999, backgroundColor: 'rgba(19,20,22,0.05)', paddingHorizontal: 10 },
  quickInput: { flex: 1, fontFamily: fonts.bold, fontSize: 28, color: INK, textAlign: 'center', minWidth: 50, outlineStyle: 'none' } as any,
  unit: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },
  save: { minHeight: 50, paddingHorizontal: 18, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'hidden' },
  saveText: { fontFamily: fonts.bold, fontSize: 17, color: '#fff' },
  planRow: { flexDirection: 'row', gap: 8 },
  planBtn: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  planText: { fontFamily: fonts.semibold, fontSize: 13, color: INK },
});
