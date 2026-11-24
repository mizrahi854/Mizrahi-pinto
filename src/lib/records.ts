import type { WorkoutSession } from '../data/types';

/** Best set (heaviest weight; tie → more reps) per exercise, with the session it happened in. */
export function personalRecords(sessions: WorkoutSession[]) {
  const best = new Map<string, { exerciseId: string; weight: number; reps: number; date: string; sessionId: string }>();
  const ordered = sessions.filter((s) => s.status === 'done').sort((a, b) => a.startedAt - b.startedAt);
  for (const s of ordered) {
    for (const e of s.exercises) {
      for (const st of e.sets) {
        if (!st.done || st.weight == null || st.weight <= 0) continue;
        const cur = best.get(e.exerciseId);
        if (!cur || st.weight > cur.weight || (st.weight === cur.weight && st.reps > cur.reps)) {
          best.set(e.exerciseId, { exerciseId: e.exerciseId, weight: st.weight, reps: st.reps, date: s.date, sessionId: s.id });
        }
      }
    }
  }
  return [...best.values()];
}

/** Consecutive weeks (ending this week) with at least one completed workout. */
export function weeklyConsistency(sessions: WorkoutSession[], weeksBack = 12) {
  const now = new Date();
  const startOfWeek = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x.getTime(); };
  const done = sessions.filter((s) => s.status === 'done').map((s) => startOfWeek(new Date(s.startedAt)));
  let streak = 0;
  for (let i = 0; i < weeksBack; i++) {
    const w = startOfWeek(new Date(now.getTime() - i * 7 * 86400000));
    if (done.includes(w)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
