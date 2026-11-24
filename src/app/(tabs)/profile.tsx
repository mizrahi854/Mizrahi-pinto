import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, ListItem, Section, Stat, Badge } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { isAdult } from '@/lib/nutrition';
import { weeklyConsistency } from '@/lib/records';
import { supabaseConfigured } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme/tokens';

/** 53 Profile */
export default function Profile() {
  const profile = useApp((s) => s.profile);
  const session = useApp((s) => s.session);
  const sessions = useApp((s) => s.sessions);
  const entries = useApp((s) => s.entries);
  const challenges = useApp((s) => s.challenges);
  const daysLogged = new Set(entries.map((e) => e.date)).size;
  const initial = (profile.name.trim()[0] ?? 'M').toUpperCase();
  return (
    <HeroScreen title={profile.name || 'הפרופיל שלי'} label={session?.email ?? (session?.mode === 'local' ? 'מצב מקומי – שמירה במכשיר' : '')} heroHeight={270} progress={Math.min(1, daysLogged / 30)}
      above={<View style={{ position: 'absolute', top: -6, width: 0, height: 0 }} />}>
      <View style={{ alignItems: 'center', marginTop: -40, marginBottom: space.md }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.emberMid, borderWidth: 2, borderColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="תמונת פרופיל">
          <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 30 }}>{initial}</Text>
        </View>
      </View>
      <Card>
        <Row>
          <Stat value={String(daysLogged)} label="ימי תיעוד" icon="calendar" />
          <Stat value={String(sessions.filter((s) => s.status === 'done').length)} label="אימונים" icon="dumbbell" />
          <Stat value={String(weeklyConsistency(sessions))} label="שבועות ברצף" icon="bolt" />
        </Row>
      </Card>
      <Section title="התוכנית שלי">
        <ListItem icon="edit" title="עריכת תשובות ותוכנית" subtitle={`${profile.trainingDays.length} אימונים בשבוע · ${profile.planDays} ימי תכנון`} onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })} />
        {isAdult(profile.age) && <ListItem icon="calc" title="יעדים ומחשבון" subtitle={profile.calorieTarget ? `${profile.calorieTarget.toLocaleString()} קק״ל ביום` : 'מעקב ללא יעד'} onPress={() => router.push('/calculator')} />}
        <ListItem icon="dumbbell" title="אימונים ולוח שבועי" onPress={() => router.push('/workouts')} />
        <ListItem icon="trophy" title="ימים לניצחון" subtitle={`${challenges.filter((c) => !c.finished).length} אתגרים פעילים`} onPress={() => router.push('/victory')} />
        <ListItem icon="alarm" title="שעון מעורר ותזכורות" onPress={() => router.push('/alarm')} />
      </Section>
      <Section title="חשבון">
        <ListItem icon="crown" title="Premium" right={<Badge text="בקרוב" />} onPress={() => router.push('/premium')} />
        <ListItem icon="settings" title="הגדרות ופרטיות" onPress={() => router.push('/settings')} />
        <ListItem icon="help" title="עזרה ודיווח" onPress={() => router.push('/help')} />
      </Section>
      {!supabaseConfigured && <T.Caption style={{ textAlign: 'center', marginTop: space.md }}>השרת עדיין לא מחובר: הנתונים נשמרים במכשיר זה בלבד.</T.Caption>}
    </HeroScreen>
  );
}
