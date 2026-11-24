import type { Food, Nutrients, Profile } from '../data/types';

export const EMPTY: Nutrients = { kcal: null, protein: null, carbs: null, fat: null, fiber: null };
const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'] as const;

const round1 = (v: number) => Math.round(v * 10) / 10;

/** value = per100 × amount / 100 (amount in the food's basis unit; no ml↔g conversion). */
export function nutrientsFor(food: Pick<Food, 'per100'>, amount: number): Nutrients {
  if (!food.per100 || !isFinite(amount) || amount < 0) return { ...EMPTY };
  const out: Nutrients = { ...EMPTY };
  for (const k of KEYS) {
    const v = food.per100[k];
    out[k] = v == null ? null : round1((v * amount) / 100);
  }
  out.kcal = out.kcal == null ? null : Math.round(out.kcal);
  return out;
}

export type Totals = Record<(typeof KEYS)[number], number> & { partial: Record<(typeof KEYS)[number], boolean>; count: number };

/** Sum entries. A missing value is NOT zero: it marks that nutrient's total as partial. */
export function sumNutrients(list: Nutrients[]): Totals {
  const t: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, partial: { kcal: false, protein: false, carbs: false, fat: false, fiber: false }, count: list.length };
  for (const n of list) {
    for (const k of KEYS) {
      const v = n[k];
      if (v == null) t.partial[k] = true;
      else t[k] = round1(t[k] + v);
    }
  }
  t.kcal = Math.round(t.kcal);
  return t;
}

export function validateNutrients(n: Partial<Record<keyof Nutrients, string | number | null | undefined>>): { value: Nutrients; errors: string[] } {
  const errors: string[] = [];
  const out: Nutrients = { ...EMPTY };
  for (const k of KEYS) {
    const raw = n[k];
    if (raw === '' || raw == null) continue;
    const v = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
    if (!isFinite(v)) errors.push(`ערך לא תקין: ${k}`);
    else if (v < 0) errors.push('ערכים תזונתיים לא יכולים להיות שליליים');
    else if (v > 100000) errors.push('ערך גבוה מדי');
    else out[k] = v;
  }
  return { value: out, errors };
}

export const ACTIVITY_FACTORS: Record<Profile['activity'], { f: number; label: string }> = {
  sedentary: { f: 1.2, label: 'יושבני' },
  light: { f: 1.375, label: 'פעילות קלה (1–3 בשבוע)' },
  moderate: { f: 1.55, label: 'פעילות בינונית (3–5 בשבוע)' },
  active: { f: 1.725, label: 'פעיל מאוד (6–7 בשבוע)' },
  very: { f: 1.9, label: 'עבודה פיזית + אימונים' },
};

/**
 * Maintenance estimate for adults (18+) only, using Mifflin-St Jeor (1990):
 *   BMR = 10·kg + 6.25·cm − 5·age + s, s = +5 (male) / −161 (female)
 *   TDEE = BMR × activity factor
 * Returned as a ±10% range because individual variation is large.
 * No automatic deficit is applied.
 */
export function estimateMaintenance(p: { age: number | null; heightCm: number | null; weightKg: number | null; sex: 'male' | 'female' | null; activity: Profile['activity'] }) {
  if (!p.age || p.age < 18 || !p.heightCm || !p.weightKg || !p.sex) return null;
  if (p.heightCm < 120 || p.heightCm > 230 || p.weightKg < 35 || p.weightKg > 300) return null;
  const s = p.sex === 'male' ? 5 : -161;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + s;
  const tdee = bmr * ACTIVITY_FACTORS[p.activity].f;
  const mid = Math.round(tdee / 10) * 10;
  return { bmr: Math.round(bmr), mid, low: Math.round((tdee * 0.9) / 10) * 10, high: Math.round((tdee * 1.1) / 10) * 10, formula: 'Mifflin-St Jeor' };
}

/** Neutral default macro split for a given energy target (adults). */
export function defaultMacros(kcal: number, weightKg: number | null) {
  const protein = weightKg ? Math.round(weightKg * 1.6) : Math.round((kcal * 0.25) / 4);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

export const isAdult = (age: number | null | undefined) => typeof age === 'number' && age >= 18;

export const fmt = (v: number | null | undefined, unit = '') => (v == null ? '—' : `${Math.round(v * 10) / 10}${unit}`);
