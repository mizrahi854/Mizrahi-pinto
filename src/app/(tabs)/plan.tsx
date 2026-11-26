import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LightScreen, LIconButton, LCard, ls } from '@/components/light';
import { Tap, Sheet, toast, ListItem, Button } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { useWeek } from '@/store/selectors';
import { addDays, dateKey, parseKey, DAY_LONG, weekOf } from '@/lib/dates';
import { MUSCLE_LABELS } from '@/lib/workouts';
import { restaurantLabel } from '@/lib/restaurants';
import { isAdult } from '@/lib/nutrition';
import type { PlannedWorkout, PlanEvent } from '@/data/types';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const EVENT_ICON: Record<PlanEvent['type'], IconName> = { family: 'user', restaurant: 'food', special: 'star' };

/** Weekly plan (Sunday → Saturday): workouts, rest days, planned meals, events, Shabbat, plan vs actual. */
export default function Plan() {
  const [anchor, setAnchor] = useState(dateKey());
  const week = useWeek(anchor);
  const today = dateKey();
  const start = week.dates[0]!;
  const thisWeek = weekOf(today)[0]!;
  const complete = useApp((s) => s.completeWorkout);
  const reopen = useApp((s) => s.reopenWorkout);
  const copyWeekToNext = useApp((s) => s.copyWeekToNext);
  const saveWeekAsTemplate = useApp((s) => s.saveWeekAsTemplate);
  const templateAuto = useApp((s) => s.templateAuto);
  const setTemplate = useApp((s) => s.setTemplate);
  const template = useApp((s) => s.template);
  const profile = useApp((s) => s.profile);
  const [dayMenu, setDayMenu] = useState<string | null>(null);
  const [tools, setTools] = useState(false);
  const [flex, setFlex] = useState(false);
  const label = start === thisWeek ? 'השבוע' : start === addDays(thisWeek, 7) ? 'שבוע הבא' : start === addDays(thisWeek, -7) ? 'שבוע שעבר' : `${parseKey(start).getDate()}/${parseKey(start).getMonth() + 1}`;
  const end = week.dates[6]!;
  const range = `${parseKey(start).getDate()}/${parseKey(start).getMonth() + 1} – ${parseKey(end).getDate()}/${parseKey(end).getMonth() + 1}`;

  const toggleDone = (w: PlannedWorkout) => {
    if (w.status === 'done') { reopen(w.id); toast('הסימון בוטל'); return; }
    complete(w.id);
    haptic.success();
    toast(`${w.name} הושלם ✓`, { label: 'ביטול', onPress: () => reopen(w.id) });
  };

  return (
    <LightScreen
      title="התוכנית השבועית"
      subtitle={`${label} · ${range}`}
      back={false}
      tabBar
      right={<LIconButton icon="settings" label="כלי תכנון" onPress={() => setTools(true)} />}
      heroHeight={92}
      hero={
        <View style={styles.hero}>
          <Tap onPress={() => setAnchor(addDays(anchor, -7))} label="שבוע קודם"><View style={styles.nav}><Icon name="chevronBack" size={20} color="#fff" /></View></Tap>
          <View style={styles.stats}>
            <HeroStat v={`${week.workouts.done}/${week.workouts.planned}`} l="אימונים" />
            <HeroStat v={`${week.mealsPlannedEaten}/${week.mealsPlanned}`} l="ארוחות מתוכננות" />
            <HeroStat v={`${week.loggedCount}/7`} l="ימי תיעוד" />
          </View>
          <Tap onPress={() => setAnchor(addDays(anchor, 7))} label="שבוע הבא"><View style={styles.nav}><Icon name="chevron" size={20} color="#fff" /></View></Tap>
        </View>
      }
    >
      {start !== thisWeek && (
        <Tap onPress={() => setAnchor(today)} label="חזרה לשבוע הנוכחי"><View style={styles.todayPill}><Icon name="calendar" size={16} color={light.accent} /><Text style={styles.todayText}>חזרה לשבוע הנוכחי</Text></View></Tap>
      )}

      <View style={styles.quick}>
        <Quick icon="dumbbell" label="אימון" onPress={() => router.push({ pathname: '/workout', params: { date: week.dates.find((d) => d >= today) ?? start } })} />
        <Quick icon="bowl" label="ארוחה" onPress={() => router.push({ pathname: '/plan-meal', params: { date: week.dates.find((d) => d >= today) ?? start } })} />
        <Quick icon="food" label="מסעדה" onPress={() => router.push({ pathname: '/event', params: { type: 'restaurant', date: week.dates.find((d) => d >= today) ?? start } })} />
        <Quick icon="star" label="שישי-שבת" onPress={() => router.push({ pathname: '/shabbat', params: { week: start } })} />
      </View>

      <View style={{ gap: 10, marginTop: space.md }}>
        {week.days.map((d) => {
          const dt = parseKey(d.date);
          const isToday = d.date === today;
          const past = d.date < today;
          const workouts = d.workouts.filter((w) => w.status !== 'skipped' || past);
          return (
            <View key={d.date} style={[styles.day, isToday && styles.dayToday]}>
              <View style={styles.dayHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName} accessibilityRole="header">{isToday ? 'היום · ' : ''}יום {DAY_LONG[dt.getDay()]}</Text>
                  <Text style={ls.muted}>{dt.getDate()}/{dt.getMonth() + 1}{week.calories && d.logged ? ` · ${d.totals.kcal.toLocaleString()}${d.target ? ` / ${d.target.toLocaleString()}` : ''} קק״ל` : d.logged ? ` · ${d.meals} ארוחות תועדו` : ''}</Text>
                </View>
                <Tap onPress={() => setDayMenu(d.date)} label={`הוספה ליום ${DAY_LONG[dt.getDay()]}`}><View style={styles.addBtn}><Icon name="plus" size={22} color="#fff" strokeWidth={2.2} /></View></Tap>
              </View>

              {workouts.map((w) => (
                <View key={w.id} style={styles.row}>
                  {w.rest ? (
                    <Pressable onPress={() => router.push({ pathname: '/workout', params: { id: w.id } })} accessibilityRole="button" accessibilityLabel="יום מנוחה. עריכה" style={styles.rowMain}>
                      <Icon name="moon" size={20} color={light.text2} /><Text style={ls.body}>יום מנוחה</Text>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable onPress={() => router.push({ pathname: '/workout', params: { id: w.id } })} accessibilityRole="button" accessibilityLabel={`${w.name}${w.time ? ` בשעה ${w.time}` : ''}, ${w.status === 'done' ? 'הושלם' : w.status === 'skipped' ? 'בוטל' : 'מתוכנן'}. עריכה`} style={styles.rowMain}>
                        <Icon name="dumbbell" size={20} color={w.status === 'skipped' ? light.text3 : light.accent} />
                        <View style={{ flex: 1 }}>
                          <Text style={[ls.bodyStrong, w.status === 'skipped' && { textDecorationLine: 'line-through', color: light.text2 }]} numberOfLines={1}>{w.name}</Text>
                          <Text style={ls.muted} numberOfLines={1}>{[w.time, w.durationMin ? `${w.durationMin} דק׳` : null, w.muscles.map((m) => MUSCLE_LABELS[m]).join(', ') || null].filter(Boolean).join(' · ')}</Text>
                        </View>
                      </Pressable>
                      {w.status !== 'skipped' && (
                        <Tap onPress={() => toggleDone(w)} label={w.status === 'done' ? `ביטול סימון ${w.name}` : `סימון ${w.name} כהושלם`}>
                          <View style={[styles.check, w.status === 'done' && styles.checkOn]}><Icon name="check" size={20} color={w.status === 'done' ? '#fff' : light.text3} strokeWidth={2.4} /></View>
                        </Tap>
                      )}
                    </>
                  )}
                </View>
              ))}

              {d.events.map((e) => (
                <Pressable key={e.id} onPress={() => router.push(e.type === 'restaurant' ? { pathname: '/restaurant', params: { event: e.id } } : { pathname: '/event', params: { id: e.id } })} accessibilityRole="button" accessibilityLabel={`${e.title}${e.time ? ` בשעה ${e.time}` : ''}`} style={[styles.row, styles.rowMain]}>
                  <Icon name={EVENT_ICON[e.type]} size={20} color={light.accentText} />
                  <View style={{ flex: 1 }}>
                    <Text style={ls.bodyStrong} numberOfLines={1}>{e.title}</Text>
                    <Text style={ls.muted} numberOfLines={1}>{[e.time, e.type === 'restaurant' ? restaurantLabel(e.restaurantType) : e.type === 'family' ? 'ארוחה משפחתית' : 'אירוע', e.dishIds?.length ? `${e.dishIds.length} מנות נבחרו` : null].filter(Boolean).join(' · ')}</Text>
                  </View>
                </Pressable>
              ))}

              {d.planned.map((m) => (
                <Pressable key={m.id} onPress={() => router.push({ pathname: '/plan-meal', params: { id: m.id } })} accessibilityRole="button" accessibilityLabel={`${m.title}${m.eatenAt ? ', נאכל' : ''}`} style={[styles.row, styles.rowMain]}>
                  <Icon name={m.eatenAt ? 'check' : 'bowl'} size={20} color={m.eatenAt ? '#1F7A4D' : light.accent} />
                  <Text style={[ls.body, { flex: 1 }]} numberOfLines={1}>{m.title}</Text>
                </Pressable>
              ))}

              {!workouts.length && !d.events.length && !d.planned.length && <Text style={[ls.muted, { paddingVertical: 4 }]}>אין תכנון ליום הזה</Text>}
              {(dt.getDay() === 5 || dt.getDay() === 6) && (
                <Tap onPress={() => router.push({ pathname: '/shabbat', params: { week: start } })} label="תוכנית שישי-שבת"><Text style={styles.link}>תוכנית שישי-שבת ›</Text></Tap>
              )}
            </View>
          );
        })}
      </View>

      <WeekSummary week={week} />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
        <Tap onPress={() => { const n = copyWeekToNext(start); haptic.success(); toast(n ? `${n} אימונים והארוחות המתוכננות שוכפלו לשבוע הבא` : 'השבוע הועתק לשבוע הבא'); setAnchor(addDays(start, 7)); }} label="שכפול התוכנית לשבוע הבא" style={{ flex: 1 }}>
          <View style={styles.tool}><Icon name="copy" size={20} color={light.accentText} /><Text style={styles.toolText}>שכפול לשבוע הבא</Text></View>
        </Tap>
        <Tap onPress={() => { saveWeekAsTemplate(start); haptic.success(); toast('השבוע נשמר כתבנית קבועה – שבועות חדשים יתמלאו ממנה'); }} label="שמירת השבוע כתבנית קבועה" style={{ flex: 1 }}>
          <View style={styles.tool}><Icon name="repeat" size={20} color={light.accentText} /><Text style={styles.toolText}>שמירה כתבנית קבועה</Text></View>
        </Tap>
      </View>

      <Sheet visible={!!dayMenu} onClose={() => setDayMenu(null)} title={dayMenu ? `יום ${DAY_LONG[parseKey(dayMenu).getDay()]}` : ''}>
        <ListItem icon="dumbbell" title="אימון" onPress={() => { const d = dayMenu!; setDayMenu(null); router.push({ pathname: '/workout', params: { date: d } }); }} />
        <ListItem icon="bowl" title="ארוחה מתוכננת" onPress={() => { const d = dayMenu!; setDayMenu(null); router.push({ pathname: '/plan-meal', params: { date: d } }); }} />
        <ListItem icon="user" title="ארוחה משפחתית" onPress={() => { const d = dayMenu!; setDayMenu(null); router.push({ pathname: '/event', params: { date: d, type: 'family' } }); }} />
        <ListItem icon="food" title="יציאה למסעדה" onPress={() => { const d = dayMenu!; setDayMenu(null); router.push({ pathname: '/event', params: { date: d, type: 'restaurant' } }); }} />
        <ListItem icon="star" title="אירוע מיוחד" onPress={() => { const d = dayMenu!; setDayMenu(null); router.push({ pathname: '/event', params: { date: d, type: 'special' } }); }} />
        <ListItem icon="moon" title="יום מנוחה" onPress={() => { const d = dayMenu!; setDayMenu(null); useApp.getState().upsertWorkout({ date: d, time: null, name: 'יום מנוחה', muscles: [], rest: true }); toast('סומן כיום מנוחה'); }} />
      </Sheet>

      <Sheet visible={tools} onClose={() => setTools(false)} title="כלי תכנון">
        <ListItem icon="repeat" title={templateAuto ? 'מילוי אוטומטי מהתבנית: פעיל' : 'מילוי אוטומטי מהתבנית: כבוי'} subtitle={template.length ? `${template.filter((t) => !t.rest).length} אימונים בשבוע בתבנית` : 'עדיין אין תבנית – שמור שבוע כתבנית'} onPress={() => { setTemplate(template, !templateAuto); toast(templateAuto ? 'מילוי אוטומטי כובה' : 'מילוי אוטומטי הופעל'); }} />
        <ListItem icon="star" title="תוכנית שישי-שבת" onPress={() => { setTools(false); router.push('/shabbat'); }} />
        <ListItem icon="food" title="מצב מסעדה" onPress={() => { setTools(false); router.push('/restaurant'); }} />
        <ListItem icon="cart" title="רשימת קניות" onPress={() => { setTools(false); router.push('/shopping'); }} />
        {week.calories && isAdult(profile.age) && <ListItem icon="calendar" title="יעדים גמישים לפי יום" subtitle="למשל יעד אחר לשבת – נקבע מראש" onPress={() => { setTools(false); setFlex(true); }} />}
      </Sheet>
      <FlexTargets visible={flex} onClose={() => setFlex(false)} />
    </LightScreen>
  );
}

function WeekSummary({ week }: { week: ReturnType<typeof useWeek> }) {
  const diff = week.calories && week.loggedTarget ? week.totalKcal - week.loggedTarget : null;
  return (
    <LCard style={{ marginTop: space.lg, gap: 10 }}>
      <Text style={ls.h2} accessibilityRole="header">סיכום שבועי · תכנון מול ביצוע</Text>
      <SumRow icon="dumbbell" l="אימונים" v={`${week.workouts.done} הושלמו מתוך ${week.workouts.planned}${week.workouts.skipped ? ` · ${week.workouts.skipped} בוטלו` : ''}`} />
      <SumRow icon="bowl" l="ארוחות מתוכננות" v={week.mealsPlanned ? `${week.mealsPlannedEaten} מתוך ${week.mealsPlanned} נאכלו` : 'לא תוכננו'} />
      <SumRow icon="calendar" l="ימי תיעוד" v={`${week.loggedCount} מתוך 7`} />
      {week.calories && (
        <>
          <SumRow icon="flame" l="ממוצע יומי" v={week.avgKcal != null ? `${week.avgKcal.toLocaleString()} קק״ל${week.partial ? '*' : ''}` : 'אין עדיין נתונים'} />
          {week.weekTarget != null && <SumRow icon="chart" l="יעד שבועי" v={`${week.weekTarget.toLocaleString()} קק״ל (סכום היעדים היומיים)`} />}
          {diff != null && week.loggedCount > 0 && (
            <SumRow icon="list" l="בימים שתועדו" v={`${week.totalKcal.toLocaleString()} מתוך ${week.loggedTarget!.toLocaleString()} קק״ל (${diff > 0 ? `${diff.toLocaleString()} מעל` : diff < 0 ? `${Math.abs(diff).toLocaleString()} מתחת` : 'בדיוק'})`} />
          )}
          <Text style={ls.muted}>המספרים מוצגים כמו שהם. יעד של יום מחר לא משתנה בעקבות יום אחר, ואין צורך ב״פיצוי״ – לא בצום, לא בהגבלה ולא באימון נוסף.</Text>
        </>
      )}
      {week.partial && <Text style={ls.caption}>* חלק מהפריטים ללא ערך ידוע</Text>}
    </LCard>
  );
}

function FlexTargets({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const profile = useApp((s) => s.profile);
  const update = useApp((s) => s.updateProfile);
  const [vals, setVals] = useState<Record<number, string>>({});
  React.useEffect(() => { if (visible) setVals(Object.fromEntries(Object.entries(profile.dayTargets ?? {}).map(([k, v]) => [k, String(v)]))); }, [visible, profile.dayTargets]);
  return (
    <Sheet visible={visible} onClose={onClose} title="יעדים גמישים לפי יום" scroll>
      <Text style={styles.sheetMuted}>יום ריק = היעד הרגיל ({profile.calorieTarget?.toLocaleString() ?? '—'} קק״ל). היעדים נקבעים מראש ולא משתנים אוטומטית.</Text>
      {DAY_LONG.map((d, i) => (
        <View key={d} style={styles.flexRow}>
          <Text style={styles.flexDay}>{d}</Text>
          <TextInput value={vals[i] ?? ''} onChangeText={(t) => setVals({ ...vals, [i]: t.replace(/\D/g, '') })} keyboardType="number-pad" placeholder={String(profile.calorieTarget ?? '')} placeholderTextColor="rgba(255,255,255,0.35)" style={styles.flexInput} accessibilityLabel={`יעד ליום ${d}`} maxLength={5} />
        </View>
      ))}
      <Button title="שמירה" onPress={() => {
        const out: Record<number, number> = {};
        for (const [k, v] of Object.entries(vals)) if (v && Number(v) >= 1000 && Number(v) <= 6000) out[Number(k)] = Number(v);
        update({ dayTargets: out });
        toast('היעדים נשמרו');
        onClose();
      }} />
    </Sheet>
  );
}

function SumRow({ icon, l, v }: { icon: IconName; l: string; v: string }) {
  return (
    <View style={styles.sumRow} accessible accessibilityLabel={`${l}: ${v}`}>
      <Icon name={icon} size={18} color={light.accent} />
      <Text style={[ls.body, { width: 112 }]}>{l}</Text>
      <Text style={[ls.bodyStrong, { flex: 1, fontSize: 15 }]}>{v}</Text>
    </View>
  );
}

function Quick({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} label={`הוספת ${label}`} style={{ flex: 1 }}>
      <View style={styles.quickBtn}><Icon name={icon} size={22} color={light.accentText} /><Text style={styles.quickText}>{label}</Text></View>
    </Tap>
  );
}

function HeroStat({ v, l }: { v: string; l: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }} accessible accessibilityLabel={`${l}: ${v}`}>
      <Text style={styles.heroV}>{v}</Text>
      <Text style={styles.heroL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center' },
  nav: { width: 40, height: 52, alignItems: 'center', justifyContent: 'center' },
  stats: { flex: 1, flexDirection: 'row' },
  heroV: { fontFamily: fonts.bold, fontSize: 24, color: '#fff', fontVariant: ['tabular-nums'] },
  heroL: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  todayPill: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: 22, backgroundColor: light.accentSoft, marginBottom: 10 },
  todayText: { fontFamily: fonts.semibold, fontSize: 14, color: light.accentText },
  quick: { flexDirection: 'row', gap: 8 },
  quickBtn: { minHeight: 64, borderRadius: radius.md, backgroundColor: light.card, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickText: { fontFamily: fonts.semibold, fontSize: 13.5, color: light.text },
  day: { backgroundColor: light.card, borderRadius: radius.lg, padding: 12, gap: 4 },
  dayToday: { borderWidth: 2, borderColor: light.accent },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  dayName: { fontFamily: fonts.bold, fontSize: 17, color: light.text },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: light.accentText, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: light.border, minHeight: 52 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  check: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#D9D3CF', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#1F7A4D', borderColor: '#1F7A4D' },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: light.accentText, paddingVertical: 10 },
  sumRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tool: { minHeight: 56, borderRadius: radius.md, backgroundColor: light.card, borderWidth: 1.5, borderColor: 'rgba(194,65,12,0.25)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  toolText: { fontFamily: fonts.semibold, fontSize: 14, color: light.text, textAlign: 'center', flexShrink: 1 },
  sheetMuted: { color: 'rgba(255,255,255,0.75)', fontFamily: fonts.regular, fontSize: 14, marginBottom: 10 },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  flexDay: { flex: 1, color: '#fff', fontFamily: fonts.semibold, fontSize: 16 },
  flexInput: { width: 120, minHeight: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: fonts.semibold, fontSize: 17, textAlign: 'center' },
});
