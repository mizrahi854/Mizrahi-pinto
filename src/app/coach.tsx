import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Row, T, Badge, IconButton, Button, Chip } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { colors, fonts, radius, space, type } from '@/theme/tokens';

/**
 * 50 AI coach – Premium, NOT connected. No API key in the app; future calls go through a server
 * Edge Function with quotas/timeouts. Until then the screen shows a clearly-labelled sample
 * conversation and never presents generated advice as personal.
 */
const SAMPLE = [
  { me: true, text: 'אכלתי שתי פרוסות לחם מלא עם קוטג׳ ועגבנייה' },
  { me: false, text: 'הצעה לרישום: לחם מלא 2 פרוסות (60 ג׳), קוטג׳ 5% (100 ג׳), עגבנייה (120 ג׳). לתקן כמויות לפני שמירה?' },
];

export default function Coach() {
  const [text, setText] = useState('');
  const [note, setNote] = useState(false);
  return (
    <Screen title="מאמן AI" right={<Badge text="בקרוב" />} scroll footer={
      <View style={styles.input}>
        <TextInput value={text} onChangeText={setText} placeholder="כתוב מה אכלת או שאל על אימון" placeholderTextColor={colors.text3} style={{ flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, minHeight: 44 }} accessibilityLabel="הודעה למאמן" />
        <IconButton icon="chevronBack" label="שליחה" active onPress={() => { if (text.trim()) { setNote(true); setText(''); } }} />
      </View>
    }>
      <Card style={{ gap: 6, marginBottom: space.md }}>
        <Row><Icon name="sparkle" /><T.H>השירות עדיין לא מחובר</T.H></Row>
        <T.Muted>זו הדגמה מסומנת בלבד. בגרסת Premium המאמן יציע רכיבים וכמויות – ואתה תאשר לפני שמשהו נכתב ליומן. ללא אבחון רפואי וללא המצאת ערכים.</T.Muted>
      </Card>
      <T.Caption style={{ textAlign: 'center', marginBottom: 8 }}>שיחה לדוגמה</T.Caption>
      {SAMPLE.map((m, i) => (
        <View key={i} style={[styles.bubble, m.me ? styles.me : styles.bot]}>
          <Text style={[type.body, { color: m.me ? colors.textOnAccent : colors.text }]}>{m.text}</Text>
        </View>
      ))}
      {note && (
        <View style={[styles.bubble, styles.bot]}>
          <Text style={[type.body, { color: colors.text }]}>המאמן עדיין לא זמין, ולכן לא נוצרה תשובה. אפשר לתעד ידנית:</Text>
          <Row style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <Chip label="חיפוש מוצר" onPress={() => router.push('/foods')} />
            <Chip label="תיאור חופשי" onPress={() => router.push('/describe')} />
          </Row>
        </View>
      )}
      <Button title="פרטים על Premium" variant="ghost" onPress={() => router.push('/premium')} style={{ marginTop: space.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '84%', padding: 12, borderRadius: 18, marginBottom: 8 },
  me: { alignSelf: 'flex-start', backgroundColor: colors.accent, borderBottomStartRadius: 4 },
  bot: { alignSelf: 'flex-end', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, borderBottomEndRadius: 4 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingStart: 16, paddingEnd: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'rgba(255,255,255,0.05)' },
});
