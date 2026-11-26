import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Note } from '@/components/forms';
import { useApp, allFoods } from '@/store/useApp';
import { useMeals, useLogTarget, useDay } from '@/store/selectors';
import { parseMealText, ParsedItem } from '@/lib/describe';
import { computeFoodEntry } from '@/lib/engine';
import { prettyDate } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import type { Food } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/**
 * Free-text meal description: "2 ביצים, 150 גרם אורז וחצי פיתה" → matched items to confirm.
 * Local matching against the food database (not AI). Unmatched items are never guessed.
 */
export default function Describe() {
  const userFoods = useApp((s) => s.foods);
  const draft = useApp((s) => (s.drafts.describe as string | undefined) ?? '');
  const setDraft = useApp((s) => s.setDraft);
  const clearDraft = useApp((s) => s.clearDraft);
  const addEntry = useApp((s) => s.addEntry);
  const target = useLogTarget();
  const day = useDay(target.date);
  const meals = useMeals();
  const [text, setText] = useState(draft);
  const [items, setItems] = useState<ParsedItem[] | null>(null);
  const foods = useMemo(() => allFoods(userFoods), [userFoods]);
  const mealLabel = meals.find((m) => m.key === target.meal)?.label ?? '';

  const analyze = () => {
    const r = parseMealText(text, foods);
    if (!r.length) return toast('כתוב מה אכלת, למשל: 2 ביצים, פרוסת לחם וסלט');
    setItems(r);
    haptic.tap();
  };
  const setItem = (i: number, patch: Partial<ParsedItem>) => setItems((list) => list!.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const save = () => {
    if (!items?.length) return;
    let n = 0;
    for (const it of items) {
      if (it.food) {
        const unit = it.food.portions.find((p) => p.label === it.unitLabel) ?? { label: it.unitLabel, grams: null };
        const c = computeFoodEntry(it.food, it.amount, unit);
        addEntry({ date: target.date, meal: target.meal, foodId: it.food.id, name: it.food.name, amount: it.amount, unitLabel: it.unitLabel, grams: c.grams, nutrients: c.nutrients, photoUri: it.food.imageUrl });
      } else {
        addEntry({ date: target.date, meal: target.meal, name: it.text, amount: 1, unitLabel: 'מנה', grams: null, nutrients: { kcal: null, protein: null, carbs: null, fat: null }, note: 'ללא ערכים – הוזן כטקסט' });
      }
      n++;
    }
    clearDraft('describe');
    haptic.success();
    toast(`${n} פריטים נוספו ל${mealLabel}`, { label: 'ליומן', onPress: () => router.push({ pathname: '/(tabs)/diary', params: { date: target.date } }) });
    goBack('/(tabs)/diary');
  };

  return (
    <LightScreen title="תיאור חופשי" subtitle={`${mealLabel} · ${prettyDate(target.date)}`}
      footer={items ? <LPrimary title={`הוספת ${items.length} פריטים ליומן`} icon="check" onPress={save} /> : <LPrimary title="זיהוי פריטים" icon="sparkle" onPress={analyze} />}>
      <LCard style={{ gap: 8 }}>
        <Text style={ls.bodyStrong}>מה אכלת?</Text>
        <TextInput
          value={text}
          onChangeText={(t) => { setText(t); setDraft('describe', t); setItems(null); }}
          placeholder={'למשל: 2 ביצים, 150 גרם אורז וחצי פיתה'}
          placeholderTextColor={light.text3}
          multiline
          style={styles.text}
          accessibilityLabel="תיאור הארוחה"
          autoFocus
        />
        <Text style={ls.muted}>אפשר להפריד בפסיקים או במילה ״ו״. כמויות: מספרים, ״חצי״, ״2 כפות״, ״150 גרם״.</Text>
      </LCard>
      <View style={{ marginTop: space.md }}>
        <Note text="התאמה מקומית למאגר המזון (לא בינה מלאכותית). כל פריט מוצג לאישור – פריט שלא נמצא לא ינוחש, ויישמר כשם בלבד או שתבחר אותו בחיפוש." />
      </View>

      {items && (
        <View style={{ gap: 10, marginTop: space.lg }}>
          <Text style={ls.h2} accessibilityRole="header">לאישור</Text>
          {items.map((it, i) => (
            <ItemCard key={i} it={it} calories={day.calories}
              onAmount={(a) => setItem(i, { amount: a, grams: it.food ? null : it.grams })}
              onPick={(f) => setItem(i, { food: f, unitLabel: f.portions[0]?.label ?? (f.basis === 'ml' ? 'מ״ל' : 'ג׳'), amount: f.portions[0] ? 1 : 100, alternatives: [it.food, ...it.alternatives].filter((x): x is Food => !!x && x.id !== f.id) })}
              onRemove={() => setItems(items.filter((_, k) => k !== i))}
              onSearch={() => router.push({ pathname: '/foods', params: { focus: '1' } })}
            />
          ))}
        </View>
      )}
    </LightScreen>
  );
}

function ItemCard({ it, calories, onAmount, onPick, onRemove, onSearch }: { it: ParsedItem; calories: boolean; onAmount: (a: number) => void; onPick: (f: Food) => void; onRemove: () => void; onSearch: () => void }) {
  const unit = it.food?.portions.find((p) => p.label === it.unitLabel) ?? { label: it.unitLabel, grams: null };
  const c = it.food ? computeFoodEntry(it.food, it.amount, unit) : null;
  const step = unit.grams == null ? 10 : 0.5;
  return (
    <LCard style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={ls.muted}>״{it.text}״</Text>
          <Text style={styles.name}>{it.food ? it.food.name : 'לא נמצא במאגר'}</Text>
          {it.food && calories && <Text style={ls.muted}>{c?.nutrients.kcal ?? '—'} קק״ל · {it.food.verified ? 'מאגר צמרת' : it.food.source.slice(0, 30)}</Text>}
        </View>
        <Tap onPress={onRemove} label={`הסרת ${it.text}`}><View style={styles.iconBtn}><Icon name="trash" size={20} color={light.text2} /></View></Tap>
      </View>
      {it.food ? (
        <View style={styles.qty}>
          <Tap onPress={() => onAmount(Math.max(0, Math.round((it.amount - step) * 10) / 10))} label="הקטנת כמות"><View style={styles.qBtn}><Icon name="minus" size={20} color={light.text} /></View></Tap>
          <Text style={styles.amount} accessibilityLabel={`כמות ${it.amount} ${it.unitLabel}`}>{it.amount} {it.unitLabel}</Text>
          <Tap onPress={() => onAmount(Math.round((it.amount + step) * 10) / 10)} label="הגדלת כמות"><View style={styles.qBtn}><Icon name="plus" size={20} color={light.text} /></View></Tap>
        </View>
      ) : (
        <Text style={ls.muted}>יישמר כשם בלבד, ללא ערכים. אפשר גם לחפש במאגר.</Text>
      )}
      {(it.alternatives.length > 0 || !it.food) && (
        <View style={styles.alts}>
          {it.alternatives.slice(0, 3).map((f) => (
            <Pressable key={f.id} onPress={() => onPick(f)} accessibilityRole="button" accessibilityLabel={`החלפה ל${f.name}`} style={styles.alt}><Text style={styles.altText} numberOfLines={1}>{f.name}</Text></Pressable>
          ))}
          <Pressable onPress={onSearch} accessibilityRole="button" accessibilityLabel="חיפוש במאגר" style={styles.alt}><Icon name="search" size={16} color={light.accentText} /><Text style={[styles.altText, { color: light.accentText }]}>חיפוש</Text></Pressable>
        </View>
      )}
    </LCard>
  );
}

const styles = StyleSheet.create({
  text: { minHeight: 110, borderRadius: radius.md, backgroundColor: light.cardSoft, padding: 14, fontFamily: fonts.regular, fontSize: 17, color: light.text, textAlignVertical: 'top', textAlign: 'right' },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: light.text },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: light.cardSoft, borderRadius: radius.md, padding: 4 },
  qBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: light.card, alignItems: 'center', justifyContent: 'center' },
  amount: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  alts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  alt: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, maxWidth: '100%', paddingHorizontal: 12, borderRadius: 20, backgroundColor: light.cardSoft },
  altText: { fontFamily: fonts.medium, fontSize: 13.5, color: light.text },
});
