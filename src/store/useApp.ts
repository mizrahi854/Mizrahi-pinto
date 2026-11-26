import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BasketItem, Challenge, Food, FoodEntry, MealKey, Profile, Reminder, SavedMeal, TargetHistory,
  PlannedWorkout, WorkoutTemplate, PlanEvent, PlannedMeal, ShabbatPlan, Restaurant, RestaurantDish, MealItem,
} from '@/data/types';
import { STARTER_FOODS } from '@/data/foods';
import { IL_PRODUCTS } from '@/data/ilProducts';
import { TZAMERET_FOODS } from '@/data/tzameret';
import { dateKey, nowTime, uid, weekOf, addDays } from '@/lib/dates';
import { defaultProfile, defaultSettings, defaultShabbat, SHABBAT_MEALS, migrateState, type AppSettings } from './defaults';
export { defaultProfile, defaultSettings, defaultShabbat, SHABBAT_MEALS, tracksCalories, migrateState, type AppSettings } from './defaults';
import { fromTemplate, copyWeek } from '@/lib/workouts';
import { nutrientsFor, sumNutrients } from '@/lib/nutrition';

export const DEFAULT_MEALS: { key: MealKey; label: string; icon: 'bowl' | 'food' | 'moon' | 'star' }[] = [
  { key: 'breakfast', label: 'ארוחת בוקר', icon: 'bowl' },
  { key: 'lunch', label: 'ארוחת צהריים', icon: 'food' },
  { key: 'dinner', label: 'ארוחת ערב', icon: 'moon' },
  { key: 'snack', label: 'ארוחות ביניים', icon: 'star' },
];

/** One measurement day (any field optional). */
export type Measurement = { date: string; weightKg?: number; waistCm?: number; heightCm?: number; note?: string };

export type Session = { mode: 'supabase' | 'local'; userId: string; email?: string; emailConfirmed?: boolean } | null;

type State = {
  hydrated: boolean;
  session: Session;
  onboarded: boolean;
  onboardingDraft: Partial<Profile> & { step?: number };
  profile: Profile;
  targetHistory: TargetHistory;
  customMeals: { key: MealKey; label: string }[];
  foods: Food[]; // private / user-added foods + cached barcode lookups
  entries: FoodEntry[];
  favorites: string[];
  recentFoodIds: string[];
  basket: BasketItem[];
  searchHistory: string[];
  savedMeals: SavedMeal[];
  plannedMeals: PlannedMeal[];
  events: PlanEvent[];
  shabbat: ShabbatPlan;
  restaurants: Restaurant[];
  dishes: RestaurantDish[];
  drafts: Record<string, unknown>;
  /** where "add food" flows should log to (set by the add-meal panel / diary); expires after 30 min */
  logCtx: { date: string; meal: MealKey; at: number } | null;
  mealMeta: Record<string, { photo?: string; title?: string }>; // `${date}|${meal}` → photo / custom name
  setLogCtx: (date: string, meal: MealKey) => void;
  setMealMeta: (date: string, meal: MealKey, patch: { photo?: string; title?: string }) => void;
  removeMeal: (date: string, meal: MealKey) => FoodEntry[];
  restoreEntries: (list: FoodEntry[]) => void;
  shopping: { id: string; name: string; qty: string; checked: boolean; recipeId?: string }[];
  water: Record<string, number>;
  sleep: Record<string, number>;
  measurements: Measurement[];
  workouts: PlannedWorkout[];
  template: WorkoutTemplate[];
  templateAuto: boolean;
  filledWeeks: string[];
  reminders: Reminder[];
  challenges: Challenge[];
  reports: { foodId?: string; text: string; at: number }[];
  notificationsSeen: number;
  settings: AppSettings;
  updateSettings: (p: Partial<AppSettings>) => void;

  // actions
  setHydrated: () => void;
  setSession: (s: Session) => void;
  saveDraft: (d: Partial<State['onboardingDraft']>) => void;
  completeOnboarding: (p: Profile, template?: WorkoutTemplate[]) => void;
  updateProfile: (p: Partial<Profile>) => void;
  setTargets: (t: Pick<Profile, 'targetMode' | 'calorieTarget' | 'proteinTarget' | 'carbsTarget' | 'fatTarget'>) => void;
  addCustomMeal: (label: string) => void;
  basketAdd: (i: Omit<BasketItem, 'key'>) => void;
  basketUpdate: (key: string, patch: Partial<BasketItem>) => void;
  basketRemove: (key: string) => void;
  basketClear: () => void;
  logBasket: (o: { meal: MealKey; date: string; asOne?: string; time?: string }) => number;
  saveBasketAsMeal: (name: string) => string;
  updateSavedMeal: (id: string, patch: Partial<SavedMeal>) => void;
  basketFromSavedMeal: (id: string) => void;
  copyMeal: (fromDate: string, meal: MealKey, toDate: string, toMeal?: MealKey) => number;
  addSearch: (q: string) => void;
  clearSearchHistory: () => void;

  addEntry: (e: Omit<FoodEntry, 'id' | 'createdAt' | 'time'> & { time?: string }) => FoodEntry;
  addFoodToLog: (food: Food, amount: number, unitLabel: string, meal: MealKey, date?: string, grams?: number) => FoodEntry;
  updateEntry: (id: string, patch: Partial<FoodEntry>) => void;
  removeEntry: (id: string) => FoodEntry | undefined;
  restoreEntry: (e: FoodEntry) => void;
  duplicateEntries: (ids: string[], toDate: string, toMeal?: MealKey) => void;
  toggleFavorite: (foodId: string) => void;
  upsertFood: (f: Food) => void;
  saveMeal: (name: string, entryIds: string[]) => void;
  deleteSavedMeal: (id: string) => void;
  logSavedMeal: (id: string, meal: MealKey, date: string) => void;
  reportFood: (foodId: string | undefined, text: string) => void;

  upsertPlannedMeal: (m: Omit<PlannedMeal, 'id'> & { id?: string }) => string;
  removePlannedMeal: (id: string) => PlannedMeal | undefined;
  restorePlannedMeal: (m: PlannedMeal) => void;
  eatPlannedMeal: (id: string) => number;
  upsertEvent: (e: Omit<PlanEvent, 'id'> & { id?: string }) => string;
  removeEvent: (id: string) => PlanEvent | undefined;
  restoreEvent: (e: PlanEvent) => void;
  updateShabbat: (p: Partial<ShabbatPlan>) => void;
  applyShabbat: (weekStart: string) => number;
  upsertRestaurant: (r: Omit<Restaurant, 'id'> & { id?: string }) => string;
  removeRestaurant: (id: string) => void;
  upsertDish: (d: Omit<RestaurantDish, 'id' | 'createdAt'> & { id?: string }) => string;
  removeDish: (id: string) => RestaurantDish | undefined;
  restoreDish: (d: RestaurantDish) => void;
  logDish: (id: string, date: string, meal: MealKey, time?: string) => FoodEntry | undefined;
  setDraft: (key: string, value: unknown) => void;
  clearDraft: (key: string) => void;
  addShopping: (items: { name: string; qty: string; recipeId?: string }[]) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearChecked: () => void;

  addWater: (ml: number, date?: string) => void;
  setSleep: (h: number, date?: string) => void;
  addMeasurement: (kg: number, date?: string) => void;
  upsertMeasurement: (m: Measurement) => void;
  removeMeasurement: (date: string) => Measurement | undefined;

  upsertWorkout: (w: Omit<PlannedWorkout, 'id' | 'status'> & { id?: string; status?: PlannedWorkout['status'] }) => string;
  removeWorkout: (id: string) => PlannedWorkout | undefined;
  restoreWorkout: (w: PlannedWorkout) => void;
  duplicateWorkout: (id: string, toDate: string) => string | undefined;
  moveWorkout: (id: string, date: string, time?: string | null) => void;
  completeWorkout: (id: string) => void;
  skipWorkout: (id: string) => void;
  reopenWorkout: (id: string) => void;
  setTemplate: (t: WorkoutTemplate[], auto?: boolean) => void;
  /** replace the recurring template and refill upcoming weeks (keeps done/edited workouts) */
  applyTemplate: (t: WorkoutTemplate[]) => void;
  saveWeekAsTemplate: (weekStart: string) => void;
  copyWeekToNext: (weekStart: string) => number;
  ensureWeeks: () => void;

  upsertReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;

  upsertChallenge: (c: Challenge) => void;
  deleteChallenge: (id: string) => void;
  toggleChallengeTask: (cid: string, date: string, taskId: string) => void;
  toggleRestDay: (cid: string, date: string) => void;

  markNotificationsSeen: () => void;
  resetAll: () => void;
};

const initialData = {
  session: null as Session,
  onboarded: false,
  onboardingDraft: {},
  profile: defaultProfile,
  targetHistory: [] as TargetHistory,
  customMeals: [],
  foods: [] as Food[],
  entries: [] as FoodEntry[],
  favorites: [] as string[],
  recentFoodIds: [] as string[],
  basket: [] as BasketItem[],
  searchHistory: [] as string[],
  savedMeals: [] as SavedMeal[],
  plannedMeals: [] as PlannedMeal[],
  events: [] as PlanEvent[],
  shabbat: defaultShabbat,
  restaurants: [] as Restaurant[],
  dishes: [] as RestaurantDish[],
  drafts: {} as Record<string, unknown>,
  logCtx: null as State['logCtx'],
  mealMeta: {} as State['mealMeta'],
  shopping: [],
  water: {},
  sleep: {},
  measurements: [],
  workouts: [] as PlannedWorkout[],
  template: [] as WorkoutTemplate[],
  templateAuto: true,
  filledWeeks: [] as string[],
  reminders: [] as Reminder[],
  challenges: [] as Challenge[],
  reports: [],
  notificationsSeen: 0,
  settings: defaultSettings,
};

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initialData,

      setHydrated: () => set({ hydrated: true }),
      setSession: (session) => set({ session }),
      saveDraft: (d) => set((s) => ({ onboardingDraft: { ...s.onboardingDraft, ...d } })),
      completeOnboarding: (p, template) => {
        set((s) => ({
          profile: { ...p, targetsSince: dateKey() },
          onboarded: true,
          onboardingDraft: {},
          targetHistory: [{ from: dateKey(), calorieTarget: p.calorieTarget, proteinTarget: p.proteinTarget, carbsTarget: p.carbsTarget, fatTarget: p.fatTarget }],
        }));
        if (template) get().applyTemplate(template);
        else get().ensureWeeks();
      },
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      // Target changes apply from today onwards; history kept for past days.
      setTargets: (t) =>
        set((s) => {
          const from = dateKey();
          const hist = s.targetHistory.filter((h) => h.from !== from);
          hist.push({ from, calorieTarget: t.calorieTarget, proteinTarget: t.proteinTarget, carbsTarget: t.carbsTarget, fatTarget: t.fatTarget });
          hist.sort((a, b) => a.from.localeCompare(b.from));
          return { profile: { ...s.profile, ...t, targetsSince: from }, targetHistory: hist };
        }),
      addCustomMeal: (label) => set((s) => ({ customMeals: [...s.customMeals, { key: `m_${uid()}`, label }] })),

      addEntry: (e) => {
        // double-tap guard: an identical entry saved within 1.2s is ignored
        const dup = get().entries.find((x) => Date.now() - x.createdAt < 1200 && x.name === e.name && x.date === e.date && x.meal === e.meal && x.amount === e.amount && x.nutrients.kcal === e.nutrients.kcal);
        if (dup) return dup;
        const entry: FoodEntry = { ...e, id: uid(), createdAt: Date.now(), time: e.time ?? nowTime() };
        set((s) => ({ entries: [...s.entries, entry], recentFoodIds: e.foodId ? [e.foodId, ...s.recentFoodIds.filter((x) => x !== e.foodId)].slice(0, 20) : s.recentFoodIds }));
        return entry;
      },
      basketAdd: (i) => set((s) => ({ basket: [...s.basket, { ...i, key: uid() }] })),
      basketUpdate: (key, patch) => set((s) => ({ basket: s.basket.map((b) => (b.key === key ? { ...b, ...patch } : b)) })),
      basketRemove: (key) => set((s) => ({ basket: s.basket.filter((b) => b.key !== key) })),
      basketClear: () => set({ basket: [] }),
      logBasket: ({ meal, date, asOne, time }) => {
        const items = get().basket;
        if (!items.length) return 0;
        const now = Date.now();
        const t = time ?? nowTime();
        let add: FoodEntry[];
        if (asOne) {
          const tot = sumNutrients(items.map((i) => i.nutrients));
          add = [{
            id: uid(), createdAt: now, time: t, date, meal, name: asOne, amount: 1, unitLabel: 'ארוחה',
            grams: items.every((i) => i.grams != null) ? Math.round(items.reduce((m, i) => m + (i.grams ?? 0), 0)) : null,
            nutrients: { kcal: tot.partial.kcal ? null : tot.kcal, protein: tot.partial.protein ? null : tot.protein, carbs: tot.partial.carbs ? null : tot.carbs, fat: tot.partial.fat ? null : tot.fat, fiber: tot.partial.fiber ? null : tot.fiber },
            items: items.map(({ foodId, name, amount, unitLabel, grams, nutrients }) => ({ foodId, name, amount, unitLabel, grams, nutrients })),
          }];
        } else {
          add = items.map((i) => ({ id: uid(), createdAt: now, time: t, date, meal, foodId: i.foodId, name: i.name, amount: i.amount, unitLabel: i.unitLabel, grams: i.grams, nutrients: i.nutrients, photoUri: i.imageUrl }));
        }
        const ids = items.map((i) => i.foodId).filter((x): x is string => !!x);
        set((s) => ({ entries: [...s.entries, ...add], basket: [], recentFoodIds: [...ids, ...s.recentFoodIds.filter((x) => !ids.includes(x))].slice(0, 20) }));
        return items.length;
      },
      saveBasketAsMeal: (name) => {
        const id = uid();
        set((s) => ({ savedMeals: [...s.savedMeals, { id, name, items: s.basket.map(({ foodId, name: n, amount, unitLabel, grams, nutrients, imageUrl }) => ({ foodId, name: n, amount, unitLabel, grams, nutrients, photoUri: imageUrl })) }] }));
        return id;
      },
      updateSavedMeal: (id, patch) => set((s) => ({ savedMeals: s.savedMeals.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      basketFromSavedMeal: (id) => {
        const m = get().savedMeals.find((x) => x.id === id);
        if (!m) return;
        set((s) => ({ basket: [...s.basket, ...m.items.map((i) => ({ key: uid(), foodId: i.foodId, name: i.name, amount: i.amount, unitLabel: i.unitLabel, unitGrams: i.grams != null && i.amount ? i.grams / i.amount : null, grams: i.grams, nutrients: i.nutrients, imageUrl: i.photoUri }))] }));
      },
      copyMeal: (fromDate, meal, toDate, toMeal) => {
        const src = get().entries.filter((e) => e.date === fromDate && e.meal === meal);
        const now = Date.now();
        set((s) => ({ entries: [...s.entries, ...src.map((e, i) => ({ ...e, id: uid(), date: toDate, meal: toMeal ?? meal, createdAt: now + i }))] }));
        return src.length;
      },
      addSearch: (q) => {
        const t = q.trim();
        if (t.length < 2) return;
        set((s) => ({ searchHistory: [t, ...s.searchHistory.filter((x) => x !== t)].slice(0, 12) }));
      },
      clearSearchHistory: () => set({ searchHistory: [] }),
      addFoodToLog: (food, amount, unitLabel, meal, date = dateKey(), grams) => {
        const base = grams ?? amount;
        const dup = get().entries.find((x) => Date.now() - x.createdAt < 1200 && x.foodId === food.id && x.date === date && x.meal === meal && x.grams === base);
        if (dup) return dup;
        const entry: FoodEntry = {
          id: uid(), createdAt: Date.now(), time: nowTime(), date, meal, foodId: food.id, name: food.name, amount, unitLabel,
          grams: base, nutrients: nutrientsFor(food, base), photoUri: food.imageUrl,
        };
        set((s) => ({ entries: [...s.entries, entry], recentFoodIds: [food.id, ...s.recentFoodIds.filter((x) => x !== food.id)].slice(0, 20) }));
        return entry;
      },
      updateEntry: (id, patch) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEntry: (id) => {
        const e = get().entries.find((x) => x.id === id);
        set((s) => ({ entries: s.entries.filter((x) => x.id !== id) }));
        return e;
      },
      restoreEntry: (e) => set((s) => ({ entries: [...s.entries, e] })),
      duplicateEntries: (ids, toDate, toMeal) =>
        set((s) => ({
          entries: [
            ...s.entries,
            ...s.entries.filter((e) => ids.includes(e.id)).map((e) => ({ ...e, id: uid(), date: toDate, meal: toMeal ?? e.meal, createdAt: Date.now() })),
          ],
        })),
      toggleFavorite: (foodId) => set((s) => ({ favorites: s.favorites.includes(foodId) ? s.favorites.filter((f) => f !== foodId) : [foodId, ...s.favorites] })),
      upsertFood: (f) => set((s) => ({ foods: [f, ...s.foods.filter((x) => x.id !== f.id)] })),
      saveMeal: (name, entryIds) =>
        set((s) => ({
          savedMeals: [
            ...s.savedMeals,
            { id: uid(), name, items: s.entries.filter((e) => entryIds.includes(e.id)).map(({ foodId, name: n, amount, unitLabel, grams, nutrients, photoUri }) => ({ foodId, name: n, amount, unitLabel, grams, nutrients, photoUri })) },
          ],
        })),
      deleteSavedMeal: (id) => set((s) => ({ savedMeals: s.savedMeals.filter((m) => m.id !== id) })),
      logSavedMeal: (id, meal, date) => {
        const m = get().savedMeals.find((x) => x.id === id);
        if (!m) return;
        set((s) => ({ entries: [...s.entries, ...m.items.map((it) => ({ ...it, id: uid(), date, meal, time: nowTime(), createdAt: Date.now() }))] }));
      },
      reportFood: (foodId, text) => set((s) => ({ reports: [...s.reports, { foodId, text, at: Date.now() }] })),

      upsertPlannedMeal: (m) => {
        const id = m.id ?? uid();
        set((s) => ({ plannedMeals: [...s.plannedMeals.filter((x) => x.id !== id), { ...m, id }] }));
        return id;
      },
      removePlannedMeal: (id) => {
        const m = get().plannedMeals.find((x) => x.id === id);
        set((s) => ({ plannedMeals: s.plannedMeals.filter((x) => x.id !== id) }));
        return m;
      },
      restorePlannedMeal: (m) => set((s) => ({ plannedMeals: [...s.plannedMeals, m] })),
      eatPlannedMeal: (id) => {
        const m = get().plannedMeals.find((x) => x.id === id);
        if (!m || m.eatenAt) return 0;
        const now = Date.now();
        const items: MealItem[] = m.items.length ? m.items : [{ name: m.title, amount: 1, unitLabel: 'מנה', grams: null, nutrients: { kcal: null, protein: null, carbs: null, fat: null } }];
        const add: FoodEntry[] = items.map((i, k) => ({ ...i, id: uid(), createdAt: now + k, date: m.date, meal: m.meal, time: nowTime(), note: m.items.length ? m.title : undefined }));
        set((s) => ({ entries: [...s.entries, ...add], plannedMeals: s.plannedMeals.map((x) => (x.id === id ? { ...x, eatenAt: now } : x)) }));
        return add.length;
      },
      upsertEvent: (e) => {
        const id = e.id ?? uid();
        set((s) => ({ events: [...s.events.filter((x) => x.id !== id), { ...e, id }] }));
        return id;
      },
      removeEvent: (id) => {
        const e = get().events.find((x) => x.id === id);
        set((s) => ({ events: s.events.filter((x) => x.id !== id) }));
        return e;
      },
      restoreEvent: (e) => set((s) => ({ events: [...s.events, e] })),
      updateShabbat: (p) => set((s) => ({ shabbat: { ...s.shabbat, ...p } })),
      applyShabbat: (weekStart) => {
        const sh = get().shabbat;
        const days = weekOf(weekStart);
        let n = 0;
        const meals: PlannedMeal[] = [];
        for (const m of sh.meals) {
          if (!m.enabled) continue;
          const def = SHABBAT_MEALS.find((x) => x.key === m.key)!;
          const date = days[def.day]!;
          // don't duplicate a Shabbat meal that is already planned for that day
          if (get().plannedMeals.some((x) => x.date === date && x.source === 'shabbat' && x.title.startsWith(def.label))) continue;
          meals.push({ id: uid(), date, meal: def.meal, title: def.label + (m.family ? ' · משפחתית' : ''), items: m.dishes, note: m.note, source: 'shabbat' });
          n++;
        }
        const wos: PlannedWorkout[] = [];
        for (const [t, day] of [[sh.friWorkout, 5], [sh.satWorkout, 6]] as const) {
          if (!t) continue;
          const date = days[day]!;
          if (get().workouts.some((w) => w.date === date && w.status !== 'skipped' && !w.rest)) continue;
          wos.push({ id: uid(), date, time: t.time, name: t.name, muscles: t.muscles, rest: t.rest, durationMin: t.durationMin ?? null, status: 'planned' });
        }
        set((s) => ({
          plannedMeals: [...s.plannedMeals, ...meals],
          workouts: [...s.workouts.filter((w) => !(wos.some((x) => x.date === w.date) && w.rest)), ...wos],
          shabbat: { ...s.shabbat, appliedWeeks: [...new Set([...s.shabbat.appliedWeeks, weekStart])].slice(-20) },
        }));
        if (sh.shopping.length) get().addShopping(sh.shopping.map((name) => ({ name, qty: '' })));
        return n;
      },
      upsertRestaurant: (r) => {
        const id = r.id ?? uid();
        set((s) => ({ restaurants: [...s.restaurants.filter((x) => x.id !== id), { ...r, id }] }));
        return id;
      },
      removeRestaurant: (id) => set((s) => ({ restaurants: s.restaurants.filter((x) => x.id !== id) })),
      upsertDish: (d) => {
        const id = d.id ?? uid();
        set((s) => {
          const old = s.dishes.find((x) => x.id === id);
          return { dishes: [...s.dishes.filter((x) => x.id !== id), { ...d, id, createdAt: old?.createdAt ?? Date.now() }] };
        });
        return id;
      },
      removeDish: (id) => {
        const d = get().dishes.find((x) => x.id === id);
        set((s) => ({ dishes: s.dishes.filter((x) => x.id !== id) }));
        return d;
      },
      restoreDish: (d) => set((s) => ({ dishes: [...s.dishes, d] })),
      logDish: (id, date, meal, time) => {
        const d = get().dishes.find((x) => x.id === id);
        if (!d) return undefined;
        const r = d.restaurantId ? get().restaurants.find((x) => x.id === d.restaurantId) : undefined;
        return get().addEntry({ date, meal, time, name: d.name, amount: 1, unitLabel: 'מנה', grams: null, nutrients: d.nutrients, photoUri: d.photoUri, note: [r?.name ?? 'מסעדה', d.estimated ? 'הערכה' : 'נתון רשמי'].join(' · ') });
      },
      setLogCtx: (date, meal) => set({ logCtx: { date, meal, at: Date.now() } }),
      setMealMeta: (date, meal, patch) => set((s) => ({ mealMeta: { ...s.mealMeta, [`${date}|${meal}`]: { ...s.mealMeta[`${date}|${meal}`], ...patch } } })),
      removeMeal: (date, meal) => {
        const list = get().entries.filter((e) => e.date === date && e.meal === meal);
        set((s) => ({ entries: s.entries.filter((e) => !(e.date === date && e.meal === meal)) }));
        return list;
      },
      restoreEntries: (list) => set((s) => ({ entries: [...s.entries, ...list.filter((e) => !s.entries.some((x) => x.id === e.id))] })),
      setDraft: (key, value) => set((s) => ({ drafts: { ...s.drafts, [key]: value } })),
      clearDraft: (key) => set((s) => { const d = { ...s.drafts }; delete d[key]; return { drafts: d }; }),
      addShopping: (items) =>
        set((s) => {
          const next = [...s.shopping];
          for (const it of items) {
            const ex = next.find((x) => x.name === it.name && !x.checked);
            if (ex) ex.qty = `${ex.qty} + ${it.qty}`;
            else next.push({ id: uid(), checked: false, ...it });
          }
          return { shopping: next };
        }),
      toggleShopping: (id) => set((s) => ({ shopping: s.shopping.map((x) => (x.id === id ? { ...x, checked: !x.checked } : x)) })),
      removeShopping: (id) => set((s) => ({ shopping: s.shopping.filter((x) => x.id !== id) })),
      clearChecked: () => set((s) => ({ shopping: s.shopping.filter((x) => !x.checked) })),

      addWater: (ml, date = dateKey()) => set((s) => ({ water: { ...s.water, [date]: Math.max(0, (s.water[date] ?? 0) + ml) } })),
      setSleep: (h, date = dateKey()) => set((s) => ({ sleep: { ...s.sleep, [date]: h } })),
      addMeasurement: (kg, date = dateKey()) => get().upsertMeasurement({ ...get().measurements.find((m) => m.date === date), date, weightKg: kg }),
      upsertMeasurement: (m) => set((s) => ({ measurements: [...s.measurements.filter((x) => x.date !== m.date), m].sort((a, b) => a.date.localeCompare(b.date)) })),
      removeMeasurement: (date) => {
        const m = get().measurements.find((x) => x.date === date);
        set((s) => ({ measurements: s.measurements.filter((x) => x.date !== date) }));
        return m;
      },

      upsertWorkout: (w) => {
        const id = w.id ?? uid();
        set((s) => {
          const old = s.workouts.find((x) => x.id === id);
          const next: PlannedWorkout = { ...old, ...w, id, status: w.status ?? old?.status ?? 'planned', fromTemplate: false } as PlannedWorkout;
          // a real workout replaces a planned rest day on the same date
          const others = s.workouts.filter((x) => x.id !== id && !(x.rest && !next.rest && x.date === next.date));
          return { workouts: [...others, next] };
        });
        return id;
      },
      removeWorkout: (id) => {
        const w = get().workouts.find((x) => x.id === id);
        set((s) => ({ workouts: s.workouts.filter((x) => x.id !== id) }));
        return w;
      },
      restoreWorkout: (w) => set((s) => ({ workouts: [...s.workouts, w] })),
      duplicateWorkout: (id, toDate) => {
        const w = get().workouts.find((x) => x.id === id);
        if (!w) return undefined;
        const nid = uid();
        set((s) => ({ workouts: [...s.workouts.filter((x) => !(x.rest && x.date === toDate)), { ...w, id: nid, date: toDate, status: 'planned', doneAt: undefined, fromTemplate: false }] }));
        return nid;
      },
      moveWorkout: (id, date, time) =>
        set((s) => ({ workouts: s.workouts.filter((x) => !(x.rest && x.date === date && x.id !== id)).map((x) => (x.id === id ? { ...x, date, time: time === undefined ? x.time : time, status: 'planned', fromTemplate: false } : x)) })),
      completeWorkout: (id) => {
        const w = get().workouts.find((x) => x.id === id);
        if (!w) return;
        set((s) => ({
          workouts: s.workouts.map((x) => (x.id === id ? { ...x, status: 'done', doneAt: Date.now() } : x)),
          // central engine: finishing a workout also ticks the challenge's workout task for that day
          challenges: s.challenges.map((c) => {
            if (c.finished || w.date < c.startDate || w.date > c.endDate) return c;
            const auto = c.tasks.filter((t) => t.auto === 'workout').map((t) => t.id);
            if (!auto.length) return c;
            const done = c.log[w.date] ?? [];
            return { ...c, log: { ...c.log, [w.date]: [...new Set([...done, ...auto])] } };
          }),
        }));
      },
      skipWorkout: (id) => set((s) => ({ workouts: s.workouts.map((x) => (x.id === id ? { ...x, status: 'skipped' } : x)) })),
      reopenWorkout: (id) => set((s) => ({ workouts: s.workouts.map((x) => (x.id === id ? { ...x, status: 'planned', doneAt: undefined } : x)) })),
      setTemplate: (t, auto) => set((s) => ({ template: t, templateAuto: auto ?? s.templateAuto })),
      applyTemplate: (t) => {
        // replace only future, not-yet-done template instances; keep anything the user did or edited
        set((s) => ({ template: t, templateAuto: true, filledWeeks: [], workouts: s.workouts.filter((w) => !(w.fromTemplate && w.status === 'planned' && w.date >= dateKey())) }));
        get().ensureWeeks();
      },
      saveWeekAsTemplate: (weekStart) => {
        const days = weekOf(weekStart);
        const wk = get().workouts.filter((w) => days.includes(w.date) && w.status !== 'skipped');
        const t: WorkoutTemplate[] = [];
        days.forEach((d, i) => {
          const w = wk.find((x) => x.date === d && !x.rest) ?? wk.find((x) => x.date === d);
          t.push(w ? { day: i, name: w.name, muscles: w.muscles, time: w.time, durationMin: w.durationMin, rest: w.rest } : { day: i, name: 'יום מנוחה', muscles: [], time: null, rest: true });
        });
        set({ template: t, templateAuto: true });
      },
      copyWeekToNext: (weekStart) => {
        const copies = copyWeek(get().workouts, weekStart);
        const next = addDays(weekStart, 7);
        set((s) => ({
          workouts: [...s.workouts.filter((w) => !(weekOf(next).includes(w.date) && w.status === 'planned')), ...copies],
          filledWeeks: [...new Set([...s.filledWeeks, next])],
          plannedMeals: [...s.plannedMeals, ...s.plannedMeals.filter((m) => weekOf(weekStart).includes(m.date)).map((m) => ({ ...m, id: uid(), date: addDays(m.date, 7), eatenAt: undefined }))],
        }));
        return copies.length;
      },
      ensureWeeks: () => {
        const s = get();
        const thisWeek = weekOf(dateKey())[0]!;
        for (const ws of [thisWeek, addDays(thisWeek, 7)]) {
          const st = get();
          if (st.templateAuto && st.template.length && !st.filledWeeks.includes(ws)) {
            const add = fromTemplate(st.template, ws, st.workouts).filter((w) => w.date >= dateKey());
            set((x) => ({ workouts: [...x.workouts, ...add], filledWeeks: [...x.filledWeeks, ws].slice(-30) }));
          }
          if (s.shabbat.autoRepeat && !get().shabbat.appliedWeeks.includes(ws) && weekOf(ws)[6]! >= dateKey()) get().applyShabbat(ws);
        }
      },

      upsertReminder: (r) => set((s) => ({ reminders: [r, ...s.reminders.filter((x) => x.id !== r.id)] })),
      deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((x) => x.id !== id) })),

      upsertChallenge: (c) => set((s) => ({ challenges: [c, ...s.challenges.filter((x) => x.id !== c.id)] })),
      deleteChallenge: (id) => set((s) => ({ challenges: s.challenges.filter((x) => x.id !== id) })),
      toggleChallengeTask: (cid, date, taskId) =>
        set((s) => ({
          challenges: s.challenges.map((c) => {
            if (c.id !== cid) return c;
            const done = c.log[date] ?? [];
            return { ...c, log: { ...c.log, [date]: done.includes(taskId) ? done.filter((t) => t !== taskId) : [...done, taskId] } };
          }),
        })),
      toggleRestDay: (cid, date) =>
        set((s) => ({ challenges: s.challenges.map((c) => (c.id !== cid ? c : { ...c, restDays: c.restDays.includes(date) ? c.restDays.filter((d) => d !== date) : [...c.restDays, date] })) })),

      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      markNotificationsSeen: () => set({ notificationsSeen: Date.now() }),
      resetAll: () => set({ ...initialData }),
    }),
    {
      name: 'mizrahi-pinto-v1',
      version: 2,
      migrate: (persisted: any, version) => migrateState(persisted, version),
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, logCtx, ...rest }) => rest as any,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

const BUILTIN = [...STARTER_FOODS, ...IL_PRODUCTS, ...TZAMERET_FOODS];
const BUILTIN_BY_ID = new Map(BUILTIN.map((f) => [f.id, f]));
let lastUser: Food[] | null = null;
let lastAll: Food[] = BUILTIN;
/** Every searchable food: user foods first, then starter list, Israeli packaged products and Tzameret. Memoised. */
export const allFoods = (userFoods: Food[]) => {
  if (userFoods !== lastUser) { lastUser = userFoods; lastAll = [...userFoods, ...BUILTIN]; }
  return lastAll;
};
export const findFood = (id: string | undefined, userFoods: Food[]) => (id ? userFoods.find((f) => f.id === id) ?? BUILTIN_BY_ID.get(id) : undefined);

/** Target active on a given date (history aware). */
export const targetFor = (date: string, profile: Profile, hist: TargetHistory) => {
  const h = [...hist].reverse().find((x) => x.from <= date) ?? { from: date, calorieTarget: profile.calorieTarget, proteinTarget: profile.proteinTarget, carbsTarget: profile.carbsTarget, fatTarget: profile.fatTarget };
  // flexible weekday target (set in advance, e.g. Shabbat) – never lowered automatically after an over day
  const flex = profile.dayTargets?.[new Date(date + 'T12:00:00').getDay()];
  return flex != null && h.calorieTarget != null ? { ...h, calorieTarget: flex } : h;
};

