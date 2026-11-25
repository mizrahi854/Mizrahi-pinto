import React, { useState } from 'react';
import { goBack } from '@/lib/nav';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Logo, useScreenWidth } from '@/components/Brand';
import { Button, IconButton, Row, Sheet, T, Tap, Badge } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { DemoPlayer } from '@/components/DemoPlayer';
import { EXERCISE_ART_ON_DARK } from '@/data/media';
import { colors, fonts, radius, space, type } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

type Feature = { icon: IconName; title: string; desc: string };
const PAGES: Feature[][] = [
  [
    { icon: 'sparkle', title: 'מאמן AI אישי', desc: 'הוספת ארוחה בשפה חופשית, חלופות אימון וסיכומים. כל הצעה דורשת את אישורך לפני שנשמרת.' },
    { icon: 'food', title: 'תפריט תזונה אישי', desc: 'תוכנית ארוחות שבועית לפי העדפות, זמן הכנה ואלרגיות.' },
    { icon: 'dumbbell', title: 'תוכניות אימון מתקדמות', desc: 'תוכניות כמו PPL של 6 ימים, מותאמות לציוד ולזמינות שלך.' },
    { icon: 'camera', title: 'זיהוי ארוחות מתמונה', desc: 'צילום ארוחה והצעת רכיבים וכמויות – תמיד כהערכה שאתה מאשר.' },
    { icon: 'flag', title: 'תכנון שגרה ומעקב יעדים', desc: 'שגרה שבועית חכמה, תזכורות ויעדי התמדה.' },
    { icon: 'chart', title: 'דוחות וסטטיסטיקות מתקדמות', desc: 'ניתוח מגמות רב-שבועי, דוח שבועי מורחב וייצוא.' },
  ],
  [
    { icon: 'cart', title: 'רשימת קניות חכמה', desc: 'איחוד רכיבים אוטומטי מהתכנון השבועי.' },
    { icon: 'bell', title: 'התראות חכמות', desc: 'תזכורות שמתאימות לשגרה שלך, עם שעות שקטות.' },
    { icon: 'trophy', title: 'אתגרים עם חברים', desc: 'אתגרי התמדה משותפים בהזמנה ובהסכמה.' },
  ],
];

const BASIC = ['יומן תזונה בסיסי', 'אימונים בסיסיים', 'סטטיסטיקות כלליות'];
const PREMIUM = ['כל הפיצ׳רים של Basic', 'מאמן AI אישי', 'תוכניות מתקדמות', 'דוחות וניתוח עומק'];
const TABLE: [string, string, string][] = [
  ['יומן מזון והזנה ידנית', '✓', '✓'], ['חיפוש וגלריית מוצרים', '✓', '✓'], ['מחשבון מוצר וארוחה', '✓', '✓'], ['סיכום יומי ושבועי', '✓', '✓'],
  ['תיעוד אימונים', '✓', '✓'], ['תזכורות בסיסיות', '✓', '✓'], ['תוכנית תזונה שבועית מותאמת', 'דוגמה', '✓'], ['תוכניות אימון מתקדמות', 'דוגמה', '✓'],
  ['מאמן AI וצילום מזון', 'הדגמה', '✓'], ['רשימת קניות חכמה', 'חלקי', '✓'], ['דוחות מתקדמים', 'דוגמה', '✓'], ['אתגרים עם חברים', 'אישי', 'הרחבה'],
];

/** 51 Premium – purchase NOT connected (placeholder only: no charge, no entitlement) */
export default function Premium() {
  const insets = useSafeAreaInsets();
  const w = useScreenWidth();
  const reduce = useReducedMotion();
  const [info, setInfo] = useState<Feature | null>(null);
  const [soon, setSoon] = useState(false);
  const [compare, setCompare] = useState(false);

  return (
    <View style={styles.root}>
      <View style={[styles.inner, { width: w }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          {/* hero */}
          <View style={{ paddingTop: insets.top + 10, minHeight: 330 + insets.top }}>
            <LinearGradient colors={['rgba(201,82,10,0.55)', 'rgba(120,40,0,0.18)', 'rgba(8,5,3,0)']} start={{ x: 0.3, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
            <Animated.View entering={reduce ? undefined : FadeIn.duration(700)} style={[styles.art, { top: insets.top + 50 }]} pointerEvents="none">
              <Svg width={260} height={260} style={{ position: 'absolute' }}>
                <Defs>
                  <RadialGradient id="pg" cx="0.5" cy="0.5" r="0.5">
                    <Stop offset="0" stopColor={colors.accent} stopOpacity="0.45" />
                    <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx={130} cy={130} r={130} fill="url(#pg)" />
              </Svg>
              <Image source={EXERCISE_ART_ON_DARK.ohp} style={{ width: 230, height: 230 }} contentFit="contain" accessibilityIgnoresInvertColors />
            </Animated.View>
            <View style={styles.topRow}>
              <Logo />
              <IconButton icon="close" label="סגירה" onPress={() => goBack()} size={44} />
            </View>
            <Animated.View entering={reduce ? undefined : FadeInDown.delay(120).duration(500)} style={styles.heroText}>
              <Icon name="crown" size={42} color={colors.accent} />
              <Text style={styles.kicker}>MIZRAHI PINTO</Text>
              <Text style={styles.title}>Premium</Text>
              <Text style={styles.sub}>הגרסה המלאה לשגרה,{'\n'}למעקב ולהתקדמות רצינית.</Text>
            </Animated.View>
          </View>

          <View style={{ paddingHorizontal: space.md }}>
            {/* features grid */}
            <View style={styles.grid}>
              {PAGES.flat().map((f) => (
                <Tap key={f.title} onPress={() => setInfo(f)} label={f.title} style={styles.cellWrap}>
                  <View style={styles.cell}>
                    <Icon name={f.icon} size={30} color={colors.accent} />
                    <Text style={styles.cellText} numberOfLines={2}>{f.title}</Text>
                  </View>
                </Tap>
              ))}
            </View>

            {/* CTA */}
            <Tap onPress={() => { haptic.tap(); setSoon(true); }} label="שדרג ל-Premium (בקרוב)" style={{ marginTop: space.xl }}>
              <View style={styles.cta}>
                <LinearGradient colors={[colors.accentLight, colors.accent, colors.emberMid]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                <Icon name="chevron" size={22} color="#fff" strokeWidth={2.2} />
                <Text style={styles.ctaText}>שדרג ל-Premium</Text>
                <Icon name="crown" size={24} color="#fff" />
              </View>
            </Tap>
            <Text style={styles.soonNote}>בקרוב · כרגע ללא רכישה וללא חיוב</Text>

            <Tap onPress={() => setCompare(!compare)} label="השוואת תוכניות" style={{ marginTop: space.lg, alignSelf: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.compareLabel}>השווה תוכניות</Text>
                <View style={{ transform: [{ rotate: compare ? '90deg' : '-90deg' }] }}><Icon name="chevron" size={18} color={colors.text2} /></View>
              </View>
            </Tap>

            <Row gap={10} style={{ marginTop: space.md, alignItems: 'stretch' }}>
              <View style={[styles.plan, styles.planOn]}>
                <Row gap={8}><Icon name="crown" size={22} /><Text style={styles.planTitle}>Premium</Text></Row>
                {PREMIUM.map((x) => <Row key={x} gap={8} style={styles.planRow}><Icon name="check" size={16} /><Text style={styles.planItem}>{x}</Text></Row>)}
              </View>
              <View style={styles.plan}>
                <Text style={styles.planTitle}>Basic</Text>
                {BASIC.map((x) => <Row key={x} gap={8} style={styles.planRow}><Icon name="check" size={16} /><Text style={styles.planItem}>{x}</Text></Row>)}
                <Badge text="חינם" tone="muted" />
              </View>
            </Row>

            {compare && (
              <Animated.View entering={reduce ? undefined : FadeIn} style={styles.table}>
                <Row style={{ paddingBottom: 8 }}>
                  <Text style={[styles.th, { flex: 1.7 }]}>יכולת</Text><Text style={styles.th}>Basic</Text><Text style={styles.th}>Premium</Text>
                </Row>
                {TABLE.map(([a, b, c]) => (
                  <Row key={a} style={styles.tr}>
                    <Text style={[type.label, { color: colors.text, flex: 1.7 }]}>{a}</Text>
                    <Text style={[type.label, { color: b === '✓' ? colors.text : colors.text3, flex: 1, textAlign: 'center' }]}>{b}</Text>
                    <Text style={[type.label, { color: colors.accentLight, flex: 1, textAlign: 'center' }]}>{c}</Text>
                  </Row>
                ))}
              </Animated.View>
            )}

            <Text style={[styles.compareLabel, { marginTop: space.xl, marginBottom: 10 }]}>סרטון הדגמה</Text>
            <DemoPlayer height={300} onSkip={() => router.push('/demo')} />
            <T.Caption style={{ textAlign: 'center', marginTop: space.md }}>כל כלי הבסיס נשארים חינמיים. אין הבטחה לתוצאות.</T.Caption>
          </View>
        </ScrollView>

        <Sheet visible={!!info} onClose={() => setInfo(null)} title={info?.title}>
          <T.Body style={{ textAlign: 'center' }}>{info?.desc}</T.Body>
          <Row style={{ justifyContent: 'center', marginTop: space.md }}><Badge text="Premium · בקרוב" /></Row>
        </Sheet>
        <Sheet visible={soon} onClose={() => setSoon(false)} title="Premium בקרוב">
          <T.Body style={{ textAlign: 'center' }}>הרכישה עדיין לא זמינה. לא בוצע חיוב ולא נפתחה הרשאה.</T.Body>
          <T.Muted style={{ textAlign: 'center', marginTop: 6 }}>בינתיים כל כלי הבסיס זמינים לך בחינם.</T.Muted>
          <Button title="הבנתי" style={{ marginTop: space.lg }} onPress={() => setSoon(false)} />
        </Sheet>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  inner: { flex: 1, backgroundColor: '#080503', overflow: 'hidden' },
  topRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  art: { position: 'absolute', left: -20, alignItems: 'center', justifyContent: 'center' },
  heroText: { marginTop: 34, paddingHorizontal: space.lg, alignItems: 'flex-start', gap: 4 },
  kicker: { fontFamily: fonts.medium, fontSize: 15, letterSpacing: 2, color: colors.text, marginTop: 8 },
  title: { fontFamily: fonts.bold, fontSize: 52, lineHeight: 58, color: colors.text, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.text2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cellWrap: { width: '33.333%', padding: 5 },
  cell: { height: 112, borderRadius: radius.md, backgroundColor: 'rgba(26,18,14,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 6 },
  cellText: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 18, color: colors.text, textAlign: 'center' },
  cta: { height: 62, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,200,150,0.5)' },
  ctaText: { fontFamily: fonts.bold, fontSize: 20, color: '#fff' },
  soonNote: { ...type.caption, color: colors.text3, textAlign: 'center', marginTop: 8 },
  compareLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text2, textAlign: 'center' },
  plan: { flex: 1, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(26,18,14,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 6 },
  planOn: { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: 'rgba(40,20,8,0.95)' },
  planTitle: { fontFamily: fonts.bold, fontSize: 21, color: colors.text, marginBottom: 6 },
  planRow: { alignItems: 'flex-start' },
  planItem: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.text, flex: 1 },
  table: { marginTop: space.md, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(26,18,14,0.95)', borderWidth: 1, borderColor: colors.border },
  th: { ...type.caption, color: colors.text3, flex: 1, textAlign: 'center' },
  tr: { paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
