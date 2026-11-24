import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Card, Row, T, Field, Chip, Stepper, Divider } from '@/components/ui';
import { useApp, allFoods, findFood } from '@/store/useApp';
import { searchLocal } from '@/lib/search';
import { nutrientsFor, fmt } from '@/lib/nutrition';
import type { Food } from '@/data/types';
import { colors, space, type } from '@/theme/tokens';

/** Product comparison by values & portion – neutral, no "good/bad" ranking (7.6) */
export default function Compare() {
  const { a } = useLocalSearchParams<{ a?: string }>();
  const userFoods = useApp((s) => s.foods);
  const [left, setLeft] = useState<Food | undefined>(findFood(a, userFoods));
  const [right, setRight] = useState<Food | undefined>();
  const [q, setQ] = useState('');
  const [grams, setGrams] = useState(100);
  const res = useMemo(() => (q ? searchLocal(allFoods(userFoods), q).slice(0, 6) : []), [q, userFoods]);
  const rows = [['kcal', 'אנרגיה', 'קק״ל'], ['protein', 'חלבון', 'ג׳'], ['carbs', 'פחמימות', 'ג׳'], ['fat', 'שומן', 'ג׳'], ['fiber', 'סיבים', 'ג׳']] as const;
  const nl = left ? nutrientsFor(left, grams) : null;
  const nr = right ? nutrientsFor(right, grams) : null;
  return (
    <Screen title="השוואת מוצרים">
      <Field label={left && right ? 'החלפת מוצר שני' : left ? 'בחירת מוצר שני' : 'בחירת מוצר ראשון'} value={q} onChangeText={setQ} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {res.map((f) => <Chip key={f.id} label={f.name} onPress={() => { if (!left) setLeft(f); else setRight(f); setQ(''); }} />)}
      </View>
      <Row style={{ justifyContent: 'space-between', marginVertical: space.md }}><T.Body>כמות להשוואה</T.Body><Stepper label="כמות" value={grams} step={10} onChange={setGrams} unit="ג׳/מ״ל" /></Row>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[type.label, { color: colors.text2, width: 80 }]}> </Text>
          <Text style={[type.bodyMedium, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={2}>{left?.name ?? '—'}</Text>
          <Text style={[type.bodyMedium, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={2}>{right?.name ?? '—'}</Text>
        </Row>
        <Divider />
        {rows.map(([k, l, u]) => (
          <Row key={k} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={[type.label, { color: colors.text2, width: 80 }]}>{l} ({u})</Text>
            <Text style={[type.body, { color: colors.text, flex: 1, textAlign: 'center' }]}>{fmt(nl?.[k] ?? null)}</Text>
            <Text style={[type.body, { color: colors.text, flex: 1, textAlign: 'center' }]}>{fmt(nr?.[k] ?? null)}</Text>
          </Row>
        ))}
      </Card>
      <T.Caption style={{ marginTop: space.md }}>ההשוואה מציגה ערכים בלבד, ללא דירוג מזונות כטובים או רעים. מ״ל וגרם לא מומרים זה לזה.</T.Caption>
    </Screen>
  );
}
