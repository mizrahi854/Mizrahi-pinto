import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BasketItem,
  Challenge, Food, FoodEntry, MealKey, Profile, Reminder, SavedMeal, TargetHistory, WorkoutPlan, WorkoutSession, PlanExercise,
} from '@/data/types';
import { STARTER_FOODS } from '@/data/foods';
import { IL_PRODUCTS } from '@/data/ilProducts';
import { PLANS, planById } from '@/data/exercises';
import { dateKey, nowTime, uid } from '@/lib/dates';
import { nutrientsFor, sumNutrients } from '@/lib/nutrition';

export const DEFAULT_MEALS: { key: MealKey; label: string; icon: 'bowl' | 'food' | 'moon' | 'star' }[] = [
  { key: 'breakfast', label: 'ארוחת בוקר', icon: 'bowl' },
  { key: 'lunch', label: 'ארוחת צהריים', icon: 'food' },
  { key: 'dinner', label: 'ארוחת ערב', icon: 'moon' },
  { key: 'snack', label: 'נשנושים', icon: 'star' },
];

export const defaultProfile: Profile = {
  name: '', age: null, language: 'he', goals: [], experience: 'beginner', equipment: [], workoutsPerWeek: 3, trainingDays: [0, 2, 4],
  trainingTime: '18:00', foodPrefs: [], allergies: [], limitations: '', heightCm: null, weightKg: null, sex: null, activity: 'moderate',
  planDays: 30, targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null, waterTargetMl: 3000,
};

export type AppSettings = { quietStart: string; quietEnd: string; quietEnabled: boolean; maxPerDay: number; units: 'metric'; reduceMotion: boolean; haptics: boolean };
export const defaultSettings: AppSettings = { quietStart: '22:00', quietEnd: '07:00', quietEnabled: true, maxPerDay: 6, units: 'metric', reduceMotion: false, haptics: true };

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
  mealPlan: Record<string, Record<string, string>>; // date -> meal -> recipeId
  shopping: { id: string; name: string; qty: string; checked: boolean; recipeId?: string }[];
  water: Record<string, number>;
  sleep: Record<string, number>;
  measurements: { date: string; weightKg: number }[];
  customPlans: WorkoutPlan[];
  schedule: Record<number, string>; // weekday -> planId | 'rest'
  sessions: WorkoutSession[];
  activeSessionId: string | null;
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
  completeOnboarding: (p: Profile) => void;
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

  setPlanned: (date: string, meal: string, recipeId: string | null) => void;
  addShopping: (items: { name: string; qty: string; recipeId?: string }[]) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearChecked: () => void;

  addWater: (ml: number, date?: string) => void;
  setSleep: (h: number, date?: string) => void;
  addMeasurement: (kg: number, date?: string) => void;

  setSchedule: (day: number, planId: string) => void;
  saveCustomPlan: (p: WorkoutPlan) => void;
  deleteCustomPlan: (id: string) => void;
  startWorkout: (planId: string) => string;
  updateSession: (id: string, fn: (s: WorkoutSession) => WorkoutSession) => void;
  pauseWorkout: (id: string) => void;
  resumeWorkout: (id: string) => void;
  finishWorkout: (id: string, notes?: string) => void;
  discardWorkout: (id: string) => void;

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
  mealPlan: {},
  shopping: [],
  water: {},
  sleep: {},
  measurements: [],
  customPlans: [] as WorkoutPlan[],
  schedule: { 0: 'push', 1: 'rest', 2: 'pull', 3: 'rest', 4: 'legs', 5: 'rest', 6: 'rest' } as Record<number, string>,
  sessions: [] as WorkoutSession[],
  activeSessionId: null as string | null,
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
      completeOnboarding: (p) =>
        set({
          profile: { ...p, targetsSince: dateKey() },
          onboarded: true,
          onboardingDraft: {},
          targetHistory: [{ from: dateKey(), calorieTarget: p.calorieTarget, proteinTarget: p.proteinTarget, carbsTarget: p.carbsTarget, fatTarget: p.fatTarget }],
          schedule: buildSchedule(p),
        }),
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

      setPlanned: (date, meal, recipeId) =>
        set((s) => {
          const day = { ...(s.mealPlan[date] ?? {}) };
          if (recipeId) day[meal] = recipeId;
          else delete day[meal];
          return { mealPlan: { ...s.mealPlan, [date]: day } };
        }),
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
      addMeasurement: (kg, date = dateKey()) => set((s) => ({ measurements: [...s.measurements.filter((m) => m.date !== date), { date, weightKg: kg }].sort((a, b) => a.date.localeCompare(b.date)) })),

      setSchedule: (day, planId) => set((s) => ({ schedule: { ...s.schedule, [day]: planId } })),
      saveCustomPlan: (p) => set((s) => ({ customPlans: [p, ...s.customPlans.filter((x) => x.id !== p.id)] })),
      deleteCustomPlan: (id) => set((s) => ({ customPlans: s.customPlans.filter((x) => x.id !== id) })),
      startWorkout: (planId) => {
        const existing = get().sessions.find((x) => x.id === get().activeSessionId && x.status !== 'done');
        if (existing && existing.planId === planId) return existing.id;
        const plan = planById(planId, get().customPlans) ?? PLANS[0]!;
        const last = [...get().sessions].reverse().find((x) => x.planId === planId && x.status === 'done');
        const s: WorkoutSession = {
          id: uid(), planId, name: plan.name, date: dateKey(), startedAt: Date.now(), pausedMs: 0, status: 'active', current: 0,
          exercises: plan.exercises.map((t: PlanExercise) => {
            const prev = last?.exercises.find((e) => e.exerciseId === t.exerciseId);
            return {
              exerciseId: t.exerciseId, target: t,
              sets: Array.from({ length: t.sets }, (_, i) => ({ reps: prev?.sets[i]?.reps ?? t.repsMax, weight: prev?.sets[i]?.weight ?? t.weight ?? null, done: false, seconds: t.seconds })),
            };
          }),
        };
        set((st) => ({ sessions: [...st.sessions.filter((x) => !(x.id === st.activeSessionId && x.status !== 'done')), s], activeSessionId: s.id }));
        return s.id;
      },
      updateSession: (id, fn) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? fn(x) : x)) })),
      pauseWorkout: (id) => get().updateSession(id, (x) => (x.status === 'active' ? { ...x, status: 'paused', pausedAt: Date.now() } : x)),
      resumeWorkout: (id) => get().updateSession(id, (x) => (x.status === 'paused' ? { ...x, status: 'active', pausedMs: x.pausedMs + (Date.now() - (x.pausedAt ?? Date.now())), pausedAt: undefined } : x)),
      finishWorkout: (id, notes) => {
        get().resumeWorkout(id);
        get().updateSession(id, (x) => ({ ...x, status: 'done', endedAt: Date.now(), notes }));
        set({ activeSessionId: null });
      },
      discardWorkout: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id), activeSessionId: null })),

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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, ...rest }) => rest as any,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Weekly schedule from onboarding answers: beginners/home get full-body, others rotate PPL. */
export function buildSchedule(p: Pick<Profile, 'trainingDays' | 'experience' | 'equipment'>): Record<number, string> {
  const home = p.equipment.length === 0 || (p.equipment.length === 1 && p.equipment[0] === 'none');
  const rotation = home ? ['home'] : p.experience === 'beginner' ? ['full'] : ['push', 'pull', 'legs'];
  const days = [...p.trainingDays].sort();
  const out: Record<number, string> = {};
  for (let d = 0; d < 7; d++) {
    const idx = days.indexOf(d);
    out[d] = idx === -1 ? 'rest' : rotation[idx % rotation.length]!;
  }
  return out;
}

export const allFoods = (userFoods: Food[]) => [...userFoods, ...STARTER_FOODS, ...IL_PRODUCTS];
export const findFood = (id: string | undefined, userFoods: Food[]) => (id ? allFoods(userFoods).find((f) => f.id === id) : undefined);

/** Target active on a given date (history aware). */
export const targetFor = (date: string, profile: Profile, hist: TargetHistory) => {
  const h = [...hist].reverse().find((x) => x.from <= date);
  return h ?? { from: date, calorieTarget: profile.calorieTarget, proteinTarget: profile.proteinTarget, carbsTarget: profile.carbsTarget, fatTarget: profile.fatTarget };
};
