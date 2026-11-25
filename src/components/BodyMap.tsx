import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Ellipse, G, Rect } from 'react-native-svg';
import type { Muscle } from '@/data/types';
import { colors, fonts } from '@/theme/tokens';

/**
 * Original stylised anatomy figure (front + back) in the "VITAL 3D" spirit:
 * dark satin mannequin, worked muscles glowing orange. Primary = full, secondary = soft.
 */
type Region = { id: string; muscles: Muscle[]; d?: string; e?: [number, number, number, number]; mirror?: boolean };

const FRONT: Region[] = [
  { id: 'delt', muscles: ['shoulders'], e: [61, 97, 16, 15], mirror: true },
  { id: 'pec', muscles: ['chest'], d: 'M100 86 C86 82 72 86 67 100 C66 116 82 125 99 122 Z', mirror: true },
  { id: 'bicep', muscles: ['biceps'], e: [53, 133, 10, 21], mirror: true },
  { id: 'fore', muscles: ['forearms'], e: [47, 181, 9, 25], mirror: true },
  { id: 'abs', muscles: ['abs', 'core'], d: 'M87 127 Q100 124 113 127 L114 190 Q100 202 86 190 Z' },
  { id: 'obl', muscles: ['core'], d: 'M85 130 C77 150 77 178 85 196 L87 190 L87 130 Z', mirror: true },
  { id: 'quad', muscles: ['quads'], d: 'M98 214 C90 212 74 218 71 242 C69 282 77 308 88 318 C96 310 99 282 99 244 Z', mirror: true },
  { id: 'calfF', muscles: ['calves'], e: [83, 360, 10, 28], mirror: true },
];
const BACK: Region[] = [
  { id: 'trap', muscles: ['traps'], d: 'M100 70 C92 78 80 84 70 90 C82 96 92 100 100 112 Z', mirror: true },
  { id: 'deltB', muscles: ['shoulders'], e: [61, 97, 15, 14], mirror: true },
  { id: 'lat', muscles: ['lats', 'back'], d: 'M99 112 C88 104 74 102 70 112 C70 134 80 158 98 172 Z', mirror: true },
  { id: 'low', muscles: ['back'], d: 'M90 170 Q100 176 110 170 L112 198 Q100 204 88 198 Z' },
  { id: 'tri', muscles: ['triceps'], e: [53, 135, 10, 21], mirror: true },
  { id: 'foreB', muscles: ['forearms'], e: [47, 181, 9, 25], mirror: true },
  { id: 'glute', muscles: ['glutes'], e: [87, 220, 15, 17], mirror: true },
  { id: 'ham', muscles: ['hamstrings'], d: 'M98 238 C90 236 75 240 73 262 C72 290 78 308 88 318 C96 310 99 288 99 262 Z', mirror: true },
  { id: 'calfB', muscles: ['calves'], e: [83, 360, 11, 29], mirror: true },
];

const SILHOUETTE = 'M100 12 C86 12 78 24 78 38 C78 52 86 62 92 66 L92 74 C80 80 66 82 56 88 C44 94 42 110 44 126 C40 150 38 170 38 192 C36 206 38 222 44 228 C50 226 54 214 54 200 C56 178 58 158 62 142 L70 124 C72 150 76 170 80 196 C76 214 70 236 68 262 C66 296 72 320 76 334 C72 356 74 380 78 398 L92 398 C92 376 94 352 94 334 C96 310 98 284 100 262 C102 284 104 310 106 334 C106 352 108 376 108 398 L122 398 C126 380 128 356 124 334 C128 320 134 296 132 262 C130 236 124 214 120 196 C124 170 128 150 130 124 L138 142 C142 158 144 178 146 200 C146 214 150 226 156 228 C162 222 164 206 162 192 C162 170 160 150 156 126 C158 110 156 94 144 88 C134 82 120 80 108 74 L108 66 C114 62 122 52 122 38 C122 24 114 12 100 12 Z';

function Figure({ regions, primary, secondary, label, w = 120, showLabel = true, tone = 'dark' }: { regions: Region[]; primary: Muscle[]; secondary: Muscle[]; label: string; w?: number; showLabel?: boolean; tone?: 'dark' | 'light' }) {
  const lt = tone === 'light';
  const level = (r: Region) => (r.muscles.some((m) => primary.includes(m)) ? 2 : r.muscles.some((m) => secondary.includes(m)) ? 1 : 0);
  const shape = (r: Region, mirrored: boolean) => {
    const l = level(r);
    const fill = l === 2 ? `url(#hot-${tone})` : l === 1 ? `url(#warm-${tone})` : `url(#muscle-${tone})`;
    const tr = mirrored ? 'translate(200 0) scale(-1 1)' : undefined;
    return (
      <G key={r.id + (mirrored ? 'm' : '')} transform={tr}>
        {l === 2 && (r.e ? <Ellipse cx={r.e[0]} cy={r.e[1]} rx={r.e[2] + 5} ry={r.e[3] + 5} fill={colors.accent} opacity={0.22} /> : <Path d={r.d!} fill="none" stroke={colors.accent} strokeWidth={8} strokeOpacity={0.22} />)}
        {r.e ? <Ellipse cx={r.e[0]} cy={r.e[1]} rx={r.e[2]} ry={r.e[3]} fill={fill} /> : <Path d={r.d!} fill={fill} />}
      </G>
    );
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={w * 2} viewBox="0 0 200 404">
        <Defs>
          <LinearGradient id={`skin-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={lt ? '#D9D6D3' : '#5a5551'} />
            <Stop offset="0.5" stopColor={lt ? '#B4AFAB' : '#36312e'} />
            <Stop offset="1" stopColor={lt ? '#8E8884' : '#1a1716'} />
          </LinearGradient>
          <LinearGradient id={`muscle-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={lt ? '#EFEDEB' : '#6a6460'} stopOpacity="0.55" />
            <Stop offset="1" stopColor={lt ? '#9C9692' : '#2a2624'} stopOpacity="0.55" />
          </LinearGradient>
          <LinearGradient id={`hot-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFC08A" />
            <Stop offset="0.45" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.emberDeep} />
          </LinearGradient>
          <LinearGradient id={`warm-${tone}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colors.emberDeep} stopOpacity="0.45" />
          </LinearGradient>
          <RadialGradient id={`spec-${tone}`} cx="80" cy="60" r="140" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Path d={SILHOUETTE} fill={`url(#skin-${tone})`} />
        {regions.map((r) => shape(r, false))}
        {regions.filter((r) => r.mirror).map((r) => shape(r, true))}
        <Path d={SILHOUETTE} fill={`url(#spec-${tone})`} />
        <Rect x="0" y="0" width="0" height="0" />
      </Svg>
      {showLabel && <Text style={{ color: colors.text3, fontFamily: fonts.regular, fontSize: 11 }}>{label}</Text>}
    </View>
  );
}

export function BodyMap({ primary, secondary = [], single, size = 120, tone = 'dark' }: { primary: Muscle[]; secondary?: Muscle[]; single?: boolean; size?: number; tone?: 'dark' | 'light' }) {
  if (single) {
    const backHeavy = primary.some((m) => ['back', 'lats', 'triceps', 'glutes', 'hamstrings', 'traps'].includes(m)) && !primary.some((m) => ['chest', 'quads', 'abs', 'biceps'].includes(m));
    return (
      <View accessible accessibilityRole="image" accessibilityLabel="מפת שרירים: השרירים העובדים מודגשים בכתום">
        <Figure regions={backHeavy ? BACK : FRONT} primary={primary} secondary={secondary} label="" w={size} showLabel={false} tone={tone} />
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18 }} accessible accessibilityRole="image" accessibilityLabel="מפת שרירים: השרירים העובדים מודגשים בכתום">
      <Figure regions={FRONT} primary={primary} secondary={secondary} label="מלפנים" />
      <Figure regions={BACK} primary={primary} secondary={secondary} label="מאחור" />
    </View>
  );
}
