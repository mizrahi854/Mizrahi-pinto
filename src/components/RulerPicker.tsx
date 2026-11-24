import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Text, TextInput, AccessibilityActionEvent } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { DotMatrix } from './DotMatrix';
import { useScreenWidth } from './Brand';

/**
 * Drag-to-scroll measurement ruler with snapping ticks + haptics (PRD 3.7).
 * Built on PanResponder + physical transforms so it behaves identically in RTL on iOS, Android and web.
 * Dragging left increases the value (like a tape). Fully usable via VoiceOver (adjustable) and manual input.
 */
export function RulerPicker({ min, max, step = 1, value, onChange, unit, label, decimals = 0 }: { min: number; max: number; step?: number; value: number; onChange: (v: number) => void; unit: string; label: string; decimals?: number }) {
  const w = useScreenWidth() - 32;
  const TICK = 12;
  const count = Math.round((max - min) / step);
  const idxOf = (v: number) => Math.max(0, Math.min(count, Math.round((v - min) / step)));
  const [offset, setOffset] = useState(idxOf(value) * TICK); // px scrolled
  const startOffset = useRef(0);
  const lastIdx = useRef(idxOf(value));
  const dragging = useRef(false);
  const [text, setText] = useState(value.toFixed(decimals));
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => setText(value.toFixed(decimals)), [value, decimals]);
  useEffect(() => {
    if (!dragging.current) {
      lastIdx.current = idxOf(value);
      setOffset(lastIdx.current * TICK);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (idx: number) => {
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      haptic.select();
      cb.current(+(min + idx * step).toFixed(decimals));
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragging.current = true;
          startOffset.current = lastIdx.current * TICK;
        },
        onPanResponderMove: (_, g) => {
          const o = Math.max(0, Math.min(count * TICK, startOffset.current - g.dx));
          setOffset(o);
          emit(Math.round(o / TICK));
        },
        onPanResponderRelease: (_, g) => {
          dragging.current = false;
          // small fling continuation
          const o = Math.max(0, Math.min(count * TICK, startOffset.current - g.dx - g.vx * 80));
          const idx = Math.round(o / TICK);
          emit(idx);
          setOffset(idx * TICK);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, min, step, decimals],
  );

  // Render only visible ticks
  const first = Math.max(0, Math.floor((offset - w / 2) / TICK) - 2);
  const last = Math.min(count, Math.ceil((offset + w / 2) / TICK) + 2);
  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(i);

  const onA11y = (e: AccessibilityActionEvent) => {
    const idx = lastIdx.current + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
    const c = Math.max(0, Math.min(count, idx));
    emit(c);
    setOffset(c * TICK);
  };

  return (
    <View>
      <View style={styles.readout}>
        <Text style={styles.unit}>{unit}</Text>
        <DotMatrix text={value.toFixed(decimals)} dot={7} gap={2.6} accessibilityLabel={`${value} ${unit}`} />
      </View>
      <View
        style={[styles.wrap, { width: w }]}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} ${unit}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onA11y}
      >
        <Svg width={w} height={64} pointerEvents="none">
          {ticks.map((i) => {
            const x = w / 2 + i * TICK - offset;
            const major = i % 10 === 0;
            const mid = i % 5 === 0;
            const dist = Math.abs(x - w / 2) / (w / 2);
            return <Line key={i} x1={x} x2={x} y1={major ? 8 : mid ? 18 : 26} y2={56} stroke="#fff" strokeOpacity={(major ? 0.85 : mid ? 0.5 : 0.25) * (1 - dist * 0.7)} strokeWidth={major ? 1.6 : 1} />;
          })}
        </Svg>
        <LinearGradient colors={['rgba(232,120,42,0)', 'rgba(232,120,42,0.18)', 'rgba(232,120,42,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { left: w / 2 - 40, width: 80 }]} pointerEvents="none" />
        <View pointerEvents="none" style={[styles.indicator, { left: w / 2 - 1.5 }]} />
      </View>
      <View style={styles.manual}>
        <Text style={styles.manualLabel}>הזנה ידנית</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const n = Number(text.replace(',', '.'));
            if (isFinite(n) && text.trim() !== '') cb.current(Math.max(min, Math.min(max, +n.toFixed(decimals))));
            else setText(value.toFixed(decimals));
          }}
          onSubmitEditing={() => {
            const n = Number(text.replace(',', '.'));
            if (isFinite(n)) cb.current(Math.max(min, Math.min(max, +n.toFixed(decimals))));
          }}
          keyboardType="decimal-pad"
          returnKeyType="done"
          accessibilityLabel={`${label} בהזנה ידנית`}
          style={styles.manualInput}
        />
        <Text style={styles.manualLabel}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { alignItems: 'center', marginBottom: 14, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  unit: { color: colors.text2, fontFamily: fonts.medium, fontSize: 16 },
  wrap: { height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', alignSelf: 'center', cursor: 'grab' } as any,
  indicator: { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: colors.accent },
  manual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  manualLabel: { color: colors.text2, fontFamily: fonts.regular, fontSize: 13 },
  manualInput: { minWidth: 70, textAlign: 'center', color: colors.text, fontFamily: fonts.semibold, fontSize: 16, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, paddingVertical: 4 },
});
