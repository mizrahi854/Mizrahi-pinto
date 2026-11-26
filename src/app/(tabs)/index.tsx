import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';
import { useApp } from '@/store/useApp';
import { useDay, useWeek, useNextWorkout, useMeals } from '@/store/selectors';
import { HeroBackdrop, LogoMark, useScreenWidth } from '@/components/Brand';
import { Glass, GlassIcon, ProgressRing, Bar } from '@/components/glass';
import { useCountUp } from '@/components/DotMatrix';
import { Tap, Sheet, ListItem, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { colors, fonts, space } from '@/theme/tokens';
import { dateKey, greeting, addDays, DAY_SHORT, prettyDate, weekOf } from '@/lib/dates';
import { challengeStats } from '@/lib/challenge';
import { MEAL_PHOTO, ANATOMY } from '@/data/media';
import { whenLabel, MUSCLE_LABELS } from '@/lib/workouts';
import { restaurantLabel } from '@/lib/restaurants';
import { useInbox } from '@/lib/inbox';
import { haptic } from '@/lib/haptics';
import type { PlannedWorkout } from '@/data/types';

const SUB = ['מוכנים לעוד יום של התקדמות?', 'צעד קטן היום, הרגל גדול מחר.', 'מה בתוכנית להיום?'];

/** Home – approved "625" composition: blurred figure, centred logo, glass gauge card, next workout, today's meals, week, shortcuts. */
export default function Home() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const today = dateKey();
  const day = useDay(today);
  const week = useWeek(today);
  const meals = useMeals();
  const profile = useApp((st) => st.profile);
  const challenges = useApp((st) => st.challenges);
  const events = useApp((st) => st.events);
  const shabbat = useApp((st) => st.shabbat);
  const reminders = useApp((st) => st.reminders);
  const water = useApp((st) => st.water[today] ?? 0);
  const addWater = useApp((st) => st.addWater);
  const complete = useApp((st) => st.completeWorkout);
  const reopen = useApp((st) => st.reopenWorkout);
  const { next, missed } = useNextWorkout();
  const inbox = useInbox();
  const [resched, setResched] = useState<PlannedWorkout | null>(null);

  const t = day.target;
  const consumed = day.totals.kcal;
  const hour = new Date().getHours();
  const firstName = profile.name.trim().split(' ')[0];

  // centre metric: remaining calories (adult tracking) – otherwise a routine metric that never limits eating
  const metric = day.hasTarget
    ? { value: Math.max(0, day.remaining!), label: 'קלוריות נשארו', sub: `מתוך ${t.calorieTarget!.toLocaleString()}`, progress: consumed / t.calorieTarget!, icon: 'flame' as IconName, over: day.remaining! < 0 ? Math.abs(day.remaining!) : 0 }
    : day.calories
      ? { value: consumed, label: 'קלוריות היום', sub: 'מעקב ללא יעד', progress: Math.min(1, day.mealsLogged / 4), icon: 'flame' as IconName, over: 0 }
      : { value: day.mealsLogged, label: 'ארוחות היום', sub: 'שגרה, לא הגבלה', progress: Math.min(1, day.mealsLogged / 4), icon: 'bowl' as IconName, over: 0 };
  const shown = useCountUp(metric.over || metric.value);

  const outing = useMemo(() => events.filter((e) => e.type === 'restaurant' && e.date >= today).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))[0], [events, today]);
  const ws = weekOf(today)[0]!;
  const challenge = challenges.find((c) => !c.finished);
  const cs = challenge ? challengeStats(challenge) : null;
  const nextReminder = reminders.filter((r) => r.enabled).map((r) => r.time).sort()[0];
  const waterTarget = profile.waterTargetMl || 3000;

  const done = (wk: PlannedWorkout) => {
    complete(wk.id);
    haptic.success();
    toast(`${wk.name} הושלם ✓`, { label: 'ביטול', onPress: () => reopen(wk.id) });
  };
  const enter = (i: number) => (reduce ? undefined : FadeInDown.delay(60 * i).duration(420));

  return (
    <View style={s.root}>
      <View style={[s.inner, { width: w }]}>
        <HeroBackdrop height={insets.top + 420} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}>
          {/* ---------- TOP BAR ---------- */}
          <View style={[s.top, { paddingTop: insets.top + 12 }]}>
            <GlassIcon icon="user" label="פרופיל" onPress={() => router.push('/(tabs)/profile')} />
            <View style={s.logo} accessible accessibilityRole="header" accessibilityLabel="MIZRAHI PINTO">
              <LogoMark size={46} />
              <Text style={s.logoText}>MIZRAHI{'\n'}PINTO</Text>
            </View>
            <GlassIcon icon="bell" label={`התראות${inbox.length ? `, ${inbox.length} חדשות` : ''}`} dot={inbox.length > 0} onPress={() => router.push('/notifications')} />
          </View>

          <View style={s.greet}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={hour >= 6 && hour < 18 ? 'sun' : 'moon'} size={26} color={colors.accent} />
              <Text style={s.hello}>{greeting()}{firstName ? `, ${firstName}` : ''}</Text>
            </View>
            <Text style={s.helloSub}>{SUB[new Date().getDate() % SUB.length]}</Text>
          </View>

          <View style={s.body}>
            {/* ---------- GAUGE CARD ---------- */}
            <Animated.View entering={enter(0)}>
              <Glass glow onPress={() => router.push('/(tabs)/diary')} label={`${metric.value} ${metric.label}. ${metric.sub}. ליומן התזונה`} style={s.gaugeCard}>
                <View style={s.gaugeRow}>
                  <View style={{ flex: 1, gap: 12, justifyContent: 'center' }}>
                    {day.calories ? (
                      <>
                        <MacroLine icon="food" title="חלבון" v={day.totals.protein} t={t.proteinTarget} />
                        <MacroLine icon="wheat" title="פחמימות" v={day.totals.carbs} t={t.carbsTarget} />
                        <MacroLine icon="drop" title="שומנים" v={day.totals.fat} t={t.fatTarget} />
                      </>
                    ) : (
                      <>
                        <HabitLine icon="bowl" title="ארוחות שתועדו" v={`${day.mealsLogged} / 4`} p={day.mealsLogged / 4} />
                        <HabitLine icon="dumbbell" title="אימונים השבוע" v={`${week.workouts.done} / ${week.workouts.planned}`} p={week.workouts.planned ? week.workouts.done / week.workouts.planned : 0} />
                        <HabitLine icon="drop" title="שתייה" v={`${(water / 1000).toFixed(1)} / ${(waterTarget / 1000).toFixed(1)} ל׳`} p={water / waterTarget} />
                      </>
                    )}
                  </View>
                  <View style={s.divider} />
                  <ProgressRing value={metric.progress} size={164} stroke={11}>
                    <Icon name={metric.icon} size={26} color={colors.accent} />
                    <Text style={s.ringNum} accessibilityElementsHidden>{shown.toLocaleString()}</Text>
                    <Text style={s.ringLabel}>{metric.over ? 'מעל היעד היום' : metric.label}</Text>
                    <Text style={s.ringSub}>{metric.sub}</Text>
                  </ProgressRing>
                </View>
              </Glass>
            </Animated.View>

            {/* ---------- MISSED ---------- */}
            {missed[0] && (
              <Glass style={s.missed}>
                <Text style={s.cardTitle}>{missed[0].name} · {prettyDate(missed[0].date)} – לא סומן</Text>
                <View style={s.pills}>
                  <Pill icon="check" label="הושלם" onPress={() => done(missed[0]!)} />
                  <Pill icon="calendar" label="דחייה למחר" onPress={() => { useApp.getState().moveWorkout(missed[0]!.id, addDays(today, 1)); toast('נדחה למחר'); }} />
                  <Pill icon="close" label="ביטול" onPress={() => { const x = missed[0]!; useApp.getState().skipWorkout(x.id); toast('בוטל', { label: 'ביטול', onPress: () => reopen(x.id) }); }} />
                </View>
              </Glass>
            )}

            {/* ---------- NEXT WORKOUT ---------- */}
            <Animated.View entering={enter(1)}>
              <Glass padded={false} style={s.workout}>
                <Image source={ANATOMY.torso} style={s.torso} contentFit="cover" accessibilityIgnoresInvertColors />
                <Tap onPress={() => router.push(next ? { pathname: '/workout', params: { id: next.id } } : { pathname: '/workout' })} label={next ? `האימון הבא שלך: ${next.name}, ${whenLabel(next)}` : 'אין אימון מתוכנן. הוספת אימון'}>
                  <View style={s.workoutBody}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="dumbbell" size={24} color={colors.accent} strokeWidth={2} />
                      <Text style={s.kicker}>האימון הבא</Text>
                    </View>
                    <Text style={s.workoutName} numberOfLines={1}>{next?.name ?? 'אין אימון מתוכנן'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="clock" size={18} color={colors.text2} />
                      <Text style={s.when}>{next ? whenLabel(next).replace(' | ', '  |  ') : 'הוספה לתוכנית השבועית'}</Text>
                    </View>
                    {next && next.muscles.length > 0 && <Text style={s.muscles} numberOfLines={1}>{next.muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')}</Text>}
                  </View>
                </Tap>
                <View style={[s.pills, { paddingHorizontal: 16, paddingBottom: 14 }]}>
                  {next ? (
                    <>
                      <Pill icon="check" label="הושלם" primary onPress={() => done(next)} />
                      <Pill icon="clock" label="שינוי מועד" onPress={() => setResched(next)} />
                      <Pill icon="calendar" label="לתוכנית" onPress={() => router.push('/(tabs)/plan')} />
                    </>
                  ) : <Pill icon="plus" label="הוספת אימון" primary onPress={() => router.push('/workout')} />}
                </View>
              </Glass>
            </Animated.View>

            {/* ---------- TODAY'S MEALS ---------- */}
            <Animated.View entering={enter(2)}>
              <Glass>
                <View style={s.rowHead}>
                  <Icon name="bowl" size={24} color={colors.accent} />
                  <Text style={s.cardTitle}>יומן תזונה – היום</Text>
                  <View style={{ flex: 1 }} />
                  <Tap onPress={() => router.push('/add-meal')} label="הוסף ארוחה"><View style={s.addSq}><Icon name="plus" size={22} color={colors.accent} strokeWidth={2.2} /></View></Tap>
                </View>
                <View style={s.mealRow}>
                  {meals.slice(0, 4).map((m) => {
                    const list = day.list.filter((e) => e.meal === m.key);
                    const has = list.length > 0;
                    const photo = list.find((e) => e.photoUri)?.photoUri;
                    return (
                      <Tap key={m.key} onPress={() => router.push(has ? { pathname: '/meal', params: { date: today, meal: m.key } } : { pathname: '/add-meal', params: { meal: m.key } })} label={`${m.label}: ${has ? `${list.length} פריטים${day.calories ? `, ${list.reduce((a, e) => a + (e.nutrients.kcal ?? 0), 0)} קלוריות` : ''}` : 'טרם תועד, להוספה'}`} style={{ flex: 1 }}>
                        <View style={s.meal}>
                          <View style={[s.mealImgWrap, !has && { opacity: 0.55 }]}>
                            <Image source={photo ? { uri: photo } : MEAL_PHOTO[m.key]} style={s.mealImg} contentFit="cover" />
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={[s.check, has && s.checkOn]}><Icon name={has ? 'check' : 'plus'} size={12} color={has ? colors.accent : colors.text2} strokeWidth={2.6} /></View>
                            <Text style={s.mealLabel} numberOfLines={1}>{m.label.replace('ארוחת ', '').replace('ארוחות ביניים', 'נשנוש')}</Text>
                          </View>
                        </View>
                      </Tap>
                    );
                  })}
                </View>
                {day.calories && (
                  <Tap onPress={() => router.push('/add-calories')} label="הזנה מהירה של קלוריות">
                    <View style={s.quickKcal}>
                      <Icon name="flame" size={20} color={colors.accent} />
                      <Text style={s.quickKcalText}>הזנה מהירה של קלוריות</Text>
                      <View style={{ flex: 1 }} />
                      <Text style={s.quickKcalHint}>בלי ליצור מוצר</Text>
                    </View>
                  </Tap>
                )}
              </Glass>
            </Animated.View>

            {/* ---------- WEEK BALANCE ---------- */}
            <Animated.View entering={enter(3)}>
              <Glass onPress={() => router.push('/(tabs)/plan')} label="סיכום שבועי. לתוכנית השבועית">
                <WeekBalance week={week} />
              </Glass>
            </Animated.View>

            {/* ---------- SHORTCUTS ---------- */}
            <View style={s.grid}>
              <Short icon="calendar" title="תוכנית שבועית" sub={`${week.workouts.done}/${week.workouts.planned} אימונים · ${week.mealsPlanned} ארוחות`} onPress={() => router.push('/(tabs)/plan')} />
              <Short icon="trend" title="ההתקדמות שלי" sub="משקל, מדדים ודוחות" onPress={() => router.push('/reports')} />
              <Short icon="cloche" title="מצב מסעדה" sub={outing ? `${prettyDate(outing.date)} · ${outing.title || restaurantLabel(outing.restaurantType)}` : 'תכנון יציאה ובחירת מנה'} onPress={() => router.push(outing ? { pathname: '/restaurant', params: { event: outing.id } } : '/restaurant')} />
              <Short icon="star" title="שישי–שבת" sub={shabbat.appliedWeeks.includes(ws) ? 'בתוכנית השבוע ✓' : 'תוכנית ייחודית לסוף השבוע'} onPress={() => router.push({ pathname: '/shabbat', params: { week: ws } })} />
              <Short icon="trophy" title="ימים לניצחון" sub={cs ? `${cs.left} ימים · רצף ${cs.streak}` : 'על אליאן – אתגר התמדה'} progress={cs?.progress} onPress={() => router.push(challenge ? `/victory/${challenge.id}` : '/victory/new')} />
              <Short icon="drop" title="צריכת מים" sub={`${(water / 1000).toFixed(1)} / ${(waterTarget / 1000).toFixed(1)} ל׳ · הקש לכוס`} progress={water / waterTarget} onPress={() => { addWater(250); haptic.success(); toast('נוספה כוס מים (250 מ״ל)', { label: 'ביטול', onPress: () => addWater(-250) }); }} />
              <Short icon="alarm" title="תזכורות" sub={nextReminder ? `הבאה: ${nextReminder}` : 'הגדרת תזכורת בוקר'} onPress={() => router.push('/alarm')} />
              <Short icon="crown" title="Premium" sub="בקרוב · ללא חיוב" onPress={() => router.push('/premium')} />
            </View>
          </View>
        </ScrollView>
        <RescheduleSheet w={resched} onClose={() => setResched(null)} />
      </View>
    </View>
  );
}

function MacroLine({ icon, title, v, t }: { icon: IconName; title: string; v: number; t: number | null }) {
  return (
    <View style={{ gap: 5 }} accessible accessibilityLabel={`${title}: ${Math.round(v)}${t ? ` מתוך ${t}` : ''} גרם`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.macroTitle}>{title}</Text>
          <Text style={s.macroVal}><Text style={{ color: colors.accent }}>{Math.round(v)}</Text>{t ? ` / ${t}` : ''} ג׳</Text>
        </View>
        <Icon name={icon} size={24} color={colors.accent} />
      </View>
      <Bar value={t ? v / t : 0} />
    </View>
  );
}

function HabitLine({ icon, title, v, p }: { icon: IconName; title: string; v: string; p: number }) {
  return (
    <View style={{ gap: 5 }} accessible accessibilityLabel={`${title}: ${v}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}><Text style={s.macroTitle}>{title}</Text><Text style={s.macroVal}>{v}</Text></View>
        <Icon name={icon} size={22} color={colors.accent} />
      </View>
      <Bar value={p} />
    </View>
  );
}

function WeekBalance({ week }: { week: ReturnType<typeof useWeek> }) {
  const [w, setW] = useState(0);
  const vals = week.days.map((d) => (week.calories ? (d.logged ? d.totals.kcal : null) : d.workouts.filter((x) => x.status === 'done' && !x.rest).length + d.meals / 4));
  const known = vals.filter((v): v is number => v != null);
  const max = Math.max(1, ...known);
  const H = 56;
  const pts = vals.map((v, i) => (v == null ? null : { x: w - (i + 0.5) * (w / 7), y: H - 6 - (v / max) * (H - 14) })).filter((p): p is { x: number; y: number } => !!p);
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = pts[i - 1]!;
    const cx = (q.x + p.x) / 2;
    return `${acc} C ${cx} ${q.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');
  const diff = week.calories && week.loggedTarget ? week.totalKcal - week.loggedTarget : null;
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 122, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="chart" size={22} color={colors.accent} /><Text style={s.cardTitle}>{week.calories ? 'מאזן שבועי' : 'השבוע שלי'}</Text></View>
        {week.calories ? (
          <>
            <Text style={s.balance}>{week.loggedCount ? week.totalKcal.toLocaleString() : '—'}</Text>
            <Text style={s.small}>{week.loggedTarget ? `מתוך ${week.loggedTarget.toLocaleString()} בימים שתועדו` : `${week.loggedCount} ימי תיעוד`}{diff != null && week.loggedCount && diff > 0 ? ` · ${diff.toLocaleString()} מעל` : ''}</Text>
          </>
        ) : (
          <>
            <Text style={s.balance}>{week.workouts.done}/{week.workouts.planned}</Text>
            <Text style={s.small}>אימונים · {week.loggedCount} ימי תיעוד</Text>
          </>
        )}
      </View>
      <View style={{ flex: 1 }} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessible accessibilityLabel={`גרף השבוע: ${week.loggedCount} ימים עם תיעוד`}>
        {w > 0 && (
          <Svg width={w} height={H}>
            <Defs>
              <SvgLG id="wb" x1="1" y1="0" x2="0" y2="0"><Stop offset="0" stopColor={colors.emberMid} /><Stop offset="1" stopColor={colors.accentLight} /></SvgLG>
            </Defs>
            {pts.length > 1 && <Path d={path} stroke="url(#wb)" strokeWidth={2.4} fill="none" strokeLinecap="round" />}
            {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? '#fff' : colors.text2} stroke={colors.accent} strokeWidth={i === pts.length - 1 ? 2.5 : 0} />)}
          </Svg>
        )}
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around' }}>{DAY_SHORT.map((d) => <Text key={d} style={s.dayLbl}>{d}</Text>)}</View>
      </View>
    </View>
  );
}

function Short({ icon, title, sub, onPress, progress }: { icon: IconName; title: string; sub: string; onPress: () => void; progress?: number }) {
  return (
    <View style={s.shortWrap}>
      <Glass onPress={onPress} label={`${title}. ${sub}`} style={s.short}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.shortTitle} numberOfLines={1}>{title}</Text>
            <Text style={s.small} numberOfLines={2}>{sub}</Text>
          </View>
          <Icon name={icon} size={26} color={colors.accent} />
        </View>
        {progress != null && <View style={{ marginTop: 8 }}><Bar value={progress} /></View>}
      </Glass>
    </View>
  );
}

function Pill({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[s.pill, primary && s.pillPrimary]}>
        <Icon name={icon} size={17} color={primary ? colors.textOnAccent : colors.text} strokeWidth={2} />
        <Text style={[s.pillText, primary && { color: colors.textOnAccent }]}>{label}</Text>
      </View>
    </Tap>
  );
}

/** Quick reschedule: tomorrow, +1h, next week, or full edit. */
function RescheduleSheet({ w, onClose }: { w: PlannedWorkout | null; onClose: () => void }) {
  const move = useApp((st) => st.moveWorkout);
  if (!w) return <Sheet visible={false} onClose={onClose}><View /></Sheet>;
  const plusHour = w.time ? `${String(Math.min(23, Number(w.time.slice(0, 2)) + 1)).padStart(2, '0')}${w.time.slice(2)}` : null;
  const opt = (label: string, fn: () => void) => <ListItem key={label} icon="calendar" title={label} onPress={() => { fn(); onClose(); haptic.success(); toast('המועד עודכן'); }} />;
  return (
    <Sheet visible onClose={onClose} title={`שינוי מועד · ${w.name}`}>
      {opt(`מחר${w.time ? ` ב-${w.time}` : ''}`, () => move(w.id, addDays(w.date > dateKey() ? w.date : dateKey(), 1)))}
      {plusHour && opt(`שעה מאוחר יותר (${plusHour})`, () => move(w.id, w.date, plusHour))}
      {opt('בעוד שבוע', () => move(w.id, addDays(w.date, 7)))}
      <ListItem icon="edit" title="בחירת יום ושעה" onPress={() => { onClose(); router.push({ pathname: '/workout', params: { id: w.id } }); }} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: space.lg },
  logo: { alignItems: 'center', gap: 4, marginTop: 2 },
  logoText: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 18, letterSpacing: 1.2, color: colors.text, textAlign: 'center' },
  greet: { paddingHorizontal: space.lg, marginTop: 18, alignItems: 'flex-start', gap: 4 },
  hello: { fontFamily: fonts.bold, fontSize: 30, color: colors.text },
  helloSub: { fontFamily: fonts.regular, fontSize: 16, color: colors.text2 },
  body: { paddingHorizontal: space.md, marginTop: 26, gap: 12 },
  gaugeCard: { paddingVertical: 20, borderColor: 'rgba(255,255,255,0.14)' },
  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.14)' },
  ringNum: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 46, color: colors.text, fontVariant: ['tabular-nums'] },
  ringLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  ringSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  macroTitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  macroVal: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text2, fontVariant: ['tabular-nums'] },
  missed: { borderColor: 'rgba(229,72,77,0.4)' },
  workout: { minHeight: 168 },
  torso: { position: 'absolute', left: -10, top: 0, height: 150, width: '50%', opacity: 0.9 },
  workoutBody: { padding: 18, paddingBottom: 8, alignItems: 'flex-start', gap: 4 },
  kicker: { fontFamily: fonts.medium, fontSize: 16, color: colors.text2 },
  workoutName: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, maxWidth: '62%' },
  when: { fontFamily: fonts.medium, fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
  muscles: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(48,50,54,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  pillPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  addSq: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,121,37,0.14)', borderWidth: 1, borderColor: 'rgba(245,121,37,0.4)' },
  mealRow: { flexDirection: 'row', gap: 8 },
  meal: { alignItems: 'center', gap: 6 },
  mealImgWrap: { width: '100%', aspectRatio: 1.45, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  mealImg: { width: '100%', height: '100%' },
  check: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.text3, alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderColor: colors.accent },
  mealLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, flexShrink: 1 },
  quickKcal: { marginTop: 12, minHeight: 48, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  quickKcalText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  quickKcalHint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.text2 },
  balance: { fontFamily: fonts.bold, fontSize: 28, color: colors.accent, fontVariant: ['tabular-nums'] },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  dayLbl: { fontFamily: fonts.regular, fontSize: 12, color: colors.text2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  shortWrap: { width: '50%', padding: 5 },
  short: { minHeight: 96, borderRadius: 22, paddingVertical: 14 },
  shortTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
});
