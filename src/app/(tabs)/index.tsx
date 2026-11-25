import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { useDay } from '@/store/selectors';
import { Logo, HeroBackdrop, SideRulers, WaveHeader, useScreenWidth } from '@/components/Brand';
import { DotNumber } from '@/components/DotMatrix';
import { NumRow } from '@/components/MacroCard';
import { IconButton, ProgressBar, Ring, Row, Sheet, Tap, ListItem, Badge } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { dateKey, greeting, DAY_LONG } from '@/lib/dates';
import { planById } from '@/data/exercises';
import { RECIPES } from '@/data/recipes';
import { fmt } from '@/lib/nutrition';
import { recipeNutrients } from '@/lib/recipes';
import { challengeStats } from '@/lib/challenge';
import { EXERCISE_ART_ON_DARK } from '@/data/media';

const HERO_H = 380;

/** 14 Home – approved composition (dot number, sunken wave, bento, next workout, victory days) */
export default function Home() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const today = dateKey();
  const day = useDay(today);
  const profile = useApp((s) => s.profile);
  const schedule = useApp((s) => s.schedule);
  const customPlans = useApp((s) => s.customPlans);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const challenges = useApp((s) => s.challenges);
  const [menu, setMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const t = day.target;
  const consumed = day.totals.kcal;
  const over = day.remaining != null && day.remaining < 0;
  const mealsLogged = new Set(day.list.map((e) => e.meal)).size;

  // Hero metric by mode (adult with target → remaining; adult w/o → logged; minor → meals logged)
  const hero = day.hasTarget
    ? { value: Math.abs(day.remaining!), label: over ? 'קלוריות מעל היעד היום' : 'קלוריות נותרו להיום', pill: `מתוך ${t.calorieTarget!.toLocaleString()} קק״ל`, progress: consumed / t.calorieTarget! }
    : day.adult
      ? { value: consumed, label: 'קלוריות שתועדו היום', pill: 'מעקב ללא יעד', progress: Math.min(1, day.list.length / 4) }
      : { value: mealsLogged, label: 'ארוחות שתועדו היום', pill: 'ארוחות סדירות, אנרגיה לאימון', progress: Math.min(1, mealsLogged / 4) };

  const todayPlanId = schedule[new Date().getDay()] ?? 'rest';
  const active = sessions.find((s) => s.id === activeId && s.status !== 'done');
  const nextDay = useMemo(() => {
    for (let k = 1; k <= 7; k++) {
      const d = (new Date().getDay() + k) % 7;
      if (schedule[d] && schedule[d] !== 'rest') return { d, plan: planById(schedule[d]!, customPlans) };
    }
    return null;
  }, [schedule, customPlans]);
  const doneToday = sessions.some((s) => s.date === today && s.status === 'done');
  const plan = active ? planById(active.planId, customPlans) : todayPlanId !== 'rest' && !doneToday ? planById(todayPlanId, customPlans) : nextDay?.plan;
  const doneEx = active ? active.exercises.filter((e) => e.sets.every((s) => s.done)).length : 0;
  const totalEx = plan?.exercises.length ?? 0;
  const workoutLabel = active ? 'אימון בתהליך' : plan && todayPlanId !== 'rest' && !doneToday ? 'האימון של היום' : nextDay ? `האימון הבא · יום ${DAY_LONG[nextDay.d]}` : 'אין אימון מתוכנן';
  const weekPlanned = Object.values(schedule).filter((x) => x !== 'rest').length;
  const weekDone = sessions.filter((s) => s.status === 'done' && Date.now() - s.startedAt < 7 * 86400000).length;
  const art = plan ? EXERCISE_ART_ON_DARK[plan.exercises[0]?.exerciseId ?? ''] ?? EXERCISE_ART_ON_DARK.bench : EXERCISE_ART_ON_DARK.bench;

  const nextMeal = useMemo(() => {
    const h = new Date().getHours();
    const meal = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 20 ? 'dinner' : 'snack';
    return RECIPES.find((r) => r.meal === meal && !r.allergens.some((a) => profile.allergies.includes(a))) ?? RECIPES[0]!;
  }, [profile.allergies]);
  const nextMealN = recipeNutrients(nextMeal);

  const challenge = challenges.find((c) => !c.finished);
  const cs = challenge ? challengeStats(challenge) : null;

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
              <Tap onPress={() => router.push(day.hasTarget ? '/calculator' : '/diary')} label={hero.pill}>
                <View style={styles.pill}>
                  <Icon name="chart" size={14} color={colors.accentLight} />
                  <Text style={styles.pillText}>{hero.pill}</Text>
                </View>
              </Tap>
            </View>
          </View>

          {/* ---------- WAVE + BENTO ---------- */}
          <WaveHeader progress={hero.progress} height={96} />
          <View style={styles.panel}>
            <Row gap={10}>
              <Tile onPress={() => router.push('/(tabs)/nutrition')} label="יומן תזונה" style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Icon name="chart" size={24} />
                    <Text style={styles.tileTitle}>יומן תזונה</Text>
                    {day.adult ? <NumRow value={consumed.toLocaleString()} target={t.calorieTarget ? t.calorieTarget.toLocaleString() : undefined} unit="קק״ל" size={14} /> : <Text style={styles.tileSub}>{mealsLogged}/4 ארוחות</Text>}
                  </View>
                  <Ring value={day.hasTarget ? consumed / t.calorieTarget! : mealsLogged / 4} size={50} stroke={4} />
                </Row>
              </Tile>
              <Tile onPress={() => router.push('/foods')} label="הוספת ארוחה" style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                  <View style={{ gap: 4 }}>
                    <Icon name="food" size={24} />
                    <Text style={styles.tileTitle}>הוספת ארוחה</Text>
                  </View>
                  <View style={styles.plusDot}><Icon name="plus" size={20} color={colors.text} /></View>
                </Row>
              </Tile>
            </Row>

            <Row gap={8} style={{ marginTop: 10 }}>
              <Mini icon="fat" title="שומנים" value={fmt(day.totals.fat)} target={t.fatTarget} unit="ג׳" onPress={() => router.push('/macro/fat')} hidden={!day.adult} />
              <Mini icon="wheat" title="פחמימות" value={fmt(day.totals.carbs)} target={t.carbsTarget} unit="ג׳" onPress={() => router.push('/macro/carbs')} hidden={!day.adult} />
              <Mini icon="protein" title="חלבונים" value={fmt(day.totals.protein)} target={t.proteinTarget} unit="ג׳" onPress={() => router.push('/macro/protein')} />
              <Mini icon="dumbbell" title="אימונים" value={String(weekDone)} target={weekPlanned} unit="" onPress={() => router.push('/workouts')} />
            </Row>

            {/* ---------- NEXT WORKOUT ---------- */}
            <Tap onPress={() => router.push(active ? '/workout/active' : plan ? `/workout/${plan.id}` : '/workouts')} label={`${workoutLabel}: ${plan?.name ?? ''}`}>
              <View style={styles.workout}>
                <LinearGradient colors={['rgba(232,120,42,0.16)', 'rgba(20,12,8,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 0.6, y: 0.5 }} style={StyleSheet.absoluteFill} />
                <View style={styles.workoutArt} pointerEvents="none">
                  <Image source={art} style={{ width: 150, height: 150, opacity: 0.55 }} contentFit="contain" accessibilityIgnoresInvertColors />
                </View>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={styles.play}><Icon name="play" size={22} color="#fff" /></View>
                  <View style={{ flex: 1, alignItems: 'flex-start', marginStart: 12 }}>
                    <Text style={styles.workoutKicker}>{workoutLabel}</Text>
                    <Text style={styles.workoutName}>{plan?.name ?? 'מנוחה'}</Text>
                    <Text style={styles.workoutFocus}>{plan?.focus ?? 'אפשר לקבוע אימון בלוח השבועי'}</Text>
                  </View>
                </Row>
                {plan && <View style={styles.workoutBar}><View style={[styles.workoutBarFill, { width: `${Math.max(6, totalEx ? (doneEx / totalEx) * 100 : 6)}%` }]} /></View>}
              </View>
            </Tap>

            {/* ---------- VICTORY DAYS ---------- */}
            <Tap onPress={() => router.push(challenge ? `/victory/${challenge.id}` : '/victory/new')} label="ימים לניצחון">
              <View style={styles.victory}>
                <View style={{ flex: 1, gap: 10 }}>
                  <Row gap={8}>
                    <Icon name="trophy" size={22} />
                    <Text style={styles.victoryTitle} numberOfLines={1}>{challenge ? `ימים לניצחון${challenge.partner ? ` מול ${challenge.partner}` : ''}` : 'ימים לניצחון'}</Text>
                  </Row>
                  {cs ? (
                    <Row gap={10}>
                      <View style={{ flex: 1 }}><ProgressBar value={cs.progress} height={10} /></View>
                      <Text style={styles.victoryPct}>{Math.round(cs.progress * 100)}%</Text>
                    </Row>
                  ) : (
                    <Text style={styles.tileSub}>צור אתגר התמדה אישי או מול חבר</Text>
                  )}
                </View>
                <View style={{ alignItems: 'center', minWidth: 80 }}>
                  {cs ? (<><Text style={styles.victoryNum}>{cs.left}</Text><Text style={styles.tileSub}>ימים לאתגר</Text></>) : <View style={styles.plusDot}><Icon name="plus" size={20} color={colors.text} /></View>}
                </View>
                <View style={styles.faces} accessibilityElementsHidden>
                  <Face letter={(profile.name || 'א').trim()[0]!} />
                  <Face letter={(challenge?.partner || '?').trim()[0]!} flip />
                </View>
              </View>
            </Tap>

            {/* ---------- BELOW THE FOLD ---------- */}
            <Tap onPress={() => router.push(`/recipe/${nextMeal.id}`)} label={`הארוחה הבאה: ${nextMeal.name}`}>
              <View style={styles.listCard}>
                <View style={styles.mealIcon}><Icon name="bowl" size={24} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileSub}>הארוחה הבאה</Text>
                  <Text style={styles.listTitle} numberOfLines={1}>{nextMeal.name}</Text>
                  <Text style={styles.tileSub}>{nextMeal.minutes} דק׳{day.adult && nextMealN.kcal ? ` · ${Math.round(nextMealN.kcal / nextMeal.servings)} קק״ל למנה` : ''}</Text>
                </View>
                <Icon name="chevron" size={18} color={colors.text2} />
              </View>
            </Tap>
            <Tap onPress={() => router.push('/premium')} label="Premium">
              <View style={styles.listCard}>
                <Icon name="crown" size={24} />
                <View style={{ flex: 1 }}><Text style={styles.listTitle}>Premium</Text><Text style={styles.tileSub}>תוכניות מותאמות, מאמן AI ודוחות מתקדמים</Text></View>
                <Badge text="בקרוב" />
              </View>
            </Tap>
          </View>
        </ScrollView>

        <Sheet visible={menu} onClose={() => setMenu(false)} title="תפריט">
          {([
            ['bell', 'מרכז התראות', '/notifications'], ['alarm', 'שעון מעורר ותזכורות', '/alarm'], ['trophy', 'ימים לניצחון', '/victory'],
            ['calc', 'מחשבון קלוריות', '/calculator'], ['sparkle', 'מאמן AI', '/coach'], ['settings', 'הגדרות', '/settings'],
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
  listCard: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(22,13,8,0.85)', borderWidth: 1, borderColor: colors.border },
  listTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: colors.text },
  mealIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
});
