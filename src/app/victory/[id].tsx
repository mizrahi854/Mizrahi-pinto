import React, { useState } from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, Tap, Button, Section, Badge, Field, Sheet, Stepper, toast, Empty, Screen, Stat } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { challengeStats, ACHIEVEMENTS } from '@/lib/challenge';
import { addDays, dateKey, diffDays, parseKey } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 46 Challenge details & progress */
export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reduce = useReducedMotion();
  const c = useApp((s) => s.challenges.find((x) => x.id === id));
  const toggle = useApp((s) => s.toggleChallengeTask);
  const toggleRest = useApp((s) => s.toggleRestDay);
  const upsert = useApp((s) => s.upsertChallenge);
  const del = useApp((s) => s.deleteChallenge);
  const [editDate, setEditDate] = useState(false);
  const [note, setNote] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  if (!c) return <Screen title="אתגר"><Empty title="האתגר לא נמצא" /></Screen>;
  const today = dateKey();
  const s = challengeStats(c, today);
  const doneToday = c.log[today] ?? [];
  const isRest = c.restDays.includes(today);
  const days = Array.from({ length: s.total }, (_, i) => addDays(c.startDate, i));

  const onToggle = (tid: string) => {
    const willComplete = !doneToday.includes(tid) && doneToday.length + 1 === c.tasks.length;
    toggle(c.id, today, tid);
    haptic.select();
    if (willComplete) { haptic.success(); setCelebrate(true); setTimeout(() => setCelebrate(false), 1800); }
  };

  return (
    <HeroScreen back dotValue={s.left} label={c.finished ? 'האתגר הסתיים' : 'ימים לניצחון'} pill={c.name} pillIcon="trophy" progress={s.progress} heroHeight={270} tabBar={false}
      menu={() => { del(c.id); router.back(); toast('האתגר נמחק'); }}>
      {celebrate && (
        <Animated.View entering={reduce ? undefined : ZoomIn.springify()} style={styles.celebrate}>
          <Icon name="trophy" size={34} /><T.H>כל המשימות של היום הושלמו!</T.H>
        </Animated.View>
      )}
      <Card>
        <Row><Stat value={String(s.streak)} label="רצף" icon="bolt" /><Stat value={String(s.activeDays)} label="ימים פעילים" icon="calendar" /><Stat value={String(s.points)} label="נקודות" icon="star" /></Row>
      </Card>

      {!c.finished && (
        <Section title="היום">
          {isRest ? <Card><T.Body>יום מנוחה – גם זה חלק מהתוכנית.</T.Body></Card> : c.tasks.map((t) => {
            const done = doneToday.includes(t.id);
            return (
              <Tap key={t.id} onPress={() => onToggle(t.id)} label={`${t.title}${done ? ', בוצע' : ''}`} role="checkbox">
                <View style={[styles.task, done && styles.taskDone]}>
                  <View style={[styles.check, done && styles.checkOn]}>{done && <Icon name="check" size={16} color={colors.textOnAccent} strokeWidth={2.6} />}</View>
                  <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]}>{t.title}</Text>
                </View>
              </Tap>
            );
          })}
          <Row style={{ marginTop: 8 }}>
            <Button style={{ flex: 1 }} title={isRest ? 'ביטול יום מנוחה' : 'יום מנוחה'} variant="ghost" icon="moon" onPress={() => toggleRest(c.id, today)} />
            <Button style={{ flex: 1 }} title="עריכת תאריך" variant="ghost" icon="calendar" onPress={() => setEditDate(true)} />
          </Row>
        </Section>
      )}

      <Section title="לוח ימים">
        <View style={styles.grid}>
          {days.map((d) => {
            const n = c.log[d]?.length ?? 0;
            const full = n >= c.tasks.length && c.tasks.length > 0;
            const rest = c.restDays.includes(d);
            return (
              <View key={d} accessible accessibilityLabel={`${parseKey(d).getDate()}/${parseKey(d).getMonth() + 1}: ${rest ? 'מנוחה' : full ? 'הושלם' : n ? 'חלקי' : d > today ? 'עתידי' : 'ללא תיעוד'}`}
                style={[styles.cell, full && { backgroundColor: colors.accent }, n > 0 && !full && { backgroundColor: 'rgba(232,120,42,0.35)' }, rest && { borderStyle: 'dashed' }, d === today && { borderColor: colors.accentLight, borderWidth: 2 }, d > today && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 10, color: full ? colors.textOnAccent : colors.text2, fontFamily: fonts.medium }}>{parseKey(d).getDate()}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="הישגים">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ACHIEVEMENTS.map((a) => { const got = a.test(s); return <Badge key={a.id} text={`${got ? '🏅 ' : ''}${a.title}`} tone={got ? 'accent' : 'muted'} />; })}
        </View>
      </Section>

      {c.partner && (
        <Section title={`שותף: ${c.partner}`}>
          <Card style={{ gap: 8 }}>
            <T.Muted>{c.partnerStatus === 'accepted' ? 'השותף אישר השתתפות.' : 'ההזמנה ממתינה להסכמה. סנכרון התקדמות משותף יופעל עם חיבור השרת.'}</T.Muted>
            <Button title="שליחת הזמנה" icon="download" variant="soft" onPress={() => Share.share({ message: `מזמין אותך לאתגר "${c.name}" ב-MIZRAHI PINTO – ${s.total} ימים של התמדה. ההצטרפות בהסכמה בלבד.` }).catch(() => {})} />
            <Button title="שיתוף ההישג שלי" icon="trophy" variant="ghost" onPress={() => Share.share({ message: `${c.name}: ${s.activeDays} ימים פעילים, רצף ${s.streak}. 💪` }).catch(() => {})} />
          </Card>
        </Section>
      )}

      <Section title="יומן הישגים">
        <Field label="הערה להיום" value={note || c.notes[today] || ''} onChangeText={setNote} placeholder="מה הצלחת היום?" />
        <Button title="שמירת הערה" variant="ghost" onPress={() => { upsert({ ...c, notes: { ...c.notes, [today]: note } }); toast('נשמר'); }} />
        {Object.entries(c.notes).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).map(([d, t]) => t ? <T.Muted key={d} style={{ marginTop: 6 }}>{d.split('-').reverse().join('.')} · {t}</T.Muted> : null)}
      </Section>

      {!c.finished && s.left === 0 && <Button title="סיום האתגר וסיכום" icon="flag" style={{ marginTop: space.lg }} onPress={() => { upsert({ ...c, finished: true }); haptic.success(); toast('האתגר הושלם! כל הכבוד על ההתמדה'); }} />}
      {c.finished && (
        <Card style={{ marginTop: space.lg, gap: 6 }}>
          <T.H>סיכום</T.H>
          <T.Body>{s.activeDays} ימים פעילים מתוך {s.total} · {s.tasksDone} משימות · {s.points} נקודות</T.Body>
          <Button title="תכנון אתגר המשך" variant="soft" onPress={() => router.push('/victory/new')} />
        </Card>
      )}

      <Sheet visible={editDate} onClose={() => setEditDate(false)} title="תאריך סיום">
        <Stepper label="ימים שנותרו" value={Math.max(0, diffDays(today, c.endDate))} min={0} max={365} onChange={(v) => upsert({ ...c, endDate: addDays(today, v) })} unit="ימים" />
        <T.Caption style={{ textAlign: 'center', marginTop: 8 }}>סיום: {c.endDate.split('-').reverse().join('.')}</T.Caption>
        <Button title="סגירה" style={{ marginTop: space.md }} onPress={() => setEditDate(false)} />
      </Sheet>
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: 8, minHeight: 56 },
  taskDone: { borderColor: colors.borderStrong, backgroundColor: 'rgba(232,120,42,0.1)' },
  check: { width: 26, height: 26, borderRadius: 9, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  cell: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  celebrate: { alignItems: 'center', gap: 6, padding: space.md, marginBottom: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent, backgroundColor: 'rgba(232,120,42,0.12)' },
});
