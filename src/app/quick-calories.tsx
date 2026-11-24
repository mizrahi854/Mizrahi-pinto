import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Field, Button, Chip, Row, T, toast } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { useMeals } from '@/store/selectors';
import { validateNutrients, isAdult } from '@/lib/nutrition';
import { dateKey } from '@/lib/dates';
import { defaultMeal } from '@/lib/search';
import { space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

/** 22 Free calorie entry (adults) / free-text dish entry (5.8) */
export default function QuickCalories() {
  const adult = useApp((s) => isAdult(s.profile.age));
  const addEntry = useApp((s) => s.addEntry);
  const meals = useMeals();
  const [name, setName] = useState('');
  const [vals, setVals] = useState<Record<string, string>>({ kcal: '', protein: '', carbs: '', fat: '' });
  const [meal, setMeal] = useState(defaultMeal());
  const [err, setErr] = useState<string[]>([]);

  const save = () => {
    const { value, errors } = validateNutrients(adult ? vals : {});
    if (!adult && name.trim().length < 2) errors.push('נדרש שם מנה');
    if (adult && value.kcal == null && name.trim().length < 2) errors.push('יש להזין שם או כמות אנרגיה');
    setErr(errors);
    if (errors.length) return;
    addEntry({ date: dateKey(), meal, name: name.trim() || 'קלוריות מהירות', amount: 1, unitLabel: 'מנה', grams: null, nutrients: { ...value, fiber: null } });
    haptic.success();
    toast('נוסף ליומן');
    router.back();
  };

  return (
    <Screen title={adult ? 'קלוריות מהירות' : 'מנה ללא ערכים'} footer={<Button title="הוספה ליומן" onPress={save} />}>
      <T.Muted style={{ marginBottom: space.md }}>{adult ? 'הזנה חופשית: שם לא חובה, ערכים שלא ידועים נשארים ריקים (לא אפס).' : 'תיעוד מנה בשם בלבד, בלי ערכים תזונתיים.'}</T.Muted>
      <Field label={adult ? 'שם (לא חובה)' : 'שם המנה'} value={name} onChangeText={setName} placeholder="למשל: ארוחה במסעדה" />
      {adult && (
        <Row style={{ flexWrap: 'wrap' }}>
          {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
            <Field key={k} style={{ width: '47%' }} label={{ kcal: 'אנרגיה (קק״ל)', protein: 'חלבון (ג׳)', carbs: 'פחמימות (ג׳)', fat: 'שומן (ג׳)' }[k]} value={vals[k]} onChangeText={(v) => setVals({ ...vals, [k]: v })} keyboardType="decimal-pad" placeholder="לא ידוע" />
          ))}
        </Row>
      )}
      <T.Muted style={{ marginBottom: 6 }}>ארוחה</T.Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{meals.map((m) => <Chip key={m.key} label={m.label} active={meal === m.key} onPress={() => setMeal(m.key)} />)}</View>
      {err.map((e) => <T.Body key={e} style={{ color: '#FF8A8D', marginTop: 8 }}>{e}</T.Body>)}
    </Screen>
  );
}
