import React, { ReactNode, useEffect, useState } from 'react';
import { goBack } from '@/lib/nav';
import {
  View, Text, Pressable, StyleSheet, ScrollView, TextInput, TextInputProps, ViewStyle, StyleProp, Modal, ActivityIndicator, Platform, PanResponder, KeyboardAvoidingView,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, FadeOut, SlideInDown, SlideOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, type, fonts, touch } from '@/theme/tokens';
import { Icon, IconName } from './Icon';
import { haptic } from '@/lib/haptics';
import { MAX_W } from './Brand';

/* ---------- Pressable with spring feedback ---------- */
export function Tap({
  children, onPress, style, disabled, label, hint, role = 'button', haptics = true,
}: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; label?: string; hint?: string; role?: 'button' | 'link' | 'tab' | 'checkbox' | 'radio'; haptics?: boolean }) {
  const s = useSharedValue(1);
  const reduce = useReducedMotion();
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        if (haptics) haptic.tap();
        onPress?.();
      }}
      onPressIn={() => { if (!reduce) s.set(withSpring(0.97, { damping: 18, stiffness: 320 })); }}
      onPressOut={() => { s.set(withSpring(1, { damping: 14, stiffness: 260 })); }}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={style}
    >
      <Animated.View style={[a, { flexGrow: 1 }, disabled && onPress && { opacity: 0.45 }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ---------- Glass card ---------- */
export function Card({ children, style, onPress, label, highlight }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string; highlight?: boolean }) {
  const inner = (
    <View style={[styles.card, highlight && styles.cardHighlight, style]}>
      <LinearGradient
        colors={highlight ? ['rgba(232,120,42,0.22)', 'rgba(232,120,42,0.04)'] : ['rgba(255,255,255,0.055)', 'rgba(255,255,255,0.0)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
  if (!onPress) return inner;
  return <Tap onPress={onPress} label={label}>{inner}</Tap>;
}

/* ---------- Text ---------- */
export const T = {
  Hero: (p: { children: ReactNode; style?: any }) => <Text style={[type.hero, { color: colors.text }, p.style]}>{p.children}</Text>,
  Title: (p: { children: ReactNode; style?: any }) => <Text accessibilityRole="header" style={[type.title, { color: colors.text }, p.style]}>{p.children}</Text>,
  H: (p: { children: ReactNode; style?: any }) => <Text accessibilityRole="header" style={[type.heading, { color: colors.text }, p.style]}>{p.children}</Text>,
  Body: (p: { children: ReactNode; style?: any; numberOfLines?: number }) => <Text numberOfLines={p.numberOfLines} style={[type.body, { color: colors.text }, p.style]}>{p.children}</Text>,
  Muted: (p: { children: ReactNode; style?: any; numberOfLines?: number }) => <Text numberOfLines={p.numberOfLines} style={[type.label, { color: colors.text2 }, p.style]}>{p.children}</Text>,
  Caption: (p: { children: ReactNode; style?: any }) => <Text style={[type.caption, { color: colors.text3 }, p.style]}>{p.children}</Text>,
  Value: (p: { children: ReactNode; style?: any }) => <Text style={[type.value, { color: colors.text, fontVariant: ['tabular-nums'] }, p.style]}>{p.children}</Text>,
};

/* ---------- Buttons ---------- */
export function Button({ title, onPress, icon, variant = 'primary', disabled, loading, style, label }: { title: string; onPress?: () => void; icon?: IconName; variant?: 'primary' | 'ghost' | 'danger' | 'soft'; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; label?: string }) {
  const primary = variant === 'primary';
  return (
    <Tap onPress={onPress} disabled={disabled || loading} label={label ?? title} style={style}>
      <View style={[styles.btn, variant === 'ghost' && styles.btnGhost, variant === 'soft' && styles.btnSoft, variant === 'danger' && styles.btnDanger]}>
        {primary && (
          <LinearGradient colors={[colors.accentLight, colors.accent, colors.emberMid]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />
        )}
        {loading ? <ActivityIndicator color={primary ? colors.textOnAccent : colors.text} /> : (
          <>
            {icon && <Icon name={icon} size={20} color={primary ? colors.textOnAccent : variant === 'danger' ? colors.danger : colors.accent} />}
            <Text style={[styles.btnText, { color: primary ? colors.textOnAccent : variant === 'danger' ? colors.danger : colors.text }]}>{title}</Text>
          </>
        )}
      </View>
    </Tap>
  );
}

export function IconButton({ icon, onPress, label, size = 44, active, color }: { icon: IconName; onPress?: () => void; label: string; size?: number; active?: boolean; color?: string }) {
  return (
    <Tap onPress={onPress} label={label}>
      <View style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2.8 }, active && { backgroundColor: colors.accentSoft, borderColor: colors.borderStrong }]}>
        <Icon name={icon} size={size * 0.48} color={color ?? (active ? colors.accent : colors.text)} />
      </View>
    </Tap>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Tap onPress={onPress} label={label} role="tab">
      <View style={[styles.chip, active && styles.chipActive]}>
        {icon && <Icon name={icon} size={16} color={active ? colors.textOnAccent : colors.accent} />}
        <Text style={[styles.chipText, active && { color: colors.textOnAccent, fontFamily: fonts.semibold }]}>{label}</Text>
      </View>
    </Tap>
  );
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, height = 6, style }: { value: number; height?: number; style?: StyleProp<ViewStyle> }) {
  const v = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  const w = useSharedValue(0);
  useEffect(() => { w.value = withTiming(v, { duration: 650 }); }, [v, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: colors.track, overflow: 'hidden' }, style]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <Animated.View style={[{ height, borderRadius: height, overflow: 'hidden' }, a]}>
        <LinearGradient colors={[colors.emberMid, colors.accentLight]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

export function Ring({ value, size = 54, stroke = 4, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const v = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.accent} strokeWidth={stroke} fill="none" strokeDasharray={`${c * v} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {children}
    </View>
  );
}

/* ---------- Layout ---------- */
export function Screen({
  title, subtitle, children, back = true, right, scroll = true, padded = true, footer,
}: { title?: string; subtitle?: string; children: ReactNode; back?: boolean; right?: ReactNode; scroll?: boolean; padded?: boolean; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const header = (title || back || right) && (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerSide}>{back && <IconButton icon="chevronBack" label="חזרה" onPress={() => goBack()} size={40} />}</View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {title && <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>{title}</Text>}
        {subtitle && <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
  const body = scroll ? (
    <ScrollView contentContainerStyle={[padded && { paddingHorizontal: space.md }, { paddingBottom: insets.bottom + (footer ? 110 : 40), paddingTop: 8 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && { paddingHorizontal: space.md }]}>{children}</View>
  );
  return (
    <View style={styles.screen}>
      <View style={styles.screenInner}>
        <LinearGradient colors={['rgba(168,60,0,0.32)', 'rgba(120,40,0,0.10)', 'rgba(11,7,5,0)']} style={styles.topGlow} pointerEvents="none" start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        {header}
        {body}
        {footer && <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>}
      </View>
    </View>
  );
}

export function Section({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: space.xl }, style]}>
      <View style={styles.sectionHead}>
        <T.H>{title}</T.H>
        {action && (
          <Tap onPress={onAction} label={action} role="link">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 }}>
              <T.Muted style={{ color: colors.accent }}>{action}</T.Muted>
              <Icon name="chevron" size={16} />
            </View>
          </Tap>
        )}
      </View>
      {children}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function ListItem({ icon, title, subtitle, right, onPress, label, danger }: { icon?: IconName; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void; label?: string; danger?: boolean }) {
  const content = (
    <View style={styles.listItem}>
      {icon && <View style={styles.listIcon}><Icon name={icon} size={20} color={danger ? colors.danger : colors.accent} /></View>}
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyMedium, { color: danger ? colors.danger : colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[type.label, { color: colors.text2 }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} color={colors.text2} /> : null)}
    </View>
  );
  return onPress ? <Tap onPress={onPress} label={label ?? title}>{content}</Tap> : content;
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ marginBottom: space.md }, style as any]}>
      <Text style={[type.label, { color: colors.text2, marginBottom: 6 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.text3}
        accessibilityLabel={label}
        {...props}
        onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
        style={[styles.input, focus && { borderColor: colors.accent }, error ? { borderColor: colors.danger } : null]}
      />
      {error ? <Text style={[type.caption, { color: colors.danger, marginTop: 4 }]}>{error}</Text> : null}
    </View>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 99999, unit, label }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; unit?: string; label: string }) {
  return (
    <View style={styles.stepper} accessibilityLabel={label} accessibilityValue={{ text: `${value} ${unit ?? ''}` }}>
      <IconButton icon="minus" label={`הפחת ${label}`} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))} size={40} />
      <TextInput
        value={String(value)}
        onChangeText={(t) => { const n = Number(t.replace(/[^\d.]/g, '')); if (isFinite(n)) onChange(Math.min(max, n)); }}
        keyboardType="decimal-pad"
        style={styles.stepperInput}
        accessibilityLabel={label}
      />
      {unit ? <Text style={[type.label, { color: colors.text2 }]}>{unit}</Text> : null}
      <IconButton icon="plus" label={`הוסף ${label}`} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))} size={40} />
    </View>
  );
}

export function Empty({ icon = 'sparkle', title, text, action, onAction }: { icon?: IconName; title: string; text?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: 8 }}>
      <View style={[styles.listIcon, { width: 56, height: 56, borderRadius: 20 }]}><Icon name={icon} size={26} /></View>
      <T.H style={{ textAlign: 'center' }}>{title}</T.H>
      {text ? <T.Muted style={{ textAlign: 'center', maxWidth: 280 }}>{text}</T.Muted> : null}
      {action ? <Button title={action} onPress={onAction} variant="soft" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export function Badge({ text, tone = 'accent' }: { text: string; tone?: 'accent' | 'muted' | 'warn' }) {
  return (
    <View style={[styles.badge, tone === 'muted' && { backgroundColor: colors.hairline, borderColor: colors.border }, tone === 'warn' && { backgroundColor: 'rgba(229,72,77,0.12)', borderColor: 'rgba(229,72,77,0.4)' }]}>
      <Text style={[type.caption, { color: tone === 'accent' ? colors.accentLight : tone === 'warn' ? '#FF8A8D' : colors.text2, fontFamily: fonts.medium }]}>{text}</Text>
    </View>
  );
}

/* ---------- Bottom sheet ---------- */
/** Drag-down-to-dismiss behaviour shared by all bottom sheets. */
export function useDragToClose(onClose: () => void) {
  const y = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => { y.set(Math.max(0, g.dy)); },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 110 || g.vy > 0.9) { haptic.tap(); onClose(); setTimeout(() => { y.set(0); }, 260); }
          else y.set(withSpring(0, { damping: 18 }));
        },
        onPanResponderTerminate: () => { y.set(withSpring(0)); },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose],
  );
  return { style, handlers: responder.panHandlers };
}

export function Sheet({ visible, onClose, title, children, scroll }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const drag = useDragToClose(onClose);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="סגירה" accessibilityRole="button" />
          </Animated.View>
          <Animated.View entering={SlideInDown.springify().damping(22)} exiting={SlideOutDown.duration(180)} style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: '88%' }, drag.style]} accessibilityViewIsModal>
            <View {...drag.handlers} style={{ paddingBottom: 4 }}>
              <View style={styles.grabber} accessibilityLabel="גרירה למטה לסגירה" />
              {title && <T.Title style={{ textAlign: 'center', marginBottom: space.md }}>{title}</T.Title>}
            </View>
            {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView> : children}
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

/* ---------- Toast with optional undo ---------- */
type ToastMsg = { id: number; text: string; action?: { label: string; onPress: () => void } };
let pushToast: (m: Omit<ToastMsg, 'id'>) => void = () => {};
export const toast = (text: string, action?: ToastMsg['action']) => pushToast({ text, action });
export function ToastHost() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    pushToast = (m) => setMsg({ ...m, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), msg.action ? 5000 : 2400);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <Animated.View key={msg.id} entering={FadeIn} exiting={FadeOut} pointerEvents="box-none" style={[styles.toastWrap, { top: insets.top + 8 }]} accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <Text style={[type.bodyMedium, { color: colors.text, flex: 1 }]}>{msg.text}</Text>
        {msg.action && (
          <Pressable onPress={() => { msg.action!.onPress(); setMsg(null); }} accessibilityRole="button" style={{ minHeight: touch.min, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={[type.bodyMedium, { color: colors.accent }]}>{msg.action.label}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: space.sm }} />;
}

export function Stat({ value, label, icon }: { value: string; label: string; icon?: IconName }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 2 }} accessible accessibilityLabel={`${label}: ${value}`}>
      {icon && <Icon name={icon} size={18} />}
      <T.Value>{value}</T.Value>
      <T.Caption style={{ color: colors.text2 }}>{label}</T.Caption>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center' },
  screenInner: { flex: 1, width: '100%', maxWidth: MAX_W, backgroundColor: colors.bg, overflow: 'hidden' },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: 6 },
  headerSide: { width: 52 },
  headerTitle: { ...type.heading, color: colors.text },
  headerSub: { ...type.caption, color: colors.text2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: 12, backgroundColor: 'rgba(11,7,5,0.92)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  card: { backgroundColor: colors.glass, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.md, overflow: 'hidden' },
  cardHighlight: { borderColor: colors.borderStrong },
  btn: { minHeight: 52, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: space.xl, overflow: 'hidden' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  btnSoft: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border },
  btnDanger: { backgroundColor: 'rgba(229,72,77,0.1)', borderWidth: 1, borderColor: 'rgba(229,72,77,0.35)' },
  btnText: { fontFamily: fonts.semibold, fontSize: 16 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accentLight },
  chipText: { ...type.label, color: colors.text, fontFamily: fonts.medium },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 60, paddingVertical: 10, paddingHorizontal: space.md, backgroundColor: colors.glass, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: space.xs },
  listIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.04)', color: colors.text, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  stepperInput: { minWidth: 84, textAlign: 'center', color: colors.text, fontFamily: fonts.semibold, fontSize: 24, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.borderStrong },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.borderStrong, alignSelf: 'flex-start' },
  sheet: { width: '100%', maxWidth: MAX_W, backgroundColor: '#140C08', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingTop: 10 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 14 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: MAX_W - 32, width: '92%', paddingStart: 16, paddingEnd: 8, minHeight: 52, borderRadius: 18, backgroundColor: 'rgba(30,19,12,0.97)', borderWidth: 1, borderColor: colors.borderStrong, ...(Platform.OS === 'web' ? { boxShadow: '0 10px 30px rgba(0,0,0,0.5)' } as any : {}) },
});
