import { useMemo } from 'react';
import { useApp, targetFor, DEFAULT_MEALS, tracksCalories } from './useApp';
import { isAdult } from '@/lib/nutrition';
import { totalsOf } from '@/lib/engine';
import { weekOf, addDays, dateKey } from '@/lib/dates';
import { nextWorkout, missedWorkouts, workoutWeekStats } from '@/lib/workouts';
import { defaultMeal } from '@/lib/search';

/** One day from the central engine. `calories` = adult who chose calorie tracking. */
export function useDay(date: string) {
  const entries = useApp((s) => s.entries);
  const profile = useApp((s) => s.profile);
  const hist = useApp((s) => s.targetHistory);
  const planned = useApp((s) => s.plannedMeals);
  return useMemo(() => {
    const list = entries.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
    const totals = totalsOf(list); // central engine
    const target = targetFor(date, profile, hist);
    const adult = isAdult(profile.age);
    const calories = tracksCalories(profile);
    const hasTarget = calories && target.calorieTarget != null;
    return {
      list,
      totals,
      target,
      adult,
      calories,
      hasTarget,
      planned: planned.filter((m) => m.date === date),
      mealsLogged: new Set(list.map((e) => e.meal)).size,
      remaining: hasTarget ? Math.round(target.calorieTarget! - totals.kcal) : null,
    };
  }, [entries, profile, hist, date, planned]);
}

export function useMeals() {
  const custom = useApp((s) => s.customMeals);
  return useMemo(() => [...DEFAULT_MEALS, ...custom.map((c) => ({ ...c, icon: 'food' as const }))], [custom]);
}

/**
 * Weekly summary (Sunday–Saturday). Days without logs are "missing", never zero.
 * Over/under is reported exactly as it is – nothing is ever deducted from another day.
 */
export function useWeek(anchor = dateKey()) {
  const entries = useApp((s) => s.entries);
  const workouts = useApp((s) => s.workouts);
  const plannedMeals = useApp((s) => s.plannedMeals);
  const events = useApp((s) => s.events);
  const profile = useApp((s) => s.profile);
  const hist = useApp((s) => s.targetHistory);
  return useMemo(() => {
    const dates = weekOf(anchor);
    const calories = tracksCalories(profile);
    const days = dates.map((d) => {
      const list = entries.filter((e) => e.date === d);
      const t = totalsOf(list);
      const target = calories ? targetFor(d, profile, hist).calorieTarget : null;
      return {
        date: d,
        logged: list.length > 0,
        totals: t,
        target,
        meals: new Set(list.map((e) => e.meal)).size,
        planned: plannedMeals.filter((m) => m.date === d),
        workouts: workouts.filter((w) => w.date === d),
        events: events.filter((e) => e.date === d),
      };
    });
    const logged = days.filter((d) => d.logged);
    const avg = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => (logged.length ? Math.round(logged.reduce((m, d) => m + d.totals[k], 0) / logged.length) : null);
    const weekTarget = calories && days.every((d) => d.target != null) ? days.reduce((m, d) => m + d.target!, 0) : null;
    // target for the days that were actually logged, so the comparison is like-for-like
    const loggedTarget = calories ? logged.reduce((m, d) => m + (d.target ?? 0), 0) : null;
    const totalKcal = logged.reduce((m, d) => m + d.totals.kcal, 0);
    return {
      dates,
      days,
      calories,
      loggedCount: logged.length,
      avgKcal: avg('kcal'), avgProtein: avg('protein'), avgCarbs: avg('carbs'), avgFat: avg('fat'),
      totalKcal,
      weekTarget,
      loggedTarget,
      partial: logged.some((d) => d.totals.partial.kcal),
      workouts: workoutWeekStats(workouts, dates[0]!),
      mealsPlanned: plannedMeals.filter((m) => dates.includes(m.date)).length,
      mealsPlannedEaten: plannedMeals.filter((m) => dates.includes(m.date) && m.eatenAt).length,
    };
  }, [entries, workouts, plannedMeals, events, profile, hist, anchor]);
}

export function useNextWorkout() {
  const workouts = useApp((s) => s.workouts);
  return useMemo(() => ({ next: nextWorkout(workouts), missed: missedWorkouts(workouts) }), [workouts]);
}

export function rangeDays(days: number, end = dateKey()) {
  return Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));
}

/** Target meal/date for add-food flows: explicit params win, then the add-meal panel context (30 min), then now. */
export function useLogTarget(pMeal?: string, pDate?: string) {
  const ctx = useApp((s) => s.logCtx);
  const fresh = ctx && Date.now() - ctx.at < 30 * 60_000 ? ctx : null;
  return { meal: pMeal || fresh?.meal || defaultMeal(), date: pDate || fresh?.date || dateKey() };
}
