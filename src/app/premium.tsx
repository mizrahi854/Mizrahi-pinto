import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { HeroScreen } from '@/components/HeroScreen';
import { Row, T, Tap, Button, ListItem, Section, Sheet, Badge, Card } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { DemoPlayer } from '@/components/DemoPlayer';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'settings', title: 'תפריט חכם אישי', desc: 'תוכנית ארוחות שבועית לפי ההעדפות, הזמן והאלרגיות שלך. כל שינוי באישורך.' },
  { icon: 'dumbbell', title: 'תוכנית אימונים מותאמת', desc: 'תוכניות מתקדמות (כמו PPL 6 ימים) עם התאמה לציוד ולזמינות.' },
  { icon: 'chart', title: 'דוחות והתקדמות', desc: 'ניתוח מגמות רב-שבועי, דוח שבועי מורחב וייצוא.' },
  { icon: 'sparkle', title: 'מאמן AI וזיהוי ארוחה', desc: 'הוספת ארוחה בשפה חופשית ומתמונה – תמיד כהערכה שדורשת אישור.' },
  { icon: 'cart', title: 'רשימת קניות חכמה', desc: 'איחוד רכיבים אוטומטי מהתכנון השבועי.' },
  { icon: 'bell', title: 'התראות חכמות', desc: 'תזכורות שמתאימות לשגרה שלך, עם שעות שקטות.' },
];

const COMPARE: [string, string, string][] = [
  ['יומן מזון והזנה ידנית', 'כן', 'כן'], ['חיפוש וגלריית מוצרים', 'כן', 'כן'], ['מחשבון מוצר וארוחה', 'כן', 'כן'], ['סיכום יומי ושבועי', 'כן', 'כן'],
  ['תיעוד אימונים', 'כן', 'כן'], ['תזכורות בסיסיות', 'כן', 'כן'], ['תוכנית תזונה שבועית מותאמת', 'דוגמה', 'כן'], ['תוכניות אימון מתקדמות', 'דוגמה', 'כן'],
  ['מאמן AI וצילום מזון', 'הדגמה', 'כן'], ['המלצות ורשימת קניות חכמה', 'חלקי', 'כן'], ['דוחות מתקדמים', 'דוגמה', 'כן'], ['אתגרים עם חברים', 'אישי בסיסי', 'הרחבה'],
];

/** 51 Premium – plans comparison. Purchase NOT connected (placeholder only, no charge, no entitlement). */
export default function Premium() {
  const [plan, setPlan] = useState<'year' | 'month'>('year');
  const [info, setInfo] = useState<(typeof FEATURES)[number] | null>(null);
  const [soon, setSoon] = useState(false);

  return (
    <HeroScreen back title="Premium" label="שדרג לחוויית אימון ותזונה מלאה" pill="תכונות מתקדמות · ללא הבטחת תוצאות" pillIcon="bolt" progress={0.8} heroHeight={300} tabBar={false}
      above={<View style={{ position: 'absolute', top: -30 }}><Icon name="crown" size={40} color={colors.accentLight} /></View>}>
      {FEATURES.map((f) => (
        <Tap key={f.title} onPress={() => setInfo(f)} label={f.title}>
          <View style={styles.feature}>
            <Icon name={f.icon} size={24} />
            <Text style={[type.bodyMedium, { color: colors.text, flex: 1, fontSize: 16 }]}>{f.title}</Text>
            <Icon name="chevron" size={18} color={colors.text2} />
          </View>
        </Tap>
      ))}

      <Row style={{ marginTop: space.lg }} gap={10}>
        <PlanCard selected={plan === 'year'} onPress={() => setPlan('year')} title="שנתי" price="₪—" sub="מחיר ייקבע בהמשך" badge="מסלול שנתי" />
        <PlanCard selected={plan === 'month'} onPress={() => setPlan('month')} title="חודשי" price="₪—" sub="מחיר ייקבע בהמשך" />
      </Row>
      <T.Caption style={{ textAlign: 'center', marginTop: 8 }}>המחירים בהדמיה (49 ₪ / 299 ₪) טרם אושרו ולכן אינם מוצגים כהצעה.</T.Caption>

      <View style={{ marginTop: space.lg }}>
        <Button title="שדרג עכשיו · בקרוב" icon="crown" onPress={() => { haptic.tap(); setSoon(true); }} />
      </View>

      <Section title="סרטון הדגמה">
        <DemoPlayer height={330} onSkip={() => router.push('/demo')} />
        <Button title="מסך מלא" variant="ghost" icon="play" style={{ marginTop: 8 }} onPress={() => router.push('/demo')} />
      </Section>

      <Section title="בסיס מול Premium">
        <Card>
          <Row style={{ paddingBottom: 8 }}>
            <Text style={[styles.th, { flex: 1.6 }]}>יכולת</Text><Text style={styles.th}>בסיס</Text><Text style={styles.th}>Premium</Text>
          </Row>
          {COMPARE.map(([a, b, c]) => (
            <Row key={a} style={{ paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
              <Text style={[type.label, { color: colors.text, flex: 1.6 }]}>{a}</Text>
              <Text style={[type.label, { color: b === 'כן' ? colors.text : colors.text3, flex: 1, textAlign: 'center' }]}>{b}</Text>
              <Text style={[type.label, { color: colors.accentLight, flex: 1, textAlign: 'center' }]}>{c}</Text>
            </Row>
          ))}
        </Card>
      </Section>
      <ListItem icon="sparkle" title="נסה את מאמן ה-AI (הדגמה)" onPress={() => router.push('/coach')} />
      <ListItem icon="list" title="דוח שבועי – תצוגה מקדימה" onPress={() => router.push('/report')} />
      <T.Caption style={{ textAlign: 'center', marginTop: space.md }}>כל פעולות הבסיס נשארות חינמיות. אפשר לחזור בכל רגע.</T.Caption>

      <Sheet visible={!!info} onClose={() => setInfo(null)} title={info?.title}>
        <T.Body style={{ textAlign: 'center' }}>{info?.desc}</T.Body>
        <Row style={{ justifyContent: 'center', marginTop: space.md }}><Badge text="Premium · בקרוב" /></Row>
      </Sheet>
      <Sheet visible={soon} onClose={() => setSoon(false)} title="Premium בקרוב">
        <T.Body style={{ textAlign: 'center' }}>הרכישה עדיין לא זמינה. לא בוצע חיוב ולא נפתחה הרשאה.</T.Body>
        <T.Muted style={{ textAlign: 'center', marginTop: 6 }}>בינתיים כל כלי הבסיס זמינים לך בחינם.</T.Muted>
        <Button title="הבנתי" style={{ marginTop: space.lg }} onPress={() => setSoon(false)} />
      </Sheet>
    </HeroScreen>
  );
}

function PlanCard({ selected, onPress, title, price, sub, badge }: { selected: boolean; onPress: () => void; title: string; price: string; sub: string; badge?: string }) {
  return (
    <Tap onPress={onPress} label={`מסלול ${title}`} role="radio" style={{ flex: 1 }}>
      <View style={[styles.plan, selected && styles.planOn]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}</View>
          {badge ? <View style={styles.badge}><Text style={{ color: colors.textOnAccent, fontFamily: fonts.semibold, fontSize: 11 }}>{badge}</Text></View> : <View />}
        </Row>
        <Text style={{ color: colors.text, fontFamily: fonts.semibold, fontSize: 30, textAlign: 'center', marginTop: 8 }}>{price}</Text>
        <Text style={[type.bodyMedium, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
        <Text style={[type.caption, { color: colors.text3, textAlign: 'center' }]}>{sub}</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 58, borderRadius: radius.pill, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  plan: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border, minHeight: 150 },
  planOn: { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: 'rgba(232,120,42,0.10)' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  badge: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  th: { ...type.caption, color: colors.text3, flex: 1, textAlign: 'center' },
});
