import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Tap, Sheet, toast, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { addDays, dateKey, prettyDate, DAY_SHORT, parseKey } from '@/lib/dates';
import { fmt } from '@/lib/nutrition';
import { computeFoodEntry, rescale } from '@/lib/engine';
import type { FoodEntry } from '@/data/types';
import { fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export function CalendarSheet({ visible, value, logged, onClose, onPick }: { visible: boolean; value: string; logged: Set<string>; onClose: () => void; onPick: (d: string) => void }) {
  const [month, setMonth] = useState(() => { const d = parseKey(value); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days: (string | null)[] = [];
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= count; d++) days.push(dateKey(new Date(month.getFullYear(), month.getMonth(), d)));
  return (
    <Sheet visible={visible} onClose={onClose} title={`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Tap onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} label="חודש קודם"><View style={styles.calNav}><Icon name="chevronBack" size={20} color="#fff" /></View></Tap>
        <Tap onPress={() => onPick(dateKey())} label="היום"><View style={[styles.calNav, { width: 80 }]}><Text style={{ color: '#fff', fontFamily: fonts.semibold }}>היום</Text></View></Tap>
        <Tap onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} label="חודש הבא"><View style={styles.calNav}><Icon name="chevron" size={20} color="#fff" /></View></Tap>
      </View>
      <View style={styles.calGrid}>
        {DAY_SHORT.map((d) => <Text key={d} style={styles.calHead}>{d}</Text>)}
        {days.map((d, i) => d ? (
          <Pressable key={d} onPress={() => onPick(d)} accessibilityRole="button" accessibilityLabel={`${prettyDate(d)}${logged.has(d) ? ', יש רישומים' : ''}`} style={[styles.calDay, d === value && styles.calDayOn]}>
            <Text style={[styles.calNum, d === value && { color: '#1A0C04' }]}>{parseKey(d).getDate()}</Text>
            {logged.has(d) && <View style={[styles.dot, d === value && { backgroundColor: '#1A0C04' }]} />}
          </Pressable>
        ) : <View key={`e${i}`} style={styles.calDay} />)}
      </View>
    </Sheet>
  );
}

/** Edit an entry: amount (via the central engine), meal, time, duplicate, delete. */
export function EditEntrySheet({ entry, onClose, adult }: { entry: FoodEntry | null; onClose: () => void; adult: boolean }) {
  const meals = useMeals();
  const update = useApp((s) => s.updateEntry);
  const dup = useApp((s) => s.duplicateEntries);
  const removeEntry = useApp((s) => s.removeEntry);
  const restoreEntry = useApp((s) => s.restoreEntry);
  const userFoods = useApp((s) => s.foods);
  const [amount, setAmount] = useState(entry?.amount ?? 0);
  const [meal, setMeal] = useState(entry?.meal ?? 'breakfast');
  const [time, setTime] = useState(entry?.time ?? '');
  const [name, setName] = useState(entry?.name ?? '');
  const [kcal, setKcal] = useState(entry?.nutrients.kcal != null ? String(entry.nutrients.kcal) : '');
  React.useEffect(() => { if (entry) { setAmount(entry.amount); setMeal(entry.meal); setTime(entry.time); setName(entry.name); setKcal(entry.nutrients.kcal != null ? String(entry.nutrients.kcal) : ''); } }, [entry]);
  if (!entry) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const food = findFood(entry.foodId, userFoods);
  const portion = food?.portions.find((p) => p.label === entry.unitLabel);
  const unit = { label: entry.unitLabel, grams: portion ? portion.grams : food && entry.grams != null && entry.grams !== entry.amount ? entry.grams / Math.max(entry.amount, 0.0001) : null };
  const preview = food ? computeFoodEntry(food, amount, unit) : { grams: entry.grams == null ? null : (entry.grams * amount) / Math.max(entry.amount, 0.0001), nutrients: entry.amount ? rescale(entry.nutrients, amount / entry.amount) : entry.nutrients };
  const free = !entry.foodId && !entry.items; // free entry ("הוסף קלוריות" / manual dish): name and calories are editable
  const canScale = entry.amount > 0 && !free;
  const step = unit.grams == null && entry.grams != null ? 10 : 0.5;

  return (
    <Sheet visible onClose={onClose} title={entry.name} scroll>
      {canScale && (
        <View style={styles.editQty}>
          <Tap onPress={() => setAmount(Math.round((amount + step) * 10) / 10)} label="הגדלת כמות"><View style={styles.qBtn}><Icon name="plus" size={22} color="#fff" /></View></Tap>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <TextInput value={String(amount)} onChangeText={(t) => { const v = Number(t.replace(/[^\d.]/g, '')); if (isFinite(v)) setAmount(v); }} keyboardType="decimal-pad" style={styles.editAmount} accessibilityLabel="כמות" selectTextOnFocus />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular }}>{entry.unitLabel}</Text>
          </View>
          <Tap onPress={() => setAmount(Math.max(0, Math.round((amount - step) * 10) / 10))} label="הקטנת כמות"><View style={styles.qBtn}><Icon name="minus" size={22} color="#fff" /></View></Tap>
        </View>
      )}
      {free && (
        <View style={{ gap: 6 }}>
          <Text style={styles.editLabel}>שם</Text>
          <TextInput value={name} onChangeText={setName} style={[styles.timeInput, { width: '100%', textAlign: 'right', paddingHorizontal: 14 }]} accessibilityLabel="שם המאכל" />
          {adult && (<>
            <Text style={styles.editLabel}>קלוריות</Text>
            <TextInput value={kcal} onChangeText={(v) => setKcal(v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="לא ידוע" placeholderTextColor="rgba(255,255,255,0.5)" style={styles.timeInput} accessibilityLabel="קלוריות" maxLength={5} />
          </>)}
        </View>
      )}
      {adult && !free && <Text style={styles.editPreview}>{preview.nutrients.kcal == null ? 'אנרגיה לא ידועה' : `${preview.nutrients.kcal} קק״ל`} · חלבון {fmt(preview.nutrients.protein, ' ג׳')}</Text>}
      <Text style={styles.editLabel}>העברה לארוחה</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {meals.map((m) => (
          <Pressable key={m.key} onPress={() => setMeal(m.key)} accessibilityRole="radio" accessibilityState={{ selected: meal === m.key }} accessibilityLabel={m.label} style={[styles.darkChip, meal === m.key && styles.darkChipOn]}>
            <Text style={[styles.darkChipText, meal === m.key && { color: '#1A0C04' }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.editLabel}>שעה</Text>
      <TextInput value={time} onChangeText={setTime} style={styles.timeInput} maxLength={5} accessibilityLabel="שעה" keyboardType="numbers-and-punctuation" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: space.lg }}>
        <Button style={{ flex: 1.4 }} title="שמירה" onPress={() => {
          const t = /^\d{1,2}:\d{2}$/.test(time) ? time : entry.time;
          if (free) update(entry.id, { meal, time: t, name: name.trim() || entry.name, nutrients: { ...entry.nutrients, kcal: kcal === '' ? null : Number(kcal) } });
          else update(entry.id, { amount, meal, time: t, grams: preview.grams == null ? null : Math.round(preview.grams * 10) / 10, nutrients: preview.nutrients });
          haptic.success(); toast('נשמר'); onClose();
        }} />
        <Button style={{ flex: 1 }} title="שכפול למחר" variant="soft" icon="copy" onPress={() => { dup([entry.id], addDays(entry.date, 1)); toast('שוכפל למחר'); onClose(); }} />
      </View>
      <Button style={{ marginTop: 8 }} title="מחיקה" variant="danger" icon="trash" onPress={() => { const e = removeEntry(entry.id); onClose(); if (e) toast(`${e.name} נמחק`, { label: 'ביטול', onPress: () => restoreEntry(e) }); }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2A05C', marginTop: 2 },
  calNav: { width: 48, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calHead: { width: '14.28%', textAlign: 'center', fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingVertical: 6 },
  calDay: { width: '14.28%', height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  calDayOn: { backgroundColor: '#F2A05C' },
  calNum: { fontFamily: fonts.semibold, fontSize: 15, color: '#fff' },
  editQty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.06)' },
  qBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  editAmount: { fontFamily: fonts.bold, fontSize: 34, color: '#fff', textAlign: 'center', minWidth: 100, paddingVertical: 0 },
  editPreview: { textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontFamily: fonts.medium, marginTop: 10 },
  editLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium, marginTop: space.md, marginBottom: 6 },
  darkChip: { minHeight: 42, paddingHorizontal: 14, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.2)', justifyContent: 'center' },
  darkChipOn: { backgroundColor: '#F2A05C', borderColor: '#F2A05C' },
  darkChipText: { fontFamily: fonts.medium, fontSize: 14, color: '#fff' },
  timeInput: { minHeight: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: fonts.semibold, fontSize: 17, textAlign: 'center', width: 110 },
});
