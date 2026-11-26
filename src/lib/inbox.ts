import { useMemo } from 'react';
import { useApp } from '@/store/useApp';
import { useDay, useNextWorkout } from '@/store/selectors';
import { addDays, dateKey, weekOf } from './dates';
import { whenLabel } from './workouts';
import type { IconName } from '@/components/Icon';

export type InboxItem = { id: string; icon: IconName; title: string; sub: string; href: any; priority: number };

/** In-app notifications generated only from the user's real data (no fake messages). Highest priority first. */
export function useInbox(): InboxItem[] {
  const today = dateKey();
  const day = useDay(today);
  const { next, missed } = useNextWorkout();
  const events = useApp((s) => s.events);
  const shabbat = useApp((s) => s.shabbat);
  const workouts = useApp((s) => s.workouts);
  const challenges = useApp((s) => s.challenges);
  const reminders = useApp((s) => s.reminders);
  const muted = useApp((s) => s.settings.muted);
  return useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const wd = now.getDay();
    const out: InboxItem[] = [];
    for (const w of missed.slice(0, 2)) out.push({ id: `missed-${w.id}`, icon: 'dumbbell', title: `${w.name} לא סומן`, sub: 'הושלם? אפשר לסמן, לדחות או לבטל', href: { pathname: '/workout', params: { id: w.id } }, priority: 90 });
    if (next && (next.date === today || next.date === addDays(today, 1))) out.push({ id: `next-${next.id}`, icon: 'bolt', title: `האימון הבא: ${next.name}`, sub: whenLabel(next), href: { pathname: '/workout', params: { id: next.id } }, priority: 70 });
    for (const e of events.filter((x) => x.type === 'restaurant' && (x.date === today || x.date === addDays(today, 1)))) {
      out.push({ id: `rest-${e.id}`, icon: 'food', title: `${e.date === today ? 'היום' : 'מחר'}: ${e.title}`, sub: e.dishIds?.length ? 'המנה כבר נבחרה מראש' : 'אפשר לבחור מנה מראש', href: { pathname: '/restaurant', params: { event: e.id } }, priority: 75 });
    }
    if (day.list.length === 0 && h >= 11 && h < 23) out.push({ id: 'no-meals', icon: 'bowl', title: 'עוד לא תועדו ארוחות היום', sub: 'תזכורת עדינה – רק אם מתאים לך', href: '/add-meal', priority: 40 });
    const ws = weekOf(today)[0]!;
    if ((wd === 4 || wd === 5) && !shabbat.appliedWeeks.includes(ws)) out.push({ id: 'shabbat', icon: 'star', title: 'תוכנית שישי-שבת', sub: 'ארוחות, אימון ורשימת קניות לסוף השבוע', href: '/shabbat', priority: 60 });
    if (wd === 6 && h >= 17) {
      const nextWs = addDays(ws, 7);
      if (!workouts.some((w) => weekOf(nextWs).includes(w.date))) out.push({ id: 'plan-week', icon: 'calendar', title: 'שבוע חדש מתחיל', sub: 'כמה דקות לתכנון אימונים וארוחות', href: '/(tabs)/plan', priority: 55 });
    }
    for (const c of challenges.filter((x) => !x.finished && x.startDate <= today && x.endDate >= today)) {
      const done = c.log[today]?.length ?? 0;
      if (done < c.tasks.length) out.push({ id: `ch-${c.id}`, icon: 'trophy', title: c.name, sub: `${done}/${c.tasks.length} משימות היום`, href: `/victory/${c.id}`, priority: 30 });
    }
    // reminders due in the last 3 hours (in-app delivery; on the web this is the only delivery)
    if (!muted) {
      const nowMin = h * 60 + now.getMinutes();
      for (const r of reminders.filter((x) => x.enabled && x.days.includes(wd))) {
        const [rh, rm] = r.time.split(':').map(Number);
        const t = (rh ?? 0) * 60 + (rm ?? 0);
        if (t <= nowMin && nowMin - t <= 180) out.push({ id: `rem-${r.id}`, icon: 'bell', title: r.title, sub: `תזכורת ל-${r.time}`, href: r.type === 'did_train' || r.type === 'workout' ? '/(tabs)/plan' : r.type === 'meal' ? '/add-meal' : r.type === 'shabbat_prep' ? '/shabbat' : r.type === 'plan_week' ? '/(tabs)/plan' : r.type === 'restaurant' ? '/restaurant' : '/alarm', priority: 65 });
      }
    }
    return out.sort((a, b) => b.priority - a.priority);
  }, [today, day.list.length, next, missed, events, shabbat.appliedWeeks, workouts, challenges, reminders, muted]);
}
