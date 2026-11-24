import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, Row, T, Chip, Tap, Badge, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { RECIPES } from '@/data/recipes';
import { recipeNutrients } from '@/lib/recipes';
import { isAdult } from '@/lib/nutrition';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

/** 32 Meal recommendations & recipes (filtered by allergies, prefs, prep time) */
export default function Recipes() {
  const profile = useApp((s) => s.profile);
  const adult = isAdult(profile.age);
  const [meal, setMeal] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [quick, setQuick] = useState(false);
  const vegan = profile.foodPrefs.includes('טבעוני');
  const veg = profile.foodPrefs.includes('צמחוני');
  const list = RECIPES.filter((r) => !r.allergens.some((a) => profile.allergies.includes(a)))
    .filter((r) => meal === 'all' || r.meal === meal)
    .filter((r) => !quick || r.minutes <= 15)
    .filter((r) => (vegan ? r.tags.includes('טבעוני') : veg ? r.tags.some((t) => t === 'צמחוני' || t === 'טבעוני') : true));

  return (
    <Screen title="מתכונים והמלצות">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
        {([['all', 'הכל'], ['breakfast', 'בוקר'], ['lunch', 'צהריים'], ['dinner', 'ערב'], ['snack', 'נשנוש']] as const).map(([k, l]) => <Chip key={k} label={l} active={meal === k} onPress={() => setMeal(k)} />)}
        <Chip label="עד 15 דק׳" icon="clock" active={quick} onPress={() => setQuick(!quick)} />
      </View>
      {profile.allergies.length > 0 && <T.Caption style={{ marginBottom: 8 }}>מסונן לפי אלרגיות: {profile.allergies.join(', ')}</T.Caption>}
      {list.length === 0 && <Empty title="אין מתכונים מתאימים לסינון" />}
      {list.map((r) => {
        const n = recipeNutrients(r);
        return (
          <Tap key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} label={r.name}>
            <View style={{ padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Icon name="bowl" size={30} /></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[type.bodyMedium, { color: colors.text, fontFamily: fonts.semibold }]}>{r.name}</Text>
                <T.Muted>{r.minutes} דק׳ · {r.servings} מנות{adult ? ` · ${Math.round(n.kcal / r.servings)} קק״ל למנה` : ''}</T.Muted>
                <Row gap={6}>{r.tags.map((t) => <Badge key={t} text={t} tone="muted" />)}</Row>
              </View>
              <Icon name="chevron" size={18} color={colors.text2} />
            </View>
          </Tap>
        );
      })}
      <T.Caption style={{ textAlign: 'center' }}>ערכי המתכונים מחושבים מערכי הייחוס של הרכיבים ואינם מאומתים.</T.Caption>
    </Screen>
  );
}
