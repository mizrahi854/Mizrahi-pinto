/**
 * MIZRAHI PINTO design tokens.
 * Palette sampled from the approved dark home screen (docs/design_reference/approved-home-orange.png):
 * near-black warm base, deep ember orange used as *light* (glows, edges), a warmer orange for accents.
 * Never use purple / green as brand colors. Never fill large areas with saturated orange.
 */
export const colors = {
  bg: '#0B0705',
  bgDeep: '#070403',
  surface: '#150D08',
  surfaceRaised: '#1E130C',
  glass: 'rgba(28, 17, 10, 0.62)',
  glassStrong: 'rgba(36, 22, 13, 0.82)',
  border: 'rgba(255, 150, 80, 0.13)',
  borderStrong: 'rgba(255, 150, 80, 0.28)',
  hairline: 'rgba(255, 255, 255, 0.06)',

  emberDeep: '#A83C00',
  emberMid: '#C9520A',
  accent: '#E8782A',
  accentLight: '#F2A05C',
  accentSoft: 'rgba(232, 120, 42, 0.16)',

  text: '#FFFFFF',
  text2: '#B9ADA7',
  text3: '#7D716B',
  textOnAccent: '#1A0C04',

  danger: '#E5484D',
  success: '#E8782A', // success states stay on-brand (no green)
  track: 'rgba(255, 255, 255, 0.08)',
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
