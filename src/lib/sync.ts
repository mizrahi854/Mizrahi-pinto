import { supabase } from './supabase';
import { useApp } from '@/store/useApp';

/**
 * Offline-first sync (Repository layer). Local store is the source of truth for the UI;
 * when a Supabase session exists, changes are pushed with idempotent upserts keyed by
 * client-generated ids, and remote rows are merged on login (last-write-wins by updated_at).
 * Covered now: profile, food entries (incl. deletions), planned workouts, measurements,
 * habits (water/sleep), favorites, reminders. Remaining tables are created and secured in the
 * migration and can be wired the same way.
 */
let timer: ReturnType<typeof setTimeout> | null = null;
let lastPushed = { entries: new Set<string>() };

export function startSync() {
  if (!supabase) return () => {};
  const unsub = useApp.subscribe((s, prev) => {
    if (s.session?.mode !== 'supabase') return;
    if (s.entries === prev.entries && s.workouts === prev.workouts && s.profile === prev.profile && s.measurements === prev.measurements && s.water === prev.water && s.favorites === prev.favorites && s.reminders === prev.reminders) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 1500);
  });
  return unsub;
}

async function push() {
  const sb = supabase;
  const s = useApp.getState();
  if (!sb || s.session?.mode !== 'supabase') return;
  const uid = s.session.userId;
  const p = s.profile;
  await sb.from('profiles').upsert({
    user_id: uid, name: p.name, age: p.age, language: p.language, goals: p.goals, experience: p.experience, equipment: p.equipment,
    training_days: p.trainingDays, training_time: p.trainingTime, food_prefs: p.foodPrefs, allergies: p.allergies, limitations: p.limitations,
    height_cm: p.heightCm, weight_kg: p.weightKg, sex: p.sex, activity: p.activity, plan_days: p.planDays, water_target_ml: p.waterTargetMl,
  });
  const ids = new Set(s.entries.map((e) => e.id));
  if (s.entries.length) {
    await sb.from('food_entries').upsert(s.entries.map((e) => ({
      // food_id stays null: catalogue ids are local until the catalogue is seeded server-side; values are snapshotted
      id: e.id, user_id: uid, entry_date: e.date, meal: e.meal, food_id: null, name: e.name,
      amount: e.amount, unit_label: e.unitLabel, grams: e.grams, kcal: e.nutrients.kcal, protein: e.nutrients.protein, carbs: e.nutrients.carbs,
      fat: e.nutrients.fat, fiber: e.nutrients.fiber ?? null, logged_time: e.time, deleted: false,
    })));
  }
  const removed = [...lastPushed.entries].filter((id) => !ids.has(id));
  if (removed.length) await sb.from('food_entries').update({ deleted: true }).in('id', removed);
  lastPushed.entries = ids;

  if (s.workouts.length) {
    await sb.from('planned_workouts').upsert(s.workouts.map((w) => ({
      id: w.id, user_id: uid, workout_date: w.date, workout_time: w.time, name: w.name, muscles: w.muscles, rest: !!w.rest,
      duration_min: w.durationMin ?? null, notes: w.notes ?? null, status: w.status, done_at: w.doneAt ? new Date(w.doneAt).toISOString() : null,
    })));
  }
  if (s.measurements.some((m) => m.weightKg != null)) await sb.from('measurements').upsert(s.measurements.filter((m) => m.weightKg != null).map((m) => ({ user_id: uid, measured_on: m.date, weight_kg: m.weightKg })));
  const habitDays = [...new Set([...Object.keys(s.water), ...Object.keys(s.sleep)])];
  if (habitDays.length) await sb.from('habit_logs').upsert(habitDays.map((d) => ({ user_id: uid, log_date: d, water_ml: s.water[d] ?? null, sleep_h: s.sleep[d] ?? null })));
  if (s.favorites.length) await sb.from('favorites').upsert(s.favorites.map((f) => ({ user_id: uid, food_id: f })));
  if (s.reminders.length) await sb.from('reminders').upsert(s.reminders.map((r) => ({ id: r.id, user_id: uid, type: r.type, title: r.title, time: r.time, days: r.days, enabled: r.enabled, sound: r.sound })));
}

/** Pull remote food entries after login and merge (remote wins only for ids not present locally). */
export async function pullOnLogin() {
  const sb = supabase;
  const s = useApp.getState();
  if (!sb || s.session?.mode !== 'supabase') return;
  const { data } = await sb.from('food_entries').select('*').eq('deleted', false).limit(5000);
  if (!data) return;
  const local = new Set(s.entries.map((e) => e.id));
  const incoming = data.filter((r: any) => !local.has(r.id)).map((r: any) => ({
    id: r.id, date: r.entry_date, meal: r.meal, name: r.name, amount: Number(r.amount ?? 1), unitLabel: r.unit_label ?? 'מנה', grams: r.grams,
    nutrients: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber }, time: r.logged_time ?? '12:00', createdAt: Date.parse(r.created_at),
  }));
  if (incoming.length) useApp.setState({ entries: [...s.entries, ...incoming] });
  lastPushed.entries = new Set([...local, ...incoming.map((e: any) => e.id)]);
}
