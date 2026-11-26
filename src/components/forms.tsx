import React, { ReactNode } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, TextInputProps, ScrollView } from 'react-native';
import { Icon, IconName } from './Icon';
import { light, fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';
import { DAY_SHORT, DAY_LONG, weekOf, addDays, dateKey, parseKey } from '@/lib/dates';

/** Light-surface form kit shared by the planning screens. Every control ≥ 44 pt, labelled for VoiceOver. */
export function Label({ text, hint }: { text: string; hint?: string }) {
  return <Text style={f.label}>{text}{hint ? <Text style={f.hint}> {hint}</Text> : null}</Text>;
}

export function LInput({ label, hint, style, ...props }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label text={label} hint={hint} /> : null}
      <TextInput placeholderTextColor={light.text3} accessibilityLabel={label} {...props} style={[f.input, props.multiline && { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' }, style]} />
    </View>
  );
}

export function Chips<T extends string | number>({ options, value, onChange, multi, label }: { options: { key: T; label: string; icon?: IconName }[]; value: T | T[]; onChange: (v: any) => void; multi?: boolean; label?: string }) {
  const sel = (k: T) => (Array.isArray(value) ? value.includes(k) : value === k);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label text={label} /> : null}
      <View style={f.chips} accessibilityRole={multi ? undefined : 'radiogroup'}>
        {options.map((o) => {
          const on = sel(o.key);
          return (
            <Pressable
              key={String(o.key)}
              onPress={() => {
                haptic.select();
                if (multi && Array.isArray(value)) onChange(on ? value.filter((x) => x !== o.key) : [...value, o.key]);
                else onChange(o.key);
              }}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={multi ? { checked: on } : { selected: on }}
              accessibilityLabel={o.label}
              style={[f.chip, on && f.chipOn]}
            >
              {o.icon ? <Icon name={o.icon} size={16} color={on ? '#fff' : light.text2} /> : null}
              <Text style={[f.chipText, on && { color: '#fff' }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DayChips({ value, onChange, multi, label }: { value: number | number[]; onChange: (v: any) => void; multi?: boolean; label?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label text={label} /> : null}
      <View style={[f.chips, { flexWrap: 'nowrap', justifyContent: 'space-between' }]}>
        {DAY_SHORT.map((d, i) => {
          const on = Array.isArray(value) ? value.includes(i) : value === i;
          return (
            <Pressable key={d} onPress={() => { haptic.select(); onChange(multi && Array.isArray(value) ? (on ? value.filter((x) => x !== i) : [...value, i].sort()) : i); }}
              accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={multi ? { checked: on } : { selected: on }} accessibilityLabel={`יום ${DAY_LONG[i]}`}
              style={[f.day, on && f.chipOn]}>
              <Text style={[f.chipText, on && { color: '#fff' }]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TIMES = ['05:00', '06:00', '07:00', '08:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
/** Time entry: quick chips + free HH:MM field (validated). */
export function TimeField({ value, onChange, label = 'שעה', optional, quick = TIMES }: { value: string | null; onChange: (v: string | null) => void; label?: string; optional?: boolean; quick?: string[] }) {
  const [text, setText] = React.useState(value ?? '');
  React.useEffect(() => setText(value ?? ''), [value]);
  const valid = (t: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);
  return (
    <View style={{ gap: 6 }}>
      <Label text={label} hint={optional ? '(לא חובה)' : undefined} />
      <View style={[f.chips, { alignItems: 'center' }]}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            const c = t.replace(/[^\d:]/g, '').slice(0, 5);
            setText(c);
            if (valid(c)) onChange(c.length === 4 ? `0${c}` : c);
            else if (!c && optional) onChange(null);
          }}
          placeholder="—:—"
          placeholderTextColor={light.text3}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel={label}
          style={[f.input, f.time, text && !valid(text) && { borderColor: '#C2361B', borderWidth: 1.5 }]}
          maxLength={5}
        />
        {quick.map((t) => (
          <Pressable key={t} onPress={() => { haptic.select(); onChange(t); }} accessibilityRole="radio" accessibilityState={{ selected: value === t }} accessibilityLabel={`שעה ${t}`} style={[f.chip, value === t && f.chipOn]}>
            <Text style={[f.chipText, value === t && { color: '#fff' }]}>{t}</Text>
          </Pressable>
        ))}
        {optional && value ? (
          <Pressable onPress={() => onChange(null)} accessibilityRole="button" accessibilityLabel="ללא שעה" style={f.chip}><Text style={f.chipText}>ללא שעה</Text></Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ToggleRow({ title, subtitle, value, onChange, icon }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; icon?: IconName }) {
  return (
    <Pressable onPress={() => { haptic.select(); onChange(!value); }} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={title} accessibilityHint={subtitle} style={f.toggleRow}>
      {icon ? <Icon name={icon} size={22} color={light.accent} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={f.toggleTitle}>{title}</Text>
        {subtitle ? <Text style={f.hint}>{subtitle}</Text> : null}
      </View>
      <View style={[f.switch, value && f.switchOn]}><View style={[f.knob, value && f.knobOn]} /></View>
    </Pressable>
  );
}

export function Group({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <View style={{ marginTop: space.lg, gap: 10 }}>
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={f.groupTitle} accessibilityRole="header">{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Note({ text, tone = 'info' }: { text: string; tone?: 'info' | 'warn' }) {
  return (
    <View style={[f.note, tone === 'warn' && { backgroundColor: '#FDF1E7' }]} accessible accessibilityLabel={text}>
      <Icon name={tone === 'warn' ? 'flag' : 'help'} size={18} color={tone === 'warn' ? light.accentText : light.text2} />
      <Text style={[f.hint, { flex: 1, color: light.text2 }]}>{text}</Text>
    </View>
  );
}

export const f = StyleSheet.create({
  label: { fontFamily: fonts.semibold, fontSize: 15, color: light.text },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: light.text2 },
  input: { minHeight: 50, borderRadius: radius.md, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: light.text, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, justifyContent: 'center' },
  chipOn: { backgroundColor: light.accentText, borderColor: light.accentText },
  chipText: { fontFamily: fonts.medium, fontSize: 14.5, color: light.text },
  day: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  time: { width: 92, textAlign: 'center', fontFamily: fonts.semibold },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: light.card },
  toggleTitle: { fontFamily: fonts.semibold, fontSize: 15.5, color: light.text },
  switch: { width: 50, height: 30, borderRadius: 15, backgroundColor: '#D0D1D4', padding: 3, flexDirection: 'row' },
  switchOn: { backgroundColor: light.accentText, justifyContent: 'flex-end' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  knobOn: {},
  groupTitle: { fontFamily: fonts.bold, fontSize: 19, color: light.text },
  dateChip: { minWidth: 56, minHeight: 56, paddingHorizontal: 8, borderRadius: 14, backgroundColor: light.card, borderWidth: 1, borderColor: light.border, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: light.cardSoft, alignItems: 'flex-start' },
});

/** Horizontal date chips from the start of this week, `days` days ahead (default two weeks). */
export function DatePick({ value, onChange, label = 'יום', days = 14, from }: { value: string; onChange: (d: string) => void; label?: string; days?: number; from?: string }) {
  const start = from ?? weekOf(dateKey())[0]!;
  const list = Array.from({ length: days }, (_, i) => addDays(start, i));
  if (!list.includes(value)) list.unshift(value);
  const today = dateKey();
  return (
    <View style={{ gap: 6 }}>
      <Label text={label} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {list.map((d) => {
          const on = d === value;
          const dt = parseKey(d);
          return (
            <Pressable key={d} onPress={() => { haptic.select(); onChange(d); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
              accessibilityLabel={`${d === today ? 'היום, ' : ''}יום ${DAY_LONG[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}`}
              style={[f.dateChip, on && f.chipOn, d === today && !on && { borderColor: light.accent }, d < today && { opacity: 0.6 }]}>
              <Text style={[f.hint, on && { color: '#fff' }]}>{d === today ? 'היום' : DAY_SHORT[dt.getDay()]}</Text>
              <Text style={[f.chipText, { fontFamily: fonts.bold }, on && { color: '#fff' }]}>{dt.getDate()}/{dt.getMonth() + 1}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

