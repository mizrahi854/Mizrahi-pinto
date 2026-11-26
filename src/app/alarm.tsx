import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, Row, T, Button, Chip, Sheet, Field, IconButton, Tap, Badge, toast, Section } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { TimeWheel } from '@/components/WheelPicker';
import { useApp } from '@/store/useApp';
import type { Reminder, ReminderType } from '@/data/types';
import { getPermission, requestPermission, scheduleReminder, cancelReminder, PermState, notificationsSupported } from '@/lib/notifications';
import { DAY_SHORT, uid } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

const TYPES: { t: ReminderType; l: string; icon: IconName; title: string; time: string; days: number[] }[] = [
  { t: 'workout', l: 'אימון הבא', icon: 'dumbbell', title: 'תזכורת לאימון', time: '05:00', days: [0, 2, 4] },
  { t: 'daily', l: 'יומית', icon: 'bell', title: 'תזכורת יומית', time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] },
  { t: 'did_train', l: 'התאמנת היום?', icon: 'check', title: 'התאמנת היום?', time: '20:30', days: [0, 1, 2, 3, 4] },
  { t: 'meal', l: 'תיעוד ארוחות', icon: 'bowl', title: 'תיעוד ארוחות', time: '13:30', days: [0, 1, 2, 3, 4, 5, 6] },
  { t: 'plan_week', l: 'תכנון שבוע', icon: 'calendar', title: 'תכנון השבוע', time: '20:00', days: [6] },
  { t: 'shabbat_prep', l: 'הכנה לשבת', icon: 'star', title: 'הכנת תוכנית שישי-שבת', time: '18:00', days: [4] },
  { t: 'restaurant', l: 'מסעדה', icon: 'food', title: 'יציאה למסעדה', time: '18:30', days: [4] },
  { t: 'alarm', l: 'השכמה', icon: 'alarm', title: 'השכמה', time: '05:00', days: [0, 1, 2, 3, 4] },
];
const LEGACY: Partial<Record<ReminderType, IconName>> = { water: 'drop', sleep: 'moon', recovery: 'body' };
const SOUNDS = [['default', 'ברירת מחדל'], ['soft', 'עדין'], ['none', 'ללא צליל']] as const;

const inQuiet = (t: string, a: string, b: string) => (a <= b ? t >= a && t < b : t >= a || t < b);

/** Reminders & alarm: next workout, daily, "did you train?", week planning, Shabbat prep, restaurant, meals. */
export default function Alarm() {
  const reminders = useApp((s) => s.reminders);
  const upsert = useApp((s) => s.upsertReminder);
  const del = useApp((s) => s.deleteReminder);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const [perm, setPerm] = useState<PermState>('undetermined');
  const shabbat = useApp((s) => s.shabbat);
  const updateShabbat = useApp((s) => s.updateShabbat);
  const p = useLocalSearchParams<{ new?: string }>();
  const [edit, setEdit] = useState<Reminder | null>(() => (p.new === '1' ? { id: uid(), type: 'workout', title: 'תזכורת לאימון', time: '05:00', days: [0, 2, 4], enabled: true, sound: 'default' } : null));
  useEffect(() => { getPermission().then(setPerm); }, []);
  const web = Platform.OS === 'web';
  const opts = { muted: settings.muted, muteShabbat: shabbat.muteDuringShabbat };

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
    const ids = await scheduleReminder(r, opts).catch(() => []);
    upsert({ ...r, notificationIds: ids });
    setEdit(null);
    toast(!r.enabled ? 'נשמר' : settings.muted ? 'נשמר – ההתראות מושתקות כרגע' : notificationsSupported ? 'התזכורת תוזמנה' : 'נשמר. בגרסת האתר התזכורת תופיע בתוך האפליקציה בלבד');
  };

  return (
    <Screen title="תזכורות ושעון מעורר" right={<IconButton icon="plus" label="תזכורת חדשה" active size={44} onPress={() => setEdit({ id: uid(), type: 'workout', title: 'תזכורת לאימון', time: '05:00', days: [0, 2, 4], enabled: true, sound: 'default' })} />}>
      {web && (
        <Card style={{ gap: 6, marginBottom: space.md, borderColor: colors.borderStrong }}>
          <Row><Icon name="flag" /><T.H>מגבלות בגרסת האתר באייפון</T.H></Row>
          <T.Muted>באתר שנשמר למסך הבית (PWA) אין אפשרות לתזמן התראות מקומיות ואין שעון מעורר. התזכורות שתגדיר כאן נשמרות, מופיעות במרכז ההתראות ובמסך הבית כשהן רלוונטיות, ויעבדו כהתראות אמיתיות בגרסת האפליקציה המותקנת.</T.Muted>
          <T.Muted>להשכמה אמינה (למשל 05:00 בבוקר) כדאי להגדיר גם שעון מעורר באפליקציית השעון של האייפון.</T.Muted>
        </Card>
      )}
      <Card style={{ gap: 4, marginBottom: space.md }}>
        <Row style={{ justifyContent: 'space-between' }}><T.Body style={{ flex: 1 }}>השתקת כל ההתראות</T.Body><Switch value={settings.muted} onValueChange={(v) => { updateSettings({ muted: v }); toast(v ? 'כל ההתראות הושתקו' : 'ההתראות הופעלו מחדש'); reminders.forEach((r) => scheduleReminder(r, { ...opts, muted: v }).then((ids) => upsert({ ...r, notificationIds: ids })).catch(() => {})); }} trackColor={{ true: colors.accent, false: colors.track }} thumbColor="#fff" accessibilityLabel="השתקת כל ההתראות" /></Row>
        <Row style={{ justifyContent: 'space-between' }}><T.Body style={{ flex: 1 }}>ללא התראות בשבת</T.Body><Switch value={shabbat.muteDuringShabbat} onValueChange={(v) => updateShabbat({ muteDuringShabbat: v })} trackColor={{ true: colors.accent, false: colors.track }} thumbColor="#fff" accessibilityLabel="ללא התראות בשבת" /></Row>
        <T.Caption>שבת: משישי 16:00 ועד מוצאי שבת (בקירוב).</T.Caption>
      </Card>
      <Card style={{ gap: 6, marginBottom: space.md }}>
        <Row><Icon name="bell" /><T.Body style={{ flex: 1 }}>סטטוס התראות</T.Body>
          <Badge text={{ granted: 'מאושר', denied: 'נדחה', undetermined: 'טרם אושר', unsupported: 'לא זמין כאן' }[perm]} tone={perm === 'granted' ? 'accent' : 'warn'} />
        </Row>
        {perm === 'undetermined' && <Button title="אישור התראות" variant="soft" onPress={async () => setPerm(await requestPermission())} />}
        {perm === 'denied' && <T.Muted>ההרשאה נדחתה. ניתן להפעיל בהגדרות האייפון ← MIZRAHI PINTO ← עדכונים.</T.Muted>}
        {!web && <T.Caption>חשוב לדעת: באייפון, אפליקציה רגילה שולחת התראה מקומית ולא שעון מעורר מערכתי. במצב שקט / ריכוז ייתכן שלא יושמע צליל. לשעון מעורר אמין השתמשו גם בשעון של iOS.</T.Caption>}
      </Card>

      {reminders.length === 0 && <T.Muted style={{ textAlign: 'center', marginVertical: space.lg }}>אין תזכורות עדיין. לחץ + כדי ליצור.</T.Muted>}
      {reminders.map((r) => {
        const meta = TYPES.find((x) => x.t === r.type) ?? { icon: LEGACY[r.type] ?? 'bell' };
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
              {TYPES.map((x) => <Chip key={x.t} label={x.l} icon={x.icon} active={edit.type === x.t} onPress={() => setEdit({ ...edit, type: x.t, title: x.title, time: x.time, days: x.days })} />)}
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
