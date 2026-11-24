import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { pad } from '@/lib/dates';

const ITEM = 48;

/** iOS-style snapping wheel (vertical → unaffected by RTL). */
export function Wheel({ values, value, onChange, label }: { values: number[]; value: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<any>(null);
  const last = useRef(values.indexOf(value));
  useEffect(() => {
    const i = values.indexOf(value);
    if (i >= 0) setTimeout(() => ref.current?.scrollTo({ y: i * ITEM, animated: false }), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(values.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
    if (i !== last.current) {
      last.current = i;
      haptic.select();
      onChange(values[i]!);
    }
  };
  return (
    <View style={styles.wheel} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: pad(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const i = Math.max(0, Math.min(values.length - 1, values.indexOf(value) + (e.nativeEvent.actionName === 'increment' ? 1 : -1)));
        onChange(values[i]!); ref.current?.scrollTo({ y: i * ITEM, animated: true });
      }}>
      <View pointerEvents="none" style={styles.highlight} />
      <ScrollView ref={ref} showsVerticalScrollIndicator={false} snapToInterval={ITEM} decelerationRate="fast" onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingVertical: ITEM * 2 }}>
        {values.map((v) => (
          <View key={v} style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.txt, v === value && styles.txtOn]}>{pad(v)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TimeWheel({ time, onChange }: { time: string; onChange: (t: string) => void }) {
  const [h, m] = time.split(':').map(Number);
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
      <Wheel label="שעה" values={Array.from({ length: 24 }, (_, i) => i)} value={h ?? 7} onChange={(v) => onChange(`${pad(v)}:${pad(m ?? 0)}`)} />
      <Text style={[styles.txt, styles.txtOn]}>:</Text>
      <Wheel label="דקות" values={Array.from({ length: 12 }, (_, i) => i * 5)} value={Math.round((m ?? 0) / 5) * 5 % 60} onChange={(v) => onChange(`${pad(h ?? 7)}:${pad(v)}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { width: 90, height: ITEM * 5, overflow: 'hidden' },
  highlight: { position: 'absolute', top: ITEM * 2, left: 0, right: 0, height: ITEM, borderRadius: 14, backgroundColor: 'rgba(232,120,42,0.14)', borderWidth: 1, borderColor: colors.borderStrong },
  txt: { fontFamily: fonts.medium, fontSize: 24, color: colors.text3, fontVariant: ['tabular-nums'] },
  txtOn: { color: colors.text, fontFamily: fonts.semibold, fontSize: 30 },
});
