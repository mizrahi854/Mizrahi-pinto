import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LightScreen, LIconButton, LCard, ls } from '@/components/light';
import { Tap, Sheet, toast, Field, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { CalendarSheet } from '@/components/DiaryParts';
import { useApp } from '@/store/useApp';
import { useDay, useMeals } from '@/store/selectors';
import { addDays, dateKey, prettyDate, weekOf, DAY_SHORT, parseKey } from '@/lib/dates';
import { fmt } from '@/lib/nutrition';
import { totalsOf } from '@/lib/engine';
import type { PlannedMeal } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/**
 * Food diary (tab). Top: selected date, day switching, calendar, the day's summary (calories & macros only for
 * adults who track calories; otherwise meals & habits). Then two big actions and the day's meals.
 */
export default function Diary() {
  const params = useLocalSearchParams<{ date?: string }>();
  const [date, setDate] = useState(params.date ?? dateKey());
  React.useEffect(() => { if (params.date) setDate(params.date); }, [params.date]);
  const day = useDay(date);
  const meals = useMeals();
  const entries = useApp((s) => s.entries);
  const mealMeta = useApp((s) => s.mealMeta);
  const addCustomMeal = useApp((s) => s.addCustomMeal);
  const setLogCtx = useApp((s) => s.setLogCtx);
  const eatPlanned = useApp((s) => s.eatPlannedMeal);
  const [calendar, setCalendar] = useState(false);
  const [newMeal, setNewMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const t = day.totals;
  const today = dateKey();
  const future = date > today;
  const week = weekOf(date);
  const loggedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const target = day.target.calorieTarget;

  const addMeal = (meal?: string) => {
    if (meal) setLogCtx(date, meal);
    router.push({ pathname: '/add-meal', params: { date, ...(meal ? { meal } : {}) } });
  };

  return (
    <LightScreen
      title="יומן תזונה"
      subtitle={prettyDate(date)}
      back={false}
      tabBar
      right={<LIconButton icon="calendar" label="פתיחת לוח שנה" onPress={() => setCalendar(true)} />}
      heroHeight={day.calories ? 150 : 112}
      hero={
        <View style={{ gap: 12 }}>
          <View style={styles.week}>
            <Tap onPress={() => setDate(addDays(date, -1))} label="יום קודם"><View style={styles.weekArrow}><Icon name="chevronBack" size={20} color="#fff" /></View></Tap>
            {week.map((d, i) => {
              const on = d === date;
              return (
                <Pressable key={d} onPress={() => { haptic.select(); setDate(d); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${prettyDate(d)}${loggedDates.has(d) ? ', יש רישומים' : ''}`} style={[styles.wd, on && styles.wdOn, d === today && !on && styles.wdToday]}>
                  <Text style={[styles.wdDay, on && { color: '#1A0C04' }]}>{DAY_SHORT[i]}</Text>
                  <Text style={[styles.wdNum, on && { color: '#1A0C04' }]}>{parseKey(d).getDate()}</Text>
                  <View style={[styles.dot, { opacity: loggedDates.has(d) ? 1 : 0 }, on && { backgroundColor: '#1A0C04' }]} />
                </Pressable>
              );
            })}
            <Tap onPress={() => setDate(addDays(date, 1))} label="יום הבא"><View style={styles.weekArrow}><Icon name="chevron" size={20} color="#fff" /></View></Tap>
          </View>
          {day.calories ? (
            <View style={styles.summary} accessible accessibilityLabel={`סיכום היום: ${t.kcal} קלוריות${target ? ` מתוך ${target}` : ''}, חלבון ${fmt(t.protein)} גרם, פחמימות ${fmt(t.carbs)} גרם, שומן ${fmt(t.fat)} גרם`}>
              <Sum v={`${t.kcal.toLocaleString()}${t.partial.kcal ? '*' : ''}`} l={target ? `מתוך ${target.toLocaleString()} קק״ל` : 'קק״ל'} big />
              <Sum v={fmt(t.protein)} l="חלבון" />
              <Sum v={fmt(t.carbs)} l="פחמימות" />
              <Sum v={fmt(t.fat)} l="שומן" />
            </View>
          ) : (
            <View style={styles.summary} accessible accessibilityLabel={`${day.mealsLogged} ארוחות תועדו, ${day.list.length} פריטים`}>
              <Sum v={String(day.mealsLogged)} l="ארוחות תועדו" big />
              <Sum v={String(day.list.length)} l="פריטים" />
              <Sum v={String(day.planned.filter((p) => !p.eatenAt).length)} l="מתוכננות" />
            </View>
          )}
        </View>
      }
    >
      {date !== today && (
        <Tap onPress={() => setDate(today)} label="חזרה להיום"><View style={styles.today}><Icon name="calendar" size={16} color={light.accent} /><Text style={styles.todayText}>חזרה להיום</Text></View></Tap>
      )}

      {/* two big primary actions */}
      <View style={styles.actions}>
        <Tap onPress={() => (future ? router.push({ pathname: '/plan-meal', params: { date } }) : addMeal())} label={future ? 'תכנון ארוחה ליום זה' : 'הוסף ארוחה'} style={{ flex: 1 }}>
          <View style={[styles.bigBtn, styles.bigPrimary]}>
            <Icon name="plus" size={26} color="#fff" strokeWidth={2.4} />
            <Text style={styles.bigText}>{future ? 'תכנון ארוחה' : 'הוסף ארוחה'}</Text>
          </View>
        </Tap>
        {day.calories && !future && (
          <Tap onPress={() => router.push({ pathname: '/add-calories', params: { date } })} label="הוסף קלוריות" style={{ flex: 1 }}>
            <View style={[styles.bigBtn, styles.bigSecondary]}>
              <Icon name="flame" size={26} color={light.accentText} strokeWidth={2} />
              <Text style={[styles.bigText, { color: light.accentText }]}>הוסף קלוריות</Text>
            </View>
          </Tap>
        )}
      </View>
      {future && <Text style={[ls.muted, { textAlign: 'center', marginTop: 8 }]}>יום עתידי: ארוחות נשמרות כתכנון, ונכנסות ליומן כשמסמנים ״נאכל״.</Text>}
      {(t.partial.kcal || t.partial.protein) && day.calories && <Text style={[ls.caption, { textAlign: 'center', marginTop: 8 }]}>* חלק מהפריטים ללא ערך ידוע – לא נספרו כאפס</Text>}

      {day.planned.length > 0 && (
        <View style={{ marginTop: space.lg, gap: 8 }}>
          <Text style={ls.h2} accessibilityRole="header">מתוכנן ליום הזה</Text>
          {day.planned.map((p) => <PlannedRow key={p.id} p={p} calories={day.calories} onEat={() => { const n = eatPlanned(p.id); haptic.success(); toast(n ? `${p.title} נוסף ליומן` : 'כבר סומן'); }} />)}
        </View>
      )}

      <View style={{ gap: 10, marginTop: space.lg }}>
        {meals.map((m) => {
          const list = day.list.filter((e) => e.meal === m.key);
          const sum = totalsOf(list);
          const meta = mealMeta[`${date}|${m.key}`];
          const photo = meta?.photo ?? list.find((e) => e.photoUri)?.photoUri;
          const time = list[0]?.time;
          const label = meta?.title || m.label;
          return (
            <View key={m.key} style={styles.meal}>
              <Pressable
                onPress={() => (list.length ? router.push({ pathname: '/meal', params: { date, meal: m.key } }) : addMeal(m.key))}
                accessibilityRole="button"
                accessibilityLabel={`${label}${list.length ? `, ${list.length} פריטים${time ? `, בשעה ${time}` : ''}${day.calories ? `, ${sum.kcal} קלוריות` : ''}. לעריכה` : ', טרם תועד. להוספה'}`}
                style={styles.mealHead}
              >
                {photo ? <Image source={{ uri: photo }} style={styles.mealPhoto} contentFit="cover" accessibilityIgnoresInvertColors /> : <View style={styles.mealIcon}><Icon name={m.icon} size={22} color={light.accent} /></View>}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.mealName}>{label}</Text>
                  <Text style={ls.muted} numberOfLines={1}>
                    {list.length ? `${time ?? ''}${day.calories ? ` · ${sum.kcal.toLocaleString()}${sum.partial.kcal ? '*' : ''} קק״ל` : ` · ${list.length} פריטים`}` : 'טרם תועד'}
                  </Text>
                </View>
                {list.length > 0 && <Icon name="chevronBack" size={18} color={light.text2} />}
              </Pressable>
              {list.length > 0 && (
                <Text style={styles.items} numberOfLines={2}>{list.map((e) => e.name).join(' · ')}</Text>
              )}
              {!future && (
                <Tap onPress={() => addMeal(m.key)} label={`הוספה ל${label}`}>
                  <View style={styles.addRow}><Icon name="plus" size={18} color={light.accentText} /><Text style={styles.addRowText}>הוספה</Text></View>
                </Tap>
              )}
            </View>
          );
        })}
      </View>

      <Tap onPress={() => setNewMeal(true)} label="הוספת ארוחה נוספת">
        <View style={styles.addMeal}><Icon name="plus" size={18} color={light.accent} /><Text style={styles.addMealText}>ארוחה נוספת</Text></View>
      </Tap>

      <CalendarSheet visible={calendar} value={date} logged={loggedDates} onClose={() => setCalendar(false)} onPick={(d) => { setDate(d); setCalendar(false); }} />

      <Sheet visible={newMeal} onClose={() => setNewMeal(false)} title="ארוחה נוספת">
        <Field label="שם הארוחה" value={mealName} onChangeText={setMealName} placeholder="למשל: לפני אימון" />
        <Button title="הוספה" disabled={mealName.trim().length < 2} onPress={() => { addCustomMeal(mealName.trim()); setMealName(''); setNewMeal(false); toast('הארוחה נוספה'); }} />
      </Sheet>
    </LightScreen>
  );
}

function PlannedRow({ p, calories, onEat }: { p: PlannedMeal; calories: boolean; onEat: () => void }) {
  const kcal = totalsOf(p.items);
  return (
    <LCard style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
      <Tap onPress={() => router.push({ pathname: '/plan-meal', params: { id: p.id } })} label={`עריכת ${p.title}`} style={{ flex: 1 }}>
        <View style={{ gap: 2 }}>
          <Text style={ls.bodyStrong} numberOfLines={1}>{p.title}</Text>
          <Text style={ls.muted} numberOfLines={1}>{p.items.length ? p.items.map((i) => i.name).join(' · ') : 'ללא פירוט'}{calories && p.items.length ? ` · ${kcal.kcal} קק״ל${kcal.partial.kcal ? '*' : ''}` : ''}</Text>
        </View>
      </Tap>
      {p.eatenAt ? (
        <View style={styles.eaten} accessible accessibilityLabel="נאכל"><Icon name="check" size={18} color={light.protein} /><Text style={[ls.muted, { color: '#1F7A4D' }]}>נאכל</Text></View>
      ) : p.date <= dateKey() ? (
        <Tap onPress={onEat} label={`סימון ${p.title} כנאכל והוספה ליומן`}><View style={styles.eatBtn}><Icon name="check" size={18} color="#fff" /><Text style={styles.eatText}>נאכל</Text></View></Tap>
      ) : null}
    </LCard>
  );
}

function Sum({ v, l, big }: { v: string; l: string; big?: boolean }) {
  return (
    <View style={{ flex: big ? 1.6 : 1, alignItems: 'center' }}>
      <Text style={[styles.sumV, big && { fontSize: 30 }]}>{v}</Text>
      <Text style={styles.sumL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' },
  weekArrow: { width: 40, height: 56, alignItems: 'center', justifyContent: 'center' },
  wd: { width: 38, paddingVertical: 6, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,190,140,0.18)', minHeight: 58 },
  wdOn: { backgroundColor: '#F2A05C', borderColor: '#F2A05C' },
  wdToday: { borderColor: '#F2A05C' },
  wdDay: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  wdNum: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2A05C', marginTop: 2 },
  summary: { flexDirection: 'row', alignItems: 'flex-end' },
  sumV: { fontFamily: fonts.bold, fontSize: 20, color: '#fff', fontVariant: ['tabular-nums'] },
  sumL: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  today: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: 22, backgroundColor: light.accentSoft, marginBottom: 10 },
  todayText: { fontFamily: fonts.semibold, fontSize: 14, color: light.accentText },
  actions: { flexDirection: 'row', gap: 10 },
  bigBtn: { minHeight: 64, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 },
  bigPrimary: { backgroundColor: light.accentText },
  bigSecondary: { backgroundColor: light.card, borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.35)' },
  bigText: { fontFamily: fonts.bold, fontSize: 17, color: '#fff' },
  meal: { backgroundColor: light.card, borderRadius: radius.lg, padding: 12, gap: 6 },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  mealIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: light.accentSoft, alignItems: 'center', justifyContent: 'center' },
  mealPhoto: { width: 52, height: 52, borderRadius: 16 },
  mealName: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  items: { fontFamily: fonts.regular, fontSize: 14, color: light.text2, lineHeight: 20 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: 4 },
  addRowText: { fontFamily: fonts.semibold, fontSize: 15, color: light.accentText },
  addMeal: { marginTop: space.md, minHeight: 50, borderRadius: radius.pill, borderWidth: 1.5, borderColor: 'rgba(242,107,29,0.4)', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addMealText: { fontFamily: fonts.semibold, fontSize: 15, color: light.accentText },
  eatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#1F7A4D' },
  eatText: { fontFamily: fonts.semibold, fontSize: 14, color: '#fff' },
  eaten: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
});
