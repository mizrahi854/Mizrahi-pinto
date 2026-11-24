import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Row, T, Button, Chip, Section, Stepper, toast, Divider, Field } from '@/components/ui';
import { DotNumber } from '@/components/DotMatrix';
import { useApp, allFoods } from '@/store/useApp';
import { useWeek } from '@/store/selectors';
import { searchLocal } from '@/lib/search';
import { ACTIVITY_FACTORS, estimateMaintenance, defaultMacros, nutrientsFor, fmt, isAdult } from '@/lib/nutrition';
import { DAY_SHORT } from '@/lib/dates';
import type { Food, Profile } from '@/data/types';
import { colors, space, type } from '@/theme/tokens';

/** 27 Calorie & needs calculator (adults only) */
export default function Calculator() {
  const profile = useApp((s) => s.profile);
  const setTargets = useApp((s) => s.setTargets);
  const updateProfile = useApp((s) => s.updateProfile);
  const userFoods = useApp((s) => s.foods);
  const week = useWeek();
  const adult = isAdult(profile.age);
  const [tab, setTab] = useState<'product' | 'needs' | 'week'>('product');

  // product calculator
  const [q, setQ] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [amount, setAmount] = useState(100);
  const results = useMemo(() => (q ? searchLocal(allFoods(userFoods), q).slice(0, 5) : []), [q, userFoods]);
  const n = food ? nutrientsFor(food, amount) : null;

  // needs
  const [h, setH] = useState(profile.heightCm ?? 170);
  const [w, setW] = useState(profile.weightKg ?? 70);
  const [act, setAct] = useState<Profile['activity']>(profile.activity);
  const [sex, setSex] = useState<'male' | 'female' | null>(profile.sex);
  const est = estimateMaintenance({ age: profile.age, heightCm: h, weightKg: w, sex, activity: act });
  const [manual, setManual] = useState(String(profile.calorieTarget ?? ''));

  if (!adult) {
    return (
      <Screen title="מחשבון">
        <Card style={{ marginTop: space.lg }}><T.H>כלי זה מיועד למבוגרים</T.H><T.Muted style={{ marginTop: 6 }}>במסלול שלך המיקוד הוא ארוחות סדירות, כוח, שינה והנאה מפעילות – בלי יעדי קלוריות.</T.Muted></Card>
      </Screen>
    );
  }

  return (
    <Screen title="מחשבון קלוריות">
      <Row style={{ marginBottom: space.md }}>
        <Chip label="מוצר" active={tab === 'product'} onPress={() => setTab('product')} />
        <Chip label="צרכים" active={tab === 'needs'} onPress={() => setTab('needs')} />
        <Chip label="סיכום שבועי" active={tab === 'week'} onPress={() => setTab('week')} />
      </Row>

      {tab === 'product' && (
        <>
          <Field label="חיפוש מוצר" value={q} onChangeText={(t) => { setQ(t); }} placeholder="למשל: אורז" />
          {results.map((f) => <Chip key={f.id} label={f.name} active={food?.id === f.id} onPress={() => { setFood(f); setQ(''); setAmount(f.portions[0]?.grams ?? 100); }} />)}
          {food && (
            <Card style={{ marginTop: space.md, alignItems: 'center', gap: 10 }}>
              <T.H>{food.name}</T.H>
              <Stepper label="כמות" value={amount} step={10} onChange={setAmount} unit={food.basis === 'ml' ? 'מ״ל' : 'ג׳'} />
              {n?.kcal != null ? <DotNumber value={n.kcal} dot={6} gap={2.4} /> : <T.Muted>אין ערך אנרגיה ידוע למוצר</T.Muted>}
              <T.Caption>= ערך ל-100 × {amount} ÷ 100{food.basis === 'ml' ? ' (בסיס מ״ל, ללא המרה לגרם)' : ''}</T.Caption>
              <Row style={{ justifyContent: 'space-around', alignSelf: 'stretch' }}>
                <T.Muted>חלבון {fmt(n?.protein, 'ג׳')}</T.Muted><T.Muted>פחמ׳ {fmt(n?.carbs, 'ג׳')}</T.Muted><T.Muted>שומן {fmt(n?.fat, 'ג׳')}</T.Muted>
              </Row>
              <Button title="פתיחת המוצר להוספה" variant="soft" onPress={() => router.push(`/food/${food.id}`)} />
            </Card>
          )}
          <Button title="מחשבון ארוחה מרובת רכיבים / מתכון" variant="ghost" icon="weight" style={{ marginTop: space.lg }} onPress={() => router.push('/meal-builder')} />
        </>
      )}

      {tab === 'needs' && (
        <>
          <T.Muted style={{ marginBottom: space.md }}>אומדן תחזוקה (Mifflin-St Jeor) – מוצג כטווח. אין גירעון אוטומטי ואין יעד קיצוני.</T.Muted>
          <Row style={{ marginBottom: space.md }}><Chip label="גבר" active={sex === 'male'} onPress={() => setSex('male')} /><Chip label="אישה" active={sex === 'female'} onPress={() => setSex('female')} /></Row>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}><T.Body>גובה</T.Body><Stepper label="גובה" value={h} onChange={setH} unit="ס״מ" min={120} max={230} /></Row>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}><T.Body>משקל</T.Body><Stepper label="משקל" value={w} step={0.5} onChange={setW} unit="ק״ג" min={35} max={300} /></Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(ACTIVITY_FACTORS) as Profile['activity'][]).map((k) => <Chip key={k} label={ACTIVITY_FACTORS[k].label} active={act === k} onPress={() => setAct(k)} />)}
          </View>
          <Card style={{ marginTop: space.lg, alignItems: 'center', gap: 6 }}>
            {est ? (
              <>
                <T.Muted>טווח תחזוקה משוער</T.Muted>
                <Text style={[type.title, { color: colors.text }]}>{`⁦${est.low.toLocaleString()}–${est.high.toLocaleString()}⁩`} קק״ל</Text>
                <T.Caption>BMR ≈ {est.bmr} · מקדם פעילות {ACTIVITY_FACTORS[act].f}</T.Caption>
                <Button title={`קביעת יעד ${est.mid.toLocaleString()} מהיום והלאה`} variant="soft" onPress={() => {
                  const m = defaultMacros(est.mid, w);
                  updateProfile({ heightCm: h, weightKg: w, activity: act, sex });
                  setTargets({ targetMode: 'calculated', calorieTarget: est.mid, proteinTarget: m.protein, carbsTarget: m.carbs, fatTarget: m.fat });
                  toast('היעד עודכן מהיום והלאה. ההיסטוריה נשמרה.');
                }} />
              </>
            ) : <T.Muted>יש לבחור מין ולהזין גובה ומשקל תקינים.</T.Muted>}
          </Card>
          <Divider />
          <Field label="או: יעד שנקבע עם איש מקצוע (קק״ל)" value={manual} onChangeText={setManual} keyboardType="number-pad" />
          <Row>
            <Button style={{ flex: 1 }} title="שמירת יעד" variant="ghost" onPress={() => {
              const v = Number(manual);
              if (!isFinite(v) || v < 1000 || v > 6000) return toast('יעד לא סביר (1000–6000)');
              const m = defaultMacros(v, w);
              setTargets({ targetMode: 'professional', calorieTarget: v, proteinTarget: m.protein, carbsTarget: m.carbs, fatTarget: m.fat });
              toast('נשמר מהיום והלאה');
            }} />
            <Button style={{ flex: 1 }} title="מעקב בלי יעד" variant="ghost" onPress={() => { setTargets({ targetMode: 'none', calorieTarget: null, proteinTarget: null, carbsTarget: null, fatTarget: null }); toast('מעכשיו מעקב ללא יעד'); }} />
          </Row>
        </>
      )}

      {tab === 'week' && (
        <>
          <Card style={{ gap: 8 }}>
            <T.H>ממוצע לימים שתועדו</T.H>
            <T.Body>{week.avgKcal != null ? `${week.avgKcal.toLocaleString()} קק״ל` : 'אין ימים מתועדים השבוע'}</T.Body>
            <T.Muted>{week.loggedCount} מתוך 7 ימים תועדו · ימים חסרים לא נספרים כאפס</T.Muted>
          </Card>
          <Section title="לפי ימים">
            {week.days.map((d, i) => (
              <Row key={d.date} style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
                <T.Body>{DAY_SHORT[i]}</T.Body>
                <T.Muted style={{ color: d.logged ? colors.text : colors.text3 }}>{d.logged ? `${d.totals.kcal} קק״ל${d.totals.partial.kcal ? '*' : ''}` : 'חסר'}</T.Muted>
              </Row>
            ))}
          </Section>
          <T.Caption>אכילה מעל היעד ביום אחד לא מורידה אוטומטית מהימים הבאים.</T.Caption>
        </>
      )}
    </Screen>
  );
}
