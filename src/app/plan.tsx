import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Row, T, IconButton, Sheet, ListItem, Tap, toast, Badge, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { RECIPES, recipeById } from '@/data/recipes';
import { recipeNutrients, shoppingItemsFor } from '@/lib/recipes';
import { addDays, dateKey, weekOf, DAY_LONG, parseKey, prettyDate } from '@/lib/dates';
import { sumNutrients, isAdult } from '@/lib/nutrition';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

const SLOTS = [['breakfast', 'בוקר'], ['lunch', 'צהריים'], ['dinner', 'ערב'], ['snack', 'נשנוש']] as const;

/** 31 Weekly meal plan: planned vs eaten */
export default function Plan() {
  const [anchor, setAnchor] = useState(dateKey());
  const plan = useApp((s) => s.mealPlan);
  const setPlanned = useApp((s) => s.setPlanned);
  const entries = useApp((s) => s.entries);
  const addShopping = useApp((s) => s.addShopping);
  const allergies = useApp((s) => s.profile.allergies);
  const adult = useApp((s) => isAdult(s.profile.age));
  const [pick, setPick] = useState<{ date: string; meal: string } | null>(null);
  const days = weekOf(anchor);

  const fillWeekShopping = () => {
    const ids = days.flatMap((d) => Object.values(plan[d] ?? {}));
    const items = ids.map(recipeById).filter(Boolean).flatMap((r) => shoppingItemsFor(r!));
    if (!items.length) return toast('אין ארוחות מתוכננות השבוע');
    addShopping(items);
    toast(`נוספו ${items.length} פריטים לרשימת הקניות`, { label: 'לרשימה', onPress: () => router.push('/shopping') });
  };

  return (
    <Screen title="תכנון שבועי" right={<IconButton icon="cart" label="רשימת קניות" onPress={() => router.push('/shopping')} size={40} />}>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
        <IconButton icon="chevronBack" label="שבוע קודם" onPress={() => setAnchor(addDays(anchor, -7))} size={40} />
        <T.H>{parseKey(days[0]!).getDate()}/{parseKey(days[0]!).getMonth() + 1} – {parseKey(days[6]!).getDate()}/{parseKey(days[6]!).getMonth() + 1}</T.H>
        <IconButton icon="chevron" label="שבוע הבא" onPress={() => setAnchor(addDays(anchor, 7))} size={40} />
      </Row>
      {days.map((d) => {
        const eaten = entries.filter((e) => e.date === d);
        const tot = sumNutrients(eaten.map((e) => e.nutrients));
        return (
          <Card key={d} style={{ marginBottom: 10, gap: 8 }} highlight={d === dateKey()}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T.H>{DAY_LONG[parseKey(d).getDay()]} <Text style={[type.label, { color: colors.text2 }]}>{prettyDate(d) === 'היום' ? '· היום' : ''}</Text></T.H>
              <T.Muted>{eaten.length ? `נאכל: ${eaten.length} פריטים${adult ? ` · ${tot.kcal} קק״ל` : ''}` : 'טרם תועד'}</T.Muted>
            </Row>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {SLOTS.map(([k, l]) => {
                const r = plan[d]?.[k] ? recipeById(plan[d]![k]!) : undefined;
                const ate = eaten.some((e) => e.meal === k);
                return (
                  <Tap key={k} onPress={() => setPick({ date: d, meal: k })} label={`${l}: ${r?.name ?? 'ריק'}`}>
                    <View style={{ width: 150, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: r ? colors.borderStrong : colors.border, backgroundColor: r ? 'rgba(232,120,42,0.08)' : 'rgba(255,255,255,0.03)' }}>
                      <Row style={{ justifyContent: 'space-between' }}><T.Caption>{l}</T.Caption>{ate && <Icon name="check" size={14} />}</Row>
                      <Text style={[type.label, { color: r ? colors.text : colors.text3, fontFamily: fonts.medium }]} numberOfLines={2}>{r?.name ?? '+ תכנון'}</Text>
                    </View>
                  </Tap>
                );
              })}
            </View>
          </Card>
        );
      })}
      <Button title="הוספת השבוע לרשימת הקניות" icon="cart" variant="soft" onPress={fillWeekShopping} />
      <Card style={{ marginTop: space.md }}>
        <Row><Badge text="Premium" /><T.Muted style={{ flex: 1 }}>תוכנית שבועית מותאמת אוטומטית – בקרוב. כל הצעה תדרוש את אישורך.</T.Muted></Row>
      </Card>

      <Sheet visible={!!pick} onClose={() => setPick(null)} title="בחירת מתכון">
        {pick && plan[pick.date]?.[pick.meal] && (
          <ListItem icon="trash" danger title="הסרה מהתכנון" onPress={() => { setPlanned(pick.date, pick.meal, null); setPick(null); }} />
        )}
        {RECIPES.filter((r) => !r.allergens.some((a) => allergies.includes(a))).map((r) => {
          const n = recipeNutrients(r);
          return (
            <ListItem key={r.id} icon="bowl" title={r.name} subtitle={`${r.minutes} דק׳${adult ? ` · ${Math.round(n.kcal / r.servings)} קק״ל למנה` : ''}`} onPress={() => { setPlanned(pick!.date, pick!.meal, r.id); setPick(null); toast('נוסף לתכנון'); }} />
          );
        })}
      </Sheet>
    </Screen>
  );
}
