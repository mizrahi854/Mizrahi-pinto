import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LightScreen, LPrimary } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, Group, LInput, Note, ToggleRow } from '@/components/forms';
import { useApp, tracksCalories } from '@/store/useApp';
import { RESTAURANT_TYPES, ALLERGENS } from '@/lib/restaurants';
import { validateNutrients } from '@/lib/nutrition';
import { goBack } from '@/lib/nav';
import type { RestaurantType } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Enter / edit a restaurant dish manually. Allergens default to "unknown" – they are recorded only when known. */
export default function DishEdit() {
  const p = useLocalSearchParams<{ id?: string; event?: string; type?: string; photo?: string; menu?: string; photoPick?: string }>();
  const existing = useApp((s) => s.dishes.find((d) => d.id === p.id));
  const event = useApp((s) => s.events.find((e) => e.id === p.event));
  const restaurants = useApp((s) => s.restaurants);
  const upsertDish = useApp((s) => s.upsertDish);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const calories = useApp((s) => tracksCalories(s.profile));
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<RestaurantType>(existing?.type ?? (p.type as RestaurantType) ?? event?.restaurantType ?? 'cafe');
  const [rId, setRId] = useState(existing?.restaurantId ?? event?.restaurantId ?? '');
  const [vals, setVals] = useState({ kcal: existing?.nutrients.kcal?.toString() ?? '', protein: existing?.nutrients.protein?.toString() ?? '', carbs: existing?.nutrients.carbs?.toString() ?? '', fat: existing?.nutrients.fat?.toString() ?? '' });
  const [official, setOfficial] = useState(existing ? !existing.estimated : false);
  const [ingredients, setIngredients] = useState(existing?.ingredients ?? '');
  const [allergensKnown, setAllergensKnown] = useState(existing ? existing.allergens != null : false);
  const [allergens, setAllergens] = useState<string[]>(existing?.allergens ?? []);
  const [photo, setPhoto] = useState<string | undefined>(existing?.photoUri ?? (p.menu ? undefined : p.photo));
  const [menuPhoto] = useState<string | undefined>(p.menu ? p.photo : undefined);
  const [fav, setFav] = useState(existing?.favorite ?? true);
  const [err, setErr] = useState<string | null>(null);

  const pick = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return toast('אין הרשאה לגלריה');
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };
  useEffect(() => { if (p.photoPick === '1') pick(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (name.trim().length < 2) return setErr('תן שם למנה');
    const { value, errors } = validateNutrients(vals);
    if (errors.length) return setErr(errors[0]!);
    const id = upsertDish({
      id: existing?.id, name: name.trim(), type, restaurantId: rId || undefined, nutrients: { ...value, fiber: null },
      estimated: !official, basis: official ? 'לפי המידע הרשמי של המסעדה (הוזן ידנית)' : value.kcal != null ? 'הערכה שהוזנה ידנית' : 'ללא ערכים',
      ingredients: ingredients.trim() || undefined, allergens: allergensKnown ? allergens : null, photoUri: photo, favorite: fav,
    });
    if (event && !existing) upsertEvent({ ...event, dishIds: [...new Set([...(event.dishIds ?? []), id])] });
    haptic.success();
    toast(existing ? 'המנה עודכנה' : event ? 'המנה נשמרה ונבחרה ליציאה' : 'המנה נשמרה');
    goBack('/restaurant');
  };

  return (
    <LightScreen title={existing ? 'עריכת מנה' : 'מנה ממסעדה'} subtitle={event?.title} footer={<LPrimary title="שמירה" icon="check" onPress={save} />}>
      {menuPhoto && (
        <View style={{ gap: 6, marginBottom: space.md }}>
          <Image source={{ uri: menuPhoto }} style={styles.menu} contentFit="contain" accessibilityLabel="תמונת התפריט" />
          <Note text="קריאה אוטומטית של תפריט עדיין לא מחוברת – התמונה מוצגת לעיון בזמן שמזינים את המנה." />
        </View>
      )}
      <LInput label="שם המנה" value={name} onChangeText={(t) => { setName(t); setErr(null); }} placeholder="למשל: המבורגר 250 ג׳ עם צ׳יפס" />
      <Group>
        <Chips label="סוג מסעדה" options={RESTAURANT_TYPES.map((r) => ({ key: r.key, label: r.label }))} value={type} onChange={setType} />
        {restaurants.length > 0 && <Chips label="מסעדה" options={[{ key: '', label: 'ללא' }, ...restaurants.map((r) => ({ key: r.id, label: r.name }))]} value={rId} onChange={setRId} />}
      </Group>

      <Group title="תמונה">
        <Tap onPress={pick} label={photo ? 'החלפת תמונת המנה' : 'העלאת תמונת מנה'}>
          {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" accessibilityLabel="תמונת המנה" /> : <View style={[styles.photo, styles.photoPh]}><Icon name="image" size={24} color={light.accent} /><Text style={styles.phText}>העלאת תמונה (לא חובה)</Text></View>}
        </Tap>
      </Group>

      {calories && (
        <Group title="ערכים תזונתיים (לא חובה)">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([['kcal', 'קלוריות'], ['protein', 'חלבון'], ['carbs', 'פחמ׳'], ['fat', 'שומן']] as const).map(([k, l]) => (
              <View key={k} style={{ flex: 1 }}><LInput label={l} value={vals[k]} onChangeText={(t) => setVals({ ...vals, [k]: t.replace(/[^\d.]/g, '') })} keyboardType="decimal-pad" placeholder="—" style={{ textAlign: 'center', paddingHorizontal: 4 }} /></View>
            ))}
          </View>
          <ToggleRow title="הערכים רשמיים מהמסעדה" subtitle="רק אם המסעדה פרסמה אותם. אחרת המנה מסומנת כהערכה." value={official} onChange={setOfficial} />
        </Group>
      )}

      <Group title="מרכיבים ואלרגנים">
        <LInput label="מרכיבים" hint="(לא חובה)" value={ingredients} onChangeText={setIngredients} placeholder="כפי שמופיע בתפריט" multiline />
        <ToggleRow title="יש לי מידע על אלרגנים" subtitle="ממסעדה/מהתפריט. בלי מידע – יוצג ״לא ידוע״." value={allergensKnown} onChange={setAllergensKnown} />
        {allergensKnown && <Chips multi options={ALLERGENS.map((a) => ({ key: a, label: a }))} value={allergens} onChange={setAllergens} />}
      </Group>
      <Group>
        <ToggleRow icon="star" title="מנה מועדפת" value={fav} onChange={setFav} />
      </Group>
      {err && <View style={{ marginTop: space.md }}><Note tone="warn" text={err} /></View>}
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  menu: { height: 260, borderRadius: radius.lg, backgroundColor: light.card },
  photo: { height: 140, borderRadius: radius.lg, width: '100%' },
  photoPh: { backgroundColor: light.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(242,107,29,0.35)', alignItems: 'center', justifyContent: 'center', gap: 6, height: 88 },
  phText: { fontFamily: fonts.regular, fontSize: 14, color: light.text2 },
});
