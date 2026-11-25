import { useMemo } from 'react';
import { useApp, targetFor, DEFAULT_MEALS } from './useApp';
import { isAdult } from '@/lib/nutrition';
import { totalsOf } from '@/lib/engine';
import { weekOf, addDays, dateKey } from '@/lib/dates';

export function useDay(date: string) {
  const entries = useApp((s) => s.entries);
  const profile = useApp((s) => s.profile);
  const hist = useApp((s) => s.targetHistory);
  return useMemo(() => {
    const list = entries.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
    const totals = totalsOf(list); // central engine
    const target = targetFor(date, profile, hist);
    const adult = isAdult(profile.age);
    const hasTarget = adult && profile.targetMode !== 'none' && target.calorieTarget != null;
    return {
      list,
      totals,
      target,
      adult,
      hasTarget,
      remaining: hasTarget ? Math.round(target.calorieTarget! - totals.kcal) : null,
    };
  }, [entries, profile, hist, date]);
}

export function useMeals() {
  const custom = useApp((s) => s.customMeals);
  return useMemo(() => [...DEFAULT_MEALS, ...custom.map((c) => ({ ...c, icon: 'food' as const }))], [custom]);
}

/** Weekly summary – days without logs are "missing", never zero. */
export function useWeek(anchor = dateKey()) {
  const entries = useApp((s) => s.entries);
  const sessions = useApp((s) => s.sessions);
  return useMemo(() => {
    const days = weekOf(anchor).map((d) => {
      const list = entries.filter((e) => e.date === d);
      const t = totalsOf(list);
      return { date: d, logged: list.length > 0, totals: t, workouts: sessions.filter((s) => s.date === d && s.status === 'done').length };
    });
    const logged = days.filter((d) => d.logged);
    const avg = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => (logged.length ? Math.round(logged.reduce((m, d) => m + d.totals[k], 0) / logged.length) : null);
    return {
      days,
      loggedCount: logged.length,
      avgKcal: avg('kcal'), avgProtein: avg('protein'), avgCarbs: avg('carbs'), avgFat: avg('fat'),
      totalKcal: logged.reduce((m, d) => m + d.totals.kcal, 0),
      workouts: days.reduce((m, d) => m + d.workouts, 0),
    };
  }, [entries, sessions, anchor]);
}

export function rangeDays(days: number, end = dateKey()) {
  return Array.from({ length: days }, (_, i) => addDays(end, i - days + 1));
}
