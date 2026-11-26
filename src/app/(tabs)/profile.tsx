import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Card, Row, T, ListItem, Section, Stat, Badge, toast } from '@/components/ui';
import { useApp, tracksCalories } from '@/store/useApp';
import { isAdult } from '@/lib/nutrition';
import { supabaseConfigured } from '@/lib/supabase';
import { colors, fonts, space } from '@/theme/tokens';

/** Profile – the hub for planning tools, calculators, reports and settings (everything ≤ 2 taps away). */
export default function Profile() {
  const profile = useApp((s) => s.profile);
  const session = useApp((s) => s.session);
  const workouts = useApp((s) => s.workouts);
  const entries = useApp((s) => s.entries);
  const challenges = useApp((s) => s.challenges);
  const reminders = useApp((s) => s.reminders);
  const updateProfile = useApp((s) => s.updateProfile);
  const daysLogged = new Set(entries.map((e) => e.date)).size;
  const done = workouts.filter((w) => w.status === 'done' && !w.rest).length;
  const adult = isAdult(profile.age);
  const calories = tracksCalories(profile);
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
          <Stat value={String(done)} label="אימונים שהושלמו" icon="dumbbell" />
          <Stat value={String(challenges.filter((c) => !c.finished).length)} label="אתגרים פעילים" icon="trophy" />
        </Row>
      </Card>
      <Section title="התוכנית שלי">
        <ListItem icon="edit" title="עריכת השאלון והתוכנית" subtitle={`${profile.trainingDays.length} אימונים בשבוע · ${profile.trainingTime || 'ללא שעה קבועה'}`} onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })} />
        <ListItem icon="calendar" title="התוכנית השבועית" onPress={() => router.push('/(tabs)/plan')} />
        <ListItem icon="star" title="תוכנית שישי-שבת" onPress={() => router.push('/shabbat')} />
        <ListItem icon="food" title="מצב מסעדה" subtitle="מנות ומסעדות מועדפות" onPress={() => router.push('/restaurant')} />
        <ListItem icon="trophy" title="ימים לניצחון" onPress={() => router.push('/victory')} />
      </Section>
      <Section title="מחשבונים וכלים">
        <ListItem icon="calc" title="מחשבונים וכלים" subtitle={adult ? 'BMI · BMR · TDEE · ערכים לפי כמות · גרמים ומנות' : 'ערכים לפי כמות · גרמים ומנות'} onPress={() => router.push('/tools')} />
        <ListItem icon="weight" title="יומן מדידות" subtitle="היסטוריה וגרפים" onPress={() => router.push('/measurements')} />
        <ListItem icon="chart" title="דוחות וסטטיסטיקות" onPress={() => router.push('/reports')} />
        <ListItem icon="list" title="ארוחות שמורות" onPress={() => router.push('/saved-meals')} />
        <ListItem icon="cart" title="רשימת קניות" onPress={() => router.push('/shopping')} />
        <ListItem icon="bowl" title="מתכונים והמלצות" onPress={() => router.push('/recipes')} />
      </Section>
      <Section title="הגדרות">
        {adult && (
          <ListItem icon="flame" title={calories ? 'מעקב קלוריות: פעיל' : 'מעקב קלוריות: כבוי'} subtitle={calories ? (profile.calorieTarget ? `יעד ${profile.calorieTarget.toLocaleString()} קק״ל ביום` : 'ללא יעד') : 'יומן ארוחות והרגלים בלבד'}
            onPress={() => { updateProfile({ trackCalories: !calories }); toast(calories ? 'מעקב הקלוריות כובה' : 'מעקב הקלוריות הופעל'); }} />
        )}
        <ListItem icon="alarm" title="תזכורות ושעון מעורר" subtitle={`${reminders.filter((r) => r.enabled).length} פעילות`} onPress={() => router.push('/alarm')} />
        <ListItem icon="crown" title="Premium" right={<Badge text="בקרוב" />} onPress={() => router.push('/premium')} />
        <ListItem icon="settings" title="הגדרות ופרטיות" onPress={() => router.push('/settings')} />
        <ListItem icon="help" title="עזרה ודיווח" onPress={() => router.push('/help')} />
      </Section>
      {!supabaseConfigured && <T.Caption style={{ textAlign: 'center', marginTop: space.md }}>השרת עדיין לא מחובר: הנתונים נשמרים במכשיר זה בלבד.</T.Caption>}
    </HeroScreen>
  );
}
