import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Button, toast, Empty } from '@/components/ui';
import { resendVerification } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { space } from '@/theme/tokens';

/** 05b Verify e-mail */
export default function Verify() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [loading, setLoading] = useState(false);
  const check = async () => {
    setLoading(true);
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    setLoading(false);
    if (data.user?.email_confirmed_at) router.replace('/onboarding');
    else toast('הכתובת עדיין לא אומתה. לחץ על הקישור במייל ואז התחבר.');
  };
  return (
    <Screen title="אימות מייל">
      <Empty icon="bell" title="שלחנו לך מייל" text={`לחץ על הקישור שנשלח אל ${email ?? 'הכתובת שלך'} כדי לאמת את החשבון.`} />
      <Button title="אימתתי – המשך" onPress={check} loading={loading} />
      <Button title="שליחה חוזרת" variant="ghost" style={{ marginTop: space.sm }} onPress={async () => { const r = await resendVerification(String(email ?? '')); toast(r.ok ? 'נשלח שוב' : r.error); }} />
      <Button title="להתחברות" variant="soft" style={{ marginTop: space.sm }} onPress={() => router.replace('/sign-in')} />
    </Screen>
  );
}
