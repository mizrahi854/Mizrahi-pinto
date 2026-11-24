import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Row, T, Section, Badge, Button } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { useWeek } from '@/store/selectors';
import { sessionVolume } from '@/lib/stats';
import { isAdult } from '@/lib/nutrition';
import { colors, fonts, space } from '@/theme/tokens';

/** 49 Weekly report – basic summary free; advanced trend analysis is a labelled Premium preview */
export default function Report() {
  const week = useWeek();
  const sessions = useApp((s) => s.sessions);
  const adult = useApp((s) => isAdult(s.profile.age));
  const water = useApp((s) => s.water);
  const done = sessions.filter((s) => s.status === 'done' && week.days.some((d) => d.date === s.date));
  const sets = done.reduce((m, s) => m + sessionVolume(s).sets, 0);
  const waterDays = week.days.filter((d) => water[d.date] != null);
  const avgWater = waterDays.length ? waterDays.reduce((m, d) => m + (water[d.date] ?? 0), 0) / waterDays.length / 1000 : null;

  return (
    <Screen title="דוח שבועי">
      <Card style={{ gap: 10 }}>
        <T.H>השבוע במספרים</T.H>
        <Line icon="calendar" text={`${week.loggedCount} מתוך 7 ימים עם תיעוד תזונה`} />
        {adult && <Line icon="flame" text={week.avgKcal != null ? `ממוצע ${week.avgKcal.toLocaleString()} קק״ל לימים שתועדו` : 'אין ימי תיעוד'} />}
        {week.avgProtein != null && <Line icon="protein" text={`ממוצע חלבון ${week.avgProtein} ג׳`} />}
        <Line icon="dumbbell" text={`${done.length} אימונים · ${sets} סטים`} />
        <Line icon="drop" text={avgWater != null ? `שתייה ממוצעת ${avgWater.toFixed(1)} ליטר` : 'שתייה לא תועדה'} />
      </Card>
      <Section title="ניתוח מגמות מתקדם">
        <Card style={{ gap: 8, opacity: 0.85 }}>
          <Row><Badge text="תצוגת דוגמה · Premium" /></Row>
          <T.Muted>בגרסת Premium: השוואה רב-שבועית, זיהוי דפוסי התמדה ותובנות. הנתונים למטה הם דוגמה ואינם הנתונים שלך.</T.Muted>
          <View style={{ height: 70, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
            <T.Caption>דוגמה: ״בימים עם אימון בבוקר תיעדת יותר ארוחות״</T.Caption>
          </View>
          <Button title="פרטים על Premium" variant="soft" onPress={() => router.push('/premium')} />
        </Card>
      </Section>
      <View style={{ height: space.xl }} />
    </Screen>
  );
}

function Line({ icon, text }: { icon: any; text: string }) {
  return <Row><Icon name={icon} size={20} /><T.Body style={{ fontFamily: fonts.regular }}>{text}</T.Body></Row>;
}
