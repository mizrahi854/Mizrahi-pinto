import type { FoodEntry, PlannedWorkout } from '../data/types';
import { totalsOf } from './engine';
import { addDays, dateKey, parseKey, DAY_SHORT } from './dates';

export type Range = 'day' | 'week' | 'month' | 'custom';
export const RANGE_DAYS: Record<Exclude<Range, 'custom'>, number> = { day: 1, week: 7, month: 30 };

export function daysFor(n: number, end = dateKey()) {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

export const shortLabel = (d: string, n: number) => (n <= 7 ? DAY_SHORT[parseKey(d).getDay()]! : String(parseKey(d).getDate()));

export function metricSeries(metric: string, days: string[], entries: FoodEntry[], workouts: PlannedWorkout[], water: Record<string, number>, sleep: Record<string, number>, weights: { date: string; weightKg?: number }[]) {
  return days.map((d) => {
    const label = shortLabel(d, days.length);
    const done = workouts.filter((w) => w.date === d && w.status === 'done' && !w.rest);
    switch (metric) {
      case 'kcal': case 'protein': case 'carbs': case 'fat': {
        const l = entries.filter((e) => e.date === d);
        return { date: d, label, value: l.length ? totalsOf(l)[metric as 'kcal'] : null };
      }
      case 'workouts': return { date: d, label, value: done.length };
      case 'minutes': return { date: d, label, value: done.some((w) => w.durationMin) ? done.reduce((m, w) => m + (w.durationMin ?? 0), 0) : done.length ? null : 0 };
      case 'water': return { date: d, label, value: water[d] != null ? water[d]! / 1000 : null };
      case 'sleep': return { date: d, label, value: sleep[d] ?? null };
      case 'weight': return { date: d, label, value: weights.find((w) => w.date === d)?.weightKg ?? null };
      default: return { date: d, label, value: null };
    }
  });
}

export const METRICS: Record<string, { title: string; unit: string; adultOnly?: boolean; line?: boolean }> = {
  kcal: { title: 'קלוריות', unit: 'קק״ל', adultOnly: true },
  protein: { title: 'חלבון', unit: 'ג׳' },
  carbs: { title: 'פחמימות', unit: 'ג׳' },
  fat: { title: 'שומנים', unit: 'ג׳' },
  workouts: { title: 'אימונים', unit: 'אימונים' },
  minutes: { title: 'זמן פעילות', unit: 'דק׳' },
  water: { title: 'שתייה', unit: 'ליטר' },
  sleep: { title: 'שינה', unit: 'שעות' },
  weight: { title: 'משקל', unit: 'ק״ג', adultOnly: true, line: true },
};

export function aggregate(series: { value: number | null }[]) {
  const v = series.map((s) => s.value).filter((x): x is number => x != null);
  return { sum: v.reduce((a, b) => a + b, 0), avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, count: v.length };
}

/** Bucket long ranges (30+ days) into weeks for readable bars. */
export function bucket(series: { date: string; label: string; value: number | null }[], size: number, mode: 'sum' | 'avg' = 'sum') {
  if (series.length <= 14) return series;
  const out: { date: string; label: string; value: number | null }[] = [];
  for (let i = 0; i < series.length; i += size) {
    const chunk = series.slice(i, i + size);
    const a = aggregate(chunk);
    out.push({ date: chunk[0]!.date, label: `${parseKey(chunk[0]!.date).getDate()}/${parseKey(chunk[0]!.date).getMonth() + 1}`, value: a.count ? (mode === 'sum' ? a.sum : a.avg) : null });
  }
  return out;
}
