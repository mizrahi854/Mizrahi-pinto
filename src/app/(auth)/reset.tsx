import React, { useState } from 'react';
import { Screen, Button, Field, T, toast } from '@/components/ui';
import { resetPassword, validateEmail } from '@/lib/auth';
import { space } from '@/theme/tokens';

/** 05 Reset password */
export default function Reset() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!validateEmail(email)) return toast('כתובת מייל לא תקינה');
    setLoading(true);
    const r = await resetPassword(email);
    setLoading(false);
    if (!r.ok) return toast(r.error);
    setSent(true);
  };
  return (
    <Screen title="איפוס סיסמה">
      {sent ? (
        <>
          <T.Title style={{ marginTop: space.xl }}>בדוק את תיבת המייל</T.Title>
          <T.Muted style={{ marginTop: 8 }}>אם הכתובת רשומה, נשלח אליה קישור לאיפוס הסיסמה.</T.Muted>
        </>
      ) : (
        <>
          <T.Muted style={{ marginTop: space.md, marginBottom: space.lg }}>נשלח קישור לאיפוס לכתובת המייל שלך.</T.Muted>
          <Field label="אימייל" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Button title="שליחת קישור" onPress={submit} loading={loading} />
        </>
      )}
    </Screen>
  );
}
