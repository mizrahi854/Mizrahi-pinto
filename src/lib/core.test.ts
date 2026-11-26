/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nutrientsFor, sumNutrients, validateNutrients, estimateMaintenance, isAdult, defaultMacros } from './nutrition';
import { dateKey, addDays, diffDays, weekOf, parseKey } from './dates';
import { searchLocal , editDistance, norm } from './search';
import { STARTER_FOODS } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { recipeNutrients } from './recipes';
import { challengeStats } from './challenge';
import { aggregate } from './stats';
import type { Challenge, FoodEntry, PlannedWorkout } from '../data/types';
import { nextWorkout, missedWorkouts, fromTemplate, copyWeek, buildTemplate, whenLabel, workoutWeekStats } from './workouts';
import { migrateState, tracksCalories } from '../store/defaults';
import { TZAMERET_FOODS } from '../data/tzameret';
import { parseMealText } from './describe';

import { unitsFor, baseQuantity, computeFoodEntry, rescale, periodSummary, frequentFoodIds } from './engine';

test('per-100 scaling: value = per100 × amount / 100', () => {
  const n = nutrientsFor({ per100: { kcal: 95, protein: 11, carbs: 1.5, fat: 5, fiber: null } }, 250);
  assert.equal(n.kcal, 238);
  assert.equal(n.protein, 27.5);
  assert.equal(n.carbs, 3.8);
  assert.equal(n.fiber, null, 'missing stays missing');
});

test('unknown food values never become zero', () => {
  const n = nutrientsFor({ per100: null }, 100);
  assert.deepEqual(n, { kcal: null, protein: null, carbs: null, fat: null, fiber: null });
  const t = sumNutrients([{ kcal: 100, protein: 10, carbs: null, fat: 1 }, { kcal: null, protein: 5, carbs: 3, fat: null }]);
  assert.equal(t.kcal, 100);
  assert.equal(t.partial.kcal, true);
  assert.equal(t.partial.protein, false);
  assert.equal(t.protein, 15);
});

test('negative / invalid inputs are rejected', () => {
  assert.equal(nutrientsFor({ per100: { kcal: 100, protein: 1, carbs: 1, fat: 1 } }, -5).kcal, null);
  assert.ok(validateNutrients({ kcal: '-3' }).errors.length > 0);
  assert.ok(validateNutrients({ kcal: 'abc' }).errors.length > 0);
  assert.equal(validateNutrients({ kcal: '', protein: '12,5' }).value.protein, 12.5);
  assert.equal(validateNutrients({ kcal: '' }).value.kcal, null);
});

test('maintenance estimate is adults-only and returns a range', () => {
  assert.equal(estimateMaintenance({ age: 16, heightCm: 170, weightKg: 60, sex: 'male', activity: 'moderate' }), null);
  const e = estimateMaintenance({ age: 30, heightCm: 180, weightKg: 80, sex: 'male', activity: 'moderate' })!;
  // Mifflin: 10*80 + 6.25*180 - 5*30 + 5 = 1780 ; ×1.55 = 2759
  assert.equal(e.bmr, 1780);
  assert.equal(e.mid, 2760);
  assert.ok(e.low < e.mid && e.mid < e.high);
  assert.equal(isAdult(17), false);
  assert.equal(isAdult(18), true);
  const m = defaultMacros(2000, 70);
  assert.ok(m.protein * 4 + m.carbs * 4 + m.fat * 9 <= 2010);
});

test('dates: local keys, midnight-safe arithmetic, Sunday weeks', () => {
  assert.equal(dateKey(new Date(2026, 0, 31, 23, 59)), '2026-01-31');
  assert.equal(dateKey(new Date(2026, 1, 1, 0, 0)), '2026-02-01');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(diffDays('2026-01-01', '2026-01-31'), 30);
  const w = weekOf('2026-11-25');
  assert.equal(parseKey(w[0]!).getDay(), 0);
  assert.equal(w.length, 7);
});

test('starter food list: 108 items, unique ids, honest values', () => {
  assert.equal(STARTER_FOODS.length, 108);
  assert.equal(new Set(STARTER_FOODS.map((f) => f.id)).size, 108);
  for (const f of STARTER_FOODS) {
    assert.equal(f.verified, false, `${f.name} must not claim verification`);
    assert.equal(f.barcode, undefined, `${f.name} must not have an invented barcode`);
    if (f.per100) for (const v of Object.values(f.per100)) assert.ok(v == null || v >= 0);
  }
  for (const n of ['שייק חלבון וניל', 'יוגורט GO', 'יוגורט PRO', 'חטיף חלבון']) {
    assert.equal(STARTER_FOODS.find((f) => f.name === n)!.per100, null, `${n} is branded → no invented values`);
  }
});

test('recipes reference existing foods', () => {
  for (const r of RECIPES) for (const i of r.ingredients) assert.ok(STARTER_FOODS.some((f) => f.id === i.foodId), `${r.id} → ${i.foodId}`);
  assert.ok(recipeNutrients(RECIPES[0]!).kcal > 0);
  assert.equal(STARTER_FOODS.find((f) => f.id === 'f057')!.name, 'שיבולת שועל');
});

test('search: Hebrew, English, prefix ranking', () => {
  const r = searchLocal(STARTER_FOODS, 'קוטג');
  assert.ok(r.length >= 3 && r[0]!.name.startsWith('קוטג'));
  assert.ok(searchLocal(STARTER_FOODS, 'banana')[0]!.name === 'בננה');
  assert.equal(searchLocal(STARTER_FOODS, 'zzzz').length, 0);
});

test('challenge: rest days do not break streak, no punishment', () => {
  const today = '2026-11-10';
  const c: Challenge = { id: 'x', name: 'n', startDate: '2026-11-01', endDate: '2026-11-30', tasks: [{ id: 't', title: 'a' }], log: { '2026-11-08': ['t'], '2026-11-10': ['t'] }, restDays: ['2026-11-09'], notes: {} };
  const s = challengeStats(c, today);
  assert.equal(s.streak, 2);
  assert.equal(s.left, 20);
  assert.equal(s.fullDays, 2);
  assert.ok(s.points >= 0);
});

test('aggregate ignores missing days', () => {
  const a = aggregate([{ value: 100 }, { value: null }, { value: 300 }]);
  assert.equal(a.avg, 200);
  assert.equal(a.count, 2);
});

test('engine: units, grams/portions/package, no ml↔g conversion', () => {
  const cottage = STARTER_FOODS.find((f) => f.id === 'f002')!;
  const u = unitsFor({ ...cottage, packageSize: 750 });
  assert.equal(u[0]!.grams, null);
  assert.ok(u.some((x) => x.label === 'אריזה שלמה' && x.grams === 750));
  assert.equal(baseQuantity(2, { label: 'גביע', grams: 250 }), 500);
  assert.equal(baseQuantity(150, { label: 'ג׳', grams: null }), 150);
  const e = computeFoodEntry(cottage, 1.5, { label: 'גביע', grams: 250 });
  assert.equal(e.grams, 375);
  assert.equal(e.nutrients.kcal, 356); // 95 × 3.75
  const milk = STARTER_FOODS.find((f) => f.basis === 'ml')!;
  assert.equal(computeFoodEntry(milk, 200, { label: 'מ״ל', grams: null }).grams, 200);
});

test('engine: rescale keeps unknowns unknown; period average ignores missing days', () => {
  const r = rescale({ kcal: 100, protein: 10, carbs: null, fat: 2.5, fiber: null }, 1.5);
  assert.deepEqual(r, { kcal: 150, protein: 15, carbs: null, fat: 3.8, fiber: null });
  const mk = (date: string, kcal: number | null): FoodEntry => ({ id: date + kcal, date, meal: 'lunch', name: 'x', amount: 1, unitLabel: 'מנה', grams: null, nutrients: { kcal, protein: 1, carbs: 1, fat: 1 }, time: '12:00', createdAt: 0, foodId: kcal ? 'f001' : 'f002' });
  const p = periodSummary([mk('2026-01-01', 1000), mk('2026-01-03', 2000), mk('2026-01-03', null)], ['2026-01-01', '2026-01-02', '2026-01-03']);
  assert.equal(p.loggedDays, 2);
  assert.equal(p.avg.kcal, 1500);
  assert.equal(p.total.partial.kcal, true);
  assert.deepEqual(frequentFoodIds([mk('a', 1), mk('b', 1), mk('c', null)]), ['f001', 'f002']);
});

test('search: typo tolerance, finals, brand and barcode', () => {
  assert.equal(norm('שוֹקוֹלָד'), 'שוקולד');
  assert.equal(norm('לחם'), 'לחמ');
  assert.ok(editDistance('קוטגג', 'קוטג') <= 1);
  assert.equal(searchLocal(STARTER_FOODS, 'בננא')[0]?.name, 'בננה');
  assert.equal(searchLocal(STARTER_FOODS, 'חזה עופ')[0]?.name.startsWith('חזה עוף'), true);
  const withBrand = [{ ...STARTER_FOODS[0]!, id: 'x', name: 'יוגורט', brand: 'דנונה', barcode: '7290000000001' }];
  assert.equal(searchLocal(withBrand, 'דנונה').length, 1);
  assert.equal(searchLocal(withBrand, '72900000').length, 1);
});

const W = (id: string, date: string, time: string | null, extra: Partial<PlannedWorkout> = {}): PlannedWorkout => ({ id, date, time, name: id, muscles: ['chest'], status: 'planned', ...extra });

test('workouts: next workout skips done/rest/old ones; missed ones are offered', () => {
  const now = new Date(2026, 10, 26, 10, 0); // Thu 26 Nov 2026 10:00
  const list = [
    W('old', '2026-11-24', '05:00'),
    W('done', '2026-11-26', '12:00', { status: 'done' }),
    W('rest', '2026-11-26', null, { rest: true }),
    W('tomorrow', '2026-11-27', '05:00'),
    W('later', '2026-11-26', '18:00'),
  ];
  assert.equal(nextWorkout(list, now)?.id, 'later');
  assert.deepEqual(missedWorkouts(list, now).map((w) => w.id), ['old']);
  assert.equal(nextWorkout([W('a', '2026-11-26', '08:30')], now)?.id, 'a', 'still shown within 3h grace');
  assert.equal(whenLabel(W('x', '2026-11-27', '05:00'), '2026-11-26'), 'מחר | 05:00 בבוקר');
});

test('workouts: template fills free days only; copy week resets status; stats', () => {
  const t = buildTemplate([0, 2, 4], ['chest', 'biceps', 'back', 'triceps', 'legs'], '05:00');
  assert.equal(t.length, 7);
  assert.deepEqual(t.filter((x) => !x.rest).map((x) => x.name), ['חזה ויד קדמית', 'גב ויד אחורית', 'רגליים']);
  const existing = [W('mine', '2026-11-22', '07:00')];
  const filled = fromTemplate(t, '2026-11-22', existing);
  assert.ok(!filled.some((w) => w.date === '2026-11-22'), 'does not overwrite a day the user planned');
  assert.equal(filled.length, 6);
  const copies = copyWeek([W('d', '2026-11-23', '05:00', { status: 'done' })], '2026-11-22');
  assert.equal(copies[0]!.date, '2026-11-30');
  assert.equal(copies[0]!.status, 'planned');
  assert.deepEqual(workoutWeekStats([W('a', '2026-11-23', null, { status: 'done' }), W('b', '2026-11-24', null), W('r', '2026-11-25', null, { rest: true })], '2026-11-22'), { planned: 2, done: 1, skipped: 0 });
});

test('migration v1→v2 keeps entries and converts sessions, schedule and meal plan', () => {
  const v1 = {
    profile: { name: 'א', age: 30, targetMode: 'calculated', trainingTime: '05:00' },
    entries: [{ id: 'e1', date: '2026-11-01', meal: 'lunch', name: 'x', amount: 1, unitLabel: 'מנה', grams: null, nutrients: { kcal: 100, protein: 1, carbs: 1, fat: 1 }, time: '12:00', createdAt: 1 }],
    sessions: [{ id: 's1', planId: 'push', name: 'Push', date: '2026-11-02', startedAt: 0, endedAt: 3600000, pausedMs: 0, status: 'done', exercises: [] }, { id: 's2', planId: 'pull', date: '2026-11-03', status: 'active' }],
    schedule: { 0: 'push', 1: 'rest', 2: 'pull' },
    mealPlan: { '2026-11-05': { lunch: RECIPES[0]!.id } },
    challenges: [{ id: 'c' }],
  };
  const v2 = migrateState(v1, 1);
  assert.equal(v2.entries.length, 1);
  assert.equal(v2.challenges.length, 1);
  assert.equal(v2.workouts.length, 1);
  assert.equal(v2.workouts[0].status, 'done');
  assert.equal(v2.workouts[0].durationMin, 60);
  assert.equal(v2.template[0].time, '05:00');
  assert.ok(v2.template[1].rest);
  assert.equal(v2.plannedMeals[0].title, RECIPES[0]!.name);
  assert.equal(v2.sessions, undefined);
  assert.equal(v2.profile.trackCalories, true);
  assert.equal(tracksCalories({ age: 16, trackCalories: true, targetMode: 'calculated' }), false, 'minors never track calories');
});

test('Tzameret: official values, portions, Israeli & Shabbat dishes', () => {
  assert.ok(TZAMERET_FOODS.length > 4000);
  for (const f of TZAMERET_FOODS) {
    assert.ok(f.per100 && f.per100.kcal != null && f.per100.kcal >= 0, f.name);
    assert.equal(f.verified, true);
  }
  for (const q of ['חמין', 'קובה', 'חלה', 'קוסקוס', 'מפרום', 'גפילטע']) assert.ok(searchLocal(TZAMERET_FOODS, q).length > 0, q);
  const egg = TZAMERET_FOODS.find((f) => f.name === 'ביצה שלמה בלי קליפה')!;
  assert.ok(egg.portions.some((p) => p.label === 'יחידה בינונית' && p.grams === 49.5));
});

test('free-text meal description is matched locally (no AI) with quantities', () => {
  const foods = [...STARTER_FOODS, ...TZAMERET_FOODS];
  const r = parseMealText('2 ביצים, 150 גרם אורז וחצי פיתה', foods);
  assert.equal(r.length, 3);
  assert.equal(r[0]!.amount, 2);
  assert.ok(r[0]!.food?.name.includes('ביצ'));
  assert.equal(r[1]!.grams, 150);
  assert.equal(r[2]!.amount, 0.5);
  assert.ok(parseMealText('', foods).length === 0);
  const unknown = parseMealText('קסםבלבל', foods);
  assert.equal(unknown[0]!.food, null, 'no guess when nothing matches');
});

test('calculators: adult BMI only, portion conversion', async () => {
  const { bmiAdult, gramsToPortions } = await import('./nutrition');
  assert.deepEqual(bmiAdult({ age: 30, heightCm: 180, weightKg: 81 }), { value: 25, category: 'עודף משקל' });
  assert.equal(bmiAdult({ age: 15, heightCm: 170, weightKg: 60 }), null, 'no adult BMI category for minors');
  assert.equal(gramsToPortions(150, 49.5), 3.03);
});
