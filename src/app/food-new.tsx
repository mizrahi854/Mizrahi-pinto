import React, { useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LightScreen, LCard, LPrimary, Segmented, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { CATEGORY_LABELS } from '@/data/foods';
import type { Food, FoodCategory } from '@/data/types';
import { validateNutrients } from '@/lib/nutrition';
import { uid, dateKey } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

type Mode = 'label' | 'serving';

/** 21 New private product or dish: free name + values (per 100 g from a label, or per serving for a home dish). */
export default function FoodNew() {
  const { barcode, from } = useLocalSearchParams<{ barcode?: string; from?: string }>();
  const userFoods = useApp((s) => s.foods);
  const base = findFood(from, userFoods);
  const upsert = useApp((s) => s.upsertFood);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const meals = useMeals();
  const [mode, setMode] = useState<Mode>(base?.servingLabel ? 'serving' : barcode || base ? 'label' : 'serving');
  const [name, setName] = useState(base?.name ?? '');
  const [brand, setBrand] = useState(base?.brand ?? '');
  const [code, setCode] = useState(barcode ?? base?.barcode ?? '');
  const [basis, setBasis] = useState<'g' | 'ml'>(base?.basis ?? 'g');
  const [cat, setCat] = useState<FoodCategory>(base?.category ?? 'custom');
  const [portionLabel, setPortionLabel] = useState(base?.portions[0]?.label ?? '');
  const [portionGrams, setPortionGrams] = useState(base?.portions[0] ? String(base.portions[0].grams) : '');
  const [pkg, setPkg] = useState(base?.packageSize ? String(base.packageSize) : '');
  const [vals, setVals] = useState<Record<string, string>>({
    kcal: base?.per100?.kcal?.toString() ?? '', protein: base?.per100?.protein?.toString() ?? '', carbs: base?.per100?.carbs?.toString() ?? '', fat: base?.per100?.fat?.toString() ?? '', fiber: base?.per100?.fiber?.toString() ?? '',
  });
  const [photo, setPhoto] = useState<string | undefined>();
  const [labelPhoto, setLabelPhoto] = useState<string | undefined>();
  const [logNow, setLogNow] = useState(!base);
  const [meal, setMeal] = useState(defaultMeal());
  const [err, setErr] = useState<string | null>(null);
  const busy = useRef(false);

  const pick = async (which: 'pack' | 'label') => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) (which === 'pack' ? setPhoto : setLabelPhoto)(r.assets[0].uri);
  };

  const save = () => {
    if (busy.current) return;
    const { value, errors } = validateNutrients(vals);
    if (name.trim().length < 2) return setErr('נדרש שם');
    if (errors.length) return setErr(errors[0]!);
    const pg = Number(portionGrams);
    if (mode === 'label' && portionLabel && (!isFinite(pg) || pg <= 0)) return setErr('משקל מנה לא תקין');
    busy.current = true;
    const hasAny = Object.values(value).some((v) => v != null);
    const f: Food = mode === 'serving'
      ? { id: base?.isPrivate ? base.id : `u_${uid()}`, name: name.trim(), category: cat, basis: 'g', per100: hasAny ? value : null, portions: [{ label: 'מנה', grams: 100 }], servingLabel: 'מנה', source: 'מנה שהמשתמש הזין (ערכים למנה אחת)', verified: false, isPrivate: true, imageUrl: photo ?? base?.imageUrl }
      : {
          id: base?.isPrivate ? base.id : `u_${uid()}`, name: name.trim(), brand: brand.trim() || undefined, barcode: code.replace(/\D/g, '') || undefined, category: cat, basis,
          per100: hasAny ? value : null, portions: portionLabel ? [{ label: portionLabel, grams: pg }] : [], packageSize: Number(pkg) > 0 ? Number(pkg) : undefined,
          source: 'הוזן ידנית מהתווית על ידי המשתמש (פרטי)', verified: false, isPrivate: true, imageUrl: photo ?? base?.imageUrl, aliases: base ? [base.name] : undefined,
        };
    upsert(f);
    if (logNow) {
      const p = f.portions[0];
      addFoodToLog(f, p ? 1 : 100, p ? p.label : basis === 'ml' ? 'מ״ל' : 'ג׳', meal, dateKey(), p ? p.grams : 100);
    }
    haptic.success();
    toast(logNow ? `"${f.name}" נשמר ונוסף ליומן` : `"${f.name}" נשמר במוצרים שלי`);
    setTimeout(() => { busy.current = false; }, 700);
    router.replace(logNow ? '/(tabs)/nutrition' : `/food/${f.id}`);
  };

  const unit = mode === 'serving' ? 'למנה' : `ל-100 ${basis === 'g' ? 'ג׳' : 'מ״ל'}`;

  return (
    <LightScreen title={base ? 'השלמת ערכים' : 'מוצר או מנה חדשה'} subtitle="נשמר אצלך בלבד" footer={<LPrimary title={logNow ? 'שמירה והוספה ליומן' : 'שמירה'} icon="check" onPress={save} />}>
      <Segmented value={mode} onChange={setMode} options={[{ key: 'serving', label: 'מנה / ארוחה' }, { key: 'label', label: 'מוצר עם תווית' }]} />
      <Text style={[ls.muted, { marginTop: 10 }]}>{mode === 'serving' ? 'למשל: ״שוקולד״, ״הפסטה של אמא״. מזינים ערכים למנה אחת.' : 'מעתיקים את הערכים מהתווית. שדה ריק = לא ידוע (לא אפס).'}</Text>

      <Label t="שם" />
      <TextInput value={name} onChangeText={(t) => { setName(t); setErr(null); }} placeholder={mode === 'serving' ? 'שם המנה' : 'שם המוצר'} placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="שם" autoFocus={!base} />

      {mode === 'label' && (
        <>
          <View style={styles.two}>
            <View style={{ flex: 1 }}><Label t="מותג" /><TextInput value={brand} onChangeText={setBrand} placeholder="לא חובה" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="מותג" /></View>
            <View style={{ flex: 1 }}><Label t="ברקוד" /><TextInput value={code} onChangeText={setCode} placeholder="לא חובה" placeholderTextColor={light.text3} keyboardType="number-pad" style={styles.input} accessibilityLabel="ברקוד" /></View>
          </View>
          <Label t="בסיס הערכים" />
          <Segmented value={basis} onChange={setBasis} options={[{ key: 'g', label: 'ל-100 גרם' }, { key: 'ml', label: 'ל-100 מ״ל' }]} />
        </>
      )}

      <Label t={`ערכים תזונתיים ${unit}`} />
      <LCard style={{ gap: 8 }}>
        {([['kcal', 'אנרגיה (קק״ל)'], ['protein', 'חלבון (ג׳)'], ['carbs', 'פחמימות (ג׳)'], ['fat', 'שומן (ג׳)'], ['fiber', 'סיבים (ג׳)']] as const).map(([k, l]) => (
          <View key={k} style={styles.valRow}>
            <Text style={[ls.body, { flex: 1 }]}>{l}</Text>
            <TextInput value={vals[k]} onChangeText={(v) => setVals({ ...vals, [k]: v.replace(/[^\d.,]/g, '') })} placeholder="לא ידוע" placeholderTextColor={light.text3} keyboardType="decimal-pad" style={styles.valInput} accessibilityLabel={l} />
          </View>
        ))}
      </LCard>

      {mode === 'label' && (
        <>
          <View style={styles.two}>
            <View style={{ flex: 1 }}><Label t="שם מנה" /><TextInput value={portionLabel} onChangeText={setPortionLabel} placeholder="גביע / יחידה" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="שם המנה" /></View>
            <View style={{ flex: 1 }}><Label t={`משקל מנה (${basis === 'g' ? 'ג׳' : 'מ״ל'})`} /><TextInput value={portionGrams} onChangeText={setPortionGrams} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="משקל מנה" /></View>
          </View>
          <Label t={`גודל אריזה (${basis === 'g' ? 'ג׳' : 'מ״ל'})`} />
          <TextInput value={pkg} onChangeText={setPkg} keyboardType="decimal-pad" placeholder="לא חובה – מאפשר ״אריזה שלמה״" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel="גודל אריזה" />
          <Label t="קטגוריה" />
          <View style={styles.chips}>
            {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).filter((c) => c !== 'drinks' && c !== 'snacks').map((c) => (
              <Pressable key={c} onPress={() => setCat(c)} accessibilityRole="radio" accessibilityState={{ selected: cat === c }} accessibilityLabel={CATEGORY_LABELS[c]} style={[styles.chip, cat === c && styles.chipOn]}>
                <Text style={[styles.chipText, cat === c && { color: '#fff' }]}>{CATEGORY_LABELS[c]}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Label t="תמונות (לא חובה)" />
      <View style={styles.two}>
        <Tap onPress={() => pick('pack')} label="תמונת המוצר או המנה" style={{ flex: 1 }}>
          <View style={styles.photo}>{photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <><Icon name="camera" size={24} color={light.accent} /><Text style={ls.muted}>{mode === 'serving' ? 'תמונת המנה' : 'תמונת האריזה'}</Text></>}</View>
        </Tap>
        {mode === 'label' && (
          <Tap onPress={() => pick('label')} label="תמונת התווית התזונתית" style={{ flex: 1 }}>
            <View style={styles.photo}>{labelPhoto ? <Image source={{ uri: labelPhoto }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <><Icon name="image" size={24} color={light.accent} /><Text style={ls.muted}>התווית התזונתית</Text></>}</View>
          </Tap>
        )}
      </View>

      <Pressable onPress={() => setLogNow(!logNow)} accessibilityRole="checkbox" accessibilityState={{ checked: logNow }} accessibilityLabel="להוסיף גם ליומן עכשיו" style={styles.checkRow}>
        <View style={[styles.box, logNow && styles.boxOn]}>{logNow && <Icon name="check" size={14} color="#fff" strokeWidth={2.6} />}</View>
        <Text style={ls.body}>להוסיף ליומן עכשיו (מנה אחת)</Text>
      </Pressable>
      {logNow && (
        <View style={[styles.chips, { marginTop: 4 }]}>
          {meals.map((m) => (
            <Pressable key={m.key} onPress={() => setMeal(m.key)} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.chip, meal === m.key && styles.chipOn]}>
              <Text style={[styles.chipText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {err && <View style={styles.err} accessibilityLiveRegion="polite"><Icon name="close" size={16} color="#C2361B" /><Text style={[ls.body, { color: '#C2361B', flex: 1 }]}>{err}</Text></View>}
      <Text style={[ls.caption, { marginTop: space.md }]}>מוצר פרטי נשמר רק אצלך ומסומן ״מוצר שהזנת״. שיתוף ציבורי יתאפשר רק לאחר אימות.</Text>
    </LightScreen>
  );
}

function Label({ t }: { t: string }) {
  return <Text style={[ls.bodyStrong, { marginTop: space.lg, marginBottom: 8 }]}>{t}</Text>;
}

const styles = StyleSheet.create({
  input: { minHeight: 50, borderRadius: radius.md, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: light.text },
  two: { flexDirection: 'row', gap: 10 },
  valRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  valInput: { width: 110, minHeight: 44, borderRadius: 12, backgroundColor: light.cardSoft, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 17, color: light.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 42, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: light.accent, borderColor: light.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: light.text },
  photo: { height: 110, borderRadius: radius.md, backgroundColor: light.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#DCD5D0', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.lg, minHeight: 44 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: '#CFC8C3', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: light.accent, borderColor: light.accent },
  err: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.md, padding: 12, borderRadius: radius.md, backgroundColor: '#FDECE7' },
});
