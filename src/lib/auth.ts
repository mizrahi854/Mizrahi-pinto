import { useEffect } from 'react';
import { supabase, supabaseConfigured } from './supabase';
import { useApp } from '@/store/useApp';
import { uid } from './dates';

/**
 * Auth facade. With Supabase configured → real email/password auth with email verification.
 * Without it → "local mode": data stays on this device only, and the UI says so.
 * We never fake a verification e-mail or a server account.
 */
export function useAuthListener() {
  const setSession = useApp((s) => s.setSession);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) setSession({ mode: 'supabase', userId: u.id, email: u.email ?? undefined, emailConfirmed: !!u.email_confirmed_at });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u) setSession({ mode: 'supabase', userId: u.id, email: u.email ?? undefined, emailConfirmed: !!u.email_confirmed_at });
    });
    return () => data.subscription.unsubscribe();
  }, [setSession]);
}

export const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const validatePassword = (p: string) => (p.length < 8 ? 'לפחות 8 תווים' : !/\d/.test(p) || !/[A-Za-zא-ת]/.test(p) ? 'שלב אותיות ומספרים' : null);

type Result = { ok: true; needsVerification?: boolean } | { ok: false; error: string };

const heError = (m: string) =>
  /invalid login/i.test(m) ? 'אימייל או סיסמה שגויים' : /already registered/i.test(m) ? 'כתובת המייל כבר רשומה' : /rate/i.test(m) ? 'יותר מדי ניסיונות, נסה שוב בעוד מספר דקות' : /network|fetch/i.test(m) ? 'אין חיבור לשרת. בדוק את האינטרנט' : m;

export async function signUp(email: string, password: string): Promise<Result> {
  if (!supabase) {
    useApp.getState().setSession({ mode: 'local', userId: `local_${uid()}`, email });
    return { ok: true };
  }
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) return { ok: false, error: heError(error.message) };
  return { ok: true, needsVerification: !data.session };
}

export async function signIn(email: string, password: string): Promise<Result> {
  if (!supabase) {
    useApp.getState().setSession({ mode: 'local', userId: `local_${uid()}`, email });
    return { ok: true };
  }
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: heError(error.message) } : { ok: true };
}

export async function resetPassword(email: string): Promise<Result> {
  if (!supabase) return { ok: false, error: 'איפוס סיסמה דורש חיבור לשרת (Supabase) שעדיין לא הוגדר.' };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return error ? { ok: false, error: heError(error.message) } : { ok: true };
}

export async function resendVerification(email: string): Promise<Result> {
  if (!supabase) return { ok: false, error: 'אימות מייל דורש חיבור לשרת.' };
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  return error ? { ok: false, error: heError(error.message) } : { ok: true };
}

export function continueLocal() {
  useApp.getState().setSession({ mode: 'local', userId: `local_${uid()}` });
}

export async function signOut() {
  await supabase?.auth.signOut().catch(() => {});
  useApp.getState().setSession(null);
}

/** Deletes the server account via an Edge Function (server-side, service key never in app) and wipes local data. */
export async function deleteAccount(): Promise<Result> {
  if (supabase && useApp.getState().session?.mode === 'supabase') {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return { ok: false, error: 'מחיקת החשבון בשרת נכשלה. נסה שוב.' };
    await supabase.auth.signOut().catch(() => {});
  }
  useApp.getState().resetAll();
  return { ok: true };
}

export { supabaseConfigured };
