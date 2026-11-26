import React, { useEffect, useMemo, useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeOutRight, FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useApp, defaultProfile, SHABBAT_MEALS } from '@/store/useApp';
import type { Profile, MuscleGroup, Reminder, ShabbatMealKey } from '@/data/types';
import { Button, Chip, Field, IconButton, ProgressBar, T, Tap, Card, Row, toast } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { RulerPicker } from '@/components/RulerPicker';
import { DotNumber } from '@/components/DotMatrix';
import { LogoMark, MAX_W } from '@/components/Brand';
import { colors, space, type, radius } from '@/theme/tokens';
import { DAY_SHORT, DAY_LONG, uid } from '@/lib/dates';
import { ACTIVITY_FACTORS, estimateMaintenance, defaultMacros, isAdult } from '@/lib/nutrition';
import { haptic } from '@/lib/haptics';
import { buildTemplate, MUSCLE_LABELS } from '@/lib/workouts';
import { scheduleReminder } from '@/lib/notifications';

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: 'strength', label: 'בניית כוח ושריר', icon: 'dumbbell' },
  { id: 'fitness', label: 'כושר וסיבולת', icon: 'bolt' },
  { id: 'habits', label: 'הרגלי תזונה מסודרים', icon: 'bowl' },
  { id: 'routine', label: 'שגרה קבועה', icon: 'calendar' },
  { id: 'health', label: 'אורח חיים בריא', icon: 'sparkle' },
  { id: 'weight', label: 'שינוי משקל (מבוגרים)', icon: 'weight' },
];
const HABITS = ['ארוחת בוקר קבועה', 'מדלג/ת על ארוחות', 'אוכל/ת מאוחר בערב', 'נשנושים בין הארוחות', 'אוכל/ת בחוץ הרבה', 'מבשל/ת בבית', 'ארוחות לא קבועות'];
const ROUTINE: [Profile['experience'], string, string][] = [['advanced', 'מתאמן/ת באופן קבוע', 'יודע/ת מה לעשות באימון'], ['intermediate', 'חוזר/ת לשגרה', 'מתאמן/ת לסירוגין'], ['beginner', 'מתחיל/ה עכשיו', 'בונה שגרה מאפס']];
const MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps', 'abs', 'cardio', 'full'];
const WEEKEND = ['ארוחת שישי משפחתית', 'אימון בשישי בבוקר', 'שבת של מנוחה', 'בילוי/יציאות בסוף השבוע', 'עבודה או לימודים בשישי', 'ארוחות אצל המשפחה'];
const RESTAURANT_FREQ: [NonNullable<Profile['restaurantFreq']>, string][] = [['rare', 'כמעט אף פעם'], ['monthly', 'פעם-פעמיים בחודש'], ['weekly', 'כל שבוע'], ['often', 'כמה פעמים בשבוע']];
const NOTIFS: [string, string][] = [['workout', 'תזכורת לאימון הבא'], ['daily', 'תזכורת יומית'], ['did_train', '״התאמנת היום?״'], ['plan_week', 'תכנון השבוע (מוצ״ש)'], ['shabbat_prep', 'הכנת תוכנית שבת (חמישי)'], ['meal', 'תיעוד ארוחות'], ['restaurant', 'לפני יציאה למסעדה']];
const PREFS = ['הכל', 'צמחוני', 'טבעוני', 'כשר', 'ללא גלוטן', 'דל לקטוז', 'עתיר חלבון', 'ארוחות מהירות'];
const ALLERGIES = ['חלב', 'ביצים', 'בוטנים', 'אגוזים', 'שומשום', 'סויה', 'דגים', 'גלוטן'];

type Step = 'name' | 'goals' | 'eating' | 'training' | 'routine' | 'weekend' | 'notifs' | 'tracking' | 'metrics' | 'target' | 'building' | 'summary' | 'premium';

/** Personalisation questionnaire (one topic per screen, autosaves a draft). Ends with a plan preview + Premium offer. */
export default function Onboarding() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const editing = params.edit === '1';
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const draft = useApp((s) => s.onboardingDraft);
  const saveDraft = useApp((s) => s.saveDraft);
  const existing = useApp((s) => s.profile);
  const complete = useApp((s) => s.completeOnboarding);
  const updateProfile = useApp((s) => s.updateProfile);
  const setTargets = useApp((s) => s.setTargets);

  const [p, setP] = useState<Profile>(() => ({ ...defaultProfile, ...(editing ? existing : {}), ...(editing ? {} : draft) }) as Profile);
  const adult = isAdult(p.age);
  const steps: Step[] = useMemo(
    () => ['name', 'goals', 'eating', 'training', 'routine', 'weekend', 'notifs', ...(adult ? (['tracking'] as Step[]) : []), ...(adult && p.trackCalories ? (['metrics', 'target'] as Step[]) : []), 'building', 'summary', ...(editing ? [] : (['premium'] as Step[]))],
    [adult, editing, p.trackCalories],
  );
  const [i, setI] = useState(() => Math.min(editing ? 0 : draft.step ?? 0, steps.length - 1));
  const step = steps[i]!;
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));

  useEffect(() => {
    if (!editing) saveDraft({ ...p, step: i });
  }, [p, i, editing, saveDraft]);

  const est = estimateMaintenance(p);

  const canNext = (() => {
    switch (step) {
      case 'name': return p.name.trim().length >= 2 && p.age != null && p.age >= 10 && p.age <= 100;
      case 'goals': return p.goals.length > 0;
      case 'training': return p.trainingDays.length > 0;
      default: return true;
    }
  })();

  const next = () => {
    if (!canNext) return haptic.warn();
    haptic.tap();
    if (step === 'target' && p.targetMode === 'calculated' && !est) return toast('כדי לחשב אומדן יש להזין גובה, משקל ומין במסך הקודם');
    setI((x) => Math.min(steps.length - 1, x + 1));
  };
  const back = () => (i === 0 ? (editing ? goBack('/(tabs)/profile') : goBack('/welcome')) : setI(i - 1));

  const finish = async () => {
    const final: Profile = { ...p, workoutsPerWeek: p.trainingDays.length };
    if (!adult || !p.trackCalories) Object.assign(final, { trackCalories: false, targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null });
    if (!adult) Object.assign(final, { heightCm: null, weightKg: null });
    const template = buildTemplate(final.trainingDays, final.muscleGroups ?? [], final.trainingTime || null);
    // Shabbat plan from the answers
    const sh = useApp.getState().shabbat;
    useApp.getState().updateShabbat({ meals: sh.meals.map((m) => ({ ...m, enabled: (final.shabbatMeals ?? []).includes(m.key) })) });
    // reminders from the chosen notification preferences (existing ones of the same type are kept)
    const existingTypes = new Set(useApp.getState().reminders.map((r) => r.type));
    const all = [0, 1, 2, 3, 4, 5, 6];
    const mk = (type: Reminder['type'], title: string, time: string, days: number[]): Reminder => ({ id: uid(), type, title, time, days, enabled: true, sound: 'default' });
    const want: Reminder[] = [];
    const prefs = final.notifPrefs ?? [];
    const before = (t: string) => { const [h, m] = t.split(':').map(Number); const v = Math.max(0, (h ?? 0) * 60 + (m ?? 0) - 60); return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
    if (prefs.includes('workout')) want.push(mk('workout', 'האימון הבא שלך', before(final.trainingTime || '18:00'), final.trainingDays));
    if (prefs.includes('daily')) want.push(mk('daily', 'תזכורת יומית', final.wakeTime || '07:00', all));
    if (prefs.includes('did_train')) want.push(mk('did_train', 'התאמנת היום?', '20:30', final.trainingDays));
    if (prefs.includes('plan_week')) want.push(mk('plan_week', 'תכנון השבוע', '20:00', [6]));
    if (prefs.includes('shabbat_prep')) want.push(mk('shabbat_prep', 'הכנת תוכנית שישי-שבת', '18:00', [4]));
    if (prefs.includes('meal')) want.push(mk('meal', 'תיעוד ארוחות', '13:30', all));
    const opts = { muted: useApp.getState().settings.muted, muteShabbat: useApp.getState().shabbat.muteDuringShabbat };
    for (const r of want.filter((x) => !existingTypes.has(x.type))) {
      const ids = await scheduleReminder(r, opts).catch(() => []);
      useApp.getState().upsertReminder({ ...r, notificationIds: ids });
    }
    if (editing) {
      updateProfile(final);
      setTargets({ targetMode: final.targetMode, calorieTarget: final.calorieTarget, proteinTarget: final.proteinTarget, carbsTarget: final.carbsTarget, fatTarget: final.fatTarget });
      useApp.getState().applyTemplate(template);
      toast('התוכנית עודכנה');
      goBack();
    } else {
      complete(final, template);
      router.replace('/(tabs)');
    }
  };

  // metrics: the rulers show a starting value – make it the real value (skip clears it)
  useEffect(() => {
    if (step === 'metrics' && p.heightCm == null && p.weightKg == null) set({ heightCm: 170, weightKg: 70 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // building animation auto-advance
  useEffect(() => {
    if (step !== 'building') return;
    const t = setTimeout(() => setI((x) => x + 1), reduce ? 400 : 2600);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const progress = (i + 1) / steps.length;

  return (
    <View style={styles.root}>
      <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <IconButton icon="chevronBack" label="חזרה" onPress={back} size={40} />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <ProgressBar value={progress} />
          </View>
          <Text style={[type.caption, { color: colors.text2, minWidth: 34, textAlign: 'center' }]}>{i + 1}/{steps.length}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={reduce ? undefined : FadeInLeft.duration(320)} exiting={reduce ? undefined : FadeOutRight.duration(200)}>
            {step === 'name' && (
              <>
                <Q title="איך קוראים לך?" sub="נשתמש בשם לברכה האישית." />
                <Field label="שם פרטי" value={p.name} onChangeText={(name) => set({ name })} autoComplete="given-name" placeholder="למשל: אלירן" />
                <Q title="בן/בת כמה את/ה?" sub="הגיל קובע אילו כלים יוצגו. מתחת לגיל 18 לא מוצגים יעדי קלוריות." small />
                <RulerPicker min={10} max={90} value={p.age ?? 25} onChange={(age) => set({ age })} unit="שנים" label="גיל" />
                {p.age == null && <T.Caption style={{ textAlign: 'center', marginTop: 8 }}>גרור את הסרגל או הקלד את הגיל</T.Caption>}
              </>
            )}
            {step === 'goals' && (
              <>
                <Q title="מה המטרות שלך?" sub="אפשר לבחור כמה." />
                {GOALS.filter((g) => adult || g.id !== 'weight').map((g) => (
                  <Option key={g.id} icon={g.icon} label={g.label} selected={p.goals.includes(g.id)} onPress={() => set({ goals: toggle(p.goals, g.id) })} />
                ))}
              </>
            )}
            {step === 'eating' && (
              <>
                <Q title="הרגלי תזונה" sub="בלי שיפוט – רק כדי להתאים את התוכנית. אפשר לבחור כמה." />
                <View style={styles.wrapRow}>{HABITS.map((x) => <Chip key={x} label={x} active={(p.eatingHabits ?? []).includes(x)} onPress={() => set({ eatingHabits: toggle(p.eatingHabits ?? [], x) })} />)}</View>
                <Q title="העדפות מזון" small />
                <View style={styles.wrapRow}>{PREFS.map((x) => <Chip key={x} label={x} active={p.foodPrefs.includes(x)} onPress={() => set({ foodPrefs: toggle(p.foodPrefs, x) })} />)}</View>
                <Q title="רגישויות ואלרגיות" small />
                <View style={styles.wrapRow}>{ALLERGIES.map((x) => <Chip key={x} label={x} active={p.allergies.includes(x)} onPress={() => set({ allergies: toggle(p.allergies, x) })} />)}</View>
              </>
            )}
            {step === 'training' && (
              <>
                <Q title="שגרת האימונים שלך" />
                {ROUTINE.map(([id, l, d]) => <Option key={id} icon="bolt" label={l} desc={d} selected={p.experience === id} onPress={() => set({ experience: id })} radio />)}
                <Q title="אילו קבוצות שרירים אתה מאמן?" sub="נבנה מהן חלוקה שבועית (למשל חזה ויד קדמית / גב ויד אחורית)." small />
                <View style={styles.wrapRow}>{MUSCLES.map((m) => <Chip key={m} label={MUSCLE_LABELS[m]} active={(p.muscleGroups ?? []).includes(m)} onPress={() => set({ muscleGroups: toggle(p.muscleGroups ?? [], m) })} />)}</View>
                <Q title="ימי אימון" sub={`נבחרו ${p.trainingDays.length} אימונים בשבוע`} small />
                <View style={styles.days}>
                  {DAY_SHORT.map((d, idx) => (
                    <Tap key={d} onPress={() => set({ trainingDays: toggle(p.trainingDays, idx).sort() })} label={`יום ${DAY_LONG[idx]}`} role="checkbox">
                      <View style={[styles.day, p.trainingDays.includes(idx) && styles.dayOn]}>
                        <Text style={[type.bodyMedium, { color: p.trainingDays.includes(idx) ? colors.textOnAccent : colors.text }]}>{d}</Text>
                      </View>
                    </Tap>
                  ))}
                </View>
                <Q title="שעת אימון" small />
                <View style={styles.wrapRow}>{['05:00', '06:00', '07:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((t) => <Chip key={t} label={t} active={p.trainingTime === t} onPress={() => set({ trainingTime: t })} />)}</View>
              </>
            )}
            {step === 'routine' && (
              <>
                <Q title="שעת קימה" />
                <View style={styles.wrapRow}>{['04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '09:00'].map((t) => <Chip key={t} label={t} active={p.wakeTime === t} onPress={() => set({ wakeTime: t })} />)}</View>
                <Q title="שעות עבודה או לימודים" sub="כדי שתזכורות ואימונים לא יתנגשו." small />
                <Row style={{ justifyContent: 'space-between' }}><T.Muted>מ-</T.Muted><View style={[styles.wrapRow, { flex: 1, marginStart: 8 }]}>{['07:00', '08:00', '09:00', '10:00'].map((t) => <Chip key={t} label={t} active={p.workStart === t} onPress={() => set({ workStart: t })} />)}</View></Row>
                <Row style={{ justifyContent: 'space-between', marginTop: 8 }}><T.Muted>עד</T.Muted><View style={[styles.wrapRow, { flex: 1, marginStart: 8 }]}>{['14:00', '16:00', '17:00', '18:00', '19:00'].map((t) => <Chip key={t} label={t} active={p.workEnd === t} onPress={() => set({ workEnd: t })} />)}</View></Row>
                <Chip label="אין שעות קבועות" active={!p.workStart && !p.workEnd} onPress={() => set({ workStart: undefined, workEnd: undefined })} />
              </>
            )}
            {step === 'weekend' && (
              <>
                <Q title="שגרת סוף השבוע" sub="אפשר לבחור כמה." />
                <View style={styles.wrapRow}>{WEEKEND.map((x) => <Chip key={x} label={x} active={(p.weekendRoutine ?? []).includes(x)} onPress={() => set({ weekendRoutine: toggle(p.weekendRoutine ?? [], x) })} />)}</View>
                <Q title="ארוחות שישי ושבת" sub="ייכנסו לתוכנית שישי-שבת שלך." small />
                {SHABBAT_MEALS.map((m) => <Option key={m.key} icon="star" label={m.label} selected={(p.shabbatMeals ?? []).includes(m.key)} onPress={() => set({ shabbatMeals: toggle<ShabbatMealKey>(p.shabbatMeals ?? [], m.key) })} />)}
                <Q title="כמה פעמים אתה יוצא למסעדות?" small />
                {RESTAURANT_FREQ.map(([k, l]) => <Option key={k} icon="food" label={l} selected={p.restaurantFreq === k} onPress={() => set({ restaurantFreq: k })} radio />)}
              </>
            )}
            {step === 'notifs' && (
              <>
                <Q title="אילו תזכורות מתאימות לך?" sub="אפשר לשנות בכל רגע. אין התראות בשבת אם תבחר בכך." />
                {NOTIFS.map(([k, l]) => <Option key={k} icon="bell" label={l} selected={(p.notifPrefs ?? []).includes(k)} onPress={() => set({ notifPrefs: toggle(p.notifPrefs ?? [], k) })} />)}
                <T.Caption style={{ marginTop: 8 }}>בגרסת האתר באייפון התזכורות מוצגות בתוך האפליקציה בלבד (מגבלה של iOS לאתרים).</T.Caption>
              </>
            )}
            {step === 'tracking' && (
              <>
                <Q title="לספור קלוריות?" sub="בחירה שלך. אפשר לשנות בכל עת." />
                <Option icon="flame" label="כן, מעקב קלוריות" desc="קלוריות, חלבון, פחמימות ושומן + אפשרות ״הוסף קלוריות״" selected={!!p.trackCalories} onPress={() => set({ trackCalories: true })} radio />
                <Option icon="bowl" label="לא, רק יומן ארוחות והרגלים" desc="בלי מספרים – רק מה אכלתי ומתי" selected={!p.trackCalories} onPress={() => set({ trackCalories: false, targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null })} radio />
              </>
            )}
            {step === 'metrics' && (
              <>
                <Q title="מדדים (לא חובה)" sub="משמשים רק לאומדן צרכים. אפשר לדלג ולהשתמש באפליקציה בלי זה." />
                <Row style={{ marginBottom: space.lg }}>
                  <Chip label="גבר" active={p.sex === 'male'} onPress={() => set({ sex: 'male' })} />
                  <Chip label="אישה" active={p.sex === 'female'} onPress={() => set({ sex: 'female' })} />
                </Row>
                <T.H style={{ marginBottom: 8 }}>גובה</T.H>
                <RulerPicker min={130} max={220} value={p.heightCm ?? 170} onChange={(heightCm) => set({ heightCm })} unit="ס״מ" label="גובה" />
                <T.H style={{ marginVertical: 8, marginTop: space.xl }}>משקל</T.H>
                <RulerPicker min={40} max={180} step={0.5} decimals={1} value={p.weightKg ?? 70} onChange={(weightKg) => set({ weightKg })} unit="ק״ג" label="משקל" />
                <T.H style={{ marginTop: space.xl, marginBottom: 8 }}>רמת פעילות</T.H>
                {(Object.keys(ACTIVITY_FACTORS) as Profile['activity'][]).map((k) => (
                  <Option key={k} icon="bolt" label={ACTIVITY_FACTORS[k].label} selected={p.activity === k} onPress={() => set({ activity: k })} radio />
                ))}
                <Button title="דלג על המדדים" variant="ghost" onPress={() => { set({ heightCm: null, weightKg: null, sex: null, targetMode: p.targetMode === 'calculated' ? 'none' : p.targetMode }); setI(i + 1); }} style={{ marginTop: space.md }} />
              </>
            )}
            {step === 'target' && (
              <>
                <Q title="יעד אנרגיה יומי" sub="היעד שלך – לא חובה. אין גירעון אוטומטי." />
                <Option icon="calc" label="לפי אומדן תחזוקה" desc={est ? `טווח משוער ${est.low.toLocaleString()}–${est.high.toLocaleString()} קק״ל (${est.formula})` : 'דורש גובה, משקל ומין'} selected={p.targetMode === 'calculated'} onPress={() => {
                  if (!est) return toast('חסרים נתונים לחישוב');
                  const m = defaultMacros(est.mid, p.weightKg);
                  set({ targetMode: 'calculated', calorieTarget: est.mid, proteinTarget: m.protein, carbsTarget: m.carbs, fatTarget: m.fat });
                }} radio />
                <Option icon="user" label="יעד שקבעתי עם איש מקצוע" selected={p.targetMode === 'professional'} onPress={() => set({ targetMode: 'professional', calorieTarget: p.calorieTarget ?? 2000 })} radio />
                <Option icon="list" label="מעקב בלי יעד" desc="המסך הראשי יציג את מה שתיעדת, בלי תקציב" selected={p.targetMode === 'none'} onPress={() => set({ targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null })} radio />
                {p.targetMode !== 'none' && p.calorieTarget != null && (
                  <Card style={{ marginTop: space.md, gap: 8 }}>
                    <T.Muted>יעד יומי (ניתן לעריכה)</T.Muted>
                    <RulerPicker min={1200} max={4500} step={10} value={p.calorieTarget} onChange={(calorieTarget) => { const m = defaultMacros(calorieTarget, p.weightKg); set({ calorieTarget, proteinTarget: m.protein, carbsTarget: m.carbs, fatTarget: m.fat }); }} unit="קק״ל" label="יעד קלוריות" />
                    <Row style={{ justifyContent: 'space-around', marginTop: 8 }}>
                      <MiniStat l="חלבון" v={`${p.proteinTarget ?? '—'} ג׳`} /><MiniStat l="פחמימות" v={`${p.carbsTarget ?? '—'} ג׳`} /><MiniStat l="שומן" v={`${p.fatTarget ?? '—'} ג׳`} />
                    </Row>
                  </Card>
                )}
              </>
            )}
            {step === 'building' && <Building />}
            {step === 'summary' && <Summary p={p} />}
            {step === 'premium' && (
              <>
                <View style={{ alignItems: 'center', marginTop: space.lg }}><Icon name="crown" size={48} /></View>
                <T.Title style={{ textAlign: 'center', marginTop: 8 }}>Premium – בקרוב</T.Title>
                <T.Muted style={{ textAlign: 'center', marginTop: 6 }}>כרגע ללא רכישה וללא חיוב. כל מה שבתוכנית שלך זמין לך עכשיו.</T.Muted>
                {['זיהוי מזון מתמונה (AI) – כשהשירות יחובר', 'תוכנית שבועית מותאמת ותוכנית שישי-שבת', 'מצב מסעדה ומאמן אישי חכם', 'דוחות, מחשבונים מתקדמים ותזכורות חכמות', 'ארוחות שמורות ללא הגבלה ורשימות קניות'].map((x) => (
                  <Row key={x} style={{ marginTop: space.sm }}><Icon name="check" size={18} /><T.Body style={{ flex: 1 }}>{x}</T.Body></Row>
                ))}
                <Button title="פרטים על Premium" variant="ghost" style={{ marginTop: space.xl }} onPress={async () => { await finish(); router.push('/premium'); }} />
              </>
            )}
          </Animated.View>
        </ScrollView>
        {step !== 'building' && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
            {step === 'summary' && !editing ? (
              <Button title="המשך" icon="chevron" onPress={next} />
            ) : step === 'premium' || (step === 'summary' && editing) ? (
              <Button title={editing ? 'שמירת שינויים' : 'המשך בחינם'} onPress={finish} />
            ) : (
              <Button title="המשך" onPress={next} disabled={!canNext} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Q({ title, sub, small }: { title: string; sub?: string; small?: boolean }) {
  return (
    <View style={{ marginBottom: space.md, marginTop: small ? space.xl : space.sm }}>
      <Text accessibilityRole="header" style={[small ? type.heading : type.hero, { color: colors.text }]}>{title}</Text>
      {sub && <T.Muted style={{ marginTop: 6 }}>{sub}</T.Muted>}
    </View>
  );
}

function Option({ icon, label, desc, selected, onPress, radio }: { icon: IconName; label: string; desc?: string; selected: boolean; onPress: () => void; radio?: boolean }) {
  return (
    <Tap onPress={onPress} label={label} role={radio ? 'radio' : 'checkbox'}>
      <View style={[styles.option, selected && styles.optionOn]}>
        <View style={styles.optIcon}><Icon name={icon} size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMedium, { color: colors.text }]}>{label}</Text>
          {desc && <Text style={[type.caption, { color: colors.text2, marginTop: 2 }]}>{desc}</Text>}
        </View>
        <View style={[styles.check, selected && styles.checkOn]}>{selected && <Icon name="check" size={14} color={colors.textOnAccent} strokeWidth={2.4} />}</View>
      </View>
    </Tap>
  );
}

function MiniStat({ l, v }: { l: string; v: string }) {
  return <View style={{ alignItems: 'center' }}><T.Value style={{ fontSize: 16 }}>{v}</T.Value><T.Caption>{l}</T.Caption></View>;
}

function Building() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(100, x + 4)), 90);
    return () => clearInterval(t);
  }, []);
  const lines = ['מנתח את התשובות שלך', 'בונה תוכנית אימונים שבועית', 'מכין תוכנית שישי-שבת', 'מכין תזכורות'];
  return (
    <View style={{ alignItems: 'center', paddingTop: 80, gap: 18 }}>
      <Animated.View entering={ZoomIn}><LogoMark size={64} /></Animated.View>
      <DotNumber value={n} suffix="%" dot={8} gap={3} />
      <T.H>בונים את התוכנית שלך</T.H>
      {lines.map((l, k) => n > (k + 1) * 20 && (
        <Animated.View key={l} entering={FadeIn}><Row><Icon name="check" size={16} /><T.Muted>{l}</T.Muted></Row></Animated.View>
      ))}
    </View>
  );
}

function Summary({ p }: { p: Profile }) {
  const tmpl = buildTemplate(p.trainingDays, p.muscleGroups ?? [], p.trainingTime || null);
  const calories = isAdult(p.age) && !!p.trackCalories;
  return (
    <>
      <Q title={`${p.name || 'התוכנית שלך'}, זו התוכנית הראשונית`} sub="תצוגה מקדימה – הכל ניתן לעריכה מהתוכנית השבועית ומהפרופיל." />
      <Card style={{ gap: 10 }}>
        <T.H>שבוע אימונים</T.H>
        {tmpl.map((t) => (
          <Row key={t.day} style={{ justifyContent: 'space-between' }}>
            <T.Body>{DAY_LONG[t.day]}</T.Body>
            <T.Muted style={{ color: t.rest ? colors.text3 : colors.accentLight }}>{t.rest ? 'מנוחה' : `${t.name}${t.time ? ` · ${t.time}` : ''}`}</T.Muted>
          </Row>
        ))}
      </Card>
      <Card style={{ marginTop: space.md, gap: 6 }}>
        <T.H>תזונה</T.H>
        <T.Muted>{calories ? (p.calorieTarget ? `מעקב קלוריות · יעד יומי ${p.calorieTarget.toLocaleString()} קק״ל · חלבון ${p.proteinTarget} ג׳` : 'מעקב קלוריות ללא יעד') : 'יומן ארוחות והרגלים, בלי מספרים.'}</T.Muted>
        {p.allergies.length > 0 && <T.Muted>רגישויות: {p.allergies.join(', ')}</T.Muted>}
      </Card>
      <Card style={{ marginTop: space.md, gap: 6 }}>
        <T.H>שישי ושבת</T.H>
        <T.Muted>{(p.shabbatMeals ?? []).length ? SHABBAT_MEALS.filter((m) => p.shabbatMeals!.includes(m.key)).map((m) => m.label).join(' · ') : 'ללא ארוחות קבועות'}</T.Muted>
      </Card>
      <Card style={{ marginTop: space.md, gap: 6 }}>
        <T.H>תזכורות</T.H>
        <T.Muted>{(p.notifPrefs ?? []).length ? NOTIFS.filter(([k]) => p.notifPrefs!.includes(k)).map(([, l]) => l).join(' · ') : 'ללא תזכורות'}{p.wakeTime ? ` · קימה ${p.wakeTime}` : ''}</T.Muted>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, width: '100%', maxWidth: MAX_W, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: space.md, paddingTop: 12, backgroundColor: 'rgba(11,7,5,0.95)' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, marginBottom: 10, minHeight: 60 },
  optionOn: { borderColor: colors.accent, backgroundColor: 'rgba(232,120,42,0.10)' },
  optIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 44, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
  dayOn: { backgroundColor: colors.accent, borderColor: colors.accentLight },
});
