import React, { useRef, useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { validateNutrients, isAdult } from '@/lib/nutrition';
import { dateKey, nowTime, addDays, prettyDate, uid } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 22 Free entry – one-off calories (adults) or a named dish without values (5.7/5.8). No product required. */
export default function QuickCalories() {
  const profile = useApp((s) => s.profile);
  const adult = isAdult(profile.age);
  const addEntry = useApp((s) => s.addEntry);
  const upsertFood = useApp((s) => s.upsertFood);
  const meals = useMeals();
  const [kcal, setKcal] = useState('');
  const [name, setName] = useState('');
  const [macro, setMacro] = useState({ protein: '', carbs: '', fat: '' });
  const [note, setNote] = useState('');
  const [meal, setMeal] = useState(defaultMeal());
  const [date, setDate] = useState(dateKey());
  const [time, setTime] = useState(nowTime());
  const [showMore, setShowMore] = useState(false);
  const [saveAsProduct, setSaveAsProduct] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const saving = useRef(false);

  const save = (stay = false) => {
    if (saving.current) return;
    const { value, errors } = validateNutrients(adult ? { kcal, ...macro } : {});
    if (errors.length) return setErr(errors[0]!);
    if (adult && value.kcal == null && name.trim().length < 2) return setErr('הזן כמות קלוריות או לפחות שם למאכל');
    if (!adult && name.trim().length < 2) return setErr('הזן שם למאכל');
    if (!/^\d{1,2}:\d{2}$/.test(time)) return setErr('שעה לא תקינה (למשל 13:30)');
    saving.current = true;
    const label = name.trim() || 'קלוריות מהירות';
    addEntry({ date, meal, time, name: label, amount: 1, unitLabel: 'מנה', grams: null, nutrients: { ...value, fiber: null }, note: note.trim() || undefined });
    if (saveAsProduct && name.trim().length >= 2) {
      upsertFood({ id: `u_${uid()}`, name: name.trim(), category: 'custom', basis: 'g', per100: null, portions: [{ label: 'מנה', grams: 100 }], source: 'מנה אישית שהמשתמש הזין (ערכים למנה אחת)', verified: false, isPrivate: true, servingLabel: 'מנה', aliases: [], ...(value.kcal != null ? { per100: value } : {}) });
    }
    haptic.success();
    toast(`נוסף ליומן · ${value.kcal != null ? `${value.kcal} קק״ל` : label}`, { label: 'ליומן', onPress: () => router.push({ pathname: '/diary', params: { date } }) });
    setTimeout(() => { saving.current = false; }, 600);
    if (stay) { setKcal(''); setName(''); setMacro({ protein: '', carbs: '', fat: '' }); setNote(''); setErr(null); }
    else goBack();
  };

  return (
    <LightScreen
      title={adult ? 'קלוריות מהירות' : 'תיעוד מנה'}
      subtitle="בלי ליצור מוצר במאגר"
      footer={<LPrimary title="שמירה ליומן" icon="check" onPress={() => save(false)} />}
      heroHeight={adult ? 128 : 0}
      hero={adult ? (
        <View style={styles.hero}>
          <TextInput
            value={kcal}
            onChangeText={(t) => { setKcal(t.replace(/[^\d.]/g, '')); setErr(null); }}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.kcalInput}
            accessibilityLabel="כמות קלוריות"
            autoFocus
            maxLength={5}
            returnKeyType="done"
            onSubmitEditing={() => save(false)}
          />
          <Text style={styles.kcalUnit}>קלוריות</Text>
        </View>
      ) : undefined}
    >
      <LCard style={{ gap: 10 }}>
        <Text style={ls.bodyStrong}>שם המאכל {adult ? <Text style={ls.muted}>(לא חובה)</Text> : null}</Text>
        <TextInput value={name} onChangeText={(t) => { setName(t); setErr(null); }} placeholder="למשל: שוקולד, פיצה במסעדה" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="שם המאכל" returnKeyType="done" />
      </LCard>

      <Text style={[ls.bodyStrong, styles.label]}>ארוחה</Text>
      <View style={styles.chips}>
        {meals.map((m) => (
          <Pressable key={m.key} onPress={() => { haptic.select(); setMeal(m.key); }} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.chip, meal === m.key && styles.chipOn]}>
            <Text style={[styles.chipText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[ls.bodyStrong, styles.label]}>מתי</Text>
      <View style={[styles.chips, { alignItems: 'center' }]}>
        {[0, -1, -2].map((d) => {
          const k = addDays(dateKey(), d);
          return (
            <Pressable key={k} onPress={() => setDate(k)} accessibilityRole="radio" accessibilityState={{ selected: date === k }} accessibilityLabel={prettyDate(k)} style={[styles.chip, date === k && styles.chipOn]}>
              <Text style={[styles.chipText, date === k && { color: '#fff' }]}>{prettyDate(k)}</Text>
            </Pressable>
          );
        })}
        <View style={styles.timeBox}>
          <Icon name="clock" size={18} color={light.text2} />
          <TextInput value={time} onChangeText={setTime} style={styles.timeInput} maxLength={5} keyboardType="numbers-and-punctuation" accessibilityLabel="שעה" />
        </View>
      </View>

      {adult && (
        <>
          <Tap onPress={() => setShowMore(!showMore)} label={showMore ? 'הסתרת ערכים נוספים' : 'הוספת חלבון, פחמימות ושומן'}>
            <View style={styles.moreBtn}>
              <Text style={[ls.bodyStrong, { color: light.accentText }]}>{showMore ? 'הסתרת ערכים' : '+ חלבון, פחמימות, שומן (לא חובה)'}</Text>
            </View>
          </Tap>
          {showMore && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['protein', 'חלבון'], ['carbs', 'פחמימות'], ['fat', 'שומן']] as const).map(([k, l]) => (
                <View key={k} style={{ flex: 1 }}>
                  <Text style={[ls.muted, { marginBottom: 4 }]}>{l} (ג׳)</Text>
                  <TextInput value={macro[k]} onChangeText={(t) => setMacro({ ...macro, [k]: t.replace(/[^\d.]/g, '') })} placeholder="—" placeholderTextColor={light.text3} keyboardType="decimal-pad" style={[styles.input, { textAlign: 'center' }]} accessibilityLabel={`${l} בגרמים`} />
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={[ls.bodyStrong, styles.label]}>הערה <Text style={ls.muted}>(לא חובה)</Text></Text>
      <TextInput value={note} onChangeText={setNote} placeholder="למשל: אירוע משפחתי" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="הערה" />

      <Pressable onPress={() => setSaveAsProduct(!saveAsProduct)} accessibilityRole="checkbox" accessibilityState={{ checked: saveAsProduct }} accessibilityLabel="לשמור גם כמנה שלי לשימוש חוזר" style={styles.checkRow}>
        <View style={[styles.box, saveAsProduct && styles.boxOn]}>{saveAsProduct && <Icon name="check" size={14} color="#fff" strokeWidth={2.6} />}</View>
        <Text style={ls.body}>לשמור גם כ״מנה שלי״ לשימוש חוזר</Text>
      </Pressable>

      {err && <View style={styles.err} accessibilityLiveRegion="polite"><Icon name="close" size={16} color="#C2361B" /><Text style={[ls.body, { color: '#C2361B', flex: 1 }]}>{err}</Text></View>}

      <Tap onPress={() => save(true)} label="שמירה והוספת עוד">
        <View style={styles.secondary}><Text style={[ls.bodyStrong, { color: light.text }]}>שמירה והוספת עוד</Text></View>
      </Tap>
      <Text style={[ls.caption, { textAlign: 'center', marginTop: 8 }]}>ערך שלא הוזן נשמר כ״לא ידוע״ ולא כאפס.</Text>
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row-reverse', alignItems: 'baseline', justifyContent: 'center', gap: 10 },
  kcalInput: { minWidth: 160, fontFamily: fonts.bold, fontSize: 72, lineHeight: 84, color: '#fff', textAlign: 'center', paddingVertical: 0, borderWidth: 0, borderBottomWidth: 2, borderBottomColor: 'rgba(242,160,92,0.6)', outlineStyle: 'none' } as any,
  kcalUnit: { fontFamily: fonts.medium, fontSize: 18, color: 'rgba(255,255,255,0.8)' },
  label: { marginTop: space.lg, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: radius.md, backgroundColor: light.cardSoft, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: light.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: light.accent, borderColor: light.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: light.text },
  timeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border },
  timeInput: { minWidth: 56, fontFamily: fonts.semibold, fontSize: 15, color: light.text, textAlign: 'center' },
  moreBtn: { marginTop: space.lg, marginBottom: 8, minHeight: 44, justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.lg, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: '#CFC8C3', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: light.accent, borderColor: light.accent },
  err: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md, padding: 12, borderRadius: radius.md, backgroundColor: '#FDECE7' },
  secondary: { marginTop: space.lg, minHeight: 52, borderRadius: radius.pill, borderWidth: 1.5, borderColor: '#DCD5D0', alignItems: 'center', justifyContent: 'center' },
});
