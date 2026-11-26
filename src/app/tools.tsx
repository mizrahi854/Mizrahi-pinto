import { DotNumber } from '@/components/DotMatrix';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LightScreen, LCard, Segmented, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, Group, LInput, Note } from '@/components/forms';
import { useApp, allFoods, tracksCalories } from '@/store/useApp';
import { ACTIVITY_FACTORS, estimateMaintenance, bmiAdult, isAdult, nutrientsFor, gramsToPortions, fmt, defaultMacros } from '@/lib/nutrition';
import { searchLocal } from '@/lib/search';
import type { Food, Profile } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';

type Tab = 'body' | 'food' | 'portions';

/**
 * "מחשבונים וכלים": BMI/BMR/TDEE (adults only), nutrients by amount, grams↔portions, measurements.
 * Accuracy limits are shown next to every result. Under 18: no adult BMI categories and no calorie-restriction tools.
 */
export default function Tools() {
  const profile = useApp((s) => s.profile);
  const adult = isAdult(profile.age);
  const [tab, setTab] = useState<Tab>(adult ? 'body' : 'food');
  const bmi = bmiAdult(profile);
  return (
    <LightScreen title="מחשבונים וכלים" heroHeight={112} hero={
      <View style={{ alignItems: 'center', gap: 6 }} accessible accessibilityLabel={adult && bmi ? `BMI נוכחי ${bmi.value}` : 'כלים מותאמי גיל'}>
        {adult && bmi ? <DotNumber value={Math.round(bmi.value)} dot={6} gap={2.6} /> : <Icon name="calc" size={44} color="#fff" />}
        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: 'rgba(245,245,245,0.8)' }}>{adult && bmi ? `BMI לפי הפרופיל · ${bmi.category}` : adult ? 'הזן גובה ומשקל לחישוב' : 'כלים מותאמי גיל'}</Text>
      </View>
    }>
      <Segmented value={tab} onChange={setTab} options={[...(adult ? [{ key: 'body' as Tab, label: 'גוף ואנרגיה' }] : []), { key: 'food', label: 'ערכים לפי כמות' }, { key: 'portions', label: 'גרמים ומנות' }]} />
      {!adult && (
        <View style={{ marginTop: space.md }}>
          <Note text="מתחת לגיל 18 לא מוצגים סיווג BMI של מבוגרים ומחשבוני הגבלה קלורית. הערכת גדילה בגילים האלה נעשית לפי עקומות גדילה ובליווי איש מקצוע (רופא/ה או דיאטן/ית)." />
        </View>
      )}
      {tab === 'body' && adult && <BodyCalc profile={profile} />}
      {tab === 'food' && <FoodCalc />}
      {tab === 'portions' && <PortionCalc />}

      <Tap onPress={() => router.push('/measurements')} label="יומן מדידות אישי">
        <LCard style={styles.link}>
          <Icon name="weight" size={24} color={light.accent} />
          <View style={{ flex: 1 }}><Text style={ls.bodyStrong}>יומן מדידות</Text><Text style={ls.muted}>משקל, היקף מותניים וגובה · היסטוריה וגרפים</Text></View>
          <Icon name="chevronBack" size={18} color={light.text2} />
        </LCard>
      </Tap>
    </LightScreen>
  );
}

function BodyCalc({ profile }: { profile: Profile }) {
  const updateProfile = useApp((s) => s.updateProfile);
  const setTargets = useApp((s) => s.setTargets);
  const calories = tracksCalories(profile);
  const [h, setH] = useState(profile.heightCm?.toString() ?? '');
  const [w, setW] = useState(profile.weightKg?.toString() ?? '');
  const [age, setAge] = useState(profile.age?.toString() ?? '');
  const [sex, setSex] = useState<Profile['sex']>(profile.sex);
  const [act, setAct] = useState<Profile['activity']>(profile.activity);
  const input = { age: Number(age) || null, heightCm: Number(h) || null, weightKg: Number(w) || null, sex, activity: act };
  const bmi = bmiAdult(input);
  const est = estimateMaintenance(input);
  return (
    <View>
      <Group>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><LInput label="גובה (ס״מ)" value={h} onChangeText={(t) => setH(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} /></View>
          <View style={{ flex: 1 }}><LInput label="משקל (ק״ג)" value={w} onChangeText={(t) => setW(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" maxLength={5} /></View>
          <View style={{ flex: 1 }}><LInput label="גיל" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} /></View>
        </View>
        <Chips label="מין (לנוסחת BMR)" options={[{ key: 'male', label: 'זכר' }, { key: 'female', label: 'נקבה' }]} value={sex ?? ''} onChange={setSex} />
        <Chips label="רמת פעילות" options={(Object.keys(ACTIVITY_FACTORS) as Profile['activity'][]).map((k) => ({ key: k, label: ACTIVITY_FACTORS[k].label }))} value={act} onChange={setAct} />
      </Group>

      <View style={styles.results}>
        <Result title="BMI" value={bmi ? String(bmi.value) : '—'} sub={bmi ? bmi.category : 'הזן גובה ומשקל'} />
        <Result title="BMR" value={est ? est.bmr.toLocaleString() : '—'} sub="קק״ל במנוחה" />
        <Result title="TDEE" value={est ? `~${est.mid.toLocaleString()}` : '—'} sub={est ? `טווח ${est.low.toLocaleString()}–${est.high.toLocaleString()}` : 'קק״ל ביום'} />
      </View>
      <Note text="מגבלות דיוק: BMI לא מבחין בין שריר לשומן ואינו מתאים לספורטאים, להריון או לגיל השלישי. BMR לפי נוסחת Mifflin-St Jeor ו-TDEE לפי מקדם פעילות – הערכה בלבד, עם סטייה אישית של ±10% ויותר. לא אבחנה רפואית." />
      {est && (
        <View style={{ gap: 8, marginTop: space.md }}>
          <LBtn title="שמירת הנתונים בפרופיל" onPress={() => { updateProfile({ heightCm: input.heightCm, weightKg: input.weightKg, sex, activity: act }); toast('נשמר בפרופיל'); }} />
          {calories && <LBtn primary title={`קביעת יעד יומי: ${est.mid.toLocaleString()} קק״ל`} onPress={() => { const m = defaultMacros(est.mid, input.weightKg); setTargets({ targetMode: 'calculated', calorieTarget: est.mid, proteinTarget: m.protein, carbsTarget: m.carbs, fatTarget: m.fat }); toast('היעד עודכן מהיום והלאה'); }} />}
        </View>
      )}
    </View>
  );
}

function useFoodSearch() {
  const userFoods = useApp((s) => s.foods);
  const [q, setQ] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const results = useMemo(() => (q.trim().length < 2 || food ? [] : searchLocal(allFoods(userFoods), q, 6)), [q, userFoods, food]);
  const picker = (
    <View style={{ gap: 8 }}>
      <LInput label="מאכל" value={food ? food.name : q} onChangeText={(t) => { setFood(null); setQ(t); }} placeholder="חיפוש במאגר" accessibilityLabel="חיפוש מאכל" />
      {results.map((f) => (
        <Pressable key={f.id} onPress={() => setFood(f)} accessibilityRole="button" accessibilityLabel={`בחירת ${f.name}`} style={styles.res}>
          <Text style={ls.body} numberOfLines={1}>{f.name}</Text>
        </Pressable>
      ))}
    </View>
  );
  return { food, picker };
}

function FoodCalc() {
  const { food, picker } = useFoodSearch();
  const [grams, setGrams] = useState('100');
  const g = Number(grams) || 0;
  const n = food ? nutrientsFor(food, g) : null;
  const calories = useApp((s) => tracksCalories(s.profile));
  return (
    <Group title="ערכים תזונתיים לפי כמות">
      {picker}
      <LInput label={`כמות (${food?.basis === 'ml' ? 'מ״ל' : 'גרם'})`} value={grams} onChangeText={(t) => setGrams(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" />
      {food && n && (
        <LCard style={{ gap: 6 }}>
          {calories && <Row l="קלוריות" v={fmt(n.kcal)} />}
          <Row l="חלבון" v={fmt(n.protein, ' ג׳')} />
          <Row l="פחמימות" v={fmt(n.carbs, ' ג׳')} />
          <Row l="שומן" v={fmt(n.fat, ' ג׳')} />
          <Row l="סיבים" v={fmt(n.fiber, ' ג׳')} />
          <Text style={ls.caption}>מקור: {food.source}. ״—״ = אין נתון (לא אפס).</Text>
        </LCard>
      )}
    </Group>
  );
}

function PortionCalc() {
  const { food, picker } = useFoodSearch();
  const [grams, setGrams] = useState('100');
  return (
    <Group title="המרת גרמים למנות">
      {picker}
      <LInput label="כמות בגרמים" value={grams} onChangeText={(t) => setGrams(t.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" />
      {food && (
        <LCard style={{ gap: 6 }}>
          {food.portions.length ? food.portions.map((p) => (
            <Row key={p.label} l={`${p.label} (${p.grams} ג׳)`} v={`${gramsToPortions(Number(grams) || 0, p.grams)} ${p.label}`} />
          )) : <Text style={ls.muted}>אין מנות מוגדרות למאכל הזה – הכמות נמדדת בגרמים.</Text>}
          <Text style={ls.caption}>משקלי מנה לפי {food.verified ? 'מאגר צמרת (משקל ממוצע)' : 'המקור של המוצר'}.</Text>
        </LCard>
      )}
    </Group>
  );
}

function LBtn({ title, onPress, primary }: { title: string; onPress: () => void; primary?: boolean }) {
  return (
    <Tap onPress={onPress} label={title}>
      <View style={[styles.btn, primary && { backgroundColor: light.accentText, borderColor: light.accentText }]}><Text style={[styles.btnText, primary && { color: '#fff' }]}>{title}</Text></View>
    </Tap>
  );
}

function Result({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <View style={styles.result} accessible accessibilityLabel={`${title}: ${value}, ${sub}`}>
      <Text style={ls.muted}>{title}</Text>
      <Text style={styles.resultV} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
      <Text style={[ls.muted, { textAlign: 'center' }]}>{sub}</Text>
    </View>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 }} accessible accessibilityLabel={`${l}: ${v}`}>
      <Text style={ls.body}>{l}</Text><Text style={ls.bodyStrong}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  results: { flexDirection: 'row', gap: 8, marginVertical: space.md },
  result: { flex: 1, backgroundColor: light.card, borderRadius: radius.md, padding: 10, alignItems: 'center', gap: 2 },
  resultV: { fontFamily: fonts.bold, fontSize: 20, color: light.text },
  res: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: light.cardSoft },
  btn: { minHeight: 52, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.35)', backgroundColor: light.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { fontFamily: fonts.semibold, fontSize: 15.5, color: light.accentText, textAlign: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: space.lg },
});
