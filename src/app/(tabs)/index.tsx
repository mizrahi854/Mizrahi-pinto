import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { useDay, useWeek, useNextWorkout } from '@/store/selectors';
import { Logo, HeroBackdrop, SideRulers, WaveHeader, useScreenWidth } from '@/components/Brand';
import { DotNumber } from '@/components/DotMatrix';
import { NumRow } from '@/components/MacroCard';
import { IconButton, ProgressBar, Ring, Row, Sheet, Tap, ListItem, Badge } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { dateKey, greeting, addDays, DAY_SHORT, prettyDate, weekOf } from '@/lib/dates';
import { fmt } from '@/lib/nutrition';
import { challengeStats } from '@/lib/challenge';
import { MUSCLE_ART } from '@/data/media';
import { whenLabel, MUSCLE_LABELS } from '@/lib/workouts';
import { restaurantLabel } from '@/lib/restaurants';
import { useInbox } from '@/lib/inbox';
import { toast } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { PlannedWorkout } from '@/data/types';

const HERO_H = 380;

/** 14 Home – approved composition (dot number, sunken wave, bento, next workout, victory days) */
export default function Home() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const today = dateKey();
  const day = useDay(today);
  const profile = useApp((s) => s.profile);
  const challenges = useApp((s) => s.challenges);
  const events = useApp((s) => s.events);
  const shabbat = useApp((s) => s.shabbat);
  const complete = useApp((s) => s.completeWorkout);
  const reopen = useApp((s) => s.reopenWorkout);
  const upsertWorkout = useApp((s) => s.upsertWorkout);
  const week = useWeek(today);
  const { next, missed } = useNextWorkout();
  const inbox = useInbox();
  const [menu, setMenu] = useState(false);
  const [resched, setResched] = useState<PlannedWorkout | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const t = day.target;
  const consumed = day.totals.kcal;
  const over = day.remaining != null && day.remaining < 0;

  // Hero metric: calories only for adults who chose calorie tracking; otherwise meals (habits)
  const hero = day.hasTarget
    ? { value: Math.abs(day.remaining!), label: over ? 'קלוריות מעל היעד היום' : 'קלוריות נותרו להיום', pill: `מתוך ${t.calorieTarget!.toLocaleString()} קק״ל`, progress: consumed / t.calorieTarget! }
    : day.calories
      ? { value: consumed, label: 'קלוריות שתועדו היום', pill: 'מעקב ללא יעד', progress: Math.min(1, day.mealsLogged / 4) }
      : { value: day.mealsLogged, label: 'ארוחות שתועדו היום', pill: 'ארוחות סדירות, אנרגיה לאימון', progress: Math.min(1, day.mealsLogged / 4) };

  const art = next ? next.muscles.map((m) => MUSCLE_ART[m]).find(Boolean) ?? MUSCLE_ART.full : MUSCLE_ART.full;
  const outing = useMemo(() => events.filter((e) => e.type === 'restaurant' && e.date >= today).sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))[0], [events, today]);
  const ws = weekOf(today)[0]!;
  const shabbatMeals = shabbat.meals.filter((m) => m.enabled);
  const challenge = challenges.find((c) => !c.finished);
  const cs = challenge ? challengeStats(challenge) : null;

  const done = (w: PlannedWorkout) => {
    complete(w.id);
    haptic.success();
    toast(`${w.name} הושלם ✓ – האימון הבא מוצג`, { label: 'ביטול', onPress: () => reopen(w.id) });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const firstName = profile.name.trim().split(' ')[0];

  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {/* ---------- HERO ---------- */}
          <View style={{ height: HERO_H + insets.top }}>
            <HeroBackdrop height={HERO_H + insets.top + 60} />
            <SideRulers top={insets.top + 92} height={220} />
            <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
              <Logo />
              <IconButton icon="dots" label="תפריט" onPress={() => setMenu(true)} size={48} />
            </View>
            <View style={styles.heroCenter}>
              {firstName ? <Text style={styles.greeting}>{greeting()}, {firstName}</Text> : null}
              <Animated.View entering={reduce ? undefined : FadeInDown.duration(500)}>
                <DotNumber value={hero.value} dot={7.4} gap={3.3} label={`${hero.value} ${hero.label}`} />
              </Animated.View>
              <Text style={styles.heroLabel}>{hero.label}</Text>
              <Tap onPress={() => router.push('/(tabs)/diary')} label={hero.pill}>
                <View style={styles.pill}>
                  <Icon name="chart" size={14} color={colors.accentLight} />
                  <Text style={styles.pillText}>{hero.pill}</Text>
                </View>
              </Tap>
            </View>
          </View>

          {/* ---------- WAVE + PANEL ---------- */}
          <WaveHeader progress={hero.progress} height={96} />
          <View style={styles.panel}>
            <Row gap={10}>
              <Tile onPress={() => router.push('/add-meal')} label="הוסף ארוחה" style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                  <View style={{ gap: 4 }}>
                    <Icon name="food" size={24} />
                    <Text style={styles.tileTitle}>הוסף ארוחה</Text>
                    <Text style={styles.tileSub}>צילום, ברקוד, חיפוש</Text>
                  </View>
                  <View style={styles.plusDot}><Icon name="plus" size={20} color={colors.text} /></View>
                </Row>
              </Tile>
              <Tile onPress={() => router.push('/(tabs)/diary')} label="יומן תזונה" style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Icon name="chart" size={24} />
                    <Text style={styles.tileTitle}>יומן תזונה</Text>
                    {day.calories ? <NumRow value={consumed.toLocaleString()} target={t.calorieTarget ? t.calorieTarget.toLocaleString() : undefined} unit="קק״ל" size={14} /> : <Text style={styles.tileSub}>{day.mealsLogged}/4 ארוחות</Text>}
                  </View>
                  <Ring value={day.hasTarget ? consumed / t.calorieTarget! : day.mealsLogged / 4} size={50} stroke={4} />
                </Row>
              </Tile>
            </Row>

            {day.calories && (
              <Row gap={8} style={{ marginTop: 10 }}>
                <Mini icon="protein" title="חלבון" value={fmt(day.totals.protein)} target={t.proteinTarget} unit="ג׳" onPress={() => router.push('/(tabs)/diary')} />
                <Mini icon="wheat" title="פחמימות" value={fmt(day.totals.carbs)} target={t.carbsTarget} unit="ג׳" onPress={() => router.push('/(tabs)/diary')} />
                <Mini icon="fat" title="שומנים" value={fmt(day.totals.fat)} target={t.fatTarget} unit="ג׳" onPress={() => router.push('/(tabs)/diary')} />
              </Row>
            )}

            {/* ---------- MISSED WORKOUT (reschedule / cancel / done) ---------- */}
            {missed[0] && (
              <View style={styles.missed}>
                <Text style={styles.listTitle}>{missed[0].name} · {prettyDate(missed[0].date)} – לא סומן</Text>
                <Row gap={8} style={{ marginTop: 8, flexWrap: 'wrap' }}>
                  <SmallBtn icon="check" label="הושלם" onPress={() => done(missed[0]!)} />
                  <SmallBtn icon="calendar" label="דחייה למחר" onPress={() => { useApp.getState().moveWorkout(missed[0]!.id, addDays(today, 1)); toast('נדחה למחר'); }} />
                  <SmallBtn icon="close" label="ביטול" onPress={() => { const w = missed[0]!; useApp.getState().skipWorkout(w.id); toast('בוטל', { label: 'ביטול', onPress: () => reopen(w.id) }); }} />
                </Row>
              </View>
            )}

            {/* ---------- NEXT WORKOUT ---------- */}
            <View style={styles.workout}>
              <LinearGradient colors={['rgba(232,120,42,0.16)', 'rgba(20,12,8,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 0.6, y: 0.5 }} style={StyleSheet.absoluteFill} />
              {art ? <View style={styles.workoutArt} pointerEvents="none"><Image source={art} style={{ width: 150, height: 150, opacity: 0.5 }} contentFit="contain" accessibilityIgnoresInvertColors /></View> : null}
              <Tap onPress={() => router.push(next ? { pathname: '/workout', params: { id: next.id } } : { pathname: '/workout' })} label={next ? `האימון הבא שלך: ${next.name}, ${whenLabel(next)}` : 'אין אימון מתוכנן. הוספת אימון'}>
                <View style={{ alignItems: 'flex-start', minHeight: 84, justifyContent: 'center' }}>
                  <Text style={styles.workoutKicker}>האימון הבא שלך</Text>
                  <Text style={styles.workoutName}>{next?.name ?? 'אין אימון מתוכנן'}</Text>
                  <Text style={styles.workoutFocus}>{next ? `${whenLabel(next)}${next.muscles.length ? ` · ${next.muscles.map((m) => MUSCLE_LABELS[m]).join(', ')}` : ''}` : 'הוספת אימון לתוכנית השבועית'}</Text>
                </View>
              </Tap>
              {next ? (
                <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
                  <SmallBtn icon="check" label="הושלם" primary onPress={() => done(next)} />
                  <SmallBtn icon="clock" label="שינוי מועד" onPress={() => setResched(next)} />
                  <SmallBtn icon={next.reminder ? 'bell' : 'mute'} label={next.reminder ? 'תזכורת פעילה' : 'הפעלת תזכורת'} onPress={() => { upsertWorkout({ ...next, reminder: !next.reminder }); toast(next.reminder ? 'התזכורת כובתה' : 'התזכורת הופעלה'); }} />
                </Row>
              ) : (
                <Row gap={8} style={{ marginTop: 12 }}><SmallBtn icon="plus" label="הוספת אימון" primary onPress={() => router.push('/workout')} /></Row>
              )}
            </View>

            {/* ---------- WEEK ---------- */}
            <Tap onPress={() => router.push('/(tabs)/plan')} label={`התוכנית השבועית: ${week.workouts.done} מתוך ${week.workouts.planned} אימונים הושלמו`}>
              <View style={styles.listCard}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={styles.listTitle}>התוכנית השבועית</Text>
                    <Text style={styles.tileSub}>{week.workouts.done}/{week.workouts.planned} אימונים</Text>
                  </Row>
                  <View style={styles.weekRow}>
                    {week.days.map((d, i) => {
                      const ws2 = d.workouts.filter((w) => !w.rest);
                      const isDone = ws2.length > 0 && ws2.every((w) => w.status === 'done');
                      return (
                        <View key={d.date} style={styles.weekDay}>
                          <Text style={[styles.weekLabel, d.date === today && { color: colors.accentLight }]}>{DAY_SHORT[i]}</Text>
                          <View style={[styles.weekDot, ws2.length > 0 && styles.weekDotPlanned, isDone && styles.weekDotDone]}>{isDone ? <Icon name="check" size={12} color={colors.textOnAccent} strokeWidth={3} /> : null}</View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </Tap>

            <Row gap={10} style={{ marginTop: 12 }}>
              <Tile onPress={() => router.push({ pathname: '/shabbat', params: { week: ws } })} label="תוכנית שישי ושבת" style={{ flex: 1 }}>
                <View style={{ gap: 4 }}>
                  <Icon name="star" size={22} />
                  <Text style={styles.tileTitle}>שישי ושבת</Text>
                  <Text style={styles.tileSub} numberOfLines={2}>{shabbat.appliedWeeks.includes(ws) ? 'בתוכנית השבוע ✓' : shabbatMeals.length ? `${shabbatMeals.length} ארוחות מוגדרות` : 'תכנון ארוחות ואימון'}</Text>
                </View>
              </Tile>
              <Tile onPress={() => router.push(outing ? { pathname: '/restaurant', params: { event: outing.id } } : '/restaurant')} label="מצב מסעדה" style={{ flex: 1 }}>
                <View style={{ gap: 4 }}>
                  <Icon name="food" size={22} />
                  <Text style={styles.tileTitle}>מסעדה</Text>
                  <Text style={styles.tileSub} numberOfLines={2}>{outing ? `${prettyDate(outing.date)}${outing.time ? ` ${outing.time}` : ''} · ${outing.title || restaurantLabel(outing.restaurantType)}` : 'אני יוצא למסעדה'}</Text>
                </View>
              </Tile>
            </Row>

            {/* ---------- VICTORY DAYS ---------- */}
            <Tap onPress={() => router.push(challenge ? `/victory/${challenge.id}` : '/victory/new')} label="ימים לניצחון">
              <View style={styles.victory}>
                <View style={{ flex: 1, gap: 10 }}>
                  <Row gap={8}>
                    <Icon name="trophy" size={22} />
                    <Text style={styles.victoryTitle} numberOfLines={1}>{challenge ? challenge.name : 'ימים לניצחון על אליאן'}</Text>
                  </Row>
                  {cs ? (
                    <Row gap={10}>
                      <View style={{ flex: 1 }}><ProgressBar value={cs.progress} height={10} /></View>
                      <Text style={styles.victoryPct}>רצף {cs.streak}</Text>
                    </Row>
                  ) : (
                    <Text style={styles.tileSub}>אתגר התמדה: אימונים, שגרה ומנוחה</Text>
                  )}
                </View>
                <View style={{ alignItems: 'center', minWidth: 80 }}>
                  {cs ? (<><Text style={styles.victoryNum}>{cs.left}</Text><Text style={styles.tileSub}>ימים ליעד</Text></>) : <View style={styles.plusDot}><Icon name="plus" size={20} color={colors.text} /></View>}
                </View>
                <View style={styles.faces} accessibilityElementsHidden>
                  <Face letter={(profile.name || 'א').trim()[0]!} />
                  <Face letter={(challenge?.partner || 'א').trim()[0]!} flip />
                </View>
              </View>
            </Tap>

            {/* ---------- RELEVANT NOTIFICATIONS ---------- */}
            {inbox.filter((i) => !i.id.startsWith('missed') && !i.id.startsWith('next')).slice(0, 2).map((i) => (
              <Tap key={i.id} onPress={() => router.push(i.href)} label={`${i.title}. ${i.sub}`}>
                <View style={styles.listCard}>
                  <View style={styles.mealIcon}><Icon name={i.icon} size={22} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.listTitle} numberOfLines={1}>{i.title}</Text><Text style={styles.tileSub} numberOfLines={1}>{i.sub}</Text></View>
                  <Icon name="chevronBack" size={18} color={colors.text2} />
                </View>
              </Tap>
            ))}

            <Tap onPress={() => router.push('/premium')} label="Premium">
              <View style={styles.listCard}>
                <Icon name="crown" size={24} />
                <View style={{ flex: 1 }}><Text style={styles.listTitle}>Premium</Text><Text style={styles.tileSub}>זיהוי AI, תוכנית אישית, דוחות ותזכורות חכמות</Text></View>
                <Badge text="בקרוב" />
              </View>
            </Tap>
          </View>
        </ScrollView>

        <RescheduleSheet w={resched} onClose={() => setResched(null)} />
        <Sheet visible={menu} onClose={() => setMenu(false)} title="תפריט">
          {([
            ['bell', 'מרכז התראות', '/notifications'], ['alarm', 'תזכורות ושעון מעורר', '/alarm'], ['trophy', 'ימים לניצחון', '/victory'],
            ['calc', 'מחשבונים וכלים', '/tools'], ['chart', 'דוחות', '/reports'], ['settings', 'הגדרות', '/settings'],
          ] as [IconName, string, string][]).map(([ic, l, href]) => (
            <ListItem key={href} icon={ic} title={l} onPress={() => { setMenu(false); router.push(href as any); }} />
          ))}
        </Sheet>
      </View>
    </View>
  );
}

function Tile({ children, onPress, label, style }: { children: React.ReactNode; onPress: () => void; label: string; style?: any }) {
  return (
    <Tap onPress={onPress} label={label} style={style}>
      <View style={styles.tile}>
        <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} pointerEvents="none" />
        {children}
      </View>
    </Tap>
  );
}

function Mini({ icon, title, value, target, unit, onPress, hidden }: { icon: IconName; title: string; value: string; target: number | null | undefined; unit: string; onPress: () => void; hidden?: boolean }) {
  if (hidden) return null;
  return (
    <Tap onPress={onPress} label={`${title}: ${value}${target ? ` מתוך ${target}` : ''} ${unit}`} style={{ flex: 1 }}>
      <View style={styles.mini}>
        <Icon name={icon} size={22} />
        <Text style={styles.miniTitle} numberOfLines={1}>{title}</Text>
        <NumRow value={value} target={target ? String(target) : undefined} unit={unit || undefined} size={14} small={11} />
      </View>
    </Tap>
  );
}

function Face({ letter, flip }: { letter: string; flip?: boolean }) {
  return (
    <View style={[styles.face, flip && { marginStart: -14 }]}>
      <LinearGradient colors={['#3A2418', '#120A06']} start={{ x: flip ? 1 : 0, y: 0 }} end={{ x: flip ? 0 : 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={styles.faceText}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  heroCenter: { alignItems: 'center', marginTop: 30, gap: 10 },
  greeting: { ...type.label, color: 'rgba(255,255,255,0.72)', fontFamily: fonts.medium, marginBottom: 4 },
  heroLabel: { fontFamily: fonts.medium, fontSize: 22, color: colors.text, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.22)' },
  pillText: { ...type.label, color: colors.text, fontFamily: fonts.medium },
  panel: { backgroundColor: colors.surface, paddingHorizontal: space.md, marginTop: -2, gap: 0 },
  tile: { minHeight: 104, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(22,13,8,0.85)', borderWidth: 1, borderColor: colors.border, overflow: 'hidden', justifyContent: 'center' },
  tileTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  tileSub: { ...type.label, color: colors.text2 },
  plusDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  mini: { minHeight: 104, paddingVertical: 12, paddingHorizontal: 8, borderRadius: radius.md, backgroundColor: 'rgba(22,13,8,0.85)', borderWidth: 1, borderColor: colors.border, gap: 6 },
  miniTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  workout: { marginTop: 12, minHeight: 132, padding: 18, paddingBottom: 22, borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong, overflow: 'hidden', justifyContent: 'center' },
  workoutArt: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 160, alignItems: 'center', justifyContent: 'center' },
  workoutKicker: { ...type.label, color: colors.text2 },
  workoutName: { fontFamily: fonts.bold, fontSize: 26, color: colors.text, marginVertical: 2 },
  workoutFocus: { ...type.label, color: colors.text2 },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.emberMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accentLight },
  workoutBar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row-reverse' },
  workoutBarFill: { height: 3, backgroundColor: colors.accent },
  victory: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(22,13,8,0.85)', borderWidth: 1, borderColor: colors.border },
  victoryTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, flexShrink: 1 },
  victoryPct: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  victoryNum: { fontFamily: fonts.bold, fontSize: 34, color: colors.text, lineHeight: 38 },
  faces: { flexDirection: 'row-reverse', alignItems: 'center' },
  face: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.borderStrong },
  faceText: { color: colors.text, fontFamily: fonts.bold, fontSize: 18 },
  missed: { marginTop: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(229,72,77,0.10)', borderWidth: 1, borderColor: 'rgba(229,72,77,0.35)' },
  small: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
  smallPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  smallText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 4 },
  weekLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.text2 },
  weekDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  weekDotPlanned: { borderColor: colors.accentLight },
  weekDotDone: { backgroundColor: colors.accentLight, borderColor: colors.accentLight },
  listCard: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(22,13,8,0.85)', borderWidth: 1, borderColor: colors.border },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text },
  mealIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
});

function SmallBtn({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[styles.small, primary && styles.smallPrimary]}>
        <Icon name={icon} size={18} color={primary ? colors.textOnAccent : colors.text} />
        <Text style={[styles.smallText, primary && { color: colors.textOnAccent }]}>{label}</Text>
      </View>
    </Tap>
  );
}

/** Quick reschedule: tomorrow same time, +1h, next week, or full edit. */
function RescheduleSheet({ w, onClose }: { w: PlannedWorkout | null; onClose: () => void }) {
  const move = useApp((s) => s.moveWorkout);
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
