import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Button, T, Badge } from '@/components/ui';
import { Logo } from '@/components/Brand';
import { DemoPlayer } from '@/components/DemoPlayer';
import { continueLocal, supabaseConfigured } from '@/lib/auth';
import { space } from '@/theme/tokens';

/** 02 Welcome + demo */
export default function Welcome() {
  return (
    <Screen back={false}>
      <View style={{ alignItems: 'flex-end', marginTop: 8 }}><Logo /></View>
      <T.Hero style={{ marginTop: space.xl }}>ברוך הבא</T.Hero>
      <T.Muted style={{ marginTop: 6, fontSize: 15 }}>יומן מזון, אימונים, תכנון שבועי והרגלים – במקום אחד.</T.Muted>
      <View style={{ marginTop: space.xl }}>
        <DemoPlayer height={340} onSkip={() => router.push('/sign-up')} />
      </View>
      <View style={{ gap: space.sm, marginTop: space.xl }}>
        <Button title="יצירת חשבון" icon="chevron" onPress={() => router.push('/sign-up')} />
        <Button title="כבר יש לי חשבון" variant="ghost" onPress={() => router.push('/sign-in')} />
        <Button title="המשך בלי חשבון (שמירה במכשיר בלבד)" variant="soft" onPress={() => { continueLocal(); router.replace('/onboarding'); }} />
      </View>
      {!supabaseConfigured && (
        <View style={{ marginTop: space.lg, alignItems: 'center', gap: 6 }}>
          <Badge text="מצב מקומי" tone="muted" />
          <T.Caption style={{ textAlign: 'center' }}>השרת עדיין לא חובר. הנתונים נשמרים במכשיר זה בלבד ואין סנכרון בין מכשירים.</T.Caption>
        </View>
      )}
    </Screen>
  );
}
