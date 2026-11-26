import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LightScreen, LIconButton, ls } from '@/components/light';
import { Tap, Sheet, toast, ListItem, Field, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, findFood } from '@/store/useApp';
import { useDay, useMeals } from '@/store/selectors';
import { addDays, dateKey, prettyDate, weekOf, DAY_SHORT, parseKey } from '@/lib/dates';
import { fmt } from '@/lib/nutrition';
import { computeFoodEntry, rescale, totalsOf } from '@/lib/engine';
import type { FoodEntry } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** 16 Daily nutrition diary */
export default function Diary() {
  const params = useLocalSearchParams<{ date?: string; meal?: string }>();
  const [date, setDate] = useState(params.date ?? dateKey());
  const day = useDay(date);
  const meals = useMeals();
  const entries = useApp((s) => s.entries);
  const removeEntry = useApp((s) => s.removeEntry);
  const restoreEntry = useApp((s) => s.restoreEntry);
  const copyMeal = useApp((s) => s.copyMeal);
  const saveMeal = useApp((s) => s.saveMeal);
  const addCustomMeal = useApp((s) => s.addCustomMeal);
  const [open, setOpen] = useState<Record<string, boolean>>(() => (params.meal ? { [params.meal]: true } : {}));
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [mealMenu, setMealMenu] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [newMeal, setNewMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const t = day.totals;
  const week = weekOf(date);
  const loggedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);

  const del = (e: FoodEntry) => {
    removeEntry(e.id);
    haptic.warn();
    toast(`${e.name} נמחק`, { label: 'ביטול', onPress: () => restoreEntry(e) });
  };
  const target = day.target.calorieTarget;

  return (
    <LightScreen
      title="יומן תזונה"
      subtitle={prettyDate(date)}
      right={<LIconButton icon="calendar" label="לוח שנה" onPress={() => setCalendar(true)} />}
      heroHeight={day.adult ? 150 : 96}
      hero={
        <View style={{ gap: 12 }}>
          <View style={styles.week}>
            <Tap onPress={() => setDate(addDays(date, -7))} label="שבוע קודם"><View style={styles.weekArrow}><Icon name="chevronBack" size={18} color="#fff" /></View></Tap>
            {week.map((d, i) => {
              const on = d === date;
              return (
                <Pressable key={d} onPress={() => { haptic.select(); setDate(d); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${prettyDate(d)}${loggedDates.has(d) ? ', יש רישומים' : ''}`} style={[styles.wd, on && styles.wdOn]}>
                  <Text style={[styles.wdDay, on && { color: '#1A0C04' }]}>{DAY_SHORT[i]}</Text>
                  <Text style={[styles.wdNum, on && { color: '#1A0C04' }]}>{parseKey(d).getDate()}</Text>
                  <View style={[styles.dot, { opacity: loggedDates.has(d) ? 1 : 0 }, on && { backgroundColor: '#1A0C04' }]} />
                </Pressable>
              );
            })}
            <Tap onPress={() => setDate(addDays(date, 7))} label="שבוע הבא"><View style={styles.weekArrow}><Icon name="chevron" size={18} color="#fff" /></View></Tap>
          </View>
          {day.adult && (
            <View style={styles.summary} accessible accessibilityLabel={`סיכום: ${t.kcal} קלוריות${target ? ` מתוך ${target}` : ''}, חלבון ${fmt(t.protein)} גרם`}>
              <Sum v={`${t.kcal}${t.partial.kcal ? '*' : ''}`} l={target ? `מתוך ${target.toLocaleString()} קק״ל` : 'קק״ל'} big />
              <Sum v={fmt(t.protein)} l="חלבון" />
              <Sum v={fmt(t.carbs)} l="פחמ׳" />
              <Sum v={fmt(t.fat)} l="שומן" />
            </View>
          )}
        </View>
      }
    >
      {date !== dateKey() && (
        <Tap onPress={() => setDate(dateKey())} label="חזרה להיום"><View style={styles.today}><Icon name="calendar" size={16} color={light.accent} /><Text style={styles.todayText}>חזרה להיום</Text></View></Tap>
      )}
      {(t.partial.kcal || t.partial.protein) && <Text style={[ls.caption, { textAlign: 'center', marginBottom: 8 }]}>* חלק מהפריטים ללא ערך ידוע – לא נספרו כאפס</Text>}

      <View style={{ gap: 10 }}>
        {meals.map((m) => {
          const list = day.list.filter((e) => e.meal === m.key);
          const sum = totalsOf(list);
          const isOpen = open[m.key] ?? list.length > 0;
          const time = list[0]?.time;
          return (
            <View key={m.key} style={styles.meal}>
              <View style={styles.mealHead}>
                <Pressable onPress={() => setOpen({ ...open, [m.key]: !isOpen })} accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={`${m.label}, ${list.length} פריטים${day.adult && list.length ? `, ${sum.kcal} קלוריות` : ''}`} style={styles.mealTitleBtn}>
                  <View style={styles.mealIcon}><Icon name={m.icon} size={20} color={light.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealName}>{m.label}</Text>
                    <Text style={ls.muted}>{list.length ? `${list.length} פריטים${day.adult ? ` · ${sum.kcal}${sum.partial.kcal ? '*' : ''} קק״ל` : ''}${time ? ` · ${time}` : ''}` : 'טרם תועד'}</Text>
                  </View>
                  {list.length > 0 && <View style={{ transform: [{ rotate: isOpen ? '90deg' : '-90deg' }] }}><Icon name="chevron" size={18} color={light.text2} /></View>}
                </Pressable>
                <Tap onPress={() => setMealMenu(m.key)} label={`אפשרויות ל${m.label}`}><View style={styles.iconBtn}><Icon name="dots" size={20} color={light.text2} /></View></Tap>
                <Tap onPress={() => router.push({ pathname: '/foods', params: { meal: m.key, date, focus: '1' } })} label={`הוספה ל${m.label}`}><View style={styles.plus}><Icon name="plus" size={22} color="#fff" strokeWidth={2.2} /></View></Tap>
              </View>
              {isOpen && list.map((e) => (
                <View key={e.id} style={styles.entry}>
                  <Pressable onPress={() => setEditing(e)} accessibilityRole="button" accessibilityLabel={`${e.name}, ${e.grams != null ? `${e.amount} ${e.unitLabel}` : 'ללא כמות'}. עריכה`} style={{ flex: 1 }}>
                    <Text style={styles.entryName} numberOfLines={1}>{e.name}</Text>
                    <Text style={ls.muted} numberOfLines={1}>{e.grams != null ? `${e.amount} ${e.unitLabel}` : e.items ? `${e.items.length} רכיבים` : 'מנה'} · {e.time}{e.note ? ` · ${e.note}` : ''}</Text>
                    {e.items && <Text style={ls.caption} numberOfLines={2}>{e.items.map((i) => i.name).join(' · ')}</Text>}
                  </Pressable>
                  <Text style={[styles.entryKcal, e.nutrients.kcal == null && { color: light.text3 }]}>{day.adult ? (e.nutrients.kcal == null ? 'לא ידוע' : e.nutrients.kcal) : `${fmt(e.nutrients.protein)} ח׳`}</Text>
                  <Tap onPress={() => del(e)} label={`מחיקת ${e.name}`}><View style={styles.iconBtn}><Icon name="trash" size={19} color={light.text2} /></View></Tap>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      <Tap onPress={() => setNewMeal(true)} label="הוספת ארוחה נוספת">
        <View style={styles.addMeal}><Icon name="plus" size={18} color={light.accent} /><Text style={styles.addMealText}>ארוחה נוספת</Text></View>
      </Tap>

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} adult={day.adult} />

      <Sheet visible={!!mealMenu} onClose={() => setMealMenu(null)} title={meals.find((m) => m.key === mealMenu)?.label}>
        <ListItem icon="copy" title="העתקה מאתמול" subtitle="מוסיף את אותה ארוחה מהיום הקודם" onPress={() => {
          const n = copyMeal(addDays(date, -1), mealMenu!, date);
          setMealMenu(null);
          toast(n ? `${n} פריטים הועתקו מאתמול` : 'אין פריטים בארוחה הזו אתמול');
          if (n) haptic.success();
        }} />
        <ListItem icon="star" title="שמירה כארוחה קבועה" onPress={() => {
          const ids = day.list.filter((e) => e.meal === mealMenu).map((e) => e.id);
          if (!ids.length) { toast('הארוחה ריקה'); return; }
          saveMeal(`${meals.find((m) => m.key === mealMenu)?.label} · ${prettyDate(date)}`, ids);
          setMealMenu(null); toast('נשמר בארוחות הקבועות'); haptic.success();
        }} />
        <ListItem icon="list" title="ארוחה שמורה" subtitle="הוספה מהארוחות הקבועות" onPress={() => { const k = mealMenu; setMealMenu(null); router.push({ pathname: '/saved-meals', params: { meal: k!, date } }); }} />
        <ListItem icon="flame" title="קלוריות מהירות" onPress={() => { setMealMenu(null); router.push('/quick-calories'); }} />
      </Sheet>

      <CalendarSheet visible={calendar} value={date} logged={loggedDates} onClose={() => setCalendar(false)} onPick={(d) => { setDate(d); setCalendar(false); }} />

      <Sheet visible={newMeal} onClose={() => setNewMeal(false)} title="ארוחה נוספת">
        <Field label="שם הארוחה" value={mealName} onChangeText={setMealName} placeholder="למשל: לפני אימון" />
        <Button title="הוספה" disabled={mealName.trim().length < 2} onPress={() => { addCustomMeal(mealName.trim()); setMealName(''); setNewMeal(false); toast('הארוחה נוספה'); }} />
      </Sheet>
    </LightScreen>
  );
}

function Sum({ v, l, big }: { v: string; l: string; big?: boolean }) {
  return (
    <View style={{ flex: big ? 1.6 : 1, alignItems: 'center' }}>
      <Text style={[styles.sumV, big && { fontSize: 30 }]}>{v}</Text>
      <Text style={styles.sumL}>{l}</Text>
    </View>
  );
}

function CalendarSheet({ visible, value, logged, onClose, onPick }: { visible: boolean; value: string; logged: Set<string>; onClose: () => void; onPick: (d: string) => void }) {
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
  React.useEffect(() => { if (entry) { setAmount(entry.amount); setMeal(entry.meal); setTime(entry.time); } }, [entry]);
  if (!entry) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const food = findFood(entry.foodId, userFoods);
  const portion = food?.portions.find((p) => p.label === entry.unitLabel);
  const unit = { label: entry.unitLabel, grams: portion ? portion.grams : food && entry.grams != null && entry.grams !== entry.amount ? entry.grams / Math.max(entry.amount, 0.0001) : null };
  const preview = food ? computeFoodEntry(food, amount, unit) : { grams: entry.grams == null ? null : (entry.grams * amount) / Math.max(entry.amount, 0.0001), nutrients: entry.amount ? rescale(entry.nutrients, amount / entry.amount) : entry.nutrients };
  const canScale = entry.amount > 0;
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
      {adult && <Text style={styles.editPreview}>{preview.nutrients.kcal == null ? 'אנרגיה לא ידועה' : `${preview.nutrients.kcal} קק״ל`} · חלבון {fmt(preview.nutrients.protein, ' ג׳')}</Text>}
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
          update(entry.id, { amount, meal, time: /^\d{1,2}:\d{2}$/.test(time) ? time : entry.time, grams: preview.grams == null ? null : Math.round(preview.grams * 10) / 10, nutrients: preview.nutrients });
          haptic.success(); toast('נשמר'); onClose();
        }} />
        <Button style={{ flex: 1 }} title="שכפול למחר" variant="soft" icon="copy" onPress={() => { dup([entry.id], addDays(entry.date, 1)); toast('שוכפל למחר'); onClose(); }} />
      </View>
      <Button style={{ marginTop: 8 }} title="מחיקה" variant="danger" icon="trash" onPress={() => { const e = removeEntry(entry.id); onClose(); if (e) toast(`${e.name} נמחק`, { label: 'ביטול', onPress: () => restoreEntry(e) }); }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'center' },
  weekArrow: { width: 32, height: 52, alignItems: 'center', justifyContent: 'center' },
  wd: { width: 42, paddingVertical: 6, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.18)', minHeight: 58 },
  wdOn: { backgroundColor: '#F2A05C', borderColor: '#F2A05C' },
  wdDay: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  wdNum: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2A05C', marginTop: 2 },
  summary: { flexDirection: 'row', alignItems: 'flex-end' },
  sumV: { fontFamily: fonts.bold, fontSize: 20, color: '#fff', fontVariant: ['tabular-nums'] },
  sumL: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  today: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 40, borderRadius: 20, backgroundColor: light.accentSoft, marginBottom: 10 },
  todayText: { fontFamily: fonts.semibold, fontSize: 14, color: light.accentText },
  meal: { backgroundColor: light.card, borderRadius: radius.lg, padding: 12 },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealTitleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  mealIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: light.accentSoft, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: light.accent, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: light.border, minHeight: 54 },
  entryName: { fontFamily: fonts.semibold, fontSize: 15.5, color: light.text },
  entryKcal: { fontFamily: fonts.bold, fontSize: 16, color: light.text, fontVariant: ['tabular-nums'] },
  addMeal: { marginTop: space.md, minHeight: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(242,107,29,0.4)', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addMealText: { fontFamily: fonts.semibold, fontSize: 15, color: light.accentText },
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
