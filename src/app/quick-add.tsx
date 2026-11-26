import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Panel } from '@/components/Panel';
import { Tap } from '@/components/ui';
import { Icon, IconName } from '@/components/Icon';
import { useApp, tracksCalories } from '@/store/useApp';
import { goBack } from '@/lib/nav';
import { colors, fonts, radius } from '@/theme/tokens';

type Action = { icon: IconName; label: string; href: any; primary?: boolean };

/** Central "+" – quick actions. Most used first, two large primary actions on top. */
export default function QuickAdd() {
  const calories = useApp((s) => tracksCalories(s.profile));
  const go = (href: any) => { goBack(); setTimeout(() => router.push(href), 40); };
  const primary: Action[] = [
    { icon: 'food', label: 'הוסף ארוחה', href: '/add-meal', primary: true },
    ...(calories ? [{ icon: 'flame' as IconName, label: 'הוסף קלוריות', href: '/add-calories', primary: true }] : []),
  ];
  const more: Action[] = [
    { icon: 'barcode', label: 'סרוק ברקוד', href: '/barcode' },
    { icon: 'camera', label: 'צלם ארוחה', href: '/meal-photo' },
    { icon: 'dumbbell', label: 'תכנן אימון', href: '/workout' },
    { icon: 'calendar', label: 'תכנן מסעדה', href: { pathname: '/event', params: { type: 'restaurant' } } },
    { icon: 'alarm', label: 'הוסף תזכורת', href: { pathname: '/alarm', params: { new: '1' } } },
    ...(!calories ? [{ icon: 'edit' as IconName, label: 'הזנה ידנית', href: '/add-calories' }] : []),
  ];
  return (
    <Panel title="פעולות מהירות">
      <View style={styles.primaryRow}>
        {primary.map((a) => (
          <Tap key={a.label} onPress={() => go(a.href)} label={a.label} style={{ flex: 1 }}>
            <View style={styles.primary}>
              <View style={styles.primaryIcon}><Icon name={a.icon} size={28} color={colors.text} /></View>
              <Text style={styles.primaryLabel}>{a.label}</Text>
            </View>
          </Tap>
        ))}
      </View>
      <View style={styles.grid}>
        {more.map((a) => (
          <Tap key={a.label} onPress={() => go(a.href)} label={a.label} style={styles.cellWrap}>
            <View style={styles.cell}>
              <Icon name={a.icon} size={26} />
              <Text style={styles.cellLabel}>{a.label}</Text>
            </View>
          </Tap>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  primaryRow: { flexDirection: 'row', gap: 10 },
  primary: { alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg, backgroundColor: 'rgba(232,120,42,0.18)', borderWidth: 1, borderColor: 'rgba(255,170,110,0.35)' },
  primaryIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emberMid },
  primaryLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 10 },
  cellWrap: { width: '33.333%', padding: 4 },
  cell: { alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 4, minHeight: 92, justifyContent: 'center', borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  cellLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text, textAlign: 'center' },
});
