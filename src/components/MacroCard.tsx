import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tap, Ring, ProgressBar } from './ui';
import { Icon, IconName } from './Icon';
import { colors, fonts, radius, type } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

/** Bento tile: icon, title, value / target, optional ring, chevron (PRD 2.4). */
export function BentoTile({
  icon, title, value, target, unit, progress, onPress, ring = true, wide, partial, children, accessibilityHint, trailing,
}: { trailing?: React.ReactNode; icon: IconName; title: string; value: string; target?: string; unit?: string; progress?: number; onPress?: () => void; ring?: boolean; wide?: boolean; partial?: boolean; children?: React.ReactNode; accessibilityHint?: string }) {
  return (
    <Tap onPress={onPress} label={`${title}: ${value}${target ? ` מתוך ${target}` : ''} ${unit ?? ''}`} hint={accessibilityHint} style={wide ? { width: '100%' } : { flex: 1 }}>
      <View style={[styles.tile, wide && { minHeight: 86 }]}>
        <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']} style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]} pointerEvents="none" />
        <View style={{ flex: 1, gap: 4 }}>
          <Icon name={icon} size={24} />
          <Text style={styles.title}>{title}</Text>
          <NumRow value={value} target={target} unit={unit} />
          {partial ? <Text style={styles.partial}>חלק מהערכים חסרים</Text> : null}
          {wide && progress != null ? <ProgressBar value={progress} style={{ marginTop: 6 }} /> : null}
          {children}
        </View>
        {trailing ?? (!wide && ring && progress != null ? <Ring value={progress} size={50} stroke={4} /> : <Icon name="chevron" size={18} color={colors.text2} />)}
      </View>
    </Tap>
  );
}

/** Numeric line rendered physically left→right ("880 / 2,300 ג׳") regardless of RTL. */
export function NumRow({ value, target, unit, size = 21, small, color }: { value: string; target?: string; unit?: string; size?: number; small?: number; color?: string }) {
  return (
    <View style={styles.numRow}>
      <Text style={[styles.value, { fontSize: size, flexShrink: 0 }, color ? { color } : null]}>{value}</Text>
      {target ? <Text style={[styles.target, small ? { fontSize: small } : null]}>{`/ ${target}`}</Text> : null}
      {unit ? <Text style={[styles.target, small ? { fontSize: small } : null]}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  numRow: { flexDirection: 'row-reverse', justifyContent: 'flex-end', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 4 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 112, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(35,36,39,0.78)', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  title: { ...type.label, color: colors.text2, marginTop: 4 },
  value: { fontFamily: fonts.semibold, fontSize: 21, color: colors.text, fontVariant: ['tabular-nums'] },
  target: { fontFamily: fonts.regular, fontSize: 13, color: colors.text2 },
  partial: { ...type.caption, color: colors.text3 },
});
