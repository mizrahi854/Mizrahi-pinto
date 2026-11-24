import React, { useEffect, useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Screen, Card, Row, T, Button, Chip, Sheet, Field, IconButton, Tap, Badge, toast, Section } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { TimeWheel } from '@/components/WheelPicker';
import { useApp } from '@/store/useApp';
import type { Reminder, ReminderType } from '@/data/types';
import { getPermission, requestPermission, scheduleReminder, cancelReminder, PermState, notificationsSupported } from '@/lib/notifications';
import { DAY_SHORT, uid } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

const TYPES: { t: ReminderType; l: string; icon: IconName; title: string; time: string }[] = [
  { t: 'alarm', l: 'השכמה', icon: 'alarm', title: 'השכמה', time: '05:00' },
  { t: 'workout', l: 'אימון', icon: 'dumbbell', title: 'תזכורת לאימון', time: '18:00' },
  { t: 'meal', l: 'ארוחה', icon: 'bowl', title: 'תיעוד ארוחה', time: '13:00' },
  { t: 'water', l: 'מים', icon: 'drop', title: 'שתיית מים', time: '11:00' },
  { t: 'sleep', l: 'שינה', icon: 'moon', title: 'הכנה לשינה', time: '22:30' },
  { t: 'recovery', l: 'התאוששות', icon: 'body', title: 'מתיחות והתאוששות', time: '20:00' },
];
const SOUNDS = [['default', 'ברירת מחדל'], ['soft', 'עדין'], ['none', 'ללא צליל']] as const;

const inQuiet = (t: string, a: string, b: string) => (a <= b ? t >= a && t < b : t >= a || t < b);

/** 42 Alarm clock & reminders */
export default function Alarm() {
  const reminders = useApp((s) => s.reminders);
  const upsert = useApp((s) => s.upsertReminder);
  const del = useApp((s) => s.deleteReminder);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const [perm, setPerm] = useState<PermState>('undetermined');
  const [edit, setEdit] = useState<Reminder | null>(null);
  useEffect(() => { getPermission().then(setPerm); }, []);

  const save = async (r: Reminder) => {
    if (r.enabled && perm !== 'granted' && notificationsSupported) {
      const p = await requestPermission();
      setPerm(p);
      if (p !== 'granted') {
        upsert({ ...r, enabled: false, notificationIds: [] });
        toast('ללא הרשאת התראות התזכורת נשמרה כבויה');
        return;
      }
    }
    if (r.type !== 'alarm' && settings.quietEnabled && inQuiet(r.time, settings.quietStart, settings.quietEnd)) toast('שימו לב: השעה בתוך השעות השקטות');
    const ids = await scheduleReminder(r).catch(() => []);
    upsert({ ...r, notificationIds: ids });
    setEdit(null);
    toast(r.enabled ? (notificationsSupported ? 'התזכורת תוזמנה' : 'נשמר (התראות פועלות באפליקציה באייפון)') : 'נשמר');
  };

  return (
    <Screen title="שעון מעורר ותזכורות" right={<IconButton icon="plus" label="תזכורת חדשה" active size={40} onPress={() => setEdit({ id: uid(), type: 'workout', title: 'תזכורת לאימון', time: '18:00', days: [0, 2, 4], enabled: true, sound: 'default' })} />}>
      <Card style={{ gap: 6, marginBottom: space.md }}>
        <Row><Icon name="bell" /><T.Body style={{ flex: 1 }}>סטטוס התראות</T.Body>
          <Badge text={{ granted: 'מאושר', denied: 'נדחה', undetermined: 'טרם אושר', unsupported: 'לא זמין כאן' }[perm]} tone={perm === 'granted' ? 'accent' : 'warn'} />
        </Row>
        {perm === 'undetermined' && <Button title="אישור התראות" variant="soft" onPress={async () => setPerm(await requestPermission())} />}
        {perm === 'denied' && <T.Muted>ההרשאה נדחתה. ניתן להפעיל בהגדרות האייפון ← MIZRAHI PINTO ← עדכונים.</T.Muted>}
        <T.Caption>חשוב לדעת: באייפון, אפליקציה רגילה שולחת התראה מקומית ולא שעון מעורר מערכתי. במצב שקט / ריכוז ייתכן שלא יושמע צליל. לשעון מעורר אמין השתמשו גם בשעון של iOS.</T.Caption>
      </Card>

      {reminders.length === 0 && <T.Muted style={{ textAlign: 'center', marginVertical: space.lg }}>אין תזכורות עדיין. לחץ + כדי ליצור.</T.Muted>}
      {reminders.map((r) => {
        const meta = TYPES.find((x) => x.t === r.type)!;
        return (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: r.enabled ? colors.borderStrong : colors.border, marginBottom: 8 }}>
            <Tap style={{ flex: 1 }} onPress={() => setEdit(r)} label={`${r.title} ${r.time}`}>
              <Row>
                <Icon name={meta.icon} size={24} color={r.enabled ? colors.accent : colors.text3} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 30, color: r.enabled ? colors.text : colors.text3, fontVariant: ['tabular-nums'] }}>{r.time}</Text>
                  <T.Muted>{r.title} · {r.days.length === 7 ? 'כל יום' : r.days.map((d) => DAY_SHORT[d]).join(' ')}</T.Muted>
                </View>
              </Row>
            </Tap>
            <Switch value={r.enabled} onValueChange={(v) => save({ ...r, enabled: v })} trackColor={{ true: colors.accent, false: colors.track }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as any)} accessibilityLabel={`הפעלת ${r.title}`} />
          </View>
        );
      })}

      <Section title="שעות שקטות">
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><T.Body>הפעלה</T.Body><Switch value={settings.quietEnabled} onValueChange={(v) => updateSettings({ quietEnabled: v })} trackColor={{ true: colors.accent, false: colors.track }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as any)} accessibilityLabel="שעות שקטות" /></Row>
          <Row style={{ justifyContent: 'space-between' }}><T.Muted>מ-</T.Muted><Row>{['21:00', '22:00', '23:00'].map((t) => <Chip key={t} label={t} active={settings.quietStart === t} onPress={() => updateSettings({ quietStart: t })} />)}</Row></Row>
          <Row style={{ justifyContent: 'space-between' }}><T.Muted>עד</T.Muted><Row>{['06:00', '07:00', '08:00'].map((t) => <Chip key={t} label={t} active={settings.quietEnd === t} onPress={() => updateSettings({ quietEnd: t })} />)}</Row></Row>
          <T.Caption>תזכורות (מלבד השכמה) לא מומלצות בשעות אלה. אזור הזמן נקבע לפי המכשיר.</T.Caption>
        </Card>
      </Section>

      <Sheet visible={!!edit} onClose={() => setEdit(null)} title="עריכת תזכורת">
        {edit && (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: space.md }}>
              {TYPES.map((x) => <Chip key={x.t} label={x.l} icon={x.icon} active={edit.type === x.t} onPress={() => setEdit({ ...edit, type: x.t, title: x.title })} />)}
            </View>
            <TimeWheel time={edit.time} onChange={(time) => setEdit({ ...edit, time })} />
            <Row style={{ justifyContent: 'center', marginVertical: space.md, gap: 4 }}>
              {DAY_SHORT.map((d, i) => (
                <Tap key={d} onPress={() => setEdit({ ...edit, days: edit.days.includes(i) ? edit.days.filter((x) => x !== i) : [...edit.days, i].sort() })} label={d} role="checkbox">
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: edit.days.includes(i) ? colors.accent : colors.glass, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={[type.label, { color: edit.days.includes(i) ? colors.textOnAccent : colors.text }]}>{d}</Text>
                  </View>
                </Tap>
              ))}
            </Row>
            <Field label="שם ההתראה" value={edit.title} onChangeText={(title) => setEdit({ ...edit, title })} />
            <Row style={{ marginBottom: space.md }}>{SOUNDS.map(([k, l]) => <Chip key={k} label={l} active={edit.sound === k} onPress={() => setEdit({ ...edit, sound: k })} />)}</Row>
            <Row>
              <Button style={{ flex: 1 }} title="שמירה" disabled={!edit.days.length} onPress={() => save({ ...edit, enabled: true })} />
              {reminders.some((x) => x.id === edit.id) && <Button style={{ flex: 1 }} title="מחיקה" variant="danger" onPress={async () => { await cancelReminder(edit); del(edit.id); setEdit(null); }} />}
            </Row>
          </>
        )}
      </Sheet>
    </Screen>
  );
}
