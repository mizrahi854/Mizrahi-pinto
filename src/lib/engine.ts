/**
 * Central nutrition engine – the ONLY place where amounts are converted and totals are computed.
 * Every screen (home, diary, nutrition tab, stats, macro pages, basket) reads from here,
 * so the dashboard and the diary can never disagree.
 */
import type { Food, FoodEntry, Nutrients } from '../data/types';
import { nutrientsFor, sumNutrients, Totals } from './nutrition';

export type Unit = { label: string; grams: number | null }; // grams=null → the food's own basis (g/ml)

/** Units a food can be measured in: base unit + defined portions + whole package when known. */
export function unitsFor(food: Pick<Food, 'basis' | 'portions'> & { packageSize?: number }): Unit[] {
  const base: Unit = { label: food.basis === 'ml' ? 'מ״ל' : 'ג׳', grams: null };
  const out: Unit[] = [base, ...food.portions.map((p) => ({ label: p.label, grams: p.grams }))];
  if (food.packageSize && !food.portions.some((p) => Math.abs(p.grams - food.packageSize!) < 1)) {
    out.push({ label: 'אריזה שלמה', grams: food.packageSize });
  }
  return out;
}

/** Converts an amount in a unit to the food's basis quantity (grams or ml). Never converts ml↔g. */
export function baseQuantity(amount: number, unit: Unit) {
  if (!isFinite(amount) || amount < 0) return 0;
  return unit.grams == null ? amount : Math.round(amount * unit.grams * 10) / 10;
}

export function computeFoodEntry(food: Food, amount: number, unit: Unit) {
  const qty = baseQuantity(amount, unit);
  return { grams: qty, nutrients: nutrientsFor(food, qty) };
}

/** Rescale an existing entry to a new amount (keeps unknown values unknown). */
export function rescale(n: Nutrients, factor: number): Nutrients {
  const r = (v: number | null | undefined, d = 1) => (v == null ? null : Math.round(v * factor * 10 ** d) / 10 ** d);
  return { kcal: r(n.kcal, 0), protein: r(n.protein), carbs: r(n.carbs), fat: r(n.fat), fiber: r(n.fiber ?? null) };
}

export const entriesOn = (entries: FoodEntry[], date: string) => entries.filter((e) => e.date === date);

export function totalsOf(list: { nutrients: Nutrients }[]): Totals {
  return sumNutrients(list.map((e) => e.nutrients));
}

export function dayTotals(entries: FoodEntry[], date: string) {
  return totalsOf(entriesOn(entries, date));
}

/** Summary across dates: totals, per-day average over LOGGED days only (missing days ≠ 0). */
export function periodSummary(entries: FoodEntry[], dates: string[]) {
  const set = new Set(dates);
  const inRange = entries.filter((e) => set.has(e.date));
  const loggedDays = new Set(inRange.map((e) => e.date));
  const total = totalsOf(inRange);
  const n = Math.max(1, loggedDays.size);
  const avg = (v: number) => Math.round((v / n) * 10) / 10;
  return {
    total,
    loggedDays: loggedDays.size,
    days: dates.length,
    avg: { kcal: Math.round(total.kcal / n), protein: avg(total.protein), carbs: avg(total.carbs), fat: avg(total.fat), fiber: avg(total.fiber) },
  };
}

/** Foods ranked by how often they were logged (frequent foods). */
export function frequentFoodIds(entries: FoodEntry[], limit = 12) {
  const c = new Map<string, number>();
  for (const e of entries) if (e.foodId) c.set(e.foodId, (c.get(e.foodId) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}
