import type { Challenge } from '../data/types';
import { addDays, dateKey, diffDays } from './dates';

export function challengeStats(c: Challenge, today = dateKey()) {
  const total = Math.max(1, diffDays(c.startDate, c.endDate) + 1);
  const elapsed = Math.max(0, Math.min(total, diffDays(c.startDate, today) + 1));
  const left = Math.max(0, diffDays(today, c.endDate));
  const fullDays = Object.entries(c.log).filter(([d, t]) => d <= today && t.length >= c.tasks.length && c.tasks.length > 0).length;
  const activeDays = Object.entries(c.log).filter(([d, t]) => d <= today && t.length > 0).length;
  const tasksDone = Object.values(c.log).reduce((m, t) => m + t.length, 0);
  // streak counts rest days as neutral (they don't break it) – no punishment for a missed day either way
  let streak = 0;
  for (let i = 0; i < total; i++) {
    const d = addDays(today, -i);
    if (d < c.startDate) break;
    if (c.restDays.includes(d)) continue;
    if ((c.log[d]?.length ?? 0) > 0) streak++;
    else if (i > 0) break;
  }
  const points = tasksDone * 10 + fullDays * 20;
  return { total, elapsed, left, fullDays, activeDays, tasksDone, streak, points, progress: elapsed / total };
}

export const ACHIEVEMENTS = [
  { id: 'first', title: 'צעד ראשון', test: (s: ReturnType<typeof challengeStats>) => s.tasksDone >= 1 },
  { id: 'full', title: 'יום מלא', test: (s: ReturnType<typeof challengeStats>) => s.fullDays >= 1 },
  { id: 's3', title: 'רצף 3 ימים', test: (s: ReturnType<typeof challengeStats>) => s.streak >= 3 },
  { id: 's7', title: 'שבוע של התמדה', test: (s: ReturnType<typeof challengeStats>) => s.streak >= 7 },
  { id: 'half', title: 'חצי הדרך', test: (s: ReturnType<typeof challengeStats>) => s.progress >= 0.5 },
  { id: 'p500', title: '500 נקודות התמדה', test: (s: ReturnType<typeof challengeStats>) => s.points >= 500 },
];
