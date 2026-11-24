import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Field, Button, Chip, Row, T, Stepper, IconButton, Card, toast } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { addDays, dateKey, prettyDate, uid } from '@/lib/dates';
import { space } from '@/theme/tokens';

const SUGGESTED = ['להשלים את האימון המתוכנן', 'הליכה 30 דקות', 'לתעד את כל הארוחות', 'לשתות 2.5 ליטר', 'לישון 7 שעות', '10 דקות מתיחות', 'לתרגל טכניקה בתרגיל חדש'];

/** 45 Create challenge */
export default function NewChallenge() {
  const upsert = useApp((s) => s.upsertChallenge);
  const [name, setName] = useState('Road to Victory');
  const [days, setDays] = useState(30);
  const [partner, setPartner] = useState('');
  const [tasks, setTasks] = useState<string[]>(['להשלים את האימון המתוכנן', 'לתעד את כל הארוחות']);
  const [custom, setCustom] = useState('');
  const start = dateKey();
  const end = addDays(start, days - 1);

  return (
    <Screen title="אתגר חדש" footer={<Button title="יצירת האתגר" disabled={!name.trim() || !tasks.length} onPress={() => {
      const id = uid();
      upsert({ id, name: name.trim(), startDate: start, endDate: end, partner: partner.trim() || undefined, partnerStatus: partner.trim() ? 'invited' : 'none', tasks: tasks.map((t) => ({ id: uid() + t.length, title: t })), log: {}, restDays: [], notes: {} });
      toast('האתגר נוצר'); router.replace(`/victory/${id}`);
    }} />}>
      <Field label="שם האתגר" value={name} onChangeText={setName} />
      <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
        <T.Body>משך (ימים)</T.Body>
        <Stepper label="ימים" value={days} min={3} max={365} step={1} onChange={(v) => setDays(Math.max(3, v))} />
      </Row>
      <Row style={{ marginBottom: space.md }}>{[14, 30, 60, 90].map((d) => <Chip key={d} label={`${d}`} active={days === d} onPress={() => setDays(d)} />)}</Row>
      <T.Caption style={{ marginBottom: space.md }}>מ-{prettyDate(start)} עד {end.split('-').reverse().join('.')}</T.Caption>
      <Field label="שותף לאתגר (לא חובה) – למשל: אלירן" value={partner} onChangeText={setPartner} />
      <T.Caption style={{ marginTop: -8, marginBottom: space.md }}>השותף יוזמן ויצטרף רק בהסכמה. משותף רק מה שתבחר לחשוף.</T.Caption>
      <T.H style={{ marginBottom: 8 }}>משימות יומיות</T.H>
      {tasks.map((t) => (
        <Card key={t} style={{ marginBottom: 6, paddingVertical: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}><T.Body style={{ flex: 1 }}>{t}</T.Body><IconButton icon="close" label={`הסר ${t}`} size={32} onPress={() => setTasks(tasks.filter((x) => x !== t))} /></Row>
        </Card>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }}>
        {SUGGESTED.filter((s) => !tasks.includes(s)).map((s) => <Chip key={s} label={`+ ${s}`} onPress={() => setTasks([...tasks, s])} />)}
      </View>
      <Row>
        <Field style={{ flex: 1, marginBottom: 0 }} label="משימה משלך" value={custom} onChangeText={setCustom} />
        <IconButton icon="plus" label="הוספת משימה" active onPress={() => { if (custom.trim()) { setTasks([...tasks, custom.trim()]); setCustom(''); } }} />
      </Row>
    </Screen>
  );
}
