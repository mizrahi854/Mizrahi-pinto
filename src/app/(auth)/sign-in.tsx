import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen, Button, Field, T, toast } from '@/components/ui';
import { signIn, validateEmail } from '@/lib/auth';
import { useApp } from '@/store/useApp';
import { space } from '@/theme/tokens';

/** 04 Sign in */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!validateEmail(email) || !pw) return setErr('יש להזין מייל וסיסמה');
    setErr(undefined);
    setLoading(true);
    const r = await signIn(email, pw);
    setLoading(false);
    if (!r.ok) return toast(r.error);
    router.replace(useApp.getState().onboarded ? '/(tabs)' : '/onboarding');
  };
  return (
    <Screen title="התחברות">
      <T.Title style={{ marginTop: space.md, marginBottom: space.xl }}>טוב לראות אותך שוב</T.Title>
      <Field label="אימייל" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="סיסמה" value={pw} onChangeText={setPw} secureTextEntry autoComplete="password" error={err} onSubmitEditing={submit} />
      <Button title="התחברות" onPress={submit} loading={loading} />
      <Button title="שכחתי סיסמה" variant="ghost" onPress={() => router.push('/reset')} style={{ marginTop: space.sm }} />
    </Screen>
  );
}
