import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, allFoods } from '@/store/useApp';
import { CATEGORY_ICON } from '@/data/foods';
import type { Food, FoodCategory } from '@/data/types';
import { searchOFF } from '@/lib/openFoodFacts';
import { FOOD_PHOTO } from '@/data/media';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { dateKey } from '@/lib/dates';
import { searchLocal, defaultMeal } from '@/lib/search';

type Cat = { key: string; label: string; icon: IconName; cats?: FoodCategory[]; section: string };
const CATS: Cat[] = [
  { key: 'all', label: 'הכל', icon: 'layers', section: 'מוצרים פופולריים' },
  { key: 'protein', label: 'חלבונים', icon: 'protein', cats: ['meat', 'eggs', 'dairy', 'protein'], section: 'חלבונים פופולריים' },
  { key: 'carbs', label: 'פחמימות', icon: 'wheat', cats: ['carbs', 'bread'], section: 'פחמימות' },
  { key: 'fats', label: 'שומנים', icon: 'drop', cats: ['fats'], section: 'שומנים ותוספות' },
  { key: 'produce', label: 'פירות', icon: 'sparkle', cats: ['produce'], section: 'פירות וירקות' },
  { key: 'meals', label: 'ארוחות', icon: 'bowl', cats: ['meals'], section: 'ארוחות ומשקאות' },
  { key: 'fav', label: 'מועדפים', icon: 'star', section: 'המועדפים שלי' },
  { key: 'recent', label: 'אחרונים', icon: 'clock', section: 'אחרונים' },
  { key: 'mine', label: 'שלי', icon: 'edit', cats: ['custom'], section: 'המוצרים שלי' },
];
// "popular" ordering for the default view: protein staples first (as in the approved mockup)
const POPULAR = ['f037', 'f026', 'f002', 'f019', 'f032', 'f013', 'f050', 'f073', 'f012', 'f085'];

/** 17 Product gallery + 18 search – approved light "הוסף מזון" screen */
export default function Foods() {
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const userFoods = useApp((s) => s.foods);
  const favorites = useApp((s) => s.favorites);
  const recent = useApp((s) => s.recentFoodIds);
  const upsertFood = useApp((s) => s.upsertFood);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [cat, setCat] = useState('all');
  const [remote, setRemote] = useState<Food[]>([]);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { setRemote([]); setRemoteState('idle'); }, [debounced]);

  const current = CATS.find((c) => c.key === cat)!;
  const foods = useMemo(() => {
    let list = allFoods(userFoods);
    if (cat === 'fav') list = list.filter((f) => favorites.includes(f.id));
    else if (cat === 'recent') list = recent.map((id) => list.find((f) => f.id === id)).filter((f): f is Food => !!f);
    else if (current.cats) list = list.filter((f) => current.cats!.includes(f.category));
    if (!debounced && (cat === 'all' || cat === 'protein')) {
      const rank = (f: Food) => { const i = POPULAR.indexOf(f.id); return i === -1 ? 999 : i; };
      list = [...list].sort((a, b) => rank(a) - rank(b));
    }
    return searchLocal(list, debounced);
  }, [userFoods, favorites, recent, cat, current, debounced]);

  const searchOnline = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setRemoteState('loading');
    try {
      setRemote(await searchOFF(debounced, 1, ctrl.signal));
      setRemoteState('done');
    } catch {
      if (!ctrl.signal.aborted) setRemoteState('error');
    }
  };

  const open = (f: Food) => {
    if (f.id.startsWith('off_')) upsertFood(f);
    router.push({ pathname: '/food/[id]', params: { id: f.id, meal: params.meal ?? '', date: params.date ?? '' } });
  };
  const quickAdd = (f: Food) => {
    const p = f.portions[0];
    if (!f.per100 || !p) return open(f);
    addFoodToLog(f, 1, p.label, params.meal || defaultMeal(), params.date || dateKey(), p.grams);
    haptic.success();
    toast(`${f.name} נוסף (${p.label})`, { label: 'ליומן', onPress: () => router.push('/diary') });
  };

  return (
    <LightScreen title="הוסף מזון" scroll={false}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Icon name="search" size={22} color={light.text2} />
          <TextInput value={q} onChangeText={setQ} placeholder="חפש מוצר, מותג או ברקוד" placeholderTextColor={light.text3} style={styles.searchInput} accessibilityLabel="חיפוש מוצר" returnKeyType="search" autoCorrect={false} />
          {q ? <Pressable onPress={() => setQ('')} accessibilityLabel="ניקוי" hitSlop={10}><Icon name="close" size={18} color={light.text2} /></Pressable> : null}
        </View>
        <Tap onPress={() => router.push('/barcode')} label="סריקת ברקוד">
          <View style={styles.scan}><Icon name="barcode" size={26} color={light.text} strokeWidth={1.9} /></View>
        </Tap>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: space.md }}>
          {CATS.map((c) => {
            const on = c.key === cat;
            return (
              <Tap key={c.key} onPress={() => setCat(c.key)} label={c.label} role="tab">
                <View style={[styles.cat, on && styles.catOn]}>
                  <Icon name={c.icon} size={26} color={on ? '#fff' : light.text} strokeWidth={1.8} />
                  <Text style={[styles.catText, on && { color: '#fff' }]}>{c.label}</Text>
                </View>
              </Tap>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={foods}
        numColumns={2}
        keyExtractor={(f) => f.id}
        initialNumToRender={10}
        windowSize={7}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={[ls.h2, { marginBottom: 4 }]}>{debounced ? `תוצאות עבור "${debounced}"` : current.section}</Text>}
        renderItem={({ item }) => <FoodCard f={item} onOpen={() => open(item)} onAdd={() => quickAdd(item)} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 6 }}>
            <Icon name={cat === 'fav' ? 'star' : 'search'} size={32} color={light.accent} />
            <Text style={ls.bodyStrong}>{cat === 'fav' ? 'אין עדיין מועדפים' : 'לא נמצא במאגר המקומי'}</Text>
            <Text style={[ls.muted, { textAlign: 'center' }]}>{cat === 'fav' ? 'סמן כוכב בעמוד מוצר כדי לשמור אותו כאן.' : 'אפשר לחפש במאגר הפתוח, לסרוק ברקוד או להוסיף ידנית.'}</Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ marginTop: space.lg, gap: 10 }}>
            {debounced.trim().length >= 2 && remoteState === 'idle' && <LinkButton icon="search" title={`חיפוש "${debounced}" ב-Open Food Facts`} onPress={searchOnline} />}
            {remoteState === 'loading' && <ActivityIndicator color={light.accent} />}
            {remoteState === 'error' && <Text style={[ls.muted, { textAlign: 'center' }]}>אין חיבור למאגר. בדוק את האינטרנט ונסה שוב.</Text>}
            {remoteState === 'done' && remote.length === 0 && <Text style={[ls.muted, { textAlign: 'center' }]}>לא נמצאו תוצאות במאגר הפתוח.</Text>}
            {remote.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {remote.map((f) => <View key={f.id} style={{ width: '47.5%' }}><FoodCard f={f} onOpen={() => open(f)} onAdd={() => open(f)} /></View>)}
              </View>
            )}
            {remoteState === 'done' && <Text style={[ls.caption, { textAlign: 'center' }]}>מקור: Open Food Facts (ODbL). יש לוודא ערכים מול התווית.</Text>}
            <LinkButton icon="edit" title="הוספת מוצר ידנית" onPress={() => router.push('/food-new')} />
            <Text style={[ls.caption, { textAlign: 'center' }]}>תמונות: Wikimedia Commons (רישיונות חופשיים) · ערכים כלליים מסומנים כ״לא מאומת״</Text>
          </View>
        }
      />
    </LightScreen>
  );
}

function LinkButton({ icon, title, onPress }: { icon: IconName; title: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={title}>
      <View style={styles.link}><Icon name={icon} size={18} color={light.accent} /><Text style={[ls.bodyStrong, { color: light.accent, fontSize: 15 }]}>{title}</Text></View>
    </Tap>
  );
}

function FoodCard({ f, onOpen, onAdd }: { f: Food; onOpen: () => void; onAdd: () => void }) {
  const photo = FOOD_PHOTO[f.id];
  const unit = f.basis === 'ml' ? 'מ״ל' : 'ג׳';
  const line = f.per100?.kcal != null ? `${f.per100.kcal} קל׳${f.per100.protein != null ? ` | ${f.per100.protein} ג׳ חלבון` : ''}` : 'דורש השלמה מהתווית';
  return (
    <View style={{ flex: 1 }}>
      <Tap onPress={onOpen} label={`${f.name}. ${line} ל-100 ${unit}`}>
        <View style={styles.card}>
          <View style={styles.imgWrap}>
            {photo ? <Image source={photo} style={styles.img} contentFit="cover" accessibilityLabel={f.name} />
              : f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={styles.img} contentFit="contain" accessibilityLabel={`אריזה: ${f.name}`} />
              : <View style={styles.ph}><Icon name={CATEGORY_ICON[f.category]} size={40} color={light.accent} /></View>}
          </View>
          <Text style={styles.name} numberOfLines={2}>{f.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{line}</Text>
        </View>
      </Tap>
      <View style={styles.addBtn}>
        <Tap onPress={onAdd} label={`הוסף ${f.name}`}>
          <View style={styles.add}><Icon name="plus" size={20} color={light.accent} strokeWidth={2.2} /></View>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 56, borderRadius: radius.pill, backgroundColor: light.cardSoft },
  searchInput: { flex: 1, color: light.text, fontFamily: fonts.regular, fontSize: 16, height: 52 },
  scan: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: light.cardSoft },
  cat: { width: 84, height: 88, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: light.card, borderWidth: 1, borderColor: light.border },
  catOn: { backgroundColor: light.accent, borderColor: light.accent },
  catText: { fontFamily: fonts.medium, fontSize: 14, color: light.text },
  card: { backgroundColor: light.card, borderRadius: radius.lg, padding: 10, paddingBottom: 14, gap: 4 },
  imgWrap: { height: 118, borderRadius: 16, overflow: 'hidden', backgroundColor: light.cardSoft, marginBottom: 6 },
  img: { width: '100%', height: '100%' },
  ph: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 16, color: light.text },
  sub: { fontFamily: fonts.regular, fontSize: 12.5, color: light.text2 },
  addBtn: { position: 'absolute', left: 10, bottom: 12 },
  add: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: light.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(242,107,29,0.35)' },
});
