import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LightScreen, LPrimary } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, LInput, DatePick, TimeField, Group, ToggleRow, Note } from '@/components/forms';
import { useApp } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { RESTAURANT_TYPES } from '@/lib/restaurants';
import { dateKey, prettyDate } from '@/lib/dates';
import { goBack } from '@/lib/nav';
import type { PlanEventType, RestaurantType } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const TYPES: { key: PlanEventType; label: string }[] = [
  { key: 'family', label: 'ארוחה משפחתית' },
  { key: 'restaurant', label: 'יציאה למסעדה' },
  { key: 'special', label: 'אירוע מיוחד' },
];

/** Add/edit a weekly-plan event: family meal, restaurant outing or special event (wedding, birthday…). */
export default function EventEdit() {
  const p = useLocalSearchParams<{ id?: string; type?: string; date?: string }>();
  const existing = useApp((s) => s.events.find((e) => e.id === p.id));
  const upsert = useApp((s) => s.upsertEvent);
  const remove = useApp((s) => s.removeEvent);
  const restore = useApp((s) => s.restoreEvent);
  const restaurants = useApp((s) => s.restaurants);
  const meals = useMeals();
  const [type, setType] = useState<PlanEventType>(existing?.type ?? (p.type as PlanEventType) ?? 'family');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? p.date ?? dateKey());
  const [time, setTime] = useState<string | null>(existing?.time ?? (type === 'restaurant' ? '20:00' : null));
  const [meal, setMeal] = useState(existing?.meal ?? 'dinner');
  const [rType, setRType] = useState<RestaurantType | undefined>(existing?.restaurantType);
  const [rId, setRId] = useState<string | undefined>(existing?.restaurantId);
  const [note, setNote] = useState(existing?.note ?? '');
  const [reminder, setReminder] = useState(existing?.reminder ?? type === 'restaurant');

  const save = () => {
    const r = restaurants.find((x) => x.id === rId);
    const t = title.trim() || (type === 'restaurant' ? (r?.name ?? RESTAURANT_TYPES.find((x) => x.key === rType)?.label ?? 'מסעדה') : TYPES.find((x) => x.key === type)!.label);
    const id = upsert({ id: existing?.id, type, title: t, date, time, meal, note: note.trim() || undefined, restaurantType: type === 'restaurant' ? rType ?? r?.type : undefined, restaurantId: type === 'restaurant' ? rId : undefined, reminder, dishIds: existing?.dishIds });
    haptic.success();
    toast(`נוסף לתוכנית של ${prettyDate(date)}`);
    if (type === 'restaurant' && !existing) router.replace({ pathname: '/restaurant', params: { event: id } });
    else goBack('/(tabs)/plan');
  };

  return (
    <LightScreen title={existing ? 'עריכת אירוע' : 'הוספה לתוכנית'} subtitle={prettyDate(date)} footer={<LPrimary title={type === 'restaurant' && !existing ? 'שמירה ובחירת מנה' : 'שמירה'} icon="check" onPress={save} />}>
      <Chips label="סוג" options={TYPES} value={type} onChange={setType} />
      <Group>
        <LInput label="שם" hint="(לא חובה)" value={title} onChangeText={setTitle} placeholder={type === 'family' ? 'למשל: ארוחת שישי אצל סבתא' : type === 'restaurant' ? 'שם המסעדה' : 'למשל: חתונה של דני'} />
        <DatePick value={date} onChange={setDate} />
        <TimeField value={time} onChange={setTime} optional quick={['12:00', '13:00', '19:00', '19:30', '20:00', '20:30', '21:00']} />
        <Chips label="במקום איזו ארוחה" options={meals.map((m) => ({ key: m.key, label: m.label }))} value={meal} onChange={setMeal} />
      </Group>
      {type === 'restaurant' && (
        <Group title="המסעדה">
          <Chips label="סוג מסעדה" options={RESTAURANT_TYPES.map((r) => ({ key: r.key, label: r.label }))} value={rType ?? ''} onChange={setRType} />
          {restaurants.length > 0 && <Chips label="מסעדה שמורה" options={restaurants.map((r) => ({ key: r.id, label: `${r.favorite ? '★ ' : ''}${r.name}` }))} value={rId ?? ''} onChange={(id: string) => { setRId(id); setRType(restaurants.find((r) => r.id === id)?.type); }} />}
          <ToggleRow icon="bell" title="תזכורת לפני היציאה" value={reminder} onChange={setReminder} />
        </Group>
      )}
      <Group>
        <LInput label="הערה" hint="(לא חובה)" value={note} onChangeText={setNote} multiline />
      </Group>
      <View style={{ marginTop: space.md }}>
        <Note text="אירוע הוא חלק מהתוכנית – בלי ״פיצוי״ לפני או אחרי. מה שאוכלים בפועל נרשם ביומן כרגיל." />
      </View>
      {existing && (
        <Tap onPress={() => { const e = remove(existing.id); haptic.warn(); if (e) toast(`${e.title} הוסר`, { label: 'ביטול', onPress: () => restore(e) }); goBack('/(tabs)/plan'); }} label="מחיקת האירוע">
          <View style={styles.del}><Icon name="trash" size={18} color="#C2361B" /><Text style={styles.delText}>מחיקה</Text></View>
        </Tap>
      )}
    </LightScreen>
  );
}

const styles = StyleSheet.create({
  del: { marginTop: space.lg, minHeight: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: light.border, backgroundColor: light.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  delText: { fontFamily: fonts.semibold, fontSize: 15, color: '#C2361B' },
});
