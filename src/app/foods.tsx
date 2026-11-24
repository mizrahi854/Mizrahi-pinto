import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Screen, Chip, IconButton, T, Tap, Row, Badge, Empty, Button, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp, allFoods } from '@/store/useApp';
import { CATEGORY_LABELS, CATEGORY_ICON } from '@/data/foods';
import type { Food, FoodCategory } from '@/data/types';
import { searchOFF } from '@/lib/openFoodFacts';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { dateKey } from '@/lib/dates';
import { searchLocal, defaultMeal } from '@/lib/search';

const CATS: (FoodCategory | 'all' | 'fav' | 'recent')[] = ['all', 'fav', 'recent', 'dairy', 'protein', 'meat', 'eggs', 'carbs', 'bread', 'produce', 'fats', 'meals', 'custom'];
const CAT_LABEL = (c: (typeof CATS)[number]) => (c === 'all' ? 'הכל' : c === 'fav' ? 'מועדפים' : c === 'recent' ? 'אחרונים' : CATEGORY_LABELS[c]);

/** 17 Product gallery + 18 search */
export default function Foods() {
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const userFoods = useApp((s) => s.foods);
  const favorites = useApp((s) => s.favorites);
  const recent = useApp((s) => s.recentFoodIds);
  const upsertFood = useApp((s) => s.upsertFood);
  const addFoodToLog = useApp((s) => s.addFoodToLog);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [cat, setCat] = useState<(typeof CATS)[number]>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [remote, setRemote] = useState<Food[]>([]);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const foods = useMemo(() => {
    let list = allFoods(userFoods);
    if (cat === 'fav') list = list.filter((f) => favorites.includes(f.id));
    else if (cat === 'recent') list = recent.map((id) => list.find((f) => f.id === id)).filter((f): f is Food => !!f);
    else if (cat !== 'all') list = list.filter((f) => f.category === cat);
    return searchLocal(list, debounced);
  }, [userFoods, favorites, recent, cat, debounced]);

  const searchOnline = async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setRemoteState('loading');
    try {
      const r = await searchOFF(debounced, 1, ctrl.signal);
      setRemote(r);
      setRemoteState('done');
    } catch {
      if (!ctrl.signal.aborted) setRemoteState('error');
    }
  };
  useEffect(() => { setRemote([]); setRemoteState('idle'); }, [debounced]);

  const open = (f: Food) => {
    if (f.id.startsWith('off_')) upsertFood(f);
    router.push({ pathname: '/food/[id]', params: { id: f.id, meal: params.meal ?? '', date: params.date ?? '' } });
  };
  const quickAdd = (f: Food) => {
    const p = f.portions[0];
    if (!f.per100 || !p) return open(f);
    addFoodToLog(f, 1, p.label, params.meal || defaultMeal(), params.date || dateKey(), p.grams);
    haptic.success();
    toast(`${f.name} נוסף`, { label: 'ליומן', onPress: () => router.push('/diary') });
  };

  return (
    <Screen title="הוסף ארוחה" scroll={false} right={<IconButton icon={view === 'grid' ? 'list' : 'layers'} label={view === 'grid' ? 'תצוגת רשימה' : 'תצוגת גלריה'} onPress={() => setView(view === 'grid' ? 'list' : 'grid')} size={40} />}>
      <View style={styles.search}>
        <Icon name="search" size={20} color={colors.text2} />
        <TextInput value={q} onChangeText={setQ} placeholder="חפש מוצר, מותג או ברקוד" placeholderTextColor={colors.text3} style={styles.searchInput} accessibilityLabel="חיפוש מוצר" returnKeyType="search" autoCorrect={false} />
        {q ? <IconButton icon="close" label="נקה חיפוש" size={32} onPress={() => setQ('')} /> : <IconButton icon="barcode" label="סריקת ברקוד" size={36} onPress={() => router.push('/barcode')} />}
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: space.sm }}>
          {CATS.map((c) => <Chip key={c} label={CAT_LABEL(c)} active={cat === c} onPress={() => setCat(c)} />)}
        </ScrollView>
      </View>
      <FlatList
        key={view}
        data={foods}
        numColumns={view === 'grid' ? 2 : 1}
        keyExtractor={(f) => f.id}
        initialNumToRender={12}
        windowSize={7}
        columnWrapperStyle={view === 'grid' ? { gap: 10 } : undefined}
        contentContainerStyle={{ gap: 10, paddingBottom: 140, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (view === 'grid' ? <FoodCard f={item} onOpen={() => open(item)} onAdd={() => quickAdd(item)} /> : <FoodRow f={item} onOpen={() => open(item)} onAdd={() => quickAdd(item)} />)}
        ListEmptyComponent={
          cat === 'fav' ? <Empty icon="star" title="אין עדיין מועדפים" text="סמן כוכב בעמוד מוצר כדי לשמור אותו כאן." /> : <Empty icon="search" title="לא נמצא במאגר המקומי" text="אפשר לחפש במאגר הפתוח, לסרוק ברקוד או להוסיף מוצר ידנית." />
        }
        ListFooterComponent={
          debounced.trim().length >= 2 ? (
            <View style={{ marginTop: space.lg, gap: 10 }}>
              {remoteState === 'idle' && <Button title={`חיפוש "${debounced}" ב-Open Food Facts`} variant="soft" icon="search" onPress={searchOnline} />}
              {remoteState === 'loading' && <ActivityIndicator color={colors.accent} />}
              {remoteState === 'error' && <Empty icon="close" title="אין חיבור למאגר" text="בדוק את האינטרנט ונסה שוב." action="נסה שוב" onAction={searchOnline} />}
              {remoteState === 'done' && remote.length === 0 && <T.Muted style={{ textAlign: 'center' }}>לא נמצאו תוצאות במאגר הפתוח.</T.Muted>}
              {remote.map((f) => <FoodRow key={f.id} f={f} onOpen={() => open(f)} onAdd={() => open(f)} />)}
              {remoteState === 'done' && <T.Caption style={{ textAlign: 'center' }}>מקור: Open Food Facts (ODbL). יש לוודא ערכים מול התווית.</T.Caption>}
              <Button title="הוספת מוצר ידנית" variant="ghost" icon="edit" onPress={() => router.push('/food-new')} />
            </View>
          ) : (
            <Button title="מוצר חדש ידני" variant="ghost" icon="edit" onPress={() => router.push('/food-new')} style={{ marginTop: space.lg }} />
          )
        }
      />
    </Screen>
  );
}

function Thumb({ f, size }: { f: Food; size: number }) {
  return f.imageUrl ? (
    <Image source={{ uri: f.imageUrl }} style={{ width: size, height: size, borderRadius: size / 3 }} contentFit="contain" accessibilityLabel={`תמונת אריזה: ${f.name}`} />
  ) : (
    <View style={[styles.thumb, { width: size, height: size, borderRadius: size / 3 }]}><Icon name={CATEGORY_ICON[f.category]} size={size * 0.45} /></View>
  );
}

function FoodCard({ f, onOpen, onAdd }: { f: Food; onOpen: () => void; onAdd: () => void }) {
  const unit = f.basis === 'ml' ? 'מ״ל' : 'ג׳';
  return (
    <View style={{ flex: 1 }}>
      <Tap onPress={onOpen} label={`${f.name}${f.per100?.kcal != null ? `, ${f.per100.kcal} קלוריות ל-100 ${unit}` : ''}`}>
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}><Thumb f={f} size={64} /></View>
          <Text style={styles.name} numberOfLines={2}>{f.name}</Text>
          <Text style={styles.sub} numberOfLines={1}>{f.per100?.kcal != null ? `⁦${f.per100.kcal} קל׳ / 100 ${unit}⁩` : 'דורש השלמה מהתווית'}</Text>
          {f.brand ? <Text style={styles.sub} numberOfLines={1}>{f.brand}</Text> : null}
        </View>
      </Tap>
      <View style={styles.addBtn}><IconButton icon="plus" label={`הוסף ${f.name}`} onPress={onAdd} size={40} active /></View>
    </View>
  );
}

function FoodRow({ f, onOpen, onAdd }: { f: Food; onOpen: () => void; onAdd: () => void }) {
  const unit = f.basis === 'ml' ? 'מ״ל' : 'ג׳';
  return (
    <View style={styles.row}>
      <Tap style={{ flex: 1 }} onPress={onOpen} label={f.name}>
        <Row>
          <Thumb f={f} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[type.bodyMedium, { color: colors.text }]} numberOfLines={1}>{f.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{f.brand ? `${f.brand} · ` : ''}{f.per100?.kcal != null ? `${f.per100.kcal} קל׳ / 100 ${unit}` : 'חסרים ערכים'}</Text>
          </View>
          {!f.per100 && <Badge text="להשלמה" tone="muted" />}
        </Row>
      </Tap>
      <IconButton icon="plus" label={`הוסף ${f.name}`} onPress={onAdd} size={38} active />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingStart: 14, paddingEnd: 6, minHeight: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, minHeight: 48 },
  card: { padding: 14, paddingBottom: 18, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, minHeight: 170 },
  name: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text },
  sub: { ...type.caption, color: colors.text2, marginTop: 2 },
  addBtn: { position: 'absolute', bottom: 10, left: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border },
  thumb: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border },
});
