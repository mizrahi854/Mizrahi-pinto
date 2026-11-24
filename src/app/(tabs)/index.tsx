import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useApp } from '@/store/useApp';
import { useDay, useWeek } from '@/store/selectors';
import { Logo, HeroBackdrop, SideRulers, WaveHeader, useScreenWidth } from '@/components/Brand';
import { DotNumber } from '@/components/DotMatrix';
import { BentoTile } from '@/components/MacroCard';
import { Card, IconButton, Row, Sheet, T, Tap, ListItem, Badge, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { dateKey, greeting, DAY_LONG, weekOf, DAY_SHORT } from '@/lib/dates';
import { planById } from '@/data/exercises';
import { RECIPES } from '@/data/recipes';
import { fmt } from '@/lib/nutrition';
import { recipeNutrients } from '@/lib/recipes';
import { haptic } from '@/lib/haptics';
import { DottedProgress } from '@/components/DottedProgress';

const HERO_H = 400;

/** 14 Home – approved composition */
export default function Home() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const today = dateKey();
  const day = useDay(today);
  const week = useWeek(today);
  const profile = useApp((s) => s.profile);
  const schedule = useApp((s) => s.schedule);
  const customPlans = useApp((s) => s.customPlans);
  const sessions = useApp((s) => s.sessions);
  const activeId = useApp((s) => s.activeSessionId);
  const water = useApp((s) => s.water[today] ?? 0);
  const addWater = useApp((s) => s.addWater);
  const challenges = useApp((s) => s.challenges);
  const reminders = useApp((s) => s.reminders);
  const [menu, setMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const t = day.target;
  const consumed = day.totals.kcal;
  const over = day.remaining != null && day.remaining < 0;

  // Hero metric by mode (adult with target → remaining; adult w/o → logged; minor → meals logged)
  const hero = day.hasTarget
    ? { value: Math.abs(day.remaining!), label: over ? 'קלוריות מעל היעד היום' : 'קלוריות נשארו להיום', pill: `מתוך ${t.calorieTarget!.toLocaleString()} קק״ל`, progress: consumed / t.calorieTarget! }
    : day.adult
      ? { value: consumed, label: 'קלוריות שתועדו היום', pill: 'מעקב ללא יעד', progress: Math.min(1, day.list.length / 4) }
      : { value: new Set(day.list.map((e) => e.meal)).size, label: 'ארוחות שתועדו היום', pill: 'ארוחות סדירות, אנרגיה לאימון', progress: Math.min(1, new Set(day.list.map((e) => e.meal)).size / 4) };

  const todayPlanId = schedule[new Date().getDay()] ?? 'rest';
  const active = sessions.find((s) => s.id === activeId && s.status !== 'done');
  const plan = active ? planById(active.planId, customPlans) : todayPlanId !== 'rest' ? planById(todayPlanId, customPlans) : undefined;
  const nextDay = useMemo(() => {
    for (let k = 1; k <= 7; k++) {
      const d = (new Date().getDay() + k) % 7;
      if (schedule[d] && schedule[d] !== 'rest') return { d, plan: planById(schedule[d]!, customPlans) };
    }
    return null;
  }, [schedule, customPlans]);
  const doneEx = active ? active.exercises.filter((e) => e.sets.every((s) => s.done)).length : sessions.some((s) => s.date === today && s.status === 'done') ? plan?.exercises.length ?? 0 : 0;
  const totalEx = plan?.exercises.length ?? 0;
  const doneToday = sessions.some((s) => s.date === today && s.status === 'done');

  const nextMeal = useMemo(() => {
    const h = new Date().getHours();
    const meal = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 20 ? 'dinner' : 'snack';
    const allergies = profile.allergies;
    return RECIPES.find((r) => r.meal === meal && !r.allergens.some((a) => allergies.includes(a))) ?? RECIPES[0]!;
  }, [profile.allergies]);
  const nextMealN = recipeNutrients(nextMeal);

  const challenge = challenges.find((c) => !c.finished);
  const nextReminder = reminders.filter((r) => r.enabled && r.type === 'workout')[0];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const pct = (v: number, target: number | null) => (target ? v / target : undefined);
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
            <SideRulers top={insets.top + 92} height={230} />
            <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
              <Logo />
              <IconButton icon="dots" label="תפריט" onPress={() => setMenu(true)} size={48} />
            </View>
            <View style={styles.heroCenter}>
              <Text style={styles.greeting}>{greeting()}{firstName ? `, ${firstName}` : ''}</Text>
              <Animated.View entering={reduce ? undefined : FadeInDown.duration(500)}>
                <DotNumber value={hero.value} dot={7.4} gap={3.3} label={`${hero.value} ${hero.label}`} />
              </Animated.View>
              <Text style={styles.heroLabel}>{hero.label}</Text>
              <Tap onPress={() => router.push(day.hasTarget ? '/calculator' : '/diary')} label={hero.pill}>
                <View style={styles.pill}>
                  <Icon name={day.hasTarget ? 'flame' : 'list'} size={15} color={colors.accentLight} />
                  <Text style={styles.pillText}>{hero.pill}</Text>
                </View>
              </Tap>
            </View>
          </View>

          {/* ---------- WAVE PANEL ---------- */}
          <WaveHeader progress={hero.progress} height={100} />
          <View style={styles.panel}>
            <View style={styles.grid}>
              <Row gap={10}>
                <BentoTile icon="bowl" title="הוסף ארוחה" value={`${day.list.length} פריטים`} ring={false} onPress={() => router.push('/foods')} accessibilityHint="פותח את גלריית המוצרים" trailing={<View style={styles.plusDot}><Icon name="plus" size={20} color={colors.text} /></View>} />
                {day.adult ? (
                  <BentoTile icon="flame" title="קלוריות" value={consumed.toLocaleString()} target={t.calorieTarget ? t.calorieTarget.toLocaleString() : undefined} progress={pct(consumed, t.calorieTarget)} partial={day.totals.partial.kcal} onPress={() => router.push('/diary')} />
                ) : (
                  <BentoTile icon="list" title="ארוחות היום" value={String(new Set(day.list.map((e) => e.meal)).size)} target="4" progress={hero.progress} onPress={() => router.push('/diary')} />
                )}
              </Row>
              {day.adult && (
                <Row gap={10}>
                  <BentoTile icon="protein" title="חלבון" value={fmt(day.totals.protein)} target={t.proteinTarget ? `${t.proteinTarget}` : undefined} unit="ג׳" progress={pct(day.totals.protein, t.proteinTarget)} partial={day.totals.partial.protein} onPress={() => router.push('/macro/protein')} />
                  <BentoTile icon="wheat" title="פחמימות" value={fmt(day.totals.carbs)} target={t.carbsTarget ? `${t.carbsTarget}` : undefined} unit="ג׳" progress={pct(day.totals.carbs, t.carbsTarget)} partial={day.totals.partial.carbs} onPress={() => router.push('/macro/carbs')} />
                </Row>
              )}
              {day.adult && (
                <BentoTile wide icon="fat" title="שומנים" value={fmt(day.totals.fat)} target={t.fatTarget ? `${t.fatTarget}` : undefined} unit="ג׳" progress={pct(day.totals.fat, t.fatTarget) ?? 0} partial={day.totals.partial.fat} onPress={() => router.push('/macro/fat')} />
              )}
              <Row gap={10}>
                <BentoTile icon="dumbbell" title="אימונים השבוע" value={String(week.workouts)} target={String(Object.values(schedule).filter((x) => x !== 'rest').length)} progress={week.workouts / Math.max(1, Object.values(schedule).filter((x) => x !== 'rest').length)} onPress={() => router.push('/workouts')} />
                <BentoTile icon="drop" title="שתייה" value={(water / 1000).toFixed(1)} target={(profile.waterTargetMl / 1000).toFixed(1)} unit="ליטר" progress={water / profile.waterTargetMl} onPress={() => { addWater(250); haptic.success(); toast('נוספו 250 מ״ל', { label: 'בטל', onPress: () => addWater(-250) }); }} accessibilityHint="מוסיף כוס מים של 250 מ״ל" />
              </Row>
              <BentoTile wide icon="calendar" title="תכנון שבועי" value={`${week.loggedCount}/7 ימים תועדו`} ring={false} onPress={() => router.push('/plan')} />
            </View>

            {/* ---------- WORKOUT CARD ---------- */}
            <Card style={styles.workout}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Tap style={{ flex: 1 }} onPress={() => router.push(plan ? `/workout/${plan.id}` : '/workouts')} label="פרטי האימון">
                <View>
                  <T.Muted>{active ? 'אימון בתהליך' : plan ? (doneToday ? 'הושלם היום' : 'אימון היום') : 'היום יום מנוחה'}</T.Muted>
                  <Text style={styles.workoutName}>{plan ? plan.name : nextDay?.plan ? `הבא: ${nextDay.plan.name}` : 'מנוחה'}</Text>
                  <T.Muted>{plan ? plan.focus : nextDay ? `יום ${DAY_LONG[nextDay.d]} · ${nextDay.plan?.focus ?? ''}` : 'אין אימון מתוכנן השבוע'}</T.Muted>
                </View>
                </Tap>
                {plan && (
                  <Tap onPress={() => router.push(active ? '/workout/active' : `/workout/${plan.id}`)} label={active ? 'המשך אימון' : 'פתח אימון'}>
                    <View style={styles.play}><Icon name="play" size={22} color="#fff" /></View>
                  </Tap>
                )}
              </Row>
              {plan && (
                <View style={{ marginTop: space.md }}>
                  <DottedProgress value={totalEx ? doneEx / totalEx : 0} />
                  <Text style={styles.exCount}>{String(doneEx).padStart(2, '0')} / {String(totalEx).padStart(2, '0')} הושלמו</Text>
                </View>
              )}
            </Card>
          </View>

          {/* ---------- BELOW THE FOLD ---------- */}
          <View style={{ paddingHorizontal: space.md }}>
            <SectionHead title="הארוחה הבאה" action="מתכונים" onAction={() => router.push('/recipes')} />
            <Card onPress={() => router.push(`/recipe/${nextMeal.id}`)} label={nextMeal.name}>
              <Row>
                <View style={styles.mealIcon}><Icon name="bowl" size={26} /></View>
                <View style={{ flex: 1 }}>
                  <T.Body style={{ fontFamily: fonts.medium }}>{nextMeal.name}</T.Body>
                  <T.Muted>{nextMeal.minutes} דק׳ · {nextMealN.kcal != null ? `${Math.round(nextMealN.kcal / nextMeal.servings)} קק״ל למנה` : 'ערכים חלקיים'}</T.Muted>
                </View>
                <Icon name="chevron" size={18} color={colors.text2} />
              </Row>
            </Card>

            <SectionHead title="השבוע שלך" action="סטטיסטיקה" onAction={() => router.push('/(tabs)/stats')} />
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                {weekOf(today).map((d, k) => {
                  const info = week.days[k]!;
                  return (
                    <View key={d} style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`${DAY_LONG[k]}: ${info.logged ? 'תועד' : 'לא תועד'}${info.workouts ? ', אימון' : ''}`}>
                      <Text style={[type.caption, { color: d === today ? colors.accent : colors.text2 }]}>{DAY_SHORT[k]}</Text>
                      <View style={[styles.weekDot, info.logged && styles.weekDotOn, d === today && { borderColor: colors.accent }]}>
                        {info.workouts > 0 && <Icon name="dumbbell" size={13} color={info.logged ? colors.textOnAccent : colors.accent} />}
                      </View>
                    </View>
                  );
                })}
              </Row>
            </Card>

            {nextReminder && (
              <Card style={{ marginTop: space.md }} onPress={() => router.push('/alarm')} label="תזכורת לאימון">
                <Row><Icon name="bell" /><View style={{ flex: 1 }}><T.Body>{nextReminder.title}</T.Body><T.Muted>{nextReminder.time} · לשינוי שעה או ביטול</T.Muted></View><Icon name="chevron" size={18} color={colors.text2} /></Row>
              </Card>
            )}

            <SectionHead title="ימים לניצחון" action={challenge ? 'פרטים' : 'צור אתגר'} onAction={() => router.push(challenge ? `/victory/${challenge.id}` : '/victory/new')} />
            <Card onPress={() => router.push(challenge ? `/victory/${challenge.id}` : '/victory')} label="ימים לניצחון">
              <Row>
                <Icon name="trophy" size={26} />
                <View style={{ flex: 1 }}>
                  <T.Body style={{ fontFamily: fonts.medium }}>{challenge ? challenge.name : 'Road to Victory'}</T.Body>
                  <T.Muted>{challenge ? `${challenge.partner ? `עם ${challenge.partner} · ` : ''}עד ${challenge.endDate.split('-').reverse().join('.')}` : 'אתגר התמדה אישי או עם חבר'}</T.Muted>
                </View>
                <Icon name="chevron" size={18} color={colors.text2} />
              </Row>
            </Card>

            <Card style={{ marginTop: space.md }} onPress={() => router.push('/premium')} label="Premium">
              <Row>
                <Icon name="crown" size={24} />
                <View style={{ flex: 1 }}><T.Body style={{ fontFamily: fonts.medium }}>Premium</T.Body><T.Muted>תוכניות מותאמות, מאמן AI ודוחות מתקדמים</T.Muted></View>
                <Badge text="בקרוב" />
              </Row>
            </Card>
          </View>
        </ScrollView>

        <Sheet visible={menu} onClose={() => setMenu(false)} title="תפריט">
          {[
            ['bell', 'מרכז התראות', '/notifications'], ['alarm', 'שעון מעורר ותזכורות', '/alarm'], ['trophy', 'ימים לניצחון', '/victory'],
            ['calc', 'מחשבון קלוריות', '/calculator'], ['sparkle', 'מאמן AI', '/coach'], ['settings', 'הגדרות', '/settings'],
          ].map(([ic, l, href]) => (
            <ListItem key={href} icon={ic as any} title={l!} onPress={() => { setMenu(false); router.push(href as any); }} />
          ))}
        </Sheet>
      </View>
    </View>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm }}>
      <T.H>{title}</T.H>
      {action && <Tap onPress={onAction} label={action} role="link"><Row gap={2}><T.Muted style={{ color: colors.accent }}>{action}</T.Muted><Icon name="chevron" size={16} /></Row></Tap>}
    </Row>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  heroCenter: { alignItems: 'center', marginTop: 34, gap: 10 },
  greeting: { ...type.label, color: 'rgba(255,255,255,0.72)', fontFamily: fonts.medium, marginBottom: 6 },
  heroLabel: { fontFamily: fonts.medium, fontSize: 21, color: colors.text, marginTop: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.22)' },
  pillText: { ...type.label, color: colors.text, fontFamily: fonts.medium },
  panel: { backgroundColor: colors.surface, paddingHorizontal: space.md, marginTop: -2 },
  grid: { gap: 10 },
  plusDot: { width: 44, height: 44, borderRadius: 19, backgroundColor: 'rgba(232,120,42,0.28)', borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  workout: { marginTop: 12, padding: 18 },
  workoutName: { fontFamily: fonts.semibold, fontSize: 24, color: colors.text, marginVertical: 2 },
  play: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.emberMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accentLight },
  exCount: { ...type.label, color: colors.text2, textAlign: 'center', marginTop: 6, fontVariant: ['tabular-nums'] },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accentLight, borderWidth: 3, borderColor: '#FFD9B8', marginHorizontal: -4, zIndex: 2 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  endRing: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
  mealIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border },
  weekDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  weekDotOn: { backgroundColor: colors.accent, borderColor: colors.accentLight },
});
