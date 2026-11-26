import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Icon } from './Icon';
import { LInput } from './forms';
import { useApp, allFoods } from '@/store/useApp';
import { searchLocal } from '@/lib/search';
import { unitsFor, computeFoodEntry } from '@/lib/engine';
import type { MealItem } from '@/data/types';
import { light, fonts, radius } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Search the food database (incl. Tzameret home cooking) and return a MealItem with a sensible default portion. */
export function DishPicker({ onPick, suggestions = [], placeholder = 'חיפוש מאכל' }: { onPick: (i: MealItem) => void; suggestions?: string[]; placeholder?: string }) {
  const userFoods = useApp((s) => s.foods);
  const [q, setQ] = useState('');
  const results = useMemo(() => (q.trim().length < 2 ? [] : searchLocal(allFoods(userFoods), q, 8)), [q, userFoods]);
  const pick = (id: string) => {
    const f = allFoods(userFoods).find((x) => x.id === id)!;
    const units = unitsFor(f);
    const unit = units.find((u) => /בינונית|^מנה$|^יחידה$|^פרוסה/.test(u.label)) ?? units.find((u) => u.grams != null) ?? units[0]!;
    const amount = unit.grams == null ? 100 : 1;
    const c = computeFoodEntry(f, amount, unit);
    onPick({ foodId: f.id, name: f.name, amount, unitLabel: unit.label, grams: c.grams, nutrients: c.nutrients });
    setQ('');
    haptic.select();
  };
  return (
    <View style={{ gap: 8 }}>
      {suggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {suggestions.map((s) => (
            <Pressable key={s} onPress={() => setQ(s)} accessibilityRole="button" accessibilityLabel={`חיפוש ${s}`} style={[styles.sug, q === s && styles.sugOn]}>
              <Text style={[styles.sugText, q === s && { color: '#fff' }]}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <LInput value={q} onChangeText={setQ} placeholder={placeholder} accessibilityLabel={placeholder} returnKeyType="search" />
      {results.map((f) => (
        <Pressable key={f.id} onPress={() => pick(f.id)} accessibilityRole="button" accessibilityLabel={`הוספת ${f.name}`} style={styles.res}>
          <Icon name="plus" size={18} color={light.accentText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.resName} numberOfLines={1}>{f.name}</Text>
            {f.per100?.kcal != null && <Text style={styles.resSub}>{f.per100.kcal} קק״ל ל-100 ג׳{f.verified ? ' · מאגר צמרת' : ''}</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sug: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: light.cardSoft, justifyContent: 'center' },
  sugOn: { backgroundColor: light.accentText },
  sugText: { fontFamily: fonts.medium, fontSize: 14, color: light.text },
  res: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: light.cardSoft },
  resName: { fontFamily: fonts.medium, fontSize: 15, color: light.text },
  resSub: { fontFamily: fonts.regular, fontSize: 12.5, color: light.text2 },
});
