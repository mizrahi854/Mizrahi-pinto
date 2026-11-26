import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LightScreen, LCard, ls } from '@/components/light';
import { Tap, Sheet, Button, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useLogTarget } from '@/store/selectors';
import { useApp, allFoods } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { totalsOf } from '@/lib/engine';
import { isAdult } from '@/lib/nutrition';
import { dateKey, prettyDate, addDays } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 26 Saved meals & favourites */
export default function SavedMeals() {
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const saved = useApp((s) => s.savedMeals);
  const del = useApp((s) => s.deleteSavedMeal);
  const log = useApp((s) => s.logSavedMeal);
  const rename = useApp((s) => s.updateSavedMeal);
  const toBasket = useApp((s) => s.basketFromSavedMeal);
  const favorites = useApp((s) => s.favorites);
  const userFoods = useApp((s) => s.foods);
  const adult = useApp((s) => isAdult(s.profile.age));
  const meals = useMeals();
  const target = useLogTarget(params.meal, params.date);
  const [meal, setMeal] = useState(target.meal);
  const [date, setDate] = useState(target.date);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const favFoods = allFoods(userFoods).filter((f) => favorites.includes(f.id));

  return (
    <LightScreen title="ארוחות קבועות" subtitle="הוספה בלחיצה אחת">
      <Text style={[ls.bodyStrong, { marginBottom: 8 }]}>להוסיף ל</Text>
      <View style={styles.chips}>
        {meals.map((m) => (
          <Pressable key={m.key} onPress={() => setMeal(m.key)} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.chip, meal === m.key && styles.chipOn]}>
            <Text style={[styles.chipText, meal === m.key && { color: '#fff' }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.chips, { marginTop: 8 }]}>
        {[0, -1, 1].map((d) => {
          const k = addDays(dateKey(), d);
          return (
            <Pressable key={k} onPress={() => setDate(k)} accessibilityRole="radio" accessibilityState={{ selected: date === k }} accessibilityLabel={prettyDate(k)} style={[styles.chip, date === k && styles.chipOn]}>
              <Text style={[styles.chipText, date === k && { color: '#fff' }]}>{prettyDate(k)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[ls.h2, styles.section]}>הארוחות שלי</Text>
      {saved.length === 0 ? (
        <LCard style={{ alignItems: 'center', gap: 6 }}>
          <Icon name="star" size={30} color={light.accent} />
          <Text style={ls.bodyStrong}>אין עדיין ארוחות קבועות</Text>
          <Text style={[ls.muted, { textAlign: 'center' }]}>ביומן: ⋯ ליד ארוחה ← ״שמירה כארוחה קבועה״, או בסל הארוחה ← ״שמירה כארוחה קבועה״.</Text>
        </LCard>
      ) : (
        <View style={{ gap: 10 }}>
          {saved.map((m) => {
            const t = totalsOf(m.items);
            return (
              <LCard key={m.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={ls.bodyStrong} numberOfLines={1}>{m.name}</Text>
                    <Text style={ls.muted} numberOfLines={2}>{m.items.map((i) => i.name).join(' · ')}</Text>
                    {adult && <Text style={ls.caption}>{t.kcal}{t.partial.kcal ? '*' : ''} קק״ל · חלבון {Math.round(t.protein)} ג׳</Text>}
                  </View>
                  <Tap onPress={() => setRenaming({ id: m.id, name: m.name })} label={`שינוי שם ${m.name}`}><View style={styles.iconBtn}><Icon name="edit" size={19} color={light.text2} /></View></Tap>
                  <Tap onPress={() => { del(m.id); toast('הארוחה נמחקה'); }} label={`מחיקת ${m.name}`}><View style={styles.iconBtn}><Icon name="trash" size={19} color={light.text2} /></View></Tap>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Tap onPress={() => { toBasket(m.id); router.push('/basket'); }} label={`עריכת ${m.name} לפני הוספה`} style={{ flex: 1 }}>
                    <View style={styles.ghost}><Text style={styles.ghostText}>עריכה והוספה</Text></View>
                  </Tap>
                  <Tap onPress={() => { log(m.id, meal, date); haptic.success(); toast(`${m.name} נוספה ל${meals.find((x) => x.key === meal)?.label} · ${prettyDate(date)}`, { label: 'ליומן', onPress: () => router.push({ pathname: '/(tabs)/diary', params: { date } }) }); }} label={`הוספת ${m.name}`} style={{ flex: 1.3 }}>
                    <View style={styles.primary}><Icon name="plus" size={18} color="#fff" /><Text style={styles.primaryText}>הוספה</Text></View>
                  </Tap>
                </View>
              </LCard>
            );
          })}
        </View>
      )}

      <Text style={[ls.h2, styles.section]}>מוצרים מועדפים</Text>
      {favFoods.length === 0 ? <Text style={ls.muted}>סמן כוכב בעמוד מוצר כדי לשמור אותו כאן.</Text> : (
        <View style={{ gap: 8 }}>
          {favFoods.map((f) => (
            <Tap key={f.id} onPress={() => router.push({ pathname: '/food/[id]', params: { id: f.id, meal, date } })} label={f.name}>
              <View style={styles.fav}><Icon name="starFill" size={18} color={light.accent} /><Text style={[ls.body, { flex: 1 }]}>{f.name}</Text><Text style={ls.muted}>{f.per100?.kcal != null ? `${f.per100.kcal} קל׳/100` : 'חסרים ערכים'}</Text><Icon name="chevron" size={16} color={light.text2} /></View>
            </Tap>
          ))}
        </View>
      )}

      <Sheet visible={!!renaming} onClose={() => setRenaming(null)} title="שם הארוחה">
        <TextInput value={renaming?.name ?? ''} onChangeText={(t) => setRenaming(renaming ? { ...renaming, name: t } : null)} style={styles.darkInput} accessibilityLabel="שם הארוחה" autoFocus />
        <Button title="שמירה" style={{ marginTop: space.md }} disabled={(renaming?.name.trim().length ?? 0) < 2} onPress={() => { rename(renaming!.id, { name: renaming!.name.trim() }); setRenaming(null); toast('השם עודכן'); }} />
      </Sheet>
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: light.accent, borderColor: light.accent },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: light.text },
  section: { marginTop: space.xl, marginBottom: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ghost: { minHeight: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: '#DCD5D0', alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.semibold, fontSize: 14.5, color: light.text },
  primary: { minHeight: 48, borderRadius: radius.pill, backgroundColor: light.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  fav: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: light.card, minHeight: 52 },
  darkInput: { minHeight: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: fonts.regular, fontSize: 16, paddingHorizontal: 14 },
});
