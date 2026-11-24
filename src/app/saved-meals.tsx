import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Row, T, Button, IconButton, Empty, Chip, Section, toast, ListItem } from '@/components/ui';
import { useApp, allFoods } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { sumNutrients, isAdult } from '@/lib/nutrition';
import { dateKey } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { fonts, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 26 Saved meals & favorites */
export default function SavedMeals() {
  const saved = useApp((s) => s.savedMeals);
  const del = useApp((s) => s.deleteSavedMeal);
  const log = useApp((s) => s.logSavedMeal);
  const favorites = useApp((s) => s.favorites);
  const userFoods = useApp((s) => s.foods);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const [meal, setMeal] = useState(defaultMeal());
  const favFoods = allFoods(userFoods).filter((f) => favorites.includes(f.id));

  return (
    <Screen title="שמורים ומועדפים">
      <T.Muted style={{ marginBottom: 6 }}>הוספה לארוחה</T.Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}</View>
      <Section title="ארוחות שמורות">
        {saved.length === 0 ? (
          <Empty icon="star" title="אין ארוחות שמורות" text="ביומן, לחץ על הכוכב ליד ארוחה כדי לשמור אותה לשימוש חוזר." />
        ) : (
          saved.map((m) => {
            const t = sumNutrients(m.items.map((i) => i.nutrients));
            return (
              <Card key={m.id} style={{ marginBottom: 8, gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T.Body style={{ fontFamily: fonts.medium, flex: 1 }}>{m.name}</T.Body>
                  <IconButton icon="trash" label={`מחק ${m.name}`} size={34} onPress={() => del(m.id)} />
                </Row>
                <T.Muted>{m.items.map((i) => i.name).join(' · ')}</T.Muted>
                {adult && <T.Caption>{t.kcal} קק״ל{t.partial.kcal ? '*' : ''} · חלבון {t.protein} ג׳</T.Caption>}
                <Button title="הוספה ליומן היום" variant="soft" icon="plus" onPress={() => { log(m.id, meal, dateKey()); haptic.success(); toast('נוסף ליומן'); }} />
              </Card>
            );
          })
        )}
      </Section>
      <Section title="מוצרים מועדפים">
        {favFoods.length === 0 ? <T.Muted>עוד לא סימנת מועדפים.</T.Muted> : favFoods.map((f) => (
          <ListItem key={f.id} icon="starFill" title={f.name} subtitle={f.per100?.kcal != null ? `${f.per100.kcal} קק״ל / 100` : 'חסרים ערכים'} onPress={() => router.push({ pathname: '/food/[id]', params: { id: f.id, meal } })} />
        ))}
      </Section>
      <View style={{ height: space.lg }} />
    </Screen>
  );
}
