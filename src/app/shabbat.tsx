import { DotNumber } from '@/components/DotMatrix';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LightScreen, LCard, LPrimary, ls } from '@/components/light';
import { Tap, toast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Chips, Group, ToggleRow, Note, TimeField } from '@/components/forms';
import { DishPicker } from '@/components/DishPicker';
import { useApp, SHABBAT_MEALS, tracksCalories } from '@/store/useApp';
import { totalsOf } from '@/lib/engine';
import { weekOf, dateKey, parseKey } from '@/lib/dates';
import { WORKOUT_PRESETS } from '@/lib/workouts';
import type { ShabbatPlan, WorkoutTemplate } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const SUGGEST = ['חלה', 'דג', 'חמין', 'קוסקוס', 'אורז', 'קובה', 'סלט', 'עוף', 'בשר', 'תפוחי אדמה', 'קוגל', 'עוגת', 'קינוח'];

/** Friday & Shabbat plan: meals (family/special dishes), weekend workouts, shopping list, weekly repeat, quiet Shabbat. */
export default function Shabbat() {
  const p = useLocalSearchParams<{ week?: string }>();
  const plan = useApp((s) => s.shabbat);
  const update = useApp((s) => s.updateShabbat);
  const apply = useApp((s) => s.applyShabbat);
  const addShopping = useApp((s) => s.addShopping);
  const calories = useApp((s) => tracksCalories(s.profile));
  const weekStart = p.week ?? weekOf(dateKey())[0]!;
  const days = weekOf(weekStart);
  const applied = plan.appliedWeeks.includes(weekStart);
  const [openMeal, setOpenMeal] = useState<string | null>(null);
  const [item, setItem] = useState('');
  const fri = parseKey(days[5]!);
  const untilFri = Math.max(0, Math.round((parseKey(days[5]!).getTime() - parseKey(dateKey()).getTime()) / 86400000));
  const sat = parseKey(days[6]!);
  const setMeal = (key: string, patch: Partial<ShabbatPlan['meals'][number]>) => update({ meals: plan.meals.map((m) => (m.key === key ? { ...m, ...patch } : m)) });
  const allDishes = plan.meals.filter((m) => m.enabled).flatMap((m) => m.dishes);
  const total = totalsOf(allDishes);

  return (
    <LightScreen title="שישי ושבת" subtitle={`${fri.getDate()}/${fri.getMonth() + 1} – ${sat.getDate()}/${sat.getMonth() + 1}`}
      heroHeight={150}
      hero={
        <View style={styles.hero} accessible accessibilityLabel={untilFri > 0 ? `עוד ${untilFri} ימים לשישי` : 'סוף השבוע כאן'}>
          <View style={styles.candles} accessibilityElementsHidden>
            {[0, 1].map((k) => (<View key={k} style={styles.candle}><View style={styles.flame} /><View style={styles.wax} /></View>))}
          </View>
          <View style={{ alignItems: 'flex-start', gap: 4 }}>
            {untilFri > 0 ? <DotNumber value={untilFri} dot={6} gap={2.6} /> : <Text style={styles.heroBig}>שבת שלום</Text>}
            <Text style={styles.heroSub}>{untilFri > 0 ? 'ימים לשישי' : 'סוף השבוע כאן'} · {plan.meals.filter((m) => m.enabled).length} ארוחות בתוכנית</Text>
          </View>
        </View>
      }
      footer={<LPrimary title={applied ? 'עדכון התוכנית בשבוע הזה' : 'הוספה לתוכנית השבוע'} icon="calendar" onPress={() => {
        const n = apply(weekStart);
        haptic.success();
        toast(n ? `${n} ארוחות שבת נוספו לתוכנית` : 'התוכנית כבר בשבוע הזה – עודכנו אימונים ורשימת קניות', { label: 'לתוכנית', onPress: () => router.push('/(tabs)/plan') });
      }} />}>
      {applied && <Note text="התוכנית כבר נוספה לשבוע הזה. אפשר לערוך כל ארוחה גם מהתוכנית השבועית." />}

      <Group title="הארוחות">
        {plan.meals.map((m) => {
          const def = SHABBAT_MEALS.find((x) => x.key === m.key)!;
          const open = openMeal === m.key;
          const t = totalsOf(m.dishes);
          return (
            <LCard key={m.key} style={{ gap: 10, opacity: m.enabled ? 1 : 0.7 }}>
              <View style={styles.mealHead}>
                <Pressable onPress={() => setOpenMeal(open ? null : m.key)} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${def.label}, ${m.dishes.length} מנות`} style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
                  <Text style={ls.bodyStrong}>{def.label}</Text>
                  <Text style={ls.muted} numberOfLines={1}>{m.dishes.length ? m.dishes.map((d) => d.name.split(',')[0]).join(' · ') : 'עוד לא נבחרו מנות'}{calories && m.dishes.length ? ` · ${t.kcal} קק״ל` : ''}</Text>
                </Pressable>
                <Pressable onPress={() => setMeal(m.key, { enabled: !m.enabled })} accessibilityRole="switch" accessibilityState={{ checked: m.enabled }} accessibilityLabel={`${def.label} בתוכנית`} style={styles.swHit}><View style={[styles.sw, m.enabled && styles.swOn]}><View style={styles.knob} /></View></Pressable>
              </View>
              {open && (
                <View style={{ gap: 10 }}>
                  <ToggleRow icon="user" title="ארוחה משפחתית" value={m.family} onChange={(v) => setMeal(m.key, { family: v })} />
                  {m.dishes.map((d, i) => (
                    <View key={i} style={styles.dish}>
                      <Text style={[ls.body, { flex: 1 }]} numberOfLines={2}>{d.name}</Text>
                      <Text style={ls.muted}>{d.amount} {d.unitLabel}</Text>
                      <Tap onPress={() => setMeal(m.key, { dishes: m.dishes.filter((_, k) => k !== i) })} label={`הסרת ${d.name}`}><View style={styles.x}><Icon name="close" size={18} color={light.text2} /></View></Tap>
                    </View>
                  ))}
                  <DishPicker suggestions={SUGGEST} placeholder="הוספת מנה (חלה, חמין, קובה…)" onPick={(d) => setMeal(m.key, { dishes: [...m.dishes, d], enabled: true })} />
                  <TextInput value={m.note ?? ''} onChangeText={(t) => setMeal(m.key, { note: t })} placeholder="הערה: אצל מי, כמה סועדים, מה להכין מראש" placeholderTextColor={light.text3} style={styles.input} accessibilityLabel={`הערה ל${def.label}`} />
                </View>
              )}
            </LCard>
          );
        })}
        {calories && allDishes.length > 0 && <Text style={ls.muted}>סך המנות שנבחרו: {total.kcal.toLocaleString()}{total.partial.kcal ? '*' : ''} קק״ל לפי מאגר צמרת (ערך ממוצע). אפשר לקבוע יעד גמיש לשבת בתוכנית השבועית.</Text>}
      </Group>

      <Group title="אימונים בסוף השבוע">
        <WorkoutPick label="שישי" value={plan.friWorkout} onChange={(w) => update({ friWorkout: w })} day={5} />
        <WorkoutPick label="שבת" value={plan.satWorkout} onChange={(w) => update({ satWorkout: w })} day={6} />
      </Group>

      <Group title="רשימת קניות לשבת">
        {plan.shopping.map((s, i) => (
          <View key={i} style={styles.dish}>
            <Icon name="cart" size={18} color={light.accent} />
            <Text style={[ls.body, { flex: 1 }]}>{s}</Text>
            <Tap onPress={() => update({ shopping: plan.shopping.filter((_, k) => k !== i) })} label={`הסרת ${s}`}><View style={styles.x}><Icon name="close" size={18} color={light.text2} /></View></Tap>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={item} onChangeText={setItem} placeholder="פריט לקנייה" placeholderTextColor={light.text3} style={[styles.input, { flex: 1 }]} accessibilityLabel="פריט לרשימת הקניות" onSubmitEditing={() => { if (item.trim()) { update({ shopping: [...plan.shopping, item.trim()] }); setItem(''); } }} returnKeyType="done" />
          <Tap onPress={() => { if (item.trim()) { update({ shopping: [...plan.shopping, item.trim()] }); setItem(''); } }} label="הוספת פריט"><View style={styles.addBtn}><Icon name="plus" size={22} color="#fff" /></View></Tap>
        </View>
        {allDishes.length > 0 && (
          <Tap onPress={() => { const names = [...new Set(allDishes.map((d) => d.name.split(',')[0]!.trim()))]; update({ shopping: [...new Set([...plan.shopping, ...names])] }); toast(`${names.length} מנות נוספו לרשימה`); }} label="הוספת המנות שנבחרו לרשימה">
            <Text style={styles.link}>+ הוספת המנות שנבחרו לרשימה</Text>
          </Tap>
        )}
        {plan.shopping.length > 0 && (
          <Tap onPress={() => { addShopping(plan.shopping.map((name) => ({ name, qty: '' }))); toast('נשלח לרשימת הקניות', { label: 'לרשימה', onPress: () => router.push('/shopping') }); }} label="שליחה לרשימת הקניות הכללית">
            <Text style={styles.link}>שליחה לרשימת הקניות ›</Text>
          </Tap>
        )}
      </Group>

      <Group title="הגדרות">
        <ToggleRow icon="repeat" title="תוכנית שבת קבועה" subtitle="תתווסף אוטומטית לכל שבוע חדש" value={plan.autoRepeat} onChange={(v) => update({ autoRepeat: v })} />
        <ToggleRow icon="mute" title="השתקת התראות בשבת" subtitle="משישי 16:00 ועד מוצאי שבת (בקירוב – הזמנים משתנים לפי עונה ועיר)" value={plan.muteDuringShabbat} onChange={(v) => update({ muteDuringShabbat: v })} />
        <ToggleRow icon="bell" title="תזכורת לתעד אחרי צאת השבת" subtitle="הארוחות נשמרות כתכנון – מסמנים ״נאכל״ במוצאי שבת" value={plan.remindAfterShabbat} onChange={(v) => update({ remindAfterShabbat: v })} />
      </Group>
      <View style={{ marginTop: space.md }}>
        <Note text="ערכי המאכלים הביתיים לקוחים ממאגר צמרת של משרד הבריאות – ממוצע למתכון כללי. במטבח שלך הערכים יכולים להיות שונים, ואפשר לעדכן ביומן." />
      </View>
    </LightScreen>
  );
}

function WorkoutPick({ label, value, onChange, day }: { label: string; value: WorkoutTemplate | null; onChange: (w: WorkoutTemplate | null) => void; day: number }) {
  const opts = [{ key: 'none', label: 'ללא' }, ...WORKOUT_PRESETS.filter((p) => p.key !== 'custom').map((p) => ({ key: p.key, label: p.name }))];
  const cur = value ? WORKOUT_PRESETS.find((p) => p.name === value.name)?.key ?? 'none' : 'none';
  return (
    <LCard style={{ gap: 10 }}>
      <Chips label={label} options={opts} value={cur} onChange={(k: string) => {
        if (k === 'none') return onChange(null);
        const pr = WORKOUT_PRESETS.find((p) => p.key === k)!;
        onChange({ day, name: pr.name, muscles: pr.muscles, rest: pr.rest, time: pr.rest ? null : value?.time ?? (day === 5 ? '08:00' : '09:00'), durationMin: 60 });
      }} />
      {value && !value.rest && <TimeField value={value.time} onChange={(t) => onChange({ ...value, time: t })} optional quick={['07:00', '08:00', '09:00', '10:00', '17:00']} />}
    </LCard>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  candles: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
  candle: { alignItems: 'center' },
  flame: { width: 14, height: 22, borderRadius: 10, backgroundColor: '#FFB36B', ...({ boxShadow: '0 0 18px 6px rgba(245,121,37,0.55)' } as any) },
  wax: { width: 16, height: 62, borderRadius: 4, marginTop: 6, backgroundColor: '#ECE8E2' },
  heroBig: { fontFamily: fonts.bold, fontSize: 30, color: '#fff' },
  heroSub: { fontFamily: fonts.medium, fontSize: 14, color: 'rgba(245,245,245,0.8)' },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swHit: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  sw: { width: 50, height: 30, borderRadius: 15, backgroundColor: '#D0D1D4', padding: 3, flexDirection: 'row' },
  swOn: { backgroundColor: light.accentText, justifyContent: 'flex-end' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  dish: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: light.cardSoft, borderRadius: radius.md, paddingStart: 12, minHeight: 48 },
  x: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 48, borderRadius: radius.md, backgroundColor: light.cardSoft, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15, color: light.text, textAlign: 'right' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: light.accentText, alignItems: 'center', justifyContent: 'center' },
  link: { fontFamily: fonts.semibold, fontSize: 15, color: light.accentText, paddingVertical: 10 },
});
