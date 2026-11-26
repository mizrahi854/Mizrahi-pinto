import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast, Sheet, Field, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { EditEntrySheet } from '@/components/DiaryParts';
import { useApp } from '@/store/useApp';
import { useDay, useMeals } from '@/store/selectors';
import { addDays, dateKey, prettyDate } from '@/lib/dates';
import { fmt } from '@/lib/nutrition';
import { totalsOf } from '@/lib/engine';
import { goBack } from '@/lib/nav';
import type { FoodEntry } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** Edit a whole meal: name, photo, time, every item (amount / delete), move, duplicate, save as a fixed meal. */
export default function MealScreen() {
  const p = useLocalSearchParams<{ date?: string; meal?: string }>();
  const date = p.date ?? dateKey();
  const mealKey = p.meal ?? 'breakfast';
  const day = useDay(date);
  const meals = useMeals();
  const meta = useApp((s) => s.mealMeta[`${date}|${mealKey}`]);
  const setMeta = useApp((s) => s.setMealMeta);
  const updateEntry = useApp((s) => s.updateEntry);
  const removeEntry = useApp((s) => s.removeEntry);
  const restoreEntry = useApp((s) => s.restoreEntry);
  const removeMeal = useApp((s) => s.removeMeal);
  const restoreEntries = useApp((s) => s.restoreEntries);
  const copyMeal = useApp((s) => s.copyMeal);
  const saveMeal = useApp((s) => s.saveMeal);
  const setLogCtx = useApp((s) => s.setLogCtx);
  const def = meals.find((m) => m.key === mealKey);
  const list = day.list.filter((e) => e.meal === mealKey);
  const sum = totalsOf(list);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [rename, setRename] = useState(false);
  const [title, setTitle] = useState(meta?.title ?? '');
  const [move, setMove] = useState(false);
  const name = meta?.title || def?.label || 'ארוחה';
  const photo = meta?.photo;

  const pickPhoto = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return toast('אין הרשאה לגלריה – אפשר לאשר בהגדרות');
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) { setMeta(date, mealKey, { photo: r.assets[0].uri }); toast('התמונה צורפה לארוחה'); }
  };

  const delItem = (e: FoodEntry) => {
    removeEntry(e.id);
    haptic.warn();
    toast(`${e.name} נמחק`, { label: 'ביטול', onPress: () => restoreEntry(e) });
  };

  if (!list.length) {
    return (
      <LightScreen title={name} subtitle={prettyDate(date)}>
        <LCard style={{ alignItems: 'center', gap: 10, paddingVertical: space.xl }}>
          <Icon name="bowl" size={36} color={light.accent} />
          <Text style={ls.bodyStrong}>הארוחה ריקה</Text>
          <LPrimary title="הוספת מזון" icon="plus" onPress={() => { setLogCtx(date, mealKey); router.replace({ pathname: '/add-meal', params: { date, meal: mealKey } }); }} />
        </LCard>
      </LightScreen>
    );
  }

  return (
    <LightScreen
      title={name}
      subtitle={`${prettyDate(date)} · ${list[0]?.time ?? ''}`}
      footer={<LPrimary title="הוספת מזון לארוחה" icon="plus" onPress={() => { setLogCtx(date, mealKey); router.push({ pathname: '/add-meal', params: { date, meal: mealKey } }); }} />}
    >
      <Tap onPress={pickPhoto} label={photo ? 'החלפת תמונת הארוחה' : 'הוספת תמונה לארוחה'}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" accessibilityLabel={`תמונת ${name}`} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}><Icon name="camera" size={26} color={light.accent} /><Text style={ls.muted}>הוספת תמונה (לא חובה)</Text></View>
        )}
      </Tap>

      {day.calories && (
        <LCard style={styles.sum} label={`סך הארוחה: ${sum.kcal} קלוריות`}>
          <SumCell v={`${sum.kcal}${sum.partial.kcal ? '*' : ''}`} l="קק״ל" />
          <SumCell v={fmt(sum.protein)} l="חלבון" />
          <SumCell v={fmt(sum.carbs)} l="פחמימות" />
          <SumCell v={fmt(sum.fat)} l="שומן" />
        </LCard>
      )}

      <Text style={[ls.h2, { marginTop: space.lg, marginBottom: 8 }]} accessibilityRole="header">מה נאכל</Text>
      <View style={{ gap: 8 }}>
        {list.map((e) => (
          <View key={e.id} style={styles.item}>
            <Pressable onPress={() => setEditing(e)} accessibilityRole="button" accessibilityLabel={`${e.name}, ${e.amount} ${e.unitLabel}. עריכה`} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
              <Text style={styles.itemName} numberOfLines={2}>{e.name}</Text>
              <Text style={ls.muted}>{e.items ? `${e.items.length} רכיבים` : `${e.amount} ${e.unitLabel}`} · {e.time}{e.note ? ` · ${e.note}` : ''}</Text>
            </Pressable>
            {day.calories && <Text style={styles.kcal}>{e.nutrients.kcal == null ? 'לא ידוע' : e.nutrients.kcal}</Text>}
            <Tap onPress={() => delItem(e)} label={`מחיקת ${e.name}`}><View style={styles.iconBtn}><Icon name="trash" size={20} color={light.text2} /></View></Tap>
          </View>
        ))}
      </View>

      <Text style={[ls.h2, { marginTop: space.xl, marginBottom: 8 }]} accessibilityRole="header">פעולות</Text>
      <View style={styles.grid}>
        <Action icon="edit" label="שינוי שם" onPress={() => setRename(true)} />
        <Action icon="clock" label="שינוי שעה / העברה" onPress={() => setMove(true)} />
        <Action icon="copy" label="שכפול למחר" onPress={() => { const n = copyMeal(date, mealKey, addDays(date, 1)); haptic.success(); toast(`${n} פריטים שוכפלו ל${prettyDate(addDays(date, 1))}`); }} />
        <Action icon="star" label="שמירה כארוחה קבועה" onPress={() => { saveMeal(name, list.map((e) => e.id)); haptic.success(); toast('נשמר בארוחות השמורות', { label: 'לצפייה', onPress: () => router.push('/saved-meals') }); }} />
        <Action icon="trash" label="מחיקת הארוחה" danger onPress={() => {
          const removed = removeMeal(date, mealKey);
          haptic.warn();
          toast(`${name} נמחקה`, { label: 'ביטול', onPress: () => restoreEntries(removed) });
          goBack('/(tabs)/diary');
        }} />
      </View>

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} adult={day.calories} />

      <Sheet visible={rename} onClose={() => setRename(false)} title="שם הארוחה">
        <Field label="שם" value={title} onChangeText={setTitle} placeholder={def?.label} />
        <Button title="שמירה" onPress={() => { setMeta(date, mealKey, { title: title.trim() || undefined }); setRename(false); toast('נשמר'); }} />
      </Sheet>

      <MoveSheet visible={move} onClose={() => setMove(false)} date={date} meal={mealKey} entries={list} onApply={(patch) => {
        for (const e of list) updateEntry(e.id, patch);
        setMove(false);
        haptic.success();
        toast('הארוחה עודכנה');
        if (patch.date !== date || patch.meal !== mealKey) router.replace({ pathname: '/meal', params: { date: patch.date ?? date, meal: patch.meal ?? mealKey } });
      }} />
    </LightScreen>
  );
}

function MoveSheet({ visible, onClose, date, meal, entries, onApply }: { visible: boolean; onClose: () => void; date: string; meal: string; entries: FoodEntry[]; onApply: (p: Partial<FoodEntry>) => void }) {
  const meals = useMeals();
  const [m, setM] = useState(meal);
  const [d, setD] = useState(date);
  const [time, setTime] = useState(entries[0]?.time ?? '12:00');
  React.useEffect(() => { if (visible) { setM(meal); setD(date); setTime(entries[0]?.time ?? '12:00'); } }, [visible, meal, date, entries]);
  return (
    <Sheet visible={visible} onClose={onClose} title="שעה, יום וסוג ארוחה" scroll>
      <Text style={styles.sheetLabel}>סוג ארוחה</Text>
      <View style={styles.chips}>
        {meals.map((x) => (
          <Pressable key={x.key} onPress={() => setM(x.key)} accessibilityRole="radio" accessibilityState={{ selected: m === x.key }} accessibilityLabel={x.label} style={[styles.dChip, m === x.key && styles.dChipOn]}>
            <Text style={[styles.dChipText, m === x.key && { color: '#131416' }]}>{x.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sheetLabel}>יום</Text>
      <View style={styles.chips}>
        {[-2, -1, 0, 1].map((k) => {
          const v = addDays(dateKey(), k);
          return (
            <Pressable key={v} onPress={() => setD(v)} accessibilityRole="radio" accessibilityState={{ selected: d === v }} accessibilityLabel={prettyDate(v)} style={[styles.dChip, d === v && styles.dChipOn]}>
              <Text style={[styles.dChipText, d === v && { color: '#131416' }]}>{prettyDate(v)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Field label="שעה (HH:MM)" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" maxLength={5} />
      <Button title="שמירה" onPress={() => onApply({ meal: m, date: d, time: /^\d{1,2}:\d{2}$/.test(time) ? time : entries[0]?.time })} />
    </Sheet>
  );
}

function Action({ icon, label, onPress, danger }: { icon: 'edit' | 'clock' | 'copy' | 'star' | 'trash'; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Tap onPress={onPress} label={label} style={{ width: '48%' }}>
      <View style={styles.action}>
        <Icon name={icon} size={22} color={danger ? '#C2361B' : light.accentText} />
        <Text style={[styles.actionText, danger && { color: '#C2361B' }]}>{label}</Text>
      </View>
    </Tap>
  );
}

function SumCell({ v, l }: { v: string; l: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.sumV}>{v}</Text>
      <Text style={ls.muted}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { height: 170, borderRadius: radius.lg, width: '100%' },
  photoEmpty: { backgroundColor: light.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(245,121,37,0.35)', alignItems: 'center', justifyContent: 'center', gap: 6, height: 96 },
  sum: { flexDirection: 'row', marginTop: space.md },
  sumV: { fontFamily: fonts.bold, fontSize: 20, color: light.text, fontVariant: ['tabular-nums'] },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: light.card, borderRadius: radius.md, paddingStart: 14, paddingEnd: 4, paddingVertical: 6 },
  itemName: { fontFamily: fonts.semibold, fontSize: 15.5, color: light.text },
  kcal: { fontFamily: fonts.bold, fontSize: 16, color: light.text, fontVariant: ['tabular-nums'] },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  action: { minHeight: 64, borderRadius: radius.md, backgroundColor: light.card, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  actionText: { fontFamily: fonts.semibold, fontSize: 14, color: light.text, textAlign: 'center' },
  sheetLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: fonts.medium, marginTop: space.md, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dChip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' },
  dChipOn: { backgroundColor: '#F2A05C', borderColor: '#F2A05C' },
  dChipText: { fontFamily: fonts.medium, fontSize: 14, color: '#fff' },
});
