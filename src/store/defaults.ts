import type { Profile, ShabbatPlan, PlannedWorkout, WorkoutTemplate, PlannedMeal, MealKey, ShabbatMealKey } from '../data/types';
import { RECIPES } from '../data/recipes';
import { isAdult } from '../lib/nutrition';
import { uid } from '../lib/dates';

export const defaultProfile: Profile = {
  name: '', age: null, language: 'he', goals: [], experience: 'beginner', equipment: [], workoutsPerWeek: 3, trainingDays: [0, 2, 4],
  trainingTime: '18:00', foodPrefs: [], allergies: [], limitations: '', heightCm: null, weightKg: null, sex: null, activity: 'moderate',
  planDays: 30, targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null, waterTargetMl: 3000,
  trackCalories: false, muscleGroups: [], eatingHabits: [], wakeTime: '06:30', weekendRoutine: [], shabbatMeals: ['fri_dinner', 'sat_lunch'], notifPrefs: ['workout', 'daily'],
};

export const SHABBAT_MEALS: { key: ShabbatMealKey; label: string; day: 5 | 6; meal: MealKey; time: string }[] = [
  { key: 'fri_dinner', label: 'ארוחת שישי בערב', day: 5, meal: 'dinner', time: '19:30' },
  { key: 'sat_breakfast', label: 'ארוחת שבת בבוקר', day: 6, meal: 'breakfast', time: '09:30' },
  { key: 'sat_lunch', label: 'ארוחת שבת בצהריים', day: 6, meal: 'lunch', time: '12:30' },
  { key: 'sat_third', label: 'סעודה שלישית', day: 6, meal: 'dinner', time: '17:30' },
];

export const defaultShabbat: ShabbatPlan = {
  meals: SHABBAT_MEALS.map((m) => ({ key: m.key, enabled: m.key === 'fri_dinner' || m.key === 'sat_lunch', family: m.key !== 'sat_breakfast', dishes: [] })),
  friWorkout: null, satWorkout: null, shopping: [], autoRepeat: false, muteDuringShabbat: true, remindAfterShabbat: true, appliedWeeks: [],
};

/** Calorie numbers are shown only to adults who chose calorie tracking. Minors never get calorie targets. */
export const tracksCalories = (p: Pick<Profile, 'age' | 'trackCalories' | 'targetMode'>) => isAdult(p.age) && (p.trackCalories ?? p.targetMode !== 'none');

export type AppSettings = { quietStart: string; quietEnd: string; quietEnabled: boolean; maxPerDay: number; units: 'metric'; reduceMotion: boolean; haptics: boolean; muted: boolean };
export const defaultSettings: AppSettings = { quietStart: '22:00', quietEnd: '07:00', quietEnabled: true, maxPerDay: 6, units: 'metric', reduceMotion: false, haptics: true, muted: false };

const LEGACY_PLAN_NAMES: Record<string, Pick<PlannedWorkout, 'name' | 'muscles'>> = {
  push: { name: 'חזה, כתפיים ויד אחורית', muscles: ['chest', 'shoulders', 'triceps'] },
  pull: { name: 'גב ויד קדמית', muscles: ['back', 'biceps'] },
  legs: { name: 'רגליים', muscles: ['legs', 'glutes'] },
  full: { name: 'אימון גוף מלא', muscles: ['full'] },
  home: { name: 'אימון גוף מלא', muscles: ['full'] },
};

/** v1 → v2: keep every food entry and challenge; convert finished workout sessions and the weekly
 *  schedule to the simple workout model; convert the recipe meal-plan to planned meals. */
export function migrateState(st: any, version: number) {
  if (!st || version >= 2) return st;
  const sessions: any[] = Array.isArray(st.sessions) ? st.sessions : [];
  const customPlans: any[] = Array.isArray(st.customPlans) ? st.customPlans : [];
  const named = (id: string) => LEGACY_PLAN_NAMES[id] ?? { name: customPlans.find((p) => p.id === id)?.name ?? 'אימון', muscles: [] };
  const workouts: PlannedWorkout[] = sessions
    .filter((x) => x.status === 'done')
    .map((x) => ({ id: x.id, date: x.date, time: null, name: x.name ?? named(x.planId).name, muscles: named(x.planId).muscles, notes: x.notes, status: 'done' as const, doneAt: x.endedAt, durationMin: x.endedAt != null && x.startedAt != null ? Math.round((x.endedAt - x.startedAt - (x.pausedMs ?? 0)) / 60000) : null }));
  const schedule: Record<string, string> = st.schedule ?? {};
  const template: WorkoutTemplate[] = Array.from({ length: 7 }, (_, d) => {
    const id = schedule[d];
    if (!id || id === 'rest') return { day: d, name: 'יום מנוחה', muscles: [], time: null, rest: true };
    return { day: d, ...named(id), time: st.profile?.trainingTime ?? null, durationMin: 60 };
  });
  const recipeNames: Record<string, string> = Object.fromEntries(RECIPES.map((r) => [r.id, r.name]));
  const plannedMeals: PlannedMeal[] = [];
  for (const [date, meals] of Object.entries((st.mealPlan ?? {}) as Record<string, Record<string, string>>)) {
    for (const [meal, rid] of Object.entries(meals)) plannedMeals.push({ id: uid(), date, meal, title: recipeNames[rid] ?? 'ארוחה מתוכננת', items: [], source: 'manual' });
  }
  const { sessions: _a, customPlans: _b, schedule: _c, activeSessionId: _d, mealPlan: _e, ...rest } = st;
  return {
    ...rest,
    profile: { ...defaultProfile, ...st.profile, trackCalories: st.profile?.trackCalories ?? (isAdult(st.profile?.age) && st.profile?.targetMode !== 'none') },
    settings: { ...defaultSettings, ...st.settings },
    // a "complete the planned workout" task now ticks itself when a workout is completed
    challenges: (st.challenges ?? []).map((c: any) => ({ ...c, tasks: (c.tasks ?? []).map((t: any) => (/אימון/.test(t.title ?? '') && !t.auto ? { ...t, auto: 'workout' } : t)) })),
    workouts, template, templateAuto: true, filledWeeks: [], plannedMeals,
    events: [], shabbat: defaultShabbat, restaurants: [], dishes: [], drafts: {},
  };
}
