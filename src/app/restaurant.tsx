import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast, Badge, Sheet, Field, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, Group, Note, LInput } from '@/components/forms';
import { useApp, allFoods, tracksCalories } from '@/store/useApp';
import { RESTAURANT_TYPES, restaurantLabel } from '@/lib/restaurants';
import { searchLocal } from '@/lib/search';
import { nutrientsFor } from '@/lib/nutrition';
import { dateKey, prettyDate, nowTime } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import type { RestaurantDish, RestaurantType } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/**
 * "אני יוצא למסעדה" – plan an outing, find or enter a dish, save favourites, attach to the diary.
 * Values without official restaurant data are labelled as estimates; allergens are never invented.
 */
export default function RestaurantMode() {
  const p = useLocalSearchParams<{ event?: string }>();
  const event = useApp((s) => s.events.find((e) => e.id === p.event));
  const upsertEvent = useApp((s) => s.upsertEvent);
  const dishes = useApp((s) => s.dishes);
  const restaurants = useApp((s) => s.restaurants);
  const upsertDish = useApp((s) => s.upsertDish);
  const removeDish = useApp((s) => s.removeDish);
  const restoreDish = useApp((s) => s.restoreDish);
  const logDish = useApp((s) => s.logDish);
  const upsertRestaurant = useApp((s) => s.upsertRestaurant);
  const userFoods = useApp((s) => s.foods);
  const calories = useApp((s) => tracksCalories(s.profile));
  const allEvents = useApp((s) => s.events);
  const upcoming = useMemo(() => allEvents.filter((e) => e.type === 'restaurant' && e.date >= dateKey()).sort((a, b) => a.date.localeCompare(b.date)), [allEvents]);
  const [type, setType] = useState<RestaurantType | undefined>(event?.restaurantType);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState<string | null>(null);
  const [newRest, setNewRest] = useState(false);
  const [restName, setRestName] = useState('');

  const mine = dishes.filter((d) => (!type || d.type === type) && (!q || d.name.includes(q)));
  const favorites = mine.filter((d) => d.favorite);
  const chosen = event?.dishIds?.map((id) => dishes.find((d) => d.id === id)).filter((d): d is RestaurantDish => !!d) ?? [];
  const dbResults = useMemo(() => {
    const query = q.trim() || (type ? RESTAURANT_TYPES.find((r) => r.key === type)!.q[0]! : '');
    return query.length < 2 ? [] : searchLocal(allFoods(userFoods), query, 8);
  }, [q, type, userFoods]);

  const choose = (id: string) => {
    if (!event) return;
    upsertEvent({ ...event, dishIds: [...new Set([...(event.dishIds ?? []), id])] });
    toast('המנה נוספה לתכנון היציאה');
  };
  const fromDb = (foodId: string) => {
    const f = allFoods(userFoods).find((x) => x.id === foodId)!;
    const portion = f.portions.find((x) => /מנה בינונית|^מנה$|יחידה בינונית/.test(x.label)) ?? f.portions[0];
    const grams = portion?.grams ?? 100;
    const id = upsertDish({
      name: f.name, type: type ?? event?.restaurantType ?? 'cafe', restaurantId: event?.restaurantId, nutrients: nutrientsFor(f, grams), estimated: true,
      basis: `הערכה: ${portion?.label ?? '100 ג׳'} (${grams} ג׳) לפי ${f.verified ? 'מאגר צמרת – מתכון ממוצע' : f.source}. לא נתון רשמי של המסעדה.`,
      allergens: f.allergens?.length ? f.allergens : null, favorite: false,
    });
    haptic.success();
    if (event) choose(id);
    else toast('המנה נשמרה ב״המנות שלי״');
  };
  const pickMenuPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled || !r.assets[0]) return;
    router.push({ pathname: '/dish', params: { photo: r.assets[0].uri, menu: '1', event: event?.id ?? '', type: type ?? '' } });
  };

  return (
    <LightScreen title="מצב מסעדה" subtitle={event ? `${event.title} · ${prettyDate(event.date)}${event.time ? ` ${event.time}` : ''}` : 'אני יוצא למסעדה'}
      footer={event ? <LPrimary title="הזנת מנה ידנית" icon="edit" onPress={() => router.push({ pathname: '/dish', params: { event: event.id, type: type ?? '' } })} /> : <LPrimary title="תכנון יציאה למסעדה" icon="calendar" onPress={() => router.push({ pathname: '/event', params: { type: 'restaurant' } })} />}>
      {event ? (
        <LCard style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="food" size={22} color={light.accentText} />
            <Text style={[ls.bodyStrong, { flex: 1 }]}>{event.title} · {restaurantLabel(event.restaurantType)}</Text>
            <Tap onPress={() => router.push({ pathname: '/event', params: { id: event.id } })} label="עריכת היציאה"><Text style={styles.link}>עריכה</Text></Tap>
          </View>
          <Text style={ls.muted}>{chosen.length ? 'המנות שבחרת מראש:' : 'אפשר לבחור מנה מראש – או לצרף ליומן אחרי הארוחה.'}</Text>
          {chosen.map((d) => <DishRow key={d.id} d={d} calories={calories} onMenu={() => setMenu(d.id)} />)}
        </LCard>
      ) : upcoming.length > 0 ? (
        <Group title="יציאות מתוכננות">
          {upcoming.slice(0, 3).map((e) => (
            <Tap key={e.id} onPress={() => router.setParams({ event: e.id })} label={`${e.title}, ${prettyDate(e.date)}`}>
              <LCard style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="calendar" size={20} color={light.accent} />
                <View style={{ flex: 1 }}><Text style={ls.bodyStrong}>{e.title}</Text><Text style={ls.muted}>{prettyDate(e.date)}{e.time ? ` · ${e.time}` : ''} · {restaurantLabel(e.restaurantType)}</Text></View>
                <Icon name="chevronBack" size={18} color={light.text2} />
              </LCard>
            </Tap>
          ))}
        </Group>
      ) : null}

      <Group title="סוג מסעדה">
        <Chips options={[{ key: '' as any, label: 'הכל' }, ...RESTAURANT_TYPES.map((r) => ({ key: r.key, label: r.label }))]} value={type ?? ''} onChange={(k: string) => setType((k || undefined) as RestaurantType | undefined)} />
      </Group>

      <Group title="חיפוש מנה">
        <LInput value={q} onChangeText={setQ} placeholder="למשל: המבורגר, פסטה שמנת, סושי סלמון" accessibilityLabel="חיפוש מנה" returnKeyType="search" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Tap onPress={pickMenuPhoto} label="צילום או העלאת תפריט" style={{ flex: 1 }}><View style={styles.ghost}><Icon name="camera" size={20} color={light.accentText} /><Text style={styles.ghostText}>צילום תפריט</Text></View></Tap>
          <Tap onPress={() => router.push({ pathname: '/dish', params: { event: event?.id ?? '', type: type ?? '', photoPick: '1' } })} label="העלאת תמונת מנה" style={{ flex: 1 }}><View style={styles.ghost}><Icon name="image" size={20} color={light.accentText} /><Text style={styles.ghostText}>תמונת מנה</Text></View></Tap>
        </View>
      </Group>

      {mine.length > 0 && (
        <Group title={favorites.length ? 'המנות שלי · מועדפות קודם' : 'המנות שלי'}>
          {[...favorites, ...mine.filter((d) => !d.favorite)].slice(0, 12).map((d) => <DishRow key={d.id} d={d} calories={calories} onMenu={() => setMenu(d.id)} />)}
        </Group>
      )}

      {dbResults.length > 0 && (
        <Group title="מהמאגר (הערכה)">
          <Note text="ערכים ממאגר צמרת של משרד הבריאות למנה דומה – הערכה בלבד, לא נתון רשמי של המסעדה. אלרגנים לא מוצגים כשאין מידע." />
          {dbResults.map((f) => (
            <Pressable key={f.id} onPress={() => fromDb(f.id)} accessibilityRole="button" accessibilityLabel={`בחירת ${f.name} כהערכה`} style={styles.res}>
              <Icon name="plus" size={18} color={light.accentText} />
              <View style={{ flex: 1 }}>
                <Text style={ls.body} numberOfLines={2}>{f.name}</Text>
                {calories && f.per100?.kcal != null && <Text style={ls.muted}>{f.per100.kcal} קק״ל ל-100 ג׳</Text>}
              </View>
            </Pressable>
          ))}
        </Group>
      )}

      <Group title="מסעדות מועדפות" action={<Tap onPress={() => setNewRest(true)} label="הוספת מסעדה"><Text style={styles.link}>+ הוספה</Text></Tap>}>
        {restaurants.length ? restaurants.map((r) => (
          <View key={r.id} style={styles.rest}>
            <Tap onPress={() => upsertRestaurant({ ...r, favorite: !r.favorite })} label={r.favorite ? `הסרת ${r.name} מהמועדפים` : `סימון ${r.name} כמועדפת`}><View style={styles.star}><Icon name={r.favorite ? 'starFill' : 'star'} size={20} color={light.accent} /></View></Tap>
            <View style={{ flex: 1 }}><Text style={ls.bodyStrong}>{r.name}</Text><Text style={ls.muted}>{restaurantLabel(r.type)} · {dishes.filter((d) => d.restaurantId === r.id).length} מנות</Text></View>
            <Tap onPress={() => router.push({ pathname: '/event', params: { type: 'restaurant' } })} label={`תכנון יציאה ל${r.name}`}><Text style={styles.link}>לתכנן</Text></Tap>
          </View>
        )) : <Text style={ls.muted}>שמור מסעדות שאתה אוהב כדי לתכנן מהר יותר.</Text>}
      </Group>

      <DishMenu id={menu} onClose={() => setMenu(null)} eventId={event?.id} onChoose={choose} onLog={(id) => {
        const d = dishes.find((x) => x.id === id)!;
        const e = logDish(id, event && event.date <= dateKey() ? event.date : dateKey(), event?.meal ?? defaultMeal(), event?.date === dateKey() ? event.time ?? nowTime() : undefined);
        haptic.success();
        if (e) toast(`${d.name} נוסף ליומן${d.estimated ? ' (הערכה)' : ''}`, { label: 'ליומן', onPress: () => router.push('/(tabs)/diary') });
      }} onFav={(id) => { const d = dishes.find((x) => x.id === id)!; upsertDish({ ...d, favorite: !d.favorite }); }}
        onDelete={(id) => { const d = removeDish(id); if (d) toast(`${d.name} נמחקה`, { label: 'ביטול', onPress: () => restoreDish(d) }); }} />

      <Sheet visible={newRest} onClose={() => setNewRest(false)} title="מסעדה חדשה">
        <Field label="שם המסעדה" value={restName} onChangeText={setRestName} />
        <Button title="שמירה" disabled={restName.trim().length < 2} onPress={() => { upsertRestaurant({ name: restName.trim(), type: type ?? 'cafe', favorite: true }); setRestName(''); setNewRest(false); toast('המסעדה נשמרה'); }} />
      </Sheet>
    </LightScreen>
  );
}

function DishRow({ d, calories, onMenu }: { d: RestaurantDish; calories: boolean; onMenu: () => void }) {
  const restaurant = useApp((s) => s.restaurants.find((r) => r.id === d.restaurantId));
  return (
    <Pressable onPress={onMenu} accessibilityRole="button" accessibilityLabel={`${d.name}${calories && d.nutrients.kcal != null ? `, ${d.nutrients.kcal} קלוריות` : ''}${d.estimated ? ', הערכה' : ', נתון רשמי'}. אפשרויות`} style={styles.dish}>
      {d.photoUri ? <Image source={{ uri: d.photoUri }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, styles.thumbPh]}><Icon name="food" size={20} color={light.accent} /></View>}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={ls.bodyStrong} numberOfLines={1}>{d.favorite ? '★ ' : ''}{d.name}</Text>
        <Text style={ls.muted} numberOfLines={1}>{[restaurant?.name ?? restaurantLabel(d.type), calories && d.nutrients.kcal != null ? `${d.nutrients.kcal} קק״ל` : null, d.allergens == null ? 'אלרגנים: לא ידוע' : d.allergens.length ? `אלרגנים: ${d.allergens.join(', ')}` : 'ללא אלרגנים מוצהרים'].filter(Boolean).join(' · ')}</Text>
      </View>
      <Badge text={d.estimated ? 'הערכה' : 'רשמי'} tone={d.estimated ? 'warn' : 'accent'} />
    </Pressable>
  );
}

function DishMenu({ id, onClose, eventId, onChoose, onLog, onFav, onDelete }: { id: string | null; onClose: () => void; eventId?: string; onChoose: (id: string) => void; onLog: (id: string) => void; onFav: (id: string) => void; onDelete: (id: string) => void }) {
  const d = useApp((s) => s.dishes.find((x) => x.id === id));
  if (!d) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const act = (fn: () => void) => () => { fn(); onClose(); };
  return (
    <Sheet visible onClose={onClose} title={d.name} scroll>
      {d.basis ? <Text style={styles.sheetText}>{d.basis}</Text> : null}
      {d.ingredients ? <Text style={styles.sheetText}>מרכיבים: {d.ingredients}</Text> : null}
      <Text style={styles.sheetText}>{d.allergens == null ? 'אלרגנים: אין מידע. כדאי לשאול במסעדה.' : d.allergens.length ? `אלרגנים (לפי מה שהוזן): ${d.allergens.join(', ')}` : 'לפי מה שהוזן – ללא אלרגנים מוצהרים. כדאי לוודא במסעדה.'}</Text>
      <View style={{ gap: 8, marginTop: 12 }}>
        <Button title="צירוף ליומן התזונה" icon="check" onPress={act(() => onLog(d.id))} />
        {eventId ? <Button title="בחירה ליציאה המתוכננת" icon="calendar" variant="soft" onPress={act(() => onChoose(d.id))} /> : null}
        <Button title={d.favorite ? 'הסרה מהמועדפות' : 'שמירה כמנה מועדפת'} icon="star" variant="soft" onPress={act(() => onFav(d.id))} />
        <Button title="עריכה" icon="edit" variant="ghost" onPress={act(() => router.push({ pathname: '/dish', params: { id: d.id } }))} />
        <Button title="מחיקה" icon="trash" variant="danger" onPress={act(() => onDelete(d.id))} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: fonts.semibold, fontSize: 15, color: light.accentText, padding: 8 },
  ghost: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.3)', backgroundColor: light.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ghostText: { fontFamily: fonts.semibold, fontSize: 14.5, color: light.text },
  res: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: light.card },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: radius.md, backgroundColor: light.card, minHeight: 60 },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  thumbPh: { backgroundColor: light.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: light.card, borderRadius: radius.md, paddingEnd: 12, minHeight: 56 },
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sheetText: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, marginBottom: 6 },
});
