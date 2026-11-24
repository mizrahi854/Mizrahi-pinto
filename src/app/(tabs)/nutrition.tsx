import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { BentoTile } from '@/components/MacroCard';
import { Row, T, Tap, Section, ListItem } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useDay, useMeals } from '@/store/selectors';
import { useApp, findFood } from '@/store/useApp';
import { dateKey } from '@/lib/dates';
import { fmt, sumNutrients } from '@/lib/nutrition';
import { STARTER_FOODS } from '@/data/foods';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

const POPULAR = ['f002', 'f026', 'f050', 'f073', 'f037', 'f032'];

/** Nutrition hub (tab) */
export default function Nutrition() {
  const today = dateKey();
  const day = useDay(today);
  const meals = useMeals();
  const recent = useApp((s) => s.recentFoodIds);
  const userFoods = useApp((s) => s.foods);
  const t = day.target;
  const quick = (recent.length ? recent : POPULAR).slice(0, 8).map((id) => findFood(id, userFoods)).filter(Boolean);

  return (
    <HeroScreen
      dotValue={day.hasTarget ? Math.abs(day.remaining!) : day.adult ? day.totals.kcal : day.list.length}
      label={day.hasTarget ? (day.remaining! < 0 ? 'קלוריות מעל היעד היום' : 'קלוריות נותרו להיום') : day.adult ? 'קלוריות שתועדו היום' : 'פריטים שתועדו היום'}
      pill={day.hasTarget ? `מתוך ${t.calorieTarget!.toLocaleString()} קלוריות` : 'יומן תזונה'}
      progress={day.hasTarget ? day.totals.kcal / t.calorieTarget! : 0.3}
      heroHeight={290}
    >
      <View style={{ gap: 10 }}>
        <Row gap={10}>
          <BentoTile icon="bowl" title="הוסף ארוחה" value="חיפוש וגלריה" ring={false} onPress={() => router.push('/foods')} trailing={<View style={styles.plus}><Icon name="plus" size={20} color={colors.text} /></View>} />
          {day.adult && <BentoTile icon="flame" title="קלוריות" value={day.totals.kcal.toLocaleString()} target={t.calorieTarget?.toLocaleString()} ring={false} onPress={() => router.push('/diary')} />}
        </Row>
        {day.adult && (
          <>
            <Row gap={10}>
              <BentoTile icon="protein" title="חלבון" value={fmt(day.totals.protein)} target={t.proteinTarget ? String(t.proteinTarget) : undefined} unit="ג׳" ring={false} onPress={() => router.push('/macro/protein')} />
              <BentoTile icon="wheat" title="פחמימות" value={fmt(day.totals.carbs)} target={t.carbsTarget ? String(t.carbsTarget) : undefined} unit="ג׳" ring={false} onPress={() => router.push('/macro/carbs')} />
            </Row>
            <BentoTile wide icon="fat" title="שומנים" value={fmt(day.totals.fat)} target={t.fatTarget ? String(t.fatTarget) : undefined} unit="ג׳" onPress={() => router.push('/macro/fat')} />
          </>
        )}
      </View>

      <Section title="הארוחות של היום" action="ליומן" onAction={() => router.push('/diary')}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {meals.map((m) => {
            const list = day.list.filter((e) => e.meal === m.key);
            const tot = sumNutrients(list.map((e) => e.nutrients));
            return (
              <Tap key={m.key} onPress={() => router.push({ pathname: '/diary', params: { meal: m.key } })} label={`${m.label}: ${list.length} פריטים`}>
                <View style={styles.mealTile}>
                  <Row style={{ justifyContent: 'space-between' }}><Icon name={m.icon} size={26} /><Icon name="chevron" size={16} color={colors.text2} /></Row>
                  <Text style={styles.mealName}>{m.label}</Text>
                  <Text style={styles.mealSub}>{list.length ? (day.adult ? `${tot.kcal} קלוריות` : `${list.length} פריטים`) : 'טרם תועד'}</Text>
                </View>
              </Tap>
            );
          })}
        </ScrollView>
      </Section>

      <Section title={recent.length ? 'אחרונים' : 'מוצרים נפוצים'} action="הכל" onAction={() => router.push('/foods')}>
        <View style={styles.chips}>
          {quick.map((f) => (
            <Tap key={f!.id} onPress={() => router.push(`/food/${f!.id}`)} label={f!.name}>
              <View style={styles.chip}><Icon name="bowl" size={18} /><Text style={styles.chipText}>{f!.name}</Text></View>
            </Tap>
          ))}
        </View>
      </Section>

      <Section title="כלים">
        <ListItem icon="calendar" title="תכנון שבועי" subtitle="ארוחות מתוכננות מול מה שנאכל" onPress={() => router.push('/plan')} />
        <ListItem icon="bowl" title="מתכונים והמלצות" subtitle="לפי העדפות ואלרגיות" onPress={() => router.push('/recipes')} />
        <ListItem icon="cart" title="רשימת קניות" onPress={() => router.push('/shopping')} />
        <ListItem icon="star" title="ארוחות שמורות ומועדפים" onPress={() => router.push('/saved-meals')} />
        <ListItem icon="weight" title="בניית ארוחה מרובת רכיבים" onPress={() => router.push('/meal-builder')} />
        {day.adult && <ListItem icon="calc" title="מחשבון קלוריות וצרכים" onPress={() => router.push('/calculator')} />}
        <ListItem icon="list" title="השוואת מוצרים" onPress={() => router.push('/compare')} />
      </Section>
      <T.Caption style={{ marginTop: space.md, textAlign: 'center' }}>{STARTER_FOODS.length} מוצרי בסיס במאגר · ערכים כלליים מסומנים כ״לא מאומת״</T.Caption>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232,120,42,0.28)', borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  mealTile: { width: 132, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, gap: 4 },
  mealName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 6 },
  mealSub: { ...type.label, color: colors.text2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  chipText: { ...type.bodyMedium, color: colors.text },
});
