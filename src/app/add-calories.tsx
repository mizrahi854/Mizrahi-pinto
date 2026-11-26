import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Panel } from '@/components/Panel';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, tracksCalories } from '@/store/useApp';
import { useMeals, useLogTarget } from '@/store/selectors';
import { validateNutrients } from '@/lib/nutrition';
import { dateKey, nowTime, addDays, prettyDate } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

type Draft = { kcal: string; name: string; protein: string; carbs: string; fat: string };
const EMPTY: Draft = { kcal: '', name: '', protein: '', carbs: '', fat: '' };

/**
 * "+ הוסף קלוריות" – log a number in seconds, without creating a product. Adults who track calories.
 * Others get the same quick form as "manual entry": a dish name, no numbers.
 */
export default function AddCalories() {
  const p = useLocalSearchParams<{ date?: string; meal?: string }>();
  const profile = useApp((s) => s.profile);
  const calories = tracksCalories(profile);
  const addEntry = useApp((s) => s.addEntry);
  const removeEntry = useApp((s) => s.removeEntry);
  const savedDraft = useApp((s) => s.drafts['add-calories'] as Draft | undefined);
  const setDraft = useApp((s) => s.setDraft);
  const clearDraft = useApp((s) => s.clearDraft);
  const meals = useMeals();
  const target = useLogTarget(p.meal, p.date);
  const [d, setD] = useState<Draft>(savedDraft ?? EMPTY);
  const [meal, setMeal] = useState(target.meal);
  const [date, setDate] = useState(target.date);
  const [time, setTime] = useState(nowTime());
  const [more, setMore] = useState(!!(savedDraft?.protein || savedDraft?.carbs || savedDraft?.fat));
  const [err, setErr] = useState<string | null>(null);
  const saving = useRef(false);
  const upd = (patch: Partial<Draft>) => { const n = { ...d, ...patch }; setD(n); setErr(null); setDraft('add-calories', n); };

  const save = () => {
    if (saving.current) return;
    const { value, errors } = validateNutrients(calories ? { kcal: d.kcal, protein: d.protein, carbs: d.carbs, fat: d.fat } : {});
    if (errors.length) return setErr(errors[0]!);
    if (calories && value.kcal == null) return setErr('הזן מספר קלוריות');
    if (!calories && d.name.trim().length < 2) return setErr('הזן שם למאכל');
    if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) return setErr('שעה לא תקינה (למשל 13:30)');
    saving.current = true;
    const name = d.name.trim() || 'קלוריות';
    const e = addEntry({ date, meal, time, name, amount: 1, unitLabel: 'מנה', grams: null, nutrients: { ...value, fiber: null } });
    clearDraft('add-calories');
    haptic.success();
    toast(`נשמר · ${calories ? `${value.kcal} קק״ל` : name}`, { label: 'ביטול', onPress: () => removeEntry(e.id) });
    goBack('/(tabs)/diary');
    setTimeout(() => { saving.current = false; }, 600);
  };

  return (
    <Panel title={calories ? 'הוספת קלוריות' : 'הזנה ידנית'} subtitle="בלי ליצור מוצר במאגר" scroll
      footer={
        <Tap onPress={save} label="שמירה ליומן">
          <View style={styles.save}><Icon name="check" size={22} color={colors.textOnAccent} strokeWidth={2.4} /><Text style={styles.saveText}>שמירה</Text></View>
        </Tap>
      }>
      {calories && (
        <View style={styles.hero}>
          <TextInput
            value={d.kcal}
            onChangeText={(t) => upd({ kcal: t.replace(/[^\d]/g, '') })}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.kcal}
            accessibilityLabel="מספר קלוריות"
            autoFocus
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Text style={styles.kcalUnit}>קלוריות</Text>
        </View>
      )}

      <Text style={styles.label}>שם המאכל {calories ? <Text style={styles.muted}>(לא חובה)</Text> : null}</Text>
      <TextInput value={d.name} onChangeText={(t) => upd({ name: t })} placeholder="למשל: שוקולד, עוגה במשרד" placeholderTextColor="rgba(255,255,255,0.4)" style={styles.input} accessibilityLabel="שם המאכל" autoFocus={!calories} returnKeyType="done" />

      <Text style={styles.label}>סוג הארוחה</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {meals.map((m) => <Chip key={m.key} label={m.label} on={meal === m.key} onPress={() => setMeal(m.key)} />)}
      </ScrollView>

      <Text style={styles.label}>תאריך ושעה</Text>
      <View style={[styles.chips, { flexWrap: 'wrap' }]}>
        {[0, -1, -2].map((k) => { const v = addDays(dateKey(), k); return <Chip key={v} label={prettyDate(v)} on={date === v} onPress={() => setDate(v)} />; })}
        <View style={styles.timeBox}>
          <Icon name="clock" size={18} color={colors.text2} />
          <TextInput value={time} onChangeText={setTime} style={styles.time} maxLength={5} keyboardType="numbers-and-punctuation" accessibilityLabel="שעה" />
        </View>
      </View>

      {calories && (
        <>
          <Tap onPress={() => setMore(!more)} label={more ? 'הסתרת ערכים נוספים' : 'הוספת חלבון, פחמימות ושומן'}>
            <View style={styles.moreBtn}><Text style={styles.moreText}>{more ? '− הסתרת ערכים נוספים' : '+ חלבון, פחמימות, שומן (לא חובה)'}</Text></View>
          </Tap>
          {more && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['protein', 'חלבון'], ['carbs', 'פחמימות'], ['fat', 'שומן']] as const).map(([k, l]) => (
                <View key={k} style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.muted}>{l} (ג׳)</Text>
                  <TextInput value={d[k]} onChangeText={(t) => upd({ [k]: t.replace(/[^\d.]/g, '') })} placeholder="—" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="decimal-pad" style={[styles.input, { textAlign: 'center' }]} accessibilityLabel={`${l} בגרמים`} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
      {err && <View style={styles.err} accessibilityLiveRegion="polite"><Icon name="flag" size={16} color="#FFB4A0" /><Text style={styles.errText}>{err}</Text></View>}
      <Text style={[styles.muted, { textAlign: 'center', marginVertical: 10 }]}>ערך שלא הוזן נשמר כ״לא ידוע״ ולא כאפס.</Text>
      {!calories && <Tap onPress={() => { goBack(); setTimeout(() => router.push('/foods?focus=1'), 40); }} label="חיפוש במאגר במקום"><Text style={[styles.moreText, { textAlign: 'center', padding: 10 }]}>חיפוש במאגר במקום</Text></Tap>}
    </Panel>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { haptic.select(); onPress(); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && { color: colors.textOnAccent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginVertical: space.sm },
  kcal: { minWidth: 170, fontFamily: fonts.bold, fontSize: 64, lineHeight: 76, color: colors.text, textAlign: 'center', paddingVertical: 0, borderBottomWidth: 2, borderBottomColor: colors.accentLight, outlineStyle: 'none' } as any,
  kcalUnit: { fontFamily: fonts.medium, fontSize: 18, color: colors.text2 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: space.md, marginBottom: 8 },
  muted: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  input: { minHeight: 50, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.text, textAlign: 'right' },
  chips: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.accentLight, borderColor: colors.accentLight },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
  time: { minWidth: 56, fontFamily: fonts.semibold, fontSize: 15, color: colors.text, textAlign: 'center' },
  moreBtn: { minHeight: 44, justifyContent: 'center', marginTop: space.sm },
  moreText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accentLight },
  err: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(229,72,77,0.16)' },
  errText: { fontFamily: fonts.medium, fontSize: 14, color: '#FFD3C8', flex: 1 },
  save: { marginTop: space.sm, minHeight: 58, borderRadius: radius.pill, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { fontFamily: fonts.bold, fontSize: 18, color: colors.textOnAccent },
});
