import React, { useEffect, useState } from 'react';
import { Switch, Platform, Share, Linking } from 'react-native';
import { router } from 'expo-router';
import { Screen, Section, ListItem, Row, T, Card, Chip, Sheet, Button, Field, toast, Badge, Stepper } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { signOut, deleteAccount, supabaseConfigured } from '@/lib/auth';
import { getPermission, requestPermission, PermState } from '@/lib/notifications';
import { useCameraPermissions } from 'expo-camera';
import { colors, space } from '@/theme/tokens';

/** 54 Settings & privacy */
export default function Settings() {
  const st = useApp();
  const { profile, settings, updateProfile, updateSettings } = st;
  const [perm, setPerm] = useState<PermState>('undetermined');
  const [cam, requestCam] = useCameraPermissions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState('');
  useEffect(() => { getPermission().then(setPerm); }, []);

  const exportData = async () => {
    const { hydrated, ...rest } = useApp.getState() as any;
    const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'));
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), app: 'MIZRAHI PINTO', data }, null, 2);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'mizrahi-pinto-export.json'; a.click();
    } else await Share.share({ message: json, title: 'mizrahi-pinto-export.json' }).catch(() => {});
  };

  return (
    <Screen title="הגדרות ופרטיות">
      <Section title="פרופיל" style={{ marginTop: 0 }}>
        <Field label="שם" value={profile.name} onChangeText={(name) => updateProfile({ name })} />
        <Row style={{ marginBottom: space.md }}><T.Muted>שפה</T.Muted><Chip label="עברית" active={profile.language === 'he'} onPress={() => updateProfile({ language: 'he' })} /><Chip label="English (בקרוב)" active={false} onPress={() => toast('אנגלית תתווסף בהמשך')} /></Row>
        <Row><T.Muted>יחידות</T.Muted><Chip label="מטרי (ק״ג, ס״מ, מ״ל)" active /></Row>
        <Row style={{ justifyContent: 'space-between', marginTop: space.md }}><T.Body>יעד שתייה</T.Body><Stepper label="יעד שתייה" value={profile.waterTargetMl} step={250} min={1000} max={6000} unit="מ״ל" onChange={(v) => updateProfile({ waterTargetMl: v })} /></Row>
        <T.Caption style={{ marginTop: 6 }}>אזור זמן: {Intl.DateTimeFormat().resolvedOptions().timeZone} (לפי המכשיר)</T.Caption>
      </Section>

      <Section title="הרשאות">
        <ListItem icon="bell" title="התראות" right={<Badge text={{ granted: 'מאושר', denied: 'נדחה', undetermined: 'לא אושר', unsupported: 'לא זמין' }[perm]} tone={perm === 'granted' ? 'accent' : 'muted'} />} onPress={async () => (perm === 'denied' ? Linking.openSettings() : setPerm(await requestPermission()))} />
        <ListItem icon="camera" title="מצלמה (ברקוד וצילום ארוחה)" right={<Badge text={cam?.granted ? 'מאושר' : 'לא אושר'} tone={cam?.granted ? 'accent' : 'muted'} />} onPress={() => (cam?.canAskAgain === false ? Linking.openSettings() : requestCam())} />
        <ListItem icon="alarm" title="ניהול תזכורות" onPress={() => router.push('/alarm')} />
      </Section>

      <Section title="נגישות ותנועה">
        <Card style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><T.Body>רטט במגע</T.Body><Switch value={settings.haptics} onValueChange={(v) => updateSettings({ haptics: v })} trackColor={{ true: colors.accent, false: colors.track }} thumbColor="#fff" {...({ activeThumbColor: '#fff' } as any)} /></Row>
          <T.Caption>האנימציות מכבדות את ״הפחתת תנועה״ של iOS. גודל הטקסט מכבד את הגדרות המערכת.</T.Caption>
        </Card>
      </Section>

      <Section title="נתונים ופרטיות">
        <ListItem icon="download" title="ייצוא הנתונים שלי (JSON)" onPress={exportData} />
        <ListItem icon="lock" title="מצב סנכרון" subtitle={supabaseConfigured ? (st.session?.mode === 'supabase' ? 'מחובר לשרת' : 'לא מחובר') : 'מקומי בלבד – השרת עדיין לא הוגדר'} />
        <ListItem icon="help" title="תנאי שימוש ופרטיות" onPress={() => router.push('/help')} />
      </Section>

      <Section title="חשבון">
        <ListItem icon="logout" title="יציאה" onPress={async () => { await signOut(); router.replace('/welcome'); }} />
        <ListItem icon="trash" title="מחיקת חשבון ונתונים" danger onPress={() => setConfirmDelete(true)} />
      </Section>

      <Sheet visible={confirmDelete} onClose={() => setConfirmDelete(false)} title="מחיקת חשבון">
        <T.Body style={{ textAlign: 'center' }}>כל הנתונים יימחקו לצמיתות{supabaseConfigured ? ' מהמכשיר ומהשרת' : ' מהמכשיר'}. לא ניתן לשחזר.</T.Body>
        <Field label='הקלד "מחק" לאישור' value={typed} onChangeText={setTyped} style={{ marginTop: space.md }} />
        <Button title="מחיקה לצמיתות" variant="danger" disabled={typed.trim() !== 'מחק'} onPress={async () => {
          const r = await deleteAccount();
          if (!r.ok) return toast(r.error);
          setConfirmDelete(false); router.replace('/welcome');
        }} />
      </Sheet>
    </Screen>
  );
}
