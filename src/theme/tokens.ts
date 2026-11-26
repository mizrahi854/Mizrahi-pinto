/**
 * MIZRAHI PINTO design tokens.
 * Final palette: orange #F57925, black #131416, graphite #303236, silver #B9BABD, white #F5F5F5.
 * Neutral graphite base (no brown), orange used as light and for primary actions only.
 * No neon halos, no glowing orange frames around every card.
 */
export const colors = {
  bg: '#131416',
  bgDeep: '#0E0F10',
  surface: '#18191B',
  surfaceRaised: '#232427',
  glass: 'rgba(48,50,54,0.55)',
  glassStrong: 'rgba(40,42,46,0.85)',
  border: 'rgba(255,255,255,0.09)',
  borderStrong: 'rgba(255,255,255,0.18)',
  hairline: 'rgba(255,255,255,0.06)',

  emberDeep: '#B84A0C',
  emberMid: '#D9601A',
  accent: '#F57925',
  accentLight: '#FF9A52',
  accentSoft: 'rgba(245,121,37,0.16)',
  /** white text sits on this (4.7:1), never on the bright orange */
  accentButton: '#C2500F',

  text: '#F5F5F5',
  text2: '#B9BABD', // silver – 9.5:1 on bg
  text3: '#8E9095', // 5.8:1 on bg
  textOnAccent: '#131416',
  graphite: '#303236',
  silver: '#B9BABD',

  danger: '#E5484D',
  success: '#F57925', // success states stay on-brand (no green)
  track: 'rgba(255,255,255,0.10)',
} as const;

/** Light content panels (diary, planning, forms) – graphite text on soft gray. */
export const light = {
  bg: '#F2F2F3',
  card: '#FFFFFF',
  cardSoft: '#ECECEE',
  border: 'rgba(19,20,22,0.08)',
  text: '#131416',
  text2: '#5E6065', // 5.6:1
  text3: '#6B6D72', // 4.6:1
  accent: '#F57925',
  accentDeep: '#D9601A',
  accentText: '#C2410C', // orange for small text on white: 5.2:1
  accentSoft: 'rgba(245,121,37,0.12)',
  track: '#E4E4E7',
  protein: '#3BB273',
  carbs: '#F57925',
  fat: '#F2C230',
} as const;

export const radius = { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, pill: 999 } as const;
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;

export const fonts = {
  regular: 'Heebo_400Regular',
  medium: 'Heebo_500Medium',
  semibold: 'Heebo_600SemiBold',
  bold: 'Heebo_700Bold',
  light: 'Heebo_300Light',
} as const;

export const type = {
  hero: { fontFamily: fonts.medium, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 15 },
  value: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 24 },
} as const;

export const touch = { min: 44 } as const;
