/**
 * Simple weekly training engine (pure functions – unit tested).
 * A workout = name + muscle groups + day/time (+ optional duration, notes) + completion status.
 */
import type { MuscleGroup, PlannedWorkout, WorkoutTemplate } from '../data/types';
import { addDays, dateKey, nowTime, uid, weekOf, parseKey, DAY_LONG } from './dates';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'חזה', back: 'גב', shoulders: 'כתפיים', legs: 'רגליים', biceps: 'יד קדמית', triceps: 'יד אחורית',
  abs: 'בטן', cardio: 'אירובי', full: 'גוף מלא', glutes: 'ישבן', mobility: 'גמישות',
};

export type WorkoutPreset = { key: string; name: string; muscles: MuscleGroup[]; rest?: boolean };
export const WORKOUT_PRESETS: WorkoutPreset[] = [
  { key: 'chest_bi', name: 'חזה ויד קדמית', muscles: ['chest', 'biceps'] },
  { key: 'back_tri', name: 'גב ויד אחורית', muscles: ['back', 'triceps'] },
  { key: 'shoulders', name: 'כתפיים', muscles: ['shoulders'] },
  { key: 'legs', name: 'רגליים', muscles: ['legs', 'glutes'] },
  { key: 'abs', name: 'בטן', muscles: ['abs'] },
  { key: 'cardio', name: 'אירובי', muscles: ['cardio'] },
  { key: 'full', name: 'אימון גוף מלא', muscles: ['full'] },
  { key: 'rest', name: 'יום מנוחה', muscles: [], rest: true },
  { key: 'custom', name: 'אימון בהתאמה אישית', muscles: [] },
];

/** Start of a planned workout as a Date (no time → end of that day, so it stays "upcoming" all day). */
export const workoutStart = (w: Pick<PlannedWorkout, 'date' | 'time'>) => {
  const d = parseKey(w.date);
  if (w.time) {
    const [h, m] = w.time.split(':').map(Number);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
  } else d.setHours(23, 59, 0, 0);
  return d;
};

const sortWorkouts = (a: PlannedWorkout, b: PlannedWorkout) => workoutStart(a).getTime() - workoutStart(b).getTime();

/**
 * Next workout to show on Home: the earliest planned (non-rest, not done/skipped) workout that has not
 * passed by more than 3 hours. Workouts further in the past are "missed" and offered for reschedule.
 */
export function nextWorkout(list: PlannedWorkout[], now = new Date()): PlannedWorkout | null {
  const grace = now.getTime() - 3 * 3600_000;
  return [...list].filter((w) => !w.rest && w.status === 'planned' && workoutStart(w).getTime() >= grace).sort(sortWorkouts)[0] ?? null;
}

/** Planned workouts in the last 7 days that were neither completed nor skipped. */
export function missedWorkouts(list: PlannedWorkout[], now = new Date()) {
  const grace = now.getTime() - 3 * 3600_000;
  const from = addDays(dateKey(now), -7);
  return list.filter((w) => !w.rest && w.status === 'planned' && w.date >= from && workoutStart(w).getTime() < grace).sort(sortWorkouts);
}

/** "מחר | 05:00 בבוקר" style label. */
export function whenLabel(w: Pick<PlannedWorkout, 'date' | 'time'>, today = dateKey()) {
  const day = w.date === today ? 'היום' : w.date === addDays(today, 1) ? 'מחר' : `יום ${DAY_LONG[parseKey(w.date).getDay()]}`;
  if (!w.time) return day;
  const h = Number(w.time.split(':')[0]);
  const part = h < 12 ? 'בבוקר' : h < 17 ? 'בצהריים' : h < 21 ? 'בערב' : 'בלילה';
  return `${day} | ${w.time} ${part}`;
}

/** Instances for one week from the recurring template (skips weekdays that already have something). */
export function fromTemplate(template: WorkoutTemplate[], weekStart: string, existing: PlannedWorkout[]): PlannedWorkout[] {
  const days = weekOf(weekStart);
  const taken = new Set(existing.map((w) => w.date));
  const out: PlannedWorkout[] = [];
  for (const t of template) {
    const date = days[t.day];
    if (!date || taken.has(date)) continue;
    out.push({ id: uid(), date, time: t.time, name: t.name, muscles: t.muscles, rest: t.rest, durationMin: t.durationMin ?? null, status: 'planned', fromTemplate: true });
  }
  return out;
}

/** Copy one week's workouts to the following week (status reset, notes kept). */
export function copyWeek(list: PlannedWorkout[], weekStart: string): PlannedWorkout[] {
  const days = new Set(weekOf(weekStart));
  return list.filter((w) => days.has(w.date)).map((w) => ({ ...w, id: uid(), date: addDays(w.date, 7), status: 'planned' as const, doneAt: undefined, fromTemplate: false }));
}

/** Template from a set of training weekdays and the muscle groups the user trains. */
export function buildTemplate(days: number[], groups: MuscleGroup[], time: string | null): WorkoutTemplate[] {
  const sorted = [...days].sort();
  const want = (k: string) => WORKOUT_PRESETS.find((p) => p.key === k)!;
  let rotation: WorkoutPreset[];
  const has = (m: MuscleGroup) => groups.includes(m);
  if (!groups.length || sorted.length <= 2 || has('full')) rotation = [want('full')];
  else {
    rotation = [];
    if (has('chest') || has('biceps')) rotation.push(want('chest_bi'));
    if (has('back') || has('triceps')) rotation.push(want('back_tri'));
    if (has('legs') || has('glutes')) rotation.push(want('legs'));
    if (has('shoulders')) rotation.push(want('shoulders'));
    if (has('abs')) rotation.push(want('abs'));
    if (has('cardio')) rotation.push(want('cardio'));
    if (!rotation.length) rotation = [want('full')];
  }
  const out: WorkoutTemplate[] = [];
  for (let d = 0; d < 7; d++) {
    const idx = sorted.indexOf(d);
    if (idx === -1) out.push({ day: d, name: 'יום מנוחה', muscles: [], time: null, rest: true });
    else {
      const p = rotation[idx % rotation.length]!;
      out.push({ day: d, name: p.name, muscles: p.muscles, time, durationMin: 60 });
    }
  }
  return out;
}

/** Weekly plan vs actual for workouts. */
export function workoutWeekStats(list: PlannedWorkout[], weekStart: string) {
  const days = new Set(weekOf(weekStart));
  const wk = list.filter((w) => days.has(w.date) && !w.rest);
  return { planned: wk.length, done: wk.filter((w) => w.status === 'done').length, skipped: wk.filter((w) => w.status === 'skipped').length };
}

export const isNowPast = (w: PlannedWorkout) => workoutStart(w).getTime() < Date.now();
export const nowHHMM = nowTime;
