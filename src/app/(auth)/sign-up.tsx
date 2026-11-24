import React, { useState } from 'react';
import { router } from 'expo-router';
import { Screen, Button, Field, T, toast } from '@/components/ui';
import { signUp, validateEmail, validatePassword, supabaseConfigured } from '@/lib/auth';
import { space } from '@/theme/tokens';

/** 03 Sign up */
export default function SignUp() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!validateEmail(email)) e.email = 'כתובת מייל לא תקינה';
    const p = validatePassword(pw);
    if (p) e.pw = p;
    if (pw !== pw2) e.pw2 = 'הסיסמאות אינן תואמות';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const r = await signUp(email, pw);
    setLoading(false);
    if (!r.ok) return toast(r.error);
    if (r.needsVerification) router.replace({ pathname: '/verify', params: { email } });
    else router.replace('/onboarding');
  };

  return (
    <Screen title="יצירת חשבון">
      <T.Title style={{ marginTop: space.md }}>בוא נתחיל</T.Title>
      <T.Muted style={{ marginBottom: space.xl }}>{supabaseConfigured ? 'נשלח אליך מייל לאימות הכתובת.' : 'מצב מקומי: החשבון נשמר במכשיר בלבד עד לחיבור השרת.'}</T.Muted>
      <Field label="אימייל" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" error={errors.email} />
      <Field label="סיסמה" value={pw} onChangeText={setPw} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.pw} placeholder="לפחות 8 תווים, אותיות ומספרים" />
      <Field label="אימות סיסמה" value={pw2} onChangeText={setPw2} secureTextEntry error={errors.pw2} onSubmitEditing={submit} />
      <Button title="הרשמה" onPress={submit} loading={loading} style={{ marginTop: space.sm }} />
      <Button title="כבר רשום? התחברות" variant="ghost" onPress={() => router.replace('/sign-in')} style={{ marginTop: space.sm }} />
      <T.Caption style={{ marginTop: space.lg, textAlign: 'center' }}>התחברות עם Apple תתווסף בהמשך.</T.Caption>
    </Screen>
  );
}
