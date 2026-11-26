import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, ls , LIconButton } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, allFoods } from '@/store/useApp';
import { CATEGORY_ICON } from '@/data/foods';
import type { Food, FoodCategory } from '@/data/types';
import { searchOFF } from '@/lib/openFoodFacts';
import { FOOD_PHOTO } from '@/data/media';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

import { searchLocal } from '@/lib/search';
import { frequentFoodIds, computeFoodEntry, totalsOf } from '@/lib/engine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Cat = { key: string; label: string; icon: IconName; cats?: FoodCategory[]; section: string };
const CATS: Cat[] = [
  { key: 'all', label: 'הכל', icon: 'layers', section: 'מוצרים פופולריים' },
  { key: 'protein', label: 'חלבונים', icon: 'protein', cats: ['meat', 'eggs', 'dairy', 'protein'], section: 'חלבונים פופולריים' },
  { key: 'carbs', label: 'פחמימות', icon: 'wheat', cats: ['carbs', 'bread'], section: 'פחמימות' },
  { key: 'fats', label: 'שומנים', icon: 'drop', cats: ['fats'], section: 'שומנים ותוספות' },
  { key: 'produce', label: 'פירות', icon: 'sparkle', cats: ['produce'], section: 'פירות וירקות' },
  { key: 'snacks', label: 'חטיפים', icon: 'star', cats: ['snacks'], section: 'חטיפים' },
  { key: 'drinks', label: 'משקאות', icon: 'drop', cats: ['drinks'], section: 'משקאות' },
  { key: 'meals', label: 'מנות', icon: 'bowl', cats: ['meals'], section: 'מנות ואוכל מוכן' },
  { key: 'fav', label: 'מועדפים', icon: 'star', section: 'המועדפים שלי' },
  { key: 'frequent', label: 'תכופים', icon: 'repeat', section: 'נצרכים בתדירות גבוהה' },
  { key: 'recent', label: 'אחרונים', icon: 'clock', section: 'אחרונים' },
  { key: 'mine', label: 'שלי', icon: 'edit', cats: ['custom'], section: 'המוצרים שלי' },
];
// "popular" ordering for the default view: protein staples first (as in the approved mockup)
const POPULAR = ['f037', 'f026', 'f002', 'f019', 'f032', 'f013', 'f050', 'f073', 'f012', 'f085'];

/** 17 Product gallery + 18 search – approved light "הוסף מזון" screen */
export default function Foods() {
  const params = useLocalSearchParams<{ meal?: string; date?: string; focus?: string }>();
  const insets = useSafeAreaInsets();
  const entries = useApp((s) => s.entries);
  const basket = useApp((s) => s.basket);
  const basketAdd = useApp((s) => s.basketAdd);
  const history = useApp((s) => s.searchHistory);
  const addSearch = useApp((s) => s.addSearch);
  const clearHistory = useApp((s) => s.clearSearchHistory);
  const [view, setView] = useState<'grid' | 'list'>('grid');
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
    else if (cat === 'frequent') list = frequentFoodIds(entries, 30).map((id) => list.find((f) => f.id === id)).filter((f): f is Food => !!f);
    else if (current.cats) list = list.filter((f) => current.cats!.includes(f.category));
    if (!debounced && (cat === 'all' || cat === 'protein')) {
      const rank = (f: Food) => { const i = POPULAR.indexOf(f.id); return i === -1 ? 999 : i; };
      list = [...list].sort((a, b) => rank(a) - rank(b));
    }
    return searchLocal(list, debounced);
  }, [userFoods, favorites, recent, cat, current, debounced, entries]);

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
    if (debounced.trim().length >= 2) addSearch(debounced);
    if (f.id.startsWith('off_')) upsertFood(f);
    router.push({ pathname: '/food/[id]', params: { id: f.id, meal: params.meal ?? '', date: params.date ?? '' } });
  };
  /** "+" = add the default portion to the meal basket, so several products can be picked in a row. */
  const quickAdd = (f: Food) => {
    const p = f.portions[0];
    if (!f.per100) return open(f);
    if (debounced.trim().length >= 2) addSearch(debounced);
    const unit = p ? { label: p.label, grams: p.grams } : { label: f.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: null };
    const amount = p ? 1 : 100;
    const c = computeFoodEntry(f, amount, unit);
    basketAdd({ foodId: f.id, name: f.name, brand: f.brand, amount, unitLabel: unit.label, unitGrams: unit.grams, grams: c.grams, nutrients: c.nutrients, imageUrl: f.imageUrl });
    haptic.success();
    toast(`${f.name} נוסף לסל (${unit.label})`, { label: 'לסל', onPress: () => router.push('/basket') });
  };
  const bt = totalsOf(basket);
  const showHistory = !q && history.length > 0 && cat === 'all';

  return (
    <LightScreen title="הוסף מזון" scroll={false} right={<LIconButton icon={view === 'grid' ? 'list' : 'layers'} label={view === 'grid' ? 'תצוגת רשימה' : 'תצוגת גלריה'} onPress={() => setView(view === 'grid' ? 'list' : 'grid')} />}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Icon name="search" size={22} color={light.text2} />
          <TextInput value={q} onChangeText={setQ} placeholder="חפש מוצר, מותג או ברקוד" placeholderTextColor={light.text3} style={styles.searchInput} accessibilityLabel="חיפוש מוצר" returnKeyType="search" autoCorrect={false} autoFocus={params.focus === '1'} onSubmitEditing={() => addSearch(q)} />
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

      {showHistory && (
        <View style={styles.historyRow}>
          <Icon name="clock" size={16} color={light.text2} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {history.map((h) => (
              <Pressable key={h} onPress={() => setQ(h)} accessibilityRole="button" accessibilityLabel={`חיפוש קודם: ${h}`} style={styles.histChip}><Text style={styles.histText}>{h}</Text></Pressable>
            ))}
            <Pressable onPress={clearHistory} accessibilityRole="button" accessibilityLabel="ניקוי היסטוריית חיפוש" style={styles.histChip}><Text style={[styles.histText, { color: light.text3 }]}>ניקוי</Text></Pressable>
          </ScrollView>
        </View>
      )}

      <FlatList
        key={view}
        data={foods}
        numColumns={view === 'grid' ? 2 : 1}
        keyExtractor={(f) => f.id}
        initialNumToRender={10}
        windowSize={7}
        columnWrapperStyle={view === 'grid' ? { gap: 12 } : undefined}
        contentContainerStyle={{ gap: view === 'grid' ? 12 : 8, paddingBottom: 140 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={[ls.h2, { marginBottom: 4 }]}>{debounced ? `תוצאות עבור "${debounced}"` : current.section}</Text>}
        renderItem={({ item }) => (view === 'grid' ? <FoodCard f={item} onOpen={() => open(item)} onAdd={() => quickAdd(item)} /> : <FoodRow f={item} onOpen={() => open(item)} onAdd={() => quickAdd(item)} />)}
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
      {basket.length > 0 && (
        <View style={[styles.basketWrap, { bottom: insets.bottom + 14 }]} pointerEvents="box-none">
          <Tap onPress={() => router.push('/basket')} label={`סל הארוחה: ${basket.length} פריטים, ${bt.kcal} קלוריות. לסיכום ושמירה`}>
            <View style={styles.basketBar}>
              <View style={styles.basketCount}><Text style={styles.basketCountText}>{basket.length}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.basketTitle}>סל הארוחה</Text>
                <Text style={styles.basketSub}>{bt.kcal}{bt.partial.kcal ? '*' : ''} קק״ל · חלבון {Math.round(bt.protein)} ג׳</Text>
              </View>
              <Text style={styles.basketCta}>לסיכום</Text>
              <Icon name="chevron" size={20} color="#fff" />
            </View>
          </Tap>
        </View>
      )}
    </LightScreen>
  );
}

function FoodRow({ f, onOpen, onAdd }: { f: Food; onOpen: () => void; onAdd: () => void }) {
  const photo = FOOD_PHOTO[f.id];
  const portion = f.portions[0];
  return (
    <View style={styles.row}>
      <Tap onPress={onOpen} label={f.name} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {photo ? <Image source={photo} style={styles.rowImg} contentFit="cover" /> : f.imageUrl ? <Image source={{ uri: f.imageUrl }} style={[styles.rowImg, { backgroundColor: '#fff' }]} contentFit="contain" cachePolicy="disk" /> : <View style={[styles.rowImg, styles.ph]}><Icon name={CATEGORY_ICON[f.category]} size={24} color={light.accent} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{f.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{[f.brand, portion ? portionText(portion, f.basis === 'ml' ? 'מ״ל' : 'ג׳') : null].filter(Boolean).join(' · ') || ' '}</Text>
            <Text style={styles.sub} numberOfLines={1}>{f.per100?.kcal != null ? `${f.per100.kcal} קל׳ · ${f.per100.protein ?? '—'} ג׳ חלבון ל-100` : 'חסרים ערכים'}{!f.verified && f.per100 ? ' · לא מאומת' : ''}</Text>
          </View>
        </View>
      </Tap>
      <Tap onPress={onAdd} label={`הוספת ${f.name} לסל`}><View style={styles.add}><Icon name="plus" size={20} color={light.accent} strokeWidth={2.2} /></View></Tap>
    </View>
  );
}

/** "גביע (250 ג׳)" already carries its weight – don't repeat it. */
const portionText = (p: { label: string; grams: number }, unit: string) => (/\d/.test(p.label) ? p.label : `${p.label} · ${p.grams} ${unit}`);

function LinkButton({ icon, title, onPress }: { icon: IconName; title: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={title}>
      <View style={styles.link}><Icon name={icon} size={18} color={light.accent} /><Text style={[ls.bodyStrong, { color: light.accentText, fontSize: 15 }]}>{title}</Text></View>
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
          {(f.brand || f.portions[0]) ? <Text style={styles.sub} numberOfLines={1}>{[f.brand, f.portions[0] ? portionText(f.portions[0], unit) : null].filter(Boolean).join(' · ')}</Text> : null}
          <Text style={styles.sub} numberOfLines={1}>{line}{!f.verified && f.per100 ? ' · לא מאומת' : ''}</Text>
        </View>
      </Tap>
      <View style={styles.addBtn}>
        <Tap onPress={onAdd} label={`הוספת ${f.name} לסל`}>
          <View style={styles.add}><Icon name="plus" size={20} color={light.accent} strokeWidth={2.2} /></View>
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 56, borderRadius: radius.pill, backgroundColor: light.cardSoft, borderWidth: 1.5, borderColor: 'transparent' },
  searchInput: { flex: 1, color: light.text, fontFamily: fonts.regular, fontSize: 16, height: 52, outlineStyle: 'none' } as any,
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
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  histChip: { minHeight: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, justifyContent: 'center' },
  histText: { fontFamily: fonts.medium, fontSize: 13, color: light.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.lg, backgroundColor: light.card },
  rowImg: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden' },
  basketWrap: { position: 'absolute', left: space.md, right: space.md },
  basketBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 64, borderRadius: 22, backgroundColor: '#140C08', borderWidth: 1, borderColor: 'rgba(255,170,110,0.35)' },
  basketCount: { width: 34, height: 34, borderRadius: 17, backgroundColor: light.accent, alignItems: 'center', justifyContent: 'center' },
  basketCountText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  basketTitle: { fontFamily: fonts.semibold, fontSize: 15, color: '#fff' },
  basketSub: { fontFamily: fonts.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  basketCta: { fontFamily: fonts.semibold, fontSize: 15, color: '#F2A05C' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(242,107,29,0.35)' },
});
