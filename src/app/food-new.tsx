import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Screen, Field, Button, Chip, Row, T, toast, Card } from '@/components/ui';
import { useApp, findFood } from '@/store/useApp';
import { CATEGORY_LABELS } from '@/data/foods';
import type { Food, FoodCategory } from '@/data/types';
import { validateNutrients } from '@/lib/nutrition';
import { uid } from '@/lib/dates';
import { space } from '@/theme/tokens';

/** 21 New private product (manual label entry) */
export default function FoodNew() {
  const { barcode, from } = useLocalSearchParams<{ barcode?: string; from?: string }>();
  const userFoods = useApp((s) => s.foods);
  const base = findFood(from, userFoods);
  const upsert = useApp((s) => s.upsertFood);
  const [name, setName] = useState(base?.name ?? '');
  const [brand, setBrand] = useState(base?.brand ?? '');
  const [code, setCode] = useState(barcode ?? base?.barcode ?? '');
  const [basis, setBasis] = useState<'g' | 'ml'>(base?.basis ?? 'g');
  const [cat, setCat] = useState<FoodCategory>(base?.category ?? 'custom');
  const [portionLabel, setPortionLabel] = useState(base?.portions[0]?.label ?? '');
  const [portionGrams, setPortionGrams] = useState(base?.portions[0] ? String(base.portions[0].grams) : '');
  const [vals, setVals] = useState<Record<string, string>>({
    kcal: base?.per100?.kcal?.toString() ?? '', protein: base?.per100?.protein?.toString() ?? '', carbs: base?.per100?.carbs?.toString() ?? '', fat: base?.per100?.fat?.toString() ?? '', fiber: base?.per100?.fiber?.toString() ?? '',
  });
  const [photo, setPhoto] = useState<string | undefined>();
  const [errors, setErrors] = useState<string[]>([]);

  const pickLabel = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };

  const save = () => {
    const { value, errors: errs } = validateNutrients(vals);
    if (name.trim().length < 2) errs.unshift('נדרש שם מוצר');
    const pg = Number(portionGrams);
    if (portionLabel && (!isFinite(pg) || pg <= 0)) errs.push('משקל מנה לא תקין');
    setErrors(errs);
    if (errs.length) return;
    const hasAny = Object.values(value).some((v) => v != null);
    const f: Food = {
      id: base?.isPrivate ? base.id : `u_${uid()}`,
      name: name.trim(), brand: brand.trim() || undefined, barcode: code.replace(/\D/g, '') || undefined, category: cat, basis,
      per100: hasAny ? value : null,
      portions: portionLabel ? [{ label: portionLabel, grams: pg }] : [],
      source: 'הוזן ידנית מהתווית על ידי המשתמש (פרטי)', verified: false, isPrivate: true, imageUrl: photo ?? base?.imageUrl,
      aliases: base ? [base.name] : undefined,
    };
    upsert(f);
    toast('המוצר נשמר במוצרים שלי');
    router.replace(`/food/${f.id}`);
  };

  const unit = basis === 'g' ? 'ג׳' : 'מ״ל';
  return (
    <Screen title={base ? 'השלמת ערכים' : 'מוצר חדש'} footer={<Button title="שמירה" onPress={save} />}>
      <T.Muted style={{ marginBottom: space.md }}>הזן את הערכים כפי שמופיעים בתווית. שדה ריק נשמר כ״לא ידוע״ ולא כאפס.</T.Muted>
      <Field label="שם המוצר" value={name} onChangeText={setName} />
      <Field label="מותג (לא חובה)" value={brand} onChangeText={setBrand} />
      <Field label="ברקוד (לא חובה)" value={code} onChangeText={setCode} keyboardType="number-pad" />
      <T.Muted style={{ marginBottom: 6 }}>בסיס הערכים</T.Muted>
      <Row style={{ marginBottom: space.md }}>
        <Chip label="ל-100 גרם" active={basis === 'g'} onPress={() => setBasis('g')} />
        <Chip label="ל-100 מ״ל" active={basis === 'ml'} onPress={() => setBasis('ml')} />
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        {(['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const).map((k) => (
          <Field key={k} style={{ width: '47%' }} label={{ kcal: 'אנרגיה (קק״ל)', protein: `חלבון (ג׳)`, carbs: 'פחמימות (ג׳)', fat: 'שומן (ג׳)', fiber: 'סיבים (ג׳)' }[k]} value={vals[k]} onChangeText={(v) => setVals({ ...vals, [k]: v })} keyboardType="decimal-pad" placeholder="לא ידוע" />
        ))}
      </Row>
      <T.Muted style={{ marginBottom: 6 }}>מנה מוגדרת (לא חובה)</T.Muted>
      <Row>
        <Field style={{ flex: 1 }} label="שם המנה" value={portionLabel} onChangeText={setPortionLabel} placeholder="גביע / יחידה" />
        <Field style={{ flex: 1 }} label={`משקל (${unit})`} value={portionGrams} onChangeText={setPortionGrams} keyboardType="decimal-pad" />
      </Row>
      <T.Muted style={{ marginBottom: 6 }}>קטגוריה</T.Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
        {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((c) => <Chip key={c} label={CATEGORY_LABELS[c]} active={cat === c} onPress={() => setCat(c)} />)}
      </View>
      <Button title={photo ? 'החלפת תמונת תווית' : 'תמונת תווית (לא חובה)'} variant="ghost" icon="image" onPress={pickLabel} />
      {photo && <Image source={{ uri: photo }} style={{ width: 120, height: 120, borderRadius: 18, alignSelf: 'center', marginTop: 10 }} />}
      {errors.length > 0 && <Card style={{ marginTop: space.md }}>{errors.map((e) => <T.Body key={e} style={{ color: '#FF8A8D' }}>{e}</T.Body>)}</Card>}
      <T.Caption style={{ marginTop: space.md }}>מוצר פרטי נשמר רק אצלך. שיתוף ציבורי יתאפשר רק לאחר אימות.</T.Caption>
    </Screen>
  );
}
