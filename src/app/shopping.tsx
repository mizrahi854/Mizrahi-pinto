import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Screen, Row, T, Tap, IconButton, Field, Button, Empty } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useApp } from '@/store/useApp';
import { colors, radius, space, type } from '@/theme/tokens';

/** 34 Shopping list */
export default function Shopping() {
  const items = useApp((s) => s.shopping);
  const toggle = useApp((s) => s.toggleShopping);
  const remove = useApp((s) => s.removeShopping);
  const add = useApp((s) => s.addShopping);
  const clear = useApp((s) => s.clearChecked);
  const [name, setName] = useState('');
  const sorted = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
  return (
    <Screen title="רשימת קניות" subtitle={`${items.filter((i) => !i.checked).length} פריטים לקנייה`}>
      <Row>
        <Field style={{ flex: 1, marginBottom: 0 }} label="פריט חדש" value={name} onChangeText={setName} onSubmitEditing={() => { if (name.trim()) { add([{ name: name.trim(), qty: '' }]); setName(''); } }} />
        <IconButton icon="plus" label="הוספה" active onPress={() => { if (name.trim()) { add([{ name: name.trim(), qty: '' }]); setName(''); } }} />
      </Row>
      <View style={{ marginTop: space.md }}>
        {sorted.length === 0 && <Empty icon="cart" title="הרשימה ריקה" text="הוסף מתכונים מתכנון שבועי או ידנית." />}
        {sorted.map((i) => (
          <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, marginBottom: 8 }}>
            <Tap onPress={() => toggle(i.id)} label={`${i.name}${i.checked ? ', נרכש' : ''}`} role="checkbox" style={{ flex: 1 }}>
              <Row>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: i.checked ? colors.accent : colors.borderStrong, backgroundColor: i.checked ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{i.checked && <Icon name="check" size={14} color={colors.textOnAccent} />}</View>
                <Text style={[type.body, { color: i.checked ? colors.text3 : colors.text, textDecorationLine: i.checked ? 'line-through' : 'none', flex: 1 }]}>{i.name}</Text>
                {i.qty ? <T.Muted>{i.qty}</T.Muted> : null}
              </Row>
            </Tap>
            <IconButton icon="trash" label={`מחק ${i.name}`} size={34} onPress={() => remove(i.id)} />
          </View>
        ))}
      </View>
      {items.some((i) => i.checked) && <Button title="ניקוי פריטים שנרכשו" variant="ghost" onPress={clear} />}
    </Screen>
  );
}
