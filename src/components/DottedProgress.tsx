import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar } from './ui';
import { colors } from '@/theme/tokens';

/** Slider-like progress with dotted remainder (approved home reference). */
export function DottedProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 22, justifyContent: 'center' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
        <View style={{ flex: Math.max(v, 0.001) }}><ProgressBar value={1} height={5} /></View>
        <View style={styles.knob} />
        <View style={{ flex: Math.max(1 - v, 0.001), flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          {Array.from({ length: Math.max(0, Math.round((1 - v) * 18)) }).map((_, i) => <View key={i} style={styles.dot} />)}
        </View>
        <View style={styles.endRing} />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accentLight, borderWidth: 3, borderColor: '#FFD9B8', marginHorizontal: -4, zIndex: 2 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  endRing: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' },
});
